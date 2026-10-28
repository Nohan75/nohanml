export interface Experience {
  id: number;
  title: string;
  company: string;
  location?: string | null;
  startDate: string;
  endDate?: string | null;
  description: string;
  thumbnailUrl?: string | null;
  photos: string[];
  createdAt: string;
}
