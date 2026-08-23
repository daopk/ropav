import type {ComputedRef, MaybeRefOrGetter} from "vue";

import {computed, onScopeDispose, shallowRef, toValue} from "vue";

/** How the last interaction reached the page, which decides whether focus is visible. */
export type InteractionModality = "keyboard" | "pointer";

const modality = shallowRef<InteractionModality>("keyboard");

/**
 * The same answer, kept out of the reactive graph.
 *
 * These are two different questions and they need two different answers. "Should a focus ring be
 * painted" may only change when something is pressed or a key is struck — a bare mouse move must
 * not erase a ring that is already there. "How is the user driving the page right now" has to
 * follow the pointer as it moves, because a tooltip decides whether to open on hover by asking it.
 * Answering the second reactively would make every mouse move re-render every focusable thing on
 * the page and drop the ring while doing it, which is why React Aria keeps the same split.
 */
let latestModality: InteractionModality = "keyboard";

/** Number of live consumers, so the document listeners are attached exactly once. */
let consumerCount = 0;

const onGlobalKeydown = (event: KeyboardEvent) => {
  // A modifier chord is a shortcut rather than navigation, so it must not make a
  // subsequent pointer focus look like keyboard focus.
  if (event.metaKey || event.altKey || event.ctrlKey) return;

  latestModality = "keyboard";
  modality.value = "keyboard";
};

const onGlobalPointerdown = () => {
  latestModality = "pointer";
  modality.value = "pointer";
};

/** Tracked without touching the reactive ref, for the reason above. */
const onGlobalPointerMoved = () => {
  latestModality = "pointer";
};

/** Attach the shared modality listeners, returning the release for this consumer. */
const retainModalityListeners = (): (() => void) => {
  if (typeof document === "undefined") return () => {};

  if (++consumerCount === 1) {
    // Capture phase, so the modality is already up to date when `focus` fires.
    document.addEventListener("keydown", onGlobalKeydown, true);
    document.addEventListener("pointerdown", onGlobalPointerdown, true);
    document.addEventListener("pointermove", onGlobalPointerMoved, true);
    document.addEventListener("pointerup", onGlobalPointerMoved, true);
  }

  return () => {
    if (--consumerCount === 0) {
      document.removeEventListener("keydown", onGlobalKeydown, true);
      document.removeEventListener("pointerdown", onGlobalPointerdown, true);
      document.removeEventListener("pointermove", onGlobalPointerMoved, true);
      document.removeEventListener("pointerup", onGlobalPointerMoved, true);
    }
  };
};

/**
 * Keep the shared modality listeners attached, returning the release.
 *
 * For a component that has to ask how the user is driving the page without otherwise taking part
 * in the interaction lifecycle — a tooltip trigger, which opens on hover only for a real pointer.
 * Without this the answer would be whatever it was when the last interactive component unmounted.
 */
export const retainInteractionModality = (): (() => void) => retainModalityListeners();

/**
 * How the user is driving the page right now.
 *
 * Ported from React Aria's `getInteractionModality`. Not reactive on purpose — read it inside an
 * event handler, where the answer is the one that matters.
 */
export const getInteractionModality = (): InteractionModality => latestModality;

/**
 * The same answer as a reactive ref, for text that is rendered rather than read in a handler.
 *
 * A drag description ("Press Enter to start dragging" against "Double tap to start dragging")
 * lives in the DOM and has to be rewritten when the user switches input method, which a plain
 * read cannot do.
 *
 * Follows the ring-safe ref rather than `latestModality`, so a bare mouse move does not rewrite
 * the description — only a keystroke or a press does. Retains the shared listeners for as long
 * as the calling scope lives, since a component asking this is otherwise not taking part in the
 * interaction lifecycle.
 */
export const useInteractionModality = (): ComputedRef<InteractionModality> => {
  const release = retainModalityListeners();

  onScopeDispose(release);

  return computed(() => modality.value);
};

/**
 * Whether focus arriving right now is the kind that came from a keyboard.
 *
 * Ported from React Aria's `isFocusVisible`, and reads the same answer React Aria reads — the one
 * that follows the pointer as it moves. Read it inside a handler: a tooltip asks it on focus to
 * tell tabbing to a button apart from clicking it, and only the pointer-following answer knows the
 * user had already reached for the mouse.
 *
 * Not the answer that decides whether a ring is painted. That one lives on `useInteractionStates`
 * and deliberately ignores a bare mouse move, so moving the pointer cannot erase a ring that is
 * already there. The two can disagree, and that is the point.
 */
export const isFocusVisible = (): boolean => latestModality === "keyboard";

/**
 * Declare how the last interaction reached the page.
 *
 * Ported from React Aria's `setInteractionModality`. A component that moves focus itself —
 * a slider label handing focus to its first thumb — has to say that the move came from the
 * keyboard, or the ring it just earned would not be painted.
 */
export const setInteractionModality = (next: InteractionModality): void => {
  latestModality = next;
  modality.value = next;
};

export interface UseInteractionStatesOptions {
  /** Suppresses every state and keeps the element out of the interaction lifecycle. */
  isDisabled?: MaybeRefOrGetter<boolean | undefined>;
  /** Suppresses hover and press, while focus stays reachable. */
  isPending?: MaybeRefOrGetter<boolean | undefined>;
}

export interface UseInteractionStatesReturn {
  isHovered: ComputedRef<boolean>;
  isPressed: ComputedRef<boolean>;
  isFocused: ComputedRef<boolean>;
  isFocusVisible: ComputedRef<boolean>;
  onPointerenter: (event: PointerEvent) => void;
  onPointerleave: () => void;
  onPointerdown: (event: PointerEvent) => void;
  onFocus: () => void;
  onBlur: () => void;
}

/**
 * Track hover, press and focus so a component can publish them as `data-*`
 * attributes.
 *
 * The HeroUI stylesheet keys its interactive states on `data-hovered`,
 * `data-pressed` and `data-focus-visible`, so a component that renders none of them
 * loses those styles — the focus ring in particular, whose pseudo-class branch is
 * not reachable.
 *
 * Two behaviours are deliberately not left to the browser. Press ends even when the
 * pointer is released outside the element, which native `:active` gets wrong once
 * the pointer drags away. And focus counts as visible only after a keyboard
 * interaction, tracked page-wide rather than per element, so a pointer click never
 * paints a ring.
 *
 * @example
 * ```ts
 * const props = defineProps<{isDisabled?: boolean}>();
 * const states = useInteractionStates({isDisabled: () => props.isDisabled});
 * // <button :data-hovered="dataAttr(states.isHovered.value)" @pointerenter="states.onPointerenter">
 * ```
 */
export const useInteractionStates = (
  options: UseInteractionStatesOptions = {},
): UseInteractionStatesReturn => {
  const hovered = shallowRef(false);
  const pressed = shallowRef(false);
  const focused = shallowRef(false);

  const isDisabled = computed(() => Boolean(toValue(options.isDisabled)));
  const isInert = computed(() => isDisabled.value || Boolean(toValue(options.isPending)));

  let releasePress: (() => void) | undefined;

  const endPress = () => {
    releasePress?.();
    releasePress = undefined;
    pressed.value = false;
  };

  const onPointerdown = (event: PointerEvent) => {
    // Only the primary button activates a control, so nothing else should look pressed.
    if (event.button !== 0 || isInert.value) return;

    // An earlier pointer that never released must not leave its listeners behind.
    releasePress?.();

    pressed.value = true;

    const onRelease = () => endPress();

    // Listening on the window is what ends the press after a drag away from the element.
    window.addEventListener("pointerup", onRelease);
    window.addEventListener("pointercancel", onRelease);

    releasePress = () => {
      window.removeEventListener("pointerup", onRelease);
      window.removeEventListener("pointercancel", onRelease);
    };
  };

  const onPointerenter = (event: PointerEvent) => {
    // Touch has no hover state to report; the stylesheet ignores it for the same reason.
    if (event.pointerType === "touch" || isInert.value) return;

    hovered.value = true;
  };

  const onPointerleave = () => {
    hovered.value = false;
  };

  const onFocus = () => {
    focused.value = true;
  };

  const onBlur = () => {
    focused.value = false;
    endPress();
  };

  const releaseModalityListeners = retainModalityListeners();

  onScopeDispose(() => {
    releaseModalityListeners();
    releasePress?.();
  }, true);

  return {
    // Reading through the inert flags keeps a stale state from outliving the prop that
    // suppressed it — a button disabled mid-hover would otherwise stay hovered.
    isFocusVisible: computed(
      () => focused.value && !isDisabled.value && modality.value === "keyboard",
    ),
    isFocused: computed(() => focused.value && !isDisabled.value),
    isHovered: computed(() => hovered.value && !isInert.value),
    isPressed: computed(() => pressed.value && !isInert.value),
    onBlur,
    onFocus,
    onPointerdown,
    onPointerenter,
    onPointerleave,
  };
};

export interface UseFocusWithinOptions {
  /** Suppresses both states, for a group whose whole field is disabled. */
  isDisabled?: MaybeRefOrGetter<boolean | undefined>;
}

export interface UseFocusWithinReturn {
  isFocusWithin: ComputedRef<boolean>;
  isFocusVisible: ComputedRef<boolean>;
  onFocusin: () => void;
  onFocusout: (event: FocusEvent) => void;
}

/**
 * Track whether focus is anywhere inside an element.
 *
 * Ported from React Aria's `useFocusWithin`. A field that wraps its control in a bordered
 * group — an input with a prefix, a search field, a number field with steppers — draws its
 * focus ring on the group while focus actually lands on the input inside it.
 *
 * This is not interchangeable with the focus state of {@link useInteractionStates}: the
 * stylesheet gates a group's hover on `:not([data-focus-within="true"])`, so a group that
 * reports hover without reporting focus-within keeps its hover background while focused.
 *
 * Uses `focusin` / `focusout` rather than `focus` / `blur`, because only the former pair
 * bubbles up from the control to the group.
 *
 * @example
 * ```ts
 * const focus = useFocusWithin({isDisabled: () => props.isDisabled});
 * // <div :data-focus-within="dataAttr(focus.isFocusWithin.value)" @focusin="focus.onFocusin">
 * ```
 */
export const useFocusWithin = (options: UseFocusWithinOptions = {}): UseFocusWithinReturn => {
  const focusWithin = shallowRef(false);

  const isDisabled = computed(() => Boolean(toValue(options.isDisabled)));

  const onFocusin = () => {
    focusWithin.value = true;
  };

  const onFocusout = (event: FocusEvent) => {
    // Focus moving from one child to another leaves the group focused throughout, yet the
    // browser still reports a `focusout` on the way. What settles it is where focus is
    // going: a target still inside this element means the group never lost it.
    const {currentTarget, relatedTarget} = event;

    if (
      currentTarget instanceof Node &&
      relatedTarget instanceof Node &&
      currentTarget.contains(relatedTarget)
    ) {
      return;
    }

    focusWithin.value = false;
  };

  const releaseModalityListeners = retainModalityListeners();

  onScopeDispose(() => {
    releaseModalityListeners();
  }, true);

  return {
    isFocusVisible: computed(
      () => focusWithin.value && !isDisabled.value && modality.value === "keyboard",
    ),
    isFocusWithin: computed(() => focusWithin.value && !isDisabled.value),
    onFocusin,
    onFocusout,
  };
};
