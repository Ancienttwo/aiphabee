BOT_NAME = "aiphabee_data_ingest"

SPIDER_MODULES = ["data_ingest.hkex.spiders"]
NEWSPIDER_MODULE = "data_ingest.hkex.spiders"

ROBOTSTXT_OBEY = True
CONCURRENT_REQUESTS = 4
DOWNLOAD_DELAY = 1.0
AUTOTHROTTLE_ENABLED = True
AUTOTHROTTLE_START_DELAY = 1.0
AUTOTHROTTLE_MAX_DELAY = 15.0
COOKIES_ENABLED = False
RETRY_ENABLED = True
RETRY_TIMES = 3

ITEM_PIPELINES = {
    "data_ingest.hkex.pipelines.NormalizeUrlPipeline": 100,
    "data_ingest.hkex.pipelines.SourceRecordIdentityPipeline": 200,
    "data_ingest.hkex.pipelines.ContentHashPipeline": 300,
    "data_ingest.hkex.pipelines.RawFileStoragePipeline": 400,
    "data_ingest.hkex.pipelines.DocumentMetadataPipeline": 500,
    "data_ingest.hkex.pipelines.StatsPipeline": 900,
}

FEEDS = {}
