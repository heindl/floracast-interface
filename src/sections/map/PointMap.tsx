/* tslint:disable:max-classes-per-file */
import * as Leaflet from "leaflet";
import { inject, observer } from 'mobx-react';
import * as React from 'react';
import * as ReactLeaflet from 'react-leaflet';
import Icon from '../../iconography/Icon';
import {Minus, Navigate, Plus} from '../../iconography/Icons';
import { CoordinateStore } from '../../stores/coordinates';
import { PointStore } from '../../stores/points';
import {PointType, ViewStore} from "../../stores/view";
// Copy css from https://unpkg.com/leaflet@1.3.1.css
// Ensure that relative image links are replaced with prepended with https://unpkg.com/leaflet@1.3.1/dist/.
import './leaflet@1.3.1.css';
import './PointMap.css';
import PointMarker from './PointMarker';


interface IPredictionFeatureGroupProps {
    predictionPointStore?: PointStore;
    namespace: string;
}

@inject('predictionPointStore')
@observer
class PredictionFeatureGroup extends React.Component<IPredictionFeatureGroupProps> {
    public render() {
        const {predictionPointStore} = this.props;
        if (!predictionPointStore) {
            return null
        }
        return (
            <ReactLeaflet.FeatureGroup>
                {predictionPointStore.MapPoints.map((point) => {
                    const key = point.properties && (point.properties.cluster_id || point.properties.id);
                    return (
                        <PointMarker
                            key={key}
                            id={key}
                            point={point}
                            namespace={this.props.namespace}
                        />
                    );
                })}
            </ReactLeaflet.FeatureGroup>
        )
    }
}

interface IOccurrenceFeatureGroupProps {
    occurrencePointStore?: PointStore;
    namespace: string;
}

@inject('occurrencePointStore')
@observer
class OccurrenceFeatureGroup extends React.Component<IOccurrenceFeatureGroupProps> {
    public render() {
        const {occurrencePointStore} = this.props;
        if (!occurrencePointStore) {
            return null
        }
        return (
            <ReactLeaflet.FeatureGroup>
                {occurrencePointStore.MapPoints.map((point) => {
                    return (
                        <ReactLeaflet.CircleMarker
                            key={point.properties && point.properties.id}
                            center={[point.geometry.coordinates[1], point.geometry.coordinates[0]]}
                            radius={10}
                            fill={true}
                            fillColor={'rgba(213, 55, 106,1)'}
                            opacity={0.5}
                        />
                    );
                })}
            </ReactLeaflet.FeatureGroup>
        )
    }
}

interface IPointMapProps {
  coordinateStore?: CoordinateStore;
  occurrencePointStore?: PointStore;
    predictionPointStore?: PointStore;
    viewStore?: ViewStore;
  namespace: string;
}

interface IPointMapState {
  mapReady: boolean;
}

@inject('coordinateStore', 'occurrencePointStore', 'predictionPointStore', 'viewStore')
@observer
export default class PointMap extends React.Component<
  IPointMapProps,
  IPointMapState
> {
  // public handleMoveEnd = (e) => {
  //   if (this.props.coordinateStore) {
  //     this.props.coordinateStore.SetPosition(
  //       e.target.getCenter().lat,
  //       e.target.getCenter().lng,
  //         e.target.getZoom(),
  //     );
  //   }
  // }
  //
  // public handleZoomEnd = (e) => {
  //   if (this.props.coordinateStore) {
  //     this.props.coordinateStore.SetZoom(e.target.getZoom());
  //   }
  // }

  constructor(props: IPointMapProps) {
    super(props);
    this.state = {
      mapReady: false,
    };
  }

  public render() {
    const { coordinateStore, predictionPointStore, occurrencePointStore, viewStore } = this.props;

    if (!coordinateStore || !predictionPointStore || !occurrencePointStore || !viewStore) {
      return null;
    }
    return (
      <ReactLeaflet.Map
        whenReady={this.handleMapReady}
        onMoveend={this.handleMapMove}
        onZoomend={this.handleMapMove}
        zoomControl={false}
        center={[coordinateStore.Latitude, coordinateStore.Longitude]}
        id="point-map"
        style={{
          height: "100%", // Note that leaflet will break if this is not included.
          position: "relative", // Note that leaflet adds this.
          width: "100%",
        }}
        zoom={coordinateStore.Zoom}
      >
        <div id="point-map-zoom-control">
          <Icon
              color="#696969"
              icon={Navigate}
              onClick={coordinateStore.Geolocate}
          />
          <Icon
              color="#696969"
              icon={Plus}
              onClick={coordinateStore.IncrementZoom}
          />
          <Icon
            icon={Minus}
            color={coordinateStore.Zoom <= 6 ? "#eee" : "#696969"}
            activeColor={coordinateStore.Zoom <= 6 ? "#eee" : "#000"}
            onClick={coordinateStore.DecrementZoom}
          />
        </div>
        <ReactLeaflet.TileLayer
          style={{ width: '100vw', height: '100vh' }}
          url={`https://api.mapbox.com/styles/v1/mapbox/outdoors-v9/tiles/256/{z}/{x}/{y}?access_token=${
            process.env.REACT_APP_FLORACAST_MAPBOX_API_KEY
          }`}
          // attribution="&copy; <a href=http://osm.org/copyright>OpenStreetMap</a> contributors"
        />
          {(this.state.mapReady && viewStore.PointType === PointType.Predictions) &&
            <PredictionFeatureGroup namespace={this.props.namespace} />
          }
          {(this.state.mapReady && viewStore.PointType === PointType.Occurrences) &&
              <OccurrenceFeatureGroup namespace={this.props.namespace} />
          }
      </ReactLeaflet.Map>
    );
  }

  protected handleMapReady = () => {
      this.setState({ mapReady: true })
  };

  protected handleMapMove = (e: Leaflet.LeafletEvent) => {
      if (this.props.coordinateStore) {
          this.props.coordinateStore.SetPosition(
              e.target.getCenter().lat,
              e.target.getCenter().lng,
              e.target.getZoom(),
          )
      }
  }
}



