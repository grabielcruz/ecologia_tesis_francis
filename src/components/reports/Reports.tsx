import { FormEvent } from "react";
import {
  DefaultTable,
  DefaultTableColumn,
  DefaultTableExportColumn,
} from "../DefaultTable";
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
  editingReportStateInput: "open" | "closed";
  isSubmittingReport: boolean;
  formatUpdatedAt: (value?: string) => string;
  onOpenCreateReportModal?: () => void;
  onCloseCreateReportModal: () => void;
  onSaveReport: (event: FormEvent<HTMLFormElement>) => void;
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
  editingReportStateInput,
  isSubmittingReport,
  formatUpdatedAt,
  onOpenCreateReportModal,
  onCloseCreateReportModal,
  onSaveReport,
  setReportTitleInput,
  setReportDescriptionInput,
  setReportSpaceIdInput,
  setEditingReportStateInput,
  onOpenReportDetail,
}: ReportsProps) {
  const reportColumns: DefaultTableColumn<GreenAreaReport>[] = [
    {
      key: "title",
      label: "Título",
      sortable: true,
      sortValue: (report) => report.title,
      render: (report) => report.title,
    },
    {
      key: "space",
      label: "Área verde",
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

  const reportExportColumns: DefaultTableExportColumn<GreenAreaReport>[] = [
    {
      label: "#",
      value: (_report, rowNumber) => rowNumber,
    },
    {
      label: "Título",
      value: (report) => report.title,
    },
    {
      label: "Descripción",
      value: (report) => report.description,
    },
    {
      label: "Área verde",
      value: (report) => report.spaceName,
    },
    {
      label: "Estado",
      value: (report) => (report.state === "open" ? "Abierto" : "Cerrado"),
    },
    {
      label: "Registrado por",
      value: (report) => report.createdBy?.name || "-",
    },
    {
      label: "Usuario",
      value: (report) => report.createdBy?.username || "-",
    },
    {
      label: "Creado",
      value: (report) => formatUpdatedAt(report.createdAt || undefined),
    },
    {
      label: "Actualizado",
      value: (report) => formatUpdatedAt(report.updatedAt || undefined),
    },
  ];

  return (
    <section className="box reports-box">
      <article className="principal-panel">
        <h3>Reportes de áreas verdes</h3>
        <p>
          Registra una nueva queja o sugerencia desde el botón de nuevo reporte.
        </p>
        {onOpenCreateReportModal && (
          <div className="button-row">
            <button type="button" onClick={onOpenCreateReportModal}>
              Nuevo reporte
            </button>
          </div>
        )}
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
            `${report.title} ${report.description} ${report.spaceName} ${report.state} ${report.createdBy?.name || ""} ${report.createdBy?.username || ""}`
          }
          emptyMessage="No hay reportes para el filtro seleccionado."
          searchPlaceholder="Buscar por título, descripción, área verde o estado"
          onRowClick={(report) => onOpenReportDetail(report.id)}
          exportTitle="Reporte de áreas verdes"
          exportFileName={`reportes-areas-verdes-${reportStateFilter}`}
          exportColumns={reportExportColumns}
        />
      </article>

      <ReportForm
        isOpen={showReportCreateModal}
        mode="create"
        greenSpaces={greenSpaces}
        reportTitleInput={reportTitleInput}
        reportDescriptionInput={reportDescriptionInput}
        reportSpaceIdInput={reportSpaceIdInput}
        editingReportStateInput={editingReportStateInput}
        isSubmittingReport={isSubmittingReport}
        onClose={onCloseCreateReportModal}
        onSubmit={onSaveReport}
        setReportTitleInput={setReportTitleInput}
        setReportDescriptionInput={setReportDescriptionInput}
        setReportSpaceIdInput={setReportSpaceIdInput}
        setEditingReportStateInput={setEditingReportStateInput}
      />
    </section>
  );
}
