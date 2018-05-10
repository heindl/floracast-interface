declare module '@mapbox/geo-viewport' {
  type Dimensions = [number, number]; // Longitude, Latitude

  interface ViewPort {
    center: Dimensions;
    zoom: number;
  }

  type Bounds = [number, number, number, number];

  export function viewport(
    bounds: Bounds,
    dimensions: Dimensions,
    minzoom?: number,
    maxzoom?: number,
    tileSize?: number
  ): ViewPort;

  export function bounds(
    centre: Dimensions,
    zoom: number,
    viewport: [number, number],
    tileSize?: number
  ): Bounds;
}
