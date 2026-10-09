import { useEffect } from "react";
import L from "leaflet";
import {
  CircleMarker,
  MapContainer,
  Polygon,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import type { PerimeterPoint } from "./GreenSpacePerimeterEditor";
import { isPointInsidePolygon } from "../../features/geo/polygon";

interface GreenSpacePerimeterMapProps {
  points: PerimeterPoint[];
  trees?: Array<{
    id: number;
    name: string;
    latitude: number | null;
    longitude: number | null;
  }>;
  onClickTree?: (treeId: number) => void;
}

const DEFAULT_CENTER: [number, number] = [10.06522, -69.32264];
const DEFAULT_ZOOM = 15;

function MapBoundsController({
  boundsPoints,
}: {
  boundsPoints: [number, number][];
}) {
  const map = useMap();

  useEffect(() => {
    if (boundsPoints.length > 0) {
      const bounds = L.latLngBounds(boundsPoints);
      map.fitBounds(bounds, { padding: [24, 24] });
      return;
    }

    map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
  }, [map, boundsPoints]);

  return null;
}

export function GreenSpacePerimeterMap({
  points,
  trees = [],
  onClickTree,
}: GreenSpacePerimeterMapProps) {
  if (points.length < 3) {
    return <p className="small muted">Este espacio aún no tiene un perímetro válido.</p>;
  }

  const treesInside = trees.filter(
    (tree) =>
      tree.latitude !== null &&
      tree.longitude !== null &&
      isPointInsidePolygon(tree.latitude, tree.longitude, points),
  );
  const treesOutside = trees.filter(
    (tree) =>
      tree.latitude !== null &&
      tree.longitude !== null &&
      !isPointInsidePolygon(tree.latitude, tree.longitude, points),
  );
  const treesMissingCoordinates = trees.filter(
    (tree) => tree.latitude === null || tree.longitude === null,
  );
  const boundsPoints: [number, number][] = [
    ...points.map((point) => [point.latitude, point.longitude] as [number, number]),
    ...trees
      .filter((tree) => tree.latitude !== null && tree.longitude !== null)
      .map((tree) => [tree.latitude as number, tree.longitude as number]),
  ];

  return (
    <div className="green-space-perimeter-map-wrap">
      <MapContainer
        className="green-space-perimeter-map"
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom={false}
        dragging={false}
        doubleClickZoom={false}
        touchZoom={false}
        boxZoom={false}
        keyboard={false}
        zoomControl={false}
      >
        <MapBoundsController boundsPoints={boundsPoints} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polygon
          positions={points.map((point) => [point.latitude, point.longitude])}
          pathOptions={{
            color: "#0f766e",
            fillColor: "#0f766e",
            fillOpacity: 0.2,
            weight: 3,
          }}
        />
        {treesInside.map((tree) => (
          <CircleMarker
            key={`tree-inside-${tree.id}`}
            center={[tree.latitude!, tree.longitude!]}
            radius={6}
            pathOptions={{
              color: "#134e4a",
              fillColor: "#16a34a",
              fillOpacity: 0.95,
              weight: 2,
            }}
            eventHandlers={
              onClickTree
                ? {
                    click: () => onClickTree(tree.id),
                  }
                : undefined
            }
          >
            <Tooltip sticky>{tree.name}</Tooltip>
          </CircleMarker>
        ))}
        {treesOutside.map((tree) => (
          <CircleMarker
            key={`tree-outside-${tree.id}`}
            center={[tree.latitude!, tree.longitude!]}
            radius={6}
            pathOptions={{
              color: "#7f1d1d",
              fillColor: "#dc2626",
              fillOpacity: 0.95,
              weight: 2,
            }}
            eventHandlers={
              onClickTree
                ? {
                    click: () => onClickTree(tree.id),
                  }
                : undefined
            }
          >
            <Tooltip sticky>{`${tree.name} (fuera del perímetro)`}</Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
      {(treesOutside.length > 0 || treesMissingCoordinates.length > 0) && (
        <div className="green-space-tree-warning">
          <p className="small">Hay árboles con ubicación fuera del perímetro o sin coordenadas:</p>
          <ul>
            {treesOutside.map((tree) => (
              <li key={`tree-warning-outside-${tree.id}`}>
                {onClickTree ? (
                  <button type="button" className="secondary" onClick={() => onClickTree(tree.id)}>
                    {tree.name}
                  </button>
                ) : (
                  <span>{tree.name}</span>
                )}{" "}
                (fuera del perímetro)
              </li>
            ))}
            {treesMissingCoordinates.map((tree) => (
              <li key={`tree-warning-${tree.id}`}>
                {onClickTree ? (
                  <button type="button" className="secondary" onClick={() => onClickTree(tree.id)}>
                    {tree.name}
                  </button>
                ) : (
                  <span>{tree.name}</span>
                )}
                {" (sin ubicación GPS)"}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
