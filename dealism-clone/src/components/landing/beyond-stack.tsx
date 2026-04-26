import Link from "next/link";
import { Button } from "@/components/ui/button";

const items = [
  {
    title: "CRMs record. Dealism closes.",
    desc: "CRMs keep track of what has already happened. Dealism acts in the moment, turning live conversations into real decisions and real revenue.",
  },
  {
    title: "Workflows make you build. Dealism lets you talk.",
    desc: "Old software asks you to learn interfaces, steps, and systems. Dealism works through conversation. You say what you want, and it takes action.",
  },
  {
    title: "Dealism lets you outgrow the product.",
    desc: "Traditional products stop at the features they ship. With Dealism, you can just say what you need, and it can generate the skill to do it.",
  },
];

export function LandingBeyondStack() {
  return (
    <section className="py-20 bg-black text-white">
      <div className="container-1200">
        <h2 className="text-center text-4xl md:text-5xl font-bold">Built Beyond The Old Stack</h2>

        <div className="mt-14 space-y-8">
          {items.map((item, i) => (
            <div
              key={item.title}
              className="grid md:grid-cols-2 gap-8 items-center rounded-3xl bg-neutral-900 p-8 md:p-12 border border-neutral-800"
            >
              <div>
                <h3 className="text-2xl md:text-3xl font-bold text-balance">{item.title}</h3>
                <p className="mt-4 text-neutral-400">{item.desc}</p>
                <Button asChild variant="primary" size="lg" className="mt-6">
                  <Link href="/register">Start 7-Day Free Trial</Link>
                </Button>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-orange-500/20 to-transparent border border-orange-500/30 p-6 aspect-[4/3] flex items-center justify-center">
                <div className="text-orange-400 text-6xl font-bold">{String(i + 1).padStart(2, "0")}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
