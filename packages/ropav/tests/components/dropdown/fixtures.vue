<script setup lang="ts" vapor>
import type { DropdownFixtureItem } from "./fixtures.types";
import type { CollectionKey } from "@/composables/use-collection";
import type { MenuTriggerType } from "@/composables/use-menu-trigger";
import type { CollectionSelection, SelectionMode } from "@/composables/use-selection-manager";

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

const props = withDefaults(
  defineProps<{
    items?: DropdownFixtureItem[];
    disabledKeys?: string[];
    selectionMode?: SelectionMode;
    selectedKeys?: Iterable<CollectionKey>;
    trigger?: MenuTriggerType;
    isOpen?: boolean;
    withHeader?: boolean;
    withIndicator?: boolean;
    withSection?: boolean;
    withSeparator?: boolean;
    withSubmenu?: boolean;
    withCustomTrigger?: boolean;
    /** Whether the caller hands over an empty slot at all. */
    withEmptyState?: boolean;
  }>(),
  {
    disabledKeys: undefined,
    isOpen: undefined,
    selectedKeys: undefined,
    selectionMode: undefined,
    trigger: undefined,
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
    :is-open="props.isOpen"
    :trigger="props.trigger"
    @open-change="emit('openChange', $event)"
  >
    <DropdownTrigger v-if="props.withCustomTrigger" aria-label="Menu">Actions</DropdownTrigger>
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
          <DropdownSubmenuTrigger v-if="props.withSubmenu">
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
</template>
