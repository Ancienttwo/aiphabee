import scrapy


class DocumentItem(scrapy.Item):
    source_record_id = scrapy.Field()
    canonical_url = scrapy.Field()
    document_url = scrapy.Field()
    title_en = scrapy.Field()
    title_zh_hant = scrapy.Field()
    published_at = scrapy.Field()
    category = scrapy.Field()
    content_type = scrapy.Field()
    response_body = scrapy.Field()
    response_headers = scrapy.Field()
    content_hash_sha256 = scrapy.Field()
    response_body_storage_uri = scrapy.Field()
    source_surface = scrapy.Field()
    crawl_run_id = scrapy.Field()
    data_version = scrapy.Field()
