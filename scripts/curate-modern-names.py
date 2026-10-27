import json
from pathlib import Path
p=Path(__file__).resolve().parents[1]/'data/polities.json';x=json.load(open(p))
text='''Afghanistan|阿富汗
Albania|阿爾巴尼亞
Algeria|阿爾及利亞
Angola|安哥拉
Argentina|阿根廷
Armenia|亞美尼亞
Australia|澳大利亞
Austria|奧地利
Azerbaijan|亞塞拜然
Bahamas|巴哈馬
Bahrain|巴林
Bangladesh|孟加拉
Barbados|巴貝多
Belarus|白俄羅斯
Belgium|比利時
Belize|貝里斯
Benin|貝南
Bhutan|不丹
Bolivia|玻利維亞
Botswana|波札那
Brazil|巴西
Brunei|汶萊
Bulgaria|保加利亞
Burkina Faso|布吉納法索
Burundi|蒲隆地
Cambodia|柬埔寨
Cameroon|喀麥隆
Canada|加拿大
Cape Verde|維德角
Central African Republic|中非共和國
Chad|查德
Chile|智利
Colombia|哥倫比亞
Comoros|葛摩
Costa Rica|哥斯大黎加
Croatia|克羅埃西亞
Cuba|古巴
Cyprus|賽普勒斯
Czech Republic|捷克共和國
Denmark|丹麥
Djibouti|吉布地
Dominican Republic|多明尼加共和國
Ecuador|厄瓜多
El Salvador|薩爾瓦多
Equatorial Guinea|赤道幾內亞
Eritrea|厄利垂亞
Estonia|愛沙尼亞
Eswatini|史瓦帝尼
Ethiopia|衣索比亞
Fiji|斐濟
Finland|芬蘭
France|法國
Gabon|加彭
Gambia|甘比亞
Georgia|喬治亞
Germany|德國
Ghana|迦納
Greece|希臘
Greenland|格陵蘭
Guatemala|瓜地馬拉
Guinea|幾內亞
Guinea-Bissau|幾內亞比索
Guyana|蓋亞那
Haiti|海地
Honduras|宏都拉斯
Hungary|匈牙利
Iceland|冰島
Indonesia|印尼
Iran|伊朗
Iraq|伊拉克
Ireland|愛爾蘭
Israel|以色列
Italy|義大利
Ivory Coast|象牙海岸
Jamaica|牙買加
Jordan|約旦
Kazakhstan|哈薩克
Kenya|肯亞
Kuwait|科威特
Kyrgyzstan|吉爾吉斯
Laos|寮國
Latvia|拉脫維亞
Lebanon|黎巴嫩
Lesotho|賴索托
Liberia|賴比瑞亞
Libya|利比亞
Lithuania|立陶宛
Luxembourg|盧森堡
Madagascar|馬達加斯加
Malawi|馬拉威
Malaysia|馬來西亞
Maldives|馬爾地夫
Mali|馬利
Malta|馬爾他
Mauritania|茅利塔尼亞
Mauritius|模里西斯
Mexico|墨西哥
Moldova|摩爾多瓦
Montenegro|蒙特內哥羅
Morocco|摩洛哥
Mozambique|莫三比克
Myanmar|緬甸
Namibia|納米比亞
Nepal|尼泊爾
Netherlands|荷蘭
New Zealand|紐西蘭
Nicaragua|尼加拉瓜
Niger|尼日
Nigeria|奈及利亞
Norway|挪威
Oman|阿曼
Pakistan|巴基斯坦
Panama|巴拿馬
Papua New Guinea|巴布亞紐幾內亞
Paraguay|巴拉圭
Peru|秘魯
Philippines|菲律賓
Poland|波蘭
Portugal|葡萄牙
Qatar|卡達
Romania|羅馬尼亞
Rwanda|盧安達
Saudi Arabia|沙烏地阿拉伯
Senegal|塞內加爾
Serbia|塞爾維亞
Sierra Leone|獅子山
Singapore|新加坡
Slovakia|斯洛伐克
Slovenia|斯洛維尼亞
Solomon Islands|索羅門群島
Somalia|索馬利亞
South Africa|南非
Spain|西班牙
Sri Lanka|斯里蘭卡
Sudan|蘇丹
Suriname|蘇利南
Swaziland|史瓦濟蘭
Sweden|瑞典
Switzerland|瑞士
Syria|敘利亞
Tajikistan|塔吉克
Tanzania|坦尚尼亞
Thailand|泰國
Togo|多哥
Tonga|東加
Tunisia|突尼西亞
Turkey|土耳其
Turkmenistan|土庫曼
Uganda|烏干達
Ukraine|烏克蘭
United Arab Emirates|阿拉伯聯合大公國
United Kingdom|英國
United States|美國
Uruguay|烏拉圭
Uzbekistan|烏茲別克
Vanuatu|萬那杜
Venezuela|委內瑞拉
Vietnam|越南
Yemen|葉門
Zambia|尚比亞
Zimbabwe|辛巴威'''
count=0
for row in text.splitlines():
 k,zh=row.split('|')
 if k in x['index']:
  n=x['polities'][x['index'][k]];n['zh']=zh;n['translationStatus']='curated';n['confidence']='medium';count+=1
json.dump(x,open(p,'w'),ensure_ascii=False,indent=2);print(count,'modern names curated')
