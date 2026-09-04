import {
  TreeInventoryItem,
  TreeHealthStatus,
} from "../../features/trees/types";
import { ImageCarousel } from "../ImageCarousel";

interface TreeDetailSectionProps {
  selectedTreeId: number | null;
  selectedTree: TreeInventoryItem | null;
  onBack: () => void;
  onOpenTrees?: () => void;
  onOpenTreeType?: (treeTypeId: number) => void;
  onOpenGreenSpace?: (spaceId: number) => void;
  resolveAssetUrl: (assetPath: string) => string;
  formatUpdatedAt: (value?: string) => string;
}

const healthLabel: Record<TreeHealthStatus, string> = {
  healthy: "Saludable",
  regular: "Regular",
  sick: "Enfermo",
  dead: "Seco",
};

export function TreeDetailSection({
  selectedTreeId,
  selectedTree,
  onBack,
  onOpenTrees,
  onOpenTreeType,
  onOpenGreenSpace,
  resolveAssetUrl,
  formatUpdatedAt,
}: TreeDetailSectionProps) {
  if (!selectedTreeId) {
    return (
      <section className="box">
        <p>El arbol solicitado no existe.</p>
        <button type="button" onClick={onBack}>
          Volver
        </button>
      </section>
    );
  }

  if (!selectedTree) {
    return (
      <section className="box">
        <p>Cargando arbol...</p>
        <button type="button" onClick={onBack}>
          Volver
        </button>
      </section>
    );
  }

  return (
    <section className="box reports-box">
      <div className="button-row compact">
        {selectedTree.greenSpace?.id && onOpenGreenSpace && (
          <button
            type="button"
            className="secondary"
            onClick={() => onOpenGreenSpace(selectedTree.greenSpace!.id)}
          >
            Areas verdes
          </button>
        )}
        {selectedTree.greenSpace?.id && <span className="small muted">/</span>}
        <button
          type="button"
          className="secondary"
          onClick={() => (onOpenTrees ? onOpenTrees() : onBack())}
        >
          Arboles
        </button>
        <span className="small muted">/</span>
        <span className="small muted">Detalle</span>
      </div>

      <div className="button-row">
        <button type="button" className="secondary" onClick={onBack}>
          Volver a arboles
        </button>
      </div>

      <article className="principal-panel">
        <h3>{selectedTree.name}</h3>
        {selectedTree.imageUrls.length > 0 ? (
          <ImageCarousel
            images={selectedTree.imageUrls}
            title={selectedTree.name}
            resolveAssetUrl={resolveAssetUrl}
          />
        ) : (
          <p>Este arbol aun no tiene imagenes registradas.</p>
        )}
        <div className="details-grid">
          <div className="details-item">
            <span>Estado de salud</span>
            <strong>{healthLabel[selectedTree.healthStatus]}</strong>
          </div>
          <div className="details-item">
            <span>Tipo de arbol</span>
            <strong>{selectedTree.treeType?.name || "No definido"}</strong>
            {selectedTree.treeType?.id && onOpenTreeType && (
              <button
                type="button"
                className="secondary"
                onClick={() => onOpenTreeType(selectedTree.treeType!.id)}
              >
                Ver tipo
              </button>
            )}
          </div>
          <div className="details-item">
            <span>Ubicacion</span>
            <strong>{selectedTree.greenSpace?.name || "No definida"}</strong>
            {selectedTree.greenSpace?.id && onOpenGreenSpace && (
              <button
                type="button"
                className="secondary"
                onClick={() => onOpenGreenSpace(selectedTree.greenSpace!.id)}
              >
                Ver area verde
              </button>
            )}
          </div>
          <div className="details-item">
            <span>Ultima actualizacion</span>
            <strong>
              {formatUpdatedAt(selectedTree.updatedAt || undefined)}
            </strong>
          </div>
        </div>
      </article>
    </section>
  );
}
