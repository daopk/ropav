<script setup lang="ts" vapor>
import type {SwitchRootProps, SwitchSlotProps} from "./switch.types";

import {switchVariants} from "@heroui/styles";
import {computed} from "vue";

import {useControllableState} from "../../composables/use-controllable-state";
import {provideFieldIdsContext, useFieldIds} from "../../composables/use-field-ids";
import {dataAttr} from "../../utils/assertion";

import {provideSwitchContext} from "./switch.context";

// `isSelected` declares an explicit `undefined` default because `undefined` is what marks
// the switch as uncontrolled: Vue otherwise casts an absent boolean prop to `false`, which
// reads as "the caller set false" and pins the switch permanently off, ignoring
// `defaultSelected` and every click.
const props = withDefaults(defineProps<SwitchRootProps>(), {
  isSelected: undefined,
});

const emit = defineEmits<{
  change: [isSelected: boolean];
  "update:isSelected": [isSelected: boolean];
}>();

defineSlots<{default?: (props: SwitchSlotProps) => unknown}>();

const {setState, state} = useControllableState<boolean>({
  defaultValue: props.defaultSelected ?? false,
  onValueChange: (isSelected) => {
    emit("change", isSelected);
    emit("update:isSelected", isSelected);
  },
  value: () => props.isSelected,
});

const styles = computed(() => switchVariants({size: props.size}));

// Help text nested in the field claims its own id, and the hidden input points
// `aria-describedby` at whichever ids were actually claimed.
const {context: fieldIds, describedBy} = useFieldIds({slots: ["description", "errorMessage"]});

provideFieldIdsContext(fieldIds);

// Named apart from the props they resolve: a binding that shadows a prop name is easy to
// misread, and the value here is state rather than the prop it merges with.
const resolvedIsSelected = computed(() => state.value);
const resolvedIsDisabled = computed(() => Boolean(props.isDisabled));
const resolvedIsReadOnly = computed(() => Boolean(props.isReadOnly));
const resolvedIsInvalid = computed(() => Boolean(props.isInvalid));
const resolvedIsRequired = computed(() => Boolean(props.isRequired));

provideSwitchContext({
  defaultSelected: computed(() => props.defaultSelected ?? false),
  describedBy,
  form: computed(() => props.form),
  isDisabled: resolvedIsDisabled,
  isInvalid: resolvedIsInvalid,
  isReadOnly: resolvedIsReadOnly,
  isRequired: resolvedIsRequired,
  isSelected: resolvedIsSelected,
  name: computed(() => props.name),
  setSelected: setState,
  slots: styles,
  value: computed(() => props.value),
});
</script>

<template>
  <div
    :class="styles.base({class: props.class})"
    :data-disabled="dataAttr(resolvedIsDisabled)"
    :data-invalid="dataAttr(resolvedIsInvalid)"
    :data-readonly="dataAttr(resolvedIsReadOnly)"
    :data-required="dataAttr(resolvedIsRequired)"
    :data-selected="dataAttr(resolvedIsSelected)"
    data-slot="switch"
  >
    <slot
      :is-disabled="resolvedIsDisabled"
      :is-invalid="resolvedIsInvalid"
      :is-read-only="resolvedIsReadOnly"
      :is-required="resolvedIsRequired"
      :is-selected="resolvedIsSelected"
    />
  </div>
</template>
