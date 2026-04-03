export interface Profile {
  id: number;
  heroTitle: string;
  heroSubtitle: string;
  bio: string;
  email: string;
  location: string;
  available: boolean;
  cvUrl: string | null;
}
