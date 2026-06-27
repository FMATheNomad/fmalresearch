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

const MODE_INFO: Record<string, { label: string; cost: number; duration: string; color: string }> = {
  fast: { label: "Fast", cost: 0.05, duration: "1-3 min", color: "bg-green-100 text-green-800" },
  balanced: { label: "Balanced", cost: 0.25, duration: "5-10 min", color: "bg-blue-100 text-blue-800" },
  scientist: { label: "Scientist", cost: 3.00, duration: "15-60 min", color: "bg-purple-100 text-purple-800" },
  multi_agent: { label: "Multi-Agent", cost: 10.00, duration: "30-120 min", color: "bg-orange-100 text-orange-800" },
}

export default function DashboardPage() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<{ name: string; email: string; balance: number } | null>(null)
  const [sessions, setSessions] = useState<any[]>([])
  const [query, setQuery] = useState("")
  const [mode, setMode] = useState("balanced")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const t = localStorage.getItem("token")
    if (!t) { router.push("/login"); return }
    setToken(t)
    loadData()
  }, [])

  async function loadData() {
    try {
      const [u, s] = await Promise.all([api.auth.me(), api.research.list()])
      setUser(u)
      setSessions(s)
    } catch { localStorage.removeItem("token"); router.push("/login") }
  }

  async function startResearch() {
    if (!query.trim()) return
    setLoading(true)
    try {
      const res = await api.research.create({ query, mode })
      router.push(`/research/${res.id}`)
    } catch (err: any) {
      alert(err.message)
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm">FR</div>
            <span className="font-semibold">FMA Labs Research</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Balance: <strong>${user?.balance.toFixed(2)}</strong></span>
            <span className="text-sm">{user?.name}</span>
            <Button variant="ghost" size="sm" onClick={() => { localStorage.removeItem("token"); router.push("/") }}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>New Research</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Research Query</Label>
              <Textarea
                placeholder="Contoh: Analisis tren AI startup di Indonesia 2026, pendanaan, dan pemain kuncinya..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex gap-4 items-end">
              <div className="space-y-2">
                <Label>Mode</Label>
                <Select value={mode} onValueChange={setMode}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(MODE_INFO).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label} — ${v.cost.toFixed(2)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1" />
              <Button onClick={startResearch} disabled={loading || !query.trim()}>
                {loading ? "Starting..." : "Start Research"}
              </Button>
            </div>
            {mode && (
              <p className="text-sm text-muted-foreground">
                {MODE_INFO[mode]?.label} mode: ~{MODE_INFO[mode]?.duration}, estimasi biaya ${MODE_INFO[mode]?.cost.toFixed(2)}
              </p>
            )}
          </CardContent>
        </Card>

        <div>
          <h2 className="text-lg font-semibold mb-4">Research History</h2>
          {sessions.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Belum ada riset. Mulai dengan menulis query di atas.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {sessions.map((s) => (
                <Card key={s.id} className="cursor-pointer hover:shadow-md transition" onClick={() => router.push(`/research/${s.id}`)}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{s.query}</p>
                      <p className="text-sm text-muted-foreground">
                        {s.sources_count} sources · ${s.cost_incurred.toFixed(4)}
                      </p>
                    </div>
                    <Badge variant={s.status === "completed" ? "success" : s.status === "running" ? "warning" : "secondary"}>
                      {s.status}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
