export interface HoverDisclosureDismissalHandlers {
    escapeKeyDown: (event: KeyboardEvent) => void;
    pointerDownOutside: (event: PointerEvent) => void;
}

export type ConnectHoverDisclosureDismissal = (
    handlers: HoverDisclosureDismissalHandlers,
) => () => void;
