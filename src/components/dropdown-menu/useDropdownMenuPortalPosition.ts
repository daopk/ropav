import { autoUpdate, computePosition, flip, offset, shift, type Placement } from '@floating-ui/dom';
import { nextTick, onBeforeUnmount, ref, watch, type CSSProperties, type Ref } from 'vue';
import type { DropdownMenuPlacement, DropdownMenuProps } from './types';

type BooleanSource = Readonly<Ref<boolean>>;
type PlacementSource = Readonly<Ref<DropdownMenuPlacement>>;

export function useDropdownMenuPortalPosition(options: {
    props: Readonly<DropdownMenuProps>;
    rootRef: Ref<HTMLElement | null>;
    menuRef: Ref<HTMLElement | null>;
    isVisible: BooleanSource;
    placement: PlacementSource;
}) {
    const contentStyle = ref<CSSProperties>();
    let cleanup: (() => void) | undefined;
    let generation = 0;

    function stop() {
        cleanup?.();
        cleanup = undefined;
        generation += 1;
        contentStyle.value = undefined;
    }

    async function update() {
        const trigger = options.rootRef.value?.querySelector<HTMLElement>('[aria-haspopup="menu"]');
        const content = options.menuRef.value;
        if (!options.props.portal || !options.isVisible.value || !trigger || !content) return;
        const currentGeneration = generation;
        const result = await computePosition(trigger, content, {
            placement: options.placement.value as Placement,
            strategy: 'fixed',
            middleware: [offset(8), flip({ padding: 8 }), shift({ padding: 8 })],
        });
        if (currentGeneration !== generation) return;
        contentStyle.value = {
            position: result.strategy,
            top: `${result.y}px`,
            left: `${result.x}px`,
        };
    }

    function start() {
        stop();
        if (!options.props.portal || !options.isVisible.value) return;
        void nextTick(() => {
            const trigger =
                options.rootRef.value?.querySelector<HTMLElement>('[aria-haspopup="menu"]');
            const content = options.menuRef.value;
            if (!trigger || !content || !options.isVisible.value) return;
            void update();
            cleanup = autoUpdate(trigger, content, () => void update());
        });
    }

    watch([options.isVisible, options.placement, () => options.props.portal], start, {
        flush: 'post',
        immediate: true,
    });
    onBeforeUnmount(stop);

    return { contentStyle, stop };
}
