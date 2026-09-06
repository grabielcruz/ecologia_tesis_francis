export interface RouteFlags {
  isGreenSpacesRoute: boolean;
  isProjectsRoute: boolean;
  isReportsRoute: boolean;
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
                  ? "Detalle de tipo de arbol"
                  : route.startsWith("/trees/")
                    ? "Detalle de arbol"
                    : route === "/proposals"
                      ? "Propuestas"
                      : route === "/projects"
                        ? "Proyectos"
                        : route === "/reports"
                          ? "Reportes de areas verdes"
                          : route === "/tree-types"
                            ? "Tipos de arboles"
                            : route === "/trees" || route.startsWith("/trees?")
                              ? "Arboles"
                              : route === "/admin-users"
                                ? "Usuarios"
                                : route.startsWith("/green-spaces/")
                                  ? "Detalle de area verde"
                                  : route === "/green-spaces"
                                    ? "Areas verdes del campus"
                                    : "Principal";

  const pageSubtitle =
    route === "/"
      ? "Resumen general de encuestas y areas verdes"
      : route === "/profile"
        ? "Actualiza tus datos personales"
        : route.includes("/projects/") && route.includes("/updates/")
          ? "Consulta y administra una actividad puntual del proyecto"
          : route.startsWith("/reports/")
            ? "Consulta la informacion completa del reporte y sus imagenes"
            : route.startsWith("/projects/")
              ? "Visualiza datos del proyecto y su historial de actividades"
              : route.startsWith("/proposals/")
                ? "Revisa votos y ejecuta acciones administrativas de la propuesta"
                : route.startsWith("/tree-types/")
                  ? "Descripcion completa, imagenes referenciales y arboles registrados por ubicacion"
                  : route.startsWith("/trees/")
                    ? "Informacion completa del arbol, tipo y ubicacion en area verde"
                    : route === "/proposals"
                      ? "Consulta, valida y vota propuestas de mejora para areas verdes"
                      : route === "/projects"
                        ? "Consulta los proyectos generados a partir de propuestas aprobadas"
                        : route === "/reports"
                          ? "Registra, actualiza y sigue reportes de quejas o sugerencias"
                          : route === "/tree-types"
                            ? "Catalogo oficial de especies y flujo de sugerencias de nuevos tipos"
                            : route === "/trees" || route.startsWith("/trees?")
                              ? "Inventario real de arboles por area verde y estado de salud"
                              : route === "/admin-users"
                                ? "Gestion integral de usuarios del sistema"
                                : route.startsWith("/green-spaces/")
                                  ? "Informacion completa, reseñas y sugerencias del espacio"
                                  : route === "/green-spaces"
                                    ? "Registro y consulta de espacios verdes universitarios"
                                    : `Bienvenido${displayName ? `, ${displayName}` : ""}`;

  return {
    pageTitle,
    pageSubtitle,
  };
}
