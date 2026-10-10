import { useState } from 'react';
export function MemberAvatar({ url, name, className }: { url?: string | null | undefined; name: string; className: string }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  if (url && url !== failedUrl) return <img src={url} alt="" onError={() => setFailedUrl(url)} className={`${className} rounded-full object-cover`} />;
  return <span className={`${className} grid place-items-center rounded-full bg-secondary font-semibold text-secondary-foreground`}>{name.charAt(0).toUpperCase()}</span>;
}