import {DocumentSnapshot} from "@firebase/firestore-types";
import {action, observable} from 'mobx';
import {S2Cell, S2LatLng} from 'nodes2ts';
import MErrors from './errors';
import {getFireStoreRef} from './firestore';
import {getGlobalModel} from "./globals";

export default class ProtectedArea {

    public readonly Latitude: number;
    public readonly Longitude: number;


    @observable public AccessLevel: number = 0;
    @observable public Designation: string = '';
    @observable public Name: string = '';
    @observable public Owner: string = '';
    @observable public ProtectedLevel: number = 0;
    @observable public SquareKilometers: number = 0;

    @observable public IsLoading: boolean = false;

    @observable public DistanceKilometers: number = 0;

    protected readonly namespace: string;
    protected fetched?: boolean;
    // protected mCoords: CoordinateStore;

    // protected unsubscribeDistance: IReactionDisposer;

    constructor(namespace: string, lat: number, lng: number) {
        this.namespace = namespace;
        this.Latitude = lat;
        this.Longitude = lng;

        // this.unsubscribeDistance = autorun(() => {
        //   this.setDistanceKilometers(haversine(
        //       [this.Latitude, this.Longitude],
        //       [this.mCoords.Latitude, this.mCoords.Longitude],
        //       {
        //           format: '[lat,lon]',
        //           unit: 'km',
        //       }))
        // });


    }

    public IndexKey(): string {
        return JSON.stringify([this.Longitude, this.Latitude], (key, val) => {
            return val.toFixed ? Number(val.toFixed(4)) : val;
        });
    }

    public Hydrate() {

        if (this.fetched) {
            return
        }

        const token = S2Cell.fromLatLng(
            S2LatLng.fromDegrees(this.Latitude, this.Longitude)
        ).id.parentL(16).toToken();

        if (this.Name && this.Name !== '') {
            return
        }

        this.SetLoading(true);

        getFireStoreRef(this.namespace)
            .collection('ProtectedAreas')
            .doc(token)
            .get()
            .then((doc) => {
                this.SetProtectedAreaData(doc);
                this.SetLoading(false);
                this.fetched = true;
            })
            .catch((err) => {
                getGlobalModel(this.namespace, MErrors).Report(err);
                this.SetLoading(false);
                this.fetched = true;
            });
    }

    @action
    public SetDistanceKilometers(distance: number) {
        this.DistanceKilometers = distance;
    }

    @action
    public SetSquareKilometersArea(sqKM: number) {
        this.SquareKilometers = sqKM;
    }

    @action
    protected SetLoading(b: boolean) {
        this.IsLoading = b;
    }

    @action
    protected SetProtectedAreaData(doc: DocumentSnapshot) {
        this.AccessLevel = doc.get('AccessLevel');
        this.Designation = doc.get('Designation');
        this.Name = doc.get('Name');
        this.Owner = doc.get('Owner');
        this.ProtectedLevel = doc.get('ProtectedLevel');
        this.SquareKilometers = doc.get('SquareKilometers');
    }
}