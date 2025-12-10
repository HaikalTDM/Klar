import { VolumeX, Waves, CloudRain, Wind, Flame } from 'lucide-react';

// Theme Options
export const THEMES = [
    { id: 'slate', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-200 dark:border-slate-700', hex: '#f1f5f9' },
    { id: 'orange', bg: 'bg-orange-100 dark:bg-orange-900/40', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-800', hex: '#ffedd5' },
    { id: 'emerald', bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800', hex: '#d1fae5' },
    { id: 'blue', bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800', hex: '#dbeafe' },
    { id: 'rose', bg: 'bg-rose-100 dark:bg-rose-900/40', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800', hex: '#ffe4e6' },
    { id: 'violet', bg: 'bg-violet-100 dark:bg-violet-900/40', text: 'text-violet-700 dark:text-violet-300', border: 'border-violet-200 dark:border-violet-800', hex: '#ede9fe' },
];

// Context Emojis
export const EMOJIS = ['💼', '🎓', '🏠', '✈️', '💪', '🎨', '🛒', '💰', '🧸', '🍔', '📚', '💻'];

// Timer Presets
export const TIMER_PRESETS = [
    { label: 'Pomodoro', minutes: 25, type: 'pomodoro' },
    { label: 'Deep Work', minutes: 50, type: 'standard' },
    { label: 'Quick Task', minutes: 15, type: 'standard' },
];

// Soundscapes for Mixer (Multiple tracks can play simultaneously)
export const SOUNDSCAPES = [
    { id: 'brown', label: 'Deep Focus', icon: <Waves size={18} />, description: 'Warm, deep noise' },
    { id: 'pink', label: 'Soft Hum', icon: <CloudRain size={18} />, description: 'Balanced ambient' },
    { id: 'rain', label: 'Rain', icon: <CloudRain size={18} />, description: 'Gentle rainfall' },
    { id: 'wind', label: 'Wind', icon: <Wind size={18} />, description: 'Breezy ambience' },
    { id: 'fire', label: 'Fireplace', icon: <Flame size={18} />, description: 'Crackling fire' },
    { id: 'waves', label: 'Ocean', icon: <Waves size={18} />, description: 'Ocean waves' },
    { id: 'lofi', label: 'Lo-Fi', icon: <Waves size={18} />, description: 'Vinyl warmth' },
];

// Recurrence Options
export const RECURRENCE_OPTIONS = [
    { id: 'none', label: 'No Repeat' },
    { id: 'daily', label: 'Daily' },
    { id: 'weekly', label: 'Weekly' },
    { id: 'monthly', label: 'Monthly' },
];

// Default Custom Theme (Galaxy Default)
export const DEFAULT_CUSTOM_THEME = {
    sidebarBg: '#0f172a',
    mainBg: '#020617',
    textColor: '#f8fafc',
    accentColor: '#38bdf8',
    cardBg: '#1e293b',
    borderColor: '#1e293b'
};

// Custom Theme Presets
export const CUSTOM_PRESETS = [
    {
        id: 'galaxy',
        name: 'Galaxy',
        colors: { mainBg: '#020617', sidebarBg: '#0f172a', cardBg: '#1e293b', accentColor: '#38bdf8', textColor: '#f8fafc', borderColor: '#1e293b' }
    },
    {
        id: 'sunset',
        name: 'Sunset',
        colors: { mainBg: '#2a1b3d', sidebarBg: '#44318d', cardBg: '#8265a7', accentColor: '#d83f87', textColor: '#ffffff', borderColor: '#a4b3b6' }
    },
    {
        id: 'ocean',
        name: 'Ocean',
        colors: { mainBg: '#0f172a', sidebarBg: '#1e293b', cardBg: '#334155', accentColor: '#38bdf8', textColor: '#f8fafc', borderColor: '#475569' }
    },
    {
        id: 'forest',
        name: 'Forest',
        colors: { mainBg: '#052e16', sidebarBg: '#14532d', cardBg: '#166534', accentColor: '#4ade80', textColor: '#f0fdf4', borderColor: '#15803d' }
    },
    {
        id: 'matrix',
        name: 'Matrix',
        colors: { mainBg: '#000000', sidebarBg: '#111111', cardBg: '#0d0d0d', accentColor: '#00ff00', textColor: '#00ff00', borderColor: '#003300' }
    },
    {
        id: 'dracula',
        name: 'Dracula',
        colors: { mainBg: '#282a36', sidebarBg: '#44475a', cardBg: '#6272a4', accentColor: '#bd93f9', textColor: '#f8f8f2', borderColor: '#44475a' }
    },
    {
        id: 'banana',
        name: '🎀 Banana',
        colors: {
            mainBg: '#fff0f5',      // Lavender Blush: Soft, creamy pink base
            sidebarBg: '#ffc2d4',   // Carnation Pink: Lively but soft sidebar
            cardBg: '#ffffff',      // White: Clean cards for contrast
            accentColor: '#ff3385', // Raspberry Pink: Energetic pop
            textColor: '#8b1c4b',   // Dark Berry: Readable, softer than black
            borderColor: '#ffade0'  // Pink Lace: Soft ribbon-like borders
        }
    }
];

// Keyboard Shortcuts
export const KEYBOARD_SHORTCUTS = [
    { key: 'Cmd/Ctrl + K', label: 'Command Palette' },
    { key: 'Cmd/Ctrl + J', label: 'AI Assistant' },
    { key: 'C', label: 'Create New Task' },
    { key: 'Space', label: 'Start/Pause Timer' },
    { key: '?', label: 'Shortcuts Help' },
    { key: 'Esc', label: 'Close Modals' }
];
