import { useEffect, useMemo } from "react";
import L from "leaflet";
import { MapContainer, Polygon, TileLayer, Tooltip, useMap } from "react-leaflet";
import type { PerimeterPoint } from "./GreenSpacePerimeterEditor";

interface GreenSpaceMapArea {
  id: number;
  name: string;
  perimeterPoints: PerimeterPoint[];
}

interface GreenSpacesOverviewMapProps {
  greenSpaces: GreenSpaceMapArea[];
  onClickGreenSpace: (greenSpaceId: number) => void;
}

const DEFAULT_CENTER: [number, number] = [10.06522, -69.32264];
const DEFAULT_ZOOM = 16;
const POLYGON_COLORS = [
  "#0f766e",
  "#0284c7",
  "#7c3aed",
  "#b45309",
  "#dc2626",
  "#2563eb",
];

function GreenSpacesBoundsController({
  perimeterCollections,
}: {
  perimeterCollections: [number, number][][];
}) {
  const map = useMap();

  useEffect(() => {
    if (perimeterCollections.length > 0) {
      const allPoints = perimeterCollections.flat();
      const bounds = L.latLngBounds(allPoints);
      map.fitBounds(bounds, { padding: [24, 24] });
      return;
    }

    map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
  }, [map, perimeterCollections]);

  return null;
}

export function GreenSpacesOverviewMap({
  greenSpaces,
  onClickGreenSpace,
}: GreenSpacesOverviewMapProps) {
  const spacesWithValidPerimeter = useMemo(
    () => greenSpaces.filter((space) => space.perimeterPoints.length >= 3),
    [greenSpaces],
  );

  if (spacesWithValidPerimeter.length === 0) {
    return <p className="small muted">No hay perímetros válidos para mostrar en el mapa.</p>;
  }

  const perimeterCollections = spacesWithValidPerimeter.map((space) =>
    space.perimeterPoints.map(
      (point) => [point.latitude, point.longitude] as [number, number],
    ),
  );

  return (
    <MapContainer
      className="green-spaces-overview-map"
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      scrollWheelZoom
    >
      <GreenSpacesBoundsController perimeterCollections={perimeterCollections} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {spacesWithValidPerimeter.map((space, index) => {
        const color = POLYGON_COLORS[index % POLYGON_COLORS.length];
        const positions = space.perimeterPoints.map((point) => [
          point.latitude,
          point.longitude,
        ]) as [number, number][];

        return (
          <Polygon
            key={`green-space-polygon-${space.id}`}
            positions={positions}
            pathOptions={{
              color,
              fillColor: color,
              fillOpacity: 0.28,
              weight: 2.5,
            }}
            eventHandlers={{
              click: () => onClickGreenSpace(space.id),
            }}
          >
            <Tooltip sticky>{space.name}</Tooltip>
          </Polygon>
        );
      })}
    </MapContainer>
  );
}
