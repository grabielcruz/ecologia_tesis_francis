import { ChangeEvent, FormEvent, useState } from "react";
import { DefaultTable, DefaultTableColumn } from "../DefaultTable";
import { TreeFormModal } from "./TreeFormModal";
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
  onOpenTreeDetail: (tree: TreeInventoryItem) => void;
  onUploadTreeImages: (event: ChangeEvent<HTMLInputElement>) => void;
  onSaveTree: (event: FormEvent<HTMLFormElement>) => Promise<boolean>;
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
  onOpenTreeDetail,
  onUploadTreeImages,
  onSaveTree,
  onApproveTree,
  onRejectTree,
}: TreesSectionProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const openCreateModal = () => {
    onResetTreeForm();
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
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
      label: "Árbol",
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
      label: "Validación",
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
      label: "Área verde",
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
        </div>
      ),
    },
  ];

  return (
    <section className="box reports-box">
      <article className="principal-panel">
        <h3>Inventario de árboles</h3>
        <p>
          Registro de árboles reales presentes en las áreas verdes, vinculados a
          tipos oficiales.
        </p>
        {(userRole === "admin" || userRole === "regular") && (
          <div className="button-row">
            <button type="button" onClick={openCreateModal}>
              {userRole === "regular"
                ? "Registrar árbol para validación"
                : "Registrar árbol"}
            </button>
          </div>
        )}
        {selectedSpaceFilterName && (
          <div className="button-row compact">
            <button
              type="button"
              className="secondary"
              onClick={onOpenGreenSpaces}
            >
              Áreas verdes
            </button>
            <span className="small muted">/</span>
            <span className="small muted">Árboles filtrados</span>
            <p className="small muted">
              Mostrando árboles del área:{" "}
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
          emptyMessage="No hay árboles registrados por el momento."
          searchPlaceholder="Buscar por nombre, tipo, salud o área"
        />
      </article>

      {(userRole === "admin" || userRole === "regular") && (
        <TreeFormModal
          isOpen={showCreateModal}
          isEditing={false}
          userRole={userRole}
          treeTypes={treeTypes}
          greenSpaces={greenSpaces}
          treeNameInput={treeNameInput}
          treeHealthStatusInput={treeHealthStatusInput}
          treeTypeIdInput={treeTypeIdInput}
          treeSpaceIdInput={treeSpaceIdInput}
          treeImagesInput={treeImagesInput}
          isSubmittingTree={isSubmittingTree}
          uploadingTreeImages={uploadingTreeImages}
          setTreeNameInput={setTreeNameInput}
          setTreeHealthStatusInput={setTreeHealthStatusInput}
          setTreeTypeIdInput={setTreeTypeIdInput}
          setTreeSpaceIdInput={setTreeSpaceIdInput}
          setTreeImagesInput={setTreeImagesInput}
          onUploadTreeImages={onUploadTreeImages}
          onSaveTree={onSaveTree}
          onResetTreeForm={onResetTreeForm}
          onClose={closeCreateModal}
        />
      )}
    </section>
  );
}
