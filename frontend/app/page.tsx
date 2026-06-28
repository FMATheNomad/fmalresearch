"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, FileText, ShieldCheck, DollarSign, GitBranch, Check, X, Minus, Sparkles, ArrowRight, Globe, BookOpen, Zap, Clock, BarChart3, Users } from "lucide-react"

const features = [
  { icon: ShieldCheck, title: "Verification Engine", desc: "Setiap klaim diverifikasi dari multiple source. Confidence score per paragraf. Bukan sekadar teks — ada bukti.", color: "from-blue-500 to-cyan-500" },
  { icon: GitBranch, title: "Live Research Graph", desc: "Lihat setiap langkah AI secara real-time — keyword, search, crawl, verify. Bukan loading spinner.", color: "from-purple-500 to-pink-500" },
  { icon: DollarSign, title: "Metered Pricing", desc: "Bayar sesuai pemakaian. $0.10 per riset. Hard budget cap. Tidak ada kuota absurd.", color: "from-emerald-500 to-teal-500" },
]

const comparisons = [
  { feature: "Live Research Graph", chatgpt: <X className="w-4 h-4 text-red-400 mx-auto" />, perplexity: <X className="w-4 h-4 text-red-400 mx-auto" />, gemini: <X className="w-4 h-4 text-red-400 mx-auto" />, ours: <Check className="w-4 h-4 text-green-400 mx-auto" /> },
  { feature: "Verification Engine", chatgpt: <Minus className="w-4 h-4 text-yellow-400 mx-auto" />, perplexity: <Minus className="w-4 h-4 text-yellow-400 mx-auto" />, gemini: <X className="w-4 h-4 text-red-400 mx-auto" />, ours: <Check className="w-4 h-4 text-green-400 mx-auto" /> },
  { feature: "Metered Pricing", chatgpt: <X className="w-4 h-4 text-red-400 mx-auto" />, perplexity: <X className="w-4 h-4 text-red-400 mx-auto" />, gemini: <X className="w-4 h-4 text-red-400 mx-auto" />, ours: <Check className="w-4 h-4 text-green-400 mx-auto" /> },
  { feature: "Citation Health", chatgpt: <X className="w-4 h-4 text-red-400 mx-auto" />, perplexity: <Minus className="w-4 h-4 text-yellow-400 mx-auto" />, gemini: <X className="w-4 h-4 text-red-400 mx-auto" />, ours: <Check className="w-4 h-4 text-green-400 mx-auto" /> },
  { feature: "Real-time Intervensi", chatgpt: <X className="w-4 h-4 text-red-400 mx-auto" />, perplexity: <X className="w-4 h-4 text-red-400 mx-auto" />, gemini: <X className="w-4 h-4 text-red-400 mx-auto" />, ours: <Check className="w-4 h-4 text-green-400 mx-auto" /> },
  { feature: "Hard Budget Cap", chatgpt: <X className="w-4 h-4 text-red-400 mx-auto" />, perplexity: <X className="w-4 h-4 text-red-400 mx-auto" />, gemini: <X className="w-4 h-4 text-red-400 mx-auto" />, ours: <Check className="w-4 h-4 text-green-400 mx-auto" /> },
]

export default function LandingPage() {
  const router = useRouter()
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  const [budget, setBudget] = useState(5)
  const fastCount = Math.floor(budget / 0.05)
  const balancedCount = Math.floor(budget / 0.25)
  const scientistCount = Math.floor(budget / 3.0)
  const parallelCount = Math.floor(budget / 3.0)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <header className="border-b border-white/5 backdrop-blur-sm bg-slate-950/50 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">FR</div>
            <span className="font-semibold text-base">FMA Labs Research</span>
          </div>
          <div className="flex items-center gap-2">
            {token ? (
              <Button onClick={() => router.push("/dashboard")} className="bg-white/10 hover:bg-white/20 text-white border-0">Dashboard</Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => router.push("/login")} className="bg-transparent border-slate-400 text-white hover:text-white hover:bg-slate-800">Login</Button>
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
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              AI Deep Research — Open Beta
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
              AI Research yang<br />
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Bisa Kamu Audit</span>
            </h1>

            <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-12 leading-relaxed">
              Bukan black box. Setiap klaim punya sumber. Setiap langkah terlihat.
              Bayar sesuai pemakaian, tanpa kuota.
            </p>

            <div className="flex gap-4 justify-center mb-16">
              <Button size="lg" onClick={() => router.push("/register")} className="bg-blue-600 hover:bg-blue-500 text-white px-8 shadow-lg shadow-blue-500/25 text-base h-12">
                Mulai Gratis — $5 Kredit
              </Button>
              <Button size="lg" variant="outline" onClick={() => router.push("/login")} className="bg-transparent border-slate-400 text-white hover:text-white hover:bg-slate-800 px-8 text-base h-12">
                Login
              </Button>
            </div>

            <div className="mt-8 max-w-2xl mx-auto bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 text-left">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><DollarSign className="w-4 h-4 text-blue-400" />Kalkulator Pemakaian</h3>
              <p className="text-xs text-white/40 mb-3">Masukkan budget kamu:</p>
              <div className="flex items-center gap-3 mb-5">
                <DollarSign className="w-4 h-4 text-blue-400 shrink-0" />
                <Input type="range" min={1} max={100} value={budget} onChange={(e) => setBudget(Number(e.target.value))}
                  className="w-full accent-blue-500 bg-slate-800 h-1.5 rounded-full appearance-none cursor-pointer" />
                <span className="text-lg font-bold text-blue-400 w-16 text-right">${budget}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.04] text-center">
                  <div className="text-2xl font-bold text-blue-400">{fastCount}</div>
                  <div className="text-xs text-white/40 mt-1">Fast Research</div>
                  <div className="text-[10px] text-white/20">$0.05/riset</div>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.04] text-center">
                  <div className="text-2xl font-bold text-purple-400">{balancedCount}</div>
                  <div className="text-xs text-white/40 mt-1">Balanced</div>
                  <div className="text-[10px] text-white/20">$0.25/riset</div>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.04] text-center">
                  <div className="text-2xl font-bold text-emerald-400">{scientistCount}</div>
                  <div className="text-xs text-white/40 mt-1">Scientist Mode</div>
                  <div className="text-[10px] text-white/20">$3.00/riset</div>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.04] text-center">
                  <div className="text-2xl font-bold text-amber-400">{parallelCount}</div>
                  <div className="text-xs text-white/40 mt-1">Parallel Sub-Agent</div>
                  <div className="text-[10px] text-white/20">$3.00/riset</div>
                </div>
              </div>
              <p className="text-xs text-white/30 mt-4 text-center">Tidak ada kuota bulanan. Tidak ada biaya tersembunyi. Bayar sesuai pemakaian.</p>
            </div>

            <div className="max-w-4xl mx-auto bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 text-left mt-8">
              <div className="flex items-center gap-2 text-sm text-white/40 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                <span className="ml-2 text-xs font-mono">research-terminal</span>
              </div>
              <div className="space-y-2 text-sm font-mono text-white/60">
                <p className="text-white/80">$ <span className="text-blue-300">riset</span> Analisis tren AI startup di Indonesia 2026 — pendanaan, pemain kunci, dan proyeksi pasar</p>
                <p className="text-white/40 text-xs">Mode: Scientist · Budget: $5.00 · Estimated: 45s</p>
                <p className="pt-1"><Search className="w-3.5 h-3.5 inline text-blue-400 mr-1" /> <span className="text-blue-400">search</span> AI startup Indonesia 2026 funding</p>
                <p className="pl-5 text-white/40">→ 12 results dari TechInAsia, e27, DealStreetAsia</p>
                <p><Search className="w-3.5 h-3.5 inline text-blue-400 mr-1" /> <span className="text-blue-400">search</span> Indonesia AI ecosystem startup landscape</p>
                <p className="pl-5 text-white/40">→ 8 results dari McKinsey, Google Indonesia, DSInnovate</p>
                <p><FileText className="w-3.5 h-3.5 inline text-green-400 mr-1" /> <span className="text-green-400">fetch</span> techinasia.com/indonesia-ai-startups-2026</p>
                <p className="pl-5 text-white/40">✓ 4.2 KB — mencakup 10 startup dengan total pendanaan $420M</p>
                <p><FileText className="w-3.5 h-3.5 inline text-green-400 mr-1" /> <span className="text-green-400">fetch</span> mckinsey.com/indonesia-digital-economy-2026</p>
                <p className="pl-5 text-white/40">✓ 8.7 KB — proyeksi AI contribute $366B ke GDP Indonesia 2030</p>
                <p><ShieldCheck className="w-3.5 h-3.5 inline text-purple-400 mr-1" /> <span className="text-purple-400">verify</span> &quot;AI startup funding di Indonesia capai $420M di 2025&quot;</p>
                <p className="pl-5 text-white/40">✅ <span className="text-green-400">Confidence 94%</span> — 3 dari 4 sumber setuju (TechInAsia, e27, DSInnovate) · 1 sumber abstain</p>
                <p><ShieldCheck className="w-3.5 h-3.5 inline text-purple-400 mr-1" /> <span className="text-purple-400">verify</span> &quot;Indonesia akan jadi AI hub terbesar di ASEAN pada 2027&quot;</p>
                <p className="pl-5 text-white/40">⚠️ <span className="text-yellow-400">Confidence 62%</span> — 2 sumber mendukung, 2 sumber <span className="text-red-400">conflicting</span></p>
                <p className="pt-2 border-t border-white/5 text-white/80 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5" />
                  Research report · 47 sumber · 8.2K tokens · <span className="text-green-400">$0.08 cost</span>
                  <span className="text-white/30">|</span>
                  <span className="text-blue-400 text-xs flex items-center gap-1"><BarChart3 className="w-3 h-3" /> 3 conflicts detected</span>
                  <span className="text-white/30">|</span>
                  <span className="text-green-400 text-xs flex items-center gap-1"><Check className="w-3 h-3" /> 12 claims verified</span>
                </p>
              </div>
            </div>

            <div className="mt-8 max-w-2xl mx-auto bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
              <p className="text-xs text-white/40 mb-3 text-center">Lihat contoh hasil research:</p>
              <a href="/research/example"
                className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-colors group">
                <div className="relative w-12 h-12 shrink-0">
                  <svg width="48" height="48" viewBox="0 0 48 48">
                    <circle cx="24" cy="24" r="18" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                    <circle cx="24" cy="24" r="18" fill="none" stroke="#34d399" strokeWidth="3"
                      strokeDasharray="113.1" strokeDashoffset="14.7" strokeLinecap="round"
                      transform="rotate(-90 24 24)" />
                    <text x="24" y="24" textAnchor="middle" dominantBaseline="central"
                      fill="#34d399" fontSize="11" fontWeight="700">87%</text>
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-white group-hover:text-emerald-400 transition-colors">Efek Kafein Terhadap Konsentrasi</div>
                  <div className="text-xs text-white/40">Tinjauan literatur 2020-2024 — 12 sumber terverifikasi</div>
                </div>
                <span className="text-white/30 group-hover:text-white/60 transition-colors">→</span>
              </a>
            </div>
          </div>
        </section>

        <section className="border-t border-white/5 py-24">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Masalah yang Kami Selesaikan</h2>
              <p className="text-white/50 max-w-xl mx-auto">AI research tools hari ini punya 3 masalah besar — dan kami ada jawabannya.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4"><X className="w-5 h-5" /></div>
                <h3 className="font-semibold mb-1">Black Box</h3>
                <p className="text-sm text-white/50 mb-3">Loading... Thinking... tanpa tahu apa yang terjadi.</p>
                <div className="flex items-center gap-2 text-sm text-green-400"><ArrowRight className="w-3.5 h-3.5" /><span>Live Research Graph — semua terlihat</span></div>
              </div>
              <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4"><X className="w-5 h-5" /></div>
                <h3 className="font-semibold mb-1">Halusinasi</h3>
                <p className="text-sm text-white/50 mb-3">AI confident ngomong salah tanpa ada verifikasi.</p>
                <div className="flex items-center gap-2 text-sm text-green-400"><ArrowRight className="w-3.5 h-3.5" /><span>Verification Engine + confidence score</span></div>
              </div>
              <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4"><X className="w-5 h-5" /></div>
                <h3 className="font-semibold mb-1">Kuota Terbatas</h3>
                <p className="text-sm text-white/50 mb-3">$200/bulan cuma dapat 250 query. Habis? Bayar lagi.</p>
                <div className="flex items-center gap-2 text-sm text-green-400"><ArrowRight className="w-3.5 h-3.5" /><span>Metered pricing — bayar per riset, bukan per bulan</span></div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-white/5 py-24">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-16">Fitur Utama</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {features.map((f, i) => {
                const Icon = f.icon
                return (
                  <div key={i} className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors">
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
            <h2 className="text-3xl font-bold text-center mb-4">Bandingkan Sendiri</h2>
            <p className="text-white/50 text-center max-w-xl mx-auto mb-12">Fitur yang kami miliki — dan tidak dimiliki kompetitor.</p>
            <div className="max-w-3xl mx-auto overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-white/40 text-xs">
                    <th className="text-left py-3 px-4 font-medium">Fitur</th>
                    <th className="text-center py-3 px-4 font-medium">ChatGPT</th>
                    <th className="text-center py-3 px-4 font-medium">Perplexity</th>
                    <th className="text-center py-3 px-4 font-medium">Gemini</th>
                    <th className="text-center py-3 px-4 font-medium text-white">Kami</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisons.map((row, i) => (
                    <tr key={i} className="border-b border-white/[0.03]">
                      <td className="py-3 px-4 text-white/80">{row.feature}</td>
                      <td className="py-3 px-4 text-center">{row.chatgpt}</td>
                      <td className="py-3 px-4 text-center">{row.perplexity}</td>
                      <td className="py-3 px-4 text-center">{row.gemini}</td>
                      <td className="py-3 px-4 text-center">{row.ours}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="border-t border-white/5 py-20">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4">Cara Kerja</h2>
            <p className="text-white/50 text-center max-w-xl mx-auto mb-16">Tiga langkah sederhana untuk riset mendalam.</p>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: Globe, title: "Masukkan Query", desc: "Tulis pertanyaan riset kamu. Pilih mode: Fast (1-3 menit) atau Scientist (15-60 menit)." },
                { icon: Zap, title: "AI Research", desc: "AI mencari, membaca, memverifikasi puluhan sumber secara otomatis. Kamu bisa intervensi real-time." },
                { icon: FileText, title: "Dapatkan Report", desc: "Laporan dengan confidence score per klaim, sumber tercantum, dan conflict detection." },
              ].map((item, i) => {
                const Icon = item.icon
                return (
                  <div key={i} className="text-center">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-6 h-6 text-blue-400" />
                    </div>

                    <h3 className="font-semibold mb-1">{item.title}</h3>
                    <p className="text-sm text-white/50 leading-relaxed max-w-xs mx-auto">{item.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section className="border-t border-white/5 py-20">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4">Untuk Siapa?</h2>
            <p className="text-white/50 text-center max-w-xl mx-auto mb-12">Produk ini dibangun untuk mereka yang butuh riset berkualitas.</p>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: BookOpen, title: "Akademisi & Peneliti", desc: "Literature review, systematic analysis, verifikasi sumber. Dengan citation yang bisa diaudit." },
                { icon: BarChart3, title: "Analis Bisnis & Founder", desc: "Market research, competitor analysis, due diligence. Cepat dan terpercaya." },
                { icon: Users, title: "Konsultan & Agency", desc: "Research report untuk klien. Collaborative workspace untuk tim." },
              ].map((item, i) => {
                const Icon = item.icon
                return (
                  <div key={i} className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-center">
                    <Icon className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                    <h3 className="font-semibold mb-1">{item.title}</h3>
                    <p className="text-sm text-white/50">{item.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section className="border-t border-white/5 py-24 text-center">
          <div className="max-w-xl mx-auto px-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Siap Mencoba?</h2>
            <p className="text-white/50 mb-2">Daftar sekarang, dapatkan $5 kredit gratis.</p>
            <p className="text-white/30 text-sm mb-8">Cukup untuk 25 riset cepat atau 1 riset Scientist Mode.</p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" onClick={() => router.push("/register")} className="bg-blue-600 hover:bg-blue-500 text-white px-10 shadow-lg shadow-blue-500/25 text-base h-12">
                Mulai Gratis
              </Button>
              <Button size="lg" variant="outline" onClick={() => router.push("/login")} className="bg-transparent border-slate-400 text-white hover:text-white hover:bg-slate-800 px-8 text-base h-12">
                Login
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 py-10">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/30">
          <p>FMA Labs Research — bagian dari FMA Software Labs</p>
          <div className="flex gap-6">
            <a href="/login" className="hover:text-white/50 transition-colors">Login</a>
            <a href="/register" className="hover:text-white/50 transition-colors">Daftar</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
