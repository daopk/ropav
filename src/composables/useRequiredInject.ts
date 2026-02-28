import { inject, type InjectionKey } from 'vue';

export function useRequiredInject<T>(key: InjectionKey<T>, componentName: string): T {
    const value = inject(key);
    if (value == null) {
        throw new Error(`[Ropav] <${componentName}> must be used inside its parent provider component.`);
    }
    return value;
}
