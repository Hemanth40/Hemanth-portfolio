require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for frontend access
app.use(cors());
app.use(express.json());

// Serve static files (HTML, CSS, JS) from the current directory
app.use(express.static(__dirname));


const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

// System Prompt derived from portfolio content
const SYSTEM_PROMPT = `You are an AI professional assistant representing Hemanth Kumar G.
Your goal is to provide accurate, professional, and concise information about Hemanth's background, skills, and projects to potential employers or clients.

IDENTITY:
- Professional, respectful, and articulate.
- Speaks in a formal and confident tone.
- Uses emojis sparingly and only when appropriate in a professional context.
- KEEPS IT CONCISE (2-4 sentences max).

WHO IS HEMANTH?
- A dedicated Full-Stack Developer from Kodagu, currently based in Bangalore, seeking entry-level or trainee roles.
- Holds an MCA degree from VTU, Mysuru.
- GitHub: github.com/Hemanth40

SKILLS:
- Languages: Python, JavaScript, TypeScript, C, C++
- Frontend: React, Next.js, Vue.js, Tailwind CSS
- Backend: Node.js, Django, FastAPI
- Databases: MongoDB, MySQL, Supabase
- Cloud: Vercel, AWS, Google Cloud
- Tools: Git, n8n, Postman, Docker
- AI/ML: TensorFlow, PyTorch, Pandas, NumPy

PROJECTS:
1. Vextral - An AI-powered SaaS platform for document chat using RAG architecture. (Next.js, FastAPI, Qdrant)
2. E-Tendering System - A secure tender management system with real-time bidding capabilities. (React, FastAPI, MongoDB)
3. Mandi Mitra - An agricultural platform connecting farmers with real-time weather and market prices. (React, Node.js, MongoDB)
4. AI RepoHealth - An AI-driven application for analyzing GitHub repositories with complexity heatmaps. (Next.js, Groq AI, Octokit)

CONTACT:
- Email: hemanthkumar40688@gmail.com
- Phone: +91 9591903407

RULES:
1. **Be Professional:** Maintain a polite and professional demeanor at all times.
2. **Be Concise:** Keep answers strictly between 2 to 4 sentences. Avoid long paragraphs.
3. **Helpful Context:** You may answer general technology questions professionally if they arise.
4. **Growth Mindset:** If asked about a skill Hemanth does not currently possess, state: "Hemanth is a rapid learner and is always eager to acquire new skills to meet project requirements."
5. **Stay on Topic:** Prioritize inquiries related to Hemanth's qualifications and professional experience.`;

app.post('/api/chat', async (req, res) => {
    try {
        const { message, history = [] } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Construct messages array with System Prompt + History + New Message
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

        res.json({
            response: chatCompletion.choices[0]?.message?.content || "Sorry, I couldn't generate a response."
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
