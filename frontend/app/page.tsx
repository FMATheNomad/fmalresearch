"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function LandingPage() {
  const router = useRouter()
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm">FR</div>
            <span className="font-semibold text-lg">FMA Labs Research</span>
          </div>
          <div className="flex gap-3">
            {token ? (
              <Button onClick={() => router.push("/dashboard")}>Dashboard</Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => router.push("/login")}>Login</Button>
                <Button onClick={() => router.push("/register")}>Sign Up</Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-4 py-24 text-center">
          <h1 className="text-5xl font-bold tracking-tight mb-6">
            Research You Can <span className="text-primary">Trace</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Satu-satunya AI Deep Researcher dengan proses transparan, verifikasi multi-source,
            dan pricing bayar sesuai pemakaian. Bukan black box.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => router.push("/register")}>Mulai Gratis</Button>
            <Button size="lg" variant="outline" onClick={() => router.push("/login")}>Masuk</Button>
          </div>
        </section>

        <section className="border-t py-20">
          <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4 text-blue-600 text-xl">✓</div>
              <h3 className="font-semibold mb-2">Verification Engine</h3>
              <p className="text-sm text-muted-foreground">Cross-reference multi-source dengan confidence score per klaim</p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4 text-blue-600 text-xl">◉</div>
              <h3 className="font-semibold mb-2">Live Research Graph</h3>
              <p className="text-sm text-muted-foreground">Lihat setiap langkah AI real-time — dari keyword hingga verifikasi</p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4 text-blue-600 text-xl">$</div>
              <h3 className="font-semibold mb-2">Metered Pricing</h3>
              <p className="text-sm text-muted-foreground">Bayar sesuai pemakaian. Tidak ada kuota absurd. Transparan.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
