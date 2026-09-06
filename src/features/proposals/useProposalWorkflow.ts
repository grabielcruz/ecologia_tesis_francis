import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useProposalActions } from "../../hooks/useProposalActions";
import {
  ProjectExecutionStatus,
  ProjectListEntry,
  Proposal,
  ProposalProjectDetails,
} from "./types";

export type ProposalStatusFilter =
  | "all"
  | "draft"
  | "open"
  | "approved"
  | "closed"
  | "rejected";

interface GreenSpaceOption {
  id: number;
}

interface UseProposalWorkflowParams {
  token: string | null;
  route: string;
  greenSpaces: GreenSpaceOption[];
  setError: (message: string | null) => void;
  setSuccessMessage: (message: string | null) => void;
  getErrorMessage: (error: unknown, fallback: string) => string;
  navigate: (path: string, replace?: boolean) => void;
}

export function useProposalWorkflow({
  token,
  route,
  greenSpaces,
  setError,
  setSuccessMessage,
  getErrorMessage,
  navigate,
}: UseProposalWorkflowParams) {
  const proposalActions = useProposalActions(token);

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [projectEntries, setProjectEntries] = useState<ProjectListEntry[]>([]);
  const [proposalTitleInput, setProposalTitleInput] = useState("");
  const [proposalDescriptionInput, setProposalDescriptionInput] = useState("");
  const [proposalSpaceIdInput, setProposalSpaceIdInput] = useState(0);
  const [proposalActionLoadingId, setProposalActionLoadingId] = useState<
    number | null
  >(null);
  const [proposalWindows, setProposalWindows] = useState<
    Record<number, { start: string; end: string; minimumVotesRequired: string }>
  >({});
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [proposalProjectDetails, setProposalProjectDetails] = useState<
    Record<number, ProposalProjectDetails>
  >({});
  const [proposalProjectLoadingId, setProposalProjectLoadingId] = useState<
    number | null
  >(null);
  const [projectUpdateTitleInput, setProjectUpdateTitleInput] = useState("");
  const [projectUpdateDescriptionInput, setProjectUpdateDescriptionInput] =
    useState("");
  const [projectUpdateImagesInput, setProjectUpdateImagesInput] = useState("");
  const [projectStatusDrafts, setProjectStatusDrafts] = useState<
    Record<number, "planned" | "in_progress" | "completed">
  >({});
  const [uploadingProjectUpdateImages, setUploadingProjectUpdateImages] =
    useState(false);
  const [isSubmittingProjectUpdate, setIsSubmittingProjectUpdate] =
    useState(false);
  const [isUpdatingProjectStatus, setIsUpdatingProjectStatus] = useState(false);
  const [proposalStatusFilter, setProposalStatusFilter] =
    useState<ProposalStatusFilter>("all");
  const [
    proposalProjectStatusByProposalId,
    setProposalProjectStatusByProposalId,
  ] = useState<Record<number, ProjectExecutionStatus>>({});

  const selectedProposalId = useMemo(() => {
    if (!route.startsWith("/proposals/")) return null;
    const pathOnly = route.split("?")[0] || route;
    const id = Number(pathOnly.split("/")[2]);
    return Number.isFinite(id) ? id : null;
  }, [route]);

  const selectedProjectId = useMemo(() => {
    if (!route.startsWith("/projects/")) return null;
    const id = Number(route.split("/")[2]);
    return Number.isFinite(id) ? id : null;
  }, [route]);

  const selectedProjectEntry = useMemo(() => {
    if (!selectedProjectId) return null;
    return (
      projectEntries.find((entry) => entry.project.id === selectedProjectId) ||
      null
    );
  }, [projectEntries, selectedProjectId]);

  useEffect(() => {
    if (greenSpaces.length > 0 && proposalSpaceIdInput === 0) {
      setProposalSpaceIdInput(greenSpaces[0].id);
    }
  }, [greenSpaces, proposalSpaceIdInput]);

  const fetchProjectStatusesForProposals = async (proposalRows: Proposal[]) => {
    if (proposalRows.length === 0) {
      setProposalProjectStatusByProposalId({});
      return;
    }

    const nextStatuses: Record<number, ProjectExecutionStatus> = {};

    await Promise.all(
      proposalRows.map(async (proposal) => {
        try {
          const details = await proposalActions.fetchProposalProjectDetails(
            proposal.id,
          );
          setProposalProjectDetails((prev) => ({
            ...prev,
            [proposal.id]: details,
          }));

          nextStatuses[proposal.id] = details.project
            ? details.project.completedStatus
            : "not_created";
        } catch {
          // Ignore per-row failures so remaining statuses can still load.
        }
      }),
    );

    setProposalProjectStatusByProposalId(nextStatuses);
  };

  const fetchProposals = async () => {
    try {
      const proposalRows = await proposalActions.fetchProposals();
      setProposals(proposalRows);
      await fetchProjectStatusesForProposals(proposalRows);
    } catch (error) {
      setProposals([]);
      setError(getErrorMessage(error, "No se pudieron cargar las propuestas"));
    }
  };

  const fetchProjects = async () => {
    try {
      const rows = await proposalActions.fetchProjects();

      const prefetchedDetails = rows.reduce<
        Record<number, ProposalProjectDetails>
      >((acc, entry) => {
        if (!entry?.proposal || !entry?.project) {
          return acc;
        }

        acc[entry.proposal.id] = {
          proposal: entry.proposal,
          project: entry.project,
          updates: [],
        };

        return acc;
      }, {});

      setProjectEntries(rows);
      setProposalProjectDetails((prev) => ({
        ...prev,
        ...prefetchedDetails,
      }));
    } catch (error) {
      setProjectEntries([]);
      setError(getErrorMessage(error, "No se pudieron cargar los proyectos"));
    }
  };

  const fetchProposalProjectDetails = async (proposalId: number) => {
    setProposalProjectLoadingId(proposalId);
    try {
      const data =
        await proposalActions.fetchProposalProjectDetails(proposalId);
      setProposalProjectDetails((prev) => ({
        ...prev,
        [proposalId]: data,
      }));
    } catch (error) {
      setError(
        getErrorMessage(error, "No se pudo cargar el detalle del proyecto"),
      );
    } finally {
      setProposalProjectLoadingId(null);
    }
  };

  const fetchProjectDetailsByProjectId = async (projectId: number) => {
    setProposalProjectLoadingId(projectId);
    try {
      const data =
        await proposalActions.fetchProjectDetailsByProjectId(projectId);
      setProposalProjectDetails((prev) => ({
        ...prev,
        [data.proposal.id]: data,
      }));
    } catch (error) {
      setError(
        getErrorMessage(error, "No se pudo cargar el detalle del proyecto"),
      );
    } finally {
      setProposalProjectLoadingId(null);
    }
  };

  useEffect(() => {
    if (!selectedProposalId) {
      return;
    }

    void fetchProposalProjectDetails(selectedProposalId);
  }, [selectedProposalId]);

  const uploadProjectActivityImages = async (
    projectId: number,
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    if (!token) return;

    setUploadingProjectUpdateImages(true);
    setError(null);

    try {
      const uploadedPaths = await proposalActions.uploadProjectActivityImages(
        projectId,
        files,
      );

      if (uploadedPaths.length > 0) {
        setProjectUpdateImagesInput((prev) => {
          const current = prev
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line.length > 0);
          const merged = [...new Set([...current, ...uploadedPaths])];
          return merged.join("\n");
        });
      }
      event.target.value = "";
    } catch (error) {
      setError(
        getErrorMessage(
          error,
          "No se pudieron subir las imagenes de actividad",
        ),
      );
    } finally {
      setUploadingProjectUpdateImages(false);
    }
  };

  const submitProjectActivityUpdate = async (
    event: FormEvent<HTMLFormElement>,
    proposalId: number,
    projectId: number,
  ): Promise<boolean> => {
    event.preventDefault();
    if (!token) return false;

    const images = projectUpdateImagesInput
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (!projectUpdateDescriptionInput.trim()) {
      setError("Debes describir la actividad realizada");
      return false;
    }

    setIsSubmittingProjectUpdate(true);
    setError(null);
    try {
      await proposalActions.createProjectActivityUpdate(projectId, {
        title: projectUpdateTitleInput.trim(),
        description: projectUpdateDescriptionInput.trim(),
        images,
      });

      setProjectUpdateTitleInput("");
      setProjectUpdateDescriptionInput("");
      setProjectUpdateImagesInput("");
      setSuccessMessage("Actividad del proyecto registrada correctamente.");
      await fetchProposalProjectDetails(proposalId);
      await fetchProposals();
      return true;
    } catch (error) {
      setError(getErrorMessage(error, "No se pudo guardar la actividad"));
      return false;
    } finally {
      setIsSubmittingProjectUpdate(false);
    }
  };

  const updateProjectActivityUpdate = async (
    event: FormEvent<HTMLFormElement>,
    proposalId: number,
    projectId: number,
    updateId: number,
  ): Promise<boolean> => {
    event.preventDefault();
    if (!token) return false;

    const images = projectUpdateImagesInput
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (!projectUpdateDescriptionInput.trim()) {
      setError("Debes describir la actividad realizada");
      return false;
    }

    setIsSubmittingProjectUpdate(true);
    setError(null);
    try {
      await proposalActions.updateProjectActivityUpdate(projectId, updateId, {
        title: projectUpdateTitleInput.trim(),
        description: projectUpdateDescriptionInput.trim(),
        images,
      });

      setSuccessMessage("Actividad del proyecto actualizada correctamente.");
      await fetchProposalProjectDetails(proposalId);
      await fetchProposals();
      return true;
    } catch (error) {
      setError(getErrorMessage(error, "No se pudo actualizar la actividad"));
      return false;
    } finally {
      setIsSubmittingProjectUpdate(false);
    }
  };

  const deleteProjectActivityUpdate = async (
    proposalId: number,
    projectId: number,
    updateId: number,
  ): Promise<boolean> => {
    if (!token) return false;

    setIsSubmittingProjectUpdate(true);
    setError(null);
    try {
      await proposalActions.deleteProjectActivityUpdate(projectId, updateId);

      setProjectUpdateTitleInput("");
      setProjectUpdateDescriptionInput("");
      setProjectUpdateImagesInput("");
      setSuccessMessage("Actividad del proyecto eliminada correctamente.");
      await fetchProposalProjectDetails(proposalId);
      await fetchProposals();
      return true;
    } catch (error) {
      setError(getErrorMessage(error, "No se pudo eliminar la actividad"));
      return false;
    } finally {
      setIsSubmittingProjectUpdate(false);
    }
  };

  const updateProjectCompletedStatus = async (
    proposalId: number,
    projectId: number,
    completedStatus: "planned" | "in_progress" | "completed",
  ) => {
    if (!token) return;

    setIsUpdatingProjectStatus(true);
    setError(null);
    try {
      await proposalActions.updateProjectCompletedStatus(
        projectId,
        completedStatus,
      );

      setSuccessMessage("Estado del proyecto actualizado correctamente.");
      await fetchProposalProjectDetails(proposalId);
      await fetchProposals();
    } catch (error) {
      setError(
        getErrorMessage(error, "No se pudo actualizar el estado del proyecto"),
      );
    } finally {
      setIsUpdatingProjectStatus(false);
    }
  };

  const openProposalsWithFilter = (filter: ProposalStatusFilter) => {
    setProposalStatusFilter(filter);
    navigate("/proposals");
  };

  const openProjects = () => {
    navigate("/projects");
  };

  const openCreateProposalModal = () => {
    setProposalTitleInput("");
    setProposalDescriptionInput("");
    setShowProposalModal(true);
  };

  const closeCreateProposalModal = () => {
    setShowProposalModal(false);
  };

  const openProjectDetailPage = async (entry: ProjectListEntry) => {
    setProjectUpdateTitleInput("");
    setProjectUpdateDescriptionInput("");
    setProjectUpdateImagesInput("");
    navigate(`/projects/${entry.project.id}`);
    await fetchProposalProjectDetails(entry.proposal.id);
  };

  const openProposalDetailPage = async (proposal: Proposal) => {
    setProjectUpdateTitleInput("");
    setProjectUpdateDescriptionInput("");
    setProjectUpdateImagesInput("");
    navigate(`/proposals/${proposal.id}`);
    await fetchProposalProjectDetails(proposal.id);
  };

  const setProposalVotingStart = (proposalId: number, value: string) => {
    setProposalWindows((prev) => ({
      ...prev,
      [proposalId]: {
        start: value,
        end: prev[proposalId]?.end || "",
        minimumVotesRequired: prev[proposalId]?.minimumVotesRequired || "",
      },
    }));
  };

  const setProposalVotingEnd = (proposalId: number, value: string) => {
    setProposalWindows((prev) => ({
      ...prev,
      [proposalId]: {
        start: prev[proposalId]?.start || "",
        end: value,
        minimumVotesRequired: prev[proposalId]?.minimumVotesRequired || "",
      },
    }));
  };

  const setProposalMinimumVotesRequired = (
    proposalId: number,
    value: string,
  ) => {
    setProposalWindows((prev) => ({
      ...prev,
      [proposalId]: {
        start: prev[proposalId]?.start || "",
        end: prev[proposalId]?.end || "",
        minimumVotesRequired: value,
      },
    }));
  };

  const submitProposal = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    if (!proposalTitleInput.trim() || !proposalDescriptionInput.trim()) {
      setError("Completa titulo y descripcion de la propuesta");
      return;
    }

    if (!Number.isFinite(proposalSpaceIdInput) || proposalSpaceIdInput <= 0) {
      setError("Selecciona un area verde valida para la propuesta");
      return;
    }

    setIsSubmittingProposal(true);
    setError(null);
    try {
      await proposalActions.createProposal({
        title: proposalTitleInput.trim(),
        description: proposalDescriptionInput.trim(),
        spaceId: proposalSpaceIdInput,
      });

      setProposalTitleInput("");
      setProposalDescriptionInput("");
      setShowProposalModal(false);
      setSuccessMessage(
        "Propuesta enviada. Queda pendiente de validacion administrativa.",
      );
      await fetchProposals();
    } catch (error) {
      setError(getErrorMessage(error, "No se pudo registrar la propuesta"));
    } finally {
      setIsSubmittingProposal(false);
    }
  };

  const voteProposal = async (proposalId: number) => {
    if (!token) return;
    setProposalActionLoadingId(proposalId);
    setError(null);
    try {
      await proposalActions.voteProposal(proposalId);

      setSuccessMessage("Voto registrado correctamente.");
      await fetchProposals();
    } catch (error) {
      setError(getErrorMessage(error, "No se pudo votar la propuesta"));
    } finally {
      setProposalActionLoadingId(null);
    }
  };

  const decideProposal = async (
    proposalId: number,
    decision: "accepted" | "rejected",
  ) => {
    if (!token) return;
    setProposalActionLoadingId(proposalId);
    setError(null);
    const windowInput = proposalWindows[proposalId] || {
      start: "",
      end: "",
      minimumVotesRequired: "",
    };

    const decisionPayload: {
      decision: "accepted" | "rejected";
      votingStarts?: string;
      votingEnds?: string;
      minimumVotesRequired?: number;
    } = { decision };

    if (decision === "accepted") {
      decisionPayload.votingStarts = windowInput.start;
      decisionPayload.votingEnds = windowInput.end;
      const parsedMinimumVotes = Number.parseInt(
        String(windowInput.minimumVotesRequired || "").trim(),
        10,
      );
      if (Number.isFinite(parsedMinimumVotes)) {
        decisionPayload.minimumVotesRequired = parsedMinimumVotes;
      }
    }

    try {
      await proposalActions.decideProposal(proposalId, decisionPayload);

      setSuccessMessage(
        decision === "accepted"
          ? "Propuesta validada y habilitada para votacion."
          : "Propuesta rechazada.",
      );
      await fetchProposals();
      await fetchProposalProjectDetails(proposalId);
    } catch (error) {
      setError(getErrorMessage(error, "No se pudo actualizar la propuesta"));
    } finally {
      setProposalActionLoadingId(null);
    }
  };

  const finalizeProposal = async (proposalId: number) => {
    if (!token) return;
    setProposalActionLoadingId(proposalId);
    setError(null);
    try {
      await proposalActions.finalizeProposal(proposalId);

      setSuccessMessage("Proceso de votacion finalizado para la propuesta.");
      await fetchProposals();
      await fetchProposalProjectDetails(proposalId);
    } catch (error) {
      setError(getErrorMessage(error, "No se pudo finalizar la propuesta"));
    } finally {
      setProposalActionLoadingId(null);
    }
  };

  const deleteProposal = async (proposalId: number) => {
    if (!token) return;

    setProposalActionLoadingId(proposalId);
    setError(null);
    try {
      await proposalActions.deleteProposal(proposalId);
      setSuccessMessage("Propuesta eliminada correctamente.");
      await fetchProposals();
      navigate("/proposals", true);
    } catch (error) {
      setError(getErrorMessage(error, "No se pudo eliminar la propuesta"));
    } finally {
      setProposalActionLoadingId(null);
    }
  };

  const resetProposalState = () => {
    setProposals([]);
    setProjectEntries([]);
    setProposalTitleInput("");
    setProposalDescriptionInput("");
    setProposalSpaceIdInput(0);
    setProposalActionLoadingId(null);
    setProposalWindows({});
    setIsSubmittingProposal(false);
    setShowProposalModal(false);
    setProposalProjectDetails({});
    setProposalProjectLoadingId(null);
    setProjectUpdateTitleInput("");
    setProjectUpdateDescriptionInput("");
    setProjectUpdateImagesInput("");
    setProjectStatusDrafts({});
    setUploadingProjectUpdateImages(false);
    setIsSubmittingProjectUpdate(false);
    setIsUpdatingProjectStatus(false);
    setProposalStatusFilter("all");
    setProposalProjectStatusByProposalId({});
  };

  return {
    proposals,
    projectEntries,
    proposalTitleInput,
    proposalDescriptionInput,
    proposalSpaceIdInput,
    proposalActionLoadingId,
    proposalWindows,
    isSubmittingProposal,
    showProposalModal,
    proposalProjectDetails,
    proposalProjectLoadingId,
    projectUpdateTitleInput,
    projectUpdateDescriptionInput,
    projectUpdateImagesInput,
    projectStatusDrafts,
    uploadingProjectUpdateImages,
    isSubmittingProjectUpdate,
    isUpdatingProjectStatus,
    proposalStatusFilter,
    proposalProjectStatusByProposalId,
    selectedProposalId,
    selectedProjectId,
    selectedProjectEntry,
    setProposalTitleInput,
    setProposalDescriptionInput,
    setProposalSpaceIdInput,
    setProjectUpdateTitleInput,
    setProjectUpdateDescriptionInput,
    setProjectUpdateImagesInput,
    setProjectStatusDrafts,
    setProposalStatusFilter,
    fetchProposals,
    fetchProjects,
    fetchProposalProjectDetails,
    fetchProjectDetailsByProjectId,
    uploadProjectActivityImages,
    submitProjectActivityUpdate,
    updateProjectActivityUpdate,
    deleteProjectActivityUpdate,
    updateProjectCompletedStatus,
    openProposalsWithFilter,
    openProjects,
    openCreateProposalModal,
    closeCreateProposalModal,
    openProjectDetailPage,
    openProposalDetailPage,
    setProposalVotingStart,
    setProposalVotingEnd,
    setProposalMinimumVotesRequired,
    submitProposal,
    voteProposal,
    decideProposal,
    finalizeProposal,
    deleteProposal,
    resetProposalState,
  };
}
