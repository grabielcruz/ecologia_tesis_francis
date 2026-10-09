import { useEffect, useMemo } from "react";
import L, { LatLngExpression } from "leaflet";
import {
  MapContainer,
  Marker,
  Polygon,
  Polyline,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";

export interface PerimeterPoint {
  latitude: number;
  longitude: number;
}

interface GreenSpacePerimeterEditorProps {
  points: PerimeterPoint[];
  setPoints: (points: PerimeterPoint[]) => void;
}

const DEFAULT_CENTER: [number, number] = [10.06522, -69.32264];
const DEFAULT_ZOOM = 15;

const VERTEX_ICON = L.divIcon({
  className: "green-space-vertex-marker",
  html: '<span class="green-space-vertex-marker-dot" aria-hidden="true"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function MapCenterController({
  center,
}: {
  center: LatLngExpression;
}) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

function PointCapture({
  onAddPoint,
}: {
  onAddPoint: (latitude: number, longitude: number) => void;
}) {
  useMapEvents({
    click: (event) => {
      onAddPoint(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

const formatCoordinate = (value: number) => value.toFixed(6);

export function GreenSpacePerimeterEditor({
  points,
  setPoints,
}: GreenSpacePerimeterEditorProps) {
  const mapPoints = useMemo<[number, number][]>(
    () => points.map((point) => [point.latitude, point.longitude]),
    [points],
  );

  const mapCenter = mapPoints[0] || DEFAULT_CENTER;

  const addPoint = (latitude: number, longitude: number) => {
    setPoints([...points, { latitude, longitude }]);
  };

  const removePoint = (indexToRemove: number) => {
    setPoints(points.filter((_, index) => index !== indexToRemove));
  };

  const updatePoint = (indexToUpdate: number, latitude: number, longitude: number) => {
    setPoints(
      points.map((point, index) =>
        index === indexToUpdate
          ? {
              latitude,
              longitude,
            }
          : point,
      ),
    );
  };

  const clearPoints = () => setPoints([]);

  return (
    <fieldset className="gps-fields">
      <legend>Perímetro del área verde</legend>
      <p className="small muted">
        Marca al menos 3 puntos en el mapa para definir el perímetro.
      </p>
      <MapContainer
        className="green-space-polygon-map"
        center={mapCenter}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom
      >
        <MapCenterController center={mapCenter} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <PointCapture onAddPoint={addPoint} />
        {mapPoints.length >= 3 ? (
          <Polygon positions={mapPoints} pathOptions={{ color: "#0f766e" }} />
        ) : mapPoints.length > 1 ? (
          <Polyline positions={mapPoints} pathOptions={{ color: "#0f766e" }} />
        ) : null}
        {points.map((point, index) => (
          <Marker
            key={`${point.latitude}-${point.longitude}-${index}`}
            position={[point.latitude, point.longitude]}
            icon={VERTEX_ICON}
            draggable
            eventHandlers={{
              dragend: (event) => {
                const marker = event.target as L.Marker;
                const nextPosition = marker.getLatLng();
                updatePoint(index, nextPosition.lat, nextPosition.lng);
              },
            }}
          />
        ))}
      </MapContainer>
      <div className="button-row compact">
        <button
          type="button"
          className="secondary"
          onClick={clearPoints}
          disabled={points.length === 0}
        >
          Limpiar puntos
        </button>
      </div>
      {points.length > 0 ? (
        <div className="green-space-point-list">
          {points.map((point, index) => (
            <div key={`perimeter-point-${index}`} className="green-space-point-item">
              <span className="small muted">
                Punto {index + 1}: {formatCoordinate(point.latitude)},{" "}
                {formatCoordinate(point.longitude)}
              </span>
              <button
                type="button"
                className="secondary"
                onClick={() => removePoint(index)}
                aria-label={`Quitar punto ${index + 1}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </fieldset>
  );
}
