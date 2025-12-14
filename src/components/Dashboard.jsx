import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Brain, Flame, Calendar, CheckCircle2, Clock,
    ArrowRight, Flag, LayoutGrid, Activity, Target,
    Pause, Play
} from 'lucide-react';

export default function Dashboard({
    user,
    tasks = [],
    contexts = [],
    themeMode,
    activeTheme,
    onNavigate,
    onStartTask,
    onStartPomodoro,
    focusState,
    onStopTimer,
    onToggleTimer
}) {
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // 1. Get High Priority Tasks (The LineUp)
    const highPriorityTasks = tasks.filter(t => t.priority === 'high' && !t.isDone);

    // 2. Get Upcoming Tasks (Due Today/Tomorrow)
    const today = new Date().toISOString().split('T')[0];
    const upcomingTasks = tasks.filter(t => {
        if (!t.dueDate || t.isDone) return false;
        return t.dueDate.startsWith(today);
    });

    // 3. Stats Calculation (Mock for now, can be real later)
    const completedToday = tasks.filter(t => t.isDone).length; // Simplified daily sizing

    const cardClass = themeMode === 'custom'
        ? 'bg-[var(--card-bg)] border border-[var(--border-color)]'
        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800';

    const textPrimary = themeMode === 'custom' ? 'text-[var(--text-color)]' : 'text-slate-900 dark:text-white';
    const textSecondary = themeMode === 'custom' ? 'opacity-60' : 'text-slate-500 dark:text-slate-400';


    // 4. Quick Capture State
    const [quickNote, setQuickNote] = useState(() => localStorage.getItem('klar_quick_note') || '');
    useEffect(() => {
        localStorage.setItem('klar_quick_note', quickNote);
    }, [quickNote]);

    // 5. Activity Graph Data (Last 14 weeks approx)
    const activityGrid = React.useMemo(() => {
        const weeks = [];
        const today = new Date();
        const daysToVerify = [];

        // Generate last 16 weeks of data
        for (let i = 0; i < 16 * 7; i++) {
            const d = new Date();
            d.setDate(today.getDate() - ((16 * 7) - 1 - i));
            const dateStr = d.toISOString().split('T')[0];
            const count = tasks.filter(t => {
                if (!t.isDone || !t.completedAt) return false;
                try {
                    const cDate = t.completedAt.seconds ? new Date(t.completedAt.seconds * 1000) : new Date(t.completedAt);
                    return cDate.toISOString().startsWith(dateStr);
                } catch { return false; }
            }).length;
            daysToVerify.push({ date: dateStr, count });
        }
        return daysToVerify;
    }, [tasks]);

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className={`text-4xl font-bold mb-2 ${textPrimary}`}>
                        Hello, {user?.displayName?.split(' ')[0] || 'There'}
                    </h1>
                    <p className={`text-lg ${textSecondary}`}>
                        You have <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">{highPriorityTasks.length} high priority</span> tasks today.
                    </p>
                </div>
                <div className={`flex items-center gap-3 px-4 py-2 rounded-full ${cardClass}`}>
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm font-medium">System Operational</span>
                </div>
            </div>

            {/* Widgets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* 1. LineUp Card (Priority) */}
                <motion.div
                    whileHover={{ y: -5 }}
                    className={`${cardClass} p-6 rounded-3xl col-span-1 md:col-span-2`}
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-xl bg-red-500/10 text-red-500">
                            <Flame size={24} />
                        </div>
                        <h2 className={`text-xl font-bold ${textPrimary}`}>My LineUp</h2>
                    </div>

                    <div className="space-y-3">
                        {highPriorityTasks.length === 0 ? (
                            <div className={`p-8 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 ${themeMode === 'custom' ? 'border-[var(--border-color)]' : 'border-slate-200 dark:border-slate-800'}`}>
                                <CheckCircle2 size={32} className="opacity-20" />
                                <p className="opacity-50">No high priority tasks. You're clear!</p>
                            </div>
                        ) : (
                            highPriorityTasks.slice(0, 3).map(task => {
                                const ctx = contexts.find(c => c.id === task.contextId);
                                return (
                                    <div
                                        key={task.id}
                                        className={`p-4 rounded-xl flex items-center justify-between group cursor-pointer hover:shadow-lg transition-all ${themeMode === 'custom' ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                        onClick={() => onStartTask(task)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-1.5 h-10 rounded-full bg-red-500/80" />
                                            <div>
                                                <div className={`font-semibold ${textPrimary}`}>{task.text}</div>
                                                <div className={`text-xs flex items-center gap-2 ${textSecondary}`}>
                                                    <span className="flex items-center gap-1">
                                                        {ctx?.emoji} {ctx?.name || 'Inbox'}
                                                    </span>
                                                    <span>•</span>
                                                    <span className="text-red-400 capitalize">{task.priority}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg bg-red-500/10 text-red-500">
                                            <Clock size={16} />
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </motion.div>

                {/* 2. Quick Pulse (Stats) */}
                <motion.div
                    whileHover={{ y: -5 }}
                    className={`${cardClass} p-6 rounded-3xl relative overflow-hidden`}
                >
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8">
                            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                                <Activity size={24} />
                            </div>
                            <span className="text-xs font-bold uppercase opacity-50 tracking-wider">Today</span>
                        </div>

                        <div className="space-y-1">
                            <div className="text-4xl font-bold">{completedToday}</div>
                            <div className={`text-sm ${textSecondary}`}>Tasks Completed</div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-dashed border-opacity-20 border-gray-500">
                            <div className="flex justify-between items-center">
                                <span className={`text-xs ${textSecondary}`}>Focus Efficiency</span>
                                <span className="text-green-500 font-bold">92%</span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full mt-2 overflow-hidden">
                                <div className="h-full bg-green-500 w-[92%]" />
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* 3. Upcoming (Tomorrow/Later) - Left Column Row 2 */}
                <motion.div
                    whileHover={{ y: -5 }}
                    className={`${cardClass} p-6 rounded-3xl col-span-1`}
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                            <Calendar size={24} />
                        </div>
                        <h2 className={`text-xl font-bold ${textPrimary}`}>Today's Schedule</h2>
                    </div>

                    <div className="space-y-4">
                        {upcomingTasks.length === 0 ? (
                            <div className={`text-center py-8 ${textSecondary}`}>
                                Nothing due today.
                                <br /> Enjoy the space! 🚀
                            </div>
                        ) : (
                            upcomingTasks.slice(0, 4).map(t => (
                                <div key={t.id} className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${t.priority === 'high' ? 'bg-red-500' : 'bg-purple-400'}`} />
                                    <span className={`text-sm truncate flex-1 ${textPrimary}`}>{t.text}</span>
                                    <span className={`text-xs ${textSecondary}`}>{t.dueTime || 'All Day'}</span>
                                </div>
                            ))
                        )}
                    </div>
                </motion.div>

                {/* 4. Activity Graph (GitHub Style) - Span 2 Cols Row 2 */}
                <motion.div
                    whileHover={{ y: -5 }}
                    className={`${cardClass} p-6 rounded-3xl col-span-1 md:col-span-2 overflow-hidden`}
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-xl bg-green-500/10 text-green-500">
                            <Activity size={24} />
                        </div>
                        <h2 className={`text-xl font-bold ${textPrimary}`}>Activity Log</h2>
                    </div>

                    <div className="flex gap-1 overflow-x-auto pb-2" style={{ direction: 'rtl' }}>
                        {/* Rendering squares in specific layout is hard with flex, let's just do a wrapping flex Grid */}
                        <div className="flex flex-wrap flex-row-reverse gap-1 justify-end h-[100px] content-start w-full">
                            {activityGrid.map((day, i) => (
                                <div
                                    key={i}
                                    className={`w-3 h-3 rounded-sm ${day.count === 0 ? (themeMode === 'custom' ? 'bg-white/5' : 'bg-slate-100 dark:bg-slate-800') :
                                        day.count < 3 ? 'bg-green-500/40' :
                                            day.count < 6 ? 'bg-green-500/70' :
                                                'bg-green-500'
                                        }`}
                                    title={`${day.date}: ${day.count} tasks`}
                                />
                            ))}
                        </div>
                    </div>
                    <div className={`text-xs ${textSecondary} mt-2 text-right`}>Last 16 Weeks</div>
                </motion.div>

                {/* 5. Focus Controller - Col 1 Row 3 */}
                <motion.div
                    whileHover={{ y: -5 }}
                    className={`${cardClass} p-6 rounded-3xl col-span-1`}
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                            <Brain size={24} />
                        </div>
                        <h2 className={`text-xl font-bold ${textPrimary}`}>Focus Zone</h2>
                    </div>

                    {focusState?.isRunning ? (
                        <div className="flex flex-col items-center justify-center py-4 relative">
                            {/* Pulse Animation */}
                            <div className="absolute w-full h-full flex items-center justify-center pointer-events-none">
                                <span className="absolute inline-flex h-24 w-24 rounded-full bg-amber-400 opacity-20 animate-ping"></span>
                                <span className="relative inline-flex h-20 w-20 rounded-full bg-amber-500/10"></span>
                            </div>

                            <div className={`text-4xl font-mono font-bold mb-4 relative z-10 tabular-nums tracking-widest ${themeMode === 'custom' ? 'text-[var(--accent-color)]' : 'text-slate-900 dark:text-white'}`}>
                                {formatTime(focusState.remaining)}
                            </div>

                            <div className="flex gap-2 items-center justify-center relative z-10 w-full px-4">
                                <button
                                    onClick={() => onToggleTimer(null)}
                                    className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                                >
                                    {focusState.isRunning ? <Pause size={14} /> : <Play size={14} />}
                                    {focusState.isRunning ? 'Pause' : 'Resume'}
                                </button>

                                <button
                                    onClick={onStopTimer}
                                    className="flex-1 py-2 rounded-xl bg-red-50 dark:bg-red-900/10 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 text-xs font-bold uppercase tracking-wider transition-colors"
                                >
                                    Stop
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button onClick={onStartPomodoro} className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold transition-colors flex items-center justify-center gap-2 mb-3">
                            <Clock size={18} /> Start Pomodoro
                        </button>
                    )}
                    <div className={`text-center text-xs ${textSecondary}`}>
                        25m Focus • 5m Break
                    </div>
                </motion.div>

                {/* 6. Quick Capture - Col 2 Row 3 (Span 2) */}
                <motion.div
                    whileHover={{ y: -5 }}
                    className={`${cardClass} p-6 rounded-3xl col-span-1 md:col-span-2`}
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                            <Target size={24} />
                        </div>
                        <h2 className={`text-xl font-bold ${textPrimary}`}>Scratchpad</h2>
                    </div>

                    <textarea
                        value={quickNote}
                        onChange={(e) => setQuickNote(e.target.value)}
                        placeholder="Type something..."
                        className={`w-full h-24 bg-transparent resize-none outline-none ${textPrimary} placeholder-opacity-50`}
                    />
                </motion.div>

            </div>
        </div>
    );

}
