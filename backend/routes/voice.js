const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Ensure API key is loaded (ideally from .env)
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.warn("GEMINI_API_KEY not found in environment variables. Voice analysis will fail.");
}
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
// Use a current model name like gemini-1.5-flash-latest
const model = genAI ? genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" }) : null;

// POST /analyze-voice - Analyze transcribed text with Gemini
router.post('/', async (req, res) => {
    const { transcript } = req.body;

    if (!genAI || !model) {
        return res.status(503).json({ error: 'Gemini API not configured or key missing.' });
    }

    if (!transcript) {
        return res.status(400).json({ error: 'Missing transcript field in request body.' });
    }

    // Construct the prompt for Gemini
    const prompt = `
        Analyze the following transcribed text from a personal finance voice entry.
        Extract the key details and return them as a JSON object with the following fields:
        - type: "expense" or "income" (required)
        - name: A short title for the entry (required)
        - category: A relevant category (e.g., "Groceries", "Salary", "Utilities", "Freelance", "Entertainment"). If unsure, use "Other".
        - description: Any additional details mentioned.
        - amount: The numeric value of the transaction (required).

        If any required field (type, name, amount) cannot be determined, return an error structure: {"error": "Could not extract required fields."}

        Respond ONLY with the valid JSON object or the error JSON. Do not include any other text or explanations.

        Transcript: "${transcript}"

        JSON Output:
    `;

    try {
        console.log("Sending prompt to Gemini:", transcript); // Log for debugging
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        console.log("Gemini raw response:", text); // Log for debugging

        // Clean the response to ensure it's valid JSON
        text = text.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '');

        // Attempt to parse the JSON response
        let parsedData;
        try {
            parsedData = JSON.parse(text);
        } catch (parseError) {
            console.error("Error parsing Gemini JSON response:", parseError);
            console.error("Raw text received:", text);
            // Attempt a more lenient parse if possible, or return error
             try {
                // A common issue is Gemini adding comments or trailing commas
                // This is a basic attempt to fix simple issues, might need refinement
                const fixedText = text.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
                parsedData = JSON.parse(fixedText);
            } catch (retryParseError) {
                 console.error("Retry parsing failed:", retryParseError);
                 return res.status(500).json({ error: 'Failed to parse response from AI analysis.', rawResponse: text });
            }
        }


        // Validate required fields from Gemini's response
        if (parsedData.error) {
             return res.status(400).json({ error: parsedData.error });
        }
        if (!parsedData.type || !parsedData.name || parsedData.amount === undefined || parsedData.amount === null) {
             console.error("Missing required fields in parsed data:", parsedData);
            return res.status(500).json({ error: 'AI analysis did not return all required fields (type, name, amount).', data: parsedData });
        }
         if (typeof parsedData.amount !== 'number' || parsedData.amount <= 0) {
             console.error("Invalid amount in parsed data:", parsedData);
            return res.status(400).json({ error: 'AI analysis returned an invalid amount.', data: parsedData });
        }


        console.log("Successfully parsed data:", parsedData);
        res.json(parsedData);

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        res.status(500).json({ error: 'Error during AI analysis.' });
    }
});

module.exports = router;
