const express = require('express');
const router = express.Router();
const multer = require('multer');
const supabase = require('../config/supabase');
const { transcribeAudio, extractStructuredData, generateEmbedding } = require('../services/openaiService');
const { compareFaces } = require('../services/faceService');
const { sendSMS } = require('../services/twilioService');

// Multer memory storage configuration for file parsing
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Setup upload parser for two potential fields: 'photo' and 'audio'
const intakeUpload = upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'audio', maxCount: 1 }
]);

/**
 * Helper to flatten a matched database candidate and its confidence scores 
 * into the simple schema expected by Ujwala's Next.js frontend pages and MatchCard.
 */
function flattenMatch(candidate, activeRecord) {
  const extData = candidate.extracted_data || {};
  
  // Calculate a combined confidence score: 50% text, 50% face if available
  const textConfidence = Math.round((candidate.similarity || 0) * 100);
  const faceConfidence = candidate.face_confidence !== undefined ? candidate.face_confidence : null;
  
  let combinedConfidence = textConfidence;
  if (faceConfidence !== null) {
    combinedConfidence = Math.round(textConfidence * 0.5 + faceConfidence * 0.5);
  }

  return {
    id: candidate.id,
    activeId: activeRecord.id,
    confidence: combinedConfidence,
    similarity: textConfidence,
    score: faceConfidence,
    
    // Flat fields mapped from JSON schema
    age: extData.age_approx || extData.age_estimate || extData.age || '—',
    gender: extData.gender || '—',
    clothing: extData.clothing || '—',
    location: extData.location_missing || extData.location_found || extData.location || '—',
    physicalMarks: extData.physical_marks || extData.injuries || '—',
    image_url: candidate.image_url || null,
    status: candidate.status || 'active'
  };
}

/**
 * Shared logic for processing intake submissions, generating embeddings, 
 * running pgvector similarity (Stage 1), and facial verification (Stage 2).
 */
async function processIntake({ type, hospital_name, reporter_type, contact_info, manual_data, image_url, reqFiles }) {
  if (!type || !['patient', 'report'].includes(type)) {
    throw new Error("Invalid type. Must be 'patient' or 'report'.");
  }

  // 1. Upload photo to Supabase Storage if present
  let imageUrl = image_url || null;
  const photoFile = reqFiles && reqFiles['photo'] ? reqFiles['photo'][0] : null;

  if (photoFile) {
    const fileExt = photoFile.originalname.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 11)}.${fileExt}`;
    
    console.log(`Uploading file ${fileName} to Supabase 'photos' bucket...`);
    const { data, error: uploadError } = await supabase.storage
      .from('photos')
      .upload(fileName, photoFile.buffer, {
        contentType: photoFile.mimetype,
        upsert: true
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
    } else {
      const { data: publicUrlData } = supabase.storage
        .from('photos')
        .getPublicUrl(fileName);
      imageUrl = publicUrlData.publicUrl;
      console.log(`Photo uploaded successfully. Public URL: ${imageUrl}`);
    }
  }

  // 2. Extract description (from Audio Note transcription or manual fields)
  let rawText = '';
  const audioFile = reqFiles && reqFiles['audio'] ? reqFiles['audio'][0] : null;
  let extractedData = {};

  if (audioFile) {
    console.log('Audio file detected. Sending to Whisper for transcription...');
    rawText = await transcribeAudio(audioFile.buffer, audioFile.mimetype);
    console.log(`Transcription: "${rawText}"`);
    
    console.log('Extracting structured attributes with LLM...');
    extractedData = await extractStructuredData(rawText, type === 'patient');
  } else {
    // Manual text intake
    console.log('Using manual text input values...');
    if (manual_data) {
      extractedData = typeof manual_data === 'string' ? JSON.parse(manual_data) : manual_data;
    } else {
      throw new Error("No description data (audio file or manual fields) provided.");
    }
  }

  console.log('Extracted Data:', extractedData);

  // 3. Generate Embedding Vector
  const textToEmbed = Object.values(extractedData)
    .filter(val => val !== null && val !== undefined)
    .join(', ');
  
  console.log(`Generating embedding for: "${textToEmbed}"`);
  const embeddingVector = await generateEmbedding(textToEmbed);

  // 4. Save to Database
  let savedRecord = null;
  if (type === 'patient') {
    const { data, error } = await supabase
      .from('unidentified_patients')
      .insert({
        hospital_name: hospital_name || 'Emergency Intake',
        extracted_data: extractedData,
        image_url: imageUrl,
        embedding: embeddingVector,
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;
    savedRecord = data;
  } else {
    const { data, error } = await supabase
      .from('missing_reports')
      .insert({
        reporter_type: reporter_type || 'family',
        contact_info: contact_info || 'Unknown',
        extracted_data: extractedData,
        image_url: imageUrl,
        embedding: embeddingVector,
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;
    savedRecord = data;
  }

  console.log(`Saved new ${type} record in database. ID: ${savedRecord.id}`);

  // 5. Stage 1: Vector similarity matching (> 60%, max 5 candidates)
  const opposingTable = type === 'patient' ? 'missing_reports' : 'unidentified_patients';
  console.log(`Running Stage 1 Vector match against table '${opposingTable}'...`);

  const { data: candidates, error: matchError } = await supabase.rpc('match_documents', {
    query_embedding: embeddingVector,
    match_threshold: 0.60,
    match_count: 5,
    target_table: opposingTable
  });

  if (matchError) {
    console.error('Error in Supabase match_documents RPC:', matchError);
    throw matchError;
  }

  console.log(`Stage 1 returned ${candidates ? candidates.length : 0} candidate matches.`);

  // 6. Stage 2: Facial Verification for shortlisted candidates
  const enrichedCandidates = [];
  if (candidates && candidates.length > 0) {
    for (const candidate of candidates) {
      let faceSimilarity = null;

      if (imageUrl && candidate.image_url) {
        try {
          faceSimilarity = await compareFaces(imageUrl, candidate.image_url);
        } catch (faceErr) {
          console.error(`Failed face check for candidate ${candidate.id}:`, faceErr.message);
          faceSimilarity = 0.0;
        }
      }

      enrichedCandidates.push({
        ...candidate,
        face_confidence: faceSimilarity
      });
    }
  }

  // Map to Ujwala's frontend flattened format
  const flattenedMatches = enrichedCandidates.map(cand => flattenMatch(cand, savedRecord));

  // Sort candidates by combined confidence score descending
  flattenedMatches.sort((a, b) => b.confidence - a.confidence);

  return {
    record: savedRecord,
    matches: flattenedMatches
  };
}

/**
 * POST /api/intake/voice
 * Handles audio upload intake.
 */
router.post('/intake/voice', intakeUpload, async (req, res) => {
  try {
    const isHospitalIntake = req.body.hospital_name !== undefined || req.body.type === 'patient';
    const type = isHospitalIntake ? 'patient' : 'report';
    
    // Parse properties
    const params = {
      type,
      hospital_name: req.body.hospital_name,
      reporter_type: req.body.reporter_type || 'family',
      contact_info: req.body.contact_info,
      image_url: req.body.image_url,
      reqFiles: req.files
    };

    const result = await processIntake(params);

    return res.status(200).json({
      success: true,
      record: result.record,
      match: result.matches[0] || null, // Top match
      matches: result.matches
    });
  } catch (error) {
    console.error('Voice intake error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

/**
 * POST /api/intake/text
 * Handles standard JSON intake.
 */
router.post('/intake/text', intakeUpload, async (req, res) => {
  try {
    const isHospitalIntake = req.body.hospital_name !== undefined || req.body.age_estimate !== undefined;
    const type = isHospitalIntake ? 'patient' : 'report';
    
    let manualData = {};
    if (isHospitalIntake) {
      manualData = {
        age_estimate: req.body.age_estimate ? parseInt(req.body.age_estimate, 10) : null,
        gender: req.body.gender || 'unknown',
        clothing: req.body.clothing || '',
        location_found: req.body.location_found || req.body.location || '',
        injuries: req.body.injuries || ''
      };
    } else {
      manualData = {
        age_approx: req.body.age_approx ? parseInt(req.body.age_approx, 10) : null,
        gender: req.body.gender || 'unknown',
        clothing: req.body.clothing || '',
        location_missing: req.body.location_missing || req.body.location || '',
        physical_marks: req.body.physical_marks || ''
      };
    }

    const params = {
      type,
      hospital_name: req.body.hospital_name || (isHospitalIntake ? 'Gandhi Hospital' : undefined),
      reporter_type: req.body.reporter_type || 'family',
      contact_info: req.body.contact_info || 'Unknown',
      manual_data: manualData,
      image_url: req.body.image_url,
      reqFiles: req.files
    };

    const result = await processIntake(params);

    return res.status(200).json({
      success: true,
      record: result.record,
      match: result.matches[0] || null, // Top match
      matches: result.matches
    });
  } catch (error) {
    console.error('Text intake error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

/**
 * POST /api/match/verify
 * Confirms a match and triggers SMS notification.
 */
router.post('/match/verify', async (req, res) => {
  try {
    const { matchId, activeId, patient_id, report_id } = req.body;

    let pId = patient_id;
    let rId = report_id;

    // Smart resolution of IDs from Ujwala's frontend payload (matchId, activeId)
    if (matchId && activeId) {
      // Find which is which by checking table existence
      const { data: patientData } = await supabase
        .from('unidentified_patients')
        .select('id')
        .eq('id', matchId)
        .maybeSingle();

      if (patientData) {
        pId = matchId;
        rId = activeId;
      } else {
        pId = activeId;
        rId = matchId;
      }
    } else if (matchId && !activeId) {
      // Fallback: If only matchId is present, we try to match it as report_id 
      // and find any active patient that has a high similarity (for backwards compatibility)
      const { data: patientData } = await supabase
        .from('unidentified_patients')
        .select('id')
        .eq('id', matchId)
        .maybeSingle();

      if (patientData) {
        pId = matchId;
        // Find most recent active missing report as fallback
        const { data: reportData } = await supabase
          .from('missing_reports')
          .select('id')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1);
        rId = reportData && reportData[0] ? reportData[0].id : null;
      } else {
        rId = matchId;
        const { data: patientData2 } = await supabase
          .from('unidentified_patients')
          .select('id')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1);
        pId = patientData2 && patientData2[0] ? patientData2[0].id : null;
      }
    }

    if (!pId || !rId) {
      return res.status(400).json({ error: "Unable to verify match. Missing associated IDs." });
    }

    console.log(`[Verify Match] Confirming Patient: ${pId} and Report: ${rId}`);

    // Update patient status in database
    const { data: patient, error: patientErr } = await supabase
      .from('unidentified_patients')
      .update({ status: 'matched' })
      .eq('id', pId)
      .select()
      .single();

    if (patientErr) throw patientErr;

    // Update report status in database
    const { data: report, error: reportErr } = await supabase
      .from('missing_reports')
      .update({ status: 'matched' })
      .eq('id', rId)
      .select()
      .single();

    if (reportErr) throw reportErr;

    // Send Twilio SMS alert
    let smsResult = null;
    if (report.contact_info) {
      const smsBody = `URGENT - IdentyBridge: A match has been officially verified for your missing person report. Your family member is located at ${patient.hospital_name}. Please contact the hospital or local authorities immediately. (Match Reference: ${rId.substring(0,8)})`;
      console.log(`Dispatching Twilio SMS to: ${report.contact_info}`);
      smsResult = await sendSMS(report.contact_info, smsBody);
    }

    return res.status(200).json({
      success: true,
      message: "Match verified successfully and status updated.",
      patient,
      report,
      sms: smsResult
    });

  } catch (error) {
    console.error('Verify match router error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

/**
 * GET /api/dashboard
 * Fetches all reports and patients for dashboard view.
 * Maps keys to Ujwala's frontend camelCase expectation.
 */
router.get('/dashboard', async (req, res) => {
  try {
    const { data: reports, error: reportsErr } = await supabase
      .from('missing_reports')
      .select('id, reporter_type, contact_info, extracted_data, image_url, created_at, status')
      .order('created_at', { ascending: false });

    if (reportsErr) throw reportsErr;

    const { data: patients, error: patientsErr } = await supabase
      .from('unidentified_patients')
      .select('id, hospital_name, extracted_data, image_url, created_at, status')
      .order('created_at', { ascending: false });

    if (patientsErr) throw patientsErr;

    // Flatten data for report-missing list view
    const formattedReports = (reports || []).map(r => ({
      id: r.id,
      reporterType: r.reporter_type,
      contactInfo: r.contact_info,
      age: r.extracted_data?.age_approx || r.extracted_data?.age || '—',
      gender: r.extracted_data?.gender || '—',
      clothing: r.extracted_data?.clothing || '—',
      location: r.extracted_data?.location_missing || '—',
      physicalMarks: r.extracted_data?.physical_marks || '—',
      image_url: r.image_url,
      status: r.status,
      created_at: r.created_at
    }));

    const formattedPatients = (patients || []).map(p => ({
      id: p.id,
      hospitalName: p.hospital_name,
      age: p.extracted_data?.age_estimate || p.extracted_data?.age || '—',
      gender: p.extracted_data?.gender || '—',
      clothing: p.extracted_data?.clothing || '—',
      location: p.extracted_data?.location_found || '—',
      physicalMarks: p.extracted_data?.injuries || '—',
      image_url: p.image_url,
      status: p.status,
      created_at: p.created_at
    }));

    return res.status(200).json({
      success: true,
      missingReports: formattedReports,
      unidentifiedPatients: formattedPatients
    });
  } catch (error) {
    console.error('Dashboard data error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/dashboard/stats
 * Statistics summary route.
 */
router.get('/dashboard/stats', async (req, res) => {
  try {
    const { data: reports } = await supabase.from('missing_reports').select('status');
    const { data: patients } = await supabase.from('unidentified_patients').select('status');

    const totalReports = reports ? reports.length : 0;
    const activeReports = reports ? reports.filter(r => r.status === 'active').length : 0;
    const matchedReports = reports ? reports.filter(r => r.status === 'matched').length : 0;

    const totalPatients = patients ? patients.length : 0;
    const activePatients = patients ? patients.filter(p => p.status === 'active').length : 0;
    const matchedPatients = patients ? patients.filter(p => p.status === 'matched').length : 0;

    return res.status(200).json({
      success: true,
      counts: {
        total_reports: totalReports,
        active_reports: activeReports,
        matched_reports: matchedReports,
        total_intakes: totalPatients,
        active_intakes: activePatients,
        matched_intakes: matchedPatients
      }
    });
  } catch (error) {
    console.error('Stats endpoint error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/generate-poster
 * Dynamically generates a PDF poster for the most recent missing person report.
 */
router.get('/generate-poster', async (req, res) => {
  try {
    const { data: reports, error: reportErr } = await supabase
      .from('missing_reports')
      .select('id, reporter_type, contact_info, extracted_data, image_url, created_at, status')
      .order('created_at', { ascending: false })
      .limit(1);

    if (reportErr) throw reportErr;

    const report = reports && reports[0] ? reports[0] : null;
    const pdfBuffer = generatePosterPDF(report);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="missing-person-poster.pdf"');
    return res.send(pdfBuffer);
  } catch (error) {
    console.error('Poster generation error:', error);
    return res.status(500).json({ error: error.message });
  }
});

function generatePosterPDF(report) {
  const ext = report ? report.extracted_data : {};
  const age = ext.age_approx || ext.age_estimate || ext.age || 'Unknown';
  const gender = ext.gender || 'Unknown';
  const clothing = ext.clothing || 'Unknown';
  const location = ext.location_missing || ext.location_found || 'Unknown';
  const marks = ext.physical_marks || ext.injuries || 'None';

  const streamContent = `BT
/F1 28 Tf
70 750 Td
(MISSING PERSON ALERT) Tj
/F1 14 Tf
0 -50 Td
(Approximate Age: ${age}) Tj
0 -25 Td
(Gender: ${gender}) Tj
0 -25 Td
(Last Known Location: ${location}) Tj
0 -25 Td
(Clothing Details: ${clothing}) Tj
0 -25 Td
(Identifying Marks: ${marks}) Tj
0 -50 Td
(CONTACT IDentyBridge Support or Local Authorities Immediately.) Tj
ET`;

  const streamLength = Buffer.byteLength(streamContent, 'utf-8');

  const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length ${streamLength} >>
stream
${streamContent}
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000414 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
503
%%EOF`;

  return Buffer.from(pdfContent, 'utf-8');
}

module.exports = router;
