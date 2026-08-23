import type { Meta, StoryObj } from "@storybook/vue3-vite";

import { shallowRef } from "vue";
import IconBars from "~icons/gravity-ui/bars";
import IconBell from "~icons/gravity-ui/bell";
import IconEnvelope from "~icons/gravity-ui/envelope";
import IconGear from "~icons/gravity-ui/gear";
import IconHouse from "~icons/gravity-ui/house";
import IconMagnifier from "~icons/gravity-ui/magnifier";
import IconPerson from "~icons/gravity-ui/person";

import { ButtonRoot } from "../button";
import { InputRoot } from "../input";
import { LabelRoot } from "../label";
import { TextField } from "../textfield";

import DrawerBackdrop from "./drawer-backdrop.vue";
import DrawerBody from "./drawer-body.vue";
import DrawerCloseTrigger from "./drawer-close-trigger.vue";
import DrawerClose from "./drawer-close.vue";
import DrawerContent from "./drawer-content.vue";
import DrawerDialog from "./drawer-dialog.vue";
import DrawerFooter from "./drawer-footer.vue";
import DrawerHandle from "./drawer-handle.vue";
import DrawerHeader from "./drawer-header.vue";
import DrawerHeading from "./drawer-heading.vue";
import DrawerRoot from "./drawer-root.vue";

// Registered under flat names: a story template is compiled at runtime with no binding metadata, so
// a dotted tag would be looked up as a component literally named "Drawer.Dialog".
const components = {
  Button: ButtonRoot,
  Drawer: DrawerRoot,
  DrawerBackdrop,
  DrawerBody,
  DrawerClose,
  DrawerCloseTrigger,
  DrawerContent,
  DrawerDialog,
  DrawerFooter,
  DrawerHandle,
  DrawerHeader,
  DrawerHeading,
  IconBars,
  IconBell,
  IconEnvelope,
  IconGear,
  IconHouse,
  IconMagnifier,
  IconPerson,
  Input: InputRoot,
  Label: LabelRoot,
  TextField,
};

const meta = {
  parameters: { layout: "centered" },
  title: "Components/Overlays/Drawer",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components,
    template: `
      <Drawer>
        <Button variant="secondary">Open Drawer</Button>
        <DrawerBackdrop>
          <DrawerContent>
            <DrawerDialog>
              <DrawerHandle />
              <DrawerHeader>
                <DrawerHeading>Drawer Title</DrawerHeading>
              </DrawerHeader>
              <DrawerBody>
                <p>
                  This is a bottom drawer built on the same overlay machinery as the modal. It
                  slides up from the bottom of the screen with a smooth CSS transition.
                </p>
              </DrawerBody>
              <DrawerFooter>
                <DrawerClose><Button variant="secondary">Cancel</Button></DrawerClose>
                <DrawerClose><Button>Confirm</Button></DrawerClose>
              </DrawerFooter>
            </DrawerDialog>
          </DrawerContent>
        </DrawerBackdrop>
      </Drawer>
    `,
  }),
};

export const Placements: Story = {
  render: () => ({
    components,
    setup: () => ({ placements: ["bottom", "top", "left", "right"] as const }),
    template: `
      <div class="flex flex-wrap gap-4">
        <Drawer v-for="placement in placements" :key="placement">
          <Button variant="secondary">
            {{ placement.charAt(0).toUpperCase() + placement.slice(1) }}
          </Button>
          <DrawerBackdrop>
            <DrawerContent :placement="placement">
              <DrawerDialog>
                <DrawerCloseTrigger />
                <DrawerHandle v-if="placement === 'bottom'" />
                <DrawerHeader>
                  <DrawerHeading>
                    {{ placement.charAt(0).toUpperCase() + placement.slice(1) }} Drawer
                  </DrawerHeading>
                </DrawerHeader>
                <DrawerBody>
                  <p>
                    This drawer slides in from the <strong>{{ placement }}</strong> edge of the
                    screen.
                  </p>
                </DrawerBody>
                <DrawerFooter>
                  <DrawerClose><Button variant="secondary">Cancel</Button></DrawerClose>
                  <DrawerClose><Button>Done</Button></DrawerClose>
                </DrawerFooter>
                <DrawerHandle v-if="placement === 'top'" />
              </DrawerDialog>
            </DrawerContent>
          </DrawerBackdrop>
        </Drawer>
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
        <Drawer v-for="variant in variants" :key="variant">
          <Button variant="secondary">
            {{ variant.charAt(0).toUpperCase() + variant.slice(1) }}
          </Button>
          <DrawerBackdrop :variant="variant">
            <DrawerContent>
              <DrawerDialog>
                <DrawerHandle />
                <DrawerCloseTrigger />
                <DrawerHeader>
                  <DrawerHeading>
                    Backdrop: {{ variant.charAt(0).toUpperCase() + variant.slice(1) }}
                  </DrawerHeading>
                </DrawerHeader>
                <DrawerBody>
                  <p>
                    This drawer uses the <code>{{ variant }}</code> backdrop variant.
                  </p>
                </DrawerBody>
                <DrawerFooter>
                  <DrawerClose><Button class="w-full">Close</Button></DrawerClose>
                </DrawerFooter>
              </DrawerDialog>
            </DrawerContent>
          </DrawerBackdrop>
        </Drawer>
      </div>
    `,
  }),
};

export const WithForm: Story = {
  render: () => ({
    components,
    template: `
      <Drawer>
        <Button variant="secondary">Edit Profile</Button>
        <DrawerBackdrop>
          <DrawerContent placement="right">
            <DrawerDialog>
              <DrawerCloseTrigger />
              <DrawerHeader>
                <DrawerHeading>Edit Profile</DrawerHeading>
              </DrawerHeader>
              <DrawerBody>
                <form class="flex flex-col gap-4">
                  <TextField class="w-full" name="name" type="text">
                    <Label>Name</Label>
                    <Input placeholder="Enter your name" variant="secondary" />
                  </TextField>
                  <TextField class="w-full" name="email" type="email">
                    <Label>Email</Label>
                    <Input placeholder="Enter your email" variant="secondary" />
                  </TextField>
                  <TextField class="w-full" name="bio">
                    <Label>Bio</Label>
                    <Input placeholder="Tell us about yourself" variant="secondary" />
                  </TextField>
                </form>
              </DrawerBody>
              <DrawerFooter>
                <DrawerClose><Button variant="secondary">Cancel</Button></DrawerClose>
                <DrawerClose><Button>Save Changes</Button></DrawerClose>
              </DrawerFooter>
            </DrawerDialog>
          </DrawerContent>
        </DrawerBackdrop>
      </Drawer>
    `,
  }),
};

export const WithScrollableContent: Story = {
  render: () => ({
    components,
    setup: () => ({ paragraphs: Array.from({ length: 20 }, (_, index) => index + 1) }),
    template: `
      <Drawer>
        <Button variant="secondary">Terms &amp; Conditions</Button>
        <DrawerBackdrop>
          <DrawerContent>
            <DrawerDialog>
              <DrawerHandle />
              <DrawerCloseTrigger />
              <DrawerHeader>
                <DrawerHeading>Terms &amp; Conditions</DrawerHeading>
              </DrawerHeader>
              <DrawerBody>
                <p v-for="index in paragraphs" :key="index" class="mb-3">
                  Paragraph {{ index }}: Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                  Nullam pulvinar risus non risus hendrerit venenatis. Pellentesque sit amet
                  hendrerit risus, sed porttitor quam.
                </p>
              </DrawerBody>
              <DrawerFooter>
                <DrawerClose><Button variant="secondary">Decline</Button></DrawerClose>
                <DrawerClose><Button>Accept</Button></DrawerClose>
              </DrawerFooter>
            </DrawerDialog>
          </DrawerContent>
        </DrawerBackdrop>
      </Drawer>
    `,
  }),
};

export const NavigationDrawer: Story = {
  render: () => ({
    components,
    setup: () => ({
      navItems: [
        { icon: "house", label: "Home" },
        { icon: "magnifier", label: "Search" },
        { icon: "bell", label: "Notifications" },
        { icon: "envelope", label: "Messages" },
        { icon: "person", label: "Profile" },
        { icon: "gear", label: "Settings" },
      ] as const,
    }),
    template: `
      <Drawer>
        <Button variant="secondary">
          <IconBars />
          Menu
        </Button>
        <DrawerBackdrop>
          <DrawerContent placement="left">
            <DrawerDialog>
              <DrawerCloseTrigger />
              <DrawerHeader>
                <DrawerHeading>Navigation</DrawerHeading>
              </DrawerHeader>
              <DrawerBody>
                <nav class="flex flex-col gap-1">
                  <button
                    v-for="item in navItems"
                    :key="item.label"
                    class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-default"
                    type="button"
                  >
                    <IconHouse v-if="item.icon === 'house'" class="size-5 text-muted" />
                    <IconMagnifier v-else-if="item.icon === 'magnifier'" class="size-5 text-muted" />
                    <IconBell v-else-if="item.icon === 'bell'" class="size-5 text-muted" />
                    <IconEnvelope v-else-if="item.icon === 'envelope'" class="size-5 text-muted" />
                    <IconPerson v-else-if="item.icon === 'person'" class="size-5 text-muted" />
                    <IconGear v-else class="size-5 text-muted" />
                    {{ item.label }}
                  </button>
                </nav>
              </DrawerBody>
            </DrawerDialog>
          </DrawerContent>
        </DrawerBackdrop>
      </Drawer>
    `,
  }),
};

export const NonDismissable: Story = {
  render: () => ({
    components,
    template: `
      <Drawer>
        <Button variant="secondary">Important Action</Button>
        <DrawerBackdrop :is-dismissable="false">
          <DrawerContent>
            <DrawerDialog>
              <DrawerHeader>
                <DrawerHeading>Confirm Action</DrawerHeading>
              </DrawerHeader>
              <DrawerBody>
                <p>
                  This drawer cannot be dismissed by clicking outside, and it cannot be dragged
                  away either. You must use one of the buttons below.
                </p>
              </DrawerBody>
              <DrawerFooter>
                <DrawerClose><Button variant="secondary">Cancel</Button></DrawerClose>
                <DrawerClose><Button>Confirm</Button></DrawerClose>
              </DrawerFooter>
            </DrawerDialog>
          </DrawerContent>
        </DrawerBackdrop>
      </Drawer>
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
     * part rather than a component of its own.
     */
    setup: () => ({ isOpen: shallowRef(false) }),
    template: `
      <div class="flex flex-col gap-4">
        <div class="flex items-center gap-3">
          <Button variant="secondary" @click="isOpen = true">Open Drawer</Button>
          <p class="text-sm text-muted">
            Status:
            <span class="font-mono font-medium text-foreground">
              {{ isOpen ? "open" : "closed" }}
            </span>
          </p>
        </div>

        <Drawer :is-open="isOpen" @open-change="isOpen = $event">
          <DrawerBackdrop>
            <DrawerContent placement="right">
              <DrawerDialog>
                <DrawerCloseTrigger />
                <DrawerHeader>
                  <DrawerHeading>Controlled Drawer</DrawerHeading>
                </DrawerHeader>
                <DrawerBody>
                  <p>This drawer is controlled externally, from a ref the story holds.</p>
                </DrawerBody>
                <DrawerFooter>
                  <DrawerClose><Button variant="secondary">Close</Button></DrawerClose>
                </DrawerFooter>
              </DrawerDialog>
            </DrawerContent>
          </DrawerBackdrop>
        </Drawer>
      </div>
    `,
  }),
};
