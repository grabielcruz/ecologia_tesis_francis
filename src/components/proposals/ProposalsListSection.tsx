import { DefaultTable, DefaultTableColumn } from "../DefaultTable";
import {
  ProjectExecutionStatus,
  Proposal,
} from "../../features/proposals/types";

interface ProposalsListSectionProps {
  proposals: Proposal[];
  proposalStatusFilter:
    | "all"
    | "draft"
    | "open"
    | "approved"
    | "closed"
    | "rejected";
  setProposalStatusFilter: (
    value: "all" | "draft" | "open" | "approved" | "closed" | "rejected",
  ) => void;
  proposalProjectStatusByProposalId: Record<number, ProjectExecutionStatus>;
  getSpaceName: (spaceId: number) => string;
  formatUpdatedAt: (value?: string) => string;
  onOpenCreateProposalModal?: () => void;
  onOpenProposalDetailPage: (proposal: Proposal) => void;
}

export function ProposalsListSection({
  proposals,
  proposalStatusFilter,
  setProposalStatusFilter,
  proposalProjectStatusByProposalId,
  getSpaceName,
  formatUpdatedAt,
  onOpenCreateProposalModal,
  onOpenProposalDetailPage,
}: ProposalsListSectionProps) {
  const statusLabel: Record<Proposal["status"], string> = {
    draft: "Pendiente de validación",
    open: "Votación abierta",
    closed: "Cerrada sin aprobación",
    approved: "Aprobada por votación",
    rejected: "Rechazada por administración",
  };

  const projectStatusLabel: Record<ProjectExecutionStatus, string> = {
    not_created: "Sin proyecto",
    planned: "Planificado",
    in_progress: "En progreso",
    completed: "Completado",
  };

  const getVoteThresholdStatus = (proposal: Proposal) => {
    const minimumVotesRequired = proposal.minimumVotesRequired;
    if (!minimumVotesRequired || minimumVotesRequired <= 0) {
      return {
        className: "not_configured",
        label: "Umbral no definido",
      } as const;
    }

    if (proposal.totalVotes >= minimumVotesRequired) {
      return {
        className: "reached",
        label: "Umbral alcanzado",
      } as const;
    }

    return {
      className: "pending",
      label: "Pendiente de umbral",
    } as const;
  };

  const filteredProposals = proposals.filter((proposal) => {
    if (proposalStatusFilter === "all") return true;
    return proposal.status === proposalStatusFilter;
  });

  const proposalColumns: DefaultTableColumn<Proposal>[] = [
    {
      key: "title",
      label: "Título",
      sortable: true,
      sortValue: (proposal) => proposal.title,
      render: (proposal) => proposal.title,
    },
    {
      key: "space",
      label: "Área",
      sortable: true,
      sortValue: (proposal) => getSpaceName(proposal.spaceId),
      render: (proposal) => getSpaceName(proposal.spaceId),
    },
    {
      key: "status",
      label: "Estado",
      sortable: true,
      sortValue: (proposal) => proposal.status,
      render: (proposal) => (
        <span className={`pill proposal-status ${proposal.status}`}>
          {statusLabel[proposal.status]}
        </span>
      ),
    },
    {
      key: "votes",
      label: "Votos",
      sortable: true,
      sortValue: (proposal) => proposal.totalVotes,
      render: (proposal) =>
        proposal.minimumVotesRequired && proposal.minimumVotesRequired > 0
          ? `${proposal.totalVotes}/${proposal.minimumVotesRequired}`
          : String(proposal.totalVotes),
    },
    {
      key: "voteThreshold",
      label: "Aprobación",
      sortable: true,
      sortValue: (proposal) => {
        const thresholdStatus = getVoteThresholdStatus(proposal);
        return thresholdStatus.className;
      },
      render: (proposal) => {
        const thresholdStatus = getVoteThresholdStatus(proposal);
        return (
          <span
            className={`pill proposal-vote-threshold-status ${thresholdStatus.className}`}
          >
            {thresholdStatus.label}
          </span>
        );
      },
    },
    {
      key: "projectStatus",
      label: "Estado del proyecto",
      sortable: true,
      sortValue: (proposal) =>
        proposalProjectStatusByProposalId[proposal.id] || "not_created",
      render: (proposal) => {
        const projectStatus =
          proposalProjectStatusByProposalId[proposal.id] || "not_created";
        return (
          <span className={`pill proposal-project-status ${projectStatus}`}>
            {projectStatusLabel[projectStatus]}
          </span>
        );
      },
    },
    {
      key: "updatedAt",
      label: "Actualizada",
      sortable: true,
      sortValue: (proposal) => proposal.updatedAt || "",
      render: (proposal) => formatUpdatedAt(proposal.updatedAt || undefined),
    },
  ];

  return (
    <section className="box admin-box">
      <div className="admin-header">
        <div>
          <h2>Propuestas de mejora</h2>
          <p>
            Los usuarios registran propuestas para áreas verdes y se aprueban
            mediante votación.
          </p>
        </div>
      </div>

      <article className="principal-panel">
        <h3>Listado de propuestas</h3>
        <div className="proposal-filter-row">
          <button
            type="button"
            className={proposalStatusFilter === "all" ? "secondary" : undefined}
            onClick={() => setProposalStatusFilter("all")}
          >
            Todas
          </button>
          <button
            type="button"
            className={
              proposalStatusFilter === "open" ? "secondary" : undefined
            }
            onClick={() => setProposalStatusFilter("open")}
          >
            Votación abierta
          </button>
          <button
            type="button"
            className={
              proposalStatusFilter === "draft" ? "secondary" : undefined
            }
            onClick={() => setProposalStatusFilter("draft")}
          >
            Pendientes
          </button>
          <button
            type="button"
            className={
              proposalStatusFilter === "approved" ? "secondary" : undefined
            }
            onClick={() => setProposalStatusFilter("approved")}
          >
            Aprobadas
          </button>
        </div>
        <DefaultTable
          rows={filteredProposals}
          columns={proposalColumns}
          getRowId={(proposal) => proposal.id}
          onRowClick={onOpenProposalDetailPage}
          getSearchText={(proposal) =>
            `${proposal.title} ${proposal.description} ${proposal.status} ${getSpaceName(proposal.spaceId)}`
          }
          emptyMessage="No hay propuestas visibles por el momento."
          searchPlaceholder="Buscar por título, descripción o estado"
          onAdd={onOpenCreateProposalModal}
          addButtonLabel="Nueva propuesta"
        />
      </article>
    </section>
  );
}
