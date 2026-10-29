"""Validate the fixed introduction inventory and popup-compatible content."""
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
# Digest of the sorted 214 IDs before TASK19b; catches replacements as well as loss.
EXPECTED_IDS_SHA256 = '7f3da00d4a0e310b2b4cad93058dfa3bba7f1e24a3b29e129255ceb03ff35e79'

def read(name):
    return json.loads((ROOT / 'data' / name).read_text())


def validate(intros, catalog, glossary):
    errors = []
    if len(intros) != 214 or hashlib.sha256('\n'.join(sorted(intros)).encode()).hexdigest() != EXPECTED_IDS_SHA256:
        errors.append('介紹必須保留原有的全部 214 個 ID')
    allowed_names = {}
    latin_terms = {}
    for term in glossary['entries']:
        name = term.get('accepted_zh_TW') or term.get('previous_zh') or term['original']
        polity_id = catalog['index'].get(term['original'])
        if polity_id:
            allowed_names.setdefault(polity_id, set()).add(name)
        original = term['original']
        if term.get('accepted_zh_TW') and re.fullmatch(r'[\x20-\x7e]+', original) and re.search(r'[A-Za-z]', original):
            latin_terms[original] = term['accepted_zh_TW']
    latin_patterns = [(re.compile(r'(?<![A-Za-z])' + re.escape(original) + r'(?![A-Za-z])', re.I), original, chinese) for original, chinese in latin_terms.items()]
    fields = {'name', 'summary', '存續年代', '首都', '主要族群/語言', '重要事件', '前身/後繼'}
    all_names = set().union(*allowed_names.values())
    for polity_id, intro in intros.items():
        def check(condition, message):
            if not condition:
                errors.append(f'{polity_id}: {message}')
        check(set(intro) == fields, '欄位必須符合既有彈窗格式')
        check(intro.get('name') in allowed_names.get(polity_id, set()), '名稱須符合政體與詞彙表')
        for field in ['name', 'summary', '存續年代', '首都', '主要族群/語言']:
            check(isinstance(intro.get(field), str), f'{field} 須為字串')
        summary = intro.get('summary', '')
        check(isinstance(summary, str) and len(summary.strip()) >= 100, '介紹至少須有 100 字元')
        if isinstance(summary, str):
            check(intro.get('name', '') in summary, '摘要須包含既有顯示名稱')
            check(2 <= len([part for part in summary.split('。') if part]) <= 4, '摘要須維持既有的 2–4 句格式')
        events = intro.get('重要事件')
        check(isinstance(events, list) and 3 <= len(events) <= 5 and all(isinstance(e, str) and e.strip() for e in events), '重要事件須有 3–5 筆非空字串')
        relations = intro.get('前身/後繼')
        check(isinstance(relations, list), '前身／後繼須為陣列')
        for relation in relations if isinstance(relations, list) else []:
            check(isinstance(relation, dict) and set(relation) <= {'name', 'id'}, '關聯格式不符')
            if not isinstance(relation, dict):
                continue
            name = relation.get('name')
            check(name in all_names, '關聯名稱須符合詞彙表')
            if relation.get('id'):
                check(name in allowed_names.get(relation['id'], set()), '關聯 ID 與名稱不符')
        text = json.dumps(intro, ensure_ascii=False)
        check(not re.search(r'https?://|www\.|來源|參考', text, re.I), '不得含網址、來源或參考文字')
        for pattern, original, chinese in latin_patterns:
            check(not pattern.search(text), f'請以「{chinese}」取代 {original}')
    return errors


if __name__ == '__main__':
    intros = read('intros.json')
    errors = validate(intros, read('polities.json'), read('glossary.json'))
    if errors:
        raise SystemExit('\n'.join(errors))
    lengths = [len(v['summary']) for v in intros.values()]
    print(f'介紹驗證通過：{len(intros)} 筆；摘要 {min(lengths)}–{max(lengths)} 字元；事件 {sum(len(v["重要事件"]) for v in intros.values())} 筆')
