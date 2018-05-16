import {bounds} from "@mapbox/geo-viewport";
import * as geolib from "geolib";
import * as _ from 'lodash';
import {action, IReactionDisposer, observable, reaction} from 'mobx';
import {getGlobalModel} from "../globals";
import {MRouter} from "../router";
import MLocationUserCoordinates from "./coordinate";

export const ZoomMinimum = 1;
export const ZoomDefault = 9;

const TileSize = 256;

export default class MLocationMapCoordinates extends MLocationUserCoordinates{

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
        this.SetZoom(this.Zoom + amount);
    }

    @action
    public SetZoom(amount: number){
        if (amount < ZoomMinimum) {
            amount = ZoomMinimum
        }
        if (this.Zoom === amount) {
            return
        }
        this.Zoom = amount;
        getGlobalModel(this.namespace, MRouter).UpdateCurrentPath({
            zoom: amount
        })
    }


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