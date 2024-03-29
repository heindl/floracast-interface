

const namespaces: {[namespace: string]: INamespace} = {};

interface INamespace{
    [className: string]: any
}

interface IClassConstructable<T> {
    global: string;
    new(namespace: string): T;

}

export function getGlobalModel<T>(namespace: string, c: IClassConstructable<T>): T {

    if (namespace.trim() === '') {
        throw Error(`Invalid Namespace provided to get global namespace`);
    }
    if (!(namespaces.hasOwnProperty(namespace))) {
        namespaces[namespace] = {}
    }
    if (!(namespaces[namespace].hasOwnProperty(c.global))) {
        namespaces[namespace][c.global] = new c(namespace)
    }
    return namespaces[namespace][c.global];
}

export function clearGlobalStores() {
    for (const namespace in namespaces){
        if (namespaces.hasOwnProperty(namespace)){
            delete namespaces[namespace];
        }
    }
}