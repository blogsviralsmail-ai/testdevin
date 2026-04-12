import { useState, useEffect, useRef, useCallback } from "react";
import {
  Dumbbell, Home, User, Search, ChevronRight, ChevronLeft, Play, Pause,
  RotateCcw, Check, X, Heart, Timer, TrendingUp, Utensils, Award,
  Target, ArrowLeft, Plus, Minus, Star, Flame, Zap,
  Calendar, BarChart3, Weight, Activity, LogOut, Trophy
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Types
interface Profile {
  user_id: number; name: string; email: string; age: number; gender: string;
  height: number; weight: number; goal: string; fitness_level: string;
  equipment: string; workout_style: string; onboarding_done: number;
  weekly_goal: number;
}
interface Exercise {
  name: string; sets: number; reps: string; rest: number;
  muscles: string[]; primary: string; type: string; equip: string;
  video: string; instructions: string; difficulty: string; group?: string;
  is_favorite?: boolean;
}
interface WorkoutDay {
  day: string; title: string; is_rest: boolean; exercises: Exercise[];
  est_calories?: number; est_duration?: number;
}
interface Meal {
  time: string; name: string; items: string[];
  calories: number; protein: number; carbs: number; fat: number;
}
interface Stats {
  total_sessions: number; total_volume: number; total_calories: number;
  week_sessions: number; weekly_goal: number; streak: number;
  weekly_data: { week: string; workouts: number; calories: number }[];
  muscle_distribution: { muscle_group: string; cnt: number }[];
  recent_prs: { exercise_name: string; best_weight: number; best_reps: number; date_achieved: string }[];
  weight_history: { date: string; weight: number }[];
}

// API helpers
const api = {
  headers: () => {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    const t = localStorage.getItem("token");
    if (t) h["Authorization"] = `Bearer ${t}`;
    return h;
  },
  get: async (path: string) => {
    const r = await fetch(`${API}${path}`, { headers: api.headers() });
    if (r.status === 401) { localStorage.clear(); window.location.reload(); }
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  post: async (path: string, body?: unknown) => {
    const r = await fetch(`${API}${path}`, {
      method: "POST", headers: api.headers(), body: JSON.stringify(body),
    });
    if (r.status === 401) { localStorage.clear(); window.location.reload(); }
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  put: async (path: string, body?: unknown) => {
    const r = await fetch(`${API}${path}`, {
      method: "PUT", headers: api.headers(), body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
};

// Gradient Button
function GradBtn({
  children, onClick, className = "", disabled = false,
}: {
  children: React.ReactNode; onClick?: () => void; className?: string; disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`bg-gradient-to-r from-purple-600 to-blue-500 text-white font-semibold rounded-xl px-6 py-3 shadow-lg shadow-purple-500/25 active:scale-95 transition-all duration-200 disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

// Card
function Card({
  children, className = "", onClick,
}: {
  children: React.ReactNode; className?: string; onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 ${onClick ? "cursor-pointer active:scale-[0.98] transition-transform" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

// Rest Timer
function RestTimer({ seconds, onDone }: { seconds: number; onDone: () => void }) {
  const [left, setLeft] = useState(seconds);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    if (!running || left <= 0) {
      if (left <= 0) onDone();
      return;
    }
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
  }, [left, running, onDone]);

  const pct = ((seconds - left) / seconds) * 100;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-48 h-48 mx-auto mb-6">
          <svg className="w-48 h-48 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
            <circle
              cx="50" cy="50" r="45" fill="none" stroke="url(#timerGrad)" strokeWidth="6"
              strokeDasharray={`${pct * 2.83} 283`} strokeLinecap="round"
            />
            <defs>
              <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#9333ea" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl font-bold">{left}s</span>
          </div>
        </div>
        <p className="text-white/60 text-lg mb-6">Rest Timer</p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => setRunning((r) => !r)}
            className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center"
          >
            {running ? <Pause size={24} /> : <Play size={24} />}
          </button>
          <button
            onClick={() => setLeft(0)}
            className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center"
          >
            <ChevronRight size={24} />
          </button>
          <button
            onClick={() => setLeft(seconds)}
            className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center"
          >
            <RotateCcw size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ONBOARDING
// ============================================================
function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState("");
  const [level, setLevel] = useState("");
  const [equip, setEquip] = useState("");
  const [age, setAge] = useState("25");
  const [gender, setGender] = useState("male");
  const [height, setHeight] = useState("170");
  const [weight, setWeight] = useState("70");

  const goals = [
    { key: "fat_loss", icon: <Flame size={28} />, title: "Fat Loss", desc: "Burn fat & get lean" },
    { key: "muscle_gain", icon: <Dumbbell size={28} />, title: "Muscle Gain", desc: "Build muscle & strength" },
    { key: "general_fitness", icon: <Activity size={28} />, title: "General Fitness", desc: "Stay active & healthy" },
  ];
  const levels = [
    { key: "beginner", title: "Beginner", desc: "New to fitness (0-6 months)" },
    { key: "intermediate", title: "Intermediate", desc: "Regular training (6-24 months)" },
    { key: "advanced", title: "Advanced", desc: "Experienced (2+ years)" },
  ];
  const equips = [
    { key: "home", title: "Home / Bodyweight", desc: "No equipment needed" },
    { key: "basic_gym", title: "Basic Gym", desc: "Dumbbells + bench + pull-up bar" },
    { key: "full_gym", title: "Full Gym", desc: "All machines & equipment" },
  ];

  const finish = async () => {
    try {
      await api.put("/api/profile", {
        age: parseInt(age), gender, height: parseFloat(height), weight: parseFloat(weight),
        goal, fitness_level: level, equipment: equip, onboarding_done: 1,
      });
    } catch {
      // Profile save may fail on first try; proceed anyway
    }
    onDone();
  };

  const stepContent = [
    <div key="goal" className="animate-fadeIn">
      <h2 className="text-2xl font-bold mb-2">What is your goal?</h2>
      <p className="text-white/50 mb-6">We will customize your plan</p>
      <div className="space-y-3">
        {goals.map((g) => (
          <button
            key={g.key}
            onClick={() => { setGoal(g.key); setStep(1); }}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${goal === g.key ? "border-purple-500 bg-purple-500/20" : "border-white/10 bg-white/5"}`}
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center">{g.icon}</div>
            <div className="text-left">
              <p className="font-semibold">{g.title}</p>
              <p className="text-sm text-white/50">{g.desc}</p>
            </div>
            <ChevronRight className="ml-auto text-white/30" size={20} />
          </button>
        ))}
      </div>
    </div>,
    <div key="level" className="animate-fadeIn">
      <h2 className="text-2xl font-bold mb-2">Fitness Level</h2>
      <p className="text-white/50 mb-6">How experienced are you?</p>
      <div className="space-y-3">
        {levels.map((l) => (
          <button
            key={l.key}
            onClick={() => { setLevel(l.key); setStep(2); }}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${level === l.key ? "border-purple-500 bg-purple-500/20" : "border-white/10 bg-white/5"}`}
          >
            <div className="text-left flex-1">
              <p className="font-semibold">{l.title}</p>
              <p className="text-sm text-white/50">{l.desc}</p>
            </div>
            <ChevronRight className="text-white/30" size={20} />
          </button>
        ))}
      </div>
    </div>,
    <div key="equip" className="animate-fadeIn">
      <h2 className="text-2xl font-bold mb-2">Equipment Access</h2>
      <p className="text-white/50 mb-6">What do you have?</p>
      <div className="space-y-3">
        {equips.map((e) => (
          <button
            key={e.key}
            onClick={() => { setEquip(e.key); setStep(3); }}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${equip === e.key ? "border-purple-500 bg-purple-500/20" : "border-white/10 bg-white/5"}`}
          >
            <div className="text-left flex-1">
              <p className="font-semibold">{e.title}</p>
              <p className="text-sm text-white/50">{e.desc}</p>
            </div>
            <ChevronRight className="text-white/30" size={20} />
          </button>
        ))}
      </div>
    </div>,
    <div key="stats" className="animate-fadeIn">
      <h2 className="text-2xl font-bold mb-2">Your Body Stats</h2>
      <p className="text-white/50 mb-6">For personalized plans</p>
      <div className="space-y-4">
        <div className="flex gap-3">
          {(["male", "female"] as const).map((g) => (
            <button
              key={g}
              onClick={() => setGender(g)}
              className={`flex-1 py-3 rounded-xl border font-medium transition-all ${gender === g ? "border-purple-500 bg-purple-500/20" : "border-white/10 bg-white/5"}`}
            >
              {g === "male" ? "Male" : "Female"}
            </button>
          ))}
        </div>
        {[
          { label: "Age", val: age, set: setAge, unit: "years", min: 12, max: 80 },
          { label: "Height", val: height, set: setHeight, unit: "cm", min: 120, max: 220 },
          { label: "Weight", val: weight, set: setWeight, unit: "kg", min: 30, max: 200 },
        ].map((f) => (
          <div key={f.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex justify-between mb-2">
              <span className="text-white/60">{f.label}</span>
              <span className="font-semibold">{f.val} {f.unit}</span>
            </div>
            <input
              type="range" min={f.min} max={f.max} value={f.val}
              onChange={(e) => f.set(e.target.value)}
              className="w-full h-2 rounded-full appearance-none bg-white/10 accent-purple-500"
            />
          </div>
        ))}
        <GradBtn onClick={finish} className="w-full mt-4 py-4 text-lg">
          <span className="flex items-center justify-center gap-2">
            <Zap size={20} /> Start Your Journey
          </span>
        </GradBtn>
      </div>
    </div>,
  ];

  return (
    <div className="min-h-screen bg-[#0a0a1a] p-6 flex flex-col">
      <div className="flex items-center gap-3 mb-8">
        {step > 0 && (
          <button onClick={() => setStep((s) => s - 1)} className="p-2">
            <ArrowLeft size={20} />
          </button>
        )}
        <div className="flex-1 flex gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all ${i <= step ? "bg-gradient-to-r from-purple-500 to-blue-500" : "bg-white/10"}`}
            />
          ))}
        </div>
        <span className="text-sm text-white/40">{step + 1}/4</span>
      </div>
      <div className="flex items-center gap-2 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center">
          <Dumbbell size={22} />
        </div>
        <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
          Fitonist
        </span>
      </div>
      {stepContent[step]}
    </div>
  );
}

// ============================================================
// ACTIVE WORKOUT SCREEN
// ============================================================
function ActiveWorkout({ day, onFinish }: { day: WorkoutDay; onFinish: () => void }) {
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [exIdx, setExIdx] = useState(0);
  const [setsDone, setSetsDone] = useState<Record<string, boolean[]>>({});
  const [weights, setWeights] = useState<Record<string, number>>({});
  const [repsInput, setRepsInput] = useState<Record<string, number>>({});
  const [showTimer, setShowTimer] = useState(false);
  const [timerSecs, setTimerSecs] = useState(60);
  const [elapsed, setElapsed] = useState(0);
  const startTime = useRef(Date.now());

  useEffect(() => {
    const t = setInterval(
      () => setElapsed(Math.floor((Date.now() - startTime.current) / 1000)),
      1000,
    );
    api.post("/api/sessions/start", { day_title: day.title })
      .then((r) => setSessionId(r.session_id))
      .catch(() => { /* ignore */ });
    return () => clearInterval(t);
  }, [day.title]);

  const ex = day.exercises[exIdx];
  if (!ex) return null;

  const key = `${exIdx}-${ex.name}`;
  const done = setsDone[key] || Array(ex.sets).fill(false);
  const w = weights[key] ?? 0;
  const defaultReps = parseInt(ex.reps) || 10;
  const reps = repsInput[key] ?? defaultReps;

  const completeSet = async (setNum: number) => {
    const newDone = [...done];
    newDone[setNum] = true;
    setSetsDone((prev) => ({ ...prev, [key]: newDone }));
    if (sessionId) {
      try {
        await api.post("/api/sessions/log-set", {
          session_id: sessionId, exercise_name: ex.name,
          muscle_group: ex.primary || ex.group || "", set_number: setNum + 1,
          reps, weight_kg: w,
        });
      } catch {
        // ignore
      }
    }
    setTimerSecs(ex.rest);
    setShowTimer(true);
  };

  const finishWorkout = async () => {
    if (sessionId) {
      try {
        await api.post("/api/sessions/finish", {
          session_id: sessionId,
          duration_min: Math.floor(elapsed / 60),
          calories_burned: Math.floor((elapsed / 60) * 8),
        });
      } catch {
        // ignore
      }
    }
    onFinish();
  };

  const fmt = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="min-h-screen bg-[#0a0a1a]">
      {showTimer && <RestTimer seconds={timerSecs} onDone={() => setShowTimer(false)} />}
      <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 p-4 flex items-center gap-3">
        <button onClick={onFinish} className="p-1"><X size={22} /></button>
        <div className="flex-1">
          <p className="font-semibold text-sm">{day.title}</p>
          <p className="text-xs text-white/50">{exIdx + 1}/{day.exercises.length} exercises</p>
        </div>
        <div className="flex items-center gap-1 text-purple-300">
          <Timer size={16} />
          <span className="text-sm font-mono">{fmt(elapsed)}</span>
        </div>
      </div>
      <div className="flex overflow-x-auto gap-2 p-3 pb-0 scrollbar-hide">
        {day.exercises.map((e, i) => {
          const k = `${i}-${e.name}`;
          const eDone = (setsDone[k] || []).length === day.exercises[i].sets && (setsDone[k] || []).every(Boolean);
          return (
            <button
              key={i}
              onClick={() => setExIdx(i)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                i === exIdx
                  ? "bg-purple-500 text-white"
                  : eDone
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "bg-white/5 text-white/50"
              }`}
            >
              {eDone && <Check size={12} className="inline mr-1" />}{i + 1}
            </button>
          );
        })}
      </div>
      <div className="p-4">
        <div className="mb-4">
          <h2 className="text-xl font-bold">{ex.name}</h2>
          <p className="text-white/50 text-sm">{ex.muscles?.join(", ") || ex.primary}</p>
          <p className="text-white/40 text-xs mt-1">{ex.instructions}</p>
        </div>
        {ex.video && (
          <div className="aspect-video rounded-xl overflow-hidden mb-4 bg-white/5">
            <iframe
              src={`https://www.youtube.com/embed/${ex.video}`}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
              allowFullScreen
            />
          </div>
        )}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
            <p className="text-xs text-white/50 mb-2">Weight (kg)</p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setWeights((p) => ({ ...p, [key]: Math.max(0, w - 2.5) }))}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
              ><Minus size={14} /></button>
              <span className="text-2xl font-bold w-16 text-center">{w}</span>
              <button
                onClick={() => setWeights((p) => ({ ...p, [key]: w + 2.5 }))}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
              ><Plus size={14} /></button>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
            <p className="text-xs text-white/50 mb-2">Reps</p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setRepsInput((p) => ({ ...p, [key]: Math.max(1, reps - 1) }))}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
              ><Minus size={14} /></button>
              <span className="text-2xl font-bold w-16 text-center">{reps}</span>
              <button
                onClick={() => setRepsInput((p) => ({ ...p, [key]: reps + 1 }))}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
              ><Plus size={14} /></button>
            </div>
          </div>
        </div>
        <div className="space-y-2 mb-4">
          {Array.from({ length: ex.sets }, (_, i) => (
            <button
              key={i}
              onClick={() => !done[i] && completeSet(i)}
              className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                done[i] ? "border-green-500/30 bg-green-500/10" : "border-white/10 bg-white/5"
              }`}
            >
              <span className="font-medium">Set {i + 1}</span>
              <div className="flex items-center gap-3 text-sm text-white/60">
                <span>{w > 0 ? `${w} kg` : "BW"}</span>
                <span>x</span>
                <span>{reps} reps</span>
                {done[i] ? (
                  <Check size={18} className="text-green-400" />
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-purple-500" />
                )}
              </div>
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          {exIdx > 0 && (
            <button
              onClick={() => setExIdx((i) => i - 1)}
              className="flex-1 py-3 rounded-xl border border-white/10 bg-white/5 font-medium"
            >
              <ChevronLeft size={16} className="inline" /> Previous
            </button>
          )}
          {exIdx < day.exercises.length - 1 ? (
            <GradBtn onClick={() => setExIdx((i) => i + 1)} className="flex-1">
              Next Exercise <ChevronRight size={16} className="inline" />
            </GradBtn>
          ) : (
            <GradBtn onClick={finishWorkout} className="flex-1">
              <Trophy size={16} className="inline mr-1" /> Finish Workout
            </GradBtn>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [screen, setScreen] = useState<"auth" | "onboarding" | "main">("auth");
  const [tab, setTab] = useState<"home" | "exercises" | "diet" | "progress" | "profile">("home");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [workoutPlan, setWorkoutPlan] = useState<{
    split_name: string; macros: Record<string, number>; days: WorkoutDay[];
  } | null>(null);
  const [dietPlan, setDietPlan] = useState<{
    daily_targets: Record<string, number>; meals: Meal[];
    supplements: { name: string; timing: string }[];
  } | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeWorkout, setActiveWorkout] = useState<WorkoutDay | null>(null);
  const [selectedDay, setSelectedDay] = useState(
    new Date().toLocaleDateString("en-US", { weekday: "long" }),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [muscleFilter, setMuscleFilter] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [authError, setAuthError] = useState("");

  const loadData = useCallback(async () => {
    try {
      const p = await api.get("/api/profile");
      setProfile(p);
      if (!p.onboarding_done) {
        setScreen("onboarding");
        return;
      }
      setScreen("main");
      const [wp, dp, st] = await Promise.all([
        api.get("/api/workout-plan"),
        api.get("/api/diet-plan"),
        api.get("/api/stats"),
      ]);
      setWorkoutPlan(wp);
      setDietPlan(dp);
      setStats(st);
    } catch {
      setScreen("auth");
      localStorage.clear();
      setToken("");
    }
  }, []);

  useEffect(() => {
    if (token) loadData();
    else setScreen("auth");
  }, [token, loadData]);

  const handleAuth = async () => {
    setAuthError("");
    setLoading(true);
    try {
      const endpoint = authMode === "register" ? "/api/register" : "/api/login";
      const body = authMode === "register" ? { email, password, name } : { email, password };
      const r = await api.post(endpoint, body);
      localStorage.setItem("token", r.token);
      setToken(r.token);
    } catch (e: unknown) {
      setAuthError(e instanceof Error ? e.message : "Authentication failed");
    }
    setLoading(false);
  };

  const logout = () => {
    localStorage.clear();
    setToken("");
    setScreen("auth");
    setProfile(null);
  };

  const loadExercises = useCallback(async (muscle?: string, search?: string) => {
    try {
      const params = new URLSearchParams();
      if (muscle) params.set("muscle", muscle);
      if (search) params.set("search", search);
      const r = await api.get(`/api/exercises?${params}`);
      setExercises(r.exercises);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (tab === "exercises") loadExercises(muscleFilter, searchQuery);
  }, [tab, muscleFilter, searchQuery, loadExercises]);

  // AUTH SCREEN
  if (screen === "auth") {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Dumbbell size={30} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-center mb-1 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Fitonist
          </h1>
          <p className="text-center text-white/40 mb-8">AI-Powered Workout Planner</p>
          <div className="flex gap-2 mb-6 bg-white/5 rounded-xl p-1">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setAuthMode(m); setAuthError(""); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  authMode === m
                    ? "bg-gradient-to-r from-purple-600 to-blue-500 text-white"
                    : "text-white/50"
                }`}
              >
                {m === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>
          {authMode === "register" && (
            <input
              type="text" placeholder="Full Name" value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-3 placeholder-white/30 focus:border-purple-500 focus:outline-none"
            />
          )}
          <input
            type="email" placeholder="Email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-3 placeholder-white/30 focus:border-purple-500 focus:outline-none"
          />
          <input
            type="password" placeholder="Password" value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAuth()}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-4 placeholder-white/30 focus:border-purple-500 focus:outline-none"
          />
          {authError && <p className="text-red-400 text-sm mb-3 text-center">{authError}</p>}
          <GradBtn onClick={handleAuth} className="w-full py-3.5" disabled={loading}>
            {loading ? "Please wait..." : authMode === "login" ? "Sign In" : "Create Account"}
          </GradBtn>
        </div>
      </div>
    );
  }

  // ONBOARDING
  if (screen === "onboarding") {
    return <Onboarding onDone={loadData} />;
  }

  // ACTIVE WORKOUT
  if (activeWorkout) {
    return (
      <ActiveWorkout
        day={activeWorkout}
        onFinish={() => { setActiveWorkout(null); loadData(); }}
      />
    );
  }

  // MAIN APP
  const todayPlan = workoutPlan?.days.find((d) => d.day === selectedDay);
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const muscleGroups = ["", "chest", "back", "legs", "shoulders", "arms", "core"];

  return (
    <div className="min-h-screen bg-[#0a0a1a] pb-24">
      {/* HOME TAB */}
      {tab === "home" && (
        <div>
          <div className="bg-gradient-to-b from-purple-900/40 to-transparent p-4 pb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-white/50 text-sm">Welcome back</p>
                <h1 className="text-xl font-bold">{profile?.name || "User"}</h1>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-white/10 rounded-full px-3 py-1 flex items-center gap-1">
                  <Flame size={14} className="text-orange-400" />
                  <span className="text-sm font-medium">{stats?.streak || 0}</span>
                </div>
              </div>
            </div>
            <Card className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-white/60">This Week</p>
                <p className="text-sm font-medium text-purple-400">
                  {stats?.week_sessions || 0}/{stats?.weekly_goal || 4} workouts
                </p>
              </div>
              <div className="flex gap-1.5">
                {days.map((d, i) => {
                  const isToday = d === new Date().toLocaleDateString("en-US", { weekday: "long" });
                  const isDone = (stats?.week_sessions || 0) > i;
                  return (
                    <div key={d} className="flex-1 flex flex-col items-center gap-1">
                      <div className={`w-full h-2 rounded-full ${isDone ? "bg-gradient-to-r from-purple-500 to-blue-500" : "bg-white/10"}`} />
                      <span className={`text-[10px] ${isToday ? "text-purple-400 font-bold" : "text-white/30"}`}>
                        {d.slice(0, 2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Total", value: stats?.total_sessions || 0, icon: <Activity size={16} className="text-purple-400" />, unit: "workouts" },
                { label: "Volume", value: stats?.total_volume ? `${(stats.total_volume / 1000).toFixed(1)}k` : "0", icon: <Weight size={16} className="text-blue-400" />, unit: "kg" },
                { label: "Calories", value: stats?.total_calories ? `${(stats.total_calories / 1000).toFixed(1)}k` : "0", icon: <Flame size={16} className="text-orange-400" />, unit: "kcal" },
              ].map((s) => (
                <Card key={s.label} className="text-center py-3">
                  <div className="flex justify-center mb-1">{s.icon}</div>
                  <p className="text-lg font-bold">{s.value}</p>
                  <p className="text-[10px] text-white/40">{s.unit}</p>
                </Card>
              ))}
            </div>
          </div>
          <div className="px-4 mb-4">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {days.map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDay(d)}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    selectedDay === d
                      ? "bg-gradient-to-r from-purple-600 to-blue-500 text-white"
                      : "bg-white/5 text-white/50"
                  }`}
                >
                  {d.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>
          <div className="px-4">
            {todayPlan ? (
              todayPlan.is_rest ? (
                <Card className="text-center py-8">
                  <div className="text-4xl mb-3">&#x1F9D8;</div>
                  <h3 className="text-lg font-bold mb-1">{todayPlan.title}</h3>
                  <p className="text-white/50 text-sm">Take it easy. Stretch, foam roll, or go for a light walk.</p>
                </Card>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h2 className="text-lg font-bold">{todayPlan.title}</h2>
                      <p className="text-white/50 text-sm">
                        {todayPlan.exercises.length} exercises - ~{todayPlan.est_duration || 45} min
                      </p>
                    </div>
                    {todayPlan.est_calories && (
                      <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg px-2 py-1">
                        <span className="text-orange-400 text-sm font-medium">
                          {todayPlan.est_calories} cal
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setActiveWorkout(todayPlan)}
                    className="w-full py-5 rounded-2xl bg-gradient-to-r from-purple-600 via-purple-500 to-blue-500 shadow-lg shadow-purple-500/30 mb-4 relative overflow-hidden group active:scale-[0.98] transition-transform"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-400/0 via-white/20 to-purple-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                        <Play size={22} fill="white" />
                      </div>
                      <span className="text-xl font-bold">Start Workout</span>
                    </div>
                  </button>
                  <div className="space-y-2">
                    {todayPlan.exercises.map((ex, i) => (
                      <Card key={i} className="flex items-center gap-3 py-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600/30 to-blue-600/30 flex items-center justify-center text-sm font-bold text-purple-400">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{ex.name}</p>
                          <p className="text-xs text-white/40">
                            {ex.sets} sets - {ex.reps} reps - {ex.rest}s rest
                          </p>
                        </div>
                        <span className="text-[10px] text-white/30 bg-white/5 rounded px-2 py-0.5">
                          {ex.primary}
                        </span>
                      </Card>
                    ))}
                  </div>
                </>
              )
            ) : (
              <Card className="text-center py-8">
                <p className="text-white/50">Loading workout plan...</p>
              </Card>
            )}
          </div>
          {workoutPlan && (
            <div className="px-4 mt-4">
              <Card>
                <div className="flex items-center gap-2 mb-1">
                  <Calendar size={14} className="text-purple-400" />
                  <span className="text-sm font-medium">Your Split</span>
                </div>
                <p className="text-white/50 text-sm">{workoutPlan.split_name}</p>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* EXERCISES TAB */}
      {tab === "exercises" && (
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-4">Exercise Library</h1>
          <div className="relative mb-4">
            <Search size={18} className="absolute left-3 top-3.5 text-white/30" />
            <input
              type="text" placeholder="Search exercises..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 placeholder-white/30 focus:border-purple-500 focus:outline-none"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
            {muscleGroups.map((m) => (
              <button
                key={m || "all"}
                onClick={() => setMuscleFilter(m)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  muscleFilter === m
                    ? "bg-gradient-to-r from-purple-600 to-blue-500 text-white"
                    : "bg-white/5 text-white/50"
                }`}
              >
                {m ? m.charAt(0).toUpperCase() + m.slice(1) : "All"}
              </button>
            ))}
          </div>
          <p className="text-white/40 text-sm mb-3">{exercises.length} exercises found</p>
          <div className="space-y-2">
            {exercises.map((ex, i) => (
              <Card key={i} className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600/20 to-blue-600/20 flex items-center justify-center flex-shrink-0">
                  <Dumbbell size={20} className="text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{ex.name}</p>
                  <p className="text-xs text-white/40">{ex.muscles?.join(", ") || ex.primary}</p>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[10px] bg-purple-500/20 text-purple-300 rounded px-1.5 py-0.5">{ex.type}</span>
                    <span className="text-[10px] bg-blue-500/20 text-blue-300 rounded px-1.5 py-0.5">{ex.equip}</span>
                    <span className="text-[10px] bg-white/10 text-white/40 rounded px-1.5 py-0.5">{ex.difficulty}</span>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    try {
                      await api.post("/api/favorites/toggle", { exercise_name: ex.name });
                      loadExercises(muscleFilter, searchQuery);
                    } catch { /* ignore */ }
                  }}
                  className="p-2"
                >
                  <Heart size={18} className={ex.is_favorite ? "text-red-400 fill-red-400" : "text-white/20"} />
                </button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* DIET TAB */}
      {tab === "diet" && dietPlan && (
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-1">Diet Plan</h1>
          <p className="text-white/50 text-sm mb-4">Personalized for your goals</p>
          <Card className="mb-4">
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                { label: "Calories", val: dietPlan.daily_targets.calories, color: "text-orange-400", unit: "kcal" },
                { label: "Protein", val: dietPlan.daily_targets.protein, color: "text-red-400", unit: "g" },
                { label: "Carbs", val: dietPlan.daily_targets.carbs, color: "text-yellow-400", unit: "g" },
                { label: "Fat", val: dietPlan.daily_targets.fat, color: "text-blue-400", unit: "g" },
              ].map((mc) => (
                <div key={mc.label}>
                  <p className={`text-lg font-bold ${mc.color}`}>{mc.val}</p>
                  <p className="text-[10px] text-white/40">{mc.unit}</p>
                  <p className="text-xs text-white/50">{mc.label}</p>
                </div>
              ))}
            </div>
          </Card>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Utensils size={16} className="text-purple-400" /> Daily Meals
          </h3>
          <div className="space-y-3 mb-6">
            {dietPlan.meals.map((meal, i) => (
              <Card key={i}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold text-sm">{meal.name}</p>
                    <p className="text-xs text-white/40">{meal.time}</p>
                  </div>
                  <span className="text-sm font-medium text-orange-400">{meal.calories} cal</span>
                </div>
                <div className="flex gap-3 text-[10px] text-white/40 mb-2">
                  <span>P: {meal.protein}g</span>
                  <span>C: {meal.carbs}g</span>
                  <span>F: {meal.fat}g</span>
                </div>
                <div className="space-y-1">
                  {meal.items.map((item, j) => (
                    <p key={j} className="text-xs text-white/60 flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-purple-400 flex-shrink-0" />
                      {item}
                    </p>
                  ))}
                </div>
              </Card>
            ))}
          </div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Star size={16} className="text-yellow-400" /> Supplements
          </h3>
          <div className="space-y-2">
            {dietPlan.supplements.map((s, i) => (
              <Card key={i} className="flex items-center gap-3 py-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center text-sm">
                  &#x1F48A;
                </div>
                <div>
                  <p className="text-sm font-medium">{s.name}</p>
                  <p className="text-xs text-white/40">{s.timing}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* PROGRESS TAB */}
      {tab === "progress" && stats && (
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-4">Progress</h1>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { label: "Total Workouts", val: stats.total_sessions, icon: <Activity size={18} className="text-purple-400" /> },
              { label: "Current Streak", val: `${stats.streak} days`, icon: <Flame size={18} className="text-orange-400" /> },
              { label: "Total Volume", val: `${(stats.total_volume / 1000).toFixed(1)}k kg`, icon: <Weight size={18} className="text-blue-400" /> },
              { label: "Calories Burned", val: `${(stats.total_calories / 1000).toFixed(1)}k`, icon: <Flame size={18} className="text-red-400" /> },
            ].map((s) => (
              <Card key={s.label}>
                <div className="flex items-center gap-2 mb-2">
                  {s.icon}
                  <span className="text-xs text-white/50">{s.label}</span>
                </div>
                <p className="text-xl font-bold">{s.val}</p>
              </Card>
            ))}
          </div>
          <Card className="mb-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <BarChart3 size={16} className="text-purple-400" /> Weekly Activity
            </h3>
            <div className="flex items-end gap-2 h-24">
              {stats.weekly_data.map((w, i) => {
                const maxW = Math.max(...stats.weekly_data.map((wd) => wd.workouts), 1);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-gradient-to-t from-purple-600 to-blue-500 rounded-t-sm transition-all"
                      style={{ height: `${Math.max(4, (w.workouts / maxW) * 80)}px` }}
                    />
                    <span className="text-[9px] text-white/30 mt-1">{w.week}</span>
                  </div>
                );
              })}
            </div>
          </Card>
          {stats.muscle_distribution.length > 0 && (
            <Card className="mb-4">
              <h3 className="font-semibold mb-3">Muscle Distribution</h3>
              <div className="space-y-2">
                {stats.muscle_distribution.slice(0, 6).map((m) => {
                  const maxCnt = stats.muscle_distribution[0]?.cnt || 1;
                  return (
                    <div key={m.muscle_group} className="flex items-center gap-3">
                      <span className="text-xs text-white/50 w-20 truncate">{m.muscle_group}</span>
                      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                          style={{ width: `${(m.cnt / maxCnt) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-white/40 w-8 text-right">{m.cnt}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
          {stats.recent_prs.length > 0 && (
            <Card>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Award size={16} className="text-yellow-400" /> Recent PRs
              </h3>
              <div className="space-y-2">
                {stats.recent_prs.map((pr, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{pr.exercise_name}</p>
                      <p className="text-xs text-white/40">{pr.date_achieved}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-yellow-400">{pr.best_weight} kg</p>
                      <p className="text-xs text-white/40">x {pr.best_reps}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* PROFILE TAB */}
      {tab === "profile" && profile && (
        <div className="p-4">
          <div className="text-center mb-6 pt-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center text-3xl font-bold mb-3">
              {profile.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <h2 className="text-xl font-bold">{profile.name}</h2>
            <p className="text-white/40 text-sm">{profile.email}</p>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-6">
            {[
              { label: "Height", val: `${profile.height} cm` },
              { label: "Weight", val: `${profile.weight} kg` },
              { label: "Age", val: `${profile.age} yrs` },
            ].map((s) => (
              <Card key={s.label} className="text-center py-3">
                <p className="text-lg font-bold">{s.val}</p>
                <p className="text-[10px] text-white/40">{s.label}</p>
              </Card>
            ))}
          </div>
          <div className="space-y-3">
            {[
              {
                label: "Goal",
                val: profile.goal?.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) || "Not set",
                icon: <Target size={18} className="text-purple-400" />,
              },
              {
                label: "Fitness Level",
                val: profile.fitness_level?.replace(/\b\w/g, (c: string) => c.toUpperCase()) || "Not set",
                icon: <TrendingUp size={18} className="text-blue-400" />,
              },
              {
                label: "Equipment",
                val: profile.equipment?.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) || "Not set",
                icon: <Dumbbell size={18} className="text-green-400" />,
              },
              {
                label: "Weekly Goal",
                val: `${profile.weekly_goal || 4} workouts/week`,
                icon: <Calendar size={18} className="text-orange-400" />,
              },
            ].map((item) => (
              <Card key={item.label} className="flex items-center gap-3">
                {item.icon}
                <div className="flex-1">
                  <p className="text-xs text-white/50">{item.label}</p>
                  <p className="font-medium text-sm">{item.val}</p>
                </div>
              </Card>
            ))}
          </div>
          {workoutPlan?.macros && (
            <Card className="mt-4">
              <h3 className="font-semibold mb-3 text-sm">Your Daily Macros</h3>
              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  { label: "Calories", val: workoutPlan.macros.calories, color: "text-orange-400" },
                  { label: "Protein", val: `${workoutPlan.macros.protein}g`, color: "text-red-400" },
                  { label: "Carbs", val: `${workoutPlan.macros.carbs}g`, color: "text-yellow-400" },
                  { label: "Fat", val: `${workoutPlan.macros.fat}g`, color: "text-blue-400" },
                ].map((mc) => (
                  <div key={mc.label}>
                    <p className={`font-bold ${mc.color}`}>{mc.val}</p>
                    <p className="text-[10px] text-white/40">{mc.label}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
          <button
            onClick={logout}
            className="w-full mt-6 py-3 rounded-xl border border-red-500/30 text-red-400 font-medium flex items-center justify-center gap-2"
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      )}

      {/* BOTTOM NAVIGATION */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a1a]/95 backdrop-blur-lg border-t border-white/10 px-2 py-2 z-40">
        <div className="flex justify-around max-w-lg mx-auto">
          {([
            { key: "home" as const, icon: <Home size={22} />, label: "Home" },
            { key: "exercises" as const, icon: <Search size={22} />, label: "Exercises" },
            { key: "diet" as const, icon: <Utensils size={22} />, label: "Diet" },
            { key: "progress" as const, icon: <BarChart3 size={22} />, label: "Progress" },
            { key: "profile" as const, icon: <User size={22} />, label: "Profile" },
          ]).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${
                tab === t.key ? "text-purple-400" : "text-white/30"
              }`}
            >
              {t.icon}
              <span className="text-[10px] font-medium">{t.label}</span>
              {tab === t.key && <div className="w-4 h-0.5 rounded-full bg-purple-400 mt-0.5" />}
            </button>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
