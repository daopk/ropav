import type {StoryMeta} from "../../utils/story-meta";
import type {StoryObj} from "@storybook/vue3";
import type {Component} from "vue";

import {shallowRef} from "vue";

import {Button} from "../button";

import {
  Toast,
  ToastCloseButton,
  ToastContent,
  ToastDescription,
  ToastIndicator,
  ToastProvider,
  ToastQueue,
  ToastTitle,
  toast,
} from "./index";

import IconHardDrive from "~icons/gravity-ui/hard-drive";
import IconPersons from "~icons/gravity-ui/persons";
import IconStar from "~icons/gravity-ui/star";

/** Runtime-compiled stories register compound parts individually instead of using dot notation. */
const components = {
  Button,
  Toast,
  ToastCloseButton,
  ToastContent,
  ToastDescription,
  ToastIndicator,
  ToastProvider,
  ToastTitle,
};

const PLACEMENTS = ["top start", "top", "top end", "bottom start", "bottom", "bottom end"] as const;

const meta: StoryMeta = {
  argTypes: {
    placement: {control: "radio", options: [...PLACEMENTS]},
    timeout: {control: "number"},
  },
  args: {
    placement: "bottom",
    timeout: undefined,
  },
  component: Toast,
  parameters: {
    layout: "centered",
  },
  title: "Components/Feedback/Toast",
};

export default meta;

type Story = StoryObj<typeof meta>;

const noop = () => {};

export const Default: Story = {
  render: () => ({
    components,
    setup: () => ({
      showAccent: () =>
        toast.info("You have 2 credits left", {
          actionProps: {label: "Upgrade", onPress: noop},
          description: "Get a paid plan for more credits",
        }),
      showDanger: () =>
        toast.danger("Storage is full", {
          actionProps: {label: "Remove", onPress: noop, variant: "danger"},
          description:
            "Remove files to release space. Adding more text to demonstrate longer content display",
          indicator: IconHardDrive as Component,
        }),
      showDefault: () =>
        toast("You have been invited to join a team", {
          actionProps: {label: "Dismiss", onPress: () => toast.clear(), variant: "tertiary"},
          description: "Bob sent you an invitation to join Ropav team",
          indicator: IconPersons as Component,
          variant: "default",
        }),
      showSuccess: () =>
        toast.success("You have upgraded your plan", {
          actionProps: {
            class: "bg-success text-success-foreground",
            label: "Billing",
            onPress: noop,
          },
          description: "You can continue using Ropav Chat",
        }),
      showWarning: () =>
        toast.warning("You have no credits left", {
          actionProps: {
            class: "bg-warning text-warning-foreground",
            label: "Upgrade",
            onPress: noop,
          },
          description: "Upgrade to a paid plan to continue",
        }),
    }),
    template: `
      <div class="flex h-full max-w-xl flex-col items-center justify-center">
        <ToastProvider placement="bottom" />
        <div class="flex w-full flex-wrap items-center justify-center gap-4">
          <Button class="text-muted" size="sm" variant="tertiary" @click="showDefault">
            Default toast
          </Button>
          <Button size="sm" variant="secondary" @click="showAccent">Accent toast</Button>
          <Button class="text-success" size="sm" variant="tertiary" @click="showSuccess">
            Success toast
          </Button>
          <Button class="text-warning" size="sm" variant="tertiary" @click="showWarning">
            Warning toast
          </Button>
          <Button size="sm" variant="danger-soft" @click="showDanger">Danger toast</Button>
        </div>
      </div>
    `,
  }),
};

/** One queue per placement, so each stack is independent. */
const placementQueues = Object.fromEntries(
  PLACEMENTS.map((placement) => [placement, new ToastQueue({maxVisibleToasts: 3})]),
) as Record<(typeof PLACEMENTS)[number], ToastQueue>;

export const Placements: Story = {
  render: () => ({
    components,
    setup: () => ({
      placements: PLACEMENTS,
      queueFor: (placement: (typeof PLACEMENTS)[number]) => placementQueues[placement],
      show: (placement: (typeof PLACEMENTS)[number]) => {
        placementQueues[placement].add({
          description: "Event has been created",
          title: "Event created",
          variant: "default",
        });
      },
    }),
    template: `
      <div class="flex h-full flex-col items-center justify-center gap-6">
        <ToastProvider
          v-for="placement in placements"
          :key="placement"
          :placement="placement"
          :queue="queueFor(placement)"
        />
        <div class="flex max-w-xs flex-wrap justify-center gap-2">
          <Button
            v-for="placement in placements"
            :key="placement"
            size="sm"
            variant="secondary"
            @click="show(placement)"
          >
            {{ placement }}
          </Button>
        </div>
      </div>
    `,
  }),
};

export const SimpleToast: Story = {
  render: () => ({
    components,
    setup: () => ({
      showDanger: () => toast.danger("Something went wrong"),
      showDefault: () => toast("Simple message"),
      showInfo: () => toast.info("New update available"),
      showSuccess: () => toast.success("Operation completed"),
      showWarning: () => toast.warning("Please check your settings"),
    }),
    template: `
      <div class="flex h-full max-w-xl flex-col items-center justify-center">
        <ToastProvider placement="bottom" />
        <div class="flex w-full flex-wrap items-center justify-center gap-4">
          <Button size="sm" variant="secondary" @click="showDefault">Default</Button>
          <Button size="sm" variant="secondary" @click="showSuccess">Success</Button>
          <Button size="sm" variant="secondary" @click="showInfo">Info</Button>
          <Button size="sm" variant="secondary" @click="showWarning">Warning</Button>
          <Button size="sm" variant="secondary" @click="showDanger">Error</Button>
        </div>
      </div>
    `,
  }),
};

export const PromiseToast: Story = {
  render: () => ({
    components,
    setup: () => {
      const after = <T>(value: T, delay = 2000): Promise<T> =>
        new Promise((resolve) => {
          setTimeout(() => resolve(value), delay);
        });

      const rejectAfter = (message: string, delay = 2000): Promise<never> =>
        new Promise((_resolve, reject) => {
          setTimeout(() => reject(new Error(message)), delay);
        });

      return {
        createEvent: () =>
          toast.promise(rejectAfter("Network error. Please try again."), {
            error: (error: Error) => error.message,
            loading: "Creating event...",
            success: "Event created",
          }),
        fetchUser: () =>
          toast.promise(after({email: "john@example.com", name: "John Doe"}), {
            error: "Failed to fetch user",
            loading: "Loading user...",
            success: (data: {name: string}) => `Welcome back, ${data.name}!`,
          }),
        saveData: () =>
          toast.promise(
            new Promise<{count: number}>((resolve, reject) => {
              setTimeout(() => {
                if (Math.random() > 0.5) resolve({count: 42});
                else reject(new Error("Failed to save data"));
              }, 2000);
            }),
            {
              error: (error: Error) => error.message,
              loading: "Saving changes...",
              success: (data: {count: number}) => `Saved ${data.count} items`,
            },
          ),
        uploadFile: () =>
          toast.promise(after({filename: "document.pdf", size: 1024}), {
            error: "Failed to upload file",
            loading: "Uploading file...",
            success: (data: {filename: string; size: number}) =>
              `File ${data.filename} uploaded (${data.size}KB)`,
          }),
      };
    },
    template: `
      <div class="flex h-full max-w-xl flex-col items-center justify-center">
        <ToastProvider placement="bottom" />
        <div class="flex w-full flex-wrap items-center justify-center gap-4">
          <Button size="sm" variant="secondary" @click="uploadFile">Upload file</Button>
          <Button size="sm" variant="secondary" @click="createEvent">Create event (error)</Button>
          <Button size="sm" variant="secondary" @click="saveData">Save data (random)</Button>
          <Button size="sm" variant="secondary" @click="fetchUser">Fetch user</Button>
        </div>
      </div>
    `,
  }),
};

export const CustomIndicator: Story = {
  render: () => ({
    components,
    setup: () => ({
      show: () => toast("Custom icon indicator", {indicator: IconStar as Component}),
    }),
    template: `
      <div class="flex h-full max-w-xl flex-col items-center justify-center">
        <ToastProvider placement="bottom" />
        <Button size="sm" variant="secondary" @click="show">Custom indicator</Button>
      </div>
    `,
  }),
};

export const LoadingState: Story = {
  render: () => ({
    components,
    setup: () => ({
      loadingToError: () => {
        const key = toast("Saving changes...", {isLoading: true, timeout: 0});

        setTimeout(() => {
          toast.close(key);
          toast.danger("Failed to save", {description: "Please try again"});
        }, 2000);
      },
      processPayment: () => {
        const key = toast("Processing payment...", {isLoading: true, timeout: 0});

        setTimeout(() => {
          toast.close(key);
          toast.success("Payment processed", {
            description: "Your payment has been processed successfully",
          });
        }, 2500);
      },
      uploadWithLoading: () => {
        const key = toast("Uploading file...", {
          description: "Please wait while we upload your file",
          isLoading: true,
          timeout: 0,
        });

        setTimeout(() => {
          toast.close(key);
          toast.success("File uploaded", {
            description: "Your file has been uploaded successfully",
          });
        }, 3000);
      },
    }),
    template: `
      <div class="flex h-full max-w-xl flex-col items-center justify-center">
        <ToastProvider placement="bottom" />
        <div class="flex w-full flex-wrap items-center justify-center gap-4">
          <Button size="sm" variant="secondary" @click="uploadWithLoading">
            Upload with loading
          </Button>
          <Button size="sm" variant="secondary" @click="processPayment">Payment processing</Button>
          <Button size="sm" variant="secondary" @click="loadingToError">Loading to error</Button>
        </div>
      </div>
    `,
  }),
};

export const WithCallbacks: Story = {
  render: () => ({
    components,
    setup: () => {
      const closedHistory = shallowRef<{message: string; time: string}[]>([]);

      const addToHistory = (message: string) => {
        closedHistory.value = [
          {message, time: new Date().toLocaleTimeString()},
          ...closedHistory.value,
        ].slice(0, 5);
      };

      return {
        clearHistory: () => {
          closedHistory.value = [];
        },
        closedHistory,
        showDefaultTimeout: () =>
          toast.success("Event created", {
            onClose: () => addToHistory("Event created (closed after default timeout)"),
          }),
        showLongTimeout: () =>
          toast("Changes saved", {
            onClose: () => addToHistory("Changes saved (closed after 10 seconds)"),
            timeout: 10000,
          }),
        showPersistent: () =>
          toast("Important notification", {
            description: "This toast will stay until dismissed",
            onClose: () => addToHistory("Important notification (manually closed)"),
            timeout: 0,
          }),
        showShortTimeout: () =>
          toast("File saved", {
            onClose: () => addToHistory("File saved (closed after 3 seconds)"),
            timeout: 3000,
          }),
      };
    },
    template: `
      <div class="flex h-full max-w-2xl flex-col items-center justify-center gap-6">
        <ToastProvider placement="bottom" />
        <div class="flex w-full flex-wrap items-center justify-center gap-4">
          <Button size="sm" variant="secondary" @click="showShortTimeout">
            Custom timeout (3s)
          </Button>
          <Button size="sm" variant="secondary" @click="showLongTimeout">
            Custom timeout (10s)
          </Button>
          <Button size="sm" variant="secondary" @click="showDefaultTimeout">
            With onClose callback
          </Button>
          <Button size="sm" variant="secondary" @click="showPersistent">Persistent toast</Button>
        </div>
        <div class="w-full space-y-2">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-medium">Closed History</h3>
            <Button
              v-if="closedHistory.length > 0"
              class="h-6 text-xs"
              size="sm"
              variant="tertiary"
              @click="clearHistory"
            >
              Clear
            </Button>
          </div>
          <div class="min-h-[120px] space-y-2 rounded-lg border border-border bg-surface p-4">
            <p v-if="closedHistory.length === 0" class="text-sm text-muted">
              No toasts closed yet. Try closing one above!
            </p>
            <div
              v-for="(item, index) in closedHistory"
              v-else
              :key="item.time + '-' + index"
              class="flex animate-in items-start justify-between gap-3 rounded-md border border-border bg-default px-3 py-2 text-sm duration-200 fade-in slide-in-from-top-2"
              :style="{animationDelay: (index * 50) + 'ms'}"
            >
              <div class="flex-1">
                <span class="font-medium">{{ item.message }}</span>
                <span class="ms-2 text-xs text-muted">({{ item.time }})</span>
              </div>
              <div
                class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/10 text-success"
              >
                <svg class="size-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
  }),
};

export const CustomToast: Story = {
  render: () => ({
    components,
    setup: () => {
      const customQueue = new ToastQueue();

      return {
        customQueue,
        show: () => {
          customQueue.add({
            description: "This uses a custom render function",
            title: "Custom layout toast",
            variant: "default",
          });
        },
      };
    },
    template: `
      <div class="flex h-full max-w-xl flex-col items-center justify-center">
        <ToastProvider v-slot="{toast: item}" placement="bottom" :queue="customQueue">
          <Toast class="rounded-xl border border-border" :toast="item" :variant="item.content.variant">
            <ToastContent>
              <div class="flex items-center gap-2">
                <ToastIndicator class="text-accent" :variant="item.content.variant" />
                <div class="flex flex-col pe-6">
                  <ToastTitle v-if="item.content.title" class="text-accent">
                    {{ item.content.title }}
                  </ToastTitle>
                  <ToastDescription v-if="item.content.description">
                    {{ item.content.description }}
                  </ToastDescription>
                </div>
              </div>
            </ToastContent>
            <ToastCloseButton
              class="absolute end-2 top-1/2 -translate-y-1/2 border-none bg-transparent opacity-100 [&>svg]:size-4"
            />
          </Toast>
        </ToastProvider>
        <Button size="sm" variant="secondary" @click="show">Custom toast</Button>
      </div>
    `,
  }),
};

export const CustomQueue: Story = {
  render: () => ({
    components,
    setup: () => {
      const notificationQueue = new ToastQueue({maxVisibleToasts: 2});
      const errorQueue = new ToastQueue({maxVisibleToasts: 3});
      const successQueue = new ToastQueue({maxVisibleToasts: 1});

      let successCount = 0;

      return {
        addError: () => {
          errorQueue.add({
            description: "Failed to save changes",
            title: "Error occurred",
            variant: "danger",
          });
        },
        addNotification: () => {
          notificationQueue.add({
            description: "You have a new message",
            title: "New notification",
            variant: "default",
          });
        },
        addSuccess: () => {
          successCount += 1;
          successQueue.add({
            description: `Operation ${successCount}`,
            title: "Success!",
            variant: "success",
          });
        },
        errorQueue,
        notificationQueue,
        successQueue,
      };
    },
    template: `
      <div class="flex h-full max-w-4xl items-center justify-center gap-4">
        <ToastProvider placement="bottom" :queue="notificationQueue" />
        <div class="flex justify-center gap-2">
          <Button size="sm" variant="secondary" @click="addNotification">
            Add notification (max 2)
          </Button>
        </div>
        <ToastProvider placement="top" :queue="errorQueue" />
        <div class="flex justify-center gap-2">
          <Button size="sm" variant="danger-soft" @click="addError">Add error (max 3)</Button>
        </div>
        <ToastProvider placement="bottom end" :queue="successQueue" />
        <div class="flex justify-center gap-2">
          <Button class="text-success" size="sm" variant="secondary" @click="addSuccess">
            Add success (max 1)
          </Button>
        </div>
      </div>
    `,
  }),
};
