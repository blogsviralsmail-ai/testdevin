export default function AuthorBox() {
  return (
    <div className="rounded-xl p-6 mt-10 flex items-start gap-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="w-16 h-16 rounded-full flex-shrink-0 flex items-center justify-center text-2xl font-bold text-white" style={{ background: "linear-gradient(135deg, #06b6d4, #8b5cf6)" }}>
        K
      </div>
      <div>
        <h3 className="text-white font-bold text-lg">KKHS Media</h3>
        <p className="text-cyan-400 text-sm mb-2">Internship Training Institute, Jaipur</p>
        <p className="text-slate-400 text-sm leading-relaxed">
          KKHS Media is Jaipur&apos;s leading internship training institute with 500+ students trained. We offer certified paid internship programs in Video Editing, Digital Marketing, Web Development &amp; Graphic Design. Founded by Hari Soni, KKHS Media has been featured in Mid-Day &amp; NetNewsLedger.
        </p>
        <div className="flex items-center gap-3 mt-3">
          <a href="https://www.youtube.com/@KKHSMedia" target="_blank" rel="noopener noreferrer" className="text-xs text-slate-500 hover:text-cyan-400 transition-colors">YouTube (138K+)</a>
          <span className="text-slate-700">|</span>
          <a href="https://www.instagram.com/kkhsmedia/" target="_blank" rel="noopener noreferrer" className="text-xs text-slate-500 hover:text-cyan-400 transition-colors">Instagram</a>
          <span className="text-slate-700">|</span>
          <a href="https://www.linkedin.com/company/kkhs-media" target="_blank" rel="noopener noreferrer" className="text-xs text-slate-500 hover:text-cyan-400 transition-colors">LinkedIn</a>
          <span className="text-slate-700">|</span>
          <a href="https://kkhsmedia.com" target="_blank" rel="noopener noreferrer" className="text-xs text-slate-500 hover:text-cyan-400 transition-colors">Website</a>
        </div>
      </div>
    </div>
  );
}
