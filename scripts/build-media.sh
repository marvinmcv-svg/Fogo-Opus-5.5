#!/usr/bin/env bash
# Builds every web asset derived from the official Ventura Mall rodizio film.
# Source: media-src/rodizio-ventura.mp4 (720x1280, ~11.7s)
set -euo pipefail
SRC="media-src/rodizio-ventura.mp4"
OUT="public/media"
mkdir -p "$OUT/seq" "$OUT/stills"

# 1. Ambient loop (no audio, faststart) — trimmed before the end card
ffmpeg -v error -y -i "$SRC" -t 9.3 -an -vf "scale=720:1280" -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p -movflags +faststart "$OUT/rodizio.mp4"
ffmpeg -v error -y -i "$SRC" -t 9.3 -an -vf "scale=720:1280" -c:v libvpx-vp9 -b:v 0 -crf 36 -row-mt 1 "$OUT/rodizio.webm"

# 2. Scroll-scrubbed frame sequence (12 fps → ~112 frames)
rm -f "$OUT"/seq/*.webp
ffmpeg -v error -y -i "$SRC" -t 9.3 -vf "fps=12,scale=540:960" -c:v libwebp -quality 72 "$OUT/seq/%03d.webp"

# 3. Hand-picked stills (timestamps chosen frame by frame)
still () { ffmpeg -v error -y -ss "$1" -i "$SRC" -frames:v 1 -vf "scale=720:1280" -c:v libwebp -quality 86 "$OUT/stills/$2.webp"; }
still 0.30 grill
still 2.10 fire
still 3.30 hanging
still 4.20 picanha
still 5.25 crust
still 6.40 carving
still 7.35 salt
still 8.90 gaucho
cp "$OUT/stills/picanha.webp" "$OUT/poster.webp"
ls "$OUT/seq" | wc -l
du -sh "$OUT"/*
