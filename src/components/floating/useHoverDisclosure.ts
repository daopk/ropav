import { computed, onBeforeUnmount, onMounted, shallowRef, toValue, watch } from 'vue';
import { useControllableValue } from '@/composables/useControllableValue';
import type {
    HoverDisclosureContentProps,
    HoverDisclosureContentTarget,
    HoverDisclosureInteractionTarget,
    HoverDisclosureOpenChangeDetails,
    HoverDisclosureOpenChangeReason,
    HoverDisclosureState,
    HoverDisclosureTouchBehavior,
    HoverDisclosureTriggerProps,
    UseHoverDisclosureOptions,
    UseHoverDisclosureReturn,
} from './types';

const DEFAULT_OPEN_DELAY = 0;
const DEFAULT_CLOSE_DELAY = 0;

function isElement(value: unknown): value is Element {
    return typeof Element !== 'undefined' && value instanceof Element;
}

function resolveSelector(selector: string) {
    if (typeof document === 'undefined') return null;

    try {
        return document.querySelector(selector);
    } catch {
        return null;
    }
}

function resolveInteractionTarget(
    target: HoverDisclosureInteractionTarget | null | undefined,
): Element | null {
    if (!target) return null;
    if (typeof target === 'string') return resolveSelector(target);
    if (isElement(target)) return target;

    return isElement(target.contextElement) ? target.contextElement : null;
}

function resolveContentTarget(
    target: HoverDisclosureContentTarget | null | undefined,
): Element | null {
    if (!target) return null;
    return typeof target === 'string' ? resolveSelector(target) : isElement(target) ? target : null;
}

function readDelay(value: number | undefined, fallback: number) {
    if (value == null) return fallback;
    return Number.isFinite(value) ? Math.max(0, value) : fallback;
}

function eventElement(event: Event) {
    return isElement(event.currentTarget) ? event.currentTarget : null;
}

function focusLeavesCurrentTarget(event: FocusEvent) {
    const currentTarget = eventElement(event);
    const nextTarget = event.relatedTarget;
    return !(
        currentTarget &&
        typeof Node !== 'undefined' &&
        nextTarget instanceof Node &&
        currentTarget.contains(nextTarget)
    );
}

export function useHoverDisclosure(
    options: Readonly<UseHoverDisclosureOptions> = {},
): UseHoverDisclosureReturn {
    const resolvedInteractionTarget = shallowRef<Element | null>(null);
    const resolvedContentTarget = shallowRef<Element | null>(null);
    const controlledOpen = computed(() => toValue(options.open));
    const isDisabled = computed(() => Boolean(toValue(options.disabled)));
    let pendingChangeDetails: HoverDisclosureOpenChangeDetails | undefined;
    const controllableOpen = useControllableValue({
        modelValue: () => controlledOpen.value,
        defaultValue: () => options.defaultOpen === true && !isDisabled.value,
        onChange: (nextOpen) => {
            if (pendingChangeDetails) options.onOpenChange?.(nextOpen, pendingChangeDetails);
        },
    });
    const openState = controllableOpen.value;
    const isOpen = computed(() => !isDisabled.value && openState.value);
    const state = computed<HoverDisclosureState>(() => (isOpen.value ? 'open' : 'closed'));

    let requestedOpen = openState.value;
    let triggerHovered = false;
    let contentHovered = false;
    let triggerFocused = false;
    let contentFocused = false;
    let touchPinned = false;
    let touchPointerActive = false;
    let touchClickPending = false;
    let triggerElement: Element | null = null;
    let contentElement: Element | null = null;
    let openTimer: ReturnType<typeof setTimeout> | undefined;
    let closeTimer: ReturnType<typeof setTimeout> | undefined;
    let documentListenersActive = false;
    let disposed = false;

    function getOpenDelay() {
        return readDelay(toValue(options.openDelay), DEFAULT_OPEN_DELAY);
    }

    function getCloseDelay() {
        return readDelay(toValue(options.closeDelay), DEFAULT_CLOSE_DELAY);
    }

    function getTouchBehavior(): HoverDisclosureTouchBehavior {
        return toValue(options.touchBehavior) ?? 'none';
    }

    function clearOpenTimer() {
        if (openTimer === undefined) return;
        clearTimeout(openTimer);
        openTimer = undefined;
    }

    function clearCloseTimer() {
        if (closeTimer === undefined) return;
        clearTimeout(closeTimer);
        closeTimer = undefined;
    }

    function clearTimers() {
        clearOpenTimer();
        clearCloseTimer();
    }

    function hasActiveInteraction() {
        return triggerHovered || contentHovered || triggerFocused || contentFocused || touchPinned;
    }

    function setOpen(nextOpen: boolean, reason: HoverDisclosureOpenChangeReason, event?: Event) {
        if (disposed || (nextOpen && isDisabled.value) || requestedOpen === nextOpen) return;

        requestedOpen = nextOpen;
        pendingChangeDetails = { reason, event };
        try {
            controllableOpen.setValue(nextOpen);
        } finally {
            pendingChangeDetails = undefined;
        }
    }

    function openImmediately(reason: HoverDisclosureOpenChangeReason, event?: Event) {
        clearTimers();
        setOpen(true, reason, event);
    }

    function closeImmediately(reason: HoverDisclosureOpenChangeReason, event?: Event) {
        clearTimers();
        setOpen(false, reason, event);
    }

    function scheduleOpen(reason: HoverDisclosureOpenChangeReason, event?: Event) {
        if (disposed || isDisabled.value) return;

        clearCloseTimer();
        clearOpenTimer();
        if (requestedOpen) return;

        const delay = getOpenDelay();
        if (delay === 0) {
            setOpen(true, reason, event);
            return;
        }

        openTimer = setTimeout(() => {
            openTimer = undefined;
            if (!triggerHovered || isDisabled.value) return;
            setOpen(true, reason, event);
        }, delay);
    }

    function scheduleClose(reason: HoverDisclosureOpenChangeReason, event?: Event) {
        clearOpenTimer();
        clearCloseTimer();
        if (disposed || hasActiveInteraction()) return;

        closeTimer = setTimeout(() => {
            closeTimer = undefined;
            if (hasActiveInteraction()) return;
            setOpen(false, reason, event);
        }, getCloseDelay());
    }

    function rememberTrigger(event: Event) {
        triggerElement = eventElement(event) ?? resolvedInteractionTarget.value ?? triggerElement;
    }

    function rememberContent(event: Event) {
        contentElement = eventElement(event) ?? resolvedContentTarget.value ?? contentElement;
    }

    function onTriggerPointerenter(event: PointerEvent) {
        rememberTrigger(event);
        if (event.pointerType === 'touch' || isDisabled.value) return;

        triggerHovered = true;
        scheduleOpen('hover', event);
    }

    function onTriggerPointerleave(event: PointerEvent) {
        rememberTrigger(event);
        if (event.pointerType === 'touch') return;

        triggerHovered = false;
        scheduleClose('hover', event);
    }

    function onContentPointerenter(event: PointerEvent) {
        rememberContent(event);
        if (event.pointerType === 'touch' || isDisabled.value) return;

        contentHovered = true;
        clearCloseTimer();
    }

    function onContentPointerleave(event: PointerEvent) {
        rememberContent(event);
        if (event.pointerType === 'touch') return;

        contentHovered = false;
        scheduleClose('hover', event);
    }

    function onTriggerFocusin(event: FocusEvent) {
        rememberTrigger(event);
        if (isDisabled.value || toValue(options.openOnFocus) === false) return;

        triggerFocused = true;
        openImmediately('focus', event);
    }

    function onTriggerFocusout(event: FocusEvent) {
        rememberTrigger(event);
        if (!focusLeavesCurrentTarget(event)) return;

        triggerFocused = false;
        scheduleClose('focus', event);
    }

    function onContentFocusin(event: FocusEvent) {
        rememberContent(event);
        if (isDisabled.value) return;

        contentFocused = true;
        clearCloseTimer();
    }

    function onContentFocusout(event: FocusEvent) {
        rememberContent(event);
        if (!focusLeavesCurrentTarget(event)) return;

        contentFocused = false;
        scheduleClose('focus', event);
    }

    function onTriggerPointerdown(event: PointerEvent) {
        rememberTrigger(event);
        touchPointerActive = event.pointerType === 'touch';
        touchClickPending = false;
    }

    function onTriggerPointerup(event: PointerEvent) {
        rememberTrigger(event);
        touchClickPending = event.pointerType === 'touch' && touchPointerActive;
        touchPointerActive = false;
    }

    function onTriggerPointercancel(event: PointerEvent) {
        rememberTrigger(event);
        touchPointerActive = false;
        touchClickPending = false;
    }

    function onTriggerClick(event: MouseEvent) {
        rememberTrigger(event);
        if (!touchClickPending) return;

        touchClickPending = false;
        if (getTouchBehavior() !== 'toggle' || isDisabled.value) return;

        event.preventDefault();
        if (touchPinned || requestedOpen) {
            touchPinned = false;
            closeImmediately('touch', event);
            return;
        }

        touchPinned = true;
        openImmediately('touch', event);
    }

    function onContentPointerdown(event: PointerEvent) {
        rememberContent(event);
    }

    function onKeydown(event: KeyboardEvent) {
        if (event.key !== 'Escape' || toValue(options.closeOnEscape) === false || !isOpen.value) {
            return;
        }

        touchPinned = false;
        closeImmediately('escape', event);
    }

    function open() {
        openImmediately('programmatic');
    }

    function close() {
        touchPinned = false;
        closeImmediately('programmatic');
    }

    function toggle() {
        if (requestedOpen || isOpen.value) close();
        else open();
    }

    function isEventInside(event: Event) {
        const elements = [
            triggerElement,
            contentElement,
            resolvedInteractionTarget.value,
            resolvedContentTarget.value,
        ].filter((element): element is Element => element !== null);
        const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
        if (elements.some((element) => path.includes(element))) return true;

        const target = event.target;
        return (
            typeof Node !== 'undefined' &&
            target instanceof Node &&
            elements.some((element) => element.contains(target))
        );
    }

    function onDocumentPointerdown(event: PointerEvent) {
        if (!touchPinned || isEventInside(event)) return;

        touchPinned = false;
        closeImmediately('outside', event);
    }

    function setDocumentListeners(active: boolean) {
        if (typeof document === 'undefined' || active === documentListenersActive) return;

        documentListenersActive = active;
        const method = active ? 'addEventListener' : 'removeEventListener';
        document[method]('keydown', onKeydown as EventListener);
        document[method]('pointerdown', onDocumentPointerdown as EventListener, true);
    }

    function syncInteractionTarget() {
        resolvedInteractionTarget.value = resolveInteractionTarget(
            toValue(options.interactionTarget),
        );
    }

    function syncContentTarget() {
        resolvedContentTarget.value = resolveContentTarget(toValue(options.contentTarget));
    }

    function bindTriggerTarget(target: Element, cleanup: (callback: () => void) => void) {
        triggerElement = target;
        target.addEventListener('pointerenter', onTriggerPointerenter as EventListener);
        target.addEventListener('pointerleave', onTriggerPointerleave as EventListener);
        target.addEventListener('pointerdown', onTriggerPointerdown as EventListener);
        target.addEventListener('pointerup', onTriggerPointerup as EventListener);
        target.addEventListener('pointercancel', onTriggerPointercancel as EventListener);
        target.addEventListener('click', onTriggerClick as EventListener);
        target.addEventListener('focusin', onTriggerFocusin as EventListener);
        target.addEventListener('focusout', onTriggerFocusout as EventListener);
        target.addEventListener('keydown', onKeydown as EventListener);

        cleanup(() => {
            target.removeEventListener('pointerenter', onTriggerPointerenter as EventListener);
            target.removeEventListener('pointerleave', onTriggerPointerleave as EventListener);
            target.removeEventListener('pointerdown', onTriggerPointerdown as EventListener);
            target.removeEventListener('pointerup', onTriggerPointerup as EventListener);
            target.removeEventListener('pointercancel', onTriggerPointercancel as EventListener);
            target.removeEventListener('click', onTriggerClick as EventListener);
            target.removeEventListener('focusin', onTriggerFocusin as EventListener);
            target.removeEventListener('focusout', onTriggerFocusout as EventListener);
            target.removeEventListener('keydown', onKeydown as EventListener);
            if (triggerElement === target) triggerElement = null;
            triggerHovered = false;
            triggerFocused = false;
            scheduleClose('hover');
        });
    }

    function bindContentTarget(target: Element, cleanup: (callback: () => void) => void) {
        contentElement = target;
        target.addEventListener('pointerenter', onContentPointerenter as EventListener);
        target.addEventListener('pointerleave', onContentPointerleave as EventListener);
        target.addEventListener('pointerdown', onContentPointerdown as EventListener);
        target.addEventListener('focusin', onContentFocusin as EventListener);
        target.addEventListener('focusout', onContentFocusout as EventListener);
        target.addEventListener('keydown', onKeydown as EventListener);

        cleanup(() => {
            target.removeEventListener('pointerenter', onContentPointerenter as EventListener);
            target.removeEventListener('pointerleave', onContentPointerleave as EventListener);
            target.removeEventListener('pointerdown', onContentPointerdown as EventListener);
            target.removeEventListener('focusin', onContentFocusin as EventListener);
            target.removeEventListener('focusout', onContentFocusout as EventListener);
            target.removeEventListener('keydown', onKeydown as EventListener);
            if (contentElement === target) contentElement = null;
            contentHovered = false;
            contentFocused = false;
            scheduleClose('hover');
        });
    }

    const triggerProps = computed<HoverDisclosureTriggerProps>(() => ({
        'data-state': state.value,
        onPointerenter: onTriggerPointerenter,
        onPointerleave: onTriggerPointerleave,
        onPointerdown: onTriggerPointerdown,
        onPointerup: onTriggerPointerup,
        onPointercancel: onTriggerPointercancel,
        onClick: onTriggerClick,
        onFocusin: onTriggerFocusin,
        onFocusout: onTriggerFocusout,
        onKeydown,
    }));
    const contentProps = computed<HoverDisclosureContentProps>(() => ({
        'data-state': state.value,
        onPointerenter: onContentPointerenter,
        onPointerleave: onContentPointerleave,
        onPointerdown: onContentPointerdown,
        onFocusin: onContentFocusin,
        onFocusout: onContentFocusout,
        onKeydown,
    }));

    watch(
        [openState, controllableOpen.isControlled],
        ([value]) => {
            requestedOpen = value;
            if (!value) {
                contentHovered = false;
                contentFocused = false;
                contentElement = null;
                touchPinned = false;
            }
        },
        { flush: 'sync' },
    );

    watch(isDisabled, (disabled) => {
        if (!disabled) return;

        triggerHovered = false;
        contentHovered = false;
        triggerFocused = false;
        contentFocused = false;
        touchPinned = false;
        touchPointerActive = false;
        touchClickPending = false;
        closeImmediately('disabled');
    });

    watch(
        () => getTouchBehavior(),
        (behavior) => {
            if (behavior === 'toggle' || !touchPinned) return;
            touchPinned = false;
            closeImmediately('touch');
        },
    );

    watch(() => toValue(options.interactionTarget), syncInteractionTarget, {
        flush: 'post',
        immediate: true,
    });
    watch(() => toValue(options.contentTarget), syncContentTarget, {
        flush: 'post',
        immediate: true,
    });
    watch(
        resolvedInteractionTarget,
        (target, _previous, cleanup) => {
            if (target) bindTriggerTarget(target, cleanup);
        },
        { flush: 'sync', immediate: true },
    );
    watch(
        resolvedContentTarget,
        (target, _previous, cleanup) => {
            if (target) bindContentTarget(target, cleanup);
        },
        { flush: 'sync', immediate: true },
    );
    watch(isOpen, setDocumentListeners, { flush: 'sync' });
    watch(
        isOpen,
        () => {
            syncInteractionTarget();
            syncContentTarget();
        },
        { flush: 'post' },
    );

    onMounted(() => {
        syncInteractionTarget();
        syncContentTarget();
        setDocumentListeners(isOpen.value);
    });

    onBeforeUnmount(() => {
        disposed = true;
        clearTimers();
        setDocumentListeners(false);
    });

    return {
        isOpen,
        isDisabled,
        state,
        triggerProps,
        contentProps,
        open,
        close,
        toggle,
    };
}
