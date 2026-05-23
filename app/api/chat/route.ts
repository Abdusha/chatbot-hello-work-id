import { NextResponse } from 'next/server';

const GEMINI_MODEL = 'gemini-2.5-flash';
const tools = [
  {
    googleSearch: {
    }
  }
];

const GEMINI_CONFIG = {
  temperature: 0.3,
  thinkingConfig: {
    thinkingBudget: 0,
  },
  tools,
  systemInstruction: [
    {
      text: `Anda adalah Hello Work ID, asisten karir AI yang profesional, ramah, dan sangat berpengalaman untuk pekerja di Indonesia. Tugas Anda adalah membantu pengguna dengan pertanyaan seputar karir, ulasan CV, persiapan wawancara kerja, hukum ketenagakerjaan di Indonesia (seperti UU Cipta Kerja, pesangon, hak lembur, kontrak kerja), atau tips mencari lowongan kerja. Jawablah dalam Bahasa Indonesia yang sopan, terstruktur dengan baik (gunakan tebal, daftar poin, atau paragraf baru), dan mudah dipahami. Jika pengguna mengunggah file CV (PDF), berikan ulasan detail yang memuat kelebihan, kekurangan, dan poin perbaikan yang jelas. Berikan rekomendasi konkret untuk meningkatkan CV mereka agar lebih menarik bagi perusahaan. Tolak permintaan yang tidak relevan dengan topik karir atau hukum ketenagakerjaan. Jangan pernah memberikan informasi yang salah atau menyesatkan. Jika Anda tidak tahu jawabannya, katakan dengan jujur bahwa Anda tidak tahu, dan sarankan pengguna untuk mencari informasi lebih lanjut dari sumber resmi. Selalu prioritaskan memberikan jawaban yang akurat, bermanfaat, dan relevan dengan kebutuhan karir pengguna di Indonesia.`,
    }
  ]
};

function normalizeSystemInstruction(systemInstruction: unknown) {
  if (Array.isArray(systemInstruction)) {
    return {
      parts: systemInstruction.map((item) =>
        typeof item === 'object' && item !== null && 'text' in item
          ? { text: (item as { text: string }).text }
          : item
      ),
    };
  }

  return systemInstruction;
}

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

    // Read the request payload sent by the client widget
    const body = await request.json();

    // Forward only the supported Gemini chat payload shape
    const requestBody: Record<string, unknown> = {
      ...body,
      systemInstruction: body.systemInstruction
        ? normalizeSystemInstruction(body.systemInstruction)
        : normalizeSystemInstruction(GEMINI_CONFIG.systemInstruction),
    };

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errMsg = errData.error?.message || 'Gagal terhubung dengan server Gemini API.';
      return NextResponse.json(
        { error: { message: errMsg } },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

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
