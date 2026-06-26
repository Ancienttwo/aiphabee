from urllib.parse import urljoin
from urllib.parse import urlparse

import scrapy

from data_ingest.hkex.items import DocumentItem


class HkexNewsSpider(scrapy.Spider):
    name = "hkex_news"
    allowed_domains = ["hkexnews.hk", "www1.hkexnews.hk"]
    base_url = "https://www1.hkexnews.hk"

    def __init__(
        self,
        crawl_run_id,
        data_version,
        source_surface="new_listing_information",
        start_url=None,
        *args,
        **kwargs,
    ):
        super().__init__(*args, **kwargs)
        self.crawl_run_id = crawl_run_id
        self.data_version = data_version
        self.source_surface = source_surface
        self.start_urls = [
            start_url
            or "https://www1.hkexnews.hk/search/titlesearch.xhtml?lang=en"
        ]
        if start_url:
            parsed = urlparse(start_url)
            if parsed.hostname in {"127.0.0.1", "localhost"}:
                self.allowed_domains = [*self.allowed_domains, parsed.hostname]

    def parse(self, response):
        for rank, href in enumerate(response.css("a::attr(href)").getall(), start=1):
            url = urljoin(response.url, href)
            if not is_candidate_document_url(url):
                continue
            yield response.follow(
                url,
                callback=self.parse_document,
                meta={"source_page_url": response.url, "result_rank": rank},
            )

    def parse_document(self, response):
        title = response.css("title::text").get() if hasattr(response, "css") else None
        yield DocumentItem(
            source_record_id=None,
            canonical_url=response.url,
            document_url=response.url,
            title_en=clean_text(title),
            title_zh_hant=None,
            published_at=None,
            category=None,
            content_type=response.headers.get("Content-Type", b"unknown").decode(
                "utf-8", errors="ignore"
            ),
            response_body=response.body,
            response_headers={key.decode(): value[0].decode(errors="ignore") for key, value in response.headers.items()},
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
    return " ".join(value.split())
