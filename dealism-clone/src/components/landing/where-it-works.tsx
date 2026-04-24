import { Monitor, Smartphone, Download } from "lucide-react";

const platforms = [
  { icon: Monitor, title: "Web", desc: "Full-featured dashboard" },
  { icon: Smartphone, title: "Mobile H5", desc: "Access from any browser" },
  { icon: Download, title: "Mobile App", desc: "Download from Google Play" },
];

export function LandingWhereItWorks() {
  return (
    <section className="py-20 bg-white">
      <div className="container-1200">
        <h2 className="text-center text-4xl md:text-5xl font-bold">Where It Works</h2>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {platforms.map((p) => (
            <div
              key={p.title}
              className="rounded-2xl border border-neutral-200 bg-neutral-50 p-8 text-center hover-lift"
            >
              <p.icon className="h-12 w-12 mx-auto text-orange-500" />
              <h3 className="mt-4 text-xl font-semibold">{p.title}</h3>
              <p className="mt-2 text-sm text-neutral-600">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
