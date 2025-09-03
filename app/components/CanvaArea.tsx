"use client";

import { useEffect, forwardRef, useImperativeHandle, useRef } from "react";

interface CanvaAreaProps {
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

const CanvaArea = forwardRef<HTMLCanvasElement, CanvaAreaProps>(({ onCanvasReady }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useImperativeHandle(ref, () => canvasRef.current!, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    let animationId: number;
    let time = 0;

    const animate = () => {
      time += 0.01; // Smooth time progression

      // Calculate variable gradient direction/slope
      const angle = Math.sin(time * 0.3) * Math.PI; // Slow angle change for smooth transitions
      const radius = Math.max(canvas.width, canvas.height) * 0.8;

      const x1 = canvas.width / 2 + Math.cos(angle) * radius;
      const y1 = canvas.height / 2 + Math.sin(angle) * radius;
      const x2 = canvas.width / 2 + Math.cos(angle + Math.PI) * radius;
      const y2 = canvas.height / 2 + Math.sin(angle + Math.PI) * radius;

      // Create gradient with variable slope
      const gradient = ctx.createLinearGradient(x1, y1, x2, y2);

      // Generate random color variations using sine waves
      const random1 = Math.sin(time * 0.7) * 0.5 + 0.5; // Random factor 1 (0-1)
      const random2 = Math.sin(time * 1.1) * 0.5 + 0.5; // Random factor 2 (0-1)
      const random3 = Math.sin(time * 0.9) * 0.5 + 0.5; // Random factor 3 (0-1)

      // Calculate base colors with sine waves
      const baseR1 = Math.sin(time) * 127 + 128;
      const baseG1 = Math.sin(time + 2) * 127 + 128;
      const baseB1 = Math.sin(time + 4) * 127 + 128;

      const baseR2 = Math.sin(time + 3) * 127 + 128;
      const baseG2 = Math.sin(time + 5) * 127 + 128;
      const baseB2 = Math.sin(time + 1) * 127 + 128;

      // Add random variations to create unpredictable colors
      const r1 = baseR1 + (Math.sin(time * 2.1) * 60) + (random1 * 100 - 50);
      const g1 = baseG1 + (Math.sin(time * 1.7) * 60) + (random2 * 100 - 50);
      const b1 = baseB1 + (Math.sin(time * 2.3) * 60) + (random3 * 100 - 50);

      const r2 = baseR2 + (Math.sin(time * 1.9) * 60) + ((1 - random1) * 100 - 50);
      const g2 = baseG2 + (Math.sin(time * 2.5) * 60) + ((1 - random2) * 100 - 50);
      const b2 = baseB2 + (Math.sin(time * 1.3) * 60) + ((1 - random3) * 100 - 50);

      // Ensure colors stay within valid range
      const clamp = (val: number) => Math.max(0, Math.min(255, val));

      gradient.addColorStop(0, `rgb(${clamp(r1)}, ${clamp(g1)}, ${clamp(b1)})`);
      gradient.addColorStop(0.5, `rgb(${clamp((r1 + r2) / 2)}, ${clamp((g1 + g2) / 2)}, ${clamp((b1 + b2) / 2)})`);
      gradient.addColorStop(1, `rgb(${clamp(r2)}, ${clamp(g2)}, ${clamp(b2)})`);

      // Fill canvas with gradient
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div className="w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-lg"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
});

CanvaArea.displayName = 'CanvaArea';

export default CanvaArea;