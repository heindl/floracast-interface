import * as React from 'react';
import * as ReactMarkdown from 'react-markdown';
import {RouteComponentProps} from "react-router";
import MErrors from "../../stores/errors";
import {getGlobalModel} from "../../stores/globals";
import {MView} from "../../stores/view";
import Header from './Header';
import SmallForm from "./SmallForm";
import './StaticPage.css';

interface ITextPageProps {
    namespace: string;
  match: {
      params: IPathMatchParams;
  };
}

interface IPathMatchParams {
    page?: string;
}

interface ITextPageState {
  markdown?: string;
}

type Props = ITextPageProps & RouteComponentProps<{}>;

export default class StaticPage extends React.Component<
  Props,
  ITextPageState
> {

    constructor(props: Props) {
        super(props);
        this.state = {};
        this.fetchMarkdown = this.fetchMarkdown.bind(this);
        if (props.match.params.page) {
            this.fetchMarkdown(props.match.params.page)
        }
    }

    public componentDidMount() {
        getGlobalModel('default', MView).SetSection('static');
    }

  public componentDidCatch(err: Error, info: React.ErrorInfo) {
    getGlobalModel('default', MErrors).Report(err);
  }

  public componentDidUpdate(prevProps: Props) {

    if (this.props.match.params.page === prevProps.match.params.page) {
        return
    }

    if (this.props.match.params.page) {
        this.fetchMarkdown(this.props.match.params.page)
    }

    window.scrollTo(0, 0);
  }
  public render() {

    return (
      <div id="static-page">
          <div id="static-page-header">
            <Header />
          </div>
        <div id="static-page-sidebar">
            <SmallForm />
        </div>
        <div id="static-page-content">
          {!this.state.markdown &&
            <div id="static-page-not-found">
                <h3>Page not found</h3>
                <p>
                    Looks like you're wandering in the wilderness.
                </p>
            </div>
          }
          {this.state.markdown &&
              <ReactMarkdown source={this.state.markdown} />
          }
        </div>
      </div>
    );
  }

    protected fetchMarkdown(page: string) {
        import(`./pages/${page}.md`).then(
            (x) => {
                fetch(x)
                    .then(response => response.text())
                    .then(text => {
                        this.setState({markdown: text});
                    }).catch((err) => {
                    this.setState({markdown: undefined})
                });

            }).catch((err) => {
            this.setState({markdown: undefined});
        })
    }
}
