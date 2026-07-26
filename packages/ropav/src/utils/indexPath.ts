export type IndexPath = number[];

export function getPathKey(path: IndexPath) {
    return path.length === 0 ? 'root' : path.join('-');
}

export function getParentPath(path: IndexPath): IndexPath {
    return path.slice(0, -1);
}

export function arePathsEqual(a: IndexPath, b: IndexPath) {
    return a.length === b.length && a.every((part, index) => part === b[index]);
}

export function isPathPrefix(prefix: IndexPath, path: IndexPath) {
    return prefix.length <= path.length && prefix.every((part, index) => part === path[index]);
}

export function normalizePath(indexOrPath: number | IndexPath): IndexPath {
    return Array.isArray(indexOrPath) ? indexOrPath : [indexOrPath];
}
