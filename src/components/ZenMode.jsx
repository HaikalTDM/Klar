import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Square, Minimize2, CheckCircle2, Check, Circle, AlignLeft, Volume2, VolumeX } from 'lucide-react';
import { ProgressRing } from './ProgressRing';
import { SOUNDSCAPES } from '../constants';

export default function ZenMode({
    activeTask,
    focusState,
    toggleTimer,
    stopTimer,
    onExit,
    onComplete,
    onToggleSubtask,
    soundMixer,
    setSoundMixer,
    isPremium,
    themeMode,
    customTheme,
    formatTime
}) {
    // Auto-start timer when entering Zen Mode
    const [hasAutoStarted, setHasAutoStarted] = useState(false);

    useEffect(() => {
        if (activeTask && !focusState.isRunning && !hasAutoStarted) {
            // Brief delay before auto-starting for visual effect
            const timeout = setTimeout(() => {
                toggleTimer(activeTask.id);
                setHasAutoStarted(true);
            }, 800);
            return () => clearTimeout(timeout);
        }
    }, [activeTask, focusState.isRunning, hasAutoStarted, toggleTimer]);

    // Determine colors based on theme
    const getThemeColors = () => {
        if (themeMode === 'custom') {
            return {
                bg: customTheme.mainBg,
                text: customTheme.textColor,
                accent: customTheme.accentColor,
                border: customTheme.borderColor,
                cardBg: customTheme.cardBg
            };
        }
        return {
            bg: '#0f172a',
            text: '#ffffff',
            accent: '#ffffff',
            border: 'rgba(255,255,255,0.2)',
            cardBg: 'rgba(255,255,255,0.05)'
        };
    };

    const colors = getThemeColors();
    const timerProgress = ((focusState.totalDuration - focusState.remaining) / focusState.totalDuration) * 100;

    // Calculate subtask progress
    const subtasks = activeTask?.subtasks || [];
    const completedSubtasks = subtasks.filter(s => s.isDone).length;
    const totalSubtasks = subtasks.length;
    const subtaskProgress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

    // Press ESC to exit
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onExit();
            if (e.code === 'Space' && activeTask) {
                e.preventDefault();
                toggleTimer(activeTask.id);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onExit, activeTask, toggleTimer]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] flex flex-col overflow-hidden"
            style={{ backgroundColor: colors.bg, color: colors.text }}
        >
            {/* Background Ambience */}
            <div
                className="absolute inset-0 pointer-events-none opacity-30"
                style={{ background: `radial-gradient(ellipse at 30% 20%, ${colors.accent}15, transparent 50%), radial-gradient(ellipse at 70% 80%, ${colors.accent}10, transparent 50%)` }}
            />

            {/* Top Bar */}
            <div className="absolute top-4 left-4 right-4 md:top-6 md:left-6 md:right-6 flex justify-between items-center z-20">
                <div className="text-[10px] md:text-xs font-bold uppercase tracking-[0.25em] opacity-40">
                    Zen Mode
                </div>

                {/* Sound Controls */}
                <div className="flex items-center gap-2 md:gap-3">
                    {/* Sound Dropdown */}
                    <div className="relative group">
                        <button
                            className={`p-2 md:p-3 rounded-xl hover:bg-white/10 transition-colors ${Object.values(soundMixer || {}).some(v => v > 0)
                                ? 'opacity-100 text-blue-400'
                                : 'opacity-50 hover:opacity-100'
                                }`}
                            title="Sound Controls"
                        >
                            {Object.values(soundMixer || {}).some(v => v > 0) ? <Volume2 size={18} /> : <VolumeX size={18} />}
                        </button>

                        {/* Dropdown Panel */}
                        <div className="absolute top-full right-0 mt-2 w-64 md:w-72 rounded-xl p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none group-hover:pointer-events-auto shadow-xl z-50"
                            style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}>
                            <div className="text-[10px] font-bold uppercase tracking-wider opacity-50 mb-3">
                                Ambient Soundscape {isPremium && <span className="text-yellow-400">• MIX MODE</span>}
                            </div>
                            <div className="space-y-2 max-h-48 md:max-h-64 overflow-y-auto">
                                {SOUNDSCAPES.map(sound => {
                                    const currentVolume = soundMixer?.[sound.id] || 0;
                                    const isActive = currentVolume > 0;

                                    return (
                                        <div key={sound.id} className="flex items-center gap-2">
                                            <div className={`flex items-center justify-center w-6 h-6 rounded shrink-0 ${isActive ? 'opacity-100' : 'opacity-30'
                                                }`}>
                                                {sound.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-0.5">
                                                    <span className="text-[10px] font-bold opacity-70">{sound.label}</span>
                                                    <span className="text-[9px] font-mono opacity-50">{Math.round(currentVolume * 100)}%</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="1"
                                                    step="0.05"
                                                    value={currentVolume}
                                                    onChange={(e) => {
                                                        const vol = parseFloat(e.target.value);
                                                        if (isPremium) {
                                                            setSoundMixer(prev => ({ ...prev, [sound.id]: vol }));
                                                        } else {
                                                            setSoundMixer({ [sound.id]: vol });
                                                        }
                                                    }}
                                                    className="w-full h-1 rounded-lg appearance-none cursor-pointer bg-white/10"
                                                    style={{ accentColor: colors.accent }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            {!isPremium && (
                                <p className="text-[9px] text-center opacity-40 mt-2">
                                    💡 Premium: Mix multiple sounds
                                </p>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={onExit}
                        className="p-2 md:p-3 rounded-xl hover:bg-white/10 transition-colors opacity-50 hover:opacity-100"
                        title="Exit Zen Mode (ESC)"
                    >
                        <Minimize2 size={18} />
                    </button>
                </div>
            </div>

            {/* Main Content - Two Column Layout */}
            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-center w-full h-full p-4 pt-16 md:pt-20 gap-8 lg:gap-16 overflow-y-auto scrollbar-hide">

                {/* Left: Timer Section */}
                <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-col items-center shrink-0"
                >
                    {/* Timer Display */}
                    <div className="relative flex items-center justify-center w-48 h-48 md:w-64 md:h-64 lg:w-80 lg:h-80">
                        {/* Background Ring */}
                        <div className="absolute inset-0 opacity-10">
                            <ProgressRing radius={null} stroke={6} progress={100} color={colors.border} className="w-full h-full" />
                        </div>
                        {/* Progress Ring */}
                        <div className="absolute inset-0">
                            <ProgressRing radius={null} stroke={6} progress={timerProgress} color={colors.accent} className="w-full h-full" />
                        </div>

                        {/* Timer Text */}
                        <div className="flex flex-col items-center z-10">
                            <div
                                className="text-5xl md:text-6xl lg:text-7xl font-mono font-bold tracking-tighter"
                                style={{ color: colors.accent }}
                            >
                                {formatTime(focusState.remaining)}
                            </div>
                            <div className="text-[10px] md:text-xs font-bold uppercase tracking-widest opacity-40 mt-2">
                                {focusState.phase === 'focus' ? 'Focus Time' : focusState.phase === 'shortBreak' ? 'Short Break' : 'Long Break'}
                            </div>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-6 mt-6 md:mt-8">
                        {/* Toggle Play/Pause */}
                        <button
                            onClick={() => toggleTimer(activeTask?.id)}
                            className="w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg"
                            style={{ backgroundColor: colors.accent, color: colors.bg }}
                        >
                            {focusState.isRunning ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" style={{ marginLeft: 3 }} />}
                        </button>

                        {/* Stop Timer */}
                        <button
                            onClick={() => {
                                stopTimer();
                                onExit();
                            }}
                            className="p-3 md:p-4 rounded-full border-2 hover:bg-red-500/20 hover:border-red-500 hover:text-red-500 transition-all opacity-50 hover:opacity-100"
                            title="Stop & Exit"
                            style={{ borderColor: colors.border }}
                        >
                            <Square size={20} fill="currentColor" />
                        </button>
                    </div>
                </motion.div>

                {/* Right: Task Details Section */}
                <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col max-w-lg w-full px-4 md:px-0 mb-8 md:mb-0"
                >
                    {/* Task Title */}
                    <div className="mb-4 md:mb-6 text-center lg:text-left">
                        <h2 className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] opacity-40 mb-2 md:mb-3">Current Focus</h2>
                        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight break-words">
                            {activeTask ? activeTask.text : "Focus Session"}
                        </h1>
                        {activeTask?.description && (
                            <div className="mt-3 text-sm opacity-60 leading-relaxed flex items-start gap-2 justify-center lg:justify-start">
                                <AlignLeft size={14} className="mt-1 shrink-0" />
                                <p className="text-left">{activeTask.description}</p>
                            </div>
                        )}
                    </div>

                    {/* Subtask Progress Bar */}
                    {totalSubtasks > 0 && (
                        <div className="mb-4 md:mb-6">
                            <div className="flex justify-between items-center text-xs font-bold mb-2">
                                <span className="opacity-50 uppercase tracking-wider">Progress</span>
                                <span style={{ color: colors.accent }}>{completedSubtasks} / {totalSubtasks}</span>
                            </div>
                            <div
                                className="h-1.5 md:h-2 rounded-full overflow-hidden"
                                style={{ backgroundColor: colors.border }}
                            >
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${subtaskProgress}%` }}
                                    transition={{ duration: 0.5, ease: "easeOut" }}
                                    className="h-full rounded-full"
                                    style={{ backgroundColor: colors.accent }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Subtask Checklist */}
                    {totalSubtasks > 0 && (
                        <div
                            className="rounded-xl p-3 md:p-4 max-h-48 md:max-h-64 overflow-y-auto space-y-2 mb-4"
                            style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}
                        >
                            {subtasks.map((subtask, index) => (
                                <motion.button
                                    key={subtask.id || index}
                                    onClick={() => onToggleSubtask(activeTask.id, subtask.id)}
                                    className="w-full flex items-center gap-3 p-2 md:p-3 rounded-lg text-left transition-all hover:bg-white/5 group"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 + index * 0.05 }}
                                >
                                    {subtask.isDone ? (
                                        <div
                                            className="w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center shrink-0"
                                            style={{ backgroundColor: colors.accent }}
                                        >
                                            <Check size={12} style={{ color: colors.bg }} />
                                        </div>
                                    ) : (
                                        <div
                                            className="w-5 h-5 md:w-6 md:h-6 rounded-full border-2 shrink-0 group-hover:border-current transition-colors"
                                            style={{ borderColor: colors.border }}
                                        />
                                    )}
                                    <span className={`text-sm ${subtask.isDone ? 'line-through opacity-40' : 'opacity-80'}`}>
                                        {subtask.text}
                                    </span>
                                </motion.button>
                            ))}
                        </div>
                    )}

                    {/* Complete Task Button */}
                    {activeTask && (
                        <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            onClick={() => {
                                onComplete(activeTask);
                                onExit();
                            }}
                            className="w-full py-3 md:py-4 rounded-xl font-bold text-sm uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 md:gap-3"
                            style={{
                                backgroundColor: `${colors.accent}20`,
                                border: `1px solid ${colors.accent}40`,
                                color: colors.accent
                            }}
                        >
                            <CheckCircle2 size={16} />
                            Mark Complete
                        </motion.button>
                    )}
                </motion.div>
            </div>

            {/* Keyboard Hint - Hidden on mobile */}
            <div className="hidden md:flex absolute bottom-6 left-1/2 -translate-x-1/2 items-center gap-4 text-xs opacity-30">
                <span className="px-2 py-1 rounded border" style={{ borderColor: colors.border }}>Space</span>
                <span>Play/Pause</span>
                <span className="px-2 py-1 rounded border ml-4" style={{ borderColor: colors.border }}>ESC</span>
                <span>Exit</span>
            </div>
        </motion.div>
    );
}
