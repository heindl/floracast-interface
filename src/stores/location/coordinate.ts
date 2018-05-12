import { action, observable } from 'mobx';
import {ErrorStore, getErrorStore} from '../errors';

const Asheville = [35.538851, -82.7054901];
export const DefaultRadius: number = 160;

export default class LocationCoordinateStore {

    @observable
    public Latitude: number = 0;

    @observable
    public Longitude: number = 0;
    // TODO: Limit zoom to avoid fetching too many records across say, all of america. Maybe limit to one region.

    @observable
    public Radius: number = DefaultRadius; // 100 miles

    protected readonly namespace: string;
    protected errorStore: ErrorStore;

    constructor(namespace: string) {
        this.namespace = namespace;
        this.errorStore = getErrorStore(namespace);
    }

    public Geolocate(){

        if (!navigator.geolocation) {
            this.errorStore.Warn(Error('Geolocation off'));
            this.SetCoordinates(Asheville[0], Asheville[1])
        } else {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.SetCoordinates(
                        position.coords.latitude,
                        position.coords.longitude
                    );
                },
                (error) => {
                    this.errorStore.Report(error);
                }
            )
        }
    }

    @action
    public SetCoordinates(lat: number, lng: number){

        lat = parseFloat(lat.toPrecision(8));
        lng = parseFloat(lng.toPrecision(8));

        if (lat === this.Latitude && lng === this.Longitude) {
            return;
        }
        this.Latitude = lat;
        this.Longitude = lng;
    }

    @action
  public SetRadius(r: number) {
        this.Radius = r;
  }
  
}