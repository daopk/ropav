import {
    computed,
    isRef,
    nextTick,
    onBeforeUnmount,
    ref,
    useAttrs,
    useId,
    useSlots,
    watch,
    type CSSProperties,
} from 'vue';
import { useControllableValue } from '@/composables/useControllableValue';
import { bem } from '@/utils/bem';
import { useOverlayLayer } from '@/internal/composables/useOverlayLayer';
import { isNodeWithinElement } from '@/utils/dom/events';
import { getFloatingOffsetStyle } from '@/utils/floatingOffset';
import { useFocusTrap } from '../focus-trap/useFocusTrap';
import type { FocusTrapContainers } from '../focus-trap/types';
import { useFloatingPosition } from '../floating/useFloatingPosition';
import { useFloatingTargetLifecycle } from '../floating/useFloatingTargetLifecycle';
import { useTeleportTarget } from '../teleport-provider/useTeleportTarget';
import { useOverlayZIndex } from '../overlay/useOverlayZIndex';
import type {
    PopoverContentSlotProps,
    PopoverPlacement,
    PopoverProps,
    PopoverRole,
    PopoverSlotProps,
    PopoverTriggerProps,
} from './types';
import { usePopoverBindings } from './usePopoverBindings';

const DEFAULT_PLACEMENT: PopoverPlacement = 'bottom';
const DEFAULT_ROLE: PopoverRole = 'dialog';
const POPOVER_OFFSET_PROPERTIES = {
    mainAxis: '--_rp-popover-main-axis-offset',
    crossAxis: '--_rp-popover-cross-axis-offset',
} as const;

function isFocusTrapContainer(value: Element | null): value is HTMLElement | SVGElement {
    return (
        (typeof HTMLElement !== 'undefined' && value instanceof HTMLElement) ||
        (typeof SVGElement !== 'undefined' && value instanceof SVGElement)
    );
}

export function usePopover(
    props: Readonly<PopoverProps>,
    emitOpenChange?: (open: boolean) => void,
) {
    const slots = useSlots();
    const attrs = useAttrs();
    const generatedId = useId();
    const rootRef = ref<HTMLElement | null>(null);
    const contentRef = ref<HTMLElement | null>(null);
    const arrowRef = ref<HTMLElement | null>(null);
    const controllableOpen = useControllableValue({
        modelValue: () => props.open,
        defaultValue: () => false,
        onChange: (open) => emitOpenChange?.(open),
    });
    const popoverId = computed(() => props.id ?? `${generatedId}-popover`);
    const placement = computed(() => props.placement ?? DEFAULT_PLACEMENT);
    const popoverRole = computed(() => props.role ?? DEFAULT_ROLE);
    const teleportTo = useTeleportTarget(() => props.teleportTo);
    const targetLifecycle = useFloatingTargetLifecycle({
        target: () => props.target,
        fallback: rootRef,
    });
    const { isExplicitTarget, reference, targetElement } = targetLifecycle;
    const hasContent = computed(() =>
        Boolean(slots.content || (isExplicitTarget.value && slots.default)),
    );
    const isDisabled = computed(() => Boolean(props.disabled || !hasContent.value));
    const isOpen = controllableOpen.value;
    const isVisible = computed(() => isOpen.value && !isDisabled.value);
    const baseZIndex = useOverlayZIndex({
        baseZIndex: () => props.baseZIndex,
        defaultBaseZIndex: 100,
        aboveParent: false,
    });
    const layer = useOverlayLayer({
        active: isVisible,
        element: contentRef,
        baseZIndex,
    });
    const shouldRenderContent = computed(
        () => !isDisabled.value && (Boolean(props.keepMounted) || isVisible.value),
    );
    const shouldShowContent = computed(() => !props.keepMounted || isVisible.value);
    const ariaLabel = computed(() => props.ariaLabel || undefined);
    const ariaLabelledby = computed(() => props.ariaLabelledby || undefined);
    const ariaDescribedby = computed(() => props.ariaDescribedby || undefined);
    const focusTrapContainers = computed<FocusTrapContainers | null>(() => {
        const content = contentRef.value;
        if (!content) return null;

        const trigger = targetElement.value ?? rootRef.value;
        return isFocusTrapContainer(trigger)
            ? [trigger, content, ...layer.focusBranches.value]
            : [content, ...layer.focusBranches.value];
    });

    const floating = useFloatingPosition({
        reference,
        floating: contentRef,
        arrow: arrowRef,
        open: isVisible,
        placement: () => placement.value,
        strategy: () => props.strategy ?? 'absolute',
        offset: () => props.offset,
        flip: () => props.flip !== false,
        flipOptions: () => props.flipOptions,
        shift: () => props.shift !== false,
        collisionPadding: () => props.collisionPadding ?? 8,
        autoUpdateOptions: () => props.autoUpdateOptions,
    });
    const placementSide = computed(() => floating.actualPlacement.value.split('-')[0]);
    const rootClass = computed(() =>
        bem('rp-popover', {
            [`placement-${floating.actualPlacement.value}`]: true,
            target: isExplicitTarget.value,
            open: isVisible.value,
            disabled: props.disabled,
            arrow: props.arrow,
        }),
    );
    const contentStyle = computed<CSSProperties>(() => ({
        ...floating.floatingStyle.value,
        ...getFloatingOffsetStyle(props.offset, POPOVER_OFFSET_PROPERTIES),
        zIndex: layer.zIndex.value,
    }));
    const triggerProps = computed<PopoverTriggerProps>(() => ({
        'aria-controls': isDisabled.value ? undefined : popoverId.value,
        'aria-expanded': isDisabled.value ? undefined : isVisible.value,
        'aria-haspopup': isDisabled.value ? undefined : popoverRole.value,
        onClick: onTriggerClick,
        onKeydown: onTriggerKeydown,
    }));
    const contentSlotProps = computed<PopoverContentSlotProps>(() => ({
        isOpen: isVisible.value,
        open: openPopover,
        close: closePopover,
        toggle: togglePopover,
    }));
    const slotProps = computed<PopoverSlotProps>(() => ({
        triggerProps: triggerProps.value,
        ...contentSlotProps.value,
    }));

    let shouldReturnFocus = props.returnFocus !== false;
    const focusTrap = useFocusTrap(focusTrapContainers, {
        ...props.focusTrapOptions,
        initialFocus: () => {
            const initialFocus = props.initialFocus;
            return isRef(initialFocus)
                ? (initialFocus.value ?? undefined)
                : (initialFocus ?? undefined);
        },
        fallbackFocus: () => contentRef.value!,
        returnFocusOnDeactivate: props.returnFocus !== false,
        escapeDeactivates: false,
        allowOutsideClick: true,
    });

    function setOpen(nextOpen: boolean) {
        const previousOpen = isOpen.value;
        if (previousOpen !== nextOpen) controllableOpen.setValue(nextOpen);
    }

    function openPopover() {
        if (!isDisabled.value) setOpen(true);
    }

    function closePopover() {
        shouldReturnFocus = props.returnFocus !== false;
        setOpen(false);
    }

    function closePopoverWithoutReturnFocus() {
        shouldReturnFocus = false;
        if (props.trapFocus) focusTrap.deactivate({ returnFocus: false });
        setOpen(false);
        void nextTick(() => {
            if (props.trapFocus && isVisible.value) focusTrap.activate();
        });
    }

    function togglePopover() {
        if (isVisible.value) closePopover();
        else openPopover();
    }

    function onTriggerClick() {
        togglePopover();
    }

    function onTriggerKeydown(event: KeyboardEvent) {
        if (event.key !== 'Escape' || !isVisible.value) return;
        event.stopPropagation();
        closePopover();
    }

    function onCompositeFocusout(event: FocusEvent) {
        const nextTarget = event.relatedTarget;
        if (
            isNodeWithinElement(nextTarget, rootRef.value) ||
            isNodeWithinElement(nextTarget, contentRef.value) ||
            isNodeWithinElement(nextTarget, targetElement.value)
        ) {
            return;
        }

        const listener = attrs.onFocusout;
        const listeners = Array.isArray(listener) ? listener : [listener];
        for (const current of listeners) {
            if (typeof current === 'function') current(event);
        }
    }

    function onDocumentClick() {
        if (props.closeOnOutsideClick === false) return;
        closePopoverWithoutReturnFocus();
    }

    function onDocumentPointerDown() {
        if (props.closeOnOutsideClick === false) return;
        closePopoverWithoutReturnFocus();
    }

    function onDocumentKeydown() {
        if (props.closeOnEscape === false) return;
        closePopover();
    }

    const disconnectLayerInteraction = layer.connectInteraction({
        inside: () => [rootRef.value, targetElement.value],
        clickOutside: onDocumentClick,
        pointerDownOutside: onDocumentPointerDown,
        escapeKeyDown: onDocumentKeydown,
    });

    watch(isDisabled, (disabled) => {
        if (disabled) closePopover();
    });

    watch(
        [isVisible, () => props.trapFocus],
        ([visible, trapFocus]) => {
            if (visible && trapFocus) {
                shouldReturnFocus = props.returnFocus !== false;
                focusTrap.activate();
                return;
            }
            focusTrap.deactivate({ returnFocus: shouldReturnFocus && props.returnFocus !== false });
            shouldReturnFocus = props.returnFocus !== false;
        },
        { flush: 'post', immediate: true },
    );

    usePopoverBindings({
        targetLifecycle,
        popoverId,
        popoverRole,
        isVisible,
        isDisabled,
        onTriggerClick,
    });

    onBeforeUnmount(disconnectLayerInteraction);

    return {
        rootRef,
        contentRef,
        arrowRef,
        popoverId,
        isOpen,
        isDisabled,
        isVisible,
        isTargetMode: isExplicitTarget,
        popoverRole,
        ariaLabel,
        ariaLabelledby,
        ariaDescribedby,
        shouldRenderContent,
        shouldShowContent,
        rootClass,
        contentStyle,
        triggerProps,
        slotProps,
        contentSlotProps,
        actualPlacement: floating.actualPlacement,
        placementSide,
        arrowStyle: floating.arrowStyle,
        teleportTo,
        openPopover,
        closePopover,
        togglePopover,
        onTriggerKeydown,
        onCompositeFocusout,
    };
}
