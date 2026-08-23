import type { Meta, StoryObj } from "@storybook/vue3-vite";

import { shallowRef } from "vue";
import IconArrowUpFromLine from "~icons/gravity-ui/arrow-up-from-line";
import IconCircleCheck from "~icons/gravity-ui/circle-check";
import IconCircleInfo from "~icons/gravity-ui/circle-info";
import IconEnvelope from "~icons/gravity-ui/envelope";
import IconGear from "~icons/gravity-ui/gear";
import IconRocket from "~icons/gravity-ui/rocket";
import IconSparkles from "~icons/gravity-ui/sparkles";

import { useOverlayTriggerState } from "../../composables/use-overlay-trigger-state";
import { ButtonRoot } from "../button";
import { InputRoot } from "../input";
import { LabelRoot } from "../label";
import { Radio } from "../radio";
import { RadioGroup } from "../radio-group";
import { SurfaceRoot } from "../surface";
import { TextField } from "../textfield";

import ModalBackdrop from "./modal-backdrop.vue";
import ModalBody from "./modal-body.vue";
import ModalCloseTrigger from "./modal-close-trigger.vue";
import ModalClose from "./modal-close.vue";
import ModalContainer from "./modal-container.vue";
import ModalDialog from "./modal-dialog.vue";
import ModalFooter from "./modal-footer.vue";
import ModalHeader from "./modal-header.vue";
import ModalHeading from "./modal-heading.vue";
import ModalIcon from "./modal-icon.vue";
import ModalRoot from "./modal-root.vue";
import ModalTrigger from "./modal-trigger.vue";

// Registered under flat names: a story template is compiled at runtime with no binding metadata,
// so a dotted tag would be looked up as a component literally named "Modal.Dialog".
const components = {
  Button: ButtonRoot,
  IconArrowUpFromLine,
  IconCircleCheck,
  IconCircleInfo,
  IconEnvelope,
  IconGear,
  IconRocket,
  IconSparkles,
  Input: InputRoot,
  Label: LabelRoot,
  Modal: ModalRoot,
  ModalBackdrop,
  ModalBody,
  ModalClose,
  ModalCloseTrigger,
  ModalContainer,
  ModalDialog,
  ModalFooter,
  ModalHeader,
  ModalHeading,
  ModalIcon,
  ModalTrigger,
  Radio,
  RadioContent: Radio.Content,
  RadioControl: Radio.Control,
  RadioGroup,
  RadioIndicator: Radio.Indicator,
  Surface: SurfaceRoot,
  TextField,
};

const meta = {
  parameters: { layout: "centered" },
  title: "Components/Overlays/Modal",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components,
    template: `
      <Modal>
        <Button variant="secondary">Open Modal</Button>
        <ModalBackdrop>
          <ModalContainer>
            <ModalDialog class="sm:max-w-[360px]">
              <ModalCloseTrigger />
              <ModalHeader>
                <ModalIcon class="bg-default text-foreground">
                  <IconRocket class="size-5" />
                </ModalIcon>
                <ModalHeading>Welcome to Ropav</ModalHeading>
              </ModalHeader>
              <ModalBody>
                <p>
                  A beautiful, fast, and modern Vue UI library for building accessible and
                  customizable web applications with ease.
                </p>
              </ModalBody>
              <ModalFooter>
                <ModalClose><Button class="w-full">Continue</Button></ModalClose>
              </ModalFooter>
            </ModalDialog>
          </ModalContainer>
        </ModalBackdrop>
      </Modal>
    `,
  }),
};

export const Placements: Story = {
  render: () => ({
    components,
    setup: () => ({ placements: ["auto", "top", "center", "bottom"] as const }),
    template: `
      <div class="flex flex-wrap gap-4">
        <Modal v-for="placement in placements" :key="placement">
          <Button variant="secondary">{{ placement.charAt(0).toUpperCase() + placement.slice(1) }}</Button>
          <ModalBackdrop>
            <ModalContainer :placement="placement">
              <ModalDialog class="sm:max-w-[360px]">
                <ModalCloseTrigger />
                <ModalHeader>
                  <ModalIcon class="bg-default text-foreground">
                    <IconRocket class="size-5" />
                  </ModalIcon>
                  <ModalHeading>
                    Placement: {{ placement.charAt(0).toUpperCase() + placement.slice(1) }}
                  </ModalHeading>
                </ModalHeader>
                <ModalBody>
                  <p>
                    This modal uses the <code>{{ placement }}</code> placement option. Try different
                    placements to see how the modal positions itself on the screen.
                  </p>
                </ModalBody>
                <ModalFooter>
                  <ModalClose><Button class="w-full">Continue</Button></ModalClose>
                </ModalFooter>
              </ModalDialog>
            </ModalContainer>
          </ModalBackdrop>
        </Modal>
      </div>
    `,
  }),
};

export const BackdropVariants: Story = {
  render: () => ({
    components,
    setup: () => ({ variants: ["opaque", "blur", "transparent"] as const }),
    template: `
      <div class="flex flex-wrap gap-4">
        <Modal v-for="variant in variants" :key="variant">
          <Button variant="secondary">{{ variant.charAt(0).toUpperCase() + variant.slice(1) }}</Button>
          <ModalBackdrop :variant="variant">
            <ModalContainer>
              <ModalDialog class="sm:max-w-[360px]">
                <ModalCloseTrigger />
                <ModalHeader>
                  <ModalIcon class="bg-default text-foreground">
                    <IconRocket class="size-5" />
                  </ModalIcon>
                  <ModalHeading>
                    Backdrop: {{ variant.charAt(0).toUpperCase() + variant.slice(1) }}
                  </ModalHeading>
                </ModalHeader>
                <ModalBody>
                  <p>
                    This modal uses the <code>{{ variant }}</code> backdrop variant. Compare the
                    different visual effects: opaque provides full opacity, blur adds a backdrop
                    filter, and transparent removes the background.
                  </p>
                </ModalBody>
                <ModalFooter>
                  <ModalClose><Button class="w-full">Continue</Button></ModalClose>
                </ModalFooter>
              </ModalDialog>
            </ModalContainer>
          </ModalBackdrop>
        </Modal>
      </div>
    `,
  }),
};

export const Sizes: Story = {
  render: () => ({
    components,
    setup: () => ({ sizes: ["xs", "sm", "md", "lg", "cover", "full"] as const }),
    template: `
      <div class="flex flex-wrap gap-4">
        <Modal v-for="size in sizes" :key="size">
          <Button variant="secondary">{{ size.charAt(0).toUpperCase() + size.slice(1) }}</Button>
          <ModalBackdrop>
            <ModalContainer :size="size">
              <ModalDialog>
                <ModalCloseTrigger />
                <ModalHeader>
                  <ModalIcon class="bg-default text-foreground">
                    <IconRocket class="size-5" />
                  </ModalIcon>
                  <ModalHeading>Size: {{ size.charAt(0).toUpperCase() + size.slice(1) }}</ModalHeading>
                </ModalHeader>
                <ModalBody>
                  <p v-if="size === 'cover'">
                    This modal uses the <code>cover</code> size variant. It spans the full screen
                    with margins: 16px on mobile and 40px on desktop. Maintains rounded corners and
                    standard padding. Perfect for cover-style content that needs maximum width while
                    preserving modal aesthetics.
                  </p>
                  <p v-else-if="size === 'full'">
                    This modal uses the <code>full</code> size variant. It occupies the entire
                    viewport without any margins, rounded corners, or shadows, creating a true
                    fullscreen experience. Ideal for immersive content or full-page interactions.
                  </p>
                  <p v-else>
                    This modal uses the <code>{{ size }}</code> size variant. On mobile devices, all
                    sizes adapt to near full-width for optimal viewing. On desktop, each size
                    provides a different maximum width to suit various content needs.
                  </p>
                </ModalBody>
                <ModalFooter>
                  <ModalClose><Button variant="secondary">Cancel</Button></ModalClose>
                  <ModalClose><Button>Confirm</Button></ModalClose>
                </ModalFooter>
              </ModalDialog>
            </ModalContainer>
          </ModalBackdrop>
        </Modal>
      </div>
    `,
  }),
};

export const CustomBackdrop: Story = {
  render: () => ({
    components,
    template: `
      <Modal>
        <Button variant="secondary">Custom Backdrop</Button>
        <ModalBackdrop
          class="bg-linear-to-t from-black/80 via-black/40 to-transparent dark:from-zinc-800/80 dark:via-zinc-800/40"
          variant="blur"
        >
          <ModalContainer>
            <ModalDialog class="sm:max-w-[360px]">
              <ModalHeader class="items-center text-center">
                <ModalIcon class="bg-accent-soft text-accent-soft-foreground">
                  <IconSparkles class="size-5" />
                </ModalIcon>
                <ModalHeading>Premium Backdrop</ModalHeading>
              </ModalHeader>
              <ModalBody>
                <p>
                  This backdrop features a sophisticated gradient that transitions from a dark color
                  at the bottom to complete transparency at the top, combined with a smooth blur
                  effect. The gradient automatically adapts its intensity for optimal contrast in
                  both light and dark modes.
                </p>
              </ModalBody>
              <ModalFooter class="flex-col-reverse">
                <ModalClose><Button class="w-full">Amazing!</Button></ModalClose>
                <ModalClose><Button class="w-full" variant="secondary">Close</Button></ModalClose>
              </ModalFooter>
              <ModalCloseTrigger />
            </ModalDialog>
          </ModalContainer>
        </ModalBackdrop>
      </Modal>
    `,
  }),
};

export const DismissBehavior: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex max-w-sm flex-col gap-6">
        <div class="flex flex-col gap-2">
          <h3 class="text-lg font-semibold">isDismissable</h3>
          <p class="text-sm text-muted">
            Controls whether the modal can be dismissed by clicking the overlay backdrop. Defaults
            to <code>true</code>. Set to <code>false</code> to require explicit close action.
          </p>
          <Modal>
            <Button variant="secondary">Open Modal</Button>
            <ModalBackdrop :is-dismissable="false">
              <ModalContainer>
                <ModalDialog class="sm:max-w-[360px]">
                  <ModalCloseTrigger />
                  <ModalHeader>
                    <ModalIcon class="bg-default text-foreground">
                      <IconCircleInfo class="size-5" />
                    </ModalIcon>
                    <ModalHeading>isDismissable = false</ModalHeading>
                    <p class="text-sm leading-5 text-muted">
                      Clicking the backdrop won't close this modal
                    </p>
                  </ModalHeader>
                  <ModalBody>
                    <p>
                      Try clicking outside this modal on the overlay - it won't close. You must use
                      the close button or press ESC to dismiss it.
                    </p>
                  </ModalBody>
                  <ModalFooter>
                    <ModalClose><Button class="w-full">Close</Button></ModalClose>
                  </ModalFooter>
                </ModalDialog>
              </ModalContainer>
            </ModalBackdrop>
          </Modal>
        </div>

        <div class="flex flex-col gap-2">
          <h3 class="text-lg font-semibold">isKeyboardDismissDisabled</h3>
          <p class="text-sm text-muted">
            Controls whether the ESC key can dismiss the modal. When set to <code>true</code>, the
            ESC key will be disabled and users must use explicit close actions.
          </p>
          <Modal>
            <Button variant="secondary">Open Modal</Button>
            <ModalBackdrop is-keyboard-dismiss-disabled>
              <ModalContainer>
                <ModalDialog class="sm:max-w-[360px]">
                  <ModalCloseTrigger />
                  <ModalHeader>
                    <ModalIcon class="bg-default text-foreground">
                      <IconCircleInfo class="size-5" />
                    </ModalIcon>
                    <ModalHeading>isKeyboardDismissDisabled = true</ModalHeading>
                    <p class="text-sm leading-5 text-muted">ESC key is disabled</p>
                  </ModalHeader>
                  <ModalBody>
                    <p>
                      Press ESC - nothing happens. You must use the close button or click the
                      overlay backdrop to dismiss this modal.
                    </p>
                  </ModalBody>
                  <ModalFooter>
                    <ModalClose><Button class="w-full">Close</Button></ModalClose>
                  </ModalFooter>
                </ModalDialog>
              </ModalContainer>
            </ModalBackdrop>
          </Modal>
        </div>
      </div>
    `,
  }),
};

export const CloseMethods: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex max-w-2xl flex-col gap-8">
        <div class="flex flex-col gap-2">
          <h3 class="text-lg font-semibold">Using Modal.Close</h3>
          <p class="text-sm text-muted">
            The simplest way to close a modal. Wrap any Button in <code>Modal.Close</code> and it
            closes the modal when pressed, keeping its own handler as well.
          </p>
          <Modal>
            <Button variant="secondary">Open Modal</Button>
            <ModalBackdrop>
              <ModalContainer>
                <ModalDialog class="sm:max-w-[360px]">
                  <ModalHeader>
                    <ModalIcon class="bg-accent-soft text-accent-soft-foreground">
                      <IconCircleInfo class="size-5" />
                    </ModalIcon>
                    <ModalHeading>Using Modal.Close</ModalHeading>
                  </ModalHeader>
                  <ModalBody>
                    <p>
                      Click either button below - both are wrapped in <code>Modal.Close</code> and
                      will close the modal automatically.
                    </p>
                  </ModalBody>
                  <ModalFooter>
                    <ModalClose><Button variant="secondary">Cancel</Button></ModalClose>
                    <ModalClose><Button>Confirm</Button></ModalClose>
                  </ModalFooter>
                </ModalDialog>
              </ModalContainer>
            </ModalBackdrop>
          </Modal>
        </div>

        <div class="flex flex-col gap-2">
          <h3 class="text-lg font-semibold">Using the Dialog's scoped slot</h3>
          <p class="text-sm text-muted">
            Take the <code>close</code> function from the Dialog's scoped slot. This gives full
            control over when and how to close, so custom logic can run first.
          </p>
          <Modal>
            <Button variant="secondary">Open Modal</Button>
            <ModalBackdrop>
              <ModalContainer>
                <ModalDialog v-slot="{ close }" class="sm:max-w-[360px]">
                  <ModalHeader>
                    <ModalIcon class="bg-success-soft text-success-soft-foreground">
                      <IconCircleCheck class="size-5" />
                    </ModalIcon>
                    <ModalHeading>Using the Dialog's scoped slot</ModalHeading>
                  </ModalHeader>
                  <ModalBody>
                    <p>
                      The buttons below call the <code>close</code> function from the scoped slot.
                      Validation or other logic can run before calling it.
                    </p>
                  </ModalBody>
                  <ModalFooter>
                    <Button variant="secondary" @click="close()">Cancel</Button>
                    <Button @click="close()">Confirm</Button>
                  </ModalFooter>
                </ModalDialog>
              </ModalContainer>
            </ModalBackdrop>
          </Modal>
        </div>
      </div>
    `,
  }),
};

export const ScrollComparison: Story = {
  render: () => ({
    components,
    setup: () => {
      const scroll = shallowRef<"inside" | "outside">("inside");

      return { paragraphs: Array.from({ length: 30 }, (_, index) => index + 1), scroll };
    },
    template: `
      <div class="flex flex-col gap-4">
        <RadioGroup v-model:value="scroll" orientation="horizontal">
          <Radio value="inside">
            <RadioContent>
              <RadioControl><RadioIndicator /></RadioControl>
              <Label>Inside</Label>
            </RadioContent>
          </Radio>
          <Radio value="outside">
            <RadioContent>
              <RadioControl><RadioIndicator /></RadioControl>
              <Label>Outside</Label>
            </RadioContent>
          </Radio>
        </RadioGroup>

        <Modal>
          <Button variant="secondary">
            Open Modal ({{ scroll.charAt(0).toUpperCase() + scroll.slice(1) }})
          </Button>
          <ModalBackdrop>
            <ModalContainer :scroll="scroll">
              <ModalDialog class="sm:max-w-[360px]">
                <ModalHeader>
                  <ModalHeading>
                    Scroll: {{ scroll.charAt(0).toUpperCase() + scroll.slice(1) }}
                  </ModalHeading>
                  <p class="text-sm leading-5 text-muted">
                    Compare scroll behaviors - inside keeps content scrollable within the modal,
                    outside allows page scrolling
                  </p>
                </ModalHeader>
                <ModalBody>
                  <p v-for="index in paragraphs" :key="index" class="mb-3">
                    Paragraph {{ index }}: Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                    Nullam pulvinar risus non risus hendrerit venenatis. Pellentesque sit amet
                    hendrerit risus, sed porttitor quam.
                  </p>
                </ModalBody>
                <ModalFooter>
                  <ModalClose><Button variant="secondary">Cancel</Button></ModalClose>
                  <ModalClose><Button>Confirm</Button></ModalClose>
                </ModalFooter>
                <ModalCloseTrigger />
              </ModalDialog>
            </ModalContainer>
          </ModalBackdrop>
        </Modal>
      </div>
    `,
  }),
};

export const Controlled: Story = {
  render: () => ({
    components,
    setup: () => {
      const isOpen = shallowRef(false);
      // The counterpart of React's `useOverlayState`, and the reason `Modal` takes a `state` prop:
      // one object with `open`/`close`/`toggle` rather than a ref and a handler.
      const state = useOverlayTriggerState();

      return { isOpen, state };
    },
    template: `
      <div class="flex max-w-md flex-col gap-8">
        <div class="flex flex-col gap-3">
          <h3 class="text-lg font-semibold text-foreground">With a ref</h3>
          <p class="text-sm leading-relaxed text-pretty text-muted">
            Control the modal with a plain <code class="text-foreground">shallowRef</code> for
            simple state management. Perfect for basic use cases.
          </p>
          <div class="flex flex-col items-start gap-3 rounded-2xl bg-surface p-4 shadow-sm">
            <p class="text-xs text-muted">
              Status:
              <span class="font-mono font-medium text-foreground">
                {{ isOpen ? "open" : "closed" }}
              </span>
            </p>
            <div class="flex gap-2">
              <Button size="sm" variant="secondary" @click="isOpen = true">Open Modal</Button>
              <Button size="sm" variant="tertiary" @click="isOpen = !isOpen">Toggle</Button>
            </div>
          </div>

          <Modal :is-open="isOpen" @open-change="isOpen = $event">
            <ModalBackdrop>
              <ModalContainer>
                <ModalDialog class="sm:max-w-[360px]">
                  <ModalCloseTrigger />
                  <ModalHeader>
                    <ModalIcon class="bg-accent-soft text-accent-soft-foreground">
                      <IconCircleCheck class="size-5" />
                    </ModalIcon>
                    <ModalHeading>Controlled with a ref</ModalHeading>
                  </ModalHeader>
                  <ModalBody>
                    <p>
                      This modal is controlled by a ref. Pass <code>isOpen</code> and listen to
                      <code>openChange</code> to manage the modal state externally.
                    </p>
                  </ModalBody>
                  <ModalFooter>
                    <ModalClose><Button variant="secondary">Cancel</Button></ModalClose>
                    <ModalClose><Button>Confirm</Button></ModalClose>
                  </ModalFooter>
                </ModalDialog>
              </ModalContainer>
            </ModalBackdrop>
          </Modal>
        </div>

        <div class="flex flex-col gap-3">
          <h3 class="text-lg font-semibold text-foreground">With useOverlayTriggerState()</h3>
          <p class="text-sm leading-relaxed text-pretty text-muted">
            Use the <code class="text-foreground">useOverlayTriggerState</code> composable for a
            cleaner API with <code>open()</code>, <code>close()</code> and <code>toggle()</code>.
          </p>
          <div class="flex flex-col items-start gap-3 rounded-2xl bg-surface p-4 shadow-sm">
            <p class="text-xs text-muted">
              Status:
              <span class="font-mono font-medium text-foreground">
                {{ state.isOpen.value ? "open" : "closed" }}
              </span>
            </p>
            <div class="flex gap-2">
              <Button size="sm" variant="secondary" @click="state.open()">Open Modal</Button>
              <Button size="sm" variant="tertiary" @click="state.toggle()">Toggle</Button>
            </div>
          </div>

          <Modal :state="state">
            <ModalBackdrop>
              <ModalContainer>
                <ModalDialog class="sm:max-w-[360px]">
                  <ModalCloseTrigger />
                  <ModalHeader>
                    <ModalIcon class="bg-success-soft text-success-soft-foreground">
                      <IconCircleCheck class="size-5" />
                    </ModalIcon>
                    <ModalHeading>Controlled with useOverlayTriggerState()</ModalHeading>
                  </ModalHeader>
                  <ModalBody>
                    <p>
                      The composable provides dedicated methods for common operations. No callbacks
                      to write — just <code>state.open()</code>, <code>state.close()</code> or
                      <code>state.toggle()</code>.
                    </p>
                  </ModalBody>
                  <ModalFooter>
                    <ModalClose><Button variant="secondary">Cancel</Button></ModalClose>
                    <ModalClose><Button>Confirm</Button></ModalClose>
                  </ModalFooter>
                </ModalDialog>
              </ModalContainer>
            </ModalBackdrop>
          </Modal>
        </div>
      </div>
    `,
  }),
};

export const WithForm: Story = {
  render: () => ({
    components,
    template: `
      <Modal>
        <Button variant="secondary">Open Contact Form</Button>
        <ModalBackdrop>
          <ModalContainer placement="auto">
            <ModalDialog class="sm:max-w-md">
              <ModalCloseTrigger />
              <ModalHeader>
                <ModalIcon class="bg-accent-soft text-accent-soft-foreground">
                  <IconEnvelope class="size-5" />
                </ModalIcon>
                <ModalHeading>Contact Us</ModalHeading>
                <p class="mt-1.5 text-sm leading-5 text-muted">
                  Fill out the form below and we'll get back to you. The modal adapts automatically
                  when the keyboard appears on mobile.
                </p>
              </ModalHeader>
              <ModalBody>
                <Surface variant="default">
                  <form class="flex flex-col gap-4">
                    <TextField class="w-full" name="name" type="text">
                      <Label>Name</Label>
                      <Input placeholder="Enter your name" />
                    </TextField>
                    <TextField class="w-full" name="email" type="email">
                      <Label>Email</Label>
                      <Input placeholder="Enter your email" />
                    </TextField>
                    <TextField class="w-full" name="phone" type="tel">
                      <Label>Phone</Label>
                      <Input placeholder="Enter your phone number" />
                    </TextField>
                    <TextField class="w-full" name="company">
                      <Label>Company</Label>
                      <Input placeholder="Enter your company name" />
                    </TextField>
                    <TextField class="w-full" name="message">
                      <Label>Message</Label>
                      <Input placeholder="Enter your message" />
                    </TextField>
                  </form>
                </Surface>
              </ModalBody>
              <ModalFooter>
                <ModalClose><Button variant="secondary">Cancel</Button></ModalClose>
                <ModalClose><Button>Send Message</Button></ModalClose>
              </ModalFooter>
            </ModalDialog>
          </ModalContainer>
        </ModalBackdrop>
      </Modal>
    `,
  }),
};

export const CustomTrigger: Story = {
  render: () => ({
    components,
    template: `
      <Modal>
        <ModalTrigger
          class="group flex items-center gap-3 rounded-2xl bg-surface p-4 shadow-xs select-none hover:bg-surface-secondary"
        >
          <div
            class="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-soft-foreground"
          >
            <IconGear class="size-6" />
          </div>
          <div class="flex flex-1 flex-col gap-0.5">
            <p class="text-sm font-semibold">Settings</p>
            <p class="text-xs text-muted">Manage your preferences</p>
          </div>
        </ModalTrigger>
        <ModalBackdrop>
          <ModalContainer>
            <ModalDialog class="sm:max-w-[360px]">
              <ModalCloseTrigger />
              <ModalHeader>
                <ModalIcon class="bg-accent-soft text-accent-soft-foreground">
                  <IconGear class="size-5" />
                </ModalIcon>
                <ModalHeading>Settings</ModalHeading>
              </ModalHeader>
              <ModalBody>
                <p>
                  Use <code>Modal.Trigger</code> to create custom trigger elements beyond standard
                  buttons. This example shows a card-style trigger with icons and descriptive text.
                </p>
              </ModalBody>
              <ModalFooter>
                <ModalClose><Button variant="secondary">Cancel</Button></ModalClose>
                <ModalClose><Button>Save</Button></ModalClose>
              </ModalFooter>
            </ModalDialog>
          </ModalContainer>
        </ModalBackdrop>
      </Modal>
    `,
  }),
};

const KINEMATIC_BACKDROP = [
  "data-[entering]:duration-400",
  "data-[entering]:ease-[cubic-bezier(0.16,1,0.3,1)]",
  "data-[exiting]:duration-200",
  "data-[exiting]:ease-[cubic-bezier(0.7,0,0.84,0)]",
].join(" ");

const KINEMATIC_CONTAINER = [
  "data-[entering]:animate-in",
  "data-[entering]:fade-in-0",
  "data-[entering]:zoom-in-95",
  "data-[entering]:duration-400",
  "data-[entering]:ease-[cubic-bezier(0.16,1,0.3,1)]",
  "data-[exiting]:animate-out",
  "data-[exiting]:fade-out-0",
  "data-[exiting]:zoom-out-95",
  "data-[exiting]:duration-200",
  "data-[exiting]:ease-[cubic-bezier(0.7,0,0.84,0)]",
].join(" ");

const FLUID_BACKDROP = [
  "data-[entering]:duration-500",
  "data-[entering]:ease-[cubic-bezier(0.25,1,0.5,1)]",
  "data-[exiting]:duration-200",
  "data-[exiting]:ease-[cubic-bezier(0.5,0,0.75,0)]",
].join(" ");

const FLUID_CONTAINER = [
  "data-[entering]:animate-in",
  "data-[entering]:fade-in-0",
  "data-[entering]:slide-in-from-bottom-4",
  "data-[entering]:duration-500",
  "data-[entering]:ease-[cubic-bezier(0.25,1,0.5,1)]",
  "data-[exiting]:animate-out",
  "data-[exiting]:fade-out-0",
  "data-[exiting]:slide-out-to-bottom-2",
  "data-[exiting]:duration-200",
  "data-[exiting]:ease-[cubic-bezier(0.5,0,0.75,0)]",
].join(" ");

export const CustomAnimations: Story = {
  render: () => ({
    components,
    setup: () => ({
      animations: [
        {
          backdrop: KINEMATIC_BACKDROP,
          container: KINEMATIC_CONTAINER,
          description:
            "Physics-based elastic scaling. Simulates a high-damping spring system with fast transient response and prolonged settling time. Ideal for Modals and Popovers.",
          icon: "sparkles",
          name: "Kinematic Scale",
        },
        {
          backdrop: FLUID_BACKDROP,
          container: FLUID_CONTAINER,
          description:
            "Simulates movement through a medium with fluid resistance. Eliminates mechanical linearity for a natural, grounded feel. Perfect for Bottom Sheets or Toasts.",
          icon: "arrow-up-from-line",
          name: "Fluid Slide",
        },
      ],
    }),
    template: `
      <div class="flex flex-wrap gap-4">
        <Modal v-for="animation in animations" :key="animation.name">
          <Button variant="secondary">{{ animation.name }}</Button>
          <ModalBackdrop :class="animation.backdrop">
            <ModalContainer :class="animation.container">
              <ModalDialog class="sm:max-w-[360px]">
                <ModalCloseTrigger />
                <ModalHeader>
                  <ModalIcon class="bg-default text-foreground">
                    <IconSparkles v-if="animation.icon === 'sparkles'" class="size-5" />
                    <IconArrowUpFromLine v-else class="size-5" />
                  </ModalIcon>
                  <ModalHeading>{{ animation.name }} Animation</ModalHeading>
                </ModalHeader>
                <ModalBody>
                  <p class="mt-1">{{ animation.description }}</p>
                </ModalBody>
                <ModalFooter>
                  <ModalClose><Button variant="tertiary">Close</Button></ModalClose>
                  <ModalClose><Button>Try Again</Button></ModalClose>
                </ModalFooter>
              </ModalDialog>
            </ModalContainer>
          </ModalBackdrop>
        </Modal>
      </div>
    `,
  }),
};

export const CustomPortal: Story = {
  render: () => ({
    components,
    setup: () => {
      const portalContainer = shallowRef<HTMLElement | null>(null);

      const setPortal = (element: unknown) => {
        portalContainer.value = (element as HTMLElement | null) ?? null;
      };

      return { portalContainer, setPortal };
    },
    template: `
      <div class="flex flex-col gap-4">
        <div>
          <p class="text-sm">
            Render modals inside a custom container instead of <code>document.body</code>
          </p>
          <p class="text-sm text-muted">
            Apply <code class="rounded px-1 py-0.5 text-xs">transform: translateZ(0)</code> to the
            container to create a new stacking context.
          </p>
        </div>
        <div
          :ref="setPortal"
          class="relative flex h-[380px] items-center justify-center overflow-hidden rounded bg-muted/20"
          style="transform: translate(0)"
        >
          <Modal v-if="portalContainer">
            <Button>Open Modal</Button>
            <ModalBackdrop class="h-full" :portal-container="portalContainer">
              <ModalContainer class="h-full max-h-full">
                <ModalDialog class="h-full max-h-full sm:max-w-md">
                  <ModalCloseTrigger />
                  <ModalHeader>
                    <ModalHeading>Custom Portal</ModalHeading>
                  </ModalHeader>
                  <ModalBody>
                    <p class="text-sm text-muted">
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
                      incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis
                      nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                    </p>
                    <p class="text-sm text-muted">
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
                      incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis
                      nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                    </p>
                    <p class="text-sm text-muted">
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
                      incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis
                      nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                    </p>
                  </ModalBody>
                  <ModalFooter>
                    <ModalClose><Button variant="secondary">Close</Button></ModalClose>
                  </ModalFooter>
                </ModalDialog>
              </ModalContainer>
            </ModalBackdrop>
          </Modal>
        </div>
      </div>
    `,
  }),
};
