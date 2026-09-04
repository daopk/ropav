import type { Meta, StoryObj } from "@storybook/vue3-vite";

import { shallowRef } from "vue";
import IconArrowUpFromLine from "~icons/gravity-ui/arrow-up-from-line";
import IconCircleInfo from "~icons/gravity-ui/circle-info";
import IconLockOpen from "~icons/gravity-ui/lock-open";
import IconRocket from "~icons/gravity-ui/rocket";
import IconSparkles from "~icons/gravity-ui/sparkles";
import IconTrashBin from "~icons/gravity-ui/trash-bin";
import IconTriangleExclamation from "~icons/gravity-ui/triangle-exclamation";

import { useOverlayTriggerState } from "../../composables/use-overlay-trigger-state";
import { Button } from "../button";

import AlertDialogBackdrop from "./alert-dialog-backdrop.vue";
import AlertDialogBody from "./alert-dialog-body.vue";
import AlertDialogCloseTrigger from "./alert-dialog-close-trigger.vue";
import AlertDialogClose from "./alert-dialog-close.vue";
import AlertDialogContainer from "./alert-dialog-container.vue";
import AlertDialogDialog from "./alert-dialog-dialog.vue";
import AlertDialogFooter from "./alert-dialog-footer.vue";
import AlertDialogHeader from "./alert-dialog-header.vue";
import AlertDialogHeading from "./alert-dialog-heading.vue";
import AlertDialogIcon from "./alert-dialog-icon.vue";
import AlertDialogRoot from "./alert-dialog-root.vue";
import AlertDialogTrigger from "./alert-dialog-trigger.vue";

// Registered under flat names: a story template is compiled at runtime with no binding metadata, so
// a dotted tag would be looked up as a component literally named "AlertDialogDialog".
const components = {
  AlertDialog: AlertDialogRoot,
  AlertDialogBackdrop,
  AlertDialogBody,
  AlertDialogClose,
  AlertDialogCloseTrigger,
  AlertDialogContainer,
  AlertDialogDialog,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogHeading,
  AlertDialogIcon,
  AlertDialogTrigger,
  Button: Button,
  IconArrowUpFromLine,
  IconCircleInfo,
  IconLockOpen,
  IconRocket,
  IconSparkles,
  IconTrashBin,
  IconTriangleExclamation,
};

const meta = {
  parameters: { layout: "centered" },
  title: "Components/Overlays/AlertDialog",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components,
    template: `
      <AlertDialog>
        <Button variant="danger">Delete Project</Button>
        <AlertDialogBackdrop>
          <AlertDialogContainer>
            <AlertDialogDialog class="sm:max-w-[400px]">
              <AlertDialogCloseTrigger />
              <AlertDialogHeader>
                <AlertDialogIcon status="danger" />
                <AlertDialogHeading>Delete project permanently?</AlertDialogHeading>
              </AlertDialogHeader>
              <AlertDialogBody>
                <p>
                  This will permanently delete <strong>My Awesome Project</strong> and all of its
                  data. This action cannot be undone.
                </p>
              </AlertDialogBody>
              <AlertDialogFooter>
                <AlertDialogClose><Button variant="tertiary">Cancel</Button></AlertDialogClose>
                <AlertDialogClose><Button variant="danger">Delete Project</Button></AlertDialogClose>
              </AlertDialogFooter>
            </AlertDialogDialog>
          </AlertDialogContainer>
        </AlertDialogBackdrop>
      </AlertDialog>
    `,
  }),
};

export const Statuses: Story = {
  render: () => ({
    components,
    setup: () => ({
      examples: [
        {
          body: "You'll need to sign in again to access your account. Any unsaved changes will be lost.",
          cancel: "Stay Signed In",
          classNames: "bg-accent-soft text-accent-soft-foreground",
          confirm: "Sign Out",
          header: "Sign out of your account?",
          status: "accent",
          trigger: "Sign Out",
        },
        {
          body: "This will mark the task as complete and notify all team members. The task will be moved to your completed list.",
          cancel: "Not Yet",
          classNames: "bg-success-soft text-success-soft-foreground",
          confirm: "Mark Complete",
          header: "Complete this task?",
          status: "success",
          trigger: "Complete Task",
        },
        {
          body: "You have unsaved changes that will be permanently lost. Are you sure you want to discard them?",
          cancel: "Keep Editing",
          classNames: "bg-warning-soft text-warning-soft-foreground",
          confirm: "Discard",
          header: "Discard unsaved changes?",
          status: "warning",
          trigger: "Discard Changes",
        },
        {
          body: "This will permanently delete your account and remove all your data from our servers. This action is irreversible.",
          cancel: "Cancel",
          classNames: "bg-danger-soft text-danger-soft-foreground",
          confirm: "Delete Account",
          header: "Delete your account?",
          status: "danger",
          trigger: "Delete Account",
        },
      ] as const,
    }),
    template: `
      <div class="flex flex-wrap gap-4">
        <AlertDialog v-for="example in examples" :key="example.status">
          <Button :class="example.classNames">{{ example.trigger }}</Button>
          <AlertDialogBackdrop>
            <AlertDialogContainer>
              <AlertDialogDialog class="sm:max-w-[400px]">
                <AlertDialogCloseTrigger />
                <AlertDialogHeader>
                  <AlertDialogIcon :status="example.status" />
                  <AlertDialogHeading>{{ example.header }}</AlertDialogHeading>
                </AlertDialogHeader>
                <AlertDialogBody>
                  <p>{{ example.body }}</p>
                </AlertDialogBody>
                <AlertDialogFooter>
                  <AlertDialogClose>
                    <Button variant="tertiary">{{ example.cancel }}</Button>
                  </AlertDialogClose>
                  <AlertDialogClose>
                    <Button :variant="example.status === 'danger' ? 'danger' : 'primary'">
                      {{ example.confirm }}
                    </Button>
                  </AlertDialogClose>
                </AlertDialogFooter>
              </AlertDialogDialog>
            </AlertDialogContainer>
          </AlertDialogBackdrop>
        </AlertDialog>
      </div>
    `,
  }),
};

export const Placements: Story = {
  render: () => ({
    components,
    setup: () => ({ placements: ["auto", "top", "center", "bottom"] as const }),
    template: `
      <div class="flex flex-wrap gap-4">
        <AlertDialog v-for="placement in placements" :key="placement">
          <Button variant="secondary">
            {{ placement.charAt(0).toUpperCase() + placement.slice(1) }}
          </Button>
          <AlertDialogBackdrop>
            <AlertDialogContainer :placement="placement">
              <AlertDialogDialog class="sm:max-w-[400px]">
                <AlertDialogCloseTrigger />
                <AlertDialogHeader>
                  <AlertDialogIcon status="accent" />
                  <AlertDialogHeading>
                    {{
                      placement === "auto"
                        ? "Auto Placement"
                        : placement.charAt(0).toUpperCase() + placement.slice(1) + " Position"
                    }}
                  </AlertDialogHeading>
                </AlertDialogHeader>
                <AlertDialogBody>
                  <p>
                    {{
                      placement === "auto"
                        ? "Automatically positions at the bottom on mobile and center on desktop for optimal user experience."
                        : "This dialog is positioned at the " + placement + " of the viewport. Critical confirmations are typically centered for maximum attention."
                    }}
                  </p>
                </AlertDialogBody>
                <AlertDialogFooter>
                  <AlertDialogClose><Button variant="tertiary">Cancel</Button></AlertDialogClose>
                  <AlertDialogClose><Button>Confirm</Button></AlertDialogClose>
                </AlertDialogFooter>
              </AlertDialogDialog>
            </AlertDialogContainer>
          </AlertDialogBackdrop>
        </AlertDialog>
      </div>
    `,
  }),
};

export const Sizes: Story = {
  render: () => ({
    components,
    setup: () => ({ sizes: ["xs", "sm", "md", "lg", "cover"] as const }),
    template: `
      <div class="flex flex-wrap gap-4">
        <AlertDialog v-for="size in sizes" :key="size">
          <Button variant="secondary">{{ size.charAt(0).toUpperCase() + size.slice(1) }}</Button>
          <AlertDialogBackdrop>
            <AlertDialogContainer :size="size">
              <AlertDialogDialog>
                <AlertDialogCloseTrigger />
                <AlertDialogHeader>
                  <AlertDialogIcon class="bg-default text-foreground">
                    <IconRocket class="size-5" />
                  </AlertDialogIcon>
                  <AlertDialogHeading>
                    Size: {{ size.charAt(0).toUpperCase() + size.slice(1) }}
                  </AlertDialogHeading>
                </AlertDialogHeader>
                <AlertDialogBody>
                  <p v-if="size === 'cover'">
                    This alert dialog uses the <code>cover</code> size variant. It spans the full
                    screen with margins: 16px on mobile and 40px on desktop. Maintains rounded
                    corners and standard padding. Perfect for critical confirmations that need
                    maximum width while preserving alert dialog aesthetics.
                  </p>
                  <p v-else>
                    This alert dialog uses the <code>{{ size }}</code> size variant. On mobile
                    devices, all sizes adapt to near full-width for optimal viewing. On desktop,
                    each size provides a different maximum width to suit various content needs.
                  </p>
                </AlertDialogBody>
                <AlertDialogFooter>
                  <AlertDialogClose><Button variant="tertiary">Cancel</Button></AlertDialogClose>
                  <AlertDialogClose><Button>Confirm</Button></AlertDialogClose>
                </AlertDialogFooter>
              </AlertDialogDialog>
            </AlertDialogContainer>
          </AlertDialogBackdrop>
        </AlertDialog>
      </div>
    `,
  }),
};

export const BackdropVariants: Story = {
  render: () => ({
    components,
    setup: () => ({
      copy: {
        blur: "A blurred backdrop that softly obscures the background while maintaining visual context.",
        opaque:
          "An opaque dark backdrop that completely obscures the background, providing maximum focus on the dialog.",
        transparent:
          "A transparent backdrop that keeps the background fully visible, useful for less critical confirmations.",
      } as Record<string, string>,
      variants: ["opaque", "blur", "transparent"] as const,
    }),
    template: `
      <div class="flex flex-wrap gap-4">
        <AlertDialog v-for="variant in variants" :key="variant">
          <Button variant="secondary">
            {{ variant.charAt(0).toUpperCase() + variant.slice(1) }}
          </Button>
          <AlertDialogBackdrop :variant="variant">
            <AlertDialogContainer>
              <AlertDialogDialog class="sm:max-w-[400px]">
                <AlertDialogCloseTrigger />
                <AlertDialogHeader>
                  <AlertDialogIcon status="accent" />
                  <AlertDialogHeading>
                    Backdrop: {{ variant.charAt(0).toUpperCase() + variant.slice(1) }}
                  </AlertDialogHeading>
                </AlertDialogHeader>
                <AlertDialogBody>
                  <p>{{ copy[variant] }}</p>
                </AlertDialogBody>
                <AlertDialogFooter>
                  <AlertDialogClose><Button variant="tertiary">Cancel</Button></AlertDialogClose>
                  <AlertDialogClose><Button>Confirm</Button></AlertDialogClose>
                </AlertDialogFooter>
              </AlertDialogDialog>
            </AlertDialogContainer>
          </AlertDialogBackdrop>
        </AlertDialog>
      </div>
    `,
  }),
};

export const CustomIcon: Story = {
  render: () => ({
    components,
    template: `
      <AlertDialog>
        <Button variant="secondary">Reset Password</Button>
        <AlertDialogBackdrop>
          <AlertDialogContainer>
            <AlertDialogDialog class="sm:max-w-[400px]">
              <AlertDialogCloseTrigger />
              <AlertDialogHeader>
                <AlertDialogIcon status="warning">
                  <IconLockOpen class="size-5" />
                </AlertDialogIcon>
                <AlertDialogHeading>Reset your password?</AlertDialogHeading>
              </AlertDialogHeader>
              <AlertDialogBody>
                <p>
                  We'll send a password reset link to your email address. You'll need to create a
                  new password to regain access to your account.
                </p>
              </AlertDialogBody>
              <AlertDialogFooter>
                <AlertDialogClose><Button variant="tertiary">Cancel</Button></AlertDialogClose>
                <AlertDialogClose><Button>Send Reset Link</Button></AlertDialogClose>
              </AlertDialogFooter>
            </AlertDialogDialog>
          </AlertDialogContainer>
        </AlertDialogBackdrop>
      </AlertDialog>
    `,
  }),
};

export const CustomBackdrop: Story = {
  render: () => ({
    components,
    template: `
      <AlertDialog>
        <Button variant="danger">Delete Account</Button>
        <AlertDialogBackdrop
          class="bg-linear-to-t from-red-950/90 via-red-950/50 to-transparent dark:from-red-950/95 dark:via-red-950/60"
          variant="blur"
        >
          <AlertDialogContainer>
            <AlertDialogDialog class="sm:max-w-[420px]">
              <AlertDialogCloseTrigger />
              <AlertDialogHeader class="items-center text-center">
                <AlertDialogIcon status="danger">
                  <IconTriangleExclamation class="size-5" />
                </AlertDialogIcon>
                <AlertDialogHeading>Permanently delete your account?</AlertDialogHeading>
              </AlertDialogHeader>
              <AlertDialogBody>
                <p>
                  This action cannot be undone. All your data, settings, and content will be
                  permanently removed from our servers. The dramatic red backdrop emphasizes the
                  severity and irreversibility of this decision.
                </p>
              </AlertDialogBody>
              <AlertDialogFooter class="flex-col-reverse">
                <AlertDialogClose><Button class="w-full">Keep Account</Button></AlertDialogClose>
                <AlertDialogClose>
                  <Button class="w-full" variant="danger">Delete Forever</Button>
                </AlertDialogClose>
              </AlertDialogFooter>
            </AlertDialogDialog>
          </AlertDialogContainer>
        </AlertDialogBackdrop>
      </AlertDialog>
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
            Controls whether the alert dialog can be dismissed by clicking the overlay backdrop.
            Alert dialogs typically require explicit action, so this defaults to
            <code>false</code>. Set to <code>true</code> for less critical confirmations.
          </p>
          <AlertDialog>
            <Button variant="secondary">Open Alert Dialog</Button>
            <AlertDialogBackdrop :is-dismissable="false">
              <AlertDialogContainer>
                <AlertDialogDialog class="sm:max-w-[400px]">
                  <AlertDialogCloseTrigger />
                  <AlertDialogHeader>
                    <AlertDialogIcon status="danger">
                      <IconCircleInfo class="size-5" />
                    </AlertDialogIcon>
                    <AlertDialogHeading>isDismissable = false</AlertDialogHeading>
                    <p class="text-sm leading-5 text-muted">
                      Clicking the backdrop won't close this alert dialog
                    </p>
                  </AlertDialogHeader>
                  <AlertDialogBody>
                    <p>
                      Try clicking outside this alert dialog on the overlay - it won't close. You
                      must use the action buttons to dismiss it.
                    </p>
                  </AlertDialogBody>
                  <AlertDialogFooter>
                    <AlertDialogClose><Button variant="tertiary">Cancel</Button></AlertDialogClose>
                    <AlertDialogClose><Button>Confirm</Button></AlertDialogClose>
                  </AlertDialogFooter>
                </AlertDialogDialog>
              </AlertDialogContainer>
            </AlertDialogBackdrop>
          </AlertDialog>
        </div>

        <div class="flex flex-col gap-2">
          <h3 class="text-lg font-semibold">isKeyboardDismissDisabled</h3>
          <p class="text-sm text-muted">
            Controls whether the ESC key can dismiss the alert dialog. Alert dialogs typically
            require explicit action, so this defaults to <code>true</code>. When set to
            <code>false</code>, the ESC key will be enabled.
          </p>
          <AlertDialog>
            <Button variant="secondary">Open Alert Dialog</Button>
            <AlertDialogBackdrop is-keyboard-dismiss-disabled>
              <AlertDialogContainer>
                <AlertDialogDialog class="sm:max-w-[400px]">
                  <AlertDialogCloseTrigger />
                  <AlertDialogHeader>
                    <AlertDialogIcon status="accent">
                      <IconCircleInfo class="size-5" />
                    </AlertDialogIcon>
                    <AlertDialogHeading>isKeyboardDismissDisabled = true</AlertDialogHeading>
                    <p class="text-sm leading-5 text-muted">ESC key is disabled</p>
                  </AlertDialogHeader>
                  <AlertDialogBody>
                    <p>
                      Press ESC - nothing happens. You must use the action buttons to dismiss this
                      alert dialog.
                    </p>
                  </AlertDialogBody>
                  <AlertDialogFooter>
                    <AlertDialogClose><Button variant="tertiary">Cancel</Button></AlertDialogClose>
                    <AlertDialogClose><Button>Confirm</Button></AlertDialogClose>
                  </AlertDialogFooter>
                </AlertDialogDialog>
              </AlertDialogContainer>
            </AlertDialogBackdrop>
          </AlertDialog>
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
          <h3 class="text-lg font-semibold">Using AlertDialogClose</h3>
          <p class="text-sm text-muted">
            The simplest way to close a dialog. Wrap any Button in
            <code>AlertDialogClose</code>. When clicked, it will automatically close the dialog.
          </p>
          <AlertDialog>
            <Button variant="secondary">Open Dialog</Button>
            <AlertDialogBackdrop>
              <AlertDialogContainer>
                <AlertDialogDialog class="sm:max-w-[400px]">
                  <AlertDialogHeader>
                    <AlertDialogIcon status="accent" />
                    <AlertDialogHeading>Using AlertDialogClose</AlertDialogHeading>
                  </AlertDialogHeader>
                  <AlertDialogBody>
                    <p>
                      Click either button below - both are wrapped in
                      <code>AlertDialogClose</code> and will close the dialog automatically.
                    </p>
                  </AlertDialogBody>
                  <AlertDialogFooter>
                    <AlertDialogClose><Button variant="tertiary">Cancel</Button></AlertDialogClose>
                    <AlertDialogClose><Button>Confirm</Button></AlertDialogClose>
                  </AlertDialogFooter>
                </AlertDialogDialog>
              </AlertDialogContainer>
            </AlertDialogBackdrop>
          </AlertDialog>
        </div>

        <div class="flex flex-col gap-2">
          <h3 class="text-lg font-semibold">Using the Dialog's slot</h3>
          <p class="text-sm text-muted">
            Take <code>close</code> from the dialog's own slot. This gives you full control over
            when and how to close the dialog, allowing you to add custom logic before closing.
          </p>
          <AlertDialog>
            <Button variant="secondary">Open Dialog</Button>
            <AlertDialogBackdrop>
              <AlertDialogContainer>
                <AlertDialogDialog v-slot="{close}" class="sm:max-w-[400px]">
                  <AlertDialogHeader>
                    <AlertDialogIcon status="success" />
                    <AlertDialogHeading>Using the Dialog's slot</AlertDialogHeading>
                  </AlertDialogHeader>
                  <AlertDialogBody>
                    <p>
                      The buttons below use the <code>close</code> the dialog hands to its slot. You
                      can add validation or other logic before calling <code>close()</code>.
                    </p>
                  </AlertDialogBody>
                  <AlertDialogFooter>
                    <Button variant="tertiary" @click="close()">Cancel</Button>
                    <Button @click="close()">Confirm</Button>
                  </AlertDialogFooter>
                </AlertDialogDialog>
              </AlertDialogContainer>
            </AlertDialogBackdrop>
          </AlertDialog>
        </div>
      </div>
    `,
  }),
};

export const Controlled: Story = {
  render: () => ({
    components,
    /**
     * Written around the root rather than a standalone backdrop.
     *
     * The backdrop reads its slots, its state and the trigger's identity from the root, so it is a
     * part rather than a component of its own — which is also why the second half can hand the root
     * an externally held state instead of a pair of props.
     */
    setup: () => {
      const isOpen = shallowRef(false);
      const state = useOverlayTriggerState({});

      return { isOpen, state };
    },
    template: `
      <div class="flex max-w-md flex-col gap-8">
        <div class="flex flex-col gap-3">
          <h3 class="text-lg font-semibold text-foreground">With a ref</h3>
          <p class="text-sm leading-relaxed text-pretty text-muted">
            Control the alert dialog with a plain <code class="text-foreground">ref</code> for
            simple state management. Perfect for basic use cases.
          </p>
          <div class="flex flex-col items-start gap-3 rounded-2xl bg-surface p-4 shadow-sm">
            <div class="flex w-full items-center justify-between">
              <p class="text-xs text-muted">
                Status:
                <span class="font-mono font-medium text-foreground">
                  {{ isOpen ? "open" : "closed" }}
                </span>
              </p>
            </div>
            <div class="flex gap-2">
              <Button size="sm" variant="secondary" @click="isOpen = true">Open Dialog</Button>
              <Button size="sm" variant="tertiary" @click="isOpen = !isOpen">Toggle</Button>
            </div>
          </div>

          <AlertDialog :is-open="isOpen" @open-change="isOpen = $event">
            <AlertDialogBackdrop>
              <AlertDialogContainer>
                <AlertDialogDialog class="sm:max-w-[400px]">
                  <AlertDialogCloseTrigger />
                  <AlertDialogHeader>
                    <AlertDialogIcon status="accent" />
                    <AlertDialogHeading>Controlled with a ref</AlertDialogHeading>
                  </AlertDialogHeader>
                  <AlertDialogBody>
                    <p>
                      This alert dialog is controlled by a <code>ref</code>. Pass
                      <code>isOpen</code> and listen to <code>openChange</code> to manage the dialog
                      state externally.
                    </p>
                  </AlertDialogBody>
                  <AlertDialogFooter>
                    <AlertDialogClose><Button variant="tertiary">Cancel</Button></AlertDialogClose>
                    <AlertDialogClose><Button>Confirm</Button></AlertDialogClose>
                  </AlertDialogFooter>
                </AlertDialogDialog>
              </AlertDialogContainer>
            </AlertDialogBackdrop>
          </AlertDialog>
        </div>

        <div class="flex flex-col gap-3">
          <h3 class="text-lg font-semibold text-foreground">With useOverlayTriggerState()</h3>
          <p class="text-sm leading-relaxed text-pretty text-muted">
            Use the <code class="text-foreground">useOverlayTriggerState</code> composable for a
            cleaner API with convenient methods like <code>open()</code>, <code>close()</code> and
            <code>toggle()</code>.
          </p>
          <div class="flex flex-col items-start gap-3 rounded-2xl bg-surface p-4 shadow-sm">
            <div class="flex w-full items-center justify-between">
              <p class="text-xs text-muted">
                Status:
                <span class="font-mono font-medium text-foreground">
                  {{ state.isOpen.value ? "open" : "closed" }}
                </span>
              </p>
            </div>
            <div class="flex gap-2">
              <Button size="sm" variant="secondary" @click="state.open()">Open Dialog</Button>
              <Button size="sm" variant="tertiary" @click="state.toggle()">Toggle</Button>
            </div>
          </div>

          <AlertDialog :state="state">
            <AlertDialogBackdrop>
              <AlertDialogContainer>
                <AlertDialogDialog class="sm:max-w-[400px]">
                  <AlertDialogCloseTrigger />
                  <AlertDialogHeader>
                    <AlertDialogIcon status="success" />
                    <AlertDialogHeading>
                      Controlled with useOverlayTriggerState()
                    </AlertDialogHeading>
                  </AlertDialogHeader>
                  <AlertDialogBody>
                    <p>
                      The <code>useOverlayTriggerState</code> composable provides dedicated methods
                      for common operations. No need to wire callbacks by hand — just use
                      <code>state.open()</code>, <code>state.close()</code> or
                      <code>state.toggle()</code>.
                    </p>
                  </AlertDialogBody>
                  <AlertDialogFooter>
                    <AlertDialogClose><Button variant="tertiary">Cancel</Button></AlertDialogClose>
                    <AlertDialogClose><Button>Confirm</Button></AlertDialogClose>
                  </AlertDialogFooter>
                </AlertDialogDialog>
              </AlertDialogContainer>
            </AlertDialogBackdrop>
          </AlertDialog>
        </div>
      </div>
    `,
  }),
};

export const CustomTrigger: Story = {
  render: () => ({
    components,
    template: `
      <AlertDialog>
        <AlertDialogTrigger
          class="group flex items-center gap-3 rounded-2xl bg-surface p-4 shadow-xs select-none hover:bg-surface-secondary"
        >
          <div
            class="flex size-12 shrink-0 items-center justify-center rounded-xl bg-danger-soft text-danger-soft-foreground"
          >
            <IconTrashBin class="size-6" />
          </div>
          <div class="flex flex-1 flex-col gap-0.5">
            <p class="text-sm font-semibold">Delete Item</p>
            <p class="text-xs text-muted">Permanently remove this item</p>
          </div>
        </AlertDialogTrigger>
        <AlertDialogBackdrop>
          <AlertDialogContainer>
            <AlertDialogDialog class="sm:max-w-[400px]">
              <AlertDialogCloseTrigger />
              <AlertDialogHeader>
                <AlertDialogIcon status="danger">
                  <IconTrashBin class="size-5" />
                </AlertDialogIcon>
                <AlertDialogHeading>Delete this item?</AlertDialogHeading>
              </AlertDialogHeader>
              <AlertDialogBody>
                <p>
                  Use <code>AlertDialogTrigger</code> to create custom trigger elements beyond
                  standard buttons. This example shows a card-style trigger with icons and
                  descriptive text.
                </p>
              </AlertDialogBody>
              <AlertDialogFooter>
                <AlertDialogClose><Button variant="tertiary">Cancel</Button></AlertDialogClose>
                <AlertDialogClose><Button variant="danger">Delete Item</Button></AlertDialogClose>
              </AlertDialogFooter>
            </AlertDialogDialog>
          </AlertDialogContainer>
        </AlertDialogBackdrop>
      </AlertDialog>
    `,
  }),
};

export const CustomAnimations: Story = {
  render: () => ({
    components,
    setup: () => ({
      animations: [
        {
          backdrop: [
            "data-[entering]:duration-400",
            "data-[entering]:ease-[cubic-bezier(0.16,1,0.3,1)]",
            "data-[exiting]:duration-200",
            "data-[exiting]:ease-[cubic-bezier(0.7,0,0.84,0)]",
          ].join(" "),
          container: [
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
          ].join(" "),
          description:
            "Physics-based elastic scaling. Simulates a high-damping spring system with fast transient response and prolonged settling time. Ideal for Alert Dialogs and Modals.",
          icon: "sparkles",
          name: "Kinematic Scale",
        },
        {
          backdrop: [
            "data-[entering]:duration-500",
            "data-[entering]:ease-[cubic-bezier(0.25,1,0.5,1)]",
            "data-[exiting]:duration-200",
            "data-[exiting]:ease-[cubic-bezier(0.5,0,0.75,0)]",
          ].join(" "),
          container: [
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
          ].join(" "),
          description:
            "Simulates movement through a medium with fluid resistance. Eliminates mechanical linearity for a natural, grounded feel. Perfect for Bottom Sheets or Toasts.",
          icon: "arrow-up-from-line",
          name: "Fluid Slide",
        },
      ] as const,
    }),
    template: `
      <div class="flex flex-wrap gap-4">
        <AlertDialog v-for="animation in animations" :key="animation.name">
          <Button variant="secondary">{{ animation.name }}</Button>
          <AlertDialogBackdrop :class="animation.backdrop">
            <AlertDialogContainer :class="animation.container">
              <AlertDialogDialog class="sm:max-w-[400px]">
                <AlertDialogCloseTrigger />
                <AlertDialogHeader>
                  <AlertDialogIcon status="accent">
                    <IconSparkles v-if="animation.icon === 'sparkles'" class="size-5" />
                    <IconArrowUpFromLine v-else class="size-5" />
                  </AlertDialogIcon>
                  <AlertDialogHeading>{{ animation.name }} Animation</AlertDialogHeading>
                </AlertDialogHeader>
                <AlertDialogBody>
                  <p class="mt-1">{{ animation.description }}</p>
                </AlertDialogBody>
                <AlertDialogFooter>
                  <AlertDialogClose><Button variant="tertiary">Close</Button></AlertDialogClose>
                  <AlertDialogClose><Button>Try Again</Button></AlertDialogClose>
                </AlertDialogFooter>
              </AlertDialogDialog>
            </AlertDialogContainer>
          </AlertDialogBackdrop>
        </AlertDialog>
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
            Render alert dialogs inside a custom container instead of <code>document.body</code>
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
          <AlertDialog v-if="portalContainer">
            <Button>Open Alert Dialog</Button>
            <AlertDialogBackdrop class="h-full" :portal-container="portalContainer">
              <AlertDialogContainer class="h-full max-h-full">
                <AlertDialogDialog class="h-full max-h-full sm:max-w-md">
                  <AlertDialogCloseTrigger />
                  <AlertDialogHeader>
                    <AlertDialogIcon status="accent" />
                    <AlertDialogHeading>Custom Portal</AlertDialogHeading>
                  </AlertDialogHeader>
                  <AlertDialogBody>
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
                  </AlertDialogBody>
                  <AlertDialogFooter>
                    <AlertDialogClose><Button variant="tertiary">Cancel</Button></AlertDialogClose>
                    <AlertDialogClose><Button>Confirm</Button></AlertDialogClose>
                  </AlertDialogFooter>
                </AlertDialogDialog>
              </AlertDialogContainer>
            </AlertDialogBackdrop>
          </AlertDialog>
        </div>
      </div>
    `,
  }),
};
