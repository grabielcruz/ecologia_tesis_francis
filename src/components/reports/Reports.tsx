import { ChangeEvent, FormEvent } from "react";
import { DefaultTable, DefaultTableColumn } from "../DefaultTable";
import {
  GreenAreaReport,
  ReportStateFilter,
} from "../../features/reports/types";
import { ReportForm } from "./ReportForm";

interface GreenSpaceOption {
  id: number;
  name: string;
}

interface ReportsProps {
  reports: GreenAreaReport[];
  greenSpaces: GreenSpaceOption[];
  reportStateFilter: ReportStateFilter;
  setReportStateFilter: (value: ReportStateFilter) => void;
  showReportCreateModal: boolean;
  reportTitleInput: string;
  reportDescriptionInput: string;
  reportSpaceIdInput: number;
  reportImagesInput: string;
  editingReportStateInput: "open" | "closed";
  isSubmittingReport: boolean;
  uploadingReportImages: boolean;
  formatUpdatedAt: (value?: string) => string;
  resolveAssetUrl: (assetPath: string) => string;
  onOpenCreateReportModal: () => void;
  onCloseCreateReportModal: () => void;
  onSaveReport: (event: FormEvent<HTMLFormElement>) => void;
  onUploadReportImages: (event: ChangeEvent<HTMLInputElement>) => void;
  setReportTitleInput: (value: string) => void;
  setReportDescriptionInput: (value: string) => void;
  setReportSpaceIdInput: (value: number) => void;
  setEditingReportStateInput: (value: "open" | "closed") => void;
  onOpenReportDetail: (reportId: number) => void;
}

export function Reports({
  reports,
  greenSpaces,
  reportStateFilter,
  setReportStateFilter,
  showReportCreateModal,
  reportTitleInput,
  reportDescriptionInput,
  reportSpaceIdInput,
  reportImagesInput,
  editingReportStateInput,
  isSubmittingReport,
  uploadingReportImages,
  formatUpdatedAt,
  resolveAssetUrl,
  onOpenCreateReportModal,
  onCloseCreateReportModal,
  onSaveReport,
  onUploadReportImages,
  setReportTitleInput,
  setReportDescriptionInput,
  setReportSpaceIdInput,
  setEditingReportStateInput,
  onOpenReportDetail,
}: ReportsProps) {
  const reportColumns: DefaultTableColumn<GreenAreaReport>[] = [
    {
      key: "thumbnail",
      label: "Imagen",
      render: (report) => {
        const thumbnail = report.images?.[0];
        if (!thumbnail) {
          return (
            <span className="report-table-thumbnail placeholder">
              Sin imagen
            </span>
          );
        }

        return (
          <img
            className="report-table-thumbnail"
            src={resolveAssetUrl(thumbnail)}
            alt={`${report.title} miniatura`}
          />
        );
      },
    },
    {
      key: "title",
      label: "Titulo",
      sortable: true,
      sortValue: (report) => report.title,
      render: (report) => report.title,
    },
    {
      key: "space",
      label: "Area verde",
      sortable: true,
      sortValue: (report) => report.spaceName,
      render: (report) => report.spaceName,
    },
    {
      key: "state",
      label: "Estado",
      sortable: true,
      sortValue: (report) => report.state,
      render: (report) => (
        <span
          className={`pill ${report.state === "open" ? "active" : "inactive"}`}
        >
          {report.state === "open" ? "Abierto" : "Cerrado"}
        </span>
      ),
    },
    {
      key: "updated",
      label: "Actualizado",
      sortable: true,
      sortValue: (report) => report.updatedAt || "",
      render: (report) => formatUpdatedAt(report.updatedAt || undefined),
    },
  ];

  return (
    <section className="box reports-box">
      <article className="principal-panel">
        <h3>Reportes de areas verdes</h3>
        <p>
          Registra una nueva queja o sugerencia desde el boton de nuevo reporte.
        </p>
        <div className="button-row">
          <button type="button" onClick={onOpenCreateReportModal}>
            Nuevo reporte
          </button>
        </div>
      </article>

      <article className="principal-panel">
        <h3>Lista de reportes</h3>
        <div className="filter-row user-filter-row">
          <div className="filter-group">
            <label>
              Estado:
              <select
                value={reportStateFilter}
                onChange={(e) =>
                  setReportStateFilter(e.target.value as ReportStateFilter)
                }
              >
                <option value="open">Abiertos</option>
                <option value="closed">Cerrados</option>
                <option value="all">Todos</option>
              </select>
            </label>
          </div>
        </div>
        <DefaultTable
          columns={reportColumns}
          rows={reports}
          getRowId={(report) => report.id}
          getSearchText={(report) =>
            `${report.title} ${report.description} ${report.spaceName} ${report.state} ${report.createdBy?.name || ""}`
          }
          emptyMessage="No hay reportes para el filtro seleccionado."
          searchPlaceholder="Buscar por titulo, descripcion, area verde o estado"
          onRowClick={(report) => onOpenReportDetail(report.id)}
        />
      </article>

      <ReportForm
        isOpen={showReportCreateModal}
        mode="create"
        greenSpaces={greenSpaces}
        reportTitleInput={reportTitleInput}
        reportDescriptionInput={reportDescriptionInput}
        reportSpaceIdInput={reportSpaceIdInput}
        reportImagesInput={reportImagesInput}
        editingReportStateInput={editingReportStateInput}
        isSubmittingReport={isSubmittingReport}
        uploadingReportImages={uploadingReportImages}
        onClose={onCloseCreateReportModal}
        onSubmit={onSaveReport}
        onUploadReportImages={onUploadReportImages}
        setReportTitleInput={setReportTitleInput}
        setReportDescriptionInput={setReportDescriptionInput}
        setReportSpaceIdInput={setReportSpaceIdInput}
        setEditingReportStateInput={setEditingReportStateInput}
        resolveAssetUrl={resolveAssetUrl}
      />
    </section>
  );
}
