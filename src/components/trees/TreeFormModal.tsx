import { ChangeEvent, FormEvent } from "react";
import { AppModal } from "../AppModal";
import { ImageUrlPreviewEditor } from "../ImageUrlPreviewEditor";
import { TreeHealthStatus } from "../../features/trees/types";
import { TreeType } from "../../features/treeTypes/types";
import { TreeLocationPicker } from "./TreeLocationPicker";

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
            placeholder="Ejemplo: Árbol JC-10"
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

        <fieldset className="gps-fields">
          <legend>Ubicación GPS (opcional)</legend>
          <div className="field-row">
            <label>
              Latitud
              <input
                type="number"
                min="-90"
                max="90"
                step="any"
                value={treeLatitudeInput}
                onChange={(e) => setTreeLatitudeInput(e.target.value)}
                placeholder="10.06473"
              />
            </label>
            <label>
              Longitud
              <input
                type="number"
                min="-180"
                max="180"
                step="any"
                value={treeLongitudeInput}
                onChange={(e) => setTreeLongitudeInput(e.target.value)}
                placeholder="-69.32198"
              />
            </label>
          </div>
          <TreeLocationPicker
            latitudeInput={treeLatitudeInput}
            longitudeInput={treeLongitudeInput}
            setLatitudeInput={setTreeLatitudeInput}
            setLongitudeInput={setTreeLongitudeInput}
          />
          <p className="small muted">
            Completa ambas coordenadas o deja ambos campos vacíos.
          </p>
        </fieldset>

        <p className="small muted">Galería de imágenes</p>
        <ImageUrlPreviewEditor
          imageUrls={imageUrlRows}
          onRemove={removeImageUrl}
        />

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
                : "Guardando..."
              : isEditing
                ? "Actualizar"
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
