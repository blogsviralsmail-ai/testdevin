import { FunnelAnswers } from "@/types";

const STORAGE_KEY = "sparkvibe_funnel";

export function getFunnelAnswers(): FunnelAnswers {
  if (typeof window === "undefined") {
    return { ageVerified: false, gender: "", connectionType: "", quizAnswers: {} };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as FunnelAnswers;
  } catch {
    /* ignore */
  }
  return { ageVerified: false, gender: "", connectionType: "", quizAnswers: {} };
}

export function saveFunnelAnswers(answers: Partial<FunnelAnswers>) {
  if (typeof window === "undefined") return;
  const current = getFunnelAnswers();
  const updated = { ...current, ...answers };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function saveQuizAnswer(questionId: string, answerId: string) {
  const current = getFunnelAnswers();
  current.quizAnswers[questionId] = answerId;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
}

export function resetFunnel() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
