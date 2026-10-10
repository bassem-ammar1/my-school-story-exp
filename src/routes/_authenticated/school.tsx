import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMe } from '@/hooks/use-me';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
export const Route = createFileRoute('/_authenticated/school')({head:()=>({meta:[{title:'School enrollment · MySchoolStory'},{name:'description',content:'Review enrollment requests for your own school.'},{property:'og:title',content:'School enrollment · MySchoolStory'},{property:'og:description',content:'Review enrollment requests for your own school.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),component:School});
function School(){
 const {data:me}=useMe(); const qc=useQueryClient();
 const {data:schools=[]}=useQuery({queryKey:['owned-schools',me?.id],enabled:!!me,queryFn:async()=>{const {data,error}=await supabase.from('schools').select('*').eq('owner_id',me?.id??'');if(error)throw error;return data??[];}});
 const {data:requests=[]}=useQuery({queryKey:['school-enrollments',me?.id],enabled:schools.length>0,queryFn:async()=>{const {data,error}=await supabase.from('school_enrollments').select('id,status,student_id,education_id,school_id').in('school_id',schools.map(s=>s.id));if(error)throw error;return data??[];}});
 const review=async(id:string,approve:boolean)=>{const{error}=await supabase.rpc('review_school_enrollment',{_id:id,_approve:approve});if(error)toast.error(error.message);else{toast.success(approve?'Enrollment approved':'Enrollment rejected');qc.invalidateQueries({queryKey:['school-enrollments']});}};
 return <main className="space-y-4 p-4"><h1 className="text-2xl font-bold">{schools[0]?.name??'School enrollment'}</h1>{!schools.length&&<p className="text-muted-foreground">No school is assigned to this account.</p>}{schools.some(s=>s.test_only)&&<p className="text-sm text-muted-foreground">Restricted test school · private assessment results and post management are disabled.</p>}<h2 className="font-semibold">Enrollment requests</h2>{!requests.length&&<p className="text-sm text-muted-foreground">No enrollment requests yet.</p>}{requests.map(r=><section key={r.id} className="space-y-2 border-b pb-3"><p className="text-sm">Student enrollment · {r.status}</p>{r.status==='pending'&&<div className="flex gap-2"><Button onClick={()=>review(r.id,true)}>Approve</Button><Button variant="outline" onClick={()=>review(r.id,false)}>Reject</Button></div>}</section>)}</main>;
}