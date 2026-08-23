<script setup lang="ts" vapor>
import type { CollectionKey } from "../../composables/use-collection";
import type { CollectionSelection } from "../../composables/use-selection-manager";
import type { Color } from "../../utils/color-types";
import type {
  ColorSwatchPickerRootProps,
  ColorSwatchPickerRootSlotProps,
} from "./color-swatch-picker.types";

import { colorSwatchPickerVariants } from "@ropav/styles";
import { computed, shallowRef, triggerRef } from "vue";

import { useCollection } from "../../composables/use-collection";
import { useColorPickerState } from "../../composables/use-color-picker-state";
import { useId } from "../../composables/use-id";
import { useListKeyboard } from "../../composables/use-list-keyboard";
import { useLocalizedStringFormatter } from "../../composables/use-localized-string-formatter";
import { useSelectionManager } from "../../composables/use-selection-manager";
import { useTypeahead } from "../../composables/use-typeahead";
import { colorStrings } from "../../i18n/color";
import { dataAttr } from "../../utils/assertion";
import { useColorValueContext } from "../color-picker/color-picker.context";

import { provideColorSwatchPickerContext } from "./color-swatch-picker.context";

const props = defineProps<ColorSwatchPickerRootProps>();

const emit = defineEmits<{
  change: [value: Color];
  "update:value": [value: Color];
}>();

defineSlots<{ default?: (props: ColorSwatchPickerRootSlotProps) => unknown }>();

const strings = useLocalizedStringFormatter(colorStrings);

/**
 * The colour a `ColorPicker` above is holding, when there is one.
 *
 * A prop still wins whenever it is present, and the picker is told about every change as well as
 * the caller — chained, not replaced, so a component with its own handler does not cut the
 * picker's update path. See `ColorValueContext`.
 */
const owner = useColorValueContext();

const state = useColorPickerState({
  defaultValue: () => props.defaultValue,
  onChange: (value) => {
    owner?.setValue(value);
    emit("change", value);
    emit("update:value", value);
  },
  value: () => (props.value !== undefined ? props.value : owner?.value.value),
});

const listId = useId();
const collectionId = useId();

const element = shallowRef<HTMLElement | null>(null);

/**
 * The colour behind each item key.
 *
 * Selection deals in keys, and a key here is `toString("hexa")` — recoverable by parsing, but a
 * round trip through text would lose which colour space the caller handed over, so the original
 * is kept. A shallow ref holding a plain `Map` rather than a reactive one: entries arrive from
 * items registering during mount, and the only reader is the selection callback, which runs long
 * afterwards.
 */
const colors = shallowRef(new Map<string, Color>());

const registerColor = (key: string, color: Color) => {
  colors.value.set(key, color);
  triggerRef(colors);

  return () => {
    colors.value.delete(key);
    triggerRef(colors);
  };
};

const collection = useCollection();

/**
 * Selection is the colour, expressed as a key.
 *
 * Always controlled: there is no second copy of the choice to keep in step, because the colour
 * *is* the selection. `disallowEmptySelection` then means a click on the selected swatch cannot
 * deselect it, which is what makes a palette a palette rather than a set of toggles.
 */
const selection = useSelectionManager({
  collection,
  disallowEmptySelection: true,
  onSelectionChange: (keys: CollectionSelection) => {
    if (keys === "all") return;

    const [key] = [...keys];

    // `setColor` ignores null, so a key with no colour behind it leaves the value alone rather
    // than dropping it to black.
    state.setColor(key == null ? null : (colors.value.get(String(key)) ?? null));
  },
  selectedKeys: () => [state.color.value.toString("hexa")],
  selectionMode: "single",
});

const keyboard = useListKeyboard({
  collection,
  element,
  layout: "grid",
  selection,
});

const typeahead = useTypeahead({
  focusedKey: () => selection.focusedKey.value,
  getKeyForSearch: keyboard.getKeyForSearch,
  onSearchMatch: (key: CollectionKey) => keyboard.focusKey(key, { scroll: true }),
});

/**
 * `layout` reaches the class list and nothing else.
 *
 * `data-layout` is hardcoded to `"grid"` below, and the keyboard is a grid either way, because the
 * React build destructures this prop out to build the modifier and never forwards it to the
 * collection underneath — so a `layout="stack"` picker there is a stack to look at and a grid to
 * navigate. Mirrored rather than corrected: the two builds are verified against each other, and
 * a keyboard model that differed would make every other difference unattributable.
 */
const slots = computed(() =>
  colorSwatchPickerVariants({
    layout: props.layout,
    size: props.size,
    variant: props.variant,
  }),
);

/**
 * The picker names itself when the caller does not.
 *
 * Only when there is no `aria-labelledby` either: a generic name alongside a specific one would
 * be read out as well as it, not instead of it.
 */
const ariaLabel = computed(() => {
  if (props.ariaLabel) return props.ariaLabel;

  return props.ariaLabelledby ? undefined : (strings.value.format("colorSwatchPicker") as string);
});

provideColorSwatchPickerContext({
  collection,
  collectionId,
  keyboard,
  listId,
  registerColor,
  selection,
  slots,
});

// Typeahead runs first: it has to claim a Space that is extending a search before the focused
// item treats the same key as a selection.
const onKeydown = (event: KeyboardEvent) => {
  typeahead.onKeydown(event);
  if (!event.defaultPrevented) keyboard.onKeydown(event);
};
</script>

<template>
  <div
    :id="listId"
    ref="element"
    :aria-label="ariaLabel"
    :aria-labelledby="props.ariaLabelledby"
    aria-orientation="vertical"
    :class="slots.base({ class: props.class })"
    :data-collection="collectionId"
    :data-empty="dataAttr(collection.size.value === 0)"
    data-layout="grid"
    data-orientation="vertical"
    data-slot="color-swatch-picker"
    role="listbox"
    :tabindex="keyboard.collectionTabIndex.value"
    @focusin="keyboard.onFocusin"
    @focusout="keyboard.onFocusout"
    @keydown="onKeydown"
    @keydown.capture="typeahead.onKeydownCapture"
  >
    <slot :color="state.color.value" />
  </div>
</template>
