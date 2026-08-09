<script setup lang="ts" vapor>
import type {ButtonRootProps, ButtonSlotProps} from "./button.types";

import {buttonVariants} from "@heroui/styles";
import {computed, watch} from "vue";

import {composeFocusResponder, useFocusResponder} from "../../composables/focus-responder";
import {composePressResponder, usePressResponder} from "../../composables/press-responder";
import {useInteractionStates} from "../../composables/use-interaction-states";
import {dataAttr} from "../../utils/assertion";
import {announce} from "../../utils/live-announcer";
import {useButtonGroupContext} from "../button-group/button-group.context";
import {useFieldsetContext} from "../fieldset/fieldset.context";

// The boolean props declare an explicit `undefined` default so an absent prop stays
// absent: Vue otherwise casts a missing boolean to `false`, which reads as "the caller
// set false" and would swallow the value a surrounding group provides.
const props = withDefaults(defineProps<ButtonRootProps>(), {
  fullWidth: undefined,
  isDisabled: undefined,
  type: "button",
});

const emit = defineEmits<{click: [event: MouseEvent]}>();

defineSlots<{default?: (props: ButtonSlotProps) => unknown}>();

// A surrounding group supplies defaults for the whole row of buttons, which each button
// can still override for itself. `isIconOnly` is deliberately left out: it describes the
// content of one button rather than the shape of the group.
const group = useButtonGroupContext();
const fieldset = useFieldsetContext();

// Something above may be driving this button — a dropdown makes its first child the trigger —
// in which case it supplies the ARIA wiring and the press behaviour, and the button stays an
// ordinary button.
const responder = usePressResponder();

const setElement = (element: unknown) => {
  responder?.registerElement((element as HTMLElement | null) ?? null);
};

// Named apart from the props they resolve: a binding that shadows a prop name is read as
// the prop inside the template, which would silently drop the value coming from the group.
const resolvedFullWidth = computed(() => props.fullWidth ?? group?.fullWidth.value);
const resolvedIsDisabled = computed(
  () => props.isDisabled ?? group?.isDisabled.value ?? fieldset?.isDisabled.value,
);
const resolvedSize = computed(() => props.size ?? group?.size.value);
const resolvedVariant = computed(() => props.variant ?? group?.variant.value);

const styles = computed(() =>
  buttonVariants({
    class: props.class,
    fullWidth: resolvedFullWidth.value,
    isIconOnly: props.isIconOnly,
    size: resolvedSize.value,
    variant: resolvedVariant.value,
  }),
);

// The stylesheet keys hover, press and focus on these attributes, so they have to be
// rendered here rather than left to the native pseudo-classes.
const {
  isFocusVisible,
  isFocused,
  isHovered,
  isPressed,
  onBlur,
  onFocus,
  onPointerdown,
  onPointerenter,
  onPointerleave,
} = useInteractionStates({
  isDisabled: () => resolvedIsDisabled.value,
  isPending: () => props.isPending,
});

// A pending button keeps its label and only changes an attribute, so the transition
// would otherwise pass a screen reader by. Announced only while focused, because that
// is when the change is part of what the user is doing.
watch(
  () => Boolean(props.isPending),
  (isPending) => {
    if (!isFocused.value) return;

    announce(isPending ? "pending" : "");
  },
);

// Written even though a native button is already tabbable: Safari does not focus one unless
// an explicit tab index says so, which is the reason react-aria always sets it. A disabled
// button should not be reachable at all, so it gets none.
const tabindex = computed(() => (resolvedIsDisabled.value ? undefined : 0));

// Blocking the click is not enough on its own: implicit submission reaches the form
// through the button's own type, without a click ever landing on the button.
const type = computed(() => (props.isPending && props.type === "submit" ? "button" : props.type));

const onClick = (event: MouseEvent) => {
  // A pending button stays focusable rather than `disabled`, so activation is blocked here.
  if (props.isPending) {
    event.preventDefault();

    return;
  }

  emit("click", event);
};

// Hover and focus can also be handed down — a tooltip wrapped around this button watches it
// without the button having to know. Kept on its own channel: the press above may be a menu
// trigger's, and one channel would mean the two replace each other.
const focusResponder = useFocusResponder();
const focus = composeFocusResponder(focusResponder, {onBlur, onFocus});

const attrs = computed(() => ({
  ...focusResponder?.attrs.value,
  ...responder?.attrs.value,
}));

// A responder's listeners are chained here rather than spread with `v-bind`, which in vapor
// re-attaches them on every render — see `composePressResponder`.
const press = composePressResponder(responder, {
  onClick,
  onKeydown: focus.onKeydown,
  onPointerdown: (event) => {
    onPointerdown(event);
    focus.onPointerdown(event);
  },
  onPointerenter: (event) => {
    onPointerenter(event);
    focus.onPointerenter(event);
  },
  onPointerleave: (event) => {
    onPointerleave();
    focus.onPointerleave(event);
  },
});
</script>

<template>
  <button
    :ref="setElement"
    :aria-disabled="props.isPending || undefined"
    :class="styles"
    :data-disabled="dataAttr(resolvedIsDisabled)"
    :data-focus-visible="dataAttr(isFocusVisible)"
    :data-focused="dataAttr(isFocused)"
    :data-hovered="dataAttr(isHovered)"
    :data-pending="dataAttr(props.isPending)"
    :data-pressed="dataAttr(isPressed || responder?.isPressed.value)"
    data-slot="button"
    :disabled="resolvedIsDisabled || undefined"
    :tabindex="tabindex"
    :type="type"
    v-bind="attrs"
    @blur="focus.onBlur"
    @click="press.onClick"
    @dragstart="press.onDragstart"
    @focus="focus.onFocus"
    @keydown="press.onKeydown"
    @mousedown="press.onMousedown"
    @pointerdown="press.onPointerdown"
    @pointerenter="press.onPointerenter"
    @pointerleave="press.onPointerleave"
    @pointerup="press.onPointerup"
  >
    <slot
      :is-disabled="Boolean(resolvedIsDisabled)"
      :is-focus-visible="isFocusVisible"
      :is-hovered="isHovered"
      :is-pending="Boolean(props.isPending)"
      :is-pressed="isPressed"
    />
  </button>
</template>
