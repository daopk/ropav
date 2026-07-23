export type HoverDisclosureInteractionPart = 'trigger' | 'content';

export interface HoverDisclosureInteractionState {
    contentFocused: boolean;
    contentHovered: boolean;
    touchClickPending: boolean;
    touchPinned: boolean;
    touchPointerActive: boolean;
    triggerFocused: boolean;
    triggerHovered: boolean;
}

export type HoverDisclosureInteractionAction =
    | {
          type: 'hover';
          part: HoverDisclosureInteractionPart;
          active: boolean;
      }
    | {
          type: 'focus';
          part: HoverDisclosureInteractionPart;
          active: boolean;
      }
    | { type: 'pointer-down'; touch: boolean }
    | { type: 'pointer-up'; touch: boolean }
    | { type: 'pointer-cancel' }
    | { type: 'consume-touch-click' }
    | { type: 'set-touch-pinned'; pinned: boolean }
    | {
          type: 'reset';
          part: HoverDisclosureInteractionPart | 'all';
      };

export interface HoverDisclosureInteractionModel {
    read: () => Readonly<HoverDisclosureInteractionState>;
    send: (action: HoverDisclosureInteractionAction) => Readonly<HoverDisclosureInteractionState>;
}

export function createHoverDisclosureInteractionModel(): HoverDisclosureInteractionModel {
    let state = createInteractionState();

    return {
        read: () => state,
        send(action) {
            state = reduceHoverDisclosureInteraction(state, action);
            return state;
        },
    };
}

export function hasActiveHoverDisclosureInteraction(
    state: Readonly<HoverDisclosureInteractionState>,
) {
    return (
        state.triggerHovered ||
        state.contentHovered ||
        state.triggerFocused ||
        state.contentFocused ||
        state.touchPinned
    );
}

export function reduceHoverDisclosureInteraction(
    state: Readonly<HoverDisclosureInteractionState>,
    action: HoverDisclosureInteractionAction,
): HoverDisclosureInteractionState {
    switch (action.type) {
        case 'hover':
            return setPartInteraction(state, action.part, 'hover', action.active);
        case 'focus':
            return setPartInteraction(state, action.part, 'focus', action.active);
        case 'pointer-down':
            return {
                ...state,
                touchClickPending: false,
                touchPointerActive: action.touch,
            };
        case 'pointer-up':
            return {
                ...state,
                touchClickPending: action.touch && state.touchPointerActive,
                touchPointerActive: false,
            };
        case 'pointer-cancel':
            return {
                ...state,
                touchClickPending: false,
                touchPointerActive: false,
            };
        case 'consume-touch-click':
            return { ...state, touchClickPending: false };
        case 'set-touch-pinned':
            return { ...state, touchPinned: action.pinned };
        case 'reset':
            return resetInteraction(state, action.part);
    }
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

function setPartInteraction(
    state: Readonly<HoverDisclosureInteractionState>,
    part: HoverDisclosureInteractionPart,
    interaction: 'focus' | 'hover',
    active: boolean,
) {
    if (part === 'trigger' && interaction === 'hover') {
        return { ...state, triggerHovered: active };
    }
    if (part === 'trigger') return { ...state, triggerFocused: active };
    if (interaction === 'hover') return { ...state, contentHovered: active };
    return { ...state, contentFocused: active };
}

function resetInteraction(
    state: Readonly<HoverDisclosureInteractionState>,
    part: HoverDisclosureInteractionPart | 'all',
) {
    if (part === 'all') return createInteractionState();
    if (part === 'trigger') {
        return {
            ...state,
            triggerFocused: false,
            triggerHovered: false,
        };
    }
    return {
        ...state,
        contentFocused: false,
        contentHovered: false,
    };
}
