import { useMemo } from "react";
import {
  createProjectActivityUpdateApi,
  createProposalApi,
  deleteProjectActivityUpdateApi,
  decideProposalApi,
  fetchProjectDetailsByProjectIdApi,
  fetchProjectsApi,
  fetchProposalProjectDetailsApi,
  fetchProposalsApi,
  finalizeProposalApi,
  updateProjectActivityUpdateApi,
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
      fetchProjectDetailsByProjectId: (projectId: number) =>
        fetchProjectDetailsByProjectIdApi(requireToken(token), projectId),
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
        deleteProjectActivityUpdateApi(requireToken(token), projectId, updateId),
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
