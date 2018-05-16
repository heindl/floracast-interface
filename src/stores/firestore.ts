/* tslint:disable:no-duplicate-imports no-implicit-dependencies */
import firebase from '@firebase/app';
import '@firebase/firestore';
import {FirebaseFirestore} from "@firebase/firestore-types";
import '@firebase/storage'
import {FirebaseStorage} from "@firebase/storage-types";
// import * as firestore from "@firebase/firestore";
// import * as storage from "@firebase/storage";

// export function FieldValueWithServerTimestamp(): firestore.FieldValue {
//   return firebase.firestore.FieldValue.serverTimestamp()
// }


interface IFirebaseAppCover{
    name: string;
    firestore?(): FirebaseFirestore;
    storage?(storageBucket?: string): FirebaseStorage;
}

// function newLiveFirestoreRef(): firestore.FirebaseFirestore {
const globalAppConnection: IFirebaseAppCover = firebase.initializeApp({
    apiKey: process.env.REACT_APP_FLORACAST_API_KEY,
    projectId: process.env.REACT_APP_FLORACAST_FIRESTORE_PROJECT_ID,
});


if (!globalAppConnection.firestore || !globalAppConnection.storage) {
    throw Error(`Global firestore or store connection not found`)
}

// const globalFireStoreConnection = globalAppConnection.firestore();
// const globalFirebaseStorageConnection = globalAppConnection.storage(process.env.REACT_APP_FLORACAST_STORAGE_BUCKET);

export function getFireStoreRef(namespace: string): FirebaseFirestore {
    if (!globalAppConnection.firestore) {
        throw Error('Firestore doesn\'t exist')
    }
    return globalAppConnection.firestore();
}

export function getFirebaseStorageRef(namespace: string): FirebaseStorage {
    if (!globalAppConnection.storage) {
        throw Error("Firebase Storage doesn't exist")
    }
    return globalAppConnection.storage(process.env.REACT_APP_FLORACAST_STORAGE_BUCKET)
}