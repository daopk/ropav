<script setup lang="ts">
import { I18nProvider } from "ropav";
import { ref, useTemplateRef, watch } from "vue";

import { specs } from "../../generated/control-specs";

import { renderCode } from "./code";
import ControlPanel from "./control-panel.vue";
import PreviewNode from "./preview-node.vue";
import { defaultState } from "./state";

const props = defineProps<{ component: string }>();

const spec = specs[props.component];

if (!spec) throw new Error(`No playground spec for "${props.component}"`);

const state = ref(defaultState(spec));
const codeEl = useTemplateRef<HTMLElement>("code");

// A later change can resolve before an earlier one, so only the newest paint may land.
let latest = 0;

const paint = async (code: string): Promise<void> => {
  const seq = ++latest;
  const { highlight } = await import("./highlight");
  const html = await highlight(code);

  if (seq !== latest) return;

  const pre = codeEl.value?.querySelector("pre");

  // Only the `pre` is replaced. The copy button beside it is found by its sibling position,
  // and the theme binds it once on the window rather than per block, so it keeps working.
  if (pre) pre.outerHTML = html;
};

/*
 * No `immediate`: at the default state the block the server rendered is already correct, and
 * nothing is fetched until a control moves. The fence was written by this same `renderCode`,
 * so the first repaint cannot disagree with what it replaces.
 */
watch(
  () => renderCode(spec, state.value),
  (code) => void paint(code),
);
</script>

<template>
  <div class="playground">
    <!-- The locale is pinned because a formatter would otherwise read the server's default on
         one side and the browser's on the other, and hydrate one number over another. -->
    <I18nProvider locale="en-US">
      <div class="ropav-demo playground__stage">
        <div class="playground__preview">
          <PreviewNode :node="spec.node" :state="state" />
        </div>
        <ControlPanel :controls="spec.controls" :state="state" />
      </div>
    </I18nProvider>

    <div ref="code" class="playground__code">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.playground {
  margin: 24px 0;
  overflow: hidden;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
}

.playground__stage {
  display: grid;
  grid-template-columns: 1fr;
  color: var(--foreground);
  background-color: var(--background);
}

@media (min-width: 48rem) {
  .playground__stage {
    grid-template-columns: 1fr 240px;
  }
}

.playground__preview {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  justify-content: center;
  min-height: 180px;
  padding: 32px 24px;
}

.playground__stage :deep(.panel) {
  padding: 20px;
  border-top: 1px solid var(--vp-c-divider);
}

@media (min-width: 48rem) {
  .playground__stage :deep(.panel) {
    border-top: 0;
    border-left: 1px solid var(--vp-c-divider);
  }
}

.playground__code {
  border-top: 1px solid var(--vp-c-divider);
}

.playground__code :deep(div[class*="language-"]) {
  margin: 0;
  border-radius: 0;
}
</style>
