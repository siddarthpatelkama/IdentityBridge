const axios = require('axios');
require('dotenv').config();

const geminiKey = process.env.GEMINI_API_KEY;

if (!geminiKey) {
  console.warn('Warning: GEMINI_API_KEY environment variable is missing.');
}

/**
 * Transcribe an audio file buffer to text using Gemini 1.5 Flash Audio Model
 * @param {Buffer} fileBuffer - The audio file buffer
 * @param {string} mimeType - The mime type of the audio (e.g. 'audio/webm')
 * @returns {Promise<string>} The transcribed text
 */
async function transcribeAudio(fileBuffer, mimeType = 'audio/webm') {
  if (!process.env.GEMINI_API_KEY) {
    console.log('Gemini API key missing. Returning mock transcription.');
    return 'Male, roughly 25 years old, wearing a red shirt and black pants, found unconscious near Secunderabad railway station with a head injury.';
  }

  try {
    const base64Data = fileBuffer.toString('base64');
    console.log(`Sending base64 audio (${mimeType}) to Gemini API...`);
    
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data
              }
            },
            {
              text: "Please transcribe this audio recording exactly. Do not add any introduction, explanations, or metadata, just output the spoken text."
            }
          ]
        }]
      }
    );

    const text = response.data.candidates[0].content.parts[0].text;
    return text.trim();
  } catch (error) {
    console.error('Error in transcribeAudio (Gemini):', error.response ? error.response.data : error.message);
    throw error;
  }
}

/**
 * Extract structured information from raw text using gemini-1.5-flash
 * @param {string} rawText - The transcribed text or description
 * @param {boolean} isPatient - True if unidentified patient, False if missing report
 * @returns {Promise<object>} The extracted JSON payload
 */
async function extractStructuredData(rawText, isPatient = true) {
  if (!process.env.GEMINI_API_KEY) {
    console.log('Gemini API key missing. Returning mock structured data.');
    if (isPatient) {
      return {
        age_estimate: 25,
        gender: 'male',
        clothing: 'red shirt, black pants',
        location_found: 'Secunderabad railway station',
        injuries: 'severe head injury, unconscious'
      };
    } else {
      return {
        age_approx: 25,
        gender: 'male',
        clothing: 'red tshirt, dark trousers',
        location_missing: 'Jubilee Hills',
        physical_marks: 'scar on left wrist'
      };
    }
  }

  const schemaDescription = isPatient 
    ? `{ "age_estimate": number or null, "gender": "male" | "female" | "unknown", "clothing": "description", "location_found": "description", "injuries": "description" }`
    : `{ "age_approx": number or null, "gender": "male" | "female" | "unknown", "clothing": "description", "location_missing": "description", "physical_marks": "description" }`;

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: `Analyze the text provided and extract the descriptive variables.
            You MUST output ONLY a valid JSON object matching this schema:
            ${schemaDescription}
            
            Input Text:
            "${rawText}"`
          }]
        }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      }
    );

    const text = response.data.candidates[0].content.parts[0].text;
    return JSON.parse(text.trim());
  } catch (error) {
    console.error('Error in extractStructuredData (Gemini):', error.response ? error.response.data : error.message);
    throw error;
  }
}

/**
 * Helper to generate a seeded pseudo-random number generator
 * @param {string} seedString - String to derive seed from
 */
function getSeededRandom(seedString) {
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = seedString.charCodeAt(i) + ((hash << 5) - hash);
  }
  return function() {
    hash = (hash * 1664525 + 1013904223) % 4294967296;
    return (hash / 4294967296);
  };
}

/**
 * Generate 1536-dimensional vector embedding using Gemini text-embedding-004.
 * Duplicates the 768 output dimensions to match the 1536 schema size.
 * @param {string} text - The input text (concatenated details)
 * @returns {Promise<number[]>} The 1536-dimension float array
 */
async function generateEmbedding(text) {
  if (!process.env.GEMINI_API_KEY) {
    console.log(`[EMBEDDING SIMULATION] Generating deterministic vector for: "${text.substring(0, 40)}..."`);
    
    const clean = text.toLowerCase();
    let seed = clean;
    let noiseSeed = null;
    let noiseWeight = 0.0;

    if (clean.includes('secunderabad')) {
      seed = 'secunderabad_demo_vector';
      if (clean.includes('unconscious') || clean.includes('patient') || clean.includes('bloodstained') || clean.includes('estimate')) {
        noiseSeed = 'secunderabad_patient_noise';
        noiseWeight = 0.12;
      }
    } else if (clean.includes('jubilee')) {
      seed = 'jubilee_hills_demo_vector';
      if (clean.includes('unconscious') || clean.includes('patient') || clean.includes('disoriented') || clean.includes('estimate')) {
        noiseSeed = 'jubilee_patient_noise';
        noiseWeight = 0.15;
      }
    }

    const rand = getSeededRandom(seed);
    const vec = new Array(1536).fill(0).map(() => rand() - 0.5);

    if (noiseSeed) {
      const randNoise = getSeededRandom(noiseSeed);
      for (let i = 0; i < 1536; i++) {
        vec[i] = vec[i] * (1 - noiseWeight) + (randNoise() - 0.5) * noiseWeight;
      }
    }

    let len = 0;
    for (let i = 0; i < 1536; i++) len += vec[i] * vec[i];
    len = Math.sqrt(len);
    const normalizedVec = vec.map(v => len === 0 ? 0 : v / len);

    return normalizedVec;
  }

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/text-embedding-004:embedContent?key=${process.env.GEMINI_API_KEY}`,
      {
        model: "models/text-embedding-004",
        content: {
          parts: [{
            text: text
          }]
        }
      }
    );

    const geminiVec = response.data.embedding.values; // Length 768
    
    // Duplicate 768 elements to reach the 1536 schema dimensions required by pgvector
    const duplicatedVec = [...geminiVec, ...geminiVec];
    return duplicatedVec;
  } catch (error) {
    console.error('Error in generateEmbedding (Gemini):', error.response ? error.response.data : error.message);
    throw error;
  }
}

module.exports = {
  transcribeAudio,
  extractStructuredData,
  generateEmbedding
};
