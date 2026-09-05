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
    <div class="flex flex-col gap-3">
      <nav class="flex items-center gap-4">
        <Link
          v-for="href in ['/inbox', '/drafts', '/sent']"
          :key="href"
          aria-current="auto"
          class="no-underline data-[current=true]:font-semibold data-[current=true]:underline"
          :href="href"
        >
          {{ href.slice(1) }}
        </Link>
      </nav>

      <p class="text-sm text-muted">
        Route: <code>{{ path }}</code> — no reload, and no router in the library.
      </p>
    </div>
  </RouterProvider>
</template>
