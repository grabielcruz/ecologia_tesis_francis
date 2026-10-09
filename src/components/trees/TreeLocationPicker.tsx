import { useEffect, useMemo, useState } from "react";
import L, { LatLngExpression } from "leaflet";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";

const DEFAULT_CENTER: [number, number] = [10.06522, -69.32264];
const DEFAULT_ZOOM = 14;
const SELECTED_ZOOM = 17;
const CUSTOM_MARKER_ICON = L.divIcon({
  className: "tree-map-custom-marker",
  html: '<span class="tree-map-custom-marker-dot" aria-hidden="true"></span>',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
});

const parseCoordinate = (value: string) => {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const formatCoordinate = (value: number) => value.toFixed(6);

interface TreeLocationPickerProps {
  latitudeInput: string;
  longitudeInput: string;
  setLatitudeInput: (value: string) => void;
  setLongitudeInput: (value: string) => void;
}

interface MapSelectionProps {
  selectedPosition: [number, number] | null;
  onSelectPosition: (latitude: number, longitude: number) => void;
}

function MapCenterController({
  center,
  zoom,
}: {
  center: LatLngExpression;
  zoom: number;
}) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, map, zoom]);
  return null;
}

function MapSelection({
  selectedPosition,
  onSelectPosition,
}: MapSelectionProps) {
  useMapEvents({
    click: (event) => {
      onSelectPosition(event.latlng.lat, event.latlng.lng);
    },
  });

  if (!selectedPosition) {
    return null;
  }

  return (
    <Marker
      position={selectedPosition}
      icon={CUSTOM_MARKER_ICON}
      draggable
      eventHandlers={{
        dragend: (event) => {
          const marker = event.target as L.Marker;
          const nextPosition = marker.getLatLng();
          onSelectPosition(nextPosition.lat, nextPosition.lng);
        },
      }}
    />
  );
}

export function TreeLocationPicker({
  latitudeInput,
  longitudeInput,
  setLatitudeInput,
  setLongitudeInput,
}: TreeLocationPickerProps) {
  const [geoError, setGeoError] = useState<string | null>(null);

  const selectedPosition = useMemo<[number, number] | null>(() => {
    const latitude = parseCoordinate(latitudeInput);
    const longitude = parseCoordinate(longitudeInput);
    if (latitude === null || longitude === null) {
      return null;
    }
    return [latitude, longitude];
  }, [latitudeInput, longitudeInput]);

  const mapCenter = selectedPosition || DEFAULT_CENTER;
  const mapZoom = selectedPosition ? SELECTED_ZOOM : DEFAULT_ZOOM;

  const syncCoordinates = (latitude: number, longitude: number) => {
    setLatitudeInput(formatCoordinate(latitude));
    setLongitudeInput(formatCoordinate(longitude));
  };

  const clearCoordinates = () => {
    setLatitudeInput("");
    setLongitudeInput("");
    setGeoError(null);
  };

  const useCurrentLocation = () => {
    if (!("geolocation" in navigator)) {
      setGeoError("Tu navegador no permite usar geolocalización.");
      return;
    }

    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        syncCoordinates(position.coords.latitude, position.coords.longitude);
      },
      () => {
        setGeoError(
          "No se pudo obtener la ubicación actual. Revisa los permisos del navegador.",
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
    );
  };

  return (
    <div className="tree-map-picker">
      <div className="button-row compact">
        <button type="button" className="secondary" onClick={useCurrentLocation}>
          Usar mi ubicación
        </button>
        <button type="button" className="secondary" onClick={clearCoordinates}>
          Limpiar coordenadas
        </button>
      </div>
      {geoError ? <p className="small error">{geoError}</p> : null}
      <p className="small muted">
        Haz clic en el mapa para marcar el punto exacto o arrastra el marcador.
      </p>
      <MapContainer
        className="tree-map-canvas"
        center={mapCenter}
        zoom={mapZoom}
        scrollWheelZoom
      >
        <MapCenterController center={mapCenter} zoom={mapZoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapSelection
          selectedPosition={selectedPosition}
          onSelectPosition={syncCoordinates}
        />
      </MapContainer>
    </div>
  );
}
