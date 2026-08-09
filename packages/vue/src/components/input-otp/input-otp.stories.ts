import type {Meta, StoryObj} from "@storybook/vue3";

import {computed, shallowRef} from "vue";

import {Button} from "../button";
import {Description} from "../description";
import {Form} from "../form";
import {Label} from "../label";
import {Link} from "../link";
import {Spinner} from "../spinner";

import {
  InputOTP,
  InputOTPGroup,
  InputOTPRoot,
  InputOTPSeparator,
  InputOTPSlot,
  REGEXP_ONLY_CHARS,
} from "./index";

// Registered part by part: a story template is compiled at runtime, with no binding metadata to
// resolve `InputOTP.Group` through, so dot notation cannot be used here.
const components = {
  Button,
  Description,
  Form,
  InputOTPGroup,
  InputOTPRoot,
  InputOTPSeparator,
  InputOTPSlot,
  Label,
  Link,
  Spinner,
};

const meta: Meta = {
  argTypes: {
    isDisabled: {control: "boolean"},
    isInvalid: {control: "boolean"},
    maxLength: {control: "number"},
  },
  component: InputOTP,
  parameters: {
    layout: "centered",
  },
  title: "Components/Forms/InputOTP",
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex w-[280px] flex-col gap-2">
        <div class="flex flex-col gap-1">
          <Label>Verify account</Label>
          <p class="text-sm text-muted">We&apos;ve sent a code to a****@gmail.com</p>
        </div>
        <InputOTPRoot :max-length="6">
          <InputOTPGroup>
            <InputOTPSlot :index="0" />
            <InputOTPSlot :index="1" />
            <InputOTPSlot :index="2" />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot :index="3" />
            <InputOTPSlot :index="4" />
            <InputOTPSlot :index="5" />
          </InputOTPGroup>
        </InputOTPRoot>
        <div class="flex items-center gap-[5px] px-1 pt-1">
          <p class="text-sm text-muted">Didn&apos;t receive a code?</p>
          <Link class="text-foreground" underline="always">Resend</Link>
        </div>
      </div>
    `,
  }),
};

export const Variants: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex flex-col gap-6">
        <div class="flex flex-col gap-2">
          <Label>Primary variant</Label>
          <InputOTPRoot :max-length="6" variant="primary">
            <InputOTPGroup>
              <InputOTPSlot :index="0" />
              <InputOTPSlot :index="1" />
              <InputOTPSlot :index="2" />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot :index="3" />
              <InputOTPSlot :index="4" />
              <InputOTPSlot :index="5" />
            </InputOTPGroup>
          </InputOTPRoot>
        </div>
        <div class="flex flex-col gap-2">
          <Label>Secondary variant</Label>
          <InputOTPRoot :max-length="6" variant="secondary">
            <InputOTPGroup>
              <InputOTPSlot :index="0" />
              <InputOTPSlot :index="1" />
              <InputOTPSlot :index="2" />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot :index="3" />
              <InputOTPSlot :index="4" />
              <InputOTPSlot :index="5" />
            </InputOTPGroup>
          </InputOTPRoot>
        </div>
      </div>
    `,
  }),
};

export const FourDigits: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex w-[280px] flex-col gap-2">
        <Label>Enter PIN</Label>
        <InputOTPRoot :max-length="4">
          <InputOTPGroup>
            <InputOTPSlot :index="0" />
            <InputOTPSlot :index="1" />
            <InputOTPSlot :index="2" />
            <InputOTPSlot :index="3" />
          </InputOTPGroup>
        </InputOTPRoot>
      </div>
    `,
  }),
};

export const Disabled: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex w-[280px] flex-col gap-2">
        <Label is-disabled>Verify account</Label>
        <Description>Code verification is currently disabled</Description>
        <InputOTPRoot is-disabled :max-length="6">
          <InputOTPGroup>
            <InputOTPSlot :index="0" />
            <InputOTPSlot :index="1" />
            <InputOTPSlot :index="2" />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot :index="3" />
            <InputOTPSlot :index="4" />
            <InputOTPSlot :index="5" />
          </InputOTPGroup>
        </InputOTPRoot>
      </div>
    `,
  }),
};

export const WithPattern: Story = {
  render: () => ({
    components,
    setup: () => ({pattern: REGEXP_ONLY_CHARS}),
    template: `
      <div class="flex w-[280px] flex-col gap-2">
        <Label>Enter code (letters only)</Label>
        <Description>Only alphabetic characters are allowed</Description>
        <InputOTPRoot :max-length="6" :pattern="pattern">
          <InputOTPGroup>
            <InputOTPSlot :index="0" />
            <InputOTPSlot :index="1" />
            <InputOTPSlot :index="2" />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot :index="3" />
            <InputOTPSlot :index="4" />
            <InputOTPSlot :index="5" />
          </InputOTPGroup>
        </InputOTPRoot>
      </div>
    `,
  }),
};

export const Controlled: Story = {
  render: () => ({
    components,
    setup: () => {
      const value = shallowRef("");

      return {clear: () => (value.value = ""), value};
    },
    template: `
      <div class="flex w-[280px] flex-col gap-2">
        <Label>Verify account</Label>
        <InputOTPRoot v-model:value="value" :max-length="6">
          <InputOTPGroup>
            <InputOTPSlot :index="0" />
            <InputOTPSlot :index="1" />
            <InputOTPSlot :index="2" />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot :index="3" />
            <InputOTPSlot :index="4" />
            <InputOTPSlot :index="5" />
          </InputOTPGroup>
        </InputOTPRoot>
        <Description>
          <template v-if="value.length > 0">
            Value: {{ value }} ({{ value.length }}/6) &bull;
            <button class="font-medium text-foreground underline" @click="clear">Clear</button>
          </template>
          <template v-else>Enter a 6-digit code</template>
        </Description>
      </div>
    `,
  }),
};

export const WithValidation: Story = {
  render: () => ({
    components,
    setup: () => {
      const value = shallowRef("");
      const isInvalid = shallowRef(false);

      const onSubmit = (event: Event) => {
        event.preventDefault();

        const code = new FormData(event.currentTarget as HTMLFormElement).get("code");

        if (code !== "123456") {
          isInvalid.value = true;

          return;
        }

        isInvalid.value = false;
        value.value = "";

        alert("Code verified successfully!");
      };

      const onChange = (next: string) => {
        value.value = next;
        isInvalid.value = false;
      };

      return {isInvalid, onChange, onSubmit, value};
    },
    template: `
      <div class="flex w-[280px] flex-col gap-2">
        <Form class="flex flex-col gap-2" @submit="onSubmit">
          <Label>Verify account</Label>
          <Description>Hint: The code is 123456</Description>
          <InputOTPRoot
            :aria-describedby="isInvalid ? 'code-error' : undefined"
            :is-invalid="isInvalid"
            :max-length="6"
            name="code"
            :value="value"
            @change="onChange"
          >
            <InputOTPGroup>
              <InputOTPSlot :index="0" />
              <InputOTPSlot :index="1" />
              <InputOTPSlot :index="2" />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot :index="3" />
              <InputOTPSlot :index="4" />
              <InputOTPSlot :index="5" />
            </InputOTPGroup>
          </InputOTPRoot>
          <span class="field-error" :data-visible="isInvalid" id="code-error">
            Invalid code. Please try again.
          </span>
          <Button :is-disabled="value.length !== 6" type="submit">Submit</Button>
        </Form>
      </div>
    `,
  }),
};

export const OnComplete: Story = {
  render: () => ({
    components,
    setup: () => {
      const value = shallowRef("");
      const isComplete = shallowRef(false);
      const isSubmitting = shallowRef(false);

      const onComplete = (code: string) => {
        isComplete.value = true;
        // eslint-disable-next-line no-console
        console.log("Code complete:", code);
      };

      const onChange = (next: string) => {
        value.value = next;
        isComplete.value = false;
      };

      const onSubmit = (event: Event) => {
        event.preventDefault();
        isSubmitting.value = true;

        // Stands in for the call that would verify the code.
        setTimeout(() => {
          isSubmitting.value = false;
          value.value = "";
          isComplete.value = false;
        }, 2000);
      };

      return {isComplete, isSubmitting, onChange, onComplete, onSubmit, value};
    },
    template: `
      <Form class="flex w-[280px] flex-col gap-2" @submit="onSubmit">
        <Label>Verify account</Label>
        <InputOTPRoot
          :max-length="6"
          :value="value"
          @change="onChange"
          @complete="onComplete"
        >
          <InputOTPGroup>
            <InputOTPSlot :index="0" />
            <InputOTPSlot :index="1" />
            <InputOTPSlot :index="2" />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot :index="3" />
            <InputOTPSlot :index="4" />
            <InputOTPSlot :index="5" />
          </InputOTPGroup>
        </InputOTPRoot>
        <Button
          class="mt-2 w-full"
          :is-disabled="!isComplete"
          :is-pending="isSubmitting"
          type="submit"
          variant="primary"
        >
          <template v-if="isSubmitting">
            <Spinner color="current" size="sm" />
            Verifying...
          </template>
          <template v-else>Verify Code</template>
        </Button>
      </Form>
    `,
  }),
};

export const FormExample: Story = {
  render: () => ({
    components,
    setup: () => {
      const value = shallowRef("");
      const error = shallowRef("");
      const isSubmitting = shallowRef(false);
      const isInvalid = computed(() => error.value.length > 0);

      const onChange = (next: string) => {
        value.value = next;
        error.value = "";
      };

      const onSubmit = (event: Event) => {
        event.preventDefault();
        error.value = "";

        if (value.value.length !== 6) {
          error.value = "Please enter all 6 digits";

          return;
        }

        isSubmitting.value = true;

        // Stands in for the call that would verify the code.
        setTimeout(() => {
          if (value.value === "123456") {
            // eslint-disable-next-line no-console
            console.log("Code verified successfully!");
            value.value = "";
          } else {
            error.value = "Invalid code. Please try again.";
          }
          isSubmitting.value = false;
        }, 1500);
      };

      return {error, isInvalid, isSubmitting, onChange, onSubmit, value};
    },
    template: `
      <Form class="flex w-[280px] flex-col gap-4" @submit="onSubmit">
        <div class="flex flex-col gap-2">
          <Label>Two-factor authentication</Label>
          <Description>Enter the 6-digit code from your authenticator app</Description>
          <InputOTPRoot
            :is-invalid="isInvalid"
            :max-length="6"
            :value="value"
            @change="onChange"
          >
            <InputOTPGroup>
              <InputOTPSlot :index="0" />
              <InputOTPSlot :index="1" />
              <InputOTPSlot :index="2" />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot :index="3" />
              <InputOTPSlot :index="4" />
              <InputOTPSlot :index="5" />
            </InputOTPGroup>
          </InputOTPRoot>
          <span class="field-error" :data-visible="isInvalid" id="code-error">{{ error }}</span>
        </div>
        <Button
          class="w-full"
          :is-disabled="value.length !== 6"
          :is-pending="isSubmitting"
          type="submit"
          variant="primary"
        >
          <template v-if="isSubmitting">
            <Spinner color="current" size="sm" />
            Verifying...
          </template>
          <template v-else>Verify</template>
        </Button>
        <div class="flex items-center justify-center gap-1">
          <p class="text-sm text-muted">Having trouble?</p>
          <Link class="text-sm text-foreground" underline="always">Use backup code</Link>
        </div>
      </Form>
    `,
  }),
};
