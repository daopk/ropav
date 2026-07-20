export function getEnabledIndexes<T>(items: readonly T[], isDisabled: (item: T) => boolean) {
    return items
        .map((item, index) => (isDisabled(item) ? -1 : index))
        .filter((index) => index >= 0);
}

export function getNextEnabledIndex<T>(
    items: readonly T[],
    currentIndex: number,
    direction: 1 | -1,
    isDisabled: (item: T) => boolean,
    loop = true,
) {
    const enabledIndexes = getEnabledIndexes(items, isDisabled);
    if (enabledIndexes.length === 0) return undefined;

    const currentPosition = enabledIndexes.indexOf(currentIndex);
    if (currentPosition < 0) {
        if (direction === 1) {
            return (
                enabledIndexes.find((index) => index > currentIndex) ??
                (loop ? enabledIndexes[0] : enabledIndexes[enabledIndexes.length - 1])
            );
        }
        for (let index = enabledIndexes.length - 1; index >= 0; index -= 1) {
            const candidate = enabledIndexes[index]!;
            if (candidate < currentIndex) return candidate;
        }
        return loop ? enabledIndexes[enabledIndexes.length - 1] : enabledIndexes[0];
    }

    const nextPosition = currentPosition + direction;
    if (nextPosition >= 0 && nextPosition < enabledIndexes.length) {
        return enabledIndexes[nextPosition];
    }
    if (!loop) return enabledIndexes[currentPosition];
    return direction === 1 ? enabledIndexes[0] : enabledIndexes[enabledIndexes.length - 1];
}
