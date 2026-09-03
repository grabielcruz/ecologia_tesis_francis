import { AppModal } from "../AppModal";
import { Proposal } from "../../features/proposals/types";

interface ProposalManageModalProps {
  isOpen: boolean;
  proposal: Proposal | null;
  votingStart: string;
  votingEnd: string;
  onChangeVotingStart: (value: string) => void;
  onChangeVotingEnd: (value: string) => void;
  onAccept: () => Promise<void>;
  onReject: () => Promise<void>;
  onClose: () => void;
}

export function ProposalManageModal({
  isOpen,
  proposal,
  votingStart,
  votingEnd,
  onChangeVotingStart,
  onChangeVotingEnd,
  onAccept,
  onReject,
  onClose,
}: ProposalManageModalProps) {
  if (!isOpen || !proposal) return null;

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar propuesta"
      description={proposal.title}
    >
      <div className="admin-form">
        <div className="details-grid">
          <div className="details-item full-width">
            <span>Descripcion</span>
            <strong>{proposal.description}</strong>
          </div>
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
          <button type="button" onClick={onAccept}>
            Guardar y abrir votacion
          </button>
          <button type="button" className="danger" onClick={onReject}>
            Rechazar propuesta
          </button>
          <button type="button" className="secondary" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </AppModal>
  );
}
