# Hello Work ID - Career Assistant Chatbot

A Next.js chatbot application powered by Google Gemini API, specifically designed to assist with career guidance and Indonesian labor law questions.

## 🌟 Features

- 💬 **Interactive Chat Interface** - Real-time conversations with AI assistant
- 🎯 **Career Guidance** - Professional development and job search assistance
- ⚖️ **Labor Law Expert** - Information about Indonesian employment laws and regulations
- 📋 **Contract Assistance** - Help with employment contracts and workplace policies
- 🏢 **Workplace Advice** - General workplace policies and employee benefits guidance
- 🎨 **Modern UI** - Beautiful, responsive interface built with shadcn/ui and Tailwind CSS

## 🚀 Live Demo

Visit the live application: [https://chatbot-hello-work-id.vercel.app](https://chatbot-hello-work-id.vercel.app)

## 📋 Prerequisites

Before running this project, make sure you have:

- **Node.js** (v18 or higher)
- **npm** or **pnpm** package manager
- **Google Gemini API Key** - Get it from [Google AI Studio](https://aistudio.google.com/apikey)

## ⚙️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Abdusha/chatbot-hello-work-id.git
cd chatbot-hello-work-id
```

### 2. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory and add your Gemini API key:

```bash
cp .env.example .env
```

Then edit `.env` and replace with your actual API key:

```
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

You can get a free API key from [Google AI Studio](https://aistudio.google.com/apikey).

## 🏃 Running the Project

### Development Mode

Start the development server:

```bash
npm run dev
# or
pnpm dev
```

The application will be available at `http://localhost:3000`

### Production Build

Build the project for production:

```bash
npm run build
npm start
# or
pnpm build
pnpm start
```

### Linting

Check for code issues:

```bash
npm run lint
# or
pnpm lint
```

## 🛠️ Project Structure

```
chatbot-hello-work-id/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts          # API endpoint for Gemini chat
│   ├── layout.tsx                # Root layout component
│   ├── page.tsx                  # Home page with chatbot interface
│   └── globals.css               # Global styles
├── components/
│   ├── ui/                       # shadcn/ui components
│   └── theme-provider.tsx        # Theme configuration
├── hooks/
│   ├── use-mobile.ts             # Mobile detection hook
│   └── use-toast.ts              # Toast notification hook
├── lib/
│   └── utils.ts                  # Utility functions
├── public/
│   ├── chat.html                 # Static HTML version
│   └── style.css                 # Additional styles
├── .env.example                  # Environment variables template
├── next.config.mjs               # Next.js configuration
├── package.json                  # Project dependencies
├── postcss.config.mjs            # PostCSS configuration
├── tailwind.config.ts            # Tailwind CSS configuration
└── tsconfig.json                 # TypeScript configuration
```

## 🔌 API Integration

The chatbot uses the **Google Gemini 2.5 Flash API** for generating responses.

### How It Works

1. User sends a message through the chat interface
2. Message is sent to `/api/chat` endpoint
3. Server securely calls Google Gemini API with the API key
4. Response is returned and displayed in the chat

### API Request Format

```typescript
POST /api/chat
Content-Type: application/json

{
  "contents": [
    {
      "parts": [
        {
          "text": "Your question here"
        }
      ]
    }
  ]
}
```

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Go to [Vercel.com](https://vercel.com)
3. Click "Add New" → "Project"
4. Import your GitHub repository
5. Add environment variable `GEMINI_API_KEY` in Vercel settings
6. Click "Deploy"

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md)

### Environment Variables on Vercel

Make sure to set the following environment variable in your Vercel project settings:

- **GEMINI_API_KEY**: Your Google Gemini API key

## 🔐 Security

- ✅ API keys are never committed to version control (`.env` is in `.gitignore`)
- ✅ API calls are made from the server-side only
- ✅ Environment variables are securely stored in Vercel
- ✅ No sensitive data is exposed to the client

## 🧪 Testing

To test the chatbot locally:

1. Start the development server: `npm run dev`
2. Open http://localhost:3000 in your browser
3. Type a question and send it
4. You should receive a response from the Gemini API

If you get an error, check:
- Is your `.env` file properly configured?
- Is the `GEMINI_API_KEY` valid?
- Can you access the Gemini API from [Google AI Studio](https://aistudio.google.com)?

## 📦 Dependencies

Key dependencies:

- **Next.js** 16.2.6 - React framework
- **React** 19 - UI library
- **Tailwind CSS** 3 - Styling
- **shadcn/ui** - Component library
- **Radix UI** - Headless component library
- **TypeScript** - Type safety
- **Lucide React** - Icon library

For full list, see `package.json`

## 📝 License

This project is open source and available under the MIT License.

## 🆘 Troubleshooting

### Error: "API Key not configured"

**Solution**: Make sure your `.env` file has the correct `GEMINI_API_KEY` value.

```bash
# Check your .env file
cat .env
```

### Error: "Module not found"

**Solution**: Install dependencies again:

```bash
npm install
# or
rm -rf node_modules && npm install
```

### Build fails on Vercel

**Solution**: 
1. Check the build logs in Vercel dashboard
2. Ensure all environment variables are set
3. Try building locally first: `npm run build`

### Chat returns empty responses

**Solution**:
1. Verify your Gemini API key is valid
2. Check API usage limits at [Google AI Console](https://console.cloud.google.com)
3. Check Vercel function logs for errors


## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Styling with [Tailwind CSS](https://tailwindcss.com)
- AI powered by [Google Gemini](https://ai.google.dev)

---

**Happy coding! 🚀**
