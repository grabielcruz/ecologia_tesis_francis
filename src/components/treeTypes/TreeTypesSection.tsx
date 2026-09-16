import { ChangeEvent, FormEvent, useState } from "react";
import { DefaultTable, DefaultTableColumn } from "../DefaultTable";
import { TreeTypeFormModal } from "./TreeTypeFormModal";
import { TreeType } from "../../features/treeTypes/types";

interface TreeTypesSectionProps {
  treeTypes: TreeType[];
  userRole?: string;
  onOpenTreeTypeDetail: (treeType: TreeType) => void;
  treeTypeNameInput: string;
  treeTypeDescriptionInput: string;
  treeTypeImagesInput: string;
  isSubmittingTreeType: boolean;
  uploadingTreeTypeImages: boolean;
  resolveAssetUrl: (assetPath: string) => string;
  formatUpdatedAt: (value?: string) => string;
  setTreeTypeNameInput: (value: string) => void;
  setTreeTypeDescriptionInput: (value: string) => void;
  setTreeTypeImagesInput: (value: string) => void;
  onResetTreeTypeForm: () => void;
  onSaveTreeType: (event: FormEvent<HTMLFormElement>) => Promise<boolean>;
  onUploadTreeTypeImages: (event: ChangeEvent<HTMLInputElement>) => void;
}

export function TreeTypesSection({
  treeTypes,
  userRole,
  onOpenTreeTypeDetail,
  treeTypeNameInput,
  treeTypeDescriptionInput,
  treeTypeImagesInput,
  isSubmittingTreeType,
  uploadingTreeTypeImages,
  resolveAssetUrl,
  formatUpdatedAt,
  setTreeTypeNameInput,
  setTreeTypeDescriptionInput,
  setTreeTypeImagesInput,
  onResetTreeTypeForm,
  onSaveTreeType,
  onUploadTreeTypeImages,
}: TreeTypesSectionProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const openCreateModal = () => {
    onResetTreeTypeForm();
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
  };

  const treeTypeColumns: DefaultTableColumn<TreeType>[] = [
    {
      key: "thumbnail",
      label: "Imagen",
      render: (treeType) => {
        const thumbnail = treeType.referenceImages?.[0];
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
            alt={`${treeType.name} referencia`}
          />
        );
      },
    },
    {
      key: "name",
      label: "Tipo de árbol",
      sortable: true,
      sortValue: (treeType) => treeType.name,
      render: (treeType) => treeType.name,
    },
    {
      key: "description",
      label: "Descripción",
      sortable: true,
      sortValue: (treeType) => treeType.description,
      render: (treeType) => treeType.description,
    },
    {
      key: "images",
      label: "Referencias",
      sortable: true,
      sortValue: (treeType) => treeType.referenceImages.length,
      render: (treeType) => `${treeType.referenceImages.length} imagen(es)`,
    },
    {
      key: "updatedAt",
      label: "Actualizado",
      sortable: true,
      sortValue: (treeType) => treeType.updatedAt || "",
      render: (treeType) => formatUpdatedAt(treeType.updatedAt || undefined),
    },
  ];

  return (
    <section className="box reports-box">
      <article className="principal-panel">
        <h3>Catálogo de tipos de árboles</h3>
        <p>
          Referencias de especies para su uso posterior en el inventario real de
          árboles por área verde.
        </p>
        {userRole === "admin" && (
          <div className="button-row">
            <button type="button" onClick={openCreateModal}>
              Nuevo tipo de árbol
            </button>
          </div>
        )}
        <DefaultTable
          columns={treeTypeColumns}
          rows={treeTypes}
          onRowClick={onOpenTreeTypeDetail}
          getRowId={(treeType) => treeType.id}
          getSearchText={(treeType) =>
            `${treeType.name} ${treeType.description} ${treeType.referenceImages.join(" ")}`
          }
          emptyMessage="No hay tipos de árboles registrados."
          searchPlaceholder="Buscar por nombre, descripción o referencia"
          exportTitle="Catálogo de tipos de árboles"
          exportFileName="tipos-de-arboles"
        />
      </article>

      {userRole === "admin" && (
        <TreeTypeFormModal
          isOpen={showCreateModal}
          isEditing={false}
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
          onClose={closeCreateModal}
        />
      )}
    </section>
  );
}
