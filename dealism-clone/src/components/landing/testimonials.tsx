const testimonials = [
  {
    name: "Mark",
    role: "E-commerce Store Owner",
    quote:
      "I got Dealism for customer support, but was shocked to see it driving sales by converting hesitant buyers with expert product answers. This tool literally pays for itself.",
  },
  {
    name: "Sarah",
    role: "Cosmetics Sales Representative",
    quote:
      "Dealism follows my exact rules so perfectly, my customers genuinely think it's me. This saves me 3 hours daily — priceless time I now have for my family.",
  },
  {
    name: "Devin",
    role: "Content Creator",
    quote:
      "It's not just a bot — Dealism automates 99% of my DMs in my exact voice and makes real conversations. I'm finally free to focus on creating content instead of just answering messages.",
  },
  {
    name: "Saray",
    role: "Marketing Agency CEO",
    quote:
      "Dealism has become an essential part of our agency. It doesn't just handle simple tasks — it truly understands our spirit, our tone, and the way we connect with clients.",
  },
];

export function LandingTestimonials() {
  return (
    <section className="py-20 bg-neutral-50">
      <div className="container-1200">
        <h2 className="text-center text-4xl md:text-5xl font-bold">Trusted by Real Teams</h2>
        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {testimonials.map((t) => (
            <blockquote
              key={t.name}
              className="hover-lift rounded-2xl border border-neutral-200 bg-white p-6"
            >
              <p className="text-neutral-700 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
              <footer className="mt-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-semibold">
                  {t.name[0]}
                </div>
                <div>
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-xs text-neutral-500">{t.role}</div>
                </div>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
