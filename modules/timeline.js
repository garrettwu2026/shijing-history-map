  // Keep the long prehistoric interval compact while retaining modern detail.
  const segments=[[-1000000,0],[-5000,100],[-1000,280],[500,460],[1500,640],[1900,820],[2026,1000]];
  function interpolate(value,from,to){let i=0;while(i<segments.length-2&&value>segments[i+1][from])i++;const a=segments[i],b=segments[i+1];return a[to]+(value-a[from])/(b[from]-a[from])*(b[to]-a[to]);}
  export const positionFor=y=>interpolate(y,0,1);
export const yearFor=p=>Math.round(interpolate(p,1,0));
