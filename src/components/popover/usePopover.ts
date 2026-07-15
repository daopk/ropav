import {
    computed,
    isRef,
    nextTick,
    onBeforeUnmount,
    onMounted,
    ref,
    useId,
    useSlots,
    watch,
    type CSSProperties,
} from 'vue';
import { bem } from '@/utils/bem';
import { createRafScheduler } from '@/utils/rafScheduler';
import { useFocusTrap } from '../focus-trap/useFocusTrap';
import type { FocusTrapContainers } from '../focus-trap/types';
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

type PopoverSide = 'top' | 'right' | 'bottom' | 'left';
type PopoverAlignment = 'start' | 'center' | 'end';

type PopoverCssVariable =
    | '--_rp-popover-main-axis-offset'
    | '--_rp-popover-cross-axis-offset'
    | '--_rp-popover-target-x'
    | '--_rp-popover-target-y';

const DEFAULT_PLACEMENT: PopoverPlacement = 'bottom';
const DEFAULT_ROLE: PopoverRole = 'dialog';
const TARGET_ATTRIBUTES = ['aria-controls', 'aria-expanded', 'aria-haspopup'] as const;

type TargetAttribute = (typeof TARGET_ATTRIBUTES)[number];

function isHTMLElement(value: unknown): value is HTMLElement {
    return typeof HTMLElement !== 'undefined' && value instanceof HTMLElement;
}

function getTargetPosition(rect: DOMRect, placement: PopoverPlacement): PopoverPosition {
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const [side, alignment = 'center'] = placement.split('-') as [PopoverSide, PopoverAlignment?];
    const alignedX = alignment === 'start' ? rect.left : alignment === 'end' ? rect.right : centerX;
    const alignedY = alignment === 'start' ? rect.top : alignment === 'end' ? rect.bottom : centerY;

    switch (side) {
        case 'right':
            return { x: rect.right, y: alignedY };
        case 'bottom':
            return { x: alignedX, y: rect.bottom };
        case 'left':
            return { x: rect.left, y: alignedY };
        case 'top':
        default:
            return { x: alignedX, y: rect.top };
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

function resolveTargetElement(target: string | HTMLElement | null | undefined): HTMLElement | null {
    if (!target) return null;

    if (typeof target !== 'string') return isHTMLElement(target) ? target : null;
    if (typeof document === 'undefined') return null;

    try {
        const element = document.querySelector(target);
        return isHTMLElement(element) ? element : null;
    } catch {
        return null;
    }
}

export function usePopover(
    props: Readonly<PopoverProps>,
    emitOpenChange?: (open: boolean) => void,
) {
    const slots = useSlots();
    const generatedId = useId();
    const rootRef = ref<HTMLElement | null>(null);
    const contentRef = ref<HTMLElement | null>(null);
    const targetElement = ref<HTMLElement | null>(null);
    const targetPosition = ref<PopoverPosition | null>(null);
    const uncontrolledOpen = ref(false);
    const positionScheduler = createRafScheduler(
        updateTargetPosition,
        () => targetElement.value?.ownerDocument.defaultView,
    );

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
    const shouldRenderContent = computed(
        () => !isDisabled.value && (Boolean(props.keepMounted) || isVisible.value),
    );
    const shouldShowContent = computed(() => !props.keepMounted || isVisible.value);
    const shouldWireTarget = computed(() => isTargetMode.value && !isDisabled.value);
    const focusTrapContainers = computed<FocusTrapContainers | null>(() => {
        const root = rootRef.value;
        if (!root) return null;

        const target = targetElement.value;
        return isTargetMode.value && target ? [target, root] : root;
    });
    const ariaLabel = computed(() => props.ariaLabel || undefined);
    const ariaLabelledby = computed(() => props.ariaLabelledby || undefined);
    const ariaDescribedby = computed(() => props.ariaDescribedby || undefined);

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

    let shouldReturnFocus = props.returnFocus !== false;

    const focusTrap = useFocusTrap(focusTrapContainers, {
        ...props.focusTrapOptions,
        initialFocus: () => {
            const initialFocus = props.initialFocus;
            return isRef(initialFocus)
                ? (initialFocus.value ?? undefined)
                : (initialFocus ?? undefined);
        },
        fallbackFocus: () => contentRef.value ?? rootRef.value!,
        returnFocusOnDeactivate: props.returnFocus !== false,
        escapeDeactivates: false,
        allowOutsideClick: true,
    });

    function setOpen(nextOpen: boolean) {
        const previousOpen = isOpen.value;
        if (props.open === undefined) uncontrolledOpen.value = nextOpen;
        if (previousOpen !== nextOpen) emitOpenChange?.(nextOpen);
    }

    function openPopover() {
        if (isDisabled.value) return;
        setOpen(true);
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

    function isEventInsidePopover(event: Event) {
        const eventTarget = event.target;
        if (typeof Node === 'undefined' || !(eventTarget instanceof Node)) return false;

        return Boolean(
            rootRef.value?.contains(eventTarget) || targetElement.value?.contains(eventTarget),
        );
    }

    function onDocumentClick(event: MouseEvent) {
        if (props.closeOnOutsideClick === false || isEventInsidePopover(event)) return;
        closePopoverWithoutReturnFocus();
    }

    function onDocumentPointerDown(event: MouseEvent | TouchEvent) {
        if (!props.trapFocus) return;
        if (props.closeOnOutsideClick === false || isEventInsidePopover(event)) return;
        closePopoverWithoutReturnFocus();
    }

    function onDocumentKeydown(event: KeyboardEvent) {
        if (props.closeOnEscape === false || event.key !== 'Escape') return;
        closePopover();
    }

    function syncTargetElement() {
        positionScheduler.cancel();
        const nextTarget = isTargetMode.value ? resolveTargetElement(readTarget()) : null;

        if (targetElement.value !== nextTarget) {
            targetElement.value = nextTarget;
        }

        if (!nextTarget) {
            targetPosition.value = null;
            return;
        }
    }

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

    watch(
        () => readTarget(),
        () => syncTargetElement(),
        { flush: 'post' },
    );

    watch(
        [shouldWireTarget, targetElement],
        ([shouldWire, target], _previous, onCleanup) => {
            if (!shouldWire || !target) return;

            target.addEventListener('click', onTargetClick);
            onCleanup(() => {
                target.removeEventListener('click', onTargetClick);
            });
        },
        { flush: 'sync' },
    );

    watch(
        [shouldWireTarget, targetElement, popoverId, popoverRole, isVisible],
        ([shouldWire, target], _previous, onCleanup) => {
            if (!shouldWire || !target) return;

            const snapshot = snapshotAttributes(target);
            applyTargetAttributes(target, snapshot, {
                id: popoverId.value,
                expanded: isVisible.value,
                role: popoverRole.value,
            });

            onCleanup(() => {
                restoreAttributes(target, snapshot);
            });
        },
        { flush: 'sync' },
    );

    watch(
        [isVisible, isTargetMode, targetElement],
        ([visible, targetMode, target], _previous, onCleanup) => {
            const view = target?.ownerDocument.defaultView;
            if (!visible || !targetMode || !view) return;

            view.addEventListener('resize', positionScheduler.schedule);
            view.addEventListener('scroll', positionScheduler.schedule, true);

            onCleanup(() => {
                view.removeEventListener('resize', positionScheduler.schedule);
                view.removeEventListener('scroll', positionScheduler.schedule, true);
                positionScheduler.cancel();
            });
        },
        { flush: 'sync' },
    );

    watch(
        isVisible,
        (visible, _previous, onCleanup) => {
            if (!visible || typeof document === 'undefined') return;

            document.addEventListener('click', onDocumentClick, true);
            document.addEventListener('mousedown', onDocumentPointerDown, true);
            document.addEventListener('touchstart', onDocumentPointerDown, true);
            document.addEventListener('keydown', onDocumentKeydown);

            onCleanup(() => {
                document.removeEventListener('click', onDocumentClick, true);
                document.removeEventListener('mousedown', onDocumentPointerDown, true);
                document.removeEventListener('touchstart', onDocumentPointerDown, true);
                document.removeEventListener('keydown', onDocumentKeydown);
            });
        },
        { flush: 'sync', immediate: true },
    );

    watch(
        [targetElement, placement, isVisible],
        () => {
            positionScheduler.cancel();
            if (isVisible.value) updateTargetPosition();
        },
        { flush: 'sync' },
    );

    onMounted(syncTargetElement);
    onBeforeUnmount(positionScheduler.cancel);

    return {
        rootRef,
        contentRef,
        popoverId,
        isOpen,
        isVisible,
        isTargetMode,
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
        openPopover,
        closePopover,
        togglePopover,
        onTriggerKeydown,
    };
}
