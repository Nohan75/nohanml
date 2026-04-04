export interface Experience {
  id: number;
  title: string;
  company: string;
  location?: string;
  startDate: string;
  endDate?: string;
  description: string;
  thumbnailUrl?: string;
  photos: string[];
  createdAt: string;
}
