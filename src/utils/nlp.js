
const API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY || 'sk-f3b9c1b3ed2541b294b72097f4dc1b18';
const DEEPSEEK_API_URL = '/api/deepseek';

// Helper for generic chat
export async function askDeepSeek(messages, temperature = 0.7) {
    try {
        const response = await fetch(DEEPSEEK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: messages,
                temperature: temperature
            })
        });

        if (!response.ok) throw new Error(`API Error: ${response.status}`);

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error("DeepSeek API Error:", error);
        return null;
    }
}

export async function parseVoiceCommand(transcript, contexts = [], activeContextId = null) {
    if (!transcript.trim()) return null;

    const contextList = contexts.map(c => `- ${c.name} (ID: ${c.id})`).join('\n');
    const today = new Date();

    const systemPrompt = `You are a smart assistant for a task app named Klar.
Your goal is to extract the USER INTENT from a voice command.
Always return a raw JSON object. No markdown.

Current Context ID: ${activeContextId || 'None'}
Current Date: ${today.toISOString()} (${today.toLocaleDateString('en-US', { weekday: 'long' })})

Available Contexts:
${contextList}

Supported Intents:
1. create_task
   - text: (string) The task title.
   - priority: (string) "high", "medium", "low". Default to "medium" unless specified.
   - contextId: (string) The matching ID from the list. If not specified, use "${activeContextId}".
   - date: (string) ISO date (YYYY-MM-DD) for due date. Resolve relative dates like "tomorrow".
   - time: (string) HH:mm (24h format) if specified.

2. navigate
   - contextId: (string) Target context ID.

3. unknown
   - error: (string) Reason why command is unclear.

Examples:
"Add a high priority task to buy milk tomorrow in Personal"
-> { "intent": "create_task", "text": "Buy milk", "priority": "high", "date": "2025-12-13", "contextId": "123..." }

"Go to Work"
-> { "intent": "navigate", "contextId": "456..." }

Input: "${transcript}"`;

    const content = await askDeepSeek([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: transcript }
    ], 0.1);

    if (!content) return { intent: "unknown", error: "Connection failed" };

    try {
        const cleaned = content.replace(/```json\n?|\n?```/g, '').trim();
        return JSON.parse(cleaned);
    } catch (e) {
        console.error("JSON Parse Error", e);
        return { intent: "unknown", error: "Failed to parse response" };
    }
}
