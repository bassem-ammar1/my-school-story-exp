import { useState } from 'react';
import { Share2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog,DialogContent,DialogTitle,DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { reflectionCaption,reflectionImage,type ShareSeries,type ReflectionImageFormat } from '@/lib/reflection-share';
export function ReflectionShare({series,sample=false,label='Share to feed',format='line'}:{series:ShareSeries[];sample?:boolean;label?:string;format?:ReflectionImageFormat}){
 const [preview,setPreview]=useState<string|null>(null);const [busy,setBusy]=useState(false);const qc=useQueryClient();
 const caption=reflectionCaption(series,sample);
 const publish=async()=>{if(!preview||busy)return;setBusy(true);try{const {data,error:authError}=await supabase.auth.getUser();if(authError||!data.user)throw new Error('Sign in to share your result.');const {error}=await supabase.from('posts').insert({author_id:data.user.id,body:caption,image_url:preview,image_alt:caption});if(error)throw error;await qc.invalidateQueries({queryKey:['posts']});await qc.invalidateQueries({queryKey:['profile-posts']});setPreview(null);toast.success('Shared to your feed.');}catch(e){toast.error(e instanceof Error?e.message:'Could not share. Please try again.');}finally{setBusy(false);}};
  return <><Button variant="outline" size="sm" disabled={!series.some(s=>s.points.some(p=>p.value!==null))} onClick={()=>{try{setPreview(reflectionImage(series,sample,format));}catch{toast.error('Could not prepare the chart.');}}}><Share2 className="size-4"/>{label}</Button><Dialog open={preview!==null} onOpenChange={open=>{if(!open&&!busy)setPreview(null);}}><DialogContent className="max-h-[85vh] max-w-sm overflow-y-auto"><DialogTitle>Share to your feed?</DialogTitle><DialogDescription>This image and summary will be visible to feed readers. Your answers, goal and private account details stay private.</DialogDescription>{preview&&<img src={preview} alt={caption} className="w-full"/>}<p className="whitespace-pre-line text-sm">{caption}</p><Button disabled={busy} onClick={publish}>{busy?'Sharing…':'Publish to feed'}</Button></DialogContent></Dialog></>;
}