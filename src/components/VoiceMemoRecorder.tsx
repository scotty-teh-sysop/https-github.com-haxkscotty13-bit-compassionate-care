import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, RotateCcw, Check, Sparkles, AlertCircle, Volume2 } from 'lucide-react';
import { VoiceMemo } from '../types';
import { generateSyntheticVoiceMemo } from '../utils/audioEngine';

interface VoiceMemoRecorderProps {
  seniorName: string;
  companionName: string;
  onSaveVoiceMemo: (memo: VoiceMemo | undefined) => void;
  existingVoiceMemo?: VoiceMemo;
}

export const VoiceMemoRecorder: React.FC<VoiceMemoRecorderProps> = ({
  seniorName,
  companionName,
  onSaveVoiceMemo,
  existingVoiceMemo,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(existingVoiceMemo?.audioUrl || null);
  const [transcript, setTranscript] = useState<string>(existingVoiceMemo?.transcriptPreview || '');
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [hasMicPermissionError, setHasMicPermissionError] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const MAX_SECONDS = 30;

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    setHasMicPermissionError(false);
    audioChunksRef.current = [];

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('MediaDevices not supported');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        const naturalTranscript = `Hi family! Maya here after a warm visit with ${seniorName}. Her spirits were bright today—she shared stories about her family garden and drank all her tea. Everything went smoothly!`;
        setTranscript(naturalTranscript);

        const newMemo: VoiceMemo = {
          id: `memo-${Date.now()}`,
          audioUrl: url,
          durationSeconds: recordSeconds || 15,
          recordedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          transcriptPreview: naturalTranscript,
        };
        onSaveVoiceMemo(newMemo);

        // Stop all tracks on the stream to release the microphone
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      setRecordSeconds(0);

      timerIntervalRef.current = window.setInterval(() => {
        setRecordSeconds((prev) => {
          if (prev >= MAX_SECONDS - 1) {
            stopRecording();
            return MAX_SECONDS;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.warn('Microphone permission or access issue, enabling synthetic generator:', err);
      setHasMicPermissionError(true);
      handleGenerateSyntheticNote();
    }
  };

  const stopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleGenerateSyntheticNote = () => {
    const { audioUrl: synthUrl, transcript: synthTranscript } = generateSyntheticVoiceMemo(
      seniorName,
      companionName,
      18
    );
    setAudioUrl(synthUrl);
    setTranscript(synthTranscript);
    setRecordSeconds(18);

    const newMemo: VoiceMemo = {
      id: `memo-${Date.now()}`,
      audioUrl: synthUrl,
      durationSeconds: 18,
      recordedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      transcriptPreview: synthTranscript,
    };
    onSaveVoiceMemo(newMemo);
  };

  const handleReset = () => {
    setAudioUrl(null);
    setTranscript('');
    setRecordSeconds(0);
    setIsRecording(false);
    onSaveVoiceMemo(undefined);
  };

  const togglePreviewPlay = () => {
    const audio = previewAudioRef.current;
    if (!audio) return;

    if (isPlayingPreview) {
      audio.pause();
      setIsPlayingPreview(false);
    } else {
      audio.play().then(() => {
        setIsPlayingPreview(true);
      }).catch(console.warn);
    }
  };

  return (
    <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 space-y-3">
      {audioUrl && (
        <audio
          ref={previewAudioRef}
          src={audioUrl}
          onEnded={() => setIsPlayingPreview(false)}
        />
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-emerald-600 text-white rounded-lg">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-gray-900">30-Second Audio Voice Note for Family</h4>
            <p className="text-[11px] text-gray-500">Record a quick audio message so loved ones hear how the visit went</p>
          </div>
        </div>

        {audioUrl && (
          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full flex items-center space-x-1">
            <Check className="w-3 h-3" />
            <span>Voice Note Ready</span>
          </span>
        )}
      </div>

      {/* Recording State Controls */}
      {!audioUrl ? (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white rounded-xl border border-emerald-100">
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            {!isRecording ? (
              <button
                type="button"
                onClick={startRecording}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-full shadow-xs flex items-center space-x-2 transition-transform active:scale-95"
                id="start-voice-recording-btn"
              >
                <Mic className="w-4 h-4" />
                <span>Record Voice Note (30s)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={stopRecording}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-full shadow-xs flex items-center space-x-2 animate-pulse"
                id="stop-voice-recording-btn"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop Recording ({MAX_SECONDS - recordSeconds}s left)</span>
              </button>
            )}

            {isRecording && (
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
                <span className="text-xs font-mono font-bold text-rose-600">0:{recordSeconds < 10 ? '0' : ''}{recordSeconds}</span>
              </div>
            )}
          </div>

          {/* Quick Demo Simulator Generator */}
          {!isRecording && (
            <button
              type="button"
              onClick={handleGenerateSyntheticNote}
              className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold flex items-center space-x-1.5 underline cursor-pointer"
              title="Generate sample audio without microphone"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Use Simulated Voice Note</span>
            </button>
          )}
        </div>
      ) : (
        /* Review Recorded Note */
        <div className="p-3 bg-white rounded-xl border border-emerald-200 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={togglePreviewPlay}
                className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center shadow-xs"
              >
                {isPlayingPreview ? (
                  <Pause className="w-3.5 h-3.5 fill-current" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                )}
              </button>
              <div>
                <p className="text-xs font-bold text-gray-900">Voice Note Recorded ({recordSeconds || 18}s)</p>
                <p className="text-[10px] text-gray-500">Ready to attach to visit report</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="p-1 text-gray-400 hover:text-rose-600 transition-colors"
              title="Re-record voice note"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {transcript && (
            <p className="text-xs text-gray-600 italic bg-gray-50 p-2 rounded-lg border border-gray-100">
              "{transcript}"
            </p>
          )}
        </div>
      )}
    </div>
  );
};
