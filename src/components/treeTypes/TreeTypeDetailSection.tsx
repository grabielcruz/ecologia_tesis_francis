import { DefaultTable, DefaultTableColumn } from "../DefaultTable";
import { ImageCarousel } from "../ImageCarousel";
import { TreeType } from "../../features/treeTypes/types";
import {
  TreeInventoryItem,
  TreeHealthStatus,
} from "../../features/trees/types";

interface TreeTypeDetailSectionProps {
  selectedTreeTypeId: number | null;
  selectedTreeType: TreeType | null;
  treesOfType: TreeInventoryItem[];
  onBack: () => void;
  onOpenTreeDetail?: (tree: TreeInventoryItem) => void;
  resolveAssetUrl: (assetPath: string) => string;
  formatUpdatedAt: (value?: string) => string;
}

const healthLabel: Record<TreeHealthStatus, string> = {
  healthy: "Saludable",
  regular: "Regular",
  sick: "Enfermo",
  dead: "Seco",
};

export function TreeTypeDetailSection({
  selectedTreeTypeId,
  selectedTreeType,
  treesOfType,
  onBack,
  onOpenTreeDetail,
  resolveAssetUrl,
  formatUpdatedAt,
}: TreeTypeDetailSectionProps) {
  if (!selectedTreeTypeId) {
    return (
      <section className="box">
        <p>El tipo de arbol solicitado no existe.</p>
        <button type="button" onClick={onBack}>
          Volver
        </button>
      </section>
    );
  }

  if (!selectedTreeType) {
    return (
      <section className="box">
        <p>Cargando tipo de arbol...</p>
        <button type="button" onClick={onBack}>
          Volver
        </button>
      </section>
    );
  }

  const treeColumns: DefaultTableColumn<TreeInventoryItem>[] = [
    {
      key: "thumbnail",
      label: "Imagen",
      render: (tree) => {
        const thumbnail = tree.imageUrls?.[0];
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
            alt={`${tree.name} miniatura`}
          />
        );
      },
    },
    {
      key: "name",
      label: "Arbol",
      sortable: true,
      sortValue: (tree) => tree.name,
      render: (tree) => tree.name,
    },
    {
      key: "health",
      label: "Estado de salud",
      sortable: true,
      sortValue: (tree) => tree.healthStatus,
      render: (tree) => (
        <span className={`pill tree-health ${tree.healthStatus}`}>
          {healthLabel[tree.healthStatus]}
        </span>
      ),
    },
    {
      key: "location",
      label: "Ubicacion",
      sortable: true,
      sortValue: (tree) => tree.greenSpace?.name || "",
      render: (tree) => tree.greenSpace?.name || "-",
    },
    {
      key: "updated",
      label: "Actualizado",
      sortable: true,
      sortValue: (tree) => tree.updatedAt || "",
      render: (tree) => formatUpdatedAt(tree.updatedAt || undefined),
    },
    {
      key: "actions",
      label: "Acciones",
      render: (tree) =>
        onOpenTreeDetail ? (
          <button
            type="button"
            className="secondary"
            onClick={(event) => {
              event.stopPropagation();
              onOpenTreeDetail(tree);
            }}
          >
            Ver arbol
          </button>
        ) : (
          <span className="small muted">Sin acciones</span>
        ),
    },
  ];

  return (
    <section className="box reports-box">
      <div className="button-row">
        <button type="button" className="secondary" onClick={onBack}>
          Volver a tipos de arboles
        </button>
      </div>

      <article className="principal-panel">
        <h3>{selectedTreeType.name}</h3>
        <p>{selectedTreeType.description}</p>

        {selectedTreeType.referenceImages.length > 0 ? (
          <ImageCarousel
            images={selectedTreeType.referenceImages}
            title={selectedTreeType.name}
            resolveAssetUrl={resolveAssetUrl}
          />
        ) : (
          <p>Este tipo de arbol no tiene imagenes referenciales.</p>
        )}
      </article>

      <article className="principal-panel">
        <h3>Arboles registrados de este tipo</h3>
        <DefaultTable
          columns={treeColumns}
          rows={treesOfType}
          onRowClick={onOpenTreeDetail}
          getRowId={(tree) => tree.id}
          getSearchText={(tree) =>
            `${tree.name} ${tree.healthStatus} ${tree.greenSpace?.name || ""}`
          }
          emptyMessage="No hay arboles registrados para este tipo todavia."
          searchPlaceholder="Buscar por nombre, salud o ubicacion"
        />
      </article>
    </section>
  );
}
