<script setup lang="ts" vapor>
import type {DropdownFixtureItem} from "./fixtures.types";
import type {CollectionKey} from "@/composables/use-collection";
import type {MenuTriggerType} from "@/composables/use-menu-trigger";
import type {CollectionSelection, SelectionMode} from "@/composables/use-selection-manager";

import {ButtonRoot} from "@/components/button";
import {DescriptionRoot} from "@/components/description";
import {Dropdown} from "@/components/dropdown";
import {HeaderRoot} from "@/components/header";
import {LabelRoot} from "@/components/label";
import {SeparatorRoot} from "@/components/separator";

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
  }>(),
  {
    disabledKeys: undefined,
    isOpen: undefined,
    selectedKeys: undefined,
    selectionMode: undefined,
    trigger: undefined,
    items: (): DropdownFixtureItem[] => [
      {id: "new-file", label: "New file"},
      {id: "copy-link", label: "Copy link"},
      {id: "delete-file", label: "Delete file"},
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
    <Dropdown.Trigger v-if="props.withCustomTrigger" aria-label="Menu">Actions</Dropdown.Trigger>
    <ButtonRoot v-else aria-label="Menu" variant="secondary">Actions</ButtonRoot>
    <Dropdown.Popover>
      <Dropdown.Menu
        :disabled-keys="props.disabledKeys"
        :selected-keys="props.selectedKeys"
        :selection-mode="props.selectionMode"
        @action="emit('action', $event)"
        @selection-change="emit('selectionChange', $event)"
      >
        <Dropdown.Section v-if="props.withSection">
          <HeaderRoot v-if="props.withHeader">Actions</HeaderRoot>
          <Dropdown.Item
            v-for="item of props.items"
            :id="item.id"
            :key="item.id"
            :is-disabled="item.isDisabled"
          >
            <Dropdown.ItemIndicator v-if="props.withIndicator" />
            <LabelRoot>{{ item.label }}</LabelRoot>
            <DescriptionRoot v-if="item.description">{{ item.description }}</DescriptionRoot>
          </Dropdown.Item>
        </Dropdown.Section>
        <template v-else>
          <Dropdown.Item
            v-for="item of props.items"
            :id="item.id"
            :key="item.id"
            :is-disabled="item.isDisabled"
          >
            <Dropdown.ItemIndicator v-if="props.withIndicator" />
            <LabelRoot>{{ item.label }}</LabelRoot>
            <DescriptionRoot v-if="item.description">{{ item.description }}</DescriptionRoot>
          </Dropdown.Item>
          <SeparatorRoot v-if="props.withSeparator" />
          <Dropdown.SubmenuTrigger v-if="props.withSubmenu">
            <Dropdown.Item id="share">
              <LabelRoot>Share</LabelRoot>
              <Dropdown.SubmenuIndicator />
            </Dropdown.Item>
            <Dropdown.Popover>
              <Dropdown.Menu>
                <Dropdown.Item id="whatsapp">
                  <LabelRoot>WhatsApp</LabelRoot>
                </Dropdown.Item>
                <Dropdown.Item id="telegram">
                  <LabelRoot>Telegram</LabelRoot>
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown.SubmenuTrigger>
        </template>
      </Dropdown.Menu>
    </Dropdown.Popover>
  </Dropdown>
</template>
