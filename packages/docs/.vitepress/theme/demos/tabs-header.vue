<script setup lang="ts">
import { Tabs, TabsIndicator, TabsList, TabsListContainer, TabsPanel, TabsTab } from "ropav";

const items = [
  { body: "What the change does, and why.", id: "description", label: "Description" },
  { body: "Three people have weighed in.", id: "comments", label: "Comments" },
  { body: "Every revision since it was opened.", id: "history", label: "History" },
];
</script>

<template>
  <div class="panel">
    <Tabs :full-width="false" variant="secondary">
      <TabsListContainer>
        <TabsList aria-label="Pull request">
          <TabsTab v-for="item in items" :id="item.id" :key="item.id">
            {{ item.label }}
            <TabsIndicator />
          </TabsTab>
        </TabsList>
      </TabsListContainer>

      <TabsPanel v-for="item in items" :id="item.id" :key="item.id" class="tab-panel">
        {{ item.body }}
      </TabsPanel>
    </Tabs>
  </div>
</template>

<style scoped>
.panel {
  width: 100%;
  max-width: var(--rp-container-md);
}

.tab-panel {
  padding-top: calc(var(--rp-spacing) * 4);
}
</style>
