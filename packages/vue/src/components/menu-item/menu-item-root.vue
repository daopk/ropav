<script setup lang="ts" vapor>
import type {MenuItemRootProps, MenuItemSlotProps} from "./menu-item.types";

import {menuItemVariants} from "@heroui/styles";
import {computed, shallowRef, watch} from "vue";

import {provideFieldIdsContext, useFieldIds} from "../../composables/use-field-ids";
import {useId} from "../../composables/use-id";
import {useInteractionStates} from "../../composables/use-interaction-states";
import {dataAttr} from "../../utils/assertion";
import {getCollectionTextValue} from "../../utils/text-value";
import {useMenuContext, useMenuSectionContext} from "../menu/menu.context";

import {provideMenuItemContext, useMenuItemPopupContext} from "./menu-item.context";

const props = defineProps<MenuItemRootProps>();

defineSlots<{default?: (props: MenuItemSlotProps) => unknown}>();

const menu = useMenuContext();
const section = useMenuSectionContext();
const popup = useMenuItemPopupContext();

// A section may carry its own selection — one section of text styles, another of alignments —
// so the item selects through the nearest one rather than through the menu.
const selection = computed(() => section?.selection.value ?? menu.selection);
const shouldCloseOnSelect = computed(
  () => section?.shouldCloseOnSelect.value ?? menu.shouldCloseOnSelect.value,
);

const slots = computed(() => menuItemVariants({variant: props.variant}));

const generatedKey = useId();
const itemKey = computed(() => props.id ?? generatedKey.value);

const element = shallowRef<HTMLElement | null>(null);

// Registered post-flush so the element is attached before the collection asks the DOM where it
// sits. Metadata is handed over as getters, so a later prop change needs no re-registration.
watch(
  element,
  (current, _previous, onCleanup) => {
    if (!current) return;

    onCleanup(
      menu.collection.register(itemKey.value, {
        element: () => element.value,
        isDisabled: () => Boolean(props.isDisabled),
        textValue: () => props.textValue ?? getCollectionTextValue(element.value),
      }),
    );
  },
  {flush: "post", immediate: true},
);

// The popup is declared beside this item, so it only learns which item it belongs to once the
// item says so.
watch(
  [element, itemKey],
  ([current, key], _previous, onCleanup) => {
    if (!current || !popup) return;

    onCleanup(popup.registerTrigger(key, () => element.value));
  },
  {flush: "post", immediate: true},
);

const hasSubmenu = computed(() => Boolean(popup));
const isOpen = computed(() => Boolean(popup?.isOpen.value));
const isSelected = computed(() => selection.value.isSelected(itemKey.value));
const isDisabled = computed(() => selection.value.isDisabled(itemKey.value));
const selectionMode = computed(() => selection.value.selectionMode.value);

// An item that opens a submenu is a trigger, not a choice: ARIA gives it the plain `menuitem`
// role and no checked state, whatever the surrounding selection mode is.
const role = computed(() => {
  if (hasSubmenu.value) return "menuitem";
  if (selectionMode.value === "single") return "menuitemradio";
  if (selectionMode.value === "multiple") return "menuitemcheckbox";

  return "menuitem";
});

// Only the description slot is wired: the item names itself from its content, exactly as the
// React build does, so handing out a label id would add an attribute nothing points at.
const fieldIds = useFieldIds({slots: ["description"]});

provideFieldIdsContext(fieldIds.context);
provideMenuItemContext({hasSubmenu, isSelected, slots});

const {
  isFocusVisible,
  isFocused,
  isHovered,
  isPressed,
  onBlur,
  onFocus,
  onPointerdown,
  onPointerenter: onPointerenterState,
  onPointerleave: onPointerleaveState,
} = useInteractionStates({isDisabled: () => isDisabled.value});

/**
 * Whether choosing the item also closes the menu.
 *
 * Enter always closes — it means "do this and be done". Space is the key for ticking things
 * without leaving, so it only closes when there is nothing to tick. A pointer closes unless the
 * menu is multi-select, where the user is plainly making several choices.
 */
const closesOnActivate = (source: "pointer" | "enter" | "space") => {
  if (source === "enter") return true;
  if (source === "space") return selectionMode.value === "none";

  return selectionMode.value !== "multiple";
};

const activate = (
  source: "pointer" | "enter" | "space",
  modifiers: {ctrl?: boolean; shift?: boolean} = {},
) => {
  if (isDisabled.value) return;

  menu.keyboard.focusKey(itemKey.value);

  // A trigger opens its submenu; it is not itself a choice to be made.
  if (popup) {
    popup.onActivate(source === "pointer" ? "pointer" : "keyboard");

    return;
  }

  menu.onAction?.(itemKey.value);

  if (selectionMode.value !== "none") {
    selection.value.select(itemKey.value, {
      isCtrlPressed: modifiers.ctrl,
      isShiftPressed: modifiers.shift,
    });
  }

  if (shouldCloseOnSelect.value && closesOnActivate(source)) menu.onClose?.();
};

const onClick = (event: MouseEvent) => {
  activate("pointer", {ctrl: event.ctrlKey || event.metaKey, shift: event.shiftKey});
};

const onKeydown = (event: KeyboardEvent) => {
  popup?.onKeydown(event);

  if (event.defaultPrevented) return;
  if (event.key !== "Enter" && event.key !== " ") return;

  // Claimed here rather than left to the menu: the menu holds one selection, and an item inside
  // a section has to act on the section's instead.
  event.preventDefault();
  event.stopPropagation();
  activate(event.key === "Enter" ? "enter" : "space", {shift: event.shiftKey});
};

const onPointerenter = (event: PointerEvent) => {
  onPointerenterState(event);

  if (isDisabled.value) return;

  popup?.onPointerenter();

  // Hovering a menu item moves focus to it, which is what makes the keyboard pick up from
  // wherever the pointer left off. Never while a submenu is open, or focus would be dragged out
  // of the submenu the pointer is on its way to.
  if (!isFocusVisible.value && !isOpen.value) {
    selection.value.setFocused(true);
    menu.keyboard.focusKey(itemKey.value);
  }
};

const onPointerleave = () => {
  onPointerleaveState();
  popup?.onPointerleave();
};

// Shift+Tab out of an open submenu should leave the menu tree rather than land back on the item
// that opened it, which would reopen the submenu it just left.
const tabIndex = computed(() => (isOpen.value ? -1 : menu.keyboard.itemTabIndex(itemKey.value)));

// Rendered even while collapsed, so a screen reader can say the submenu is there and closed
// rather than leaving the state unstated.
const ariaExpanded = computed<"true" | "false" | undefined>(() => {
  if (!hasSubmenu.value) return undefined;

  return isOpen.value ? "true" : "false";
});
</script>

<template>
  <div
    :id="`${menu.menuId.value}-item-${itemKey}`"
    ref="element"
    :aria-checked="selectionMode === 'none' || hasSubmenu ? undefined : isSelected"
    :aria-controls="popup?.popupId.value"
    :aria-describedby="fieldIds.describedBy.value"
    :aria-disabled="isDisabled || undefined"
    :aria-expanded="ariaExpanded"
    :aria-haspopup="hasSubmenu ? 'menu' : undefined"
    :class="slots.item({class: props.class})"
    :data-collection="menu.collectionId.value"
    :data-disabled="dataAttr(isDisabled)"
    :data-focus-visible="dataAttr(isFocusVisible)"
    :data-focused="dataAttr(isFocused)"
    :data-has-submenu="dataAttr(hasSubmenu)"
    :data-hovered="dataAttr(isHovered)"
    :data-key="itemKey"
    :data-open="dataAttr(isOpen)"
    :data-pressed="dataAttr(isPressed)"
    :data-selected="dataAttr(isSelected)"
    :data-selection-mode="selectionMode === 'none' ? undefined : selectionMode"
    data-slot="menu-item"
    :role="role"
    :tabindex="tabIndex"
    @blur="onBlur"
    @click="onClick"
    @focus="onFocus"
    @keydown="onKeydown"
    @pointerdown="onPointerdown"
    @pointerenter="onPointerenter"
    @pointerleave="onPointerleave"
  >
    <slot
      :has-submenu="hasSubmenu"
      :is-disabled="isDisabled"
      :is-focus-visible="isFocusVisible"
      :is-focused="isFocused"
      :is-hovered="isHovered"
      :is-open="isOpen"
      :is-pressed="isPressed"
      :is-selected="isSelected"
      :selection-mode="selectionMode"
    />
  </div>
</template>
