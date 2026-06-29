"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { api } from "@/lib/api"
import { Search, FileText, Clock, BarChart3 } from "lucide-react"

export default function KnowledgePage() {
  const router = useRouter()
  const [sessions, setSessions] = useState<any[]>([])
  const [searchQ, setSearchQ] = useState("")
  const [stats, setStats] = useState({ total: 0, totalCost: 0, totalSources: 0 })

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) { router.push("/login"); return }
    loadData()
  }, [])

  async function loadData() {
    try {
      const s = await api.research.list()
      setSessions(s)
      setStats({
        total: s.length,
        totalCost: s.reduce((a: any, b: any) => a + (b.cost_incurred || 0), 0),
        totalSources: s.reduce((a: any, b: any) => a + (b.sources_count || 0), 0),
      })
    } catch { router.push("/login") }
  }

  const filtered = searchQ
    ? sessions.filter(s => s.query.toLowerCase().includes(searchQ.toLowerCase()))
    : sessions

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")} className="text-slate-400">←</Button>
            <span className="text-sm font-medium">Knowledge Vault</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <div className="text-2xl font-bold text-blue-400">{stats.total}</div>
            <div className="text-xs text-slate-400 mt-1">Total Research</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <div className="text-2xl font-bold text-emerald-400">{stats.totalSources}</div>
            <div className="text-xs text-slate-400 mt-1">Total Sources</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <div className="text-2xl font-bold text-purple-400">${stats.totalCost.toFixed(2)}</div>
            <div className="text-xs text-slate-400 mt-1">Total Spent</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Search className="w-4 h-4 text-slate-500" />
          <Input placeholder="Search all research..." value={searchQ} onChange={(e) => setSearchQ(e.target.value)}
            className="flex-1 bg-slate-900 border-slate-800 text-white placeholder:text-slate-500 text-sm h-9" />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-sm">
            <BarChart3 className="w-10 h-10 mx-auto mb-3 text-slate-700" />
            {searchQ ? "No research matching search." : "No research yet."}
          </div>
        ) : (
          <div className="space-y-1.5">
            {filtered.map((s) => (
              <div key={s.id} onClick={() => router.push(`/research/${s.id}`)}
                className="flex items-center gap-3 p-3 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800/50 cursor-pointer transition-colors group">
                <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-slate-200 truncate group-hover:text-blue-400 transition-colors">{s.query}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-3 mt-0.5">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{s.sources_count} sources</span>
                    <span>${s.cost_incurred?.toFixed(4)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
