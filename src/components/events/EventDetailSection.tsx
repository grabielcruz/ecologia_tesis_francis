import { CampusEventDetail } from "../../features/events/types";
import { ImageCarousel } from "../ImageCarousel";

interface EventDetailSectionProps {
  selectedEventId: number | null;
  selectedEvent: CampusEventDetail | null;
  userRole?: string;
  resolveAssetUrl: (assetPath: string) => string;
  formatUpdatedAt: (value?: string | null) => string;
  onBack: () => void;
}

export function EventDetailSection({
  selectedEventId,
  selectedEvent,
  userRole,
  resolveAssetUrl,
  formatUpdatedAt,
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
            Participantes inscritos: <strong>{selectedEvent.enrollmentCount}</strong>
          </p>
          <p>
            Creado por: <strong>{selectedEvent.createdBy?.name || selectedEvent.createdBy?.username || "-"}</strong>
          </p>
          <p>Actualizado: {formatUpdatedAt(selectedEvent.updatedAt || selectedEvent.createdAt)}</p>
        </div>

        {selectedEvent.status === "closed" && (
          <div className="report-detail-content">
            <h4>Cierre del evento</h4>
            <p>{selectedEvent.closureDescription || "Sin descripción final."}</p>
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
            {!selectedEvent.participants || selectedEvent.participants.length === 0 ? (
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
                      <tr key={`${participant.id}-${participant.enrolledAt || ""}`}>
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
    </section>
  );
}
