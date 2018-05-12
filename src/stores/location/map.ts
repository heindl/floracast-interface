import {bounds} from "@mapbox/geo-viewport";
import * as geolib from "geolib";
import * as _ from 'lodash';
import {action, IReactionDisposer, observable, reaction} from 'mobx';
import LocationCoordinateStore from "./coordinate";

export const ZoomMinimum = 6;
export const ZoomDefault = 9;

const TileSize = 256;

export default class LocationMapCoordinateStore extends LocationCoordinateStore{

    @observable
    public Zoom: number = ZoomDefault;

    @observable
    public ViewPort: [number, number] = [0, 0]; // [x, y]

    protected UnsubscribeRadiusReaction: IReactionDisposer;

    constructor(namespace: string) {
        super(namespace);
        this.handleWindowWidthChange = this.handleWindowWidthChange.bind(this);
        window.onresize = _.debounce(this.handleWindowWidthChange, 250);
        // Call to set initial.
        this.handleWindowWidthChange();

        this.UnsubscribeRadiusReaction = reaction(
            () => {
                return {
                    lat: this.Latitude,
                    lng: this.Longitude,
                    viewPort: this.ViewPort,
                    zoom: this.Zoom,
                }
            },
            (i) => this.radiusReaction(i),
            {
                fireImmediately: true,
                name: `Radius Reaction`
            },
        )

    }

    public IncrementZoom(amount: number){
        const next = this.Zoom + amount;
        this.SetZoom(next);
    }

    @action
    public SetZoom(amount: number){
        if (amount < ZoomMinimum) {
            amount = ZoomMinimum
        }
        if (this.Zoom === amount) {
            return
        }
        this.Zoom = amount
    }

    // public FromPath(loc: string) {
    //     const commaMatches = loc.match(/,/gi);
    //     if (
    //         !commaMatches ||
    //         commaMatches.length === 0 ||
    //         !loc.startsWith('@') ||
    //         !loc.endsWith('z')
    //     ) {
    //         throw Error(
    //             `Could not construct location with invalid path parameter [${loc}]`
    //         );
    //     }
    //     const divisions: string[] = loc
    //         .replace('@', '')
    //         .replace('z', '')
    //         .split(',');
    //     this.SetCoordinates(parseFloat(divisions[0]), parseFloat(divisions[1]));
    //     this.SetZoom(parseInt(divisions[2], 10));
    // }


    // TODO:
    // Develop an efficient way of fetching new records when the view pans.
    // - Exclude the area already fetched, filter that which was removed, and fetch for new area.
    // Replace with GoogleMaps to save loading an additional library.
    protected radiusReaction(i: {
        lat: number;
        lng: number;
        zoom: number;
        viewPort: [number, number];
    }) {
        const b = bounds([i.lng, i.lat], i.zoom, i.viewPort, TileSize);
        // return new Bounds({
        //   e: b[2],
        //   n: b[3],
        //   s: b[1],
        //   w: b[0],
        // });
        const dist = geolib.getDistance(
            {latitude: i.lat, longitude: i.lng},
            {latitude: i.lat, longitude: b[0]}
            );
        this.SetRadius(dist === 0 ? dist : dist / 1000);
    }

    @action
    protected handleWindowWidthChange() {
        if (
            window.innerWidth === this.ViewPort[0] &&
            window.innerHeight === this.ViewPort[0]
        ) {
            return;
        }
        this.ViewPort = [window.innerWidth, window.innerHeight];
    }

    protected dispose() {
        this.UnsubscribeRadiusReaction();
    };

    // @computed
    // public get Formatted(): string{
    //     if (!this.Latitude || !this.Longitude) {
    //         return ''
    //     }
    //     return `@${this.Latitude.toFixed(6)},${this.Longitude.toFixed(6)},${
    //         this.Zoom
    //         }z`;
    // }

}