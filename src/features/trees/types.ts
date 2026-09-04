export type TreeHealthStatus = "healthy" | "regular" | "sick" | "dead";
export type TreeInventoryStatus = "pending" | "approved" | "rejected";

export interface TreeInventoryItem {
  id: number;
  name: string;
  healthStatus: TreeHealthStatus;
  typeId: number | null;
  spaceId: number;
  status: TreeInventoryStatus;
  submittedByUserId: number;
  validatedByUserId: number | null;
  imageUrls: string[];
  treeType: {
    id: number;
    name: string;
  } | null;
  greenSpace: {
    id: number;
    name: string;
  } | null;
  submittedBy: {
    id: number;
    username: string;
    name: string;
  } | null;
  validatedBy: {
    id: number;
    username: string;
    name: string;
  } | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}
