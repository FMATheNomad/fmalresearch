"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/lib/api"
import { Search, FileText, Clock, DollarSign, BarChart3 } from "lucide-react"

const MODE_INFO: Record<string, { label: string; cost: number; duration: string; desc: string }> = {
  fast: { label: "Fast", cost: 0.05, duration: "1-3 min", desc: "Quick fact check" },
  balanced: { label: "Balanced", cost: 0.25, duration: "5-10 min", desc: "Standard research" },
  scientist: { label: "Scientist", cost: 3.00, duration: "15-60 min", desc: "Deep research" },
  multi_agent: { label: "Parallel", cost: 3.00, duration: "30-120 min", desc: "3 sub-agents + moderator" },
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ name: string; email: string; balance: number } | null>(null)
  const [sessions, setSessions] = useState<any[]>([])
  const [query, setQuery] = useState("")
  const [mode, setMode] = useState("balanced")
  const [loading, setLoading] = useState(false)
  const [searchQ, setSearchQ] = useState("")

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) { router.push("/login"); return }
    loadData()
  }, [])

  async function loadData() {
    try {
      const [u, s] = await Promise.all([api.auth.me(), api.research.list()])
      setUser(u); setSessions(s)
    } catch { localStorage.removeItem("token"); router.push("/login") }
  }

  async function startResearch() {
    if (!query.trim()) return
    setLoading(true)
    try {
      const res = await api.research.create({ query, mode })
      router.push(`/research/${res.id}`)
    } catch (err: any) { alert(err.message) } finally { setLoading(false) }
  }

  const filtered = searchQ
    ? sessions.filter(s => s.query.toLowerCase().includes(searchQ.toLowerCase()))
    : sessions

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">FR</div>
            <span className="font-semibold text-sm text-white">FMA Labs Research</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/billing" className="text-xs text-slate-400 hover:text-white transition-colors">Balance: <strong className="text-emerald-400">${user?.balance.toFixed(2)}</strong></a>
            <span className="text-xs text-slate-400">{user?.name}</span>
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white text-xs"
              onClick={() => { localStorage.removeItem("token"); router.push("/") }}>Logout</Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        <div className="w-96 shrink-0 space-y-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-white flex items-center gap-2"><Search className="w-4 h-4 text-blue-400" />New Research</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-400">Research Query</Label>
                <Textarea placeholder="Contoh: Analisis tren AI startup di Indonesia 2026..." value={query}
                  onChange={(e) => setQuery(e.target.value)} rows={3}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-400">Mode</Label>
                <Select value={mode} onValueChange={setMode}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white">
                    {Object.entries(MODE_INFO).map(([k, v]) => (
                      <SelectItem key={k} value={k} className="hover:bg-slate-700">
                        {v.label} — ${v.cost.toFixed(2)} · {v.duration}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {mode && (
                <div className="text-xs text-slate-500 flex items-center gap-3">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{MODE_INFO[mode]?.duration}</span>
                  <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />${MODE_INFO[mode]?.cost.toFixed(2)}</span>
                </div>
              )}
              <Button onClick={startResearch} disabled={loading || !query.trim()}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white">
                {loading ? "Starting..." : "Start Research"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-medium text-white">Research History</h2>
            <div className="flex-1" />
            <Input placeholder="Search research..." value={searchQ} onChange={(e) => setSearchQ(e.target.value)}
              className="max-w-xs bg-slate-900 border-slate-800 text-white placeholder:text-slate-500 text-xs h-8" />
          </div>

          {filtered.length === 0 ? (
            <div className="space-y-4">
              {searchQ ? (
                <div className="text-center py-16 text-slate-500 text-sm">
                  <BarChart3 className="w-10 h-10 mx-auto mb-3 text-slate-700" />
                  No research matching your search.
                </div>
              ) : (
                <>
                  <div className="text-center py-8 text-slate-500 text-sm">
                    Belum ada research. Coba contoh di bawah atau tulis query di form sebelah kiri.
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div onClick={() => router.push("/research/example")}
                      className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800/50 cursor-pointer transition-all group">
                      <div className="flex items-start justify-between mb-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 text-sm">🔬</div>
                        <Badge variant="success" className="text-[10px]">Example</Badge>
                      </div>
                      <h3 className="text-sm font-medium text-white mb-1 group-hover:text-blue-400 transition-colors">Efek Kafein Terhadap Konsentrasi</h3>
                      <p className="text-xs text-slate-500">Tinjauan literatur 2020-2024 — 12 sumber, confidence 87%</p>
                    </div>
                    <div onClick={() => router.push("/register")}
                      className="p-4 rounded-xl bg-slate-900 border border-slate-800 border-dashed hover:bg-slate-800/50 cursor-pointer transition-all group">
                      <div className="flex items-start justify-between mb-2">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 text-base">+</div>
                      </div>
                      <h3 className="text-sm font-medium text-white mb-1 group-hover:text-purple-400 transition-colors">Buat Research Baru</h3>
                      <p className="text-xs text-slate-500">Daftar untuk mulai research pertamamu</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((s) => (
                <div key={s.id} onClick={() => router.push(`/research/${s.id}`)}
                  className="flex items-center gap-3 p-3 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800/50 cursor-pointer transition-colors">
                  <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="flex-1 text-sm text-slate-300 truncate">{s.query}</span>
                  <span className="text-xs text-slate-500">{s.sources_count} sources</span>
                  <Badge variant={s.status === "completed" ? "success" : "warning"} className="text-[10px] px-1.5 py-0">
                    {s.status === "completed" ? "Done" : s.status === "running" ? "..." : s.status}
                  </Badge>
                  <span className="text-xs text-slate-600">${s.cost_incurred?.toFixed(4)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
