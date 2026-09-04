import { GreenAreaReport } from "../../features/reports/types";
import { ImageCarousel } from "../ImageCarousel";

interface ReportProps {
  selectedReportId: number | null;
  selectedReport: GreenAreaReport | null;
  currentUserId?: number;
  currentUserRole?: string;
  onBack: () => void;
  onOpenEditReportModal: (report: GreenAreaReport) => void;
  onDeleteReport: (reportId: number) => Promise<boolean>;
  resolveAssetUrl: (assetPath: string) => string;
  formatUpdatedAt: (value?: string) => string;
}

export function Report({
  selectedReportId,
  selectedReport,
  currentUserId,
  currentUserRole,
  onBack,
  onOpenEditReportModal,
  onDeleteReport,
  resolveAssetUrl,
  formatUpdatedAt,
}: ReportProps) {
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
  const canDelete =
    currentUserRole === "admin" && selectedReport.state === "closed";

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
              onBack();
            }}
          >
            Editar reporte
          </button>
        )}
        {canDelete && (
          <button
            type="button"
            className="danger"
            onClick={async () => {
              const deleted = await onDeleteReport(selectedReport.id);
              if (deleted) {
                onBack();
              }
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
    </section>
  );
}
