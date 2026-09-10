import { ChangeEvent, FormEvent, useState } from "react";
import { AppModal } from "../AppModal";
import { ImageCarousel } from "../ImageCarousel";
import {
  ProjectListEntry,
  ProposalProjectDetails,
  ProposalProjectUpdate,
} from "../../features/proposals/types";

interface ProjectActivityDetailSectionProps {
  selectedProjectEntry: ProjectListEntry | null;
  selectedProjectId: number | null;
  selectedProjectUpdateId: number | null;
  projectEntriesCount: number;
  proposalProjectDetails: Record<number, ProposalProjectDetails>;
  proposalProjectLoadingId: number | null;
  userRole?: string;
  isSubmittingProjectUpdate: boolean;
  uploadingProjectUpdateImages: boolean;
  projectUpdateTitleInput: string;
  projectUpdateDescriptionInput: string;
  projectUpdateImagesInput: string;
  setProjectUpdateTitleInput: (value: string) => void;
  setProjectUpdateDescriptionInput: (value: string) => void;
  setProjectUpdateImagesInput: (value: string) => void;
  onUploadProjectActivityImages: (
    projectId: number,
    event: ChangeEvent<HTMLInputElement>,
  ) => void;
  onUpdateProjectActivityUpdate: (
    event: FormEvent<HTMLFormElement>,
    proposalId: number,
    projectId: number,
    updateId: number,
  ) => Promise<boolean>;
  onDeleteProjectActivityUpdate: (
    proposalId: number,
    projectId: number,
    updateId: number,
  ) => Promise<boolean>;
  onBackToProject: () => void;
  onBackToProjects: () => void;
  resolveAssetUrl: (assetPath: string) => string;
  formatUpdatedAt: (value?: string) => string;
}

export function ProjectActivityDetailSection({
  selectedProjectEntry,
  selectedProjectId,
  selectedProjectUpdateId,
  projectEntriesCount,
  proposalProjectDetails,
  proposalProjectLoadingId,
  userRole,
  isSubmittingProjectUpdate,
  uploadingProjectUpdateImages,
  projectUpdateTitleInput,
  projectUpdateDescriptionInput,
  projectUpdateImagesInput,
  setProjectUpdateTitleInput,
  setProjectUpdateDescriptionInput,
  setProjectUpdateImagesInput,
  onUploadProjectActivityImages,
  onUpdateProjectActivityUpdate,
  onDeleteProjectActivityUpdate,
  onBackToProject,
  onBackToProjects,
  resolveAssetUrl,
  formatUpdatedAt,
}: ProjectActivityDetailSectionProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  if (!selectedProjectEntry && selectedProjectId && projectEntriesCount === 0) {
    return (
      <section className="box">
        <p>Cargando actividad...</p>
      </section>
    );
  }

  if (!selectedProjectEntry || !selectedProjectUpdateId) {
    return (
      <section className="box">
        <p>La actividad solicitada no existe o no está disponible.</p>
        <div className="button-row">
          <button type="button" onClick={onBackToProjects}>
            Volver a proyectos
          </button>
        </div>
      </section>
    );
  }

  const proposal = selectedProjectEntry.proposal;
  const project = selectedProjectEntry.project;
  const details = proposalProjectDetails[proposal.id];
  const updates = details?.updates || [];
  const isProjectLoading = proposalProjectLoadingId === proposal.id;

  if (isProjectLoading && updates.length === 0) {
    return (
      <section className="box">
        <p>Cargando actividad...</p>
      </section>
    );
  }

  const selectedUpdate: ProposalProjectUpdate | null =
    updates.find((update) => update.id === selectedProjectUpdateId) || null;

  if (!selectedUpdate) {
    return (
      <section className="box">
        <p>La actividad solicitada no existe para este proyecto.</p>
        <div className="button-row">
          <button type="button" className="secondary" onClick={onBackToProject}>
            Volver al proyecto
          </button>
        </div>
      </section>
    );
  }

  const openEditModal = () => {
    setProjectUpdateTitleInput(selectedUpdate.title || "");
    setProjectUpdateDescriptionInput(selectedUpdate.description || "");
    setProjectUpdateImagesInput((selectedUpdate.images || []).join("\n"));
    setShowEditModal(true);
  };

  const confirmDelete = async () => {
    const deleted = await onDeleteProjectActivityUpdate(
      proposal.id,
      project.id,
      selectedUpdate.id,
    );

    if (deleted) {
      setShowDeleteModal(false);
      onBackToProject();
    }
  };

  return (
    <section className="box reports-box">
      <div className="button-row">
        <button type="button" className="secondary" onClick={onBackToProject}>
          Volver al proyecto
        </button>
        {userRole === "admin" && (
          <button type="button" onClick={openEditModal}>
            Editar actividad
          </button>
        )}
        {userRole === "admin" && (
          <button
            type="button"
            className="danger"
            onClick={() => setShowDeleteModal(true)}
          >
            Eliminar actividad
          </button>
        )}
      </div>

      <article className="report-card report-card-detail">
        <div className="report-card-header">
          <div>
            <h3>{selectedUpdate.title || "Actividad"}</h3>
            <p>
              Proyecto: {project.title} · Propuesta: {proposal.title}
            </p>
          </div>
          <span className="poll-updated">
            {formatUpdatedAt(selectedUpdate.createdAt || undefined)}
          </span>
        </div>

        <p>{selectedUpdate.description}</p>

        {selectedUpdate.createdBy && (
          <p className="muted">
            Registrado por:{" "}
            {selectedUpdate.createdBy.name || selectedUpdate.createdBy.username}
          </p>
        )}

        {selectedUpdate.images.length > 0 ? (
          <ImageCarousel
            images={selectedUpdate.images}
            title={selectedUpdate.title || "Actividad"}
            resolveAssetUrl={resolveAssetUrl}
            className="report-carousel"
          />
        ) : (
          <p>Esta actividad no tiene imágenes.</p>
        )}
      </article>

      <AppModal
        isOpen={showEditModal}
        onClose={() => {
          if (isSubmittingProjectUpdate) return;
          setShowEditModal(false);
        }}
        title="Editar actividad del proyecto"
        description="Actualiza la descripción, título y evidencias de esta actividad."
      >
        <form
          className="admin-form"
          onSubmit={async (event) => {
            const saved = await onUpdateProjectActivityUpdate(
              event,
              proposal.id,
              project.id,
              selectedUpdate.id,
            );

            if (saved) {
              setShowEditModal(false);
            }
          }}
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
              onChange={(e) => setProjectUpdateDescriptionInput(e.target.value)}
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
                : "Guardar cambios"}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => setShowEditModal(false)}
              disabled={isSubmittingProjectUpdate}
            >
              Cancelar
            </button>
          </div>
        </form>
      </AppModal>

      <AppModal
        isOpen={showDeleteModal}
        onClose={() => {
          if (isSubmittingProjectUpdate) return;
          setShowDeleteModal(false);
        }}
        title="Eliminar actividad"
        description="Esta acción eliminará la actividad seleccionada del historial del proyecto."
      >
        <p>¿Está seguro de que desea continuar?</p>
        <div className="button-row">
          <button
            type="button"
            className="danger"
            onClick={() => {
              void confirmDelete();
            }}
            disabled={isSubmittingProjectUpdate}
          >
            {isSubmittingProjectUpdate ? "Eliminando..." : "Eliminar"}
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => setShowDeleteModal(false)}
            disabled={isSubmittingProjectUpdate}
          >
            Cancelar
          </button>
        </div>
      </AppModal>
    </section>
  );
}
