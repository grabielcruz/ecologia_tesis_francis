interface ImageUrlPreviewEditorProps {
  imageUrls: string[];
  onRemove: (index: number) => void;
  resolveAssetUrl?: (assetPath: string) => string;
  emptyMessage?: string;
}

export function ImageUrlPreviewEditor({
  imageUrls,
  onRemove,
  resolveAssetUrl,
  emptyMessage = "Aún no hay imágenes cargadas.",
}: ImageUrlPreviewEditorProps) {
  if (imageUrls.length === 0) {
    return <p className="small muted">{emptyMessage}</p>;
  }

  const resolveImageUrl = (imageUrl: string) =>
    resolveAssetUrl ? resolveAssetUrl(imageUrl) : imageUrl;

  return (
    <div className="image-url-editor-grid">
      {imageUrls.map((imageUrl, index) => (
        <figure key={`${imageUrl}-${index}`} className="image-url-editor-card">
          <button
            type="button"
            className="image-url-editor-remove"
            onClick={() => onRemove(index)}
            aria-label={`Eliminar imagen ${index + 1}`}
            title="Eliminar imagen"
          >
            ×
          </button>
          <img
            src={resolveImageUrl(imageUrl)}
            alt={`Previsualización ${index + 1}`}
          />
          <figcaption>{imageUrl}</figcaption>
        </figure>
      ))}
    </div>
  );
}
