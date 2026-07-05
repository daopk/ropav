import { describe, expect, it } from 'vitest';
import { defineComponent, h, provide, type InjectionKey } from 'vue';

import { mountDom } from '../../tests/utils/vue';
import { useRequiredInject } from './useRequiredInject';

interface ProvidedValue {
    message: string;
}

describe('useRequiredInject', () => {
    it('returns a provided value', () => {
        const key = Symbol('required') as InjectionKey<ProvidedValue>;
        let injected!: ProvidedValue;

        const Child = defineComponent({
            setup() {
                injected = useRequiredInject(key, 'Child');
                return () => h('div');
            },
        });

        mountDom(defineComponent({
            setup() {
                provide(key, { message: 'available' });
                return () => h(Child);
            },
        }));

        expect(injected).toEqual({ message: 'available' });
    });

    it('throws a helpful error when the provider is missing', () => {
        const key = Symbol('missing') as InjectionKey<ProvidedValue>;

        expect(() => mountDom(defineComponent({
            setup() {
                useRequiredInject(key, 'LonelyChild');
                return () => h('div');
            },
        }))).toThrow('[Ropav] <LonelyChild> must be used inside its parent provider component.');
    });
});
