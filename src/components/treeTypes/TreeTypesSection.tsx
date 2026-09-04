import { ChangeEvent, FormEvent } from "react";
import { DefaultTable, DefaultTableColumn } from "../DefaultTable";
import { TreeType } from "../../features/treeTypes/types";

interface TreeTypesSectionProps {
  treeTypes: TreeType[];
  userRole?: string;
  onOpenTreeTypeDetail: (treeType: TreeType) => void;
  treeTypeNameInput: string;
  treeTypeDescriptionInput: string;
  treeTypeImagesInput: string;
  editingTreeTypeId: number | null;
  isSubmittingTreeType: boolean;
  uploadingTreeTypeImages: boolean;
  resolveAssetUrl: (assetPath: string) => string;
  formatUpdatedAt: (value?: string) => string;
  setTreeTypeNameInput: (value: string) => void;
  setTreeTypeDescriptionInput: (value: string) => void;
  setTreeTypeImagesInput: (value: string) => void;
  onResetTreeTypeForm: () => void;
  onStartEditTreeType: (treeType: TreeType) => void;
  onSaveTreeType: (event: FormEvent<HTMLFormElement>) => void;
  onDeleteTreeType: (treeTypeId: number) => void;
  onUploadTreeTypeImages: (event: ChangeEvent<HTMLInputElement>) => void;
}

export function TreeTypesSection({
  treeTypes,
  userRole,
  onOpenTreeTypeDetail,
  treeTypeNameInput,
  treeTypeDescriptionInput,
  treeTypeImagesInput,
  editingTreeTypeId,
  isSubmittingTreeType,
  uploadingTreeTypeImages,
  resolveAssetUrl,
  formatUpdatedAt,
  setTreeTypeNameInput,
  setTreeTypeDescriptionInput,
  setTreeTypeImagesInput,
  onResetTreeTypeForm,
  onStartEditTreeType,
  onSaveTreeType,
  onDeleteTreeType,
  onUploadTreeTypeImages,
}: TreeTypesSectionProps) {
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
    {
      key: "actions",
      label: "Acciones",
      render: (treeType) => (
        <div className="table-actions">
          <button
            type="button"
            className="secondary"
            onClick={() => onOpenTreeTypeDetail(treeType)}
          >
            Ver detalle
          </button>
          {userRole === "admin" && (
            <>
              <button
                type="button"
                className="secondary"
                onClick={() => onStartEditTreeType(treeType)}
              >
                Editar
              </button>
              <button
                type="button"
                className="danger"
                onClick={() => onDeleteTreeType(treeType.id)}
              >
                Eliminar
              </button>
            </>
          )}
        </div>
      ),
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
        <article className="principal-panel">
          <h3>
            {editingTreeTypeId ? "Editar tipo de arbol" : "Nuevo tipo de arbol"}
          </h3>
          <form className="admin-form" onSubmit={onSaveTreeType}>
            <label>
              Nombre
              <input
                value={treeTypeNameInput}
                onChange={(e) => setTreeTypeNameInput(e.target.value)}
                placeholder="Ejemplo: Araguaney"
                required
              />
            </label>
            <label>
              Descripcion
              <textarea
                value={treeTypeDescriptionInput}
                onChange={(e) => setTreeTypeDescriptionInput(e.target.value)}
                placeholder="Describe las caracteristicas principales de la especie"
                required
              />
            </label>
            <label>
              Imagenes referenciales
              <textarea
                value={treeTypeImagesInput}
                onChange={(e) => setTreeTypeImagesInput(e.target.value)}
                placeholder="Una URL por linea"
                required
              />
            </label>
            <label>
              Subir imagenes
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={onUploadTreeTypeImages}
              />
            </label>
            <div className="button-row">
              <button type="submit" disabled={isSubmittingTreeType}>
                {isSubmittingTreeType
                  ? "Guardando..."
                  : editingTreeTypeId
                    ? "Actualizar"
                    : "Crear tipo"}
              </button>
              {editingTreeTypeId && (
                <button
                  type="button"
                  className="secondary"
                  onClick={onResetTreeTypeForm}
                >
                  Cancelar edicion
                </button>
              )}
            </div>
            {uploadingTreeTypeImages && (
              <p className="small muted">Subiendo imagenes...</p>
            )}
          </form>
        </article>
      )}
    </section>
  );
}
