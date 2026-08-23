import type { PressResponder } from "./press-responder";
import type { CollectionKey } from "./use-collection";
import type { UseFieldIdsReturn } from "./use-field-ids";
import type { ValidationResult } from "./use-form-validation-state";
import type { UseSelectStateReturn } from "./use-select-state";
import type { ComputedRef, MaybeRefOrGetter } from "vue";

import { computed, toValue } from "vue";

import { useCollator } from "./use-collator";
import { useFieldIds } from "./use-field-ids";
import { useId } from "./use-id";
import { useMenuTrigger } from "./use-menu-trigger";
import { useTypeahead } from "./use-typeahead";

export interface UseSelectOptions {
  isDisabled?: MaybeRefOrGetter<boolean | undefined>;
  isRequired?: MaybeRefOrGetter<boolean | undefined>;
  ariaLabel?: MaybeRefOrGetter<string | undefined>;
  ariaLabelledby?: MaybeRefOrGetter<string | undefined>;
  ariaDescribedby?: MaybeRefOrGetter<string | undefined>;
  onFocusChange?: (isFocused: boolean) => void;
}

/** Attributes the trigger element renders, beside its own class and `data-slot`. */
export type SelectTriggerAttributes = Record<string, string | number | boolean | undefined>;

export interface UseSelectReturn {
  /** Hand to `providePressResponder`, so the trigger picks up the press behaviour. */
  responder: PressResponder;
  /** The trigger element, which the popover is positioned against. */
  triggerElement: ComputedRef<HTMLElement | null>;
  triggerId: ComputedRef<string>;
  /** The listbox's id, which the trigger points `aria-controls` at while open. */
  listId: ComputedRef<string>;
  /** The id of the element showing the current value, which names the trigger. */
  valueId: ComputedRef<string>;
  triggerAttributes: ComputedRef<SelectTriggerAttributes>;
  /** Bind statically with `@keydown` — a handler must never travel through `v-bind`. */
  onKeydown: (event: KeyboardEvent) => void;
  onKeydownCapture: (event: KeyboardEvent) => void;
  onFocus: () => void;
  onBlur: () => void;
  /** What names the listbox inside the popover. */
  labelledBy: ComputedRef<string | undefined>;
  fieldIds: UseFieldIdsReturn;
  isInvalid: ComputedRef<boolean>;
  validation: ComputedRef<ValidationResult>;
}

/**
 * Behaviour and accessibility for a select, ported from React Aria's `useSelect`.
 *
 * Two things happen on a **closed** trigger that make a select more than a button next to a
 * listbox, and both are why the collection has to be known while the popover is shut. The arrow
 * keys across the inline axis step through the options without opening anything, and typing
 * jumps straight to an option by name. Both are single-selection only: with several options
 * chosen there is no "next" one to step to, and upstream disables them the same way.
 *
 * @example
 * ```ts
 * const state = useSelectState({items: () => props.items});
 * const select = useSelect({isDisabled: () => props.isDisabled}, state);
 * ```
 */
export const useSelect = <T>(
  options: UseSelectOptions,
  state: UseSelectStateReturn<T>,
): UseSelectReturn => {
  const valueId = useId();

  const trigger = useMenuTrigger({ isDisabled: options.isDisabled, type: "listbox" }, state);

  const isSingle = computed(() => state.selectionMode.value === "single");

  /**
   * The label names a composite, so it renders as a `span` and moves focus by hand.
   *
   * A `label` element implies a single labelable control to point `for` at, and a select's
   * trigger is a button standing in for a hidden native control — pointing at either one would
   * be a lie about which element holds the value.
   */
  const fieldIds = useFieldIds({
    labelElementType: "span",
    onLabelClick: () => {
      if (toValue(options.isDisabled)) return;

      trigger.triggerElement.value?.focus();
    },
  });

  const isInvalid = computed(() => state.displayValidation.value.isInvalid);

  // Matched to the collator React Aria uses for type-to-select: case- and accent-insensitive,
  // and tuned for prefix searching rather than sorting.
  const collator = useCollator({ sensitivity: "base", usage: "search" });

  const getKeyForSearch = (search: string, fromKey?: CollectionKey | null) => {
    // Starts *at* `fromKey` rather than after it, matching React Aria: a longer search has to be
    // able to keep matching the option it is already on.
    let key = fromKey ?? state.collection.getFirstKey();

    while (key != null) {
      const item = state.collection.getItem(key);

      if (!item) return null;

      const text = item.textValue();

      if (text && collator.value.compare(text.slice(0, search.length), search) === 0) return key;

      key = state.collection.getKeyAfter(key);
    }

    return null;
  };

  const typeahead = useTypeahead({
    focusedKey: () => state.selectedKey.value,
    getKeyForSearch,
    // Nothing to type towards when several options are chosen at once.
    isDisabled: () => !isSingle.value || Boolean(toValue(options.isDisabled)),
    onSearchMatch: (key) => state.setValue(key),
  });

  /** Step the chosen option one along the collection, without opening anything. */
  const step = (direction: -1 | 1) => {
    const current = state.selectedKey.value;

    const next =
      current == null
        ? state.collection.getFirstKey()
        : direction === -1
          ? state.collection.getKeyBefore(current)
          : state.collection.getKeyAfter(current);

    if (next != null) state.setValue(next);
  };

  const onKeydown = (event: KeyboardEvent) => {
    if (toValue(options.isDisabled)) return;

    if (isSingle.value && !state.isOpen.value) {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        step(-1);

        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        step(1);

        return;
      }
    }

    typeahead.onKeydown(event);

    if (event.defaultPrevented) return;

    trigger.responder.handlers.value.onKeydown?.(event);
  };

  const labelledBy = computed(() => {
    const own = toValue(options.ariaLabelledby) ?? fieldIds.labelId.value;

    // A trigger named only by `aria-label` still has to name the listbox, and the only element
    // carrying that name is the trigger itself.
    return own ?? (toValue(options.ariaLabel) ? trigger.triggerId.value : undefined);
  });

  const describedBy = computed(() => {
    const parts = [toValue(options.ariaDescribedby), fieldIds.describedBy.value].filter(Boolean);

    return parts.length > 0 ? parts.join(" ") : undefined;
  });

  return {
    fieldIds,
    isInvalid,
    labelledBy,
    listId: trigger.overlayId,
    onBlur: () => {
      // Focus inside the open popover is still focus inside the select, and the popover is
      // rendered at the end of the document — so a blur while open never means "left".
      if (state.isOpen.value) return;

      options.onFocusChange?.(false);
      state.setFocused(false);
    },
    onFocus: () => {
      if (state.isFocused.value) return;

      options.onFocusChange?.(true);
      state.setFocused(true);
    },
    onKeydown,
    onKeydownCapture: typeahead.onKeydownCapture,
    responder: trigger.responder,
    triggerAttributes: computed(() => ({
      "aria-controls": state.isOpen.value ? trigger.overlayId.value : undefined,
      "aria-describedby": describedBy.value,
      "aria-expanded": state.isOpen.value,
      "aria-haspopup": "listbox" as const,
      "aria-invalid": isInvalid.value || undefined,
      "aria-label": toValue(options.ariaLabel),
      // The value comes first, so a screen reader reads the current choice before the field's
      // name — which is the order a native `<select>` announces in.
      "aria-labelledby": [valueId.value, toValue(options.ariaLabelledby) ?? fieldIds.labelId.value]
        .filter(Boolean)
        .join(" "),
      "aria-required": toValue(options.isRequired) || undefined,
      disabled: toValue(options.isDisabled) || undefined,
      id: trigger.triggerId.value,
      type: "button" as const,
    })),
    triggerElement: trigger.triggerElement,
    triggerId: trigger.triggerId,
    validation: state.displayValidation,
    valueId,
  };
};
