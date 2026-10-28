# Local label punctuation

`Noto Sans TC Regular/8192-8447.pbf` supplies U+2014 (em dash) for existing
Chinese display names such as 基馬克—欽察汗國. MapLibre 5.6.1 generates CJK
and fullwidth punctuation locally, but does not generate U+2014 locally.
This small original glyph uses a 24 × 2 px rectangular stroke, 24 px advance,
3 px SDF border, radius 8 and cutoff 0.25. It contains no third-party font data.
The static build copies it with the rest of `vendor/maplibre`.
