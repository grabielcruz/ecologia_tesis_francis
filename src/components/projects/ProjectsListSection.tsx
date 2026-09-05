import { DefaultTable, DefaultTableColumn } from "../DefaultTable";
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
      label: "Area",
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

  return (
    <section className="box admin-box">
      <div className="admin-header">
        <div>
          <h2>Proyectos</h2>
          <p>Proyectos creados desde propuestas aprobadas por votacion.</p>
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
          searchPlaceholder="Buscar por proyecto, propuesta, area o estado"
        />
      </article>
    </section>
  );
}
