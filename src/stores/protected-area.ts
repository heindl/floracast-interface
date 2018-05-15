import {DocumentSnapshot, FirebaseFirestore} from "@firebase/firestore-types";
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
  protected fireStoreRef: FirebaseFirestore;
  protected errorStore: MErrors;
  // protected mCoords: CoordinateStore;

  // protected unsubscribeDistance: IReactionDisposer;



    constructor(idToken: string, namespace: string) {
        this.namespace = namespace;
        this.TokenID = idToken;

        this.fireStoreRef = getFireStoreRef(namespace);
        this.errorStore = getGlobalModel(namespace, MErrors);
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

        this.fireStoreRef
            .collection('ProtectedAreas')
            .doc(this.TokenID)
            .get()
            .then((doc) => {
                this.SetProtectedAreaData(doc);
                this.SetLoading(false);
            })
            .catch((err) => {
                this.errorStore.Report(err);
                this.SetLoading(false);
            });
    }

    @action
    public SetDistanceKilometers(distance: number){
        this.DistanceKilometers = distance;
    }

    @action
    public SetSquareKilometersArea(sqKM: number){
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



  // @computed
  // public StaticMapFunc(): (height: number, width: number): string {
  //   if (height === 0 || width === 0) {
  //     throw Error(
  //       `Invalid static map height [${height}] and width [${width}].`
  //     );
  //   }
  //   const mCoords = getCoordinateStore(this.namespace);
  //   const bearing = mCoords.BearingTo(this.Latitude, this.Longitude);
  //
  //   return {
  //     Bearing: bearing.i,
  //     BearingSymbol: bearing.s,
  //     Distance: mCoords.DistanceKilometers(
  //       this.Latitude,
  //       this.Longitude
  //     ),
  //     URL: mapboxURL(this.Latitude, this.Longitude, width, height),
  //   };
  // }

    // protected dispose() {
    //     this.unsubscribeDistance();
    // };


}

// interface StaticMap {
//   URL: string;
//   Bearing: number;
//   BearingSymbol: string;
//   Distance: number;
// }
//
// const mapboxAPIPrefix: string = 'https://api.mapbox.com/styles/v1/mapbox';
// const mapboxStyle: string = 'outdoors-v9';
// const mapboxToken: string =
//   process.env.REACT_APP_FLORACAST_MAPBOX_API_KEY || '';
//
// function mapboxURL(
//   latitude: number,
//   longitude: number,
//   width: number,
//   height: number
// ): string {
//   const prefix = `${mapboxAPIPrefix}/${mapboxStyle}/static/`;
//   const suffix = `?access_token=${mapboxToken}&attribution=false&logo=false`;
//
//   return prefix + `${latitude},${longitude},9,0,0/${width}x${height}` + suffix;
// }
