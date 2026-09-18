import { useMemo } from "react";
import {
  createProjectActivityUpdateApi,
  createProposalApi,
  deleteProposalApi,
  deleteProjectActivityUpdateApi,
  decideProposalApi,
  fetchProjectDetailsByProjectIdApi,
  fetchProjectsApi,
  fetchProposalProjectDetailsApi,
  fetchProposalsApi,
  finalizeProposalApi,
  updateProjectActivityUpdateApi,
  updateProjectCompletedStatusApi,
  uploadProposalImagesApi,
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
      fetchProposals: () => fetchProposalsApi(token),
      fetchProjects: () => fetchProjectsApi(token),
      fetchProposalProjectDetails: (proposalId: number) =>
        fetchProposalProjectDetailsApi(token, proposalId),
      fetchProjectDetailsByProjectId: (projectId: number) =>
        fetchProjectDetailsByProjectIdApi(token, projectId),
      createProposal: (payload: {
        title: string;
        description: string;
        spaceId: number;
        images: string[];
      }) => createProposalApi(requireToken(token), payload),
      uploadProposalImages: (files: FileList) =>
        uploadProposalImagesApi(requireToken(token), files),
      voteProposal: (proposalId: number) =>
        voteProposalApi(requireToken(token), proposalId),
      decideProposal: (
        proposalId: number,
        payload: {
          decision: "accepted" | "rejected";
          votingStarts?: string;
          votingEnds?: string;
          minimumVotesRequired?: number;
          approximateExecutionDuration?: string;
          projectBudget?: number;
          rejectionReason?: string;
        },
      ) => decideProposalApi(requireToken(token), proposalId, payload),
      finalizeProposal: (proposalId: number) =>
        finalizeProposalApi(requireToken(token), proposalId),
      deleteProposal: (proposalId: number) =>
        deleteProposalApi(requireToken(token), proposalId),
      uploadProjectActivityImages: (projectId: number, files: FileList) =>
        uploadProjectActivityImagesApi(requireToken(token), projectId, files),
      createProjectActivityUpdate: (
        projectId: number,
        payload: { title: string; description: string; images: string[] },
      ) =>
        createProjectActivityUpdateApi(requireToken(token), projectId, payload),
      updateProjectActivityUpdate: (
        projectId: number,
        updateId: number,
        payload: { title: string; description: string; images: string[] },
      ) =>
        updateProjectActivityUpdateApi(
          requireToken(token),
          projectId,
          updateId,
          payload,
        ),
      deleteProjectActivityUpdate: (projectId: number, updateId: number) =>
        deleteProjectActivityUpdateApi(
          requireToken(token),
          projectId,
          updateId,
        ),
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
