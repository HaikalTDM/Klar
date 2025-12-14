import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as chrono from 'chrono-node';
import confetti from 'canvas-confetti';
import {
    Check, Plus, Trash2, X, LayoutGrid, Settings, Command,
    Loader2, Play, Pause, Square, Edit3, Save, Coffee, Brain,
    Calendar, AlignLeft, Volume2, VolumeX, Maximize2,
    BarChart2, Activity, Flame, CheckCircle2, CloudRain, Wind, Waves,
    Repeat, HelpCircle, Search, Keyboard, Moon, Sun, Monitor,
    Sliders, Palette, RefreshCcw, Wand2, LogOut, User, MoveRight,
    Share2, Users, UserPlus, Sparkles, Gift, Film, ShoppingCart, Tag, Flag, Mic, Eye, EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Imports
import { auth, db, appId } from '../config/firebase';
import {
    signInAnonymously, onAuthStateChanged, signInWithCustomToken, signOut
} from 'firebase/auth';
import {
    collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot,
    serverTimestamp, setDoc, query, where, getDoc, arrayUnion, getDocs
} from 'firebase/firestore';
import { SoundEngine } from '../utils/soundEngine';
import { ProgressRing } from './ProgressRing';
import Starfield from './Starfield';
import { AICommandBar } from './AICommandBar';
import { chatCompletion } from '../utils/deepseek';
import { buildAIContext, getQuickActions } from '../utils/aiContext';

import {
    THEMES, EMOJIS, SOUNDSCAPES, RECURRENCE_OPTIONS,
    DEFAULT_CUSTOM_THEME, CUSTOM_PRESETS, KEYBOARD_SHORTCUTS
} from '../constants';
import {
    NewContextModal,
    DetailedTaskModal,
    SettingsModal,
    StatsModal,
    CommandPalette,
    ShortcutsHelpModal,
    ShareContextModal,
    ConfirmDialog,
    UpgradeModal,
    CalendarModal
} from './Modals';

import ZenMode from './ZenMode';
import Dashboard from './Dashboard';
import VoiceModal from './VoiceModal';
import KlarAIModal from './KlarAIModal';
import { useVoiceInput } from '../utils/voiceInput';

export default function KlarApp() {
    // State
    const [user, setUser] = useState(null);
    const [contexts, setContexts] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [allTasks, setAllTasks] = useState([]); // All tasks across all contexts for calendar
    const [focusLogs, setFocusLogs] = useState([]);
    const [activeContextId, setActiveContextId] = useState(null);
    const [loading, setLoading] = useState(true);

    // Zen Mode State
    const [isZenMode, setIsZenMode] = useState(false);
    const [showCompleted, setShowCompleted] = useState(true);

    // AI & Features
    const [showVoiceModal, setShowVoiceModal] = useState(false);
    const [showKlarAI, setShowKlarAI] = useState(false);

    // Theme State
    const [themeMode, setThemeMode] = useState('custom'); // Default to Galaxy
    const [isPremium, setIsPremium] = useState(false); // Premium state
    const [isDark, setIsDark] = useState(true);
    const [themeSchedule, setThemeSchedule] = useState({ start: "19:00", end: "07:00" });
    const [customTheme, setCustomTheme] = useState(DEFAULT_CUSTOM_THEME);

    // Focus Timer State
    const [focusState, setFocusState] = useState({
        taskId: null,
        totalDuration: 25 * 60,
        remaining: 25 * 60,
        isRunning: false,
        mode: 'Pomodoro',
        phase: 'focus',
        cycle: 0
    });

    // Audio State - Mixer Mode: { trackId: volume (0-1) }
    const [soundMixer, setSoundMixer] = useState({});
    // Legacy support for single-sound mode
    const [soundConfig, setSoundConfig] = useState({
        selectedSound: 'none',
        volume: 0.5
    });

    // UI State
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    // Auto-close sidebar on mobile mount
    useEffect(() => {
        if (window.innerWidth < 768) {
            setSidebarOpen(false);
        }
    }, []);

    const [showNewContextModal, setShowNewContextModal] = useState(false);
    const [showTimerSettings, setShowTimerSettings] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date()); // Clock state

    // Update clock every minute
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    const [showDetailedAdd, setShowDetailedAdd] = useState(false);
    const [showStats, setShowStats] = useState(false);
    const [showCommandPalette, setShowCommandPalette] = useState(false);
    const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [showCalendar, setShowCalendar] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState({ show: false, ctxId: null, ctxName: '' });
    const [commandSearch, setCommandSearch] = useState('');
    const [showShareModal, setShowShareModal] = useState(false);
    const [showAICommandBar, setShowAICommandBar] = useState(false);
    const [contextMenu, setContextMenu] = useState({ show: false, taskId: null, x: 0, y: 0 });

    const [customMinutes, setCustomMinutes] = useState(30);
    const [completionToast, setCompletionToast] = useState(null);

    // Forms
    const [newTaskText, setNewTaskText] = useState('');

    // Editing State
    const [editingTask, setEditingTask] = useState(null);

    // Dictation (Free Feature)
    const dictation = useVoiceInput({ continuous: true });
    const [dictationStartText, setDictationStartText] = useState('');

    useEffect(() => {
        if (dictation.isListening) {
            setNewTaskText(dictationStartText + (dictationStartText && dictation.transcript ? ' ' : '') + dictation.transcript);
        }
    }, [dictation.transcript, dictation.isListening]); // dictationStartText is stable enough or included via closure, but safe to exclude from dep array if we don't want re-runs logic issues, though mostly fine.

    const toggleDictation = () => {
        if (dictation.isListening) {
            dictation.stopListening();
        } else {
            setDictationStartText(newTaskText);
            dictation.startListening();
        }
    };

    // Auto-resize Input
    const inputRef = useRef(null);
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.style.height = '56px'; // h-14
            const scrollHeight = inputRef.current.scrollHeight;
            if (scrollHeight > 56) {
                inputRef.current.style.height = scrollHeight + 'px';
            }
        }
    }, [newTaskText]);

    // Forms
    const [detailedForm, setDetailedForm] = useState({
        text: '', description: '', date: '', time: '', recurrence: 'none', priority: 'medium'
    });

    // New Context Form
    const [newContextName, setNewContextName] = useState('');
    const [newContextEmoji, setNewContextEmoji] = useState(EMOJIS[0]);
    const [newContextTheme, setNewContextTheme] = useState(THEMES[0]);
    const [newContextIsShared, setNewContextIsShared] = useState(false);

    // ToyyibPay Payment Handler
    const handleToyyibUpgrade = () => {
        // TODO: Replace with your ToyyibPay Category Code or Bill Code URL
        // Create a Bill/Category in ToyyibPay dashboard > Category > Add New Category
        const paymentUrl = 'https://toyyibpay.com/your-category-code';
        window.location.href = paymentUrl;
    };

    // AI Access Handler
    const handleOpenAI = () => {
        if (!isPremium) {
            setShowUpgradeModal(true);
            return;
        }
        setShowKlarAI(true);
    };

    // Logout
    const handleLogout = async () => {
        try {
            await signOut(auth);
            window.location.reload();
        } catch (error) {
            console.error("Logout Error:", error);
        }
    };
    // Check for ToyyibPay Success (status_id=1)
    useEffect(() => {
        const query = new URLSearchParams(window.location.search);
        if (query.get('status_id') === '1') {
            setCompletionToast({ text: "Payment Successful!", sub: "Welcome to Premium" });
            setIsPremium(true);

            if (user) {
                const settingsRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'preferences');
                setDoc(settingsRef, { isPremium: true }, { merge: true });
            }

            setTimeout(() => {
                setCompletionToast(null);
                // Clean URL
                window.history.replaceState({}, document.title, window.location.pathname);
            }, 4000);
        }
    }, [user]);

    // --- 1. Authentication & Profile Registration ---
    useEffect(() => {
        console.log('[DEBUG] KlarApp auth listener starting...');
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            console.log('[DEBUG] Auth state changed:', currentUser ? currentUser.uid : 'null');
            if (currentUser) {
                setUser(currentUser);
                setLoading(false);

                // Register User for Lookup (if they have email)
                if (currentUser.email) {
                    try {
                        const emailKey = currentUser.email.toLowerCase().replace(/\./g, ','); // Simple encoding
                        const lookupRef = doc(db, 'artifacts', appId, 'user_lookup', emailKey);
                        await setDoc(lookupRef, {
                            uid: currentUser.uid,
                            email: currentUser.email,
                            displayName: currentUser.displayName || 'User',
                            photoURL: currentUser.photoURL
                        }, { merge: true });
                    } catch (e) {
                        console.error("Profile registration failed", e);
                    }
                }
            } else {
                console.log('[DEBUG] No user in KlarApp auth listener');
                // No user - redirect to login or show landing page
                // Don't auto sign-in anonymously as it creates a new UID each time
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    // --- 2. Data Fetching ---
    useEffect(() => {
        console.log('[DEBUG] Data fetch effect running, user:', user ? user.uid : 'null');
        if (!user) {
            console.log('[DEBUG] Data fetch effect returning early - no user');
            return;
        }

        console.log('[DEBUG] Setting up Firestore listeners for user:', user.uid);
        console.log('[DEBUG] appId:', appId);
        console.log('[DEBUG] db object exists:', !!db);

        // Direct test read to check Firestore connection
        const testRef = collection(db, 'artifacts', appId, 'users', user.uid, 'contexts');
        console.log('[DEBUG] About to call getDocs...');

        const timeoutId = setTimeout(() => {
            console.error('[DEBUG] getDocs timeout after 5 seconds - Firestore not responding!');
        }, 5000);

        getDocs(testRef).then((snapshot) => {
            clearTimeout(timeoutId);
            console.log('[DEBUG] Direct getDocs test - found:', snapshot.docs.length, 'contexts');
        }).catch((error) => {
            clearTimeout(timeoutId);
            console.error('[DEBUG] Direct getDocs test ERROR:', error);
        });

        // Settings
        const settingsDoc = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'preferences');
        const unsubSettings = onSnapshot(settingsDoc, (docSnap) => {
            console.log('[DEBUG] Settings snapshot received');
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.themeMode) setThemeMode(data.themeMode);
                if (data.themeSchedule) setThemeSchedule(data.themeSchedule);
                if (data.customTheme) setCustomTheme(data.customTheme);
                if (data.isPremium !== undefined) setIsPremium(data.isPremium);
            }
        }, (error) => {
            console.error('[DEBUG] Settings snapshot error:', error);
        });

        // Personal Contexts
        const personalRef = collection(db, 'artifacts', appId, 'users', user.uid, 'contexts');
        // Shared Contexts
        const sharedRef = query(
            collection(db, 'artifacts', appId, 'shared_contexts'),
            where('members', 'array-contains', user.uid)
        );

        let personalContexts = [];
        let sharedContexts = [];

        const updateContexts = async () => {
            const combined = [...personalContexts, ...sharedContexts];
            combined.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
            setContexts(combined);

            if (!activeContextId && combined.length > 0) {
                setActiveContextId(combined[0].id);
            } else if (combined.length === 0) {
                // Auto-create Inbox if no contexts exist
                try {
                    await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'contexts'), {
                        name: 'Inbox',
                        emoji: '📥',
                        themeId: 'galaxy', // Default theme
                        createdAt: serverTimestamp(),
                        isShared: false,
                        members: []
                    });
                } catch (e) {
                    console.error("Failed to create default Inbox", e);
                }
            }
            setLoading(false);
        };

        const unsubPersonal = onSnapshot(personalRef, (snapshot) => {
            console.log('[DEBUG] Fetching contexts for UID:', user.uid);
            console.log('[DEBUG] Found personal contexts:', snapshot.docs.length);
            personalContexts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), isShared: false }));
            updateContexts();
        }, (error) => {
            console.error('[DEBUG] Personal contexts snapshot error:', error);
        });

        const unsubShared = onSnapshot(sharedRef, (snapshot) => {
            console.log('[DEBUG] Shared contexts snapshot received:', snapshot.docs.length);
            sharedContexts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), isShared: true }));
            updateContexts();
        }, (error) => {
            console.error('[DEBUG] Shared contexts snapshot error:', error);
        });

        // Focus Logs
        const logsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'focus_logs');
        const unsubLogs = onSnapshot(logsRef, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setFocusLogs(data);
        }, (error) => {
            console.error('[DEBUG] Focus logs snapshot error:', error);
        });

        return () => {
            console.log('[DEBUG] Cleaning up Firestore listeners');
            unsubPersonal(); unsubShared(); unsubLogs(); unsubSettings();
        };
    }, [user]);

    // --- 2.5 Task Subscription (Dynamic) ---
    useEffect(() => {
        if (!user || !activeContextId) return;

        const activeCtx = contexts.find(c => c.id === activeContextId);
        let tasksRef;

        if (activeCtx?.isShared) {
            tasksRef = collection(db, 'artifacts', appId, 'shared_contexts', activeContextId, 'tasks');
        } else {
            tasksRef = collection(db, 'artifacts', appId, 'users', user.uid, 'tasks');
        }

        const unsubTasks = onSnapshot(tasksRef, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), contextId: activeCtx?.isShared ? activeContextId : doc.data().contextId }));
            setTasks(data);
        });

        return () => unsubTasks();
    }, [user, activeContextId, contexts]);

    // --- 2.6 All Tasks Subscription (for Calendar) ---
    useEffect(() => {
        if (!user || contexts.length === 0) return;

        const unsubscribers = [];
        let aggregatedTasks = [];

        // Fetch tasks from all personal contexts
        const personalTasksRef = collection(db, 'artifacts', appId, 'users', user.uid, 'tasks');
        const unsubPersonalTasks = onSnapshot(personalTasksRef, (snapshot) => {
            const personalTasks = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Fetch tasks from all shared contexts
            const sharedContextIds = contexts.filter(c => c.isShared).map(c => c.id);
            const sharedTasksPromises = sharedContextIds.map(ctxId => {
                return new Promise((resolve) => {
                    const sharedTasksRef = collection(db, 'artifacts', appId, 'shared_contexts', ctxId, 'tasks');
                    const unsub = onSnapshot(sharedTasksRef, (snapshot) => {
                        const tasks = snapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data(),
                            contextId: ctxId
                        }));
                        resolve(tasks);
                    });
                    unsubscribers.push(unsub);
                });
            });

            Promise.all(sharedTasksPromises).then(sharedTasksArrays => {
                const allSharedTasks = sharedTasksArrays.flat();
                aggregatedTasks = [...personalTasks, ...allSharedTasks];
                setAllTasks(aggregatedTasks);
            });
        });

        unsubscribers.push(unsubPersonalTasks);

        return () => {
            unsubscribers.forEach(unsub => unsub());
        };
    }, [user, contexts]);

    // Save Settings Helper
    const saveSettings = async (newSettings) => {
        if (!user) return;
        try {
            await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'preferences'), newSettings, { merge: true });
        } catch (e) { console.error("Error saving settings", e); }
    };

    // --- 3. Dark Mode Logic ---
    useEffect(() => {
        const checkTheme = () => {
            if (themeMode === 'system') {
                const now = new Date();
                const currentMinutes = now.getHours() * 60 + now.getMinutes();
                const [startH, startM] = themeSchedule.start.split(':').map(Number);
                const startMinutes = startH * 60 + startM;
                const [endH, endM] = themeSchedule.end.split(':').map(Number);
                const endMinutes = endH * 60 + endM;
                let isNight = false;
                if (startMinutes < endMinutes) {
                    isNight = currentMinutes >= startMinutes && currentMinutes < endMinutes;
                } else {
                    isNight = currentMinutes >= startMinutes || currentMinutes < endMinutes;
                }
                setIsDark(isNight);
            } else if (themeMode === 'custom') {
                setIsDark(true);
            } else {
                setIsDark(themeMode === 'dark');
            }
        };
        checkTheme();
        const interval = setInterval(checkTheme, 60000);
        return () => clearInterval(interval);
    }, [themeMode, themeSchedule]);

    // --- 4. Keyboard Shortcuts ---
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                if (e.key === 'Escape') {
                    setShowCommandPalette(false);
                    setShowShortcutsHelp(false);
                    setShowDetailedAdd(false);
                    setShowNewContextModal(false);
                    setShowTimerSettings(false);
                    setShowStats(false);
                    setEditingTask(null);
                    setShowShareModal(false);
                    e.target.blur();
                }
                return;
            }
            if (e.key === '?' && !e.metaKey && !e.ctrlKey) setShowShortcutsHelp(prev => !prev);

            // Cmd+K for Command Palette
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setShowCommandPalette(prev => !prev);
            }

            // Cmd+J for Klar AI
            if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
                e.preventDefault();
                if (!isPremium) {
                    setShowUpgradeModal(true);
                    return;
                }
                setShowKlarAI(prev => !prev);
            }

            // Space bar for timer
            if (e.code === 'Space' && focusState.taskId && !showNewContextModal && !showDetailedAdd && !showTimerSettings && !showStats && !showCommandPalette && !showShortcutsHelp && !showShareModal && !showAICommandBar) {
                e.preventDefault();
                setFocusState(prev => ({ ...prev, isRunning: !prev.isRunning }));
            }

            if (e.key === 'Escape') {
                setShowCommandPalette(false);
                setShowShortcutsHelp(false);
                setShowDetailedAdd(false);
                setShowNewContextModal(false);
                setShowTimerSettings(false);
                setShowStats(false);
                setEditingTask(null);
                setShowShareModal(false);
                setShowAICommandBar(false);
                setDeleteConfirm({ show: false, ctxId: null, ctxName: '' });
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // --- 5. Audio & Timer Logic ---
    // Sound Mixer effect - applies when timer is running
    useEffect(() => {
        if (focusState.isRunning) {
            // Check if mixer has any active tracks
            const hasActiveTracks = Object.values(soundMixer).some(vol => vol > 0);
            if (hasActiveTracks) {
                SoundEngine.applyMixerConfig(soundMixer);
            } else if (soundConfig.selectedSound !== 'none') {
                // Fallback to legacy single sound
                SoundEngine.startAmbient(soundConfig.selectedSound, soundConfig.volume);
            }
        } else {
            SoundEngine.stopAll();
        }
        return () => SoundEngine.stopAll();
    }, [focusState.isRunning, soundMixer, soundConfig.selectedSound]);

    // Update individual track volumes in real-time
    useEffect(() => {
        if (focusState.isRunning) {
            SoundEngine.applyMixerConfig(soundMixer);
        }
    }, [soundMixer]);

    useEffect(() => {
        let interval = null;
        if (focusState.isRunning && focusState.remaining > 0) {
            interval = setInterval(() => {
                setFocusState(prev => ({ ...prev, remaining: prev.remaining - 1 }));
            }, 1000);
        } else if (focusState.remaining === 0 && focusState.isRunning) {
            SoundEngine.playAlarm();
            SoundEngine.stopAmbient();
            if (focusState.phase === 'focus') logFocusSession(focusState.totalDuration);
            if (focusState.mode === 'Pomodoro') {
                setFocusState(prev => {
                    const isFocusPhase = prev.phase === 'focus';
                    const newCycle = isFocusPhase ? prev.cycle + 1 : prev.cycle;
                    let nextPhase = 'focus';
                    let nextDuration = 25 * 60;
                    if (isFocusPhase) {
                        if (newCycle >= 4) {
                            nextPhase = 'longBreak';
                            nextDuration = 15 * 60;
                        } else {
                            nextPhase = 'shortBreak';
                            nextDuration = 5 * 60;
                        }
                    } else {
                        nextPhase = 'focus';
                        nextDuration = 25 * 60;
                    }
                    return {
                        ...prev,
                        isRunning: false,
                        remaining: nextDuration,
                        totalDuration: nextDuration,
                        phase: nextPhase,
                        cycle: (!isFocusPhase && prev.phase === 'longBreak') ? 0 : newCycle
                    };
                });
            } else {
                setFocusState(prev => ({ ...prev, isRunning: false }));
                logFocusSession(focusState.totalDuration);
            }
        }
        return () => clearInterval(interval);
    }, [focusState.isRunning, focusState.remaining, focusState.mode, focusState.phase, focusState.totalDuration]);

    useEffect(() => {
        if (focusState.isRunning) setFocusState(prev => ({ ...prev, isRunning: false }));
    }, [activeContextId]);

    // Helper Functions
    const logFocusSession = async (durationSeconds) => {
        if (!user) return;
        try {
            await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'focus_logs'), {
                duration: durationSeconds,
                timestamp: serverTimestamp(),
                date: new Date().toISOString().split('T')[0]
            });
        } catch (e) { console.error(e); }
    };

    const getNextDate = (currentDateStr, recurrenceType) => {
        const baseDate = currentDateStr ? new Date(currentDateStr) : new Date();
        if (recurrenceType === 'daily') baseDate.setDate(baseDate.getDate() + 1);
        if (recurrenceType === 'weekly') baseDate.setDate(baseDate.getDate() + 7);
        if (recurrenceType === 'monthly') baseDate.setMonth(baseDate.getMonth() + 1);
        return baseDate.toISOString();
    };

    // Handlers
    const handleCreateContext = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (!newContextName.trim() || !user) return;

        // Capture values and close modal immediately for snappy UX
        const contextName = newContextName;
        const contextEmoji = newContextEmoji || EMOJIS[0];
        const contextTheme = newContextTheme;
        const isShared = newContextIsShared;

        setNewContextName('');
        setNewContextEmoji(EMOJIS[0]);
        setNewContextTheme(THEMES[0]);
        setShowNewContextModal(false);
        setNewContextIsShared(false);

        try {
            const contextData = {
                name: contextName,
                emoji: contextEmoji,
                themeId: contextTheme.id,
                isShared: isShared,
                createdAt: serverTimestamp(),
                members: isShared ? [user.uid] : []
            };

            const collectionPath = isShared ? 'shared_contexts' : `users/${user.uid}/contexts`;
            const docRef = await addDoc(collection(db, 'artifacts', appId, collectionPath), contextData);
            setActiveContextId(docRef.id);
        } catch (e) { console.error(e); }
    };

    // State for confirmation dialog (moved to top with other state)

    const handleDeleteContext = async (ctxId) => {
        if (!user) return;
        const ctx = contexts.find(c => c.id === ctxId);
        if (!ctx) return;
        // Show custom confirmation
        setDeleteConfirm({ show: true, ctxId, ctxName: ctx.name });
    };

    const confirmDeleteContext = async () => {
        const { ctxId } = deleteConfirm;

        // Close dialog immediately for snappy UX
        setDeleteConfirm({ show: false, ctxId: null, ctxName: '' });

        const ctx = contexts.find(c => c.id === ctxId);
        if (!ctx) return;

        try {
            if (ctx.isShared) {
                await deleteDoc(doc(db, 'artifacts', appId, 'shared_contexts', ctxId));
            } else {
                await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'contexts', ctxId));
            }
            if (activeContextId === ctxId) setActiveContextId(null);
        } catch (e) {
            console.error('Failed to delete context:', e);
        }
    };

    // --- PALs / AI Insights ---
    const [showPalsModal, setShowPalsModal] = useState(false);
    const [palsLoading, setPalsLoading] = useState(false);
    const [palsData, setPalsData] = useState(null);

    const handleOpenPals = async (specificTask = null) => {
        if (!user) return;

        if (!isPremium) {
            setShowUpgradeModal(true);
            return;
        }
        setShowPalsModal(true);
        setPalsLoading(true);
        setPalsData(null);

        try {
            const context = buildAIContext({
                activeContext,
                tasks,
                contexts,
                focusState,
                focusLogs,
                user
            });

            // "PALs" prompt: Twos-style Categorization & Action
            let prompt = `Review my list. Identify items that fit into categories (e.g. Birthday, Movie, Grocery) and suggest specific actions (e.g. 'Set yearly reminder', 'Add to shopping list'). Return as 'enhance_task' actions. Also provide general 'create_task' suggestions if I missed anything.`;

            if (specificTask && typeof specificTask === 'string') {
                prompt = `Analyze this specific task: "${specificTask}". Identify its category (Birthday, Movie, Grocery, etc) and suggest a specific enhancement (recurrence, due date, subtasks) as an 'enhance_task' action.`;
            }

            const response = await chatCompletion(prompt, context);
            setPalsData(response);
        } catch (e) {
            console.error(e);
            setPalsData({ message: "I'm having trouble connecting to my brain right now. Please try again in a moment.", actions: [] });
        } finally {
            setPalsLoading(false);
        }
    };

    const handlePalsAction = async (action) => {
        if (!user || !activeContextId) return;

        // Task Form Interception (Applies to open modal)
        if (showDetailedAdd) {
            const isEdit = !!editingTask;
            const setter = isEdit ? setEditingTask : setDetailedForm;
            const current = isEdit ? editingTask : detailedForm;

            if (action.type === 'enhance_task' || action.type === 'create_task') {
                setter({
                    ...current,
                    // Append suggestion to description or replace if empty
                    description: action.data.suggestion || action.data.description || current.description,
                    recurrence: action.data.autoApply?.recurrence || current.recurrence,
                    // Simple date handling (assumes YYYY-MM-DD from AI or keeps current)
                    date: action.data.autoApply?.dueDate ? action.data.autoApply.dueDate.split('T')[0] : current.date
                });
                if (action.type === 'break_down' && action.data.subtasks) {
                    setter({
                        ...current,
                        subtasks: [...(current.subtasks || []), ...action.data.subtasks.map((t, i) => ({ id: Date.now() + i, text: t, isDone: false }))]
                    });
                }

                setCompletionToast({ text: 'Applied to Task Form!', id: Date.now() });
                setTimeout(() => setCompletionToast(null), 3000);
                setShowPalsModal(false);
                return;
            }
        }

        try {
            const activeCtx = contexts.find(c => c.id === activeContextId);
            const collectionPath = activeCtx?.isShared
                ? `artifacts/${appId}/shared_contexts/${activeContextId}/tasks`
                : `artifacts/${appId}/users/${user.uid}/tasks`;
            const tasksRef = collection(db, collectionPath);

            if (action.type === 'create_task' || action.type === 'enhance_task') {
                const taskData = action.type === 'enhance_task' ? {
                    text: action.data.text,
                    description: action.data.suggestion || '',
                    recurrence: action.data.autoApply?.recurrence || 'none',
                    dueDate: action.data.autoApply?.dueDate || null
                } : {
                    text: action.data.text,
                    description: action.data.description || '',
                    recurrence: 'none',
                    dueDate: action.data.dueDate || null
                };

                const subtasks = (action.data.subtasks || []).map((item, i) => ({
                    id: Date.now() + i,
                    text: typeof item === 'string' ? item : (item.text || item.title || JSON.stringify(item)),
                    isDone: false
                }));

                await addDoc(tasksRef, {
                    text: taskData.text,
                    description: taskData.description,
                    subtasks: subtasks,
                    contextId: activeContextId,
                    isDone: false,
                    createdAt: serverTimestamp(),
                    dueDate: taskData.dueDate,
                    recurrence: taskData.recurrence || 'none'
                });
                setCompletionToast({ text: 'Action Applied!', id: Date.now() });
            } else if (action.type === 'break_down' && action.data.subtasks) {
                for (const subtask of action.data.subtasks) {
                    await addDoc(tasksRef, {
                        text: subtask,
                        contextId: activeContextId,
                        isDone: false,
                        createdAt: serverTimestamp()
                    });
                }
                setCompletionToast({ text: 'Tasks added!', id: Date.now() });
            }
            setTimeout(() => setCompletionToast(null), 3000);
            if (action.type !== 'tip') setShowPalsModal(false); // Close if action taken
        } catch (e) { console.error(e); }
    };

    const handleQuickCreateTask = async (e) => {
        e.preventDefault();
        if (!newTaskText.trim() || !user || !activeContextId) return;

        const rawText = newTaskText.trim();
        setNewTaskText('');

        let isNote = false;
        let cleanText = rawText;

        if (cleanText.startsWith('- ')) {
            isNote = true;
            cleanText = cleanText.substring(2).trim();
        }

        let parsedDate = null;
        if (!isNote) {
            const results = chrono.parse(cleanText);
            if (results.length > 0) {
                const result = results[0];
                parsedDate = result.start.date().toISOString();
                cleanText = cleanText.replace(result.text, '').replace(/\s+/g, ' ').trim();
            }
        }

        try {
            const activeCtx = contexts.find(c => c.id === activeContextId);
            const collectionPath = activeCtx?.isShared
                ? `artifacts/${appId}/shared_contexts/${activeContextId}/tasks`
                : `artifacts/${appId}/users/${user.uid}/tasks`;

            await addDoc(collection(db, collectionPath), {
                text: cleanText,
                description: '',
                subtasks: [],
                dueDate: parsedDate,
                recurrence: 'none',
                contextId: activeContextId,
                isDone: false,
                type: isNote ? 'note' : 'task',
                createdAt: serverTimestamp()
            });
            SoundEngine.playComplete();
        } catch (err) { console.error(err); }
    };

    const handleDetailedCreateTask = async (e) => {
        e.preventDefault();
        if (!detailedForm.text.trim() || !user || !activeContextId) return;
        let dueTimestamp = null;
        if (detailedForm.date) {
            const dateStr = detailedForm.time ? `${detailedForm.date}T${detailedForm.time}` : `${detailedForm.date}T23:59`;
            dueTimestamp = new Date(dateStr).toISOString();
        }

        const activeCtx = contexts.find(c => c.id === activeContextId);
        const collectionPath = activeCtx?.isShared
            ? `artifacts/${appId}/shared_contexts/${activeContextId}/tasks`
            : `artifacts/${appId}/users/${user.uid}/tasks`;

        try {
            await addDoc(collection(db, collectionPath), {
                text: detailedForm.text,
                description: detailedForm.description,
                subtasks: detailedForm.subtasks || [],
                dueDate: dueTimestamp,
                recurrence: detailedForm.recurrence,
                priority: detailedForm.priority || 'medium',
                contextId: activeContextId,
                isDone: false,
                createdAt: serverTimestamp()
            });
            setShowDetailedAdd(false);
            setDetailedForm({ text: '', description: '', date: '', time: '', recurrence: 'none', priority: 'medium' });
        } catch (err) { console.error(err); }
    };

    const toggleTask = async (task) => {
        if (!user) return;
        const newIsDone = !task.isDone;

        if (newIsDone) {
            SoundEngine.playComplete();
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: themeMode === 'custom' ? [customTheme.accentColor, '#ffffff'] : ['#10b981', '#3b82f6']
            });
        }

        const ctx = contexts.find(c => c.id === task.contextId);
        const isShared = ctx?.isShared;
        const collectionPath = isShared
            ? `artifacts/${appId}/shared_contexts/${task.contextId}/tasks`
            : `artifacts/${appId}/users/${user.uid}/tasks`;

        const updateData = { isDone: newIsDone };
        if (newIsDone) updateData.completedAt = serverTimestamp();

        await updateDoc(doc(db, collectionPath, task.id), updateData);

        if (newIsDone && task.recurrence && task.recurrence !== 'none') {
            const nextDueDate = getNextDate(task.dueDate, task.recurrence);
            try {
                await addDoc(collection(db, collectionPath), {
                    text: task.text,
                    description: task.description,
                    dueDate: nextDueDate,
                    recurrence: task.recurrence,
                    contextId: task.contextId,
                    isDone: false,
                    createdAt: serverTimestamp()
                });
                setCompletionToast({ text: "Task Repeated", sub: `Next due: ${new Date(nextDueDate).toLocaleDateString()}` });
            } catch (e) { console.error(e); }
        } else if (newIsDone) {
            setCompletionToast({ text: "Nice work!", sub: "Task completed" });

            // Auto-Cleanup: Delete older completed tasks with the same name
            const redundantTasks = tasks.filter(t =>
                t.contextId === task.contextId &&
                t.text.trim().toLowerCase() === task.text.trim().toLowerCase() &&
                t.isDone &&
                t.id !== task.id
            );

            if (redundantTasks.length > 0) {
                console.log(`Cleaning up ${redundantTasks.length} redundant tasks...`);
                redundantTasks.forEach(oldTask => {
                    deleteDoc(doc(db, collectionPath, oldTask.id)).catch(e => console.error("Cleanup error", e));
                });
            }
        }

        if (focusState.taskId === task.id && newIsDone) {
            setFocusState(prev => ({ ...prev, isRunning: false, taskId: null }));
        } else if (focusState.taskId === task.id && !newIsDone) {
            setFocusState(prev => ({ ...prev, isRunning: false }));
        }

        if (newIsDone) setTimeout(() => setCompletionToast(null), 3000);
    };

    const deleteTask = async (taskId) => {
        if (!user) return;
        try {
            const task = tasks.find(t => t.id === taskId);
            if (!task) return;

            const activeCtx = contexts.find(c => c.id === activeContextId);
            const collectionPath = activeCtx?.isShared
                ? `artifacts/${appId}/shared_contexts/${activeContextId}/tasks`
                : `artifacts/${appId}/users/${user.uid}/tasks`;

            await deleteDoc(doc(db, collectionPath, taskId));

            // Stop timer if deleting focused task
            if (focusState.taskId === taskId) {
                setFocusState({ ...focusState, taskId: null, isRunning: false });
            }
        } catch (err) { console.error(err); }
    };

    const handleMoveTask = async (taskId, targetContextId) => {
        if (!user || !taskId || !targetContextId) return;

        try {
            const task = tasks.find(t => t.id === taskId);
            if (!task) return;

            const sourceCtx = contexts.find(c => c.id === task.contextId);
            const targetCtx = contexts.find(c => c.id === targetContextId);

            // Delete from source
            const sourceCollectionPath = sourceCtx?.isShared
                ? `artifacts/${appId}/shared_contexts/${task.contextId}/tasks`
                : `artifacts/${appId}/users/${user.uid}/tasks`;

            // Add to target
            const targetCollectionPath = targetCtx?.isShared
                ? `artifacts/${appId}/shared_contexts/${targetContextId}/tasks`
                : `artifacts/${appId}/users/${user.uid}/tasks`;

            // Create in new location
            await addDoc(collection(db, targetCollectionPath), {
                text: task.text,
                description: task.description || '',
                subtasks: task.subtasks || [],
                dueDate: task.dueDate || null,
                recurrence: task.recurrence || 'none',
                contextId: targetContextId,
                isDone: task.isDone,
                createdAt: serverTimestamp()
            });

            // Delete from old location
            await deleteDoc(doc(db, sourceCollectionPath, taskId));

            setContextMenu({ show: false, taskId: null, x: 0, y: 0 });
            setCompletionToast({ text: `Moved to ${targetCtx.name}`, id: Date.now() });
            setTimeout(() => setCompletionToast(null), 3000);
        } catch (err) {
            console.error('Move task error:', err);
        }
    };

    const startEditing = (task) => {
        let dateStr = '';
        let timeStr = '';
        if (task.dueDate) {
            const d = new Date(task.dueDate);
            dateStr = d.toISOString().split('T')[0];
            timeStr = d.toTimeString().slice(0, 5);
        }
        setEditingTask({
            id: task.id,
            text: task.text,
            description: task.description || '',
            subtasks: task.subtasks || [],
            date: dateStr,
            time: timeStr,
            recurrence: task.recurrence || 'none',
            priority: task.priority || 'medium',
            contextId: task.contextId
        });
        setShowDetailedAdd(true);
    };

    const saveTaskEdit = async (e) => {
        if (e) e.preventDefault();
        if (!user || !editingTask) return;
        let dueTimestamp = null;
        if (editingTask.date) {
            const dateStr = editingTask.time ? `${editingTask.date}T${editingTask.time}` : `${editingTask.date}T23:59`;
            dueTimestamp = new Date(dateStr).toISOString();
        }

        const ctx = contexts.find(c => c.id === editingTask.contextId);
        const isShared = ctx?.isShared;
        const collectionPath = isShared
            ? `artifacts/${appId}/shared_contexts/${editingTask.contextId}/tasks`
            : `artifacts/${appId}/users/${user.uid}/tasks`;

        await updateDoc(doc(db, collectionPath, editingTask.id), {
            text: editingTask.text,
            description: editingTask.description,
            subtasks: editingTask.subtasks || [],
            dueDate: dueTimestamp,
            recurrence: editingTask.recurrence,
            priority: editingTask.priority || 'medium'
        });
        setEditingTask(null);
        setShowDetailedAdd(false);
    };

    const toggleTimer = (taskId) => {
        if (focusState.taskId === taskId) {
            setFocusState(prev => ({ ...prev, isRunning: !prev.isRunning }));
        } else {
            setFocusState({
                taskId,
                totalDuration: 25 * 60,
                remaining: 25 * 60,
                isRunning: true,
                mode: 'Pomodoro',
                phase: 'focus',
                cycle: 0
            });
        }
    };

    const stopTimer = () => {
        resetTimer();
    };

    const resetTimer = () => {
        setFocusState({
            taskId: null,
            totalDuration: 25 * 60,
            remaining: 25 * 60,
            isRunning: false,
            mode: 'Pomodoro',
            phase: 'focus',
            cycle: 0
        });
    };

    const setTimerSettings = (minutes, label) => {
        const seconds = minutes * 60;
        setFocusState(prev => ({
            ...prev,
            totalDuration: seconds,
            remaining: seconds,
            mode: label,
            phase: 'focus',
            cycle: 0,
            isRunning: false
        }));
        setShowTimerSettings(false);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Voice Action Handler
    const handleVoiceAction = async (action) => {
        if (!action) return;

        if (action.intent === 'create_task') {
            const ctxId = action.contextId || activeContextId || contexts[0]?.id;
            const targetCtx = contexts.find(c => c.id === ctxId) || contexts[0];

            if (!targetCtx || !user) return;

            const isShared = targetCtx.isShared;
            const collectionPath = isShared
                ? `artifacts/${appId}/shared_contexts/${targetCtx.id}/tasks`
                : `artifacts/${appId}/users/${user.uid}/tasks`;

            try {
                await addDoc(collection(db, collectionPath), {
                    text: action.text,
                    description: '',
                    subtasks: [],
                    dueDate: action.date ? new Date(action.date).toISOString() : null,
                    recurrence: 'none',
                    priority: action.priority || 'medium',
                    contextId: targetCtx.id,
                    isDone: false,
                    createdAt: serverTimestamp()
                });
                setCompletionToast(`Created "${action.text}" in ${targetCtx.name}`);
                setTimeout(() => setCompletionToast(null), 3000);
            } catch (e) { console.error("Voice create error", e); }

        } else if (action.intent === 'navigate') {
            setActiveContextId(action.contextId);
        }
    };

    // Toggle subtask completion (for Zen Mode)
    const toggleSubtask = async (taskId, subtaskId) => {
        if (!user) return;
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        const updatedSubtasks = (task.subtasks || []).map(s =>
            s.id === subtaskId ? { ...s, isDone: !s.isDone } : s
        );

        const ctx = contexts.find(c => c.id === task.contextId);
        const isShared = ctx?.isShared;
        const collectionPath = isShared
            ? `artifacts/${appId}/shared_contexts/${task.contextId}/tasks`
            : `artifacts/${appId}/users/${user.uid}/tasks`;

        try {
            await updateDoc(doc(db, collectionPath, taskId), { subtasks: updatedSubtasks });
        } catch (e) {
            console.error("Error toggling subtask:", e);
        }
    };

    // Enter Zen Mode for a specific task
    const enterZenMode = (task) => {
        // Set the focus state to this task
        if (focusState.taskId !== task.id) {
            setFocusState({
                taskId: task.id,
                totalDuration: 25 * 60,
                remaining: 25 * 60,
                isRunning: false, // Will auto-start in ZenMode
                mode: 'Pomodoro',
                phase: 'focus',
                cycle: 0
            });
        }
        setIsZenMode(true);
    };

    const formatDueDate = (isoString) => {
        if (!isoString) return null;
        const date = new Date(isoString);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        const isOverdue = date < now;
        return {
            text: isToday ? `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
            isOverdue
        };
    };

    const statsData = useMemo(() => {
        const today = new Date();
        const last100Days = [];
        let totalSeconds = 0;
        let totalCompletedTasks = 0;
        const taskDateMap = {};

        focusLogs.forEach(log => {
            totalSeconds += (log.duration || 0);
        });

        tasks.forEach(task => {
            if (task.isDone && task.completedAt) {
                let dateStr = '';
                try {
                    const d = task.completedAt.seconds ? new Date(task.completedAt.seconds * 1000) : new Date(task.completedAt);
                    dateStr = d.toISOString().split('T')[0];
                } catch (e) {
                    dateStr = new Date().toISOString().split('T')[0];
                }
                if (!taskDateMap[dateStr]) taskDateMap[dateStr] = 0;
                taskDateMap[dateStr] += 1;
                totalCompletedTasks += 1;
            }
        });

        for (let i = 84; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            last100Days.push({ date: dateStr, count: taskDateMap[dateStr] || 0 });
        }

        const totalHours = Math.round(totalSeconds / 3600);
        return { grid: last100Days, totalHours, totalCompletedTasks };
    }, [focusLogs, tasks]);

    const activeContext = contexts.find(c => c.id === activeContextId);
    const activeTasks = tasks.filter(t => t.contextId === activeContextId);
    const activeTheme = THEMES.find(t => t.id === activeContext?.themeId) || THEMES[0];

    const sortedTasks = [...activeTasks].sort((a, b) => {
        if (focusState.taskId === a.id) return -1;
        if (focusState.taskId === b.id) return 1;
        if (a.isDone !== b.isDone) return a.isDone ? 1 : -1;
        return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
    });

    const visibleTasks = useMemo(() => {
        const tasksToShow = showCompleted ? sortedTasks : sortedTasks.filter(t => !t.isDone);

        // Deduplicate completed tasks by name (keep only the latest one)
        const uniqueTasks = [];
        const seenCompletedNames = new Set();

        for (const task of tasksToShow) {
            if (!task.isDone) {
                uniqueTasks.push(task);
                continue;
            }

            const key = task.text.trim().toLowerCase();
            if (!seenCompletedNames.has(key)) {
                seenCompletedNames.add(key);
                uniqueTasks.push(task);
            }
            // If seen, skip it (it's an older duplicate)
        }
        return uniqueTasks;
    }, [sortedTasks, showCompleted]);

    const filteredContexts = contexts.filter(c => c.name.toLowerCase().includes(commandSearch.toLowerCase()));

    // Custom Style & Theme Detection for Decoration
    const isBananaTheme = themeMode === 'custom' && customTheme.accentColor === '#ff3385';

    const customStyle = themeMode === 'custom' ? {
        '--app-bg': customTheme.mainBg,
        '--sidebar-bg': customTheme.sidebarBg,
        '--text-color': customTheme.textColor,
        '--card-bg': customTheme.cardBg,
        '--accent-color': customTheme.accentColor,
        '--border-color': customTheme.borderColor
    } : {};

    const handleInviteUser = async (email) => {
        if (!activeContextId || !user) return;
        const emailKey = email.toLowerCase().replace(/\./g, ',');
        const userDoc = await getDoc(doc(db, 'artifacts', appId, 'user_lookup', emailKey));

        if (!userDoc.exists()) {
            throw new Error("User not found (they must log in to Klar once).");
        }

        const newMemberUid = userDoc.data().uid;
        await updateDoc(doc(db, 'artifacts', appId, 'shared_contexts', activeContextId), {
            members: arrayUnion(newMemberUid)
        });
    };

    if (loading) return (
        <div className="h-screen w-full flex items-center justify-center bg-white dark:bg-slate-950">
            <Loader2 className="animate-spin text-slate-300 dark:text-slate-600" size={32} />
        </div>
    );

    return (
        <div className={`h-screen w-full ${isDark && themeMode !== 'custom' ? 'dark' : ''}`} style={customStyle}>
            <div className={`flex h-screen w-full font-sans overflow-hidden transition-colors duration-300 relative ${themeMode === 'custom' ? 'bg-[var(--app-bg)] text-[var(--text-color)]' : 'bg-[#FAFAFA] dark:bg-slate-900 text-slate-900 dark:text-slate-100'}`}>
                {themeMode === 'custom' && customTheme.mainBg === '#020617' && <Starfield density={0.15} speed={0.1} />}

                {/* Banana Theme Decoration */}
                {isBananaTheme && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-60">
                        {/* Floating Ribbons & Sparkles with Elegant Breathing Animation */}
                        {[
                            { icon: '🎀', top: '5%', left: '5%', delay: 0 },
                            { icon: '🌸', bottom: '15%', right: '10%', delay: 1 },
                            { icon: '✨', top: '40%', left: '15%', delay: 2, size: 'text-2xl' },
                            { icon: '🧸', bottom: '10%', left: '20%', delay: 3, size: 'text-3xl' },
                            { icon: '💖', top: '15%', right: '25%', delay: 1.5 },
                            { icon: '🎀', top: '8%', right: '5%', delay: 0.5, rotate: 12 },
                            { icon: '✨', bottom: '40%', right: '30%', delay: 2.5, size: 'text-xl' }
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                className={`absolute ${item.size || 'text-4xl'}`}
                                style={{ top: item.top, left: item.left, bottom: item.bottom, right: item.right, rotate: item.rotate || 0 }}
                                animate={{
                                    y: [0, -15, 0],
                                    scale: [1, 1.1, 1],
                                    rotate: item.rotate ? [item.rotate, item.rotate + 5, item.rotate] : [0, 5, 0]
                                }}
                                transition={{
                                    duration: 4,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                    delay: item.delay
                                }}
                            >
                                {item.icon}
                            </motion.div>
                        ))}

                        {/* Subtle Pattern */}
                        <div className="absolute inset-0 opacity-[0.03]"
                            style={{ backgroundImage: 'radial-gradient(#ff3385 1px, transparent 1px)', backgroundSize: '30px 30px' }}
                        />
                    </div>
                )}



                <AnimatePresence mode='wait'>
                    {isSidebarOpen && (
                        <>
                            {/* Mobile Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setSidebarOpen(false)}
                                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
                            />

                            <motion.aside
                                initial={{ x: -250, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -250, opacity: 0 }}
                                className={`fixed md:relative top-0 bottom-0 left-0 z-50 w-72 border-r flex flex-col h-full flex-shrink-0 transition-colors shadow-2xl md:shadow-none ${themeMode === 'custom'
                                    ? 'bg-[var(--sidebar-bg)] border-[var(--border-color)]'
                                    : 'bg-[#F7F7F7] dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                                    }`}
                            >
                                <div className={`h-16 flex items-center px-6 border-b ${themeMode === 'custom' ? 'border-[var(--border-color)]' : 'border-slate-200/50 dark:border-slate-800/50'}`}>
                                    <div className="flex items-center gap-2 font-bold text-lg">
                                        <div className={`w-5 h-5 rounded flex items-center justify-center ${themeMode === 'custom' ? 'bg-[var(--accent-color)] text-[var(--sidebar-bg)]' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'}`}>
                                            <Command size={10} />
                                        </div>
                                        Klar.
                                    </div>
                                    {/* Mobile Close Button */}
                                    <button
                                        onClick={() => setSidebarOpen(false)}
                                        className="md:hidden p-1 opacity-60 hover:opacity-100"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-hide">
                                    <button
                                        onClick={() => setActiveContextId(null)}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mb-4 ${!activeContextId
                                            ? (themeMode === 'custom' ? 'bg-[var(--card-bg)] text-[var(--accent-color)] ring-1 ring-[var(--accent-color)]' : 'bg-white dark:bg-slate-800 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 text-slate-900 dark:text-white')
                                            : (themeMode === 'custom' ? 'text-[var(--text-color)] opacity-60 hover:opacity-100 hover:bg-white/5' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 hover:text-slate-700 dark:hover:text-slate-200')
                                            }`}
                                    >
                                        <div className={`flex items-center justify-center w-6 h-6 rounded ${!activeContextId ? 'bg-purple-500 text-white' : 'bg-transparent'}`}>
                                            <LayoutGrid size={16} />
                                        </div>
                                        <span>Home</span>
                                    </button>

                                    <div className="px-2 pb-2 text-[10px] font-bold opacity-50 uppercase tracking-wider flex justify-between items-center">
                                        <span>Your Contexts</span>
                                        <span className="opacity-70 px-1.5 py-0.5 rounded text-[9px] bg-black/5 dark:bg-white/10">{contexts.length}</span>
                                    </div>

                                    {contexts.map(ctx => {
                                        const theme = THEMES.find(t => t.id === ctx.themeId) || THEMES[0];
                                        const isActive = ctx.id === activeContextId;
                                        const activeClass = themeMode === 'custom' ? `bg-[var(--card-bg)] text-[var(--accent-color)] ring-1 ring-[var(--accent-color)]` : 'bg-white dark:bg-slate-800 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 text-slate-900 dark:text-white';
                                        const inactiveClass = themeMode === 'custom' ? 'text-[var(--text-color)] opacity-60 hover:opacity-100 hover:bg-white/5' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 hover:text-slate-700 dark:hover:text-slate-200';

                                        return (
                                            <button
                                                key={ctx.id}
                                                onClick={() => setActiveContextId(ctx.id)}
                                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative ${isActive ? activeClass : inactiveClass}`}
                                            >
                                                <span className={`flex items-center justify-center w-6 h-6 rounded ${themeMode === 'custom' ? 'bg-white/10' : theme.bg}`}>
                                                    <span className="text-sm">{ctx.emoji}</span>
                                                </span>
                                                <span className="truncate flex-1 text-left flex items-center gap-2">
                                                    {ctx.name}
                                                    {ctx.isShared && <Users size={12} className="opacity-50 shrink-0" />}
                                                </span>
                                                {isActive && (
                                                    <div onClick={(e) => { e.stopPropagation(); handleDeleteContext(ctx.id); }} className="opacity-30 group-hover:opacity-100 p-1 hover:bg-black/5 dark:hover:bg-white/10 hover:text-red-500 rounded transition-all">
                                                        <Trash2 size={12} />
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}

                                    <button
                                        onClick={() => setShowNewContextModal(true)}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium border border-dashed mt-4 transition-all opacity-60 hover:opacity-100 ${themeMode === 'custom' ? 'border-[var(--border-color)] hover:border-[var(--accent-color)]' : 'border-slate-300 dark:border-slate-700'}`}
                                    >
                                        <div className="w-6 h-6 rounded border border-current flex items-center justify-center"><Plus size={14} /></div>
                                        Create Context
                                    </button>
                                </div>

                                <div className={`p-4 border-t space-y-1 ${themeMode === 'custom' ? 'border-[var(--border-color)]' : 'border-slate-200 dark:border-slate-800'}`}>
                                    <button onClick={handleOpenAI} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all opacity-70 hover:opacity-100 group">
                                        <Sparkles size={16} /> Ask AI
                                        <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded border ${themeMode === 'custom' ? 'border-[var(--border-color)] bg-white/5' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>Ctrl+J</span>
                                    </button>
                                    <button onClick={() => setShowTimerSettings(true)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all opacity-70 hover:opacity-100"><Settings size={16} /> Settings</button>
                                    <button onClick={() => setShowStats(true)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all opacity-70 hover:opacity-100"><BarChart2 size={16} /> Analytics</button>
                                    <button onClick={() => setShowShortcutsHelp(true)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all opacity-70 hover:opacity-100"><HelpCircle size={16} /> Shortcuts</button>

                                    <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center px-2">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            {user?.photoURL ? (
                                                <img
                                                    src={user.photoURL}
                                                    alt="Profile"
                                                    className="w-8 h-8 rounded-full object-cover"
                                                    referrerPolicy="no-referrer"
                                                />
                                            ) : (
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${themeMode === 'custom' ? 'bg-[var(--accent-color)] text-[var(--card-bg)]' : 'bg-slate-200 dark:bg-slate-800'}`}>
                                                    {user?.displayName?.[0]?.toUpperCase() || <User size={14} />}
                                                </div>
                                            )}
                                            <div className="flex flex-col truncate">
                                                <span className="text-xs font-bold truncate">{user?.displayName || user?.email?.split('@')[0] || 'User'}</span>
                                                {user?.email && <span className="text-[10px] opacity-50 truncate">{user.email}</span>}
                                            </div>
                                        </div>
                                        <button onClick={handleLogout} className="opacity-50 hover:text-red-500"><LogOut size={16} /></button>
                                    </div>
                                </div>
                            </motion.aside>
                        </>
                    )}
                </AnimatePresence>

                <main className="flex-1 flex flex-col h-full overflow-hidden relative transition-colors w-full">
                    <header className={`h-16 flex items-center justify-between px-4 md:px-8 border-b flex-shrink-0 ${themeMode === 'custom' ? 'border-[var(--border-color)]' : 'border-slate-100 dark:border-slate-900'}`}>
                        <div className="flex items-center gap-4">
                            <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 opacity-60 hover:opacity-100 rounded-lg"><LayoutGrid size={18} /></button>
                            {activeContext && <span className={`font-medium flex items-center gap-2 ${themeMode === 'custom' ? 'text-[var(--accent-color)]' : ''}`}>{activeContext.emoji} {activeContext.name}</span>}
                            {/* Toggle Zen Mode Button */}
                            <button
                                onClick={() => setIsZenMode(true)}
                                className={`ml-4 p-2 rounded-lg transition-all opacity-50 hover:opacity-100 ${isZenMode ? 'bg-[var(--accent-color)] text-[var(--bg-color)] opacity-100' : ''}`}
                                title="Enter Zen Mode"
                            >
                                <Maximize2 size={18} />
                            </button>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Live Clock */}
                            <div className="hidden md:flex flex-col items-end mr-2">
                                <span className={`text-sm font-bold font-mono leading-none ${themeMode === 'custom' ? 'opacity-90' : 'opacity-80'}`}>
                                    {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <span className={`text-[10px] uppercase tracking-wider font-bold leading-none mt-1 ${themeMode === 'custom' ? 'opacity-60' : 'opacity-40'}`}>
                                    {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                                </span>
                            </div>



                            <AnimatePresence mode="wait">
                                {completionToast ? (
                                    <motion.div key="toast" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
                                        <Check size={14} /> {completionToast.text}
                                    </motion.div>
                                ) : (focusState.taskId || focusState.isRunning) ? (
                                    <motion.button key="timer" onClick={() => setShowTimerSettings(true)} className={`flex items-center gap-3 px-3 py-1.5 rounded-full text-xs font-mono font-bold ${focusState.isRunning ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                        <div className={`w-2 h-2 rounded-full ${focusState.isRunning ? 'bg-green-400 animate-pulse' : 'bg-slate-400'}`} />
                                        {formatTime(focusState.remaining)}
                                    </motion.button>
                                ) : null}
                            </AnimatePresence>

                            {activeContext?.isShared && (
                                <button onClick={() => setShowShareModal(true)} className="p-2 opacity-40 hover:opacity-100 rounded-lg" title="Share">
                                    <Share2 size={20} />
                                </button>
                            )}

                            <button
                                onClick={() => isPremium ? setShowVoiceModal(true) : setShowUpgradeModal(true)}
                                className={`p-2 rounded-lg transition-all ${isPremium ? 'opacity-40 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10' : 'opacity-60 text-amber-500 hover:bg-amber-500/10'}`}
                                title={isPremium ? "Voice Command" : "Voice Command (Premium)"}
                            >
                                <Mic size={20} />
                            </button>

                            <button onClick={() => setShowCalendar(true)} className="p-2 opacity-40 hover:opacity-100 rounded-lg" title="Calendar"><Calendar size={20} /></button>
                            <button onClick={() => setShowStats(true)} className="p-2 opacity-40 hover:opacity-100 rounded-lg" title="Stats"><BarChart2 size={20} /></button>
                        </div>
                    </header>

                    <div className="flex-1 overflow-y-auto scrollbar-hide">
                        {!activeContext ? (
                            <Dashboard
                                user={user}
                                tasks={allTasks}
                                contexts={contexts}
                                themeMode={themeMode}
                                activeTheme={activeTheme}
                                onNavigate={setActiveContextId}
                                onStartTask={task => {
                                    setActiveContextId(task.contextId);
                                    setTimeout(() => toggleTimer(task.id), 100);
                                }}
                                onStartPomodoro={() => {
                                    setFocusState({
                                        taskId: null,
                                        totalDuration: 25 * 60,
                                        remaining: 25 * 60,
                                        isRunning: true,
                                        mode: 'Pomodoro',
                                        phase: 'focus',
                                        cycle: 0
                                    });
                                }}
                                focusState={focusState}
                                onStopTimer={stopTimer}
                                onToggleTimer={toggleTimer}
                            />
                        ) : (
                            <div className="max-w-3xl mx-auto py-8 px-4 md:py-12 md:px-6">
                                <div className="mb-10 flex items-end justify-between">
                                    <div>
                                        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-6 text-2xl shadow-sm ${themeMode === 'custom' ? 'bg-[var(--card-bg)] text-[var(--accent-color)]' : `${activeTheme.bg} ${activeTheme.text}`}`}>{activeContext.emoji}</div>
                                        <h1 className="text-4xl font-bold tracking-tight mb-2">{activeContext.name}</h1>
                                    </div>
                                    <button
                                        onClick={() => setShowCompleted(!showCompleted)}
                                        className={`p-2 rounded-lg transition-all mb-2 ${showCompleted ? 'opacity-100 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200' : 'opacity-50 hover:opacity-100'}`}
                                        title={showCompleted ? "Hide Completed Tasks" : "Show Completed Tasks"}
                                    >
                                        {showCompleted ? <Eye size={20} /> : <EyeOff size={20} />}
                                    </button>
                                </div>

                                <div className="mb-8">
                                    <form onSubmit={handleQuickCreateTask} className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40"><Plus size={20} /></div>
                                        <textarea
                                            ref={inputRef}
                                            value={newTaskText}
                                            onChange={(e) => setNewTaskText(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleQuickCreateTask(e);
                                                }
                                            }}
                                            placeholder={`Add a task to ${activeContext.name}...`}
                                            className={`w-full h-14 min-h-[56px] py-3.5 pl-12 pr-24 border rounded-xl shadow-sm text-lg outline-none bg-transparent resize-none overflow-hidden ${themeMode === 'custom' ? 'border-[var(--border-color)] placeholder-[var(--text-color)]/30' : 'border-slate-200 dark:border-slate-800'}`}
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                            <button type="button" onClick={toggleDictation} className={`p-2 transition-all rounded-lg ${dictation.isListening ? 'text-red-500 bg-red-500/10' : 'opacity-40 hover:opacity-100'}`} title="Dictate">
                                                <Mic size={16} className={dictation.isListening ? 'animate-pulse' : ''} />
                                            </button>
                                            <button type="button" onClick={() => { setShowDetailedAdd(true); setDetailedForm(prev => ({ ...prev, text: newTaskText })); setNewTaskText(''); }} className="p-2 opacity-40 hover:opacity-100 rounded-lg"><Maximize2 size={16} /></button>
                                        </div>
                                    </form>
                                </div>

                                <div className="space-y-4">
                                    <AnimatePresence>
                                        {visibleTasks.map((task) => {
                                            const isFocused = focusState.taskId === task.id;
                                            const progress = isFocused ? ((focusState.totalDuration - focusState.remaining) / focusState.totalDuration) * 100 : 0;
                                            const dateInfo = formatDueDate(task.dueDate);
                                            const isNote = task.type === 'note';

                                            return (
                                                <motion.div
                                                    key={task.id}
                                                    layout
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{
                                                        opacity: 1, y: 0,
                                                        scale: isFocused ? 1.02 : 1,
                                                        borderColor: isFocused ? (themeMode === 'custom' ? 'var(--accent-color)' : 'currentColor') : 'transparent'
                                                    }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    onContextMenu={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        // Close any existing menu first, then open new one
                                                        setContextMenu({ show: false, taskId: null, x: 0, y: 0 });
                                                        setTimeout(() => {
                                                            setContextMenu({
                                                                show: true,
                                                                taskId: task.id,
                                                                x: e.clientX,
                                                                y: e.clientY
                                                            });
                                                        }, 0);
                                                    }}
                                                    className={`group relative flex items-start gap-4 p-4 border rounded-xl ${themeMode === 'custom' ? `bg-[var(--card-bg)] ${isFocused ? 'border-[var(--accent-color)]' : 'border-[var(--border-color)]'}` : `bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800`}`}
                                                >
                                                    {isFocused && <motion.div className={`absolute inset-0 rounded-xl pointer-events-none ${themeMode === 'custom' ? 'bg-white/5' : 'bg-blue-50 dark:bg-blue-900/10'}`} layoutId="focusHighlight" />}

                                                    {/* Checkbox vs Note Bullet */}
                                                    {isNote ? (
                                                        <div className="flex-shrink-0 w-6 h-6 mt-1 flex items-center justify-center pointer-events-none select-none">
                                                            <div className={`w-2 h-2 rounded-full ${themeMode === 'custom' ? 'bg-[var(--accent-color)]' : 'bg-slate-400 dark:bg-slate-600'} opacity-60`} />
                                                        </div>
                                                    ) : (
                                                        <button onClick={() => toggleTask(task)} className={`flex-shrink-0 w-6 h-6 mt-1 rounded-lg border-2 flex items-center justify-center z-10 ${task.isDone ? 'bg-slate-900 dark:bg-white border-slate-900 dark:border-white text-white dark:text-slate-900' : 'border-slate-300 dark:border-slate-600'}`}>
                                                            {task.isDone && <Check size={14} strokeWidth={3} />}
                                                        </button>
                                                    )}

                                                    <div
                                                        className="flex-1 z-10 min-w-0 cursor-pointer"
                                                        onClick={() => startEditing(task)}
                                                    >
                                                        <span className={`text-[15px] block ${isNote ? 'font-normal opacity-90 italic' : 'font-medium'} ${task.isDone ? 'opacity-50 line-through' : ''} ${isFocused ? 'text-xl font-bold' : ''}`}>{task.text}</span>
                                                        {(dateInfo || task.description || (task.priority && task.priority !== 'medium')) && !task.isDone && (
                                                            <div className="flex flex-wrap items-center gap-3 mt-1.5 opacity-60 text-xs">
                                                                {task.priority && task.priority !== 'medium' && (
                                                                    <div className={`flex items-center gap-1 font-bold uppercase tracking-wider ${task.priority === 'high' ? 'text-red-500' : 'text-blue-500'
                                                                        }`}>
                                                                        <Flag size={11} fill="currentColor" />
                                                                        {task.priority}
                                                                    </div>
                                                                )}
                                                                {dateInfo && <div className={`flex items-center gap-1 ${dateInfo.isOverdue ? 'text-red-500' : ''}`}><Calendar size={12} /> {dateInfo.text}</div>}
                                                                {task.description && <div className="flex items-center gap-1"><AlignLeft size={12} /> Notes</div>}
                                                            </div>
                                                        )}
                                                        {isFocused && (
                                                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 flex items-center gap-3 text-xs font-medium opacity-60">
                                                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/5 dark:bg-white/10">
                                                                    {focusState.phase === 'focus' ? <Brain size={12} /> : <Coffee size={12} />}
                                                                    <span className="uppercase">{focusState.phase}</span>
                                                                </div>
                                                                <span>{Math.round(progress)}% done</span>
                                                            </motion.div>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-2 z-10 self-start mt-0.5">
                                                        {!task.isDone ? (
                                                            <>
                                                                {!isNote && (
                                                                    <div className="relative">
                                                                        {isFocused && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"><ProgressRing radius={22} stroke={2} progress={progress} /></div>}
                                                                        <button
                                                                            onClick={() => toggleTimer(task.id)}
                                                                            className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all ${isFocused
                                                                                ? (themeMode === 'custom'
                                                                                    ? 'bg-[var(--accent-color)] text-[var(--main-bg)]'
                                                                                    : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900')
                                                                                : (themeMode === 'custom'
                                                                                    ? 'bg-[var(--accent-color)]/20 text-[var(--accent-color)] hover:bg-[var(--accent-color)] hover:text-[var(--main-bg)]'
                                                                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900')
                                                                                }`}
                                                                        >
                                                                            {isFocused && focusState.isRunning ? <Pause size={16} /> : <Play size={16} />}
                                                                        </button>
                                                                    </div>
                                                                )}

                                                                <AnimatePresence>
                                                                    {(isFocused || (!isFocused && !focusState.isRunning)) && (
                                                                        <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} className="flex items-center gap-1 overflow-hidden">
                                                                            {!isNote && (
                                                                                isFocused ? (
                                                                                    <>
                                                                                        <button onClick={() => enterZenMode(task)} className="p-2 opacity-40 hover:opacity-100 rounded-lg" title="Enter Zen Mode"><Maximize2 size={16} /></button>
                                                                                        <button onClick={stopTimer} className="p-2 opacity-40 hover:opacity-100 hover:text-red-500 rounded-lg"><Square size={16} /></button>
                                                                                    </>
                                                                                ) : (
                                                                                    <>
                                                                                        <button onClick={() => enterZenMode(task)} className="p-2 opacity-40 hover:opacity-100 rounded-lg" title="Focus on this task"><Maximize2 size={16} /></button>
                                                                                        <button onClick={() => startEditing(task)} className="p-2 opacity-40 hover:opacity-100 rounded-lg"><Edit3 size={16} /></button>
                                                                                    </>
                                                                                )
                                                                            )}

                                                                            {isNote && (
                                                                                <button onClick={() => startEditing(task)} className="p-2 opacity-40 hover:opacity-100 rounded-lg"><Edit3 size={16} /></button>
                                                                            )}

                                                                            {!isNote && (
                                                                                <button
                                                                                    onClick={() => setShowTimerSettings(true)}
                                                                                    className={`p-2 rounded-lg transition-colors ${Object.values(soundMixer || {}).some(v => v > 0)
                                                                                        ? 'opacity-100 text-blue-500'
                                                                                        : 'opacity-40 hover:opacity-100'
                                                                                        }`}
                                                                                    title={Object.values(soundMixer || {}).some(v => v > 0) ? "Sound ON" : "Sound OFF"}
                                                                                >
                                                                                    {Object.values(soundMixer || {}).some(v => v > 0) ? <Volume2 size={16} /> : <VolumeX size={16} />}
                                                                                </button>
                                                                            )}
                                                                            <button
                                                                                onClick={() => deleteTask(task.id)}
                                                                                className="p-2 opacity-40 hover:opacity-100 hover:text-red-500 rounded-lg transition-colors"
                                                                            >
                                                                                <Trash2 size={16} />
                                                                            </button>
                                                                        </motion.div>
                                                                    )}
                                                                </AnimatePresence>
                                                            </>
                                                        ) : (
                                                            <button
                                                                onClick={() => deleteTask(task.id)}
                                                                className="p-2 opacity-0 group-hover:opacity-100 hover:text-red-500 rounded-lg transition-all"
                                                                title="Delete Task"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>

                                    {sortedTasks.length === 0 && (
                                        <div className={`text-center py-12 opacity-40 text-sm ${themeMode === 'custom' ? 'text-[var(--text-color)]' : ''}`}>No tasks yet. Stay focused.</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </main>

                <AnimatePresence mode="wait">
                    {showNewContextModal && (
                        <NewContextModal
                            key="new-context-modal"
                            show={showNewContextModal}
                            onClose={() => setShowNewContextModal(false)}
                            newContextName={newContextName}
                            setNewContextName={setNewContextName}
                            newContextEmoji={newContextEmoji}
                            setNewContextEmoji={setNewContextEmoji}
                            newContextTheme={newContextTheme}
                            setNewContextTheme={setNewContextTheme}
                            newContextIsShared={newContextIsShared}
                            setNewContextIsShared={setNewContextIsShared}
                            onSubmit={handleCreateContext}
                            themeMode={themeMode}
                            customTheme={customTheme}
                        />
                    )}

                    {showDetailedAdd && (
                        <DetailedTaskModal
                            key="detailed-task-modal"
                            show={showDetailedAdd}
                            onClose={() => {
                                setShowDetailedAdd(false);
                                setEditingTask(null);
                            }}
                            editingTask={editingTask}
                            detailedForm={detailedForm}
                            setDetailedForm={setDetailedForm}
                            setEditingTask={setEditingTask}
                            onSubmit={editingTask ? saveTaskEdit : handleDetailedCreateTask}
                            activeContext={activeContext}
                            themeMode={themeMode}
                            customTheme={customTheme}
                            onPals={handleOpenPals}
                        />
                    )}

                    {showTimerSettings && (
                        <SettingsModal
                            key="settings-modal"
                            show={showTimerSettings}
                            onClose={() => setShowTimerSettings(false)}
                            themeMode={themeMode}
                            setThemeMode={setThemeMode}
                            themeSchedule={themeSchedule}
                            setThemeSchedule={setThemeSchedule}
                            customTheme={customTheme}
                            setCustomTheme={setCustomTheme}
                            soundConfig={soundConfig}
                            setSoundConfig={setSoundConfig}
                            soundMixer={soundMixer}
                            setSoundMixer={setSoundMixer}
                            customMinutes={customMinutes}
                            setCustomMinutes={setCustomMinutes}
                            setTimerSettings={setTimerSettings}
                            saveSettings={saveSettings}
                            isPremium={isPremium}
                            setShowUpgradeModal={setShowUpgradeModal}
                        />
                    )}

                    {showStats && (
                        <StatsModal
                            key="stats-modal"
                            show={showStats}
                            onClose={() => setShowStats(false)}
                            statsData={statsData}
                            themeMode={themeMode}
                        />
                    )}

                    {showCalendar && (
                        <CalendarModal
                            key="calendar-modal"
                            show={showCalendar}
                            onClose={() => setShowCalendar(false)}
                            tasks={allTasks}
                            themeMode={themeMode}
                            customTheme={customTheme}
                        />
                    )}

                    {showShareModal && (
                        <ShareContextModal
                            key="share-modal"
                            show={showShareModal}
                            onClose={() => setShowShareModal(false)}
                            onInvite={handleInviteUser}
                            themeMode={themeMode}
                            customTheme={customTheme}
                            activeContextName={activeContext?.name}
                        />
                    )}

                    {showCommandPalette && (
                        <CommandPalette
                            key="command-palette"
                            show={showCommandPalette}
                            onClose={() => setShowCommandPalette(false)}
                            commandSearch={commandSearch}
                            setCommandSearch={setCommandSearch}
                            filteredContexts={filteredContexts}
                            activeContextId={activeContextId}
                            setActiveContextId={setActiveContextId}
                            themeMode={themeMode}
                        />
                    )}

                    {showShortcutsHelp && (
                        <ShortcutsHelpModal
                            key="shortcuts-modal"
                            show={showShortcutsHelp}
                            onClose={() => setShowShortcutsHelp(false)}
                            themeMode={themeMode}
                        />
                    )}

                    <VoiceModal
                        key="voice-modal"
                        show={showVoiceModal}
                        onClose={() => setShowVoiceModal(false)}
                        onAction={handleVoiceAction}
                        contexts={contexts}
                        activeContextId={activeContextId}
                    />

                    <KlarAIModal
                        key="klar-ai-modal"
                        show={showKlarAI}
                        onClose={() => setShowKlarAI(false)}
                        onCommand={handleVoiceAction}
                        contexts={contexts}
                        activeContextId={activeContextId}
                        user={user}
                        tasks={tasks}
                        focusState={focusState}
                        focusLogs={focusLogs}
                    />

                    {showUpgradeModal && (
                        <UpgradeModal
                            key="upgrade-modal"
                            show={showUpgradeModal}
                            onClose={() => setShowUpgradeModal(false)}
                            onUpgrade={handleToyyibUpgrade}
                            themeMode={themeMode}
                        />
                    )}

                    {deleteConfirm.show && (
                        <ConfirmDialog
                            key="confirm-dialog"
                            show={deleteConfirm.show}
                            onClose={() => setDeleteConfirm({ show: false, ctxId: null, ctxName: '' })}
                            onConfirm={confirmDeleteContext}
                            title="Delete Context?"
                            message={`Are you sure you want to delete "${deleteConfirm.ctxName}"? This action cannot be undone.`}
                            confirmText="Delete"
                            themeMode={themeMode}
                        />
                    )}

                    {/* PALs / AI Suggestions Modal */}
                    {showPalsModal && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
                            onClick={() => setShowPalsModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
                                className={`w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden relative ${themeMode === 'custom' ? 'bg-[var(--card-bg)] text-[var(--text-color)] border border-[var(--border-color)]' : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800'}`}
                                onClick={e => e.stopPropagation()}
                            >
                                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 ${palsLoading ? 'animate-pulse' : ''}`} />

                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xl font-bold flex items-center gap-2">
                                            <Sparkles className="text-purple-500 fill-purple-500" size={20} />
                                            <span>AI Suggestions</span>
                                        </h2>
                                        <button onClick={() => setShowPalsModal(false)} className="opacity-50 hover:opacity-100 p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10"><X size={20} /></button>
                                    </div>

                                    {palsLoading ? (
                                        <div className="py-12 flex flex-col items-center justify-center gap-4 text-center opacity-70">
                                            <Loader2 className="animate-spin text-purple-500" size={40} />
                                            <div className="space-y-1">
                                                <p className="font-medium text-lg">Thinking...</p>
                                                <p className="text-sm opacity-70">Analyzing your tasks to find smart wins.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            <div className="flex gap-4 items-start">
                                                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0 mt-1">
                                                    <Brain size={20} />
                                                </div>
                                                <div className="space-y-2">
                                                    <p className="text-[15px] leading-relaxed opacity-90">{palsData?.message}</p>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <h3 className="text-xs font-bold uppercase tracking-wider opacity-50 px-1">Suggested Actions</h3>
                                                {palsData?.actions && palsData.actions.length > 0 ? (
                                                    palsData.actions.map((action, i) => (
                                                        <button
                                                            key={i}
                                                            onClick={() => handlePalsAction(action)}
                                                            className={`w-full p-4 rounded-xl text-left border transition-all flex items-start gap-4 group ${themeMode === 'custom' ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}
                                                        >
                                                            <div className={`mt-0.5 p-2 rounded-lg shrink-0 transition-colors ${themeMode === 'custom' ? 'bg-white/10 text-[var(--accent-color)]' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 group-hover:bg-purple-100 group-hover:text-purple-600 dark:group-hover:bg-purple-900/50 dark:group-hover:text-purple-300'}`}>
                                                                {action.type === 'create_task' && <Plus size={18} />}
                                                                {action.type === 'enhance_task' && (
                                                                    action.data.category === 'Birthday' ? <Gift size={18} /> :
                                                                        action.data.category === 'Movie' ? <Film size={18} /> :
                                                                            action.data.category === 'Grocery' ? <ShoppingCart size={18} /> :
                                                                                <Tag size={18} />
                                                                )}
                                                                {action.type === 'break_down' && <LayoutGrid size={18} />}
                                                                {action.type === 'prioritize' && <Flame size={18} />}
                                                                {action.type === 'tip' && <CheckCircle2 size={18} />}
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="font-semibold text-sm mb-1 capitalize flex items-center gap-2">
                                                                    {action.type === 'enhance_task' ? action.data.category : action.type.replace(/_/g, ' ')}
                                                                </div>
                                                                <div className="text-xs opacity-70 leading-normal">
                                                                    {action.type === 'create_task' && (
                                                                        <span>Create task: <span className="font-medium">"{action.data.text}"</span></span>
                                                                    )}
                                                                    {action.type === 'enhance_task' && (
                                                                        <span>{action.data.suggestion} for <span className="font-medium">"{action.data.text}"</span></span>
                                                                    )}
                                                                    {action.type === 'break_down' && (
                                                                        <span>Break down this task into smaller steps.</span>
                                                                    )}
                                                                    {action.type === 'prioritize' && (
                                                                        <span>{action.data.reasoning || "Focus on this to make progress."}</span>
                                                                    )}
                                                                    {action.type === 'tip' && (
                                                                        <span>{action.data.content}</span>
                                                                    )}
                                                                    {!['create_task', 'enhance_task', 'break_down', 'prioritize', 'tip'].includes(action.type) && (
                                                                        <span>{JSON.stringify(action.data).slice(0, 50)}...</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {action.type !== 'tip' && (
                                                                <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold text-purple-500 uppercase tracking-wide">
                                                                    Apply
                                                                </div>
                                                            )}
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="p-4 text-center text-sm opacity-50 italic">No specific actions needed right now. Good job!</div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* AI Command Bar - Outside AnimatePresence for layering */}
                <AICommandBar
                    show={showAICommandBar}
                    onClose={() => setShowAICommandBar(false)}
                    context={buildAIContext({
                        activeContext,
                        tasks,
                        contexts,
                        focusState,
                        focusLogs,
                        user
                    })}
                    quickActions={getQuickActions(buildAIContext({
                        activeContext,
                        tasks,
                        contexts,
                        focusState,
                        focusLogs,
                        user
                    }))}
                    onSendMessage={async (message) => {
                        const context = buildAIContext({
                            activeContext,
                            tasks,
                            contexts,
                            focusState,
                            focusLogs,
                            user
                        });
                        return await chatCompletion(message, context);
                    }}
                    onExecuteAction={async (action) => {
                        if (!user || !activeContextId) return;

                        try {
                            const activeCtx = contexts.find(c => c.id === activeContextId);
                            const collectionPath = activeCtx?.isShared
                                ? `artifacts/${appId}/shared_contexts/${activeContextId}/tasks`
                                : `artifacts/${appId}/users/${user.uid}/tasks`;

                            const tasksRef = collection(db, collectionPath);

                            if (action.type === 'create_task') {
                                // Robust parsing for subtasks (handle strings or objects)
                                const subtasks = (action.data.subtasks || []).map((item, i) => ({
                                    id: Date.now() + i,
                                    text: typeof item === 'string' ? item : (item.text || item.title || JSON.stringify(item)),
                                    isDone: false
                                }));

                                await addDoc(tasksRef, {
                                    text: action.data.text,
                                    description: action.data.description || '',
                                    subtasks: subtasks,
                                    contextId: activeContextId,
                                    isDone: false,
                                    createdAt: serverTimestamp(),
                                    dueDate: action.data.dueDate || null
                                });
                                setCompletionToast({ text: 'Task created from AI suggestion', id: Date.now() });
                                setTimeout(() => setCompletionToast(null), 3000);
                            } else if (action.type === 'break_down' && action.data.subtasks) {
                                for (const subtask of action.data.subtasks) {
                                    await addDoc(tasksRef, {
                                        text: subtask,
                                        description: '',
                                        contextId: activeContextId,
                                        isDone: false,
                                        createdAt: serverTimestamp()
                                    });
                                }
                                setCompletionToast({ text: 'Tasks created from breakdown', id: Date.now() });
                                setTimeout(() => setCompletionToast(null), 3000);
                            }
                        } catch (error) {
                            console.error("AI Action Error:", error);
                        }
                    }}
                    themeMode={themeMode}
                    customTheme={customTheme}
                />

                {/* Zen Mode Overlay */}
                <AnimatePresence>
                    {isZenMode && (
                        <ZenMode
                            key="zen-mode"
                            activeTask={tasks.find(t => t.id === focusState.taskId)}
                            focusState={focusState}
                            toggleTimer={() => {
                                if (focusState.taskId) {
                                    setFocusState(prev => ({ ...prev, isRunning: !prev.isRunning }));
                                }
                            }}
                            stopTimer={() => {
                                setFocusState(prev => ({ ...prev, isRunning: false }));
                            }}
                            onExit={() => setIsZenMode(false)}
                            onComplete={toggleTask}
                            onToggleSubtask={toggleSubtask}
                            soundMixer={soundMixer}
                            setSoundMixer={setSoundMixer}
                            isPremium={isPremium}
                            themeMode={themeMode}
                            customTheme={customTheme}
                            formatTime={formatTime}
                        />
                    )}
                </AnimatePresence>

                {/* Task Context Menu */}
                <AnimatePresence>
                    {contextMenu.show && (
                        <>
                            {/* Backdrop to close menu */}
                            <div
                                className="fixed inset-0 z-[90]"
                                onClick={() => setContextMenu({ show: false, taskId: null, x: 0, y: 0 })}
                            />

                            {/* Context Menu */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                onClick={(e) => e.stopPropagation()}
                                onContextMenu={(e) => e.preventDefault()}
                                style={{
                                    position: 'fixed',
                                    left: contextMenu.x,
                                    top: contextMenu.y,
                                    zIndex: 100
                                }}
                                className={`min-w-[200px] rounded-xl shadow-2xl overflow-hidden border ${themeMode === 'custom' ? 'bg-[var(--card-bg)] border-[var(--border-color)]' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}
                            >
                                <div className="py-2">
                                    {/* Edit */}
                                    <button
                                        onClick={() => {
                                            const task = tasks.find(t => t.id === contextMenu.taskId);
                                            if (task) startEditing(task);
                                            setContextMenu({ show: false, taskId: null, x: 0, y: 0 });
                                        }}
                                        className={`w-full px-4 py-2 text-left flex items-center gap-3 text-sm ${themeMode === 'custom' ? 'hover:bg-white/10' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                    >
                                        <Edit3 size={16} />
                                        <span>Edit</span>
                                    </button>

                                    {/* Delete */}
                                    <button
                                        onClick={() => {
                                            deleteTask(contextMenu.taskId);
                                            setContextMenu({ show: false, taskId: null, x: 0, y: 0 });
                                        }}
                                        className={`w-full px-4 py-2 text-left flex items-center gap-3 text-sm text-red-500 ${themeMode === 'custom' ? 'hover:bg-white/10' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                    >
                                        <Trash2 size={16} />
                                        <span>Delete</span>
                                    </button>

                                    {/* Divider */}
                                    <div className={`my-2 h-px ${themeMode === 'custom' ? 'bg-white/10' : 'bg-slate-200 dark:bg-slate-700'}`} />

                                    {/* Move to Context */}
                                    <div className="px-4 py-1 text-xs font-bold opacity-50 uppercase tracking-wider">
                                        Move to
                                    </div>
                                    {contexts.filter(ctx => ctx.id !== activeContextId).map(ctx => (
                                        <button
                                            key={ctx.id}
                                            onClick={() => handleMoveTask(contextMenu.taskId, ctx.id)}
                                            className={`w-full px-4 py-2 text-left flex items-center gap-3 text-sm ${themeMode === 'custom' ? 'hover:bg-white/10' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                        >
                                            <MoveRight size={16} />
                                            <span>{ctx.emoji} {ctx.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

            </div >
        </div >
    );
}
