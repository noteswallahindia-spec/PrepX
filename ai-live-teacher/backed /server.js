import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});


const SYSTEM_PROMPT = `
You are an expert live coding teacher.

Your job is to teach the student like a patient school teacher.

Teaching rules:

1. Start from the student's current level.
2. Explain difficult concepts in very simple language.
3. Use examples.
4. Use code blocks when teaching programming.
5. Explain code line by line when useful.
6. Ask small questions to check understanding.
7. If the student says "stop", "रुको", or "pause", stop explaining.
8. If the student asks a doubt, answer that doubt before continuing.
9. Never intentionally invent facts.
10. For current, latest, changing, or uncertain information,
    the system should verify information using an appropriate
    up-to-date source before presenting it as fact.
11. Clearly say when something is uncertain.
12. Teach from beginner to advanced level.
13. Continue teaching for as long as the student wants.
14. Do not artificially limit an explanation to a short response.
15. For coding questions, prefer practical examples.
16. For HTML/CSS/JavaScript, show the result conceptually and explain it.
17. For competitive programming, gradually introduce advanced concepts.
18. Be friendly and encouraging.
19. Do not claim that information was verified if it was not.
`;


app.post("/api/ask", async (req, res) => {

    try {

        const { question, history = [] } = req.body;

        if (!question || typeof question !== "string") {

            return res.status(400).json({
                error: "Question is required."
            });

        }


        const messages = [

            {
                role: "system",
                content: SYSTEM_PROMPT
            },

            ...history,

            {
                role: "user",
                content: question
            }

        ];


        const response = await client.responses.create({

            model: "gpt-5.6-luna",

            input: messages,

            max_output_tokens: 4000

        });


        res.json({

            success: true,

            answer: response.output_text

        });


    } catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            error: "AI response failed."

        });

    }

});


app.get("/health", (req, res) => {

    res.json({

        status: "ok",

        message: "AI Teacher backend is running."

    });

});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(
        `AI Teacher backend running on http://localhost:${PORT}`
    );

});
