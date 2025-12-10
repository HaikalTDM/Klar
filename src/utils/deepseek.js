/**
 * DeepSeek AI API Wrapper
 * Provides streaming chat completions with action-oriented responses
 */

// Use proxy in development to avoid CORS, direct URL in production
const DEEPSEEK_API_URL = import.meta.env.DEV
    ? '/api/deepseek/chat/completions'
    : 'https://api.deepseek.com/chat/completions';

// API Key from environment variable (set in .env.local)
const API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;

/**
 * System prompt that makes AI respond with structured, actionable outputs
 */
const SYSTEM_PROMPT = `You are Klar AI, a focused productivity assistant embedded in a task management app called Klar.

PERSONALITY:
- Extremely concise (max 2-3 sentences)
- Action-oriented, not chatty
- Encouraging but not cheesy

RESPONSE FORMAT:
Always respond with valid JSON in this exact format:
{
  "message": "Brief, friendly response",
  "actions": [
    {
      "type": "create_task" | "break_down" | "prioritize" | "schedule" | "tip",
      "data": { ... action-specific data ... }
    }
  ]
}

ACTION TYPES:
1. create_task: { "text": "Task name", "description": "optional", "subtasks": ["Subtask 1", "Subtask 2"], "dueDate": "optional ISO date in USER'S LOCAL TIMEZONE" }
2. break_down: { "subtasks": ["Subtask 1", "Subtask 2", ...] } (Creates separate tasks OR adds to context)
3. prioritize: { "order": ["task_id_1", "task_id_2", ...], "reasoning": "Brief reason" }
4. schedule: { "task_id": "id", "suggestedDate": "ISO date", "reasoning": "Why" }
5. tip: { "content": "Productivity tip or encouragement" }

RULES:
1. If user asks to break down a task, use break_down action
2. If user creates a complex task (e.g. "Plan trip with subtasks"), use create_task with "subtasks" array
3. If user just wants advice, use tip action
4. Always include at least one action in response
5. Keep message under 50 words
6. IMPORTANT: When generating dates/times, use the user's timezone from context. If user says "2 PM tomorrow", create ISO date for 2 PM in THEIR timezone, not UTC.
7. SMART TITLES: When the user describes a plan (e.g., "I'm going to Japan in 2026"), do NOT title the task "Plan trip". Instead, title it "Trip to Japan 2026". Infer specific, high-quality titles from the context.`;

/**
 * Send a chat completion request to DeepSeek API
 * @param {string} userMessage - User's input
 * @param {object} context - Current app context (tasks, focus state, etc.)
 * @param {boolean} stream - Whether to stream the response
 * @returns {Promise<object>} Parsed response with message and actions
 */
export async function chatCompletion(userMessage, context = {}, stream = false) {
    if (!API_KEY) {
        throw new Error('AI feature is not configured. Please contact support.');
    }

    const contextString = buildContextString(context);

    const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'system', content: `CURRENT CONTEXT: \n${contextString}` },
        { role: 'user', content: userMessage }
    ];

    const response = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY} `
        },
        body: JSON.stringify({
            model: 'deepseek-chat',
            messages,
            stream,
            temperature: 0.7,
            max_tokens: 1000
        })
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || `API Error: ${response.status} `);
    }

    if (stream) {
        return response.body; // Return readable stream for streaming UI
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    return parseAIResponse(content);
}

/**
 * Parse AI response and extract structured data
 */
function parseAIResponse(content) {
    try {
        // Try to parse as JSON directly
        const parsed = JSON.parse(content);
        return {
            message: parsed.message || 'Here\'s what I found.',
            actions: parsed.actions || []
        };
    } catch (e) {
        // If not valid JSON, extract message and return empty actions
        console.warn('AI response not valid JSON:', content);
        return {
            message: content.slice(0, 200),
            actions: []
        };
    }
}

/**
 * Build context string from app state
 */
function buildContextString(context) {
    const lines = [];

    if (context.contextName) {
        lines.push(`Current context: ${context.contextName} `);
    }

    if (context.tasks && context.tasks.length > 0) {
        const taskList = context.tasks
            .slice(0, 10) // Limit to 10 tasks
            .map((t, i) => `${i + 1}.[${t.isDone ? 'x' : ' '}] ${t.text}${t.dueDate ? ` (due: ${new Date(t.dueDate).toLocaleDateString()})` : ''} `)
            .join('\n');
        lines.push(`Tasks: \n${taskList} `);
    } else {
        lines.push('Tasks: No tasks yet');
    }

    if (context.focusState) {
        const { isRunning, remaining, taskId } = context.focusState;
        if (taskId) {
            lines.push(`Focus: ${isRunning ? 'Active' : 'Paused'}, ${Math.floor(remaining / 60)}min remaining`);
        }
    }

    if (context.completedToday !== undefined) {
        lines.push(`Completed today: ${context.completedToday} tasks`);
    }

    // Add current date/time for relative date resolution
    const now = new Date();
    lines.push(`Current Date / Time: ${now.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    })
        } (User's Local Time)`);

    return lines.join('\n');
}

/**
 * Stream chat completion with callback for each chunk
 * @param {string} apiKey
 * @param {string} userMessage
 * @param {object} context
 * @param {function} onChunk - Callback for each text chunk
 * @returns {Promise<object>} Final parsed response
 */
export async function streamChatCompletion(userMessage, context, onChunk) {
    const stream = await chatCompletion(userMessage, context, true);
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

        for (const line of lines) {
            const data = line.slice(6); // Remove 'data: ' prefix
            if (data === '[DONE]') continue;

            try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content || '';
                if (content) {
                    fullContent += content;
                    onChunk(content);
                }
            } catch (e) {
                // Ignore parse errors for incomplete chunks
            }
        }
    }

    return parseAIResponse(fullContent);
}

export default { chatCompletion, streamChatCompletion };
