import { ChangeEvent, FormEvent } from "react";
import { AppModal } from "../AppModal";
import { ImageUrlPreviewEditor } from "../ImageUrlPreviewEditor";

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
  const imageUrlRows = proposalImagesInput
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const removeImageUrl = (indexToRemove: number) => {
    const next = imageUrlRows.filter((_, index) => index !== indexToRemove);
    setProposalImagesInput(next.join("\n"));
  };

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
        <p className="small muted">Imágenes relacionadas</p>
        <ImageUrlPreviewEditor
          imageUrls={imageUrlRows}
          onRemove={removeImageUrl}
        />
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
