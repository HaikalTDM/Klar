import React from 'react';
import { motion } from 'framer-motion';

export const ProgressRing = ({ radius, stroke, progress }) => {
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center">
            <svg height={radius * 2} width={radius * 2} className="rotate-[-90deg] transition-all duration-500 ease-in-out">
                <circle
                    stroke="currentColor"
                    strokeWidth={stroke}
                    fill="transparent"
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                    className="text-slate-200 dark:text-slate-800 opacity-20"
                />
                <motion.circle
                    stroke="currentColor"
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    fill="transparent"
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                    style={{ strokeDasharray: circumference + ' ' + circumference }}
                    animate={{ strokeDashoffset }}
                    className="text-slate-900 dark:text-slate-100"
                />
            </svg>
        </div>
    );
};
