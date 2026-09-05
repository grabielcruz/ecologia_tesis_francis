import { ChangeEvent, FormEvent } from "react";
import { AppModal } from "../AppModal";

interface TreeTypeFormModalProps {
  isOpen: boolean;
  isEditing: boolean;
  treeTypeNameInput: string;
  treeTypeDescriptionInput: string;
  treeTypeImagesInput: string;
  isSubmittingTreeType: boolean;
  uploadingTreeTypeImages: boolean;
  setTreeTypeNameInput: (value: string) => void;
  setTreeTypeDescriptionInput: (value: string) => void;
  setTreeTypeImagesInput: (value: string) => void;
  onUploadTreeTypeImages: (event: ChangeEvent<HTMLInputElement>) => void;
  onSaveTreeType: (event: FormEvent<HTMLFormElement>) => Promise<boolean>;
  onResetTreeTypeForm: () => void;
  onClose: () => void;
}

export function TreeTypeFormModal({
  isOpen,
  isEditing,
  treeTypeNameInput,
  treeTypeDescriptionInput,
  treeTypeImagesInput,
  isSubmittingTreeType,
  uploadingTreeTypeImages,
  setTreeTypeNameInput,
  setTreeTypeDescriptionInput,
  setTreeTypeImagesInput,
  onUploadTreeTypeImages,
  onSaveTreeType,
  onResetTreeTypeForm,
  onClose,
}: TreeTypeFormModalProps) {
  if (!isOpen) return null;

  const handleClose = () => {
    onResetTreeTypeForm();
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    const success = await onSaveTreeType(event);
    if (!success) return;
    onClose();
  };

  return (
    <AppModal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? "Editar tipo de arbol" : "Nuevo tipo de arbol"}
      description={
        isEditing
          ? "Actualiza los datos del tipo de arbol."
          : "Registra un nuevo tipo de arbol para el catalogo."
      }
    >
      <form className="admin-form" onSubmit={handleSubmit}>
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
              : isEditing
                ? "Actualizar"
                : "Crear tipo"}
          </button>
          <button type="button" className="secondary" onClick={handleClose}>
            Cancelar
          </button>
        </div>
        {uploadingTreeTypeImages && (
          <p className="small muted">Subiendo imagenes...</p>
        )}
      </form>
    </AppModal>
  );
}
