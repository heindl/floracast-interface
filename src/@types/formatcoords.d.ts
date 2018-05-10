declare module 'formatcoords' {
  interface CoordFormatOptions {
    latLonSeparator: string; // The separator to use between the lat and lon values. Default: space.
    decimalPlaces: number; // The number of decimal places to return. Default: 5.
  }

  interface FormattedCoords {
    format(fmt?: string, options?: CoordFormatOptions): string;
  }

  export default function formatcoords(
    latitude: number,
    longitude: number
  ): FormattedCoords;
}
