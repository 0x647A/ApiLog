#!/usr/bin/env bash
# Starts ApiLog with uv. On the first run `uv run` creates the environment
# and installs the dependencies from uv.lock, so nothing else is needed.
set -e
cd "$(dirname "$0")"

if ! command -v uv >/dev/null 2>&1; then
  echo "uv is not installed. Install it with: curl -LsSf https://astral.sh/uv/install.sh | sh"
  echo "Or run the app without uv (see 'Without uv' in README.md)."
  exit 1
fi

exec uv run apilog
