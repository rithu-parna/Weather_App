import { useEffect, useRef } from 'react';

export default function WeatherRadar() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // Fixed size for radar card
    canvas.width = 300;
    canvas.height = 200;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.min(canvas.width, canvas.height) / 2 - 10;

    let angle = 0;
    
    // Generate some static random precipitation blobs
    const blobs = [
      { x: centerX + 30, y: centerY - 20, r: 15, color: 'rgba(16, 185, 129, 0.4)' }, // Green rain
      { x: centerX - 40, y: centerY - 30, r: 25, color: 'rgba(16, 185, 129, 0.35)' },
      { x: centerX - 35, y: centerY - 35, r: 10, color: 'rgba(245, 158, 11, 0.5)' },  // Yellow heavy rain
      { x: centerX + 15, y: centerY + 30, r: 20, color: 'rgba(16, 185, 129, 0.3)' }
    ];

    const drawRadar = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Draw Grid lines
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.lineWidth = 1;
      
      // Horizontal & Vertical crosshairs
      ctx.beginPath();
      ctx.moveTo(centerX - maxRadius, centerY);
      ctx.lineTo(centerX + maxRadius, centerY);
      ctx.moveTo(centerX, centerY - maxRadius);
      ctx.lineTo(centerX, centerY + maxRadius);
      ctx.stroke();

      // Concentric circles
      for (let r = maxRadius / 3; r <= maxRadius; r += maxRadius / 3) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Ring labels
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('50km', centerX, centerY - maxRadius / 3 + 3);
      ctx.fillText('100km', centerX, centerY - (maxRadius / 3) * 2 + 3);
      ctx.fillText('150km', centerX, centerY - maxRadius + 3);

      // 2. Draw Precipitation Blobs
      blobs.forEach(blob => {
        // Calculate angle of blob relative to center
        const blobAngle = Math.atan2(blob.y - centerY, blob.x - centerX);
        // Normalize angle to [0, 2*PI]
        let diff = angle - blobAngle;
        while (diff < 0) diff += Math.PI * 2;
        while (diff > Math.PI * 2) diff -= Math.PI * 2;

        // If the sweep line has just passed the blob, make it glow brightly and fade out
        let intensity = 0;
        if (diff < Math.PI / 2) {
          intensity = 1 - (diff / (Math.PI / 2)); // Fades out as sweep moves away
        }

        if (intensity > 0) {
          const grad = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.r);
          // Color parsing
          const baseColor = blob.color.includes('16, 185, 129') ? '16, 185, 129' : '245, 158, 11';
          grad.addColorStop(0, `rgba(${baseColor}, ${0.7 * intensity})`);
          grad.addColorStop(0.5, `rgba(${baseColor}, ${0.3 * intensity})`);
          grad.addColorStop(1, 'rgba(0,0,0,0)');
          
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(blob.x, blob.y, blob.r, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // 3. Draw Radar Sweep beam
      const endX = centerX + maxRadius * Math.cos(angle);
      const endY = centerY + maxRadius * Math.sin(angle);

      // Draw sweeping gradient cone
      const segments = 30;
      for (let i = 0; i < segments; i++) {
        const segAngle = angle - (i * 0.02);
        const alpha = (1 - i / segments) * 0.22;
        ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + maxRadius * Math.cos(segAngle), centerY + maxRadius * Math.sin(segAngle));
        ctx.stroke();
      }

      // Draw bright lead line
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Center glowing point
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
      ctx.fill();

      // Increment sweep angle
      angle += 0.015;
      if (angle > Math.PI * 2) {
        angle = 0;
      }

      animationFrameId = requestAnimationFrame(drawRadar);
    };

    drawRadar();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
      <canvas
        ref={canvasRef}
        style={{
          background: 'rgba(15, 23, 42, 0.35)',
          borderRadius: '16px',
          border: '1px solid rgba(56, 189, 248, 0.15)',
          maxWidth: '100%',
          boxShadow: 'inset 0 0 20px rgba(56, 189, 248, 0.1)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '10px',
          left: '15px',
          fontSize: '9px',
          fontFamily: 'monospace',
          color: '#38bdf8',
          letterSpacing: '1px',
          textShadow: '0 0 5px rgba(56, 189, 248, 0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: '#10b981',
            animation: 'pulse 1.5s infinite',
          }}
        />
        LIVE SCAN
      </div>
    </div>
  );
}
