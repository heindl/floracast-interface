/* tslint:disable:max-classes-per-file no-submodule-imports */
import * as classNames from 'classnames';
import { divIcon } from 'leaflet';
import { observer } from 'mobx-react';
import * as React from 'react';
import {renderToString} from 'react-dom/server';
import * as ReactLeaflet from 'react-leaflet';
import {getGlobalModel} from "../../stores/globals";
import MLocationMapCoordinates from "../../stores/location/map";
import {GetColor} from "../../stores/timeline";
import { MView } from '../../stores/view';
import './PointMarker.css';
import ProtectedAreaTooltip from "./ProtectedAreaTooltip";


interface IPredictionDivIconProps {
    prediction: number;
    radius: number;
    // clusterCount: number,
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

        // const overlayEngaged = this.props.clusterCount > 1 && this.props.hovered;

        // const minRadiusForOverlay = 58;

        // const radius = overlayEngaged && minRadiusForOverlay > this.props.radius ? minRadiusForOverlay : this.props.radius;

        const radius = this.props.radius;

        const translate = (radius) - 6;

        // const opacityMultiplier = overlayEngaged ? 1 : 0.9;
        const opacityMultiplier = 0.9;

        return (

            <div
                className={classNames({
                    "prediction-marker": true,
                    // "prediction-marker-pulse": (this.props.hovered && this.props.clusterCount === 1),
                    "prediction-marker-pulse": this.props.hovered,
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
                    {/*{overlayEngaged &&*/}
                    {/*<div className="prediction-marker-cluster-overlay">*/}
                        {/*<h3>{this.props.clusterCount}</h3>*/}
                        {/*<h5>Areas</h5>*/}
                        {/*<h3>{Math.round(this.props.prediction * 100)}%</h3>*/}
                        {/*<h5>Confidence</h5>*/}
                    {/*</div>*/}
                    {/*}*/}
                </div>


            </div>
        )
    }

}

interface IPointMarkerProps {
    id: string,
    isHovered: boolean;
  point: GeoJSON.Feature<GeoJSON.Point>;
    tooltipSelected: boolean;
    zoom: number;
}

@observer
export default class PointMarker extends React.Component<
  IPointMarkerProps
> {

    constructor(props: IPointMarkerProps) {
        super(props);
    }

  public render() {

        const {properties} = this.props.point;
        if (!properties) {
            return null
        }

    const clusterCount = (properties.point_count || 1);
      // const clusterCount = 1;
    const prediction = (properties.predictionCount || 0) / clusterCount;
      // const prediction = properties.predictionCount || 0;

    // const radius =  (prediction * (Math.sqrt(clusterCount) * (this.props.zoom * 1.5)));
    // const radius = (prediction * prediction  * Math.sqrt(clusterCount)) * (this.props.zoom * 4);
      const radius = (prediction * prediction  * Math.sqrt(1)) * (this.props.zoom * 4);

      const lat = this.props.point.geometry.coordinates[1];
      const lng = this.props.point.geometry.coordinates[0];

    return (
      <ReactLeaflet.Marker
        icon={divIcon({
          className: 'prediction-marker-container',
          // Subtracting 6 to radius to offset padding added by Leaflet.
          html: renderToString(
              <PredictionDivIcon
                  prediction={prediction}
                  radius={radius}
                  // clusterCount={clusterCount}
                  hovered={this.props.isHovered}
              />
          ),
        })}
        onMouseOver={this.toggleHover}
        onMouseOut={this.toggleHover}
        position={{lat, lng}}
        onClick={this.handleClick}
      >
          {this.props.tooltipSelected &&
            <ProtectedAreaTooltip
                latitude={lat}
                longitude={lng}
                prediction={prediction}
            />
          }
      </ReactLeaflet.Marker>
    );
  }

  protected handleClick = (e: Event) => {
      const mCoords = getGlobalModel('default', MLocationMapCoordinates);
      const {properties} = this.props.point;

      if (properties && !properties.point_count) {
          getGlobalModel('default', MView).SetProtectedAreaToken(this.props.id);
      } else {
          const zoom = this.props.zoom + 1;
          const lat = this.props.point.geometry.coordinates[1];
          const lng = this.props.point.geometry.coordinates[0];
          mCoords.MoveMap(lat, lng, zoom);
      }
  };

  protected toggleHover = () => {
     getGlobalModel('default', MView).SetHoveredMapDivIcon(this.props.id)
  };
}