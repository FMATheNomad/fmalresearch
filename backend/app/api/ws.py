import json
from datetime import datetime, timezone
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.core.logging import get_logger

logger = get_logger("ws")
router = APIRouter()

active_connections: dict[str, list[WebSocket]] = {}
research_controls: dict[str, dict] = {}


@router.websocket("/ws/research/{session_id}")
async def research_websocket(websocket: WebSocket, session_id: str):
    await websocket.accept()

    if session_id not in active_connections:
        active_connections[session_id] = []
    active_connections[session_id].append(websocket)

    try:
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)
            msg_type = msg.get("type", "")

            if msg_type == "ping":
                await websocket.send_json({"type": "pong"})

            elif msg_type in ("pause", "resume", "cancel", "redirect"):
                if session_id not in research_controls:
                    research_controls[session_id] = {}
                research_controls[session_id][msg_type] = msg.get("value", True)
                await broadcast(session_id, {"type": "status", "status": msg_type, "value": msg.get("value", "")})
                logger.info("research_control", session_id=session_id, action=msg_type)

    except WebSocketDisconnect:
        if session_id in active_connections:
            active_connections[session_id].remove(websocket)
            if not active_connections[session_id]:
                del active_connections[session_id]


async def broadcast(session_id: str, message: dict):
    if session_id not in active_connections:
        return
    dead = []
    for ws in active_connections[session_id]:
        try:
            await ws.send_json(message)
        except Exception:
            dead.append(ws)
    for ws in dead:
        active_connections[session_id].remove(ws)


async def check_control(session_id: str) -> str | None:
    controls = research_controls.get(session_id)
    if not controls:
        return None
    if controls.get("cancel"):
        return "cancelled"
    if controls.get("pause"):
        return "paused"
    return None


async def clear_control(session_id: str, action: str):
    if session_id in research_controls:
        research_controls[session_id].pop(action, None)


async def notify_tool_call(session_id: str, tool_name: str, status: str, data: dict | None = None):
    await broadcast(session_id, {
        "type": "tool_call",
        "tool": tool_name,
        "status": status,
        "data": data,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })


async def notify_report_chunk(session_id: str, chunk: str):
    await broadcast(session_id, {"type": "report_chunk", "content": chunk})


async def notify_complete(session_id: str):
    await broadcast(session_id, {"type": "complete"})
