import type { StoryMeta } from "../../utils/story-meta";
import type { StoryObj } from "@storybook/vue3-vite";

import { shallowRef } from "vue";

import { DropZone, DropZoneRoot, DropZoneTrigger } from "./index";

// Registered part by part: a runtime-compiled template cannot resolve `DropZone.Trigger`.
const components = { DropZone, DropZoneRoot, DropZoneTrigger };

/** Holds what the last drop or pick handed over, so a story can show it. */
const useTaken = () => {
  const taken = shallowRef<string[]>([]);

  return {
    onSelect: (files: File[]) => {
      taken.value = files.map((file) => file.name);
    },
    taken,
  };
};

const meta: StoryMeta = {
  component: DropZone,
  parameters: {
    layout: "centered",
  },
  title: "Components/Forms/DropZone",
};

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * One zone with the caller's own wording.
 *
 * Parameterised rather than shared verbatim, because the component ships no copy of its own:
 * whether a zone says "a file" or "files" follows the `multiple` it was given, and that is the
 * caller's to keep in step. A story that demonstrated `multiple` while still reading "a file"
 * would be modelling the mistake.
 */
const zoneStory =
  (prompt: string): Story["render"] =>
  (args) => ({
    components,
    setup: () => ({ args, prompt, ...useTaken() }),
    template: `
      <div class="w-[420px] space-y-3">
        <DropZone v-bind="args" @select="onSelect">
          <p>{{ prompt }}, or <DropZoneTrigger>browse</DropZoneTrigger></p>
        </DropZone>
        <p v-if="taken.length" class="text-sm text-muted">Took: {{ taken.join(", ") }}</p>
      </div>
    `,
  });

export const Default: Story = {
  args: {
    ariaLabel: "Upload a file",
  },
  render: zoneStory("Drop a file here"),
};

export const Multiple: Story = {
  args: {
    ariaLabel: "Upload files",
    multiple: true,
  },
  render: zoneStory("Drop files here"),
};

/**
 * `accept` filters the picker and judges the drag. Dragging a file whose type it rules out turns
 * the zone red before the pointer is released — but only where the refusal is certain: a folder,
 * or a file the platform gives no mime type, stays undecided until the drop.
 *
 * The refusal is worded without a count on purpose. A drag advertises types and nothing else, so
 * while one is still moving there is no way to say whether it carries one wrong file or several.
 */
export const Accept: Story = {
  args: {
    accept: "image/*",
    ariaLabel: "Upload images",
    multiple: true,
  },
  render: (args) => ({
    components,
    setup: () => ({ args, ...useTaken() }),
    template: `
      <div class="w-[420px] space-y-3">
        <DropZone v-bind="args" @select="onSelect">
          <template #default="{ status }">
            <p v-if="status === 'reject'">Only images can be dropped here</p>
            <p v-else>Drop images here, or <DropZoneTrigger>browse</DropZoneTrigger></p>
          </template>
        </DropZone>
        <p v-if="taken.length" class="text-sm text-muted">Took: {{ taken.join(", ") }}</p>
      </div>
    `,
  }),
};

export const Disabled: Story = {
  args: {
    ariaLabel: "Upload a file",
    isDisabled: true,
  },
  render: zoneStory("Drop a file here"),
};
