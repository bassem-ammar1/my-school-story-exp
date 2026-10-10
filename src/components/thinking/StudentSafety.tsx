import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { studentAge } from '@/lib/student-safety';
import type { Me } from '@/hooks/use-me';
export function StudentSafety({ me }: { me: Me }) {
 const age = studentAge(me.dateOfBirth);
 const { data: guardians = [] } = useQuery({ queryKey: ['guardians', me.id], queryFn: async () => {
  const { data, error } = await supabase.from('guardian_connections').select('id,email,accepted_at,student_approved,guardian_approved').eq('student_id',me.id);
  if(error) throw error; return data ?? [];
 }});
 return <section className="space-y-2 border-t pt-3"><h3 className="font-semibold">Age & guardian permission</h3><p className="text-sm">Date of birth: {me.dateOfBirth ? me.dateOfBirth.split('-').reverse().join('-') : 'Not recorded'}</p><p className="text-sm">{age === null ? 'Age not yet verified' : age >= 13 ? '✓ I am 13 or older' : '✓ I am under 13'}</p><p className="text-sm text-muted-foreground">Guardian consent: {guardians.some(g=>g.accepted_at && g.student_approved && g.guardian_approved) ? 'Both approvals recorded' : 'Not verified'}</p>{guardians.map(g=><p key={g.id} className="break-words text-xs text-muted-foreground">{g.email} · {g.accepted_at ? 'Email verified' : 'Pending guardian verification'}</p>)}<p className="text-xs text-muted-foreground">Private information · never shown on your member profile. School assessment sharing is not enabled for test schools.</p></section>;
}