<script setup lang="ts">
import DefaultTheme from "vitepress/theme";

import PaletteSwitcher from "./palette-switcher.vue";

const { Layout } = DefaultTheme;
</script>

<template>
  <Layout>
    <template #nav-bar-content-after><PaletteSwitcher /></template>
    <template #nav-screen-content-after><PaletteSwitcher row screen /></template>
  </Layout>
</template>

<style>
/*
 * The slot is the last place the bar offers, past the social links — but a palette is a
 * display preference and belongs beside the appearance switch. Moving the links after it
 * also restores what their negative right margin assumes: it pulls them flush to the edge,
 * so whatever follows them gets pulled into them instead.
 *
 * The picker keeps the default order and, being last in the markup among what is left, lands
 * directly after the appearance switch.
 */
.VPNavBar .content-body > :where(.social-links, .extra) {
  order: 1;
}

.VPNavBar .content-body > .hamburger {
  order: 2;
}

/*
 * The divider the theme draws between its own clusters. Repeated rather than extended: the
 * theme's rule names each cluster by class, and that list cannot be widened from outside.
 * The asymmetric margins are the theme's own, for the gap either side of the appearance switch.
 */
.VPNavBar .content-body > .VPPalette::before {
  width: 1px;
  height: 1.5rem;
  margin-right: 0.5rem;
  margin-left: 1rem;
  content: "";
  background-color: var(--vp-c-divider);
}
</style>
