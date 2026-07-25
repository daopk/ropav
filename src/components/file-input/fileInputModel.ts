export function normalizeSelectedFiles(files: Iterable<File>, multiple: boolean) {
    const selectedFiles = Array.from(files);
    return multiple ? selectedFiles : selectedFiles.slice(0, 1);
}

export function readSelectedFiles(fileList: FileList | null, multiple: boolean) {
    return normalizeSelectedFiles(fileList ?? [], multiple);
}
