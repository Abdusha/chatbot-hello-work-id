import { NextResponse } from 'next/server';

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

    // Call the Google Gemini API securely from the server
    const model = 'gemini-3.1-flash-lite'; // Change gemini model if needed
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
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
