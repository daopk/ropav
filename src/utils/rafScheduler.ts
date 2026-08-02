export function createRafScheduler(callback: () => void, getView: () => Window | null | undefined) {
    let frameId: number | undefined;
    let frameView: Window | null | undefined;
    let generation = 0;

    function cancel() {
        generation += 1;
        if (frameId !== undefined) frameView?.cancelAnimationFrame(frameId);
        frameId = undefined;
        frameView = undefined;
    }

    function schedule() {
        if (frameId !== undefined) return;

        const view = getView();
        if (!view?.requestAnimationFrame) {
            callback();
            return;
        }

        const scheduledGeneration = generation;
        frameView = view;
        frameId = view.requestAnimationFrame(() => {
            if (generation !== scheduledGeneration || frameView !== view) return;

            frameId = undefined;
            frameView = undefined;
            callback();
        });
    }

    return { cancel, schedule };
}
