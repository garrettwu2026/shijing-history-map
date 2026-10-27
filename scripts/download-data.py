#!/usr/bin/env python3
"""以 curl 下載上游全部世界疆界快照；只使用 Python 標準函式庫。"""
import concurrent.futures
import json
from pathlib import Path
import re
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / 'data'
DATA.mkdir(exist_ok=True)

def curl(url, target):
    subprocess.run(['curl', '--fail', '--location', '--retry', '3', '--silent', '--show-error', url, '-o', str(target)], check=True)

with tempfile.TemporaryDirectory() as tmp:
    index = Path(tmp) / 'index.json'
    curl('https://api.github.com/repos/aourednik/historical-basemaps/contents/geojson', index)
    files = [f for f in json.loads(index.read_text()) if re.fullmatch(r'world_(bc)?\d+\.geojson', f['name'])]
    def download(f):
        staged = Path(tmp) / f['name']
        curl(f['download_url'], staged)
        document = json.loads(staged.read_text())
        assert document['type'] == 'FeatureCollection'
        staged.replace(DATA / f['name'])
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        list(pool.map(download, files))
    snapshots = sorted([{'year': int(re.search(r'\d+', f['name'])[0]) * (-1 if '_bc' in f['name'] else 1), 'file': f['name']} for f in files], key=lambda s: s['year'])
    (DATA / 'snapshots.json').write_text(json.dumps(snapshots, indent=2) + '\n')
    print(f'已下載 {len(snapshots)} 個世界快照。')
