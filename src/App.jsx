import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './config/firebase';
import { Loader2 } from 'lucide-react';
import LandingPage from './components/LandingPage';
import KlarApp from './components/KlarApp';

export default function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-[#020617] text-white">
                <Loader2 className="animate-spin text-cyan-500" size={32} />
            </div>
        );
    }

    return (
        <AnimatePresence mode="wait">
            {!user ? (
                <LandingPage key="landing-page" onEnter={() => { }} />
            ) : (
                <KlarApp key="klar-app" />
            )}
        </AnimatePresence>
    );
}
