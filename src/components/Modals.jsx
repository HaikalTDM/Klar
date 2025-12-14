import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Plus, Edit3, Save, Repeat, AlignLeft, Calendar, Clock,
    Keyboard, Search, Check, Activity, CheckCircle2, Flame,
    Sliders, Sun, Moon, Monitor, Palette, RefreshCcw, Wand2,
    Volume2, VolumeX, Waves, CloudRain, Wind,
    Users, UserPlus, Share2, Loader2, User, Sparkles, Crown, Zap, ShieldCheck, ChevronLeft, ChevronRight, Flag
} from 'lucide-react';
import {
    THEMES, EMOJIS, RECURRENCE_OPTIONS, SOUNDSCAPES,
    CUSTOM_PRESETS, DEFAULT_CUSTOM_THEME, KEYBOARD_SHORTCUTS
} from '../constants';

// New Context Modal
export const NewContextModal = ({
    show,
    onClose,
    newContextName,
    setNewContextName,
    newContextEmoji,
    setNewContextEmoji,
    newContextTheme,
    setNewContextTheme,
    onSubmit,
    themeMode,
    customTheme,
    newContextIsShared,
    setNewContextIsShared
}) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
            />
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className={`relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-6 ring-1 ring-slate-900/5 dark:ring-white/10 ${themeMode === 'custom' ? 'bg-[var(--card-bg)] text-[var(--text-color)] border border-[var(--border-color)]' : 'bg-white dark:bg-slate-900'}`}
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <Plus size={18} /> New Context
                    </h3>
                    <button onClick={onClose} className="opacity-50 hover:opacity-100">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={onSubmit} className="space-y-6">
                    <div>
                        <label className="text-xs font-bold opacity-50 uppercase tracking-wider mb-2 block">
                            Context Name
                        </label>
                        <input
                            type="text"
                            value={newContextName}
                            onChange={(e) => setNewContextName(e.target.value)}
                            placeholder="Work, Personal, Projects..."
                            className={`w-full h-12 px-4 rounded-lg border text-sm focus:ring-0 transition-colors ${themeMode === 'custom' ? 'bg-transparent border-[var(--border-color)] focus:border-[var(--accent-color)]' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:border-slate-900 dark:focus:border-white'}`}
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold opacity-50 uppercase tracking-wider mb-2 block">
                            Choose Emoji
                        </label>
                        <div className="grid grid-cols-6 gap-2">
                            {EMOJIS.map(emoji => (
                                <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => setNewContextEmoji(emoji)}
                                    className={`h-12 rounded-lg border-2 transition-all ${newContextEmoji === emoji ? (themeMode === 'custom' ? 'border-[var(--accent-color)] bg-[var(--accent-color)]/10' : 'border-slate-900 dark:border-white bg-slate-100 dark:bg-slate-800') : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700'}`}
                                >
                                    <span className="text-2xl">{emoji}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold opacity-50 uppercase tracking-wider mb-2 block">
                            Choose Theme
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {THEMES.map(theme => (
                                <button
                                    key={theme.id}
                                    type="button"
                                    onClick={() => setNewContextTheme(theme)}
                                    className={`h-12 rounded-lg border-2 transition-all ${theme.bg} ${newContextTheme.id === theme.id ? (themeMode === 'custom' ? 'border-[var(--accent-color)] ring-2 ring-[var(--accent-color)]/20' : 'border-slate-900 dark:border-white ring-2 ring-slate-900/20 dark:ring-white/20') : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700'}`}
                                >
                                    <span className="sr-only">{theme.id}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className={`w-12 h-6 rounded-full p-1 transition-colors ${newContextIsShared ? (themeMode === 'custom' ? 'bg-[var(--accent-color)]' : 'bg-slate-900 dark:bg-white') : 'bg-slate-200 dark:bg-slate-700'}`}>
                                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${newContextIsShared ? 'translate-x-6' : 'translate-x-0'}`} />
                            </div>
                            <div>
                                <div className="text-sm font-bold flex items-center gap-2">
                                    <Users size={14} /> Collaborative Context
                                </div>
                                <div className="text-xs opacity-50">Allow others to join and edit tasks</div>
                            </div>
                            <input
                                type="checkbox"
                                className="hidden"
                                checked={newContextIsShared}
                                onChange={(e) => setNewContextIsShared(e.target.checked)}
                            />
                        </label>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 opacity-50 font-medium hover:opacity-100 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className={`flex-1 px-6 py-2 font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${themeMode === 'custom' ? 'bg-[var(--accent-color)] text-[var(--card-bg)] hover:brightness-110' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100'}`}
                        >
                            <Plus size={16} /> Create
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

// Detailed Task Modal (Create/Edit)
export const DetailedTaskModal = ({
    show,
    onClose,
    editingTask,
    detailedForm,
    setDetailedForm,
    setEditingTask,
    onSubmit,
    activeContext,
    themeMode,
    customTheme,
    onPals
}) => {
    if (!show && !editingTask) return null;

    const isEditing = !!editingTask;
    const formData = isEditing ? editingTask : detailedForm;
    const setFormData = isEditing ? setEditingTask : setDetailedForm;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
            />
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className={`relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ring-1 ring-slate-900/5 dark:ring-white/10 ${themeMode === 'custom' ? 'bg-[var(--card-bg)] text-[var(--text-color)] border border-[var(--border-color)]' : 'bg-white dark:bg-slate-900'}`}
            >
                <div className={`px-6 py-4 border-b flex justify-between items-center ${themeMode === 'custom' ? 'border-[var(--border-color)] bg-white/5' : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50'}`}>
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        {isEditing ? <Edit3 size={18} /> : <Plus size={18} />}
                        {isEditing ? 'Edit Task' : 'New Task'}
                    </h3>
                    <div className="flex items-center gap-2">
                        <div className={`px-2 py-1 rounded text-xs font-medium border opacity-70 ${themeMode === 'custom' ? 'border-[var(--border-color)]' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                            {activeContext?.emoji} {activeContext?.name}
                        </div>
                        <button onClick={onClose} className="opacity-50 hover:opacity-100 p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto space-y-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                placeholder="Task Title"
                                value={formData.text}
                                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                                className="flex-1 text-xl font-bold placeholder:opacity-30 border-none focus:ring-0 p-0 bg-transparent"
                                autoFocus
                            />
                            {formData.text && (
                                <button
                                    type="button"
                                    onClick={() => onPals(formData.text)}
                                    className="p-2 rounded-full text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all animate-in fade-in zoom-in duration-200"
                                    title="Get AI Suggestions"
                                >
                                    <Sparkles size={20} className="fill-purple-500/20" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-xs font-bold opacity-50 uppercase tracking-wider">
                            <Repeat size={12} /> Repeat
                        </label>
                        <div className="flex gap-2 flex-wrap">
                            {RECURRENCE_OPTIONS.map(opt => (
                                <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, recurrence: opt.id })}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${formData.recurrence === opt.id
                                        ? themeMode === 'custom' ? 'bg-[var(--accent-color)] text-[var(--card-bg)] border-[var(--accent-color)]' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white'
                                        : 'border-opacity-20 hover:bg-black/5 dark:hover:bg-white/5'
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-xs font-bold opacity-50 uppercase tracking-wider">
                            <Flag size={12} /> Priority
                        </label>
                        <div className="flex gap-2">
                            {[
                                { id: 'low', label: 'Low', color: 'bg-blue-500' },
                                { id: 'medium', label: 'Medium', color: 'bg-yellow-500' },
                                { id: 'high', label: 'High', color: 'bg-red-500' }
                            ].map(p => (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, priority: p.id })}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all flex items-center gap-2 ${
                                        (formData.priority || 'medium') === p.id
                                            ? themeMode === 'custom' 
                                                ? 'bg-[var(--accent-color)] text-[var(--card-bg)] border-[var(--accent-color)]' 
                                                : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white'
                                            : 'border-opacity-20 hover:bg-black/5 dark:hover:bg-white/5'
                                    }`}
                                >
                                    <div className={`w-2 h-2 rounded-full ${p.color}`} />
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-xs font-bold opacity-50 uppercase tracking-wider">
                            <AlignLeft size={12} /> Description
                        </label>
                        <textarea
                            rows={4}
                            placeholder="Add details or notes..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className={`w-full p-3 rounded-lg border text-sm focus:ring-0 resize-none transition-colors placeholder:opacity-30 bg-transparent ${themeMode === 'custom' ? 'border-[var(--border-color)] focus:border-[var(--accent-color)]' : 'border-slate-200 dark:border-slate-700 focus:border-slate-900 dark:focus:border-white'}`}
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-end">
                            <label className="flex items-center gap-2 text-xs font-bold opacity-50 uppercase tracking-wider">
                                <Activity size={12} /> Subtasks
                            </label>
                        </div>
                        <div className="space-y-2">
                            {(formData.subtasks || []).map((subtask, index) => (
                                <div key={subtask.id || index} className="flex items-center gap-2 group">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const updated = [...(formData.subtasks || [])];
                                            updated[index] = { ...subtask, isDone: !subtask.isDone };
                                            setFormData({ ...formData, subtasks: updated });
                                        }}
                                        className={`w-5 h-5 rounded flex items-center justify-center border transition-all flex-shrink-0 ${subtask.isDone
                                            ? (themeMode === 'custom' ? 'bg-[var(--accent-color)] border-[var(--accent-color)] text-[var(--card-bg)]' : 'bg-slate-900 dark:bg-white border-slate-900 dark:border-white text-white dark:text-slate-900')
                                            : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
                                            }`}
                                    >
                                        {subtask.isDone && <Check size={12} strokeWidth={3} />}
                                    </button>
                                    <input
                                        type="text"
                                        value={subtask.text}
                                        onChange={(e) => {
                                            const updated = [...(formData.subtasks || [])];
                                            updated[index] = { ...subtask, text: e.target.value };
                                            setFormData({ ...formData, subtasks: updated });
                                        }}
                                        placeholder="Subtask..."
                                        className={`flex-1 bg-transparent border-none p-0 text-sm focus:ring-0 ${subtask.isDone ? 'line-through opacity-50' : ''}`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const updated = (formData.subtasks || []).filter((_, i) => i !== index);
                                            setFormData({ ...formData, subtasks: updated });
                                        }}
                                        className="opacity-0 group-hover:opacity-50 hover:opacity-100 p-1 hover:bg-red-500/10 hover:text-red-500 rounded transition-all"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() => {
                                    const newSubtask = { id: Date.now(), text: '', isDone: false };
                                    setFormData({ ...formData, subtasks: [...(formData.subtasks || []), newSubtask] });
                                }}
                                className={`text-xs font-bold flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity ${themeMode === 'custom' ? 'text-[var(--accent-color)]' : ''}`}
                            >
                                <Plus size={12} /> Add Subtask
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-xs font-bold opacity-50 uppercase tracking-wider">
                                <Calendar size={12} /> Due Date
                            </label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className={`w-full h-10 px-3 rounded-lg border text-sm focus:ring-0 bg-transparent ${themeMode === 'custom' ? 'border-[var(--border-color)] focus:border-[var(--accent-color)]' : 'border-slate-200 dark:border-slate-700 focus:border-slate-900 dark:focus:border-white'}`}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-xs font-bold opacity-50 uppercase tracking-wider">
                                <Clock size={12} /> Time
                            </label>
                            <input
                                type="time"
                                value={formData.time}
                                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                className={`w-full h-10 px-3 rounded-lg border text-sm focus:ring-0 bg-transparent ${themeMode === 'custom' ? 'border-[var(--border-color)] focus:border-[var(--accent-color)]' : 'border-slate-200 dark:border-slate-700 focus:border-slate-900 dark:focus:border-white'}`}
                            />
                        </div>
                    </div>
                </div>

                <div className={`p-6 border-t flex justify-end gap-3 ${themeMode === 'custom' ? 'border-[var(--border-color)] bg-white/5' : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50'}`}>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 opacity-50 font-medium hover:opacity-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onSubmit}
                        className={`px-6 py-2 font-bold rounded-lg transition-all flex items-center gap-2 ${themeMode === 'custom' ? 'bg-[var(--accent-color)] text-[var(--card-bg)] hover:brightness-110' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100'}`}
                    >
                        {isEditing ? <Save size={16} /> : <Plus size={16} />}
                        {isEditing ? 'Save Changes' : 'Create Task'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

// Settings Modal
export const SettingsModal = ({
    show,
    onClose,
    themeMode,
    setThemeMode,
    themeSchedule,
    setThemeSchedule,
    customTheme,
    setCustomTheme,
    soundConfig,
    setSoundConfig,
    soundMixer,
    setSoundMixer,
    customMinutes,
    setCustomMinutes,
    setTimerSettings,
    saveSettings,
    isPremium,
    setShowUpgradeModal
}) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
            />
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className={`relative w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden p-6 ring-1 ring-slate-900/5 dark:ring-white/10 max-h-[85vh] overflow-y-auto ${themeMode === 'custom' ? 'bg-[var(--card-bg)] text-[var(--text-color)] border border-[var(--border-color)]' : 'bg-white dark:bg-slate-900'}`}
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <Sliders size={18} /> Preferences
                    </h3>
                    <button onClick={onClose} className="opacity-40 hover:opacity-100">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Appearance Section */}
                    <div>
                        <label className="text-xs font-bold opacity-50 uppercase tracking-wider mb-3 block">
                            Appearance
                        </label>

                        <div className={`flex p-1 rounded-xl mb-4 ${themeMode === 'custom' ? 'bg-white/5' : 'bg-slate-100 dark:bg-slate-800'}`}>
                            {['light', 'dark', 'system', 'custom'].map(mode => (
                                <button
                                    key={mode}
                                    onClick={() => {
                                        setThemeMode(mode);
                                        saveSettings({ themeMode: mode });
                                    }}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${themeMode === mode
                                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                        : 'opacity-50 hover:opacity-100'
                                        } ${mode === 'custom' && themeMode === 'custom' ? '!bg-[var(--accent-color)] !text-[var(--main-bg)]' : ''}`}
                                >
                                    {mode === 'light' ? <Sun size={14} /> : mode === 'dark' ? <Moon size={14} /> : mode === 'system' ? <Monitor size={14} /> : <Palette size={14} />}
                                    <span className="capitalize hidden sm:inline">{mode}</span>
                                </button>
                            ))}
                        </div>

                        {/* Theme Schedule */}
                        <AnimatePresence>
                            {themeMode === 'system' && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-2 text-xs font-bold mb-3">
                                            <Clock size={14} /> Auto-Switch Schedule
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] font-bold opacity-50 uppercase mb-1 block">
                                                    Dark Start
                                                </label>
                                                <input
                                                    type="time"
                                                    value={themeSchedule.start}
                                                    onChange={(e) => {
                                                        const newSchedule = { ...themeSchedule, start: e.target.value };
                                                        setThemeSchedule(newSchedule);
                                                        saveSettings({ themeSchedule: newSchedule });
                                                    }}
                                                    className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold opacity-50 uppercase mb-1 block">
                                                    Dark End
                                                </label>
                                                <input
                                                    type="time"
                                                    value={themeSchedule.end}
                                                    onChange={(e) => {
                                                        const newSchedule = { ...themeSchedule, end: e.target.value };
                                                        setThemeSchedule(newSchedule);
                                                        saveSettings({ themeSchedule: newSchedule });
                                                    }}
                                                    className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Custom Theme Editor */}
                        <AnimatePresence>
                            {themeMode === 'custom' && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="bg-white/5 rounded-xl p-4 border border-[var(--border-color)] space-y-4">
                                        {/* Presets Row */}
                                        <div className="mb-4">
                                            <div className="flex justify-between items-center mb-2">
                                                <label className="text-[10px] font-bold opacity-50 uppercase block">
                                                    <Wand2 size={10} className="inline mr-1" /> Quick Presets
                                                </label>
                                                <button
                                                    onClick={() => {
                                                        setCustomTheme(DEFAULT_CUSTOM_THEME);
                                                        saveSettings({ customTheme: DEFAULT_CUSTOM_THEME });
                                                    }}
                                                    className="p-1 hover:bg-white/10 rounded"
                                                    title="Reset to Defaults"
                                                >
                                                    <RefreshCcw size={12} />
                                                </button>
                                            </div>
                                            <div className="flex gap-2 overflow-x-auto pb-3 pt-2 px-1 presets-scroll" style={{ scrollbarWidth: 'thin' }}>
                                                {/* Custom Scrollbar Style for this section */}
                                                <style>{`
                                                    .presets-scroll::-webkit-scrollbar { height: 4px; }
                                                    .presets-scroll::-webkit-scrollbar-track { background: transparent; }
                                                    .presets-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
                                                    .presets-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
                                                `}</style>

                                                {CUSTOM_PRESETS.map(preset => {
                                                    const isActive = JSON.stringify(customTheme) === JSON.stringify(preset.colors);
                                                    return (
                                                        <button
                                                            key={preset.id}
                                                            onClick={() => {
                                                                setCustomTheme(preset.colors);
                                                                saveSettings({ customTheme: preset.colors });
                                                            }}
                                                            className={`relative px-4 py-2 rounded-xl text-xs font-bold border transition-all shadow-sm flex items-center gap-3 shrink-0 ${isActive ? 'ring-2 ring-white/50 scale-[1.02]' : 'hover:scale-[1.02] hover:brightness-110'}`}
                                                            style={{
                                                                borderColor: preset.colors.borderColor,
                                                                backgroundColor: preset.colors.cardBg,
                                                                color: preset.colors.textColor
                                                            }}
                                                        >
                                                            {isActive && (
                                                                <div className="absolute -top-2 -right-1 px-2 py-0.5 rounded-full text-[8px] bg-white text-slate-900 font-extrabold tracking-widest uppercase shadow-lg z-10">
                                                                    Active
                                                                </div>
                                                            )}
                                                            <span className="w-3 h-3 rounded-full shadow-inner" style={{ backgroundColor: preset.colors.accentColor }}></span>
                                                            <div className="flex flex-col items-start">
                                                                <span className="leading-none">{preset.name}</span>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                { key: 'mainBg', label: 'Main Background' },
                                                { key: 'sidebarBg', label: 'Sidebar Background' },
                                                { key: 'cardBg', label: 'Card Background' },
                                                { key: 'accentColor', label: 'Accent Color' },
                                                { key: 'textColor', label: 'Text Color' },
                                                { key: 'borderColor', label: 'Border Color' }
                                            ].map(({ key, label }) => (
                                                <div key={key}>
                                                    <label className="text-[10px] font-bold opacity-50 uppercase mb-1 block">
                                                        {label}
                                                    </label>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="color"
                                                            value={customTheme[key]}
                                                            onChange={(e) => {
                                                                const t = { ...customTheme, [key]: e.target.value };
                                                                setCustomTheme(t);
                                                                saveSettings({ customTheme: t });
                                                            }}
                                                            className="w-6 h-6 rounded cursor-pointer border-none p-0 bg-transparent"
                                                        />
                                                        <span className="text-xs font-mono opacity-70">{customTheme[key]}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Soundscape Mixer Section */}
                    <div className={`pt-4 border-t ${themeMode === 'custom' ? 'border-[var(--border-color)]' : 'border-slate-100 dark:border-slate-800'}`}>
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-xs font-bold opacity-50 uppercase tracking-wider flex items-center gap-2">
                                🎧 Ambient Soundscape
                                {isPremium && <span className="px-1.5 py-0.5 bg-gradient-to-r from-amber-200 to-yellow-400 text-amber-900 text-[8px] font-bold rounded-full">MIX MODE</span>}
                            </label>
                            {isPremium && Object.values(soundMixer || {}).some(v => v > 0) && (
                                <button
                                    onClick={() => setSoundMixer({})}
                                    className="text-[10px] opacity-50 hover:opacity-100 px-2 py-1 rounded hover:bg-white/10"
                                >
                                    Reset All
                                </button>
                            )}
                        </div>

                        {!isPremium && (
                            <p className="text-[10px] opacity-40 mb-3">
                                💡 Premium users can mix multiple sounds simultaneously
                            </p>
                        )}

                        <div className="space-y-3">
                            {SOUNDSCAPES.map(sound => {
                                const currentVolume = soundMixer?.[sound.id] || 0;
                                const isActive = currentVolume > 0;

                                return (
                                    <div
                                        key={sound.id}
                                        className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isActive
                                            ? (themeMode === 'custom' ? 'bg-[var(--accent-color)]/10 border border-[var(--accent-color)]/30' : 'bg-slate-100 dark:bg-slate-800')
                                            : (themeMode === 'custom' ? 'bg-white/5' : 'bg-slate-50 dark:bg-slate-800/50')
                                            }`}
                                    >
                                        {/* Icon & Label */}
                                        <div className={`flex items-center justify-center w-10 h-10 rounded-lg shrink-0 ${isActive
                                            ? (themeMode === 'custom' ? 'bg-[var(--accent-color)] text-[var(--main-bg)]' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900')
                                            : 'bg-white/10 opacity-50'
                                            }`}>
                                            {sound.icon}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className={`text-xs font-bold ${isActive ? '' : 'opacity-60'}`}>{sound.label}</span>
                                                <span className={`text-[10px] font-mono ${isActive ? 'opacity-80' : 'opacity-40'}`}>
                                                    {Math.round(currentVolume * 100)}%
                                                </span>
                                            </div>

                                            {/* Volume Slider */}
                                            <input
                                                type="range"
                                                min="0"
                                                max="1"
                                                step="0.05"
                                                value={currentVolume}
                                                onChange={(e) => {
                                                    const vol = parseFloat(e.target.value);
                                                    if (isPremium) {
                                                        // Premium: Multi-track mixing
                                                        setSoundMixer(prev => ({
                                                            ...prev,
                                                            [sound.id]: vol
                                                        }));
                                                    } else {
                                                        // Free: Single sound only
                                                        setSoundMixer({ [sound.id]: vol });
                                                    }
                                                }}
                                                className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${themeMode === 'custom'
                                                    ? 'bg-white/10 accent-[var(--accent-color)]'
                                                    : 'bg-slate-200 dark:bg-slate-700 accent-slate-900 dark:accent-white'
                                                    }`}
                                            />
                                        </div>
                                    </div>
                                );
                            })}

                            <p className="text-[10px] text-center opacity-40 pt-2">
                                💡 Sounds play when timer is running
                            </p>
                        </div>
                    </div>

                    {/* Custom Timer */}
                    <div className="pt-2">
                        <label className="text-xs font-bold opacity-50 uppercase tracking-wider mb-2 block">
                            Custom Timer (minutes)
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                min="1"
                                max="180"
                                value={customMinutes}
                                onChange={(e) => setCustomMinutes(e.target.value)}
                                className="flex-1 h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-transparent"
                                placeholder="Custom"
                            />
                            <button
                                onClick={() => setTimerSettings(customMinutes, 'Custom')}
                                className="px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-sm font-bold hover:bg-slate-800 dark:hover:bg-slate-200"
                            >
                                Set
                            </button>
                        </div>
                    </div>



                    {/* Account Status */}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex justify-between items-center">
                            <div>
                                <label className="text-xs font-bold opacity-50 uppercase tracking-wider block">
                                    Account Status
                                </label>
                                <p className="text-[10px] opacity-60">
                                    {isPremium ? 'Thank you for supporting Klar.' : 'Unlock full potential.'}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    if (!isPremium) {
                                        onClose();
                                        setShowUpgradeModal(true);
                                    }
                                }}
                                disabled={isPremium}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border flex items-center gap-1 ${isPremium
                                    ? 'bg-gradient-to-r from-amber-200 to-yellow-400 text-amber-900 border-transparent shadow-sm cursor-default'
                                    : 'bg-transparent border-slate-200 dark:border-slate-700 opacity-60 hover:opacity-100 cursor-pointer hover:border-amber-400 hover:text-amber-500'
                                    }`}
                            >
                                {isPremium ? (
                                    <>
                                        <Sparkles size={10} fill="currentColor" /> Premium Active
                                    </>
                                ) : (
                                    'Basic Plan'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div >
        </div >
    );
};


// Stats Modal
export const StatsModal = ({ show, onClose, statsData, themeMode }) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
            />
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className={`relative w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden p-8 ring-1 ring-slate-900/5 dark:ring-white/10 ${themeMode === 'custom' ? 'bg-[var(--card-bg)] text-[var(--text-color)]' : 'bg-white dark:bg-slate-900'}`}
            >
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <Activity size={24} /> Deep Focus Analytics
                        </h2>
                        <p className="opacity-50">Track your focus and task completion over time.</p>
                    </div>
                    <button onClick={onClose} className="opacity-40 hover:opacity-100 p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg">
                        <X size={20} />
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className={`p-4 border rounded-xl ${themeMode === 'custom' ? 'border-[var(--border-color)] bg-white/5' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}>
                        <div className="flex items-center gap-2 opacity-50 text-xs font-bold uppercase tracking-wider mb-1">
                            <CheckCircle2 size={14} /> Total Tasks Completed
                        </div>
                        <div className="text-3xl font-bold">{statsData.totalCompletedTasks}</div>
                    </div>
                    <div className={`p-4 border rounded-xl ${themeMode === 'custom' ? 'border-[var(--border-color)] bg-white/5' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}>
                        <div className="flex items-center gap-2 opacity-50 text-xs font-bold uppercase tracking-wider mb-1">
                            <Flame size={14} /> Total Focus Time
                        </div>
                        <div className="text-3xl font-bold">
                            {statsData.totalHours}
                            <span className="text-sm font-medium opacity-50 ml-1">hrs</span>
                        </div>
                    </div>
                </div>

                <div className="mb-4">
                    <h3 className="text-sm font-bold mb-4">Task Completion Graph (Last 3 Months)</h3>
                    <div className="flex flex-wrap gap-1">
                        {statsData.grid.map((day) => {
                            const count = day.count;
                            let color = themeMode === 'custom' ? 'bg-white/10' : 'bg-slate-100 dark:bg-slate-800';
                            if (count > 0) color = 'bg-emerald-200 dark:bg-emerald-900/60';
                            if (count > 2) color = 'bg-emerald-300 dark:bg-emerald-800/80';
                            if (count > 4) color = 'bg-emerald-400 dark:bg-emerald-600';
                            if (count > 6) color = 'bg-emerald-500 dark:bg-emerald-500';
                            if (count > 8) color = 'bg-emerald-600 dark:bg-emerald-400';
                            return (
                                <div
                                    key={day.date}
                                    className={`w-3 h-3 rounded-sm ${color} transition-colors hover:ring-2 hover:ring-current hover:z-10 relative group`}
                                    title={`${day.date}: ${count} tasks`}
                                ></div>
                            );
                        })}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};


// Share Context Modal
export const ShareContextModal = ({
    show,
    onClose,
    onInvite,
    themeMode,
    customTheme,
    activeContextName
}) => {
    if (!show) return null;
    const [email, setEmail] = React.useState('');
    const [status, setStatus] = React.useState('idle'); // idle, loading, success, error
    const [msg, setMsg] = React.useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim()) return;
        setStatus('loading');
        try {
            await onInvite(email);
            setStatus('success');
            setMsg('Invitation sent!');
            setTimeout(() => {
                onClose();
                setEmail('');
                setStatus('idle');
                setMsg('');
            }, 1500);
        } catch (err) {
            setStatus('error');
            setMsg(err.message || 'Failed to invite user');
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
            />
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className={`relative w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden p-6 ring-1 ring-slate-900/5 dark:ring-white/10 ${themeMode === 'custom' ? 'bg-[var(--card-bg)] text-[var(--text-color)] border border-[var(--border-color)]' : 'bg-white dark:bg-slate-900'}`}
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <UserPlus size={18} /> Invite to "{activeContextName}"
                    </h3>
                    <button onClick={onClose} className="opacity-50 hover:opacity-100">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold opacity-50 uppercase tracking-wider mb-2 block">
                            User Email
                        </label>
                        <div className="relative">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="friend@example.com"
                                className={`w-full h-12 pl-10 pr-4 rounded-lg border text-sm focus:ring-0 transition-colors ${themeMode === 'custom' ? 'bg-transparent border-[var(--border-color)] focus:border-[var(--accent-color)]' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:border-slate-900 dark:focus:border-white'}`}
                                autoFocus
                            />
                            <User size={16} className="absolute left-3 top-3.5 opacity-40" />
                        </div>
                    </div>

                    {msg && (
                        <div className={`text-xs font-bold p-2 rounded ${status === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                            {msg}
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 opacity-50 font-medium hover:opacity-100 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            className={`flex-1 px-6 py-2 font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${themeMode === 'custom' ? 'bg-[var(--accent-color)] text-[var(--card-bg)] hover:brightness-110' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100'}`}
                        >
                            {status === 'loading' ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} />}
                            Invite
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

// Confirm Dialog (for delete confirmations)
export const ConfirmDialog = ({
    show,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Delete',
    themeMode
}) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            />
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className={`relative w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden p-6 ring-1 ring-slate-900/5 dark:ring-white/10 ${themeMode === 'custom' ? 'bg-[var(--card-bg)] text-[var(--text-color)] border border-[var(--border-color)]' : 'bg-white dark:bg-slate-900'}`}
            >
                <h3 className="font-bold text-lg mb-2">{title}</h3>
                <p className="text-sm opacity-70 mb-6">{message}</p>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 opacity-50 font-medium hover:opacity-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 px-6 py-2 font-bold rounded-lg transition-all bg-red-500 hover:bg-red-600 text-white"
                    >
                        {confirmText}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

// Command Palette
export const CommandPalette = ({
    show,
    onClose,
    commandSearch,
    setCommandSearch,
    filteredContexts,
    activeContextId,
    setActiveContextId,
    themeMode
}) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-start justify-center p-4 pt-32">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
            />
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: -20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: -20 }}
                className={`relative w-full max-w-lg rounded-xl shadow-2xl overflow-hidden ring-1 ring-slate-900/5 dark:ring-white/10 ${themeMode === 'custom' ? 'bg-[var(--card-bg)] border border-[var(--border-color)]' : 'bg-white dark:bg-slate-900'}`}
            >
                <div className={`flex items-center px-4 py-3 border-b ${themeMode === 'custom' ? 'border-[var(--border-color)]' : 'border-slate-100 dark:border-slate-800'}`}>
                    <Search size={20} className="opacity-40 mr-3" />
                    <input
                        type="text"
                        placeholder="Search contexts..."
                        value={commandSearch}
                        onChange={(e) => setCommandSearch(e.target.value)}
                        className={`flex-1 text-lg outline-none bg-transparent placeholder:opacity-40 ${themeMode === 'custom' ? 'text-[var(--text-color)]' : 'text-slate-900 dark:text-white'}`}
                        autoFocus
                    />
                    <div className="text-xs font-mono opacity-40 border rounded px-1.5 py-0.5">ESC</div>
                </div>
                <div className="max-h-[300px] overflow-y-auto p-2">
                    {filteredContexts.length === 0 ? (
                        <div className="text-center py-8 opacity-40 text-sm">No contexts found.</div>
                    ) : (
                        filteredContexts.map(ctx => {
                            const theme = THEMES.find(t => t.id === ctx.themeId) || THEMES[0];
                            return (
                                <button
                                    key={ctx.id}
                                    onClick={() => {
                                        setActiveContextId(ctx.id);
                                        onClose();
                                        setCommandSearch('');
                                    }}
                                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors text-left group ${themeMode === 'custom' ? 'hover:bg-white/5' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                >
                                    <span className={`flex items-center justify-center w-8 h-8 rounded ${themeMode === 'custom' ? 'bg-white/10' : theme.bg} text-lg`}>
                                        {ctx.emoji}
                                    </span>
                                    <span className="font-medium group-hover:opacity-100 opacity-80">{ctx.name}</span>
                                    {activeContextId === ctx.id && <Check size={16} className="ml-auto opacity-50" />}
                                </button>
                            );
                        })
                    )}
                </div>
            </motion.div>
        </div>
    );
};

// Shortcuts Help Modal
export const ShortcutsHelpModal = ({ show, onClose, themeMode }) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
            />
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className={`relative w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden p-6 ring-1 ring-slate-900/5 dark:ring-white/10 ${themeMode === 'custom' ? 'bg-[var(--card-bg)] text-[var(--text-color)] border border-[var(--border-color)]' : 'bg-white dark:bg-slate-900'}`}
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <Keyboard size={20} /> Shortcuts
                    </h3>
                    <button onClick={onClose} className="opacity-50 hover:opacity-100">
                        <X size={20} />
                    </button>
                </div>
                <div className="space-y-4">
                    {KEYBOARD_SHORTCUTS.map((s, i) => (
                        <div key={i} className="flex justify-between items-center text-sm">
                            <span className="opacity-70">{s.label}</span>
                            <span className={`font-mono px-2 py-1 rounded text-xs border shadow-sm ${themeMode === 'custom' ? 'bg-white/10 border-[var(--border-color)]' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                                {s.key}
                            </span>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

// Upgrade Modal
export const UpgradeModal = ({ show, onClose, onUpgrade, themeMode }) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className={`relative w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden ring-1 ring-white/10 ${themeMode === 'custom' ? 'bg-[var(--card-bg)]' : 'bg-white dark:bg-slate-900'}`}
            >
                {/* Header Graphic */}
                <div className="h-32 bg-gradient-to-br from-amber-200 via-orange-300 to-yellow-500 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                    <div className="absolute -bottom-8 -right-8 opacity-20 transform rotate-12">
                        <Crown size={120} strokeWidth={1} />
                    </div>
                    <div className="absolute top-6 left-6 text-slate-900">
                        <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider mb-2 border border-white/20 shadow-sm">
                            <Sparkles size={10} fill="currentColor" /> Premium
                        </div>
                        <h2 className="text-2xl font-black leading-tight">Unlock Your<br />Potential</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-black/5 hover:bg-black/10 rounded-full text-slate-900 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="p-6">
                    <div className="space-y-4 mb-8">
                        {[{ icon: <Activity size={18} className="text-yellow-500" />, text: "AI Assistant Access", sub: "Analyze tasks & generate subtasks" },
                        { icon: <Zap size={18} className="text-yellow-500" />, text: "Smart Breakdown", sub: "One-click task disassembly" },
                        { icon: <ShieldCheck size={18} className="text-yellow-500" />, text: "Advanced Analytics", sub: "Deep focus insights & history" },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${themeMode === 'custom' ? 'bg-[var(--bg-color)]' : 'bg-slate-100 dark:bg-slate-800'}`}
                                >
                                    {item.icon}
                                </div>
                                <div>
                                    <h4 className={`font-bold text-sm ${themeMode === 'custom' ? 'text-[var(--text-color)]' : 'text-slate-900 dark:text-white'}`}>{item.text}</h4>
                                    <p className="text-xs opacity-60">{item.sub}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className={`rounded-xl p-4 text-center mb-6 border ${themeMode === 'custom' ? 'bg-white/5 border-white/10' : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/10'}`}>
                        <p className="text-xs font-bold opacity-50 uppercase tracking-widest mb-1">Premium Plan</p>
                        <div className="flex items-baseline justify-center gap-1">
                            <span className="text-lg font-medium opacity-60">RM</span>
                            <span className="text-4xl font-black tracking-tight">9.90</span>
                            <span className="text-sm opacity-60">/month</span>
                        </div>
                    </div>

                </div>

            </motion.div >
        </div >
    );
};

// Calendar Modal
export const CalendarModal = ({ show, onClose, tasks, themeMode, customTheme }) => {
    if (!show) return null;

    const [currentDate, setCurrentDate] = React.useState(new Date());
    const [selectedDate, setSelectedDate] = React.useState(new Date());

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    const getTasksForDate = (day) => {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const offset = date.getTimezoneOffset();
        const localDate = new Date(date.getTime() - (offset * 60 * 1000));
        const dateStr = localDate.toISOString().split('T')[0];
        return tasks.filter(t => {
            if (!t.dueDate) return false;
            // Extract date part from ISO timestamp
            const taskDateStr = t.dueDate.split('T')[0];
            return taskDateStr === dateStr && !t.isDone;
        });
    };

    const isSelected = (day) => {
        return day === selectedDate.getDate() && currentDate.getMonth() === selectedDate.getMonth() && currentDate.getFullYear() === selectedDate.getFullYear();
    };

    const isToday = (day) => {
        const today = new Date();
        return day === today.getDate() && currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();
    };

    const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    // Get tasks for selected day
    const selectedDateStr = new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    const selectedTasks = tasks.filter(t => {
        if (!t.dueDate) return false;
        const taskDateStr = t.dueDate.split('T')[0];
        return taskDateStr === selectedDateStr && !t.isDone;
    });

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
            />
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className={`relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden p-6 ring-1 ring-slate-900/5 dark:ring-white/10 ${themeMode === 'custom' ? 'bg-[var(--card-bg)] text-[var(--text-color)] border border-[var(--border-color)]' : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white'}`}
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Calendar size={20} /> Calendar
                    </h2>
                    <button onClick={onClose} className="opacity-50 hover:opacity-100 p-1 rounded hover:bg-black/5 dark:hover:bg-white/10"><X size={20} /></button>
                </div>

                <div className="flex items-center justify-between mb-6">
                    <button onClick={prevMonth} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg"><ChevronLeft size={20} /></button>
                    <div className="text-lg font-bold">{MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}</div>
                    <button onClick={nextMonth} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg"><ChevronRight size={20} /></button>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-6 text-center">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className="text-xs font-bold opacity-40 uppercase py-2">{d}</div>
                    ))}

                    {Array.from({ length: firstDay }).map((_, i) => (
                        <div key={`empty-${i}`} />
                    ))}

                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const dayTasks = getTasksForDate(day);
                        const hasTasks = dayTasks.length > 0;
                        const selected = isSelected(day);
                        const today = isToday(day);

                        return (
                            <button
                                key={day}
                                onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                                className={`h-10 rounded-lg flex flex-col items-center justify-center relative transition-all ${selected
                                    ? (themeMode === 'custom' ? 'bg-[var(--accent-color)] text-[var(--main-bg)] font-bold' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold')
                                    : today
                                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 font-bold'
                                        : 'hover:bg-black/5 dark:hover:bg-white/5'
                                    }`}
                            >
                                <span className="text-sm">{day}</span>
                                {hasTasks && (
                                    <div className={`w-1 h-1 rounded-full mt-1 ${selected ? 'bg-white dark:bg-slate-900' : 'bg-purple-500'}`} />
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className={`p-4 rounded-xl border ${themeMode === 'custom' ? 'border-[var(--border-color)] bg-white/5' : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50'}`}>
                    <h3 className="text-xs font-bold opacity-50 uppercase tracking-wider mb-3">
                        {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                    </h3>

                    {selectedTasks.length > 0 ? (
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {selectedTasks.map(task => (
                                <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/50 dark:bg-slate-800/50">
                                    <div className={`w-2 h-2 rounded-full ${task.priority === 'high' ? 'bg-red-500' : 'bg-slate-400'}`} />
                                    <span className="text-sm font-medium truncate">{task.text}</span>
                                    {task.time && <span className="text-xs opacity-50 ml-auto font-mono">{task.time}</span>}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-sm opacity-50 italic py-2">No tasks due this day.</div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};
