import {DocumentSnapshot} from "@firebase/firestore-types";
import { action, observable } from 'mobx';
import {ErrorStore, getErrorStore} from "./errors";
import {getFireStoreRef} from "./firestore";
import ProtectedArea from './protected-area';

export default class Taxon {

  public readonly NameUsageID: string;
  @observable public FetchIsPending: boolean = false;
  @observable public HasHover: boolean = false;

  @observable public CommonName: string = '';
  @observable public ScientificName: string = '';
  @observable public PhotoURL: string = '';

  @observable public Description?: IDescription;

  @observable public ProtectedArea: ProtectedArea;

  @observable public Prediction: number = 0;

    protected photo?: IPhoto;
    protected readonly namespace: string;
    protected errorStore: ErrorStore;

    constructor(nameUsageId: string, namespace: string, protectedAreaToken?: string) {
        this.namespace = namespace;
        this.NameUsageID = nameUsageId;
        this.errorStore = getErrorStore(namespace);

        if (protectedAreaToken) {
            this.ProtectedArea = new ProtectedArea(protectedAreaToken, namespace)
        }

        const fireStoreRef = getFireStoreRef(namespace);

        fireStoreRef
            .collection('Taxa')
            .doc(nameUsageId)
            .get()
            .then((snap) => this.setFirestoreData(snap))
            .catch((error) => this.errorStore.Report(error));
    }

  @action
  public SetPrediction(prediction: number) {
    this.Prediction = prediction;
  }
  // protected pointType: point.PointType;
  // protected pointCount: number = 0;
  // protected predictionSum: number = 0;
  // protected predictionAverage: number = 0;
  // protected sortValue: number = 0;
  // protected nearestDistance: number = 0;
  // @observable protected nearestPointCoordinates: [number, number] = [0, 0];

  @action
  public ToggleHover() {
    this.HasHover = !this.HasHover;
  }

  // get SortValue() {
  //   return this.sortValue;
  // }

  @action
  protected setFirestoreData(snap: DocumentSnapshot) {
    this.CommonName = snap.get('CommonName');
    this.ScientificName = snap.get('ScientificName');
    this.PhotoURL = snap.get('IPhoto.Large');
    this.Description = snap.get("Description")
    // if (photoUrl) {
    //   this.PhotoURL = `url(${photoUrl})`;
    // }
  }

  // @action
  // public set FactorPoint(p: point.Point) {
  //   this.pointType = p.PointType;
  //   this.pointCount += 1;
  //   this.predictionSum += p.Prediction || 0;
  //   if (this.predictionSum > 0) {
  //     this.predictionAverage = this.predictionSum / this.pointCount;
  //   }
  //   if (this.nearestDistance <= p.Distance || this.nearestDistance === 0) {
  //     this.nearestDistance = p.Distance;
  //     this.nearestPointCoordinates = [p.Latitude, p.Longitude];
  //     this.setProtectedArea();
  //   }
  //   this.sortValue =
  //     this.nearestDistance - this.predictionAverage * 100 - this.pointCount;
  // }
}

export interface IPhoto {
  readonly Citation?: string;
  readonly Large: string;
  readonly Thumbnail?: string;
}

export interface IDescription {
  readonly Citation?: string;
  readonly Text: string;
}
