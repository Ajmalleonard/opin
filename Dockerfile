FROM node:22-bookworm

# Install Bun (required for build scripts)
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

RUN corepack enable

WORKDIR /app

ARG OPIN_DOCKER_APT_PACKAGES=""
ARG OPIN_DOCKER_APT_PACKAGES=""
RUN DOCKER_APT_PACKAGES="${OPIN_DOCKER_APT_PACKAGES:-$OPIN_DOCKER_APT_PACKAGES}" && \
    if [ -n "$DOCKER_APT_PACKAGES" ]; then \
      apt-get update && \
      DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends $DOCKER_APT_PACKAGES && \
      apt-get clean && \
      rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/*; \
    fi

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY ui/package.json ./ui/package.json
COPY patches ./patches
COPY scripts ./scripts

RUN pnpm install --frozen-lockfile

COPY . .
RUN OPIN_A2UI_SKIP_MISSING=1 OPIN_A2UI_SKIP_MISSING=1 pnpm build
# Force pnpm for UI build (Bun may fail on ARM/Synology architectures)
ENV OPIN_PREFER_PNPM=1
ENV OPIN_PREFER_PNPM=1
RUN pnpm ui:build

ENV NODE_ENV=production

# Allow non-root user to write temp files during runtime/tests.
RUN chown -R node:node /app

# Security hardening: Run as non-root user
# The node:22-bookworm image includes a 'node' user (uid 1000)
# This reduces the attack surface by preventing container escape via root privileges
USER node

# Start gateway server with default config.
# Binds to loopback (127.0.0.1) by default for security.
#
# For container platforms requiring external health checks:
#   1. Set OPIN_GATEWAY_TOKEN or OPIN_GATEWAY_PASSWORD env var
#      (legacy OPIN_* aliases still work)
#   2. Override CMD: ["node","opin.mjs","gateway","--allow-unconfigured","--bind","lan"]
CMD ["node", "opin.mjs", "gateway", "--allow-unconfigured"]
