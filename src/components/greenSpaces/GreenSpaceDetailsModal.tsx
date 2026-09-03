import { AppModal } from "../AppModal";

interface GreenSpaceDetails {
  id: number;
  name: string;
  location: string;
  totalAreaM2: number;
  tallTreeCount: number;
}

interface GreenSpaceDetailsModalProps {
  isOpen: boolean;
  greenSpace: GreenSpaceDetails | null;
  onClose: () => void;
}

export function GreenSpaceDetailsModal({
  isOpen,
  greenSpace,
  onClose,
}: GreenSpaceDetailsModalProps) {
  if (!isOpen || !greenSpace) return null;

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalle de area verde"
      description={greenSpace.name}
    >
      <div className="admin-form">
        <div className="details-grid">
          <div className="details-item">
            <span>Nombre</span>
            <strong>{greenSpace.name}</strong>
          </div>
          <div className="details-item">
            <span>Ubicacion</span>
            <strong>{greenSpace.location}</strong>
          </div>
          <div className="details-item">
            <span>Area total</span>
            <strong>{greenSpace.totalAreaM2} m2</strong>
          </div>
          <div className="details-item">
            <span>Arboles altos</span>
            <strong>{greenSpace.tallTreeCount}</strong>
          </div>
        </div>
        <div className="button-row">
          <button type="button" className="secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </AppModal>
  );
}
