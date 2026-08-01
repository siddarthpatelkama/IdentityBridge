const { OpenAI, toFile } = require('openai');
require('dotenv').config();

const openaiKey = process.env.OPENAI_API_KEY;

if (!openaiKey) {
  console.warn('Warning: OPENAI_API_KEY environment variable is missing.');
}

const openai = new OpenAI({
  apiKey: openaiKey || 'placeholder'
});

/**
 * Transcribe an audio file buffer to text using Whisper API
 * @param {Buffer} fileBuffer - The audio file buffer
 * @param {string} mimeType - The mime type of the audio (e.g. 'audio/mpeg')
 * @returns {Promise<string>} The transcribed text
 */
async function transcribeAudio(fileBuffer, mimeType = 'audio/mpeg') {
  if (!process.env.OPENAI_API_KEY) {
    console.log('OpenAI API key missing. Returning mock transcription.');
    return 'Male, roughly 25 years old, wearing a red shirt and black pants, found unconscious near Secunderabad railway station with a head injury.';
  }

  try {
    const file = await toFile(fileBuffer, `audio.${mimeType.split('/')[1] || 'mp3'}`, { type: mimeType });
    const response = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
    });
    return response.text;
  } catch (error) {
    console.error('Error in transcribeAudio:', error);
    throw error;
  }
}

/**
 * Extract structured information from raw text using gpt-4o-mini
 * @param {string} rawText - The transcribed text or description
 * @param {boolean} isPatient - True if unidentified patient, False if missing report
 * @returns {Promise<object>} The extracted JSON payload
 */
async function extractStructuredData(rawText, isPatient = true) {
  if (!process.env.OPENAI_API_KEY) {
    console.log('OpenAI API key missing. Returning mock structured data.');
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
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert medical and police intake assistant.
Analyze the text provided and extract the descriptive variables.
You MUST output ONLY a valid JSON object matching this schema:
${schemaDescription}
Do not write any markdown code block fences (like \`\`\`json), explanations, or text surrounding the JSON.`
        },
        {
          role: 'user',
          content: rawText
        }
      ],
      temperature: 0.1
    });

    const content = response.choices[0].message.content.trim();
    // In case LLM returns JSON inside markdown fences despite system instructions, clean it up:
    const cleanJson = content.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error('Error in extractStructuredData:', error);
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
    // Simple LCG (Linear Congruential Generator)
    hash = (hash * 1664525 + 1013904223) % 4294967296;
    return (hash / 4294967296);
  };
}

/**
 * Generate 1536-dimensional vector embedding for a text string using text-embedding-3-small
 * @param {string} text - The input text (concatenated details)
 * @returns {Promise<number[]>} The 1536-dimension float array
 */
async function generateEmbedding(text) {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key') {
    console.log(`[EMBEDDING SIMULATION] Generating deterministic vector for: "${text.substring(0, 40)}..."`);
    
    const clean = text.toLowerCase();
    let seed = clean;
    let noiseSeed = null;
    let noiseWeight = 0.0;

    // Detect our demo matching pairs to align their vectors close to each other
    if (clean.includes('secunderabad')) {
      seed = 'secunderabad_demo_vector';
      if (clean.includes('unconscious') || clean.includes('patient') || clean.includes('bloodstained') || clean.includes('estimate')) {
        // Patient side of the Secunderabad pair
        noiseSeed = 'secunderabad_patient_noise';
        noiseWeight = 0.12; // Yields ~88% similarity
      }
    } else if (clean.includes('jubilee')) {
      seed = 'jubilee_hills_demo_vector';
      if (clean.includes('unconscious') || clean.includes('patient') || clean.includes('disoriented') || clean.includes('estimate')) {
        // Patient side of the Jubilee Hills pair
        noiseSeed = 'jubilee_patient_noise';
        noiseWeight = 0.15; // Yields ~85% similarity
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

    // Normalize to unit vector so cosine similarity equals the dot product
    let len = 0;
    for (let i = 0; i < 1536; i++) len += vec[i] * vec[i];
    len = Math.sqrt(len);
    const normalizedVec = vec.map(v => len === 0 ? 0 : v / len);

    return normalizedVec;
  }

  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float'
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error in generateEmbedding:', error);
    throw error;
  }
}

module.exports = {
  transcribeAudio,
  extractStructuredData,
  generateEmbedding
};
