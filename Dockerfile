# Wrapper Dockerfile that sets build context to google-maps-scraper-main
# This allows Railway to build from repo root while using the subdirectory as context

FROM golang:1.25.5-trixie AS builder
WORKDIR /app

# Copy go.mod and go.sum from the subdirectory
COPY google-maps-scraper-main/go.mod google-maps-scraper-main/go.sum ./
RUN go mod download

# Copy all source files from subdirectory
COPY google-maps-scraper-main/ ./

# Build the application
RUN CGO_ENABLED=0 go build -ldflags="-w -s" -o /usr/bin/google-maps-scraper

# Playwright dependencies stage
FROM ubuntu:20.04 AS playwright-deps
ENV PLAYWRIGHT_BROWSERS_PATH=/opt/browsers
RUN export PATH=$PATH:/usr/local/go/bin:/root/go/bin \
    && apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl wget \
    && wget -q https://go.dev/dl/go1.25.5.linux-amd64.tar.gz \
    && tar -C /usr/local -xzf go1.25.5.linux-amd64.tar.gz \
    && rm go1.25.5.linux-amd64.tar.gz \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && go install github.com/playwright-community/playwright-go/cmd/playwright@latest \
    && mkdir -p /opt/browsers \
    && playwright install chromium --with-deps

# Final stage
FROM debian:trixie-slim
ENV PLAYWRIGHT_BROWSERS_PATH=/opt/browsers
ENV PLAYWRIGHT_DRIVER_PATH=/opt

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libxkbcommon0 \
    libatspi2.0-0 \
    libx11-6 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy Playwright browsers and drivers
COPY --from=playwright-deps /opt/browsers /opt/browsers
COPY --from=playwright-deps /root/.cache/ms-playwright-go /opt/ms-playwright-go

RUN chmod -R 755 /opt/browsers \
    && chmod -R 755 /opt/ms-playwright-go

# Copy the built binary
COPY --from=builder /usr/bin/google-maps-scraper /usr/bin/

# Install Python and dependencies for email extraction
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy Python script and requirements from builder stage (where all files are already copied)
COPY --from=builder /app/extract_contact_emails.py /extract_contact_emails.py
COPY --from=builder /app/requirements.txt /requirements.txt

# Install Python dependencies
RUN pip3 install --no-cache-dir -r /requirements.txt

# Create data directory
RUN mkdir -p /gmapsdata

# Use CMD with shell to allow environment variable substitution
# Railway sets PORT automatically, default to 8080 if not set
CMD sh -c 'google-maps-scraper -data-folder /gmapsdata -addr ":${PORT:-8080}"'

