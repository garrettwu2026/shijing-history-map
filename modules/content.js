// Pure content rules shared by the map, lists and validation tests.
export const eventDistance=(e,year)=>Math.max(e.startYear-year,year-e.endYear,0);
export const intersects=(e,year,window)=>e.startYear<=year+window&&e.endYear>=year-window;
export function stableColor(id){let hash=2166136261;for(const c of id)hash=Math.imul(hash^c.charCodeAt(0),16777619);return `hsl(${(hash>>>0)%360} 38% 65%)`;}
// A status is separate from the spelling. Legacy suffixes are normalized only
// at the display boundary; restored names retain their Chinese spelling.
export function nameDisplay(value, status='', showStatus=true){
 const raw=String(value??'');
 const pending=/待考/.test(raw)||['pending','待考','untranslated','restored-v10'].includes(status);
 const markers=raw.match(/（[^（）]*待考[^（）]*）|\(\s*待考\s*\)/g)||[];
 const text=raw.replace(/(?:（[^（）]*待考[^（）]*）|\(\s*待考\s*\))+/g,'');
 return text+(pending&&showStatus?(markers[0]||'（待考）'):'');
}
export function createNameDisplay(glossary){
 const terms=new Map();
 for(const e of glossary.entries){
  const name=nameDisplay(e.accepted_zh_TW||e.original,'',false);
  if(name.length>=2&&(e.status==='accepted'||!terms.has(name)))terms.set(name,e.status==='accepted'?'accepted':'pending');
 }
 const keys=[...terms.keys()].sort((a,b)=>b.length-a.length);
 const pattern=new RegExp('(?:'+keys.map(k=>k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+')(?:（[^（）]*待考[^（）]*）|\\(待考\\))*','g');
 return value=>String(value??'').replace(pattern,match=>{const clean=nameDisplay(match,'',false);return nameDisplay(match,terms.get(clean));});
}
// Conservative boxes only: ambiguous, transcontinental and dateline bounds
// are omitted rather than assigning the midpoint to a continent.
const regionOverrides={
 'Imerina':['非洲'],'Merina Kingdom':['非洲'],'Madagascar':['非洲'],
 'Madagascar (France)':['非洲'],'Mauritius':['非洲'],'Seychelles':['非洲'],
 'Comoros':['非洲'],'Cape Verde':['非洲'],
 'Russia':['歐洲','亞洲'],'Russian Empire':['歐洲','亞洲'],'Soviet Union':['歐洲','亞洲'],
 'Fiji':['大洋洲'],'Tonga':['大洋洲'],'Samoa':['大洋洲'],
};
export function regionFor(bounds,key='',regions){
 if(Array.isArray(regions)&&regions.length)return regions.join('／');
 if(regionOverrides[key])return regionOverrides[key].join('／');
 if(!bounds||bounds.length!==4||!bounds.every(Number.isFinite))return '';
 const [w,s,e,n]=bounds;if(w>e||e-w>100)return '';
 const within=(a,b,c,d)=>w>=a&&e<=c&&s>=b&&n<=d;
 if(n< -60)return '南極洲';
 if(within(43,-27,64,-10)||within(-26,13,-22,18))return '非洲';
 if(within(-19,-36,43,36))return '非洲';
 if(within(-170,15,-50,84))return '北美洲';
 if(within(-82,-56,-34,12))return '南美洲';
 if(within(110,-50,180,-10))return '大洋洲';
 if(within(-25,36,40,72))return '歐洲';
 if(within(45,0,180,80))return '亞洲';
 return '';
}
