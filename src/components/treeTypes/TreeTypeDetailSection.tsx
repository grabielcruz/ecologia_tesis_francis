import { ChangeEvent, FormEvent, useState } from "react";
import { AppModal } from "../AppModal";
import { DefaultTable, DefaultTableColumn } from "../DefaultTable";
import { ImageCarousel } from "../ImageCarousel";
import { TreeTypeFormModal } from "./TreeTypeFormModal";
import { TreeType } from "../../features/treeTypes/types";
import {
  TreeInventoryItem,
  TreeHealthStatus,
} from "../../features/trees/types";

interface TreeTypeDetailSectionProps {
  selectedTreeTypeId: number | null;
  selectedTreeType: TreeType | null;
  treesOfType: TreeInventoryItem[];
  userRole?: string;
  onBack: () => void;
  onOpenTreeDetail?: (tree: TreeInventoryItem) => void;
  treeTypeNameInput: string;
  treeTypeDescriptionInput: string;
  treeTypeImagesInput: string;
  isSubmittingTreeType: boolean;
  uploadingTreeTypeImages: boolean;
  setTreeTypeNameInput: (value: string) => void;
  setTreeTypeDescriptionInput: (value: string) => void;
  setTreeTypeImagesInput: (value: string) => void;
  onResetTreeTypeForm: () => void;
  onStartEditTreeType: (treeType: TreeType) => void;
  onSaveTreeType: (event: FormEvent<HTMLFormElement>) => Promise<boolean>;
  onDeleteTreeType: (treeTypeId: number) => Promise<boolean>;
  onUploadTreeTypeImages: (event: ChangeEvent<HTMLInputElement>) => void;
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
  userRole,
  onBack,
  onOpenTreeDetail,
  treeTypeNameInput,
  treeTypeDescriptionInput,
  treeTypeImagesInput,
  isSubmittingTreeType,
  uploadingTreeTypeImages,
  setTreeTypeNameInput,
  setTreeTypeDescriptionInput,
  setTreeTypeImagesInput,
  onResetTreeTypeForm,
  onStartEditTreeType,
  onSaveTreeType,
  onDeleteTreeType,
  onUploadTreeTypeImages,
  resolveAssetUrl,
  formatUpdatedAt,
}: TreeTypeDetailSectionProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const openEditModal = () => {
    if (!selectedTreeType) return;
    onStartEditTreeType(selectedTreeType);
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

  const confirmDeleteTreeType = async () => {
    if (!selectedTreeType) return;

    setIsDeleting(true);
    const deleted = await onDeleteTreeType(selectedTreeType.id);
    setIsDeleting(false);

    if (deleted) {
      setShowDeleteModal(false);
      onBack();
    }
  };

  if (!selectedTreeTypeId) {
    return (
      <section className="box">
        <p>El tipo de árbol solicitado no existe.</p>
        <button type="button" onClick={onBack}>
          Volver
        </button>
      </section>
    );
  }

  if (!selectedTreeType) {
    return (
      <section className="box">
        <p>Cargando tipo de árbol...</p>
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
      label: "Árbol",
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
      label: "Ubicación",
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
            Ver árbol
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
          Volver a tipos de árboles
        </button>
        {userRole === "admin" && (
          <>
            <button type="button" onClick={openEditModal}>
              Editar tipo
            </button>
            <button type="button" className="danger" onClick={openDeleteModal}>
              Eliminar tipo
            </button>
          </>
        )}
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
          <p>Este tipo de árbol no tiene imágenes referenciales.</p>
        )}
      </article>

      <article className="principal-panel">
        <h3>Árboles registrados de este tipo</h3>
        <DefaultTable
          columns={treeColumns}
          rows={treesOfType}
          onRowClick={onOpenTreeDetail}
          getRowId={(tree) => tree.id}
          getSearchText={(tree) =>
            `${tree.name} ${tree.healthStatus} ${tree.greenSpace?.name || ""}`
          }
          emptyMessage="No hay árboles registrados para este tipo todavía."
          searchPlaceholder="Buscar por nombre, salud o ubicación"
          exportTitle={`Árboles del tipo ${selectedTreeType.name}`}
          exportFileName={`arboles-tipo-${selectedTreeType.id}`}
        />
      </article>

      {userRole === "admin" && (
        <TreeTypeFormModal
          isOpen={showEditModal}
          isEditing={true}
          treeTypeNameInput={treeTypeNameInput}
          treeTypeDescriptionInput={treeTypeDescriptionInput}
          treeTypeImagesInput={treeTypeImagesInput}
          isSubmittingTreeType={isSubmittingTreeType}
          uploadingTreeTypeImages={uploadingTreeTypeImages}
          setTreeTypeNameInput={setTreeTypeNameInput}
          setTreeTypeDescriptionInput={setTreeTypeDescriptionInput}
          setTreeTypeImagesInput={setTreeTypeImagesInput}
          onUploadTreeTypeImages={onUploadTreeTypeImages}
          onSaveTreeType={onSaveTreeType}
          onResetTreeTypeForm={onResetTreeTypeForm}
          onClose={closeEditModal}
        />
      )}

      <AppModal
        isOpen={showDeleteModal}
        onClose={closeDeleteModal}
        title="Eliminar tipo de árbol"
        description="Esta acción eliminará el tipo de árbol seleccionado."
      >
        <p>¿Está seguro de que desea continuar?</p>
        <div className="button-row">
          <button
            type="button"
            className="danger"
            onClick={() => {
              void confirmDeleteTreeType();
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
