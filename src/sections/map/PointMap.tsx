/* tslint:disable:max-classes-per-file */
import {bounds} from "@mapbox/geo-viewport";
import * as Leaflet from "leaflet";
import { observer } from 'mobx-react';
import * as React from 'react';
import * as ReactLeaflet from 'react-leaflet';
import Icon from '../../iconography/Icon';
import {Minus, Navigate, Plus} from '../../iconography/Icons';
import {MTime} from "../../stores/date";
import {getGlobalModel} from "../../stores/globals";
import MLocationMapCoordinates, {TileSize} from "../../stores/location/map";
import {MMapOccurrences, MMapPredictions} from '../../stores/points';
import {MView, PointType} from "../../stores/view";
// Copy css from https://unpkg.com/leaflet@1.3.1.css
// Ensure that relative image links are replaced with prepended with https://unpkg.com/leaflet@1.3.1/dist/.
import './leaflet@1.3.1.css';
import './PointMap.css';
import PointMarker from './PointMarker';


@observer
class PredictionFeatureGroup extends React.Component {
    public render() {
        const mPredictions = getGlobalModel('default', MMapPredictions);
        const mView = getGlobalModel('default', MView);
        const dateString = getGlobalModel('default', MTime).DateString;
        const mCoords = getGlobalModel('default', MLocationMapCoordinates);

        if (mView.PointType !== PointType.Predictions) {
            return null
        }

        const b = bounds([mCoords.Longitude, mCoords.Latitude], mCoords.Zoom, mCoords.ViewPort, TileSize);

        let points: Array<GeoJSON.Feature<GeoJSON.Point>> = [];
        if (!mPredictions.IsLoading) {
            points = mPredictions.GetPoints(b, mCoords.Zoom, dateString)
        }

        return (
            <ReactLeaflet.FeatureGroup>
                {points.map((point) => {
                    if (!point.properties) {
                        return null
                    }

                    const id = JSON.stringify(point.geometry.coordinates, (key, val) => {
                        return val.toFixed ? Number(val.toFixed(4)) : val;
                    });
                    return (
                        <PointMarker
                            id={id}
                            key={id}
                            point={point}
                            isHovered={
                                mView.HoveredMapDivIcon !== '' &&
                                mView.HoveredMapDivIcon === id
                            }
                            tooltipSelected={
                                mView.ProtectedAreaToken !== '' &&
                                mView.ProtectedAreaToken === id
                            }
                            zoom={mCoords.Zoom}
                        />
                    );
                })}
            </ReactLeaflet.FeatureGroup>
        )
    }
}

@observer
class OccurrenceFeatureGroup extends React.Component {

    public render() {

        const mPredictions = getGlobalModel('default', MMapOccurrences);
        const mView = getGlobalModel('default', MView);
        const dateString = getGlobalModel('default', MTime).DateString;
        const mCoords = getGlobalModel('default', MLocationMapCoordinates);

        if (mView.PointType !== PointType.Occurrences) {
            return null
        }

        const b = bounds([mCoords.Longitude, mCoords.Latitude], mCoords.Zoom, mCoords.ViewPort, TileSize);

        let points: Array<GeoJSON.Feature<GeoJSON.Point>> = [];
        if (!mPredictions.IsLoading) {
            points = mPredictions.GetPoints(b, mCoords.Zoom, dateString)
        }

        return (
            <ReactLeaflet.FeatureGroup>
                {points.map((point) => {

                    if (!point.properties) {
                        return null
                    }

                    return (
                        <ReactLeaflet.CircleMarker
                            key={point.properties.occurrenceId}
                            center={[point.geometry.coordinates[1], point.geometry.coordinates[0],]}
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

interface IPointMapState {
  mapReady: boolean;
}

@observer
export default class PointMap extends React.Component<
    any,
  IPointMapState
> {

  constructor(props: any) {
    super(props);
    this.state = {
      mapReady: false,
    };
  }

  public render() {

      const mCoords = getGlobalModel('default', MLocationMapCoordinates);
    return (
      <ReactLeaflet.Map
        whenReady={this.handleMapReady}
        onMoveend={this.handleMapMove}
        onZoomend={this.handleMapMove}
        zoomControl={false}
        center={[mCoords.Latitude, mCoords.Longitude]}
        id="point-map"
        style={{
          height: "100%", // Note that leaflet will break if this is not included.
          position: "relative", // Note that leaflet adds this.
          width: "100%",
        }}
        zoom={mCoords.Zoom}
      >
        <div id="point-map-zoom-control">
          <Icon
              color="#696969"
              icon={Navigate}
              onClick={this.geolocate}
          />
          <Icon
              color="#696969"
              icon={Plus}
              onClick={this.zoomIn}
          />
          <Icon
            icon={Minus}
            color={mCoords.Zoom <= 6 ? "#eee" : "#696969"}
            activeColor={mCoords.Zoom <= 6 ? "#eee" : "#000"}
            onClick={this.zoomOut}
          />
        </div>
        <ReactLeaflet.TileLayer
          style={{ width: '100vw', height: '100vh' }}
          url={`https://api.mapbox.com/styles/v1/mapbox/outdoors-v9/tiles/256/{z}/{x}/{y}?access_token=${
            process.env.REACT_APP_FLORACAST_MAPBOX_API_KEY
          }`}
          // attribution="&copy; <a href=http://osm.org/copyright>OpenStreetMap</a> contributors"
        />
          {this.state.mapReady &&
            <PredictionFeatureGroup />
          }
          {this.state.mapReady &&
              <OccurrenceFeatureGroup />
          }
      </ReactLeaflet.Map>
    );
  }

    protected geolocate = () => {
        getGlobalModel('default', MLocationMapCoordinates).Geolocate()
    };

  protected zoomIn = () => {
      getGlobalModel('default', MLocationMapCoordinates).IncrementZoom(1)
  }

    protected zoomOut = () => {
        getGlobalModel('default', MLocationMapCoordinates).IncrementZoom(-1)
    }

  protected handleMapReady = () => {
      this.setState({ mapReady: true })
  };

  protected handleMapMove = (e: Leaflet.LeafletEvent) => {
      const mCoords = getGlobalModel('default', MLocationMapCoordinates);
      mCoords.MoveMap(
          e.target.getCenter().lat,
          e.target.getCenter().lng,
          e.target.getZoom(),
      );
  }
}



