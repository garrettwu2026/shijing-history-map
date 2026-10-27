// Pure content rules shared by the map, lists and validation tests.
export const eventDistance=(e,year)=>Math.max(e.startYear-year,year-e.endYear,0);
export const intersects=(e,year,window)=>e.startYear<=year+window&&e.endYear>=year-window;
export function stableColor(id){let hash=2166136261;for(const c of id)hash=Math.imul(hash^c.charCodeAt(0),16777619);return `hsl(${(hash>>>0)%360} 38% 65%)`;}
export function regionFor(bounds){const x=(bounds[0]+bounds[2])/2,y=(bounds[1]+bounds[3])/2;return y< -60?'南極洲':x< -30?(y>12?'北美洲':'南美洲'):x>110&&y< -10?'大洋洲':x>45?'亞洲':y>35?'歐洲':'非洲';}
