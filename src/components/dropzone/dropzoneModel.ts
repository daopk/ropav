import type {
    DropzoneFileError,
    DropzoneFileRejection,
    DropzoneSelection,
    DropzoneStatus,
} from './types';

interface DropzonePolicyOptions {
    accept?: string;
    multiple: boolean;
    maxFiles?: number;
    maxSize?: number;
}

interface DropzoneDragItem {
    kind: string;
    type: string;
}

function normalizeAcceptTokens(accept: string | undefined) {
    return (
        accept
            ?.split(',')
            .map((token) => token.trim().toLowerCase())
            .filter(Boolean) ?? []
    );
}

function matchesMimeToken(type: string, token: string) {
    const fileType = type.toLowerCase();
    if (token.endsWith('/*')) return fileType.startsWith(token.slice(0, -1));
    return Boolean(fileType) && fileType === token;
}

function matchesAcceptToken(file: File, token: string) {
    if (token.startsWith('.')) return file.name.toLowerCase().endsWith(token);
    return matchesMimeToken(file.type, token);
}

function isFileAccepted(file: File, accept: string | undefined) {
    const tokens = normalizeAcceptTokens(accept);
    return tokens.length === 0 || tokens.some((token) => matchesAcceptToken(file, token));
}

function getFileErrors(file: File, options: Pick<DropzonePolicyOptions, 'accept' | 'maxSize'>) {
    const errors: DropzoneFileError[] = [];

    if (!isFileAccepted(file, options.accept)) {
        errors.push({
            code: 'file-invalid-type',
            message: `File type must match ${options.accept}.`,
        });
    }

    if (options.maxSize != null && options.maxSize >= 0 && file.size > options.maxSize) {
        errors.push({
            code: 'file-too-large',
            message: `File must not be larger than ${options.maxSize} bytes.`,
        });
    }

    return errors;
}

function getFileLimit(options: Pick<DropzonePolicyOptions, 'multiple' | 'maxFiles'>) {
    if (!options.multiple) return 1;
    if (options.maxFiles == null) return Number.POSITIVE_INFINITY;
    return Math.max(0, Math.floor(options.maxFiles));
}

function getDragStatus(
    items: Iterable<DropzoneDragItem>,
    options: Pick<DropzonePolicyOptions, 'accept' | 'multiple' | 'maxFiles'>,
): Exclude<DropzoneStatus, 'idle'> {
    const fileItems = Array.from(items).filter((item) => item.kind === 'file');
    if (fileItems.length > getFileLimit(options)) return 'reject';

    const tokens = normalizeAcceptTokens(options.accept);
    if (tokens.length === 0) return 'accept';

    const hasExtensionToken = tokens.some((token) => token.startsWith('.'));
    const mimeTokens = tokens.filter((token) => !token.startsWith('.'));
    const hasKnownRejection = fileItems.some((item) => {
        const itemType = item.type.toLowerCase();
        if (!itemType || itemType === 'application/octet-stream' || hasExtensionToken) return false;
        return !mimeTokens.some((token) => matchesMimeToken(itemType, token));
    });

    return hasKnownRejection ? 'reject' : 'accept';
}

function rejectTooMany(file: File, limit: number): DropzoneFileRejection {
    return {
        file,
        errors: [
            {
                code: 'too-many-files',
                message: `At most ${limit} files can be selected.`,
            },
        ],
    };
}

function processFiles(files: Iterable<File>, options: DropzonePolicyOptions): DropzoneSelection {
    const acceptedFiles: File[] = [];
    const rejections: DropzoneFileRejection[] = [];
    const limit = getFileLimit(options);

    for (const file of files) {
        const errors = getFileErrors(file, options);
        if (errors.length > 0) {
            rejections.push({ file, errors });
            continue;
        }

        if (acceptedFiles.length >= limit) {
            rejections.push(rejectTooMany(file, limit));
            continue;
        }

        acceptedFiles.push(file);
    }

    return { acceptedFiles, rejections };
}

export function createDropzonePolicy(options: Readonly<DropzonePolicyOptions>) {
    return {
        preview(items: Iterable<DropzoneDragItem>) {
            return getDragStatus(items, options);
        },
        commit(files: Iterable<File>) {
            return processFiles(files, options);
        },
    };
}
