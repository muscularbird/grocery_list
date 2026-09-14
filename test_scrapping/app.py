from flask import Flask, request, jsonify
from playwright.sync_api import sync_playwright
import json
import re

app = Flask(__name__)


def wait_for_product_cards(page, timeout_ms=90000):
    selectors = [
        '[data-testid="product-list-grid__item"]',
        '[data-testid*="product-list-grid__item"]',
        '[data-testid*="product-card"]',
    ]

    elapsed = 0
    interval = 1000

    while elapsed < timeout_ms:
        for selector in selectors:
            cards = page.query_selector_all(selector)
            if cards:
                return cards

        page.wait_for_timeout(interval)
        elapsed += interval

    return []


def accept_cookie_banner(page):
    labels = [
        "Tout accepter",
        "Accepter",
        "Accept all",
    ]

    for label in labels:
        button = page.get_by_role("button", name=label)
        if button.count() > 0:
            button.first.click(timeout=2000)
            page.wait_for_timeout(1000)
            return True

    return False


def wait_for_challenge_to_clear(page, timeout_ms=90000):
    challenge_markers = [
        "just a moment",
        "enable javascript and cookies to continue",
    ]

    elapsed = 0
    interval = 1000

    while elapsed < timeout_ms:
        title = (page.title() or "").lower()
        content = (page.content() or "").lower()
        on_challenge = any(marker in title or marker in content for marker in challenge_markers)

        if not on_challenge:
            return True

        page.wait_for_timeout(interval)
        elapsed += interval

    return False


def extract_products_from_jsonld(page, max_items=10):
    extracted = []
    scripts = page.query_selector_all('script[type="application/ld+json"]')

    def append_product(product):
        if len(extracted) >= max_items:
            return
        name = (product.get("name") or "").strip()
        url = product.get("url") or ""
        offers = product.get("offers") or {}
        price = offers.get("price") or ""
        currency = offers.get("priceCurrency") or ""

        if not name:
            return

        full_price = f"{price} {currency}".strip() if price else ""
        extracted.append({
            "name": name,
            "price": full_price,
            "store": "Carrefour",
            "url": url,
        })

    for script in scripts:
        raw = script.inner_text()
        if not raw:
            continue

        try:
            payload = json.loads(raw)
        except json.JSONDecodeError:
            continue

        nodes = payload if isinstance(payload, list) else [payload]
        for node in nodes:
            if not isinstance(node, dict):
                continue

            item_type = node.get("@type")
            if item_type == "Product":
                append_product(node)

            if item_type == "ItemList":
                elements = node.get("itemListElement") or []
                for element in elements:
                    if isinstance(element, dict):
                        product = element.get("item") if "item" in element else element
                        if isinstance(product, dict) and product.get("@type") == "Product":
                            append_product(product)

            graph = node.get("@graph")
            if isinstance(graph, list):
                for graph_node in graph:
                    if isinstance(graph_node, dict) and graph_node.get("@type") == "Product":
                        append_product(graph_node)

            if len(extracted) >= max_items:
                return extracted

    return extracted


def extract_products_from_dom(page, max_items=10):
    js = r"""
() => {
    const seen = new Set();
    const out = [];

    const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
    const toAbs = (href) => {
        try { return new URL(href, location.origin).toString(); } catch { return href || ''; }
    };

    const findPrice = (root) => {
        if (!root) return '';
        const priceNode = root.querySelector('[data-testid="price"], [data-testid*="price"], [class*="price"]');
        if (priceNode) {
            const t = norm(priceNode.textContent);
            if (t) return t;
        }
        const txt = norm(root.textContent);
        const m = txt.match(/\b\d+[.,]\d{2}\s?€\b/);
        return m ? m[0] : '';
    };

    const titleSelectors = [
        'h2',
        'h3',
        '[data-testid*="title"]',
        '[data-testid*="label"]',
        '[class*="title"]',
        '[class*="label"]'
    ];

    const anchors = Array.from(document.querySelectorAll('a[href*="/p/"]'));
    for (const a of anchors) {
        const href = a.getAttribute('href') || '';
        if (!href) continue;

        const absUrl = toAbs(href);
        if (seen.has(absUrl)) continue;

        const card = a.closest('[data-testid*="product"], article, li, div') || a;

        let name = '';
        for (const sel of titleSelectors) {
            const el = card.querySelector(sel);
            if (el) {
                name = norm(el.textContent);
                if (name) break;
            }
        }
        if (!name) name = norm(a.textContent);
        if (!name || name.length < 2) continue;

        const price = findPrice(card);

        seen.add(absUrl);
        out.push({
            name,
            price,
            store: 'Carrefour',
            url: absUrl,
        });

        if (out.length >= 10) break;
    }

    return out;
}
"""

    try:
        products = page.evaluate(js)
    except Exception:
        return []

    if not isinstance(products, list):
        return []

    return products[:max_items]


def extract_price_from_text(element):
    text = element.inner_text().strip()
    price_patterns = [
        r"\d+[.,]\d{2}\s?€",   # 2,39€ or 2.39 €
        r"\d+\s?€\s?\d{2}",    # 2€39 or 2 € 39
        r"€\s?\d+[.,]\d{2}",    # €2,39 or € 2.39
    ]

    for pattern in price_patterns:
        match = re.search(pattern, text)
        if match:
            return match.group(0)

    return ""

def scrape_carrefour(query):
    results = []
    debug = {
        "challenge_cleared": False,
        "page_title": "",
        "current_url": "",
        "product_count": 0,
        "cookie_clicked": False,
    }

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=False,
            slow_mo=150,
            args=["--disable-blink-features=AutomationControlled"],
        )
        context = browser.new_context(
            locale="fr-FR",
            timezone_id="Europe/Paris",
            viewport={"width": 1440, "height": 2000},
            user_agent=(
                "Mozilla/5.0 (X11; Linux x86_64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
        )
        page = context.new_page()

        # Warm up session before search to reduce challenge/cookie interruptions.
        page.goto("https://www.carrefour.fr/", timeout=60000, wait_until="domcontentloaded")
        debug["cookie_clicked"] = accept_cookie_banner(page)

        search_url = f"https://www.carrefour.fr/s?q={query}"
        page.goto(search_url, timeout=60000, wait_until="domcontentloaded")
        page.wait_for_load_state("networkidle", timeout=60000)

        # Carrefour can return a Cloudflare challenge page before the real content.
        if not wait_for_challenge_to_clear(page):
            debug["page_title"] = page.title()
            debug["current_url"] = page.url
            browser.close()
            return results, debug

        debug["challenge_cleared"] = True

        page.wait_for_timeout(2000)
        products = wait_for_product_cards(page)

        debug["product_count"] = len(products)
        debug["page_title"] = page.title()
        debug["current_url"] = page.url

        for product in products[:10]:  # limit results
            name_el = (
                product.query_selector("h2")
                or product.query_selector("h3")
                or product.query_selector('[data-testid*="title"]')
                or product.query_selector('[data-testid*="label"]')
            )
            link_el = product.query_selector('a[href*="/p/"]') or product.query_selector("a")

            if not name_el or not link_el:
                continue

            link = link_el.get_attribute("href")
            if not link:
                continue

            if link.startswith("/"):
                full_url = f"https://www.carrefour.fr{link}"
            else:
                full_url = link

            price_el = product.query_selector('[data-testid="price"]') or product.query_selector(
                '[data-testid*="price"]'
            )
            if not price_el:
                price_el = product.query_selector('[class*="price"]')
            if not price_el:
                price_el = product.query_selector('[class*="amount"]')
            price = price_el.inner_text().strip() if price_el else extract_price_from_text(product)

            results.append(
                {
                    "name": name_el.inner_text().strip(),
                    "price": price,
                    "store": "Carrefour",
                    "url": full_url,
                }
            )

        # If products are found but some prices are missing, enrich them via fallback sources.
        if results and any(not item.get("price") for item in results):
            dom_fallback = extract_products_from_dom(page, max_items=20)
            dom_price_by_url = {
                item.get("url"): item.get("price")
                for item in dom_fallback
                if item.get("url") and item.get("price")
            }

            for item in results:
                if not item.get("price") and item.get("url") in dom_price_by_url:
                    item["price"] = dom_price_by_url[item["url"]]

        if results and any(not item.get("price") for item in results):
            jsonld_fallback = extract_products_from_jsonld(page, max_items=20)
            jsonld_price_by_url = {
                item.get("url"): item.get("price")
                for item in jsonld_fallback
                if item.get("url") and item.get("price")
            }

            for item in results:
                if not item.get("price") and item.get("url") in jsonld_price_by_url:
                    item["price"] = jsonld_price_by_url[item["url"]]

        if not results:
            results = extract_products_from_dom(page, max_items=10)

        if not results:
            results = extract_products_from_jsonld(page, max_items=10)

        debug["product_count"] = len(results)

        browser.close()

    return results, debug


@app.route("/search", methods=["POST"])
def search():
    data = request.json
    query = data.get("query")

    if not query:
        return jsonify({"error": "Missing query"}), 400

    results, debug = scrape_carrefour(query)

    return jsonify({
        "results": results,
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)