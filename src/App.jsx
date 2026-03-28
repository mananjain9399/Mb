import { useState, useEffect, useCallback, useRef } from 'react';
import Globe3D from './components/Globe3D';
import ApiKeyModal from './components/ApiKeyModal';
import ChatPanel from './components/ChatPanel';
import AudioVisualizer from './components/AudioVisualizer';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useSpeechSynthesis } from './hooks/useSpeechSynthesis';
import { useGemini } from './hooks/useGemini';
import './App.css';

function App() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [showKeyModal, setShowKeyModal] = useState(!apiKey);
  const [messages, setMessages] = useState([]);
  const [botState, setBotState] = useState('idle'); // idle | listening | thinking | speaking
  const [audioLevel, setAudioLevel] = useState(0);
  const [errorMsg, setErrorMsg] = useState(null);
  const errorTimeoutRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);

  const { isListening, transcript, interimTranscript, error: speechError, startListening, stopListening } = useSpeechRecognition();
  const { isSpeaking, speak, stop: stopSpeaking } = useSpeechSynthesis();
  const { isThinking, error: geminiError, sendMessage, initChat } = useGemini(apiKey);

  // Show errors
  useEffect(() => {
    const err = speechError || geminiError;
    if (err) {
      setErrorMsg(err);
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = setTimeout(() => setErrorMsg(null), 5000);
    }
  }, [speechError, geminiError]);

  // Track bot state
  useEffect(() => {
    if (isSpeaking) {
      setBotState('speaking');
    } else if (isThinking) {
      setBotState('thinking');
    } else if (isListening) {
      setBotState('listening');
    } else {
      setBotState('idle');
    }
  }, [isListening, isThinking, isSpeaking]);

  // Audio level analysis for speaking visualization
  useEffect(() => {
    if (isSpeaking) {
      // Simulate audio level when speaking
      const interval = setInterval(() => {
        setAudioLevel(0.3 + Math.random() * 0.7);
      }, 100);
      return () => {
        clearInterval(interval);
        setAudioLevel(0);
      };
    } else if (isListening) {
      // Use microphone analyser for listening
      const setupAudio = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);

          audioContextRef.current = audioCtx;
          analyserRef.current = analyser;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);

          const tick = () => {
            analyser.getByteFrequencyData(dataArray);
            const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
            setAudioLevel(avg / 128);
            animFrameRef.current = requestAnimationFrame(tick);
          };
          tick();
        } catch {
          // Microphone not available, use simulated levels
          const interval = setInterval(() => {
            setAudioLevel(0.1 + Math.random() * 0.3);
          }, 150);
          return () => clearInterval(interval);
        }
      };
      setupAudio();

      return () => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        if (audioContextRef.current) {
          audioContextRef.current.close().catch(() => {});
          audioContextRef.current = null;
        }
        setAudioLevel(0);
      };
    } else {
      setAudioLevel(0);
    }
  }, [isListening, isSpeaking]);

  // Process final transcript
  useEffect(() => {
    if (transcript) {
      handleUserMessage(transcript);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript]);

  const handleUserMessage = useCallback(
    async (text) => {
      setMessages((prev) => [...prev, { role: 'user', text }]);

      const response = await sendMessage(text);
      if (response) {
        setMessages((prev) => [...prev, { role: 'ai', text: response }]);
        await speak(response);
      }
    },
    [sendMessage, speak]
  );

  const handleApiKeySubmit = (key) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
    setShowKeyModal(false);
  };

  useEffect(() => {
    if (apiKey) {
      initChat();
    }
  }, [apiKey, initChat]);

  const handleMicClick = () => {
    if (isSpeaking) {
      stopSpeaking();
      return;
    }
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const getStatusText = () => {
    switch (botState) {
      case 'listening':
        return 'Listening...';
      case 'thinking':
        return 'Processing...';
      case 'speaking':
        return 'Speaking...';
      default:
        return 'Ready';
    }
  };

  const getMicIcon = () => {
    if (isSpeaking) return '⏹';
    if (isListening) return '⏸';
    return '🎤';
  };

  const getHintText = () => {
    if (isSpeaking) return 'Tap to stop';
    if (isListening) return 'Listening... tap to stop';
    if (isThinking) return 'Thinking...';
    return 'Tap to speak';
  };

  return (
    <div className="app-container">
      {/* Background gradient orbs */}
      <div className="bg-gradient-orb bg-gradient-orb--1" />
      <div className="bg-gradient-orb bg-gradient-orb--2" />
      <div className="bg-gradient-orb bg-gradient-orb--3" />

      {/* Header */}
      <header className="header">
        <div className="header__logo">
          <div className="header__logo-icon">✦</div>
          <span className="header__logo-text">Nova</span>
        </div>
        <div className="header__status">
          <span className={`header__status-dot header__status-dot--${botState}`} />
          {getStatusText()}
        </div>
      </header>

      {/* 3D Globe */}
      <Globe3D state={botState} audioLevel={audioLevel} />

      {/* Chat Panel */}
      <ChatPanel messages={messages} />

      {/* Live transcript */}
      {interimTranscript && (
        <div className="transcript transcript--interim">
          {interimTranscript}
        </div>
      )}

      {/* Audio Visualizer */}
      {(isListening || isSpeaking) && (
        <AudioVisualizer audioLevel={audioLevel} />
      )}

      {/* Mic controls */}
      <div className="controls">
        <button
          id="mic-button"
          className={`controls__mic-btn ${isListening ? 'controls__mic-btn--listening' : ''}`}
          onClick={handleMicClick}
          disabled={isThinking}
        >
          {isListening && <span className="controls__mic-ring" />}
          {isListening && <span className="controls__mic-ring" style={{ animationDelay: '0.5s' }} />}
          {getMicIcon()}
        </button>
        <span className="controls__hint">{getHintText()}</span>
      </div>

      {/* API Key Modal */}
      {showKeyModal && <ApiKeyModal onSubmit={handleApiKeySubmit} />}

      {/* Error Toast */}
      {errorMsg && <div className="error-toast">{errorMsg}</div>}
    </div>
  );
}

export default App;
