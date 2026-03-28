import { useState, useCallback, useRef, useEffect } from 'react';

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef(null);
  const [voices, setVoices] = useState([]);

  useEffect(() => {
    const loadVoices = () => {
      const v = speechSynthesis.getVoices();
      setVoices(v);
    };
    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      speechSynthesis.cancel();
    };
  }, []);

  const speak = useCallback(
    (text) => {
      return new Promise((resolve) => {
        speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        // Prefer a natural-sounding female English voice
        const preferred = voices.find(
          (v) =>
            v.lang.startsWith('en') &&
            (v.name.includes('Google') ||
              v.name.includes('Microsoft') ||
              v.name.includes('Samantha') ||
              v.name.includes('Zira'))
        );
        if (preferred) {
          utterance.voice = preferred;
        }

        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => {
          setIsSpeaking(false);
          resolve();
        };
        utterance.onerror = () => {
          setIsSpeaking(false);
          resolve();
        };

        utteranceRef.current = utterance;
        speechSynthesis.speak(utterance);
      });
    },
    [voices]
  );

  const stop = useCallback(() => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  return { isSpeaking, speak, stop };
}
