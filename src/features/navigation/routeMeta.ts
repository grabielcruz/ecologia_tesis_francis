export interface RouteFlags {
  isGreenSpacesRoute: boolean;
  isProjectsRoute: boolean;
  isReportsRoute: boolean;
  isGreenMetricsRoute: boolean;
  isTreeTypesRoute: boolean;
  isTreesRoute: boolean;
}

export interface SelectedRouteIds {
  selectedGreenSpaceId: number | null;
  selectedTreeTypeId: number | null;
  selectedTreeId: number | null;
}

export interface PageHeaderMeta {
  pageTitle: string;
  pageSubtitle: string;
}

export function getRouteFlags(route: string): RouteFlags {
  return {
    isGreenSpacesRoute:
      route === "/green-spaces" || route.startsWith("/green-spaces/"),
    isProjectsRoute: route === "/projects" || route.startsWith("/projects/"),
    isReportsRoute: route === "/reports" || route.startsWith("/reports/"),
    isGreenMetricsRoute:
      route === "/green-metrics" || route.startsWith("/green-metrics/"),
    isTreeTypesRoute:
      route === "/tree-types" || route.startsWith("/tree-types/"),
    isTreesRoute:
      route === "/trees" ||
      route.startsWith("/trees?") ||
      route.startsWith("/trees/"),
  };
}

export function getSelectedRouteIds(route: string): SelectedRouteIds {
  const selectedGreenSpaceId = (() => {
    if (!route.startsWith("/green-spaces/")) return null;
    const id = Number(route.split("/")[2]);
    return Number.isFinite(id) ? id : null;
  })();

  const selectedTreeTypeId = (() => {
    if (!route.startsWith("/tree-types/")) return null;
    const pathOnly = route.split("?")[0] || route;
    const id = Number(pathOnly.split("/")[2]);
    return Number.isFinite(id) ? id : null;
  })();

  const selectedTreeId = (() => {
    if (!route.startsWith("/trees/")) return null;
    const pathOnly = route.split("?")[0] || route;
    const id = Number(pathOnly.split("/")[2]);
    return Number.isFinite(id) ? id : null;
  })();

  return {
    selectedGreenSpaceId,
    selectedTreeTypeId,
    selectedTreeId,
  };
}

export function getPageHeaderMeta(
  route: string,
  displayName: string,
): PageHeaderMeta {
  const pageTitle =
    route === "/"
      ? "Principal"
      : route === "/profile"
        ? "Mi perfil"
        : route.includes("/projects/") && route.includes("/updates/")
          ? "Detalle de actividad"
          : route.startsWith("/reports/")
            ? "Detalle de reporte"
            : route.startsWith("/projects/")
              ? "Detalle de proyecto"
              : route.startsWith("/proposals/")
                ? "Detalle de propuesta"
                : route.startsWith("/tree-types/")
                  ? "Detalle de tipo de árbol"
                  : route.startsWith("/trees/")
                    ? "Detalle de árbol"
                    : route === "/proposals"
                      ? "Propuestas"
                      : route === "/projects"
                        ? "Proyectos"
                        : route === "/reports"
                          ? "Reportes de áreas verdes"
                          : route === "/green-metrics"
                            ? "Métricas GreenMetric"
                            : route === "/tree-types"
                              ? "Tipos de árboles"
                              : route === "/trees" ||
                                  route.startsWith("/trees?")
                                ? "Árboles"
                                : route === "/admin-users"
                                  ? "Usuarios"
                                  : route.startsWith("/green-spaces/")
                                    ? "Detalle de área verde"
                                    : route === "/green-spaces"
                                      ? "Áreas verdes del campus"
                                      : "Principal";

  const pageSubtitle =
    route === "/"
      ? "Resumen general de encuestas y áreas verdes"
      : route === "/profile"
        ? "Actualiza tus datos personales"
        : route.includes("/projects/") && route.includes("/updates/")
          ? "Consulta y administra una actividad puntual del proyecto"
          : route.startsWith("/reports/")
            ? "Consulta la información completa del reporte y sus imágenes"
            : route.startsWith("/projects/")
              ? "Visualiza datos del proyecto y su historial de actividades"
              : route.startsWith("/proposals/")
                ? "Revisa votos y ejecuta acciones administrativas de la propuesta"
                : route.startsWith("/tree-types/")
                  ? "Descripción completa, imágenes referenciales y árboles registrados por ubicación"
                  : route.startsWith("/trees/")
                    ? "Información completa del árbol, tipo y ubicación en área verde"
                    : route === "/proposals"
                      ? "Consulta, valida y vota propuestas de mejora para áreas verdes"
                      : route === "/projects"
                        ? "Consulta los proyectos generados a partir de propuestas aprobadas"
                        : route === "/reports"
                          ? "Registra, actualiza y sigue reportes de quejas o sugerencias"
                          : route === "/green-metrics"
                            ? "Carga datos por fecha de cálculo y revisa el histórico de indicadores de sostenibilidad"
                            : route === "/tree-types"
                              ? "Catálogo oficial de especies y flujo de sugerencias de nuevos tipos"
                              : route === "/trees" ||
                                  route.startsWith("/trees?")
                                ? "Inventario real de árboles por área verde y estado de salud"
                                : route === "/admin-users"
                                  ? "Gestión integral de usuarios del sistema"
                                  : route.startsWith("/green-spaces/")
                                    ? "Información completa, reseñas y sugerencias del espacio"
                                    : route === "/green-spaces"
                                      ? "Registro y consulta de espacios verdes universitarios"
                                      : `Bienvenido${displayName ? `, ${displayName}` : ""}`;

  return {
    pageTitle,
    pageSubtitle,
  };
}
