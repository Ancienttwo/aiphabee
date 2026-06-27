import json
import os
import re
from datetime import datetime
from datetime import timedelta
from html import unescape
from urllib.parse import urlencode
from urllib.parse import urljoin
from urllib.parse import urlparse

import scrapy
from scrapy.http import TextResponse

from data_ingest.hkex.items import DocumentItem


IPO_TITLE_SEARCH_QUERIES = [
    {
        "label": "phip",
        "t1code": "91000",
        "t2Gcode": "-1",
        "t2code": "91100",
    },
    {
        "label": "application_proof",
        "t1code": "91000",
        "t2Gcode": "-1",
        "t2code": "91200",
    },
    {
        "label": "oc_announcement",
        "t1code": "91000",
        "t2Gcode": "-1",
        "t2code": "91300",
    },
    {
        "label": "allotment_results",
        "t1code": "10000",
        "t2Gcode": "5",
        "t2code": "15100",
    },
    {
        "label": "formal_notice",
        "t1code": "10000",
        "t2Gcode": "5",
        "t2code": "15200",
    },
    {
        "label": "supplemental_ipo",
        "t1code": "10000",
        "t2Gcode": "5",
        "t2code": "15500",
    },
    {
        "label": "transfer_gem_main",
        "t1code": "10000",
        "t2Gcode": "5",
        "t2code": "15600",
    },
    {
        "label": "offer_subscription",
        "t1code": "30000",
        "t2Gcode": "-1",
        "t2code": "30700",
    },
    {
        "label": "supplementary_listing_document",
        "t1code": "30000",
        "t2Gcode": "-1",
        "t2code": "31200",
    },
]


class HkexNewsSpider(scrapy.Spider):
    name = "hkex_news"
    allowed_domains = ["hkexnews.hk", "www1.hkexnews.hk"]
    base_url = "https://www1.hkexnews.hk"
    title_search_endpoint = "https://www1.hkexnews.hk/search/titleSearchServlet.do"

    def __init__(
        self,
        crawl_run_id,
        data_version,
        source_surface="title_search",
        start_url=None,
        *args,
        **kwargs,
    ):
        super().__init__(*args, **kwargs)
        self.crawl_run_id = crawl_run_id
        self.data_version = data_version
        self.source_surface = source_surface
        self.business_date = business_date_from_run_id(crawl_run_id)
        self.lookback_days = int(os.environ.get("DATA_INGEST_HKEX_LOOKBACK_DAYS", "0"))
        self.row_range = int(os.environ.get("DATA_INGEST_HKEX_ROW_RANGE", "20"))
        self.query_scope = os.environ.get("DATA_INGEST_HKEX_QUERY_SCOPE", "ipo")
        self.start_urls = [
            start_url
            or "https://www1.hkexnews.hk/search/titlesearch.xhtml?lang=en"
        ]
        if start_url:
            parsed = urlparse(start_url)
            if parsed.hostname in {"127.0.0.1", "localhost"}:
                self.allowed_domains = [*self.allowed_domains, parsed.hostname]

    def parse(self, response):
        if "titleSearchServlet.do" in response.url:
            yield from self.parse_title_search_result(response)
            return

        if self.business_date:
            from_date, to_date = date_range(self.business_date, self.lookback_days)
            for query_profile in title_search_queries(self.query_scope):
                yield scrapy.Request(
                    self.title_search_url(from_date, to_date, query_profile),
                    callback=self.parse_title_search_result,
                    meta={
                        "query_label": query_profile["label"],
                        "source_page_url": response.url,
                    },
                )
            return

        for rank, href in enumerate(response.css("a::attr(href)").getall(), start=1):
            url = urljoin(response.url, href)
            if not is_candidate_document_url(url):
                continue
            yield response.follow(
                url,
                callback=self.parse_document,
                meta={"source_page_url": response.url, "result_rank": rank},
            )

    def title_search_url(self, from_date, to_date, query_profile):
        query = {
            "sortDir": "0",
            "sortByOptions": "DateTime",
            "category": "0",
            "market": "SEHK",
            "stockId": "",
            "documentType": "-1",
            "fromDate": from_date.replace("-", ""),
            "toDate": to_date.replace("-", ""),
            "title": "",
            "searchType": query_profile.get("searchType", "1"),
            "t1code": query_profile["t1code"],
            "t2Gcode": query_profile["t2Gcode"],
            "t2code": query_profile["t2code"],
            "rowRange": str(self.row_range),
            "lang": "E",
        }
        return f"{self.title_search_endpoint}?{urlencode(query)}"

    def parse_title_search_result(self, response):
        try:
            payload = json.loads(response.text)
            rows = json.loads(payload.get("result") or "[]") or []
        except json.JSONDecodeError as error:
            self.logger.warning("failed to decode HKEX title search JSON: %s", error)
            return

        source_page_url = response.url
        query_label = response.meta.get("query_label")
        for rank, row in enumerate(rows, start=1):
            file_link = row.get("FILE_LINK")
            if not file_link:
                continue
            url = urljoin(self.base_url, file_link)
            if not is_candidate_document_url(url):
                continue
            yield scrapy.Request(
                url,
                callback=self.parse_document,
                meta={
                    "hkex_row": row,
                    "published_at": parse_hkex_datetime(row.get("DATE_TIME")),
                    "query_label": query_label,
                    "result_rank": rank,
                    "source_page_url": source_page_url,
                },
            )

    def parse_document(self, response):
        row = response.meta.get("hkex_row") or {}
        title = response.css("title::text").get() if isinstance(response, TextResponse) else None
        yield DocumentItem(
            source_record_id=row.get("NEWS_ID"),
            canonical_url=response.url,
            document_url=response.url,
            title_en=clean_text(row.get("TITLE")) or clean_text(title),
            title_zh_hant=None,
            published_at=response.meta.get("published_at"),
            category=response.meta.get("query_label"),
            hkex_code=clean_text(row.get("STOCK_CODE")),
            content_type=response.headers.get("Content-Type", b"unknown").decode(
                "utf-8", errors="ignore"
            ),
            response_body=response.body,
            response_headers={
                key.decode(): value[0].decode(errors="ignore")
                for key, value in response.headers.items()
            },
            source_surface=self.source_surface,
            source_page_url=response.meta.get("source_page_url") or response.url,
            result_rank=response.meta.get("result_rank"),
            http_status=response.status,
        )


def is_candidate_document_url(url):
    lower = url.lower()
    return (
        lower.endswith(".pdf")
        or "/listedco/" in lower
        or "/newlistings/" in lower
        or "hkexnews.hk" in lower and "titlesearch" not in lower
    )


def clean_text(value):
    if value is None:
        return None
    return " ".join(unescape(str(value)).split())


def business_date_from_run_id(run_id):
    match = re.search(r"cr_hkex_news_(\d{4})(\d{2})(\d{2})", run_id or "")
    if not match:
        return None
    return "-".join(match.groups())


def date_window(business_date, lookback_days):
    start = datetime.strptime(business_date, "%Y-%m-%d").date()
    for offset in range(max(lookback_days, 0) + 1):
        yield (start - timedelta(days=offset)).isoformat()


def date_range(business_date, lookback_days):
    end = datetime.strptime(business_date, "%Y-%m-%d").date()
    start = end - timedelta(days=max(lookback_days, 0))
    return start.isoformat(), end.isoformat()


def title_search_queries(scope):
    if scope == "all":
        return [
            {
                "label": "all_announcements",
                "searchType": "0",
                "t1code": "-2",
                "t2Gcode": "-2",
                "t2code": "-2",
            }
        ]
    return IPO_TITLE_SEARCH_QUERIES


def parse_hkex_datetime(value):
    if not value:
        return None
    try:
        parsed = datetime.strptime(value, "%d/%m/%Y %H:%M")
    except ValueError:
        return None
    return f"{parsed.strftime('%Y-%m-%dT%H:%M:%S')}+08:00"
