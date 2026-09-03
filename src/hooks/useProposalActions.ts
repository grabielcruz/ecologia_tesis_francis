import { useMemo } from "react";
import {
  createProjectActivityUpdateApi,
  createProposalApi,
  decideProposalApi,
  fetchProjectsApi,
  fetchProposalProjectDetailsApi,
  fetchProposalsApi,
  finalizeProposalApi,
  updateProjectCompletedStatusApi,
  uploadProjectActivityImagesApi,
  voteProposalApi,
} from "../features/proposals/api";
import { ProjectCompletionStatus } from "../features/proposals/types";

const requireToken = (token: string | null) => {
  if (!token) {
    throw new Error("No autorizado");
  }

  return token;
};

export const useProposalActions = (token: string | null) =>
  useMemo(
    () => ({
      fetchProposals: () => fetchProposalsApi(requireToken(token)),
      fetchProjects: () => fetchProjectsApi(requireToken(token)),
      fetchProposalProjectDetails: (proposalId: number) =>
        fetchProposalProjectDetailsApi(requireToken(token), proposalId),
      createProposal: (payload: {
        title: string;
        description: string;
        spaceId: number;
      }) => createProposalApi(requireToken(token), payload),
      voteProposal: (proposalId: number) =>
        voteProposalApi(requireToken(token), proposalId),
      decideProposal: (
        proposalId: number,
        payload: {
          decision: "accepted" | "rejected";
          votingStarts?: string;
          votingEnds?: string;
        },
      ) => decideProposalApi(requireToken(token), proposalId, payload),
      finalizeProposal: (proposalId: number) =>
        finalizeProposalApi(requireToken(token), proposalId),
      uploadProjectActivityImages: (projectId: number, files: FileList) =>
        uploadProjectActivityImagesApi(requireToken(token), projectId, files),
      createProjectActivityUpdate: (
        projectId: number,
        payload: { title: string; description: string; images: string[] },
      ) =>
        createProjectActivityUpdateApi(requireToken(token), projectId, payload),
      updateProjectCompletedStatus: (
        projectId: number,
        completedStatus: ProjectCompletionStatus,
      ) =>
        updateProjectCompletedStatusApi(
          requireToken(token),
          projectId,
          completedStatus,
        ),
    }),
    [token],
  );
