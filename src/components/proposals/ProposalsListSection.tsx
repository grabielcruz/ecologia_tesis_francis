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
  proposalActionLoadingId: number | null;
  userRole?: string;
  getSpaceName: (spaceId: number) => string;
  formatUpdatedAt: (value?: string) => string;
  onOpenCreateProposalModal: () => void;
  onOpenProposalDetailsModal: (proposal: Proposal) => void;
  onOpenProposalManageModal: (proposal: Proposal) => void;
  onVoteProposal: (proposalId: number) => void;
  onFinalizeProposal: (proposalId: number) => void;
}

export function ProposalsListSection({
  proposals,
  proposalStatusFilter,
  setProposalStatusFilter,
  proposalProjectStatusByProposalId,
  proposalActionLoadingId,
  userRole,
  getSpaceName,
  formatUpdatedAt,
  onOpenCreateProposalModal,
  onOpenProposalDetailsModal,
  onOpenProposalManageModal,
  onVoteProposal,
  onFinalizeProposal,
}: ProposalsListSectionProps) {
  const statusLabel: Record<Proposal["status"], string> = {
    draft: "Pendiente de validacion",
    open: "Votacion abierta",
    closed: "Cerrada sin aprobacion",
    approved: "Aprobada por votacion",
    rejected: "Rechazada por administracion",
  };

  const projectStatusLabel: Record<ProjectExecutionStatus, string> = {
    not_created: "Sin proyecto",
    planned: "Planned",
    in_progress: "In progress",
    completed: "Completed",
  };

  const filteredProposals = proposals.filter((proposal) => {
    if (proposalStatusFilter === "all") return true;
    return proposal.status === proposalStatusFilter;
  });

  const proposalColumns: DefaultTableColumn<Proposal>[] = [
    {
      key: "title",
      label: "Titulo",
      sortable: true,
      sortValue: (proposal) => proposal.title,
      render: (proposal) => proposal.title,
    },
    {
      key: "space",
      label: "Area",
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
      render: (proposal) => proposal.totalVotes,
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
    {
      key: "actions",
      label: "Acciones",
      render: (proposal) => {
        const canVote = userRole === "regular" && proposal.status === "open";
        const canManageDraft =
          userRole === "admin" && proposal.status === "draft";
        const canFinalize = userRole === "admin" && proposal.status === "open";

        return (
          <div className="table-actions">
            <button
              type="button"
              className="secondary"
              onClick={() => onOpenProposalDetailsModal(proposal)}
            >
              Ver detalle
            </button>
            {canManageDraft && (
              <button
                type="button"
                onClick={() => onOpenProposalManageModal(proposal)}
              >
                Editar
              </button>
            )}
            {canVote && (
              <button
                type="button"
                onClick={() => onVoteProposal(proposal.id)}
                disabled={proposalActionLoadingId === proposal.id}
              >
                Votar
              </button>
            )}
            {canFinalize && (
              <button
                type="button"
                className="secondary"
                onClick={() => onFinalizeProposal(proposal.id)}
                disabled={proposalActionLoadingId === proposal.id}
              >
                Finalizar
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <section className="box admin-box">
      <div className="admin-header">
        <div>
          <h2>Propuestas de mejora</h2>
          <p>
            Los usuarios registran propuestas para areas verdes y se aprueban
            mediante votacion.
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
            Votacion abierta
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
          getSearchText={(proposal) =>
            `${proposal.title} ${proposal.description} ${proposal.status} ${getSpaceName(proposal.spaceId)}`
          }
          emptyMessage="No hay propuestas visibles por el momento."
          searchPlaceholder="Buscar por titulo, descripcion o estado"
          onAdd={onOpenCreateProposalModal}
          addButtonLabel="Nueva propuesta"
        />
      </article>
    </section>
  );
}
