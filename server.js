require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for frontend access
app.use(cors());
app.use(express.json());

// Serve static files (HTML, CSS, JS) from the current directory
app.use(express.static(__dirname));

// Initialize AI APIs
let groq = null;
let genAI = null;

if (process.env.GROQ_API_KEY) {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
}

if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

// Grounded Concise Anti-Hallucination System Prompt representing Hemanth Kumar G
const SYSTEM_PROMPT = `You are the official AI representative for Hemanth Kumar G (Full-Stack & AI/ML Engineer).
Your goal is to answer questions from recruiters and visitors in a friendly, conversational, and punchy manner.

STRICT CONCISENESS RULES:
1. Keep EVERY response strictly between 2 to 3 concise sentences (under 60 words total).
2. NEVER output markdown tables, walls of text, unrequested lists, or entire resume dumps.
3. Answer ONLY the specific question asked. If asked a follow-up, answer seamlessly using prior conversation context.
4. Always finish your thoughts cleanly without cutting off mid-sentence.
5. ONLY mention facts, projects, and experience from the grounded facts below. NEVER invent projects.

GROUNDED PROFILE FACTS:
- Identity: Hemanth Kumar G, Full-Stack & AI/ML Engineer based in Bengaluru, India. Open to full-time Software Engineer, AI/ML, and Full-Stack roles.
- Education: MCA from VTU, Mysuru (CGPA: 8.58/10, 2023–2025) | BCA from Mangalore University (CGPA: 7.0/10).
- Core Stack: Python, FastAPI, React.js, Next.js, Node.js, PostgreSQL, MongoDB, Qdrant Vector DB, RAG pipelines.
- 6 Real Projects:
  1. Vextral AI: Document Q&A using RAG with Qdrant, FastAPI, and Gemini (responses in 1.15-1.7s, health-check <1ms).
  2. MindGuard AI: Mental wellness platform with 4-model NLP ensemble & FastAPI (71% latency reduction via asyncio).
  3. Mandi Mitra / KisanSetu: Agricultural intelligence & crop disease detection (published research paper at ETCST 2025).
  4. E-Tendering System: Procurement and real-time bidding with React, FastAPI, MongoDB.
  5. Food Hunger Rescue: Food logistics with DBSCAN hotspot clustering & OSRM routing.
  6. AI RepoHealth: GitHub repository intelligence using Groq LLMs.
- Experience: MERN Intern at AccioJob (04/2026-Present), Python Full-Stack Intern at Ethnotech Academy (12/2025-01/2026), Python AI/ML Intern at Dotch Endeavours (11/2024-01/2025).
- Contact: hemanthkumar40688@gmail.com | +91 9591903407 | GitHub: https://github.com/Hemanth40`;

app.post('/api/chat', async (req, res) => {
    try {
        const { message, history = [] } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Clean & truncate history for memory (last 10 messages)
        const cleanHistory = Array.isArray(history) 
            ? history.filter(h => h && h.role && h.content).slice(-10)
            : [];

        // 1. Try Google Gemini API if key is available
        if (genAI) {
            try {
                const model = genAI.getGenerativeModel({
                    model: 'gemini-1.5-flash',
                    systemInstruction: SYSTEM_PROMPT,
                    generationConfig: {
                        maxOutputTokens: 250,
                        temperature: 0.4
                    }
                });

                const geminiHistory = cleanHistory.map(h => ({
                    role: h.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: h.content }]
                }));

                const chat = model.startChat({
                    history: geminiHistory
                });

                const result = await chat.sendMessage(message);
                const responseText = result.response.text();

                if (responseText) {
                    return res.json({ response: responseText.trim() });
                }
            } catch (geminiError) {
                console.warn('Gemini API attempt failed, switching to Groq:', geminiError.message);
            }
        }

        // 2. Try Groq API with active models
        if (groq) {
            const messages = [
                { role: "system", content: SYSTEM_PROMPT },
                ...cleanHistory,
                { role: "user", content: message }
            ];

            const supportedModels = [
                "openai/gpt-oss-120b",
                "openai/gpt-oss-20b",
                "qwen/qwen3.6-27b",
                "groq/compound",
                "groq/compound-mini"
            ];

            for (const modelName of supportedModels) {
                try {
                    const chatCompletion = await groq.chat.completions.create({
                        messages: messages,
                        model: modelName,
                        temperature: 0.3,
                        max_tokens: 1000,
                    });

                    let reply = chatCompletion.choices[0]?.message?.content;
                    if (reply) {
                        // Strip any internal reasoning or thinking tags
                        if (reply.includes('</think>')) {
                            reply = reply.split('</think>').pop();
                        } else if (reply.includes('<think>')) {
                            reply = reply.replace(/<think>[\s\S]*?<\/think>/g, '');
                        }
                        return res.json({ response: reply.trim() });
                    }
                } catch (groqModelError) {
                    console.warn(`Groq model ${modelName} error:`, groqModelError.message);
                }
            }
        }

        // 3. Fallback response if active APIs are unavailable
        return res.json({
            response: `Hemanth is a Full-Stack & AI/ML Engineer specializing in Python, FastAPI, React, and RAG architectures. Feel free to contact him directly at hemanthkumar40688@gmail.com or +91 9591903407!`
        });

    } catch (error) {
        console.error('Error processing chat request:', error);
        res.status(500).json({
            error: 'Failed to process request',
            details: error.message
        });
    }
});

if (require.main === module) {
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}

module.exports = app;
