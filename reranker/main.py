from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import CrossEncoder
import numpy as np

app = FastAPI(title="BGE Reranker")

model = None


class RerankRequest(BaseModel):
    query: str
    documents: list[str]


class RerankResponse(BaseModel):
    scores: list[float]


@app.on_event("startup")
async def startup():
    global model
    model = CrossEncoder("BAAI/bge-reranker-v2-m3", trust_remote_code=True)


@app.post("/rerank", response_model=RerankResponse)
async def rerank(req: RerankRequest):
    pairs = [[req.query, doc] for doc in req.documents]
    scores = model.predict(pairs)
    if isinstance(scores, np.ndarray):
        scores = scores.tolist()
    if isinstance(scores, float):
        scores = [scores]
    return RerankResponse(scores=scores)


@app.get("/health")
async def health():
    return {"status": "ok", "model": "BAAI/bge-reranker-v2-m3"}
