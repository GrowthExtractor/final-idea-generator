exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const body = JSON.parse(event.body);
    const expertise = body.expertise;

    if (!expertise) {
        return { statusCode: 400, body: 'Expertise is required.' };
    }

    const apiKey = process.env.GOOGLE_API_KEY;

    const prompt = `Generate 3 distinct, compelling Email Delivered Course (EDC) ideas for someone who is an expert in "${expertise}".
For each idea, provide a concise title and a brief description (1-2 sentences) of what the course covers and its key benefit.
Format the output as a JSON array of objects, where each object has 'title' and 'description' keys.`;

    const payload = {
        contents: [{
            role: "user",
            parts: [{ text: prompt }]
        }],
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: "ARRAY",
                items: {
                    type: "OBJECT",
                    properties: {
                        "title": { "type": "STRING" },
                        "description": { "type": "STRING" }
                    },
                    required: ["title", "description"]
                }
            }
        }
    };

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Google API Error:", errorText);
            return { statusCode: response.status, body: `API error: ${errorText}` };
        }

        const result = await response.json();

        const ideasText = result.candidates[0].content.parts[0].text;

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: ideasText
        };

    } catch (error) {
        console.error("Invocation Error:", error);
        return { statusCode: 500, body: error.toString() };
    }
};
