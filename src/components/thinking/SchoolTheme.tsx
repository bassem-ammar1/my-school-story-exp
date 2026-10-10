import { useEffect } from 'react';
import { useMe } from '@/hooks/use-me';
import { validTheme } from '@/lib/profile-themes';
import { useQueryClient } from '@tanstack/react-query';
import { applyPendingSignupChoice } from '@/lib/signup-choice';
import { toast } from 'sonner';
export function SchoolTheme() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  useEffect(() => {
    if (!me?.id) return;
    applyPendingSignupChoice().then(changed => { if (changed) qc.invalidateQueries({ queryKey: ['me'] }); }).catch(() => toast.error('Your account choice could not be saved. Please try again.'));
  }, [me?.id, qc]);
  const theme = validTheme(me?.profile?.theme);
  useEffect(() => {
    document.documentElement.dataset['schoolTheme'] = theme;
    return () => { delete document.documentElement.dataset['schoolTheme']; };
  }, [theme]);
  return null;
}