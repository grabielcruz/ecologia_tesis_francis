import { ChangeEvent, FormEvent } from "react";
import { CampusEvent, CampusEventDetail } from "../../features/events/types";
import { AppModal } from "../AppModal";
import { ImageCarousel } from "../ImageCarousel";

interface EventDetailSectionProps {
  selectedEventId: number | null;
  selectedEvent: CampusEventDetail | null;
  userRole?: string;
  editEventTitleInput: string;
  editEventDescriptionInput: string;
  editEventDateInput: string;
  closureDescriptionInput: string;
  closureImagesInput: string;
  closureFormMode: "close" | "edit";
  selectedEventForClosure: CampusEvent | null;
  selectedEventForEdit: CampusEvent | null;
  isSubmittingClosure: boolean;
  isSubmittingEventEdit: boolean;
  isUploadingEventImages: boolean;
  isDeletingEvent: boolean;
  resolveAssetUrl: (assetPath: string) => string;
  formatUpdatedAt: (value?: string | null) => string;
  setEditEventTitleInput: (value: string) => void;
  setEditEventDescriptionInput: (value: string) => void;
  setEditEventDateInput: (value: string) => void;
  setClosureDescriptionInput: (value: string) => void;
  setClosureImagesInput: (value: string) => void;
  onOpenClosureForm: (event: CampusEventDetail) => void;
  onCloseClosureForm: () => void;
  onOpenEditEventForm: (event: CampusEventDetail) => void;
  onCloseEditEventForm: () => void;
  onUploadEventImages: (event: ChangeEvent<HTMLInputElement>) => void;
  onCloseEvent: (event: FormEvent<HTMLFormElement>) => Promise<boolean>;
  onEditOpenEvent: (event: FormEvent<HTMLFormElement>) => Promise<boolean>;
  onDeleteClosedEvent: (eventId: number) => Promise<boolean>;
  onBack: () => void;
}

export function EventDetailSection({
  selectedEventId,
  selectedEvent,
  userRole,
  editEventTitleInput,
  editEventDescriptionInput,
  editEventDateInput,
  closureDescriptionInput,
  closureImagesInput,
  closureFormMode,
  selectedEventForClosure,
  selectedEventForEdit,
  isSubmittingClosure,
  isSubmittingEventEdit,
  isUploadingEventImages,
  isDeletingEvent,
  resolveAssetUrl,
  formatUpdatedAt,
  setEditEventTitleInput,
  setEditEventDescriptionInput,
  setEditEventDateInput,
  setClosureDescriptionInput,
  setClosureImagesInput,
  onOpenClosureForm,
  onCloseClosureForm,
  onOpenEditEventForm,
  onCloseEditEventForm,
  onUploadEventImages,
  onCloseEvent,
  onEditOpenEvent,
  onDeleteClosedEvent,
  onBack,
}: EventDetailSectionProps) {
  if (!selectedEventId) {
    return (
      <section className="box">
        <div className="button-row">
          <button type="button" className="secondary" onClick={onBack}>
            Volver a eventos
          </button>
        </div>
        <p>Evento inválido.</p>
      </section>
    );
  }

  if (!selectedEvent) {
    return (
      <section className="box">
        <div className="button-row">
          <button type="button" className="secondary" onClick={onBack}>
            Volver a eventos
          </button>
        </div>
        <p>No se encontró el evento solicitado.</p>
      </section>
    );
  }

  return (
    <section className="box reports-box">
      <article className="principal-panel">
        <div className="button-row compact">
          <button type="button" className="secondary" onClick={onBack}>
            Volver a eventos
          </button>
        </div>

        <h3>{selectedEvent.title}</h3>
        <p>{selectedEvent.description}</p>

        <div className="green-space-stats">
          <div className="pill-row">
            <span className={`pill proposal-status ${selectedEvent.status}`}>
              {selectedEvent.status === "open" ? "Abierto" : "Cerrado"}
            </span>
          </div>
          <p>
            Fecha del evento:{" "}
            <strong>
              {formatUpdatedAt(selectedEvent.eventDate || selectedEvent.createdAt)}
            </strong>
          </p>
          <p>
            Participantes inscritos:{" "}
            <strong>{selectedEvent.enrollmentCount}</strong>
          </p>
          <p>
            Creado por:{" "}
            <strong>
              {selectedEvent.createdBy?.name ||
                selectedEvent.createdBy?.username ||
                "-"}
            </strong>
          </p>
          <p>
            Última actualización:{" "}
            {formatUpdatedAt(
              selectedEvent.updatedAt || selectedEvent.createdAt,
            )}
          </p>
          {userRole === "admin" && selectedEvent.status === "open" && (
            <div className="button-row">
              <button
                type="button"
                className="secondary"
                onClick={() => onOpenEditEventForm(selectedEvent)}
              >
                Editar evento
              </button>
              <button
                type="button"
                onClick={() => onOpenClosureForm(selectedEvent)}
              >
                Cerrar evento
              </button>
            </div>
          )}
          {userRole === "admin" && selectedEvent.status === "closed" && (
            <div className="button-row">
              <button
                type="button"
                className="secondary"
                onClick={() => onOpenClosureForm(selectedEvent)}
              >
                Editar cierre
              </button>
              <button
                type="button"
                className="danger"
                disabled={isDeletingEvent}
                onClick={() => {
                  const confirmed = window.confirm(
                    "¿Deseas eliminar este evento cerrado? Esta acción no se puede deshacer.",
                  );
                  if (!confirmed) return;
                  void onDeleteClosedEvent(selectedEvent.id);
                }}
              >
                {isDeletingEvent ? "Eliminando..." : "Eliminar evento"}
              </button>
            </div>
          )}
        </div>

        {selectedEvent.status === "closed" && (
          <div className="report-detail-content">
            <h4>Cierre del evento</h4>
            <p>
              {selectedEvent.closureDescription || "Sin descripción final."}
            </p>
            {selectedEvent.closureImages.length > 0 ? (
              <ImageCarousel
                images={selectedEvent.closureImages}
                title={`Cierre: ${selectedEvent.title}`}
                resolveAssetUrl={resolveAssetUrl}
                className="report-carousel"
              />
            ) : (
              <p>Este cierre no tiene imágenes registradas.</p>
            )}
          </div>
        )}

        {userRole === "admin" && (
          <div className="report-detail-content">
            <h4>Lista de participantes</h4>
            {!selectedEvent.participants ||
            selectedEvent.participants.length === 0 ? (
              <p>No hay participantes inscritos.</p>
            ) : (
              <div className="standard-table-wrap">
                <table className="standard-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Usuario</th>
                      <th>Fecha de inscripción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedEvent.participants.map((participant) => (
                      <tr
                        key={`${participant.id}-${participant.enrolledAt || ""}`}
                      >
                        <td>{participant.name}</td>
                        <td>{participant.username}</td>
                        <td>{formatUpdatedAt(participant.enrolledAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </article>

      <AppModal
        isOpen={Boolean(selectedEventForEdit)}
        title="Editar evento abierto"
        onClose={onCloseEditEventForm}
      >
        <form className="profile-form" onSubmit={onEditOpenEvent}>
          <label>
            Título
            <input
              value={editEventTitleInput}
              onChange={(event) => setEditEventTitleInput(event.target.value)}
              required
            />
          </label>
          <label>
            Fecha del evento
            <input
              type="datetime-local"
              value={editEventDateInput}
              onChange={(event) => setEditEventDateInput(event.target.value)}
              required
            />
          </label>
          <label>
            Descripción
            <textarea
              value={editEventDescriptionInput}
              onChange={(event) =>
                setEditEventDescriptionInput(event.target.value)
              }
              rows={4}
              required
            />
          </label>
          <div className="button-row">
            <button type="submit" disabled={isSubmittingEventEdit}>
              {isSubmittingEventEdit ? "Guardando..." : "Guardar cambios"}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={onCloseEditEventForm}
            >
              Cancelar
            </button>
          </div>
        </form>
      </AppModal>

      <AppModal
        isOpen={Boolean(selectedEventForClosure)}
        title={closureFormMode === "edit" ? "Editar cierre" : "Cerrar evento"}
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
              {isSubmittingClosure
                ? closureFormMode === "edit"
                  ? "Guardando..."
                  : "Cerrando..."
                : closureFormMode === "edit"
                  ? "Guardar cierre"
                  : "Cerrar y publicar"}
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
