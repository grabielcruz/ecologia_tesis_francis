import { FormEvent } from "react";
import { AppModal } from "../AppModal";

interface GreenSpaceOption {
  id: number;
  name: string;
}

interface ProposalCreateModalProps {
  isOpen: boolean;
  proposalTitleInput: string;
  proposalDescriptionInput: string;
  proposalSpaceIdInput: number;
  greenSpaces: GreenSpaceOption[];
  isSubmittingProposal: boolean;
  setProposalTitleInput: (value: string) => void;
  setProposalDescriptionInput: (value: string) => void;
  setProposalSpaceIdInput: (value: number) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}

export function ProposalCreateModal({
  isOpen,
  proposalTitleInput,
  proposalDescriptionInput,
  proposalSpaceIdInput,
  greenSpaces,
  isSubmittingProposal,
  setProposalTitleInput,
  setProposalDescriptionInput,
  setProposalSpaceIdInput,
  onSubmit,
  onClose,
}: ProposalCreateModalProps) {
  if (!isOpen) return null;

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title="Nueva propuesta"
      description="Registra una propuesta de mejora para un area verde."
    >
      <form className="admin-form" onSubmit={onSubmit}>
        <div className="field-row">
          <label>
            Titulo
            <input
              value={proposalTitleInput}
              onChange={(e) => setProposalTitleInput(e.target.value)}
              placeholder="Ej: Reforestacion del sendero norte"
              required
            />
          </label>
          <label>
            Area verde
            <select
              value={String(proposalSpaceIdInput)}
              onChange={(e) => setProposalSpaceIdInput(Number(e.target.value))}
              required
            >
              {greenSpaces.map((space) => (
                <option key={space.id} value={space.id}>
                  {space.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label>
          Descripcion
          <textarea
            value={proposalDescriptionInput}
            onChange={(e) => setProposalDescriptionInput(e.target.value)}
            placeholder="Describe el problema y la mejora propuesta"
            required
          />
        </label>
        <div className="button-row">
          <button
            type="submit"
            disabled={isSubmittingProposal || greenSpaces.length === 0}
          >
            {isSubmittingProposal ? "Enviando..." : "Guardar propuesta"}
          </button>
          <button type="button" className="secondary" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </form>
    </AppModal>
  );
}
