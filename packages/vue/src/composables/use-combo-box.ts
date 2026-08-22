import type {PressResponder} from "./press-responder";
import type {UseComboBoxStateReturn} from "./use-combo-box-state";
import type {FieldIdsContext} from "./use-field-ids";
import type {ValidationResult} from "./use-form-validation-state";
import type {UseListKeyboardReturn} from "./use-list-keyboard";
import type {TriggerAriaAttributes} from "./use-overlay-trigger";
import type {TextFieldControlContext} from "./use-text-field";
import type {ComputedRef, MaybeRefOrGetter} from "vue";

import {computed, shallowRef, toValue, watch} from "vue";

import {comboBoxStrings} from "../i18n/combobox";
import {ariaHideOutside} from "../utils/aria-hide-outside";
import {announce} from "../utils/live-announcer";
import {isIOS, isMac} from "../utils/platform";

import {useAutocomplete} from "./use-autocomplete";
import {useFormReset} from "./use-form-reset";
import {useId} from "./use-id";
import {useLabels} from "./use-labels";
import {useLocalizedStringFormatter} from "./use-localized-string-formatter";
import {useOverlayTrigger} from "./use-overlay-trigger";
import {usePress} from "./use-press";
import {useTextField} from "./use-text-field";

/**
 * Whether this is a platform whose screen reader needs the focused option read out by hand.
 *
 * VoiceOver does not reliably announce a change of `aria-activedescendant`, so the option is put
 * through a live region instead. Every other screen reader does announce it, and announcing twice
 * is worse than not announcing at all.
 */
const isAppleDevice = () => isMac() || isIOS();

/** How long two touchend events have to be apart to count as two taps rather than one. */
const DOUBLE_TOUCH_MS = 500;

export interface UseComboBoxOptions {
  /**
   * The keyboard behaviour of the listbox, with virtual focus turned on.
   *
   * Read through a getter because only the listbox can build it — it is the one that knows its own
   * element and its own layout — so it arrives when the popover opens and goes away when it shuts.
   */
  keyboard: MaybeRefOrGetter<UseListKeyboardReturn | null | undefined>;
  /**
   * The popover element, when there is one.
   *
   * Needed for two things a combo box cannot do without it: focus moving into the popover is not
   * focus leaving the field, and everything outside the field and the popover is hidden from
   * assistive technology while the options are showing.
   */
  popoverElement?: MaybeRefOrGetter<HTMLElement | null | undefined>;
  isDisabled?: MaybeRefOrGetter<boolean | undefined>;
  isReadOnly?: MaybeRefOrGetter<boolean | undefined>;
  isRequired?: MaybeRefOrGetter<boolean | undefined>;
  /** Whether the arrow keys wrap around the ends of the list. */
  shouldFocusWrap?: MaybeRefOrGetter<boolean | undefined>;
  id?: MaybeRefOrGetter<string | undefined>;
  name?: MaybeRefOrGetter<string | undefined>;
  form?: MaybeRefOrGetter<string | undefined>;
  placeholder?: MaybeRefOrGetter<string | undefined>;
  autoComplete?: MaybeRefOrGetter<string | undefined>;
  autoFocus?: MaybeRefOrGetter<boolean | undefined>;
  inputMode?: MaybeRefOrGetter<string | undefined>;
  maxLength?: MaybeRefOrGetter<number | undefined>;
  minLength?: MaybeRefOrGetter<number | undefined>;
  pattern?: MaybeRefOrGetter<string | undefined>;
  ariaLabel?: MaybeRefOrGetter<string | undefined>;
  ariaLabelledby?: MaybeRefOrGetter<string | undefined>;
  ariaDescribedby?: MaybeRefOrGetter<string | undefined>;
  onFocusChange?: (isFocused: boolean) => void;
  onKeydown?: (event: KeyboardEvent) => void;
}

export interface UseComboBoxReturn {
  /**
   * Hand to `provideTextFieldControlContext`, and the plain `Input` becomes the combo box's field.
   *
   * Everything a combo box adds to a text field is already in here — the role, the expanded state,
   * the option it names, and the keys the list answers — so no combo box input part is needed. It
   * is the same arrangement React reaches by providing `InputContext`.
   */
  control: TextFieldControlContext;
  /** Hand to `provideFieldIdsContext`, for the label, description and error message. */
  fieldIds: FieldIdsContext;
  /** The input, once it has registered. The popover is positioned against this when nothing else. */
  inputElement: ComputedRef<HTMLInputElement | null>;
  inputId: ComputedRef<string>;
  labelId: ComputedRef<string | undefined>;
  describedBy: ComputedRef<string | undefined>;
  /** The listbox's id, which both the field and the button point `aria-controls` at. */
  listId: ComputedRef<string>;
  /** What names the listbox inside the popover. */
  listLabel: ComputedRef<{"aria-label": string | undefined; "aria-labelledby": string | undefined}>;
  /** Attributes the chevron renders, beside its own class and `data-slot`. */
  triggerAttributes: ComputedRef<ComboBoxTriggerAttributes>;
  /** The chevron, once it has registered. A blur into it is not a blur out of the field. */
  triggerElement: ComputedRef<HTMLElement | null>;
  /** Hand to `providePressResponder`, so the chevron picks up the press behaviour. */
  triggerResponder: PressResponder;
  isInvalid: ComputedRef<boolean>;
  validation: ComputedRef<ValidationResult>;
  /** Put the text back to what the field holds, for a caller that commits on its own. */
  reassert: () => void;
  /** Take virtual focus off whatever option holds it. */
  clearVirtualFocus: () => void;
}

export interface ComboBoxTriggerAttributes extends TriggerAriaAttributes {
  id: string;
  type: "button";
  "aria-label": string | undefined;
  "aria-labelledby": string | undefined;
  disabled: true | undefined;
  /**
   * Kept out of the tab order on purpose.
   *
   * The field is the tab stop, and the button does nothing the arrow keys in the field do not
   * already do — so a second stop would only make a keyboard user pass through a control they
   * have no reason to use.
   */
  tabindex: -1;
}

/**
 * Behaviour and accessibility for a combo box, ported from React Aria's
 * `packages/react-aria/src/combobox/useComboBox.ts` (react-aria 3.51.0).
 *
 * The arrangement is that real focus never leaves the input. The arrows move a *nominal* focus
 * over the options, the input names whichever one holds it with `aria-activedescendant`, and Enter
 * acts on it — which is what lets typing and choosing go on in one breath. That much is shared with
 * an autocomplete and comes from {@link useAutocomplete}; what is added here is everything about
 * the text being a value in its own right: Enter commits, Escape reverts, Tab commits and leaves,
 * and the arrows open a shut popover instead of navigating nothing.
 *
 * @example
 * ```ts
 * const state = useComboBoxState({items: () => props.items});
 * const comboBox = useComboBox({keyboard: () => keyboard.value}, state);
 *
 * provideTextFieldControlContext(comboBox.control);
 * ```
 */
export const useComboBox = <T>(
  options: UseComboBoxOptions,
  state: UseComboBoxStateReturn<T>,
): UseComboBoxReturn => {
  const strings = useLocalizedStringFormatter(comboBoxStrings);

  const isDisabled = computed(() => Boolean(toValue(options.isDisabled)));
  const isReadOnly = computed(() => Boolean(toValue(options.isReadOnly)));

  const {overlayId: listId, triggerAttributes: overlayAttributes} = useOverlayTrigger(
    {type: "listbox"},
    state,
  );

  /*
   * The input and the chevron are held here rather than read back off the field.
   *
   * The autocomplete layer has to exist before the field does — the field renders the attributes it
   * produces — but it also needs the element the field registers. Owning the reference here breaks
   * that circle, and it is the reference the autocomplete layer wants anyway.
   */
  const inputElement = shallowRef<HTMLInputElement | null>(null);
  const triggerElement = shallowRef<HTMLElement | null>(null);

  const focusInput = () => {
    inputElement.value?.focus();
  };

  const autocomplete = useAutocomplete({
    collection: state.collection,
    collectionId: listId,
    // Nothing lights up as the options narrow, which is what `aria-autocomplete="list"` promises:
    // the list is only a suggestion until an arrow key lands on one of its options. An
    // autocomplete inside a picker does the opposite, because there the text is never the value.
    disableAutoFocusFirst: true,
    inputElement,
    inputValue: () => state.inputValue.value,
    keyboard: options.keyboard,
    onInputChange: state.setInputValue,
    selection: state.selection,
  });

  /** The option the arrows have landed on, or nothing when the popover is shut. */
  const focusedKey = computed(() => (state.isOpen.value ? state.selection.focusedKey.value : null));

  /**
   * Whether a key belongs to the list rather than to the caret.
   *
   * Enter is carved out of what {@link useAutocomplete} handles: it selects the focused option
   * there, but a combo box has more to settle than that — unmatched text to keep or throw away,
   * a popover to close, and a form submit to hold back — so it is answered here instead.
   */
  const onShortcut = (event: KeyboardEvent) => {
    switch (event.key) {
      case "Enter": {
        // Held back only while the options are showing, so Enter still submits a closed field.
        if (state.isOpen.value) event.preventDefault();

        state.commit();

        return true;
      }
      case "Tab": {
        // Never claimed: the whole point is that focus moves on, with the field settled behind it.
        if (state.isOpen.value) state.commit();

        return true;
      }
      case "Escape": {
        state.revert();

        /*
         * Left to travel on when there is nothing of the combo box's own to undo — no selection,
         * or an empty field. A dialog around it then closes on the same press, which is what a
         * user pressing Escape twice in a row would otherwise have to do.
         */
        return !(state.selection.isEmpty.value || state.inputValue.value === "");
      }
      case "ArrowDown":
      case "ArrowUp": {
        if (state.isOpen.value) return false;

        // Opening is what these do to a shut popover, and the caret keeps them either way: they
        // move nothing in a single-line field.
        state.open(event.key === "ArrowDown" ? "first" : "last", "manual");

        return true;
      }
      default: {
        return false;
      }
    }
  };

  const onKeydown = (event: KeyboardEvent) => {
    if (isReadOnly.value) {
      options.onKeydown?.(event);

      return;
    }

    if (!onShortcut(event)) autocomplete.onKeydown(event);

    options.onKeydown?.(event);
  };

  const field = useTextField({
    ariaActivedescendant: () => autocomplete.inputAttributes.value["aria-activedescendant"],
    ariaAutocomplete: () => autocomplete.inputAttributes.value["aria-autocomplete"],
    ariaControls: () => overlayAttributes.value["aria-controls"],
    ariaDescribedby: options.ariaDescribedby,
    ariaExpanded: () => overlayAttributes.value["aria-expanded"],
    ariaLabel: options.ariaLabel,
    ariaLabelledby: options.ariaLabelledby,
    autoComplete: () => autocomplete.inputAttributes.value.autocomplete,
    autoCorrect: () => autocomplete.inputAttributes.value.autocorrect,
    /*
     * `enterkeyhint` is the one attribute of the autocomplete layer's bag that is *not* forwarded.
     * It labels the on-screen keyboard's action key "go", which is right for a search field whose
     * Enter runs a search — but Enter here settles a value in place, and `useComboBox` upstream
     * sets no hint at all.
     */
    autoFocus: options.autoFocus,
    // The text and the value are two halves of one thing, so the field reports through the combo
    // box's validation rather than starting a second one over the string it happens to hold.
    defaultValue: () => state.defaultInputValue.value,
    form: options.form,
    id: options.id,
    inputMode: options.inputMode,
    isDisabled: options.isDisabled,
    isReadOnly: options.isReadOnly,
    isRequired: options.isRequired,
    maxLength: options.maxLength,
    minLength: options.minLength,
    name: options.name,
    onChange: autocomplete.setInputValue,
    pattern: options.pattern,
    placeholder: options.placeholder,
    role: "combobox",
    // Off because the list *is* the suggestion list — Safari correcting the text underneath it
    // fights the filter.
    spellCheck: () => autocomplete.inputAttributes.value.spellcheck,
    validationState: state,
    // Controlled by the combo box throughout. The text is half of the value here, and a field
    // keeping a copy of its own would drift from it the moment anything was committed or reverted.
    value: () => state.inputValue.value,
  });

  /*
   * A reset puts the chosen key back as well as the text.
   *
   * The field composable already restores its own half, and it is the right element to hang this
   * off too: the hidden inputs carrying the key are rendered *from* the state, so restoring the
   * state is what puts the right ones back — the other way round leaves a stale set behind.
   */
  useFormReset(
    computed(() => inputElement.value),
    () => state.defaultValue.value,
    state.setValue,
  );

  /**
   * Whether focus is still somewhere inside the combo box.
   *
   * The chevron and the options are part of the same widget as the field, and the popover is
   * rendered at the end of the document — so a blur into either is not a blur out of anything.
   */
  const staysInside = (target: EventTarget | null) => {
    if (!(target instanceof Node)) return false;

    if (triggerElement.value?.contains(target)) return true;

    const popover = toValue(options.popoverElement);

    return Boolean(popover?.contains(target));
  };

  const control: TextFieldControlContext = {
    attrs: field.attrs,
    handlers: {
      onBlur: (event) => {
        if (staysInside(event.relatedTarget)) return;

        autocomplete.onBlur();
        field.handlers.onBlur(event);
        options.onFocusChange?.(false);
        state.setFocused(false);
      },
      onFocus: (event) => {
        if (state.isFocused.value) return;

        field.handlers.onFocus(event);
        options.onFocusChange?.(true);
        state.setFocused(true);
      },
      onInput: field.handlers.onInput,
      onKeydown,
      onKeyup: (event) => {
        autocomplete.onKeyup(event);
        field.handlers.onKeyup(event);
      },
    },
    isDisabled: field.isDisabled,
    isInvalid: field.isInvalid,
    isReadOnly: field.isReadOnly,
    isRequired: field.isRequired,
    registerElement: (element) => {
      inputElement.value = element instanceof HTMLInputElement ? element : null;
      field.registerElement(element);
    },
    setValueOwned: field.setValueOwned,
  };

  const triggerId = useId();

  const triggerPress = usePress({
    isDisabled: () => isDisabled.value || isReadOnly.value,
    isPressed: () => state.isOpen.value,
    /*
     * The order of these two lines is reversed from upstream, and it has to be.
     *
     * React focuses the field first and toggles second; both writes are deferred, so the toggle
     * still reads a shut popover and the gesture ends open. A write lands at once here, so focusing
     * a `menuTrigger: "focus"` combo box *opens* it — and the toggle that followed would read that
     * as "already open" and shut it again on the very press meant to open it. Toggling first asks
     * the question the user actually asked; the focus that follows then finds it open and leaves it
     * alone. Nothing is lost by the swap: both happen in one handler, and the DOM settles once.
     */
    onPress: (event) => {
      // A finger still on the glass has not chosen anything yet, so touch waits for the release.
      if (event.pointerType !== "touch") return;

      state.toggle(null, "manual");
      focusInput();
    },
    onPressStart: (event) => {
      if (event.pointerType === "touch") return;

      // A keyboard or a screen reader has no pointer to carry on with, so it lands on the first
      // option; a real pointer leaves the list unfocused, ready for the arrow keys.
      const strategy =
        event.pointerType === "keyboard" || event.pointerType === "virtual" ? "first" : null;

      state.toggle(strategy, "manual");
      focusInput();
    },
    // The field keeps focus throughout — that is what makes the button not a tab stop.
    preventFocusOnPress: true,
  });

  const triggerLabels = useLabels(() => ({
    "aria-label": strings.value.format("buttonLabel"),
    "aria-labelledby": toValue(options.ariaLabelledby) ?? field.labelId.value,
    id: triggerId.value,
  }));

  const listLabels = useLabels(() => ({
    "aria-label": strings.value.format("listboxLabel"),
    "aria-labelledby": toValue(options.ariaLabelledby) ?? field.labelId.value,
    id: listId.value,
  }));

  /*
   * A tap on the exact centre of the field is how VoiceOver on iPad reports a click with no
   * pointer behind it, and the field alone cannot tell that from a real tap — so the popover is
   * opened for it. Attached to the element rather than routed through the field composable, for
   * the same reason `beforeinput` is: a touch is nothing a text field has any use for.
   */
  let lastTouchAt = 0;

  const onTouchend = (event: TouchEvent) => {
    if (isDisabled.value || isReadOnly.value) return;

    // VoiceOver on iOS sometimes fires two of these in a row; the second one is not a tap.
    if (event.timeStamp - lastTouchAt < DOUBLE_TOUCH_MS) {
      event.preventDefault();
      focusInput();

      return;
    }

    const target = event.target;

    if (!(target instanceof Element)) return;

    const rect = target.getBoundingClientRect();
    const touch = event.changedTouches[0];

    if (!touch) return;

    const centreX = Math.ceil(rect.left + 0.5 * rect.width);
    const centreY = Math.ceil(rect.top + 0.5 * rect.height);

    if (touch.clientX !== centreX || touch.clientY !== centreY) return;

    event.preventDefault();
    focusInput();
    state.toggle(null, "manual");
    lastTouchAt = event.timeStamp;
  };

  watch(
    inputElement,
    (element, _previous, onCleanup) => {
      if (!element) return;

      element.addEventListener("touchend", onTouchend);

      onCleanup(() => element.removeEventListener("touchend", onTouchend));
    },
    {flush: "post", immediate: true},
  );

  /**
   * Everything but the field and its options is taken out of the accessibility tree while the
   * popover is open.
   *
   * The overlay layer does this for a modal popover; a combo box's is not one, because focus has
   * to stay in the field behind it. So it is done here, over both halves at once, which is what
   * keeps a screen reader's browse mode inside the widget it is reading.
   */
  watch(
    [() => state.isOpen.value, inputElement, () => toValue(options.popoverElement)],
    ([isOpen, input, popover], _previous, onCleanup) => {
      if (!isOpen || !popover) return;

      onCleanup(ariaHideOutside([input, popover].filter((element) => element != null)));
    },
    {flush: "post", immediate: true},
  );

  /** The option the arrows have landed on, announced by hand where the platform needs it. */
  let lastAnnouncedKey: string | null = null;

  watch(
    () => focusedKey.value,
    (key) => {
      if (!isAppleDevice() || key == null) {
        lastAnnouncedKey = key == null ? null : String(key);

        return;
      }

      if (String(key) === lastAnnouncedKey) return;

      lastAnnouncedKey = String(key);

      const item = state.collection.getItem(key);

      if (!item) return;

      announce(
        strings.value.format("focusAnnouncement", {
          groupCount: 0,
          groupTitle: "",
          // A collection built from data holds no sections, so there is never a group to enter.
          isGroupChange: false,
          isSelected: state.selection.isSelected(key),
          optionText: item.textValue(),
        }),
      );
    },
    {flush: "post"},
  );

  /** How many options were on offer last time, so only a change is worth saying. */
  let lastCount = state.collection.size.value;
  let wasOpen = state.isOpen.value;

  watch(
    () => [state.isOpen.value, state.collection.size.value] as const,
    ([isOpen, count]) => {
      // Only announced when the popover opened on nothing in particular: with an option already
      // focused a screen reader reads "1 of 6" of its own accord, and saying both is one too many.
      const openedWithoutFocus =
        isOpen !== wasOpen && (state.selection.focusedKey.value == null || isAppleDevice());

      if (isOpen && (openedWithoutFocus || count !== lastCount)) {
        announce(strings.value.format("countAnnouncement", {optionCount: count}));
      }

      lastCount = count;
      wasOpen = isOpen;
    },
    {flush: "post"},
  );

  /** What was chosen last time, so only a change is worth saying. */
  let lastSelectedKey = state.selectedKey.value;

  watch(
    () => state.selectedKey.value,
    (key) => {
      const changed = key !== lastSelectedKey;

      lastSelectedKey = key;

      if (!isAppleDevice() || !changed || key == null || !state.isFocused.value) return;

      const item = state.collection.getItem(key);

      if (!item) return;

      announce(strings.value.format("selectedAnnouncement", {optionText: item.textValue()}));
    },
    {flush: "post"},
  );

  const triggerAttributes = computed<ComboBoxTriggerAttributes>(() => ({
    ...overlayAttributes.value,
    "aria-label": triggerLabels.value["aria-label"],
    "aria-labelledby": triggerLabels.value["aria-labelledby"],
    disabled: isDisabled.value || isReadOnly.value || undefined,
    id: triggerId.value,
    tabindex: -1,
    type: "button",
  }));

  const triggerResponder: PressResponder = {
    // The same bag the return hands back by name, so the chevron can bind either one and there is
    // still only one place it is built.
    attrs: triggerAttributes as unknown as ComputedRef<Record<string, unknown>>,
    handlers: computed(() => triggerPress.handlers),
    isPressed: triggerPress.isPressed,
    registerElement: (next) => {
      triggerElement.value = next;
    },
  };

  return {
    clearVirtualFocus: autocomplete.clearVirtualFocus,
    control,
    describedBy: field.describedBy,
    fieldIds: field.fieldIds,
    inputElement: computed(() => inputElement.value),
    inputId: field.inputId,
    isInvalid: field.isInvalid,
    labelId: field.labelId,
    listId,
    listLabel: computed(() => ({
      "aria-label": listLabels.value["aria-label"],
      "aria-labelledby": listLabels.value["aria-labelledby"],
    })),
    reassert: field.reassert,
    triggerAttributes,
    triggerElement: computed(() => triggerElement.value),
    triggerResponder,
    validation: state.displayValidation,
  };
};
