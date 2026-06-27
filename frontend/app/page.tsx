"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Search, FileText, ShieldCheck, LineChart, DollarSign, GitBranch, ExternalLink, X, Minus, Check } from "lucide-react"

export default function LandingPage() {
  const router = useRouter()
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <header className="border-b border-white/5 backdrop-blur-sm bg-slate-950/50 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">FR</div>
            <span className="font-semibold text-base">FMA Labs Research</span>
          </div>
          <div className="flex gap-2">
            {token ? (
              <Button onClick={() => router.push("/dashboard")} className="bg-white/10 hover:bg-white/20 text-white border-0">Dashboard</Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => router.push("/login")} className="text-white/70 hover:text-white hover:bg-white/10">Login</Button>
                <Button onClick={() => router.push("/register")} className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25">Mulai Gratis</Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="max-w-6xl mx-auto px-4 pt-32 pb-24 text-center relative">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
          </div>

          <div className="relative">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-white/60 mb-8">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse-dot" />
              AI Deep Research — Open Beta
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
              Research You Can<br />
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Trace</span>
            </h1>

            <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-12 leading-relaxed">
              AI Deep Research dengan proses transparan — lihat setiap langkah AI, 
              verifikasi setiap klaim, bayar sesuai pemakaian. Bukan black box.
            </p>

            <div className="flex gap-4 justify-center mb-16">
              <Button size="lg" onClick={() => router.push("/register")} className="bg-blue-600 hover:bg-blue-500 text-white px-8 shadow-lg shadow-blue-500/25 text-base">
                Mulai Gratis — $5 Kredit
              </Button>
              <Button size="lg" variant="outline" onClick={() => router.push("/login")} className="border-white/20 text-white/80 hover:text-white hover:bg-white/10 hover:border-white/40 px-8 text-base">
                Login
              </Button>
            </div>

            <div className="max-w-3xl mx-auto bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 text-left">
              <div className="flex items-center gap-2 text-sm text-white/40 mb-4">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                <span className="w-2 h-2 rounded-full bg-yellow-400" />
                <span className="w-2 h-2 rounded-full bg-green-400" />
                <span className="ml-2 text-xs">research — demo output</span>
              </div>
              <div className="space-y-3 text-sm font-mono text-white/60">
                <p><Search className="w-3.5 h-3.5 inline text-blue-400 mr-1" /> search <span className="text-white/40">Kecerdasan buatan Indonesia 2026</span> <span className="text-green-400">→ 15 sources</span></p>
                <p><Search className="w-3.5 h-3.5 inline text-blue-400 mr-1" /> search <span className="text-white/40">AI startup Indonesia funding 2026</span> <span className="text-green-400">→ 12 sources</span></p>
                <p><FileText className="w-3.5 h-3.5 inline text-green-400 mr-1" /> fetch <span className="text-white/40">id.wikipedia.org/wiki/Kecerdasan_buatan</span> <span className="text-green-400">✓</span></p>
                <p><FileText className="w-3.5 h-3.5 inline text-green-400 mr-1" /> fetch <span className="text-white/40">techinasia.com/indonesia-ai-startups</span> <span className="text-green-400">✓</span></p>
                <p><ShieldCheck className="w-3.5 h-3.5 inline text-purple-400 mr-1" /> verify <span className="text-white/40">&quot;Indonesia AI market grew 40% in 2025&quot;</span> <span className="text-yellow-400">confidence 92%</span></p>
                <p><ShieldCheck className="w-3.5 h-3.5 inline text-purple-400 mr-1" /> verify <span className="text-white/40">&quot;10 AI startups raised $500M+ in 2025&quot;</span> <span className="text-red-400">conflict detected</span></p>
                <p className="text-white/80 pt-2 border-t border-white/5"><FileText className="w-3.5 h-3.5 inline mr-1" /> Research report generated in 45s · 27 sources · <span className="text-green-400">$0.02 cost</span></p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-white/5 py-24">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-16">Kenapa Bukan AI Lain?</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: ShieldCheck, title: "Verification Engine", desc: "Setiap klaim diverifikasi cross-reference dari multiple source. Confidence score per paragraf. Bukan sekedar teks.", color: "from-blue-500 to-cyan-500" },
                { icon: GitBranch, title: "Live Research Graph", desc: "Lihat setiap langkah AI — keyword, search, crawl, verify — semua real-time. Bukan loading spinner.", color: "from-purple-500 to-pink-500" },
                { icon: DollarSign, title: "Metered Pricing", desc: "Bayar sesuai pemakaian. $0.10 per riset cepat. Hard budget cap. Tidak ada kuota absurd.", color: "from-emerald-500 to-teal-500" },
              ].map((f, i) => {
                const Icon = f.icon
                return (
                  <div key={i} className="group relative p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-white mb-4`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-base mb-2">{f.title}</h3>
                    <p className="text-sm text-white/50 leading-relaxed">{f.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section className="border-t border-white/5 py-24">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-6">Tidak Seperti Kompetitor</h2>
            <p className="text-white/50 text-center max-w-xl mx-auto mb-12">Kami bukan sekadar chatbot dengan search. Kami adalah research infrastructure.</p>
            <div className="max-w-3xl mx-auto space-y-3">
              {[
                ["Live Research Graph", <X key="x" className="w-4 h-4 text-red-400 mx-auto" />, <X key="x2" className="w-4 h-4 text-red-400 mx-auto" />, <X key="x3" className="w-4 h-4 text-red-400 mx-auto" />, <Check key="c" className="w-4 h-4 text-green-400 mx-auto" />],
                ["Verification Engine", <Minus key="m" className="w-4 h-4 text-yellow-400 mx-auto" />, <Minus key="m2" className="w-4 h-4 text-yellow-400 mx-auto" />, <X key="x4" className="w-4 h-4 text-red-400 mx-auto" />, <Check key="c2" className="w-4 h-4 text-green-400 mx-auto" />],
                ["Metered Pricing", <X key="x5" className="w-4 h-4 text-red-400 mx-auto" />, <X key="x6" className="w-4 h-4 text-red-400 mx-auto" />, <X key="x7" className="w-4 h-4 text-red-400 mx-auto" />, <Check key="c3" className="w-4 h-4 text-green-400 mx-auto" />],
                ["Citation Health", <X key="x8" className="w-4 h-4 text-red-400 mx-auto" />, <Minus key="m3" className="w-4 h-4 text-yellow-400 mx-auto" />, <X key="x9" className="w-4 h-4 text-red-400 mx-auto" />, <Check key="c4" className="w-4 h-4 text-green-400 mx-auto" />],
                ["Real-time Intervention", <X key="x10" className="w-4 h-4 text-red-400 mx-auto" />, <X key="x11" className="w-4 h-4 text-red-400 mx-auto" />, <X key="x12" className="w-4 h-4 text-red-400 mx-auto" />, <Check key="c5" className="w-4 h-4 text-green-400 mx-auto" />],
              ].map(([feature, ...icons], i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.04] text-sm">
                  <span className="w-40 font-medium text-white/80">{feature as string}</span>
                  {icons.map((icon, j) => (
                    <span key={j} className="w-12 flex justify-center">{icon as React.ReactNode}</span>
                  ))}
                </div>
              ))}
              <div className="flex text-xs text-white/30 mt-2 px-4">
                <span className="w-40" />
                <span className="w-12 text-center">ChatGPT</span>
                <span className="w-12 text-center">Perplexity</span>
                <span className="w-12 text-center">Gemini</span>
                <span className="w-12 text-center">Kami</span>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-white/5 py-24 text-center">
          <div className="max-w-xl mx-auto px-4">
            <h2 className="text-3xl font-bold mb-4">Siap Mencoba?</h2>
            <p className="text-white/50 mb-8">Daftar sekarang, dapatkan $5 kredit gratis untuk 25+ riset cepat.</p>
            <Button size="lg" onClick={() => router.push("/register")} className="bg-blue-600 hover:bg-blue-500 text-white px-10 shadow-lg shadow-blue-500/25 text-base">
              Mulai Gratis
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 py-8 text-center text-sm text-white/30">
        <p>FMA Labs Research — bagian dari FMA Software Labs</p>
      </footer>
    </div>
  )
}
