FROM node:22-bookworm


WORKDIR /workspace

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        git \
        curl \
        postgresql-client \
    && rm -rf /var/lib/apt/lists/*

CMD ["sleep", "infinity"]
