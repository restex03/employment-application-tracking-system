#!/usr/bin/env bash
set -euo pipefail

# Build the ingestion Docker image from the repository root.
# Usage: bash deployScripts/build-ingestion.sh <image-tag>

show_usage() {
    echo "Usage: $0 <image-tag>"
    echo "Example: $0 0.1.22"
}

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
    show_usage
    exit 0
fi

if [[ $# -ne 1 || ! "$1" =~ ^[A-Za-z0-9_][A-Za-z0-9_.-]*$ ]]; then
    show_usage >&2
    exit 2
fi

if ! command -v docker >/dev/null 2>&1; then
    echo "Error: Docker is required." >&2
    exit 1
fi

script_directory="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repository_root="$(cd "$script_directory/.." && pwd)"
dockerfile="$repository_root/apps/ingestion/Dockerfile"
image_name="eats-ingestion:$1"

echo "Building $image_name..."
docker build \
    --file "$dockerfile" \
    --tag "$image_name" \
    "$repository_root"

echo "Build complete: $image_name"
