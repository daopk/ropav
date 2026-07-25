import { computed, onBeforeUnmount, toValue, watch, type ComputedRef } from 'vue';
import { isEventWithinElement, isNodeWithinElement } from '@/utils/dom/events';
import { isElement } from '@/utils/dom/query';
import {
    hasPendingHoverDisclosureTouchInteraction,
    type HoverDisclosureInteractionModel,
    type HoverDisclosureInteractionPart,
} from './hoverDisclosureInteractionModel';
import type { HoverDisclosureChangeRequest } from './useHoverDisclosureOpenState';
import type {
    HoverDisclosureTargetListener,
    HoverDisclosureTargetState,
} from './useHoverDisclosureTargetBinding';
import type {
    HoverDisclosureContentProps,
    HoverDisclosureOpenChangeReason,
    HoverDisclosureState,
    HoverDisclosureTouchBehavior,
    HoverDisclosureTriggerProps,
    UseHoverDisclosureOptions,
} from './types';

interface HoverDisclosureInteractionCommands {
    cancelScheduledClose: () => void;
    isDisabled: ComputedRef<boolean>;
    isOpen: ComputedRef<boolean>;
    isRequestedOpen: () => boolean;
    request: (change: HoverDisclosureChangeRequest) => void;
}

interface UseHoverDisclosureInteractionsOptions {
    commands: HoverDisclosureInteractionCommands;
    dismissalRouted?: boolean;
    interaction: HoverDisclosureInteractionModel;
    options: Readonly<UseHoverDisclosureOptions>;
    state: ComputedRef<HoverDisclosureState>;
    targets: HoverDisclosureTargetState;
}

const TOUCH_CLICK_EXPIRY_DELAY = 500;

export function useHoverDisclosureInteractions({
    commands,
    dismissalRouted = false,
    interaction,
    options,
    state,
    targets,
}: UseHoverDisclosureInteractionsOptions) {
    let touchClickExpiryTimer: ReturnType<typeof setTimeout> | undefined;

    function clearTouchClickExpiryTimer() {
        if (touchClickExpiryTimer === undefined) return;
        clearTimeout(touchClickExpiryTimer);
        touchClickExpiryTimer = undefined;
    }

    function clearPendingTouchClick() {
        clearTouchClickExpiryTimer();
        interaction.send({ type: 'consume-touch-click' });
    }

    function scheduleTouchClickExpiry() {
        clearTouchClickExpiryTimer();
        touchClickExpiryTimer = setTimeout(() => {
            touchClickExpiryTimer = undefined;
            interaction.send({ type: 'consume-touch-click' });
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

        interaction.send({ type: 'hover', part: 'trigger', active: true });
        requestOpen('hover', event, 'delayed');
    }

    function onTriggerPointerleave(event: PointerEvent) {
        rememberTarget('trigger', event);
        if (event.pointerType === 'touch') return;

        interaction.send({ type: 'hover', part: 'trigger', active: false });
        requestClose('hover', event, 'delayed');
    }

    function onContentPointerenter(event: PointerEvent) {
        rememberTarget('content', event);
        if (event.pointerType === 'touch' || commands.isDisabled.value) return;

        interaction.send({ type: 'hover', part: 'content', active: true });
        commands.cancelScheduledClose();
    }

    function onContentPointerleave(event: PointerEvent) {
        rememberTarget('content', event);
        if (event.pointerType === 'touch') return;

        interaction.send({ type: 'hover', part: 'content', active: false });
        requestClose('hover', event, 'delayed');
    }

    function onTriggerFocusin(event: FocusEvent) {
        rememberTarget('trigger', event);
        if (
            commands.isDisabled.value ||
            toValue(options.openOnFocus) === false ||
            hasPendingHoverDisclosureTouchInteraction(interaction.read())
        ) {
            return;
        }

        interaction.send({ type: 'focus', part: 'trigger', active: true });
        requestOpen('focus', event, 'immediate');
    }

    function onTriggerFocusout(event: FocusEvent) {
        rememberTarget('trigger', event);
        if (!focusLeavesCurrentTarget(event)) return;

        interaction.send({ type: 'focus', part: 'trigger', active: false });
        requestClose('focus', event, 'delayed');
    }

    function onContentFocusin(event: FocusEvent) {
        rememberTarget('content', event);
        if (commands.isDisabled.value) return;

        interaction.send({ type: 'focus', part: 'content', active: true });
        commands.cancelScheduledClose();
    }

    function onContentFocusout(event: FocusEvent) {
        rememberTarget('content', event);
        if (!focusLeavesCurrentTarget(event)) return;

        interaction.send({ type: 'focus', part: 'content', active: false });
        requestClose('focus', event, 'delayed');
    }

    function onTriggerPointerdown(event: PointerEvent) {
        if (originatesInContent(event)) return;

        rememberTarget('trigger', event);
        clearPendingTouchClick();
        interaction.send({
            type: 'pointer-down',
            touch: event.pointerType === 'touch',
        });
    }

    function onTriggerPointerup(event: PointerEvent) {
        if (originatesInContent(event)) return;

        rememberTarget('trigger', event);
        const interactionState = interaction.send({
            type: 'pointer-up',
            touch: event.pointerType === 'touch',
        });
        if (interactionState.touchClickPending) scheduleTouchClickExpiry();
    }

    function onTriggerPointercancel(event: PointerEvent) {
        if (originatesInContent(event)) return;

        rememberTarget('trigger', event);
        clearTouchClickExpiryTimer();
        interaction.send({ type: 'pointer-cancel' });
    }

    function onTriggerClick(event: MouseEvent) {
        if (originatesInContent(event)) return;

        rememberTarget('trigger', event);
        clearTouchClickExpiryTimer();
        const interactionState = interaction.read();
        if (!interactionState.touchClickPending) return;

        interaction.send({ type: 'consume-touch-click' });
        if (getTouchBehavior() !== 'toggle' || commands.isDisabled.value) {
            return;
        }

        event.preventDefault();
        if (interactionState.touchPinned || commands.isRequestedOpen()) {
            interaction.send({
                type: 'set-touch-pinned',
                pinned: false,
            });
            requestClose('touch', event, 'immediate');
            return;
        }

        interaction.send({ type: 'set-touch-pinned', pinned: true });
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

        interaction.send({ type: 'set-touch-pinned', pinned: false });
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
        if (!interaction.read().touchPinned) return;

        interaction.send({ type: 'set-touch-pinned', pinned: false });
        requestClose('outside', event, 'immediate');
    }

    function onTargetDetached(part: HoverDisclosureInteractionPart) {
        clearPendingTouchClick();
        if (part === 'trigger') interaction.send({ type: 'pointer-cancel' });
        interaction.send({ type: 'reset', part });
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
            if (behavior === 'toggle' || !interaction.read().touchPinned) {
                return;
            }
            interaction.send({
                type: 'set-touch-pinned',
                pinned: false,
            });
            requestClose('touch', undefined, 'immediate');
        },
    );
    onBeforeUnmount(clearTouchClickExpiryTimer);

    return {
        bindingAdapter: {
            contentListeners: presentation.contentListeners,
            isOutsideDismissalActive: () => interaction.read().touchPinned,
            onDocumentKeydown,
            onOutsidePointerdown,
            onTargetDetached,
            triggerListeners: presentation.triggerListeners,
        },
        contentProps: presentation.contentProps,
        triggerProps: presentation.triggerProps,
    };
}

interface HoverDisclosureInteractionHandlers {
    content: Omit<HoverDisclosureContentProps, 'data-state'>;
    trigger: Omit<HoverDisclosureTriggerProps, 'data-state'>;
}

function createInteractionPresentation(
    state: ComputedRef<HoverDisclosureState>,
    handlers: HoverDisclosureInteractionHandlers,
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
