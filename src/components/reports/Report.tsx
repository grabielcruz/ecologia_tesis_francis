import { useState } from "react";
import { AppModal } from "../AppModal";
import { GreenAreaReport } from "../../features/reports/types";
import { ImageCarousel } from "../ImageCarousel";
import { ReportForm } from "./ReportForm";

interface GreenSpaceOption {
  id: number;
  name: string;
}

interface ReportProps {
  selectedReportId: number | null;
  selectedReport: GreenAreaReport | null;
  greenSpaces: GreenSpaceOption[];
  currentUserId?: number;
  currentUserRole?: string;
  showReportEditModal: boolean;
  reportTitleInput: string;
  reportDescriptionInput: string;
  reportSpaceIdInput: number;
  reportImagesInput: string;
  editingReportStateInput: "open" | "closed";
  isSubmittingReport: boolean;
  uploadingReportImages: boolean;
  onBack: () => void;
  onOpenEditReportModal: (report: GreenAreaReport) => void;
  onCloseEditReportModal: () => void;
  onSaveReport: (event: React.FormEvent<HTMLFormElement>) => void;
  onUploadReportImages: (event: React.ChangeEvent<HTMLInputElement>) => void;
  setReportTitleInput: (value: string) => void;
  setReportDescriptionInput: (value: string) => void;
  setReportSpaceIdInput: (value: number) => void;
  setEditingReportStateInput: (value: "open" | "closed") => void;
  onDeleteReport: (reportId: number) => Promise<boolean>;
  onCompleteReport: (reportId: number) => Promise<boolean>;
  resolveAssetUrl: (assetPath: string) => string;
  formatUpdatedAt: (value?: string) => string;
}

export function Report({
  selectedReportId,
  selectedReport,
  greenSpaces,
  currentUserId,
  currentUserRole,
  showReportEditModal,
  reportTitleInput,
  reportDescriptionInput,
  reportSpaceIdInput,
  reportImagesInput,
  editingReportStateInput,
  isSubmittingReport,
  uploadingReportImages,
  onBack,
  onOpenEditReportModal,
  onCloseEditReportModal,
  onSaveReport,
  onUploadReportImages,
  setReportTitleInput,
  setReportDescriptionInput,
  setReportSpaceIdInput,
  setEditingReportStateInput,
  onDeleteReport,
  onCompleteReport,
  resolveAssetUrl,
  formatUpdatedAt,
}: ReportProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  if (!selectedReportId) {
    return (
      <section className="box">
        <p>El reporte solicitado no existe.</p>
        <button type="button" onClick={onBack}>
          Volver
        </button>
      </section>
    );
  }

  if (!selectedReport) {
    return (
      <section className="box">
        <p>Cargando reporte...</p>
        <button type="button" onClick={onBack}>
          Volver
        </button>
      </section>
    );
  }

  const reportImages = selectedReport.images || [];
  const isCreator = currentUserId === selectedReport.userId;
  const canEdit = isCreator && selectedReport.state === "open";
  const canComplete = currentUserRole === "admin" && selectedReport.state === "open";
  const canDelete =
    currentUserRole === "admin" && selectedReport.state === "closed";

  const confirmDeleteReport = async () => {
    setIsDeleting(true);
    const deleted = await onDeleteReport(selectedReport.id);
    setIsDeleting(false);

    if (deleted) {
      setShowDeleteModal(false);
      onBack();
    }
  };

  const confirmCompleteReport = async () => {
    setIsCompleting(true);
    const completed = await onCompleteReport(selectedReport.id);
    setIsCompleting(false);

    if (completed) {
      setShowCompleteModal(false);
      onBack();
    }
  };

  return (
    <section className="box reports-box">
      <div className="button-row">
        <button type="button" className="secondary" onClick={onBack}>
          Volver a lista
        </button>
        {canEdit && (
          <button
            type="button"
            onClick={() => {
              onOpenEditReportModal(selectedReport);
            }}
          >
            Editar reporte
          </button>
        )}
        {canComplete && (
          <button
            type="button"
            onClick={() => {
              setShowCompleteModal(true);
            }}
          >
            Marcar completado
          </button>
        )}
        {canDelete && (
          <button
            type="button"
            className="danger"
            onClick={() => {
              setShowDeleteModal(true);
            }}
          >
            Eliminar reporte
          </button>
        )}
      </div>

      <article className="report-card report-card-detail">
        <div className="report-card-header">
          <div>
            <h3>{selectedReport.title}</h3>
            <p>
              {selectedReport.spaceName} · por{" "}
              {selectedReport.createdBy?.name || "Usuario"}
            </p>
          </div>
          <span
            className={`pill ${selectedReport.state === "open" ? "active" : "inactive"}`}
          >
            {selectedReport.state === "open" ? "Abierto" : "Cerrado"}
          </span>
        </div>

        <p>{selectedReport.description}</p>
        <p className="muted">
          Actualizado: {formatUpdatedAt(selectedReport.updatedAt || undefined)}
        </p>

        {reportImages.length > 0 ? (
          <ImageCarousel
            images={reportImages}
            title={selectedReport.title}
            resolveAssetUrl={resolveAssetUrl}
            className="report-carousel"
          />
        ) : (
          <p>Este reporte no tiene imagenes.</p>
        )}
      </article>

      <ReportForm
        isOpen={showReportEditModal}
        mode="edit"
        greenSpaces={greenSpaces}
        reportTitleInput={reportTitleInput}
        reportDescriptionInput={reportDescriptionInput}
        reportSpaceIdInput={reportSpaceIdInput}
        reportImagesInput={reportImagesInput}
        editingReportStateInput={editingReportStateInput}
        isSubmittingReport={isSubmittingReport}
        uploadingReportImages={uploadingReportImages}
        onClose={onCloseEditReportModal}
        onSubmit={onSaveReport}
        onUploadReportImages={onUploadReportImages}
        setReportTitleInput={setReportTitleInput}
        setReportDescriptionInput={setReportDescriptionInput}
        setReportSpaceIdInput={setReportSpaceIdInput}
        setEditingReportStateInput={setEditingReportStateInput}
        resolveAssetUrl={resolveAssetUrl}
      />

      <AppModal
        isOpen={showCompleteModal}
        onClose={() => {
          if (isCompleting) return;
          setShowCompleteModal(false);
        }}
        title="Marcar reporte como completado"
        description="Esta accion cambiara el estado del reporte a cerrado."
      >
        <p>Desea marcar este reporte como completado?</p>
        <div className="button-row">
          <button
            type="button"
            onClick={() => {
              void confirmCompleteReport();
            }}
            disabled={isCompleting}
          >
            {isCompleting ? "Guardando..." : "Confirmar"}
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => setShowCompleteModal(false)}
            disabled={isCompleting}
          >
            Cancelar
          </button>
        </div>
      </AppModal>

      <AppModal
        isOpen={showDeleteModal}
        onClose={() => {
          if (isDeleting) return;
          setShowDeleteModal(false);
        }}
        title="Eliminar reporte"
        description="Esta accion eliminara el reporte seleccionado."
      >
        <p>Esta seguro de que desea continuar?</p>
        <div className="button-row">
          <button
            type="button"
            className="danger"
            onClick={() => {
              void confirmDeleteReport();
            }}
            disabled={isDeleting}
          >
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => setShowDeleteModal(false)}
            disabled={isDeleting}
          >
            Cancelar
          </button>
        </div>
      </AppModal>
    </section>
  );
}
