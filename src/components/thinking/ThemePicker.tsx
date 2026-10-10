import { Button } from '@/components/ui/button';
import { SCHOOL_THEMES, KIDS_THEMES } from '@/lib/profile-themes';
import ocean from '@/assets/theme-spongebob.jpg';
import blocks from '@/assets/theme-minecraft.jpg';
import heroes from '@/assets/theme-powerpuff.jpg';

const pictures: Record<string, string> = { spongebob: ocean, minecraft: blocks, powerpuff: heroes };
export function ThemePicker({ current, onChoose }: { current: string; onChoose: (theme: string) => Promise<void> }) {
  return <div className="space-y-5">{[{ name: 'School themes', themes: SCHOOL_THEMES }, { name: 'Kids themes', themes: KIDS_THEMES }].map(group => <section key={group.name} className="space-y-2"><h2 className="font-semibold">{group.name}</h2><div className="grid grid-cols-3 gap-2">{group.themes.map(t => <Button key={t.id} variant="outline" aria-label={`Choose ${t.name} theme`} aria-pressed={current === t.id} onClick={() => onChoose(t.id)} className={`h-auto min-w-0 flex-col gap-2 overflow-hidden whitespace-normal px-2 py-3 ${current === t.id ? 'border-primary ring-1 ring-ring' : ''}`}>{pictures[t.id] ? <img src={pictures[t.id]} alt="" loading="lazy" width={1536} height={768} className="aspect-[4/3] w-full rounded-sm object-cover" /> : <span className={`theme-swatch ${t.swatch} h-6 w-full rounded-sm`} />}<span className="text-xs font-semibold">{t.name}</span><span className="text-[10px] text-muted-foreground">{t.idea}</span></Button>)}</div></section>)}</div>;
}