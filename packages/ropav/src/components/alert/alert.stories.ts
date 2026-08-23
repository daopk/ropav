import type { StoryMeta } from "../../utils/story-meta";
import type { StoryObj } from "@storybook/vue3";

import { Button } from "../button";
import { CloseButtonRoot } from "../close-button";
import { SpinnerRoot } from "../spinner";

import { Alert, AlertContent, AlertDescription, AlertIndicator, AlertTitle } from "./index";

/** Runtime-compiled stories register compound parts individually instead of using dot notation. */
const components = {
  Alert,
  AlertContent,
  AlertDescription,
  AlertIndicator,
  AlertTitle,
  Button,
  CloseButton: CloseButtonRoot,
  Spinner: SpinnerRoot,
};

const meta: StoryMeta = {
  component: Alert,
  parameters: {
    layout: "centered",
  },
  title: "Components/Feedback/Alert",
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components,
    template: `
      <div class="grid w-full max-w-xl gap-4">
        <Alert>
          <AlertIndicator />
          <AlertContent>
            <AlertTitle>New features available</AlertTitle>
            <AlertDescription>
              Check out our latest updates including dark mode support and improved accessibility
              features.
            </AlertDescription>
          </AlertContent>
        </Alert>

        <Alert status="accent">
          <AlertIndicator />
          <AlertContent>
            <AlertTitle>Update available</AlertTitle>
            <AlertDescription>
              A new version of the application is available. Please refresh to get the latest
              features and bug fixes.
            </AlertDescription>
            <Button class="mt-2 sm:hidden" size="sm" variant="primary">Refresh</Button>
          </AlertContent>
          <Button class="hidden sm:block" size="sm" variant="primary">Refresh</Button>
        </Alert>

        <Alert status="success">
          <AlertIndicator />
          <AlertContent>
            <AlertTitle>Payment successful</AlertTitle>
            <AlertDescription>
              Your payment of $49.99 has been processed. A confirmation email has been sent to your
              inbox.
            </AlertDescription>
            <Button class="mt-2 sm:hidden" size="sm" variant="secondary">View Receipt</Button>
          </AlertContent>
          <Button class="hidden sm:block" size="sm" variant="secondary">View Receipt</Button>
        </Alert>

        <Alert status="warning">
          <AlertIndicator />
          <AlertContent>
            <AlertTitle>Storage almost full</AlertTitle>
            <AlertDescription>
              You're using 90% of your storage quota. Consider upgrading your plan or removing
              unused files to avoid service interruption.
            </AlertDescription>
            <Button class="mt-2 sm:hidden" size="sm" variant="secondary">Manage Storage</Button>
          </AlertContent>
          <Button class="hidden sm:block" size="sm" variant="secondary">Manage Storage</Button>
        </Alert>

        <Alert status="danger">
          <AlertIndicator />
          <AlertContent>
            <AlertTitle>Unable to connect to server</AlertTitle>
            <AlertDescription>
              We're experiencing connection issues. Please try the following:
              <ul class="mt-2 list-inside list-disc space-y-1 text-sm">
                <li>Check your internet connection</li>
                <li>Refresh the page</li>
                <li>Clear your browser cache</li>
              </ul>
            </AlertDescription>
            <Button class="mt-2 sm:hidden" size="sm" variant="danger">Retry</Button>
          </AlertContent>
          <Button class="hidden sm:block" size="sm" variant="danger">Retry</Button>
        </Alert>

        <Alert status="success">
          <AlertIndicator />
          <AlertContent>
            <AlertTitle>Profile updated successfully</AlertTitle>
          </AlertContent>
          <CloseButton />
        </Alert>

        <Alert status="accent">
          <AlertIndicator><Spinner size="sm" /></AlertIndicator>
          <AlertContent>
            <AlertTitle>Processing your request</AlertTitle>
            <AlertDescription>
              Please wait while we sync your data. This may take a few moments.
            </AlertDescription>
          </AlertContent>
        </Alert>

        <Alert status="warning">
          <AlertIndicator />
          <AlertContent>
            <AlertTitle>Scheduled maintenance</AlertTitle>
            <AlertDescription>
              Our services will be unavailable on Sunday, March 15th from 2:00 AM to 6:00 AM UTC
              for scheduled maintenance.
            </AlertDescription>
          </AlertContent>
        </Alert>
      </div>
    `,
  }),
};
