// import {GeocoderRequest, GeocoderResult, GeocoderStatus} from 'map';
import {} from '@types/googlemaps';
import {action, IReactionDisposer, observable, reaction, when} from 'mobx';
import MErrors from '../errors';
import {getGlobalModel} from "../globals";
import MLocationUserCoordinates from "./coordinate";
import GeocoderResult = google.maps.GeocoderResult;

export default class MLocationPlace {

    @observable
    public Locality: string;

    @observable
    public AdminAreaLong: string;

    @observable
    public AdminAreaShort: string;

    @observable
    public GoogleMapsScriptHasLoaded: boolean = false;

    protected readonly namespace: string;
    protected readonly coordinateStore: MLocationUserCoordinates;
    protected readonly errorStore: MErrors;

    protected UnsubscribeGeocodeReaction: IReactionDisposer;

    constructor(namespace: string) {
        this.coordinateStore = getGlobalModel(namespace, MLocationUserCoordinates);
        this.namespace = namespace;
        this.errorStore = getGlobalModel(namespace, MErrors);

        this.fetchGoogleMapScript();

        this.UnsubscribeGeocodeReaction = reaction(
            () => {
                return {
                    lat: this.coordinateStore.Latitude,
                    lng: this.coordinateStore.Longitude,
                }
            },
            (i) => this.geocodeCoordinates(i),
            {
                fireImmediately: true,
                name: `Geocode Reaction`
            },
        )
    }

    public async ReverseGeocode(q: {address?: string, placeId?: string}) {

        if ((!q.address || q.address.trim() === '') && !q.placeId) {
            return
        }

        await when(() => this.GoogleMapsScriptHasLoaded);

        let results: GeocoderResult[] = [];

        try {
            results = await this.geocode(q)
        } catch (e) {
            this.errorStore.Report(e);
        }

        this.parseGeocoderResults(results, true);

    }

    protected geocode(q: google.maps.GeocoderRequest) {
        return new Promise<GeocoderResult[]>((resolve, reject) => {
            const geocoder = new google.maps.Geocoder();
            geocoder.geocode(q, (
                    results: google.maps.GeocoderResult[],
                    status: google.maps.GeocoderStatus) => {
                    if (status !== google.maps.GeocoderStatus.OK) {
                        this.errorStore.Report(Error(`Geocode failed for query [${JSON.stringify(q)}] with status: ${status}`))
                    }
                    resolve(results);
                    // TODO: Look into caching bounding boxes for places in the future.
                }
            );
        })
    }

    protected async geocodeCoordinates(location: {lat: number, lng: number}){

        // TODO: Additional parameter checks to ensure valid lat, lng.
        if (location.lat === 0 || location.lng === 0) {
            return
        }

        await when(() => this.GoogleMapsScriptHasLoaded);


        let results: GeocoderResult[] = [];

        try {
            results = await this.geocode({location})
        } catch (e) {
            this.errorStore.Report(e);
        }

        this.parseGeocoderResults(results, false);
    }

    @action
    protected parseGeocoderResults(results: google.maps.GeocoderResult[], updateCoordinates: boolean) {

        if (results.length === 0) {
            this.Locality = '';
            this.AdminAreaLong = '';
            this.AdminAreaShort = '';
            return;
        }
        for (const component of results[0].address_components) {
            if (component.types.indexOf('locality') !== -1) {
                this.Locality = component.long_name.replace(', United States', '');
            }
            if (component.types.indexOf('administrative_area_level_1') !== -1) {
                this.AdminAreaLong = component.long_name;
                this.AdminAreaShort = component.short_name;
            }
        }
        if (updateCoordinates) {
            this.coordinateStore.SetCoordinates(
                results[0].geometry.location.lat(),
                results[0].geometry.location.lng(),
            )
        }
    }


    protected fetchGoogleMapScript() {
        if (typeof google !== 'undefined' && typeof google.maps !== 'undefined') {
            this.setGoogleMapLoaded(true);
            return
        }

        const scriptNode = document.createElement('script');
        scriptNode.type = 'text/javascript';
        scriptNode.src = `https://maps.googleapis.com/maps/api/js?key=${
            process.env.REACT_APP_FLORACAST_GOOGLE_MAPS_API_KEY
            }&libraries=places&region=US,CA,MX`;
        scriptNode.onload = () => {
            this.setGoogleMapLoaded(true)
        };
        scriptNode.async = true;
        // scriptNode.defer = false;
        scriptNode.onerror = (event: ErrorEvent) => {
            this.errorStore.Report(event.error, {}, event.message);
        };
        document.body.appendChild(scriptNode);
    }

    @action
    protected setGoogleMapLoaded(b: boolean) {
        this.GoogleMapsScriptHasLoaded = b
    }

    protected dispose() {
        this.UnsubscribeGeocodeReaction()
    }

}