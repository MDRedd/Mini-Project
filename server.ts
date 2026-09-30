import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Initialize Gemini client lazily
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY environment variable is not defined.');
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// API endpoint for search grounding
app.post('/api/search-grounding', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string') {
      res.status(400).json({ error: 'Query is required and must be a string.' });
      return;
    }

    const ai = getGeminiClient();
    const systemInstruction = `You are an expert academic advisor and university regulations officer.
Provide a professional, clear, concise summary of the academic regulations or university guidelines requested.
Stick to factual details. Include section names or guidelines from official bodies (like AICTE, UGC, or major technological universities) if applicable.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: query,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || '';
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    // Format grounding sources nicely
    const sources = chunks.map((chunk: any) => ({
      title: chunk.web?.title || 'Grounding Source',
      uri: chunk.web?.uri || '',
    })).filter((src: any) => src.uri);

    res.json({ text, sources });
  } catch (error: any) {
    console.error('Error in search grounding endpoint:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch search grounding results.'
    });
  }
});

// Vite middleware setup
async function setupVite() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ Port ${PORT} is already in use.`);
      console.error(`💡 Free it with: kill -9 $(lsof -t -i:${PORT}) or run on another port: PORT=3001 npm run dev\n`);
      process.exit(1);
    } else {
      console.error('Server error:', err);
    }
  });
}

setupVite().catch((err) => {
  console.error('Vite initialization error:', err);
});
