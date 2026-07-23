export function getPointerId(event: Pick<PointerEvent, 'pointerId'>) {
    return Number.isFinite(event.pointerId) ? event.pointerId : undefined;
}
