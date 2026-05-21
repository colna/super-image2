const FEATURES = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-foreground">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Lossless Pipeline",
    desc: "Images are stored as raw PNGs in your browser — no compression, no quality loss. What the AI generates is exactly what you get.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-foreground">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Chat-based Workflow",
    desc: "Generate images through natural conversation. Each session keeps full history with prompts, parameters, and results.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-foreground">
        <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    title: "Privacy First",
    desc: "Your API key and images stay in your browser. Nothing is sent to our servers — the app talks directly to the AI provider.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-foreground">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    title: "Fast & Flexible",
    desc: "Switch sizes, quality presets, and batch count on the fly. Supports custom API endpoints and multiple models.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-6 pb-24 pt-32 text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
          SuperImage
        </h1>
        <p className="mb-8 max-w-lg text-lg text-foreground-secondary">
          Generate stunning images from text. Powered by GPT&#8209;Image&#8209;1.
          Lossless quality. Privacy first. Open source.
        </p>
        <a
          href="/chat"
          className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Start Creating
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-4xl px-6 pb-24">
        <div className="grid gap-8 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-background-card p-6">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-background-hover">
                {f.icon}
              </div>
              <h3 className="mb-1.5 text-sm font-semibold text-foreground">{f.title}</h3>
              <p className="text-sm leading-relaxed text-foreground-secondary">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-8 text-center text-xs text-foreground-secondary">
        <p>
          SuperImage &copy; {new Date().getFullYear()} &mdash; Built with Next.js, Tailwind CSS, and OpenAI
        </p>
      </footer>
    </main>
  );
}
