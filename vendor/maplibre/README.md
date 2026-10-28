MapLibre GL JS 5.6.1, pinned in package.json and package-lock.json.

Vendored verbatim from npm package `maplibre-gl@5.6.1`:
- dist/maplibre-gl.js
- dist/maplibre-gl.css
- LICENSE.txt

Refresh with `npm install --save-exact maplibre-gl@5.6.1` and copy those files.
The static build fingerprints the JS/CSS and includes the license.
Map labels use only CJK ideographs from existing Chinese names, rendered with
localIdeographFontFamily. The style's local glyph URL is a v5 style validation
requirement; the CJK-only symbol layer never requests PBF ranges. No remote
style, tile, font, glyph or sprite server is required.
