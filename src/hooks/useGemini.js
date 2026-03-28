import { useState, useRef, useCallback } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

export function useGemini(apiKey) {
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState(null);
  const chatRef = useRef(null);
  const genAIRef = useRef(null);

  const initChat = useCallback(() => {
    if (!apiKey) return;
    try {
      genAIRef.current = new GoogleGenerativeAI(apiKey);
      const model = genAIRef.current.getGenerativeModel({
        model: 'gemini-2.0-flash',
        systemInstruction:
          'You are Nova, a friendly and helpful voice assistant. Keep your responses concise and conversational since they will be spoken aloud. Use natural, warm language. Avoid markdown formatting, bullet points, or numbered lists. Respond in 2-3 sentences maximum unless the user asks for a detailed explanation.',
      });
      chatRef.current = model.startChat({
        history: [],
        generationConfig: {
          maxOutputTokens: 250,
          temperature: 0.8,
        },
      });
    } catch (e) {
      setError('Failed to initialize Gemini. Please check your API key.');
    }
  }, [apiKey]);

  const sendMessage = useCallback(
    async (message) => {
      if (!chatRef.current) {
        initChat();
      }
      if (!chatRef.current) {
        setError('Gemini not initialized. Please enter your API key.');
        return null;
      }

      setIsThinking(true);
      setError(null);
      try {
        const result = await chatRef.current.sendMessage(message);
        const response = result.response.text();
        setIsThinking(false);
        return response;
      } catch (e) {
        setIsThinking(false);
        setError(`Gemini error: ${e.message}`);
        return null;
      }
    },
    [initChat]
  );

  return { isThinking, error, sendMessage, initChat };
}
