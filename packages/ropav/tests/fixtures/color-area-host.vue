<script setup lang="ts" vapor>
import type {ColorAreaHostProps} from "./color-area.types";

import {shallowRef} from "vue";

import {useColorArea} from "@/composables/use-color-area";
import {useColorAreaState} from "@/composables/use-color-area-state";

// `isDisabled` declares `default: undefined`: Vue casts an absent Boolean prop to `false`, and a
// forwarded `false` is not the same as absent.
const props = withDefaults(defineProps<ColorAreaHostProps>(), {isDisabled: undefined});

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

const state = useColorAreaState({
  colorSpace: () => props.colorSpace,
  defaultValue: () => props.defaultValue,
  onChange: props.onChange,
  onChangeEnd: props.onChangeEnd,
  value: () => props.value,
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

props.onReady?.({area, state});
</script>

<template>
  <div
    :ref="setContainerEl"
    v-bind="area.areaAttrs.value"
    data-testid="area"
    :style="area.areaStyle.value"
    @pointerdown="area.areaHandlers.onPointerdown"
  >
    <div
      v-bind="area.thumbAttrs"
      data-testid="thumb"
      :style="area.thumbStyle.value"
      @focusout="area.thumbHandlers.onFocusout"
      @keydown="area.thumbHandlers.onKeydown"
      @pointerdown="area.thumbHandlers.onPointerdown"
    >
      <input
        :ref="setInputXEl"
        v-bind="area.xInputProps.value"
        data-testid="input-x"
        :style="area.inputStyle"
        @change="area.xInputHandlers.onChange"
        @focus="area.xInputHandlers.onFocus"
      />
      <input
        :ref="setInputYEl"
        v-bind="area.yInputProps.value"
        data-testid="input-y"
        :style="area.inputStyle"
        @change="area.yInputHandlers.onChange"
        @focus="area.yInputHandlers.onFocus"
      />
    </div>
  </div>
</template>
