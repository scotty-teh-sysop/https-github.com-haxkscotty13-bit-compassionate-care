import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, Mic, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { VoiceMemo } from '../types';

interface VoiceMemoPlayerProps {
  voiceMemo: VoiceMemo;
  companionName?: string;
  seniorName?: string;
}

export const VoiceMemoPlayer: React.FC<VoiceMemoPlayerProps> = ({
  voiceMemo,
  companionName = 'Companion',
  seniorName = 'Senior',
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const duration = voiceMemo.durationSeconds || 24;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.playbackRate = playbackRate;
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn('Audio playback caught:', err);
      });
    }
  };

  const togglePlaybackRate = () => {
    const nextRate = playbackRate === 1 ? 1.25 : playbackRate === 1.25 ? 1.5 : 1;
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  // Waveform bars with static heights
  const waveformHeights = [
    28, 45, 60, 35, 75, 90, 65, 80, 50, 40, 70, 85, 95, 60, 45, 65, 80, 70, 55, 40, 60, 80, 50, 35
  ];

  return (
    <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-emerald-950 text-white rounded-2xl p-4 border border-emerald-500/40 shadow-md space-y-3">
      <audio ref={audioRef} src={voiceMemo.audioUrl} preload="auto" />

      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-emerald-500/20 text-emerald-300 rounded-xl">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-300">
              30-Second Audio Voice Note
            </span>
            <h5 className="text-xs font-bold text-white">
              {companionName} to Family
            </h5>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={togglePlaybackRate}
            className="px-2 py-0.5 bg-white/10 hover:bg-white/20 rounded-md text-[10px] font-bold text-emerald-200 border border-white/10"
            title="Toggle playback speed"
          >
            {playbackRate}x
          </button>
          <span className="text-[11px] font-mono text-emerald-200">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Interactive Waveform & Playback Controls */}
      <div className="flex items-center space-x-3 bg-black/20 p-2.5 rounded-xl border border-white/10">
        <button
          onClick={togglePlay}
          className="w-10 h-10 rounded-full bg-emerald-400 hover:bg-emerald-300 text-emerald-950 flex items-center justify-center shadow-md shrink-0 transition-transform active:scale-95"
          id="play-voice-memo-btn"
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5" />
          )}
        </button>

        {/* Waveform Visualization Bars */}
        <div className="flex-1 flex items-center space-x-1 h-8 cursor-pointer overflow-hidden"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickPos = (e.clientX - rect.left) / rect.width;
            if (audioRef.current) {
              const newTime = clickPos * duration;
              audioRef.current.currentTime = newTime;
              setCurrentTime(newTime);
            }
          }}
        >
          {waveformHeights.map((h, i) => {
            const barFraction = i / waveformHeights.length;
            const isPlayed = barFraction <= progressPercent / 100;
            return (
              <div
                key={i}
                className={`flex-1 rounded-full transition-colors ${
                  isPlayed ? 'bg-emerald-300' : 'bg-white/20'
                }`}
                style={{ height: `${h}%` }}
              />
            );
          })}
        </div>
      </div>

      {/* Voice Transcript Toggle */}
      {voiceMemo.transcriptPreview && (
        <div className="pt-1 border-t border-white/10 text-xs">
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="flex items-center justify-between w-full text-emerald-200 hover:text-white font-medium text-[11px]"
          >
            <span className="flex items-center space-x-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span>Voice Note Audio Transcript</span>
            </span>
            {showTranscript ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showTranscript && (
            <div className="mt-2 p-2.5 bg-black/25 rounded-xl border border-white/10 text-emerald-100 italic leading-relaxed text-[11px]">
              "{voiceMemo.transcriptPreview}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};
