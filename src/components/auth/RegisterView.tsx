import { AuthPlant } from "./AuthPlant";

interface RegisterViewProps {
  registerName: string;
  username: string;
  email: string;
  password: string;
  error: string | null;
  onRegisterNameChange: (value: string) => void;
  onUsernameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onRegister: () => void;
  onBackToLogin: () => void;
  onContinueAsGuest: () => void;
  themeMode: "light" | "dark";
  onToggleTheme: () => void;
}

export function RegisterView({
  registerName,
  username,
  email,
  password,
  error,
  onRegisterNameChange,
  onUsernameChange,
  onEmailChange,
  onPasswordChange,
  onRegister,
  onBackToLogin,
  onContinueAsGuest,
  themeMode,
  onToggleTheme,
}: RegisterViewProps) {
  return (
    <div className="container auth-container">
      <AuthPlant side="left" />
      <div className="auth-card-wrap">
        <div className="auth-title-row">
          <div className="auth-brand">
            <img
              className="auth-brand-logo"
              src="/favicon.svg"
              alt="Logo de Univerde"
            />
            <div className="auth-brand-copy">
              <h1>Univerde</h1>
              <p>Campus sostenible e inteligente</p>
            </div>
          </div>
          <button
            type="button"
            className={`nav-theme-toggle auth-theme-toggle ${
              themeMode === "dark" ? "is-dark" : "is-light"
            }`}
            onClick={onToggleTheme}
            aria-label={
              themeMode === "dark"
                ? "Activar modo claro"
                : "Activar modo oscuro"
            }
            title={themeMode === "dark" ? "Modo claro" : "Modo oscuro"}
          >
            <span className="sun-icon" aria-hidden="true" />
            <span className="moon-icon" aria-hidden="true" />
          </button>
        </div>
        <section className="box register-box">
          <h2>Registro de usuario</h2>
          <p className="auth-box-subtitle">Crea tu cuenta para participar.</p>
          <label>
            Nombre completo
            <input
              placeholder="Nombre completo"
              value={registerName}
              onChange={(e) => onRegisterNameChange(e.target.value)}
            />
          </label>
          <label>
            Nombre de usuario
            <input
              placeholder="Nombre de usuario"
              value={username}
              onChange={(e) => onUsernameChange(e.target.value)}
            />
          </label>
          <label>
            Correo
            <input
              placeholder="Correo"
              type="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
            />
          </label>
          <label>
            Contraseña
            <input
              placeholder="Contraseña"
              type="password"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
            />
            <span className="small muted">
              Mínimo 8 caracteres, con mayúscula, minúscula y número.
            </span>
          </label>
          <button onClick={onRegister}>Registrarse</button>
          <button type="button" className="secondary" onClick={onBackToLogin}>
            Volver al login
          </button>
          <p>
            ¿Quieres explorar sin cuenta?{" "}
            <button
              type="button"
              className="link-button"
              onClick={onContinueAsGuest}
            >
              Continuar como invitado
            </button>
          </p>
          {error && <p className="error">{error}</p>}
        </section>
      </div>
      <AuthPlant side="right" />
    </div>
  );
}
