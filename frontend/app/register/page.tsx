"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api } from "@/lib/api"

function passwordStrength(pw: string): { label: string; color: string; width: string } {
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  const map = ["", "Weak", "Fair", "Good", "Strong", "Very Strong"]
  const colors = ["", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500", "bg-emerald-500"]
  return { label: map[score] || "", color: colors[score] || "", width: `${(score / 5) * 100}%` }
}

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const strength = passwordStrength(password)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(""); setLoading(true)
    try {
      const res = await api.auth.register(email, name, password)
      localStorage.setItem("token", res.access_token)
      router.push("/dashboard")
    } catch (err: any) { setError(err.message) } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 -left-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 -right-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
      </div>
      <div className="relative w-full max-w-5xl flex rounded-2xl overflow-hidden bg-slate-900/50 border border-slate-800/50 backdrop-blur-sm">
        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-emerald-600/20 via-blue-600/10 to-slate-900 p-10 flex-col justify-between">
          <div>
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm mb-6">FR</div>
            <h2 className="text-2xl font-bold text-white mb-3">Mulai Gratis</h2>
            <p className="text-slate-400 text-sm leading-relaxed">Dapatkan <strong className="text-emerald-400">$5 kredit</strong> untuk 100 Fast Research atau 20 Balanced Research. Tanpa komitmen.</p>
          </div>
          <div className="space-y-3 text-sm text-slate-400">
            {["✅ Verification Engine — setiap klaim diverifikasi", "✅ Live Research Graph — real-time progress", "✅ Metered Pricing — bayar sesuai pemakaian"].map((item, i) => (
              <p key={i}>{item}</p>
            ))}
          </div>
        </div>
        <div className="w-full md:w-1/2 p-8">
          <div className="max-w-sm mx-auto space-y-6">
            <div>
              <h1 className="text-xl font-semibold text-white">Buat Akun</h1>
              <p className="text-sm text-slate-400 mt-1">Daftar untuk mulai research</p>
            </div>

            <Button variant="outline" className="w-full bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800 h-10"
              onClick={() => window.location.href = "/auth/google/login"}>
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Daftar dengan Google
            </Button>

            <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-800" /></div><div className="relative flex justify-center text-xs"><span className="bg-slate-900 px-2 text-slate-500">atau</span></div></div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-400">Nama</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required
                  className="bg-slate-800/50 border-slate-700 text-white h-10" placeholder="Nama lengkap" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-400">Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  className="bg-slate-800/50 border-slate-700 text-white h-10" placeholder="nama@email.com" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-400">Password</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                  className="bg-slate-800/50 border-slate-700 text-white h-10" placeholder="Min 8 karakter" />
                {password && (
                  <div className="space-y-1">
                    <div className="h-1 rounded-full bg-slate-800 overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${strength.color}`} style={{ width: strength.width }} />
                    </div>
                    <p className="text-[10px] text-slate-500">{strength.label}</p>
                  </div>
                )}
              </div>
              {error && <p className="text-xs text-red-400">{error}</p>}
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 h-10 text-sm" disabled={loading}>
                {loading ? "Memproses..." : "Daftar — Dapatkan $5 Kredit"}
              </Button>
            </form>
            <p className="text-xs text-center text-slate-500">
              Sudah punya akun? <a href="/login" className="text-blue-400 hover:underline">Login</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
