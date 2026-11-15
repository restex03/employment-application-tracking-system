#!/usr/bin/env bash
set -Eeuo pipefail

usage() {
  echo "Usage: $0 <image-tag>"
  echo "Build eats-ingestion:<image-tag> from the repository root."
}

if [[ ${1:-} == "--help" || ${1:-} == "-h" ]]; then usage; exit 0; fi
if [[ $# -ne 1 || ! $1 =~ ^[A-Za-z0-9_][A-Za-z0-9_.-]*$ ]]; then usage >&2; exit 2; fi

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd -- "$script_dir/.." && pwd)"
command -v docker >/dev/null || { echo "Docker is required" >&2; exit 1; }

image="eats-ingestion:$1"
echo "Building $image"
docker build -f "$repo_root/apps/ingestion/Dockerfile" -t "$image" "$repo_root"
echo "Built $image"
