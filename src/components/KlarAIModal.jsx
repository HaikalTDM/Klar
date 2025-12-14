import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, AlertCircle, Loader2, ArrowRight, Command, MessageSquare, Zap, Layers, ChevronLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { parseVoiceCommand, askDeepSeek } from '../utils/nlp';
import { handleAIChat, getQuickActions, buildAIContext } from '../utils/aiContext';

export default function KlarAIModal({ show, onClose, onCommand, contexts, activeContextId, user, tasks, focusState, focusLogs }) {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState([]); // Chat history
    const [mode, setMode] = useState('chat'); // 'chat' or 'command'
    const inputRef = useRef(null);
    const listRef = useRef(null);

    // Focus input on open
    useEffect(() => {
        if (show && inputRef.current) {
            setTimeout(() => inputRef.current.focus(), 50);
        }
    }, [show]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
        }
    }, [messages]);

    const handleKeyDown = async (e) => {
        if (e.key === 'Enter' && input.trim()) {
            e.preventDefault();
            handleSubmit();
        }
        if (e.key === 'Escape') {
            onClose();
        }
    };

    const handleSubmit = async (textOverride = null) => {
        const text = (typeof textOverride === 'string' ? textOverride : input);
        if (!text.trim()) return;

        if (!textOverride) setInput('');

        // Add User Message
        const userMsg = { role: 'user', content: text };
        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);

        try {
            // Check for Slash Commands
            if (text.startsWith('/task ')) {
                // Parse as strict task command
                const commandText = text.replace('/task ', '');
                const intent = await parseVoiceCommand(commandText, contexts, activeContextId);

                if (intent && intent.intent === 'create_task') {
                    onCommand(intent); // Execute in App
                    setMessages(prev => [...prev, { role: 'system', content: `✅ Created task: "${intent.text}"` }]);
                } else {
                    setMessages(prev => [...prev, { role: 'error', content: "Could not parse task details." }]);
                }
            }
            else if (text.startsWith('/navigate ')) {
                // Navigation
                const target = text.replace('/navigate ', '');
                const ctx = contexts.find(c => c.name.toLowerCase().includes(target.toLowerCase()));
                if (ctx) {
                    onCommand({ intent: 'navigate', contextId: ctx.id });
                    setMessages(prev => [...prev, { role: 'system', content: `Creating route to ${ctx.name}...` }]);
                    setTimeout(onClose, 1000);
                } else {
                    setMessages(prev => [...prev, { role: 'error', content: "Context not found." }]);
                }
            }
            else {
                // Generative Chat
                const response = await handleAIChat(text, {
                    activeContext: contexts.find(c => c.id === activeContextId),
                    tasks,
                    contexts,
                    focusState,
                    focusLogs,
                    user
                });

                // Add AI Message
                setMessages(prev => [...prev, { role: 'ai', content: response }]);
            }

        } catch (e) {
            console.error(e);
            setMessages(prev => [...prev, { role: 'error', content: "Something went wrong." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const suggestions = React.useMemo(() => {
        if (!contexts || !activeContextId) return [];
        const ctxData = {
            activeContext: contexts.find(c => c.id === activeContextId),
            tasks, contexts, focusState, focusLogs, user
        };
        return getQuickActions(buildAIContext(ctxData));
    }, [contexts, activeContextId, tasks, focusState, focusLogs]);

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />



            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                transition={{ duration: 0.2 }}
                className="relative w-full max-w-2xl bg-[#1e1e1e] border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden flex flex-col max-h-[70vh]"
            >
                {/* Header / Input Area */}
                <div className="p-4 border-b border-white/10 bg-white/5 flex items-center gap-3">
                    {messages.length > 0 ? (
                        <button
                            onClick={() => { setMessages([]); setInput(''); inputRef.current?.focus(); }}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                            title="Back to Command Center"
                        >
                            <ChevronLeft size={20} />
                        </button>
                    ) : (
                        <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                            <Sparkles size={20} />
                        </div>
                    )}
                    <input
                        ref={inputRef}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask AI or type '/task'..."
                        className="flex-1 bg-transparent text-lg text-white placeholder-white/30 outline-none"
                    />
                    <div className="flex items-center gap-2 text-xs text-white/30 font-mono">
                        <kbd className="px-2 py-1 rounded bg-white/10">↵</kbd>
                        <span>to send</span>
                    </div>
                </div>

                {/* Chat History */}
                <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] scrollbar-hide">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-8 px-4 text-center text-white/50 w-full animate-in fade-in duration-500">
                            <div className="bg-white/5 p-4 rounded-2xl mb-6 shadow-xl shadow-indigo-500/10 border border-white/5">
                                <Sparkles size={32} className="text-indigo-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">Klar AI Command Center</h2>
                            <p className="text-sm mb-8 max-w-sm mx-auto leading-relaxed">
                                Your personal productivity intelligence. Use <span className="text-indigo-400 font-mono">/</span> commands to act or ask questions to get insights.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg text-left">
                                {/* Commands */}
                                <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors group/card">
                                    <div className="flex items-center gap-2 mb-3 text-indigo-400 font-semibold text-[10px] uppercase tracking-wider">
                                        <Command size={12} /> Actions
                                    </div>
                                    <div className="space-y-2">
                                        <button onClick={() => { setInput('/task '); inputRef.current?.focus(); }} className="w-full text-left px-3 py-3 rounded-lg bg-black/20 hover:bg-indigo-500/20 transition-all flex items-center justify-between group">
                                            <div className="flex flex-col">
                                                <span className="text-sm text-white/90 mb-0.5"><span className="text-indigo-400 font-mono font-bold">/task</span> [details]</span>
                                                <span className="text-[11px] text-white/40 group-hover:text-indigo-300/70 transition-colors">Create new task with priority & date</span>
                                            </div>
                                            <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover:translate-x-0 group-hover:opacity-100 transition-all text-indigo-400" />
                                        </button>
                                        <button onClick={() => { setInput('/navigate '); inputRef.current?.focus(); }} className="w-full text-left px-3 py-3 rounded-lg bg-black/20 hover:bg-indigo-500/20 transition-all flex items-center justify-between group">
                                            <div className="flex flex-col">
                                                <span className="text-sm text-white/90 mb-0.5"><span className="text-indigo-400 font-mono font-bold">/navigate</span> [context]</span>
                                                <span className="text-[11px] text-white/40 group-hover:text-indigo-300/70 transition-colors">Switch between Work, Personal, etc.</span>
                                            </div>
                                            <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover:translate-x-0 group-hover:opacity-100 transition-all text-indigo-400" />
                                        </button>
                                    </div>
                                </div>

                                {/* Dynamic Insights from AI Context */}
                                <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors group/card">
                                    <div className="flex items-center gap-2 mb-3 text-emerald-400 font-semibold text-[10px] uppercase tracking-wider">
                                        <MessageSquare size={12} /> Insights
                                    </div>
                                    <div className="space-y-2">
                                        {suggestions.map(action => (
                                            <button
                                                key={action.id}
                                                onClick={() => handleSubmit(action.prompt)}
                                                className="w-full text-left px-3 py-2.5 rounded-lg bg-black/20 hover:bg-emerald-500/10 text-sm text-white/80 transition-colors flex items-center justify-between group"
                                            >
                                                <span>{action.label}</span>
                                                <Sparkles size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-400" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {messages.map((msg, idx) => (
                        <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role !== 'user' && (
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${msg.role === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                                    {msg.role === 'error' ? <AlertCircle size={16} /> : <Sparkles size={16} />}
                                </div>
                            )}
                            <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-sm leading-relaxed ${msg.role === 'user'
                                ? 'bg-indigo-600 text-white rounded-br-none'
                                : 'bg-white/5 text-slate-200 rounded-tl-none border border-white/5'
                                }`}>
                                {msg.role !== 'user' ? (
                                    <div className="markdown-body text-sm leading-relaxed text-slate-200">
                                        <ReactMarkdown
                                            components={{
                                                p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                                ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
                                                ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-2 space-y-1" {...props} />,
                                                li: ({ node, ...props }) => <li className="" {...props} />,
                                                strong: ({ node, ...props }) => <span className="font-bold text-indigo-300" {...props} />,
                                                a: ({ node, ...props }) => <a className="text-indigo-400 hover:underline" {...props} />,
                                                code: ({ node, inline, ...props }) => inline
                                                    ? <code className="bg-black/30 px-1 py-0.5 rounded text-xs font-mono text-indigo-300" {...props} />
                                                    : <code className="block bg-black/30 p-2 rounded text-xs font-mono my-2 overflow-x-auto text-indigo-200" {...props} />
                                            }}
                                        >
                                            {msg.content}
                                        </ReactMarkdown>
                                    </div>
                                ) : (
                                    msg.content
                                )}
                            </div>
                        </motion.div>
                    ))}

                    {isLoading && (
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                                <Sparkles size={16} />
                            </div>
                            <div className="flex items-center gap-1.5 h-10 px-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Context Info */}
                <div className="p-2 border-t border-white/10 bg-black/20 text-[10px] text-white/30 flex justify-between px-4">
                    <div className="flex items-center gap-2">
                        <Layers size={12} />
                        <span>Context: {activeContextId ? contexts.find(c => c.id === activeContextId)?.name : 'Home'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span>Powered by DeepSeek V3</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
