import { QuizQuestion } from "@/types";

export const quizQuestions: QuizQuestion[] = [
  {
    id: "q1",
    title: "What attracts you most in a person?",
    subtitle: "Pick the quality that makes your heart skip a beat",
    options: [
      { id: "q1a", label: "Beautiful Smile", emoji: "😊", description: "A warm, genuine smile that lights up the room" },
      { id: "q1b", label: "Sense of Humor", emoji: "😂", description: "Someone who makes you laugh till it hurts" },
      { id: "q1c", label: "Deep Eyes", emoji: "👀", description: "Eyes that tell a thousand stories" },
      { id: "q1d", label: "Confident Voice", emoji: "🎤", description: "A voice that gives you butterflies" },
    ],
  },
  {
    id: "q2",
    title: "What's your preferred way to connect?",
    subtitle: "How do you love getting to know someone?",
    options: [
      { id: "q2a", label: "Face-to-Face Video", emoji: "📹", description: "Nothing beats seeing their real smile" },
      { id: "q2b", label: "Flirty Texting", emoji: "💬", description: "Building tension one message at a time" },
      { id: "q2c", label: "Voice Calls", emoji: "📞", description: "Hearing their voice late at night" },
      { id: "q2d", label: "All of the Above", emoji: "💫", description: "Why choose when you can have it all?" },
    ],
  },
  {
    id: "q3",
    title: "What makes a video call special?",
    subtitle: "The magic of seeing someone in real time...",
    options: [
      { id: "q3a", label: "Real Reactions", emoji: "🥰", description: "Seeing their genuine blush & smile" },
      { id: "q3b", label: "Eye Contact", emoji: "✨", description: "That electric moment of connection" },
      { id: "q3c", label: "Spontaneous Fun", emoji: "🎉", description: "Unscripted, unfiltered moments together" },
      { id: "q3d", label: "Intimate Vibes", emoji: "🕯️", description: "Creating a cozy, personal atmosphere" },
    ],
  },
  {
    id: "q4",
    title: "When do you want to start chatting?",
    subtitle: "The best time to find your match is...",
    options: [
      { id: "q4a", label: "Right Now!", emoji: "⚡", description: "I can't wait another second" },
      { id: "q4b", label: "Tonight", emoji: "🌙", description: "Perfect evening plans incoming" },
      { id: "q4c", label: "This Weekend", emoji: "🎊", description: "Save the best for the weekend" },
      { id: "q4d", label: "Whenever the Vibe Hits", emoji: "🌊", description: "Going with the flow" },
    ],
  },
  {
    id: "q5",
    title: "What's your preferred vibe?",
    subtitle: "Set the mood for your perfect connection",
    options: [
      { id: "q5a", label: "Playful & Flirty", emoji: "😏", description: "Keep it fun, keep it exciting" },
      { id: "q5b", label: "Sweet & Romantic", emoji: "🌹", description: "Old-school romance, new-age connection" },
      { id: "q5c", label: "Chill & Easygoing", emoji: "☕", description: "No pressure, just good vibes" },
      { id: "q5d", label: "Bold & Adventurous", emoji: "🔥", description: "Life is short, make it thrilling" },
    ],
  },
];
