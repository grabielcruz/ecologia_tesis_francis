import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { TreeHealthStatus, TreeInventoryItem } from "./types";
import { TreeType } from "../treeTypes/types";

interface GreenSpaceOption {
  id: number;
  name: string;
}

interface UseTreesParams {
  token: string;
  route: string;
  userRole?: string;
  treeTypes: TreeType[];
  greenSpaces: GreenSpaceOption[];
  setError: (message: string | null) => void;
  setSuccessMessage: (message: string | null) => void;
}

export function useTrees({
  token,
  route,
  userRole,
  treeTypes,
  greenSpaces,
  setError,
  setSuccessMessage,
}: UseTreesParams) {
  const [trees, setTrees] = useState<TreeInventoryItem[]>([]);
  const [treeNameInput, setTreeNameInput] = useState("");
  const [treeHealthStatusInput, setTreeHealthStatusInput] =
    useState<TreeHealthStatus>("healthy");
  const [treeTypeIdInput, setTreeTypeIdInput] = useState(0);
  const [treeSpaceIdInput, setTreeSpaceIdInput] = useState(0);
  const [treeImagesInput, setTreeImagesInput] = useState("");
  const [editingTreeId, setEditingTreeId] = useState<number | null>(null);
  const [isSubmittingTree, setIsSubmittingTree] = useState(false);
  const [uploadingTreeImages, setUploadingTreeImages] = useState(false);
  const [treeActionLoadingId, setTreeActionLoadingId] = useState<number | null>(
    null,
  );

  const routePath = route.split("?")[0] || route;
  const routeSearch = route.includes("?") ? route.split("?")[1] || "" : "";
  const searchParams = new URLSearchParams(routeSearch);
  const selectedSpaceFilterId = Number(searchParams.get("spaceId") || 0);
  const hasSpaceFilter =
    Number.isFinite(selectedSpaceFilterId) && selectedSpaceFilterId > 0;
  const selectedSpaceFilterName = hasSpaceFilter
    ? greenSpaces.find((space) => space.id === selectedSpaceFilterId)?.name ||
      ""
    : "";

  const parseImagesInput = (value: string) =>
    value
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

  const fetchTrees = async () => {
    if (!token) return;

    try {
      const params = new URLSearchParams();
      if (hasSpaceFilter) {
        params.set("spaceId", String(selectedSpaceFilterId));
      }

      const query = params.toString();
      const response = await fetch(`/api/trees${query ? `?${query}` : ""}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        setTrees([]);
        setError("No se pudo cargar el inventario de arboles");
        return;
      }

      const data = await response.json();
      setTrees(Array.isArray(data) ? data : []);
    } catch {
      setTrees([]);
      setError("No se pudo cargar el inventario de arboles");
    }
  };

  const resetTreeForm = () => {
    setEditingTreeId(null);
    setTreeNameInput("");
    setTreeHealthStatusInput("healthy");
    setTreeTypeIdInput(treeTypes[0]?.id || 0);
    setTreeSpaceIdInput(greenSpaces[0]?.id || 0);
    setTreeImagesInput("");
  };

  const uploadTreeImages = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (!token || userRole !== "admin") {
      setError("Solo administradores pueden subir imagenes de arboles");
      return;
    }

    setUploadingTreeImages(true);
    setError(null);

    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append("images", file));

      const response = await fetch("/api/trees/images", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        setError("No se pudieron subir las imagenes");
        return;
      }

      const data = await response.json();
      const uploadedPaths = Array.isArray(data.images)
        ? data.images.map((img: string) => img.trim()).filter(Boolean)
        : [];

      setTreeImagesInput((prev) => {
        const current = parseImagesInput(prev);
        return [...new Set([...current, ...uploadedPaths])].join("\n");
      });

      event.target.value = "";
    } catch {
      setError("No se pudieron subir las imagenes");
    } finally {
      setUploadingTreeImages(false);
    }
  };

  const startEditTree = (tree: TreeInventoryItem) => {
    setEditingTreeId(tree.id);
    setTreeNameInput(tree.name);
    setTreeHealthStatusInput(tree.healthStatus);
    setTreeTypeIdInput(tree.typeId || 0);
    setTreeSpaceIdInput(tree.spaceId);
    setTreeImagesInput(tree.imageUrls.join("\n"));
  };

  const saveTree = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      setError("Debes iniciar sesion para gestionar arboles");
      return;
    }

    if (!treeNameInput.trim()) {
      setError("El nombre del arbol es obligatorio");
      return;
    }

    if (!Number.isFinite(treeSpaceIdInput) || treeSpaceIdInput <= 0) {
      setError("Selecciona un area verde valida");
      return;
    }

    setIsSubmittingTree(true);
    setError(null);
    const imageUrls = parseImagesInput(treeImagesInput);

    try {
      const isEditing = editingTreeId !== null;
      const endpoint = isEditing ? `/api/trees/${editingTreeId}` : "/api/trees";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: treeNameInput.trim(),
          healthStatus: treeHealthStatusInput,
          typeId: treeTypeIdInput > 0 ? treeTypeIdInput : null,
          spaceId: treeSpaceIdInput,
          imageUrls,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error || "No se pudo guardar el arbol");
        return;
      }

      const data = await response.json().catch(() => ({}));
      const backendMessage =
        typeof data?.message === "string" ? data.message : null;

      setSuccessMessage(
        backendMessage ||
          (isEditing
            ? "Arbol actualizado correctamente."
            : userRole === "admin"
              ? "Arbol registrado correctamente."
              : "Arbol enviado para validacion de administrador."),
      );
      resetTreeForm();
      await fetchTrees();
    } catch {
      setError("No se pudo guardar el arbol");
    } finally {
      setIsSubmittingTree(false);
    }
  };

  const deleteTree = async (treeId: number) => {
    if (!token || userRole !== "admin") {
      setError("Solo administradores pueden eliminar arboles");
      return;
    }

    try {
      const response = await fetch(`/api/trees/${treeId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error || "No se pudo eliminar el arbol");
        return;
      }

      setSuccessMessage("Arbol eliminado correctamente.");
      setError(null);
      await fetchTrees();
    } catch {
      setError("No se pudo eliminar el arbol");
    }
  };

  const approveTree = async (treeId: number) => {
    if (!token || userRole !== "admin") {
      setError("Solo administradores pueden validar arboles");
      return;
    }

    setTreeActionLoadingId(treeId);
    try {
      const response = await fetch(`/api/trees/${treeId}/approve`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error || "No se pudo aprobar el arbol");
        return;
      }

      setSuccessMessage("Arbol aprobado correctamente.");
      setError(null);
      await fetchTrees();
    } catch {
      setError("No se pudo aprobar el arbol");
    } finally {
      setTreeActionLoadingId(null);
    }
  };

  const rejectTree = async (treeId: number) => {
    if (!token || userRole !== "admin") {
      setError("Solo administradores pueden validar arboles");
      return;
    }

    setTreeActionLoadingId(treeId);
    try {
      const response = await fetch(`/api/trees/${treeId}/reject`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error || "No se pudo rechazar el arbol");
        return;
      }

      setSuccessMessage("Arbol rechazado.");
      setError(null);
      await fetchTrees();
    } catch {
      setError("No se pudo rechazar el arbol");
    } finally {
      setTreeActionLoadingId(null);
    }
  };

  useEffect(() => {
    if (!token || routePath !== "/trees") return;
    fetchTrees();
  }, [token, route, routePath, hasSpaceFilter, selectedSpaceFilterId]);

  useEffect(() => {
    if (greenSpaces.length > 0 && treeSpaceIdInput === 0) {
      setTreeSpaceIdInput(greenSpaces[0].id);
    }
  }, [greenSpaces, treeSpaceIdInput]);

  return {
    trees,
    selectedSpaceFilterId,
    selectedSpaceFilterName,
    treeNameInput,
    treeHealthStatusInput,
    treeTypeIdInput,
    treeSpaceIdInput,
    treeImagesInput,
    editingTreeId,
    isSubmittingTree,
    uploadingTreeImages,
    treeActionLoadingId,
    setTreeNameInput,
    setTreeHealthStatusInput,
    setTreeTypeIdInput,
    setTreeSpaceIdInput,
    setTreeImagesInput,
    resetTreeForm,
    uploadTreeImages,
    startEditTree,
    saveTree,
    deleteTree,
    approveTree,
    rejectTree,
  };
}
