import { ChangeEvent, FormEvent } from "react";
import { AppModal } from "../AppModal";
import { ImageUrlPreviewEditor } from "../ImageUrlPreviewEditor";
import {
  GreenSpacePerimeterEditor,
  PerimeterPoint,
} from "./GreenSpacePerimeterEditor";

interface GreenSpaceFormModalProps {
  isOpen: boolean;
  isEditing: boolean;
  spaceName: string;
  spaceLocation: string;
  spaceArea: string;
  spaceTrees: string;
  spaceImagePreviewList: string[];
  spacePerimeterPoints: PerimeterPoint[];
  uploadingSpaceImages: boolean;
  onSpaceNameChange: (value: string) => void;
  onSpaceLocationChange: (value: string) => void;
  onSpaceAreaChange: (value: string) => void;
  onSpaceTreesChange: (value: string) => void;
  onUploadGreenSpaceImages: (event: ChangeEvent<HTMLInputElement>) => void;
  onResolveAssetUrl: (assetPath: string) => string;
  onRemoveImage: (index: number) => void;
  onSpacePerimeterPointsChange: (points: PerimeterPoint[]) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
  onDelete?: () => void;
}

export function GreenSpaceFormModal({
  isOpen,
  isEditing,
  spaceName,
  spaceLocation,
  spaceArea,
  spaceTrees,
  spaceImagePreviewList,
  spacePerimeterPoints,
  uploadingSpaceImages,
  onSpaceNameChange,
  onSpaceLocationChange,
  onSpaceAreaChange,
  onSpaceTreesChange,
  onUploadGreenSpaceImages,
  onResolveAssetUrl,
  onRemoveImage,
  onSpacePerimeterPointsChange,
  onSubmit,
  onClose,
  onDelete,
}: GreenSpaceFormModalProps) {
  if (!isOpen) return null;

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Editar área verde" : "Registrar área verde"}
      description={
        isEditing
          ? "Actualiza la información del espacio verde."
          : "Completa la información para registrar un nuevo espacio verde."
      }
    >
      <form className="admin-form" onSubmit={onSubmit}>
        <div className="field-row">
          <label>
            Nombre
            <input
              value={spaceName}
              onChange={(e) => onSpaceNameChange(e.target.value)}
              placeholder="Ej: Jardin Central"
              required
            />
          </label>
          <label>
            Ubicación
            <input
              value={spaceLocation}
              onChange={(e) => onSpaceLocationChange(e.target.value)}
              placeholder="Ej: Frente a biblioteca"
              required
            />
          </label>
        </div>
        <div className="field-row">
          <label>
            Área total (m2)
            <input
              type="number"
              min="0"
              value={spaceArea}
              onChange={(e) => onSpaceAreaChange(e.target.value)}
              placeholder="0"
              required
            />
          </label>
          <label>
            Número de árboles altos
            <input
              type="number"
              min="0"
              value={spaceTrees}
              onChange={(e) => onSpaceTreesChange(e.target.value)}
              placeholder="0"
              required
            />
          </label>
        </div>

        <GreenSpacePerimeterEditor
          points={spacePerimeterPoints}
          setPoints={onSpacePerimeterPointsChange}
        />

        <p className="muted">
          Las imágenes se agregan solo desde tu equipo con el botón "Elegir
          archivos".
        </p>
        <ImageUrlPreviewEditor
          imageUrls={spaceImagePreviewList}
          onRemove={onRemoveImage}
          resolveAssetUrl={onResolveAssetUrl}
        />

        <label>
          Imágenes del área verde (solo carga local)
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={onUploadGreenSpaceImages}
            disabled={uploadingSpaceImages}
          />
        </label>
        {uploadingSpaceImages && (
          <p className="muted">Subiendo imágenes, por favor espera...</p>
        )}

        <div className="button-row user-modal-actions">
          <button type="submit">
            {isEditing ? "Guardar cambios" : "Registrar"}
          </button>
          <button type="button" className="secondary" onClick={onClose}>
            Cancelar
          </button>
          {isEditing && onDelete && (
            <button type="button" className="danger" onClick={onDelete}>
              Eliminar
            </button>
          )}
        </div>
      </form>
    </AppModal>
  );
}
