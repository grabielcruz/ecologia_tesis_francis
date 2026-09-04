import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { TreeType } from "./types";

interface UseTreeTypesParams {
  token: string;
  route: string;
  userRole?: string;
  setError: (message: string | null) => void;
  setSuccessMessage: (message: string | null) => void;
}

export function useTreeTypes({
  token,
  route,
  userRole,
  setError,
  setSuccessMessage,
}: UseTreeTypesParams) {
  const routePath = route.split("?")[0] || route;
  const [treeTypes, setTreeTypes] = useState<TreeType[]>([]);
  const [treeTypeNameInput, setTreeTypeNameInput] = useState("");
  const [treeTypeDescriptionInput, setTreeTypeDescriptionInput] = useState("");
  const [treeTypeImagesInput, setTreeTypeImagesInput] = useState("");
  const [editingTreeTypeId, setEditingTreeTypeId] = useState<number | null>(
    null,
  );
  const [isSubmittingTreeType, setIsSubmittingTreeType] = useState(false);
  const [uploadingTreeTypeImages, setUploadingTreeTypeImages] = useState(false);

  const parseImagesInput = (value: string) =>
    value
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

  const resetTreeTypeForm = () => {
    setEditingTreeTypeId(null);
    setTreeTypeNameInput("");
    setTreeTypeDescriptionInput("");
    setTreeTypeImagesInput("");
  };

  const fetchTreeTypes = async () => {
    if (!token) return;

    try {
      const response = await fetch("/api/tree-types", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        setTreeTypes([]);
        setError("No se pudieron cargar los tipos de arboles");
        return;
      }

      const data = await response.json();
      setTreeTypes(Array.isArray(data) ? data : []);
    } catch {
      setTreeTypes([]);
      setError("No se pudieron cargar los tipos de arboles");
    }
  };

  const uploadTreeTypeImages = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (!token) {
      setError("Debes iniciar sesion para subir imagenes");
      return;
    }

    setUploadingTreeTypeImages(true);
    setError(null);

    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append("images", file));

      const response = await fetch("/api/tree-types/images", {
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

      setTreeTypeImagesInput((prev) => {
        const current = parseImagesInput(prev);
        return [...new Set([...current, ...uploadedPaths])].join("\n");
      });

      event.target.value = "";
    } catch {
      setError("No se pudieron subir las imagenes");
    } finally {
      setUploadingTreeTypeImages(false);
    }
  };

  const saveTreeType = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || userRole !== "admin") {
      setError("Solo administradores pueden gestionar tipos de arboles");
      return;
    }

    const name = treeTypeNameInput.trim();
    const description = treeTypeDescriptionInput.trim();
    const referenceImages = parseImagesInput(treeTypeImagesInput);

    if (!name || !description || referenceImages.length === 0) {
      setError("Completa nombre, descripcion e imagenes referenciales");
      return;
    }

    setIsSubmittingTreeType(true);
    setError(null);

    try {
      const isEditing = editingTreeTypeId !== null;
      const endpoint = isEditing
        ? `/api/tree-types/${editingTreeTypeId}`
        : "/api/tree-types";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          description,
          referenceImages,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error || "No se pudo guardar el tipo de arbol");
        return;
      }

      setSuccessMessage(
        isEditing
          ? "Tipo de arbol actualizado correctamente."
          : "Tipo de arbol creado correctamente.",
      );
      resetTreeTypeForm();
      await fetchTreeTypes();
    } catch {
      setError("No se pudo guardar el tipo de arbol");
    } finally {
      setIsSubmittingTreeType(false);
    }
  };

  const deleteTreeType = async (treeTypeId: number) => {
    if (!token || userRole !== "admin") {
      setError("Solo administradores pueden eliminar tipos de arboles");
      return;
    }

    try {
      const response = await fetch(`/api/tree-types/${treeTypeId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error || "No se pudo eliminar el tipo de arbol");
        return;
      }

      setSuccessMessage("Tipo de arbol eliminado correctamente.");
      setError(null);
      await fetchTreeTypes();
    } catch {
      setError("No se pudo eliminar el tipo de arbol");
    }
  };

  const startEditTreeType = (treeType: TreeType) => {
    setEditingTreeTypeId(treeType.id);
    setTreeTypeNameInput(treeType.name);
    setTreeTypeDescriptionInput(treeType.description);
    setTreeTypeImagesInput((treeType.referenceImages || []).join("\n"));
  };

  useEffect(() => {
    if (!token || !routePath.startsWith("/tree-types")) return;
    fetchTreeTypes();
  }, [token, routePath]);

  return {
    treeTypes,
    treeTypeNameInput,
    treeTypeDescriptionInput,
    treeTypeImagesInput,
    editingTreeTypeId,
    isSubmittingTreeType,
    uploadingTreeTypeImages,
    setTreeTypeNameInput,
    setTreeTypeDescriptionInput,
    setTreeTypeImagesInput,
    resetTreeTypeForm,
    startEditTreeType,
    saveTreeType,
    deleteTreeType,
    uploadTreeTypeImages,
  };
}
