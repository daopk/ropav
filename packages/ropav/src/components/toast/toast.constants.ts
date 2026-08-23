/** Pixels between stacked toasts, applied as an offset per stack index. */
export const DEFAULT_GAP = 12;

/**
 * How many toasts are visible at once.
 *
 * Visual only: the queue holds every toast, and the ones past this count are faded out and taken
 * out of the pointer's reach rather than dropped. That split is deliberate — a toast that scrolls
 * off the stack can come back when the ones in front of it close.
 */
export const DEFAULT_MAX_VISIBLE_TOAST = 3;

/** How much smaller each toast is drawn than the one in front of it. */
export const DEFAULT_SCALE_FACTOR = 0.05;

/** Pixels wide, written out as `--toast-width` for the stylesheet to read. */
export const DEFAULT_TOAST_WIDTH = 460;

/** Milliseconds a toast lives for. Matches sonner's default. */
export const DEFAULT_TOAST_TIMEOUT = 4000;
