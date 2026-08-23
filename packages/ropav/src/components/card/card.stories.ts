import type {StoryMeta} from "../../utils/story-meta";
import type {StoryObj} from "@storybook/vue3";

import {shallowRef} from "vue";
import IconCircleDollar from "~icons/gravity-ui/circle-dollar";

import {avatarSrc, photoSrc} from "../../utils/story-assets";
import {Avatar, AvatarFallback, AvatarImage} from "../avatar";
import {Button} from "../button";
import {CloseButton} from "../close-button";
import {Form} from "../form";
import {Input} from "../input";
import {Label} from "../label";
import {LinkIcon, LinkRoot} from "../link";
import {TextField} from "../textfield";

import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "./index";

/**
 * Story templates are compiled at runtime, where Vue resolves a tag like `Card.Header`
 * as a component literally named "Card.Header" and fails. Dot notation only works in an
 * SFC, whose compiler resolves it against the setup scope. So the parts are registered
 * individually here — in application code `<Card.Header>` inside an SFC is fine.
 */
const components = {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  CloseButton,
  Form,
  IconCircleDollar,
  Input,
  Label,
  Link: LinkRoot,
  LinkIcon,
  TextField,
};

/** Reused by both blur overlays, which are identical apart from where they sit. */
const blurMask = {
  WebkitMaskImage: "linear-gradient(to top, black 30%, transparent)",
  maskImage: "linear-gradient(to top, black 30%, transparent)",
  maskRepeat: "no-repeat",
  maskSize: "100% 100%",
};

const meta: StoryMeta = {
  argTypes: {
    variant: {
      control: {type: "select"},
      options: ["transparent", "default", "secondary", "tertiary"],
    },
  },
  component: Card,
  parameters: {
    layout: "centered",
  },
  title: "Components/Layout/Card",
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components,
    setup: () => ({args}),
    template: `
      <Card class="w-[400px]" v-bind="args">
        <IconCircleDollar
          aria-label="Dollar sign icon"
          class="text-primary size-6"
          role="img"
        />
        <CardHeader>
          <CardTitle>Become an Acme Creator!</CardTitle>
          <CardDescription>
            Visit the Acme Creator Hub to sign up today and start earning credits from your fans and
            followers.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Link
            aria-label="Go to Acme Creator Hub (opens in new tab)"
            href="https://github.com/daopk/ropav"
            rel="noopener noreferrer"
            target="_blank"
          >
            Creator Hub
            <LinkIcon aria-hidden="true" />
          </Link>
        </CardFooter>
      </Card>
    `,
  }),
};

export const Variants: Story = {
  render: () => ({
    components,
    setup: () => ({
      variants: [
        {
          body: "Use for less important content or nested cards",
          description: "Minimal prominence with transparent background",
          title: "Transparent",
          variant: "transparent",
        },
        {
          body: "The default card variant for most use cases",
          description: "Standard card appearance (bg-surface)",
          title: "Default",
          variant: "default",
        },
        {
          body: "Use to draw moderate attention",
          description: "Medium prominence (bg-surface-secondary)",
          title: "Secondary",
          variant: "secondary",
        },
        {
          body: "Use for primary or featured content",
          description: "Higher prominence (bg-surface-tertiary)",
          title: "Tertiary",
          variant: "tertiary",
        },
      ],
    }),
    template: `
      <div class="flex flex-col gap-4">
        <Card
          v-for="item in variants"
          :key="item.variant"
          class="w-[320px]"
          :variant="item.variant"
        >
          <CardHeader>
            <CardTitle>{{ item.title }}</CardTitle>
            <CardDescription>{{ item.description }}</CardDescription>
          </CardHeader>
          <CardContent>
            <p>{{ item.body }}</p>
          </CardContent>
        </Card>
      </div>
    `,
  }),
};

export const Horizontal: Story = {
  render: (args) => ({
    components,
    setup: () => ({args, src: photoSrc("porsche", 640, 360)}),
    template: `
      <Card class="w-full items-stretch md:flex-row" v-bind="args">
        <img
          alt="Porsche 911 Golden Edition"
          class="pointer-events-none aspect-square w-full rounded-3xl object-cover select-none md:max-w-[136px]"
          loading="lazy"
          :src="src"
        />
        <div class="flex flex-1 flex-col gap-3">
          <CardHeader class="gap-1">
            <CardTitle>Get the new Porsche 911 golden edition</CardTitle>
            <CardDescription>
              Experience unmatched luxury and performance with the Porsche 911 Golden Edition—where
              sleek design meets cutting-edge tech and pure driving thrill.
            </CardDescription>
          </CardHeader>
          <CardFooter class="mt-auto flex w-full flex-row items-center justify-between">
            <div class="flex flex-col">
              <span
                aria-label="Price: 36,799 US dollars"
                class="text-sm font-medium text-foreground"
              >
                $36,799
              </span>
              <span aria-label="Available stock: 11 units" class="text-xs text-muted">
                11 available
              </span>
            </div>
            <Button>Buy Now</Button>
          </CardFooter>
        </div>
      </Card>
    `,
  }),
};

export const WithAvatar: Story = {
  render: (args) => ({
    components,
    setup: () => ({
      args,
      communities: [
        {
          alt: "Indie Hackers community",
          author: "Martha",
          avatar: avatarSrc("red"),
          avatarAlt: "Martha's avatar",
          avatarLabel: "IH",
          cover: photoSrc("demo1", 640, 360),
          members: "148 members",
          name: "Indie Hackers",
          profileLabel: "Martha's profile picture",
        },
        {
          alt: "AI Builders community",
          author: "John",
          avatar: avatarSrc("blue"),
          avatarAlt: "John's avatar - blue themed",
          avatarLabel: "B",
          cover: photoSrc("demo2", 640, 360),
          members: "362 members",
          name: "AI Builders",
          profileLabel: "John's profile picture",
        },
      ],
    }),
    template: `
      <div class="flex gap-4">
        <Card
          v-for="community in communities"
          :key="community.name"
          class="w-[200px] gap-2"
          v-bind="args"
        >
          <img
            :alt="community.alt"
            class="pointer-events-none aspect-square w-14 rounded-2xl object-cover select-none"
            loading="lazy"
            :src="community.cover"
          />
          <CardHeader>
            <CardTitle>{{ community.name }}</CardTitle>
            <CardDescription>{{ community.members }}</CardDescription>
          </CardHeader>
          <CardFooter class="flex gap-2">
            <Avatar :aria-label="community.profileLabel" class="size-5">
              <AvatarImage :alt="community.avatarAlt" :src="community.avatar" />
              <AvatarFallback class="text-xs">{{ community.avatarLabel }}</AvatarFallback>
            </Avatar>
            <span class="text-xs">By {{ community.author }}</span>
          </CardFooter>
        </Card>
      </div>
    `,
  }),
};

export const WithImages: Story = {
  parameters: {
    layout: "fullscreen",
  },
  render: (args) => ({
    components,
    setup: () => ({args, avatarSrc, blurMask, photoSrc}),
    template: `
      <div class="flex w-full items-center justify-center">
        <div class="grid w-full max-w-2xl grid-cols-12 gap-4 p-4">
          <Card class="col-span-12 flex h-auto min-h-[152px] flex-col sm:flex-row" v-bind="args">
            <div class="relative h-[140px] w-full shrink-0 overflow-hidden rounded-2xl sm:h-[120px] sm:w-[120px]">
              <img
                alt="Cherries"
                class="pointer-events-none absolute inset-0 h-full w-full scale-125 object-cover select-none"
                loading="lazy"
                :src="photoSrc('cherries', 400, 400)"
              />
            </div>
            <div class="flex flex-1 flex-col gap-3">
              <CardHeader class="gap-1">
                <CardTitle class="pe-8">Become an ACME Creator!</CardTitle>
                <CardDescription>
                  Lorem ipsum dolor sit amet consectetur. Sed arcu donec id aliquam dolor sed amet
                  faucibus etiam.
                </CardDescription>
                <CloseButton aria-label="Close banner" class="absolute end-3 top-3" />
              </CardHeader>
              <CardFooter class="mt-auto flex w-full flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div class="flex flex-col">
                  <span class="text-sm font-medium text-foreground">Only 10 spots</span>
                  <span class="text-xs text-muted">Submission ends Oct 10.</span>
                </div>
                <Button class="w-full sm:w-auto">Apply Now</Button>
              </CardFooter>
            </div>
          </Card>

          <div class="col-span-12 grid grid-cols-12 gap-4">
            <div class="col-span-12 grid grid-cols-12 gap-4 lg:col-span-6">
              <Card class="col-span-12">
                <div class="absolute end-3 top-3 z-10">
                  <CloseButton aria-label="Close notification" />
                </div>
                <CardHeader class="gap-3">
                  <IconCircleDollar
                    aria-label="Dollar sign icon"
                    class="text-primary size-8 shrink-0"
                    role="img"
                  />
                  <div class="flex flex-col gap-1">
                    <span class="text-xs font-medium text-muted uppercase">PAYMENT</span>
                    <CardTitle class="pe-8 text-sm sm:text-base">
                      You can now withdraw on crypto
                    </CardTitle>
                    <CardDescription class="text-xs sm:text-sm">
                      Add your wallet in settings to withdraw
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardFooter>
                  <Link aria-label="Go to settings" href="#" rel="noopener noreferrer">
                    Go to settings
                    <LinkIcon aria-hidden="true" />
                  </Link>
                </CardFooter>
              </Card>

              <div class="col-span-12 grid grid-cols-12 gap-4">
                <Card class="col-span-12 gap-2 sm:col-span-6">
                  <CardHeader>
                    <Avatar class="size-[56px] rounded-xl">
                      <AvatarImage alt="Demo 1" :src="photoSrc('demo1', 112, 112)" />
                      <AvatarFallback>JK</AvatarFallback>
                    </Avatar>
                  </CardHeader>
                  <CardContent class="mt-1">
                    <p class="text-sm leading-4 font-medium">Indie Hackers</p>
                    <p class="text-xs text-muted">148 members</p>
                  </CardContent>
                  <CardFooter class="flex items-center gap-2">
                    <Avatar class="size-4">
                      <AvatarImage alt="John" :src="avatarSrc('red', 64)" />
                      <AvatarFallback>JK</AvatarFallback>
                    </Avatar>
                    <p class="text-xs text-muted">By John</p>
                  </CardFooter>
                </Card>
                <Card class="col-span-12 gap-2 sm:col-span-6">
                  <CardHeader>
                    <Avatar class="size-[56px] rounded-xl">
                      <AvatarImage alt="Demo 2" :src="photoSrc('demo2', 112, 112)" />
                      <AvatarFallback>AB</AvatarFallback>
                    </Avatar>
                  </CardHeader>
                  <CardContent class="mt-1">
                    <p class="text-sm leading-4 font-medium">AI Builders</p>
                    <p class="text-xs text-muted">362 members</p>
                  </CardContent>
                  <CardFooter class="flex items-center gap-2">
                    <Avatar class="size-4">
                      <AvatarImage alt="John" :src="avatarSrc('blue', 64)" />
                      <AvatarFallback>M</AvatarFallback>
                    </Avatar>
                    <p class="text-xs text-muted">By Martha</p>
                  </CardFooter>
                </Card>
              </div>
            </div>

            <Card class="col-span-12 min-h-[200px] rounded-3xl lg:col-span-6" v-bind="args">
              <img
                alt="NEO Home Robot"
                aria-hidden="true"
                class="absolute inset-0 h-full w-full object-cover"
                :src="photoSrc('neo2', 800, 600)"
              />

              <CardHeader class="z-10 text-white">
                <CardTitle class="text-xs font-semibold tracking-wide text-black/70">
                  NEO
                </CardTitle>
                <CardDescription class="text-sm leading-5 font-medium text-black/50">
                  Home Robot
                </CardDescription>
              </CardHeader>

              <div
                aria-hidden="true"
                class="pointer-events-none absolute start-0 end-0 bottom-0 h-[64px]"
              >
                <div
                  class="absolute inset-0 h-[100%] rounded-b-[inherit] backdrop-blur-sm"
                  :style="blurMask"
                />
              </div>
              <CardFooter class="z-10 mt-auto flex items-center justify-between">
                <div>
                  <div class="text-sm font-medium text-black">Available soon</div>
                  <div class="text-xs text-black/60">Get notified</div>
                </div>
                <Button class="bg-white text-black" size="sm" variant="tertiary">
                  Notify me
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div class="col-span-12 grid grid-cols-12 gap-4">
            <Card
              class="relative col-span-12 h-[250px] sm:h-[300px] md:col-span-8 md:h-[350px]"
              v-bind="args"
            >
              <img
                alt="NEO Home Robot"
                aria-hidden="true"
                class="absolute inset-0 h-full w-full object-cover"
                :src="photoSrc('neo1', 1000, 700)"
              />

              <div
                aria-hidden="true"
                class="pointer-events-none absolute start-0 end-0 bottom-0 h-16 sm:h-20"
              >
                <div
                  class="absolute inset-0 h-[100%] rounded-b-[inherit] backdrop-blur-sm"
                  :style="blurMask"
                />
              </div>
              <CardFooter class="z-10 mt-auto flex items-end justify-between">
                <div>
                  <div class="text-base font-medium text-black sm:text-lg">NEO</div>
                  <div class="text-xs font-medium text-black/50 sm:text-sm">$499/m</div>
                </div>
                <Button class="bg-white text-black" size="sm" variant="tertiary">Get now</Button>
              </CardFooter>
            </Card>

            <div class="col-span-12 flex flex-col gap-2 md:col-span-4 md:justify-between md:gap-0">
              <Card class="flex flex-row gap-3 p-1" variant="transparent">
                <img
                  alt="Futuristic Robot"
                  class="aspect-square h-16 w-16 shrink-0 rounded-xl object-cover select-none sm:h-20 sm:w-20"
                  loading="lazy"
                  :src="photoSrc('robot1', 200, 200)"
                />
                <div class="flex flex-1 flex-col justify-center gap-1">
                  <CardTitle class="text-sm">Bridging the Future</CardTitle>
                  <CardDescription class="text-xs">Today, 6:30 PM</CardDescription>
                </div>
              </Card>
              <Card class="flex flex-row gap-3 p-1" variant="transparent">
                <img
                  alt="Avocado"
                  class="aspect-square h-16 w-16 shrink-0 rounded-xl object-cover select-none sm:h-20 sm:w-20"
                  loading="lazy"
                  :src="photoSrc('avocado', 200, 200)"
                />
                <div class="flex flex-1 flex-col justify-center gap-1">
                  <CardTitle class="text-sm">Avocado Hackathon</CardTitle>
                  <CardDescription class="text-xs">Wed, 4:30 PM</CardDescription>
                </div>
              </Card>
              <Card class="flex flex-row gap-3 p-1" variant="transparent">
                <img
                  alt="Sound Electro event"
                  class="aspect-square h-16 w-16 shrink-0 rounded-xl object-cover select-none sm:h-20 sm:w-20"
                  loading="lazy"
                  :src="photoSrc('oranges', 200, 200)"
                />
                <div class="flex flex-1 flex-col justify-center gap-1">
                  <CardTitle class="text-sm">Sound Electro | Beyond art</CardTitle>
                  <CardDescription class="text-xs">Fri, 8:00 PM</CardDescription>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    `,
  }),
};

export const WithForm: Story = {
  render: (args) => ({
    components,
    setup: () => {
      const submitted = shallowRef<string | null>(null);

      const onSubmit = (event: Event) => {
        event.preventDefault();

        const data = new FormData(event.target as HTMLFormElement);

        // Printed on screen rather than announced with `alert`, which blocks the whole tab.
        submitted.value = [...data.entries()].map(([key, value]) => key + ": " + value).join(", ");
      };

      return {args, onSubmit, submitted};
    },
    template: `
      <Card class="w-full max-w-md" v-bind="args">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <Form @submit="onSubmit">
          <CardContent>
            <div class="flex flex-col gap-4">
              <TextField name="email" type="email">
                <Label>Email</Label>
                <Input placeholder="email@example.com" variant="secondary" />
              </TextField>
              <TextField name="password" type="password">
                <Label>Password</Label>
                <Input placeholder="••••••••" variant="secondary" />
              </TextField>
            </div>
          </CardContent>
          <CardFooter class="mt-4 flex flex-col gap-2">
            <Button class="w-full" type="submit">Sign In</Button>
            <Link class="text-center text-sm" href="#">Forgot password?</Link>
            <p v-if="submitted !== null" class="text-sm text-muted">
              Form submitted — {{ submitted }}
            </p>
          </CardFooter>
        </Form>
      </Card>
    `,
  }),
};
