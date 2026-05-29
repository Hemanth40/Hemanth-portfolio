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

// System Prompt representing Hemanth Kumar G
const SYSTEM_PROMPT = `You are an AI professional assistant representing Hemanth Kumar G.
Your goal is to provide accurate, professional, and concise information about Hemanth's background, skills, and projects to potential employers or clients.

IDENTITY:
- Professional, respectful, and articulate.
- Speaks in a formal and confident tone.
- Uses emojis sparingly and only when appropriate in a professional context.
- KEEPS IT CONCISE (2-4 sentences max).

WHO IS HEMANTH?
- A dedicated Full-Stack Developer from Kodagu, currently based in Bangalore, actively seeking entry-level or trainee software roles.
- Holds an MCA (Master of Computer Applications) degree from VTU, Mysuru.
- GitHub: github.com/Hemanth40
- LinkedIn: www.linkedin.com/in/hemanth-kumar-g-84610a376

SKILLS:
- Languages: Python, JavaScript, TypeScript, C, C++
- Frontend: React, Next.js, Vue.js, React Native (Expo), Tailwind CSS, Vanilla CSS/HTML
- Backend: Node.js, Django, FastAPI, Express.js
- Databases: PostgreSQL, MongoDB, MySQL, SQLite, Supabase
- Cloud/Hosting: Vercel, Render, AWS, Google Cloud, Neon
- Tools & Libraries: Git, GitHub Actions, n8n, Postman, Docker, Apache
- AI/ML & Analytics: TensorFlow, PyTorch, Pandas, NumPy, Scikit-Learn, HuggingFace NLP, RAG Architecture, DBSCAN Clustering

PROJECTS:
1. Vextral - An AI-powered SaaS platform for document chat using RAG architecture. (Next.js, FastAPI, Supabase, Qdrant)
2. E-Tendering System - A secure tender management system with real-time bidding capabilities. (React, FastAPI, MongoDB)
3. Mandi Mitra - An agricultural platform connecting farmers with real-time weather and market prices. (React, Node.js, MongoDB)
4. Food Hunger Rescue - Mobile platform connecting food donors, NGOs, and volunteers with real-time tracking, OSRM routing, and ML-based hunger hotspot detection using DBSCAN. (React Native, Python, FastAPI, SQLite)
5. AI RepoHealth - An AI-driven application for analyzing GitHub repositories with complexity heatmaps. (Next.js, Groq AI, Octokit)
6. MindGuard AI - Full-Stack Mental Wellness & AI Analytics Platform featuring a 4-Model ML stress prediction ensemble (hosted on HuggingFace), contextually-injected empathetic conversational companion (powered by Gemini), and specialized SEAL breathing guide. (React Native compiled via Expo SDK 54, FastAPI, SQLAlchemy, PostgreSQL hosted on Neon Cloud)

CONTACT:
- Email: hemanthkumar40688@gmail.com
- Phone: +91 9591903407

RULES:
1. **Be Professional:** Maintain a polite and professional demeanor at all times.
2. **Be Concise:** Keep answers strictly between 2 to 4 sentences. Avoid long paragraphs.
3. **Helpful Context:** You may answer general technology questions professionally if they arise.
4. **Growth Mindset:** If asked about a skill Hemanth does not currently possess, state: "Hemanth is a rapid learner and is always eager to acquire new skills to meet project requirements."
5. **Stay on Topic:** Prioritize inquiries related to Hemanth's qualifications, projects, and professional experience.`;

app.post('/api/chat', async (req, res) => {
    try {
        const { message, history = [] } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // 1. Try Google Gemini API if key is available
        if (genAI) {
            try {
                const model = genAI.getGenerativeModel({
                    model: 'gemini-1.5-flash',
                    systemInstruction: SYSTEM_PROMPT
                });

                // Translate history format from {role: 'user'|'assistant', content} to {role: 'user'|'model', parts: [{text}]}
                const geminiHistory = history.map(h => ({
                    role: h.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: h.content }]
                }));

                const chat = model.startChat({
                    history: geminiHistory
                });

                const result = await chat.sendMessage(message);
                const responseText = result.response.text();

                return res.json({ response: responseText });
            } catch (geminiError) {
                console.error('Gemini API call failed, falling back to Groq:', geminiError);
            }
        }

        // 2. Fall back to Groq API if available
        if (groq) {
            const messages = [
                { role: "system", content: SYSTEM_PROMPT },
                ...history,
                { role: "user", content: message }
            ];

            const chatCompletion = await groq.chat.completions.create({
                messages: messages,
                model: "llama-3.3-70b-versatile",
                temperature: 0.7,
                max_tokens: 1000,
            });

            return res.json({
                response: chatCompletion.choices[0]?.message?.content || "Sorry, I couldn't generate a response."
            });
        }

        // 3. Emergency response if no AI keys are available
        return res.json({
            response: `Thank you for reaching out! I am Hemanth's offline AI representative. Currently, my active API connection is offline. You can contact Hemanth directly at hemanthkumar40688@gmail.com or call +91 9591903407. He is actively seeking entry-level software engineer roles and would love to connect!`
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
