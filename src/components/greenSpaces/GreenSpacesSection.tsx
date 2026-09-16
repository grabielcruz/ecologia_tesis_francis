import { ReactNode } from "react";
import {
  DefaultTable,
  DefaultTableColumn,
  DefaultTableExportColumn,
} from "../DefaultTable";

interface GreenSpaceRow {
  id: number;
  name: string;
  location: string;
  totalAreaM2: number;
  tallTreeCount: number;
  images: string[];
  reviewSummary?: {
    totalReviews: number;
    averageRating: number;
  };
}

interface GreenSpacesSectionProps {
  greenSpaces: GreenSpaceRow[];
  userRole?: string;
  onResolveAssetUrl: (assetPath: string) => string;
  onRenderAverageStars: (value: number) => ReactNode;
  onNavigateGreenSpace: (id: number) => void;
  onOpenCreateGreenSpaceModal: () => void;
  greenSpaceModal: ReactNode;
  greenSpaceDetailsModal: ReactNode;
}

export function GreenSpacesSection({
  greenSpaces,
  userRole,
  onResolveAssetUrl,
  onRenderAverageStars,
  onNavigateGreenSpace,
  onOpenCreateGreenSpaceModal,
  greenSpaceModal,
  greenSpaceDetailsModal,
}: GreenSpacesSectionProps) {
  const greenSpaceColumns: DefaultTableColumn<GreenSpaceRow>[] = [
    {
      key: "thumbnail",
      label: "Imagen",
      render: (space) => {
        const thumbnail = space.images?.[0];

        if (!thumbnail) {
          return (
            <span className="green-space-table-thumbnail placeholder">
              Sin imagen
            </span>
          );
        }

        return (
          <img
            className="green-space-table-thumbnail"
            src={onResolveAssetUrl(thumbnail)}
            alt={`${space.name} miniatura`}
          />
        );
      },
    },
    {
      key: "name",
      label: "Nombre",
      sortable: true,
      sortValue: (space) => space.name,
      render: (space) => space.name,
    },
    {
      key: "location",
      label: "Ubicación",
      sortable: true,
      sortValue: (space) => space.location,
      render: (space) => space.location,
    },
    {
      key: "area",
      label: "Área",
      sortable: true,
      sortValue: (space) => space.totalAreaM2,
      render: (space) => `${space.totalAreaM2} m2`,
    },
    {
      key: "trees",
      label: "Árboles",
      sortable: true,
      sortValue: (space) => space.tallTreeCount,
      render: (space) => space.tallTreeCount,
    },
    {
      key: "rating",
      label: "Valoración",
      sortable: true,
      sortValue: (space) => Number(space.reviewSummary?.averageRating ?? 0),
      render: (space) => (
        <div className="mini-rating-row">
          {onRenderAverageStars(space.reviewSummary?.averageRating ?? 0)}
          <span>{(space.reviewSummary?.averageRating ?? 0).toFixed(1)}</span>
          <span className="rating-votes-count">
            ({space.reviewSummary?.totalReviews ?? 0} votos)
          </span>
        </div>
      ),
    },
  ];

  const greenSpaceExportColumns: DefaultTableExportColumn<GreenSpaceRow>[] = [
    {
      label: "#",
      value: (_space, rowNumber) => rowNumber,
    },
    {
      label: "Nombre",
      value: (space) => space.name,
    },
    {
      label: "Ubicación",
      value: (space) => space.location,
    },
    {
      label: "Área (m2)",
      value: (space) => space.totalAreaM2,
    },
    {
      label: "Árboles",
      value: (space) => space.tallTreeCount,
    },
    {
      label: "Valoración promedio",
      value: (space) => (space.reviewSummary?.averageRating ?? 0).toFixed(1),
    },
    {
      label: "Total reseñas",
      value: (space) => space.reviewSummary?.totalReviews ?? 0,
    },
  ];

  return (
    <section className="box admin-box">
      <div className="admin-header">
        <div>
          <h2>Administración de áreas verdes</h2>
          <p>Gestiona los espacios verdes del campus.</p>
        </div>
      </div>

      <article className="principal-panel">
        <h3>Áreas verdes del campus</h3>
        <DefaultTable
          rows={greenSpaces}
          columns={greenSpaceColumns}
          onRowClick={(space) => onNavigateGreenSpace(space.id)}
          getRowId={(space) => space.id}
          getSearchText={(space) =>
            `${space.name} ${space.location} ${space.totalAreaM2} ${space.tallTreeCount}`
          }
          emptyMessage="No hay áreas verdes registradas."
          searchPlaceholder="Buscar por nombre o ubicación"
          onAdd={userRole === "admin" ? onOpenCreateGreenSpaceModal : undefined}
          addButtonLabel="Nueva área verde"
          exportTitle="Listado de áreas verdes"
          exportFileName="areas-verdes-campus"
          exportColumns={greenSpaceExportColumns}
        />
      </article>
      {greenSpaceModal}
      {greenSpaceDetailsModal}
    </section>
  );
}
