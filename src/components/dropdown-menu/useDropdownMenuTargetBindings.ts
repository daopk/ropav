import { onBeforeUnmount, watch, type Ref } from 'vue';
import { restoreAttributes, snapshotAttributes } from '@/utils/dom/attributes';
import type { DropdownMenuInteractOutsideEvent, DropdownMenuInteractOutsideTarget } from './types';
import type { DropdownMenuInteractionRuntime } from './dropdownMenuInteraction';

const TARGET_ATTRIBUTES = ['aria-controls', 'aria-expanded', 'aria-haspopup', 'aria-disabled'];

interface UseDropdownMenuTargetBindingsOptions {
    interaction: DropdownMenuInteractionRuntime;
    rootRef: Readonly<Ref<HTMLElement | null>>;
    menuRef: Readonly<Ref<HTMLElement | null>>;
    targetElement: Readonly<Ref<Element | null>>;
    isExplicitTarget: Readonly<Ref<boolean>>;
    menuId: Readonly<Ref<string>>;
    isVisible: Readonly<Ref<boolean>>;
    isDisabled: Readonly<Ref<boolean>>;
    ignoredTargets: () => readonly DropdownMenuInteractOutsideTarget[];
    pointerDownOutside?: (event: DropdownMenuInteractOutsideEvent) => void;
    focusOutside?: (event: DropdownMenuInteractOutsideEvent) => void;
    interactOutside?: (event: DropdownMenuInteractOutsideEvent) => void;
}

function syncTargetAttributes(target: Element, id: string, visible: boolean, disabled: boolean) {
    if (disabled) {
        target.removeAttribute('aria-controls');
        target.removeAttribute('aria-expanded');
        target.removeAttribute('aria-haspopup');
        target.setAttribute('aria-disabled', 'true');
        return;
    }

    target.setAttribute('aria-controls', id);
    target.setAttribute('aria-expanded', String(visible));
    target.setAttribute('aria-haspopup', 'menu');
    target.removeAttribute('aria-disabled');
}

export function useDropdownMenuTargetBindings({
    interaction,
    rootRef,
    menuRef,
    targetElement,
    isExplicitTarget,
    menuId,
    isVisible,
    isDisabled,
    ignoredTargets,
    pointerDownOutside,
    focusOutside,
    interactOutside,
}: UseDropdownMenuTargetBindingsOptions) {
    function watchInside<ElementType extends Element>(source: Readonly<Ref<ElementType | null>>) {
        watch(
            source,
            (element, previous) => {
                if (previous) interaction.unregisterInside(previous);
                if (element) interaction.registerInside(element);
            },
            { immediate: true },
        );
    }

    watchInside(rootRef);
    watchInside(menuRef);
    watchInside(targetElement);

    const cleanupDismissal = interaction.registerDismissal({
        ignoredTargets,
        pointerDownOutside,
        focusOutside,
        interactOutside,
    });

    watch(
        [isExplicitTarget, targetElement],
        ([explicit, target], _previous, onCleanup) => {
            if (!explicit || !target) return;

            const onClick = () => interaction.onTriggerClick();
            const onKeydown = (event: KeyboardEvent) => interaction.onTriggerKeydown(event);
            target.addEventListener('click', onClick);
            target.addEventListener('keydown', onKeydown as EventListener);
            onCleanup(() => {
                target.removeEventListener('click', onClick);
                target.removeEventListener('keydown', onKeydown as EventListener);
            });
        },
        { flush: 'sync' },
    );

    watch(
        [isExplicitTarget, targetElement, menuId, isVisible, isDisabled],
        ([explicit, target, id, visible, disabled], _previous, onCleanup) => {
            if (!explicit || !target) return;

            const snapshot = snapshotAttributes(target, TARGET_ATTRIBUTES);
            syncTargetAttributes(target, id, visible, disabled);
            onCleanup(() => restoreAttributes(target, snapshot));
        },
        { flush: 'sync' },
    );

    onBeforeUnmount(cleanupDismissal);
}
