#!/usr/bin/env bash
#
# Generate the landing-page hero derivatives from the full-size manual
# screenshots. The originals in public/manual/ are shared with the docs pages,
# so they are read-only here — everything written lands in public/manual/hero/.
#
# Why this exists: the hero shipped the full-size assets with no srcset, so a
# 390px phone downloaded a 1974px PNG for a 228px slot (8.7x) and the page came
# to 2.6 MB, nearly all of it carousel. Two of the seven were PNG (842 KB for
# the pair) despite being ordinary UI screenshots.
#
#   ./scripts/build-hero-images.sh
#
# Re-run after replacing any source screenshot. Output is committed, so the
# build needs no image tooling.
set -euo pipefail
cd "$(dirname "$0")/.."

SRC=public/manual
OUT=$SRC/hero
mkdir -p "$OUT"

# 850 is the widest a slide is ever displayed (846px at 1440); 400 covers phones.
# 1400 is the high-DPI tier: quality is deliberately much lower there because the
# browser downscales it, and a soft 1400px file beats a crisp 850px one at half
# the bytes. At 85 across the board the retina tier came to 2330 KB — no better
# than the unoptimised page it replaces.
QUALITIES=("400:85" "850:85" "1400:60")

for f in capture-area.jpg record-prompt.jpg editor-overview.jpg \
         redaction-review.png lock-screen.png extract-data.jpg library-grid.jpg; do
  base="${f%.*}"
  for wq in "${QUALITIES[@]}"; do
    w="${wq%%:*}"; q="${wq##*:}"
    sips --setProperty format jpeg \
         --setProperty formatOptions "$q" \
         --resampleWidth "$w" \
         "$SRC/$f" --out "$OUT/${base}-${w}.jpg" >/dev/null
  done
  printf '  %-22s → %s\n' "$f" "${base}-{400,850,1400}.jpg"
done

echo
echo "originals (untouched, still used by the docs): $(du -sh $SRC/*.jpg $SRC/*.png 2>/dev/null | awk '{s+=$1} END {print NR" files"}')"
du -sh "$OUT"
