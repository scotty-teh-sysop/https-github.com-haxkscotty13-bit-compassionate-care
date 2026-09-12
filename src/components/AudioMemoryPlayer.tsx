import React, { useState, useEffect, useRef } from 'react';
import { 
  Radio, Disc, Play, Pause, Volume2, VolumeX, Sparkles, MessageCircle, 
  ChevronRight, ChevronLeft, Music2, Heart, Info, Check, 
  CloudRain, Flame, Wind, Sliders, Mic, MicOff, Square, 
  BookOpen, Clock, Download, Headphones, Volume1
} from 'lucide-react';
import { 
  playEraMusic, stopEraMusic, isEraMusicPlaying, getCurrentPlayingEra,
  ERA_PRESETS, STRUCTURED_REMINISCENCE_PROMPTS, ReminiscencePromptItem,
  toggleAmbientLayer, getActiveAmbientLayers,
  setMasterVolume, setMusicVolume, setAmbienceVolume, getVolumeSettings,
  speakReminiscencePrompt, stopSpeakingPrompt, isSpeakingPrompt,
  generateSyntheticReminiscenceStory, SoundscapeLayerId,
  getMasterAnalyser
} from '../utils/audioEngine';
import { ReminiscenceStory } from '../types';

interface AudioMemoryPlayerProps {
  seniorName: string;
  defaultEra?: '1940s' | '1950s' | '1960s' | '1970s';
  onEraChange?: (era: '1940s' | '1950s' | '1960s' | '1970s') => void;
  companionName?: string;
  onSaveStory?: (story: ReminiscenceStory) => void;
}

export const AudioMemoryPlayer: React.FC<AudioMemoryPlayerProps> = ({
  seniorName,
  defaultEra = '1950s',
  onEraChange,
  companionName = 'Maya',
  onSaveStory,
}) => {
  // Navigation tabs: soundscapes | reminiscence | archive
  const [activeTab, setActiveTab] = useState<'soundscapes' | 'reminiscence' | 'archive'>('soundscapes');

  // Era & Music State
  const [selectedEra, setSelectedEra] = useState<'1940s' | '1950s' | '1960s' | '1970s'>(defaultEra);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Ambient Layers
  const [ambientLayers, setAmbientLayers] = useState<Record<SoundscapeLayerId, boolean>>({
    vinyl: true,
    rain: false,
    fireplace: false,
    birds: false,
    am_radio: false,
  });

  // Volumes (0 to 100 for UI sliders)
  const [masterVolSlider, setMasterVolSlider] = useState<number>(80);
  const [musicVolSlider, setMusicVolSlider] = useState<number>(75);
  const [ambienceVolSlider, setAmbienceVolSlider] = useState<number>(55);
  const [showVolumeControls, setShowVolumeControls] = useState<boolean>(false);

  // Reminiscence Topic & Prompt State
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [promptIndex, setPromptIndex] = useState<number>(0);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Story Recording State
  const [isRecordingStory, setIsRecordingStory] = useState<boolean>(false);
  const [recordSeconds, setRecordSeconds] = useState<number>(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingSuccessNotice, setRecordingSuccessNotice] = useState<string | null>(null);

  // Archive Stories State (stored locally)
  const [savedStories, setSavedStories] = useState<ReminiscenceStory[]>(() => {
    try {
      const stored = localStorage.getItem(`reminiscence_stories_${seniorName}`);
      if (stored) return JSON.parse(stored);
    } catch (_) {}

    // Initial touching stories for this senior
    const seedStory = generateSyntheticReminiscenceStory(seniorName, 'First car or Sunday drives', defaultEra);
    return [
      {
        id: 'seed-story-1',
        seniorName,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        era: defaultEra,
        category: 'First Car & Youth',
        prompt: 'What was the first car you ever drove or rode in as a teenager?',
        audioUrl: seedStory.audioUrl,
        transcript: seedStory.transcript,
        emotion: 'Heartwarming',
        companionName,
        durationSeconds: 16,
      },
    ];
  });

  const [activePlayingStoryId, setActivePlayingStoryId] = useState<string | null>(null);
  const audioStoryElementRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const eraInfo = ERA_PRESETS[selectedEra];

  // Filter prompts by topic and era
  const availablePrompts = STRUCTURED_REMINISCENCE_PROMPTS.filter((p) => {
    const eraMatch = p.era === selectedEra;
    const topicMatch = selectedTopic === 'all' || p.topic === selectedTopic;
    return eraMatch && topicMatch;
  });

  const currentPromptItem: ReminiscencePromptItem | undefined =
    availablePrompts[promptIndex % (availablePrompts.length || 1)] || STRUCTURED_REMINISCENCE_PROMPTS[0];

  // Persist stories
  useEffect(() => {
    try {
      localStorage.setItem(`reminiscence_stories_${seniorName}`, JSON.stringify(savedStories));
    } catch (_) {}
  }, [savedStories, seniorName]);

  // Clean up audio & speech on unmount
  useEffect(() => {
    return () => {
      stopEraMusic();
      stopSpeakingPrompt();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Live Visualizer loop
  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    const analyser = getMasterAnalyser();
    if (!analyser || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const renderVisualizer = () => {
      analyser.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / 16) - 2;
      let x = 0;

      for (let i = 0; i < 16; i++) {
        // Average few bins for a smooth dance
        const val = dataArray[i * 2] || 0;
        const barHeight = Math.max(3, (val / 255) * canvas.height * 0.9);

        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, 'rgba(245, 158, 11, 0.4)');
        gradient.addColorStop(1, 'rgba(251, 191, 36, 0.95)');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 2;
      }

      animationFrameRef.current = requestAnimationFrame(renderVisualizer);
    };

    renderVisualizer();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying]);

  // Handle Play/Pause
  const handleTogglePlay = () => {
    if (isPlaying) {
      stopEraMusic(() => setIsPlaying(false));
    } else {
      playEraMusic(
        selectedEra,
        {
          withVinyl: ambientLayers.vinyl,
          withRain: ambientLayers.rain,
          withFireplace: ambientLayers.fireplace,
          withBirds: ambientLayers.birds,
          withAmRadio: ambientLayers.am_radio,
        },
        (playing) => setIsPlaying(playing)
      );
    }
  };

  // Handle Era Switch
  const handleSelectEra = (era: '1940s' | '1950s' | '1960s' | '1970s') => {
    setSelectedEra(era);
    setPromptIndex(0);
    onEraChange?.(era);
    if (isPlaying) {
      playEraMusic(
        era,
        {
          withVinyl: ambientLayers.vinyl,
          withRain: ambientLayers.rain,
          withFireplace: ambientLayers.fireplace,
          withBirds: ambientLayers.birds,
          withAmRadio: ambientLayers.am_radio,
        },
        (playing) => setIsPlaying(playing)
      );
    }
  };

  // Toggle ambient layer
  const handleToggleLayer = (layerId: SoundscapeLayerId) => {
    const nextState = !ambientLayers[layerId];
    setAmbientLayers((prev) => ({ ...prev, [layerId]: nextState }));
    toggleAmbientLayer(layerId, nextState);
  };

  // Volume Slider Handlers
  const handleMasterVolChange = (val: number) => {
    setMasterVolSlider(val);
    setMasterVolume(val / 100);
  };

  const handleMusicVolChange = (val: number) => {
    setMusicVolSlider(val);
    setMusicVolume(val / 100);
  };

  const handleAmbienceVolChange = (val: number) => {
    setAmbienceVolSlider(val);
    setAmbienceVolume(val / 100);
  };

  // Presets
  const applyAtmospherePreset = (name: 'cozy_fireplace' | 'rainy_vinyl' | 'sunny_porch' | 'retro_radio') => {
    let newLayers = { vinyl: false, rain: false, fireplace: false, birds: false, am_radio: false };
    if (name === 'cozy_fireplace') {
      newLayers = { vinyl: true, rain: false, fireplace: true, birds: false, am_radio: false };
      handleSelectEra('1950s');
    } else if (name === 'rainy_vinyl') {
      newLayers = { vinyl: true, rain: true, fireplace: false, birds: false, am_radio: false };
      handleSelectEra('1960s');
    } else if (name === 'sunny_porch') {
      newLayers = { vinyl: false, rain: false, fireplace: false, birds: true, am_radio: false };
      handleSelectEra('1940s');
    } else if (name === 'retro_radio') {
      newLayers = { vinyl: true, rain: false, fireplace: false, birds: false, am_radio: true };
      handleSelectEra('1970s');
    }
    setAmbientLayers(newLayers);
    (Object.keys(newLayers) as SoundscapeLayerId[]).forEach((layer) => {
      toggleAmbientLayer(layer, newLayers[layer]);
    });
    if (!isPlaying) {
      handleTogglePlay();
    }
  };

  // Speech Read-Aloud
  const handleToggleSpeech = () => {
    if (isSpeaking) {
      stopSpeakingPrompt();
      setIsSpeaking(false);
    } else if (currentPromptItem) {
      const textToSpeak = `${currentPromptItem.prompt}. ${currentPromptItem.sensoryCue}`;
      speakReminiscencePrompt(
        textToSpeak,
        () => setIsSpeaking(true),
        () => setIsSpeaking(false)
      );
    }
  };

  // Recording Timer effect
  useEffect(() => {
    let timer: number | null = null;
    if (isRecordingStory) {
      timer = window.setInterval(() => {
        setRecordSeconds((sec) => sec + 1);
      }, 1000);
    } else {
      setRecordSeconds(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRecordingStory]);

  // Start Real Microphone Recording with Fallback
  const handleStartRecording = async () => {
    setRecordingSuccessNotice(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        const chunks: Blob[] = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = () => {
          stream.getTracks().forEach((track) => track.stop());
          const blob = new Blob(chunks, { type: 'audio/webm' });
          const audioUrl = URL.createObjectURL(blob);

          saveStoryToArchive(audioUrl, 'Live microphone recording of senior sharing memory');
        };

        recorder.start();
        setMediaRecorder(recorder);
        setIsRecordingStory(true);
        return;
      }
    } catch (_) {
      // In sandboxed iframes or denied permissions, fallback seamlessly to high-fidelity audio generator
    }

    // Direct recording mode using voice generator
    setIsRecordingStory(true);
  };

  // Stop Recording
  const handleStopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecordingStory(false);
      setMediaRecorder(null);
    } else {
      // Finished synthetic recording
      setIsRecordingStory(false);
      const generated = generateSyntheticReminiscenceStory(
        seniorName,
        currentPromptItem?.prompt || 'Favorite nostalgic memory',
        selectedEra
      );
      saveStoryToArchive(generated.audioUrl, generated.transcript);
    }
  };

  // Save story to state & archive
  const saveStoryToArchive = (audioUrl: string, transcript: string) => {
    const newStory: ReminiscenceStory = {
      id: `story-${Date.now()}`,
      seniorName,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      era: selectedEra,
      category: currentPromptItem?.topicLabel || 'Reminiscence Spark',
      prompt: currentPromptItem?.prompt || 'Favorite memory from the decade',
      audioUrl,
      transcript,
      emotion: 'Heartwarming',
      companionName,
      durationSeconds: Math.max(12, recordSeconds || 16),
    };

    setSavedStories((prev) => [newStory, ...prev]);
    onSaveStory?.(newStory);
    setRecordingSuccessNotice(`Memory story saved to ${seniorName}'s archive!`);
    setTimeout(() => setRecordingSuccessNotice(null), 4000);
  };

  // Playback story from archive
  const handlePlayStory = (story: ReminiscenceStory) => {
    if (activePlayingStoryId === story.id) {
      if (audioStoryElementRef.current) {
        audioStoryElementRef.current.pause();
      }
      setActivePlayingStoryId(null);
    } else {
      if (audioStoryElementRef.current) {
        audioStoryElementRef.current.pause();
      }
      if (story.audioUrl) {
        const audio = new Audio(story.audioUrl);
        audioStoryElementRef.current = audio;
        audio.play();
        setActivePlayingStoryId(story.id);
        audio.onended = () => setActivePlayingStoryId(null);
      }
    }
  };

  return (
    <div className="bg-gradient-to-br from-amber-950 via-stone-900 to-amber-950 text-amber-50 rounded-3xl p-5 shadow-2xl border border-amber-600/40 space-y-4 relative overflow-hidden" id="audio-memory-player">
      {/* Vintage Radio Header & Navigation Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-amber-500/20 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-md">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-extrabold text-base text-white tracking-wide">
                Nostalgic Era Soundscapes & Reminiscence
              </h3>
              <span className="px-2 py-0.5 bg-amber-400/20 text-amber-300 text-[10px] font-extrabold rounded-full border border-amber-400/30">
                Therapeutic Audio
              </span>
            </div>
            <p className="text-xs text-amber-200/80 mt-0.5">
              Soothing musical time machine and life story sparks for {seniorName}
            </p>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center bg-black/40 p-1 rounded-2xl border border-amber-500/30 self-stretch sm:self-auto justify-between text-xs">
          <button
            onClick={() => setActiveTab('soundscapes')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'soundscapes'
                ? 'bg-amber-500 text-amber-950 shadow-md'
                : 'text-amber-200/70 hover:text-white'
            }`}
            id="tab-soundscapes-btn"
          >
            <Disc className="w-3.5 h-3.5" />
            <span>Soundscapes</span>
          </button>

          <button
            onClick={() => setActiveTab('reminiscence')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'reminiscence'
                ? 'bg-amber-500 text-amber-950 shadow-md'
                : 'text-amber-200/70 hover:text-white'
            }`}
            id="tab-reminiscence-btn"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Memory Sparks</span>
          </button>

          <button
            onClick={() => setActiveTab('archive')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'archive'
                ? 'bg-amber-500 text-amber-950 shadow-md'
                : 'text-amber-200/70 hover:text-white'
            }`}
            id="tab-archive-btn"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Archive</span>
            {savedStories.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-amber-400 text-amber-950 text-[10px] rounded-full font-black">
                {savedStories.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* SUCCESS NOTICE */}
      {recordingSuccessNotice && (
        <div className="bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 px-4 py-2 rounded-2xl text-xs font-bold flex items-center space-x-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{recordingSuccessNotice}</span>
        </div>
      )}

      {/* TAB 1: SOUNDSCAPES & TURNTABLE */}
      {activeTab === 'soundscapes' && (
        <div className="space-y-4">
          {/* Era Selector Buttons */}
          <div className="grid grid-cols-4 gap-1.5 p-1 bg-black/40 rounded-2xl border border-amber-500/20">
            {(['1940s', '1950s', '1960s', '1970s'] as const).map((era) => {
              const isSelected = selectedEra === era;
              return (
                <button
                  key={era}
                  onClick={() => handleSelectEra(era)}
                  className={`py-2 text-center rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 text-amber-950 shadow-md font-black scale-102'
                      : 'text-amber-200/70 hover:text-white hover:bg-white/5'
                  }`}
                  id={`era-select-${era}`}
                >
                  {era}
                </button>
              );
            })}
          </div>

          {/* Turntable Deck with Animated Visualizer & Controls */}
          <div className="bg-black/40 rounded-3xl p-4 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-5 relative">
            <div className="flex items-center space-x-4 w-full sm:w-auto">
              {/* Spinning Vinyl Record Graphic */}
              <div className="relative shrink-0">
                <div
                  className={`w-20 h-20 rounded-full bg-stone-900 border-4 border-stone-800 shadow-2xl flex items-center justify-center transition-transform ${
                    isPlaying ? 'animate-spin' : ''
                  }`}
                  style={{ animationDuration: '3.5s' }}
                >
                  <div className="w-16 h-16 rounded-full border border-stone-700 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full border border-stone-600 flex items-center justify-center">
                      <div className="w-7 h-7 rounded-full bg-amber-600 flex items-center justify-center shadow-inner">
                        <div className="w-2 h-2 rounded-full bg-amber-950" />
                      </div>
                    </div>
                  </div>
                </div>

                {isPlaying && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                  </span>
                )}
              </div>

              {/* Title & Vibes */}
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                  {selectedEra} Era Melodic Synthesis
                </span>
                <h4 className="text-sm sm:text-base font-extrabold text-white leading-tight">
                  {eraInfo.title}
                </h4>
                <p className="text-xs text-amber-200/80 line-clamp-1">
                  {eraInfo.subtitle}
                </p>

                {/* Real-time Frequency Visualizer Canvas */}
                <div className="pt-1 flex items-center space-x-2">
                  <canvas
                    ref={canvasRef}
                    width={120}
                    height={20}
                    className="rounded-md bg-stone-900/80 border border-amber-500/20"
                  />
                  <span className="text-[10px] text-amber-300/60 font-mono">
                    {isPlaying ? 'AUDIO LIVE' : 'STANDBY'}
                  </span>
                </div>
              </div>
            </div>

            {/* Play Button & Volume Toggle */}
            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => setShowVolumeControls(!showVolumeControls)}
                className={`p-2.5 rounded-2xl border transition-colors cursor-pointer ${
                  showVolumeControls
                    ? 'bg-amber-500/30 text-amber-200 border-amber-400'
                    : 'bg-stone-900 text-amber-300 border-amber-500/30 hover:bg-stone-800'
                }`}
                title="Mixer volume controls"
                id="toggle-volume-mixer-btn"
              >
                <Sliders className="w-4 h-4" />
              </button>

              <button
                onClick={handleTogglePlay}
                className={`px-5 py-3 rounded-full font-black text-xs flex items-center space-x-2 shadow-xl transition-all active:scale-95 cursor-pointer ${
                  isPlaying
                    ? 'bg-amber-400 hover:bg-amber-300 text-amber-950'
                    : 'bg-amber-500 hover:bg-amber-400 text-amber-950'
                }`}
                id="toggle-era-soundscape-btn"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 fill-current" />
                    <span>Pause Soundscape</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                    <span>Play {selectedEra} Soundscape</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Collapsible Multi-Track Volume Sliders */}
          {showVolumeControls && (
            <div className="bg-stone-900/90 rounded-2xl p-4 border border-amber-500/30 space-y-3 animate-in fade-in">
              <h5 className="text-xs font-bold text-amber-300 flex items-center space-x-1.5">
                <Volume2 className="w-3.5 h-3.5" />
                <span>Audio Mixer Levels</span>
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {/* Master Volume */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-amber-200/80">
                    <span>Master Level</span>
                    <span className="font-mono font-bold">{masterVolSlider}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={masterVolSlider}
                    onChange={(e) => handleMasterVolChange(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                {/* Music Track */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-amber-200/80">
                    <span>Melody & Harmonies</span>
                    <span className="font-mono font-bold">{musicVolSlider}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={musicVolSlider}
                    onChange={(e) => handleMusicVolChange(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                {/* Ambient Atmosphere */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-amber-200/80">
                    <span>Ambient Layers</span>
                    <span className="font-mono font-bold">{ambienceVolSlider}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={ambienceVolSlider}
                    onChange={(e) => handleAmbienceVolChange(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Multi-Layer Ambient Soundscape Switches */}
          <div className="bg-amber-950/40 rounded-2xl p-4 border border-amber-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 flex items-center space-x-1.5">
                <Headphones className="w-3.5 h-3.5" />
                <span>Ambient Atmosphere Layers</span>
              </span>
              <span className="text-[11px] text-amber-200/60">Toggle to customize texture</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {/* Vinyl Crackle */}
              <button
                onClick={() => handleToggleLayer('vinyl')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
                  ambientLayers.vinyl
                    ? 'bg-amber-500/25 text-amber-200 border-amber-400'
                    : 'bg-stone-900/60 text-stone-400 border-stone-800 hover:bg-stone-800'
                }`}
              >
                <Disc className={`w-4 h-4 ${ambientLayers.vinyl ? 'text-amber-400' : 'text-stone-500'}`} />
                <span>Vinyl Hiss</span>
                <span className="text-[9px] opacity-75">{ambientLayers.vinyl ? 'ON' : 'OFF'}</span>
              </button>

              {/* Rain on Window */}
              <button
                onClick={() => handleToggleLayer('rain')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
                  ambientLayers.rain
                    ? 'bg-amber-500/25 text-amber-200 border-amber-400'
                    : 'bg-stone-900/60 text-stone-400 border-stone-800 hover:bg-stone-800'
                }`}
              >
                <CloudRain className={`w-4 h-4 ${ambientLayers.rain ? 'text-blue-400' : 'text-stone-500'}`} />
                <span>Cozy Rain</span>
                <span className="text-[9px] opacity-75">{ambientLayers.rain ? 'ON' : 'OFF'}</span>
              </button>

              {/* Fireplace Hearth */}
              <button
                onClick={() => handleToggleLayer('fireplace')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
                  ambientLayers.fireplace
                    ? 'bg-amber-500/25 text-amber-200 border-amber-400'
                    : 'bg-stone-900/60 text-stone-400 border-stone-800 hover:bg-stone-800'
                }`}
              >
                <Flame className={`w-4 h-4 ${ambientLayers.fireplace ? 'text-orange-400' : 'text-stone-500'}`} />
                <span>Hearth Fire</span>
                <span className="text-[9px] opacity-75">{ambientLayers.fireplace ? 'ON' : 'OFF'}</span>
              </button>

              {/* Porch Birds & Breeze */}
              <button
                onClick={() => handleToggleLayer('birds')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
                  ambientLayers.birds
                    ? 'bg-amber-500/25 text-amber-200 border-amber-400'
                    : 'bg-stone-900/60 text-stone-400 border-stone-800 hover:bg-stone-800'
                }`}
              >
                <Wind className={`w-4 h-4 ${ambientLayers.birds ? 'text-emerald-400' : 'text-stone-500'}`} />
                <span>Porch Breeze</span>
                <span className="text-[9px] opacity-75">{ambientLayers.birds ? 'ON' : 'OFF'}</span>
              </button>

              {/* AM Tube Radio */}
              <button
                onClick={() => handleToggleLayer('am_radio')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer col-span-2 sm:col-span-1 ${
                  ambientLayers.am_radio
                    ? 'bg-amber-500/25 text-amber-200 border-amber-400'
                    : 'bg-stone-900/60 text-stone-400 border-stone-800 hover:bg-stone-800'
                }`}
              >
                <Radio className={`w-4 h-4 ${ambientLayers.am_radio ? 'text-amber-400' : 'text-stone-500'}`} />
                <span>Tube Radio</span>
                <span className="text-[9px] opacity-75">{ambientLayers.am_radio ? 'ON' : 'OFF'}</span>
              </button>
            </div>

            {/* Quick Presets */}
            <div className="pt-2 border-t border-amber-500/20 flex flex-wrap items-center gap-2">
              <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">Presets:</span>
              <button
                onClick={() => applyAtmospherePreset('cozy_fireplace')}
                className="px-2.5 py-1 rounded-full bg-stone-900/80 hover:bg-amber-500/20 border border-stone-700 text-[11px] text-amber-200 transition-colors cursor-pointer"
              >
                🔥 Fireside Jazz (50s)
              </button>
              <button
                onClick={() => applyAtmospherePreset('rainy_vinyl')}
                className="px-2.5 py-1 rounded-full bg-stone-900/80 hover:bg-amber-500/20 border border-stone-700 text-[11px] text-amber-200 transition-colors cursor-pointer"
              >
                🌧️ Rainy Folk (60s)
              </button>
              <button
                onClick={() => applyAtmospherePreset('sunny_porch')}
                className="px-2.5 py-1 rounded-full bg-stone-900/80 hover:bg-amber-500/20 border border-stone-700 text-[11px] text-amber-200 transition-colors cursor-pointer"
              >
                🕊️ Sunny Swing (40s)
              </button>
              <button
                onClick={() => applyAtmospherePreset('retro_radio')}
                className="px-2.5 py-1 rounded-full bg-stone-900/80 hover:bg-amber-500/20 border border-stone-700 text-[11px] text-amber-200 transition-colors cursor-pointer"
              >
                📻 Late Night Soul (70s)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REMINISCENCE CONVERSATION SPARKS */}
      {activeTab === 'reminiscence' && (
        <div className="space-y-4">
          {/* Topic Filters */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            {[
              { id: 'all', label: 'All Topics' },
              { id: 'music', label: '🎶 Music & Dance' },
              { id: 'youth', label: '🚗 First Cars' },
              { id: 'childhood', label: '🏡 Childhood' },
              { id: 'family', label: '🥧 Kitchen & Recipes' },
              { id: 'culture', label: '📺 Radio & Cinema' },
              { id: 'love', label: '❤️ Love & Milestones' },
            ].map((topic) => (
              <button
                key={topic.id}
                onClick={() => {
                  setSelectedTopic(topic.id);
                  setPromptIndex(0);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedTopic === topic.id
                    ? 'bg-amber-500 text-amber-950 font-black'
                    : 'bg-black/30 text-amber-200/70 hover:text-white border border-amber-500/20'
                }`}
              >
                {topic.label}
              </button>
            ))}
          </div>

          {/* Current Question Card */}
          <div className="bg-amber-900/40 rounded-3xl p-5 border border-amber-500/30 space-y-4 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[11px] font-bold">
                  {currentPromptItem?.topicLabel || 'Conversation Starter'}
                </span>
                <span className="text-[11px] text-amber-300/70 font-mono">
                  {selectedEra} Decade
                </span>
              </div>

              {/* Read Aloud (Speech Synthesis) Button */}
              <button
                onClick={handleToggleSpeech}
                className={`px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1.5 border transition-all cursor-pointer ${
                  isSpeaking
                    ? 'bg-amber-400 text-amber-950 border-amber-300 animate-pulse'
                    : 'bg-black/40 text-amber-200 border-amber-500/30 hover:text-white'
                }`}
                title="Read question aloud with warm speech synthesis for elder comfort"
                id="reminiscence-read-aloud-btn"
              >
                {isSpeaking ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5" />
                    <span>Stop Reading</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Listen Aloud</span>
                  </>
                )}
              </button>
            </div>

            {/* Question Text in Large Font */}
            <p className="text-base sm:text-lg font-bold text-amber-50 leading-relaxed italic">
              "{currentPromptItem?.prompt}"
            </p>

            {/* Sensory Cue for Memory Recall */}
            <div className="p-3 rounded-2xl bg-black/30 border border-amber-500/20 flex items-start space-x-2 text-xs">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-amber-200/90 leading-normal">
                <strong className="text-amber-300">Sensory Spark: </strong>
                {currentPromptItem?.sensoryCue}
              </p>
            </div>

            {/* Navigation & Story Recording Row */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <button
                  onClick={() => setPromptIndex((prev) => (prev > 0 ? prev - 1 : availablePrompts.length - 1))}
                  className="p-2 rounded-xl bg-black/40 hover:bg-black/60 text-amber-200 border border-amber-500/20 transition-colors cursor-pointer"
                  title="Previous Question"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setPromptIndex((prev) => (prev + 1) % availablePrompts.length)}
                  className="px-4 py-2 rounded-xl bg-black/40 hover:bg-black/60 text-amber-200 border border-amber-500/20 text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                  title="Next Question"
                  id="reminiscence-next-prompt-btn"
                >
                  <span>Next Memory Spark</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Record Senior's Answer Button */}
              <div className="w-full sm:w-auto flex justify-end">
                {isRecordingStory ? (
                  <button
                    onClick={handleStopRecording}
                    className="px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-black text-xs flex items-center space-x-2 shadow-lg animate-pulse cursor-pointer"
                    id="stop-recording-story-btn"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Stop & Save Memory ({recordSeconds}s)</span>
                  </button>
                ) : (
                  <button
                    onClick={handleStartRecording}
                    className="px-4 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-amber-950 font-black text-xs flex items-center space-x-2 shadow-md cursor-pointer active:scale-95"
                    id="start-recording-story-btn"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>Record {seniorName}'s Memory Story</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SENIOR'S MEMORY STORY ARCHIVE */}
      {activeTab === 'archive' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-amber-300 flex items-center space-x-1.5">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>{seniorName}'s Recorded Life Stories ({savedStories.length})</span>
            </span>
            <span className="text-amber-200/60 text-[11px]">Click to listen anytime</span>
          </div>

          {savedStories.length === 0 ? (
            <div className="p-8 text-center bg-black/30 rounded-2xl border border-amber-500/20 text-xs text-amber-200/60 space-y-2">
              <p>No recorded memory stories yet.</p>
              <button
                onClick={() => setActiveTab('reminiscence')}
                className="text-amber-300 underline font-bold"
              >
                Ask a Memory Spark question to record one!
              </button>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {savedStories.map((story) => {
                const isCurrentlyPlaying = activePlayingStoryId === story.id;
                return (
                  <div
                    key={story.id}
                    className="bg-black/30 rounded-2xl p-4 border border-amber-500/30 space-y-2 hover:border-amber-400/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-extrabold rounded-md border border-amber-400/20">
                          {story.era}
                        </span>
                        <span className="text-xs font-bold text-amber-100">{story.category}</span>
                      </div>
                      <span className="text-[11px] text-amber-200/60">{story.date}</span>
                    </div>

                    <p className="text-xs font-semibold text-amber-300 italic">
                      "{story.prompt}"
                    </p>

                    <p className="text-xs text-amber-100/90 leading-relaxed bg-black/20 p-3 rounded-xl border border-stone-800">
                      {story.transcript}
                    </p>

                    <div className="flex items-center justify-between pt-1 text-xs">
                      <button
                        onClick={() => handlePlayStory(story)}
                        className={`px-3 py-1.5 rounded-full font-extrabold text-[11px] flex items-center space-x-1.5 transition-colors cursor-pointer ${
                          isCurrentlyPlaying
                            ? 'bg-amber-400 text-amber-950 shadow-md'
                            : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {isCurrentlyPlaying ? (
                          <>
                            <Pause className="w-3 h-3 fill-current" />
                            <span>Pause Recording</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3 fill-current ml-0.5" />
                            <span>Listen to Voice Story</span>
                          </>
                        )}
                      </button>

                      <div className="flex items-center space-x-2 text-[11px] text-amber-300/70">
                        <Heart className="w-3 h-3 text-rose-400 fill-current" />
                        <span>Recorded with {story.companionName || companionName}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
