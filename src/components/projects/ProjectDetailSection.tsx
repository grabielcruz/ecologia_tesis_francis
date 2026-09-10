import { ChangeEvent, FormEvent, useState } from "react";
import { AppModal } from "../AppModal";
import { DefaultTable, DefaultTableColumn } from "../DefaultTable";
import {
  ProjectExecutionStatus,
  ProjectListEntry,
  ProposalProjectDetails,
  ProposalProjectUpdate,
} from "../../features/proposals/types";

interface ProjectDetailSectionProps {
  selectedProjectEntry: ProjectListEntry | null;
  selectedProjectId: number | null;
  projectEntriesCount: number;
  proposalProjectDetails: Record<number, ProposalProjectDetails>;
  proposalProjectLoadingId: number | null;
  projectStatusDrafts: Record<number, "planned" | "in_progress" | "completed">;
  setProjectStatusDrafts: React.Dispatch<
    React.SetStateAction<
      Record<number, "planned" | "in_progress" | "completed">
    >
  >;
  isUpdatingProjectStatus: boolean;
  isSubmittingProjectUpdate: boolean;
  uploadingProjectUpdateImages: boolean;
  projectUpdateTitleInput: string;
  projectUpdateDescriptionInput: string;
  projectUpdateImagesInput: string;
  setProjectUpdateTitleInput: (value: string) => void;
  setProjectUpdateDescriptionInput: (value: string) => void;
  setProjectUpdateImagesInput: (value: string) => void;
  onBack: () => void;
  onOpenProjectActivityDetail: (updateId: number) => void;
  onUpdateProjectCompletedStatus: (
    proposalId: number,
    projectId: number,
    completedStatus: "planned" | "in_progress" | "completed",
  ) => void;
  onSubmitProjectActivityUpdate: (
    event: FormEvent<HTMLFormElement>,
    proposalId: number,
    projectId: number,
  ) => void;
  onUploadProjectActivityImages: (
    projectId: number,
    event: ChangeEvent<HTMLInputElement>,
  ) => void;
  getSpaceName: (spaceId: number) => string;
  summarizeText: (value: string, maxLength?: number) => string;
  formatUpdatedAt: (value?: string) => string;
  resolveAssetUrl: (assetPath: string) => string;
  userRole?: string;
}

export function ProjectDetailSection({
  selectedProjectEntry,
  selectedProjectId,
  projectEntriesCount,
  proposalProjectDetails,
  proposalProjectLoadingId,
  projectStatusDrafts,
  setProjectStatusDrafts,
  isUpdatingProjectStatus,
  isSubmittingProjectUpdate,
  uploadingProjectUpdateImages,
  projectUpdateTitleInput,
  projectUpdateDescriptionInput,
  projectUpdateImagesInput,
  setProjectUpdateTitleInput,
  setProjectUpdateDescriptionInput,
  setProjectUpdateImagesInput,
  onBack,
  onOpenProjectActivityDetail,
  onUpdateProjectCompletedStatus,
  onSubmitProjectActivityUpdate,
  onUploadProjectActivityImages,
  getSpaceName,
  summarizeText,
  formatUpdatedAt,
  resolveAssetUrl,
  userRole,
}: ProjectDetailSectionProps) {
  const [showRegisterActivityModal, setShowRegisterActivityModal] =
    useState(false);

  if (!selectedProjectEntry && selectedProjectId && projectEntriesCount === 0) {
    return (
      <section className="box">
        <p>Cargando proyecto...</p>
      </section>
    );
  }

  if (!selectedProjectEntry) {
    return (
      <section className="box">
        <p>El proyecto solicitado no existe o no está disponible.</p>
        <button type="button" onClick={onBack}>
          Volver a proyectos
        </button>
      </section>
    );
  }

  const proposal = selectedProjectEntry.proposal;
  const details = proposalProjectDetails[proposal.id];
  const project = details?.project || selectedProjectEntry.project;
  const updates = details?.updates || [];
  const isProjectLoading = proposalProjectLoadingId === proposal.id;
  const selectedProjectStatus =
    projectStatusDrafts[project.id] || project.completedStatus;

  const statusLabel: Record<ProjectExecutionStatus, string> = {
    planned: "Planificado",
    in_progress: "En progreso",
    completed: "Completado",
    not_created: "Sin proyecto",
  };

  const updatesColumns: DefaultTableColumn<ProposalProjectUpdate>[] = [
    {
      key: "createdAt",
      label: "Fecha",
      sortable: true,
      sortValue: (update) => update.createdAt || "",
      render: (update) => formatUpdatedAt(update.createdAt || undefined),
    },
    {
      key: "title",
      label: "Actividad",
      sortable: true,
      sortValue: (update) => update.title || "",
      render: (update) => update.title || "Actividad",
    },
    {
      key: "description",
      label: "Descripción",
      sortable: true,
      sortValue: (update) => update.description,
      render: (update) => summarizeText(update.description),
    },
    {
      key: "author",
      label: "Registrado por",
      sortable: true,
      sortValue: (update) =>
        update.createdBy?.name || update.createdBy?.username || "",
      render: (update) =>
        update.createdBy?.name || update.createdBy?.username || "-",
    },
    {
      key: "images",
      label: "Evidencias",
      render: (update) =>
        update.images.length > 0 ? (
          <div className="table-actions">
            {update.images.slice(0, 3).map((imageUrl, index) => (
              <a
                key={`${update.id}-${index}`}
                href={resolveAssetUrl(imageUrl)}
                target="_blank"
                rel="noreferrer"
                className="link-button"
                onClick={(event) => event.stopPropagation()}
              >
                Imagen {index + 1}
              </a>
            ))}
          </div>
        ) : (
          <span className="small muted">Sin imágenes</span>
        ),
    },
  ];

  return (
    <section className="box admin-box">
      <div className="button-row">
        <button type="button" className="secondary" onClick={onBack}>
          Volver a proyectos
        </button>
      </div>

      <article className="principal-panel">
        <h3>Datos del proyecto</h3>
        <div className="details-grid">
          <div className="details-item">
            <span>Proyecto</span>
            <strong>{project.title}</strong>
          </div>
          <div className="details-item">
            <span>Estado de ejecución</span>
            <strong>{statusLabel[project.completedStatus]}</strong>
          </div>
          <div className="details-item full-width">
            <span>Descripción del proyecto</span>
            <strong>{project.description}</strong>
          </div>
          <div className="details-item">
            <span>Área verde</span>
            <strong>{getSpaceName(project.spaceId)}</strong>
          </div>
          <div className="details-item">
            <span>Propuesta origen</span>
            <strong>{proposal.title}</strong>
          </div>
        </div>

        {userRole === "admin" && (
          <div className="field-row">
            <label>
              Actualizar estado del proyecto
              <select
                value={selectedProjectStatus}
                onChange={(e) =>
                  setProjectStatusDrafts((prev) => ({
                    ...prev,
                    [project.id]: e.target.value as
                      | "planned"
                      | "in_progress"
                      | "completed",
                  }))
                }
              >
                <option value="planned">Planificado</option>
                <option value="in_progress">En progreso</option>
                <option value="completed">Completado</option>
              </select>
            </label>
            <div className="button-row compact">
              <button
                type="button"
                onClick={() =>
                  onUpdateProjectCompletedStatus(
                    proposal.id,
                    project.id,
                    selectedProjectStatus,
                  )
                }
                disabled={
                  isUpdatingProjectStatus ||
                  selectedProjectStatus === project.completedStatus
                }
              >
                {isUpdatingProjectStatus ? "Actualizando..." : "Guardar estado"}
              </button>
            </div>
          </div>
        )}
      </article>

      <article className="principal-panel">
        <h3>Actividades del proyecto</h3>
        {userRole === "admin" && (
          <div className="button-row">
            <button
              type="button"
              onClick={() => setShowRegisterActivityModal(true)}
            >
              Registrar actividad
            </button>
          </div>
        )}
        {isProjectLoading && <p className="muted">Cargando actividades...</p>}
        {!isProjectLoading && (
          <DefaultTable
            rows={updates}
            columns={updatesColumns}
            getRowId={(update) => update.id}
            getSearchText={(update) =>
              `${update.title} ${update.description} ${update.createdBy?.name || ""} ${update.createdBy?.username || ""}`
            }
            onRowClick={(update) => onOpenProjectActivityDetail(update.id)}
            emptyMessage="No hay actividades registradas por el momento."
            searchPlaceholder="Buscar por actividad, descripción o responsable"
          />
        )}
      </article>

      {userRole === "admin" && (
        <AppModal
          isOpen={showRegisterActivityModal}
          onClose={() => setShowRegisterActivityModal(false)}
          title="Registrar actividad del proyecto"
          description="Documenta los avances y evidencias del proyecto."
        >
          <form
            className="admin-form"
            onSubmit={(event) =>
              onSubmitProjectActivityUpdate(event, proposal.id, project.id)
            }
          >
            <label>
              Título de actividad
              <input
                value={projectUpdateTitleInput}
                onChange={(e) => setProjectUpdateTitleInput(e.target.value)}
                placeholder="Ejemplo: Jornada de limpieza"
              />
            </label>
            <label>
              Descripción de actividad
              <textarea
                value={projectUpdateDescriptionInput}
                onChange={(e) =>
                  setProjectUpdateDescriptionInput(e.target.value)
                }
                placeholder="Describe lo realizado en esta etapa"
                required
              />
            </label>
            <label>
              Imágenes de actividad
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(event) =>
                  onUploadProjectActivityImages(project.id, event)
                }
                disabled={uploadingProjectUpdateImages}
              />
              <span className="muted">
                {uploadingProjectUpdateImages
                  ? "Subiendo imágenes..."
                  : "Puedes subir una o varias imágenes"}
              </span>
            </label>
            <label>
              Rutas cargadas
              <textarea
                value={projectUpdateImagesInput}
                onChange={(e) => setProjectUpdateImagesInput(e.target.value)}
                placeholder="Se completa automáticamente al subir imágenes"
              />
            </label>
            <div className="button-row">
              <button type="submit" disabled={isSubmittingProjectUpdate}>
                {isSubmittingProjectUpdate
                  ? "Guardando actividad..."
                  : "Guardar actividad"}
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => setShowRegisterActivityModal(false)}
              >
                Cancelar
              </button>
            </div>
          </form>
        </AppModal>
      )}
    </section>
  );
}
