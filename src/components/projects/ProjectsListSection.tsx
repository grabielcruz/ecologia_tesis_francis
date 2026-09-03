import { DefaultTable, DefaultTableColumn } from "../DefaultTable";
import {
  ProjectExecutionStatus,
  ProjectListEntry,
  ProposalProjectDetails,
} from "../../features/proposals/types";

interface ProjectsListSectionProps {
  projectEntries: ProjectListEntry[];
  proposalProjectDetails: Record<number, ProposalProjectDetails>;
  onOpenProjectPage: (entry: ProjectListEntry) => void;
  getSpaceName: (spaceId: number) => string;
  formatUpdatedAt: (value?: string) => string;
}

export function ProjectsListSection({
  projectEntries,
  proposalProjectDetails,
  onOpenProjectPage,
  getSpaceName,
  formatUpdatedAt,
}: ProjectsListSectionProps) {
  const projectStatusLabel: Record<ProjectExecutionStatus, string> = {
    not_created: "Sin proyecto",
    planned: "Planned",
    in_progress: "In progress",
    completed: "Completed",
  };

  const summarizeText = (value: string, maxLength = 92) => {
    const normalized = value.trim();
    if (!normalized) return "Sin descripcion";
    if (normalized.length <= maxLength) return normalized;
    return `${normalized.slice(0, maxLength - 1)}...`;
  };

  const getLastActivityAt = (entry: ProjectListEntry) => {
    const details = proposalProjectDetails[entry.proposal.id];
    const latestUpdate = details?.updates?.[0];

    return (
      entry.latestUpdate?.createdAt ||
      latestUpdate?.createdAt ||
      entry.project.updatedAt ||
      entry.proposal.updatedAt
    );
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
    {
      key: "latestUpdate",
      label: "Ultimo avance",
      sortable: true,
      sortValue: (entry) => getLastActivityAt(entry) || "",
      render: (entry) => {
        if (!entry.latestUpdate) {
          return (
            <span className="small muted">Sin actividades registradas</span>
          );
        }

        const authorName =
          entry.latestUpdate.createdBy?.name ||
          entry.latestUpdate.createdBy?.username ||
          "Administrador";

        return (
          <div className="project-latest-update">
            <strong>{entry.latestUpdate.title || "Actividad"}</strong>
            <p className="small muted">
              {summarizeText(entry.latestUpdate.description)}
            </p>
            <p className="small muted">
              {authorName} ·{" "}
              {formatUpdatedAt(entry.latestUpdate.createdAt || undefined)}
            </p>
          </div>
        );
      },
    },
    {
      key: "lastActivity",
      label: "Ultima actividad",
      sortable: true,
      sortValue: (entry) => getLastActivityAt(entry) || "",
      render: (entry) => formatUpdatedAt(getLastActivityAt(entry) || undefined),
    },
    {
      key: "actions",
      label: "Acciones",
      render: (entry) => (
        <div className="table-actions">
          <button
            type="button"
            className="secondary"
            onClick={() => onOpenProjectPage(entry)}
          >
            Abrir pagina
          </button>
        </div>
      ),
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
