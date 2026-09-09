interface AppSidebarProps {
  route: string;
  isAuthenticated: boolean;
  isGreenSpacesRoute: boolean;
  isProjectsRoute: boolean;
  isReportsRoute: boolean;
  isGreenMetricsRoute: boolean;
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
  onNavigateTreeTypes: () => void;
  onNavigateTrees: () => void;
  onNavigateUsers: () => void;
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
  onNavigateTreeTypes,
  onNavigateTrees,
  onNavigateUsers,
  onLogin,
  onLogout,
}: AppSidebarProps) {
  return (
    <>
      <div className="brand">
        <div>
          <h2>Panel del campus</h2>
          <p>Accede a areas verdes y tu perfil.</p>
        </div>
      </div>
      {userRole !== "admin" && (
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
          onClick={onNavigateHome}
        >
          Principal
        </button>
        {isAuthenticated && (
          <button
            type="button"
            className={route === "/profile" ? "active" : ""}
            onClick={onNavigateProfile}
          >
            Perfil
          </button>
        )}
        <button
          type="button"
          className={isGreenSpacesRoute ? "active" : ""}
          onClick={onNavigateGreenSpaces}
        >
          Areas verdes
        </button>
        <button
          type="button"
          className={
            route === "/proposals" || route.startsWith("/proposals/")
              ? "active"
              : ""
          }
          onClick={onNavigateProposals}
        >
          Propuestas
        </button>
        <button
          type="button"
          className={isProjectsRoute ? "active" : ""}
          onClick={onNavigateProjects}
        >
          Proyectos
        </button>
        <button
          type="button"
          className={isReportsRoute ? "active" : ""}
          onClick={onNavigateReports}
        >
          Reportes
        </button>
        <button
          type="button"
          className={isGreenMetricsRoute ? "active" : ""}
          onClick={onNavigateGreenMetrics}
        >
          Metricas GreenMetric
        </button>
        <button
          type="button"
          className={isTreeTypesRoute ? "active" : ""}
          onClick={onNavigateTreeTypes}
        >
          Tipos de arboles
        </button>
        <button
          type="button"
          className={isTreesRoute ? "active" : ""}
          onClick={onNavigateTrees}
        >
          Arboles
        </button>
        {userRole === "admin" && (
          <button
            type="button"
            className={route === "/admin-users" ? "active" : ""}
            onClick={onNavigateUsers}
          >
            Usuarios
          </button>
        )}
      </nav>
      {userRole === "admin" && <span className="nav-badge">ADMIN</span>}
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
        <button className="logout-button sidebar-logout" onClick={onLogout}>
          Cerrar sesión
        </button>
      ) : (
        <button className="logout-button sidebar-logout" onClick={onLogin}>
          Iniciar sesión
        </button>
      )}
    </>
  );
}
