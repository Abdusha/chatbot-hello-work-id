import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import puppeteer from 'puppeteer';

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

// Chat fullscreen route - serve the chat fullscreen interface directly
app.get('/chat', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'fullscreen.html'));
});

// CV Optimizer route - serve the main chat interface directly
app.get('/cv-optimizer', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cv-optimizer.html'));
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

    if (!apiKey) {
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

// API Endpoint to optimize CV for ATS
app.post('/api/cv-optimize', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: {
          message: 'Gemini API Key belum dikonfigurasi di server. Mohon atur variabel GEMINI_API_KEY di file .env Anda.'
        }
      });
    }

    const { cvBase64, jobDescription, language } = req.body;

    if (!cvBase64) {
      return res.status(400).json({
        error: {
          message: 'Berkas CV diperlukan.'
        }
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    const langInstructions = language === 'en'
      ? 'Bahasa Inggris'
      : 'Bahasa Indonesia';

    // Build the request contents with the PDF base64 and target job description
    const contents = [
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType: 'application/pdf',
              data: cvBase64
            }
          },
          {
            text: `Tolong optimasi CV PDF saya agar menjadi sangat ramah ATS (ATS-friendly) dan profesional.
            
Target Lowongan Kerja / Deskripsi Pekerjaan (jika ada):
${jobDescription || 'Tidak ada deskripsi pekerjaan spesifik. Optimasikan secara umum agar profesional.'}

Ketentuan Output:
1. Evaluasi CV asli dan berikan estimasi skor ATS (0-100) sebelum dioptimasi.
2. Tulis ulang isi CV agar ramah ATS dengan menggunakan ${langInstructions} yang profesional (formal), struktur yang bersih (Summary, Work Experience, Education, Skills), kalimat yang diawali dengan kata kerja aksi (action verbs) yang kuat, dan masukkan kata kunci (keywords) yang relevan dengan target pekerjaan.
3. Estimasi skor ATS (0-100) setelah optimasi (seharusnya jauh lebih tinggi).
4. Berikan daftar perubahan utama (keyChanges) dan tips tambahan (tips) untuk pengguna.
5. Anda HARUS mengembalikan respons dalam format JSON yang valid dengan struktur berikut (jangan tambahkan teks lain di luar JSON):
{
  "atsScoreBefore": 45,
  "atsScoreAfter": 85,
  "keyChanges": ["Penjelasan perubahan 1", "Penjelasan perubahan 2"],
  "tips": ["Tips 1", "Tips 2"],
  "optimizedCV": "# [NAMA LENGKAP]\\n\\n[Kontak: Telepon, Email, LinkedIn]\\n\\n## Ringkasan Profesional\\n[Deskripsi singkat]\\n\\n## Pengalaman Kerja\\n### [Nama Perusahaan] - [Jabatan]\\n[Bulan Tahun - Bulan Tahun]\\n- [Bullet point menggunakan action verb & hasil terukur]\\n\\n## Pendidikan\\n### [Nama Institusi] - [Gelar]\\n[Tahun Kelulusan]\\n\\n## Keahlian\\n- [Keahlian Teknis/Soft Skills]"
}`
          }
        ]
      }
    ];

    const systemInstruction = `Anda adalah seorang HR Expert, Rekruter Profesional, dan Spesialis CV ATS. Tugas Anda adalah menganalisis file CV PDF yang diunggah pengguna dan mengoptimalkannya agar lolos sistem ATS (Applicant Tracking System). Anda harus merespons dalam format JSON terstruktur dengan kunci: atsScoreBefore (angka), atsScoreAfter (angka), keyChanges (array string), tips (array string), dan optimizedCV (string markdown yang rapi menggunakan standar formal). Struktur markdown optimizedCV harus menggunakan format ATS standar tanpa elemen dekoratif visual, tabel, atau layout kolom ganda, melainkan format satu kolom linier yang bersih. Gunakan ${langInstructions} sesuai permintaan pengguna.`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: contents,
      config: {
        temperature: 0.2,
        responseMimeType: 'application/json',
        systemInstruction: systemInstruction,
      }
    });

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

    // Try parsing to verify it is valid JSON, if not, try to extract JSON block
    let responseData;
    try {
      responseData = JSON.parse(botText);
    } catch (err) {
      console.log('⚠️ Failed to parse response directly as JSON, trying regex extraction.');
      const jsonMatch = botText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        responseData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Sistem gagal memformat respons AI ke dalam format JSON yang valid.');
      }
    }

    return res.json(responseData);

  } catch (error) {
    console.error('❌ CV Optimization Error:', error);
    return res.status(500).json({
      error: {
        message: error.message || 'Terjadi kesalahan saat memproses optimasi CV.'
      }
    });
  }
});

// API Endpoint to generate PDF from HTML using Puppeteer
app.post('/api/generate-pdf', async (req, res) => {
  try {
    const { htmlContent } = req.body;
    if (!htmlContent) {
      return res.status(400).json({
        error: {
          message: 'Konten HTML diperlukan untuk membuat PDF.'
        }
      });
    }

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Set content and wait until resources are loaded
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    // Generate PDF buffer
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      },
      printBackground: true
    });

    await browser.close();

    res.contentType('application/pdf');
    res.send(Buffer.from(pdfBuffer));

  } catch (error) {
    console.error('❌ PDF Generation Error:', error);
    return res.status(500).json({
      error: {
        message: error.message || 'Gagal menghasilkan berkas PDF.'
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
