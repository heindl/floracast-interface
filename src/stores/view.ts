import * as _ from 'lodash';
import { action, observable } from 'mobx';

export enum PointType {
  Occurrences = 'Occurrences',
  Predictions = 'Predictions',
}

export enum InFocusField {
  FieldNone,
  FieldPointType,
  FieldTaxon,
  FieldDate,
  FieldPlace,
}

export class MView {
    static get global(): string {
        return "MView";
    }

    @observable public TaxonCardVisible: boolean = false;
    @observable public PointType: PointType = PointType.Predictions;
    @observable public InFocusField: InFocusField = InFocusField.FieldNone;
    @observable public TimelineIsVisible: boolean = true;
    @observable public ProtectedAreaToken: string = '';
    @observable public HoveredMapDivIcon: string = '';
    @observable public Section: 'map' | 'forecast' | 'home' | 'static';

  protected readonly namespace: string;

    constructor(namespace: string) {
        this.namespace = namespace;
    }

  @action
  public SetProtectedAreaToken(token: string) {
    if (this.ProtectedAreaToken !== token) {
      this.ProtectedAreaToken = token;
    }
  }

  @action
    public SetSection(s: 'map' | 'forecast' | 'home' | 'static') {
        if (this.Section !== s) {
            this.Section = s;
        }
    }

    @action
    public SetHoveredMapDivIcon(key: string) {
        if (this.HoveredMapDivIcon !== key) {
            this.HoveredMapDivIcon = key;
        }
    }

  @action
  public SetPointTypeFromString(pointType: string) {
    pointType = _.capitalize(pointType);
    const isSupported = pointType in PointType;
    if (!isSupported) {
      throw Error(`Unrecognized PointType [${pointType}]`);
    }
    this.PointType =
      pointType === PointType.Occurrences
        ? PointType.Occurrences
        : PointType.Predictions;
  }

  @action
  public SetPointType(pointType: PointType) {
    if (this.PointType !== pointType) {
      this.PointType = pointType;
    }
  }

  @action
  public SetInFocusField(field: InFocusField) {
    if (this.InFocusField !== field) {
      this.InFocusField = field;
    }
  }

    @action
    public ShowTaxonCard() {
      this.TaxonCardVisible = true
    }

    @action
    public HideTaxonCard() {
        this.TaxonCardVisible = false
    }

  @action
  public ToggleTimelineVisibility() {
    this.TimelineIsVisible = !this.TimelineIsVisible;
  }

  // TODO: This function is inefficient because it updates each time any parameter has changed.
  // Should store NameUsage and only look after.
  // @computed
  // public get NavigationTitle(): string {
  //   const taxaStore = getTaxaStore(this.namespace);
  //   const dateStore: MTime = getDateStore(this.namespace);
  //   const selectedTaxon = taxaStore.Selected;
  //   const formattedDate = dateStore.Formatted;
  //
  //   const sections = [this.PointType.toString()];
  //   if (selectedTaxon) {
  //     sections.push(selectedTaxon.CommonName || selectedTaxon.ScientificName);
  //   }
  //   sections.push(formattedDate);
  //   return sections.join(' • ');
  // }
}
