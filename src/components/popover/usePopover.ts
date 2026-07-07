import {
    computed,
    isRef,
    onBeforeUnmount,
    onMounted,
    ref,
    useId,
    useSlots,
    watch,
    type CSSProperties,
} from 'vue';
import { bem } from '@/utils/bem';
import type {
    PopoverContentSlotProps,
    PopoverOffset,
    PopoverPlacement,
    PopoverProps,
    PopoverSlotProps,
    PopoverTriggerProps,
} from './types';

interface PopoverPosition {
    x: number;
    y: number;
}

type TargetAttribute = 'aria-controls' | 'aria-expanded' | 'aria-haspopup';

function isHTMLElement(value: unknown): value is HTMLElement {
    return typeof HTMLElement !== 'undefined' && value instanceof HTMLElement;
}

function getTargetPosition(rect: DOMRect, placement: PopoverPlacement): PopoverPosition {
    switch (placement) {
        case 'right':
            return { x: rect.right, y: rect.top + rect.height / 2 };
        case 'bottom':
            return { x: rect.left + rect.width / 2, y: rect.bottom };
        case 'left':
            return { x: rect.left, y: rect.top + rect.height / 2 };
        case 'top':
        default:
            return { x: rect.left + rect.width / 2, y: rect.top };
    }
}

function resolveOffsetStyle(offset: PopoverOffset | undefined): CSSProperties | undefined {
    if (offset == null) return undefined;

    if (typeof offset === 'number') {
        return {
            '--_rp-popover-main-axis-offset': `${offset}px`,
        };
    }

    const style: CSSProperties = {};

    if (offset.mainAxis != null) {
        style['--_rp-popover-main-axis-offset'] = `${offset.mainAxis}px`;
    }

    if (offset.crossAxis != null) {
        style['--_rp-popover-cross-axis-offset'] = `${offset.crossAxis}px`;
    }

    return Object.keys(style).length > 0 ? style : undefined;
}

function addIdReference(currentValue: string | null, id: string) {
    const ids = (currentValue ?? '').split(/\s+/).filter(Boolean);
    if (!ids.includes(id)) ids.push(id);
    return ids.join(' ');
}

export function usePopover(
    props: Readonly<PopoverProps>,
    emitOpenChange?: (open: boolean) => void,
) {
    const slots = useSlots();
    const generatedId = useId();
    const rootRef = ref<HTMLElement | null>(null);
    const targetElement = ref<HTMLElement | null>(null);
    const targetPosition = ref<PopoverPosition | null>(null);
    const uncontrolledOpen = ref(false);

    let isMounted = false;
    let removeTargetListeners: (() => void) | undefined;
    let removePositionListeners: (() => void) | undefined;
    let removeInteractionListeners: (() => void) | undefined;
    let attributedTarget: HTMLElement | null = null;
    let previousTargetAttributes: Record<TargetAttribute, string | null> | null = null;

    const popoverId = computed(() => props.id ?? `${generatedId}-popover`);
    const placement = computed(() => props.placement ?? 'bottom');
    const popoverRole = computed(() => props.role ?? 'dialog');
    const isTargetMode = computed(() => props.target != null && props.target !== '');
    const hasContent = computed(() =>
        Boolean(slots.content || (isTargetMode.value && slots.default)),
    );
    const isDisabled = computed(() => Boolean(props.disabled || !hasContent.value));
    const isOpen = computed(() => props.open ?? uncontrolledOpen.value);
    const isVisible = computed(() => isOpen.value && !isDisabled.value);
    const shouldRenderContent = computed(() => !isDisabled.value);
    const shouldWireTarget = computed(() => isTargetMode.value && !isDisabled.value);

    const rootClass = computed(() =>
        bem('rp-popover', {
            [`placement-${placement.value}`]: true,
            target: isTargetMode.value,
            open: isVisible.value,
            disabled: props.disabled,
        }),
    );

    const contentStyle = computed<CSSProperties | undefined>(() => {
        const style: CSSProperties = {
            ...resolveOffsetStyle(props.offset),
        };

        if (!isTargetMode.value || !targetPosition.value) {
            return Object.keys(style).length > 0 ? style : undefined;
        }

        return {
            ...style,
            '--_rp-popover-target-x': `${targetPosition.value.x}px`,
            '--_rp-popover-target-y': `${targetPosition.value.y}px`,
        };
    });

    const triggerProps = computed<PopoverTriggerProps>(() => ({
        'aria-controls': isDisabled.value ? undefined : popoverId.value,
        'aria-expanded': isDisabled.value ? undefined : isVisible.value,
        'aria-haspopup': isDisabled.value ? undefined : popoverRole.value,
        onClick: onTriggerClick,
        onKeydown: onTriggerKeydown,
    }));

    const slotProps = computed<PopoverSlotProps>(() => ({
        triggerProps: triggerProps.value,
        isOpen: isVisible.value,
        open: openPopover,
        close: closePopover,
        toggle: togglePopover,
    }));

    const contentSlotProps = computed<PopoverContentSlotProps>(() => ({
        isOpen: isVisible.value,
        open: openPopover,
        close: closePopover,
        toggle: togglePopover,
    }));

    function setOpen(nextOpen: boolean) {
        const previousOpen = isOpen.value;
        if (props.open === undefined) uncontrolledOpen.value = nextOpen;
        if (previousOpen !== nextOpen) emitOpenChange?.(nextOpen);
    }

    function openPopover() {
        if (isDisabled.value) return;
        updateTargetPosition();
        setOpen(true);
    }

    function closePopover() {
        setOpen(false);
    }

    function togglePopover() {
        if (isVisible.value) closePopover();
        else openPopover();
    }

    function onTriggerClick() {
        togglePopover();
    }

    function onTriggerKeydown(event: KeyboardEvent) {
        if (event.key !== 'Escape') return;
        event.stopPropagation();
        closePopover();
    }

    function onTargetClick() {
        togglePopover();
    }

    function readTarget() {
        return isRef(props.target) ? props.target.value : props.target;
    }

    function resolveTarget() {
        const target = readTarget();
        if (!target) return null;

        if (typeof target === 'string') {
            if (typeof document === 'undefined') return null;

            try {
                const element = document.querySelector(target);
                return isHTMLElement(element) ? element : null;
            } catch {
                return null;
            }
        }

        return isHTMLElement(target) ? target : null;
    }

    function restoreTargetAttributes() {
        if (!attributedTarget || !previousTargetAttributes) return;

        for (const [attribute, value] of Object.entries(previousTargetAttributes)) {
            if (value == null) attributedTarget.removeAttribute(attribute);
            else attributedTarget.setAttribute(attribute, value);
        }

        attributedTarget = null;
        previousTargetAttributes = null;
    }

    function syncTargetAttributes() {
        restoreTargetAttributes();

        if (!shouldWireTarget.value || !targetElement.value) return;

        attributedTarget = targetElement.value;
        previousTargetAttributes = {
            'aria-controls': attributedTarget.getAttribute('aria-controls'),
            'aria-expanded': attributedTarget.getAttribute('aria-expanded'),
            'aria-haspopup': attributedTarget.getAttribute('aria-haspopup'),
        };

        attributedTarget.setAttribute(
            'aria-controls',
            addIdReference(previousTargetAttributes['aria-controls'], popoverId.value),
        );
        attributedTarget.setAttribute('aria-expanded', String(isVisible.value));
        attributedTarget.setAttribute('aria-haspopup', popoverRole.value);
    }

    function updateTargetPosition() {
        if (!isTargetMode.value || !targetElement.value) {
            targetPosition.value = null;
            return;
        }

        targetPosition.value = getTargetPosition(
            targetElement.value.getBoundingClientRect(),
            placement.value,
        );
    }

    function bindTargetListeners(element: HTMLElement) {
        removeTargetListeners?.();

        element.addEventListener('click', onTargetClick);

        removeTargetListeners = () => {
            element.removeEventListener('click', onTargetClick);
            removeTargetListeners = undefined;
        };
    }

    function removeViewportListeners() {
        removePositionListeners?.();
        removePositionListeners = undefined;
    }

    function bindViewportListeners() {
        if (typeof window === 'undefined' || removePositionListeners) return;

        window.addEventListener('resize', updateTargetPosition);
        window.addEventListener('scroll', updateTargetPosition, true);

        removePositionListeners = () => {
            window.removeEventListener('resize', updateTargetPosition);
            window.removeEventListener('scroll', updateTargetPosition, true);
        };
    }

    function isEventInsidePopover(event: Event) {
        const eventTarget = event.target;
        if (!eventTarget || !(eventTarget instanceof Node)) return false;

        return Boolean(
            rootRef.value?.contains(eventTarget) || targetElement.value?.contains(eventTarget),
        );
    }

    function onDocumentClick(event: MouseEvent) {
        if (props.closeOnOutsideClick === false || isEventInsidePopover(event)) return;
        closePopover();
    }

    function onDocumentKeydown(event: KeyboardEvent) {
        if (props.closeOnEscape === false || event.key !== 'Escape') return;
        closePopover();
    }

    function removeDocumentListeners() {
        removeInteractionListeners?.();
        removeInteractionListeners = undefined;
    }

    function bindDocumentListeners() {
        if (typeof document === 'undefined' || removeInteractionListeners) return;

        document.addEventListener('click', onDocumentClick, true);
        document.addEventListener('keydown', onDocumentKeydown);

        removeInteractionListeners = () => {
            document.removeEventListener('click', onDocumentClick, true);
            document.removeEventListener('keydown', onDocumentKeydown);
        };
    }

    function syncTarget() {
        if (!isTargetMode.value) {
            removeTargetListeners?.();
            removeViewportListeners();
            restoreTargetAttributes();
            targetElement.value = null;
            targetPosition.value = null;
            return;
        }

        const nextTarget = resolveTarget();
        if (targetElement.value === nextTarget) {
            if (shouldWireTarget.value && nextTarget) bindTargetListeners(nextTarget);
            else removeTargetListeners?.();
            syncTargetAttributes();
            updateTargetPosition();
            return;
        }

        removeTargetListeners?.();
        removeViewportListeners();
        restoreTargetAttributes();
        targetElement.value = nextTarget;

        if (!nextTarget) {
            targetPosition.value = null;
            return;
        }

        if (shouldWireTarget.value) bindTargetListeners(nextTarget);
        syncTargetAttributes();
        updateTargetPosition();
    }

    watch(isDisabled, (disabled) => {
        if (disabled) closePopover();
        if (isMounted) syncTarget();
    });

    watch(
        () => readTarget(),
        () => {
            if (isMounted) syncTarget();
        },
        { flush: 'post' },
    );

    watch([isTargetMode, shouldWireTarget, popoverId, popoverRole, isVisible], () => {
        if (isMounted) syncTargetAttributes();
    });

    watch([placement, isVisible], () => {
        if (isMounted && isVisible.value) updateTargetPosition();
    });

    watch(isVisible, (visible) => {
        if (!isMounted) return;

        if (visible) {
            bindDocumentListeners();
            if (isTargetMode.value) {
                updateTargetPosition();
                bindViewportListeners();
            }
        } else {
            removeDocumentListeners();
            removeViewportListeners();
        }
    });

    onMounted(() => {
        isMounted = true;
        syncTarget();

        if (isVisible.value) {
            bindDocumentListeners();
            if (isTargetMode.value) bindViewportListeners();
        }
    });

    onBeforeUnmount(() => {
        isMounted = false;
        removeTargetListeners?.();
        removeViewportListeners();
        removeDocumentListeners();
        restoreTargetAttributes();
    });

    return {
        rootRef,
        popoverId,
        isOpen,
        isVisible,
        isTargetMode,
        shouldRenderContent,
        rootClass,
        contentStyle,
        triggerProps,
        slotProps,
        contentSlotProps,
        openPopover,
        closePopover,
        togglePopover,
        onTriggerKeydown,
    };
}
