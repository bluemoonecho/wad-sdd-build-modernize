#!/bin/bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <input.svg> [output.png]" >&2
  exit 1
fi

INPUT="$1"

if [ ! -f "$INPUT" ]; then
  echo "Error: File '$INPUT' not found." >&2
  exit 1
fi

if [ $# -ge 2 ]; then
  OUTPUT="$2"
else
  OUTPUT="${INPUT%.svg}.png"
fi

if command -v rsvg-convert &>/dev/null; then
  rsvg-convert "$INPUT" -o "$OUTPUT"
elif command -v convert &>/dev/null; then
  convert "$INPUT" "$OUTPUT"
elif command -v npx &>/dev/null; then
  npx --yes svg2png-cli "$INPUT" -o "$OUTPUT"
else
  echo "Error: No SVG converter found. Install librsvg, ImageMagick, or Node.js." >&2
  exit 1
fi

echo "Converted: $OUTPUT"
