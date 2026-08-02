import type {ComputedRef, MaybeRefOrGetter} from "vue";

import {computed, onScopeDispose, shallowRef, toValue} from "vue";

/** How the last interaction reached the page, which decides whether focus is visible. */
type InteractionModality = "keyboard" | "pointer";

const modality = shallowRef<InteractionModality>("keyboard");

/** Number of live consumers, so the document listeners are attached exactly once. */
let consumerCount = 0;

const onGlobalKeydown = (event: KeyboardEvent) => {
  // A modifier chord is a shortcut rather than navigation, so it must not make a
  // subsequent pointer focus look like keyboard focus.
  if (event.metaKey || event.altKey || event.ctrlKey) return;

  modality.value = "keyboard";
};

const onGlobalPointerdown = () => {
  modality.value = "pointer";
};

/** Attach the shared modality listeners, returning the release for this consumer. */
const retainModalityListeners = (): (() => void) => {
  if (typeof document === "undefined") return () => {};

  if (++consumerCount === 1) {
    // Capture phase, so the modality is already up to date when `focus` fires.
    document.addEventListener("keydown", onGlobalKeydown, true);
    document.addEventListener("pointerdown", onGlobalPointerdown, true);
  }

  return () => {
    if (--consumerCount === 0) {
      document.removeEventListener("keydown", onGlobalKeydown, true);
      document.removeEventListener("pointerdown", onGlobalPointerdown, true);
    }
  };
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
