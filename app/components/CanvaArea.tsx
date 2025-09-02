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
      time += 0.01;

      // Create gradient
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);

      // Calculate colors based on time
      const r1 = Math.sin(time) * 127 + 128;
      const g1 = Math.sin(time + 2) * 127 + 128;
      const b1 = Math.sin(time + 4) * 127 + 128;

      const r2 = Math.sin(time + 3) * 127 + 128;
      const g2 = Math.sin(time + 5) * 127 + 128;
      const b2 = Math.sin(time + 1) * 127 + 128;

      gradient.addColorStop(0, `rgb(${r1}, ${g1}, ${b1})`);
      gradient.addColorStop(1, `rgb(${r2}, ${g2}, ${b2})`);

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