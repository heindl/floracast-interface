/* tslint:disable:no-console */
// import { ErrorReporting } from '@google-cloud/error-reporting';
import { action, observable } from 'mobx';
import {ParseError} from "papaparse";
// import { warn } from 'winston';

export default class MErrors {
  static get global(): string {
    return "MErrors";
  }

  @observable public ErrorMessage: string = '';
  protected readonly namespace: string;
  // protected errorReporter: ErrorReporting;

  constructor(namespace: string) {
    this.namespace = namespace;
    // console.log('NODE ENVIRONMENT', process.env.NODE_ENV);
    // if (process.env.NODE_ENV === 'production') {
    //     this.errorReporter = new ErrorReporting();
    // }
  }

  @action
  public Report = (
    error: Error | PositionError | ParseError,
    params?: {},
    message?: string
  ) => {
    this.ErrorMessage = error.message;
    // if (this.errorReporter) {
    //     this.errorReporter.report(error);
    // } else {
    console.log(error.message, ":", message || '', ":", JSON.stringify(params || {}));
    // }
  };

    @action
    public Warn = (
        error: Error | PositionError,
        params?: {},
        message?: string
    ) => {
        // if (this.errorReporter) {
        //     this.errorReporter.report(error);
        // } else {
        console.log("Warning", error.message, message || '', JSON.stringify(params || {}));
        // }
    };
}