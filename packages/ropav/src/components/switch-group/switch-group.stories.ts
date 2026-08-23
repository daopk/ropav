import type { StoryMeta } from "../../utils/story-meta";
import type { StoryObj } from "@storybook/vue3";

import { shallowRef } from "vue";

import { Button } from "../button";
import { Switch, SwitchContent, SwitchControl, SwitchThumb } from "../switch";

import { SwitchGroup } from "./index";

// Registered part by part: a story template is compiled at runtime, with no binding metadata
// to resolve `Switch.Content` through, so dot notation cannot be used here.
const components = { Button, Switch, SwitchContent, SwitchControl, SwitchGroup, SwitchThumb };

const meta: StoryMeta = {
  argTypes: {
    orientation: {
      control: { type: "select" },
      options: ["vertical", "horizontal"],
    },
  },
  component: SwitchGroup,
  parameters: {
    layout: "centered",
  },
  title: "Components/Controls/SwitchGroup",
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components,
    setup: () => ({ args }),
    template: `
      <SwitchGroup :orientation="args.orientation">
        <Switch name="notifications">
          <SwitchContent>
            <SwitchControl>
              <SwitchThumb />
            </SwitchControl>
            Allow Notifications
          </SwitchContent>
        </Switch>
        <Switch name="marketing">
          <SwitchContent>
            <SwitchControl>
              <SwitchThumb />
            </SwitchControl>
            Marketing emails
          </SwitchContent>
        </Switch>
        <Switch name="social">
          <SwitchContent>
            <SwitchControl>
              <SwitchThumb />
            </SwitchControl>
            Social media updates
          </SwitchContent>
        </Switch>
      </SwitchGroup>
    `,
  }),
};

export const Horizontal: Story = {
  render: () => ({
    components,
    template: `
      <SwitchGroup class="overflow-x-auto" orientation="horizontal">
        <Switch name="notifications">
          <SwitchContent>
            <SwitchControl>
              <SwitchThumb />
            </SwitchControl>
            Notifications
          </SwitchContent>
        </Switch>
        <Switch name="marketing">
          <SwitchContent>
            <SwitchControl>
              <SwitchThumb />
            </SwitchControl>
            Marketing
          </SwitchContent>
        </Switch>
        <Switch name="social">
          <SwitchContent>
            <SwitchControl>
              <SwitchThumb />
            </SwitchControl>
            Social
          </SwitchContent>
        </Switch>
      </SwitchGroup>
    `,
  }),
};

export const Form: Story = {
  render: () => ({
    components,
    setup: () => {
      const submitted = shallowRef<string[]>([]);

      const onSubmit = (event: Event) => {
        event.preventDefault();

        const data = new FormData(event.target as HTMLFormElement);

        submitted.value = Array.from(data.entries()).map(([key, value]) => `${key}: ${value}`);
      };

      return { onSubmit, submitted };
    },
    template: `
      <form class="flex flex-col gap-4" @submit="onSubmit">
        <SwitchGroup>
          <Switch name="notifications" value="on">
            <SwitchContent>
              <SwitchControl>
                <SwitchThumb />
              </SwitchControl>
              Enable notifications
            </SwitchContent>
          </Switch>
          <Switch default-selected name="newsletter" value="on">
            <SwitchContent>
              <SwitchControl>
                <SwitchThumb />
              </SwitchControl>
              Subscribe to newsletter
            </SwitchContent>
          </Switch>
          <Switch name="marketing" value="on">
            <SwitchContent>
              <SwitchControl>
                <SwitchThumb />
              </SwitchControl>
              Receive marketing updates
            </SwitchContent>
          </Switch>
        </SwitchGroup>
        <Button class="mt-4" size="sm" type="submit" variant="primary">Submit</Button>
        <p v-if="submitted.length" class="text-sm text-muted">
          Submitted with: {{ submitted.join(", ") }}
        </p>
      </form>
    `,
  }),
};
