<script setup lang="ts">
import {
  Avatar,
  AvatarFallback,
  Breadcrumbs,
  BreadcrumbsItem,
  Button,
  Dropdown,
  DropdownMenu,
  DropdownPopover,
  IconCalendar,
  IconSearch,
  InfoIcon,
  Label,
  MenuItem,
  Separator,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarItem,
  SidebarItemIcon,
  SidebarItemLabel,
  SidebarItemTooltip,
  SidebarPanel,
  SidebarRail,
  SidebarTrigger,
} from "ropav";
import { computed, shallowRef } from "vue";

const sections = [
  { id: "overview", name: "Overview" },
  { id: "search", name: "Search" },
  { id: "schedule", name: "Schedule" },
];

const current = shallowRef("overview");

const section = computed(() => sections.find((entry) => entry.id === current.value));
</script>

<template>
  <div class="frame">
    <Sidebar collapsible="icon">
      <SidebarPanel aria-label="Main">
        <SidebarHeader>Acme</SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>

            <SidebarItemTooltip label="Overview">
              <SidebarItem
                :aria-current="current === 'overview' ? 'page' : undefined"
                @press="current = 'overview'"
              >
                <SidebarItemIcon><InfoIcon /></SidebarItemIcon>
                <SidebarItemLabel>Overview</SidebarItemLabel>
              </SidebarItem>
            </SidebarItemTooltip>

            <SidebarItemTooltip label="Search">
              <SidebarItem
                :aria-current="current === 'search' ? 'page' : undefined"
                @press="current = 'search'"
              >
                <SidebarItemIcon><IconSearch /></SidebarItemIcon>
                <SidebarItemLabel>Search</SidebarItemLabel>
              </SidebarItem>
            </SidebarItemTooltip>

            <SidebarItemTooltip label="Schedule">
              <SidebarItem
                :aria-current="current === 'schedule' ? 'page' : undefined"
                @press="current = 'schedule'"
              >
                <SidebarItemIcon><IconCalendar /></SidebarItemIcon>
                <SidebarItemLabel>Schedule</SidebarItemLabel>
              </SidebarItem>
            </SidebarItemTooltip>
          </SidebarGroup>
        </SidebarContent>
      </SidebarPanel>

      <SidebarRail />

      <SidebarInset>
        <div class="bar">
          <SidebarTrigger />
          <Separator class="rule" orientation="vertical" />

          <Breadcrumbs>
            <BreadcrumbsItem href="#">Acme</BreadcrumbsItem>
            <BreadcrumbsItem>{{ section?.name }}</BreadcrumbsItem>
          </Breadcrumbs>

          <Dropdown>
            <Button aria-label="Account" class="account" size="sm" variant="tertiary">
              <Avatar size="sm">
                <AvatarFallback>AL</AvatarFallback>
              </Avatar>
            </Button>

            <DropdownPopover>
              <DropdownMenu>
                <MenuItem id="profile" text-value="Profile">
                  <Label>Profile</Label>
                </MenuItem>
                <MenuItem id="sign-out" text-value="Sign out" variant="danger">
                  <Label>Sign out</Label>
                </MenuItem>
              </DropdownMenu>
            </DropdownPopover>
          </Dropdown>
        </div>

        <div class="page">
          <div class="page__title">{{ section?.name }}</div>
          <div class="page__body">Whatever this section renders goes here.</div>
        </div>
      </SidebarInset>
    </Sidebar>
  </div>
</template>

<style scoped>
.frame {
  width: 100%;
  height: calc(var(--rp-spacing) * 80);
  overflow: hidden;
  border: 1px solid var(--rp-border);
  border-radius: var(--rp-radius);
}

.bar {
  display: flex;
  gap: calc(var(--rp-spacing) * 2);
  align-items: center;
  padding: calc(var(--rp-spacing) * 3);
  border-bottom: 1px solid var(--rp-border);
}

.rule {
  height: calc(var(--rp-spacing) * 5);
}

/* Pushed to the far end, so the account sits opposite the trail whatever the trail says. */
.account {
  margin-inline-start: auto;
}

.page {
  padding: calc(var(--rp-spacing) * 6);
}

.page__title {
  font-size: var(--rp-text-lg);
  line-height: var(--rp-text-lg--line-height);
  font-weight: var(--rp-font-weight-semibold);
}

.page__body {
  margin-top: calc(var(--rp-spacing) * 2);
  font-size: var(--rp-text-sm);
  line-height: var(--rp-text-sm--line-height);
  color: var(--rp-muted);
}
</style>
