export function getPointerId(event: Pick<PointerEvent, 'pointerId'>) {
    return Number.isFinite(event.pointerId) ? event.pointerId : undefined;
}

export function isMatchingPointer(
    event: Pick<PointerEvent, 'pointerId'>,
    pointerId: number | undefined,
) {
    return pointerId === undefined || getPointerId(event) === pointerId;
}
