import { useState } from "react";
import {
  Proposal,
  ProposalProjectDetails,
} from "../../features/proposals/types";
import { AppModal } from "../AppModal";
import { ImageCarousel } from "../ImageCarousel";

interface ProposalDetailSectionProps {
  selectedProposalId: number | null;
  proposal: Proposal | null;
  projectDetails?: ProposalProjectDetails;
  isProjectLoading: boolean;
  userRole?: string;
  proposalActionLoadingId: number | null;
  votingStart: string;
  votingEnd: string;
  minimumVotesRequired: string;
  approximateExecutionDuration: string;
  projectBudget: string;
  rejectionReason: string;
  onChangeVotingStart: (value: string) => void;
  onChangeVotingEnd: (value: string) => void;
  onChangeMinimumVotesRequired: (value: string) => void;
  onChangeApproximateExecutionDuration: (value: string) => void;
  onChangeProjectBudget: (value: string) => void;
  onChangeRejectionReason: (value: string) => void;
  onVoteProposal: (proposalId: number) => void;
  onAcceptProposal: (proposalId: number) => void;
  onRejectProposal: (proposalId: number) => void;
  onFinalizeProposal: (proposalId: number) => void;
  onDeleteRejectedProposal: (proposalId: number) => void;
  onOpenProject: (projectId: number) => void;
  resolveAssetUrl: (assetPath: string) => string;
  onBack: () => void;
}

export function ProposalDetailSection({
  selectedProposalId,
  proposal,
  projectDetails,
  isProjectLoading,
  userRole,
  proposalActionLoadingId,
  votingStart,
  votingEnd,
  minimumVotesRequired,
  approximateExecutionDuration,
  projectBudget,
  rejectionReason,
  onChangeVotingStart,
  onChangeVotingEnd,
  onChangeMinimumVotesRequired,
  onChangeApproximateExecutionDuration,
  onChangeProjectBudget,
  onChangeRejectionReason,
  onVoteProposal,
  onAcceptProposal,
  onRejectProposal,
  onFinalizeProposal,
  onDeleteRejectedProposal,
  onOpenProject,
  resolveAssetUrl,
  onBack,
}: ProposalDetailSectionProps) {
  const [showRejectModal, setShowRejectModal] = useState(false);

  const proposalStatusLabel: Record<Proposal["status"], string> = {
    draft: "Pendiente de validación",
    open: "Votación abierta",
    closed: "Cerrada sin aprobación",
    approved: "Aprobada por votación",
    rejected: "Rechazada por administración",
  };

  const projectCompletionStatusLabel: Record<
    NonNullable<ProposalProjectDetails["project"]>["completedStatus"],
    string
  > = {
    planned: "Planificado",
    in_progress: "En progreso",
    completed: "Completado",
  };

  if (!proposal || !selectedProposalId) {
    return (
      <section className="box">
        <p>La propuesta solicitada no existe o no está disponible.</p>
        <button type="button" onClick={onBack}>
          Volver a propuestas
        </button>
      </section>
    );
  }

  const voteThresholdStatus = (() => {
    const minimumVotes = proposal.minimumVotesRequired;
    if (!minimumVotes || minimumVotes <= 0) {
      return {
        className: "not_configured",
        label: "Umbral no definido",
      } as const;
    }

    if (proposal.totalVotes >= minimumVotes) {
      return {
        className: "reached",
        label: "Umbral alcanzado",
      } as const;
    }

    return {
      className: "pending",
      label: "Pendiente de umbral",
    } as const;
  })();

  const formatVoteDate = (value: string | null) => {
    if (!value) return "Fecha no disponible";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;

    return parsed.toLocaleString("es-VE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const minVotingStart = (() => {
    const now = new Date();
    const timezoneOffsetInMs = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - timezoneOffsetInMs)
      .toISOString()
      .slice(0, 16);
  })();

  const formatUsdCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);

  const project = projectDetails?.project || null;
  const voters = projectDetails?.voters || [];
  const currentUserHasVoted = Boolean(projectDetails?.currentUserHasVoted);

  const openRejectModal = () => {
    setShowRejectModal(true);
  };

  const closeRejectModal = () => {
    setShowRejectModal(false);
  };

  const confirmRejectProposal = () => {
    onRejectProposal(proposal.id);
    setShowRejectModal(false);
  };

  return (
    <section className="box admin-box">
      <div className="admin-header">
        <div>
          <h2>Detalle de propuesta</h2>
          <p>{proposal.title}</p>
        </div>
        <button type="button" className="secondary" onClick={onBack}>
          Volver
        </button>
      </div>

      <article className="principal-panel">
        {proposal.proposalImages && proposal.proposalImages.length > 0 ? (
          <ImageCarousel
            images={proposal.proposalImages}
            title={proposal.title}
            resolveAssetUrl={resolveAssetUrl}
            className="detail-carousel"
          />
        ) : null}

        <div className="details-grid">
          <div className="details-item full-width">
            <span>Descripción</span>
            <strong>{proposal.description}</strong>
          </div>
          <div className="details-item">
            <span>Estado</span>
            <strong>{proposalStatusLabel[proposal.status]}</strong>
          </div>
          <div className="details-item">
            <span>Votos</span>
            <strong>{proposal.totalVotes}</strong>
          </div>
          <div className="details-item">
            <span>Mínimo para aprobar</span>
            <strong>
              {proposal.minimumVotesRequired &&
              proposal.minimumVotesRequired > 0
                ? proposal.minimumVotesRequired
                : "No definido"}
            </strong>
          </div>
          <div className="details-item">
            <span>Progreso de votación</span>
            <strong>
              {proposal.minimumVotesRequired &&
              proposal.minimumVotesRequired > 0
                ? `${proposal.totalVotes}/${proposal.minimumVotesRequired}`
                : `${proposal.totalVotes} votos`}
            </strong>
          </div>
          <div className="details-item">
            <span>Duración aproximada del proyecto</span>
            <strong>
              {proposal.approximateExecutionDuration || "No definida"}
            </strong>
          </div>
          {userRole === "admin" && (
            <div className="details-item">
              <span>Presupuesto del proyecto (USD)</span>
              <strong>
                {proposal.projectBudget != null
                  ? formatUsdCurrency(Number(proposal.projectBudget))
                  : "No definido"}
              </strong>
            </div>
          )}
          {proposal.rejectionReason ? (
            <div className="details-item full-width">
              <span>Motivo de rechazo</span>
              <strong>{proposal.rejectionReason}</strong>
            </div>
          ) : null}
          <div className="details-item full-width">
            <span>Estado de aprobación por votos</span>
            <strong>
              <span
                className={`pill proposal-vote-threshold-status ${voteThresholdStatus.className} proposal-threshold-pill`}
              >
                {voteThresholdStatus.label}
              </span>
            </strong>
          </div>
        </div>

        {userRole === "regular" && proposal.status === "open" && (
          <div className="button-row">
            <button
              type="button"
              onClick={() => onVoteProposal(proposal.id)}
              disabled={
                proposalActionLoadingId === proposal.id || currentUserHasVoted
              }
            >
              {currentUserHasVoted ? "Ya votaste" : "Votar propuesta"}
            </button>
          </div>
        )}

        {userRole === "admin" && proposal.status === "draft" && (
          <div className="admin-form">
            <h4>Acciones administrativas</h4>
            <div className="field-row">
              <label>
                Mínimo de votos requeridos
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={minimumVotesRequired}
                  onChange={(e) => onChangeMinimumVotesRequired(e.target.value)}
                  placeholder="Ejemplo: 6"
                />
              </label>
            </div>
            <div className="field-row">
              <label>
                Duración aproximada de ejecución
                <input
                  type="text"
                  value={approximateExecutionDuration}
                  onChange={(e) =>
                    onChangeApproximateExecutionDuration(e.target.value)
                  }
                  placeholder="Ejemplo: 4 semanas"
                  required
                />
              </label>
              <label>
                Presupuesto del proyecto (USD)
                <input
                  type="number"
                  min={1}
                  step="0.01"
                  value={projectBudget}
                  onChange={(e) => onChangeProjectBudget(e.target.value)}
                  placeholder="Ejemplo: 2500.00"
                  required
                />
              </label>
            </div>
            <div className="field-row">
              <label>
                Inicio de votación
                <input
                  type="datetime-local"
                  min={minVotingStart}
                  value={votingStart}
                  onChange={(e) => onChangeVotingStart(e.target.value)}
                />
              </label>
              <label>
                Fin de votación
                <input
                  type="datetime-local"
                  min={votingStart || minVotingStart}
                  value={votingEnd}
                  onChange={(e) => onChangeVotingEnd(e.target.value)}
                />
              </label>
            </div>
            <div className="button-row">
              <button
                type="button"
                onClick={() => onAcceptProposal(proposal.id)}
                disabled={proposalActionLoadingId === proposal.id}
              >
                Guardar y abrir votación
              </button>
              <button
                type="button"
                className="danger"
                onClick={openRejectModal}
                disabled={proposalActionLoadingId === proposal.id}
              >
                Rechazar propuesta
              </button>
            </div>
          </div>
        )}

        <AppModal
          isOpen={
            userRole === "admin" &&
            proposal.status === "draft" &&
            showRejectModal
          }
          onClose={closeRejectModal}
          title="Motivo de rechazo"
          description="Explica por qué esta propuesta debe rechazarse antes de enviarla."
        >
          <div className="admin-form">
            <div className="field-row">
              <label>
                Motivo de rechazo
                <textarea
                  value={rejectionReason}
                  onChange={(e) => onChangeRejectionReason(e.target.value)}
                  placeholder="Explica por qué la propuesta no puede aprobarse"
                  rows={4}
                  required
                />
              </label>
            </div>
            <div className="button-row">
              <button
                type="button"
                className="secondary"
                onClick={closeRejectModal}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="danger"
                onClick={confirmRejectProposal}
                disabled={
                  proposalActionLoadingId === proposal.id ||
                  !rejectionReason.trim()
                }
              >
                Confirmar rechazo
              </button>
            </div>
          </div>
        </AppModal>

        {userRole === "admin" && proposal.status === "open" && (
          <div className="button-row">
            <button
              type="button"
              className="secondary"
              onClick={() => onFinalizeProposal(proposal.id)}
              disabled={proposalActionLoadingId === proposal.id}
            >
              Finalizar votación
            </button>
          </div>
        )}

        {userRole === "admin" && proposal.status === "rejected" && (
          <div className="button-row">
            <button
              type="button"
              className="danger"
              onClick={() => onDeleteRejectedProposal(proposal.id)}
              disabled={proposalActionLoadingId === proposal.id}
            >
              Eliminar propuesta rechazada
            </button>
          </div>
        )}

        {userRole === "admin" && (
          <>
            <h4>Usuarios que votaron</h4>
            {voters.length === 0 ? (
              <p className="muted">Aún no hay votos registrados.</p>
            ) : (
              <div className="proposal-voters-list">
                {voters.map((vote) => (
                  <article key={vote.id} className="proposal-voter-card">
                    <strong>
                      {vote.voter?.name ||
                        vote.voter?.username ||
                        `Usuario #${vote.userId}`}
                    </strong>
                    <p className="small muted">
                      {vote.voter?.username || "Sin username"}
                    </p>
                    <p className="small muted">
                      Voto registrado: {formatVoteDate(vote.createdAt)}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </>
        )}

        <h4>Seguimiento del proyecto</h4>
        {isProjectLoading && (
          <p className="muted">Cargando detalles del proyecto...</p>
        )}
        {!isProjectLoading && !project && (
          <p className="muted">
            Esta propuesta aún no tiene proyecto generado. Debe quedar aprobada
            por votación y finalizarse para crear el proyecto.
          </p>
        )}

        {!isProjectLoading && project && (
          <>
            <div className="details-grid">
              <div className="details-item">
                <span>Proyecto</span>
                <strong>{project.title}</strong>
              </div>
              <div className="details-item">
                <span>Estado de proyecto</span>
                <strong>
                  {projectCompletionStatusLabel[project.completedStatus]}
                </strong>
              </div>
            </div>
            <div className="button-row">
              <button
                type="button"
                className="secondary"
                onClick={() => onOpenProject(project.id)}
              >
                Ir al proyecto
              </button>
            </div>
          </>
        )}
      </article>
    </section>
  );
}
