import { NextResponse } from 'next/server';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

const GEMINI_MODEL = 'gemma-4-26b-a4b-it';
const tools = [
  {
    googleSearch: {
    }
  }
];

const GEMINI_CONFIG = {
  temperature: 0.3,
  thinkingConfig: {
    thinkingLevel: ThinkingLevel.MINIMAL,
  },
  tools,
  systemInstruction: [
    {
      text: `Anda adalah Hello Work ID, asisten karir AI yang profesional, ramah, dan sangat berpengalaman untuk pekerja di Indonesia. Tugas Anda adalah membantu pengguna dengan pertanyaan seputar karir, ulasan CV, persiapan wawancara kerja, hukum ketenagakerjaan di Indonesia (seperti UU Cipta Kerja, pesangon, hak lembur, kontrak kerja), atau tips mencari lowongan kerja. Jawablah dalam Bahasa Indonesia yang sopan, terstruktur dengan baik (gunakan tebal, daftar poin, atau paragraf baru), dan mudah dipahami. Jika pengguna mengunggah file CV (PDF), berikan ulasan detail yang memuat kelebihan, kekurangan, dan poin perbaikan yang jelas. Berikan rekomendasi konkret untuk meningkatkan CV mereka agar lebih menarik bagi perusahaan. Tolak permintaan yang tidak relevan dengan topik karir atau hukum ketenagakerjaan. Jangan pernah memberikan informasi yang salah atau menyesatkan. Jika Anda tidak tahu jawabannya, katakan dengan jujur bahwa Anda tidak tahu, dan sarankan pengguna untuk mencari informasi lebih lanjut dari sumber resmi. Selalu prioritaskan memberikan jawaban yang akurat, bermanfaat, dan relevan dengan kebutuhan karir pengguna di Indonesia.`,
    }
  ]
};

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
      return NextResponse.json(
        {
          error: {
            message: 'Gemini API Key belum dikonfigurasi di server. Mohon atur variabel GEMINI_API_KEY di file .env Anda.'
          }
        },
        { status: 500 }
      );
    }

    // Initialize the official Google Gen AI SDK client
    const ai = new GoogleGenAI({ apiKey });

    // Read the request payload sent by the client widget
    const body = await request.json();
    const contents = body.contents;

    // Normalize system instruction to string as required by the google-genai SDK config
    let systemInstructionString = GEMINI_CONFIG.systemInstruction[0].text;
    if (body.systemInstruction) {
      if (typeof body.systemInstruction === 'string') {
        systemInstructionString = body.systemInstruction;
      } else if (typeof body.systemInstruction === 'object') {
        const parts = (body.systemInstruction as any).parts;
        if (Array.isArray(parts) && parts.length > 0 && parts[0].text) {
          systemInstructionString = parts[0].text;
        } else if ((body.systemInstruction as any).text) {
          systemInstructionString = (body.systemInstruction as any).text;
        }
      }
    }

    // Call Gemini AI using the SDK
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: contents,
      config: {
        temperature: GEMINI_CONFIG.temperature,
        thinkingConfig: {
          thinkingLevel: GEMINI_CONFIG.thinkingConfig.thinkingLevel,
        },
        tools: GEMINI_CONFIG.tools,
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
          .filter((p: any) => !p.thought)
          .map((p: any) => p.text)
          .join('\n');
      }
    }

    // Return a simplified and clean response structure to the frontend
    return NextResponse.json({
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

  } catch (error: any) {
    console.error('❌ Server-side Gemini API Error:', error);
    return NextResponse.json(
      {
        error: {
          message: error.message || 'Terjadi kesalahan internal pada server proxy.'
        }
      },
      { status: 500 }
    );
  }
}

