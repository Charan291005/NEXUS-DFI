"""News router — Fetches real-time cyber intelligence from RSS feeds."""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
import requests
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta
from starlette.concurrency import run_in_threadpool

router = APIRouter()

# Simple in-memory cache to avoid spamming the RSS feed
_CACHE = {
    "data": [],
    "last_fetched": None
}
CACHE_TTL_MINUTES = 15

class NewsArticle(BaseModel):
    title: str
    link: str
    pub_date: str
    description: str

def _fetch_rss_sync():
    """Synchronous network and parsing operation."""
    articles = []
    # Fetch The Hacker News RSS feed
    url = "https://feeds.feedburner.com/TheHackersNews"
    headers = {"User-Agent": "NexusDFI/2.5.0"}
    response = requests.get(url, headers=headers, timeout=5)
    response.raise_for_status()

    root = ET.fromstring(response.content)
    # Parse standard RSS 2.0 format
    for item in root.findall(".//item")[:6]:  # Get top 6 articles
        title = item.find("title")
        link = item.find("link")
        pub_date = item.find("pubDate")
        desc = item.find("description")

        # Clean up description (remove HTML tags if any)
        clean_desc = ""
        if desc is not None and desc.text:
            import re
            clean_desc = re.sub('<[^<]+?>', '', desc.text)
            clean_desc = clean_desc[:150] + "..." if len(clean_desc) > 150 else clean_desc

        articles.append(NewsArticle(
            title=title.text if title is not None else "No Title",
            link=link.text if link is not None else "#",
            pub_date=pub_date.text if pub_date is not None else "",
            description=clean_desc
        ))
    return articles

@router.get("", response_model=List[NewsArticle])
async def get_latest_news():
    global _CACHE
    now = datetime.utcnow()

    # Return cached data if valid
    if _CACHE["data"] and _CACHE["last_fetched"]:
        if now - _CACHE["last_fetched"] < timedelta(minutes=CACHE_TTL_MINUTES):
            return _CACHE["data"]

    try:
        # Offload blocking network call to threadpool
        articles = await run_in_threadpool(_fetch_rss_sync)
        
        # Update cache
        _CACHE["data"] = articles
        _CACHE["last_fetched"] = now
        return articles

    except Exception as e:
        print(f"[ERROR] Failed to fetch news feed: {e}")
        # If cache exists but is stale, fallback to stale cache
        if _CACHE["data"]:
            return _CACHE["data"]
        # Otherwise return empty list (frontend handles empty state)
        return []
