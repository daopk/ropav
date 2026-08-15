import type {UseCollectionReturn} from "./use-collection";
import type {UseListKeyboardReturn} from "./use-list-keyboard";
import type {UseSelectionManagerReturn} from "./use-selection-manager";
import type {ComputedRef, MaybeRefOrGetter, ShallowRef} from "vue";

import {computed, toValue, watch} from "vue";

import {createContext} from "../utils/create-context";

import {useControllableState} from "./use-controllable-state";

/** The `inputType` values that mean text was typed forwards rather than edited. */
const TYPED_FORWARD = ["insertText", "insertCompositionText", "insertFromComposition"];

/** Attributes the input renders so assistive technology reads the collection as its own. */
export interface AutocompleteInputAttributes {
  "aria-activedescendant": string | undefined;
  "aria-autocomplete": string;
  "aria-controls": string;
  autocomplete: string;
  autocorrect: string;
  enterkeyhint: string;
  spellcheck: string;
}

export interface UseAutocompleteOptions {
  /**
   * The keyboard behaviour of the collection below, with virtual focus turned on.
   *
   * Read through a getter because only the collection can build it — it is the one that knows
   * its own element and its own layout — so it arrives once the collection has mounted, which in
   * a picker is when the overlay opens.
   */
  keyboard: MaybeRefOrGetter<UseListKeyboardReturn | null | undefined>;
  selection: UseSelectionManagerReturn;
  collection: UseCollectionReturn;
  /** The input that keeps real focus, reported by whichever control renders it. */
  inputElement: ShallowRef<HTMLInputElement | null>;
  /** The collection element's id, for `aria-controls`. */
  collectionId: MaybeRefOrGetter<string>;
  /** Text in the input. Present at all puts the caller in charge of it. */
  inputValue?: MaybeRefOrGetter<string | undefined>;
  defaultInputValue?: string;
  onInputChange?: (value: string) => void;
  /** Whether typing stops moving virtual focus onto the first option. @default false */
  disableAutoFocusFirst?: MaybeRefOrGetter<boolean | undefined>;
  /** Whether virtual focus is off entirely. @default false */
  disableVirtualFocus?: MaybeRefOrGetter<boolean | undefined>;
}

export interface UseAutocompleteReturn {
  inputValue: ComputedRef<string>;
  setInputValue: (value: string) => void;
  /** Feed into `useSearchField` / `useTextField`, which render every key of it. */
  inputAttributes: ComputedRef<AutocompleteInputAttributes>;
  /** Bind statically with `@keydown` — a handler must never travel through `v-bind`. */
  onKeydown: (event: KeyboardEvent) => void;
  onKeyup: (event: KeyboardEvent) => void;
  onBlur: () => void;
  /** Take virtual focus off whatever option holds it, leaving the input as the only focus. */
  clearVirtualFocus: () => void;
  /** Put virtual focus on the first option that can take it. */
  focusFirstItem: () => void;
}

/**
 * What an autocomplete hands down to whichever control renders its text input.
 *
 * Lives with the composable rather than with the component, for the same reason
 * `TextFieldControlContext` does: `SearchField` is the control that consumes it, and routing it
 * through the autocomplete's own directory would make that component depend on this one.
 *
 * Loose, and absent is the ordinary case — a search field standing on its own filters nothing.
 */
export interface AutocompleteInputContext extends Pick<
  UseAutocompleteReturn,
  "inputAttributes" | "inputValue" | "onBlur" | "onKeydown" | "onKeyup" | "setInputValue"
> {
  /** The control reports its element, which the beforeinput and pointer wiring hangs off. */
  setInputElement: (element: HTMLInputElement | null) => void;
}

export const [useAutocompleteInputContext, provideAutocompleteInputContext] =
  createContext<AutocompleteInputContext | null>({
    defaultValue: null,
    name: "AutocompleteInputContext",
    strict: false,
  });

/**
 * An input that drives a collection beside it, ported from React Aria's
 * `packages/react-aria/src/autocomplete/useAutocomplete.ts` (react-aria 3.51.0).
 *
 * The whole arrangement is that real focus never leaves the input: the arrows move a *nominal*
 * focus over the collection, the input names whichever option holds it with
 * `aria-activedescendant`, and Enter acts on that option. Without it, arrowing into the options
 * would take the caret out of the field the user is typing in.
 *
 * The event simulation upstream is deliberately left out. React has to dispatch synthetic
 * `CustomEvent`s and re-dispatch `KeyboardEvent`s onto the collection element, because the
 * collection's own keyboard layer lives in a different component and the DOM is the only channel
 * between them. Here the caller holds both halves and hands the keyboard layer over directly, so
 * the keys are simply passed to it — same behaviour, without the round trip through the DOM.
 *
 * @example
 * ```ts
 * const autocomplete = useAutocomplete({
 *   collection,
 *   collectionId: () => listId.value,
 *   inputElement,
 *   keyboard,
 *   selection,
 * });
 * ```
 */
export const useAutocomplete = (options: UseAutocompleteOptions): UseAutocompleteReturn => {
  const {collection, selection} = options;

  const keyboard = computed(() => toValue(options.keyboard) ?? null);

  const isVirtual = computed(() => !toValue(options.disableVirtualFocus));

  const {setState, state} = useControllableState<string>({
    defaultValue: options.defaultInputValue ?? "",
    onValueChange: options.onInputChange,
    value: () => toValue(options.inputValue),
  });

  const clearVirtualFocus = () => {
    selection.setFocusedKey(null);
  };

  const focusFirstItem = () => {
    const first = keyboard.value?.getFirstKey() ?? null;

    if (first == null) {
      clearVirtualFocus();

      return;
    }

    selection.setFocused(true);
    keyboard.value?.focusKey(first, {scroll: true});
  };

  const setInputValue = (value: string) => {
    setState(value);
  };

  /**
   * What the last edit did to the text, which decides where virtual focus goes.
   *
   * Only `beforeinput` carries it, so it is remembered here and read when the value arrives. IME
   * composition reports `insertCompositionText`/`insertFromComposition` rather than `insertText`,
   * and all three mean the same thing to a user: they typed forwards, so the first match should
   * light up. Anything else — a paste, a backspace, an undo — moves the caret over text that is
   * already there, and lighting an option then would announce a choice nobody made.
   */
  const onBeforeinput = (event: Event) => {
    const inputType = (event as InputEvent).inputType;

    if (!inputType || !isVirtual.value) return;

    if (TYPED_FORWARD.includes(inputType)) {
      if (!toValue(options.disableAutoFocusFirst)) focusFirstItem();

      return;
    }

    if (
      inputType.includes("insert") ||
      inputType.includes("delete") ||
      inputType.includes("history")
    ) {
      clearVirtualFocus();
    }
  };

  /**
   * Clicking back into the input while virtual focus sits on an option.
   *
   * The press has to clear it on the way *down*, before the click's own focus handling runs, or
   * the option would stay lit under a caret the user just put back in the text. Touch is left
   * out on purpose: a tap on a touch device is not a request to move focus to the input.
   */
  const onPointerdown = (event: Event) => {
    const pointer = event as PointerEvent;

    if (pointer.button !== 0 || pointer.pointerType === "touch") return;
    if (selection.focusedKey.value == null) return;
    if (pointer.target !== options.inputElement.value) return;

    clearVirtualFocus();
  };

  /*
   * Attached to the element rather than routed through the field composable: neither `beforeinput`
   * nor `pointerdown` is something a text field has any use for, and adding them there would pull
   * every control that renders one along with it.
   */
  watch(
    options.inputElement,
    (element, _previous, onCleanup) => {
      if (!element) return;

      element.addEventListener("beforeinput", onBeforeinput);
      element.addEventListener("pointerdown", onPointerdown);

      onCleanup(() => {
        element.removeEventListener("beforeinput", onBeforeinput);
        element.removeEventListener("pointerdown", onPointerdown);
      });
    },
    {flush: "post", immediate: true},
  );

  /** The keys the collection answers, which the caret must not also act on. */
  const isCollectionKey = (key: string) =>
    key === "ArrowUp" ||
    key === "ArrowDown" ||
    key === "Home" ||
    key === "End" ||
    key === "PageUp" ||
    key === "PageDown";

  const onKeydown = (event: KeyboardEvent) => {
    if (!isVirtual.value || event.isComposing || !keyboard.value) return;

    const focused = selection.focusedKey.value;

    switch (event.key) {
      case " ": {
        // Never an activation here: a space is a character in the text being typed.
        return;
      }
      case "Tab":
      case "Escape": {
        // Left to whatever encloses the field — the overlay closes on Escape, and Tab leaves.
        return;
      }
      case "Enter": {
        if (focused == null) return;

        event.preventDefault();
        selection.select(focused);

        return;
      }
      case "ArrowLeft":
      case "ArrowRight": {
        /*
         * The caret keeps these until virtual focus is somewhere. Once it is, they belong to the
         * collection — and clearing virtual focus afterwards is what upstream does too, so a
         * screen reader announcement is not cut off while the focused key stays put for the
         * next arrow press to resume from.
         */
        if (focused == null) {
          clearVirtualFocus();

          return;
        }

        keyboard.value?.onKeydown(event);
        clearVirtualFocus();

        return;
      }
      default: {
        if (!isCollectionKey(event.key)) return;

        // Extending a selection from nowhere has no anchor, so the caret keeps the key.
        if (focused == null && event.shiftKey && (event.key === "Home" || event.key === "End")) {
          return;
        }

        // Claimed before the collection sees it so the caret does not also run to the end.
        event.preventDefault();
        selection.setFocused(true);
        keyboard.value?.onKeydown(event);
      }
    }
  };

  /**
   * Nothing to do on the way up, and that is the point.
   *
   * Upstream re-dispatches the keyup onto the focused option so its press layer sees a matched
   * down/up pair; here the option was never sent a keydown to match. Kept in the shape so a
   * control can wire both halves without asking which one matters.
   */
  const onKeyup = (_event: KeyboardEvent) => {};

  const onBlur = () => {
    clearVirtualFocus();
  };

  /**
   * The focused option loses virtual focus when it leaves the collection.
   *
   * Typing narrows the options, and the one the arrows had landed on is often among the ones that
   * go. Left alone, the input would keep naming an element that is no longer in the document.
   */
  watch(
    () => collection.size.value,
    () => {
      const focused = selection.focusedKey.value;

      if (focused != null && !collection.getItem(focused)) clearVirtualFocus();
    },
    {flush: "post"},
  );

  return {
    clearVirtualFocus,
    focusFirstItem,
    inputAttributes: computed(() => ({
      "aria-activedescendant": keyboard.value?.focusedNodeId.value,
      // Only ever `"list"`: the input is never completed in place, so `"both"` would be a lie.
      "aria-autocomplete": "list",
      "aria-controls": toValue(options.collectionId),
      autocomplete: "off",
      // Off because the collection is the suggestion list — iOS offering its own on top of it,
      // and Safari on macOS correcting the text underneath it, both fight the filter.
      autocorrect: "off",
      enterkeyhint: "go",
      spellcheck: "false",
    })),
    inputValue: computed(() => state.value),
    onBlur,
    onKeydown,
    onKeyup,
    setInputValue,
  };
};
