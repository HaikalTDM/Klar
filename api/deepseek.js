export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const API_KEY = process.env.VITE_DEEPSEEK_API_KEY || 'sk-f3b9c1b3ed2541b294b72097f4dc1b18';

    try {
        const deepseekResponse = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify(req.body)
        });

        // Handle streaming response if requested
        if (req.body.stream) {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            // Pipe the stream directly
            const reader = deepseekResponse.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value);
                res.write(chunk);
            }
            res.end();
            return;
        }

        const data = await deepseekResponse.json();

        if (!deepseekResponse.ok) {
            return res.status(deepseekResponse.status).json(data);
        }

        return res.status(200).json(data);

    } catch (error) {
        console.error('DeepSeek Proxy Error:', error);
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
}
