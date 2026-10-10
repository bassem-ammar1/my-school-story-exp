import { supabase } from '@/integrations/supabase/client';
import { validAccountChoice } from './account-choices';

/** OAuth cannot attach signup metadata; apply only a non-authoritative access request after sign-in. */
export async function applyPendingSignupChoice() {
  const raw = sessionStorage.getItem('signup-choice');
  if (!raw) return false;
  let choice: { role?: unknown; school?: unknown };
  try { choice = JSON.parse(raw); } catch { sessionStorage.removeItem('signup-choice'); return false; }
  const { error } = await supabase.rpc('set_signup_role', { _role: validAccountChoice(choice.role), _school_name: typeof choice.school === 'string' ? choice.school : '' });
  if (error) throw error;
  sessionStorage.removeItem('signup-choice');
  return true;
}