import { useEffect, useRef } from 'react';

export default function WeatherParticles({ weatherCode, isDay }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // Resize canvas to fill parent
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Weather type determination
    // 0: Clear, 1-3: Cloudy/Partly Cloudy, 45-48: Fog, 51-67/80-82: Rain, 71-77/85-86: Snow, 95-99: Thunderstorm
    let weatherType = 'clear';
    if (weatherCode === 0) weatherType = 'clear';
    else if (weatherCode >= 1 && weatherCode <= 3) weatherType = 'cloudy';
    else if (weatherCode >= 45 && weatherCode <= 48) weatherType = 'fog';
    else if ((weatherCode >= 51 && weatherCode <= 67) || (weatherCode >= 80 && weatherCode <= 82)) weatherType = 'rain';
    else if ((weatherCode >= 71 && weatherCode <= 77) || (weatherCode >= 85 && weatherCode <= 86)) weatherType = 'snow';
    else if (weatherCode >= 95 && weatherCode <= 99) weatherType = 'thunderstorm';

    // Particle Classes
    class RainParticle {
      constructor() {
        this.reset();
        this.y = Math.random() * canvas.height;
      }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = -20;
        this.vy = 8 + Math.random() * 8;
        this.vx = -1 - Math.random() * 2; // slant rain slightly
        this.length = 10 + Math.random() * 20;
        this.opacity = 0.1 + Math.random() * 0.3;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.y > canvas.height || this.x < -20) {
          this.reset();
        }
      }
      draw() {
        ctx.strokeStyle = `rgba(174, 219, 255, ${this.opacity})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.vx, this.y + this.length);
        ctx.stroke();
      }
    }

    class SnowParticle {
      constructor() {
        this.reset();
        this.y = Math.random() * canvas.height;
      }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = -10;
        this.radius = 1 + Math.random() * 3;
        this.vy = 1 + Math.random() * 2;
        this.vx = -0.5 + Math.random() * 1;
        this.opacity = 0.2 + Math.random() * 0.6;
        this.swing = Math.random() * 2;
        this.swingSpeed = 0.01 + Math.random() * 0.02;
        this.time = Math.random() * 100;
      }
      update() {
        this.time += this.swingSpeed;
        this.x += this.vx + Math.sin(this.time) * 0.5;
        this.y += this.vy;
        if (this.y > canvas.height || this.x < -10 || this.x > canvas.width + 10) {
          this.reset();
        }
      }
      draw() {
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    class FogParticle {
      constructor() {
        this.reset();
        this.x = Math.random() * canvas.width;
      }
      reset() {
        this.x = -150;
        this.y = Math.random() * canvas.height;
        this.radius = 80 + Math.random() * 100;
        this.vx = 0.2 + Math.random() * 0.5;
        this.opacity = 0.03 + Math.random() * 0.08;
      }
      update() {
        this.x += this.vx;
        if (this.x - this.radius > canvas.width) {
          this.reset();
        }
      }
      draw() {
        const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
        grad.addColorStop(0, `rgba(255, 255, 255, ${this.opacity})`);
        grad.addColorStop(0.8, `rgba(255, 255, 255, ${this.opacity * 0.5})`);
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Initialize particles
    const particles = [];
    if (weatherType === 'rain' || weatherType === 'thunderstorm') {
      const count = Math.min(120, Math.floor(canvas.width / 10));
      for (let i = 0; i < count; i++) particles.push(new RainParticle());
    } else if (weatherType === 'snow') {
      const count = Math.min(80, Math.floor(canvas.width / 15));
      for (let i = 0; i < count; i++) particles.push(new SnowParticle());
    } else if (weatherType === 'fog') {
      const count = 12;
      for (let i = 0; i < count; i++) particles.push(new FogParticle());
    }

    // Thunderstorm variables
    let flashOpacity = 0;
    let nextFlashFrame = 100 + Math.random() * 300;
    let flashCount = 0;

    // Sunny/Clear variables
    let sunPulse = 0;

    // Loop
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (weatherType === 'rain' || weatherType === 'snow' || weatherType === 'fog') {
        particles.forEach((p) => {
          p.update();
          p.draw();
        });
      } else if (weatherType === 'thunderstorm') {
        // Draw rain
        particles.forEach((p) => {
          p.update();
          p.draw();
        });

        // Flash logic
        nextFlashFrame--;
        if (nextFlashFrame <= 0) {
          flashOpacity = 0.5 + Math.random() * 0.4;
          flashCount = 2 + Math.floor(Math.random() * 3); // multi-flash
          nextFlashFrame = 200 + Math.random() * 400;
        }

        if (flashOpacity > 0) {
          ctx.fillStyle = `rgba(255, 255, 255, ${flashOpacity})`;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          flashOpacity -= 0.05;

          if (flashOpacity <= 0 && flashCount > 0) {
            flashCount--;
            flashOpacity = 0.3 + Math.random() * 0.4; // follow-up flash
          }
        }
      } else if (weatherType === 'clear' && isDay) {
        // Draw elegant sun ray/glow effect in top corner
        sunPulse += 0.005;
        const radius = 250 + Math.sin(sunPulse) * 30;
        const grad = ctx.createRadialGradient(canvas.width, 0, 0, canvas.width, 0, radius);
        grad.addColorStop(0, 'rgba(255, 223, 128, 0.15)');
        grad.addColorStop(0.5, 'rgba(255, 223, 128, 0.05)');
        grad.addColorStop(1, 'rgba(255, 223, 128, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(canvas.width, 0, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [weatherCode, isDay]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  );
}
