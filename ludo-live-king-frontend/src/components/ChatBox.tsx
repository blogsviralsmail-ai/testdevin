import { useState, useRef, useEffect } from "react";

interface ChatMessage {
  user_id: number;
  display_name: string;
  message: string;
  timestamp?: number;
}

interface ChatBoxProps {
  messages: ChatMessage[];
  onSend: (message: string) => void;
  onEmoji: (emoji: string) => void;
}

const QUICK_EMOJIS = ["😂", "😎", "🔥", "👏", "😡", "😭", "🎉", "💪"];

export default function ChatBox({ messages, onSend, onEmoji }: ChatBoxProps) {
  const [input, setInput] = useState("");
  const [showEmojis, setShowEmojis] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input.trim());
    setInput("");
  };

  return (
    <div className="bg-blue-950/90 border-t-2 border-blue-400/30 flex flex-col h-64">
      <div className="px-3 py-2 border-b border-blue-400/20">
        <h3 className="text-white text-sm font-bold" style={{textShadow: '1px 1px 1px rgba(0,0,0,0.5)'}}>💬 CHAT</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 && (
          <p className="text-blue-300/30 text-xs text-center">No messages yet</p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className="text-xs">
            <span className="text-yellow-400 font-bold">{msg.display_name}: </span>
            <span className="text-blue-100/80">{msg.message}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {showEmojis && (
        <div className="flex gap-1 px-3 py-2 border-t border-blue-400/20 flex-wrap">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => { onEmoji(emoji); setShowEmojis(false); }}
              className="text-xl hover:scale-125 transition-transform"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 p-2 border-t border-blue-400/20">
        <button
          onClick={() => setShowEmojis(!showEmojis)}
          className="text-blue-300/50 hover:text-yellow-400 transition-colors text-lg"
        >
          😊
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message..."
          className="flex-1 bg-blue-900/50 text-white text-sm rounded-lg px-3 py-1.5 outline-none focus:border-yellow-400/50 border border-blue-400/20"
          maxLength={200}
        />
        <button
          onClick={handleSend}
          className="text-yellow-400 hover:text-yellow-300 transition-colors font-bold"
        >
          ➤
        </button>
      </div>
    </div>
  );
}
