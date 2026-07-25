export function normalizeSelectedFiles(files: Iterable<File>, multiple: boolean) {
    const selectedFiles = Array.from(files);
    return multiple ? selectedFiles : selectedFiles.slice(0, 1);
}

export function readSelectedFiles(fileList: FileList | null, multiple: boolean) {
    return normalizeSelectedFiles(fileList ?? [], multiple);
}

export function haveSameFiles(fileList: FileList | null, files: readonly File[]) {
    if (!fileList || fileList.length !== files.length) return false;
    return files.every((file, index) => fileList.item(index) === file);
}

export function replaceSelectedFiles(input: HTMLInputElement, files: readonly File[]) {
    if (haveSameFiles(input.files, files)) return true;

    if (files.length === 0) {
        input.value = '';
        return true;
    }

    const DataTransferConstructor = input.ownerDocument.defaultView?.DataTransfer;
    if (!DataTransferConstructor) return false;

    const transfer = new DataTransferConstructor();
    for (const file of files) transfer.items.add(file);

    try {
        input.files = transfer.files;
        return true;
    } catch {
        return false;
    }
}
