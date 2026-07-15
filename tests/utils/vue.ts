import { afterEach } from 'vitest';
import { createApp, nextTick, vaporInteropPlugin, type Component } from 'vue';

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

export function mountDom(component: Component) {
    return mountDomWithApp(component).container;
}

export function queryDom<T extends Element = HTMLElement>(container: Element, selector: string) {
    return (container.querySelector(selector) ?? document.querySelector(selector)) as T | null;
}

export function queryDomAll<T extends Element = HTMLElement>(container: Element, selector: string) {
    const local = [...container.querySelectorAll<T>(selector)];
    if (local.length > 0) return local;
    return [...document.querySelectorAll<T>(selector)];
}

export function click(el: Element) {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
}

export function keydown(el: Element | Document, key: string) {
    el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}

export function keyEvent(key: string) {
    return new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
}

export function input(el: HTMLInputElement, value: string) {
    el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
}

export async function flush() {
    await nextTick();
    await nextTick();
}

export async function waitTransition() {
    await new Promise((resolve) => setTimeout(resolve, 50));
    await nextTick();
}

afterEach(() => {
    while (cleanups.length) cleanups.pop()?.();
    document.body.innerHTML = '';
    document.body.style.overflow = '';
});
