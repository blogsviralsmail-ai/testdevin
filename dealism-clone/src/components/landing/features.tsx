import { Users, Sparkles, Globe, MessageCircle, Target, TrendingUp } from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Human in the Loop",
    desc: "It runs on its own, but knows when to ask for help. You are always in the loop.",
    gradient: "from-rose-50 to-orange-50",
  },
  {
    icon: Sparkles,
    title: "Gets better over time",
    desc: "It learns from every conversation, adapts to your business, and keeps improving how it sells.",
    gradient: "from-amber-50 to-yellow-50",
  },
  {
    icon: Globe,
    title: "No culture gap",
    desc: "It understands language and culture, so you can explore new markets without friction.",
    gradient: "from-rose-50 to-pink-50",
  },
  {
    icon: MessageCircle,
    title: "Built for real conversations",
    desc: "It understands user intent and knows how to talk things through, so problems get solved and deals keep moving.",
    gradient: "from-violet-50 to-indigo-50",
  },
  {
    icon: Target,
    title: "No missed opportunities",
    desc: "Every message gets handled, every lead gets followed up, and no potential deal slips through.",
    gradient: "from-orange-50 to-red-50",
  },
  {
    icon: TrendingUp,
    title: "Sells like a pro",
    desc: "It understands intent, handles objections, and guides each conversation like an experienced sales rep.",
    gradient: "from-emerald-50 to-teal-50",
  },
];

export function LandingFeatures() {
  return (
    <section id="features" className="py-20 bg-neutral-50">
      <div className="container-1200">
        <h2 className="text-center text-4xl md:text-5xl font-bold">Built To Sell And Grow With You</h2>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="hover-lift rounded-2xl border border-neutral-200 bg-white overflow-hidden"
            >
              <div className={`h-40 bg-gradient-to-br ${f.gradient} flex items-center justify-center`}>
                <f.icon className="h-12 w-12 text-orange-500" />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-neutral-600">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
