import { FormEvent } from "react";
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
  editingReportStateInput: "open" | "closed";
  isSubmittingReport: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  setReportTitleInput: (value: string) => void;
  setReportDescriptionInput: (value: string) => void;
  setReportSpaceIdInput: (value: number) => void;
  setEditingReportStateInput: (value: "open" | "closed") => void;
}

export function ReportForm({
  isOpen,
  mode,
  greenSpaces,
  reportTitleInput,
  reportDescriptionInput,
  reportSpaceIdInput,
  editingReportStateInput,
  isSubmittingReport,
  onClose,
  onSubmit,
  setReportTitleInput,
  setReportDescriptionInput,
  setReportSpaceIdInput,
  setEditingReportStateInput,
}: ReportFormProps) {
  if (!isOpen) return null;

  const isEditing = mode === "edit";

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Editar reporte" : "Registrar reporte"}
      description={
        isEditing
          ? "Actualiza la información del reporte mientras esté abierto."
          : "Crea una queja o sugerencia para un área verde."
      }
    >
      <form className="admin-form" onSubmit={onSubmit}>
        <div className="field-row">
          <label>
            Título
            <input
              value={reportTitleInput}
              onChange={(e) => setReportTitleInput(e.target.value)}
              placeholder="Ej. Ramas caidas en sendero"
              required
            />
          </label>
          <label>
            Área verde
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
          Descripción
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

        <div className="button-row">
          <button type="submit" disabled={isSubmittingReport}>
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
