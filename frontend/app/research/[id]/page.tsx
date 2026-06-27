"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import * as d3 from "d3"
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

function renderReport(text: string) {
  if (!text) return ""
  return text
    .replace(/### (.+)/g, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '</p><p class="mb-3 leading-relaxed">')
    .replace(/\n/g, '<br/>')
}

export default function ResearchDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const svgRef = useRef<SVGSVGElement>(null)
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [nodes, setNodes] = useState<GraphNode[]>([])
  const [edges, setEdges] = useState<GraphEdge[]>([])
  const [activeSource, setActiveSource] = useState<any>(null)
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
        : data.tool.startsWith("cache") ? "cache"
        : "claim"

      const prev = nodesRef.current
      const newNode: GraphNode = { id: nodeId, label: data.tool, type, status: data.status }
      const newEdge: GraphEdge | null = prev.length > 0
        ? { source: prev[prev.length - 1].id, target: nodeId }
        : null

      nodesRef.current = [...prev, newNode]
      if (newEdge) edgesRef.current = [...edgesRef.current, newEdge]
      setNodes([...nodesRef.current])
      if (newEdge) setEdges([...edgesRef.current])
    })

    ws.on("report_chunk", (data) => {
      setSession((prev: any) => prev ? { ...prev, report: (prev.report || "") + data.content } : prev)
    })

    ws.on("complete", () => { loadSession() })

    const pollTimer = setInterval(loadSession, 5000)
    return () => { ws.disconnect(); clearInterval(pollTimer) }
  }, [id])

  async function loadSession() {
    try {
      const s = await api.research.get(id)
      setSession(s)
      setLoading(false)
    } catch { setLoading(false) }
  }

  const drawGraph = useCallback(() => {
    if (!svgRef.current || nodes.length === 0) return
    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const width = svgRef.current.clientWidth || 600
    const height = 350

    const simulation = d3.forceSimulation(nodes as any)
      .force("link", d3.forceLink(edges).id((d: any) => d.id).distance(120))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))

    const link = svg.append("g").selectAll("line").data(edges).join("line")
      .attr("stroke", "#94a3b8").attr("stroke-opacity", 0.5).attr("stroke-width", 1.5)

    const node = svg.append("g").selectAll("circle").data(nodes).join("circle")
      .attr("r", 6).attr("fill", (d) => NODE_COLORS[d.type] || "#64748b")
      .attr("stroke", "#fff").attr("stroke-width", 2)

    node.append("title").text((d: any) => `${d.label}: ${d.status}`)

    svg.append("g").selectAll("text").data(nodes).join("text")
      .text((d: any) => d.label).attr("font-size", "9px").attr("dx", 10).attr("dy", 3)

    simulation.on("tick", () => {
      link.attr("x1", (d: any) => d.source.x).attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x).attr("y2", (d: any) => d.target.y)
      node.attr("cx", (d: any) => d.x).attr("cy", (d: any) => d.y)
      svg.select("g").selectAll("text").attr("x", (d: any) => d.x).attr("y", (d: any) => d.y)
    })
  }, [nodes, edges])

  useEffect(() => { drawGraph() }, [nodes])

  if (loading) return <div className="min-h-screen flex items-center justify-center text-lg animate-pulse">Loading research...</div>
  if (!session) return <div className="min-h-screen flex items-center justify-center"><Button onClick={() => router.push("/dashboard")}>Back</Button></div>

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>←</Button>
          <span className="font-medium truncate flex-1 text-sm">{session.query}</span>
          <Badge variant={session.status === "completed" ? "success" : "warning"}>
            {session.status === "running" ? "Researching..." : session.status}
          </Badge>
          <span className="text-xs text-muted-foreground">${session.cost_incurred?.toFixed(4)}</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        <div className="flex-1 space-y-6 min-w-0">
          {session.status === "running" && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Live Research Graph</CardTitle></CardHeader>
              <CardContent>
                <svg ref={svgRef} className="w-full border rounded-lg bg-white" style={{ height: 350 }} />
                <div className="flex gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                  <span>🔍 Search</span><span>📄 Fetch</span><span>✅ Verify</span><span>📊 Rerank</span><span>💾 Cache</span>
                </div>
              </CardContent>
            </Card>
          )}

          {session.confidence_scores && Object.keys(session.confidence_scores).length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Confidence Scores</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {Object.entries(session.confidence_scores).slice(0, 10).map(([claim, data]: [string, any]) => (
                    <div key={claim} className="flex items-center gap-3 p-2 rounded border bg-white text-sm">
                      <span className="flex-1 truncate">{claim}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
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

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Research Report</CardTitle></CardHeader>
            <CardContent>
              {session.report ? (
                <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: `<p>${renderReport(session.report)}</p>` }} />
              ) : (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  {session.status === "running" ? "Research in progress..." : "No report generated."}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="w-72 shrink-0 hidden lg:block space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Sources ({session.sources_count})</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {session.sources_count > 0 ? "Sources available" : "No sources"}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Export</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full" onClick={() => {
                if (session.report) { navigator.clipboard.writeText(session.report) }
              }}>Copy Text</Button>
              <Button variant="outline" size="sm" className="w-full" onClick={() => {
                const url = `${window.location.origin}/research/${id}/export`
                window.open(url, "_blank")
              }}>Download MD</Button>
            </CardContent>
          </Card>
        </aside>
      </main>
    </div>
  )
}
