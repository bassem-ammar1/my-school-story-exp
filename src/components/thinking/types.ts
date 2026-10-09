export type ChallengeView = {
  id: string;
  title: string;
  prompt_text: string;
  prompt_image?: string | null;
  concept_tokens: string[];
};

export type StepImage = { step: number; path: string; alt: string };

export type ArtifactView = {
  id: string;
  submissionId: string;
  challengeId: string;
  studentId: string;
  name: string;
  avatar: string | null;
  concept: string;
  confidence: number;
  steps: [string, string, string];
  images: { step: number; url: string; alt: string }[];
  voiceUrl: string | null;
  transcript: string | null;
  reactions: Record<string, number>;
  mine: string[];
  annotationCount: number;
  publishedAt: string;
  visibility?: string;
};

export type AnnotationView = { id: string; step_ref: number | null; text: string; x: number | null; y: number | null; author?: string };

export type CoachState = { hints: string[]; next_step: string; praise: string; remaining: number } | null;
