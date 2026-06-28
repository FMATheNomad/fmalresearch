"use client"

import { Suspense, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { api } from "@/lib/api"

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const token = searchParams.get("token")
    if (token) { localStorage.setItem("token", token); router.push("/dashboard") }
    api.auth.me().then(() => router.push("/dashboard")).catch(() => {})
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(""); setLoading(true)
    try {
      const res = await api.auth.login(email, password)
      localStorage.setItem("token", res.access_token)
      router.push("/dashboard")
    } catch (err: any) { setError(err.message) } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl" />
      </div>
      <div className="relative w-full max-w-5xl flex rounded-2xl overflow-hidden bg-slate-900/50 border border-slate-800/50 backdrop-blur-sm">
        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-blue-600/20 via-purple-600/10 to-slate-900 p-10 flex-col justify-between">
          <div>
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm mb-6">FR</div>
            <h2 className="text-2xl font-bold text-white mb-3">Research You Can <span className="text-blue-400">Trace</span></h2>
            <p className="text-slate-400 text-sm leading-relaxed">Setiap klaim diverifikasi. Setiap sumber tercatat. Bukan black box.</p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold">1</div>
              <span>Masukkan query riset</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 text-xs font-bold">2</div>
              <span>AI search + verifikasi multi-source</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-bold">3</div>
              <span>Dapatkan report dengan confidence score</span>
            </div>
          </div>
        </div>
        <div className="w-full md:w-1/2 p-8">
          <div className="max-w-sm mx-auto space-y-6">
            <div>
              <h1 className="text-xl font-semibold text-white">Welcome back</h1>
              <p className="text-sm text-slate-400 mt-1">Login ke akun FMA Labs Research</p>
            </div>

            <Button variant="outline" className="w-full bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800 h-10"
              onClick={() => window.location.href = "/auth/google/login"}>
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Login dengan Google
            </Button>

            <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-800" /></div><div className="relative flex justify-center text-xs"><span className="bg-slate-900 px-2 text-slate-500">atau</span></div></div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-400">Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  className="bg-slate-800/50 border-slate-700 text-white h-10" placeholder="nama@email.com" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-400">Password</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                  className="bg-slate-800/50 border-slate-700 text-white h-10" placeholder="Min 8 karakter" />
              </div>
              {error && <p className="text-xs text-red-400">{error}</p>}
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 h-10 text-sm" disabled={loading}>
                {loading ? "Memproses..." : "Login"}
              </Button>
            </form>
            <p className="text-xs text-center text-slate-500">
              Belum punya akun? <a href="/register" className="text-blue-400 hover:underline">Daftar</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Loading...</div>}>
      <LoginContent />
    </Suspense>
  )
}
