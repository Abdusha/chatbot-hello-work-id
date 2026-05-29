import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Resolve __dirname in ES Modules environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Enable Cross-Origin Resource Sharing (CORS)
app.use(cors());

// Configure JSON parser with a limit of 5MB (accommodates CV PDF with base64 overhead)
app.use(express.json({ limit: '5mb' }));


// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Root route - serve the main chat interface directly
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

// Gemini Configuration
const GEMINI_MODEL = 'gemma-4-26b-a4b-it';
const tools = [
  {
    googleSearch: {}
  }
];

const systemInstructionText = `Anda adalah Hello Work ID, asisten karir AI yang profesional, ramah, dan sangat berpengalaman untuk pekerja di Indonesia. Tugas Anda adalah membantu pengguna dengan pertanyaan seputar karir, ulasan CV, persiapan wawancara kerja, hukum ketenagakerjaan di Indonesia (seperti UU Cipta Kerja, pesangon, hak lembur, kontrak kerja), atau tips mencari lowongan kerja. Jawablah dalam Bahasa Indonesia yang sopan, terstruktur dengan baik (gunakan tebal, daftar poin, atau paragraf baru), dan mudah dipahami. Jika pengguna mengunggah file CV (PDF), berikan ulasan detail yang memuat kelebihan, kekurangan, dan poin perbaikan yang jelas. Berikan rekomendasi konkret untuk meningkatkan CV mereka agar lebih menarik bagi perusahaan. Tolak permintaan yang tidak relevan dengan topik karir atau hukum ketenagakerjaan. Jangan pernah memberikan informasi yang salah atau menyesatkan. Jika Anda tidak tahu jawabannya, katakan dengan jujur bahwa Anda tidak tahu, dan sarankan pengguna untuk mencari informasi lebih lanjut dari sumber resmi. Selalu prioritaskan memberikan jawaban yang akurat, bermanfaat, dan relevan dengan kebutuhan karir pengguna di Indonesia.`;

// API Endpoint to proxy chat messages to Gemini API
app.post('/api/chat', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
      return res.status(500).json({
        error: {
          message: 'Gemini API Key belum dikonfigurasi di server. Mohon atur variabel GEMINI_API_KEY di file .env Anda.'
        }
      });
    }

    // Initialize the official Google Gen AI SDK client
    const ai = new GoogleGenAI({ apiKey });

    // Read the request payload sent by the client widget
    const { contents, systemInstruction } = req.body;

    if (!contents || !Array.isArray(contents)) {
      return res.status(400).json({
        error: {
          message: 'Format request tidak valid. Diperlukan array "contents".'
        }
      });
    }

    // Normalize system instruction to string
    let systemInstructionString = systemInstructionText;
    if (systemInstruction) {
      if (typeof systemInstruction === 'string') {
        systemInstructionString = systemInstruction;
      } else if (typeof systemInstruction === 'object') {
        const parts = systemInstruction.parts;
        if (Array.isArray(parts) && parts.length > 0 && parts[0].text) {
          systemInstructionString = parts[0].text;
        } else if (systemInstruction.text) {
          systemInstructionString = systemInstruction.text;
        }
      }
    }

    // Call Gemini AI using the SDK
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: contents,
      config: {
        temperature: 0.3,
        thinkingConfig: {
          thinkingLevel: 'MINIMAL', // Using direct string value for compatibility
        },
        tools: tools,
        systemInstruction: systemInstructionString,
      }
    });

    // Extract the actual response text (filtering out thought/thinking parts)
    let botText = '';
    try {
      botText = response.text || '';
    } catch (e) {
      const parts = response.candidates?.[0]?.content?.parts;
      if (Array.isArray(parts)) {
        botText = parts
          .filter((p) => !p.thought)
          .map((p) => p.text)
          .join('\n');
      }
    }

    // Return the response to the frontend in the expected structure
    return res.json({
      candidates: [
        {
          content: {
            parts: [
              {
                text: botText
              }
            ]
          }
        }
      ],
      usageMetadata: response.usageMetadata,
    });

  } catch (error) {
    console.error('❌ Server-side Gemini API Error:', error);
    return res.status(500).json({
      error: {
        message: error.message || 'Terjadi kesalahan internal pada server proxy.'
      }
    });
  }
});

// Error handler middleware (must be AFTER all routes)
app.use((err, req, res, next) => {
  if (err.status === 413 || err.type === 'entity.too.large') {
    return res.status(413).json({
      error: {
        message: 'Ukuran file terlalu besar! Batas maksimal unggah dokumen CV adalah 3.5 MB (sekitar 5 MB setelah encoding Base64).'
      }
    });
  }
  next(err);
});

// Start the server (only in local/non-serverless environments)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Hello Work ID server is running on http://localhost:${PORT}`);
  });
}

// Export the app for Vercel serverless deployment
export default app;
