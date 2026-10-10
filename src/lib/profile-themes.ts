export const SCHOOL_THEMES = [
  { id: 'classic', name: 'Classic', idea: 'Indigo & gold', swatch: 'theme-classic' },
  { id: 'garden', name: 'School garden', idea: 'Forest & rose', swatch: 'theme-garden' },
  { id: 'coral', name: 'Creative studio', idea: 'Coral & teal', swatch: 'theme-coral' },
] as const;
export const KIDS_THEMES = [
  { id: 'spongebob', name: 'SpongeBob', idea: 'Ocean fun', swatch: 'theme-spongebob' },
  { id: 'minecraft', name: 'Minecraft', idea: 'Block adventure', swatch: 'theme-minecraft' },
  { id: 'powerpuff', name: 'Powerpuff', idea: 'Superhero sparkle', swatch: 'theme-powerpuff' },
] as const;
export const ALL_THEMES = [...SCHOOL_THEMES, ...KIDS_THEMES];
export function validTheme(value: unknown): string {
  return ALL_THEMES.some(t => t.id === value) ? String(value) : 'classic';
}
export const SAMPLE_ACHIEVEMENTS = [
  { icon: '🌱', title: 'Community project', detail: 'Sample achievement: collaborated on a school garden idea and presented ways to make it more sustainable.' },
  { icon: '💡', title: 'Creative problem solver', detail: 'Sample achievement: compared two approaches to a classroom challenge and explained what could be improved.' },
  { icon: '🤝', title: 'Peer supporter', detail: 'Sample achievement: helped a classmate organize an idea into clear steps.' },
];