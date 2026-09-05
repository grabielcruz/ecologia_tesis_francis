interface LoginViewProps {
  username: string;
  password: string;
  showPasswordField: boolean;
  successMessage: string | null;
  successVisible: boolean;
  error: string | null;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onTogglePassword: () => void;
  onLogin: () => void;
  onGoRegister: () => void;
}

export function LoginView({
  username,
  password,
  showPasswordField,
  successMessage,
  successVisible,
  error,
  onUsernameChange,
  onPasswordChange,
  onTogglePassword,
  onLogin,
  onGoRegister,
}: LoginViewProps) {
  return (
    <div className="container">
      <h1>Univerde</h1>
      <section className="box login-box">
        <h2>Iniciar sesión</h2>
        <div className="input-group">
          <label className="input-with-icon">
            <input
              placeholder="Usuario"
              autoComplete="username"
              value={username}
              onChange={(e) => onUsernameChange(e.target.value)}
            />
          </label>
        </div>
        <div className="input-group">
          <label className="input-with-icon">
            <input
              placeholder="Contraseña"
              type={showPasswordField ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={onTogglePassword}
              aria-label={
                showPasswordField ? "Ocultar contraseña" : "Mostrar contraseña"
              }
            >
              {showPasswordField ? (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M4 4l16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
              )}
            </button>
          </label>
        </div>
        <button onClick={onLogin}>Entrar</button>
        {successMessage && (
          <p className={`success-message${successVisible ? " visible" : ""}`}>
            {successMessage}
          </p>
        )}
        {error && <p className="error">{error}</p>}
        <p>
          No tienes cuenta?{" "}
          <button type="button" className="link-button" onClick={onGoRegister}>
            Regístrate
          </button>
        </p>
      </section>
    </div>
  );
}
