import { FormEvent, useEffect, useState } from "react";

interface SurveySummary {
  totalResponses: number;
  yesCount?: number;
  noCount?: number;
  average?: number;
}

interface Survey {
  id: number;
  title: string;
  description: string;
  active: boolean;
  type: "yesno" | "rating";
  summary?: SurveySummary;
  updatedAt?: string;
}

function App() {
  const resolveAvatarUrl = (avatarUrl?: string | null) => {
    if (!avatarUrl) return "/default-avatar.svg";
    if (
      avatarUrl.startsWith("http://") ||
      avatarUrl.startsWith("https://") ||
      avatarUrl.startsWith("data:")
    ) {
      return avatarUrl;
    }
    if (avatarUrl.startsWith("/uploads")) {
      return `${window.location.origin}${avatarUrl}`;
    }
    return avatarUrl;
  };

  const normalizeAvatarForApi = (avatarUrl: string) => {
    if (!avatarUrl || avatarUrl.startsWith("data:")) return undefined;
    const uploadsPrefix = `${window.location.origin}/uploads`;
    if (avatarUrl.startsWith(uploadsPrefix)) {
      return avatarUrl.replace(window.location.origin, "");
    }
    return avatarUrl;
  };

  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [route, setRoute] = useState(window.location.pathname);
  const [user, setUser] = useState<{
    id: number;
    name: string;
    username: string;
    email: string;
    role: string;
    points: number;
    avatarUrl?: string;
  } | null>(null);
  const [email, setEmail] = useState("");
  const [profileName, setProfileName] = useState("");
  const [profileUsername, setProfileUsername] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileAvatarUrl, setProfileAvatarUrl] = useState(
    "/default-avatar.svg",
  );
  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    // Create a data URL preview using FileReader for broader compatibility
    const reader = new FileReader();
    reader.onload = () => {
      setProfileAvatarUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // If user is authenticated, upload to server (in background)
    if (!user || !token) return;
    try {
      const form = new FormData();
      form.append("avatar", file);
      const res = await fetch(`/api/auth/profile/${user.id}/avatar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        } as any,
        body: form,
      });
      if (!res.ok) {
        setError("No se pudo subir la imagen");
        return;
      }
      const data = await res.json();
      setProfileAvatarUrl(resolveAvatarUrl(data.avatarUrl));
      const updatedUser = { ...(user as any), avatarUrl: data.avatarUrl };
      setUser(updatedUser as any);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    } catch (err) {
      setError("Error al subir la imagen");
    }
  };
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [successVisible, setSuccessVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adminPage, setAdminPage] = useState(1);

  useEffect(() => {
    if (!successMessage) {
      setSuccessVisible(false);
      return;
    }

    setSuccessVisible(true);
    const fadeOutTimer = window.setTimeout(() => {
      setSuccessVisible(false);
    }, 4500);
    const clearTimer = window.setTimeout(() => {
      setSuccessMessage(null);
    }, 5000);

    return () => {
      window.clearTimeout(fadeOutTimer);
      window.clearTimeout(clearTimer);
    };
  }, [successMessage]);
  const [limit] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "yesno" | "rating">(
    "all",
  );
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [userPage, setUserPage] = useState(1);
  const [answerFilter, setAnswerFilter] = useState<
    "all" | "answered" | "unanswered"
  >("all");
  const [activePollId, setActivePollId] = useState<number | null>(null);
  const [voteValue, setVoteValue] = useState("yes");
  const [submittedPollId, setSubmittedPollId] = useState<number | null>(null);
  const [pollAnswers, setPollAnswers] = useState<Record<number, string>>({});
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [pollTitle, setPollTitle] = useState("");
  const [pollDescription, setPollDescription] = useState("");
  const [pollType, setPollType] = useState<"yesno" | "rating">("yesno");
  const [pollActive, setPollActive] = useState(true);
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);

  const navigate = (path: string, replace = false) => {
    if (window.location.pathname !== path) {
      if (replace) {
        window.history.replaceState(null, "", path);
      } else {
        window.history.pushState(null, "", path);
      }
    }
    setRoute(path);
  };

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (storedToken && storedUser) {
      setToken(storedToken);
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      const storedAnswers = localStorage.getItem(
        `pollAnswers-${parsedUser.username}`,
      );
      if (storedAnswers) {
        setPollAnswers(JSON.parse(storedAnswers));
      }
    }

    const handlePopState = () => setRoute(window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (route === "/login" || route === "/register") {
      if (token) {
        navigate("/", true);
      }
      return;
    }

    if (!token) {
      navigate("/login", true);
    }
  }, [route, token]);

  useEffect(() => {
    if (!token) return;
    if (user?.role === "admin") {
      fetchAdminSurveys(adminPage);
    } else {
      fetchSurveys();
    }
  }, [
    token,
    user?.role,
    adminPage,
    searchTerm,
    filterType,
    filterStatus,
    sortOrder,
  ]);

  const fetchSurveys = async () => {
    try {
      const res = await fetch("/api/surveys?active=true&page=1&limit=1000");
      const data = await res.json();
      setSurveys(data.surveys || data);
      setUserPage(1);
    } catch {
      setError("No se pudieron cargar las encuestas");
    }
  };

  const fetchAdminSurveys = async (page: number) => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        admin: "true",
      });

      if (searchTerm.trim()) {
        params.set("search", searchTerm.trim());
      }
      if (filterType !== "all") {
        params.set("type", filterType);
      }
      if (filterStatus !== "all") {
        params.set("status", filterStatus);
      }
      params.set("sort", sortOrder);

      const res = await fetch(`/api/surveys?${params.toString()}`);
      const data = await res.json();
      setSurveys(data.surveys);
      setTotalPages(data.totalPages);
    } catch {
      setError("No se pudieron cargar las encuestas de administrador");
    }
  };

  const login = async () => {
    setError(null);
    setSuccessMessage(null);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      setError("Usuario o contraseña incorrectos");
      return;
    }

    const data = await response.json();
    setToken(data.token);
    const loggedUser = data.user;
    setUser(loggedUser);
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    const storedAnswers = localStorage.getItem(
      `pollAnswers-${data.user.username}`,
    );
    if (storedAnswers) {
      setPollAnswers(JSON.parse(storedAnswers));
    } else {
      setPollAnswers({});
    }
    navigate("/");
  };

  const register = async () => {
    setError(null);
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: registerName, username, password, email }),
    });

    if (!response.ok) {
      setError("No se pudo crear la cuenta");
      return;
    }

    const data = await response.json();
    const regUser = data;
    setUser(regUser);
    setToken(null);
    setPassword("");
    setRegisterName("");
    setEmail("");
    setUsername(data.username);
    setSuccessMessage("Registro exitoso. Ahora ingresa con tu usuario.");
    navigate("/login");
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setSurveys([]);
    setUsername("");
    setPassword("");
    setError(null);
    setAdminPage(1);
    setTotalPages(1);
    setPollTitle("");
    setPollDescription("");
    setPollType("yesno");
    setPollActive(true);
    setEditingSurvey(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const displayName = user ? `${user.name}` : "";

  const formatUpdatedAt = (value?: string | Date) => {
    if (!value) return "Sin fecha";
    const date = typeof value === "string" ? new Date(value) : value;
    return date.toLocaleString("es-AR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const answeredPolls = surveys.filter((survey) =>
    Boolean(pollAnswers[survey.id]),
  ).length;
  const unansweredPolls = surveys.length - answeredPolls;
  const filteredSurveys = surveys.filter((survey) => {
    if (answerFilter === "answered") {
      return Boolean(pollAnswers[survey.id]);
    }
    if (answerFilter === "unanswered") {
      return !pollAnswers[survey.id];
    }
    return true;
  });

  const userTotalPages = Math.max(1, Math.ceil(filteredSurveys.length / limit));
  const safeUserPage = Math.min(userPage, userTotalPages);
  const pagedSurveys = filteredSurveys.slice(
    (safeUserPage - 1) * limit,
    safeUserPage * limit,
  );
  const pageTitle =
    route === "/profile" ? "Mi perfil" : "Encuestas disponibles";
  const pageSubtitle =
    route === "/profile"
      ? "Actualiza tus datos personales"
      : `Bienvenido${displayName ? `, ${displayName}` : ""}`;

  const resetAdminForm = () => {
    setEditingSurvey(null);
    setPollTitle("");
    setPollDescription("");
    setPollType("yesno");
    setPollActive(true);
  };

  const saveSurvey = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const payload = {
      title: pollTitle,
      description: pollDescription,
      type: pollType,
      active: pollActive,
    };

    try {
      const method = editingSurvey ? "PUT" : "POST";
      const url = editingSurvey
        ? `/api/surveys/${editingSurvey.id}`
        : "/api/surveys";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        setError("No se pudo guardar la encuesta");
        return;
      }

      resetAdminForm();
      setShowModal(false);
      fetchAdminSurveys(adminPage);
    } catch {
      setError("No se pudo guardar la encuesta");
    }
  };

  const editSurvey = (survey: Survey) => {
    setEditingSurvey(survey);
    setPollTitle(survey.title);
    setPollDescription(survey.description);
    setPollType(survey.type);
    setPollActive(survey.active);
    setShowModal(true);
  };

  const cancelEdit = () => {
    resetAdminForm();
    setShowModal(false);
  };

  const openCreateModal = () => {
    resetAdminForm();
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetAdminForm();
  };

  const renderModal = () => {
    if (!showModal) return null;

    return (
      <div className="modal-overlay" onClick={closeModal}>
        <div className="modal-card" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div>
              <h3>{editingSurvey ? "Editar encuesta" : "Nueva encuesta"}</h3>
              <p>
                {editingSurvey
                  ? "Ajusta los datos y guarda los cambios."
                  : "Crea una nueva encuesta para tu campus."}
              </p>
            </div>
            <button type="button" className="modal-close" onClick={closeModal}>
              ×
            </button>
          </div>

          <form className="admin-form" onSubmit={saveSurvey}>
            <div className="field-row">
              <label>
                Título
                <input
                  value={pollTitle}
                  onChange={(e) => setPollTitle(e.target.value)}
                  placeholder="Título de la encuesta"
                  required
                />
              </label>
              <label>
                Tipo de encuesta
                <select
                  value={pollType}
                  onChange={(e) =>
                    setPollType(e.target.value as "yesno" | "rating")
                  }
                >
                  <option value="yesno">Sí / No</option>
                  <option value="rating">Valoración 1–5</option>
                </select>
              </label>
            </div>

            <label>
              Descripción
              <textarea
                value={pollDescription}
                onChange={(e) => setPollDescription(e.target.value)}
                placeholder="Describe el objetivo de la encuesta"
                required
              />
            </label>

            <div className="field-row modal-actions-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={pollActive}
                  onChange={(e) => setPollActive(e.target.checked)}
                />
                Encuesta activa
              </label>
              <div className="button-row">
                <button type="submit">
                  {editingSurvey ? "Actualizar" : "Crear"}
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={closeModal}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const deleteSurvey = async (id: number) => {
    setError(null);
    try {
      const response = await fetch(`/api/surveys/${id}`, { method: "DELETE" });
      if (!response.ok) {
        setError("No se pudo eliminar la encuesta");
        return;
      }

      if (surveys.length === 1 && adminPage > 1) {
        setAdminPage(adminPage - 1);
      } else {
        fetchAdminSurveys(adminPage);
      }
    } catch {
      setError("No se pudo eliminar la encuesta");
    }
  };

  const submitResponse = async (survey: Survey) => {
    if (!user) {
      setError("Debes iniciar sesión para responder la encuesta");
      return;
    }

    setError(null);
    const answerPayload = survey.type === "yesno" ? voteValue : voteValue;

    try {
      const response = await fetch(`/api/surveys/${survey.id}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: user.username,
          answers: JSON.stringify({ answer: answerPayload }),
        }),
      });

      if (!response.ok) {
        setError("No se pudo enviar tu respuesta");
        return;
      }

      setSubmittedPollId(survey.id);
      setActivePollId(null);
      setVoteValue(survey.type === "yesno" ? "yes" : "3");
      setPollAnswers((prev) => {
        const next = { ...prev, [survey.id]: answerPayload };
        if (user) {
          localStorage.setItem(
            `pollAnswers-${user.username}`,
            JSON.stringify(next),
          );
        }
        return next;
      });
    } catch {
      setError("No se pudo enviar tu respuesta");
    }
  };

  const loadProfileForm = () => {
    if (!user) return;
    setProfileName(user.name);
    setProfileUsername(user.username);
    setProfileEmail(user.email);
    setProfileAvatarUrl(resolveAvatarUrl(user.avatarUrl));
  };

  useEffect(() => {
    if (route === "/profile") {
      loadProfileForm();
    }
  }, [route, user]);

  const updateProfile = async () => {
    if (!user || !token) return;
    try {
      const avatarUrl = normalizeAvatarForApi(profileAvatarUrl);
      const payload: any = {
        name: profileName,
        username: profileUsername,
        email: profileEmail,
      };

      if (avatarUrl) {
        payload.avatarUrl = avatarUrl;
      }

      const res = await fetch(`/api/auth/profile/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        setError("No se pudo actualizar el perfil");
        return;
      }

      const updated = await res.json();
      setUser(updated);
      localStorage.setItem("user", JSON.stringify(updated));
      setError(null);
      setSuccessMessage("Perfil actualizado correctamente.");
      navigate("/");
    } catch {
      setError("No se pudo actualizar el perfil");
    }
  };

  const openPasswordModal = () => {
    setPasswordError(null);
    setPasswordSuccess(null);
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowPasswordModal(true);
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordError(null);
    setPasswordSuccess(null);
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const changePassword = async () => {
    if (!user || !token) return;
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!oldPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setPasswordError("Por favor completa todos los campos.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("La nueva contraseña y la confirmación no coinciden.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    try {
      const res = await fetch(`/api/auth/profile/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ oldPassword, password: newPassword }),
      });

      if (!res.ok) {
        const data = await res.json();
        setPasswordError(data.error || "No se pudo actualizar la contraseña.");
        return;
      }

      setPasswordSuccess("Contraseña actualizada correctamente.");
      setPasswordError(null);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      window.setTimeout(() => {
        closePasswordModal();
      }, 1600);
    } catch {
      setPasswordError("No se pudo actualizar la contraseña.");
    }
  };

  if (route === "/login") {
    return (
      <div className="container">
        <h1>Encuestas de sostenibilidad</h1>
        <section className="box login-box">
          <h2>Iniciar sesión</h2>
          <div className="input-group">
            <label className="input-with-icon">
              <input
                placeholder="Usuario"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
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
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPasswordField((visible) => !visible)}
                aria-label={
                  showPasswordField
                    ? "Ocultar contraseña"
                    : "Mostrar contraseña"
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
          <button onClick={login}>Entrar</button>
          {successMessage && (
            <p className={`success-message${successVisible ? " visible" : ""}`}>
              {successMessage}
            </p>
          )}
          {error && <p className="error">{error}</p>}
          <p>
            No tienes cuenta?{" "}
            <button
              type="button"
              className="link-button"
              onClick={() => navigate("/register")}
            >
              Regístrate
            </button>
          </p>
        </section>
      </div>
    );
  }

  if (route === "/register") {
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
              onChange={(e) => setRegisterName(e.target.value)}
            />
          </label>
          <label>
            Nombre de usuario
            <input
              placeholder="Nombre de usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </label>
          <label>
            Correo
            <input
              placeholder="Correo"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            Contraseña
            <input
              placeholder="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button onClick={register}>Registrarse</button>
          <button
            type="button"
            className="secondary"
            onClick={() => navigate("/login")}
          >
            Volver al login
          </button>
          {error && <p className="error">{error}</p>}
        </section>
      </div>
    );
  }

  const renderProfileSection = () => (
    <section className="box profile-box">
      <h2>Mi perfil</h2>
      <div className="profile-avatar-row">
        <div className="profile-avatar-preview">
          <img
            src={profileAvatarUrl || "/default-avatar.svg"}
            alt="Avatar preview"
          />
        </div>
        <div className="profile-avatar-controls">
          <label className="small">Subir imagen</label>
          <input type="file" accept="image/*" onChange={handleAvatarFile} />
          <p className="muted">
            O pega una URL en el campo Avatar URL más abajo.
          </p>
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
        <button onClick={updateProfile}>Guardar cambios</button>
        <button type="button" className="secondary" onClick={openPasswordModal}>
          Cambiar contraseña
        </button>
        <button className="secondary" onClick={() => navigate("/")}>
          Volver
        </button>
      </div>
      {error && <p className="error">{error}</p>}
    </section>
  );

  const renderPasswordModal = () => {
    if (!showPasswordModal) return null;

    return (
      <div className="modal-overlay" onClick={closePasswordModal}>
        <div className="modal-card" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div>
              <h3>Cambiar contraseña</h3>
              <p>Ingresa tu contraseña actual y la nueva contraseña.</p>
            </div>
            <button
              type="button"
              className="modal-close"
              onClick={closePasswordModal}
            >
              ×
            </button>
          </div>

          <div className="admin-form">
            <label>
              Contraseña actual
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Contraseña actual"
              />
            </label>
            <label>
              Nueva contraseña
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nueva contraseña"
              />
            </label>
            <label>
              Confirmar nueva contraseña
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la nueva contraseña"
              />
            </label>
            {passwordSuccess && (
              <p className="modal-success">{passwordSuccess}</p>
            )}
            {passwordError && <p className="error">{passwordError}</p>}
            <div className="button-row">
              <button type="button" onClick={changePassword}>
                Guardar contraseña
              </button>
              <button
                type="button"
                className="secondary"
                onClick={closePasswordModal}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAdminPanel = () => (
    <section className="box admin-box">
      <div className="admin-header">
        <div>
          <h2>Gestión de encuestas</h2>
          <p>Crea, edita y elimina encuestas con opción de paginación.</p>
        </div>
        <div className="admin-controls">
          <button type="button" onClick={openCreateModal}>
            Nueva encuesta
          </button>
        </div>
      </div>

      <div className="filter-row">
        <input
          value={searchTerm}
          onChange={(e) => {
            const value = e.target.value;
            setSearchTerm(value);
            setAdminPage(1);
          }}
          placeholder="Buscar por título o descripción"
        />
        <select
          value={filterType}
          onChange={(e) => {
            setFilterType(e.target.value as "all" | "yesno" | "rating");
            setAdminPage(1);
          }}
        >
          <option value="all">Todos los tipos</option>
          <option value="yesno">Sí / No</option>
          <option value="rating">Valoración 1–5</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value as "all" | "active" | "inactive");
            setAdminPage(1);
          }}
        >
          <option value="all">Todos los estados</option>
          <option value="active">Activas</option>
          <option value="inactive">Inactivas</option>
        </select>
        <select
          value={sortOrder}
          onChange={(e) => {
            setSortOrder(e.target.value as "desc" | "asc");
            setAdminPage(1);
          }}
        >
          <option value="desc">Más recientes primero</option>
          <option value="asc">Más antiguas primero</option>
        </select>
      </div>

      <div className="admin-table">
        {surveys.length === 0 ? (
          <p>No hay encuestas disponibles.</p>
        ) : (
          surveys.map((survey) => (
            <article key={survey.id} className="admin-card">
              <div className="admin-card-header">
                <div className="admin-card-title">
                  <h3>{survey.title}</h3>
                  <p>{survey.description}</p>
                  <p className="poll-updated">
                    Última actualización: {formatUpdatedAt(survey.updatedAt)}
                  </p>
                </div>
                <div className="pill-group">
                  <span
                    className={`pill ${survey.active ? "active" : "inactive"}`}
                  >
                    {survey.active ? "Activa" : "Inactiva"}
                  </span>
                  <span
                    className={`pill ${survey.type === "rating" ? "rating" : "active"}`}
                  >
                    {survey.type === "rating" ? "Valoración 1–5" : "Sí / No"}
                  </span>
                </div>
              </div>
              {survey.summary && (
                <div className="admin-card-summary">
                  <div className="summary-item">
                    <span>Total de respuestas</span>
                    <strong>{survey.summary.totalResponses}</strong>
                  </div>
                  {survey.type === "yesno" ? (
                    <>
                      <div className="summary-item">
                        <span>Sí</span>
                        <strong>{survey.summary.yesCount ?? 0}</strong>
                      </div>
                      <div className="summary-item">
                        <span>No</span>
                        <strong>{survey.summary.noCount ?? 0}</strong>
                      </div>
                    </>
                  ) : (
                    <div className="summary-item">
                      <span>Promedio</span>
                      <strong>
                        {survey.summary.average?.toFixed(1) ?? "0.0"}
                      </strong>
                    </div>
                  )}
                </div>
              )}
              <div className="admin-actions">
                <button type="button" onClick={() => editSurvey(survey)}>
                  Editar
                </button>
                <button
                  type="button"
                  className="danger"
                  onClick={() => deleteSurvey(survey.id)}
                >
                  Eliminar
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      <div className="pagination">
        <button
          type="button"
          disabled={adminPage <= 1}
          onClick={() => setAdminPage(adminPage - 1)}
        >
          Anterior
        </button>
        <span>
          Página {adminPage} de {totalPages}
        </span>
        <button
          type="button"
          disabled={adminPage >= totalPages}
          onClick={() => setAdminPage(adminPage + 1)}
        >
          Siguiente
        </button>
      </div>
      {renderModal()}
    </section>
  );

  const renderMainSection = () => {
    if (route === "/profile") {
      return renderProfileSection();
    }

    if (user?.role === "admin") {
      return renderAdminPanel();
    }

    return (
      <section className="box">
        <div className="filter-row user-filter-row">
          <div className="filter-group">
            <label>
              Mostrar:
              <select
                value={answerFilter}
                onChange={(e) => {
                  setAnswerFilter(
                    e.target.value as "all" | "answered" | "unanswered",
                  );
                  setUserPage(1);
                }}
              >
                <option value="all">Todas las encuestas</option>
                <option value="answered">Respondidas</option>
                <option value="unanswered">Sin responder</option>
              </select>
            </label>
          </div>
          <div className="filter-group filter-summary-group">
            <span className="nav-badge">
              {filteredSurveys.length} encuestas
            </span>
            {answerFilter !== "all" && (
              <button
                type="button"
                className="reset-filter-button"
                onClick={() => {
                  setAnswerFilter("all");
                  setUserPage(1);
                }}
              >
                Ver todas
              </button>
            )}
          </div>
        </div>
        {filteredSurveys.length === 0 ? (
          <p>No hay encuestas disponibles.</p>
        ) : (
          pagedSurveys.map((survey) => {
            const previousAnswer = pollAnswers[survey.id];
            const hasAnswered = Boolean(previousAnswer);

            return (
              <article key={survey.id} className="survey-card">
                <div className="survey-card-header">
                  <div>
                    <h2>{survey.title}</h2>
                    <p>{survey.description}</p>
                  </div>
                  <div className="survey-card-meta">
                    <span
                      className={`pill ${survey.active ? "active" : "inactive"}`}
                    >
                      {survey.active ? "Activa" : "Inactiva"}
                    </span>
                    <span className="poll-updated">
                      {formatUpdatedAt(survey.updatedAt)}
                    </span>
                  </div>
                </div>
                {hasAnswered && activePollId !== survey.id && (
                  <div className="survey-card-answer">
                    <span className="pill answered">Respondida</span>
                    <p className="previous-answer">
                      Tu respuesta: {previousAnswer}
                    </p>
                  </div>
                )}
                <div className="poll-actions">
                  {activePollId === survey.id ? (
                    <div className="poll-form">
                      {survey.type === "yesno" ? (
                        <div className="radio-group">
                          <label>
                            <input
                              type="radio"
                              name={`poll-${survey.id}`}
                              value="yes"
                              checked={voteValue === "yes"}
                              onChange={() => setVoteValue("yes")}
                            />
                            Sí
                          </label>
                          <label>
                            <input
                              type="radio"
                              name={`poll-${survey.id}`}
                              value="no"
                              checked={voteValue === "no"}
                              onChange={() => setVoteValue("no")}
                            />
                            No
                          </label>
                        </div>
                      ) : (
                        <label>
                          Califica de 1 a 5
                          <select
                            value={voteValue}
                            onChange={(e) => setVoteValue(e.target.value)}
                          >
                            {[1, 2, 3, 4, 5].map((value) => (
                              <option key={value} value={String(value)}>
                                {value}
                              </option>
                            ))}
                          </select>
                        </label>
                      )}
                      <div className="button-row">
                        <button
                          type="button"
                          onClick={() => submitResponse(survey)}
                        >
                          Enviar voto
                        </button>
                        <button
                          type="button"
                          className="secondary"
                          onClick={() => setActivePollId(null)}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setActivePollId(survey.id);
                        setVoteValue(
                          survey.type === "yesno"
                            ? previousAnswer || "yes"
                            : previousAnswer || "3",
                        );
                      }}
                    >
                      {hasAnswered ? "Volver a votar" : "Responder"}
                    </button>
                  )}
                </div>
              </article>
            );
          })
        )}
        {filteredSurveys.length > 0 && (
          <div className="pagination">
            <button
              type="button"
              disabled={userPage <= 1}
              onClick={() => setUserPage(userPage - 1)}
            >
              Anterior
            </button>
            <span>
              Página {safeUserPage} de {userTotalPages}
            </span>
            <button
              type="button"
              disabled={userPage >= userTotalPages}
              onClick={() => setUserPage(userPage + 1)}
            >
              Siguiente
            </button>
          </div>
        )}
      </section>
    );
  };

  const closeToast = () => {
    setSuccessMessage(null);
    setSuccessVisible(false);
  };

  const renderToast = () => {
    if (!successMessage) return null;

    return (
      <div className="toast-container">
        <div className={`toast-message${successVisible ? " visible" : ""}`}>
          <p onClick={closeToast}>{successMessage}</p>
          <button type="button" className="toast-close" onClick={closeToast}>
            ×
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="app-shell">
      {renderToast()}
      <button
        type="button"
        className="mobile-menu-button"
        onClick={() => setSidebarOpen((open) => !open)}
        aria-expanded={sidebarOpen}
      >
        ☰
      </button>
      <aside className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="brand">
          <div>
            <h2>Panel de encuestas</h2>
            <p>Accede rápido a tu perfil y administra tu campus.</p>
          </div>
        </div>
        {user?.role !== "admin" && (
          <>
            <div className="activity-badge">
              {answeredPolls} encuestas respondidas
            </div>
            <div className="activity-badge secondary">
              {unansweredPolls} encuestas sin responder
            </div>
          </>
        )}
        <nav className="nav-bar">
          <button
            type="button"
            className={route === "/" ? "active" : ""}
            onClick={() => navigate("/")}
          >
            Home
          </button>
          <button
            type="button"
            className={route === "/profile" ? "active" : ""}
            onClick={() => navigate("/profile")}
          >
            Perfil
          </button>
        </nav>
        {user?.role === "admin" && <span className="nav-badge">ADMIN</span>}
        <div className="sidebar-user-panel">
          <div className="avatar">
            {(() => {
              return (
                <img
                  src={resolveAvatarUrl(user?.avatarUrl)}
                  alt={`${displayName} avatar`}
                />
              );
            })()}
          </div>
          <div className="user-info">
            <div className="user-name">{displayName}</div>
            <div className="user-role">{user?.role}</div>
          </div>
        </div>
        <button className="logout-button sidebar-logout" onClick={logout}>
          Cerrar sesión
        </button>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <div>
            <h1>{pageTitle}</h1>
            <p>{pageSubtitle}</p>
          </div>
        </header>
        {renderMainSection()}
        {renderPasswordModal()}
      </main>
    </div>
  );
}

export default App;
