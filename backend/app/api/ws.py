import json
import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.research import ResearchSession

router = APIRouter()

active_connections: dict[str, list[WebSocket]] = {}


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

            elif msg_type == "pause":
                await broadcast(session_id, {"type": "status", "status": "paused"})

            elif msg_type == "resume":
                await broadcast(session_id, {"type": "status", "status": "running"})

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


async def notify_tool_call(session_id: str, tool_name: str, status: str, data: dict | None = None):
    await broadcast(session_id, {
        "type": "tool_call",
        "tool": tool_name,
        "status": status,
        "data": data,
        "timestamp": __import__("datetime").datetime.utcnow().isoformat(),
    })


async def notify_report_chunk(session_id: str, chunk: str):
    await broadcast(session_id, {
        "type": "report_chunk",
        "content": chunk,
    })


async def notify_complete(session_id: str):
    await broadcast(session_id, {
        "type": "complete",
    })
