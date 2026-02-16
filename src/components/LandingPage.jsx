import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Command, Key, Mail, Lock, User, Loader2, ShieldCheck, ChevronLeft } from 'lucide-react';
import { auth } from '../config/firebase';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInAnonymously,
    GoogleAuthProvider,
    signInWithPopup
} from 'firebase/auth';

// Custom Hook for Interactive Stardust
const useStarfield = (canvasRef) => {
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animationFrameId;
        let particles = [];
        let mouse = { x: -9999, y: -9999 };

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initParticles();
        };

        const initParticles = () => {
            particles = [];
            const particleCount = Math.min(window.innerWidth * 0.2, 250);
            for (let i = 0; i < particleCount; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    vx: (Math.random() - 0.5) * 0.2,
                    vy: (Math.random() - 0.5) * 0.2,
                    size: Math.random() * 2 + 1.2,
                    hue: Math.random() * 60 + 200
                });
            }
        };

        window.addEventListener('resize', resize);
        resize();

        const handleMouseMove = (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        };
        window.addEventListener('mousemove', handleMouseMove);

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach(p => {
                const dx = mouse.x - p.x;
                const dy = mouse.y - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const maxDist = 200;

                let alpha = 0.6;
                if (dist < maxDist) {
                    const force = (maxDist - dist) / maxDist;
                    const angle = Math.atan2(dy, dx);
                    const push = force * 2.5;

                    p.x -= Math.cos(angle) * push;
                    p.y -= Math.sin(angle) * push;
                    alpha = 0.6 + force * 0.4;
                }

                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${p.hue}, 100%, 85%, ${alpha})`;
                ctx.fill();

                if (dist < 120) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(255, 255, 255, ${0.2 * (1 - dist / 120)})`;
                    ctx.lineWidth = 0.8;
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.stroke();
                }
            });

            animationFrameId = requestAnimationFrame(draw);
        };
        draw();

        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);
};

export default function LandingPage({ onEnter }) {
    const canvasRef = useRef(null);
    useStarfield(canvasRef);

    const [view, setView] = useState('landing');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // onEnter handled by listener in App, but we can call it to be safe or just wait
            onEnter();
        } catch (err) {
            setError(err.message.replace('Firebase: ', ''));
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            onEnter();
        } catch (err) {
            setError(err.message.replace('Firebase: ', ''));
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError(null);
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
            onEnter();
        } catch (err) {
            console.error("Google Auth Error:", err);
            setError(err.message.replace('Firebase: ', ''));
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-[100] bg-slate-950 text-white overflow-hidden flex flex-col items-center justify-center font-sans"
        >
            <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px]" />

            <div className="relative z-10 text-center max-w-md w-full px-6">
                <motion.div
                    layout
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="mb-8 flex justify-center"
                >
                    <div className={`px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs tracking-widest uppercase font-medium text-slate-400 backdrop-blur-md transition-all ${view !== 'landing' ? 'scale-75 opacity-50' : ''}`}>
                        Productivity Reimagined
                    </div>
                </motion.div>

                <AnimatePresence mode="wait">
                    {view === 'landing' ? (
                        <motion.div
                            key="landing"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                            transition={{ duration: 0.4 }}
                        >
                            <h1 className="text-7xl md:text-9xl font-bold tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/40">
                                Klar.
                            </h1>
                            <p className="text-xl text-slate-400 font-light mb-12 max-w-sm mx-auto leading-relaxed">
                                The <span className="text-white font-medium">anti-distraction</span> workspace for deep work.
                            </p>

                            <div className="space-y-4">
                                <button
                                    onClick={() => setView('login')}
                                    className="w-full py-4 bg-white text-slate-950 rounded-xl text-lg font-bold hover:scale-[1.02] hover:shadow-lg transition-all"
                                >
                                    Login
                                </button>
                                <button
                                    onClick={() => setView('register')}
                                    className="w-full py-3 border border-white/20 rounded-xl font-medium hover:bg-white/5 transition-all"
                                >
                                    Register
                                </button>

                                <div className="relative py-2">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-white/10"></div>
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-slate-950 px-2 text-slate-500">Or continue with</span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleGoogleLogin}
                                    className="w-full py-3 bg-white/5 border border-white/10 rounded-xl font-medium hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-3 text-slate-300"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" />
                                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    Google
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="auth"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                            transition={{ duration: 0.4 }}
                            className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <button
                                    onClick={() => setView('landing')}
                                    className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <h2 className="text-2xl font-bold">{view === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
                                <div className="w-9" />
                            </div>

                            <form onSubmit={view === 'login' ? handleLogin : handleRegister} className="space-y-4 text-left">
                                {error && (
                                    <div className="text-xs text-red-300 bg-red-500/10 border border-red-500/20 p-2 rounded-lg mb-4">
                                        {error}
                                    </div>
                                )}

                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block pl-1">Email</label>
                                    <div className="relative">
                                        <Mail size={16} className="absolute left-3 top-3.5 text-slate-500" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors placeholder:opacity-30"
                                            placeholder="hello@example.com"
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block pl-1">Password</label>
                                    <div className="relative">
                                        <Lock size={16} className="absolute left-3 top-3.5 text-slate-500" />
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors placeholder:opacity-30"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3.5 mt-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading && <Loader2 size={16} className="animate-spin" />}
                                    {view === 'login' ? 'Sign In' : 'Create Account'}
                                </button>

                                <div className="relative py-2">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-white/10"></div>
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-slate-900 px-2 text-slate-500 rounded">Or</span>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleGoogleLogin}
                                    className="w-full py-3 bg-white/5 border border-white/10 rounded-xl font-medium hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-3 text-slate-300"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" />
                                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    Google
                                </button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <motion.div
                layout
                className="absolute bottom-8 left-0 right-0 px-8 flex justify-between text-[10px] uppercase tracking-widest text-slate-600 font-medium"
            >
                <div className="flex gap-4">
                    <span className="flex items-center gap-2"><ShieldCheck size={10} /> Secure</span>
                    <span className="flex items-center gap-2"><Command size={10} /> Fast</span>
                </div>
                <div>v1.1.0 • Klar</div>
            </motion.div>
        </motion.div>
    );
}
