import { watch, type Ref } from 'vue';
import { useClickOutside } from '@/composables/useClickOutside';
import type {
    DropdownMenuCloseOptions,
    DropdownMenuFocusTarget,
    DropdownMenuItem,
    DropdownMenuOpenOptions,
    DropdownMenuProps,
    DropdownMenuSelectEvent,
} from './types';
import { DEFAULT_FOCUS_TARGET, getOpenFocusTarget, type ItemPath } from './dropdown-menu-utils';

type BooleanSource = Readonly<Ref<boolean>>;

type UseDropdownMenuDisclosureOptions = {
    props: Readonly<DropdownMenuProps>;
    emit: {
        openChange?: (open: boolean) => void;
        select?: (item: DropdownMenuItem, event: DropdownMenuSelectEvent) => void;
    };
    rootRef: Ref<HTMLElement | null>;
    menuRef: Ref<HTMLElement | null>;
    uncontrolledOpen: Ref<boolean>;
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
};

export function useDropdownMenuDisclosure({
    props,
    emit,
    rootRef,
    menuRef,
    uncontrolledOpen,
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
}: UseDropdownMenuDisclosureOptions) {
    function setOpen(nextOpen: boolean) {
        if (nextOpen && isDisabled.value) return;

        const previousOpen = isOpen.value;
        if (props.open === undefined) uncontrolledOpen.value = nextOpen;
        if (previousOpen !== nextOpen) emit.openChange?.(nextOpen);
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

    useClickOutside([rootRef, menuRef], isVisible, (event) => {
        if (props.modal) {
            event.preventDefault();
            event.stopPropagation();
        }
        close({ focusTrigger: Boolean(props.modal) });
    });

    return {
        open,
        close,
        toggle,
        resetMenuFocus,
    };
}
