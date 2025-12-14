import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, X, Loader2, Play, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useVoiceInput } from '../utils/voiceInput';
import { parseVoiceCommand } from '../utils/nlp';

export default function VoiceModal({ show, onClose, onAction, contexts, activeContextId }) {
    const { isListening, transcript, startListening, stopListening, error: micError, hasSupport } = useVoiceInput();
    const [status, setStatus] = useState('idle'); // idle, listening, processing, success, error
    const [statusMessage, setStatusMessage] = useState('Listening...');

    // Auto-start when opening
    useEffect(() => {
        if (show) {
            reset();
            if (hasSupport) {
                setStatus('listening');
                startListening();
            } else {
                setStatus('error');
                setStatusMessage("Browser doesn't support voice.");
            }
        } else {
            stopListening();
        }
    }, [show]);

    // Handle end of speech
    useEffect(() => {
        if (!isListening && status === 'listening' && transcript) {
            processTranscript();
        } else if (!isListening && status === 'listening' && !transcript && !micError) {
            // Stopped without speech (cancel or silence)
            // Optional: auto-close or retry? Let's just stay waiting or close.
        }
    }, [isListening, transcript, status]);

    // Error handling
    useEffect(() => {
        if (micError) {
            setStatus('error');
            setStatusMessage(micError);
        }
    }, [micError]);

    const reset = () => {
        setStatus('idle');
        setStatusMessage('Listening...');
    };

    const processTranscript = async () => {
        setStatus('processing');
        setStatusMessage('Thinking...');

        const result = await parseVoiceCommand(transcript, contexts, activeContextId);

        if (result && result.intent !== 'unknown') {
            setStatus('success');
            setTimeout(() => {
                onAction(result);
                onClose();
            }, 500);
        } else {
            setStatus('error');
            setStatusMessage(result?.error || "I didn't catch that.");
        }
    };

    if (!show) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-4 bg-slate-900/60 backdrop-blur-sm"
            >
                <div onClick={onClose} className="absolute inset-0" />

                <motion.div
                    initial={{ y: 50, scale: 0.9, opacity: 0 }}
                    animate={{ y: 0, scale: 1, opacity: 1 }}
                    exit={{ y: 50, scale: 0.9, opacity: 0 }}
                    className="relative w-full max-w-md bg-slate-900 border border-slate-700/50 shadow-2xl rounded-3xl p-8 overflow-hidden"
                >
                    {/* Background Animation */}
                    {status === 'listening' && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                            <div className="w-64 h-64 rounded-full bg-blue-500 animate-pulse blur-3xl" />
                        </div>
                    )}

                    <div className="relative z-10 flex flex-col items-center text-center space-y-6">

                        {/* Status Icon */}
                        <div className="flex justify-center mb-6">
                            <motion.div
                                animate={status === 'listening' ? { scale: [1, 1.1, 1] } : {}}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl transition-colors duration-500 ${status === 'listening' ? 'bg-blue-500/20 text-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.3)]' :
                                    status === 'processing' ? 'bg-purple-500/20 text-purple-500' :
                                        status === 'success' ? 'bg-green-500/20 text-green-500' :
                                            'bg-red-500/20 text-red-500'
                                    }`}
                            >
                                {status === 'listening' && <Mic size={32} />}
                                {status === 'processing' && <Loader2 size={32} className="animate-spin" />}
                                {status === 'success' && <CheckCircle2 size={32} />}
                                {status === 'error' && <AlertCircle size={32} />}
                            </motion.div>
                        </div>

                        {/* Transcript */}
                        <div className="min-h-[60px]">
                            <p className="text-xl font-medium text-white/90 leading-relaxed">
                                {transcript || (status === 'listening' ? "Say something..." : statusMessage)}
                            </p>
                            {status === 'listening' && transcript && (
                                <p className="text-sm text-white/40 mt-2 animate-pulse">Processing when you stop speaking...</p>
                            )}
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-center gap-4 pt-4">
                            {status === 'listening' && (
                                <button
                                    onClick={stopListening}
                                    className="px-6 py-2 rounded-full bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
                                >
                                    Done
                                </button>
                            )}
                            {(status === 'error' || status === 'listening') && (
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-full hover:bg-slate-800 text-white/50 hover:text-white transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            )}
                        </div>

                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
