from fastapi import APIRouter
from fastapi.responses import Response
from app.database import get_db
from datetime import datetime

router = APIRouter(tags=["SEO"])

SITE_URL = "https://aabhooshanbazaar.com"


@router.get("/sitemap.xml")
async def sitemap_xml():
    conn = get_db()
    today = datetime.now().strftime("%Y-%m-%d")

    urls = []

    # Static pages
    static_pages = [
        {"loc": "/", "priority": "1.0", "changefreq": "daily"},
        {"loc": "/categories", "priority": "0.9", "changefreq": "weekly"},
        {"loc": "/gold-rate", "priority": "0.9", "changefreq": "daily"},
        {"loc": "/blog", "priority": "0.9", "changefreq": "daily"},
        {"loc": "/about", "priority": "0.5", "changefreq": "monthly"},
        {"loc": "/contact", "priority": "0.5", "changefreq": "monthly"},
        {"loc": "/privacy", "priority": "0.3", "changefreq": "yearly"},
        {"loc": "/disclaimer", "priority": "0.3", "changefreq": "yearly"},
        {"loc": "/terms", "priority": "0.3", "changefreq": "yearly"},
    ]
    for p in static_pages:
        urls.append(f"""  <url>
    <loc>{SITE_URL}{p["loc"]}</loc>
    <lastmod>{today}</lastmod>
    <changefreq>{p["changefreq"]}</changefreq>
    <priority>{p["priority"]}</priority>
  </url>""")

    # Category pages
    categories = conn.execute(
        "SELECT slug, created_at FROM categories WHERE is_active = 1 ORDER BY sort_order ASC"
    ).fetchall()
    for cat in categories:
        c = dict(cat)
        lastmod = c.get("created_at", today)
        if lastmod:
            lastmod = lastmod[:10]
        else:
            lastmod = today
        urls.append(f"""  <url>
    <loc>{SITE_URL}/category/{c["slug"]}</loc>
    <lastmod>{lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>""")

    # Design pages
    designs = conn.execute(
        "SELECT slug, updated_at, created_at FROM designs WHERE is_active = 1 ORDER BY created_at DESC"
    ).fetchall()
    for d in designs:
        dd = dict(d)
        lastmod = dd.get("updated_at") or dd.get("created_at") or today
        if lastmod:
            lastmod = lastmod[:10]
        else:
            lastmod = today
        urls.append(f"""  <url>
    <loc>{SITE_URL}/design/{dd["slug"]}</loc>
    <lastmod>{lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>""")

    # Blog pages
    blogs = conn.execute(
        "SELECT slug, updated_at, created_at FROM blogs WHERE is_published = 1 ORDER BY created_at DESC"
    ).fetchall()
    for b in blogs:
        bb = dict(b)
        lastmod = bb.get("updated_at") or bb.get("created_at") or today
        if lastmod:
            lastmod = lastmod[:10]
        else:
            lastmod = today
        urls.append(f"""  <url>
    <loc>{SITE_URL}/blog/{bb["slug"]}</loc>
    <lastmod>{lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>""")

    conn.close()

    xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{chr(10).join(urls)}
</urlset>"""

    return Response(content=xml, media_type="application/xml")


@router.get("/robots.txt")
async def robots_txt():
    content = """User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: https://aabhooshanbazaar.com/sitemap.xml

User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /
"""
    return Response(content=content, media_type="text/plain")
