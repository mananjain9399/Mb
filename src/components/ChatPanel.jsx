import { useEffect, useRef } from 'react';

export default function ChatPanel({ messages }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.scrollTop = panelRef.current.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0) return null;

  return (
    <div className="chat-panel" ref={panelRef}>
      {messages.map((msg, i) => (
        <div key={i} className={`chat-bubble chat-bubble--${msg.role}`}>
          <div className="chat-bubble__label">
            {msg.role === 'user' ? 'You' : 'Nova'}
          </div>
          {msg.text}
        </div>
      ))}
    </div>
  );
}
