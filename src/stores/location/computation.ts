/* tslint:disable:max-classes-per-file */

import formatcoords from 'formatcoords';
import * as geolib from 'geolib';
import { computed } from 'mobx';
import {S2CellId, S2LatLng, S2RegionCoverer, Utils} from 'nodes2ts';
import {getGlobalModel} from "../globals";
import MLocationUserCoordinates from "./coordinate";
import MLocationMapCoordinates from "./map";

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


class MLocationComputations {

    protected readonly coordinateStore: MLocationUserCoordinates;

    constructor(namespace: string, mCoords: typeof MLocationUserCoordinates | typeof MLocationMapCoordinates) {
        this.coordinateStore = getGlobalModel(namespace, mCoords)
    }

    @computed
    public get StaticMapFunc(): {f: (
            width: number,
            height: number,
            zoom: number,
        ) => string | undefined} {

        const lat = this.coordinateStore.Latitude;
        const lng = this.coordinateStore.Longitude;

        const mapboxAPIPrefix: string = 'https://api.mapbox.com/styles/v1/mapbox';
        const mapboxStyle: string = 'cj44mfrt20f082snokim4ungi';
        const mapboxToken: string =
            process.env.REACT_APP_FLORACAST_MAPBOX_API_KEY || '';

        return {f: (
                width: number,
                height: number,
                zoom: number,
            ): string | undefined => {
                if (lat === 0 || lng === 0 || height === 0 || width === 0) {
                    return undefined
                }
                const prefix = `${mapboxAPIPrefix}/${mapboxStyle}/static/`;
                const suffix = `?access_token=${mapboxToken}&attribution=false&logo=false`;
                const c = prefix + `${lng},${lat},${zoom},0.00,0.00/${height}x${width}` + suffix;
                return c;
            }}
    }

    @computed
    public get DMS(): string {
        if (!this.coordinateStore.Latitude || !this.coordinateStore.Longitude) {
            return ''
        }
        return formatcoords(this.coordinateStore.Latitude, this.coordinateStore.Longitude).format(undefined, {
            decimalPlaces: 3,
            latLonSeparator: ' ',
        });
    }

    @computed
    public get CoveringAtLevelSeven(): string[] {

        const lat = this.coordinateStore.Latitude;
        const lng = this.coordinateStore.Longitude;
        const radius = this.coordinateStore.Radius;

        if (!radius || radius === 0 || lat === 0 || lng === 0) {
            return []
        }

        const region = Utils.calcRegionFromCenterRadius(
            S2LatLng.fromDegrees(lat, lng),
            radius
        );

        const coverer = new S2RegionCoverer().setMaxLevel(7).setMinLevel(7);

        return coverer.getInteriorCoveringCells(region).map((cellId) => cellId.toToken());
    }

    @computed
    public get Covering(): S2CellId[] {

        const lat = this.coordinateStore.Latitude;
        const lng = this.coordinateStore.Longitude;
        const radius = this.coordinateStore.Radius;

        if (!radius || radius === 0 || lat === 0 || lng === 0) {
            return []
        }

        const region = Utils.calcRegionFromCenterRadius(
            S2LatLng.fromDegrees(lat, lng),
            radius
        );

        const coverer = new S2RegionCoverer().setMaxCells(15);

        return coverer.getInteriorCoveringCells(region);

        // console.log(JSON.stringify(
        //   {
        //       features: cellIds.map((id) => {
        //         // const c = new S2Cell(id).id.parent();
        //         const p = new S2Cell(id)
        //         return p.toGEOJSON()
        //       }),
        //       type: "FeatureCollection"
        //   }
        // ))
        // return cellIds;
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
    public get BearingToFunc(): (lat: number, lng: number) => IBearing {

        return (latitude: number, longitude: number): IBearing => {

            const oLatitude = this.coordinateStore.Latitude;
            const oLongitude = this.coordinateStore.Longitude;

            const bearing = geolib.getBearing(
                {latitude: oLatitude, longitude: oLongitude},
                {latitude, longitude},
            );
            return {
                i: bearing,
                s: symbolFromBearing(bearing),
            };
        }
    }

}

export class MLocationMapComputations extends MLocationComputations {
    constructor(namespace: string) {
        super(namespace, MLocationMapCoordinates)
    }
}

export class MLocationUserComputations extends MLocationComputations {
    constructor(namespace: string) {
        super(namespace, MLocationUserCoordinates)
    }
}
