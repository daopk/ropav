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
    PopoverRole,
    PopoverSlotProps,
    PopoverTriggerProps,
} from './types';

interface PopoverPosition {
    x: number;
    y: number;
}

type Cleanup = () => void;
type TargetAttribute = 'aria-controls' | 'aria-expanded' | 'aria-haspopup';
type PopoverCssVariable =
    | '--_rp-popover-main-axis-offset'
    | '--_rp-popover-cross-axis-offset'
    | '--_rp-popover-target-x'
    | '--_rp-popover-target-y';

const DEFAULT_PLACEMENT: PopoverPlacement = 'bottom';
const DEFAULT_ROLE: PopoverRole = 'dialog';
const TARGET_ATTRIBUTES: TargetAttribute[] = ['aria-controls', 'aria-expanded', 'aria-haspopup'];

function isHTMLElement(value: unknown): value is HTMLElement {
    return typeof HTMLElement !== 'undefined' && value instanceof HTMLElement;
}

function getTargetPosition(rect: DOMRect, placement: PopoverPlacement): PopoverPosition {
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    switch (placement) {
        case 'right':
            return { x: rect.right, y: centerY };
        case 'bottom':
            return { x: centerX, y: rect.bottom };
        case 'left':
            return { x: rect.left, y: centerY };
        case 'top':
        default:
            return { x: centerX, y: rect.top };
    }
}

function setPixelVar(
    style: CSSProperties,
    variable: PopoverCssVariable,
    value: number | undefined,
) {
    if (value != null) style[variable] = `${value}px`;
}

function styleOrUndefined(style: CSSProperties): CSSProperties | undefined {
    return Object.keys(style).length > 0 ? style : undefined;
}

function resolveOffsetStyle(offset: PopoverOffset | undefined): CSSProperties | undefined {
    if (offset == null) return undefined;

    const style: CSSProperties = {};

    if (typeof offset === 'number') {
        setPixelVar(style, '--_rp-popover-main-axis-offset', offset);
        return style;
    }

    setPixelVar(style, '--_rp-popover-main-axis-offset', offset.mainAxis);
    setPixelVar(style, '--_rp-popover-cross-axis-offset', offset.crossAxis);

    return styleOrUndefined(style);
}

function addIdReference(currentValue: string | null, id: string) {
    const ids = (currentValue ?? '').split(/\s+/).filter(Boolean);
    if (!ids.includes(id)) ids.push(id);
    return ids.join(' ');
}

function snapshotAttributes(element: HTMLElement) {
    const snapshot = {} as Record<TargetAttribute, string | null>;

    for (const attribute of TARGET_ATTRIBUTES) {
        snapshot[attribute] = element.getAttribute(attribute);
    }

    return snapshot;
}

function restoreAttributes(element: HTMLElement, snapshot: Record<TargetAttribute, string | null>) {
    for (const attribute of TARGET_ATTRIBUTES) {
        const value = snapshot[attribute];
        if (value == null) element.removeAttribute(attribute);
        else element.setAttribute(attribute, value);
    }
}

function applyTargetAttributes(
    element: HTMLElement,
    snapshot: Record<TargetAttribute, string | null>,
    options: {
        id: string;
        expanded: boolean;
        role: PopoverRole;
    },
) {
    element.setAttribute('aria-controls', addIdReference(snapshot['aria-controls'], options.id));
    element.setAttribute('aria-expanded', String(options.expanded));
    element.setAttribute('aria-haspopup', options.role);
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
    let targetListenerCleanup: Cleanup | undefined;
    let targetListenerElement: HTMLElement | null = null;
    let viewportCleanup: Cleanup | undefined;
    let documentCleanup: Cleanup | undefined;
    let attributedTarget: HTMLElement | null = null;
    let previousTargetAttributes: Record<TargetAttribute, string | null> | null = null;

    const popoverId = computed(() => props.id ?? `${generatedId}-popover`);
    const placement = computed(() => props.placement ?? DEFAULT_PLACEMENT);
    const popoverRole = computed(() => props.role ?? DEFAULT_ROLE);
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

        if (isTargetMode.value && targetPosition.value) {
            setPixelVar(style, '--_rp-popover-target-x', targetPosition.value.x);
            setPixelVar(style, '--_rp-popover-target-y', targetPosition.value.y);
        }

        return styleOrUndefined(style);
    });

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
        restoreAttributes(attributedTarget, previousTargetAttributes);

        attributedTarget = null;
        previousTargetAttributes = null;
    }

    function syncTargetAttributes() {
        restoreTargetAttributes();

        if (!shouldWireTarget.value || !targetElement.value) return;

        attributedTarget = targetElement.value;
        previousTargetAttributes = snapshotAttributes(attributedTarget);

        applyTargetAttributes(attributedTarget, previousTargetAttributes, {
            id: popoverId.value,
            expanded: isVisible.value,
            role: popoverRole.value,
        });
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

    function unbindTargetListeners() {
        targetListenerCleanup?.();
        targetListenerCleanup = undefined;
        targetListenerElement = null;
    }

    function bindTargetListeners(element: HTMLElement) {
        if (targetListenerElement === element) return;

        unbindTargetListeners();
        element.addEventListener('click', onTargetClick);

        targetListenerElement = element;
        targetListenerCleanup = () => {
            element.removeEventListener('click', onTargetClick);
        };
    }

    function syncTargetListeners() {
        if (shouldWireTarget.value && targetElement.value) {
            bindTargetListeners(targetElement.value);
        } else {
            unbindTargetListeners();
        }
    }

    function bindViewportListeners() {
        if (typeof window === 'undefined' || viewportCleanup) return;

        window.addEventListener('resize', updateTargetPosition);
        window.addEventListener('scroll', updateTargetPosition, true);

        viewportCleanup = () => {
            window.removeEventListener('resize', updateTargetPosition);
            window.removeEventListener('scroll', updateTargetPosition, true);
        };
    }

    function removeViewportListeners() {
        viewportCleanup?.();
        viewportCleanup = undefined;
    }

    function syncViewportListeners() {
        if (isVisible.value && isTargetMode.value && targetElement.value) {
            bindViewportListeners();
        } else {
            removeViewportListeners();
        }
    }

    function isEventInsidePopover(event: Event) {
        const eventTarget = event.target;
        if (typeof Node === 'undefined' || !(eventTarget instanceof Node)) return false;

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

    function bindDocumentListeners() {
        if (typeof document === 'undefined' || documentCleanup) return;

        document.addEventListener('click', onDocumentClick, true);
        document.addEventListener('keydown', onDocumentKeydown);

        documentCleanup = () => {
            document.removeEventListener('click', onDocumentClick, true);
            document.removeEventListener('keydown', onDocumentKeydown);
        };
    }

    function removeDocumentListeners() {
        documentCleanup?.();
        documentCleanup = undefined;
    }

    function syncDocumentListeners() {
        if (isVisible.value) bindDocumentListeners();
        else removeDocumentListeners();
    }

    function clearTarget() {
        unbindTargetListeners();
        removeViewportListeners();
        restoreTargetAttributes();
        targetElement.value = null;
        targetPosition.value = null;
    }

    function setTargetElement(nextTarget: HTMLElement | null) {
        if (targetElement.value === nextTarget) return;

        unbindTargetListeners();
        removeViewportListeners();
        restoreTargetAttributes();
        targetElement.value = nextTarget;
    }

    function syncTarget() {
        if (!isTargetMode.value) {
            clearTarget();
            return;
        }

        const nextTarget = resolveTarget();
        setTargetElement(nextTarget);

        if (!targetElement.value) {
            targetPosition.value = null;
            return;
        }

        syncTargetListeners();
        syncTargetAttributes();
        updateTargetPosition();
        syncViewportListeners();
    }

    function syncOpenStateListeners() {
        syncDocumentListeners();
        syncViewportListeners();
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
            updateTargetPosition();
        }

        syncOpenStateListeners();
    });

    onMounted(() => {
        isMounted = true;
        syncTarget();
        syncOpenStateListeners();
    });

    onBeforeUnmount(() => {
        isMounted = false;
        unbindTargetListeners();
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
        popoverRole,
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
