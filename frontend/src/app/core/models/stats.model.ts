export interface PortfolioStats {
  projects: {
    total: number;
    latest: { title: string; createdAt: string } | null;
  };
  skills: {
    total: number;
    byCategory: Record<string, number>;
  };
  profile: {
    completeness: number;
    available: boolean;
  };
}
