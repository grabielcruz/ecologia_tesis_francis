interface AppSidebarProps {
  route: string;
  isAuthenticated: boolean;
  isGreenSpacesRoute: boolean;
  isProjectsRoute: boolean;
  isReportsRoute: boolean;
  isGreenMetricsRoute: boolean;
  isFindFlowerRoute: boolean;
  isTreeTypesRoute: boolean;
  isTreesRoute: boolean;
  answeredPolls: number;
  unansweredPolls: number;
  displayName: string;
  userRole?: string;
  avatarUrl: string;
  onNavigateHome: () => void;
  onNavigateProfile: () => void;
  onNavigateGreenSpaces: () => void;
  onNavigateProposals: () => void;
  onNavigateProjects: () => void;
  onNavigateReports: () => void;
  onNavigateGreenMetrics: () => void;
  onNavigateFindFlower: () => void;
  onNavigateTreeTypes: () => void;
  onNavigateTrees: () => void;
  onNavigateUsers: () => void;
  themeMode: "light" | "dark";
  onToggleTheme: () => void;
  onLogin: () => void;
  onLogout: () => void;
}

export function AppSidebar({
  route,
  isAuthenticated,
  isGreenSpacesRoute,
  isProjectsRoute,
  isReportsRoute,
  isGreenMetricsRoute,
  isFindFlowerRoute,
  isTreeTypesRoute,
  isTreesRoute,
  answeredPolls,
  unansweredPolls,
  displayName,
  userRole,
  avatarUrl,
  onNavigateHome,
  onNavigateProfile,
  onNavigateGreenSpaces,
  onNavigateProposals,
  onNavigateProjects,
  onNavigateReports,
  onNavigateGreenMetrics,
  onNavigateFindFlower,
  onNavigateTreeTypes,
  onNavigateTrees,
  onNavigateUsers,
  themeMode,
  onToggleTheme,
  onLogin,
  onLogout,
}: AppSidebarProps) {
  return (
    <>
      <div className="brand">
        <div className="brand-title-row">
          <h2>Panel del campus</h2>
          <button
            type="button"
            className={`nav-theme-toggle ${
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
        <div>
          <p>Accede a áreas verdes y tu perfil.</p>
        </div>
      </div>
      <nav className="nav-bar" aria-label="Navegacion principal">
        <div className="nav-group">
          <p className="nav-section-title">General</p>
          <button
            type="button"
            className={`nav-item ${route === "/" ? "active" : ""}`}
            onClick={onNavigateHome}
          >
            <span className="nav-icon" aria-hidden="true">
              HM
            </span>
            <span>Principal</span>
          </button>
          {isAuthenticated && (
            <button
              type="button"
              className={`nav-item ${route === "/profile" ? "active" : ""}`}
              onClick={onNavigateProfile}
            >
              <span className="nav-icon" aria-hidden="true">
                PF
              </span>
              <span>Perfil</span>
            </button>
          )}
        </div>

        <div className="nav-group">
          <p className="nav-section-title">Gestion Verde</p>
          <button
            type="button"
            className={`nav-item ${isGreenSpacesRoute ? "active" : ""}`}
            onClick={onNavigateGreenSpaces}
          >
            <span className="nav-icon" aria-hidden="true">
              AV
            </span>
            <span>Áreas verdes</span>
          </button>
          <button
            type="button"
            className={`nav-item ${
              route === "/proposals" || route.startsWith("/proposals/")
                ? "active"
                : ""
            }`}
            onClick={onNavigateProposals}
          >
            <span className="nav-icon" aria-hidden="true">
              PP
            </span>
            <span>Propuestas</span>
          </button>
          <button
            type="button"
            className={`nav-item ${isProjectsRoute ? "active" : ""}`}
            onClick={onNavigateProjects}
          >
            <span className="nav-icon" aria-hidden="true">
              PJ
            </span>
            <span>Proyectos</span>
          </button>
          <button
            type="button"
            className={`nav-item ${isReportsRoute ? "active" : ""}`}
            onClick={onNavigateReports}
          >
            <span className="nav-icon" aria-hidden="true">
              RP
            </span>
            <span>Reportes</span>
          </button>
          <button
            type="button"
            className={`nav-item ${isGreenMetricsRoute ? "active" : ""}`}
            onClick={onNavigateGreenMetrics}
          >
            <span className="nav-icon" aria-hidden="true">
              GM
            </span>
            <span>Métricas GreenMetric</span>
          </button>
          <button
            type="button"
            className={`nav-item ${isFindFlowerRoute ? "active" : ""}`}
            onClick={onNavigateFindFlower}
          >
            <span className="nav-icon" aria-hidden="true">
              FL
            </span>
            <span>Busca Flores</span>
          </button>
          <button
            type="button"
            className={`nav-item ${isTreeTypesRoute ? "active" : ""}`}
            onClick={onNavigateTreeTypes}
          >
            <span className="nav-icon" aria-hidden="true">
              TT
            </span>
            <span>Tipos de árboles</span>
          </button>
          <button
            type="button"
            className={`nav-item ${isTreesRoute ? "active" : ""}`}
            onClick={onNavigateTrees}
          >
            <span className="nav-icon" aria-hidden="true">
              AR
            </span>
            <span>Árboles</span>
          </button>
        </div>

        {userRole === "admin" && (
          <div className="nav-group">
            <p className="nav-section-title">Administracion</p>
            <button
              type="button"
              className={`nav-item ${route === "/admin-users" ? "active" : ""}`}
              onClick={onNavigateUsers}
            >
              <span className="nav-icon" aria-hidden="true">
                US
              </span>
              <span>Usuarios</span>
            </button>
          </div>
        )}
      </nav>
      {userRole === "admin" && <span className="nav-badge">ADMIN</span>}
      <div className="sidebar-bottom-auth">
        <div className="sidebar-user-panel">
          <div className="avatar">
            <img src={avatarUrl} alt={`${displayName || "Invitado"} avatar`} />
          </div>
          <div className="user-info">
            <div className="user-name">{displayName || "Invitado"}</div>
            <div className="user-role">{userRole || "guest"}</div>
          </div>
        </div>
        {isAuthenticated ? (
          <button
            className="logout-button sidebar-auth-button"
            onClick={onLogout}
          >
            Cerrar sesión
          </button>
        ) : (
          <button
            className="logout-button sidebar-auth-button"
            onClick={onLogin}
          >
            Iniciar sesión
          </button>
        )}
      </div>
    </>
  );
}
