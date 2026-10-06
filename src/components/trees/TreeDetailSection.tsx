import { ChangeEvent, FormEvent, useState } from "react";
import { AppModal } from "../AppModal";
import {
  TreeInventoryItem,
  TreeHealthStatus,
} from "../../features/trees/types";
import { ImageCarousel } from "../ImageCarousel";
import { TreeFormModal } from "./TreeFormModal";
import { TreeType } from "../../features/treeTypes/types";

interface GreenSpaceOption {
  id: number;
  name: string;
}

interface TreeDetailSectionProps {
  selectedTreeId: number | null;
  selectedTree: TreeInventoryItem | null;
  userRole?: string;
  treeTypes: TreeType[];
  greenSpaces: GreenSpaceOption[];
  treeNameInput: string;
  treeHealthStatusInput: TreeHealthStatus;
  treeTypeIdInput: number;
  treeSpaceIdInput: number;
  treeLatitudeInput: string;
  treeLongitudeInput: string;
  treeImagesInput: string;
  isSubmittingTree: boolean;
  uploadingTreeImages: boolean;
  setTreeNameInput: (value: string) => void;
  setTreeHealthStatusInput: (value: TreeHealthStatus) => void;
  setTreeTypeIdInput: (value: number) => void;
  setTreeSpaceIdInput: (value: number) => void;
  setTreeLatitudeInput: (value: string) => void;
  setTreeLongitudeInput: (value: string) => void;
  setTreeImagesInput: (value: string) => void;
  onResetTreeForm: () => void;
  onStartEditTree: (tree: TreeInventoryItem) => void;
  onUploadTreeImages: (event: ChangeEvent<HTMLInputElement>) => void;
  onSaveTree: (event: FormEvent<HTMLFormElement>) => Promise<boolean>;
  onDeleteTree: (treeId: number) => Promise<boolean>;
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
  userRole,
  treeTypes,
  greenSpaces,
  treeNameInput,
  treeHealthStatusInput,
  treeTypeIdInput,
  treeSpaceIdInput,
  treeLatitudeInput,
  treeLongitudeInput,
  treeImagesInput,
  isSubmittingTree,
  uploadingTreeImages,
  setTreeNameInput,
  setTreeHealthStatusInput,
  setTreeTypeIdInput,
  setTreeSpaceIdInput,
  setTreeLatitudeInput,
  setTreeLongitudeInput,
  setTreeImagesInput,
  onResetTreeForm,
  onStartEditTree,
  onUploadTreeImages,
  onSaveTree,
  onDeleteTree,
  onBack,
  onOpenTrees,
  onOpenTreeType,
  onOpenGreenSpace,
  resolveAssetUrl,
  formatUpdatedAt,
}: TreeDetailSectionProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const openEditModal = () => {
    if (!selectedTree) return;
    onStartEditTree(selectedTree);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
  };

  const openDeleteModal = () => {
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    if (isDeleting) return;
    setShowDeleteModal(false);
  };

  const confirmDeleteTree = async () => {
    if (!selectedTree) return;

    setIsDeleting(true);
    const deleted = await onDeleteTree(selectedTree.id);
    setIsDeleting(false);

    if (deleted) {
      setShowDeleteModal(false);
      onBack();
    }
  };

  if (!selectedTreeId) {
    return (
      <section className="box">
        <p>El árbol solicitado no existe.</p>
        <button type="button" onClick={onBack}>
          Volver
        </button>
      </section>
    );
  }

  if (!selectedTree) {
    return (
      <section className="box">
        <p>Cargando árbol...</p>
        <button type="button" onClick={onBack}>
          Volver
        </button>
      </section>
    );
  }

  const hasGpsLocation =
    selectedTree.latitude !== null && selectedTree.longitude !== null;
  const mapUrl = hasGpsLocation
    ? (() => {
        const latitude = selectedTree.latitude!;
        const longitude = selectedTree.longitude!;
        const offset = 0.0025;
        const bounds = [
          longitude - offset,
          latitude - offset,
          longitude + offset,
          latitude + offset,
        ].join(",");
        return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bounds)}&layer=mapnik&marker=${encodeURIComponent(`${latitude},${longitude}`)}`;
      })()
    : null;

  return (
    <section className="box reports-box">
      <div className="button-row compact">
        {selectedTree.greenSpace?.id && onOpenGreenSpace && (
          <button
            type="button"
            className="secondary"
            onClick={() => onOpenGreenSpace(selectedTree.greenSpace!.id)}
          >
            Áreas verdes
          </button>
        )}
        {selectedTree.greenSpace?.id && <span className="small muted">/</span>}
        <button
          type="button"
          className="secondary"
          onClick={() => (onOpenTrees ? onOpenTrees() : onBack())}
        >
          Árboles
        </button>
        <span className="small muted">/</span>
        <span className="small muted">Detalle</span>
      </div>

      <div className="button-row">
        <button type="button" className="secondary" onClick={onBack}>
          Volver a árboles
        </button>
        {userRole === "admin" && (
          <>
            <button type="button" onClick={openEditModal}>
              Editar árbol
            </button>
            <button type="button" className="danger" onClick={openDeleteModal}>
              Eliminar árbol
            </button>
          </>
        )}
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
          <p>Este árbol aún no tiene imágenes registradas.</p>
        )}
        <div className="details-grid">
          <div className="details-item">
            <span>Estado de salud</span>
            <strong>{healthLabel[selectedTree.healthStatus]}</strong>
          </div>
          <div className="details-item">
            <span>Tipo de árbol</span>
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
            <span>Ubicación</span>
            <strong>{selectedTree.greenSpace?.name || "No definida"}</strong>
            {selectedTree.greenSpace?.id && onOpenGreenSpace && (
              <button
                type="button"
                className="secondary"
                onClick={() => onOpenGreenSpace(selectedTree.greenSpace!.id)}
              >
                Ver área verde
              </button>
            )}
          </div>
          <div className="details-item">
            <span>Última actualización</span>
            <strong>
              {formatUpdatedAt(selectedTree.updatedAt || undefined)}
            </strong>
          </div>
        </div>
        <div className="tree-location-panel">
          <h4>Ubicación GPS</h4>
          {mapUrl && selectedTree.latitude !== null && selectedTree.longitude !== null ? (
            <>
              <iframe
                className="tree-location-map"
                src={mapUrl}
                title={`Ubicación de ${selectedTree.name}`}
                loading="lazy"
              />
              <div className="button-row compact">
                <span className="small muted">
                  {selectedTree.latitude.toFixed(6)},{" "}
                  {selectedTree.longitude.toFixed(6)}
                </span>
                <a
                  className="button-link secondary"
                  href={`https://www.openstreetmap.org/?mlat=${selectedTree.latitude}&mlon=${selectedTree.longitude}#map=18/${selectedTree.latitude}/${selectedTree.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Abrir mapa
                </a>
              </div>
            </>
          ) : (
            <p className="muted">La ubicación GPS de este árbol no está registrada.</p>
          )}
        </div>
      </article>

      {userRole === "admin" && (
        <TreeFormModal
          isOpen={showEditModal}
          isEditing={true}
          userRole={userRole}
          treeTypes={treeTypes}
          greenSpaces={greenSpaces}
          treeNameInput={treeNameInput}
          treeHealthStatusInput={treeHealthStatusInput}
          treeTypeIdInput={treeTypeIdInput}
          treeSpaceIdInput={treeSpaceIdInput}
          treeLatitudeInput={treeLatitudeInput}
          treeLongitudeInput={treeLongitudeInput}
          treeImagesInput={treeImagesInput}
          isSubmittingTree={isSubmittingTree}
          uploadingTreeImages={uploadingTreeImages}
          setTreeNameInput={setTreeNameInput}
          setTreeHealthStatusInput={setTreeHealthStatusInput}
          setTreeTypeIdInput={setTreeTypeIdInput}
          setTreeSpaceIdInput={setTreeSpaceIdInput}
          setTreeLatitudeInput={setTreeLatitudeInput}
          setTreeLongitudeInput={setTreeLongitudeInput}
          setTreeImagesInput={setTreeImagesInput}
          onUploadTreeImages={onUploadTreeImages}
          onSaveTree={onSaveTree}
          onResetTreeForm={onResetTreeForm}
          onClose={closeEditModal}
        />
      )}

      <AppModal
        isOpen={showDeleteModal}
        onClose={closeDeleteModal}
        title="Eliminar árbol"
        description="Esta acción eliminará el árbol seleccionado."
      >
        <p>¿Está seguro de que desea continuar?</p>
        <div className="button-row">
          <button
            type="button"
            className="danger"
            onClick={() => {
              void confirmDeleteTree();
            }}
            disabled={isDeleting}
          >
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </button>
          <button
            type="button"
            className="secondary"
            onClick={closeDeleteModal}
            disabled={isDeleting}
          >
            Cancelar
          </button>
        </div>
      </AppModal>
    </section>
  );
}
