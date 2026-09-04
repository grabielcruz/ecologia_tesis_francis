import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { GreenAreaReport, ReportStateFilter } from "./types";

interface GreenSpaceOption {
  id: number;
  name: string;
}

interface UseReportsParams {
  token: string;
  route: string;
  greenSpaces: GreenSpaceOption[];
  setError: (message: string | null) => void;
  setSuccessMessage: (message: string | null) => void;
}

export function useReports({
  token,
  route,
  greenSpaces,
  setError,
  setSuccessMessage,
}: UseReportsParams) {
  const [reports, setReports] = useState<GreenAreaReport[]>([]);
  const [reportStateFilter, setReportStateFilter] =
    useState<ReportStateFilter>("open");
  const [reportTitleInput, setReportTitleInput] = useState("");
  const [reportDescriptionInput, setReportDescriptionInput] = useState("");
  const [reportSpaceIdInput, setReportSpaceIdInput] = useState(0);
  const [reportImagesInput, setReportImagesInput] = useState("");
  const [uploadingReportImages, setUploadingReportImages] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [showReportCreateModal, setShowReportCreateModal] = useState(false);
  const [showReportEditModal, setShowReportEditModal] = useState(false);
  const [editingReportId, setEditingReportId] = useState<number | null>(null);
  const [editingReportStateInput, setEditingReportStateInput] = useState<
    "open" | "closed"
  >("open");
  const [reportDetail, setReportDetail] = useState<GreenAreaReport | null>(
    null,
  );

  const selectedReportId = useMemo(() => {
    if (!route.startsWith("/reports/")) return null;
    const id = Number(route.split("/")[2]);
    return Number.isFinite(id) ? id : null;
  }, [route]);

  const selectedReport = selectedReportId
    ? reports.find((entry) => entry.id === selectedReportId) || reportDetail
    : null;

  const fetchReports = async (stateFilter: ReportStateFilter = "open") => {
    if (!token) return;

    try {
      const params = new URLSearchParams();
      params.set("state", stateFilter);

      const query = params.toString();
      const response = await fetch(
        `/api/suggestions${query ? `?${query}` : ""}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) {
        setReports([]);
        setError("No se pudieron cargar los reportes");
        return;
      }

      const data = await response.json();
      setReports(Array.isArray(data) ? data : []);
    } catch {
      setReports([]);
      setError("No se pudieron cargar los reportes");
    }
  };

  const fetchReportById = async (reportId: number) => {
    if (!token) return;

    try {
      const response = await fetch(`/api/suggestions/${reportId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        setReportDetail(null);
        return;
      }

      const data = await response.json();
      setReportDetail(data as GreenAreaReport);
    } catch {
      setReportDetail(null);
    }
  };

  const resetReportForm = () => {
    setEditingReportId(null);
    setEditingReportStateInput("open");
    setReportTitleInput("");
    setReportDescriptionInput("");
    setReportImagesInput("");
    setUploadingReportImages(false);
    if (greenSpaces.length > 0) {
      setReportSpaceIdInput(greenSpaces[0].id);
    } else {
      setReportSpaceIdInput(0);
    }
  };

  const openCreateReportModal = () => {
    setShowReportEditModal(false);
    resetReportForm();
    setShowReportCreateModal(true);
  };

  const closeCreateReportModal = () => {
    setShowReportCreateModal(false);
    resetReportForm();
  };

  const startEditReport = (report: GreenAreaReport) => {
    setEditingReportId(report.id);
    setEditingReportStateInput(report.state);
    setReportTitleInput(report.title);
    setReportDescriptionInput(report.description);
    setReportSpaceIdInput(report.spaceId);
    setReportImagesInput((report.images || []).join("\n"));
  };

  const openEditReportModal = (report: GreenAreaReport) => {
    setShowReportCreateModal(false);
    startEditReport(report);
    setShowReportEditModal(true);
  };

  const closeEditReportModal = () => {
    setShowReportEditModal(false);
    resetReportForm();
  };

  const uploadReportImages = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    if (!token) {
      setError("Debes iniciar sesion para subir imagenes");
      return;
    }

    setUploadingReportImages(true);
    setError(null);
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append("images", file));

      const response = await fetch("/api/suggestions/images", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        setError("No se pudieron subir las imagenes del reporte");
        return;
      }

      const data = await response.json();
      const uploadedPaths = Array.isArray(data.images)
        ? data.images.map((img: string) => img.trim()).filter(Boolean)
        : [];

      if (uploadedPaths.length > 0) {
        setReportImagesInput((prev) => {
          const current = prev
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line.length > 0);
          const merged = [...new Set([...current, ...uploadedPaths])];
          return merged.join("\n");
        });
      }
      event.target.value = "";
    } catch {
      setError("No se pudieron subir las imagenes del reporte");
    } finally {
      setUploadingReportImages(false);
    }
  };

  const saveReport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      setError("Debes iniciar sesion para registrar un reporte");
      return;
    }

    if (!reportTitleInput.trim() || !reportDescriptionInput.trim()) {
      setError("Completa titulo y descripcion del reporte");
      return;
    }

    if (!Number.isFinite(reportSpaceIdInput) || reportSpaceIdInput <= 0) {
      setError("Selecciona un area verde valida");
      return;
    }

    const images = reportImagesInput
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    setIsSubmittingReport(true);
    setError(null);
    try {
      const isEditing = editingReportId !== null;
      const endpoint = isEditing
        ? `/api/suggestions/${editingReportId}`
        : "/api/suggestions";
      const method = isEditing ? "PUT" : "POST";

      const payload: Record<string, unknown> = {
        title: reportTitleInput.trim(),
        description: reportDescriptionInput.trim(),
        images,
      };

      if (isEditing) {
        payload.state = editingReportStateInput;
      } else {
        payload.spaceId = reportSpaceIdInput;
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error || "No se pudo guardar el reporte");
        return;
      }

      setSuccessMessage(
        isEditing
          ? "Reporte actualizado correctamente."
          : "Reporte registrado correctamente.",
      );
      setError(null);
      if (isEditing) {
        setShowReportEditModal(false);
      } else {
        setShowReportCreateModal(false);
      }
      resetReportForm();
      fetchReports(reportStateFilter);
    } catch {
      setError("No se pudo guardar el reporte");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const deleteReport = async (reportId: number) => {
    if (!token) {
      setError("Debes iniciar sesion para eliminar reportes");
      return false;
    }

    try {
      const response = await fetch(`/api/suggestions/${reportId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error || "No se pudo eliminar el reporte");
        return false;
      }

      setReports((prev) => prev.filter((entry) => entry.id !== reportId));
      setSuccessMessage("Reporte eliminado correctamente.");
      setError(null);
      fetchReports(reportStateFilter);
      return true;
    } catch {
      setError("No se pudo eliminar el reporte");
      return false;
    }
  };

  const completeReport = async (reportId: number) => {
    if (!token) {
      setError("Debes iniciar sesion para completar reportes");
      return false;
    }

    try {
      const response = await fetch(`/api/suggestions/${reportId}/complete`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error || "No se pudo completar el reporte");
        return false;
      }

      setSuccessMessage("Reporte marcado como completado.");
      setError(null);
      fetchReports(reportStateFilter);
      return true;
    } catch {
      setError("No se pudo completar el reporte");
      return false;
    }
  };

  useEffect(() => {
    if (!token || route !== "/reports") return;
    fetchReports(reportStateFilter);
  }, [token, route, reportStateFilter]);

  useEffect(() => {
    if (greenSpaces.length > 0 && reportSpaceIdInput === 0) {
      setReportSpaceIdInput(greenSpaces[0].id);
    }
  }, [greenSpaces, reportSpaceIdInput]);

  useEffect(() => {
    if (!token || !selectedReportId) {
      setReportDetail(null);
      return;
    }
    fetchReportById(selectedReportId);
  }, [token, selectedReportId]);

  return {
    reports,
    reportStateFilter,
    reportTitleInput,
    reportDescriptionInput,
    reportSpaceIdInput,
    reportImagesInput,
    uploadingReportImages,
    isSubmittingReport,
    showReportCreateModal,
    showReportEditModal,
    editingReportStateInput,
    selectedReportId,
    selectedReport,
    setReportStateFilter,
    setReportTitleInput,
    setReportDescriptionInput,
    setReportSpaceIdInput,
    setEditingReportStateInput,
    openCreateReportModal,
    closeCreateReportModal,
    openEditReportModal,
    closeEditReportModal,
    uploadReportImages,
    saveReport,
    deleteReport,
    completeReport,
  };
}
