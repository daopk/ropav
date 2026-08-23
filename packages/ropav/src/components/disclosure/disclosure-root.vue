<script setup lang="ts" vapor>
import type { DisclosureKey } from "../../composables/use-disclosure-group";
import type { DisclosureRootProps } from "./disclosure.types";

import { disclosureVariants } from "@ropav/styles";
import { computed } from "vue";

import { providePressResponder } from "../../composables/press-responder";
import { useControllableState } from "../../composables/use-controllable-state";
import { useId } from "../../composables/use-id";
import { dataAttr } from "../../utils/assertion";
import { useDisclosureGroupContext } from "../disclosure-group/disclosure-group.context";

import { provideDisclosureContext } from "./disclosure.context";

// The three-state props declare an explicit `undefined` default, which is what distinguishes
// "the caller said nothing" from "the caller said false". Vue casts an absent Boolean prop to
// `false`, and reading that as a real answer would pin an uncontrolled disclosure shut and stop
// a group's disabled state from reaching it.
const props = withDefaults(defineProps<DisclosureRootProps>(), {
  defaultExpanded: undefined,
  isDisabled: undefined,
  isExpanded: undefined,
});

const emit = defineEmits<{
  expandedChange: [isExpanded: boolean];
  "update:isExpanded": [isExpanded: boolean];
}>();

defineSlots<{ default?: () => unknown }>();

const slots = computed(() => disclosureVariants());

const groupContext = useDisclosureGroupContext();
const group = groupContext?.group;

// The id names the disclosure to its group and prefixes the ids of its parts; it deliberately
// does not reach the DOM, so it cannot collide with an element the consumer ids for itself.
const disclosureId = useId(() => props.id);
const disclosureKey = computed<DisclosureKey>(() => disclosureId.value);
const triggerId = computed(() => `${disclosureId.value}-trigger`);
const panelId = computed(() => `${disclosureId.value}-panel`);

const emitExpanded = (isExpanded: boolean) => {
  emit("expandedChange", isExpanded);
  // Also emitted as an update event, so `v-model:is-expanded` works.
  emit("update:isExpanded", isExpanded);
};

/** Only consulted while standing alone; inside a group the group owns which panels are open. */
const { setState, state } = useControllableState<boolean>({
  defaultValue: props.defaultExpanded ?? false,
  onValueChange: emitExpanded,
  value: () => props.isExpanded,
});

// Named apart from the props they merge with: in a template an identifier that matches a prop
// name resolves to the prop, which would quietly drop the merged value.
const resolvedIsExpanded = computed(() =>
  group ? group.isExpanded(disclosureKey.value) : state.value,
);
const resolvedIsDisabled = computed(
  () => (props.isDisabled ?? false) || (group?.isDisabled.value ?? false),
);

const toggle = () => {
  if (resolvedIsDisabled.value) return;

  const next = !resolvedIsExpanded.value;

  if (group) {
    group.toggle(disclosureKey.value);
    // Reported here too, so a caller can watch one disclosure without tracking the whole set.
    emitExpanded(next);
  } else {
    setState(next);
  }
};

const registerTrigger = (element: HTMLElement) =>
  group ? group.registerTrigger(disclosureKey.value, element) : () => {};

const onTriggerKeydown = (event: KeyboardEvent) => group?.onTriggerKeydown(event);

/**
 * Turns whatever pressable sits inside into the trigger, so `<Disclosure.Heading><Button/>` works
 * without a `Disclosure.Trigger` wrapper.
 *
 * React marks such a button with a named slot, which Vue has no equivalent of — `slot` cannot be
 * a prop name — so the behaviour is handed down instead, the way a dropdown hands its trigger
 * down. `Disclosure.Content` shadows this, so a button inside the panel stays an ordinary button.
 */
let unregister: (() => void) | undefined;

providePressResponder({
  attrs: computed(() => ({
    "aria-controls": panelId.value,
    "aria-expanded": resolvedIsExpanded.value,
    id: triggerId.value,
    // Only written while disabled: an attribute bound as `undefined` would clear the value the
    // pressable set for itself.
    ...(resolvedIsDisabled.value ? { disabled: true } : {}),
  })),
  handlers: computed(() => ({
    onClick: () => toggle(),
    onDragstart: () => {},
    onKeydown: (event: KeyboardEvent) => onTriggerKeydown(event),
    onMousedown: () => {},
    onPointerdown: () => {},
    onPointerenter: () => {},
    onPointerleave: () => {},
    onPointerup: () => {},
  })),
  isPressed: computed(() => false),
  registerElement: (element) => {
    unregister?.();
    unregister = element ? registerTrigger(element) : undefined;
  },
});

provideDisclosureContext({
  isDisabled: resolvedIsDisabled,
  isExpanded: resolvedIsExpanded,
  onTriggerKeydown,
  panelId,
  registerTrigger,
  slots,
  toggle,
  triggerId,
});
</script>

<template>
  <div
    :class="slots.base({ class: props.class })"
    :data-disabled="dataAttr(resolvedIsDisabled)"
    :data-expanded="dataAttr(resolvedIsExpanded)"
    data-slot="disclosure"
  >
    <slot />
  </div>
</template>
