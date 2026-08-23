export interface CloseButtonResponderFixtureProps {
  /** Attributes the supplied press puts on the button, the way a trigger's ARIA wiring does. */
  attrs?: Record<string, unknown>;
  /** Whether the press supplied from above says the button is pressed. */
  isPressed?: boolean;
  /** Whether the caller's own click listener is attached at all. */
  withOwnClick?: boolean;
  onResponderClick?: (event: MouseEvent) => void;
  onResponderKeydown?: (event: KeyboardEvent) => void;
  onResponderPointerdown?: (event: PointerEvent) => void;
  onOwnClick?: (event: MouseEvent) => void;
  onRegister?: (element: HTMLElement | null) => void;
}
