import {
    computed,
    onBeforeUnmount,
    onMounted,
    shallowRef,
    toValue,
    watch,
    type ComputedRef,
    type Ref,
} from 'vue';
import { useControllableValue } from '@/composables/useControllableValue';
import {
    isEventWithinElement,
    isEventWithinTargets,
    isNodeWithinElement,
} from '@/utils/dom/events';
import { isElement } from '@/utils/dom/query';
import { normalizeDelay } from '@/utils/number';
import type {
    HoverDisclosureContentProps,
    HoverDisclosureOpenChangeDetails,
    HoverDisclosureOpenChangeReason,
    HoverDisclosureState,
    HoverDisclosureTouchBehavior,
    HoverDisclosureTriggerProps,
    UseHoverDisclosureOptions,
    UseHoverDisclosureReturn,
} from './types';
import { useFloatingTargetLifecycle } from './useFloatingTargetLifecycle';

type HoverDisclosureInteractionPart = 'trigger' | 'content';
type HoverDisclosureTargetListener = readonly [type: string, listener: EventListener];

interface HoverDisclosureInteractionState {
    contentFocused: boolean;
    contentHovered: boolean;
    touchClickPending: boolean;
    touchPinned: boolean;
    touchPointerActive: boolean;
    triggerFocused: boolean;
    triggerHovered: boolean;
}

interface HoverDisclosureTargetState {
    contentElement: Element | null;
    resolvedContentTarget: Readonly<Ref<Element | null>>;
    resolvedInteractionTarget: Readonly<Ref<Element | null>>;
    triggerElement: Element | null;
}

interface HoverDisclosureChangeRequest {
    event?: Event;
    open: boolean;
    reason: HoverDisclosureOpenChangeReason;
    timing: 'delayed' | 'immediate';
}

interface HoverDisclosureCommands {
    cancelScheduledClose: () => void;
    close: () => void;
    isDisabled: ComputedRef<boolean>;
    isOpen: ComputedRef<boolean>;
    isRequestedOpen: () => boolean;
    open: () => void;
    request: (change: HoverDisclosureChangeRequest) => void;
    state: ComputedRef<HoverDisclosureState>;
    toggle: () => void;
}

interface HoverDisclosureRuntime {
    contentListeners: readonly HoverDisclosureTargetListener[];
    contentProps: ComputedRef<HoverDisclosureContentProps>;
    isOutsideDismissalActive: () => boolean;
    onDocumentKeydown: (event: KeyboardEvent) => void;
    onOutsidePointerdown: (event: PointerEvent) => void;
    onTargetDetached: (part: HoverDisclosureInteractionPart) => void;
    triggerListeners: readonly HoverDisclosureTargetListener[];
    triggerProps: ComputedRef<HoverDisclosureTriggerProps>;
}

interface HoverDisclosureDismissalHandlers {
    escapeKeyDown: (event: KeyboardEvent) => void;
    pointerDownOutside: (event: PointerEvent) => void;
}

interface HoverDisclosureWithExternalDismissal {
    disclosure: UseHoverDisclosureReturn;
    dismissalHandlers: HoverDisclosureDismissalHandlers;
}

const DEFAULT_OPEN_DELAY = 0;
const DEFAULT_CLOSE_DELAY = 0;
const TOUCH_CLICK_EXPIRY_DELAY = 500;

export function useHoverDisclosure(
    options: Readonly<UseHoverDisclosureOptions> = {},
): UseHoverDisclosureReturn {
    return useHoverDisclosureImplementation(options).disclosure;
}

export function useHoverDisclosureWithExternalDismissal(
    options: Readonly<UseHoverDisclosureOptions>,
): HoverDisclosureWithExternalDismissal {
    return useHoverDisclosureImplementation(options, true);
}

function useHoverDisclosureImplementation(
    options: Readonly<UseHoverDisclosureOptions>,
    dismissalRouted = false,
): HoverDisclosureWithExternalDismissal {
    const interaction = createInteractionState();
    const targets = createTargetState();
    const commands = useHoverDisclosureOpenState(options, interaction, () => {
        targets.contentElement = null;
    });
    const runtime = useHoverDisclosureInteractions({
        commands,
        dismissalRouted,
        interaction,
        options,
        state: commands.state,
        targets,
    });

    useHoverDisclosureTargetBinding({
        commands,
        options,
        runtime,
        targets,
        useDocumentDismissal: !dismissalRouted,
    });

    return {
        disclosure: {
            isOpen: commands.isOpen,
            isDisabled: commands.isDisabled,
            state: commands.state,
            triggerProps: runtime.triggerProps,
            contentProps: runtime.contentProps,
            open: commands.open,
            close: commands.close,
            toggle: commands.toggle,
        },
        dismissalHandlers: {
            escapeKeyDown: runtime.onDocumentKeydown,
            pointerDownOutside: runtime.onOutsidePointerdown,
        },
    };
}

function createInteractionState(): HoverDisclosureInteractionState {
    return {
        contentFocused: false,
        contentHovered: false,
        touchClickPending: false,
        touchPinned: false,
        touchPointerActive: false,
        triggerFocused: false,
        triggerHovered: false,
    };
}

function createTargetState(): HoverDisclosureTargetState {
    return {
        contentElement: null,
        resolvedContentTarget: shallowRef(null),
        resolvedInteractionTarget: shallowRef(null),
        triggerElement: null,
    };
}

function hasActiveInteraction(state: Readonly<HoverDisclosureInteractionState>) {
    return (
        state.triggerHovered ||
        state.contentHovered ||
        state.triggerFocused ||
        state.contentFocused ||
        state.touchPinned
    );
}

function hasPendingTouchInteraction(state: Readonly<HoverDisclosureInteractionState>) {
    return state.touchPointerActive || state.touchClickPending;
}

function setPartInteraction(
    state: HoverDisclosureInteractionState,
    part: HoverDisclosureInteractionPart,
    kind: 'focus' | 'hover',
    active: boolean,
) {
    if (part === 'trigger' && kind === 'hover') {
        state.triggerHovered = active;
        return;
    }
    if (part === 'trigger') {
        state.triggerFocused = active;
        return;
    }
    if (kind === 'hover') {
        state.contentHovered = active;
        return;
    }
    state.contentFocused = active;
}

function resetInteraction(
    state: HoverDisclosureInteractionState,
    part: HoverDisclosureInteractionPart | 'all',
) {
    if (part === 'all' || part === 'trigger') {
        state.triggerFocused = false;
        state.triggerHovered = false;
    }
    if (part === 'all' || part === 'content') {
        state.contentFocused = false;
        state.contentHovered = false;
    }
    if (part === 'all') {
        state.touchClickPending = false;
        state.touchPinned = false;
        state.touchPointerActive = false;
    }
}

function useHoverDisclosureOpenState(
    options: Readonly<UseHoverDisclosureOptions>,
    interaction: HoverDisclosureInteractionState,
    onContentClosed: () => void,
): HoverDisclosureCommands {
    const controlledOpen = computed(() => toValue(options.open));
    const isDisabled = computed(() => Boolean(toValue(options.disabled)));
    let pendingChangeDetails: HoverDisclosureOpenChangeDetails | undefined;
    const controllableOpen = useControllableValue({
        modelValue: () => controlledOpen.value,
        defaultValue: () => options.defaultOpen === true && !isDisabled.value,
        onChange: (nextOpen) => {
            if (pendingChangeDetails) {
                options.onOpenChange?.(nextOpen, pendingChangeDetails);
            }
        },
    });
    const openState = controllableOpen.value;
    const isOpen = computed(() => !isDisabled.value && openState.value);
    const state = computed<HoverDisclosureState>(() => (isOpen.value ? 'open' : 'closed'));
    let requestedOpen = openState.value;
    let openTimer: ReturnType<typeof setTimeout> | undefined;
    let closeTimer: ReturnType<typeof setTimeout> | undefined;
    let disposed = false;

    function request(change: HoverDisclosureChangeRequest) {
        if (change.open) requestOpen(change);
        else requestClose(change);
    }

    function requestOpen(change: HoverDisclosureChangeRequest) {
        if (change.timing === 'immediate') {
            clearTimers();
            setOpen(true, change.reason, change.event);
            return;
        }
        if (disposed || isDisabled.value) return;

        clearCloseTimer();
        clearOpenTimer();
        if (requestedOpen) return;

        const delay = normalizeDelay(toValue(options.openDelay), DEFAULT_OPEN_DELAY);
        if (delay === 0) {
            setOpen(true, change.reason, change.event);
            return;
        }

        openTimer = setTimeout(() => {
            openTimer = undefined;
            if (!interaction.triggerHovered || isDisabled.value) return;
            setOpen(true, change.reason, change.event);
        }, delay);
    }

    function requestClose(change: HoverDisclosureChangeRequest) {
        if (change.timing === 'immediate') {
            clearTimers();
            setOpen(false, change.reason, change.event);
            return;
        }

        clearOpenTimer();
        clearCloseTimer();
        if (disposed || hasActiveInteraction(interaction)) return;

        closeTimer = setTimeout(
            () => {
                closeTimer = undefined;
                if (hasActiveInteraction(interaction)) return;
                setOpen(false, change.reason, change.event);
            },
            normalizeDelay(toValue(options.closeDelay), DEFAULT_CLOSE_DELAY),
        );
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

    function cancelScheduledClose() {
        clearCloseTimer();
    }

    function isRequestedOpen() {
        return requestedOpen;
    }

    function open() {
        request({
            open: true,
            reason: 'programmatic',
            timing: 'immediate',
        });
    }

    function close() {
        interaction.touchPinned = false;
        request({
            open: false,
            reason: 'programmatic',
            timing: 'immediate',
        });
    }

    function toggle() {
        if (requestedOpen || isOpen.value) close();
        else open();
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

    watch(
        [openState, controllableOpen.isControlled],
        ([value]) => {
            requestedOpen = value;
            if (value) return;

            resetInteraction(interaction, 'content');
            interaction.touchPinned = false;
            onContentClosed();
        },
        { flush: 'sync' },
    );
    watch(isDisabled, (disabled) => {
        if (!disabled) return;

        resetInteraction(interaction, 'all');
        request({
            open: false,
            reason: 'disabled',
            timing: 'immediate',
        });
    });
    onBeforeUnmount(() => {
        disposed = true;
        clearTimers();
    });

    return {
        cancelScheduledClose,
        close,
        isDisabled,
        isOpen,
        isRequestedOpen,
        open,
        request,
        state,
        toggle,
    };
}

function useHoverDisclosureInteractions({
    commands,
    dismissalRouted,
    interaction,
    options,
    state,
    targets,
}: {
    commands: HoverDisclosureCommands;
    dismissalRouted: boolean;
    interaction: HoverDisclosureInteractionState;
    options: Readonly<UseHoverDisclosureOptions>;
    state: ComputedRef<HoverDisclosureState>;
    targets: HoverDisclosureTargetState;
}): HoverDisclosureRuntime {
    let touchClickExpiryTimer: ReturnType<typeof setTimeout> | undefined;

    function clearTouchClickExpiryTimer() {
        if (touchClickExpiryTimer === undefined) return;
        clearTimeout(touchClickExpiryTimer);
        touchClickExpiryTimer = undefined;
    }

    function clearPendingTouchClick() {
        clearTouchClickExpiryTimer();
        interaction.touchClickPending = false;
    }

    function scheduleTouchClickExpiry() {
        clearTouchClickExpiryTimer();
        touchClickExpiryTimer = setTimeout(() => {
            touchClickExpiryTimer = undefined;
            interaction.touchClickPending = false;
        }, TOUCH_CLICK_EXPIRY_DELAY);
    }

    function originatesInContent(event: Event) {
        const contentTarget = targets.resolvedContentTarget.value;
        return (
            contentTarget !== null &&
            contentTarget !== targets.resolvedInteractionTarget.value &&
            isEventWithinElement(event, contentTarget)
        );
    }

    function rememberTarget(part: HoverDisclosureInteractionPart, event: Event) {
        const currentTarget = isElement(event.currentTarget) ? event.currentTarget : null;
        if (part === 'trigger') {
            targets.triggerElement =
                currentTarget ?? targets.resolvedInteractionTarget.value ?? targets.triggerElement;
            return;
        }
        targets.contentElement =
            currentTarget ?? targets.resolvedContentTarget.value ?? targets.contentElement;
    }

    function onTriggerPointerenter(event: PointerEvent) {
        rememberTarget('trigger', event);
        if (event.pointerType === 'touch' || commands.isDisabled.value) return;

        setPartInteraction(interaction, 'trigger', 'hover', true);
        requestOpen('hover', event, 'delayed');
    }

    function onTriggerPointerleave(event: PointerEvent) {
        rememberTarget('trigger', event);
        if (event.pointerType === 'touch') return;

        setPartInteraction(interaction, 'trigger', 'hover', false);
        requestClose('hover', event, 'delayed');
    }

    function onContentPointerenter(event: PointerEvent) {
        rememberTarget('content', event);
        if (event.pointerType === 'touch' || commands.isDisabled.value) return;

        setPartInteraction(interaction, 'content', 'hover', true);
        commands.cancelScheduledClose();
    }

    function onContentPointerleave(event: PointerEvent) {
        rememberTarget('content', event);
        if (event.pointerType === 'touch') return;

        setPartInteraction(interaction, 'content', 'hover', false);
        requestClose('hover', event, 'delayed');
    }

    function onTriggerFocusin(event: FocusEvent) {
        rememberTarget('trigger', event);
        if (
            commands.isDisabled.value ||
            toValue(options.openOnFocus) === false ||
            hasPendingTouchInteraction(interaction)
        ) {
            return;
        }

        setPartInteraction(interaction, 'trigger', 'focus', true);
        requestOpen('focus', event, 'immediate');
    }

    function onTriggerFocusout(event: FocusEvent) {
        rememberTarget('trigger', event);
        if (!focusLeavesCurrentTarget(event)) return;

        setPartInteraction(interaction, 'trigger', 'focus', false);
        requestClose('focus', event, 'delayed');
    }

    function onContentFocusin(event: FocusEvent) {
        rememberTarget('content', event);
        if (commands.isDisabled.value) return;

        setPartInteraction(interaction, 'content', 'focus', true);
        commands.cancelScheduledClose();
    }

    function onContentFocusout(event: FocusEvent) {
        rememberTarget('content', event);
        if (!focusLeavesCurrentTarget(event)) return;

        setPartInteraction(interaction, 'content', 'focus', false);
        requestClose('focus', event, 'delayed');
    }

    function onTriggerPointerdown(event: PointerEvent) {
        if (originatesInContent(event)) return;

        rememberTarget('trigger', event);
        clearPendingTouchClick();
        interaction.touchPointerActive = event.pointerType === 'touch';
    }

    function onTriggerPointerup(event: PointerEvent) {
        if (originatesInContent(event)) return;

        rememberTarget('trigger', event);
        interaction.touchClickPending =
            event.pointerType === 'touch' && interaction.touchPointerActive;
        interaction.touchPointerActive = false;
        if (interaction.touchClickPending) scheduleTouchClickExpiry();
    }

    function onTriggerPointercancel(event: PointerEvent) {
        if (originatesInContent(event)) return;

        rememberTarget('trigger', event);
        clearTouchClickExpiryTimer();
        interaction.touchClickPending = false;
        interaction.touchPointerActive = false;
    }

    function onTriggerClick(event: MouseEvent) {
        if (originatesInContent(event)) return;

        rememberTarget('trigger', event);
        clearTouchClickExpiryTimer();
        if (!interaction.touchClickPending) return;

        interaction.touchClickPending = false;
        if (getTouchBehavior() !== 'toggle' || commands.isDisabled.value) return;

        event.preventDefault();
        if (interaction.touchPinned || commands.isRequestedOpen()) {
            interaction.touchPinned = false;
            requestClose('touch', event, 'immediate');
            return;
        }

        interaction.touchPinned = true;
        requestOpen('touch', event, 'immediate');
    }

    function onContentPointerdown(event: PointerEvent) {
        rememberTarget('content', event);
    }

    function requestEscapeClose(event: KeyboardEvent) {
        if (
            event.key !== 'Escape' ||
            toValue(options.closeOnEscape) === false ||
            !commands.isOpen.value
        ) {
            return false;
        }

        interaction.touchPinned = false;
        requestClose('escape', event, 'immediate');
        return true;
    }

    function onKeydown(event: KeyboardEvent) {
        if (dismissalRouted || !requestEscapeClose(event)) return;
        event.stopPropagation();
    }

    function onDocumentKeydown(event: KeyboardEvent) {
        requestEscapeClose(event);
    }

    function onOutsidePointerdown(event: PointerEvent) {
        if (!interaction.touchPinned) return;

        interaction.touchPinned = false;
        requestClose('outside', event, 'immediate');
    }

    function onTargetDetached(part: HoverDisclosureInteractionPart) {
        clearPendingTouchClick();
        if (part === 'trigger') interaction.touchPointerActive = false;
        resetInteraction(interaction, part);
        requestClose('hover', undefined, 'delayed');
    }

    function requestOpen(
        reason: HoverDisclosureOpenChangeReason,
        event: Event | undefined,
        timing: HoverDisclosureChangeRequest['timing'],
    ) {
        commands.request({ event, open: true, reason, timing });
    }

    function requestClose(
        reason: HoverDisclosureOpenChangeReason,
        event: Event | undefined,
        timing: HoverDisclosureChangeRequest['timing'],
    ) {
        commands.request({ event, open: false, reason, timing });
    }

    function getTouchBehavior(): HoverDisclosureTouchBehavior {
        return toValue(options.touchBehavior) ?? 'none';
    }

    const presentation = createInteractionPresentation(state, {
        content: {
            onFocusin: onContentFocusin,
            onFocusout: onContentFocusout,
            onKeydown,
            onPointerdown: onContentPointerdown,
            onPointerenter: onContentPointerenter,
            onPointerleave: onContentPointerleave,
        },
        trigger: {
            onClick: onTriggerClick,
            onFocusin: onTriggerFocusin,
            onFocusout: onTriggerFocusout,
            onKeydown,
            onPointercancel: onTriggerPointercancel,
            onPointerdown: onTriggerPointerdown,
            onPointerenter: onTriggerPointerenter,
            onPointerleave: onTriggerPointerleave,
            onPointerup: onTriggerPointerup,
        },
    });

    watch(
        () => getTouchBehavior(),
        (behavior) => {
            if (behavior === 'toggle' || !interaction.touchPinned) return;
            interaction.touchPinned = false;
            requestClose('touch', undefined, 'immediate');
        },
    );
    onBeforeUnmount(clearTouchClickExpiryTimer);

    return {
        contentListeners: presentation.contentListeners,
        contentProps: presentation.contentProps,
        isOutsideDismissalActive: () => interaction.touchPinned,
        onDocumentKeydown,
        onOutsidePointerdown,
        onTargetDetached,
        triggerListeners: presentation.triggerListeners,
        triggerProps: presentation.triggerProps,
    };
}

function createInteractionPresentation(
    state: ComputedRef<HoverDisclosureState>,
    handlers: {
        content: Omit<HoverDisclosureContentProps, 'data-state'>;
        trigger: Omit<HoverDisclosureTriggerProps, 'data-state'>;
    },
) {
    const triggerProps = computed<HoverDisclosureTriggerProps>(() => ({
        'data-state': state.value,
        ...handlers.trigger,
    }));
    const contentProps = computed<HoverDisclosureContentProps>(() => ({
        'data-state': state.value,
        ...handlers.content,
    }));
    const triggerListeners = [
        ['pointerenter', handlers.trigger.onPointerenter as EventListener],
        ['pointerleave', handlers.trigger.onPointerleave as EventListener],
        ['pointerdown', handlers.trigger.onPointerdown as EventListener],
        ['pointerup', handlers.trigger.onPointerup as EventListener],
        ['pointercancel', handlers.trigger.onPointercancel as EventListener],
        ['click', handlers.trigger.onClick as EventListener],
        ['focusin', handlers.trigger.onFocusin as EventListener],
        ['focusout', handlers.trigger.onFocusout as EventListener],
        ['keydown', handlers.trigger.onKeydown as EventListener],
    ] as const satisfies readonly HoverDisclosureTargetListener[];
    const contentListeners = [
        ['pointerenter', handlers.content.onPointerenter as EventListener],
        ['pointerleave', handlers.content.onPointerleave as EventListener],
        ['pointerdown', handlers.content.onPointerdown as EventListener],
        ['focusin', handlers.content.onFocusin as EventListener],
        ['focusout', handlers.content.onFocusout as EventListener],
        ['keydown', handlers.content.onKeydown as EventListener],
    ] as const satisfies readonly HoverDisclosureTargetListener[];

    return {
        contentListeners,
        contentProps,
        triggerListeners,
        triggerProps,
    };
}

function focusLeavesCurrentTarget(event: FocusEvent) {
    const currentTarget = isElement(event.currentTarget) ? event.currentTarget : null;
    return !isNodeWithinElement(event.relatedTarget, currentTarget);
}

function useHoverDisclosureTargetBinding({
    commands,
    options,
    runtime,
    targets,
    useDocumentDismissal,
}: {
    commands: HoverDisclosureCommands;
    options: Readonly<UseHoverDisclosureOptions>;
    runtime: HoverDisclosureRuntime;
    targets: HoverDisclosureTargetState;
    useDocumentDismissal: boolean;
}) {
    let documentListenersActive = false;

    function setCurrentTarget(part: HoverDisclosureInteractionPart, target: Element) {
        if (part === 'trigger') targets.triggerElement = target;
        else targets.contentElement = target;
    }

    function clearCurrentTarget(part: HoverDisclosureInteractionPart, target: Element) {
        if (part === 'trigger' && targets.triggerElement === target) {
            targets.triggerElement = null;
        }
        if (part === 'content' && targets.contentElement === target) {
            targets.contentElement = null;
        }
    }

    function connectTarget(part: HoverDisclosureInteractionPart, target: Element) {
        setCurrentTarget(part, target);
        return () => {
            clearCurrentTarget(part, target);
            runtime.onTargetDetached(part);
        };
    }

    function onDocumentPointerdown(event: PointerEvent) {
        if (!runtime.isOutsideDismissalActive()) return;
        if (isEventInsideTargets(event, targets)) return;
        runtime.onOutsidePointerdown(event);
    }

    function setDocumentListeners(active: boolean) {
        if (
            !useDocumentDismissal ||
            typeof document === 'undefined' ||
            active === documentListenersActive
        ) {
            return;
        }

        documentListenersActive = active;
        if (active) {
            document.addEventListener('keydown', runtime.onDocumentKeydown as EventListener);
            document.addEventListener('pointerdown', onDocumentPointerdown as EventListener, true);
            return;
        }

        document.removeEventListener('keydown', runtime.onDocumentKeydown as EventListener);
        document.removeEventListener('pointerdown', onDocumentPointerdown as EventListener, true);
    }

    const fallbackTarget = shallowRef<Element | null>(null);
    const interactionTargetLifecycle = useFloatingTargetLifecycle({
        target: () => toValue(options.interactionTarget),
        fallback: fallbackTarget,
        getTargetElement: (reference) => {
            if (isElement(reference)) return reference;
            return isElement(reference.contextElement) ? reference.contextElement : null;
        },
    });
    const contentTargetLifecycle = useFloatingTargetLifecycle({
        target: () => toValue(options.contentTarget),
        fallback: fallbackTarget,
    });
    targets.resolvedInteractionTarget = interactionTargetLifecycle.targetElement;
    targets.resolvedContentTarget = contentTargetLifecycle.targetElement;
    interactionTargetLifecycle.bindTarget({
        connect: (target) => connectTarget('trigger', target),
        listeners: runtime.triggerListeners,
    });
    contentTargetLifecycle.bindTarget({
        connect: (target) => connectTarget('content', target),
        listeners: runtime.contentListeners,
    });

    watch(commands.isOpen, setDocumentListeners, { flush: 'sync' });
    onMounted(() => {
        setDocumentListeners(commands.isOpen.value);
    });
    onBeforeUnmount(() => {
        setDocumentListeners(false);
    });
}

function isEventInsideTargets(event: Event, targets: HoverDisclosureTargetState) {
    const elements = [
        targets.triggerElement,
        targets.contentElement,
        targets.resolvedInteractionTarget.value,
        targets.resolvedContentTarget.value,
    ].filter((element): element is Element => element !== null);
    return isEventWithinTargets(event, elements);
}
