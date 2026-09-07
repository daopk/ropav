<script setup lang="ts">
import { Link, RouterProvider } from "ropav";
import { shallowRef } from "vue";

// Stands in for the application's router. In a vue-router app `navigate` is
// `(href, options) => router.push({path: href, ...options})`.
const path = shallowRef("/inbox");

const isCurrent = (href: string) => href === path.value;

const navigate = (href: string) => {
  path.value = href;
};
</script>

<template>
  <RouterProvider :is-current="isCurrent" :navigate="navigate">
    <div class="stack">
      <nav class="nav">
        <Link
          v-for="href in ['/inbox', '/drafts', '/sent']"
          :key="href"
          aria-current="auto"
          class="tab"
          :href="href"
        >
          {{ href.slice(1) }}
        </Link>
      </nav>

      <p class="note">
        Route: <code>{{ path }}</code> — no reload, and no router in the library.
      </p>
    </div>
  </RouterProvider>
</template>

<style scoped>
.stack {
  display: flex;
  flex-direction: column;
  gap: calc(var(--rp-spacing) * 3);
}

.nav {
  display: flex;
  align-items: center;
  gap: calc(var(--rp-spacing) * 4);
}

.nav .tab {
  text-decoration-line: none;
  &[data-current="true"] {
    font-weight: var(--rp-font-weight-semibold);
  }
  &[data-current="true"] {
    text-decoration-line: underline;
  }
}

.stack .note {
  color: var(--rp-muted);
  font-size: var(--rp-text-sm);
  line-height: var(--rp-text-sm--line-height);
}
</style>
