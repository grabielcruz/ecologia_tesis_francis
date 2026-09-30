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
  const [closureDescriptionInput, setClosureDescriptionInput] = useState("");
  const [closureImagesInput, setClosureImagesInput] = useState("");
  const [selectedEventForClosure, setSelectedEventForClosure] =
    useState<CampusEvent | null>(null);
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);
  const [isSubmittingClosure, setIsSubmittingClosure] = useState(false);
  const [isUploadingEventImages, setIsUploadingEventImages] = useState(false);

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
  };

  const openClosureForm = (event: CampusEvent) => {
    setSelectedEventForClosure(event);
    setClosureDescriptionInput(event.closureDescription || "");
    setClosureImagesInput((event.closureImages || []).join("\n"));
  };

  const closeClosureForm = () => {
    setSelectedEventForClosure(null);
    setClosureDescriptionInput("");
    setClosureImagesInput("");
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
    if (!title || !description) {
      setError("Debes completar título y descripción");
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
        `/api/events/${selectedEventForClosure.id}/close`,
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
        setError(data.error || "No se pudo cerrar el evento");
        return false;
      }

      setSuccessMessage("Evento cerrado y publicado correctamente.");
      closeClosureForm();
      await fetchEvents();
      return true;
    } catch {
      setError("No se pudo cerrar el evento");
      return false;
    } finally {
      setIsSubmittingClosure(false);
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
    closureDescriptionInput,
    closureImagesInput,
    selectedEventForClosure,
    isSubmittingEvent,
    isSubmittingClosure,
    isUploadingEventImages,
    setEventTitleInput,
    setEventDescriptionInput,
    setClosureDescriptionInput,
    setClosureImagesInput,
    fetchEvents,
    fetchEventById,
    resetEventForm,
    openClosureForm,
    closeClosureForm,
    uploadEventImages,
    createEvent,
    enrollEvent,
    withdrawEnrollment,
    closeEvent,
  };
}
