import type {StoryMeta} from "../../utils/story-meta";
import type {StoryObj} from "@storybook/vue3";

import {computed, shallowRef} from "vue";

import {Button} from "../button";
import {
  Disclosure,
  DisclosureBody,
  DisclosureContent,
  DisclosureHeading,
  DisclosureIndicator,
} from "../disclosure";
import {Separator} from "../separator";

import {DisclosureGroup, useDisclosureGroupNavigation} from "./index";

import IconChevronDown from "~icons/gravity-ui/chevron-down";
import IconChevronUp from "~icons/gravity-ui/chevron-up";
import IconQrCode from "~icons/gravity-ui/qr-code";
import IconExpo from "~icons/logos/expo-icon";
import IconApple from "~icons/tabler/brand-apple-filled";

/**
 * The showcase trigger is an ordinary `Button` behind a wrapper of its own, which is all it
 * takes: the disclosure hands its press down through context, so anything built on `Button`
 * becomes the trigger without having to forward anything.
 */
const AppleShowcaseButton = {
  components: {Button},
  props: {isSelected: {default: false, type: Boolean}},
  template: `
    <Button
      :class="[
        'h-14 rounded-full bg-[#1e1e20] text-[17px] text-[#f5f5f7] duration-[400ms] ease-in-out-quad hover:bg-[#272729]',
        isSelected && 'bg-[#272729]',
      ]"
    >
      <slot />
    </Button>
  `,
};

/**
 * Story templates are compiled at runtime, where Vue resolves a tag like `Disclosure.Heading`
 * as a component literally named "Disclosure.Heading" and fails. Dot notation only works in an
 * SFC, whose compiler resolves it against the setup scope. So the parts are registered
 * individually here — in application code `<Disclosure.Heading>` inside an SFC is fine.
 */
const components = {
  AppleShowcaseButton,
  Button,
  Disclosure,
  DisclosureBody,
  DisclosureContent,
  DisclosureGroup,
  DisclosureHeading,
  DisclosureIndicator,
  IconApple,
  IconChevronDown,
  IconChevronUp,
  IconExpo,
  IconQrCode,
  Separator,
};

const QR_CODE_SRC =
  "https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/images/qr-code-native.png";

const NATIVE_ITEM_IDS = ["preview", "download"];

const SHOWCASE_ITEMS = [
  {
    content: "Choose from three bold finishes. iPhone 17 Pro shown in Cosmic Orange.",
    id: "colors",
    imgSrc:
      "https://www.apple.com/v/iphone-17-pro/a/images/overview/product-viewer/colors_orange__f2ug4x6ry8uq_large_2x.jpg",
    label: "Colors",
  },
  {
    content:
      "Optimized for performance and battery. Aluminum alloy is remarkably light and has exceptional thermal conductivity.",
    id: "aluminum",
    imgSrc:
      "https://www.apple.com/v/iphone-17-pro/a/images/overview/product-viewer/viewer_aluminum_endframe__fypyvk9kkg2m_large_2x.jpg",
    label: "Aluminum unibody",
  },
  {
    content:
      "Deionized water sealed inside moves heat away from the A19 Pro chip, allowing for even higher sustained performance.",
    id: "vapor-chamber",
    imgSrc:
      "https://www.apple.com/v/iphone-17-pro/a/images/overview/product-viewer/viewer_vapor_chamber_endframe__dst8qkmuys4m_large_2x.jpg",
    label: "Vapor chamber",
  },
  {
    content:
      "Protects the back of iPhone 17 Pro, making it 4x more resistant to cracks. New Ceramic Shield 2 on the front has 3x better scratch resistance.",
    id: "ceramic-shield",
    imgSrc:
      "https://www.apple.com/v/iphone-17-pro/a/images/overview/product-viewer/ceramic_shield__de0653vp43cm_large_2x.jpg",
    label: "Ceramic shield",
  },
  {
    content:
      "Our best‑ever 6.3‑inch and 6.9‑inch Super Retina XDR displays.5 Brighter. Better anti‑reflection. ProMotion up to 120Hz.",
    id: "immersive-pro-display",
    imgSrc:
      "https://www.apple.com/v/iphone-17-pro/a/images/overview/product-viewer/pro_display__c0jmzc5emcae_large_2x.jpg",
    label: "Immersive pro display",
  },
  {
    content:
      "Instantly take a photo, record video, adjust settings, and more. So you never miss a moment.",
    id: "camera-control",
    imgSrc:
      "https://www.apple.com/v/iphone-17-pro/a/images/overview/product-viewer/camera_control__cy5kilwa0kwi_large_2x.jpg",
    label: "Camera control",
  },
  {
    content:
      " A customizable fast track to your favorite feature. Long press to launch the action you want — Silent mode, Translation, Shortcuts, and more.",
    id: "action-button",
    imgSrc:
      "https://www.apple.com/v/iphone-17-pro/a/images/overview/product-viewer/viewer_action_button_startframe__bb2coc4lpj2a_large_2x.jpg",
    label: "Action button",
  },
];

const meta: StoryMeta = {
  argTypes: {
    allowsMultipleExpanded: {control: {type: "boolean"}},
    isDisabled: {control: {type: "boolean"}},
  },
  args: {
    allowsMultipleExpanded: false,
    isDisabled: false,
  },
  component: DisclosureGroup,
  parameters: {
    layout: "centered",
  },
  title: "Components/Navigation/DisclosureGroup",
};

export default meta;

type Story = StoryObj<typeof meta>;

/** The two HeroUI Native disclosures, shared by the first two stories. */
const nativeItems = `
  <Disclosure id="preview">
    <DisclosureHeading>
      <Button
        :class="['w-full border-none', !expandedKeys.has('preview') && 'bg-transparent']"
        :variant="expandedKeys.has('preview') ? 'secondary' : 'tertiary'"
      >
        <div class="flex w-full items-center justify-start gap-2">
          <IconQrCode />
          Preview HeroUI Native
        </div>
        <DisclosureIndicator class="text-muted" />
      </Button>
    </DisclosureHeading>
    <DisclosureContent>
      <DisclosureBody class="mx-2 flex flex-col items-center gap-2 p-4 text-center">
        <p class="text-sm text-muted">
          Scan this QR code with your camera app to preview the HeroUI native components.
        </p>
        <img alt="Expo Go QR Code" class="aspect-square w-full max-w-54 object-cover" :src="qrCodeSrc" />
        <p class="text-sm text-muted">Expo must be installed on your device.</p>
        <Button class="mt-4" variant="primary">
          <IconExpo class="[&_path]:fill-accent-foreground" />
          Preview on Expo Go
        </Button>
      </DisclosureBody>
    </DisclosureContent>
  </Disclosure>
  <Separator class="my-2" />
  <Disclosure id="download">
    <DisclosureHeading aria-label="Download HeroUI Native">
      <Button
        :class="['w-full border-none', !expandedKeys.has('download') && 'bg-transparent']"
        :variant="expandedKeys.has('download') ? 'secondary' : 'tertiary'"
      >
        <div class="flex w-full items-center justify-start gap-2">
          <IconApple />
          Download HeroUI Native
        </div>
        <DisclosureIndicator class="text-muted" />
      </Button>
    </DisclosureHeading>
    <DisclosureContent>
      <DisclosureBody class="mx-2 flex flex-col items-center gap-2 p-4 text-center">
        <p class="text-sm text-muted">
          Scan this QR code with your camera app to preview the HeroUI native components.
        </p>
        <img alt="Expo Go QR Code" class="aspect-square w-full max-w-54 object-cover" :src="qrCodeSrc" />
        <p class="text-sm text-muted">Expo must be installed on your device.</p>
        <Button class="mt-4" variant="primary">
          <IconApple />
          Download on App Store
        </Button>
      </DisclosureBody>
    </DisclosureContent>
  </Disclosure>
`;

export const Default: Story = {
  render: (args) => ({
    components,
    setup: () => {
      const expandedKeys = shallowRef(new Set<string | number>(["preview"]));

      return {
        args,
        expandedKeys,
        onExpandedChange: (keys: Set<string | number>) => (expandedKeys.value = keys),
        qrCodeSrc: QR_CODE_SRC,
      };
    },
    template: `
      <div class="w-full max-w-md">
        <div class="flex flex-col gap-4 rounded-3xl bg-surface p-4 shadow-surface">
          <DisclosureGroup
            :allows-multiple-expanded="args.allowsMultipleExpanded"
            :expanded-keys="expandedKeys"
            :is-disabled="args.isDisabled"
            @expanded-change="onExpandedChange"
          >
            ${nativeItems}
          </DisclosureGroup>
        </div>
      </div>
    `,
  }),
};

export const Controlled: Story = {
  render: (args) => ({
    components,
    setup: () => {
      const expandedKeys = shallowRef(new Set<string | number>(["preview"]));
      const onExpandedChange = (keys: Set<string | number>) => (expandedKeys.value = keys);

      const {isNextDisabled, isPrevDisabled, onNext, onPrevious} = useDisclosureGroupNavigation({
        expandedKeys,
        itemIds: NATIVE_ITEM_IDS,
        onExpandedChange,
      });

      return {
        args,
        expandedKeys,
        isNextDisabled,
        isPrevDisabled,
        onExpandedChange,
        onNext,
        onPrevious,
        qrCodeSrc: QR_CODE_SRC,
      };
    },
    template: `
      <div class="w-full max-w-md">
        <div class="flex flex-col gap-4 rounded-3xl bg-surface p-4 shadow-surface">
          <div class="mb-2 flex items-center justify-between">
            <h3 class="text-lg font-semibold">HeroUI Native</h3>
            <div class="flex gap-2">
              <Button
                aria-label="Previous disclosure"
                :is-disabled="isPrevDisabled"
                size="sm"
                variant="secondary"
                @click="onPrevious"
              >
                <IconChevronUp class="size-4" />
              </Button>
              <Button
                aria-label="Next disclosure"
                :is-disabled="isNextDisabled"
                size="sm"
                variant="secondary"
                @click="onNext"
              >
                <IconChevronDown class="size-4" />
              </Button>
            </div>
          </div>
          <DisclosureGroup
            :allows-multiple-expanded="args.allowsMultipleExpanded"
            :expanded-keys="expandedKeys"
            :is-disabled="args.isDisabled"
            @expanded-change="onExpandedChange"
          >
            ${nativeItems}
          </DisclosureGroup>
        </div>
      </div>
    `,
  }),
};

export const Showcase1: Story = {
  name: "Showcases/Apple iPhone 17 Pro Disclosure Group",
  render: (args) => ({
    components,
    setup: () => {
      const expandedKeys = shallowRef(new Set<string | number>(["colors"]));
      const onExpandedChange = (keys: Set<string | number>) => (expandedKeys.value = keys);

      const {isNextDisabled, isPrevDisabled, onNext, onPrevious} = useDisclosureGroupNavigation({
        expandedKeys,
        itemIds: SHOWCASE_ITEMS.map((item) => item.id),
        onExpandedChange,
      });

      return {
        args,
        expandedKeys,
        isAnyItemExpanded: computed(() => expandedKeys.value.size > 0),
        isNextDisabled,
        isPrevDisabled,
        items: SHOWCASE_ITEMS,
        onExpandedChange,
        onNext,
        onPrevious,
        /** Suppresses the transition on the way out, matching the React story. */
        transitionFor: (id: string, value: string) => (expandedKeys.value.has(id) ? value : " "),
      };
    },
    template: `
      <section class="w-full overflow-hidden bg-surface">
        <div class="flex w-full items-center gap-8 px-8 py-8">
          <div
            class="z-[1] hidden flex-col gap-5 opacity-0 sm:flex transition-all duration-300 ease-out-quad data-[expanded=true]:duration-400 translate-y-[120px] data-[expanded=true]:translate-y-0 data-[expanded=true]:opacity-100 scale-50 data-[expanded=true]:scale-100"
            :data-expanded="isAnyItemExpanded"
          >
            <Button
              aria-label="Previous disclosure"
              class="rounded-full transition-all duration-250 ease-smooth"
              is-icon-only
              :is-disabled="isPrevDisabled"
              variant="secondary"
              @click="onPrevious"
            >
              <svg class="size-8 fill-foreground" viewBox="0 0 36 36">
                <path d="m11 20c0-.3838.1465-.7676.4395-1.0605l5.5-5.5c.5854-.5859 1.5356-.5859 2.1211 0l5.5 5.5c.5859.5859.5859 1.5352 0 2.1211-.5854.5859-1.5356.5859-2.1211 0l-4.4395-4.4395-4.4395 4.4395c-.5854.5859-1.5356.5859-2.1211 0-.293-.293-.4395-.6768-.4395-1.0605z" />
              </svg>
            </Button>
            <Button
              aria-label="Next disclosure"
              class="rounded-full transition-all duration-250 ease-smooth"
              is-icon-only
              :is-disabled="isNextDisabled"
              variant="secondary"
              @click="onNext"
            >
              <svg class="size-8 fill-foreground" viewBox="0 0 36 36">
                <path d="m19.0625 22.5597 5.5-5.5076c.5854-.5854.5825-1.5323-.0039-2.1157-.5869-.5835-1.5366-.5815-2.1211.0039l-4.4375 4.4438-4.4375-4.4438c-.5845-.5854-1.5342-.5874-2.1211-.0039-.2944.2922-.4414.676-.4414 1.0598 0 .3818.1455.7637.4375 1.0559l5.5 5.5076c.2813.2815.6636.4403 1.0625.4403s.7812-.1588 1.0625-.4403z" />
              </svg>
            </Button>
          </div>
          <div class="z-[1] w-full max-w-md">
            <DisclosureGroup
              :allows-multiple-expanded="args.allowsMultipleExpanded"
              class="flex flex-col gap-y-3"
              :expanded-keys="expandedKeys"
              :is-disabled="args.isDisabled"
              @expanded-change="onExpandedChange"
            >
              <Disclosure v-for="item in items" :id="item.id" :key="item.id">
                <DisclosureHeading>
                  <AppleShowcaseButton :is-selected="expandedKeys.has(item.id)">
                    <div class="flex w-full items-center justify-start gap-3">
                      <span
                        v-if="item.id === 'colors'"
                        class="group relative size-6 rounded-lg shadow-[inset_0px_-1px_0px_0px_rgba(255,255,255,.5)]"
                        style="background-color: #f77314"
                      >
                        <span class="sr-only">Copy Cosmic Orange color</span>
                      </span>
                      <svg v-else class="size-6 flex-none" height="24" viewBox="0 0 24 24" width="24">
                        <circle cx="12" cy="12" fill="none" r="11.3" stroke="currentColor" />
                        <g fill="currentColor" stroke="none" transform="translate(7 7)">
                          <path d="m9 4h-3v-3c0-0.553-0.447-1-1-1s-1 0.447-1 1v3h-3c-0.553 0-1 0.447-1 1s0.447 1 1 1h3v3c0 0.553 0.447 1 1 1s1-0.447 1-1v-3h3c0.553 0 1-0.447 1-1s-0.447-1-1-1" />
                        </g>
                      </svg>
                      {{ item.label }}
                    </div>
                  </AppleShowcaseButton>
                </DisclosureHeading>
                <DisclosureContent class="duration-[420ms] ease-[cubic-bezier(0.95,0.05,0.795,0.035)] ease-out-quad">
                  <DisclosureBody
                    class="mt-3 flex max-w-sm flex-col items-center gap-2 rounded-2xl bg-[rgba(42,42,45,0.72)] p-7 text-start backdrop-blur-[20px]"
                    :data-expanded="expandedKeys.has(item.id)"
                  >
                    <p
                      class="text-[17px] font-light text-[#F5F5F7] translate-y-[20px] opacity-0 data-[expanded=true]:translate-y-0 data-[expanded=true]:opacity-100"
                      :data-expanded="expandedKeys.has(item.id)"
                      :style="{
                        transition: transitionFor(item.id, 'opacity 1200ms ease-out, translate 800ms cubic-bezier(0.18,0.89,0.32,1.27)'),
                        willChange: 'opacity, translate',
                      }"
                    >
                      <strong class="font-medium">{{ item.label }}</strong>.&nbsp;{{ item.content }}
                    </p>
                  </DisclosureBody>
                </DisclosureContent>
              </Disclosure>
            </DisclosureGroup>
          </div>
        </div>
        <img
          v-for="item in items"
          :key="item.id"
          :alt="item.label"
          class="pointer-events-none absolute end-[10%] top-1/2 z-[0] hidden w-full max-w-6xl -translate-y-1/2 scale-[1.5] opacity-0 lg:block translate-x-[10%] data-[selected=true]:translate-x-0 data-[selected=true]:opacity-100"
          :data-selected="expandedKeys.has(item.id)"
          :src="item.imgSrc"
          :style="{
            transition: transitionFor(item.id, 'opacity 1000ms ease-out, translate 900ms var(--ease-out-quad)'),
            willChange: 'opacity, translate',
          }"
        />
      </section>
    `,
  }),
};
