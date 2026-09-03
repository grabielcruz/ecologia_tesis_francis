import { ChangeEvent, FormEvent } from "react";
import { AppModal } from "../AppModal";

interface GreenSpaceOption {
  id: number;
  name: string;
}

interface ReportFormProps {
  isOpen: boolean;
  mode: "create" | "edit";
  greenSpaces: GreenSpaceOption[];
  reportTitleInput: string;
  reportDescriptionInput: string;
  reportSpaceIdInput: number;
  reportImagesInput: string;
  editingReportStateInput: "open" | "closed";
  isSubmittingReport: boolean;
  uploadingReportImages: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onUploadReportImages: (event: ChangeEvent<HTMLInputElement>) => void;
  setReportTitleInput: (value: string) => void;
  setReportDescriptionInput: (value: string) => void;
  setReportSpaceIdInput: (value: number) => void;
  setEditingReportStateInput: (value: "open" | "closed") => void;
  resolveAssetUrl: (assetPath: string) => string;
}

export function ReportForm({
  isOpen,
  mode,
  greenSpaces,
  reportTitleInput,
  reportDescriptionInput,
  reportSpaceIdInput,
  reportImagesInput,
  editingReportStateInput,
  isSubmittingReport,
  uploadingReportImages,
  onClose,
  onSubmit,
  onUploadReportImages,
  setReportTitleInput,
  setReportDescriptionInput,
  setReportSpaceIdInput,
  setEditingReportStateInput,
  resolveAssetUrl,
}: ReportFormProps) {
  if (!isOpen) return null;

  const reportImagePreviewList = reportImagesInput
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const isEditing = mode === "edit";

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Editar reporte" : "Registrar reporte"}
      description={
        isEditing
          ? "Actualiza la informacion del reporte mientras este abierto."
          : "Crea una queja o sugerencia para un area verde."
      }
    >
      <form className="admin-form" onSubmit={onSubmit}>
        <div className="field-row">
          <label>
            Titulo
            <input
              value={reportTitleInput}
              onChange={(e) => setReportTitleInput(e.target.value)}
              placeholder="Ej. Ramas caidas en sendero"
              required
            />
          </label>
          <label>
            Area verde
            <select
              value={reportSpaceIdInput}
              onChange={(e) => setReportSpaceIdInput(Number(e.target.value))}
              disabled={isEditing}
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
            value={reportDescriptionInput}
            onChange={(e) => setReportDescriptionInput(e.target.value)}
            placeholder="Describe la queja o sugerencia"
            required
          />
        </label>

        {isEditing && (
          <label>
            Estado
            <select
              value={editingReportStateInput}
              onChange={(e) =>
                setEditingReportStateInput(e.target.value as "open" | "closed")
              }
            >
              <option value="open">Abierto</option>
              <option value="closed">Cerrado</option>
            </select>
          </label>
        )}

        <label>
          Imagenes
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={onUploadReportImages}
            disabled={uploadingReportImages}
          />
        </label>

        {reportImagePreviewList.length > 0 && (
          <div className="green-space-preview-grid">
            {reportImagePreviewList.map((imageUrl, index) => (
              <figure
                key={`report-form-preview-${index}`}
                className="green-space-preview-item"
              >
                <img
                  src={resolveAssetUrl(imageUrl)}
                  alt={`Reporte imagen ${index + 1}`}
                />
                <figcaption>{imageUrl}</figcaption>
              </figure>
            ))}
          </div>
        )}

        <div className="button-row">
          <button
            type="submit"
            disabled={isSubmittingReport || uploadingReportImages}
          >
            {isSubmittingReport
              ? "Guardando..."
              : isEditing
                ? "Guardar cambios"
                : "Registrar reporte"}
          </button>
          <button type="button" className="secondary" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </form>
    </AppModal>
  );
}
