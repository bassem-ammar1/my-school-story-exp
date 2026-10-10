import { useEffect } from 'react';
import { useMe } from '@/hooks/use-me';
import { validTheme } from '@/lib/profile-themes';
export function SchoolTheme() {
  const { data: me } = useMe();
  const theme = validTheme(me?.profile?.theme);
  useEffect(() => {
    document.documentElement.dataset['schoolTheme'] = theme;
    return () => { delete document.documentElement.dataset['schoolTheme']; };
  }, [theme]);
  return null;
}