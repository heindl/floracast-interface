import {DocumentSnapshot} from "@firebase/firestore-types";
import {action, observable} from 'mobx';
import { S2CellId } from 'nodes2ts';
import MErrors from './errors';
import {getFireStoreRef} from './firestore';
import {getGlobalModel} from "./globals";

export default class ProtectedArea {

    public readonly Latitude: number;
    public readonly Longitude: number;
    public readonly TokenID: string;

    @observable public AccessLevel: number = 0;
    @observable public Designation: string = '';
    @observable public Name: string = '';
    @observable public Owner: string = '';
    @observable public ProtectedLevel: number = 0;
    @observable public SquareKilometers: number = 0;

    @observable public IsLoading: boolean = false;

    @observable public DistanceKilometers: number = 0;

    protected readonly namespace: string;
    // protected mCoords: CoordinateStore;

    // protected unsubscribeDistance: IReactionDisposer;

    constructor(idToken: string, namespace: string) {
        this.namespace = namespace;
        this.TokenID = idToken;
        // this.mCoords = getCoordinateStore(namespace);

        const coords = S2CellId.fromToken(idToken).toLatLng();

        this.Latitude = coords.latDegrees.toNumber();
        this.Longitude = coords.lngDegrees.toNumber();

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

    public Hydrate() {

        if (this.Name && this.Name !== '') {
            return
        }

        this.SetLoading(true);

        getFireStoreRef(this.namespace)
            .collection('ProtectedAreas')
            .doc(this.TokenID)
            .get()
            .then((doc) => {
                this.SetProtectedAreaData(doc);
                this.SetLoading(false);
            })
            .catch((err) => {
                getGlobalModel(this.namespace, MErrors).Report(err);
                this.SetLoading(false);
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