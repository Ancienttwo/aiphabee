FROM docker.io/cloudflare/sandbox:0.12.3@sha256:23f67e16131b780865a5fa5aa3c8607408a730105c248836409f4e02bb6bf042

RUN apt-get update \
    && apt-get install -y --no-install-recommends coreutils \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /workspace \
    && chmod 700 /root

WORKDIR /workspace
