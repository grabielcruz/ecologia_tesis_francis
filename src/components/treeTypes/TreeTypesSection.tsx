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
      label: "Tipo de arbol",
      sortable: true,
      sortValue: (treeType) => treeType.name,
      render: (treeType) => treeType.name,
    },
    {
      key: "description",
      label: "Descripcion",
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
        <h3>Catalogo de tipos de arboles</h3>
        <p>
          Referencias de especies para su uso posterior en el inventario real de
          arboles por area verde.
        </p>
        {userRole === "admin" && (
          <div className="button-row">
            <button type="button" onClick={openCreateModal}>
              Nuevo tipo de arbol
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
          emptyMessage="No hay tipos de arboles registrados."
          searchPlaceholder="Buscar por nombre, descripcion o referencia"
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
