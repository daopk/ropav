import type {PushPasswordManagerStrategy} from "./use-password-manager-badge";
import type {ComputedRef, MaybeRefOrGetter} from "vue";

import {computed, onMounted, onScopeDispose, shallowRef, toValue, watch} from "vue";

import {createContext} from "../utils/create-context";

import {useControllableState} from "./use-controllable-state";
import {usePasswordManagerBadge} from "./use-password-manager-badge";

/** Ready-made patterns for the three code alphabets almost every one-time code uses. */
export const REGEXP_ONLY_DIGITS = "^\\d+$";
export const REGEXP_ONLY_CHARS = "^[a-zA-Z]+$";
export const REGEXP_ONLY_DIGITS_AND_CHARS = "^[a-zA-Z0-9]+$";

/** Where the text sits inside the invisible control. */
export type InputOTPTextAlign = "center" | "left" | "right";

/** What one slot needs to draw itself. One entry per character the code is long. */
export interface InputOTPSlotState {
  /** Whether the caret is on this slot, or a selection covers it. */
  isActive: boolean;
  /** The character typed here, or `null` while the slot is empty. */
  char: string | null;
  /** The placeholder character for this position, shown only while nothing is typed at all. */
  placeholderChar: string | null;
  /** Whether this slot draws its own blinking caret, since the real one is invisible. */
  hasFakeCaret: boolean;
}

/**
 * Listeners the control wires one by one with `@event`.
 *
 * Kept apart from the attributes on purpose. Vapor re-applies every `on*` key arriving through
 * `v-bind` on each render and drops the previous listener as the render effect cleans up —
 * which loses a handler mid-dispatch on exactly the element that re-renders in response to the
 * events it is listening for.
 */
export interface InputOTPHandlers {
  onInput: (event: Event) => void;
  onFocus: () => void;
  onBlur: () => void;
  onPaste: (event: ClipboardEvent) => void;
  onMouseover: () => void;
  onMouseleave: () => void;
}

export interface UseInputOTPOptions {
  /** How many characters the code is. Decides how many slots there are. */
  maxLength: MaybeRefOrGetter<number>;
  /** The code. Set it to take the field over. */
  value?: MaybeRefOrGetter<string | undefined>;
  /** The code the field starts with when nothing is controlling it. */
  defaultValue?: MaybeRefOrGetter<string | undefined>;
  /** Characters the code may contain, as a regular expression over the whole value. */
  pattern?: MaybeRefOrGetter<RegExp | string | undefined>;
  /** Characters shown in the empty slots before anything is typed. */
  placeholder?: MaybeRefOrGetter<string | undefined>;
  /** @default "left" */
  textAlign?: MaybeRefOrGetter<InputOTPTextAlign | undefined>;
  /** Keyboard a touch device should offer. @default "numeric" */
  inputMode?: MaybeRefOrGetter<string | undefined>;
  isDisabled?: MaybeRefOrGetter<boolean | undefined>;
  /** Whether the control shrinks to clear a password manager's badge. @default "increase-width" */
  pushPasswordManagerStrategy?: MaybeRefOrGetter<PushPasswordManagerStrategy | undefined>;
  /** Rewrites pasted text before it is accepted — to strip spaces or a prefix, say. */
  pasteTransformer?: (pasted: string) => string;
  /**
   * Styles applied when scripting is off, or `null` to render none. Only reaches the page
   * through a `<noscript>`, so it is the one place the invisible control has to be made visible.
   */
  noScriptCSSFallback?: MaybeRefOrGetter<string | null | undefined>;
  onChange?: (value: string) => void;
  /** Called once the last slot is filled. */
  onComplete?: (value: string) => void;
}

export interface UseInputOTPReturn {
  /** The code as it currently stands. */
  value: ComputedRef<string>;
  /** One entry per slot, in slot order. */
  slotStates: ComputedRef<InputOTPSlotState[]>;
  isFocused: ComputedRef<boolean>;
  /** Whether the pointer is over the control. Always `false` while disabled. */
  isHovering: ComputedRef<boolean>;
  /** Spread on the hidden control with `v-bind`. Never carries an `on*` key. */
  attrs: ComputedRef<Record<string, unknown>>;
  /** Wire on the hidden control with `@event`, never with `v-bind`. */
  handlers: InputOTPHandlers;
  /** Inline styles that make the control invisible while it stays typed into. */
  inputStyle: ComputedRef<Record<string, string | undefined>>;
  /** Inline styles for the container the slots are drawn in. */
  rootStyle: ComputedRef<Record<string, string>>;
  /** The `<noscript>` stylesheet, or `null` when the caller turned it off. */
  noScriptCss: ComputedRef<string | null>;
  /**
   * The control reports itself. Typed loosely because a Vapor template ref hands over an
   * `Element`, and narrowing here saves every call site the same `instanceof` dance.
   */
  registerInput: (element: unknown) => void;
  registerContainer: (element: unknown) => void;
}

/**
 * What the field hands down to its slots.
 *
 * Lives with the composable rather than with a component for the same reason the text field's
 * control context does: the field provides it and every slot consumes it, so routing it through
 * a component directory would make those depend on each other.
 *
 * Strict: a slot with no field around it has no index to read and nothing to draw.
 */
export interface InputOTPStateContext {
  slotStates: ComputedRef<InputOTPSlotState[]>;
  isFocused: ComputedRef<boolean>;
  isHovering: ComputedRef<boolean>;
}

export const [useInputOTPStateContext, provideInputOTPStateContext] =
  createContext<InputOTPStateContext>({
    name: "InputOTPStateContext",
  });

/**
 * Runs the same callback three times over the first fifty milliseconds.
 *
 * The selection is read back after the browser has moved it, and how long that takes is not
 * knowable — a fast machine is done immediately, a slow one is not. Reading three times costs
 * nothing and is the upstream engine's answer to not having an event to wait for.
 */
const syncTimeouts = (callback: () => void) => [
  setTimeout(callback, 0),
  setTimeout(callback, 10),
  setTimeout(callback, 50),
];

const AUTOFILL_STYLES =
  "background: transparent !important; color: transparent !important; border-color: transparent !important; opacity: 0 !important; box-shadow: none !important; -webkit-box-shadow: none !important; -webkit-text-fill-color: transparent !important;";

/**
 * Rules the engine cannot express in a stylesheet, because they all have to beat whatever the
 * consuming app ships. Inserted once per document, keyed by the element's own marker attribute.
 */
const ENGINE_RULES = [
  "[data-input-otp]::selection { background: transparent !important; color: transparent !important; }",
  `[data-input-otp]:autofill { ${AUTOFILL_STYLES} }`,
  `[data-input-otp]:-webkit-autofill { ${AUTOFILL_STYLES} }`,
  `@supports (-webkit-touch-callout: none) { [data-input-otp] { letter-spacing: -.6em !important; font-weight: 100 !important; font-stretch: ultra-condensed; font-optical-sizing: none !important; left: -1px !important; right: 1px !important; } }`,
  `[data-input-otp] + * { pointer-events: all !important; }`,
];

const ENGINE_STYLE_ID = "input-otp-style";

/**
 * Styles that stand in when scripting is off. Without them the control is invisible and the
 * slots never fill, so the field would look broken rather than merely plain.
 */
const NOSCRIPT_CSS_FALLBACK = `
[data-input-otp] {
  --nojs-bg: white !important;
  --nojs-fg: black !important;

  background-color: var(--nojs-bg) !important;
  color: var(--nojs-fg) !important;
  caret-color: var(--nojs-fg) !important;
  letter-spacing: .25em !important;
  text-align: center !important;
  border: 1px solid var(--nojs-fg) !important;
  border-radius: 4px !important;
  width: 100% !important;
}
@media (prefers-color-scheme: dark) {
  [data-input-otp] {
    --nojs-bg: black !important;
    --nojs-fg: white !important;
  }
}`;

const insertEngineRules = () => {
  if (document.getElementById(ENGINE_STYLE_ID)) return;

  const styleEl = document.createElement("style");

  styleEl.id = ENGINE_STYLE_ID;
  document.head.appendChild(styleEl);

  const sheet = styleEl.sheet;

  if (!sheet) return;

  for (const rule of ENGINE_RULES) {
    try {
      sheet.insertRule(rule);
    } catch {
      // A browser that rejects one rule still wants the others, so this reports and moves on.
      // eslint-disable-next-line no-console
      console.error("input otp could not insert CSS rule:", rule);
    }
  }
};

/**
 * The one-time-code engine, ported from `input-otp@1.4.2` (`src/input.tsx`).
 *
 * There is only ever one real control, and it is invisible: a single `<input>` stretched over
 * the whole field with transparent text and no caret. The boxes the user sees are ordinary
 * divs, drawn from a mirror of the control's selection. That is what buys native paste, native
 * autofill, the platform's own one-time-code keyboard and the software password managers — none
 * of which can be had from a row of separate inputs.
 *
 * The cost is that the selection has to be mirrored by hand, and the browser gives no event for
 * "the caret moved" on an input. So the document's `selectionchange` is listened to instead, and
 * the caret is snapped onto whole characters as it moves, which is why a click anywhere in a
 * slot lands on that slot rather than between two of them.
 *
 * @example
 * ```ts
 * const otp = useInputOTP({maxLength: () => props.maxLength, value: () => props.value});
 *
 * provideInputOTPStateContext(otp);
 * // <input v-bind="otp.attrs" @input="otp.handlers.onInput" …>
 * ```
 */
export const useInputOTP = (options: UseInputOTPOptions): UseInputOTPReturn => {
  const inputEl = shallowRef<HTMLInputElement | null>(null);
  const containerEl = shallowRef<HTMLElement | null>(null);

  const registerInput = (element: unknown) => {
    inputEl.value = element instanceof HTMLInputElement ? element : null;
  };

  const registerContainer = (element: unknown) => {
    containerEl.value = element instanceof HTMLElement ? element : null;
  };

  const maxLength = computed(() => toValue(options.maxLength));
  const isDisabled = computed(() => Boolean(toValue(options.isDisabled)));
  const placeholder = computed(() => toValue(options.placeholder));

  const {setState, state: value} = useControllableState<string>({
    defaultValue: toValue(options.defaultValue) ?? "",
    onValueChange: options.onChange,
    value: () => toValue(options.value),
  });

  const regexp = computed(() => {
    const pattern = toValue(options.pattern);

    if (!pattern) return null;

    return typeof pattern === "string" ? new RegExp(pattern) : pattern;
  });

  /** Mirrors of the control's own state, kept only so the slots have something to draw from. */
  const isHoveringInput = shallowRef(false);
  const isFocused = shallowRef(false);
  const mirrorSelectionStart = shallowRef<number | null>(null);
  const mirrorSelectionEnd = shallowRef<number | null>(null);

  /**
   * Where the selection was last time it was read. The direction it moved cannot be worked out
   * from the current selection alone, and the browser reports `selectionDirection` as `"none"`
   * for a plain caret, so the previous position is what tells a step left from a step right.
   */
  let previousSelection: [number | null, number | null, "backward" | "forward" | "none" | null] = [
    null,
    null,
    null,
  ];

  /**
   * Vapor skips writing `value` when the bound value has not changed, and the browser has
   * already moved the text by then. So a rejected keystroke would stay on screen, with nothing
   * left to re-render and put it back.
   */
  const reassert = () => {
    const input = inputEl.value;

    if (input && input.value !== value.value) input.value = value.value;
  };

  const setValue = (next: string) => {
    setState(next);
    reassert();
  };

  const badge = usePasswordManagerBadge({
    container: containerEl,
    input: inputEl,
    isFocused: () => isFocused.value,
    pushPasswordManagerStrategy: () => toValue(options.pushPasswordManagerStrategy),
  });

  /**
   * Snaps the caret onto a whole character and mirrors where it landed.
   *
   * Ported as one piece from the upstream engine, because every branch here is a specific
   * browser behaviour rather than a rule that can be restated more simply.
   */
  const onDocumentSelectionChange = () => {
    const input = inputEl.value;

    if (!input) return;

    if (document.activeElement !== input) {
      mirrorSelectionStart.value = null;
      mirrorSelectionEnd.value = null;

      return;
    }

    const _s = input.selectionStart;
    const _e = input.selectionEnd;
    const _dir = input.selectionDirection;
    const _ml = input.maxLength;
    const _val = input.value;
    const _prev = previousSelection;

    let start = -1;
    let end = -1;
    let direction: "backward" | "forward" | "none" | undefined = undefined;

    if (_val.length !== 0 && _s !== null && _e !== null) {
      const isSingleCaret = _s === _e;
      // The caret sitting past the last character of a code that is not full yet is the one
      // place it belongs between slots rather than on one: that is where the next one goes.
      const isInsertMode = _s === _val.length && _val.length < _ml;

      if (isSingleCaret && !isInsertMode) {
        const c = _s;

        if (c === 0) {
          start = 0;
          end = 1;
          direction = "forward";
        } else if (c === _ml) {
          start = c - 1;
          end = c;
          direction = "backward";
        } else if (_ml > 1 && _val.length > 1) {
          let offset = 0;

          if (_prev[0] !== null && _prev[1] !== null) {
            direction = c < _prev[1] ? "backward" : "forward";

            const wasPreviouslyInserting = _prev[0] === _prev[1] && _prev[0] < _ml;

            // Stepping left off an insert point lands on the character just typed; stepping left
            // from anywhere else lands one further back, since the caret already moved.
            if (direction === "backward" && !wasPreviouslyInserting) offset = -1;
          }

          start = offset + c;
          end = offset + c + 1;
        }
      }

      if (start !== -1 && end !== -1 && start !== end) {
        input.setSelectionRange(start, end, direction);
      }
    }

    const s = start !== -1 ? start : _s;
    const e = end !== -1 ? end : _e;
    const dir = direction ?? _dir;

    mirrorSelectionStart.value = s;
    mirrorSelectionEnd.value = e;
    previousSelection = [s, e, dir];
  };

  let teardown: (() => void) | undefined;

  onScopeDispose(() => teardown?.());

  onMounted(() => {
    const input = inputEl.value;
    const container = containerEl.value;

    if (!input || !container) return;

    // A browser can fill the control before any of this runs — from a saved value, or from an
    // SMS the platform read on its own — so the first thing to do is believe the element.
    if (value.value !== input.value) setValue(input.value);

    previousSelection = [input.selectionStart, input.selectionEnd, input.selectionDirection];

    document.addEventListener("selectionchange", onDocumentSelectionChange, {capture: true});

    onDocumentSelectionChange();
    if (document.activeElement === input) isFocused.value = true;

    insertEngineRules();

    // The slot boxes size themselves; the control has to be told how tall they came out, because
    // its font size is what keeps the invisible text lined up with them.
    const updateRootHeight = () => {
      container.style.setProperty("--root-height", `${input.clientHeight}px`);
    };

    updateRootHeight();

    // Guarded: jsdom implements no `ResizeObserver`, and a field that never changes size still
    // gets its height from the call above.
    const resizeObserver =
      typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(updateRootHeight);

    resizeObserver?.observe(input);

    teardown = () => {
      document.removeEventListener("selectionchange", onDocumentSelectionChange, {capture: true});
      resizeObserver?.disconnect();
    };
  });

  /**
   * Reads the selection back after the browser has settled, and knocks the control out of its
   * autofilled state on the way — `:autofill` only clears on an `input` event, and the browser
   * does not send one when it fills the field itself.
   *
   * That hand-built event does not bubble, so React's root-level delegation never sees it and
   * its change handler stays out of the way. A Vapor listener sits on the element and does hear
   * it — which is harmless, because the value it reports is the one already held, so the change
   * settles into nothing.
   */
  let syncTimers: ReturnType<typeof setTimeout>[] = [];

  const scheduleSelectionSync = () => {
    syncTimers.forEach(clearTimeout);
    syncTimers = syncTimeouts(() => {
      const input = inputEl.value;

      if (!input) return;

      input.dispatchEvent(new Event("input"));

      const s = input.selectionStart;
      const e = input.selectionEnd;
      const dir = input.selectionDirection;

      if (s !== null && e !== null) {
        mirrorSelectionStart.value = s;
        mirrorSelectionEnd.value = e;
        previousSelection = [s, e, dir];
      }
    });
  };

  onScopeDispose(() => syncTimers.forEach(clearTimeout));

  watch([value, isFocused], scheduleSelectionSync, {flush: "post", immediate: true});

  // Fires on the change that fills the last slot, and only on that one: a code that is already
  // full and gets retyped in place has nothing new to report.
  watch(value, (next, previous) => {
    if (previous.length < maxLength.value && next.length === maxLength.value) {
      options.onComplete?.(next);
    }
  });

  const onInput = (event: Event) => {
    const newValue = (event.currentTarget as HTMLInputElement).value.slice(0, maxLength.value);

    if (newValue.length > 0 && regexp.value && !regexp.value.test(newValue)) {
      event.preventDefault();
      reassert();

      return;
    }

    // Cutting or deleting text moves the caret without firing `selectionchange`, so the mirror
    // would keep pointing at a slot that no longer holds anything.
    if (newValue.length < value.value.length) {
      document.dispatchEvent(new Event("selectionchange"));
    }

    setValue(newValue);
  };

  const onFocus = () => {
    const input = inputEl.value;

    if (input) {
      // Focus lands on the first empty slot, or on the last one when the code is full — never
      // past the end, where there is no box to highlight.
      const start = Math.min(input.value.length, maxLength.value - 1);
      const end = input.value.length;

      input.setSelectionRange(start, end);
      mirrorSelectionStart.value = start;
      mirrorSelectionEnd.value = end;
    }

    isFocused.value = true;
  };

  const onBlur = () => {
    isFocused.value = false;
  };

  /**
   * Takes the paste over from the browser.
   *
   * Needed unconditionally when the caller rewrites pasted text, and on iOS regardless: pasting
   * there replaces the whole field rather than the selection, so a paste onto a half-typed code
   * would throw away what is already in it.
   */
  const onPaste = (event: ClipboardEvent) => {
    const input = inputEl.value;
    const isIOS =
      typeof window !== "undefined" &&
      Boolean(window.CSS?.supports?.("-webkit-touch-callout", "none"));

    if (!options.pasteTransformer && !isIOS) return;
    // Guarded where the upstream engine is not: with a transformer set it reads the clipboard
    // without checking there is one, which throws on a paste that carries no text.
    if (!event.clipboardData || !input) return;

    const pasted = event.clipboardData.getData("text/plain");
    const content = options.pasteTransformer ? options.pasteTransformer(pasted) : pasted;

    event.preventDefault();

    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;
    const current = value.value;
    const isReplacing = start !== end;

    const newValue = (
      isReplacing
        ? current.slice(0, start) + content + current.slice(end)
        : current.slice(0, start) + content + current.slice(start)
    ).slice(0, maxLength.value);

    if (newValue.length > 0 && regexp.value && !regexp.value.test(newValue)) return;

    input.value = newValue;
    setValue(newValue);

    const nextStart = Math.min(newValue.length, maxLength.value - 1);
    const nextEnd = newValue.length;

    input.setSelectionRange(nextStart, nextEnd);
    mirrorSelectionStart.value = nextStart;
    mirrorSelectionEnd.value = nextEnd;
  };

  const onMouseover = () => {
    isHoveringInput.value = true;
  };

  const onMouseleave = () => {
    isHoveringInput.value = false;
  };

  const rootStyle = computed<Record<string, string>>(() => ({
    WebkitUserSelect: "none",
    // Pointer events are off so a click falls through to the control underneath, which is what
    // puts the caret in the right slot without a single handler on any of the boxes.
    cursor: isDisabled.value ? "default" : "text",
    pointerEvents: "none",
    position: "relative",
    userSelect: "none",
  }));

  const inputStyle = computed<Record<string, string | undefined>>(() => ({
    background: "transparent",
    border: "0 solid transparent",
    boxShadow: "none",
    caretColor: "transparent",
    // Clipped rather than moved, so a password manager's badge sits beside the field instead of
    // on top of the last slot.
    clipPath: badge.willPushPWMBadge.value
      ? `inset(0 ${badge.PWM_BADGE_SPACE_WIDTH} 0 0)`
      : undefined,
    color: "transparent",
    display: "flex",
    fontFamily: "monospace",
    fontSize: "var(--root-height)",
    fontVariantNumeric: "tabular-nums",
    height: "100%",
    inset: "0",
    letterSpacing: "-.5em",
    lineHeight: "1",
    // Fully opaque on purpose: iOS shows no hold-to-paste menu on a transparent control, so the
    // text is hidden by its colour rather than by the element's opacity.
    opacity: "1",
    outline: "0 solid transparent",
    pointerEvents: "all",
    position: "absolute",
    textAlign: toValue(options.textAlign) ?? "left",
    width: badge.willPushPWMBadge.value ? `calc(100% + ${badge.PWM_BADGE_SPACE_WIDTH})` : "100%",
  }));

  const slotStates = computed<InputOTPSlotState[]>(() => {
    const current = value.value;
    const start = mirrorSelectionStart.value;
    const end = mirrorSelectionEnd.value;
    const placeholderText = placeholder.value;

    return Array.from({length: maxLength.value}, (_, slotIdx) => {
      const isActive =
        isFocused.value &&
        start !== null &&
        end !== null &&
        ((start === end && slotIdx === start) || (slotIdx >= start && slotIdx < end));

      const char = current[slotIdx] !== undefined ? current[slotIdx] : null;

      return {
        char,
        hasFakeCaret: isActive && char === null,
        isActive,
        // The whole placeholder disappears as soon as anything is typed, rather than surviving
        // in the slots that are still empty.
        placeholderChar: current[0] !== undefined ? null : (placeholderText?.[slotIdx] ?? null),
      };
    });
  });

  const attrs = computed<Record<string, unknown>>(() => {
    const all: Record<string, unknown> = {
      "aria-placeholder": placeholder.value,
      autocomplete: "one-time-code",
      "data-input-otp": "true",
      "data-input-otp-mse": mirrorSelectionEnd.value,
      "data-input-otp-mss": mirrorSelectionStart.value,
      "data-input-otp-placeholder-shown": value.value.length === 0 || undefined,
      inputmode: toValue(options.inputMode) ?? "numeric",
      maxlength: maxLength.value,
      pattern: regexp.value?.source,
      value: value.value,
    };

    for (const key of Object.keys(all)) {
      if (all[key] === undefined || all[key] === null) delete all[key];
    }

    return all;
  });

  return {
    attrs,
    handlers: {onBlur, onFocus, onInput, onMouseleave, onMouseover, onPaste},
    inputStyle,
    isFocused: computed(() => isFocused.value),
    isHovering: computed(() => !isDisabled.value && isHoveringInput.value),
    noScriptCss: computed(() => {
      const fallback = toValue(options.noScriptCSSFallback);

      return fallback === undefined ? NOSCRIPT_CSS_FALLBACK : fallback;
    }),
    registerContainer,
    registerInput,
    rootStyle,
    slotStates,
    value: computed(() => value.value),
  };
};
