export interface Project {
  id: number;
  title: string;
  description: string;
  stack: string[];
  githubUrl?: string | null;
  liveUrl?: string | null;
  imageUrl?: string | null;
  createdAt: string;
}
