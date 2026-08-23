import type { StoryMeta } from "../../utils/story-meta";
import type { StoryObj } from "@storybook/vue3-vite";

import { shallowRef } from "vue";
import IconPaypal from "~icons/ic/baseline-paypal";
import IconVisa from "~icons/streamline-logos/visa-logo-solid";
import IconMastercard from "~icons/uim/master-card";

import { Button } from "../button";
import { Description } from "../description";
import { FieldError } from "../field-error";
import { Form } from "../form";
import { Label } from "../label";
import { Radio, RadioContent, RadioControl, RadioIndicator } from "../radio";

import { RadioGroup } from "./index";

// Registered part by part: a story template is compiled at runtime, with no binding metadata
// to resolve `Radio.Content` through, so dot notation cannot be used here.
const components = {
  Button,
  Description,
  FieldError,
  Form,
  IconMastercard,
  IconPaypal,
  IconVisa,
  Label,
  Radio,
  RadioContent,
  RadioControl,
  RadioGroup,
  RadioIndicator,
};

const meta: StoryMeta = {
  argTypes: {
    isDisabled: {
      control: { type: "boolean" },
    },
    orientation: {
      control: { type: "select" },
      options: ["vertical", "horizontal"],
    },
    variant: {
      control: { type: "select" },
      options: ["primary", "secondary"],
    },
  },
  component: RadioGroup,
  parameters: {
    layout: "centered",
  },
  title: "Components/Forms/RadioGroup",
};

export default meta;

type Story = StoryObj<typeof meta>;

/** The three plans every story below is built from. */
const plans = `
  <Radio value="basic">
    <RadioContent>
      <RadioControl>
        <RadioIndicator />
      </RadioControl>
      Basic Plan
    </RadioContent>
    <Description>Includes 100 messages per month</Description>
  </Radio>
  <Radio value="premium">
    <RadioContent>
      <RadioControl>
        <RadioIndicator />
      </RadioControl>
      Premium Plan
    </RadioContent>
    <Description>Includes 200 messages per month</Description>
  </Radio>
  <Radio value="business">
    <RadioContent>
      <RadioControl>
        <RadioIndicator />
      </RadioControl>
      Business Plan
    </RadioContent>
    <Description>Unlimited messages</Description>
  </Radio>
`;

const subscriptionPlans = `
  <Radio value="starter">
    <RadioContent>
      <RadioControl>
        <RadioIndicator />
      </RadioControl>
      Starter
    </RadioContent>
    <Description>For side projects and small teams</Description>
  </Radio>
  <Radio value="pro">
    <RadioContent>
      <RadioControl>
        <RadioIndicator />
      </RadioControl>
      Pro
    </RadioContent>
    <Description>Advanced reporting and analytics</Description>
  </Radio>
  <Radio value="teams">
    <RadioContent>
      <RadioControl>
        <RadioIndicator />
      </RadioControl>
      Teams
    </RadioContent>
    <Description>Share access with up to 10 teammates</Description>
  </Radio>
`;

export const Default: Story = {
  render: (args) => ({
    components,
    setup: () => ({ args }),
    template: `
      <div class="px-4">
        <RadioGroup
          default-value="premium"
          name="plan"
          :is-disabled="args.isDisabled"
          :orientation="args.orientation"
          :variant="args.variant"
        >
          <Label>Plan selection</Label>
          <Description>Choose the plan that suits you best</Description>
          ${plans}
        </RadioGroup>
      </div>
    `,
  }),
};

export const Variants: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex flex-col gap-8 px-4">
        <div class="flex flex-col gap-2">
          <p class="text-sm font-medium text-muted">Primary variant</p>
          <RadioGroup default-value="option1" name="primary-plan" variant="primary">
            <Radio value="option1">
              <RadioContent>
                <RadioControl>
                  <RadioIndicator />
                </RadioControl>
                Option 1
              </RadioContent>
              <Description>Standard styling with default background</Description>
            </Radio>
            <Radio value="option2">
              <RadioContent>
                <RadioControl>
                  <RadioIndicator />
                </RadioControl>
                Option 2
              </RadioContent>
              <Description>Another option with primary styling</Description>
            </Radio>
          </RadioGroup>
        </div>
        <div class="flex flex-col gap-2">
          <p class="text-sm font-medium text-muted">Secondary variant</p>
          <RadioGroup default-value="option1" name="secondary-plan" variant="secondary">
            <Radio value="option1">
              <RadioContent>
                <RadioControl>
                  <RadioIndicator />
                </RadioControl>
                Option 1
              </RadioContent>
              <Description>Lower emphasis variant for use in surfaces</Description>
            </Radio>
            <Radio value="option2">
              <RadioContent>
                <RadioControl>
                  <RadioIndicator />
                </RadioControl>
                Option 2
              </RadioContent>
              <Description>Another option with secondary styling</Description>
            </Radio>
          </RadioGroup>
        </div>
      </div>
    `,
  }),
};

export const PerRadioInvalid: Story = {
  render: () => ({
    components,
    template: `
      <div class="px-4">
        <RadioGroup is-invalid is-required default-value="premium" name="plan-invalid">
          <Label>Plan selection</Label>
          <Radio value="basic">
            <RadioContent>
              <RadioControl>
                <RadioIndicator />
              </RadioControl>
              Basic Plan
            </RadioContent>
            <FieldError>This plan is not available for your account</FieldError>
          </Radio>
          <Radio value="premium">
            <RadioContent>
              <RadioControl>
                <RadioIndicator />
              </RadioControl>
              Premium Plan
            </RadioContent>
            <Description>Includes 200 messages per month</Description>
          </Radio>
        </RadioGroup>
      </div>
    `,
  }),
};

export const WithCustomIndicator: Story = {
  render: () => ({
    components,
    template: `
      <div class="px-4">
        <RadioGroup default-value="premium" name="plan-custom-indicator">
          <Label>Plan selection</Label>
          <Description>Choose the plan that suits you best</Description>
          <Radio v-for="plan in ['basic', 'premium', 'business']" :key="plan" :value="plan">
            <RadioContent>
              <RadioControl>
                <RadioIndicator>
                  <template #default="{isSelected}">
                    <span v-if="isSelected" class="text-xs leading-none text-background">✓</span>
                  </template>
                </RadioIndicator>
              </RadioControl>
              {{ plan }}
            </RadioContent>
          </Radio>
        </RadioGroup>
      </div>
    `,
  }),
};

export const Orientation: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex flex-col gap-4 px-4">
        <Label>Subscription plan</Label>
        <RadioGroup default-value="pro" name="plan-orientation" orientation="horizontal">
          ${subscriptionPlans}
        </RadioGroup>
      </div>
    `,
  }),
};

export const Validation: Story = {
  render: () => ({
    components,
    setup: () => {
      // Printed on screen rather than announced with `alert`, which blocks the whole tab and
      // so cannot be read back when the story is verified from a script.
      const submitted = shallowRef<string | null>(null);

      return {
        onSubmit: (event: Event) => {
          event.preventDefault();

          const data = new FormData(event.currentTarget as HTMLFormElement);

          submitted.value = String(data.get("plan-validation"));
        },
        submitted,
      };
    },
    template: `
      <Form class="flex flex-col gap-4 px-4" @submit="onSubmit">
        <RadioGroup is-required name="plan-validation">
          <Label>Subscription plan</Label>
          ${subscriptionPlans}
          <FieldError>Choose a subscription before continuing.</FieldError>
        </RadioGroup>
        <Button type="submit">Submit</Button>
        <p v-if="submitted !== null" class="text-sm text-muted" data-testid="submitted">
          Your chosen plan is: {{ submitted }}
        </p>
      </Form>
    `,
  }),
};

export const Controlled: Story = {
  render: () => ({
    components,
    setup: () => {
      const value = shallowRef("pro");

      return { value };
    },
    template: `
      <div class="flex flex-col gap-3 px-4">
        <RadioGroup name="plan-controlled" v-model:value="value">
          <Label>Subscription plan</Label>
          ${subscriptionPlans}
        </RadioGroup>
        <p class="mt-2 text-sm text-muted">
          Selected plan: <span class="font-medium">{{ value }}</span>
        </p>
      </div>
    `,
  }),
};

export const Uncontrolled: Story = {
  render: () => ({
    components,
    setup: () => {
      const selection = shallowRef("pro");

      return {
        onChange: (next: string | null) => {
          selection.value = next ?? "";
        },
        selection,
      };
    },
    template: `
      <div class="flex flex-col gap-3 px-4">
        <RadioGroup default-value="pro" name="plan-uncontrolled" @change="onChange">
          <Label>Subscription plan</Label>
          ${subscriptionPlans}
        </RadioGroup>
        <p class="mt-2 text-sm text-muted">
          Last chosen plan: <span class="font-medium">{{ selection }}</span>
        </p>
      </div>
    `,
  }),
};

export const Disabled: Story = {
  render: () => ({
    components,
    template: `
      <div class="px-4">
        <RadioGroup is-disabled default-value="pro" name="plan-disabled">
          <Label>Subscription plan</Label>
          <Description>Plan changes are temporarily paused while we roll out updates.</Description>
          ${subscriptionPlans}
        </RadioGroup>
      </div>
    `,
  }),
};

export const DeliveryAndPaymentExample: Story = {
  render: () => ({
    components,
    setup: () => ({
      deliveryOptions: [
        { description: "4-10 business days", price: "$5.00", title: "Standard", value: "standard" },
        { description: "2-5 business days", price: "$16.00", title: "Express", value: "express" },
        {
          description: "1 business day",
          price: "$25.00",
          title: "Super Fast",
          value: "super-fast",
        },
      ],
      // One brand logo each, from the same three Iconify collections React names.
      paymentOptions: [
        {
          description: "Exp. on 01/2026",
          icon: "IconMastercard",
          title: "**** 8304",
          value: "mastercard",
        },
        { description: "Exp. on 01/2026", icon: "IconVisa", title: "**** 0123", value: "visa" },
        { description: "Pay with PayPal", icon: "IconPaypal", title: "PayPal", value: "paypal" },
      ],
    }),
    template: `
      <div class="flex w-full flex-col items-center gap-10 px-4 py-8">
        <section class="flex w-full max-w-lg flex-col gap-4">
          <RadioGroup default-value="express" name="delivery">
            <Label>Delivery method</Label>
            <div class="grid gap-x-4 md:grid-cols-3">
              <Radio v-for="option in deliveryOptions" :key="option.value" :value="option.value">
                <RadioContent
                  class="group relative flex w-full flex-col gap-6 rounded-xl bg-surface-tertiary px-5 py-4 transition-all data-[selected=true]:border-accent data-[selected=true]:bg-accent/10 data-[focus-visible=true]:bg-accent/10"
                >
                  <RadioControl class="absolute end-4 top-3 size-5">
                    <RadioIndicator />
                  </RadioControl>
                  <div class="flex flex-col gap-1">
                    <span>{{ option.title }}</span>
                    <Description>{{ option.description }}</Description>
                  </div>
                  <span class="text-sm font-semibold">{{ option.price }}</span>
                </RadioContent>
              </Radio>
            </div>
          </RadioGroup>
        </section>
        <section class="flex w-full max-w-lg flex-col gap-4">
          <RadioGroup default-value="visa" name="payment">
            <div class="flex flex-wrap items-center justify-between gap-4">
              <Label>Payment method</Label>
            </div>
            <div class="grid gap-x-4 md:grid-cols-2">
              <Radio v-for="option in paymentOptions" :key="option.value" :value="option.value">
                <RadioContent
                  class="group relative flex w-full flex-row items-start justify-start gap-4 rounded-xl bg-surface-tertiary px-5 py-4 transition-all data-[selected=true]:bg-accent/10"
                >
                  <RadioControl class="absolute end-4 top-3 size-5">
                    <RadioIndicator />
                  </RadioControl>
                  <component :is="option.icon" class="size-6 text-accent" />
                  <div class="flex flex-col gap-1">
                    <span>{{ option.title }}</span>
                    <Description>{{ option.description }}</Description>
                  </div>
                </RadioContent>
              </Radio>
            </div>
          </RadioGroup>
        </section>
      </div>
    `,
  }),
};
