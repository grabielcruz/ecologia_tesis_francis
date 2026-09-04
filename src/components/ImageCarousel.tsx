import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ImageCarouselProps {
  images: string[];
  title: string;
  resolveAssetUrl: (assetPath: string) => string;
  className?: string;
}

export function ImageCarousel({
  images,
  title,
  resolveAssetUrl,
  className,
}: ImageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (images.length === 0) {
      setActiveIndex(0);
      return;
    }

    if (activeIndex > images.length - 1) {
      setActiveIndex(0);
    }
  }, [images, activeIndex]);

  if (images.length === 0) {
    return null;
  }

  const activeImage = images[activeIndex] || images[0];
  const rootClassName = className
    ? `green-space-carousel ${className}`
    : "green-space-carousel";

  const goToImage = (direction: number) => {
    if (images.length <= 1) return;
    setActiveIndex(
      (prev) => (prev + direction + images.length) % images.length,
    );
  };

  const modal = showModal
    ? createPortal(
        <div
          className="image-lightbox-overlay"
          onClick={() => setShowModal(false)}
        >
          <div
            className="image-lightbox-card"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="image-lightbox-close"
              onClick={() => setShowModal(false)}
              aria-label="Cerrar vista ampliada"
            >
              ×
            </button>
            <img
              src={resolveAssetUrl(activeImage)}
              alt={`${title} imagen ampliada ${activeIndex + 1}`}
              className="image-lightbox-main"
            />

            {images.length > 1 && (
              <div className="image-lightbox-controls">
                <button
                  type="button"
                  className="secondary"
                  onClick={() => goToImage(-1)}
                >
                  ‹
                </button>
                <span>
                  {activeIndex + 1} / {images.length}
                </span>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => goToImage(1)}
                >
                  ›
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      <div className={rootClassName}>
        <div className="green-space-carousel-main">
          <button
            type="button"
            className="image-carousel-open"
            onClick={() => setShowModal(true)}
            aria-label={`Abrir imagen ${activeIndex + 1} de ${images.length} en grande`}
          >
            <img
              src={resolveAssetUrl(activeImage)}
              alt={`${title} imagen ${activeIndex + 1}`}
            />
          </button>
          {images.length > 1 && (
            <div className="green-space-carousel-controls">
              <button
                type="button"
                className="secondary"
                onClick={() => goToImage(-1)}
              >
                ‹
              </button>
              <span>
                {activeIndex + 1} / {images.length}
              </span>
              <button
                type="button"
                className="secondary"
                onClick={() => goToImage(1)}
              >
                ›
              </button>
            </div>
          )}
        </div>

        {images.length > 1 && (
          <div className="green-space-carousel-thumbnails">
            {images.map((image, index) => (
              <button
                key={`${title}-thumb-${index}`}
                type="button"
                className={`green-space-carousel-thumb ${index === activeIndex ? "selected" : ""}`}
                onClick={() => setActiveIndex(index)}
              >
                <img
                  src={resolveAssetUrl(image)}
                  alt={`${title} miniatura ${index + 1}`}
                />
              </button>
            ))}
          </div>
        )}
      </div>
      {modal}
    </>
  );
}
