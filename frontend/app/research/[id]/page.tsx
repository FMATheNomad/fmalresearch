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
import { ResearchWebSocket } from "@/lib/ws"

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
  const [darkMode, setDarkMode] = useState(false)
  const nodesRef = useRef<GraphNode[]>([])
  const edgesRef = useRef<GraphEdge[]>([])

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) { router.push("/login"); return }
    loadSession()
    const ws = new ResearchWebSocket()
    ws.connect(id)
    ws.on("tool_call", (data) => {
      const nodeId = `${data.tool}-${Date.now()}`
      const type = data.tool.startsWith("search") ? "search"
        : data.tool.startsWith("fetch") ? "fetch"
        : data.tool.startsWith("verify") ? "verify"
        : data.tool.startsWith("rerank") ? "rerank"
        : data.tool.startsWith("cache") ? "cache" : "claim"
      const prev = nodesRef.current
      const newNode: GraphNode = { id: nodeId, label: data.tool, type, status: data.status }
      const newEdge: GraphEdge | null = prev.length > 0 ? { source: prev[prev.length - 1].id, target: nodeId } : null
      nodesRef.current = [...prev, newNode]
      if (newEdge) edgesRef.current = [...edgesRef.current, newEdge]
      setNodes([...nodesRef.current])
      if (newEdge) setEdges([...edgesRef.current])
    })
    ws.on("report_chunk", (data) => setSession((prev: any) => prev ? { ...prev, report: (prev.report || "") + data.content } : prev))
    ws.on("complete", () => loadSession())
    const pollTimer = setInterval(loadSession, 5000)
    return () => { ws.disconnect(); clearInterval(pollTimer) }
  }, [id])

  async function loadSession() {
    try { const s = await api.research.get(id); setSession(s); setLoading(false) } catch { setLoading(false) }
  }

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
          <Badge variant={session.status === "completed" ? "success" : "warning"}>{session.status === "running" ? "Researching..." : session.status}</Badge>
          <span className={`text-xs ${muted}`}>${session.cost_incurred?.toFixed(4)}</span>
          <Button variant="ghost" size="sm" onClick={() => setDarkMode(!darkMode)} className={darkMode ? "text-white" : ""}>{darkMode ? "☀️" : "🌙"}</Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        <div className="flex-1 space-y-6 min-w-0">
          {session.status === "running" && (
            <Card className={cardBg}>
              <CardHeader className="pb-2"><CardTitle className={`text-sm ${muted}`}>Live Research Graph</CardTitle></CardHeader>
              <CardContent>
                <svg ref={svgRef} className="w-full border rounded-lg" style={{ height: 350, background: darkMode ? "#0f172a" : "#fff" }} />
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
            <CardHeader className="pb-2"><CardTitle className={`text-sm ${muted}`}>Sources</CardTitle></CardHeader>
            <CardContent className="text-sm">
              <div className={`${muted}`}>{session.sources_count > 0 ? `${session.sources_count} sources` : "No sources"}</div>
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
