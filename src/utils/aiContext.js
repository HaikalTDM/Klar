/**
 * AI Context Builder
 * Builds rich context from app state to send to DeepSeek
 */

/**
 * Build complete context object for AI
 * @param {object} params - App state parameters
 * @returns {object} Context object for AI
 */
export function buildAIContext({
    activeContext,
    tasks,
    contexts,
    focusState,
    focusLogs,
    user
}) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Count completed today
    const completedToday = tasks.filter(t => {
        if (!t.isDone || !t.completedAt) return false;
        const completedDate = t.completedAt.seconds
            ? new Date(t.completedAt.seconds * 1000)
            : new Date(t.completedAt);
        completedDate.setHours(0, 0, 0, 0);
        return completedDate.getTime() === today.getTime();
    }).length;

    // Get overdue tasks
    const now = new Date();
    const overdueTasks = tasks.filter(t => {
        if (t.isDone || !t.dueDate) return false;
        return new Date(t.dueDate) < now;
    });

    // Get upcoming tasks (next 7 days)
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    const upcomingTasks = tasks.filter(t => {
        if (t.isDone || !t.dueDate) return false;
        const due = new Date(t.dueDate);
        return due >= now && due <= weekFromNow;
    });

    // Calculate focus time today
    const focusTimeToday = focusLogs
        .filter(log => {
            const logDate = log.timestamp?.seconds
                ? new Date(log.timestamp.seconds * 1000)
                : new Date(log.date);
            logDate.setHours(0, 0, 0, 0);
            return logDate.getTime() === today.getTime();
        })
        .reduce((acc, log) => acc + (log.duration || 0), 0);

    return {
        contextName: activeContext?.name || 'No context selected',
        contextEmoji: activeContext?.emoji || '📋',
        isSharedContext: activeContext?.isShared || false,

        tasks: tasks.map(t => ({
            id: t.id,
            text: t.text,
            description: t.description,
            isDone: t.isDone,
            dueDate: t.dueDate,
            recurrence: t.recurrence
        })),

        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.isDone).length,
        pendingTasks: tasks.filter(t => !t.isDone).length,
        completedToday,

        overdueTasks: overdueTasks.map(t => ({ id: t.id, text: t.text, dueDate: t.dueDate })),
        upcomingTasks: upcomingTasks.map(t => ({ id: t.id, text: t.text, dueDate: t.dueDate })),

        focusState: {
            isRunning: focusState?.isRunning || false,
            remaining: focusState?.remaining || 0,
            taskId: focusState?.taskId || null,
            mode: focusState?.mode || 'Pomodoro',
            phase: focusState?.phase || 'focus'
        },

        focusTimeToday: Math.round(focusTimeToday / 60), // in minutes

        totalContexts: contexts?.length || 0,

        currentTime: new Date().toLocaleTimeString(),
        currentDate: new Date().toLocaleDateString(),
        dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timezoneOffset: new Date().getTimezoneOffset()
    };
}

/**
 * Get quick action suggestions based on context
 * @param {object} context - AI context object
 * @returns {array} Quick action suggestions
 */
export function getQuickActions(context) {
    const actions = [];

    // Always available
    actions.push({
        id: 'plan_day',
        label: '📅 Plan my day',
        prompt: 'Help me plan my day based on my current tasks and priorities.'
    });

    // If there are tasks
    if (context.pendingTasks > 0) {
        actions.push({
            id: 'prioritize',
            label: '🎯 Prioritize tasks',
            prompt: 'Help me prioritize my pending tasks. Which should I tackle first?'
        });
    }

    // If there are overdue tasks
    if (context.overdueTasks?.length > 0) {
        actions.push({
            id: 'handle_overdue',
            label: '⚠️ Handle overdue',
            prompt: `I have ${context.overdueTasks.length} overdue tasks. Help me decide what to do with them.`
        });
    }

    // If focus is not active
    if (!context.focusState.isRunning) {
        actions.push({
            id: 'start_focus',
            label: '🧠 What to focus on',
            prompt: 'What task should I focus on right now?'
        });
    }

    // Creative/brainstorm
    actions.push({
        id: 'ideas',
        label: '💡 Give me ideas',
        prompt: 'Give me some productivity tips or ideas for my current context.'
    });

    return actions.slice(0, 4); // Limit to 4 quick actions
}

/**
 * Handle conversational AI chat
 * @param {string} query - User question or command
 * @param {object} contextData - Raw app data to build context from
 */
import { askDeepSeek } from './nlp';

export async function handleAIChat(query, contextData) {
    const aiContext = buildAIContext(contextData);

    // Simplify context for token efficiency if needed, but context is small for now
    const contextSummary = {
        contextName: aiContext.contextName,
        tasks: aiContext.tasks.map(t => `${t.text} (${t.isDone ? 'Done' : 'Pending'}, ${t.priority || 'medium'})`).join('; '),
        stats: {
            overdue: aiContext.overdueTasks.length,
            upcoming: aiContext.upcomingTasks.length,
            focusTime: aiContext.focusTimeToday
        },
        focus: aiContext.focusState
    };

    const systemPrompt = `You are Klar AI, a productivity companion.
You have access to the user's current workspace context:
${JSON.stringify(contextSummary, null, 2)}

Instructions:
- Answer the user's query based strictly on this data.
- Be concise, motivating, and helpful.
- Use Markdown formatting.
- If asking for a summary, group tasks logically.
- If asking for advice, suggest based on overdue/focus status.`;

    const result = await askDeepSeek([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query }
    ]);

    return result || "I couldn't generate a response.";
}

export default { buildAIContext, getQuickActions, handleAIChat };
