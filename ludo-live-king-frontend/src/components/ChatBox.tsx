import { useState, useRef, useEffect } from "react";
import { Send, Smile } from "lucide-react";

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
    <div className="bg-gray-800/60 rounded-xl border border-gray-700/50 flex flex-col h-64">
      <div className="px-3 py-2 border-b border-gray-700/50">
        <h3 className="text-white text-sm font-semibold">Chat</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 && (
          <p className="text-gray-500 text-xs text-center">No messages yet</p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className="text-xs">
            <span className="text-amber-400 font-semibold">{msg.display_name}: </span>
            <span className="text-gray-300">{msg.message}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {showEmojis && (
        <div className="flex gap-1 px-3 py-2 border-t border-gray-700/50 flex-wrap">
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

      <div className="flex items-center gap-2 p-2 border-t border-gray-700/50">
        <button
          onClick={() => setShowEmojis(!showEmojis)}
          className="text-gray-400 hover:text-amber-400 transition-colors"
        >
          <Smile size={18} />
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message..."
          className="flex-1 bg-gray-700/50 text-white text-sm rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-amber-500"
          maxLength={200}
        />
        <button
          onClick={handleSend}
          className="text-amber-400 hover:text-amber-300 transition-colors"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
