import * as React from 'react';
import {Link} from "react-router-dom";
import RandomGeoClusters from "../../iconography/RandomGeoClusters";
import Wreath from "../../iconography/Wreath";
import {getGlobalModel} from "../../stores/globals";
import {MView} from "../../stores/view";
import BetaForm from './BetaForm';
import './Home.css';
import Masthead from './Masthead';

export default class Home extends React.Component {

  public componentDidMount() {
      getGlobalModel('default', MView).SetSection('forecast');
    window.scrollTo(0, 0);
  }

  public render() {

    return (
          <div>
          <Masthead />
        <div id="home-container">
            <div className="home-section-row" style={{
                display: "flex",
                justifyContent: "space-between"
            }}>
                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    width: "45%",
                }}>
                    <h3>1. Life is a Mystery</h3>
                      <h4 className="paragraph">
                          There are things happening in the woods near you that don't last long.
                      </h4>
                    <h4 className="paragraph">These are the best times to get out of the city, and yet how would you know?</h4>
                    <h4 className="paragraph">Dozens of sites will notify you about a concert, but none will tell you about the symphony of life in the woods. Going hiking today is like going to a venue and hoping a good band would be playing.</h4>
                    <h4 className="paragraph">Even the experts struggle because climate change is disrupting the experience of generations.</h4>
                </div>

                <div style={{
                    border: "5px solid #000",
                    width: "45%",
                }}>

                    <RandomGeoClusters
                        width={"100%"}
                        height={"100%"}
                        radiusRange={[4, 8]}
                        countRange={[15, 25]}
                        viewBox={[600, 400]}
                        totalCycleTime={12000}
                        />
                </div>
            </div>

            <div className="home-section-row" style={{
                alignItems: "flex-end",
                display: "flex",
                flexDirection: "column",
                position: "relative"
            }}>

                <Wreath style={{
                    left: 0,
                    margin: 0,
                    padding: 0,
                    position: "absolute",
                    top: 0,
                }} width="60%" height="100%" radius={40} viewBox={[800,600]}/>
                <div style={{
                    alignContent: "center",
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    justifyContent: "center",
                    width: "45%",
                }}>
                    <h3>2. Enter Machine Learning</h3>
                    <h4 className="paragraph">
                        Thanks to vast amounts of free public data, faster and cheaper computing power, and new tools in data science, it's possible now to help.
                    </h4>
                    <h4 className="paragraph">
                        Floracast is a prediction engine for ecological events near you.
                    </h4>
                    <h4 className="paragraph">
                        This is new so we're focusing on common mushrooms in the continental United States. We make over a million predictions a day across 10,000 public protected areas in america.
                    </h4>

                    <h4><Link to="/classifier">Read more about our classifier</Link></h4>
                </div>
            </div>
          <div className="home-section-row">
            <BetaForm />
          </div>
        </div>
          </div>
    );
  }
}

