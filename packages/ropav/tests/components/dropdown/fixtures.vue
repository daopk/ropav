<script setup lang="ts" vapor>
import type { DropdownFixtureItem } from "./fixtures.types";
import type { CollectionKey } from "@/composables/use-collection";
import type { MenuTriggerType } from "@/composables/use-menu-trigger";
import type { CollectionSelection, SelectionMode } from "@/composables/use-selection-manager";

import { toggleButtonVariants } from "@ropav/styles";

import { Button } from "@/components/button";
import { Description } from "@/components/description";
import {
  Dropdown,
  DropdownMenu,
  DropdownPopover,
  DropdownSubmenuTrigger,
  DropdownTrigger,
} from "@/components/dropdown";
import { EmptyState } from "@/components/empty-state";
import { Header } from "@/components/header";
import { Label } from "@/components/label";
import { MenuItem, MenuItemIndicator, MenuItemSubmenuIndicator } from "@/components/menu-item";
import { MenuSection } from "@/components/menu-section";
import { Separator } from "@/components/separator";
import { ToggleButton } from "@/components/toggle-button";

const props = withDefaults(
  defineProps<{
    items?: DropdownFixtureItem[];
    disabledKeys?: string[];
    selectionMode?: SelectionMode;
    selectedKeys?: Iterable<CollectionKey>;
    trigger?: MenuTriggerType;
    isOpen?: boolean;
    /** Held on the root, which is what reaches whichever pressable is the trigger. */
    isDisabled?: boolean;
    /** Held on the custom trigger itself, which is meant to win over the root's. */
    triggerIsDisabled?: boolean;
    withHeader?: boolean;
    withIndicator?: boolean;
    withSection?: boolean;
    withSeparator?: boolean;
    submenuDelay?: number;
    withSubmenu?: boolean;
    withCustomTrigger?: boolean;
    /** Dresses the custom trigger in a control's classes, next to that control for comparison. */
    withBorrowedTrigger?: boolean;
    /** Whether the caller hands over an empty slot at all. */
    withEmptyState?: boolean;
  }>(),
  {
    disabledKeys: undefined,
    isDisabled: undefined,
    isOpen: undefined,
    selectedKeys: undefined,
    selectionMode: undefined,
    trigger: undefined,
    triggerIsDisabled: undefined,
    withEmptyState: undefined,
    items: (): DropdownFixtureItem[] => [
      { id: "new-file", label: "New file" },
      { id: "copy-link", label: "Copy link" },
      { id: "delete-file", label: "Delete file" },
    ],
  },
);

const emit = defineEmits<{
  action: [key: CollectionKey];
  openChange: [isOpen: boolean];
  selectionChange: [keys: CollectionSelection];
}>();
</script>

<template>
  <Dropdown
    :is-disabled="props.isDisabled"
    :is-open="props.isOpen"
    :trigger="props.trigger"
    @open-change="emit('openChange', $event)"
  >
    <DropdownTrigger
      v-if="props.withBorrowedTrigger"
      aria-label="Menu"
      :class="toggleButtonVariants({ isIconOnly: true, size: 'sm', variant: 'ghost' })"
    >
      <svg viewBox="0 0 16 16" />
    </DropdownTrigger>
    <DropdownTrigger
      v-else-if="props.withCustomTrigger"
      aria-label="Menu"
      :is-disabled="props.triggerIsDisabled"
    >
      Actions
    </DropdownTrigger>
    <Button v-else aria-label="Menu" variant="secondary">Actions</Button>
    <DropdownPopover>
      <DropdownMenu
        :disabled-keys="props.disabledKeys"
        :selected-keys="props.selectedKeys"
        :selection-mode="props.selectionMode"
        @action="emit('action', $event)"
        @selection-change="emit('selectionChange', $event)"
      >
        <template v-if="props.withEmptyState" #empty>
          <EmptyState>Nothing here</EmptyState>
        </template>
        <MenuSection v-if="props.withSection">
          <Header v-if="props.withHeader">Actions</Header>
          <MenuItem
            v-for="item of props.items"
            :id="item.id"
            :key="item.id"
            :is-disabled="item.isDisabled"
          >
            <MenuItemIndicator v-if="props.withIndicator" />
            <Label>{{ item.label }}</Label>
            <Description v-if="item.description">{{ item.description }}</Description>
          </MenuItem>
        </MenuSection>
        <template v-else>
          <MenuItem
            v-for="item of props.items"
            :id="item.id"
            :key="item.id"
            :is-disabled="item.isDisabled"
          >
            <MenuItemIndicator v-if="props.withIndicator" />
            <Label>{{ item.label }}</Label>
            <Description v-if="item.description">{{ item.description }}</Description>
          </MenuItem>
          <Separator v-if="props.withSeparator" />
          <DropdownSubmenuTrigger v-if="props.withSubmenu" :delay="props.submenuDelay">
            <MenuItem id="share">
              <Label>Share</Label>
              <MenuItemSubmenuIndicator />
            </MenuItem>
            <DropdownPopover>
              <DropdownMenu>
                <MenuItem id="whatsapp">
                  <Label>WhatsApp</Label>
                </MenuItem>
                <MenuItem id="telegram">
                  <Label>Telegram</Label>
                </MenuItem>
              </DropdownMenu>
            </DropdownPopover>
          </DropdownSubmenuTrigger>
        </template>
      </DropdownMenu>
    </DropdownPopover>
  </Dropdown>

  <!-- Outside the dropdown, where it cannot pick up the press responder and become a trigger too. -->
  <ToggleButton
    v-if="props.withBorrowedTrigger"
    aria-label="Reference"
    is-icon-only
    size="sm"
    variant="ghost"
  >
    <svg viewBox="0 0 16 16" />
  </ToggleButton>
</template>
