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
  <div class="frame">
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

      <SidebarInset class="inset">
        <SidebarTrigger />
      </SidebarInset>
    </Sidebar>
  </div>
</template>

<style scoped>
.frame {
  height: calc(var(--rp-spacing) * 72);
  width: 100%;
  overflow: hidden;
  border-radius: var(--rp-radius);
  border-style: solid;
  border-width: 1px;
  border-color: var(--rp-border);
}

.inset {
  padding: calc(var(--rp-spacing) * 4);
}
</style>
