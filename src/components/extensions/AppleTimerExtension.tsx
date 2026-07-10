import React, { useState, useEffect } from 'react';
import { Clock, Play, Pause, RotateCcw, Sparkles, Volume2, VolumeX, CheckCircle2 } from 'lucide-react';
import { globalNotificationQueue } from '../../dsa-engine';

export const AppleTimerExtension: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'focus' | 'shortBreak' | 'deepStudy'>('focus');
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    let interval: any = null;
    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0 && isActive) {
      setIsActive(false);
      globalNotificationQueue.enqueue({
        id: `timer_${Date.now()}`,
        title: mode === 'focus' ? '🍅 Focus Session Completed! +50 Reputation' : '☕ Break Ended! Back to Books',
        type: 'BROADCAST_NOTIFICATION',
        status: 'COMPLETED',
        progress: 100,
        timeComplexity: 'O(1) Circular Queue Push',
      });
      alert(mode === 'focus' ? '🎉 Study Focus Session Complete! Added +50 points to your profile.' : '☕ Break ended! Ready for another session?');
    }
    return () => clearInterval(interval);
  }, [isActive, secondsLeft, mode]);

  if (!isOpen) return null;

  const handleSelectMode = (newMode: 'focus' | 'shortBreak' | 'deepStudy', minutes: number) => {
    setIsActive(false);
    setMode(newMode);
    setSecondsLeft(minutes * 60);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-fadeIn">
      <div className="w-full max-w-md rounded-3xl bg-slate-900/80 dark:bg-black/80 backdrop-blur-3xl border border-white/25 shadow-[0_25px_70px_rgba(0,0,0,0.9)] p-6 space-y-6 text-white relative overflow-hidden animate-scaleUp">
        
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-white/15 border border-white/25 flex items-center justify-center text-cyan-300 shadow-inner shadow-white/20">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">Apple Glass Study Timer</h3>
              <p className="text-[11px] text-slate-300">Pomodoro Engine • Background Queue ($O(1)$)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-slate-200 hover:text-white transition-all active:scale-95"
          >
            ✕
          </button>
        </div>

        {/* Grouped Segmented Control (Neighbor buttons grouped exactly like iOS floating dock) */}
        <div className="p-1.5 rounded-full bg-white/[0.06] border border-white/15 backdrop-blur-2xl flex items-center justify-between gap-1 shadow-inner relative z-10">
          {[
            { id: 'focus', label: '🍅 25m Focus', mins: 25 },
            { id: 'shortBreak', label: '☕ 5m Break', mins: 5 },
            { id: 'deepStudy', label: '⚡ 60m Deep Study', mins: 60 },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handleSelectMode(item.id as any, item.mins)}
              className={`flex-1 py-2 px-3 rounded-full text-xs font-semibold transition-all duration-300 ${
                mode === item.id
                  ? 'bg-white/25 text-white shadow-md border border-white/30 scale-[1.02]'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Countdown Ring Display */}
        <div className="py-8 text-center relative z-10">
          <div className="inline-block px-10 py-6 rounded-3xl bg-white/[0.04] border border-white/15 shadow-2xl backdrop-blur-2xl">
            <span className="text-6xl sm:text-7xl font-mono font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-cyan-200 drop-shadow-md">
              {formatTime(secondsLeft)}
            </span>
          </div>
          <p className="text-xs text-cyan-300 font-medium mt-3 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{mode === 'focus' ? 'Deep Academic Concentration Active' : mode === 'deepStudy' ? 'High-Yield Exam Preparation' : 'Relax & Recharge Your Brain'}</span>
          </p>
        </div>

        {/* Grouped Action Buttons */}
        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={() => setIsActive(!isActive)}
            className={`flex-1 py-3.5 px-6 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-xl border active:scale-98 ${
              isActive
                ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border-amber-400/40'
                : 'bg-white/20 hover:bg-white/30 text-white border-white/40 shadow-white/10'
            }`}
          >
            {isActive ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isActive ? 'Pause Timer' : 'Start Focus Session'}</span>
          </button>

          <button
            onClick={() => {
              setIsActive(false);
              setSecondsLeft((mode === 'focus' ? 25 : mode === 'shortBreak' ? 5 : 60) * 60);
            }}
            title="Reset Timer"
            className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white border border-white/20 transition-all active:scale-95 shrink-0"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title="Toggle Ambient Focus Sound"
            className={`p-3.5 rounded-2xl border transition-all active:scale-95 shrink-0 ${
              soundEnabled
                ? 'bg-cyan-500/25 text-cyan-200 border-cyan-400/40'
                : 'bg-white/10 text-slate-400 border-white/15'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>

        {/* Footer info */}
        <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 text-[11px] text-slate-300 flex items-center justify-between gap-2">
          <span>⚡ Linked to `TaskQueue`: Automatically dispatches completion notifications and awards DSA points.</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        </div>

      </div>
    </div>
  );
};
