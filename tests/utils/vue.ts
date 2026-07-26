import { afterEach } from 'vitest';
import { createApp, vaporInteropPlugin, type Component } from 'vue';

const cleanups: Array<() => void> = [];

export function mountDomWithApp(component: Component) {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const app = createApp(component);
    app.use(vaporInteropPlugin);
    app.mount(container);

    let unmounted = false;
    const unmount = () => {
        if (unmounted) return;
        app.unmount();
        container.remove();
        unmounted = true;
    };

    cleanups.push(unmount);
    return { app, container, unmount };
}

afterEach(() => {
    while (cleanups.length) cleanups.pop()?.();
    document.body.innerHTML = '';
});
