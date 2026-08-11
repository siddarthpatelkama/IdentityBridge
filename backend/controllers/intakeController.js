const supabase = require('../config/supabase');
const { generateEmbedding } = require('../services/openaiService');
const { compareFaces } = require('../services/faceService');

// Helper to flatten match data for frontend (Ujwala's layout)
function flattenMatch(candidate, activeRecord, textConfidence, faceConfidence, combinedConfidence) {
  const extData = candidate.extracted_data || {};
  return {
    id: candidate.id,
    activeId: activeRecord.id,
    confidence: combinedConfidence,
    similarity: textConfidence,
    score: faceConfidence,
    age: extData.age_approx || extData.age_estimate || extData.age || '—',
    gender: extData.gender || '—',
    clothing: extData.clothing || '—',
    location: extData.location_missing || extData.location_found || extData.location || '—',
    physicalMarks: extData.physical_marks || extData.injuries || '—',
    image_url: candidate.image_url || null,
    status: candidate.status || 'active',
    contactInfo: candidate.contact_info || extData.contact_info || '—',
    reporterName: extData.reporter_name || extData.officer_name || '—',
    createdAt: candidate.created_at || null
  };
}

/**
 * Stage 1 & Stage 2 matching flow controller.
 */
async function processIntake(req, res) {
  try {
    const { hospital_name, age_estimate, gender, clothing, location_found, injuries, patient_condition, ward_number } = req.body;
    const photoFile = req.file || (req.files && req.files['photo'] ? req.files['photo'][0] : null);

    // Step 1: Receive & Store Image
    let imageUrl = null;
    if (photoFile) {
      const fileExt = photoFile.originalname.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 11)}.${fileExt}`;
      
      // Upload to 'faces' bucket (or fallback to 'photos')
      let uploadBucket = 'faces';
      
      // Let's check bucket name fallback
      const { data: bucketData } = await supabase.storage.getBucket('faces').catch(() => ({ data: null }));
      if (!bucketData) {
        uploadBucket = 'photos';
      }

      console.log(`Uploading image ${fileName} to storage bucket: ${uploadBucket}...`);
      const { data, error: uploadError } = await supabase.storage
        .from(uploadBucket)
        .upload(fileName, photoFile.buffer, {
          contentType: photoFile.mimetype,
          upsert: true
        });

      if (uploadError) {
        console.error('Supabase image upload failed:', uploadError);
      } else {
        const { data: urlData } = supabase.storage
          .from(uploadBucket)
          .getPublicUrl(fileName);
        imageUrl = urlData.publicUrl;
      }
    }

    // Step 2: Vectorize Text Description
    const extractedData = {
      age_estimate: age_estimate || null,
      gender: gender || null,
      clothing: clothing || null,
      location_found: location_found || null,
      injuries: injuries || null,
      patient_condition: patient_condition || null,
      ward_number: ward_number || null
    };

    // Flatten text description
    const textToEmbed = Object.values(extractedData)
      .filter(val => val !== null && val !== undefined && val !== '')
      .join(', ');

    console.log(`Vectorizing text: "${textToEmbed}"`);
    const embeddingVector = await generateEmbedding(textToEmbed);

    // Step 3: Database Insertion
    console.log('Inserting unidentified patient record into database...');
    const { data: patientRecord, error: insertError } = await supabase
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

    if (insertError) throw insertError;

    // Step 4: Stage 1 Matching (Text Filter)
    console.log('Executing Stage 1: Vector cosine similarity matching...');
    const { data: candidates, error: matchError } = await supabase.rpc('match_missing_reports', {
      query_embedding: embeddingVector,
      match_threshold: 0.6,
      match_count: 5
    });

    if (matchError) throw matchError;

    // Step 5: Stage 2 Matching (Face Verification)
    const matchesList = [];
    if (candidates && candidates.length > 0) {
      for (const candidate of candidates) {
        let faceSimilarity = 0.0;

        if (imageUrl && candidate.image_url) {
          try {
            faceSimilarity = await compareFaces(imageUrl, candidate.image_url);
          } catch (faceErr) {
            console.error(`Failed face check for candidate ${candidate.id}:`, faceErr.message);
            faceSimilarity = 0.0;
          }
        }

        // Calculate combined confidence score
        const textConfidence = Math.round(candidate.similarity * 100);
        const faceConfidence = Math.round(faceSimilarity);
        
        let combinedConfidence = textConfidence;
        if (imageUrl && candidate.image_url) {
          combinedConfidence = Math.round((textConfidence * 0.5) + (faceConfidence * 0.5));
        }

        const flatCandidate = flattenMatch(candidate, patientRecord, textConfidence, faceConfidence, combinedConfidence);
        matchesList.push(flatCandidate);
      }
    }

    // Step 6: Final Output
    matchesList.sort((a, b) => b.confidence - a.confidence);

    return res.status(200).json({
      success: true,
      record: patientRecord,
      match: matchesList[0] || null,
      matches: matchesList
    });

  } catch (error) {
    console.error('Intake controller error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
}

module.exports = {
  processIntake
};
