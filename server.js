import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

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

// CV Builder route - serve the manual CV builder interface directly
app.get('/cv-builder', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cv-builder.html'));
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
            text: `Tolong evaluasi dan optimasi CV PDF saya agar menjadi sangat ramah ATS (ATS-friendly) dan profesional.
            
Target Lowongan Kerja / Deskripsi Pekerjaan (jika ada):
${jobDescription || 'Tidak ada deskripsi pekerjaan spesifik. Optimasikan secara umum agar profesional.'}

Ketentuan Evaluasi & Output:
1. Evaluasi CV asli secara objektif menggunakan rubrik penilaian ATS berikut (total maks 100):
   a. Tata Letak & Struktur (Maks 30 poin): Format satu kolom linier bersih tanpa tabel, gambar, grafik, kolom ganda, atau elemen dekoratif (15 poin) serta menggunakan judul bagian standar seperti Ringkasan/Summary, Work Experience, Education, Skills (15 poin).
   b. Kata Kerja Aksi & Metrik (Maks 30 poin): Kalimat deskripsi pekerjaan diawali kata kerja aksi kuat (15 poin) dan mencantumkan hasil pencapaian terukur dengan angka/persentase (15 poin).
   c. Kata Kunci & Relevansi (Maks 30 poin): Memiliki kata kunci yang sangat relevan dengan target pekerjaan (atau relevan dengan peran/industri secara umum jika deskripsi kosong).
   d. Informasi Kontak (Maks 10 poin): Menyertakan nama, email, nomor telepon, dan lokasi/LinkedIn dengan jelas.
2. Tentukan estimasi skor ATS CV asli sebelum optimasi (atsScoreBefore) berdasarkan evaluasi jujur dari rubrik di atas.
   - PENTING: Jika CV asli yang diunggah sudah sangat baik dan memenuhi kriteria ATS (misalnya jika pengguna mengunggah kembali berkas yang sudah dioptimasi sebelumnya), berikan skor atsScoreBefore yang tinggi (85-95%). Jangan sengaja menurunkannya.
3. Lakukan optimasi pada isi CV jika diperlukan. Tulis ulang isi CV menggunakan ${langInstructions} yang formal dan profesional.
   - PENTING: Jika CV asli sudah sangat optimal dan mendapatkan skor >= 90%, Anda TIDAK PERLU mengubah isi CV secara signifikan. Cukup kembalikan konten asli CV tersebut di dalam "optimizedCV", dan pada "keyChanges" isi dengan penjelasan bahwa CV asli sudah sangat optimal sehingga tidak memerlukan perubahan.
   - LARANGAN PLACEHOLDER: JANGAN PERNAH menambahkan teks placeholder yang perlu diisi pengguna (seperti '[X]%', '[Jumlah]', '[Nama Perusahaan]', '[Tahun]', dll) ke dalam "optimizedCV". Jika di CV asli tidak terdapat data kuantitatif (seperti persentase/angka pencapaian), tulis deskripsi pekerjaan secara kualitatif profesional di "optimizedCV", dan berikan saran spesifik untuk menambahkan metrik kuantitatif tersebut di dalam bagian "tips" saja. CV yang dihasilkan harus siap diunduh dan langsung digunakan tanpa ada placeholder yang menggantung.
4. Tentukan estimasi skor ATS setelah optimasi (atsScoreAfter). Jika CV asli sudah optimal, skor atsScoreAfter bisa sama atau hampir sama dengan atsScoreBefore.
5. Berikan daftar perubahan utama (keyChanges) dan tips tambahan (tips) untuk pengguna.
6. Anda HARUS mengembalikan respons dalam format JSON yang valid dengan struktur berikut (jangan tambahkan teks lain di luar JSON):
{
  "atsScoreBefore": 85,
  "atsScoreAfter": 92,
  "keyChanges": ["Penjelasan perubahan 1", "Penjelasan perubahan 2"],
  "tips": ["Tips 1", "Tips 2"],
  "optimizedCV": "# [NAMA LENGKAP]\\n\\n##title## [Judul Profesional / Pekerjaan]\\n\\n[Kontak: Telepon, Email, LinkedIn]\\n\\n## Ringkasan\\n[Deskripsi singkat]\\n\\n## Pengalaman Kerja\\n### <span>[Nama Perusahaan] – [Jabatan]</span> <span>[Bulan Tahun - Bulan Tahun]</span>\\n- [Bullet point menggunakan action verb & hasil terukur]\\n\\n## Pendidikan\\n### <span>[Nama Institusi] – [Gelar]</span> <span>[Tahun Kelulusan]</span>\\n\\n## Keahlian\\n- [Keahlian Teknis/Soft Skills]"
}`
          }
        ]
      }
    ];

    const systemInstruction = `Anda adalah seorang HR Expert, Rekruter Profesional, dan Spesialis CV ATS. Tugas Anda adalah menganalisis file CV PDF yang diunggah pengguna dan mengoptimalkannya agar lolos sistem ATS (Applicant Tracking System). Anda harus menilai CV secara objektif sesuai rubrik penilaian (Tata Letak, Kata Kerja Aksi/Metrik, Kata Kunci/Relevansi, Informasi Kontak). Jika CV asli sudah berkualitas tinggi atau merupakan hasil optimasi sebelumnya, berikan skor atsScoreBefore yang tinggi secara jujur dan jangan melakukan perubahan isi CV jika tidak diperlukan. Anda dilarang keras menggunakan placeholder (seperti [X]% atau [Jumlah]) di dalam "optimizedCV"; jika data kuantitatif tidak ada di CV asli, tulislah secara kualitatif di CV dan berikan rekomendasi penambahan metrik tersebut di bagian "tips". Anda harus merespons dalam format JSON terstruktur dengan kunci: atsScoreBefore (angka), atsScoreAfter (angka), keyChanges (array string), tips (array string), dan optimizedCV (string markdown yang rapi menggunakan standar formal). Struktur markdown optimizedCV harus menggunakan format ATS standar satu kolom linier yang bersih. PENTING: Pada optimizedCV, gunakan penanda ##title## tepat di bawah nama untuk Judul Profesional/Pekerjaan (contoh: ##title## Senior Software Engineer). Untuk H3 di Pengalaman Kerja dan Pendidikan, gunakan format: ### <span>[Perusahaan/Institusi] – [Jabatan/Gelar]</span> <span>[Periode]</span> agar letaknya rata kiri dan kanan. Gunakan ${langInstructions} sesuai permintaan pengguna.`;

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

    const isLocal = !process.env.VERCEL;
    const executablePath = isLocal 
      ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
      : await chromium.executablePath();

    const browser = await puppeteer.launch({
      args: isLocal ? ['--no-sandbox', '--disable-setuid-sandbox'] : chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: executablePath,
      headless: isLocal ? 'new' : chromium.headless,
      ignoreHTTPSErrors: true,
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
