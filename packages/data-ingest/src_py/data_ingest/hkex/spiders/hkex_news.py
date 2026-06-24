from urllib.parse import urljoin

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

    def parse(self, response):
        for href in response.css("a::attr(href)").getall():
            url = urljoin(response.url, href)
            if not is_candidate_document_url(url):
                continue
            yield response.follow(url, callback=self.parse_document)

    def parse_document(self, response):
        title = response.css("title::text").get()
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
