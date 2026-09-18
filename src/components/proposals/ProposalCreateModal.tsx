import { ChangeEvent, FormEvent } from "react";
import { AppModal } from "../AppModal";

interface GreenSpaceOption {
  id: number;
  name: string;
}

interface ProposalCreateModalProps {
  isOpen: boolean;
  proposalTitleInput: string;
  proposalDescriptionInput: string;
  proposalImagesInput: string;
  proposalSpaceIdInput: number;
  greenSpaces: GreenSpaceOption[];
  isSubmittingProposal: boolean;
  uploadingProposalImages: boolean;
  setProposalTitleInput: (value: string) => void;
  setProposalDescriptionInput: (value: string) => void;
  setProposalImagesInput: (value: string) => void;
  setProposalSpaceIdInput: (value: number) => void;
  onUploadProposalImages: (event: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}

export function ProposalCreateModal({
  isOpen,
  proposalTitleInput,
  proposalDescriptionInput,
  proposalImagesInput,
  proposalSpaceIdInput,
  greenSpaces,
  isSubmittingProposal,
  uploadingProposalImages,
  setProposalTitleInput,
  setProposalDescriptionInput,
  setProposalImagesInput,
  setProposalSpaceIdInput,
  onUploadProposalImages,
  onSubmit,
  onClose,
}: ProposalCreateModalProps) {
  if (!isOpen) return null;

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title="Nueva propuesta"
      description="Registra una propuesta de mejora para un área verde."
    >
      <form className="admin-form" onSubmit={onSubmit}>
        <div className="field-row">
          <label>
            Título
            <input
              value={proposalTitleInput}
              onChange={(e) => setProposalTitleInput(e.target.value)}
              placeholder="Ej: Reforestación del sendero norte"
              required
            />
          </label>
          <label>
            Área verde
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
          Descripción
          <textarea
            value={proposalDescriptionInput}
            onChange={(e) => setProposalDescriptionInput(e.target.value)}
            placeholder="Describe el problema y la mejora propuesta"
            required
          />
        </label>
        <label>
          Imágenes relacionadas (una URL por línea)
          <textarea
            value={proposalImagesInput}
            onChange={(e) => setProposalImagesInput(e.target.value)}
            placeholder="/uploads/proposals/imagen-1.jpg"
          />
        </label>
        <div className="field-row">
          <label>
            Subir imágenes de la propuesta
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={onUploadProposalImages}
              disabled={uploadingProposalImages}
            />
          </label>
        </div>
        {uploadingProposalImages && (
          <p className="small muted">Subiendo imágenes...</p>
        )}
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
