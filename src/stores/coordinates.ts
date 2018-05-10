import { bounds } from '@mapbox/geo-viewport';
import formatcoords from 'formatcoords';
import * as _ from 'lodash';
import { action, computed, observable } from 'mobx';
import {S2CellId, S2LatLng, S2RegionCoverer, Utils} from 'nodes2ts';
import {ErrorStore, getErrorStore} from './errors';

const Asheville = [35.538851, -82.7054901];

export const MinimumZoomLevel = 6;

interface IPositionOptions{
  FetchPlace?: boolean;
}

export class CoordinateStore {

    @observable
    public Latitude: number;

    @observable
    public Longitude: number;
    // TODO: Limit zoom to avoid fetching too many records across say, all of america. Maybe limit to one region.
    @observable
    public Zoom: number = 9;

    @observable
    public City: string;

    @observable
    public State: string;
    @observable
    public StateAbbreviation: string;

    @observable
    public ViewPort: [number, number] = [0, 0]; // [x, y]

    @observable
    public IsReady: boolean = false;

    protected readonly namespace: string;
  protected geocoder?: google.maps.Geocoder;
  protected errorStore: ErrorStore;
    protected addressCache: Map<string, Map<string, [number, number]>> = new Map();


    constructor(namespace: string) {
        this.namespace = namespace;
        // this.handleWindowWidthChange = this.handleWindowWidthChange.bind(this);
        window.onresize = _.debounce(this.handleWindowWidthChange, 250);
        // Call to set initial.
        this.handleWindowWidthChange();
        this.errorStore = getErrorStore(namespace);

        // Load Google Maps.
        // I think only relative to testing, multiple tests will try to load google onto
        // the same jsdom object.
        // Sooo ... check that it doesn't already exist.
        if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
            const scriptNode = document.createElement('script');
            scriptNode.type = 'text/javascript';
            scriptNode.src = `https://maps.googleapis.com/maps/api/js?key=${
                process.env.REACT_APP_FLORACAST_GOOGLE_MAPS_API_KEY
                }&libraries=places,geometry&region=US`;
            scriptNode.onload = () => {
                this.ready(true);
            };
            scriptNode.async = true;
            // scriptNode.defer = false;
            scriptNode.onerror = (event: ErrorEvent) => {
                this.errorStore.Report(event.error, {}, event.message);
                this.ready(false);
            };
            document.body.appendChild(scriptNode);
        } else {
            this.ready(true);
        }
    }

    public Geolocate() {

        if (!navigator.geolocation) {
            this.errorStore.Warn(Error('Geolocation off'));
            this.SetPosition(Asheville[0], Asheville[1], this.Zoom, {FetchPlace: true})
        } else {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.SetPosition(
                        position.coords.latitude,
                        position.coords.longitude,
                        this.Zoom,
                        {FetchPlace: true}
                    );
                },
                (error) => {
                    this.errorStore.Report(error);
                }
            )
        }
    }

    public GeocodeCoordinates() {
        // TODO: Additional parameter checks to ensure valid lat, lng.
        if (!this.geocoder) {
            return
        }
        this.geocoder.geocode(
            { location: { lat: this.Latitude, lng: this.Longitude } },
            (
                results: google.maps.GeocoderResult[],
                status: google.maps.GeocoderStatus
            ) => {
                if (status !== google.maps.GeocoderStatus.OK) {
                    throw Error(
                        `Google Geocoder Status Error: ${this.Latitude}, ${this.Longitude}: ${status}`
                    );
                }
                if (results.length === 0) {
                    this.SetCity('');
                    this.SetState('', '');
                    return;
                }
                for (const component of results[0].address_components) {
                    if (component.types.indexOf('locality') !== -1) {
                        this.SetCity(component.long_name.replace(', United States', ''));
                    }
                    if (component.types.indexOf('administrative_area_level_1') !== -1) {
                        this.SetState(component.long_name, component.short_name);
                    }
                }
            }
        );
    }
    public IncrementZoom(amount?: number) {
        const next = this.Zoom + (amount || 1);
        if (next < MinimumZoomLevel) {
            return
        }
        this.SetPosition(this.Latitude, this.Longitude, next);
    }

    public DecrementZoom(amount?: number) {
        const next = this.Zoom - (amount || 1);
        if (next < MinimumZoomLevel) {
            return
        }
        this.SetPosition(this.Latitude, this.Longitude, next);
    }

    @action
    public SetZoom(amount: number) {
        if (amount < MinimumZoomLevel) {
            amount = MinimumZoomLevel
        }
        this.SetPosition(this.Latitude || 0, this.Longitude || 0, amount);
    }

    public FromPath(loc: string) {
        const commaMatches = loc.match(/,/gi);
        if (
            !commaMatches ||
            commaMatches.length === 0 ||
            !loc.startsWith('@') ||
            !loc.endsWith('z')
        ) {
            throw Error(
                `Could not construct location with invalid path parameter [${loc}]`
            );
        }
        const divisions: string[] = loc
            .replace('@', '')
            .replace('z', '')
            .split(',');
        this.SetPosition(parseFloat(divisions[0]), parseFloat(divisions[1]), parseInt(divisions[2], 10), {FetchPlace: true});
    }

    @action
    public SetCity(city?: string){
        if (!city || city.trim() === '') {
            return
        }
        city = _.startCase(_.toLower(city));
        if (this.City !== city) {
            this.City = city;
        }
    }

    @action
    public SetState(state?: string, abbr?: string){

        if (!state || state.trim() === '') {
            return
        }

        state = _.startCase(_.toLower(state));

        if (this.State !== state) {
            this.State = state;
            if (abbr) {
                this.StateAbbreviation = abbr.toUpperCase();
            }
        }
    }

    @computed
    public get StaticMapFunc(): {f: (
            width: number,
            height: number,
            zoom: number,
        ) => string} {

        const lat = this.Latitude;
        const lng = this.Longitude;

        const mapboxAPIPrefix: string = 'https://api.mapbox.com/styles/v1/mapbox';
        const mapboxStyle: string = 'cj44mfrt20f082snokim4ungi';
        const mapboxToken: string =
            process.env.REACT_APP_FLORACAST_MAPBOX_API_KEY || '';

        return {f: (
                width: number,
                height: number,
                zoom: number,
            ): string => {
                const prefix = `${mapboxAPIPrefix}/${mapboxStyle}/static/`;
                const suffix = `?access_token=${mapboxToken}&attribution=false&logo=false`;
                const c = prefix + `${lng},${lat},${zoom},0.00,0.00/${height}x${width}` + suffix;
                return c;
            }}
    }

    public GeocodeAddress() {
        if (!this.geocoder) {
            return
        }

        const q = { locality: this.City, administrativeArea: this.State };

        const coords = this.getFromAddressCache(q.locality, q.administrativeArea);
        if (coords) {
            this.SetPosition(coords[0], coords[1], this.Zoom);
            return
        }

        this.geocoder.geocode(
            { componentRestrictions: { locality: this.City, administrativeArea: this.State } },
            (
                results: google.maps.GeocoderResult[],
                status: google.maps.GeocoderStatus
            ) => {
                if (
                    !results ||
                    results.length === 0 ||
                    status !== google.maps.GeocoderStatus.OK
                ) {
                    this.errorStore.Report(
                        Error(
                            `Coordinates not found for city [${this.City}] state [${this.State}]: ${status}`
                        )
                    );
                    return;
                }

                const resCoords: [number, number] = [results[0].geometry.location.lat(), results[0].geometry.location.lng()];

                this.updateAddressCache(q.locality, q.administrativeArea, resCoords);
                this.SetPosition(
                    resCoords[0],
                    resCoords[1],
                    this.Zoom,
                );
            }
        );
    }

    @action
    public SetPosition(lat: number, lng: number, zoom: number, opts?: IPositionOptions) {

        lat = parseFloat(lat.toPrecision(8));
        lng = parseFloat(lng.toPrecision(8));

        if (lat === this.Latitude && lng === this.Longitude && this.Zoom === zoom) {
            return;
        }
        this.Latitude = lat;
        this.Longitude = lng;
        this.Zoom = zoom;

        if (!this.IsReady) {
            return;
        }

        if (!opts || !opts.FetchPlace) {
            return;
        }

        this.GeocodeCoordinates()
    }

    @computed
    public get DMS(): string {
        if (!this.Latitude || !this.Longitude) {
            return ''
        }
        return formatcoords(this.Latitude, this.Longitude).format(undefined, {
            decimalPlaces: 3,
            latLonSeparator: ' ',
        });
    }


    @action
  protected ready(state: boolean) {
    this.IsReady = state;
    if (this.IsReady) {
      this.geocoder = new google.maps.Geocoder();
    }

    // Reconcile state.
    const haveCoordinates = this.Latitude && this.Longitude;
    const havePlaceName = this.City && this.State;

    if (havePlaceName && !haveCoordinates) {
        return this.GeocodeAddress();
    }

    if (!havePlaceName && haveCoordinates) {
        return this.GeocodeCoordinates();
    }

    return this.Geolocate()
  }



  protected updateAddressCache = (city: string, state: string, coords: [number, number]) => {
      const stateMap = this.addressCache.get(state) || new Map<string, [number, number]>();
      stateMap.set(city, coords);
      this.addressCache.set(state, stateMap);
  }
    protected getFromAddressCache = (city: string, state: string): [number, number] | undefined => {
      const stateMap = this.addressCache.get(state);
      if (!stateMap) {
          return undefined
      }
      return stateMap.get(city);
    };

  @action.bound // .bound necessary to function, or otherwise bind in constructor.
  protected handleWindowWidthChange() {
    if (
      window.innerWidth === this.ViewPort[0] &&
      window.innerHeight === this.ViewPort[0]
    ) {
      return;
    }
    this.ViewPort = [window.innerWidth, window.innerHeight];
  }

  // TODO:
  // Develop an efficient way of fetching new records when the view pans.
  // - Exclude the area already fetched, filter that which was removed, and fetch for new area.
  // Replace with GoogleMaps to save loading an additional library.
  @computed
  public get Bounds(): [number, number, number, number ]{
    return bounds([this.Longitude, this.Latitude], this.Zoom, this.ViewPort);
    // return new Bounds({
    //   e: b[2],
    //   n: b[3],
    //   s: b[1],
    //   w: b[0],
    // });
  }

  @computed
  public get ContainsPointCallback(): (lat: number, lng: number) => boolean {
      const b = this.Bounds;
      return (lat: number, lng: number): boolean => {
          if (lng < b[0] || lng > b[2]) {
              return false
          }
          if (lat < b[1] || lat > b[3]) {
              return false
          }
          return true
      }

    }

  @computed
  public get Covering(): S2CellId[] {

    const region = Utils.calcRegionFromCenterRadius(
      S2LatLng.fromDegrees(this.Latitude, this.Longitude),
      this.Radius
    );

    const coverer = new S2RegionCoverer();

    coverer.setMaxCells(15);
    coverer.setMaxLevel(8);

    const cellIds = coverer.getCoveringCells(region);

        // console.log(JSON.stringify(
        //   {
        //       features: cellIds.map((id) => {
        //         const c = new S2Cell(id).id.parent();
        //         const p = new S2Cell(c)
        //         return p.toGEOJSON()
        //       }),
        //       type: "FeatureCollection"
        //   }
        // ))
    return cellIds;
  }

  @computed
  public get Radius(): number {
    if (!this.IsReady) {
      return 0;
    }
    const b = this.Bounds;
      // const coords = bounds([this.Longitude, this.Latitude], this.Zoom, this.ViewPort);
      // const b = {
      //     e: coords[2],
      //     n: coords[3],
      //     s: coords[1],
      //     w: coords[0],
      // }
    const dist = google.maps.geometry.spherical.computeDistanceBetween(
      new google.maps.LatLng(this.Latitude, this.Longitude),
      new google.maps.LatLng(this.Latitude, b[0])
    );
    return dist === 0 ? dist : dist / 1000;
  }

  @computed
  public get Formatted(): string{
      if (!this.Latitude || !this.Longitude) {
          return ''
      }
    return `@${this.Latitude.toFixed(6)},${this.Longitude.toFixed(6)},${
      this.Zoom
    }z`;
  }

  // public DistanceKilometers(latitude: number, longitude: number): number {
  //   return computed((): number => {
  //     if (!this.IsReady) {
  //       return 0;
  //     }
  //     return (
  //       google.maps.geometry.spherical.computeDistanceBetween(
  //         new google.maps.LatLng(latitude, longitude),
  //         new google.maps.LatLng(this.Latitude, this.Longitude)
  //       ) / 1000
  //     );
  //   }).get();
  // }
    @computed
    public get BearingToFunc(): (latitude: number, longitude: number) => IBearing {

            return (latitude: number, longitude: number): IBearing => {
                const bearing = google.maps.geometry.spherical.computeHeading(
                    new google.maps.LatLng(this.Latitude, this.Longitude),
                    new google.maps.LatLng(latitude, longitude)
                );
                return {
                    i: bearing,
                    s: symbolFromBearing(bearing),
                };
             }
        }
  //
  // public BearingTo(latitude: number, longitude: number): Bearing {
  //   return computed((): Bearing => {
  //     if (!this.IsReady) {
  //       return { i: 0, s: '' };
  //     }
  //     const bearing = google.maps.geometry.spherical.computeHeading(
  //       new google.maps.LatLng(this.Latitude, this.Longitude),
  //       new google.maps.LatLng(latitude, longitude)
  //     );
  //     return {
  //       i: bearing,
  //       s: symbolFromBearing(bearing),
  //     };
  //   }).get();
  // }
  
}

const namespaces: Map<string, CoordinateStore> = new Map();

export function getCoordinateStore(namespace: string): CoordinateStore {
  let store = namespaces.get(namespace);
  if (!store) {
    store = new CoordinateStore(namespace);
    namespaces.set(namespace, store);
  }
  return store;
}

interface IBearing {
  s: string;
  i: number;
}

function symbolFromBearing(b: number): string {
  if (b < 0) {
    b = 180 + b + 180;
  }
  switch (true) {
    case b === 0:
      return 'N';
    case b > 0 && b < 90:
      return 'NE';
    case b === 90:
      return 'E';
    case b > 90 && b < 180:
      return 'SE';
    case b === 180:
      return 'S';
    case b > 180 && b < 270:
      return 'SW';
    case b === 270:
      return 'W';
    case b > 270:
      return 'NW';
    default:
      return '';
  }
}
