import asyncio
import httpx
from app.core.config import get_settings

settings = get_settings()

_crawl_semaphore = asyncio.Semaphore(settings.max_concurrent_crawls)


async def fetch(url: str) -> dict | None:
    async with _crawl_semaphore:
        try:
            async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
                resp = await client.get(
                    url,
                    headers={
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
                        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                        "Accept-Language": "en-US,en;q=0.5",
                    },
                )
                resp.raise_for_status()
                content_type = resp.headers.get("content-type", "")
                if "text/html" not in content_type and "application/json" not in content_type:
                    return None

                text = resp.text
                title = extract_title(text)

                return {
                    "url": url,
                    "title": title,
                    "content": text[:50000],
                    "status_code": resp.status_code,
                }

        except Exception as e:
            return None


def extract_title(html: str) -> str:
    import re
    match = re.search(r'<title[^>]*>(.*?)</title>', html, re.IGNORECASE | re.DOTALL)
    return match.group(1).strip() if match else ""
