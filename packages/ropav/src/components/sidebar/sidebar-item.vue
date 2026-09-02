<script setup lang="ts" vapor>
import type { LinkCurrent } from "../link/link.types";
import type { SidebarItemEmits, SidebarItemProps, SidebarItemSlotProps } from "./sidebar.types";

import { computed } from "vue";

import { useInteractionStates } from "../../composables/use-interaction-states";
import { usePress } from "../../composables/use-press";
import { dataAttr } from "../../utils/assertion";
import { composeSlotClassName } from "../../utils/compose";
import { openLink } from "../../utils/open-link";
import { useRouterContext } from "../router-provider/router-provider.context";

import { useSidebarContext } from "./sidebar.context";

// Every prop whose type includes `boolean` declares an explicit `undefined` default. Vue casts an
// absent boolean to `false`, and a union containing boolean is enough for that to happen — the
// cast value then reaches the DOM, so every item would carry `aria-current="false"` claiming it is
// not the current page.
const props = withDefaults(defineProps<SidebarItemProps>(), {
  ariaCurrent: undefined,
  isDisabled: undefined,
});

// Activation is published as a press rather than left to the DOM click, so a caller hears a
// keyboard activation on an item that has no href and therefore fires no native click.
const emit = defineEmits<SidebarItemEmits>();

defineSlots<{ default?: (props: SidebarItemSlotProps) => unknown }>();

const { slots, state } = useSidebarContext();
const router = useRouterContext();

const isDisabled = computed(() => Boolean(props.isDisabled));

// Press comes from `usePress` rather than from the interaction states, because an item activates
// on Enter and the pressed styling has to follow the key being held — the interaction states only
// watch the pointer. Hover and focus still come from there.
const press = usePress({
  isDisabled,
  onPress: (event) => emit("press", event),
});
const interaction = useInteractionStates({ isDisabled });

// An anchor with no destination is not a link to the browser, and neither is a disabled one — so
// those render as a button instead, which is the honest element for a nav entry that acts. The
// consequence is that a disabled item has no href for a stray middle-click to follow.
const isAnchor = computed(() => Boolean(props.href) && !isDisabled.value);

// `"auto"` is not an ARIA token, so it is resolved here and never reaches the DOM. Asking is
// opt-in per item: one that names its own value, or names none, is untouched by the router.
const ariaCurrent = computed<Exclude<LinkCurrent, "auto"> | undefined>(() => {
  if (props.ariaCurrent !== "auto") return props.ariaCurrent;

  return props.href && router?.isCurrent(props.href) ? "page" : undefined;
});

const isCurrent = computed(() => Boolean(ariaCurrent.value));

// What the anchor carries, which a middle-click opens and "copy link address" yields — so it is
// the router's resolved URL where there is one. The router is handed `props.href` on navigation
// instead: it wants back the path it was given.
const resolvedHref = computed(() =>
  props.href === undefined ? undefined : (router?.resolveHref(props.href) ?? props.href),
);

// Set even on an anchor, which is already tabbable: Safari does not focus a native link or button
// unless an explicit tab index says so. A disabled item should not be reachable at all.
const tabindex = computed(() => (isDisabled.value ? undefined : 0));

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

// The single point where navigation is intercepted, and `openLink` stands aside for every click
// the browser must keep — a modifier held, a foreign origin, another target.
const onClick = (event: MouseEvent) => {
  press.handlers.onClick(event);
  openLink(event, { href: props.href, router, routerOptions: props.routerOptions });
};
</script>

<template>
  <a
    v-if="isAnchor"
    :aria-current="ariaCurrent"
    :aria-describedby="props.ariaDescribedby"
    :aria-label="props.ariaLabel"
    :aria-labelledby="props.ariaLabelledby"
    :class="composeSlotClassName(slots.item, props.class)"
    :data-collapsed="dataAttr(state.isCollapsed.value)"
    :data-current="dataAttr(isCurrent)"
    :data-focus-visible="dataAttr(interaction.isFocusVisible.value)"
    :data-focused="dataAttr(interaction.isFocused.value)"
    :data-hovered="dataAttr(interaction.isHovered.value)"
    :data-pressed="dataAttr(press.isPressed.value)"
    data-slot="sidebar-item"
    :href="resolvedHref"
    :rel="props.rel"
    :tabindex="tabindex"
    :target="props.target"
    @blur="interaction.onBlur"
    @click="onClick"
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
      :is-collapsed="state.isCollapsed.value"
      :is-current="isCurrent"
      :is-disabled="isDisabled"
      :is-focus-visible="interaction.isFocusVisible.value"
      :is-focused="interaction.isFocused.value"
      :is-hovered="interaction.isHovered.value"
      :is-pressed="press.isPressed.value"
    />
  </a>
  <button
    v-else
    :aria-current="ariaCurrent"
    :aria-describedby="props.ariaDescribedby"
    :aria-label="props.ariaLabel"
    :aria-labelledby="props.ariaLabelledby"
    :class="composeSlotClassName(slots.item, props.class)"
    :data-collapsed="dataAttr(state.isCollapsed.value)"
    :data-current="dataAttr(isCurrent)"
    :data-disabled="dataAttr(isDisabled)"
    :data-focus-visible="dataAttr(interaction.isFocusVisible.value)"
    :data-focused="dataAttr(interaction.isFocused.value)"
    :data-hovered="dataAttr(interaction.isHovered.value)"
    :data-pressed="dataAttr(press.isPressed.value)"
    data-slot="sidebar-item"
    :disabled="isDisabled || undefined"
    :tabindex="tabindex"
    type="button"
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
      :is-collapsed="state.isCollapsed.value"
      :is-current="isCurrent"
      :is-disabled="isDisabled"
      :is-focus-visible="interaction.isFocusVisible.value"
      :is-focused="interaction.isFocused.value"
      :is-hovered="interaction.isHovered.value"
      :is-pressed="press.isPressed.value"
    />
  </button>
</template>
