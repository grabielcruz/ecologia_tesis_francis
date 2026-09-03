import { AppModal } from "../AppModal";

interface UserDetails {
  id: number;
  name: string;
  username: string;
  email: string;
  isActive: boolean;
  roleName: string;
}

interface UserDetailsModalProps {
  isOpen: boolean;
  user: UserDetails | null;
  onClose: () => void;
}

export function UserDetailsModal({
  isOpen,
  user,
  onClose,
}: UserDetailsModalProps) {
  if (!isOpen || !user) return null;

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalle de usuario"
      description="Informacion completa del registro seleccionado."
    >
      <div className="admin-form">
        <div className="details-grid">
          <div className="details-item">
            <span>Nombre</span>
            <strong>{user.name}</strong>
          </div>
          <div className="details-item">
            <span>Usuario</span>
            <strong>{user.username}</strong>
          </div>
          <div className="details-item">
            <span>Correo</span>
            <strong>{user.email}</strong>
          </div>
          <div className="details-item">
            <span>Rol</span>
            <strong>{user.roleName}</strong>
          </div>
          <div className="details-item">
            <span>Estado</span>
            <strong>{user.isActive ? "Activo" : "Inactivo"}</strong>
          </div>
        </div>

        <div className="button-row user-modal-actions">
          <button type="button" className="secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </AppModal>
  );
}
