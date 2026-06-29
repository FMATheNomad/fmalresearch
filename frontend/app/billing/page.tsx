"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { api } from "@/lib/api"
import { DollarSign, ArrowUpRight, Clock, FileText } from "lucide-react"

export default function BillingPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [balance, setBalance] = useState(0)
  const [totalSpent, setTotalSpent] = useState(0)
  const [topUpAmount, setTopUpAmount] = useState(10)
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) { router.push("/login"); return }
    loadData()
  }, [])

  async function loadData() {
    try {
      const [u, b, s] = await Promise.all([
        api.auth.me(),
        fetch("/billing/balance").then(r => r.json()),
        api.research.list(),
      ])
      setUser(u)
      setBalance(b.balance)
      setTotalSpent(b.total_spent)
      setSessions(s)
    } catch { router.push("/login") }
    finally { setLoading(false) }
  }

  async function handleTopUp() {
    try {
      const res = await fetch(`/billing/top-up?amount=${topUpAmount}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      const data = await res.json()
      setBalance(data.balance)
    } catch (err: any) { alert(err.message) }
  }

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="text-slate-400 animate-pulse">Loading...</div></div>

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")} className="text-slate-400">← Back</Button>
            <span className="text-sm font-medium">Billing</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-400">Balance</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-400">${balance.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-400">Total Spent</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-400">${totalSpent.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-400">Research Count</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-400">{sessions.length}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-400">Top Up Balance</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-3">
            <Input type="number" min={1} max={100} value={topUpAmount} onChange={(e) => setTopUpAmount(Number(e.target.value))}
              className="w-24 bg-slate-800 border-slate-700 text-white" />
            <span className="text-sm text-slate-400">USD</span>
            <Button onClick={handleTopUp} className="bg-blue-600 hover:bg-blue-500 text-white">Add Funds</Button>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-400">Recent Usage</CardTitle></CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <div className="text-sm text-slate-500 text-center py-8">No research history yet.</div>
            ) : (
              <div className="space-y-1.5">
                {sessions.slice(0, 10).map((s) => (
                  <div key={s.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/50 cursor-pointer text-sm"
                    onClick={() => router.push(`/research/${s.id}`)}>
                    <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="flex-1 truncate text-slate-300">{s.query}</span>
                    <span className="text-xs text-slate-500">{s.sources_count} sources</span>
                    <span className="text-xs text-emerald-500">${s.cost_incurred?.toFixed(4)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
