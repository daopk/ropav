<script setup lang="ts" vapor>
import type {
  ColorSwatchPickerItemProps,
  ColorSwatchPickerItemSlotProps,
} from "./color-swatch-picker.types";

import {computed, shallowRef, watch} from "vue";

import {useInteractionStates} from "../../composables/use-interaction-states";
import {useLocale} from "../../composables/use-locale";
import {dataAttr} from "../../utils/assertion";
import {normalizeColor} from "../../utils/color";

import {
  provideColorSwatchPickerItemContext,
  useColorSwatchPickerContext,
} from "./color-swatch-picker.context";

const props = defineProps<ColorSwatchPickerItemProps>();

defineSlots<{default?: (props: ColorSwatchPickerItemSlotProps) => unknown}>();

const {collection, collectionId, keyboard, listId, registerColor, selection, slots} =
  useColorSwatchPickerContext();

const locale = useLocale();

/**
 * `#0000` is the default because an item with no colour is a *transparent* swatch rather than an
 * error — the same reasoning as a standalone swatch, and the same value React Aria uses.
 */
const color = computed(() => normalizeColor(props.color || "#0000"));

/**
 * The item's identity is its colour.
 *
 * `hexa` and not `hex`: alpha has to be part of the key or two swatches differing only in opacity
 * would collide, and the selected key is compared against the picker's value in the same form.
 */
const itemKey = computed(() => color.value.toString("hexa"));

const element = shallowRef<HTMLElement | null>(null);

// Registered post-flush so the element is attached before the collection asks the DOM where it
// sits — grid navigation is geometry, so an unattached element would answer with zeroes.
watch(
  element,
  (current, _previous, onCleanup) => {
    if (!current) return;

    onCleanup(
      collection.register(itemKey.value, {
        element: () => element.value,
        isDisabled: () => Boolean(props.isDisabled),
        textValue: () => color.value.getColorName(locale.value.locale),
      }),
    );
  },
  {flush: "post", immediate: true},
);

// Kept apart from the collection registration: the picker needs the colour itself to answer a
// selection change, and it needs it whether or not the element has attached yet.
watch(
  itemKey,
  (key, _previous, onCleanup) => {
    onCleanup(registerColor(key, color.value));
  },
  {immediate: true},
);

const isSelected = computed(() => selection.isSelected(itemKey.value));
const isDisabled = computed(() => selection.isDisabled(itemKey.value));

const {
  isFocusVisible,
  isFocused,
  isHovered,
  isPressed,
  onBlur,
  onFocus: onFocusState,
  onPointerdown,
  onPointerenter,
  onPointerleave,
} = useInteractionStates({isDisabled: () => isDisabled.value});

/**
 * Keep the collection's focused key on whatever actually holds focus.
 *
 * Focus can arrive without the collection having moved it — a click, a screen reader stepping
 * through — and a focused key that disagrees with real focus leaves the roving tab stop on one
 * swatch while the ring is on another.
 */
const onFocus = (event: FocusEvent) => {
  onFocusState();

  if (event.target !== element.value) return;

  selection.setFocused(true);
  selection.setFocusedKey(itemKey.value);
};

const onClick = () => {
  if (isDisabled.value) return;

  keyboard.focusKey(itemKey.value);
  selection.select(itemKey.value);
};

provideColorSwatchPickerItemContext({
  color,
  isDisabled,
  isFocusVisible,
  isFocused,
  isHovered,
  isPressed,
  isSelected,
});

/**
 * The colour is carried as a custom property rather than as `background-color`.
 *
 * The swatch inside paints itself; what the item needs the colour for is its selected border,
 * which `.color-swatch-picker__item[data-selected="true"]` reads back out of the variable. React
 * ends up with exactly this one declaration too — its own style function replaces the caller's
 * rather than merging, which is the one place in the colour group where it does.
 */
const style = computed(() => ({"--color-swatch-current": color.value.toString("css")}));
</script>

<template>
  <div
    :id="`${listId}-option-${itemKey}`"
    ref="element"
    :aria-disabled="isDisabled || undefined"
    :aria-selected="isSelected"
    :class="slots.item({class: props.class})"
    :data-collection="collectionId"
    :data-disabled="dataAttr(isDisabled)"
    :data-focus-visible="dataAttr(isFocusVisible)"
    :data-focused="dataAttr(isFocused)"
    :data-hovered="dataAttr(isHovered)"
    :data-key="itemKey"
    :data-pressed="dataAttr(isPressed)"
    :data-selected="dataAttr(isSelected)"
    data-selection-mode="single"
    data-slot="color-swatch-picker-item"
    role="option"
    :style="style"
    :tabindex="keyboard.itemTabIndex(itemKey)"
    @blur="onBlur"
    @click="onClick"
    @focus="onFocus"
    @pointerdown="onPointerdown"
    @pointerenter="onPointerenter"
    @pointerleave="onPointerleave"
  >
    <slot
      :color="color"
      :is-disabled="isDisabled"
      :is-focus-visible="isFocusVisible"
      :is-focused="isFocused"
      :is-hovered="isHovered"
      :is-pressed="isPressed"
      :is-selected="isSelected"
    />
  </div>
</template>
