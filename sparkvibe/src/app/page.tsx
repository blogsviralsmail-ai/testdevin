"use client";

import { useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import ProgressBar from "@/components/shared/ProgressBar";
import OnlineCounter from "@/components/shared/OnlineCounter";
import PageTransition from "@/components/shared/PageTransition";
import AgeGate from "@/components/funnel/AgeGate";
import GenderSelect from "@/components/funnel/GenderSelect";
import ConnectionType from "@/components/funnel/ConnectionType";
import QuizPage from "@/components/funnel/QuizPage";
import MatchesPage from "@/components/funnel/MatchesPage";
import FinalProfile from "@/components/funnel/FinalProfile";
import { quizQuestions } from "@/data/quiz";
import { saveFunnelAnswers, saveQuizAnswer } from "@/lib/funnel-store";

const TOTAL_STEPS = 10;

export default function Home() {
  const [step, setStep] = useState(1);
  const [selectedProfile, setSelectedProfile] = useState("p1");

  const goNext = useCallback(() => {
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleAgeGate = useCallback(() => {
    saveFunnelAnswers({ ageVerified: true });
    goNext();
  }, [goNext]);

  const handleGender = useCallback(
    (gender: string) => {
      saveFunnelAnswers({ gender });
      goNext();
    },
    [goNext],
  );

  const handleConnection = useCallback(
    (type: string) => {
      saveFunnelAnswers({ connectionType: type });
      goNext();
    },
    [goNext],
  );

  const handleQuiz = useCallback(
    (questionId: string, answerId: string) => {
      saveQuizAnswer(questionId, answerId);
      goNext();
    },
    [goNext],
  );

  const handleProfileSelect = useCallback(
    (profileId: string) => {
      setSelectedProfile(profileId);
      goNext();
    },
    [goNext],
  );

  const handleUnlockAll = useCallback(() => {
    goNext();
  }, [goNext]);

  const renderStep = () => {
    switch (step) {
      case 1:
        return <AgeGate onSelect={handleAgeGate} />;
      case 2:
        return <GenderSelect onSelect={handleGender} />;
      case 3:
        return <ConnectionType onSelect={handleConnection} />;
      case 4:
      case 5:
      case 6:
      case 7:
      case 8:
        return (
          <QuizPage
            key={`quiz-${step}`}
            question={quizQuestions[step - 4]}
            onSelect={handleQuiz}
            questionNumber={step - 3}
          />
        );
      case 9:
        return (
          <MatchesPage
            onSelect={handleProfileSelect}
            onUnlockAll={handleUnlockAll}
          />
        );
      case 10:
        return <FinalProfile profileId={selectedProfile} />;
      default:
        return null;
    }
  };

  return (
    <main className="relative">
      {step > 1 && <ProgressBar current={step} total={TOTAL_STEPS} />}

      <AnimatePresence mode="wait">
        <PageTransition key={step}>{renderStep()}</PageTransition>
      </AnimatePresence>

      {step > 1 && step < 10 && (
        <div className="fixed bottom-4 right-4 z-30">
          <OnlineCounter />
        </div>
      )}
    </main>
  );
}
