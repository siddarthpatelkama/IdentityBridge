const supabase = require('../config/supabase');
const { generateEmbedding } = require('../services/openaiService');
require('dotenv').config();

const fs = require('fs');
const path = require('path');

// Load Mock Datasets dynamically from database/sample_data
const familyReportsPath = path.join(__dirname, '../../database/sample_data/family_reports.json');
const policeReportsPath = path.join(__dirname, '../../database/sample_data/police_reports.json');
const hospitalRecordsPath = path.join(__dirname, '../../database/sample_data/hospital_records.json');

const familyReports = JSON.parse(fs.readFileSync(familyReportsPath, 'utf8'));
const policeReports = JSON.parse(fs.readFileSync(policeReportsPath, 'utf8'));
const hospitalRecords = JSON.parse(fs.readFileSync(hospitalRecordsPath, 'utf8'));

// Map to database schema format
const missingReportsMock = [
  ...familyReports.map(r => ({
    reporter_type: 'family',
    contact_info: r.contact_number,
    image_url: r.photo_url,
    status: 'active',
    extracted_data: {
      age_approx: r.age,
      gender: r.gender,
      clothing: r.clothing,
      location_missing: r.last_seen_location,
      physical_marks: r.identifying_marks,
      reporter_name: r.reporter_name,
      missing_person_name: r.missing_person_name,
      height: r.height,
      last_seen_time: r.last_seen_time
    }
  })),
  ...policeReports.map(r => ({
    reporter_type: 'police',
    contact_info: r.contact_number,
    image_url: r.photo_url,
    status: 'active',
    extracted_data: {
      age_approx: r.estimated_age,
      gender: r.gender,
      clothing: r.clothing,
      location_missing: r.accident_location,
      physical_marks: r.visible_injuries,
      officer_name: r.officer_name,
      station_name: r.station_name,
      accident_time: r.accident_time,
      height: r.height,
      vehicle_type: r.vehicle_type,
      personal_belongings: r.personal_belongings
    }
  }))
];

const unidentifiedPatientsMock = hospitalRecords.map(r => ({
  hospital_name: r.hospital_name,
  image_url: r.photo_url,
  status: 'active',
  extracted_data: {
    age_estimate: r.estimated_age,
    gender: r.gender,
    clothing: r.clothing,
    location_found: r.hospital_name,
    injuries: r.injuries,
    admission_time: r.admission_time,
    height: r.height,
    patient_condition: r.patient_condition,
    ward_number: r.ward_number
  }
}));

async function seedDatabase() {
  console.log('Starting database seeding...');

  try {
    // 1. Seed Missing Reports
    console.log('\nSeeding missing_reports table...');
    for (const report of missingReportsMock) {
      // Concatenate fields for embedding text
      const textToEmbed = Object.values(report.extracted_data)
        .filter(val => val !== null && val !== undefined)
        .join(', ');
      
      console.log(`Generating embedding for report: "${report.extracted_data.location_missing}"`);
      const embedding = await generateEmbedding(textToEmbed);

      const { data, error } = await supabase
        .from('missing_reports')
        .insert({
          ...report,
          embedding
        })
        .select('id');

      if (error) {
        console.error('Failed to insert report:', error);
      } else {
        console.log(`Successfully inserted missing report. ID: ${data[0].id}`);
      }
    }

    // 2. Seed Unidentified Patients
    console.log('\nSeeding unidentified_patients table...');
    for (const patient of unidentifiedPatientsMock) {
      const textToEmbed = Object.values(patient.extracted_data)
        .filter(val => val !== null && val !== undefined)
        .join(', ');

      console.log(`Generating embedding for patient: "${patient.extracted_data.location_found}"`);
      const embedding = await generateEmbedding(textToEmbed);

      const { data, error } = await supabase
        .from('unidentified_patients')
        .insert({
          ...patient,
          embedding
        })
        .select('id');

      if (error) {
        console.error('Failed to insert patient:', error);
      } else {
        console.log(`Successfully inserted patient. ID: ${data[0].id}`);
      }
    }

    console.log('\nSeeding completed successfully!');
  } catch (err) {
    console.error('Seeding process failed:', err);
  }
}

seedDatabase();
