import * as React from 'react';
import {GetColor} from "../stores/timeline";
import './ConfidenceScale.css'

interface IConfidenceScaleProps{
    prediction: number;
    style?: object;
}

export default class ConfidenceScale extends React.Component<IConfidenceScaleProps> {
    public render() {

        const prediction = Math.round(this.props.prediction * 100);

        return (
            <svg className="confidence-scale-chart" viewBox="0 0 36 36" style={{...this.props.style}}>
                <path
                    d="M18 2.0845
                                a 15.9155 15.9155 0 0 1 0 31.831
                                a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#E0E0E0"
                    strokeWidth="3"/>
                <path
                    d="M18 2.0845
                                a 15.9155 15.9155 0 0 1 0 31.831
                                a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke={GetColor(this.props.prediction)}
                    strokeWidth="3"
                    strokeDasharray={`${prediction}, 100`}/>

            </svg>
        )
    }
}