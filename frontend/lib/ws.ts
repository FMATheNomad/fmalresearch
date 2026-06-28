type MessageHandler = (data: any) => void;

function getWsBase(): string {
  if (typeof window === "undefined") return "ws://localhost:8000";
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}/api/ws`;
}

export class ResearchWebSocket {
  private ws: WebSocket | null = null;
  private handlers: Map<string, MessageHandler[]> = new Map();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  connect(sessionId: string) {
    const url = `wss://fmalresearch.up.railway.app/api/ws/research/${sessionId}`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => this.emit("connected", {});
    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.emit(data.type, data);
      } catch {}
    };
    this.ws.onclose = () => {
      this.emit("disconnected", {});
      this.reconnectTimer = setTimeout(() => this.connect(sessionId), 3000);
    };
    this.ws.onerror = () => this.ws?.close();
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
  }

  send(data: Record<string, any>) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  on(type: string, handler: MessageHandler) {
    if (!this.handlers.has(type)) this.handlers.set(type, []);
    this.handlers.get(type)!.push(handler);
    return () => this.off(type, handler);
  }

  off(type: string, handler: MessageHandler) {
    const h = this.handlers.get(type);
    if (h) this.handlers.set(type, h.filter((fn) => fn !== handler));
  }

  private emit(type: string, data: any) {
    this.handlers.get(type)?.forEach((fn) => fn(data));
    this.handlers.get("*")?.forEach((fn) => fn(data));
  }
}
