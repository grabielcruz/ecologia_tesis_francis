import {
  Proposal,
  ProposalProjectDetails,
} from "../../features/proposals/types";

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
  onChangeVotingStart: (value: string) => void;
  onChangeVotingEnd: (value: string) => void;
  onChangeMinimumVotesRequired: (value: string) => void;
  onVoteProposal: (proposalId: number) => void;
  onAcceptProposal: (proposalId: number) => void;
  onRejectProposal: (proposalId: number) => void;
  onFinalizeProposal: (proposalId: number) => void;
  onDeleteRejectedProposal: (proposalId: number) => void;
  onOpenProject: (projectId: number) => void;
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
  onChangeVotingStart,
  onChangeVotingEnd,
  onChangeMinimumVotesRequired,
  onVoteProposal,
  onAcceptProposal,
  onRejectProposal,
  onFinalizeProposal,
  onDeleteRejectedProposal,
  onOpenProject,
  onBack,
}: ProposalDetailSectionProps) {
  if (!proposal || !selectedProposalId) {
    return (
      <section className="box">
        <p>La propuesta solicitada no existe o no esta disponible.</p>
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

  const project = projectDetails?.project || null;
  const voters = projectDetails?.voters || [];
  const currentUserHasVoted = Boolean(projectDetails?.currentUserHasVoted);

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
        <div className="details-grid">
          <div className="details-item full-width">
            <span>Descripcion</span>
            <strong>{proposal.description}</strong>
          </div>
          <div className="details-item">
            <span>Estado</span>
            <strong>{proposal.status}</strong>
          </div>
          <div className="details-item">
            <span>Votos</span>
            <strong>{proposal.totalVotes}</strong>
          </div>
          <div className="details-item">
            <span>Minimo para aprobar</span>
            <strong>
              {proposal.minimumVotesRequired &&
              proposal.minimumVotesRequired > 0
                ? proposal.minimumVotesRequired
                : "No definido"}
            </strong>
          </div>
          <div className="details-item">
            <span>Progreso de votacion</span>
            <strong>
              {proposal.minimumVotesRequired &&
              proposal.minimumVotesRequired > 0
                ? `${proposal.totalVotes}/${proposal.minimumVotesRequired}`
                : `${proposal.totalVotes} votos`}
            </strong>
          </div>
          <div className="details-item full-width">
            <span>Estado de aprobacion por votos</span>
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
                Minimo de votos requeridos
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
                Inicio de votacion
                <input
                  type="datetime-local"
                  value={votingStart}
                  onChange={(e) => onChangeVotingStart(e.target.value)}
                />
              </label>
              <label>
                Fin de votacion
                <input
                  type="datetime-local"
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
                Guardar y abrir votacion
              </button>
              <button
                type="button"
                className="danger"
                onClick={() => onRejectProposal(proposal.id)}
                disabled={proposalActionLoadingId === proposal.id}
              >
                Rechazar propuesta
              </button>
            </div>
          </div>
        )}

        {userRole === "admin" && proposal.status === "open" && (
          <div className="button-row">
            <button
              type="button"
              className="secondary"
              onClick={() => onFinalizeProposal(proposal.id)}
              disabled={proposalActionLoadingId === proposal.id}
            >
              Finalizar votacion
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
              <p className="muted">Aun no hay votos registrados.</p>
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
            Esta propuesta aun no tiene proyecto generado. Debe quedar aprobada
            por votacion y finalizarse para crear el proyecto.
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
                <strong>{project.completedStatus}</strong>
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
