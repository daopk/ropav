<script setup lang="ts" vapor>
import type { Color } from "../../utils/color-types";
import type { ColorAreaRootProps, ColorAreaSlotProps } from "./color-area.types";

import { colorAreaVariants } from "@ropav/styles";
import { computed, shallowRef } from "vue";

import { useColorArea } from "../../composables/use-color-area";
import { useColorAreaState } from "../../composables/use-color-area-state";
import { dataAttr } from "../../utils/assertion";
import { useColorValueContext } from "../color-picker/color-picker.context";

import { provideColorAreaContext } from "./color-area.context";

const props = withDefaults(defineProps<ColorAreaRootProps>(), { isDisabled: undefined });

const emit = defineEmits<{
  change: [value: Color];
  changeEnd: [value: Color];
  "update:value": [value: Color];
}>();

defineSlots<{ default?: (props: ColorAreaSlotProps) => unknown }>();

const containerEl = shallowRef<HTMLElement | null>(null);
const inputXEl = shallowRef<HTMLInputElement | null>(null);
const inputYEl = shallowRef<HTMLInputElement | null>(null);

const setContainerEl = (element: unknown) => {
  containerEl.value = element instanceof HTMLElement ? element : null;
};

const setInputXEl = (element: unknown) => {
  inputXEl.value = element instanceof HTMLInputElement ? element : null;
};

const setInputYEl = (element: unknown) => {
  inputYEl.value = element instanceof HTMLInputElement ? element : null;
};

/**
 * The colour a `ColorPicker` above is holding, when there is one.
 *
 * A prop still wins whenever it is present, and the picker is told about every change as well as
 * the caller — chained, not replaced, so a component with its own handler does not cut the
 * picker's update path. See `ColorValueContext`.
 */
const owner = useColorValueContext();

const state = useColorAreaState({
  colorSpace: () => props.colorSpace,
  defaultValue: () => props.defaultValue,
  onChange: (value) => {
    owner?.setValue(value);
    emit("change", value);
    emit("update:value", value);
  },
  onChangeEnd: (value) => emit("changeEnd", value),
  value: () => (props.value !== undefined ? props.value : owner?.value.value),
  xChannel: () => props.xChannel,
  yChannel: () => props.yChannel,
});

const area = useColorArea({
  ariaDescribedby: () => props.ariaDescribedby,
  ariaLabel: () => props.ariaLabel,
  ariaLabelledby: () => props.ariaLabelledby,
  containerEl,
  form: () => props.form,
  id: () => props.id,
  inputXEl,
  inputYEl,
  isDisabled: () => props.isDisabled,
  state,
  xName: () => props.xName,
  yName: () => props.yName,
});

const styles = computed(() => colorAreaVariants({ showDots: props.showDots }));

provideColorAreaContext({ area, setInputXEl, setInputYEl, slots: styles, state });

/**
 * The gradient is written twice on purpose: as `background`, which is what actually paints, and as
 * `--color-area-background`, which `.color-area` reads back. React ends up with both because its
 * render props merge the default style under the custom property, and the inline property is the
 * one that wins — so writing only the variable would drop `background-blend-mode` with it, and the
 * rgb branch needs that to combine its three layers. The result would still look like a plausible
 * colour square.
 */
const style = computed(() => ({
  ...area.areaStyle.value,
  "--color-area-background": area.areaStyle.value.background,
}));
</script>

<template>
  <div
    :ref="setContainerEl"
    v-bind="area.areaAttrs.value"
    :class="styles.base({ class: props.class })"
    :data-disabled="dataAttr(area.isDisabled.value)"
    data-slot="color-area"
    :style="style"
    @pointerdown="area.areaHandlers.onPointerdown"
  >
    <slot :color="state.value.value" :is-disabled="area.isDisabled.value" />
  </div>
</template>
