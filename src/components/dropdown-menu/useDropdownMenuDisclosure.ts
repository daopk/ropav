import { onBeforeUnmount, watch, type Ref } from 'vue';
import type { OverlayLayerContext } from '@/internal/composables/useOverlayLayer';
import { blockNextDocumentClick, createOutsideEvent } from './dropdownMenuContext';
import { isEventWithinTargets } from './dropdown-menu-outside';
import type {
    DropdownMenuCloseOptions,
    DropdownMenuFocusTarget,
    DropdownMenuInteractOutsideEvent,
    DropdownMenuItem,
    DropdownMenuOpenOptions,
    DropdownMenuProps,
    DropdownMenuSelectEvent,
} from './types';
import { DEFAULT_FOCUS_TARGET, getOpenFocusTarget, type ItemPath } from './dropdown-menu-model';

type BooleanSource = Readonly<Ref<boolean>>;

type UseDropdownMenuDisclosureOptions = {
    props: Readonly<DropdownMenuProps>;
    emit: {
        select?: (item: DropdownMenuItem, event: DropdownMenuSelectEvent) => void;
        pointerDownOutside?: (event: DropdownMenuInteractOutsideEvent) => void;
        focusOutside?: (event: DropdownMenuInteractOutsideEvent) => void;
        interactOutside?: (event: DropdownMenuInteractOutsideEvent) => void;
    };
    rootRef: Ref<HTMLElement | null>;
    menuRef: Ref<HTMLElement | null>;
    targetRef: Readonly<Ref<Element | null>>;
    setControllableOpen: (open: boolean) => void;
    isDisabled: BooleanSource;
    isOpen: BooleanSource;
    isVisible: BooleanSource;
    focusedPath: Ref<ItemPath>;
    resetFocus: () => void;
    resetSubmenus: () => void;
    resetHoverIntent: () => void;
    focusItem: (target: DropdownMenuFocusTarget, menuPath?: ItemPath) => boolean;
    focusMenu: () => void;
    focusTrigger: () => void;
    layer: OverlayLayerContext;
};

export function useDropdownMenuDisclosure({
    props,
    emit,
    rootRef,
    menuRef,
    targetRef,
    setControllableOpen,
    isDisabled,
    isOpen,
    isVisible,
    focusedPath,
    resetFocus,
    resetSubmenus,
    resetHoverIntent,
    focusItem,
    focusMenu,
    focusTrigger,
    layer,
}: UseDropdownMenuDisclosureOptions) {
    function setOpen(nextOpen: boolean) {
        if (nextOpen && isDisabled.value) return;

        const previousOpen = isOpen.value;
        if (previousOpen !== nextOpen) setControllableOpen(nextOpen);
    }

    function resetMenuFocus() {
        resetFocus();
        resetSubmenus();
        resetHoverIntent();
    }

    function open(options?: DropdownMenuOpenOptions | DropdownMenuFocusTarget) {
        if (isDisabled.value) return;

        setOpen(true);
        focusItem(getOpenFocusTarget(options));
        resetSubmenus();
        resetHoverIntent();
        focusMenu();
    }

    function close(options: DropdownMenuCloseOptions = {}) {
        setOpen(false);
        resetMenuFocus();
        if (options.focusTrigger) focusTrigger();
    }

    function toggle() {
        if (isVisible.value) {
            close({ focusTrigger: true });
        } else {
            open();
        }
    }

    watch(isDisabled, (disabled) => {
        if (disabled) close();
    });

    watch(isVisible, (visible) => {
        if (visible) {
            if (focusedPath.value.length === 0) focusItem(DEFAULT_FOCUS_TARGET);
            focusMenu();
        } else {
            resetMenuFocus();
        }
    });

    function emitOutside(type: 'pointer' | 'focus', originalEvent: Event) {
        const outsideEvent = createOutsideEvent(originalEvent);
        if (type === 'pointer') emit.pointerDownOutside?.(outsideEvent);
        else emit.focusOutside?.(outsideEvent);
        emit.interactOutside?.(outsideEvent);
        return outsideEvent;
    }

    function isInside(event: Event) {
        return isEventWithinTargets(event, [rootRef, menuRef, targetRef, ...(props.ignore ?? [])]);
    }

    function blockModalInteraction(event: Event) {
        if (!props.modal) return;
        if (event.cancelable) event.preventDefault();
        event.stopPropagation();
        if (event.type === 'pointerdown') blockNextDocumentClick();
    }

    function onDocumentPointerdown(event: Event) {
        if (!layer.isTopLayer()) return;
        if (isInside(event)) return;
        const outsideEvent = emitOutside('pointer', event);
        blockModalInteraction(event);
        if (!outsideEvent.defaultPrevented) close({ focusTrigger: Boolean(props.modal) });
    }

    function onDocumentFocus(event: Event) {
        if (!layer.isTopLayer()) return;
        if (isInside(event)) return;
        const outsideEvent = emitOutside('focus', event);
        blockModalInteraction(event);
        if (!outsideEvent.defaultPrevented) close({ focusTrigger: Boolean(props.modal) });
        else if (props.modal) focusMenu();
    }

    let isListening = false;
    function setDocumentListeners(active: boolean) {
        if (typeof document === 'undefined' || active === isListening) return;
        isListening = active;
        const method = active ? 'addEventListener' : 'removeEventListener';
        document[method]('pointerdown', onDocumentPointerdown, true);
        document[method]('focusin', onDocumentFocus, true);
    }

    watch(isVisible, setDocumentListeners, { immediate: true });
    onBeforeUnmount(() => setDocumentListeners(false));

    return {
        open,
        close,
        toggle,
        resetMenuFocus,
    };
}
