import { ChangeEvent, FormEvent } from "react";
import { AppModal } from "../AppModal";
import {
  Proposal,
  ProposalProjectDetails,
} from "../../features/proposals/types";

interface ProposalDetailsModalProps {
  isOpen: boolean;
  proposal: Proposal | null;
  projectDetails?: ProposalProjectDetails;
  isProjectLoading: boolean;
  selectedProjectStatus: "planned" | "in_progress" | "completed";
  userRole?: string;
  isUpdatingProjectStatus: boolean;
  isSubmittingProjectUpdate: boolean;
  uploadingProjectUpdateImages: boolean;
  projectUpdateTitleInput: string;
  projectUpdateDescriptionInput: string;
  projectUpdateImagesInput: string;
  setProjectUpdateTitleInput: (value: string) => void;
  setProjectUpdateDescriptionInput: (value: string) => void;
  setProjectUpdateImagesInput: (value: string) => void;
  setSelectedProjectStatus: (value: "planned" | "in_progress" | "completed") => void;
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
  resolveAssetUrl: (assetPath: string) => string;
  formatUpdatedAt: (value?: string) => string;
  onClose: () => void;
}

export function ProposalDetailsModal({
  isOpen,
  proposal,
  projectDetails,
  isProjectLoading,
  selectedProjectStatus,
  userRole,
  isUpdatingProjectStatus,
  isSubmittingProjectUpdate,
  uploadingProjectUpdateImages,
  projectUpdateTitleInput,
  projectUpdateDescriptionInput,
  projectUpdateImagesInput,
  setProjectUpdateTitleInput,
  setProjectUpdateDescriptionInput,
  setProjectUpdateImagesInput,
  setSelectedProjectStatus,
  onUpdateProjectCompletedStatus,
  onSubmitProjectActivityUpdate,
  onUploadProjectActivityImages,
  resolveAssetUrl,
  formatUpdatedAt,
  onClose,
}: ProposalDetailsModalProps) {
  if (!isOpen || !proposal) return null;

  const project = projectDetails?.project || null;
  const updates = projectDetails?.updates || [];

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalle de propuesta"
      description={proposal.title}
    >
      <div className="admin-form">
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
        </div>

        <h4>Seguimiento del proyecto</h4>
        {isProjectLoading && <p className="muted">Cargando detalles del proyecto...</p>}
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
                <span>Estado de ejecucion</span>
                <strong>{project.completedStatus}</strong>
              </div>
            </div>

            {userRole === "admin" && (
              <div className="field-row">
                <label>
                  Actualizar estado del proyecto
                  <select
                    value={selectedProjectStatus}
                    onChange={(e) =>
                      setSelectedProjectStatus(
                        e.target.value as "planned" | "in_progress" | "completed",
                      )
                    }
                  >
                    <option value="planned">Planned</option>
                    <option value="in_progress">In progress</option>
                    <option value="completed">Completed</option>
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

            {updates.length === 0 ? (
              <p className="muted">No hay actividades registradas todavia.</p>
            ) : (
              <div className="proposal-updates-list">
                {updates.map((update) => (
                  <article key={update.id} className="proposal-update-card">
                    <div className="proposal-update-header">
                      <strong>{update.title || "Actividad"}</strong>
                      <span className="muted">
                        {formatUpdatedAt(update.createdAt || undefined)}
                      </span>
                    </div>
                    <p>{update.description}</p>
                    {update.createdBy && (
                      <p className="small muted">
                        Registrado por: {update.createdBy.name || update.createdBy.username}
                      </p>
                    )}
                    {update.images.length > 0 && (
                      <div className="proposal-update-images">
                        {update.images.map((imageUrl, imageIndex) => (
                          <a
                            key={`${update.id}-${imageIndex}`}
                            href={resolveAssetUrl(imageUrl)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <img
                              src={resolveAssetUrl(imageUrl)}
                              alt={`Actividad ${update.id} imagen ${imageIndex + 1}`}
                            />
                          </a>
                        ))}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}

            {userRole === "admin" && (
              <form
                className="admin-form"
                onSubmit={(event) =>
                  onSubmitProjectActivityUpdate(event, proposal.id, project.id)
                }
              >
                <h4>Registrar actividad</h4>
                <label>
                  Titulo de actividad
                  <input
                    value={projectUpdateTitleInput}
                    onChange={(e) => setProjectUpdateTitleInput(e.target.value)}
                    placeholder="Ejemplo: Jornada de limpieza"
                  />
                </label>
                <label>
                  Descripcion de actividad
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
                  Imagenes de actividad
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(event) => onUploadProjectActivityImages(project.id, event)}
                    disabled={uploadingProjectUpdateImages}
                  />
                  <span className="muted">
                    {uploadingProjectUpdateImages
                      ? "Subiendo imagenes..."
                      : "Puedes subir una o varias imagenes"}
                  </span>
                </label>

                <label>
                  Rutas cargadas
                  <textarea
                    value={projectUpdateImagesInput}
                    onChange={(e) => setProjectUpdateImagesInput(e.target.value)}
                    placeholder="Se completa automaticamente al subir imagenes"
                  />
                </label>

                <div className="button-row">
                  <button type="submit" disabled={isSubmittingProjectUpdate}>
                    {isSubmittingProjectUpdate
                      ? "Guardando actividad..."
                      : "Guardar actividad"}
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        <div className="button-row">
          <button type="button" className="secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </AppModal>
  );
}
