import {
  ProjectCompletionStatus,
  ProjectListEntry,
  Proposal,
  ProposalProjectDetails,
} from "./types";

interface ProposalDecisionPayload {
  decision: "accepted" | "rejected";
  votingStarts?: string;
  votingEnds?: string;
  minimumVotesRequired?: number;
  approximateExecutionDuration?: string;
  projectBudget?: number;
  rejectionReason?: string;
}

interface CreateProposalPayload {
  title: string;
  description: string;
  spaceId: number;
  images: string[];
}

interface CreateProjectUpdatePayload {
  title: string;
  description: string;
  images: string[];
}

interface UpdateProjectUpdatePayload {
  title: string;
  description: string;
  images: string[];
}

const readResponseError = async (response: Response, fallback: string) => {
  const data = await response.json().catch(() => ({}));
  const message =
    data && typeof data.error === "string" && data.error.trim().length > 0
      ? data.error
      : fallback;
  throw new Error(message);
};

const authHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

const optionalAuthHeaders = (token?: string | null) =>
  token ? authHeaders(token) : undefined;

const authJsonHeaders = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

export const fetchProposalsApi = async (
  token?: string | null,
): Promise<Proposal[]> => {
  const response = await fetch("/api/proposals", {
    headers: optionalAuthHeaders(token),
  });

  if (!response.ok) {
    await readResponseError(response, "No se pudieron cargar las propuestas");
  }

  const data = await response.json();
  return Array.isArray(data) ? (data as Proposal[]) : [];
};

export const fetchProposalProjectDetailsApi = async (
  token: string | null,
  proposalId: number,
): Promise<ProposalProjectDetails> => {
  const response = await fetch(`/api/proposals/${proposalId}/project`, {
    headers: optionalAuthHeaders(token),
  });

  if (!response.ok) {
    await readResponseError(
      response,
      "No se pudo cargar el detalle del proyecto",
    );
  }

  return (await response.json()) as ProposalProjectDetails;
};

export const fetchProjectDetailsByProjectIdApi = async (
  token: string | null,
  projectId: number,
): Promise<ProposalProjectDetails> => {
  const response = await fetch(`/api/proposals/projects/${projectId}`, {
    headers: optionalAuthHeaders(token),
  });

  if (!response.ok) {
    await readResponseError(
      response,
      "No se pudo cargar el detalle del proyecto",
    );
  }

  return (await response.json()) as ProposalProjectDetails;
};

export const fetchProjectsApi = async (
  token?: string | null,
): Promise<ProjectListEntry[]> => {
  const response = await fetch("/api/projects", {
    headers: optionalAuthHeaders(token),
  });

  if (!response.ok) {
    await readResponseError(response, "No se pudieron cargar los proyectos");
  }

  const data = await response.json();
  return Array.isArray(data) ? (data as ProjectListEntry[]) : [];
};

export const createProposalApi = async (
  token: string,
  payload: CreateProposalPayload,
): Promise<Proposal> => {
  const response = await fetch("/api/proposals", {
    method: "POST",
    headers: authJsonHeaders(token),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    await readResponseError(response, "No se pudo registrar la propuesta");
  }

  return (await response.json()) as Proposal;
};

export const uploadProposalImagesApi = async (
  token: string,
  files: FileList,
): Promise<string[]> => {
  const formData = new FormData();
  Array.from(files).forEach((file) => formData.append("images", file));

  const response = await fetch("/api/proposals/images", {
    method: "POST",
    headers: authHeaders(token),
    body: formData,
  });

  if (!response.ok) {
    await readResponseError(response, "No se pudieron subir las imágenes");
  }

  const data = await response.json();
  return Array.isArray(data.images)
    ? data.images.map((image: string) => image.trim()).filter(Boolean)
    : [];
};

export const voteProposalApi = async (
  token: string,
  proposalId: number,
): Promise<{ ok: true; proposalId: number; totalVotes: number }> => {
  const response = await fetch(`/api/proposals/${proposalId}/votes`, {
    method: "POST",
    headers: authHeaders(token),
  });

  if (!response.ok) {
    await readResponseError(response, "No se pudo votar la propuesta");
  }

  return (await response.json()) as {
    ok: true;
    proposalId: number;
    totalVotes: number;
  };
};

export const decideProposalApi = async (
  token: string,
  proposalId: number,
  payload: ProposalDecisionPayload,
): Promise<void> => {
  const response = await fetch(`/api/proposals/${proposalId}/decision`, {
    method: "PATCH",
    headers: authJsonHeaders(token),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    await readResponseError(response, "No se pudo actualizar la propuesta");
  }
};

export const finalizeProposalApi = async (
  token: string,
  proposalId: number,
): Promise<void> => {
  const response = await fetch(`/api/proposals/${proposalId}/finalize`, {
    method: "POST",
    headers: authHeaders(token),
  });

  if (!response.ok) {
    await readResponseError(response, "No se pudo finalizar la propuesta");
  }
};

export const deleteProposalApi = async (
  token: string,
  proposalId: number,
): Promise<void> => {
  const response = await fetch(`/api/proposals/${proposalId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });

  if (!response.ok) {
    await readResponseError(response, "No se pudo eliminar la propuesta");
  }
};

export const uploadProjectActivityImagesApi = async (
  token: string,
  projectId: number,
  files: FileList,
): Promise<string[]> => {
  const formData = new FormData();
  Array.from(files).forEach((file) => formData.append("images", file));

  const response = await fetch(
    `/api/proposals/projects/${projectId}/updates/images`,
    {
      method: "POST",
      headers: authHeaders(token),
      body: formData,
    },
  );

  if (!response.ok) {
    await readResponseError(
      response,
      "No se pudieron subir las imagenes de actividad",
    );
  }

  const data = await response.json();
  return Array.isArray(data.images)
    ? data.images.map((image: string) => image.trim()).filter(Boolean)
    : [];
};

export const createProjectActivityUpdateApi = async (
  token: string,
  projectId: number,
  payload: CreateProjectUpdatePayload,
): Promise<void> => {
  const response = await fetch(`/api/proposals/projects/${projectId}/updates`, {
    method: "POST",
    headers: authJsonHeaders(token),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    await readResponseError(response, "No se pudo guardar la actividad");
  }
};

export const updateProjectActivityUpdateApi = async (
  token: string,
  projectId: number,
  updateId: number,
  payload: UpdateProjectUpdatePayload,
): Promise<void> => {
  const response = await fetch(
    `/api/proposals/projects/${projectId}/updates/${updateId}`,
    {
      method: "PUT",
      headers: authJsonHeaders(token),
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    await readResponseError(response, "No se pudo actualizar la actividad");
  }
};

export const deleteProjectActivityUpdateApi = async (
  token: string,
  projectId: number,
  updateId: number,
): Promise<void> => {
  const response = await fetch(
    `/api/proposals/projects/${projectId}/updates/${updateId}`,
    {
      method: "DELETE",
      headers: authHeaders(token),
    },
  );

  if (!response.ok) {
    await readResponseError(response, "No se pudo eliminar la actividad");
  }
};

export const updateProjectCompletedStatusApi = async (
  token: string,
  projectId: number,
  completedStatus: ProjectCompletionStatus,
): Promise<void> => {
  const response = await fetch(`/api/proposals/projects/${projectId}/status`, {
    method: "PATCH",
    headers: authJsonHeaders(token),
    body: JSON.stringify({ completedStatus }),
  });

  if (!response.ok) {
    await readResponseError(
      response,
      "No se pudo actualizar el estado del proyecto",
    );
  }
};
