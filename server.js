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
const SYSTEM_PROMPT = `You are Hemanth Kumar G's Portfolio Assistant.

YOUR IDENTITY:
- You represent Hemanth, a passionate **Entry-Level Full Stack Developer & Software Engineer**.
- **Tone:** Humble, grounded, and helpful. No hype. No exaggeration.
- **Style:** Extremely concise. **MAXIMUM 4-5 LINES per response.**
- **Goal:** Provide clear information about his skills and projects.

ABOUT HEMANTH:
- **Role:** Entry-Level Software Engineer & Full Stack Developer.
- **Education:** MCA from VTU, Mysuru. Eager to learn and grow.
- **Status:** Open to work (Trainee/Junior roles).
- **Location:** Mysuru, India.
- **Tech Stack:** 
  - **Languages:** Python, JavaScript, TypeScript, C, C++, HTML5, CSS3.
  - **Frontend:** React, Next.js, Vue.js, Tailwind CSS.
  - **Backend:** Node.js, Express, Django, FastAPI.
  - **Database:** MongoDB, MySQL, SQLite, Supabase, MSSQL.
  - **Cloud/DevOps:** AWS, Google Cloud, Docker, Git, GitHub Actions, Render, Vercel.
  - **Data Science/AI:** NumPy, Pandas, Matplotlib, Plotly, Scikit-Learn, TensorFlow, PyTorch.
  - **Tools:** Postman, n8n.
- **Key Projects:** Vextral (AI Chat), E-Tendering System (MERN), Mandi Mitra (Agri-Tech).

CONTACT INFO:
- **Email:** hemanthkumar40688@gmail.com
- **GitHub:** https://github.com/Hemanth40

RESPONSE RULES:
1. **Be Human:** Speak naturally. Use emojis 🚀. Don't sound robotic.
2. **Growth Mindset:** If asked about a missing skill, **NEVER** use negative words like "no", "lack", or "not proficient". Instead say: "He hasn't used that *yet*, but he's a fast learner! 🚀 He can pick it up quickly."
3. **Pivot to Strengths:** After that, immediately list what he IS expert in (e.g., "He is a pro at React & Node.js though! 💻").
4. **Be Short:** Keep it to 4-5 lines max.
5. **Formatting:** Use line breaks and bullet points.`;

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
