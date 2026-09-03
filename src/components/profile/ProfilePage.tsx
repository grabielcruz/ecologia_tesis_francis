interface ProfilePageProps {
  name: string;
  username: string;
  email: string;
  avatarUrl: string;
  onEdit: () => void;
  onChangePassword: () => void;
  onBack: () => void;
  error?: string | null;
}

export function ProfilePage({
  name,
  username,
  email,
  avatarUrl,
  onEdit,
  onChangePassword,
  onBack,
  error,
}: ProfilePageProps) {
  return (
    <section className="box profile-box">
      <h2>Mi perfil</h2>
      <div className="profile-avatar-row">
        <div className="profile-avatar-preview">
          <img src={avatarUrl || "/default-avatar.svg"} alt="Avatar" />
        </div>
        <div className="profile-data-list">
          <div className="profile-data-item">
            <span>Nombre completo</span>
            <strong>{name || "-"}</strong>
          </div>
          <div className="profile-data-item">
            <span>Nombre de usuario</span>
            <strong>{username || "-"}</strong>
          </div>
          <div className="profile-data-item">
            <span>Correo</span>
            <strong>{email || "-"}</strong>
          </div>
          <div className="profile-data-item">
            <span>Avatar URL</span>
            <strong>{avatarUrl || "-"}</strong>
          </div>
        </div>
      </div>

      <div className="button-row">
        <button type="button" onClick={onEdit}>
          Editar perfil
        </button>
        <button type="button" className="secondary" onClick={onChangePassword}>
          Cambiar contraseña
        </button>
        <button type="button" className="secondary" onClick={onBack}>
          Volver
        </button>
      </div>
      {error && <p className="error">{error}</p>}
    </section>
  );
}
