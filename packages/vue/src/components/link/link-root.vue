<script setup lang="ts" vapor>
import type {LinkRootProps, LinkRootSlotProps} from "./link.types";

import {linkVariants} from "@heroui/styles";
import {computed} from "vue";

import {useInteractionStates} from "../../composables/use-interaction-states";
import {usePress} from "../../composables/use-press";
import {dataAttr} from "../../utils/assertion";
import {useFieldsetContext} from "../fieldset/fieldset.context";

import {provideLinkContext} from "./link.context";

const props = withDefaults(defineProps<LinkRootProps>(), {isDisabled: undefined});

defineSlots<{default?: (props: LinkRootSlotProps) => unknown}>();

const fieldset = useFieldsetContext();

const resolvedIsDisabled = computed(() => Boolean(props.isDisabled ?? fieldset?.isDisabled.value));

const slots = computed(() => linkVariants());

provideLinkContext({slots});

const styles = computed(() => slots.value.base({class: props.class}));

// Press comes from `usePress` rather than from the interaction states, because a link activates
// on Enter and the pressed styling has to follow the key being held — the interaction states
// only watch the pointer. Hover and focus still come from there.
const press = usePress({isDisabled: resolvedIsDisabled});
const interaction = useInteractionStates({isDisabled: resolvedIsDisabled});

// An anchor with no destination is not a link to the browser, and neither is a disabled one —
// so those render as a span carrying the role instead, exactly as in React. The consequence is
// that a disabled link has no href for a stray click or a middle-click to follow.
const isAnchor = computed(() => Boolean(props.href) && !resolvedIsDisabled.value);

// A span has to be told it is a link.
const role = computed(() => (isAnchor.value ? undefined : "link"));

// Set even on an anchor, which is already tabbable: Safari does not focus a native link or
// button unless an explicit tab index says so, which is the reason react-aria always writes one.
// A disabled link should not be reachable at all, so it gets none.
const tabindex = computed(() => (resolvedIsDisabled.value ? undefined : 0));

const isCurrent = computed(() => Boolean(props.ariaCurrent));

// Chained by hand rather than spread: a listener reaching a vapor element through `v-bind` is
// re-attached on every render and can be dropped mid-dispatch.
const onPointerenter = (event: PointerEvent) => {
  interaction.onPointerenter(event);
  press.handlers.onPointerenter(event);
};

const onPointerleave = (event: PointerEvent) => {
  interaction.onPointerleave();
  press.handlers.onPointerleave(event);
};
</script>

<template>
  <a
    v-if="isAnchor"
    :aria-current="props.ariaCurrent"
    :aria-describedby="props.ariaDescribedby"
    :aria-label="props.ariaLabel"
    :aria-labelledby="props.ariaLabelledby"
    :class="styles"
    :data-current="dataAttr(isCurrent)"
    :data-focus-visible="dataAttr(interaction.isFocusVisible.value)"
    :data-focused="dataAttr(interaction.isFocused.value)"
    :data-hovered="dataAttr(interaction.isHovered.value)"
    :data-pressed="dataAttr(press.isPressed.value)"
    data-slot="link"
    :download="props.download"
    :href="props.href"
    :hreflang="props.hrefLang"
    :ping="props.ping"
    :referrerpolicy="props.referrerPolicy"
    :rel="props.rel"
    :tabindex="tabindex"
    :target="props.target"
    @blur="interaction.onBlur"
    @click="press.handlers.onClick"
    @dragstart="press.handlers.onDragstart"
    @focus="interaction.onFocus"
    @keydown="press.handlers.onKeydown"
    @mousedown="press.handlers.onMousedown"
    @pointerdown="press.handlers.onPointerdown"
    @pointerenter="onPointerenter"
    @pointerleave="onPointerleave"
    @pointerup="press.handlers.onPointerup"
  >
    <slot
      :is-current="isCurrent"
      :is-disabled="resolvedIsDisabled"
      :is-focus-visible="interaction.isFocusVisible.value"
      :is-focused="interaction.isFocused.value"
      :is-hovered="interaction.isHovered.value"
      :is-pressed="press.isPressed.value"
    />
  </a>
  <span
    v-else
    :aria-current="props.ariaCurrent"
    :aria-describedby="props.ariaDescribedby"
    :aria-disabled="resolvedIsDisabled || undefined"
    :aria-label="props.ariaLabel"
    :aria-labelledby="props.ariaLabelledby"
    :class="styles"
    :data-current="dataAttr(isCurrent)"
    :data-disabled="dataAttr(resolvedIsDisabled)"
    :data-focus-visible="dataAttr(interaction.isFocusVisible.value)"
    :data-focused="dataAttr(interaction.isFocused.value)"
    :data-hovered="dataAttr(interaction.isHovered.value)"
    :data-pressed="dataAttr(press.isPressed.value)"
    data-slot="link"
    :role="role"
    :tabindex="tabindex"
    @blur="interaction.onBlur"
    @click="press.handlers.onClick"
    @dragstart="press.handlers.onDragstart"
    @focus="interaction.onFocus"
    @keydown="press.handlers.onKeydown"
    @mousedown="press.handlers.onMousedown"
    @pointerdown="press.handlers.onPointerdown"
    @pointerenter="onPointerenter"
    @pointerleave="onPointerleave"
    @pointerup="press.handlers.onPointerup"
  >
    <slot
      :is-current="isCurrent"
      :is-disabled="resolvedIsDisabled"
      :is-focus-visible="interaction.isFocusVisible.value"
      :is-focused="interaction.isFocused.value"
      :is-hovered="interaction.isHovered.value"
      :is-pressed="press.isPressed.value"
    />
  </span>
</template>
