// Sample social content (schools, students, posts). Static + this-device posts only.
export type Post = { id: string; avatar: string; author: string; subtitle: string; when: string; body: string; likes: number; comments: number };

export const PEOPLE = [
  { avatar: "🏫", name: "Cedar Hills School", kind: "School", detail: "Beirut · 820 students" },
  { avatar: "🏫", name: "Riverside Academy", kind: "School", detail: "Tripoli · 540 students" },
  { avatar: "🏫", name: "Sunrise International School", kind: "School", detail: "Jounieh · 1,100 students" },
  { avatar: "🧑‍🎓", name: "Lina Khoury", kind: "Student", detail: "Grade 7 · Cedar Hills School" },
  { avatar: "🧑‍🎓", name: "Omar Saad", kind: "Student", detail: "Grade 8 · Riverside Academy" },
  { avatar: "🧑‍🎓", name: "Maya Haddad", kind: "Student", detail: "Grade 6 · Sunrise International" },
  { avatar: "👩‍🏫", name: "Ms. Rania Haddad", kind: "Teacher", detail: "Math · Cedar Hills School" },
];

export const SAMPLE_POSTS: Post[] = [
  { id: "s1", avatar: "🏫", author: "Cedar Hills School", subtitle: "School · Beirut", when: "2h", body: "Science fair next Friday! 🔬 Grade 6–8 students: bring your experiments and explain your thinking to the judges. Sign-ups close Wednesday.", likes: 24, comments: 6 },
  { id: "s2", avatar: "🧑‍🎓", author: "Lina Khoury", subtitle: "Grade 7 · Cedar Hills School", when: "5h", body: "How I solved the fraction puzzle: I drew the pizza as 8 slices first, then noticed 3/4 is the same as 6/8. Drawing it made it click! 🍕", likes: 15, comments: 4 },
  { id: "s3", avatar: "👩‍🏫", author: "Ms. Rania Haddad", subtitle: "Math teacher · Cedar Hills School", when: "1d", body: "New challenge is live 🎯 Try this week's assessment on patterns. Show every step — the reasoning matters more than the answer.", likes: 31, comments: 9 },
];

const KEY = "msstory-posts";
export function loadMyPosts(): Post[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; }
}
export function addMyPost(author: string, body: string) {
  const p: Post = { id: crypto.randomUUID(), avatar: "🙂", author, subtitle: "You", when: "now", body, likes: 0, comments: 0 };
  localStorage.setItem(KEY, JSON.stringify([p, ...loadMyPosts()]));
}
