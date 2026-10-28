"""Re-fetch the pilot's cited sources without changing editorial introductions.

Uses the standard library; writes response snapshots and an HTTP manifest under
artifacts/v15-sources/ (ignored build/research output). Editorial fetch evidence
from the original pass is scripts/v15-source-audit.json. Network availability or
later article revisions can differ from that evidence.
"""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from hashlib import sha256
from pathlib import Path
import json
from urllib.parse import quote, unquote, urlsplit
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'artifacts/v15-sources'


def fetch(source):
    # The English REST summary is the text actually used in the editorial pass.
    url = source
    parts = urlsplit(source)
    if parts.netloc == 'en.wikipedia.org' and parts.path.startswith('/wiki/'):
        title = unquote(parts.path[len('/wiki/'):])
        url = 'https://en.wikipedia.org/api/rest_v1/page/summary/' + quote(title, safe='')
    record = {'source': source, 'fetchedVia': url,
              'retrieved': datetime.now(timezone.utc).isoformat()}
    try:
        request = Request(url, headers={'User-Agent': 'HistoryMapIntroPilot/1.0 (educational historical atlas)'})
        with urlopen(request, timeout=45) as response:
            body = response.read()
            digest = sha256(body).hexdigest()
            record.update(status=response.status, finalURL=response.url,
                          sha256=digest, bytes=len(body))
            (OUT / (digest + '.response')).write_bytes(body)
    except Exception as error:
        record['error'] = str(error)
    return record


if __name__ == '__main__':
    audit = json.loads((ROOT / 'scripts/v15-source-audit.json').read_text())
    sources = sorted({url for entry in audit for url in
                      [entry['source'], *[item['url'] for item in entry.get('additionalFetches', [])]]})
    OUT.mkdir(parents=True, exist_ok=True)
    with ThreadPoolExecutor(max_workers=8) as executor:
        records = list(executor.map(fetch, sources))
    (OUT / 'manifest.json').write_text(json.dumps(records, ensure_ascii=False, indent=2) + '\n')
    failures = sum('error' in record for record in records)
    print(f'Fetched {len(records) - failures}/{len(records)} source URLs; manifest: {OUT / "manifest.json"}')
    raise SystemExit(bool(failures))
