export interface PolygonPoint {
  latitude: number;
  longitude: number;
}

const isPointOnSegment = (
  latitude: number,
  longitude: number,
  start: PolygonPoint,
  end: PolygonPoint,
) => {
  const crossProduct =
    (longitude - start.longitude) * (end.latitude - start.latitude) -
    (latitude - start.latitude) * (end.longitude - start.longitude);

  if (Math.abs(crossProduct) > 1e-10) {
    return false;
  }

  const dotProduct =
    (longitude - start.longitude) * (end.longitude - start.longitude) +
    (latitude - start.latitude) * (end.latitude - start.latitude);

  if (dotProduct < 0) {
    return false;
  }

  const squaredLength =
    (end.longitude - start.longitude) ** 2 +
    (end.latitude - start.latitude) ** 2;

  return dotProduct <= squaredLength;
};

export const isPointInsidePolygon = (
  latitude: number,
  longitude: number,
  polygonPoints: PolygonPoint[],
) => {
  if (polygonPoints.length < 3) {
    return false;
  }

  let inside = false;

  for (
    let currentIndex = 0, previousIndex = polygonPoints.length - 1;
    currentIndex < polygonPoints.length;
    previousIndex = currentIndex++
  ) {
    const current = polygonPoints[currentIndex];
    const previous = polygonPoints[previousIndex];

    if (isPointOnSegment(latitude, longitude, previous, current)) {
      return true;
    }

    const intersects =
      current.latitude > latitude !== previous.latitude > latitude &&
      longitude <
        ((previous.longitude - current.longitude) *
          (latitude - current.latitude)) /
          (previous.latitude - current.latitude) +
          current.longitude;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
};
