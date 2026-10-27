Performance pass (2026-10-27)

All 54 `data/world_*.geojson` snapshots were simplified with Mapshaper 0.7.98, using `-simplify 15% keep-shapes` and `-o precision=0.01`. The fragmented 1492 snapshot uses 8%. Every original feature and property was retained. The land background uses the same simplified 2010 file and shares its in-memory fetch cache with the timeline.

Total uncompressed snapshot bytes: **71,198,645 → 9,781,849 (86.26% reduction)**. Files range from 79,159 to 406,724 bytes except 1492 (985,027 bytes). Sparse early snapshots are smaller than the requested 150 KB range. 1492 remains larger than 400 KB because its many small fragments and shared boundaries limit simplification with `keep-shapes`; dissolving fragments changed border structure and was rejected.

Polygon layers explicitly use Leaflet Canvas. Snapshot fetch promises remain cached for the session, with failed requests evicted for retry. Adjacent snapshots prefetch during idle time. Slider input updates the year immediately and debounces border swaps by 150 ms; superseded requests cannot render. Playback retains the existing layer when its snapshot has not changed. Labels, markers, and popups keep their existing behavior.

Headless Google Chrome, fresh contexts, uncompressed local HTTP server, default year -300, three runs per viewport. First render is navigation start to two animation frames after the first border snapshot and labels are built. Median observed times:

| Viewport | Before | After |
| --- | ---: | ---: |
| Desktop 1440×900 | 833.5 ms | 530.0 ms |
| Mobile 390×844, touch emulation | 612.2 ms | 436.2 ms |

These are local, unthrottled measurements; mobile emulation does not reproduce a physical phone's CPU or Render network latency.

Verification:

```sh
python3 -m http.server 8080
NODE_PATH=/path/to/playwright/node_modules node scripts/verify-performance.cjs
# Existing feature/design regression checks (expects port 8000):
NODE_PATH=/path/to/playwright/node_modules node scripts/verify-browser.cjs
```

The performance check disables Chrome's HTTP cache and verifies Canvas rendering, idle prefetching, debounced slider swaps, in-memory revisits, unchanged-snapshot playback, all selectable snapshots, and no JavaScript/console errors on desktop and mobile. It writes byte totals, timing samples, and zoom 2/4/6 screenshots under ignored `artifacts/`. Byte comparisons use the snapshots at Git HEAD as the baseline.
