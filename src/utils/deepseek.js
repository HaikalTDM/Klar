/**
 * DeepSeek AI API Wrapper
 * Provides streaming chat completions with action-oriented responses
 */

// Use proxy in development to avoid CORS, direct URL in production
const DEEPSEEK_API_URL = '/api/deepseek';

// API Key - tries env var first, falls back to provided key
const API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY || 'sk-f3b9c1b3ed2541b294b72097f4dc1b18';

/**
 * System prompt that makes AI respond with structured, actionable outputs
 */
const SYSTEM_PROMPT = `You are Klar AI, a "PAL" (Personal Active Learner) embedded in a task app.

GOAL: Provide "Smart Suggestions" to get things done. Analyze tasks to identify their *Category* (e.g., Birthday, Grocery, Movie, Project) and suggest specific *Actions*.

RESPONSE FORMAT:
{
  "message": "Brief insight (e.g., 'Found a birthday and some groceries.')",
  "actions": [
    {
      "type": "enhance_task" | "create_task" | "break_down" | "schedule",
      "data": { ... }
    }
  ]
}

ACTION TYPES:
1. enhance_task: { "text": "Original Task Text", "category": "Birthday"|"Movie"|"Grocery"|"Event", "suggestion": "Specific action (e.g. 'Set yearly reminder' or 'Add to shopping list')", "autoApply": { "recurrence": "yearly" | "none", "dueDate": "ISOString" } }
   -> Use this when you see an item that fits a category but needs details (e.g. "John's Birthday" -> Category: Birthday, Suggestion: "Set yearly reminder").
2. create_task: { "text": "New Task", "category": "General", "description": "optional" }
3. break_down: { "subtasks": ["Step 1", "Step 2"] }
4. schedule: { "task_id": "id", "suggestedDate": "ISO date", "reasoning": "Reason" }
5. tip: { "content": "General advice" }

RULES:
- Be concise.
- If you see a date mentioned (e.g. "Birthday on June 21"), calculate the proper ISO date for the NEXT occurrence relative to user's current time.
- Identify "Smart Types":
  - "Buy milk" -> Category: Grocery. Suggestion: "Add to Grocery List" (create a subtask or note).
  - "Watch Dune" -> Category: Movie. Suggestion: "Schedule specifically for Friday night".
  - "Mom's Birthday" -> Category: Birthday. Suggestion: "Set yearly recurrence".`;

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
    // Clean potential markdown code blocks
    const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();

    try {
        // Try to parse as JSON directly
        const parsed = JSON.parse(cleanContent);
        return {
            message: parsed.message || 'Here\'s what I found.',
            actions: parsed.actions || []
        };
    } catch (e) {
        // If not valid JSON, try to salvage the message using Regex
        console.warn('AI response not valid JSON:', content);

        const messageMatch = cleanContent.match(/"message":\s*"([^"]+)"/);
        const fallbackMessage = messageMatch ? messageMatch[1] : "I analyzed your tasks but couldn't format the response perfectly. Please try again.";

        return {
            message: fallbackMessage,
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
