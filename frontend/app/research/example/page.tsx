"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

const EXAMPLE_REPORT = `# Efek Kafein Terhadap Konsentrasi — Tinjauan Literatur 2020-2024

**Confidence Score Agregat: 87%** — Berdasarkan 12 sumber yang diverifikasi silang.

---

## Ringkasan Eksekutif

Kafein dalam dosis sedang (40-300mg) secara konsisten menunjukkan peningkatan kewaspadaan, konsentrasi, dan performa kognitif jangka pendek pada individu yang tidak kekurangan tidur akut. Efek optimal tercapai pada dosis 1-2 mg/kg berat badan. Efek samping seperti kecemasan dan penurunan kualitas tidur mulai signifikan pada dosis >400mg/hari.

---

## Temuan Utama

### 1. Kafein Meningkatkan Konsentrasi Jangka Pendek ✅
**Confidence: 94%**

Dari 7 studi yang dianalisis, 6 menunjukkan peningkatan signifikan dalam tes perhatian berkelanjutan (continuous performance task) 30-120 menit setelah konsumsi kafein 50-300mg. *Sumber: Harvard Medical School, Johns Hopkins, Nature Reviews Neuroscience.*

### 2. Efek Bervariasi Berdasarkan Genetika ⚠️
**Confidence: 82%**

Polimorfisme gen CYP1A2 mempengaruhi metabolisme kafein. "Slow metabolizers" mengalami efek samping lebih banyak tanpa peningkatan kognitif signifikan dibanding "fast metabolizers." *Sumber: Clinical Pharmacology & Therapeutics, 2021.*

### 3. Toleransi Berkembang Dalam 3-5 Hari ⚠️
**Confidence: 78%**

Konsumsi harian menyebabkan toleransi — pengguna reguler membutuhkan dosis lebih tinggi untuk efek yang sama. *Sumber: Psychopharmacology, 2022.*

### 4. Interaksi dengan Kurang Tidur 🔴
**Confidence: 88%**

Kafein tidak dapat menggantikan tidur. Pada individu kurang tidur, kafein meningkatkan kewaspadaan tapi tidak memperbaiki performa kognitif kompleks. *Sumber: Sleep Medicine Reviews, 2023.*

---

## Data Perbandingan

| Dosis | Efek Konsentrasi | Efek Samping |
|---|---|---|
| 40-100mg | Meningkat ringan (10-20%) | Minimal |
| 100-300mg | Meningkat signifikan (20-40%) | Ringan (gelisah) |
| 300-400mg | Meningkat (15-25%) | Sedang (cemas, insomnia) |
| >400mg | Menurun (-5-10%) | Tinggi (jantung berdebar) |

---

## Metodologi

- **Sumber:** 12 artikel dari jurnal peer-reviewed (2020-2024)
- **Database:** PubMed, Semantic Scholar, Google Scholar
- **Verifikasi:** Setiap klaim diverifikasi dari minimal 2 sumber independen

---

*Example Research — FMA Labs Research*
`

const EXAMPLE_SOURCES = [
  { id: "1", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9023299/", title: "Caffeine and Cognitive Function — PMC", quality_score: 85 },
  { id: "2", url: "https://www.nature.com/articles/s41583-022-00678-6", title: "Nature Reviews Neuroscience — Caffeine", quality_score: 95 },
  { id: "3", url: "https://www.hsph.harvard.edu/nutritionsource/caffeine/", title: "Harvard — The Nutrition Source: Caffeine", quality_score: 95 },
  { id: "4", url: "https://www.hopkinsmedicine.org/health/wellness-and-prevention/caffeine-and-brain-function", title: "Johns Hopkins — Caffeine & Brain Function", quality_score: 90 },
  { id: "5", url: "https://ascpt.onlinelibrary.wiley.com/doi/10.1002/cpt.2156", title: "CYP1A2 Genotype & Caffeine Metabolism", quality_score: 85 },
  { id: "6", url: "https://link.springer.com/article/10.1007/s00213-022-06100-y", title: "Psychopharmacology — Caffeine Tolerance", quality_score: 80 },
]

const CONFIDENCE_SCORES = {
  "Kafein Meningkatkan Konsentrasi Jangka Pendek": { confidence: 0.94 },
  "Efek Bervariasi Berdasarkan Genetika": { confidence: 0.82 },
  "Toleransi Berkembang Dalam 3-5 Hari": { confidence: 0.78 },
  "Interaksi dengan Kurang Tidur": { confidence: 0.88 },
}

export default function ExampleResearchPage() {
  const router = useRouter()
  const [darkMode, setDarkMode] = useState(true)
  const bg = darkMode ? "bg-slate-950" : "bg-amber-50"
  const cardBg = darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-amber-200/50"
  const text = darkMode ? "text-white" : "text-slate-900"
  const muted = darkMode ? "text-slate-400" : "text-slate-500"

  return (
    <div className={`min-h-screen ${bg} ${text} transition-colors`}>
      <header className={`sticky top-0 z-10 border-b ${darkMode ? "bg-slate-950/90 border-slate-800" : "bg-white/90 border-amber-200/50"} backdrop-blur-sm`}>
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/register")} className={darkMode ? "text-white" : ""}>← Back</Button>
          <span className="font-medium truncate flex-1 text-sm">🔬 Example Research</span>
          <Button variant="ghost" size="sm" onClick={() => setDarkMode(!darkMode)} className={darkMode ? "text-white" : ""}>{darkMode ? "☀️" : "🌙"}</Button>
          <Button size="sm" onClick={() => router.push("/register")} className="bg-blue-600 hover:bg-blue-500 text-white text-xs h-7 px-3">Coba Gratis</Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        <div className="flex-1 space-y-6 min-w-0">
          <div className={`flex items-center gap-3 p-3 rounded-lg ${darkMode ? "bg-slate-900 border border-slate-800" : "bg-white border border-amber-200/50"}`}>
            <span className="text-2xl font-bold text-emerald-400">87%</span>
            <div className="flex-1">
              <div className="text-sm font-medium">Overall Confidence Score</div>
              <div className={`text-xs ${muted}`}>Berdasarkan verifikasi silang 12 sumber</div>
            </div>
            <div className="flex gap-1">
              {["#34d399", "#22c55e", "#fbbf24", "#f97316"].map((c, i) => (
                <div key={i} className="w-6 h-1.5 rounded-full" style={{ background: c, opacity: 1 - i * 0.15 }} />
              ))}
            </div>
          </div>

          <div className={`${cardBg} rounded-xl p-6`}>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{EXAMPLE_REPORT}</ReactMarkdown>
            </div>
          </div>
        </div>

        <aside className="w-72 shrink-0 hidden lg:block space-y-4">
          <div className={`${cardBg} rounded-xl p-4`}>
            <h3 className={`text-sm font-semibold mb-3 ${muted}`}>Sources ({EXAMPLE_SOURCES.length})</h3>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {EXAMPLE_SOURCES.map((s, i) => (
                <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer"
                  className={`block p-2 rounded-md text-xs truncate ${darkMode ? "hover:bg-slate-800 text-slate-300" : "hover:bg-amber-100 text-slate-600"} transition-colors`}>
                  <span className="text-[10px] text-slate-500 mr-1">{i+1}.</span>
                  {s.title}
                </a>
              ))}
            </div>
          </div>

          <div className={`${cardBg} rounded-xl p-4`}>
            <h3 className={`text-sm font-semibold mb-3 ${muted}`}>Confidence Scores</h3>
            <div className="space-y-2">
              {Object.entries(CONFIDENCE_SCORES).map(([claim, data]: [string, any]) => (
                <div key={claim} className="flex items-center gap-2">
                  <div className="flex-1 text-[11px] truncate">{claim}</div>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                    data.confidence > 0.8 ? "bg-emerald-100 text-emerald-700"
                    : data.confidence > 0.7 ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
                  }`}>{(data.confidence * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className={`${cardBg} rounded-xl p-4`}>
            <h3 className={`text-sm font-semibold mb-3 ${muted}`}>Start Your Own</h3>
            <p className={`text-xs mb-3 ${muted}`}>Daftar gratis, dapatkan $5 kredit untuk research pertamamu.</p>
            <Button size="sm" onClick={() => router.push("/register")} className="w-full bg-blue-600 hover:bg-blue-500 text-white">Coba Gratis</Button>
          </div>
        </aside>
      </main>
    </div>
  )
}
