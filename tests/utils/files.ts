export function createFileList(files: readonly File[]) {
    const entries = Object.fromEntries(files.map((file, index) => [index, file]));
    return {
        ...entries,
        length: files.length,
        item: (index: number) => files[index] ?? null,
    } as unknown as FileList;
}

class DataTransferStub {
    private readonly selectedFiles: File[] = [];

    readonly items = {
        add: (file: File) => {
            this.selectedFiles.push(file);
        },
    };

    get files() {
        return createFileList(this.selectedFiles);
    }
}

export function replaceDataTransferConstructor(
    value: unknown,
    view: Window & typeof globalThis = window,
) {
    const originalDescriptor = Object.getOwnPropertyDescriptor(view, 'DataTransfer');
    Object.defineProperty(view, 'DataTransfer', {
        configurable: true,
        value,
    });

    return () => {
        if (originalDescriptor) {
            Object.defineProperty(view, 'DataTransfer', originalDescriptor);
        } else {
            Reflect.deleteProperty(view, 'DataTransfer');
        }
    };
}

export function installDataTransferStub(view: Window & typeof globalThis = window) {
    return replaceDataTransferConstructor(DataTransferStub, view);
}

export function makeInputFilesMutable(input: HTMLInputElement, initialFiles: readonly File[] = []) {
    let nativeFiles = createFileList(initialFiles);
    const InputConstructor = input.ownerDocument.defaultView?.HTMLInputElement;
    const valueDescriptor = InputConstructor
        ? Object.getOwnPropertyDescriptor(InputConstructor.prototype, 'value')
        : undefined;

    Object.defineProperty(input, 'files', {
        configurable: true,
        get: () => nativeFiles,
        set: (value: FileList) => {
            nativeFiles = value;
        },
    });
    if (valueDescriptor?.get && valueDescriptor.set) {
        Object.defineProperty(input, 'value', {
            configurable: true,
            get: () => valueDescriptor.get?.call(input),
            set: (value: string) => {
                valueDescriptor.set?.call(input, value);
                if (value === '') nativeFiles = createFileList([]);
            },
        });
    }

    return {
        get files() {
            return nativeFiles;
        },
        replace(files: readonly File[]) {
            nativeFiles = createFileList(files);
        },
    };
}

export function selectFiles(input: HTMLInputElement, files: readonly File[]) {
    Object.defineProperty(input, 'files', {
        configurable: true,
        value: createFileList(files),
    });
    const EventConstructor = input.ownerDocument.defaultView?.Event ?? Event;
    input.dispatchEvent(new EventConstructor('change', { bubbles: true }));
}
