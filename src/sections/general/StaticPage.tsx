import {Provider} from "mobx-react";
import * as React from 'react';
import * as ReactMarkdown from 'react-markdown';
import {RouteComponentProps} from "react-router";
import {ContactFormStore, getContactFormStore} from "../../stores/contact-form";
import { getErrorStore } from '../../stores/errors';
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

    protected contactFormStore: ContactFormStore;

    constructor(props: Props) {
        super(props);
        this.contactFormStore = getContactFormStore(this.props.namespace);
        this.state = {};
        this.fetchMarkdown = this.fetchMarkdown.bind(this);
        if (props.match.params.page) {
            this.fetchMarkdown(props.match.params.page)
        }
    }

  public componentDidCatch(err: Error, info: React.ErrorInfo) {
    getErrorStore('default').Report(err);
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
        <Provider contactFormStore={this.contactFormStore}>
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
        </Provider>
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
