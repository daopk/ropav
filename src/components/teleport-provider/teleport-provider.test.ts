import { describe, expect, it } from 'vitest';
import { defineComponent, h, shallowRef } from 'vue';
import { flush, mountDom } from '../../../tests/utils/vue';
import Tooltip from '../tooltip/tooltip.vue';
import TeleportProvider from './teleport-provider.vue';

function tooltip(id: string, props: Record<string, unknown> = {}) {
    return h(Tooltip, {
        id,
        content: id,
        open: true,
        openDelay: 0,
        ...props,
    });
}

describe('TeleportProvider', () => {
    it('teleports to body by default and renders inline when teleport is disabled', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h('div', [
                        tooltip('body-tooltip'),
                        tooltip('inline-tooltip', { teleport: false }),
                    ]);
                },
            }),
        );

        await flush();

        expect(container.querySelector('#body-tooltip')).toBeNull();
        expect(document.body.querySelector('#body-tooltip')).not.toBeNull();
        expect(container.querySelector('#inline-tooltip')).not.toBeNull();
        expect(document.querySelector('#app-overlays')).toBeNull();
    });

    it('uses the nearest provider and lets a component prop override it', async () => {
        const outerTarget = document.createElement('div');
        const innerTarget = document.createElement('div');
        const overrideTarget = document.createElement('div');
        document.body.append(outerTarget, innerTarget, overrideTarget);

        mountDom(
            defineComponent({
                render() {
                    return h(
                        TeleportProvider,
                        { teleportTo: outerTarget },
                        {
                            default: () => [
                                tooltip('outer-tooltip'),
                                h(
                                    TeleportProvider,
                                    { teleportTo: innerTarget },
                                    {
                                        default: () => [
                                            tooltip('inner-tooltip'),
                                            tooltip('override-tooltip', {
                                                teleportTo: overrideTarget,
                                            }),
                                        ],
                                    },
                                ),
                            ],
                        },
                    );
                },
            }),
        );

        await flush();

        expect(outerTarget.querySelector('#outer-tooltip')).not.toBeNull();
        expect(innerTarget.querySelector('#inner-tooltip')).not.toBeNull();
        expect(overrideTarget.querySelector('#override-tooltip')).not.toBeNull();
    });

    it('moves teleported content when a ref target changes', async () => {
        const firstTarget = document.createElement('div');
        const secondTarget = document.createElement('div');
        document.body.append(firstTarget, secondTarget);
        const target = shallowRef<Element>(firstTarget);

        mountDom(
            defineComponent({
                render() {
                    return h(
                        TeleportProvider,
                        { teleportTo: target },
                        { default: () => tooltip('reactive-tooltip') },
                    );
                },
            }),
        );

        await flush();
        expect(firstTarget.querySelector('#reactive-tooltip')).not.toBeNull();

        target.value = secondTarget;
        await flush();
        expect(firstTarget.querySelector('#reactive-tooltip')).toBeNull();
        expect(secondTarget.querySelector('#reactive-tooltip')).not.toBeNull();
    });
});
