export type ShareSeries = { label: string; points: {date:string;value:number|null}[] };
// Only the explicitly selected plotted grades are included, never private responses.
export function reflectionCaption(series: ShareSeries[], sample: boolean) {
 return `${sample ? 'Sample reflection charts (example records, not my assessment results)' : 'My reflection results'}\n${series.map(s=>s.label).join(' · ')}\nGrades out of 5 · current self-reported tendencies, not ability.`;
}
export function reflectionImage(series: ShareSeries[], sample: boolean) {
 const canvas=document.createElement('canvas');canvas.width=900;canvas.height=110+series.length*270;
 const ctx=canvas.getContext('2d');if(!ctx) throw new Error('Could not create the chart image.');
 const tokens=getComputedStyle(document.documentElement);
 const color=(name:string)=>tokens.getPropertyValue(name).trim();
 ctx.fillStyle=color('--card');ctx.fillRect(0,0,canvas.width,canvas.height);
 ctx.fillStyle=color('--foreground');ctx.font='bold 26px sans-serif';ctx.fillText(sample?'Sample reflection charts':'My reflection results',40,45);
 ctx.font='18px sans-serif';ctx.fillText('Self-reported tendencies · grades out of 5 · not ability',40,78);
 series.forEach((s,k)=>{
  const top=120+k*270;ctx.fillStyle=color('--foreground');ctx.font='bold 22px sans-serif';ctx.fillText(s.label,40,top);
  for(let v=1;v<=5;v++){const y=top+195-(v-1)*36;ctx.strokeStyle=color('--border');ctx.beginPath();ctx.moveTo(80,y);ctx.lineTo(830,y);ctx.stroke();ctx.font='16px sans-serif';ctx.fillText(String(v),45,y+5);}
  const x=(i:number)=>80+i*750/Math.max(1,s.points.length-1);const y=(v:number)=>top+195-(v-1)*36;
  ctx.strokeStyle=color('--primary');ctx.lineWidth=3;ctx.beginPath();let active=false;
  s.points.forEach((p,i)=>{if(p.value===null){active=false;return;}if(active)ctx.lineTo(x(i),y(p.value));else ctx.moveTo(x(i),y(p.value));active=true;});ctx.stroke();
  s.points.forEach((p,i)=>{if(p.value===null)return;ctx.fillStyle=color('--primary');ctx.beginPath();ctx.arc(x(i),y(p.value),5,0,Math.PI*2);ctx.fill();ctx.fillStyle=color('--foreground');ctx.font='16px sans-serif';ctx.textAlign='center';ctx.fillText(p.value.toFixed(1),x(i),y(p.value)-12);if(i===0||i===s.points.length-1||s.points.length<=6)ctx.fillText(p.date.slice(0,10),Math.min(815,Math.max(95,x(i))),top+225);ctx.textAlign='left';});
 });return canvas.toDataURL('image/png');
}