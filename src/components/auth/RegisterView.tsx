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
}: RegisterViewProps) {
  return (
    <div className="container">
      <h1>Registro de usuario</h1>
      <section className="box">
        <h2>Crea tu cuenta</h2>
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
        </label>
        <button onClick={onRegister}>Registrarse</button>
        <button type="button" className="secondary" onClick={onBackToLogin}>
          Volver al login
        </button>
        {error && <p className="error">{error}</p>}
      </section>
    </div>
  );
}
