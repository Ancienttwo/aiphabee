FROM docker.io/cloudflare/sandbox:0.12.3

RUN apt-get update \
    && apt-get install -y --no-install-recommends coreutils \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /workspace \
    && chmod 700 /root

WORKDIR /workspace
