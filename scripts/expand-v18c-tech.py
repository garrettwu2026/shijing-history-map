"""Resume TASK22 in batches of 30; authored records live in v18c-tech.tsv.

Locations identify the documented demonstration, site or publication, never an
inventor's birthplace. Archaeological dates describe evidence, not priority.
"""
import collections
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
def read(path):
    return json.loads((ROOT / path).read_text())
def write(path, value):
    target = ROOT / path
    temporary = target.with_suffix(target.suffix + '.tmp')
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')
    temporary.replace(target)

# Each domain supplies historical context and explains the mechanism's wider
# significance. The record supplies the particular achievement and consequence.
CONTEXT = {
 '史前': ('早期人群依靠採集與狩獵生活，必須處理食物、工具和棲身環境。考古遺存能呈現部分操作方式，但通常無法指認個別製作者，也不能把保存下來的證據直接視為發明起點。', '這些遺存顯示人群能依材料性質安排操作，相關知識透過實際活動與學習傳承，逐步擴大適應環境的能力。', '技術累積改變了人群運用材料與環境的方式，也顯示日常經驗、合作及知識傳承在人類長期歷史中的重要作用。'),
 '農業': ('定居社會的糧食供應受到季節、水源與土壤條件限制。農民透過選種、田間管理及加工累積經驗，逐步建立能在不同環境維持收成的生產技術。', '這項做法把地方環境知識轉化為可持續操作的生產程序，並依賴勞動分工與經驗傳承維持運作。', '糧食與原料供應的改變，進一步影響人口分布、土地利用及勞動組織，使技術成為社會結構變動的重要條件。'),
 '工藝': ('工具與材料的性能限制日常生產，也影響交換與聚落生活。工匠在選材、加熱、加工及組裝中累積經驗，使製品逐步具有更穩定的用途與品質。', '製作者結合材料特性與操作經驗，讓特定形狀或功能得以實現，反映當地工藝知識的累積。', '這類工藝改變了資源加工與物品流通的方式，也促進專門技術的傳承，使生產能力成為地方社會發展的重要基礎。'),
 '文字': ('行政、交易與知識傳承需要超越口語記憶的紀錄方式。書寫材料、符號與複製方法的演變，讓資訊能跨越時間與距離，並形成專門的製作及閱讀活動。', '這項成果改變資訊的記錄或重製程序，使文字與圖像能在具體的材料及制度條件下保存傳播。', '資訊保存與傳播方式的改變，影響行政管理、教育及文化交流，也逐漸改變知識取得的成本與社會分布。'),
 '數學': ('測量、計算與論證是天文、工程及商業的重要基礎。學者整理既有算法並提出可檢驗的推理，使數量關係逐漸成為能跨越具體問題使用的研究工具。', '研究者將問題轉化為符號、數量或幾何關係，建立能由他人檢查與繼續發展的計算和推理方法。', '新的數學工具擴大了可處理的問題範圍，並經由教育與專業實務傳播，長期改變科學、工程及經濟活動的計算能力。'),
 '天文': ('天體運行牽涉曆法、航海與自然秩序的理解。觀測者需要結合儀器、長期紀錄與數學模型，才能辨別肉眼經驗之外的規律，並檢查既有宇宙觀。', '觀測與分析把天象轉化為可比較的紀錄，使相關主張能透過後續測量與理論研究接受檢驗。', '天文知識的改變影響人類對地球位置與宇宙尺度的理解，也推動精密測量、科學合作及相關儀器的持續發展。'),
 '機械': ('生產者希望減少重複勞動並提高加工的穩定性。機械設計必須把動力、傳動與工作程序結合，才能在實際作業中持續運轉，形成可維修及複製的設備。', '設計者把特定工作轉化為可控制的機械運動，使設備能在操作、材料與維護條件配合下完成任務。', '機械化改變了工作速度與生產分工，也影響工場規模、技能需求及商品成本，成為後續產業組織變化的重要因素。'),
 '能源': ('社會擴大生產與運輸時，需要更可靠的動力及能源供應。研究者和工程師嘗試改善能量轉換、傳輸與控制，使自然資源能在新的設備與系統中使用。', '這項成果把能量轉換與設備設計結合，顯示新的動力形式可在特定條件下產生或輸送可用功率。', '能源供應與利用方式的改變，影響工業布局、基礎建設及資源需求，也使技術選擇與經濟和環境問題更緊密相連。'),
 '通訊': ('遠距資訊交換受到傳遞速度、訊號品質與設備成本限制。研究者將聲音、文字及影像轉換為可傳送的訊號，並建立收發端共同遵循的操作規則。', '這項成果把訊息轉為可處理的訊號，透過具體設備或傳輸規則，展示新的資訊交換能力。', '通訊能力的擴展改變了資訊流動與組織協調，也逐漸重塑新聞、商業及日常聯繫，使遠距互動成為社會運作的一部分。'),
 '交通': ('交通工具需要克服動力、結構、操控與路線條件的限制。工程師透過試驗調整設計，使人員及物資能以不同於既有方式的速度、距離或負載移動。', '這次實作把動力、結構與操作程序組合成可運作的運輸方案，並在具體路線或試驗環境中展示性能。', '運輸能力的改變擴大了人口與商品流動的範圍，也影響城市布局、貿易網絡及國家建設，逐步改寫距離造成的限制。'),
 '醫學': ('疾病與傷害長期限制人口健康，既有治療往往缺乏穩定效果。研究者透過觀察、實驗與臨床工作，尋找病因並改善診斷、預防或治療的實際方法。', '這項工作把對疾病或身體機制的理解化為可觀察的結果，為後續臨床研究與方法改良提供具體基礎。', '醫療知識與工具的改變擴大了預防或治療的可能性，並影響公共衛生、醫療組織及人口生活，效果仍取決於實際普及與使用。'),
 '化學': ('工業、醫療與日常用品都依賴對物質性質的掌握。研究者改變原料、反應條件與分析方法，尋找可重現的製程，並逐步連結實驗室成果與材料生產。', '研究者透過特定材料與反應條件取得成果，使物質的製備或辨識成為能由後續實驗檢查的操作。', '物質研究與製程的改變擴大了可用材料的範圍，也重塑原料需求、製造流程與商品供應，對產業和日常生活產生長期影響。'),
 '物理': ('自然現象的解釋需要把觀察、測量與理論連結。研究者以新的儀器或概念檢查既有看法，將難以直接感知的作用轉化為可比較與討論的科學問題。', '這項研究提供新的實驗結果或理論表述，讓相關現象能以更明確的方法測量、解釋與繼續檢驗。', '新的物理知識改變了對自然規律的理解，並為後續儀器、材料及工程研究提供基礎，其應用經由長期發展逐步進入社會。'),
 '運算': ('行政、科學與產業面對日益複雜的資訊處理需求。研究者將計算步驟、資料表示與控制機制分開設計，使機器能以更高速度或更靈活的方式處理問題。', '這項成果以具體的硬體、程式或計算方法展示資訊處理能力，並提供後續系統設計可沿用的概念。', '資訊處理能力的擴展改變了知識工作與組織方式，也推動新的產品和服務，使運算逐漸成為科學、經濟及日常生活的基礎。'),
 '太空': ('進入太空必須克服推進、導航、通訊與極端環境的限制。工程團隊結合地面試驗與飛行任務，讓儀器或人員能在地球以外執行事先規劃的工作。', '任務透過發射、飛行或地面控制程序完成關鍵目標，將工程設計轉化為可追蹤的實際運作結果。', '太空能力的擴展帶來新的觀測與探索機會，也影響國際合作、國家競爭及相關產業，讓地球以外的環境成為持續研究的場域。'),
 '環境': ('人類需要辨識自然環境的變化，並在居住、生產與資源使用間取得可行安排。長期觀察、工程實作與科學分析，逐步揭示地方經驗以外的環境關係。', '這項工作結合具體的觀測資料、設施或操作方法，使自然條件能被系統地記錄、分析或利用。', '環境知識與管理方法的改變，影響公共建設、資源分配及風險判斷，也讓人類活動與自然系統的關係受到更持續的關注。'),
 '工程': ('聚落與城市的擴大需要穩定的建築、供水及公共設施。工程實作把材料、測量與勞動組織結合，使大型構造物能承受環境條件並持續服務特定用途。', '建造者依照地形、材料與用途安排施工，把技術知識轉化為可實際使用與維護的構造或系統。', '工程能力的改變影響聚落規模與公共服務，也重新安排勞動、資源及空間，使基礎設施成為社會組織與經濟活動的重要條件。'),
}

def main():
    events = read('data/events.json')
    details = read('data/event-details.json')
    registry = read('data/event-id-registry.json')
    catalog = read('data/polities.json')['index']
    progress = read('scripts/v18c-tech-progress.json')
    task = progress['task22']
    task.setdefault('baselineEventIds', [e['id'] for e in events])
    task.setdefault('baselineDetails', len(details))
    task.setdefault('baselineTechEvents', sum(e['category']=='科技與發明' for e in events))
    baseline = set(task['baselineEventIds'])
    refresh = '--refresh' in sys.argv
    places = read('scripts/v18c-tech-places.json')
    narratives = read('scripts/v18c-tech-narratives.json')
    next_id = max(int(i[1:]) for i in registry.values()) + 1
    records = []
    for line in (ROOT/'scripts/v18c-tech.tsv').read_text().splitlines():
        if not line or line.startswith('#'):
            continue
        year, title, place, domain, fact, consequence = line.split('|')
        records.append((int(year), title, place, domain, fact, consequence))
    assert len({r[1] for r in records}) == len(records), 'Duplicate authored title'
    assert set(narratives) <= {r[1] for r in records}, 'Narrative without authored event'
    # Check every authored record before editing data or saving a batch. Resume
    # may skip existing titles, but --refresh must be able to resolve them too.
    missing_places = sorted({r[2] for r in records} - places.keys())
    if missing_places:
        raise ValueError(f'Missing locations in v18c-tech-places.json: {missing_places}')
    for _, title, place, domain, _, _ in records:
        if domain not in CONTEXT:
            raise ValueError(f'Unknown domain for {title}: {domain}')
        if places[place][3] not in catalog:
            raise ValueError(f'Unknown polity for {title}: {places[place][3]}')
    if refresh:
        # Explicit editorial repair only touches TASK22 additions, never baseline.
        authored = {r[1] for r in records}
        retired = {e['id'] for e in events if e['id'] not in baseline and e['title'] not in authored}
        events[:] = [e for e in events if e['id'] not in retired]
        for eid in retired:
            details.pop(eid, None)
    def checkpoint():
        events.sort(key=lambda e: (e['year'], e['id']))
        added = [e for e in events if e['id'] not in baseline]
        complete_status = 'complete' if task.get('status') == 'complete' else 'data-complete'
        task.update(completed=len(added), addedTechEvents=len(added), eventDetails=len(details),
                    bespokeNarratives=len(narratives),
                    completedEventIds=[e['id'] for e in added], target=500,
                    regions=dict(collections.Counter(e['region'] for e in added)),
                    status=complete_status if len(added)>=500 else 'in-progress',
                    note='Own-knowledge editorial records; approximate dates label archaeological evidence, not invention priority. Existing polity IDs identify associated societies, not individual inventors.')
        progress['status'] = task['status']
        write('data/events.json', events)
        write('data/event-details.json', details)
        write('data/event-id-registry.json', registry)
        write('scripts/v18c-tech-progress.json', progress)
    added_count = 0
    for year, title, place, domain, fact, consequence in records:
        if title in registry and any(e['id']==registry[title] for e in events) and not refresh:
            assert registry[title] in details, f'Existing title lacks details: {title}'
            continue
        lat, lon, region, polity = places[place]
        background, method, significance = CONTEXT[domain]
        process = fact + '。' + method
        impact = consequence + '。' + significance
        description = background + process
        if title in narratives:
            background, process, impact = (narratives[title][key] for key in ('背景', '經過', '影響'))
            description = background + process
        item = {'description':description, '背景':background, '經過':process, '影響':impact, '參與方':[catalog[polity]]}
        if year < -5000:
            item['參與方說明'] = '連結既有目錄中的相關採集狩獵或早期農耕社群，作為文化背景導覽；並非主張當時已有同名國家或已知個別發明者。'
        elif polity in ('Sinic', 'West African cereal farmers'):
            item['參與方說明'] = '既有目錄以較廣的文化社群連結相關地區，並非認定該名稱代表單一國家或可確知的發明者。'
        for key, lo, hi in [('description',100,250),('背景',50,150),('經過',50,150),('影響',50,150)]:
            assert lo<=len(item[key])<=hi, (title,key,len(item[key]))
        eid = registry.get(title, f'e{next_id:04d}')
        if title not in registry:
            next_id += 1
        event = dict(id=eid,year=year,startYear=year,endYear=year,lat=lat,lon=lon,title=title,
                     description=description,category='科技與發明',region=region,
                     precision='approximate' if year<1500 else 'exact',sourceStatus='editorial',chronologyStatus='editorial-reviewed')
        if year<1500:
            event['dateNote']='約'
        registry[title]=eid
        events[:] = [e for e in events if e['id'] != eid]
        events.append(event)
        details[eid]=item
        added_count += 1
        if added_count % 30 == 0:
            checkpoint()
            print(f'Saved {task["completed"]} TASK22 events', flush=True)
    checkpoint()
    print(f'Added {added_count}; total TASK22 {task["completed"]}; catalog {len(events)}')

if __name__ == '__main__':
    main()
