import {FirebaseFirestore} from "@firebase/firestore-types";
import { observable } from 'mobx';
import {ErrorStore, getErrorStore} from './errors';
import {getFireStoreRef} from './firestore';

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
  protected errorStore: ErrorStore;

  constructor(namespace: string) {
    this.namespace = namespace;
    this.errorStore = getErrorStore(namespace);
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

const namespaces: Map<string, ContactFormStore> = new Map();

export function getContactFormStore(namespace: string): ContactFormStore {
  let store = namespaces.get(namespace);
  if (!store) {
    store = new ContactFormStore(namespace);
    namespaces.set(namespace, store);
  }
  return store;
}
