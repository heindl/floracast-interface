import {FirebaseFirestore} from "@firebase/firestore-types";
import { observable } from 'mobx';
import MErrors from './errors';
import {getFireStoreRef} from './firestore';
import {getGlobalModel} from "./globals";

export enum ContactFormStateCode {
  Initial,
  Processing,
  Complete,
  Exists,
  Failed,
}

export class ContactFormStore {

  @observable public SavedEmails: string[] = [];
  @observable
  public StateCode: ContactFormStateCode = ContactFormStateCode.Initial;

  protected readonly namespace: string;

  protected fireStoreRef: FirebaseFirestore;
  protected errorStore: MErrors;

  constructor(namespace: string) {
    this.namespace = namespace;
    this.errorStore = getGlobalModel(namespace, MErrors);
    this.fireStoreRef = getFireStoreRef(namespace);
  }

  public SaveEmail(email: string) {

    if (this.SavedEmails.indexOf(email) !== -1) {
      this.StateCode = ContactFormStateCode.Complete;
      return;
    }

    this.StateCode = ContactFormStateCode.Processing;

    const ref = this.fireStoreRef.collection('BetaList').doc(email);

    ref
      .get()
      .then((doc) => {
        if (doc.exists) {
          this.StateCode = ContactFormStateCode.Complete;
        } else {
          ref
            .set({
              createdAt: Date.now(),
            })
            .then(() => {
              this.StateCode = ContactFormStateCode.Complete;
            })
            .catch((err) => {
              this.errorStore.Report(err);
            });
        }
      })
      .catch((err) => {
        this.errorStore.Report(err);
      });
  }
}
