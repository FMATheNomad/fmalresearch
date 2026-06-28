"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import * as d3 from "d3"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import DOMPurify from "dompurify"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { api } from "@/lib/api"

function ConfidenceGauge({ score, size = 36 }: { score: number; size?: number }) {
  const r = (size - 8) / 2
  const cx = size / 2
  const cy = size / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference - (Math.min(Math.max(score, 0), 1) * circumference)
  const hue = score * 120
  const stroke = `hsl(${hue}, 80%, 50%)`

  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={3} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={stroke} strokeWidth={3}
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`}
        className="transition-all duration-700" />
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
        fill="#fff" fontSize={size > 30 ? 10 : 8} fontWeight={600}>
        {(score * 100).toFixed(0)}%
      </text>
    </svg>
  )
}

type GraphNode = { id: string; label: string; type: string; status: string }
type GraphEdge = { source: string; target: string }

const NODE_COLORS: Record<string, string> = {
  search: "#3b82f6", fetch: "#22c55e", verify: "#a855f7",
  rerank: "#f59e0b", cache: "#06b6d4", claim: "#ef4444",
}

export default function ResearchDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const svgRef = useRef<SVGSVGElement>(null)
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [nodes, setNodes] = useState<GraphNode[]>([])
  const [edges, setEdges] = useState<GraphEdge[]>([])
  const [darkMode, setDarkMode] = useState(true)
  const [sources, setSources] = useState<any[]>([])
  const [progress, setProgress] = useState<string[]>([])
  const nodesRef = useRef<GraphNode[]>([])
  const edgesRef = useRef<GraphEdge[]>([])

  const sessionRef = useRef<any>(null)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) { router.push("/login"); return }

    const steps = ["search", "fetch", "verify", "rerank", "cache"]
    let stepIdx = 0

    const progressMsgs = [
      "Searching web & academic sources...",
      "Fetching content from sources...",
      "Cross-referencing claims...",
      "Reranking by relevance...",
      "Verifying key facts...",
      "Detecting conflicting claims...",
      "Calculating confidence scores...",
      "Synthesizing final report...",
    ]
    let progIdx = 0

    const poll = async () => {
      try {
        const s = await api.research.get(id)
        setSession(s)
        setLoading(false)
        sessionRef.current = s

        if (s.status === "running") {
          const step = steps[stepIdx % steps.length]
          stepIdx++
          const nodeId = `${step}-${Date.now()}`
          const newNode: GraphNode = { id: nodeId, label: step, type: step, status: "running" }
          const prev = nodesRef.current
          const newEdge = prev.length > 0 ? { source: prev[prev.length - 1].id, target: nodeId } : null
          nodesRef.current = [...prev, newNode]
          if (newEdge) edgesRef.current = [...edgesRef.current, newEdge]
          setNodes([...nodesRef.current])
          if (newEdge) setEdges([...edgesRef.current])

          if (stepIdx % 2 === 0) {
            setProgress(prev => [...prev.slice(-5), `> ${progressMsgs[progIdx % progressMsgs.length]}`])
            progIdx++
          }
        }

        if (s.status === "completed") {
          try { const src = await api.research.sources(id); setSources(src) } catch {}
          const completed = nodesRef.current.map(n => ({ ...n, status: "completed" }))
          nodesRef.current = completed
          setNodes([...nodesRef.current])
          setProgress(prev => [...prev, "> ✅ Research complete!"])
        }
      } catch { setLoading(false) }
    }

    poll()
    const pollTimer = setInterval(poll, 3000)
    return () => clearInterval(pollTimer)
  }, [id])

  const drawGraph = useCallback(() => {
    if (!svgRef.current || nodes.length === 0) return
    const svg = d3.select(svgRef.current); svg.selectAll("*").remove()
    const width = svgRef.current.clientWidth || 600; const height = 350
    const simulation = d3.forceSimulation(nodes as any)
      .force("link", d3.forceLink(edges).id((d: any) => d.id).distance(120))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
    const link = svg.append("g").selectAll("line").data(edges).join("line").attr("stroke", "#94a3b8").attr("stroke-opacity", 0.5).attr("stroke-width", 1.5)
    const node = svg.append("g").selectAll("circle").data(nodes).join("circle").attr("r", 6).attr("fill", (d) => NODE_COLORS[d.type] || "#64748b").attr("stroke", "#fff").attr("stroke-width", 2)
    node.append("title").text((d: any) => `${d.label}: ${d.status}`)
    svg.append("g").selectAll("text").data(nodes).join("text").text((d: any) => d.label).attr("font-size", "9px").attr("dx", 10).attr("dy", 3)
    simulation.on("tick", () => {
      link.attr("x1", (d: any) => d.source.x).attr("y1", (d: any) => d.source.y).attr("x2", (d: any) => d.target.x).attr("y2", (d: any) => d.target.y)
      node.attr("cx", (d: any) => d.x).attr("cy", (d: any) => d.y)
      svg.select("g").selectAll("text").attr("x", (d: any) => d.x).attr("y", (d: any) => d.y)
    })
  }, [nodes, edges])
  useEffect(() => { drawGraph() }, [nodes])

  if (loading) return <div className="min-h-screen flex items-center justify-center text-lg animate-pulse bg-slate-950 text-white">Loading research...</div>
  if (!session) return <div className="min-h-screen flex items-center justify-center bg-slate-950"><Button onClick={() => router.push("/dashboard")} className="bg-white/10 text-white">Back</Button></div>

  const bg = darkMode ? "bg-slate-950" : "bg-amber-50"
  const cardBg = darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-amber-200/50"
  const text = darkMode ? "text-white" : "text-slate-900"
  const muted = darkMode ? "text-slate-400" : "text-slate-500"

  return (
    <div className={`min-h-screen ${bg} ${text} transition-colors`}>
      <header className={`sticky top-0 z-10 border-b ${darkMode ? "bg-slate-950/90 border-slate-800" : "bg-white/90 border-amber-200/50"} backdrop-blur-sm`}>
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")} className={darkMode ? "text-white" : ""}>←</Button>
          <span className="font-medium truncate flex-1 text-sm">{session.query}</span>
          <div className="flex items-center gap-2">
            {session.status === "completed" && session.confidence_scores && Object.keys(session.confidence_scores).length > 0 ? (
              <ConfidenceGauge score={(Object.values(session.confidence_scores as Record<string, {confidence: number}>) || []).reduce((a: number, b) => a + (b.confidence || 0), 0) / Math.max(Object.keys(session.confidence_scores).length, 1)} />
            ) : session.status === "running" ? (
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                <span className="text-[10px] text-blue-400 font-mono">Researching</span>
              </div>
            ) : null}
          </div>
          <span className={`text-xs ${muted}`}>${session.cost_incurred?.toFixed(4)}</span>
          <span className={`text-[10px] ${muted}`}>{session.sources_count} src</span>
          <Button variant="ghost" size="sm" onClick={() => setDarkMode(!darkMode)} className={darkMode ? "text-white" : ""}>{darkMode ? "☀️" : "🌙"}</Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        <div className="flex-1 space-y-6 min-w-0">
          {session.status === "running" && (
            <Card className={cardBg}>
              <CardHeader className="pb-2"><CardTitle className={`text-sm ${muted}`}>Live Research</CardTitle></CardHeader>
              <CardContent>
                <svg ref={svgRef} className="w-full border rounded-lg" style={{ height: 250, background: darkMode ? "#0f172a" : "#fff" }} />
                <div className={`mt-3 p-3 rounded-lg text-xs font-mono ${darkMode ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"}`}>
                  {progress.length === 0 ? (
                    <p className="text-slate-500">Starting research...</p>
                  ) : (
                    progress.slice(-6).map((m, i) => (
                      <p key={i} className="leading-6">{m}</p>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {session.confidence_scores && Object.keys(session.confidence_scores).length > 0 && (
            <Card className={cardBg}>
              <CardHeader className="pb-2"><CardTitle className={`text-sm ${muted}`}>Confidence Scores</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {Object.entries(session.confidence_scores).slice(0, 10).map(([claim, data]: [string, any]) => (
                    <div key={claim} className={`flex items-center gap-3 p-2.5 rounded-lg text-sm ${darkMode ? "bg-slate-800" : "bg-amber-100/50"}`}>
                      <span className="flex-1 truncate">{claim}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        data.confidence > 0.7 ? "bg-green-100 text-green-700"
                        : data.confidence > 0.4 ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                      }`}>{(data.confidence * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className={cardBg}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className={`text-sm ${muted}`}>Research Report</CardTitle>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className={`text-xs ${muted}`} onClick={() => {
                  if (session.report) navigator.clipboard.writeText(session.report)
                }}>Copy</Button>
              </div>
            </CardHeader>
            <CardContent>
              {session.report ? (
                <div className={`prose prose-sm max-w-none ${darkMode ? "prose-invert" : ""}`}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {DOMPurify.sanitize(session.report)}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className={`text-center py-12 ${muted} text-sm`}>
                  {session.status === "running" ? "Research in progress..." : "No report generated."}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="w-72 shrink-0 hidden lg:block space-y-4">
          <Card className={cardBg}>
            <CardHeader className="pb-2"><CardTitle className={`text-sm ${muted}`}>Sources ({session.sources_count})</CardTitle></CardHeader>
            <CardContent className="text-sm max-h-80 overflow-y-auto space-y-1.5">
              {sources.length > 0 ? sources.slice(0, 20).map((s, i) => (
                <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer"
                  className={`block p-2 rounded-md text-xs truncate ${darkMode ? "hover:bg-slate-800 text-slate-300" : "hover:bg-amber-100 text-slate-600"} transition-colors`}>
                  <span className="text-[10px] text-slate-500 mr-1">{i+1}.</span>
                  {s.title || s.url}
                </a>
              )) : <div className={`${muted}`}>{session.sources_count > 0 ? `${session.sources_count} sources` : "No sources"}</div>}
            </CardContent>
          </Card>
          <Card className={cardBg}>
            <CardHeader className="pb-2"><CardTitle className={`text-sm ${muted}`}>Export</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className={`w-full ${darkMode ? "bg-transparent border-slate-700 text-white" : "bg-white"}`}
                onClick={() => { if (session.report) navigator.clipboard.writeText(session.report) }}>Copy Text</Button>
              <Button variant="outline" size="sm" className={`w-full ${darkMode ? "bg-transparent border-slate-700 text-white" : "bg-white"}`}
                onClick={() => window.open(`/research/${id}/export`, "_blank")}>Download MD</Button>
            </CardContent>
          </Card>
          <Card className={cardBg}>
            <CardHeader className="pb-2"><CardTitle className={`text-sm ${muted}`}>Meta</CardTitle></CardHeader>
            <CardContent className={`text-xs space-y-1 ${muted}`}>
              <p>Cost: ${session.cost_incurred?.toFixed(4)}</p>
              <p>Status: {session.status}</p>
              <p>Sources: {session.sources_count}</p>
            </CardContent>
          </Card>
        </aside>
      </main>
    </div>
  )
}
