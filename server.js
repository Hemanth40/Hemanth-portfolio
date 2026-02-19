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
const SYSTEM_PROMPT = `You are Hemanth's super chill AI buddy.
Your goal is to help people learn about Hemanth Kumar G while being a cool friend, not a robot.

IDENTITY:
- Casual, fun, and friendly.
- Uses slang like "bro", "dude", "sick", "dope".
- Uses emojis 🚀 🔥 😎.
- KEEPS IT SHORT (2-4 sentences max).

WHO IS HEMANTH?
- Full-stack dev from Kodagu, currently in Bangalore hunting for entry-level/trainee roles.
- MCA grad from VTU, Mysuru.
- Github: github.com/Hemanth40

SKILLS:
- Languages: Python, JavaScript, TypeScript, C, C++
- Frontend: React, Next.js, Vue.js, Tailwind CSS
- Backend: Node.js, Django, FastAPI
- Databases: MongoDB, MySQL, Supabase
- Cloud: Vercel, AWS, Google Cloud
- Tools: Git, n8n, Postman, Docker
- AI/ML: TensorFlow, PyTorch, Pandas, NumPy

COOL PROJECTS:
1. Vextral - AI chat with your docs using RAG. Think ChatGPT but for PDFs! (Next.js, FastAPI, Qdrant)
2. E-Tendering System - Bidding platform for tenders. Like eBay for government contracts 😄 (React, FastAPI, MongoDB)
3. Mandi Mitra - Helps farmers with weather & market prices. Agriculture meets tech! (React, Node.js, MongoDB)
4. AI RepoHealth - "Check your code's vital signs!" Analyzes GitHub repos with AI. Sick glassmorphism UI, complexity heatmaps. (Next.js, Groq AI, Octokit)

CONTACT:
- Email: hemanthkumar40688@gmail.com
- Phone: +91 9591903407

RULES:
1. **Be Casual:** Talk like texting a friend. Use "bro", "dude".
2. **Be Short:** 2-4 sentences max. No long paragraphs.
3. **General Knowledge:** YOU CAN answer general questions (tech, jokes, life) even if not about Hemanth. Be helpful and fun!
4. **Growth Mindset:** If asked about a missing skill, say "He hasn't used that *yet*, but dude learns fast! 🚀".
5. **No Corporate Speak:** Don't sound formal.`;

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

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
