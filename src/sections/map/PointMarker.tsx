/* tslint:disable:max-classes-per-file no-submodule-imports */
import * as classNames from 'classnames';
import * as GeoJSON from "geojson";
import { divIcon } from 'leaflet';
import { inject, observer } from 'mobx-react';
import * as React from 'react';
import {renderToString} from 'react-dom/server';
import * as ReactLeaflet from 'react-leaflet';
import {CoordinateStore} from "../../stores/coordinates";
import {GetColor} from "../../stores/timeline";
import { ViewStore } from '../../stores/view';
import './PointMarker.css';
import ProtectedAreaTooltip from "./ProtectedAreaTooltip";


interface IPredictionDivIconProps {
    prediction: number;
    radius: number;
    clusterCount: number,
    hovered: boolean;
}

// TODO: Thanks this guy for this recommendation:
// https://medium.com/@nikjohn/creating-a-dynamic-jsx-marker-with-react-leaflet-f75fff2ddb9
class PredictionDivIcon extends React.Component<IPredictionDivIconProps> {

    // constructor(props: PredictionDivIconProps) {
    //     super(props);
    //     this.state = {hovered: false}
    // }

    public render() {

        const overlayEngaged = this.props.clusterCount > 1 && this.props.hovered;

        const minRadiusForOverlay = 58;

        const radius = overlayEngaged && minRadiusForOverlay > this.props.radius ? minRadiusForOverlay : this.props.radius;

        const translate = (radius) - 6;

        const opacityMultiplier = overlayEngaged ? 1 : 0.9;

        return (

            <div
                className={classNames({
                    "prediction-marker": true,
                    "prediction-marker-pulse": (this.props.hovered && this.props.clusterCount === 1),
                })}
                style={{
                    height: radius * 2,
                    overflow: "visible",
                    transform: `translate(-${translate}px, -${translate}px)`,
                    width: radius * 2,
                }}
            >
                <div
                    className="prediction-marker-inner-1"
                    style={{
                        background: `radial-gradient(
                            ellipse at center,
                            ${GetColor(this.props.prediction)} 0%,
                            rgba(255, 255, 255, 0) 100%
                        )`,
                        // cursor: this.props.clusterCount > 1 ? "auto" : "pointer",
                        height: radius * 2,
                        opacity: this.props.prediction * opacityMultiplier,
                        width: radius * 2,
                    }}>
                    {overlayEngaged &&
                    <div className="prediction-marker-cluster-overlay">
                        <h3>{this.props.clusterCount}</h3>
                        <h5>Areas</h5>
                        <h3>{Math.round(this.props.prediction * 100)}%</h3>
                        <h5>Confidence</h5>
                    </div>
                    }
                </div>


            </div>
        )
    }

}

interface IPointMarkerProps {
  point: GeoJSON.Feature<GeoJSON.Point>;
  namespace: string;
  viewStore?: ViewStore;
    coordinateStore?: CoordinateStore;
    id: string;
}

@inject('viewStore', 'coordinateStore')
@observer
export default class PointMarker extends React.Component<
  IPointMarkerProps
> {

    constructor(props: IPointMarkerProps) {
        super(props);
    }

  public render() {

    const { viewStore, coordinateStore } = this.props;
    if (!viewStore || !coordinateStore) {
      return null;
    }

    const {properties, geometry} = this.props.point;
    if (!properties) {
      return
    }

    const clusterCount = (properties.point_count || 1);
    const prediction = (properties.predictionCount || 0) / clusterCount;

    // const radius =  (prediction * (Math.sqrt(clusterCount) * (this.props.zoom * 1.5)));
    const radius = (prediction * prediction  * Math.sqrt(clusterCount)) * (coordinateStore.Zoom * 4);

    return (
      <ReactLeaflet.Marker
        icon={divIcon({
          className: 'prediction-marker-container',
          // Subtracting 6 to radius to offset padding added by Leaflet.
          html: renderToString(
              <PredictionDivIcon
                  prediction={prediction}
                  radius={radius}
                  clusterCount={clusterCount}
                  hovered={viewStore.HoveredMapDivIcon === this.props.id}
              />
          ),
        })}
        onMouseOver={this.toggleHover}
        onMouseOut={this.toggleHover}
        position={{lat: geometry.coordinates[1], lng: geometry.coordinates[0]}}
        onClick={this.handleClick}
      >
          {clusterCount === 1 &&
            <ProtectedAreaTooltip
                latitude={geometry.coordinates[1]}
                longitude={geometry.coordinates[0]}
                prediction={prediction}
                namespace={this.props.namespace}
                token={properties.id}
            />
          }
      </ReactLeaflet.Marker>
    );
  }

  protected handleClick = (e: Event) => {

     const featureProps = this.props.point.properties;
     if (!featureProps) {
         return
     }

      const token = featureProps.id;

      if (token) {
          if (this.props.viewStore) {
              this.props.viewStore.SetProtectedAreaToken(token)
          }
      } else {
          if (this.props.coordinateStore) {
              this.props.coordinateStore.SetPosition(
                  this.props.point.geometry.coordinates[1],
                  this.props.point.geometry.coordinates[0],
                  this.props.coordinateStore.Zoom + 1
              );
          }
      }
  }

  protected toggleHover = () => {
        if (this.props.viewStore) {
            const isHovered = this.props.viewStore.HoveredMapDivIcon === this.props.id;
            this.props.viewStore.SetHoveredMapDivIcon(isHovered ? this.props.id : '')
        }
    };
}