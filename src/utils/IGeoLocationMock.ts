export interface INavigatorMock {
  geolocation: Geolocation;
}

export class IGeoLocationMock {
  public latitude: number = 0;
  public longitude: number = 0;

  constructor(lat: number, lng: number) {
    this.SetCoords(lat, lng);
  }

  public SetCoords(lat: number, lng: number) {
    this.latitude = lat;
    this.longitude = lng;
  }

  public getCurrentPosition(
    cb: PositionCallback,
    er: PositionErrorCallback
  ): void {
    const coords: ICoordinatesMock = {
      accuracy: 1,
      altitude: 1,
      altitudeAccuracy: 1,
      heading: 1,
      latitude: this.latitude,
      longitude: this.longitude,
      speed: 1,
    };
    const position: IPositionMock = {
      coords,
      timestamp: 1,
    };
    cb(position);
  }
}

export interface IGeolocation {
  getCurrentPosition(cb: PositionCallback, er: PositionErrorCallback): void;
}

export interface ICoordinatesMock {
  readonly accuracy: number;
  readonly altitude: number | null;
  readonly altitudeAccuracy: number | null;
  readonly heading: number | null;
  readonly latitude: number;
  readonly longitude: number;
  readonly speed: number | null;
}

export interface IPositionMock {
  readonly coords: ICoordinatesMock;
  readonly timestamp: number;
}
