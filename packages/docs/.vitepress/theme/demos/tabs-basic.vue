<script setup lang="ts">
import { Tabs, TabsIndicator, TabsList, TabsListContainer, TabsPanel, TabsTab } from "ropav";

const items = [
  { body: "Everything that happened while you were away.", id: "activity", label: "Activity" },
  { body: "Who can see this, and what they can do.", id: "access", label: "Access" },
  { body: "Keys, webhooks and the rest of the plumbing.", id: "advanced", label: "Advanced" },
];
</script>

<template>
  <div class="w-full max-w-md">
    <Tabs>
      <TabsListContainer>
        <TabsList aria-label="Project settings">
          <TabsTab v-for="item in items" :id="item.id" :key="item.id">
            {{ item.label }}
            <TabsIndicator />
          </TabsTab>
        </TabsList>
      </TabsListContainer>

      <TabsPanel v-for="item in items" :id="item.id" :key="item.id" class="pt-4">
        {{ item.body }}
      </TabsPanel>
    </Tabs>
  </div>
</template>
