export function haveSameFiles(fileList: FileList | null, files: readonly File[]) {
    if (!fileList || fileList.length !== files.length) return false;
    return files.every((file, index) => fileList.item(index) === file);
}

export function replaceInputFiles(input: HTMLInputElement, files: readonly File[]) {
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
