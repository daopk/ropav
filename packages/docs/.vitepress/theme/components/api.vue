<script setup lang="ts">
import type { ApiPart } from "../../types";

import { computed } from "vue";

import { api } from "../../generated/api";

const props = defineProps<{ family: string }>();

const parts = computed<readonly ApiPart[]>(() => {
  const found = api[props.family];

  if (!found) throw new Error(`No API entry for "${props.family}". Did \`pnpm generate\` run?`);

  return found;
});

const escape = (text: string) =>
  text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

/**
 * The descriptions are TSDoc, so they wrap where the source did and spell types and attributes
 * in backticks. Only the code spans are rendered — a description is one sentence of prose, and
 * anything more would be a second markdown pipeline beside the one the page already has.
 */
const prose = (text: string) =>
  escape(text.replaceAll(/\s*\n\s*/g, " ")).replaceAll(/`([^`]+)`/g, "<code>$1</code>");
</script>

<template>
  <div class="api">
    <template v-for="part in parts" :key="part.name">
      <h3 v-if="parts.length > 1" :id="part.name.toLowerCase()">
        {{ part.name }}
        <a aria-hidden="true" class="header-anchor" :href="`#${part.name.toLowerCase()}`" />
      </h3>

      <p v-if="part.props.length === 0 && part.slots.length === 0" class="api__empty">
        <code>{{ part.name }}</code> takes no props of its own.
      </p>

      <table v-if="part.props.length > 0">
        <thead>
          <tr>
            <th>Prop</th>
            <th>Type</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="prop in part.props" :key="prop.name">
            <td>
              <code>{{ prop.name }}</code>
              <abbr v-if="prop.required" title="Required">*</abbr>
            </td>
            <td>
              <code>{{ prop.type }}</code>
            </td>
            <td>
              <code v-if="prop.default">{{ prop.default }}</code>
              <span v-else>—</span>
            </td>
            <!-- eslint-disable-next-line vue/no-v-html -- generated from the library's own TSDoc -->
            <td v-html="prose(prop.description)" />
          </tr>
        </tbody>
      </table>

      <template v-for="slot in part.slots" :key="slot.name">
        <p v-if="slot.props.length > 0" class="api__caption">
          The <code>{{ slot.name }}</code> slot receives:
        </p>

        <table v-if="slot.props.length > 0">
          <thead>
            <tr>
              <th>Slot prop</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="slotProp in slot.props" :key="slotProp.name">
              <td>
                <code>{{ slotProp.name }}</code>
              </td>
              <td>
                <code>{{ slotProp.type }}</code>
              </td>
            </tr>
          </tbody>
        </table>
      </template>

      <table v-if="part.events.length > 0">
        <thead>
          <tr>
            <th>Event</th>
            <th>Payload</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="event in part.events" :key="event.name">
            <td>
              <code>{{ event.name }}</code>
            </td>
            <td>
              <code>{{ event.payload }}</code>
            </td>
          </tr>
        </tbody>
      </table>
    </template>
  </div>
</template>

<style scoped>
.api__caption,
.api__empty {
  color: var(--vp-c-text-2);
}

.api abbr {
  color: var(--vp-c-danger-1, var(--vp-c-red-1));
  text-decoration: none;
  cursor: help;
}
</style>
