import React from 'react';

export default function StreakFire({ streak = 0 }) {
  const intensity = streak >= 30 ? 'intense' : streak >= 7 ? 'medium' : 'low';
  
  const colors = {
    low: ['#FF8C00', '#FFA500'],
    medium: ['#FF4500', '#FF8C00'],
    intense: ['#FF0000', '#FF4500']
  };

  const selected = colors[intensity];

  return (
    <div style={{ position: 'relative', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        fontSize: 24,
        zIndex: 2,
        animation: streak > 0 ? 'flicker 0.5s infinite alternate' : 'none',
        filter: streak > 0 ? `drop-shadow(0 0 10px ${selected[0]})` : 'grayscale(1)'
      }}>
        🔥
      </div>
      
      {streak > 0 && (
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${selected[0]}44 0%, transparent 70%)`,
          animation: 'pulse-glow 2s infinite'
        }} />
      )}

      <style>{`
        @keyframes flicker {
          0% { transform: scale(1) rotate(-2deg); opacity: 0.8; }
          100% { transform: scale(1.1) rotate(2deg); opacity: 1; }
        }
        @keyframes pulse-glow {
          0%, 100% { transform: scale(0.8); opacity: 0.3; }
          50% { transform: scale(1.2); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
