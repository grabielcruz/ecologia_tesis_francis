export interface GreenAreaReport {
  id: number;
  title: string;
  description: string;
  images: string[];
  state: "open" | "closed";
  userId: number;
  spaceId: number;
  spaceName: string;
  createdBy: {
    id: number;
    username: string;
    name: string;
  } | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export type ReportStateFilter = "open" | "closed" | "all";
