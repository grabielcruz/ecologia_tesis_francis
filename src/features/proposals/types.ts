export interface Proposal {
  id: number;
  title: string;
  description: string;
  status: "draft" | "open" | "closed" | "approved" | "rejected";
  totalVotes: number;
  votingStarts: string | null;
  votingEnds: string | null;
  userId: number;
  spaceId: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface ProposalProject {
  id: number;
  title: string;
  description: string;
  completedStatus: "planned" | "in_progress" | "completed";
  proposalId: number;
  spaceId: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface ProposalProjectUpdate {
  id: number;
  title: string;
  description: string;
  images: string[];
  projectId: number;
  userId: number;
  createdBy: {
    id: number;
    username: string;
    name: string;
  } | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface ProposalProjectDetails {
  proposal: Proposal;
  project: ProposalProject | null;
  updates: ProposalProjectUpdate[];
}

export interface ProjectLatestUpdateSummary {
  id: number;
  title: string;
  description: string;
  createdBy: {
    id: number;
    username: string;
    name: string;
  } | null;
  createdAt: string | null;
}

export interface ProjectListEntry {
  proposal: Proposal;
  project: ProposalProject;
  latestUpdate: ProjectLatestUpdateSummary | null;
}

export type ProjectExecutionStatus =
  | "planned"
  | "in_progress"
  | "completed"
  | "not_created";

export type ProjectCompletionStatus = "planned" | "in_progress" | "completed";
