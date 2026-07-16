import {
    computed,
    isRef,
    nextTick,
    ref,
    useAttrs,
    useId,
    useSlots,
    watch,
    type CSSProperties,
} from 'vue';
import { bem } from '@/utils/bem';
import { useFocusTrap } from '../focus-trap/useFocusTrap';
import type { FocusTrapContainers } from '../focus-trap/types';
import {
    isElementReference,
    useFloatingPositionInternal,
    useFloatingTarget,
} from '../floating/useFloatingPosition';
import { useTeleportTarget } from '../teleport-provider/useTeleportTarget';
import type {
    PopoverContentSlotProps,
    PopoverOffset,
    PopoverPlacement,
    PopoverProps,
    PopoverRole,
    PopoverSlotProps,
    PopoverTriggerProps,
} from './types';

const DEFAULT_PLACEMENT: PopoverPlacement = 'bottom';
const DEFAULT_ROLE: PopoverRole = 'dialog';
const TARGET_ATTRIBUTES = ['aria-controls', 'aria-expanded', 'aria-haspopup'] as const;
const TABBABLE_SELECTOR = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(',');

type TargetAttribute = (typeof TARGET_ATTRIBUTES)[number];

function addIdReference(currentValue: string | null, id: string) {
    const ids = (currentValue ?? '').split(/\s+/).filter(Boolean);
    if (!ids.includes(id)) ids.push(id);
    return ids.join(' ');
}

function snapshotAttributes(element: Element) {
    const snapshot = {} as Record<TargetAttribute, string | null>;
    for (const attribute of TARGET_ATTRIBUTES)
        snapshot[attribute] = element.getAttribute(attribute);
    return snapshot;
}

function restoreAttributes(element: Element, snapshot: Record<TargetAttribute, string | null>) {
    for (const attribute of TARGET_ATTRIBUTES) {
        const value = snapshot[attribute];
        if (value == null) element.removeAttribute(attribute);
        else element.setAttribute(attribute, value);
    }
}

function applyTargetAttributes(
    element: Element,
    snapshot: Record<TargetAttribute, string | null>,
    options: { id: string; expanded: boolean; role: PopoverRole },
) {
    element.setAttribute('aria-controls', addIdReference(snapshot['aria-controls'], options.id));
    element.setAttribute('aria-expanded', String(options.expanded));
    element.setAttribute('aria-haspopup', options.role);
}

function isFocusTrapContainer(value: Element | null): value is HTMLElement | SVGElement {
    return (
        (typeof HTMLElement !== 'undefined' && value instanceof HTMLElement) ||
        (typeof SVGElement !== 'undefined' && value instanceof SVGElement)
    );
}

function resolveOffsetStyle(offset: PopoverOffset | undefined): CSSProperties | undefined {
    if (offset == null) return undefined;
    if (typeof offset === 'number') {
        return { '--_rp-popover-main-axis-offset': `${offset}px` };
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
    const uncontrolledOpen = ref(false);
    const popoverId = computed(() => props.id ?? `${generatedId}-popover`);
    const placement = computed(() => props.placement ?? DEFAULT_PLACEMENT);
    const popoverRole = computed(() => props.role ?? DEFAULT_ROLE);
    const teleportTo = useTeleportTarget(() => props.teleportTo);
    const { isExplicitTarget, reference, resolvedTarget } = useFloatingTarget(
        () => props.target,
        rootRef,
    );
    const targetElement = computed(() =>
        isElementReference(resolvedTarget.value) ? resolvedTarget.value : null,
    );
    const hasContent = computed(() =>
        Boolean(slots.content || (isExplicitTarget.value && slots.default)),
    );
    const isDisabled = computed(() => Boolean(props.disabled || !hasContent.value));
    const isOpen = computed(() => props.open ?? uncontrolledOpen.value);
    const isVisible = computed(() => isOpen.value && !isDisabled.value);
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
        return isFocusTrapContainer(trigger) ? [trigger, content] : content;
    });

    const floating = useFloatingPositionInternal(
        {
            reference,
            floating: contentRef,
            arrow: arrowRef,
            open: isVisible,
            placement: () => placement.value,
            strategy: () => props.strategy ?? 'absolute',
            offset: () => props.offset,
            flip: () => props.flip !== false,
            shift: () => props.shift !== false,
            collisionPadding: () => props.collisionPadding ?? 8,
        },
        () => teleportTo.value,
    );
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
        ...resolveOffsetStyle(props.offset),
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
        if (props.open === undefined) uncontrolledOpen.value = nextOpen;
        if (previousOpen !== nextOpen) emitOpenChange?.(nextOpen);
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
        if (event.key !== 'Escape') return;
        event.stopPropagation();
        closePopover();
    }

    function isEventInsidePopover(event: Event) {
        const eventTarget = event.target;
        if (typeof Node === 'undefined' || !(eventTarget instanceof Node)) return false;
        return Boolean(
            rootRef.value?.contains(eventTarget) ||
            contentRef.value?.contains(eventTarget) ||
            targetElement.value?.contains(eventTarget),
        );
    }

    function onCompositeFocusout(event: FocusEvent) {
        const nextTarget = event.relatedTarget;
        if (
            nextTarget instanceof Node &&
            (rootRef.value?.contains(nextTarget) ||
                contentRef.value?.contains(nextTarget) ||
                targetElement.value?.contains(nextTarget))
        ) {
            return;
        }

        const listener = attrs.onFocusout;
        const listeners = Array.isArray(listener) ? listener : [listener];
        for (const current of listeners) {
            if (typeof current === 'function') current(event);
        }
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
        if (props.trapFocus && event.key === 'Tab') {
            const containers = [targetElement.value ?? rootRef.value, contentRef.value];
            const tabbables: HTMLElement[] = [];
            for (const container of containers) {
                if (!container) continue;
                if (container instanceof HTMLElement && container.matches(TABBABLE_SELECTOR)) {
                    tabbables.push(container);
                }
                tabbables.push(...container.querySelectorAll<HTMLElement>(TABBABLE_SELECTOR));
            }
            const active = event.target;
            const first = tabbables[0];
            const last = tabbables[tabbables.length - 1];
            if (event.shiftKey && active === first && last) {
                event.preventDefault();
                last.focus();
                return;
            }
            if (!event.shiftKey && active === last && first) {
                event.preventDefault();
                first.focus();
                return;
            }
        }
        if (props.closeOnEscape === false || event.key !== 'Escape') return;
        closePopover();
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
        [isExplicitTarget, targetElement],
        ([explicit, target], _previous, onCleanup) => {
            if (!explicit || !target) return;
            target.addEventListener('click', onTriggerClick);
            onCleanup(() => target.removeEventListener('click', onTriggerClick));
        },
        { flush: 'sync' },
    );

    watch(
        [isExplicitTarget, targetElement, popoverId, popoverRole, isVisible, isDisabled],
        ([explicit, target, id, role, visible, disabled], _previous, onCleanup) => {
            if (!explicit || !target || disabled) return;
            const snapshot = snapshotAttributes(target);
            applyTargetAttributes(target, snapshot, { id, expanded: visible, role });
            onCleanup(() => restoreAttributes(target, snapshot));
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
