const supabase = require('../config/supabase');
const { generateEmbedding } = require('../services/openaiService');
require('dotenv').config();

const missingReportsMock = [
  // Pair 1: Secunderabad match (Demo Hook)
  {
    reporter_type: 'family',
    contact_info: '+919988776655',
    image_url: 'https://example.com/photos/report_1.jpg',
    status: 'active',
    extracted_data: {
      age_approx: 26,
      gender: 'male',
      clothing: 'Bright red round-neck shirt and blue denim jeans',
      location_missing: 'Secunderabad station area',
      physical_marks: 'Slight scar on the left wrist, tall build'
    }
  },
  // Pair 2: Jubilee Hills match (Demo Hook)
  {
    reporter_type: 'police',
    contact_info: '+918877665544',
    image_url: 'https://example.com/photos/report_2.jpg',
    status: 'active',
    extracted_data: {
      age_approx: 60,
      gender: 'female',
      clothing: 'Traditional green cotton saree with gold borders',
      location_missing: 'Jubilee Hills residential block',
      physical_marks: 'Has memory issues/dementia, walks with a slight limp, wears gold bangles'
    }
  },
  // Non-matching noise records
  {
    reporter_type: 'family',
    contact_info: '+917766554433',
    image_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop',
    status: 'active',
    extracted_data: {
      age_approx: 32,
      gender: 'female',
      clothing: 'Blue kurti and white leggings',
      location_missing: 'Gachibowli office circle',
      physical_marks: 'Mole on right cheek'
    }
  },
  {
    reporter_type: 'family',
    contact_info: '+916655443322',
    image_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop',
    status: 'active',
    extracted_data: {
      age_approx: 45,
      gender: 'male',
      clothing: 'Black formal shirt and grey trousers',
      location_missing: 'Kukatpally metro station',
      physical_marks: 'Wears silver spectacles'
    }
  },
  {
    reporter_type: 'family',
    contact_info: '+915544332211',
    image_url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=400&fit=crop',
    status: 'active',
    extracted_data: {
      age_approx: 19,
      gender: 'female',
      clothing: 'Pink hoodie and black track pants',
      location_missing: 'Begumpet airport road',
      physical_marks: 'Tattoo of a butterfly on left shoulder'
    }
  }
];

const unidentifiedPatientsMock = [
  // Pair 1: Secunderabad match (Demo Hook)
  {
    hospital_name: 'Gandhi General Hospital',
    image_url: 'https://example.com/photos/victim_1.jpg',
    status: 'active',
    extracted_data: {
      age_estimate: 25,
      gender: 'male',
      clothing: 'Bloodstained red t-shirt and dark blue jeans',
      location_found: 'Near Secunderabad train platform 3',
      injuries: 'Severe head trauma, unconscious, abrasion on left forearm'
    }
  },
  // Pair 2: Jubilee Hills match (Demo Hook)
  {
    hospital_name: 'Apollo Hospital Jubilee Hills',
    image_url: 'https://example.com/photos/victim_2.jpg',
    status: 'active',
    extracted_data: {
      age_estimate: 62,
      gender: 'female',
      clothing: 'Dirty green colored saree',
      location_found: 'Jubilee Hills Checkpost road divider',
      injuries: 'Dehydrated, disoriented, minor cuts on feet, unable to speak coherently'
    }
  },
  // Non-matching noise records
  {
    hospital_name: 'Osmania General Hospital',
    image_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
    status: 'active',
    extracted_data: {
      age_estimate: 28,
      gender: 'male',
      clothing: 'Yellow polo t-shirt and shorts',
      location_found: 'Hitech city flyover',
      injuries: 'Fractured right collarbone, minor bruises'
    }
  },
  {
    hospital_name: 'NIMS Hospital Panjagutta',
    image_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
    status: 'active',
    extracted_data: {
      age_estimate: 35,
      gender: 'female',
      clothing: 'White salwar suit',
      location_found: 'Panjagutta signal intersection',
      injuries: 'Mild concussion, amnesia'
    }
  },
  {
    hospital_name: 'Gandhi General Hospital',
    image_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&h=400&fit=crop',
    status: 'active',
    extracted_data: {
      age_estimate: 50,
      gender: 'male',
      clothing: 'Checked brown shirt and dhoti',
      location_found: 'Charminar market corridor',
      injuries: 'Exhaustion, heat stroke, non-verbal'
    }
  }
];

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
