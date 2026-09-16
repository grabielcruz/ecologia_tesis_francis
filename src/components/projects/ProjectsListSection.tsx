import {
  DefaultTable,
  DefaultTableColumn,
  DefaultTableExportColumn,
} from "../DefaultTable";
import {
  ProjectExecutionStatus,
  ProjectListEntry,
} from "../../features/proposals/types";

interface ProjectsListSectionProps {
  projectEntries: ProjectListEntry[];
  onOpenProjectPage: (entry: ProjectListEntry) => void;
  getSpaceName: (spaceId: number) => string;
}

export function ProjectsListSection({
  projectEntries,
  onOpenProjectPage,
  getSpaceName,
}: ProjectsListSectionProps) {
  const formatExportDate = (value?: string | null) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const projectStatusLabel: Record<ProjectExecutionStatus, string> = {
    not_created: "Sin proyecto",
    planned: "Planificado",
    in_progress: "En progreso",
    completed: "Completado",
  };

  const projectColumns: DefaultTableColumn<ProjectListEntry>[] = [
    {
      key: "projectTitle",
      label: "Proyecto",
      sortable: true,
      sortValue: (entry) => entry.project.title,
      render: (entry) => entry.project.title,
    },
    {
      key: "space",
      label: "Área",
      sortable: true,
      sortValue: (entry) => getSpaceName(entry.project.spaceId),
      render: (entry) => getSpaceName(entry.project.spaceId),
    },
    {
      key: "execution",
      label: "Estado de ejecucion",
      sortable: true,
      sortValue: (entry) => entry.project.completedStatus,
      render: (entry) => (
        <span
          className={`pill proposal-project-status ${entry.project.completedStatus}`}
        >
          {projectStatusLabel[entry.project.completedStatus]}
        </span>
      ),
    },
    {
      key: "proposal",
      label: "Propuesta origen",
      sortable: true,
      sortValue: (entry) => entry.proposal.title,
      render: (entry) => entry.proposal.title,
    },
  ];

  const projectExportColumns: DefaultTableExportColumn<ProjectListEntry>[] = [
    {
      label: "#",
      value: (_entry, rowNumber) => rowNumber,
    },
    {
      label: "Proyecto",
      value: (entry) => entry.project.title,
    },
    {
      label: "Descripción del proyecto",
      value: (entry) => entry.project.description,
    },
    {
      label: "Área",
      value: (entry) => getSpaceName(entry.project.spaceId),
    },
    {
      label: "Estado de ejecución",
      value: (entry) => projectStatusLabel[entry.project.completedStatus],
    },
    {
      label: "Propuesta origen",
      value: (entry) => entry.proposal.title,
    },
    {
      label: "Descripción de propuesta",
      value: (entry) => entry.proposal.description,
    },
    {
      label: "Última actividad",
      value: (entry) => entry.latestUpdate?.title || "Sin actividad",
    },
    {
      label: "Actualizado",
      value: (entry) =>
        formatExportDate(
          entry.project.updatedAt ||
            entry.proposal.updatedAt ||
            entry.latestUpdate?.createdAt,
        ),
    },
  ];

  return (
    <section className="box admin-box">
      <div className="admin-header">
        <div>
          <h2>Proyectos</h2>
          <p>Proyectos creados desde propuestas aprobadas por votación.</p>
        </div>
      </div>

      <article className="principal-panel">
        <h3>Listado de proyectos</h3>
        <DefaultTable
          rows={projectEntries}
          columns={projectColumns}
          onRowClick={(entry) => onOpenProjectPage(entry)}
          getRowId={(entry) => entry.project.id}
          getSearchText={(entry) =>
            `${entry.project.title} ${entry.project.description} ${entry.project.completedStatus} ${entry.proposal.title} ${entry.proposal.description} ${entry.latestUpdate?.title || ""} ${entry.latestUpdate?.description || ""} ${getSpaceName(entry.project.spaceId)}`
          }
          emptyMessage="No hay proyectos visibles por el momento."
          searchPlaceholder="Buscar por proyecto, propuesta, área o estado"
          exportTitle="Listado de proyectos"
          exportFileName="proyectos-campus"
          exportColumns={projectExportColumns}
        />
      </article>
    </section>
  );
}
