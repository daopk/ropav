<script setup lang="ts" vapor>
import type { SidebarFixtureItem } from "./fixtures.types";
import type { SidebarRailProps, SidebarRootProps } from "@/components/sidebar";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarItem,
  SidebarItemIcon,
  SidebarItemLabel,
  SidebarItemTrailing,
  SidebarPanel,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/sidebar";

/*
 * Every boolean declares an explicit `undefined` default. Vue casts an absent boolean prop to
 * `false`, so a fixture forwarding one nobody set would hand the component a deliberate "off" and
 * quietly test a different configuration than the one the case asked for.
 */
const props = withDefaults(
  defineProps<
    SidebarRootProps &
      SidebarRailProps & {
        items?: SidebarFixtureItem[];
        /** Renders the group without a label, to show the group naming itself instead. */
        noGroupLabel?: boolean;
        /** Leaves the rail out, for a sidebar driven by its trigger alone. */
        noRail?: boolean;
      }
  >(),
  {
    defaultExpanded: undefined,
    defaultMobileOpen: undefined,
    isDisabled: undefined,
    isExpanded: undefined,
    isMobileOpen: undefined,
    isResizable: undefined,
    noGroupLabel: undefined,
    noRail: undefined,
  },
);

defineEmits<{
  expandedChange: [isExpanded: boolean];
  "update:isExpanded": [isExpanded: boolean];
  "update:width": [width: string];
}>();

const defaultItems: SidebarFixtureItem[] = [
  { badge: "12", href: "/", isCurrent: true, label: "Home" },
  { href: "/inbox", label: "Inbox" },
  { isDisabled: true, label: "Archive" },
];
</script>

<template>
  <Sidebar
    :auto-save-id="props.autoSaveId"
    :breakpoint="props.breakpoint"
    :collapsible="props.collapsible"
    :default-expanded="props.defaultExpanded"
    :default-mobile-open="props.defaultMobileOpen"
    :default-width="props.defaultWidth"
    :is-expanded="props.isExpanded"
    :is-mobile-open="props.isMobileOpen"
    :side="props.side"
    :width="props.width"
    @expanded-change="$emit('expandedChange', $event)"
    @update:is-expanded="$emit('update:isExpanded', $event)"
    @update:width="$emit('update:width', $event)"
  >
    <SidebarPanel :aria-label="props.ariaLabel">
      <SidebarHeader>Acme</SidebarHeader>
      <SidebarContent>
        <SidebarGroup aria-label="Fallback">
          <SidebarGroupLabel v-if="!props.noGroupLabel">Workspace</SidebarGroupLabel>
          <SidebarItem
            v-for="item in props.items ?? defaultItems"
            :key="item.label"
            :aria-current="item.isCurrent ? 'page' : undefined"
            :href="item.href"
            :is-disabled="item.isDisabled"
          >
            <SidebarItemIcon><svg /></SidebarItemIcon>
            <SidebarItemLabel>{{ item.label }}</SidebarItemLabel>
            <SidebarItemTrailing v-if="item.badge">{{ item.badge }}</SidebarItemTrailing>
          </SidebarItem>
        </SidebarGroup>
        <SidebarSeparator />
      </SidebarContent>
      <SidebarFooter>Ada</SidebarFooter>
    </SidebarPanel>
    <SidebarRail
      v-if="!props.noRail"
      :is-disabled="props.isDisabled"
      :is-resizable="props.isResizable"
      :max-width="props.maxWidth"
      :min-width="props.minWidth"
    />
    <SidebarInset>
      <SidebarTrigger />
    </SidebarInset>
  </Sidebar>
</template>
