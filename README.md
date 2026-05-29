# Hello Work ID - Career Assistant Chatbot

A lightweight **Node.js/Express** chatbot application powered by the **Google Gemini API**, specifically designed to assist with career guidance and Indonesian labor law questions.

## 🌟 Features

- 💬 **Interactive Chat Interface** - Real-time conversations with an AI career assistant
- 📄 **CV Upload & Review** - Upload PDF résumés for detailed AI-powered feedback (max 3.5 MB)
- 🎯 **Career Guidance** - Professional development and job search assistance
- ⚖️ **Labor Law Expert** - Information about Indonesian employment laws and regulations (UU Cipta Kerja, pesangon, lembur, etc.)
- 📋 **Contract Assistance** - Help with employment contracts and workplace policies
- 🖥️ **Fullscreen Mode** - Expand the chatbot widget to fill the entire viewport
- 🎨 **Modern UI** - Beautiful, responsive interface built with Vanilla HTML, CSS, and JavaScript

## 🚀 Live Demo

Visit the live application: [https://chatbot-hello-work-id.vercel.app](https://chatbot-hello-work-id.vercel.app)

## 📋 Prerequisites

Before running this project, make sure you have:

- **Node.js** (v18 or higher)
- **npm** package manager
- **Google Gemini API Key** — Get it for free from [Google AI Studio](https://aistudio.google.com/apikey)

## ⚙️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Abdusha/chatbot-hello-work-id.git
cd chatbot-hello-work-id
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Copy the example environment file and add your Gemini API key:

```bash
cp .env.example .env
```

Then edit `.env` and replace the placeholder with your actual API key:

```
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

You can get a free API key from [Google AI Studio](https://aistudio.google.com/apikey).

## 🏃 Running the Project

### Development Mode (with auto-reload)

```bash
npm run dev
```

This starts the server using **nodemon**, which automatically restarts on file changes.

### Production Mode

```bash
npm start
```

The application will be available at **`http://localhost:3000`**

## 🛠️ Project Structure

```
chatbot-hello-work-id/
├── .env                    # Your Gemini API key (do NOT commit)
├── .env.example            # Environment variables template
├── .gitignore
├── README.md
├── package.json            # Dependencies: express, cors, dotenv, @google/genai
├── server.js               # Express backend — serves static files & /api/chat endpoint
└── public/
    ├── chat.html           # Landing page & chatbot widget host
    ├── fullscreen.html     # Fullscreen chatbot view
    ├── style.css           # Widget & page styles
    ├── widget.js           # Vanilla JS chatbot widget logic
    ├── icon.svg            # Favicon (SVG)
    ├── icon-light-32x32.png
    ├── icon-dark-32x32.png
    └── apple-icon.png
```

## 🔌 API Integration

The chatbot uses the **Google Gemini API** (model: `gemma-4-26b-a4b-it`) via the official `@google/genai` SDK.

### How It Works

1. User sends a message (or uploads a PDF CV) through the chat widget
2. `widget.js` sends a `POST` request to `/api/chat` on the local Express server
3. The server securely calls the Gemini API using the server-side API key
4. The Gemini response is returned and rendered in the chat UI

### API Request Format

```json
POST /api/chat
Content-Type: application/json

{
  "contents": [
    {
      "role": "user",
      "parts": [
        { "text": "Your question here" }
      ]
    }
  ]
}
```

### File Upload

PDF files are encoded as Base64 in the browser (`FileReader`) and embedded in the `inlineData` part of the `contents` payload. The server enforces a **5 MB body limit** (accommodating the ~33% Base64 overhead from a 3.5 MB PDF). The frontend additionally validates files before upload and **rejects any PDF larger than 3.5 MB** with a user-friendly alert.

## 🚀 Deployment

### Deploy to a Node.js Host (e.g., Railway, Render, Fly.io)

1. Push your repository to GitHub
2. Connect it to your preferred Node.js hosting platform
3. Set the environment variable `GEMINI_API_KEY` in the platform's settings
4. Set the start command to `node server.js` (or `npm start`)

### Deploy to Vercel (Serverless — requires adaptation)

> [!NOTE]
> This project now runs as a **standard Express server** and is not optimized for Vercel's serverless functions out of the box. For Vercel deployment, you would need to wrap `server.js` as a serverless function or use a platform that supports persistent Node.js processes (Railway, Render, Fly.io, etc.).

## 🔐 Security

- ✅ `GEMINI_API_KEY` is never exposed to the client browser
- ✅ API calls are made server-side only, inside `server.js`
- ✅ `.env` is included in `.gitignore` and never committed
- ✅ File upload is limited to **PDF only**, max **3.5 MB**, validated on both client and server

## 🧪 Testing

To test the chatbot locally:

1. Start the development server: `npm run dev`
2. Open `http://localhost:3000` in your browser
3. Click the 💬 button in the bottom-right corner to open the chat
4. Type a career-related question and press **Enter** or click **Send**
5. (Optional) Click the 📎 attachment button to upload a PDF CV for review

## 📦 Dependencies

| Package | Role |
|---------|------|
| `express` | HTTP server and routing |
| `cors` | Cross-Origin Resource Sharing middleware |
| `dotenv` | Loads environment variables from `.env` |
| `@google/genai` | Official Google Gemini AI SDK |
| `nodemon` *(dev)* | Auto-restarts server on file changes |

For the full list of installed packages, see [`package.json`](./package.json).

## 🆘 Troubleshooting

### Error: "API Key not configured"

**Solution**: Make sure your `.env` file exists and contains a valid `GEMINI_API_KEY`.

```bash
# Check your .env file
cat .env
```

### Error: "Cannot find module"

**Solution**: Install dependencies:

```bash
npm install
```

If that doesn't help, try a clean install:

```bash
rm -rf node_modules
npm install
```

### Chat returns empty responses

**Solution**:
1. Verify your Gemini API key is valid at [Google AI Studio](https://aistudio.google.com)
2. Check API usage quotas at [Google Cloud Console](https://console.cloud.google.com)
3. Check the terminal running `npm run dev` for server-side error logs

### File upload rejected

The PDF file must be:
- Format: **PDF only**
- Size: **≤ 3.5 MB**

Larger files will be rejected by the browser before they are sent to the server.

## 📝 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- AI powered by [Google Gemini](https://ai.google.dev)
- Backend powered by [Express.js](https://expressjs.com)
- Widget built with Vanilla HTML, CSS & JavaScript

---

**Happy coding! 🚀**
