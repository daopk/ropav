import { onBeforeUnmount, watch, type Ref } from 'vue';
import type { FloatingTargetLifecycle } from '../floating/useFloatingTargetLifecycle';
import type { DropdownMenuInteractOutsideEvent, DropdownMenuInteractOutsideTarget } from './types';
import type { DropdownMenuInteraction } from './dropdownMenuInteraction';

const TARGET_ATTRIBUTES = ['aria-controls', 'aria-expanded', 'aria-haspopup', 'aria-disabled'];

interface UseDropdownMenuTargetBindingsOptions {
    interaction: DropdownMenuInteraction;
    rootRef: Readonly<Ref<HTMLElement | null>>;
    menuRef: Readonly<Ref<HTMLElement | null>>;
    targetLifecycle: FloatingTargetLifecycle;
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
    targetLifecycle,
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
            (element, _previous, onCleanup) => {
                if (element) onCleanup(interaction.connectInside(element));
            },
            { immediate: true },
        );
    }

    watchInside(rootRef);
    watchInside(menuRef);

    const cleanupDismissal = interaction.connectDismissal({
        ignoredTargets,
        pointerDownOutside,
        focusOutside,
        interactOutside,
    });

    const onClick = () => interaction.onTriggerClick();
    const onKeydown = (event: KeyboardEvent) => interaction.onTriggerKeydown(event);
    targetLifecycle.bindTarget({
        connect: (target) => interaction.connectInside(target),
        listeners: [
            ['click', onClick],
            ['keydown', onKeydown as EventListener],
        ],
        attributes: {
            names: TARGET_ATTRIBUTES,
            apply: (target) => {
                syncTargetAttributes(target, menuId.value, isVisible.value, isDisabled.value);
            },
        },
    });

    onBeforeUnmount(cleanupDismissal);
}
