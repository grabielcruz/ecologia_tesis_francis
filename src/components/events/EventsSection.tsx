import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import {
  DefaultTable,
  DefaultTableColumn,
  DefaultTableExportColumn,
} from "../DefaultTable";
import { AppModal } from "../AppModal";
import { ImageCarousel } from "../ImageCarousel";
import { CampusEvent } from "../../features/events/types";

interface EventsSectionProps {
  events: CampusEvent[];
  route: string;
  userRole?: string;
  isAuthenticated: boolean;
  eventTitleInput: string;
  eventDescriptionInput: string;
  closureDescriptionInput: string;
  closureImagesInput: string;
  selectedEventForClosure: CampusEvent | null;
  isSubmittingEvent: boolean;
  isSubmittingClosure: boolean;
  isUploadingEventImages: boolean;
  resolveAssetUrl: (assetPath: string) => string;
  formatUpdatedAt: (value?: string | null) => string;
  setEventTitleInput: (value: string) => void;
  setEventDescriptionInput: (value: string) => void;
  setClosureDescriptionInput: (value: string) => void;
  setClosureImagesInput: (value: string) => void;
  onOpenClosureForm: (event: CampusEvent) => void;
  onCloseClosureForm: () => void;
  onUploadEventImages: (event: ChangeEvent<HTMLInputElement>) => void;
  onCreateEvent: (event: FormEvent<HTMLFormElement>) => Promise<boolean>;
  onEnrollEvent: (eventId: number) => void;
  onWithdrawEnrollment: (eventId: number) => void;
  onCloseEvent: (event: FormEvent<HTMLFormElement>) => Promise<boolean>;
  onOpenEventDetail: (event: CampusEvent) => void;
  onNavigateEventsWithQuery: (query: string) => void;
}

export function EventsSection({
  events,
  route,
  userRole,
  isAuthenticated,
  eventTitleInput,
  eventDescriptionInput,
  closureDescriptionInput,
  closureImagesInput,
  selectedEventForClosure,
  isSubmittingEvent,
  isSubmittingClosure,
  isUploadingEventImages,
  resolveAssetUrl,
  formatUpdatedAt,
  setEventTitleInput,
  setEventDescriptionInput,
  setClosureDescriptionInput,
  setClosureImagesInput,
  onOpenClosureForm,
  onCloseClosureForm,
  onUploadEventImages,
  onCreateEvent,
  onEnrollEvent,
  onWithdrawEnrollment,
  onCloseEvent,
  onOpenEventDetail,
  onNavigateEventsWithQuery,
}: EventsSectionProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "closed">(
    "all",
  );
  const [onlyMyEnrollments, setOnlyMyEnrollments] = useState(false);

  useEffect(() => {
    const routeSearch = route.includes("?") ? route.split("?")[1] || "" : "";
    const params = new URLSearchParams(routeSearch);
    const nextStatus = params.get("status");
    const mine = params.get("mine");

    if (nextStatus === "open" || nextStatus === "closed") {
      setStatusFilter(nextStatus);
    } else {
      setStatusFilter("all");
    }

    setOnlyMyEnrollments(mine === "1");
  }, [route]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter !== "all") {
      params.set("status", statusFilter);
    }

    if (userRole === "regular" && onlyMyEnrollments) {
      params.set("mine", "1");
    }

    onNavigateEventsWithQuery(params.toString());
  }, [statusFilter, onlyMyEnrollments, userRole, onNavigateEventsWithQuery]);

  const sortedEvents = useMemo(
    () =>
      [...events].sort((a, b) => {
        const left = a.updatedAt || a.createdAt || "";
        const right = b.updatedAt || b.createdAt || "";
        return right.localeCompare(left);
      }),
    [events],
  );

  const filteredEvents = useMemo(() => {
    let rows = sortedEvents;

    if (statusFilter !== "all") {
      rows = rows.filter((event) => event.status === statusFilter);
    }

    if (userRole === "regular" && onlyMyEnrollments) {
      rows = rows.filter((event) => event.isEnrolled);
    }

    return rows;
  }, [sortedEvents, statusFilter, onlyMyEnrollments, userRole]);

  const totalCount = sortedEvents.length;
  const openCount = sortedEvents.filter((event) => event.status === "open").length;
  const closedCount = totalCount - openCount;

  const eventColumns: DefaultTableColumn<CampusEvent>[] = [
    {
      key: "title",
      label: "Evento",
      sortable: true,
      sortValue: (event) => event.title,
      render: (event) => event.title,
    },
    {
      key: "status",
      label: "Estado",
      sortable: true,
      sortValue: (event) => event.status,
      render: (event) => (
        <span className={`pill proposal-status ${event.status}`}>
          {event.status === "open" ? "Abierto" : "Cerrado"}
        </span>
      ),
    },
    {
      key: "enrollmentCount",
      label: "Participantes",
      sortable: true,
      sortValue: (event) => event.enrollmentCount,
      render: (event) => event.enrollmentCount,
    },
    {
      key: "updatedAt",
      label: "Actualizado",
      sortable: true,
      sortValue: (event) => event.updatedAt || event.createdAt || "",
      render: (event) => formatUpdatedAt(event.updatedAt || event.createdAt),
    },
    {
      key: "actions",
      label: "Acciones",
      render: (event) => (
        <div className="table-actions">
          {userRole === "regular" && event.status === "open" && (
            <>
              {event.isEnrolled ? (
                <button
                  type="button"
                  className="secondary"
                  onClick={(clickEvent) => {
                    clickEvent.stopPropagation();
                    onWithdrawEnrollment(event.id);
                  }}
                >
                  Cancelar inscripción
                </button>
              ) : (
                <button
                  type="button"
                  onClick={(clickEvent) => {
                    clickEvent.stopPropagation();
                    onEnrollEvent(event.id);
                  }}
                >
                  Inscribirme
                </button>
              )}
            </>
          )}
          {userRole === "admin" && event.status === "open" && (
            <button
              type="button"
              onClick={(clickEvent) => {
                clickEvent.stopPropagation();
                onOpenClosureForm(event);
              }}
            >
              Cerrar evento
            </button>
          )}
        </div>
      ),
    },
  ];

  const eventExportColumns: DefaultTableExportColumn<CampusEvent>[] = [
    { label: "Evento", value: (event) => event.title },
    {
      label: "Estado",
      value: (event) => (event.status === "open" ? "Abierto" : "Cerrado"),
    },
    {
      label: "Participantes",
      value: (event) => event.enrollmentCount,
    },
    {
      label: "Creador",
      value: (event) => event.createdBy?.name || event.createdBy?.username || "-",
    },
    {
      label: "Actualizado",
      value: (event) => formatUpdatedAt(event.updatedAt || event.createdAt),
    },
  ];

  const onSubmitCreate = async (event: FormEvent<HTMLFormElement>) => {
    const created = await onCreateEvent(event);
    if (created) {
      setShowCreateModal(false);
    }
  };

  return (
    <section className="box reports-box">
      <article className="principal-panel">
        <h3>Eventos</h3>
        <p>
          Los usuarios se inscriben cuando el evento está <strong>Abierto</strong>.
          Al cerrar, el administrador publica resultados, fotos y descripción de
          la actividad.
        </p>
        {userRole === "admin" && (
          <div className="button-row">
            <button type="button" onClick={() => setShowCreateModal(true)}>
              Crear evento
            </button>
          </div>
        )}
        {!isAuthenticated && (
          <p className="small muted">
            Inicia sesión para participar en eventos o gestionarlos.
          </p>
        )}
        <div className="button-row compact">
          <button
            type="button"
            className={statusFilter === "all" ? "secondary" : ""}
            onClick={() => setStatusFilter("all")}
          >
            Todos ({totalCount})
          </button>
          <button
            type="button"
            className={statusFilter === "open" ? "secondary" : ""}
            onClick={() => setStatusFilter("open")}
          >
            Abiertos ({openCount})
          </button>
          <button
            type="button"
            className={statusFilter === "closed" ? "secondary" : ""}
            onClick={() => setStatusFilter("closed")}
          >
            Cerrados ({closedCount})
          </button>
          {userRole === "regular" && (
            <button
              type="button"
              className={onlyMyEnrollments ? "secondary" : ""}
              onClick={() => setOnlyMyEnrollments((prev) => !prev)}
            >
              {onlyMyEnrollments ? "Ver todos" : "Mis inscripciones"}
            </button>
          )}
        </div>
        <DefaultTable
          rows={filteredEvents}
          columns={eventColumns}
          exportColumns={eventExportColumns}
          onRowClick={onOpenEventDetail}
          getRowId={(event) => event.id}
          getSearchText={(event) =>
            `${event.title} ${event.description} ${event.createdBy?.name || ""} ${event.status}`
          }
          emptyMessage="No hay eventos registrados por el momento."
          searchPlaceholder="Buscar por título, descripción o estado"
          exportTitle="Eventos del campus"
          exportFileName="eventos-campus"
        />
      </article>

      <AppModal
        open={showCreateModal}
        title="Crear evento"
        onClose={() => setShowCreateModal(false)}
      >
        <form className="profile-form" onSubmit={onSubmitCreate}>
          <label>
            Título
            <input
              value={eventTitleInput}
              onChange={(event) => setEventTitleInput(event.target.value)}
              placeholder="Ej. Jornada de limpieza del bosque"
              required
            />
          </label>
          <label>
            Descripción
            <textarea
              value={eventDescriptionInput}
              onChange={(event) => setEventDescriptionInput(event.target.value)}
              placeholder="Describe objetivo, lugar y dinámica del evento"
              rows={4}
              required
            />
          </label>
          <div className="button-row">
            <button type="submit" disabled={isSubmittingEvent}>
              {isSubmittingEvent ? "Guardando..." : "Crear evento"}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => setShowCreateModal(false)}
            >
              Cancelar
            </button>
          </div>
        </form>
      </AppModal>

      <AppModal
        open={Boolean(selectedEventForClosure)}
        title="Cerrar evento"
        onClose={onCloseClosureForm}
      >
        <form className="profile-form" onSubmit={onCloseEvent}>
          <p className="small muted">
            Evento: <strong>{selectedEventForClosure?.title || "-"}</strong>
          </p>
          <label>
            Descripción final
            <textarea
              value={closureDescriptionInput}
              onChange={(event) =>
                setClosureDescriptionInput(event.target.value)
              }
              placeholder="Resumen de lo realizado y resultados"
              rows={4}
              required
            />
          </label>
          <label>
            Fotos del evento
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={onUploadEventImages}
              disabled={isUploadingEventImages}
            />
          </label>
          <label>
            URLs de fotos (una por línea)
            <textarea
              value={closureImagesInput}
              onChange={(event) => setClosureImagesInput(event.target.value)}
              placeholder="/uploads/events/foto-1.jpg"
              rows={4}
            />
          </label>

          {closureImagesInput
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line.length > 0).length > 0 && (
            <ImageCarousel
              images={closureImagesInput
                .split("\n")
                .map((line) => line.trim())
                .filter((line) => line.length > 0)}
              title={
                selectedEventForClosure
                  ? `Cierre: ${selectedEventForClosure.title}`
                  : "Cierre de evento"
              }
              resolveAssetUrl={resolveAssetUrl}
              className="report-carousel"
            />
          )}

          <div className="button-row">
            <button type="submit" disabled={isSubmittingClosure}>
              {isSubmittingClosure ? "Cerrando..." : "Cerrar y publicar"}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={onCloseClosureForm}
            >
              Cancelar
            </button>
          </div>
        </form>
      </AppModal>
    </section>
  );
}
