import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { CampusEvent, CampusEventDetail } from "./types";

interface UseEventsParams {
  token: string | null;
  route: string;
  userRole?: string;
  setError: (message: string | null) => void;
  setSuccessMessage: (message: string | null) => void;
}

export function useEvents({
  token,
  route,
  userRole,
  setError,
  setSuccessMessage,
}: UseEventsParams) {
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [selectedEventDetail, setSelectedEventDetail] =
    useState<CampusEventDetail | null>(null);
  const [eventTitleInput, setEventTitleInput] = useState("");
  const [eventDescriptionInput, setEventDescriptionInput] = useState("");
  const [eventDateInput, setEventDateInput] = useState("");
  const [closureDescriptionInput, setClosureDescriptionInput] = useState("");
  const [closureImagesInput, setClosureImagesInput] = useState("");
  const [closureFormMode, setClosureFormMode] = useState<"close" | "edit">(
    "close",
  );
  const [selectedEventForClosure, setSelectedEventForClosure] =
    useState<CampusEvent | null>(null);
  const [selectedEventForEdit, setSelectedEventForEdit] =
    useState<CampusEvent | null>(null);
  const [editEventTitleInput, setEditEventTitleInput] = useState("");
  const [editEventDescriptionInput, setEditEventDescriptionInput] =
    useState("");
  const [editEventDateInput, setEditEventDateInput] = useState("");
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);
  const [isSubmittingClosure, setIsSubmittingClosure] = useState(false);
  const [isSubmittingEventEdit, setIsSubmittingEventEdit] = useState(false);
  const [isUploadingEventImages, setIsUploadingEventImages] = useState(false);
  const [isDeletingEvent, setIsDeletingEvent] = useState(false);

  const parseImagesInput = (value: string) =>
    value
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

  const getAuthHeaders = () =>
    token ? { Authorization: `Bearer ${token}` } : undefined;

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/events", {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        setEvents([]);
        setError("No se pudieron cargar los eventos");
        return;
      }

      const data = await response.json();
      setEvents(Array.isArray(data) ? (data as CampusEvent[]) : []);
    } catch {
      setEvents([]);
      setError("No se pudieron cargar los eventos");
    }
  };

  const fetchEventById = async (eventId: number) => {
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404) {
          setSelectedEventDetail(null);
          return;
        }
        setError("No se pudo cargar el detalle del evento");
        return;
      }

      const data = await response.json();
      setSelectedEventDetail(data as CampusEventDetail);
    } catch {
      setError("No se pudo cargar el detalle del evento");
    }
  };

  const resetEventForm = () => {
    setEventTitleInput("");
    setEventDescriptionInput("");
    setEventDateInput("");
  };

  const openClosureForm = (event: CampusEvent) => {
    setClosureFormMode(event.status === "closed" ? "edit" : "close");
    setSelectedEventForClosure(event);
    setClosureDescriptionInput(event.closureDescription || "");
    setClosureImagesInput((event.closureImages || []).join("\n"));
  };

  const closeClosureForm = () => {
    setClosureFormMode("close");
    setSelectedEventForClosure(null);
    setClosureDescriptionInput("");
    setClosureImagesInput("");
  };

  const formatDateTimeLocalValue = (value?: string | null) => {
    if (!value) return "";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "";
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const day = String(parsed.getDate()).padStart(2, "0");
    const hours = String(parsed.getHours()).padStart(2, "0");
    const minutes = String(parsed.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const openEditEventForm = (event: CampusEvent) => {
    setSelectedEventForEdit(event);
    setEditEventTitleInput(event.title);
    setEditEventDescriptionInput(event.description);
    setEditEventDateInput(formatDateTimeLocalValue(event.eventDate));
  };

  const closeEditEventForm = () => {
    setSelectedEventForEdit(null);
    setEditEventTitleInput("");
    setEditEventDescriptionInput("");
    setEditEventDateInput("");
  };

  const uploadEventImages = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (!token || userRole !== "admin") {
      setError("Solo administradores pueden subir imágenes");
      return;
    }

    setIsUploadingEventImages(true);
    setError(null);

    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append("images", file));

      const response = await fetch("/api/events/images", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        setError("No se pudieron subir las imágenes del evento");
        return;
      }

      const data = await response.json();
      const uploadedPaths = Array.isArray(data.images)
        ? data.images.map((img: string) => img.trim()).filter(Boolean)
        : [];

      setClosureImagesInput((prev) => {
        const current = parseImagesInput(prev);
        return [...new Set([...current, ...uploadedPaths])].join("\n");
      });

      event.target.value = "";
    } catch {
      setError("No se pudieron subir las imágenes del evento");
    } finally {
      setIsUploadingEventImages(false);
    }
  };

  const createEvent = async (formEvent: FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();

    if (!token || userRole !== "admin") {
      setError("Solo administradores pueden crear eventos");
      return false;
    }

    const title = eventTitleInput.trim();
    const description = eventDescriptionInput.trim();
    const eventDate = eventDateInput.trim();
    if (!title || !description || !eventDate) {
      setError("Debes completar título, descripción y fecha del evento");
      return false;
    }

    setIsSubmittingEvent(true);
    setError(null);

    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          eventDate,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error || "No se pudo crear el evento");
        return false;
      }

      setSuccessMessage("Evento creado correctamente.");
      resetEventForm();
      await fetchEvents();
      return true;
    } catch {
      setError("No se pudo crear el evento");
      return false;
    } finally {
      setIsSubmittingEvent(false);
    }
  };

  const enrollEvent = async (eventId: number) => {
    if (!token || userRole !== "regular") {
      setError("Solo usuarios regulares pueden inscribirse");
      return;
    }

    setError(null);
    try {
      const response = await fetch(`/api/events/${eventId}/enroll`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error || "No se pudo completar la inscripción");
        return;
      }

      setSuccessMessage("Inscripción completada.");
      await fetchEvents();
    } catch {
      setError("No se pudo completar la inscripción");
    }
  };

  const withdrawEnrollment = async (eventId: number) => {
    if (!token || userRole !== "regular") {
      setError("Solo usuarios regulares pueden cancelar inscripción");
      return;
    }

    setError(null);
    try {
      const response = await fetch(`/api/events/${eventId}/enroll`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error || "No se pudo cancelar la inscripción");
        return;
      }

      setSuccessMessage("Inscripción cancelada.");
      await fetchEvents();
    } catch {
      setError("No se pudo cancelar la inscripción");
    }
  };

  const closeEvent = async (formEvent: FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();

    if (!token || userRole !== "admin" || !selectedEventForClosure) {
      setError("Solo administradores pueden cerrar eventos");
      return false;
    }

    const closureDescription = closureDescriptionInput.trim();
    if (!closureDescription) {
      setError("Debes registrar una descripción de cierre");
      return false;
    }

    setIsSubmittingClosure(true);
    setError(null);

    try {
      const response = await fetch(
        closureFormMode === "edit"
          ? `/api/events/${selectedEventForClosure.id}/closure`
          : `/api/events/${selectedEventForClosure.id}/close`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            closureDescription,
            closureImages: parseImagesInput(closureImagesInput),
          }),
        },
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(
          data.error ||
            (closureFormMode === "edit"
              ? "No se pudo actualizar el cierre del evento"
              : "No se pudo cerrar el evento"),
        );
        return false;
      }

      setSuccessMessage(
        closureFormMode === "edit"
          ? "Cierre del evento actualizado correctamente."
          : "Evento cerrado y publicado correctamente.",
      );
      closeClosureForm();
      await fetchEvents();
      if (route.startsWith("/events/")) {
        const eventId = Number((route.split("?")[0] || route).split("/")[2]);
        if (Number.isFinite(eventId)) {
          await fetchEventById(eventId);
        }
      }
      return true;
    } catch {
      setError(
        closureFormMode === "edit"
          ? "No se pudo actualizar el cierre del evento"
          : "No se pudo cerrar el evento",
      );
      return false;
    } finally {
      setIsSubmittingClosure(false);
    }
  };

  const editOpenEvent = async (formEvent: FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();

    if (!token || userRole !== "admin" || !selectedEventForEdit) {
      setError("Solo administradores pueden editar eventos abiertos");
      return false;
    }

    const title = editEventTitleInput.trim();
    const description = editEventDescriptionInput.trim();
    const eventDate = editEventDateInput.trim();

    if (!title || !description || !eventDate) {
      setError("Debes completar título, descripción y fecha del evento");
      return false;
    }

    setIsSubmittingEventEdit(true);
    setError(null);

    try {
      const authHeaders = getAuthHeaders();
      if (!authHeaders) {
        setError("No autorizado");
        return false;
      }

      const response = await fetch(`/api/events/${selectedEventForEdit.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({
          title,
          description,
          eventDate,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error || "No se pudo actualizar el evento");
        return false;
      }

      setSuccessMessage("Evento actualizado correctamente.");
      closeEditEventForm();
      await fetchEvents();
      if (route.startsWith("/events/")) {
        const eventId = Number((route.split("?")[0] || route).split("/")[2]);
        if (Number.isFinite(eventId)) {
          await fetchEventById(eventId);
        }
      }
      return true;
    } catch {
      setError("No se pudo actualizar el evento");
      return false;
    } finally {
      setIsSubmittingEventEdit(false);
    }
  };

  const deleteClosedEvent = async (eventId: number) => {
    if (!token || userRole !== "admin") {
      setError("Solo administradores pueden eliminar eventos cerrados");
      return false;
    }

    setIsDeletingEvent(true);
    setError(null);

    try {
      const authHeaders = getAuthHeaders();
      if (!authHeaders) {
        setError("No autorizado");
        return false;
      }

      const response = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
        headers: authHeaders,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error || "No se pudo eliminar el evento");
        return false;
      }

      setSuccessMessage("Evento cerrado eliminado correctamente.");
      if (
        selectedEventDetail &&
        Number(selectedEventDetail.id) === Number(eventId)
      ) {
        setSelectedEventDetail(null);
      }
      await fetchEvents();
      return true;
    } catch {
      setError("No se pudo eliminar el evento");
      return false;
    } finally {
      setIsDeletingEvent(false);
    }
  };

  useEffect(() => {
    if (!(route === "/events" || route.startsWith("/events?"))) return;
    void fetchEvents();
  }, [route, token]);

  useEffect(() => {
    if (!route.startsWith("/events/")) {
      setSelectedEventDetail(null);
      return;
    }

    const pathOnly = route.split("?")[0] || route;
    const eventId = Number(pathOnly.split("/")[2]);
    if (!Number.isFinite(eventId)) {
      setSelectedEventDetail(null);
      return;
    }

    void fetchEventById(eventId);
  }, [route, token]);

  return {
    events,
    selectedEventDetail,
    eventTitleInput,
    eventDescriptionInput,
    eventDateInput,
    closureDescriptionInput,
    closureImagesInput,
    closureFormMode,
    selectedEventForClosure,
    selectedEventForEdit,
    editEventTitleInput,
    editEventDescriptionInput,
    editEventDateInput,
    isSubmittingEvent,
    isSubmittingClosure,
    isSubmittingEventEdit,
    isUploadingEventImages,
    isDeletingEvent,
    setEventTitleInput,
    setEventDescriptionInput,
    setEventDateInput,
    setClosureDescriptionInput,
    setClosureImagesInput,
    setEditEventTitleInput,
    setEditEventDescriptionInput,
    setEditEventDateInput,
    fetchEvents,
    fetchEventById,
    resetEventForm,
    openClosureForm,
    closeClosureForm,
    openEditEventForm,
    closeEditEventForm,
    uploadEventImages,
    createEvent,
    enrollEvent,
    withdrawEnrollment,
    closeEvent,
    editOpenEvent,
    deleteClosedEvent,
  };
}
