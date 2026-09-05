<script setup lang="ts">
import {
  IconCalendar,
  IconSearch,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarItem,
  SidebarItemIcon,
  SidebarItemLabel,
  SidebarPanel,
  SidebarTrigger,
} from "ropav";
</script>

<template>
  <div class="h-72 w-full overflow-hidden rounded-lg border border-[var(--border)]">
    <Sidebar collapsible="icon">
      <SidebarPanel aria-label="Main">
        <SidebarHeader>Acme</SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>

            <SidebarItem>
              <SidebarItemIcon><IconSearch /></SidebarItemIcon>
              <SidebarItemLabel>Search</SidebarItemLabel>
            </SidebarItem>

            <SidebarItem>
              <SidebarItemIcon><IconCalendar /></SidebarItemIcon>
              <SidebarItemLabel>Schedule</SidebarItemLabel>
            </SidebarItem>
          </SidebarGroup>
        </SidebarContent>
      </SidebarPanel>

      <SidebarInset class="p-4">
        <SidebarTrigger />
      </SidebarInset>
    </Sidebar>
  </div>
</template>
