import type {StoryMeta} from "../../utils/story-meta";
import type {StoryObj} from "@storybook/vue3";

import {computed, shallowRef} from "vue";

import {Button} from "../button";
import {Description} from "../description";
import {FieldError} from "../field-error";
import {Form} from "../form";
import {Label} from "../label";
import {Spinner} from "../spinner";

import {
  NumberField,
  NumberFieldDecrementButton,
  NumberFieldGroup,
  NumberFieldIncrementButton,
  NumberFieldInput,
  NumberFieldRoot,
} from "./index";

// Registered part by part: a story template is compiled at runtime, with no binding metadata to
// resolve `NumberField.Group` through, so dot notation cannot be used here.
const components = {
  Button,
  Description,
  FieldError,
  Form,
  Label,
  NumberFieldDecrementButton,
  NumberFieldGroup,
  NumberFieldIncrementButton,
  NumberFieldInput,
  NumberFieldRoot,
  Spinner,
};

const meta: StoryMeta = {
  component: NumberField,
  parameters: {
    layout: "centered",
  },
  title: "Components/Forms/NumberField",
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components,
    template: `
      <NumberFieldRoot :default-value="1024" :min-value="0" name="width">
        <Label>Width</Label>
        <NumberFieldGroup>
          <NumberFieldDecrementButton />
          <NumberFieldInput class="w-[120px]" />
          <NumberFieldIncrementButton />
        </NumberFieldGroup>
      </NumberFieldRoot>
    `,
  }),
};

export const Variants: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex flex-col gap-4">
        <NumberFieldRoot :default-value="100" :min-value="0" name="primary-width" variant="primary">
          <Label>Primary variant</Label>
          <NumberFieldGroup>
            <NumberFieldDecrementButton />
            <NumberFieldInput class="w-[120px]" />
            <NumberFieldIncrementButton />
          </NumberFieldGroup>
        </NumberFieldRoot>
        <NumberFieldRoot :default-value="100" :min-value="0" name="secondary-width" variant="secondary">
          <Label>Secondary variant</Label>
          <NumberFieldGroup>
            <NumberFieldDecrementButton />
            <NumberFieldInput class="w-[120px]" />
            <NumberFieldIncrementButton />
          </NumberFieldGroup>
        </NumberFieldRoot>
      </div>
    `,
  }),
};

export const FullWidth: Story = {
  render: () => ({
    components,
    template: `
      <div class="w-[400px] space-y-4">
        <NumberFieldRoot full-width :default-value="1024" :min-value="0" name="width">
          <Label>Width</Label>
          <NumberFieldGroup>
            <NumberFieldDecrementButton />
            <NumberFieldInput />
            <NumberFieldIncrementButton />
          </NumberFieldGroup>
        </NumberFieldRoot>
      </div>
    `,
  }),
};

export const WithDescription: Story = {
  render: () => ({
    components,
    setup: () => ({percent: {style: "percent"} as Intl.NumberFormatOptions}),
    template: `
      <div class="flex flex-col gap-4">
        <NumberFieldRoot :default-value="1024" :min-value="0" name="width">
          <Label>Width</Label>
          <NumberFieldGroup>
            <NumberFieldDecrementButton />
            <NumberFieldInput class="w-[120px]" />
            <NumberFieldIncrementButton />
          </NumberFieldGroup>
          <Description>Enter the width in pixels</Description>
        </NumberFieldRoot>
        <NumberFieldRoot
          :default-value="0.5"
          :format-options="percent"
          :max-value="1"
          :min-value="0"
          name="percentage"
          :step="0.1"
        >
          <Label>Percentage</Label>
          <NumberFieldGroup>
            <NumberFieldDecrementButton />
            <NumberFieldInput class="w-[120px]" />
            <NumberFieldIncrementButton />
          </NumberFieldGroup>
          <Description>Value must be between 0 and 100</Description>
        </NumberFieldRoot>
      </div>
    `,
  }),
};

export const Required: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex flex-col gap-4">
        <NumberFieldRoot is-required :min-value="0" name="quantity">
          <Label>Quantity</Label>
          <NumberFieldGroup>
            <NumberFieldDecrementButton />
            <NumberFieldInput class="w-[120px]" />
            <NumberFieldIncrementButton />
          </NumberFieldGroup>
        </NumberFieldRoot>
        <NumberFieldRoot is-required :default-value="1" :max-value="10" :min-value="1" name="rating">
          <Label>Rating</Label>
          <NumberFieldGroup>
            <NumberFieldDecrementButton />
            <NumberFieldInput class="w-[120px]" />
            <NumberFieldIncrementButton />
          </NumberFieldGroup>
          <Description>Rate from 1 to 10</Description>
        </NumberFieldRoot>
      </div>
    `,
  }),
};

export const Invalid: Story = {
  render: () => ({
    components,
    setup: () => ({percent: {style: "percent"} as Intl.NumberFormatOptions}),
    template: `
      <div class="flex flex-col gap-4">
        <NumberFieldRoot is-invalid is-required :min-value="0" name="quantity" :value="-5">
          <Label>Quantity</Label>
          <NumberFieldGroup>
            <NumberFieldDecrementButton />
            <NumberFieldInput class="w-[120px]" />
            <NumberFieldIncrementButton />
          </NumberFieldGroup>
          <FieldError>Quantity must be greater than or equal to 0</FieldError>
        </NumberFieldRoot>
        <NumberFieldRoot
          is-invalid
          :format-options="percent"
          :max-value="1"
          :min-value="0"
          name="percentage"
          :step="0.1"
          :value="1.5"
        >
          <Label>Percentage</Label>
          <NumberFieldGroup>
            <NumberFieldDecrementButton />
            <NumberFieldInput class="w-[120px]" />
            <NumberFieldIncrementButton />
          </NumberFieldGroup>
          <FieldError>Percentage must be between 0 and 100</FieldError>
        </NumberFieldRoot>
      </div>
    `,
  }),
};

export const Disabled: Story = {
  render: () => ({
    components,
    setup: () => ({percent: {style: "percent"} as Intl.NumberFormatOptions}),
    template: `
      <div class="flex flex-col gap-4">
        <NumberFieldRoot is-disabled :default-value="1024" :min-value="0" name="width">
          <Label>Width</Label>
          <NumberFieldGroup>
            <NumberFieldDecrementButton />
            <NumberFieldInput class="w-[120px]" />
            <NumberFieldIncrementButton />
          </NumberFieldGroup>
          <Description>Enter the width in pixels</Description>
        </NumberFieldRoot>
        <NumberFieldRoot
          is-disabled
          :default-value="0.5"
          :format-options="percent"
          :max-value="1"
          :min-value="0"
          name="percentage"
          :step="0.1"
        >
          <Label>Percentage</Label>
          <NumberFieldGroup>
            <NumberFieldDecrementButton />
            <NumberFieldInput class="w-[120px]" />
            <NumberFieldIncrementButton />
          </NumberFieldGroup>
          <Description>Value must be between 0 and 100</Description>
        </NumberFieldRoot>
      </div>
    `,
  }),
};

export const Controlled: Story = {
  render: () => ({
    components,
    setup: () => {
      const value = shallowRef(1024);

      return {value};
    },
    template: `
      <div class="flex flex-col gap-4">
        <NumberFieldRoot v-model:value="value" :min-value="0" name="width">
          <Label>Width</Label>
          <NumberFieldGroup>
            <NumberFieldDecrementButton />
            <NumberFieldInput class="w-[120px]" />
            <NumberFieldIncrementButton />
          </NumberFieldGroup>
          <Description>Current value: {{ value }}</Description>
        </NumberFieldRoot>
        <div class="flex gap-2">
          <Button variant="tertiary" @click="value = 0">Reset to 0</Button>
          <Button variant="tertiary" @click="value = 2048">Set to 2048</Button>
        </div>
      </div>
    `,
  }),
};

export const WithValidation: Story = {
  render: () => ({
    components,
    setup: () => {
      const value = shallowRef<number | undefined>(undefined);
      const isInvalid = computed(
        () => value.value !== undefined && (value.value < 0 || value.value > 100),
      );

      return {isInvalid, percent: {style: "percent"} as Intl.NumberFormatOptions, value};
    },
    template: `
      <div class="flex flex-col gap-4">
        <NumberFieldRoot
          v-model:value="value"
          is-required
          :format-options="percent"
          :is-invalid="isInvalid"
          :max-value="1"
          :min-value="0"
          name="percentage"
          :step="0.1"
        >
          <Label>Percentage</Label>
          <NumberFieldGroup>
            <NumberFieldDecrementButton />
            <NumberFieldInput class="w-[120px]" />
            <NumberFieldIncrementButton />
          </NumberFieldGroup>
          <FieldError v-if="isInvalid">Percentage must be between 0 and 100</FieldError>
          <Description v-else>Enter a value between 0 and 100</Description>
        </NumberFieldRoot>
      </div>
    `,
  }),
};

export const WithStep: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex flex-col gap-4">
        <NumberFieldRoot :default-value="0" :max-value="100" :min-value="0" name="step1" :step="1">
          <Label>Step: 1</Label>
          <NumberFieldGroup>
            <NumberFieldDecrementButton />
            <NumberFieldInput class="w-[120px]" />
            <NumberFieldIncrementButton />
          </NumberFieldGroup>
          <Description>Increments by 1</Description>
        </NumberFieldRoot>
        <NumberFieldRoot :default-value="0" :max-value="100" :min-value="0" name="step5" :step="5">
          <Label>Step: 5</Label>
          <NumberFieldGroup>
            <NumberFieldDecrementButton />
            <NumberFieldInput class="w-[120px]" />
            <NumberFieldIncrementButton />
          </NumberFieldGroup>
          <Description>Increments by 5</Description>
        </NumberFieldRoot>
        <NumberFieldRoot :default-value="0" :max-value="100" :min-value="0" name="step10" :step="10">
          <Label>Step: 10</Label>
          <NumberFieldGroup>
            <NumberFieldDecrementButton />
            <NumberFieldInput class="w-[120px]" />
            <NumberFieldIncrementButton />
          </NumberFieldGroup>
          <Description>Increments by 10</Description>
        </NumberFieldRoot>
      </div>
    `,
  }),
};

export const WithFormatOptions: Story = {
  render: () => ({
    components,
    setup: () => ({
      decimal: {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
        style: "decimal",
      } as Intl.NumberFormatOptions,
      eur: {
        currency: "EUR",
        currencySign: "accounting",
        style: "currency",
      } as Intl.NumberFormatOptions,
      percent: {style: "percent"} as Intl.NumberFormatOptions,
      unit: {style: "unit", unit: "kilogram", unitDisplay: "short"} as Intl.NumberFormatOptions,
      usd: {currency: "USD", style: "currency"} as Intl.NumberFormatOptions,
    }),
    template: `
      <div class="flex flex-col gap-4">
        <NumberFieldRoot :default-value="99" :format-options="eur" :min-value="0" name="currency-eur">
          <Label>Currency (EUR - Accounting)</Label>
          <NumberFieldGroup>
            <NumberFieldDecrementButton />
            <NumberFieldInput class="w-[120px]" />
            <NumberFieldIncrementButton />
          </NumberFieldGroup>
          <Description>Accounting format with EUR currency</Description>
        </NumberFieldRoot>
        <NumberFieldRoot :default-value="99.99" :format-options="usd" :min-value="0" name="currency-usd">
          <Label>Currency (USD)</Label>
          <NumberFieldGroup>
            <NumberFieldDecrementButton />
            <NumberFieldInput class="w-[120px]" />
            <NumberFieldIncrementButton />
          </NumberFieldGroup>
          <Description>Standard USD currency format</Description>
        </NumberFieldRoot>
        <NumberFieldRoot
          :default-value="0.5"
          :format-options="percent"
          :max-value="1"
          :min-value="0"
          name="percentage"
          :step="0.01"
        >
          <Label>Percentage</Label>
          <NumberFieldGroup>
            <NumberFieldDecrementButton />
            <NumberFieldInput class="w-[120px]" />
            <NumberFieldIncrementButton />
          </NumberFieldGroup>
          <Description>Percentage format (0-1, where 0.5 = 50%)</Description>
        </NumberFieldRoot>
        <NumberFieldRoot :default-value="1234.56" :format-options="decimal" :min-value="0" name="decimal">
          <Label>Decimal (2 decimal places)</Label>
          <NumberFieldGroup>
            <NumberFieldDecrementButton />
            <NumberFieldInput class="w-[120px]" />
            <NumberFieldIncrementButton />
          </NumberFieldGroup>
          <Description>Decimal format with 2 decimal places</Description>
        </NumberFieldRoot>
        <NumberFieldRoot :default-value="1000" :format-options="unit" :min-value="0" name="unit">
          <Label>Unit (Kilograms)</Label>
          <NumberFieldGroup>
            <NumberFieldDecrementButton />
            <NumberFieldInput class="w-[120px]" />
            <NumberFieldIncrementButton />
          </NumberFieldGroup>
          <Description>Unit format with kilograms</Description>
        </NumberFieldRoot>
      </div>
    `,
  }),
};

export const CustomIcons: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex flex-col gap-4">
        <NumberFieldRoot :default-value="1024" :min-value="0" name="width">
          <Label>Width (Custom Icons)</Label>
          <NumberFieldGroup>
            <NumberFieldDecrementButton>
              <svg height="16" viewBox="0 0 16 16" width="16" xmlns="http://www.w3.org/2000/svg">
                <path
                  clip-rule="evenodd"
                  d="M6.75 11a4.25 4.25 0 1 0 0-8.5a4.25 4.25 0 0 0 0 8.5m0 1.5a5.73 5.73 0 0 0 3.501-1.188l2.719 2.718a.75.75 0 1 0 1.06-1.06l-2.718-2.719A5.75 5.75 0 1 0 6.75 12.5m-2-6.5a.75.75 0 0 0 0 1.5h4a.75.75 0 0 0 0-1.5z"
                  fill="currentColor"
                  fill-rule="evenodd"
                />
              </svg>
            </NumberFieldDecrementButton>
            <NumberFieldInput class="w-[120px]" />
            <NumberFieldIncrementButton>
              <svg height="16" viewBox="0 0 16 16" width="16" xmlns="http://www.w3.org/2000/svg">
                <path
                  clip-rule="evenodd"
                  d="M6.75 11a4.25 4.25 0 1 0 0-8.5a4.25 4.25 0 0 0 0 8.5m0 1.5a5.73 5.73 0 0 0 3.501-1.188l2.719 2.718a.75.75 0 1 0 1.06-1.06l-2.718-2.719A5.75 5.75 0 1 0 6.75 12.5m.75-7.75a.75.75 0 0 0-1.5 0V6H4.75a.75.75 0 0 0 0 1.5H6v1.25a.75.75 0 0 0 1.5 0V7.5h1.25a.75.75 0 0 0 0-1.5H7.5z"
                  fill="currentColor"
                  fill-rule="evenodd"
                />
              </svg>
            </NumberFieldIncrementButton>
          </NumberFieldGroup>
          <Description>Custom icon children</Description>
        </NumberFieldRoot>
      </div>
    `,
  }),
};

export const WithChevrons: Story = {
  render: () => ({
    components,
    setup: () => ({
      eur: {
        currency: "EUR",
        currencySign: "accounting",
        style: "currency",
      } as Intl.NumberFormatOptions,
    }),
    template: `
      <NumberFieldRoot :default-value="99" :format-options="eur" :min-value="0" name="amount">
        <Label>Number field with chevrons</Label>
        <NumberFieldGroup class="flex">
          <NumberFieldInput class="flex-1" />
          <div class="flex h-full flex-col border-s border-field-placeholder/15">
            <NumberFieldIncrementButton
              class="flex h-1/2 w-6 items-center justify-center rounded-none border-0 pt-0.5 text-sm"
            >
              <svg
                aria-hidden="true"
                height="11"
                viewBox="0 0 16 16"
                width="11"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  clip-rule="evenodd"
                  d="M13.03 10.53a.75.75 0 0 1-1.06 0L8 6.56l-3.97 3.97a.75.75 0 1 1-1.06-1.06l4.5-4.5a.75.75 0 0 1 1.06 0l4.5 4.5a.75.75 0 0 1 0 1.06"
                  fill="currentColor"
                  fill-rule="evenodd"
                />
              </svg>
            </NumberFieldIncrementButton>
            <NumberFieldDecrementButton
              class="flex h-1/2 w-6 items-center justify-center rounded-none border-0 pb-0.5 text-sm"
            >
              <svg
                aria-hidden="true"
                height="11"
                viewBox="0 0 16 16"
                width="11"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  clip-rule="evenodd"
                  d="M2.97 5.47a.75.75 0 0 1 1.06 0L8 9.44l3.97-3.97a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 0 1 0-1.06"
                  fill="currentColor"
                  fill-rule="evenodd"
                />
              </svg>
            </NumberFieldDecrementButton>
          </div>
        </NumberFieldGroup>
      </NumberFieldRoot>
    `,
  }),
};

export const FormExample: Story = {
  render: () => ({
    components,
    setup: () => {
      const STOCK_AVAILABLE = 3;
      const value = shallowRef<number | undefined>(undefined);
      const isSubmitting = shallowRef(false);
      const submitted = shallowRef("");
      const isOutOfStock = computed(
        () => value.value !== undefined && value.value > STOCK_AVAILABLE,
      );
      const canSubmit = computed(
        () => value.value !== undefined && value.value >= 1 && value.value <= STOCK_AVAILABLE,
      );

      const onSubmit = (event: Event) => {
        event.preventDefault();

        if (!canSubmit.value) return;

        isSubmitting.value = true;

        setTimeout(() => {
          submitted.value = "quantity: " + String(value.value);
          value.value = undefined;
          isSubmitting.value = false;
        }, 1500);
      };

      return {STOCK_AVAILABLE, canSubmit, isOutOfStock, isSubmitting, onSubmit, submitted, value};
    },
    template: `
      <Form class="flex w-[280px] flex-col gap-4" @submit="onSubmit">
        <NumberFieldRoot
          v-model:value="value"
          is-required
          :is-invalid="isOutOfStock"
          :max-value="5"
          :min-value="1"
          name="quantity"
        >
          <Label>Order quantity</Label>
          <NumberFieldGroup>
            <NumberFieldDecrementButton />
            <NumberFieldInput class="w-[120px]" />
            <NumberFieldIncrementButton />
          </NumberFieldGroup>
          <FieldError v-if="isOutOfStock">
            Only {{ STOCK_AVAILABLE }} items left in stock
          </FieldError>
          <Description v-else>Only {{ STOCK_AVAILABLE }} items available</Description>
        </NumberFieldRoot>
        <Button
          class="w-full"
          :is-disabled="!canSubmit"
          :is-pending="isSubmitting"
          type="submit"
          variant="primary"
        >
          <template v-if="isSubmitting">
            <Spinner color="current" size="sm" />
            Processing...
          </template>
          <template v-else>Place Order</template>
        </Button>
        <p v-if="submitted" class="text-sm text-muted">Order submitted — {{ submitted }}</p>
      </Form>
    `,
  }),
};
