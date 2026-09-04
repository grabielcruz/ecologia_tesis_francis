import { ChangeEvent, FormEvent } from "react";
import { DefaultTable, DefaultTableColumn } from "../DefaultTable";
import {
  TreeInventoryItem,
  TreeHealthStatus,
  TreeInventoryStatus,
} from "../../features/trees/types";
import { TreeType } from "../../features/treeTypes/types";

interface GreenSpaceOption {
  id: number;
  name: string;
}

interface TreesSectionProps {
  trees: TreeInventoryItem[];
  treeTypes: TreeType[];
  greenSpaces: GreenSpaceOption[];
  userRole?: string;
  selectedSpaceFilterName?: string;
  onOpenGreenSpaces?: () => void;
  onClearSpaceFilter?: () => void;
  treeNameInput: string;
  treeHealthStatusInput: TreeHealthStatus;
  treeTypeIdInput: number;
  treeSpaceIdInput: number;
  treeImagesInput: string;
  editingTreeId: number | null;
  isSubmittingTree: boolean;
  uploadingTreeImages: boolean;
  treeActionLoadingId: number | null;
  resolveAssetUrl: (assetPath: string) => string;
  formatUpdatedAt: (value?: string) => string;
  setTreeNameInput: (value: string) => void;
  setTreeHealthStatusInput: (value: TreeHealthStatus) => void;
  setTreeTypeIdInput: (value: number) => void;
  setTreeSpaceIdInput: (value: number) => void;
  setTreeImagesInput: (value: string) => void;
  onResetTreeForm: () => void;
  onStartEditTree: (tree: TreeInventoryItem) => void;
  onOpenTreeDetail: (tree: TreeInventoryItem) => void;
  onUploadTreeImages: (event: ChangeEvent<HTMLInputElement>) => void;
  onSaveTree: (event: FormEvent<HTMLFormElement>) => void;
  onDeleteTree: (treeId: number) => void;
  onApproveTree: (treeId: number) => void;
  onRejectTree: (treeId: number) => void;
}

const healthLabel: Record<TreeHealthStatus, string> = {
  healthy: "Saludable",
  regular: "Regular",
  sick: "Enfermo",
  dead: "Seco",
};

const treeStatusLabel: Record<TreeInventoryStatus, string> = {
  pending: "Pendiente",
  approved: "Aprobado",
  rejected: "Rechazado",
};

export function TreesSection({
  trees,
  treeTypes,
  greenSpaces,
  userRole,
  selectedSpaceFilterName,
  onOpenGreenSpaces,
  onClearSpaceFilter,
  treeNameInput,
  treeHealthStatusInput,
  treeTypeIdInput,
  treeSpaceIdInput,
  treeImagesInput,
  editingTreeId,
  isSubmittingTree,
  uploadingTreeImages,
  treeActionLoadingId,
  resolveAssetUrl,
  formatUpdatedAt,
  setTreeNameInput,
  setTreeHealthStatusInput,
  setTreeTypeIdInput,
  setTreeSpaceIdInput,
  setTreeImagesInput,
  onResetTreeForm,
  onStartEditTree,
  onOpenTreeDetail,
  onUploadTreeImages,
  onSaveTree,
  onDeleteTree,
  onApproveTree,
  onRejectTree,
}: TreesSectionProps) {
  const imageUrlRows = treeImagesInput
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const removeImageUrl = (indexToRemove: number) => {
    const next = imageUrlRows.filter((_, index) => index !== indexToRemove);
    setTreeImagesInput(next.join("\n"));
  };

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
      key: "healthStatus",
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
      key: "status",
      label: "Validacion",
      sortable: true,
      sortValue: (tree) => tree.status,
      render: (tree) => (
        <span className={`pill proposal-status ${tree.status}`}>
          {treeStatusLabel[tree.status]}
        </span>
      ),
    },
    {
      key: "type",
      label: "Tipo",
      sortable: true,
      sortValue: (tree) => tree.treeType?.name || "",
      render: (tree) => tree.treeType?.name || "-",
    },
    {
      key: "space",
      label: "Area verde",
      sortable: true,
      sortValue: (tree) => tree.greenSpace?.name || "",
      render: (tree) => tree.greenSpace?.name || "-",
    },
    {
      key: "updatedAt",
      label: "Actualizado",
      sortable: true,
      sortValue: (tree) => tree.updatedAt || "",
      render: (tree) => formatUpdatedAt(tree.updatedAt || undefined),
    },
    {
      key: "actions",
      label: "Acciones",
      render: (tree) => (
        <div className="table-actions">
          <button
            type="button"
            className="secondary"
            onClick={(event) => {
              event.stopPropagation();
              onOpenTreeDetail(tree);
            }}
          >
            Ver detalle
          </button>
          {userRole === "admin" && tree.status === "pending" && (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onApproveTree(tree.id);
                }}
                disabled={treeActionLoadingId === tree.id}
              >
                Aprobar
              </button>
              <button
                type="button"
                className="danger"
                onClick={(event) => {
                  event.stopPropagation();
                  onRejectTree(tree.id);
                }}
                disabled={treeActionLoadingId === tree.id}
              >
                Rechazar
              </button>
            </>
          )}
          {userRole === "admin" && (
            <>
              <button
                type="button"
                className="secondary"
                onClick={(event) => {
                  event.stopPropagation();
                  onStartEditTree(tree);
                }}
              >
                Editar
              </button>
              <button
                type="button"
                className="danger"
                onClick={(event) => {
                  event.stopPropagation();
                  onDeleteTree(tree.id);
                }}
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
        <h3>Inventario de arboles</h3>
        <p>
          Registro de arboles reales presentes en las areas verdes, vinculados a
          tipos oficiales.
        </p>
        {selectedSpaceFilterName && (
          <div className="button-row compact">
            <button
              type="button"
              className="secondary"
              onClick={onOpenGreenSpaces}
            >
              Areas verdes
            </button>
            <span className="small muted">/</span>
            <span className="small muted">Arboles filtrados</span>
            <p className="small muted">
              Mostrando arboles del area:{" "}
              <strong>{selectedSpaceFilterName}</strong>
            </p>
            <button
              type="button"
              className="secondary"
              onClick={onClearSpaceFilter}
            >
              Quitar filtro
            </button>
          </div>
        )}
        <DefaultTable
          columns={treeColumns}
          rows={trees}
          onRowClick={onOpenTreeDetail}
          getRowId={(tree) => tree.id}
          getSearchText={(tree) =>
            `${tree.name} ${tree.healthStatus} ${tree.treeType?.name || ""} ${tree.greenSpace?.name || ""}`
          }
          emptyMessage="No hay arboles registrados por el momento."
          searchPlaceholder="Buscar por nombre, tipo, salud o area"
        />
      </article>

      {userRole === "admin" && (
        <article className="principal-panel">
          <h3>{editingTreeId ? "Editar arbol" : "Registrar arbol"}</h3>
          <p className="small muted">
            Puedes registrar arboles sin tipo y asignar el tipo al editar.
          </p>
          <form className="admin-form" onSubmit={onSaveTree}>
            <label>
              Nombre del arbol
              <input
                value={treeNameInput}
                onChange={(e) => setTreeNameInput(e.target.value)}
                placeholder="Ejemplo: Arbol JC-10"
                required
              />
            </label>

            <label>
              Estado de salud
              <select
                value={treeHealthStatusInput}
                onChange={(e) =>
                  setTreeHealthStatusInput(e.target.value as TreeHealthStatus)
                }
              >
                <option value="healthy">Saludable</option>
                <option value="regular">Regular</option>
                <option value="sick">Enfermo</option>
                <option value="dead">Seco</option>
              </select>
            </label>

            {editingTreeId && (
              <label>
                Tipo de arbol
                <select
                  value={String(treeTypeIdInput)}
                  onChange={(e) => setTreeTypeIdInput(Number(e.target.value))}
                >
                  <option value="0">Sin asignar</option>
                  {treeTypes.map((treeType) => (
                    <option key={treeType.id} value={String(treeType.id)}>
                      {treeType.name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label>
              Area verde
              <select
                value={String(treeSpaceIdInput)}
                onChange={(e) => setTreeSpaceIdInput(Number(e.target.value))}
              >
                {greenSpaces.map((space) => (
                  <option key={space.id} value={String(space.id)}>
                    {space.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Galeria de imagenes (una URL por linea)
              <textarea
                value={treeImagesInput}
                onChange={(e) => setTreeImagesInput(e.target.value)}
                placeholder="https://..."
              />
            </label>
            {imageUrlRows.length > 0 && (
              <div className="green-space-preview-list">
                {imageUrlRows.map((imageUrl, index) => (
                  <div
                    key={`tree-gallery-url-${index}`}
                    className="button-row compact"
                  >
                    <span className="small muted">{imageUrl}</span>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => removeImageUrl(index)}
                    >
                      Quitar
                    </button>
                  </div>
                ))}
              </div>
            )}

            <label>
              Subir imagenes para la galeria
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={onUploadTreeImages}
                disabled={uploadingTreeImages}
              />
            </label>
            {uploadingTreeImages && (
              <p className="small muted">Subiendo imagenes...</p>
            )}

            <div className="button-row">
              <button
                type="submit"
                disabled={
                  isSubmittingTree ||
                  treeTypes.length === 0 ||
                  greenSpaces.length === 0
                }
              >
                {isSubmittingTree
                  ? "Guardando..."
                  : editingTreeId
                    ? "Actualizar"
                    : "Registrar"}
              </button>
              {editingTreeId && (
                <button
                  type="button"
                  className="secondary"
                  onClick={onResetTreeForm}
                >
                  Cancelar edicion
                </button>
              )}
            </div>
          </form>
        </article>
      )}

      {userRole === "regular" && (
        <article className="principal-panel">
          <h3>Registrar arbol para validacion</h3>
          <p className="small muted">
            Tu registro sera revisado por un administrador antes de aparecer
            como aprobado.
          </p>
          <form className="admin-form" onSubmit={onSaveTree}>
            <label>
              Nombre del arbol
              <input
                value={treeNameInput}
                onChange={(e) => setTreeNameInput(e.target.value)}
                placeholder="Ejemplo: Arbol nuevo"
                required
              />
            </label>

            <label>
              Estado de salud
              <select
                value={treeHealthStatusInput}
                onChange={(e) =>
                  setTreeHealthStatusInput(e.target.value as TreeHealthStatus)
                }
              >
                <option value="healthy">Saludable</option>
                <option value="regular">Regular</option>
                <option value="sick">Enfermo</option>
                <option value="dead">Seco</option>
              </select>
            </label>

            <label>
              Area verde
              <select
                value={String(treeSpaceIdInput)}
                onChange={(e) => setTreeSpaceIdInput(Number(e.target.value))}
              >
                {greenSpaces.map((space) => (
                  <option key={space.id} value={String(space.id)}>
                    {space.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Galeria de imagenes (una URL por linea)
              <textarea
                value={treeImagesInput}
                onChange={(e) => setTreeImagesInput(e.target.value)}
                placeholder="https://..."
              />
            </label>

            <label>
              Subir imagenes para la galeria
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={onUploadTreeImages}
                disabled={uploadingTreeImages}
              />
            </label>
            {uploadingTreeImages && (
              <p className="small muted">Subiendo imagenes...</p>
            )}

            <div className="button-row">
              <button
                type="submit"
                disabled={isSubmittingTree || greenSpaces.length === 0}
              >
                {isSubmittingTree ? "Enviando..." : "Enviar para validacion"}
              </button>
            </div>
          </form>
        </article>
      )}
    </section>
  );
}
