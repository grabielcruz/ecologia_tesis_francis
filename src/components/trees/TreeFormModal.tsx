import { ChangeEvent, FormEvent } from "react";
import { AppModal } from "../AppModal";
import { TreeHealthStatus } from "../../features/trees/types";
import { TreeType } from "../../features/treeTypes/types";

interface GreenSpaceOption {
  id: number;
  name: string;
}

interface TreeFormModalProps {
  isOpen: boolean;
  isEditing: boolean;
  userRole?: string;
  treeTypes: TreeType[];
  greenSpaces: GreenSpaceOption[];
  treeNameInput: string;
  treeHealthStatusInput: TreeHealthStatus;
  treeTypeIdInput: number;
  treeSpaceIdInput: number;
  treeImagesInput: string;
  isSubmittingTree: boolean;
  uploadingTreeImages: boolean;
  setTreeNameInput: (value: string) => void;
  setTreeHealthStatusInput: (value: TreeHealthStatus) => void;
  setTreeTypeIdInput: (value: number) => void;
  setTreeSpaceIdInput: (value: number) => void;
  setTreeImagesInput: (value: string) => void;
  onUploadTreeImages: (event: ChangeEvent<HTMLInputElement>) => void;
  onSaveTree: (event: FormEvent<HTMLFormElement>) => Promise<boolean>;
  onResetTreeForm: () => void;
  onClose: () => void;
}

export function TreeFormModal({
  isOpen,
  isEditing,
  userRole,
  treeTypes,
  greenSpaces,
  treeNameInput,
  treeHealthStatusInput,
  treeTypeIdInput,
  treeSpaceIdInput,
  treeImagesInput,
  isSubmittingTree,
  uploadingTreeImages,
  setTreeNameInput,
  setTreeHealthStatusInput,
  setTreeTypeIdInput,
  setTreeSpaceIdInput,
  setTreeImagesInput,
  onUploadTreeImages,
  onSaveTree,
  onResetTreeForm,
  onClose,
}: TreeFormModalProps) {
  if (!isOpen) return null;

  const imageUrlRows = treeImagesInput
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const removeImageUrl = (indexToRemove: number) => {
    const next = imageUrlRows.filter((_, index) => index !== indexToRemove);
    setTreeImagesInput(next.join("\n"));
  };

  const handleClose = () => {
    onResetTreeForm();
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    const success = await onSaveTree(event);
    if (!success) return;
    onClose();
  };

  const submitDisabled =
    isSubmittingTree ||
    greenSpaces.length === 0 ||
    (isEditing && userRole === "admin" && treeTypes.length === 0);

  return (
    <AppModal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? "Editar árbol" : "Registrar árbol"}
      description={
        isEditing
          ? "Actualiza la información del árbol seleccionado."
          : userRole === "regular"
            ? "Registra un árbol para validación administrativa."
            : "Registra un nuevo árbol en el inventario."
      }
    >
      <form className="admin-form" onSubmit={handleSubmit}>
        {!isEditing && userRole === "admin" && (
          <p className="small muted">
            Puedes registrar árboles sin tipo y asignar el tipo al editar.
          </p>
        )}
        <label>
          Nombre del árbol
          <input
            value={treeNameInput}
            onChange={(e) => setTreeNameInput(e.target.value)}
            placeholder={
              userRole === "regular"
                ? "Ejemplo: Árbol nuevo"
                : "Ejemplo: Árbol JC-10"
            }
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

        {isEditing && (
          <label>
            Tipo de árbol
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
          Área verde
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
          Galería de imágenes (una URL por línea)
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
          Subir imágenes para la galería
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={onUploadTreeImages}
            disabled={uploadingTreeImages}
          />
        </label>
        {uploadingTreeImages && (
          <p className="small muted">Subiendo imágenes...</p>
        )}

        <div className="button-row">
          <button type="submit" disabled={submitDisabled}>
            {isSubmittingTree
              ? isEditing
                ? "Guardando..."
                : userRole === "regular"
                  ? "Enviando..."
                  : "Guardando..."
              : isEditing
                ? "Actualizar"
                : userRole === "regular"
                  ? "Enviar para validación"
                  : "Registrar"}
          </button>
          <button type="button" className="secondary" onClick={handleClose}>
            Cancelar
          </button>
        </div>
      </form>
    </AppModal>
  );
}
