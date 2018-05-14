

const namespaces: {[namespace: string]: INamespace} = {};

interface INamespace{
    [className: string]: any
}

interface IClassConstructable {
    name: string;
    new(namespace: string): any;
}

export function getGlobalModel(namespace: string, c: IClassConstructable) {
    if (namespace.trim() === '') {
        throw Error(`Invalid Namespace provided to get global namespace`);
    }
    if (!(namespaces.hasOwnProperty(namespace))) {
        namespaces[namespace] = {}
    }
    if (!(namespaces[namespace].hasOwnProperty(c.name))) {
        namespaces[namespace][c.name] = new c(namespace)
    }
    return namespaces[namespace][c.name];
}

export function clearGlobalStores() {
    for (const namespace in namespaces){
        if (namespaces.hasOwnProperty(namespace)){
            delete namespaces[namespace];
        }
    }
}