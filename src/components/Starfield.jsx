import React, { useEffect, useRef } from 'react';

export default function Starfield({ density = 0.2, speed = 0.2 }) {
    const canvasRef = useRef(null);

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
            const particleCount = Math.min(window.innerWidth * density, 250);
            for (let i = 0; i < particleCount; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    vx: (Math.random() - 0.5) * speed,
                    vy: (Math.random() - 0.5) * speed,
                    size: Math.random() * 2 + 1.2,
                    hue: Math.random() * 60 + 200 // Blue-Cyan-Purple range
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

    return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />;
}
