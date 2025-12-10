import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, X, Send, Loader2, Calendar, ListChecks,
    Lightbulb, Target, AlertCircle, Plus, ChevronRight
} from 'lucide-react';

/**
 * AI Action Card - Renders actionable responses from AI
 */
export const AIActionCard = ({ action, onExecute, themeMode }) => {
    const iconMap = {
        create_task: Plus,
        break_down: ListChecks,
        prioritize: Target,
        schedule: Calendar,
        tip: Lightbulb
    };

    const Icon = iconMap[action.type] || Lightbulb;

    const renderActionContent = () => {
        switch (action.type) {
            case 'break_down':
                return (
                    <div className="space-y-2">
                        <p className="text-xs opacity-60 uppercase font-bold">Suggested Subtasks</p>
                        {action.data.subtasks?.map((subtask, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${themeMode === 'custom' ? 'border-[var(--border-color)]' : 'border-slate-300 dark:border-slate-600'}`}>
                                    <Plus size={12} className="opacity-40" />
                                </div>
                                <span>{subtask}</span>
                            </div>
                        ))}
                        <button
                            onClick={() => onExecute(action)}
                            className={`w-full mt-3 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${themeMode === 'custom' ? 'bg-[var(--accent-color)] text-[var(--card-bg)] hover:brightness-110' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800'}`}
                        >
                            <Plus size={14} /> Add All Subtasks
                        </button>
                    </div>
                );

            case 'create_task':
                return (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <Plus size={14} />
                            <span>{action.data.text}</span>
                        </div>
                        {action.data.description && (
                            <p className="text-xs opacity-60">{action.data.description}</p>
                        )}
                        {action.data.subtasks && action.data.subtasks.length > 0 && (
                            <div className="pt-2">
                                <p className="text-[10px] opacity-60 uppercase font-bold mb-1">Subtasks</p>
                                {action.data.subtasks.map((sub, i) => (
                                    <div key={i} className="flex items-center gap-2 text-xs opacity-80">
                                        <div className="w-1 h-1 rounded-full bg-current" />
                                        <span className="truncate">{typeof sub === 'string' ? sub : sub.text}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        <button
                            onClick={() => onExecute(action)}
                            className={`w-full mt-2 py-2 rounded-lg text-sm font-bold transition-all ${themeMode === 'custom' ? 'bg-[var(--accent-color)] text-[var(--card-bg)]' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'}`}
                        >
                            Create Task
                        </button>
                    </div>
                );

            case 'prioritize':
                return (
                    <div className="space-y-2">
                        <p className="text-xs opacity-60 uppercase font-bold">Recommended Order</p>
                        {action.data.order?.slice(0, 5).map((item, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${themeMode === 'custom' ? 'bg-[var(--accent-color)] text-[var(--card-bg)]' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'}`}>
                                    {i + 1}
                                </span>
                                <span className="truncate">{typeof item === 'string' ? item : item.text}</span>
                            </div>
                        ))}
                        {action.data.reasoning && (
                            <p className="text-xs opacity-60 mt-2 italic">{action.data.reasoning}</p>
                        )}
                    </div>
                );

            case 'tip':
                return (
                    <div className="flex gap-3">
                        <Lightbulb size={16} className="flex-shrink-0 mt-0.5 text-amber-500" />
                        <p className="text-sm">{action.data.content}</p>
                    </div>
                );

            default:
                return <p className="text-sm opacity-60">Unknown action type</p>;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl border ${themeMode === 'custom' ? 'bg-[var(--card-bg)] border-[var(--border-color)]' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}
        >
            {renderActionContent()}
        </motion.div>
    );
};

/**
 * AI Command Bar - Spotlight-style AI interface
 */
export const AICommandBar = ({
    show,
    onClose,
    context,
    quickActions,
    onSendMessage,
    onExecuteAction,
    themeMode,
    customTheme
}) => {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [response, setResponse] = useState(null);
    const [error, setError] = useState(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (show && inputRef.current) {
            inputRef.current.focus();
        }
        if (!show) {
            setInput('');
            setResponse(null);
            setError(null);
        }
    }, [show]);

    const handleSubmit = async (e, customPrompt = null) => {
        if (e) e.preventDefault();
        const message = customPrompt || input.trim();
        if (!message) return;

        // API key validation is done in deepseek.js now
        setIsLoading(true);
        setError(null);
        setResponse(null);

        try {
            const result = await onSendMessage(message);
            setResponse(result);
            if (!customPrompt) setInput('');
        } catch (err) {
            setError(err.message || 'Failed to get AI response');
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuickAction = (action) => {
        handleSubmit(null, action.prompt);
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-24">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: -20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: -20 }}
                className={`relative w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden ring-1 ring-slate-900/5 dark:ring-white/10 ${themeMode === 'custom' ? 'bg-[var(--card-bg)] text-[var(--text-color)] border border-[var(--border-color)]' : 'bg-white dark:bg-slate-900'}`}
            >
                {/* Header */}
                <div className={`flex items-center gap-3 px-5 py-4 border-b ${themeMode === 'custom' ? 'border-[var(--border-color)]' : 'border-slate-100 dark:border-slate-800'}`}>
                    <Sparkles size={20} className={themeMode === 'custom' ? 'text-[var(--accent-color)]' : 'text-violet-500'} />
                    <span className="font-bold">Klar AI</span>
                    <div className="flex-1" />
                    <div className="text-xs font-mono opacity-40 border rounded px-1.5 py-0.5">ESC</div>
                    <button onClick={onClose} className="opacity-50 hover:opacity-100">
                        <X size={18} />
                    </button>
                </div>

                {/* Input */}
                <form onSubmit={handleSubmit} className="p-4">
                    <div className="relative">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="What would you like to do?"
                            disabled={isLoading}
                            className={`w-full h-12 pl-4 pr-12 rounded-xl border text-sm focus:ring-0 transition-colors ${themeMode === 'custom' ? 'bg-transparent border-[var(--border-color)] focus:border-[var(--accent-color)]' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-slate-400'}`}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className={`absolute right-2 top-2 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${input.trim() ? (themeMode === 'custom' ? 'bg-[var(--accent-color)] text-[var(--card-bg)]' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900') : 'opacity-30'}`}
                        >
                            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={14} />}
                        </button>
                    </div>
                </form>

                {/* Quick Actions */}
                {!response && !isLoading && !error && quickActions && quickActions.length > 0 && (
                    <div className={`px-4 pb-4 border-t ${themeMode === 'custom' ? 'border-[var(--border-color)]' : 'border-slate-100 dark:border-slate-800'}`}>
                        <p className="text-xs opacity-50 uppercase font-bold mt-3 mb-2">Quick Actions</p>
                        <div className="grid grid-cols-2 gap-2">
                            {quickActions.map((action) => (
                                <button
                                    key={action.id}
                                    onClick={() => handleQuickAction(action)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${themeMode === 'custom' ? 'hover:bg-white/5 border border-[var(--border-color)]' : 'hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'}`}
                                >
                                    <span>{action.label}</span>
                                    <ChevronRight size={14} className="opacity-40 ml-auto" />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Loading */}
                {isLoading && (
                    <div className="px-4 pb-4 flex items-center gap-3 text-sm opacity-60">
                        <Loader2 size={16} className="animate-spin" />
                        <span>Thinking...</span>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="px-4 pb-4">
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 text-red-500 text-sm">
                            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    </div>
                )}

                {/* Response */}
                {response && (
                    <div className="px-4 pb-4 space-y-3 max-h-[400px] overflow-y-auto">
                        {/* AI Message */}
                        <div className={`p-3 rounded-lg text-sm ${themeMode === 'custom' ? 'bg-white/5' : 'bg-slate-50 dark:bg-slate-800'}`}>
                            <div className="flex items-start gap-2">
                                <Sparkles size={14} className={`flex-shrink-0 mt-1 ${themeMode === 'custom' ? 'text-[var(--accent-color)]' : 'text-violet-500'}`} />
                                <p>{response.message}</p>
                            </div>
                        </div>

                        {/* Actions */}
                        {response.actions?.map((action, i) => (
                            <AIActionCard
                                key={i}
                                action={action}
                                onExecute={(a) => {
                                    if (onExecuteAction) {
                                        onExecuteAction(a);
                                        setResponse(null);
                                        onClose();
                                    }
                                }}
                                themeMode={themeMode}
                            />
                        ))}
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default AICommandBar;
