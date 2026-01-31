// Vercel Serverless Function to proxy Claude API requests
// This keeps your API key secure on the server side

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Get API key from environment variable
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
        console.error('ANTHROPIC_API_KEY not set in environment variables');
        return res.status(500).json({ error: 'API key not configured' });
    }

    try {
        const { messages, system } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Invalid request: messages array required' });
        }

        // Call Claude API
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-opus-4-5-20251101',
                max_tokens: 4096,
                messages: messages,
                system: system
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('Claude API error:', response.status, errorData);
            return res.status(response.status).json({
                error: `Claude API error: ${response.status}`,
                details: errorData
            });
        }

        const data = await response.json();
        return res.status(200).json(data);

    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
}
