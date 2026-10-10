export type ShareSeries = { label: string; kind?: 'habit' | 'preference' | 'interest'; points: {date:string;value:number|null;illustrative?:boolean}[] };
export type ReflectionImageFormat = 'line' | 'donut';
export function donutGrades(series: ShareSeries[]) {
 return series.map(s=>({label:s.label,kind:s.kind,grade:s.points.at(-1)?.value ?? null}));
}
// Only the explicitly selected plotted grades are included, never private responses.
export function reflectionCaption(series: ShareSeries[], sample: boolean) {
 if(series.some(s=>s.points.some(p=>p.illustrative))) return `My reflection history (includes illustrative records, not submitted assessments)\n${series.map(s=>s.label).join(' · ')}\nGrades out of 5 · current self-reported tendencies, not ability.`;
 return `${sample ? 'Sample reflection charts (example records, not my assessment results)' : 'My reflection results'}\n${series.map(s=>s.label).join(' · ')}\nGrades out of 5 · current self-reported tendencies, not ability.`;
}
export function reflectionImage(series: ShareSeries[], sample: boolean, format: ReflectionImageFormat = 'line') {
 if(format==='donut') return donutImage(series,sample);
 const canvas=document.createElement('canvas');canvas.width=900;canvas.height=110+series.length*270;
 const ctx=canvas.getContext('2d');if(!ctx) throw new Error('Could not create the chart image.');
 const tokens=getComputedStyle(document.documentElement);
 const color=(name:string)=>tokens.getPropertyValue(name).trim();
 ctx.fillStyle=color('--card');ctx.fillRect(0,0,canvas.width,canvas.height);
 ctx.fillStyle=color('--foreground');ctx.font='bold 26px sans-serif';ctx.fillText(sample?'Sample reflection charts':'My reflection results',40,45);
  const mixed=series.some(s=>s.points.some(p=>p.illustrative));
  ctx.font='18px sans-serif';ctx.fillText(mixed?'Includes illustrative records · * example, not submitted · grades out of 5':'Self-reported tendencies · grades out of 5 · not ability',40,78);
 series.forEach((s,k)=>{
  const top=120+k*270;ctx.fillStyle=color('--foreground');ctx.font='bold 22px sans-serif';ctx.fillText(s.label,40,top);
  for(let v=1;v<=5;v++){const y=top+195-(v-1)*36;ctx.strokeStyle=color('--border');ctx.beginPath();ctx.moveTo(80,y);ctx.lineTo(830,y);ctx.stroke();ctx.font='16px sans-serif';ctx.fillText(String(v),45,y+5);}
  const x=(i:number)=>80+i*750/Math.max(1,s.points.length-1);const y=(v:number)=>top+195-(v-1)*36;
  ctx.strokeStyle=color('--primary');ctx.lineWidth=3;ctx.beginPath();let active=false;
  s.points.forEach((p,i)=>{if(p.value===null){active=false;return;}if(active)ctx.lineTo(x(i),y(p.value));else ctx.moveTo(x(i),y(p.value));active=true;});ctx.stroke();
   s.points.forEach((p,i)=>{if(p.value===null)return;ctx.fillStyle=color('--primary');ctx.beginPath();ctx.arc(x(i),y(p.value),5,0,Math.PI*2);ctx.fill();ctx.fillStyle=color('--foreground');ctx.font='16px sans-serif';ctx.textAlign='center';ctx.fillText(`${p.value.toFixed(1)}${p.illustrative?'*':''}`,x(i),y(p.value)-12);if(i===0||i===s.points.length-1||s.points.length<=6)ctx.fillText(p.date.slice(0,10),Math.min(815,Math.max(95,x(i))),top+225);ctx.textAlign='left';});
 });return canvas.toDataURL('image/png');
}
function donutImage(series: ShareSeries[], sample: boolean) {
 const grades=donutGrades(series);
 const canvas=document.createElement('canvas');canvas.width=900;canvas.height=180+Math.ceil(grades.length/2)*340;
 const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Could not create the chart image.');
 const tokens=getComputedStyle(document.documentElement);const color=(name:string)=>tokens.getPropertyValue(name).trim();
 ctx.fillStyle=color('--foreground');ctx.fillRect(0,0,canvas.width,canvas.height);
 ctx.fillStyle=color('--background');ctx.font='bold 30px sans-serif';ctx.fillText(sample?'Sample reflection results':'My reflection results',40,50);
 ctx.font='20px sans-serif';ctx.fillText('Skills / Preferences · grades out of 5',40,90);
 ctx.font='17px sans-serif';ctx.fillText('Current self-reported tendencies, not ability',40,125);
 grades.forEach((g,i)=>{
  const cx=225+(i%2)*450,cy=285+Math.floor(i/2)*340;
  const on=g.grade===null?0:Math.round(g.grade/5*72);
  for(let tick=0;tick<72;tick++){
   const a=tick/72*Math.PI*2-Math.PI/2;ctx.strokeStyle=tick<on?color(g.kind==='habit'?'--ring-skill':'--ring-pref'):color('--background');ctx.globalAlpha=tick<on?1:0.15;ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(cx+100*Math.cos(a),cy+100*Math.sin(a));ctx.lineTo(cx+122*Math.cos(a),cy+122*Math.sin(a));ctx.stroke();
  }
  ctx.globalAlpha=1;ctx.fillStyle=color('--background');ctx.textAlign='center';ctx.font='bold 46px sans-serif';ctx.fillText(g.grade===null?'Incomplete':`${g.grade.toFixed(1)}/5`,cx,cy+15);
  ctx.font='24px sans-serif';const words=g.label.split(' ');let line='',lines:string[]=[];
  for(const word of words){const next=line?`${line} ${word}`:word;if(ctx.measureText(next).width>370&&line){lines.push(line);line=word;}else line=next;}if(line)lines.push(line);lines.forEach((text,j)=>ctx.fillText(text,cx,cy+165+j*30));
 });return canvas.toDataURL('image/png');
}