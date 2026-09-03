import { ChangeEvent } from "react";
import { AppModal } from "../AppModal";

interface ProfileFormProps {
  isOpen: boolean;
  profileName: string;
  profileUsername: string;
  profileEmail: string;
  profileAvatarUrl: string;
  error?: string | null;
  onClose: () => void;
  onSave: () => void;
  onAvatarFile: (event: ChangeEvent<HTMLInputElement>) => void;
  setProfileName: (value: string) => void;
  setProfileUsername: (value: string) => void;
  setProfileEmail: (value: string) => void;
  setProfileAvatarUrl: (value: string) => void;
}

export function ProfileForm({
  isOpen,
  profileName,
  profileUsername,
  profileEmail,
  profileAvatarUrl,
  error,
  onClose,
  onSave,
  onAvatarFile,
  setProfileName,
  setProfileUsername,
  setProfileEmail,
  setProfileAvatarUrl,
}: ProfileFormProps) {
  if (!isOpen) return null;

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar perfil"
      description="Actualiza tu informacion personal y avatar."
    >
      <div className="admin-form">
        <div className="profile-avatar-row">
          <div className="profile-avatar-preview">
            <img
              src={profileAvatarUrl || "/default-avatar.svg"}
              alt="Avatar preview"
            />
          </div>
          <div className="profile-avatar-controls">
            <label className="small">Subir imagen</label>
            <input type="file" accept="image/*" onChange={onAvatarFile} />
            <p className="muted">O pega una URL en el campo Avatar URL.</p>
          </div>
        </div>

        <label>
          Nombre completo
          <input
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
          />
        </label>
        <label>
          Nombre de usuario
          <input
            value={profileUsername}
            onChange={(e) => setProfileUsername(e.target.value)}
          />
        </label>
        <label>
          Correo
          <input
            value={profileEmail}
            onChange={(e) => setProfileEmail(e.target.value)}
          />
        </label>
        <label>
          Avatar URL
          <input
            value={profileAvatarUrl}
            onChange={(e) => setProfileAvatarUrl(e.target.value)}
            placeholder="https://..."
          />
        </label>

        <div className="button-row">
          <button type="button" onClick={onSave}>
            Guardar cambios
          </button>
          <button type="button" className="secondary" onClick={onClose}>
            Cancelar
          </button>
        </div>
        {error && <p className="error">{error}</p>}
      </div>
    </AppModal>
  );
}
