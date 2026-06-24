import hashlib
import json
import os
from pathlib import Path
from urllib.parse import urljoin, urlparse, urlunparse


class NormalizeUrlPipeline:
    def process_item(self, item, spider):
        canonical_url = item.get("canonical_url") or item.get("document_url")
        if canonical_url:
            item["canonical_url"] = normalize_url(canonical_url, spider.base_url)
        if item.get("document_url"):
            item["document_url"] = normalize_url(item["document_url"], spider.base_url)
        return item


class SourceRecordIdentityPipeline:
    def process_item(self, item, spider):
        if not item.get("source_record_id"):
            source = item.get("canonical_url") or item.get("document_url")
            item["source_record_id"] = hashlib.sha256(source.encode("utf-8")).hexdigest()
        item["crawl_run_id"] = spider.crawl_run_id
        item["data_version"] = spider.data_version
        return item


class ContentHashPipeline:
    def process_item(self, item, spider):
        body = item.get("response_body") or b""
        if isinstance(body, str):
            body = body.encode("utf-8")
        item["content_hash_sha256"] = hashlib.sha256(body).hexdigest()
        return item


class RawFileStoragePipeline:
    def process_item(self, item, spider):
        body = item.get("response_body") or b""
        if isinstance(body, str):
            body = body.encode("utf-8")
        content_hash = item.get("content_hash_sha256")
        if not content_hash:
            return item

        root = Path(os.environ.get("DATA_INGEST_RAW_DIR", "runtime/raw")).resolve()
        path = root / "sha256" / content_hash[:2] / content_hash[2:4] / content_hash
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(body)
        item["response_body_storage_uri"] = path.as_uri()
        item.pop("response_body", None)
        return item


class DocumentMetadataPipeline:
    def process_item(self, item, spider):
        # The CLI/Postgres layer owns data_version, release_state and serving writes.
        # This pipeline only emits normalized document metadata for that layer.
        item.setdefault("source_surface", spider.source_surface)
        item.setdefault("content_type", "unknown")
        return item


class StatsPipeline:
    def open_spider(self, spider):
        self.count = 0

    def process_item(self, item, spider):
        self.count += 1
        return item

    def close_spider(self, spider):
        report_path = os.environ.get("DATA_INGEST_SCRAPY_STATS_PATH")
        if not report_path:
            return
        payload = {
            "crawl_run_id": spider.crawl_run_id,
            "data_version": spider.data_version,
            "item_count": self.count,
        }
        Path(report_path).parent.mkdir(parents=True, exist_ok=True)
        Path(report_path).write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n")


def normalize_url(value, base_url):
    joined = urljoin(base_url, value)
    parsed = urlparse(joined)
    return urlunparse((parsed.scheme, parsed.netloc.lower(), parsed.path, "", parsed.query, ""))
