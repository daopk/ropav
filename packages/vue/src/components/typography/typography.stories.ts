import type {StoryMeta} from "../../utils/story-meta";
import type {StoryObj} from "@storybook/vue3";

import {Code, Heading, Paragraph, Prose, Typography} from "./index";

const components = {Code, Heading, Paragraph, Prose, Typography};

const meta: StoryMeta = {
  argTypes: {
    align: {control: {type: "select"}, options: ["start", "center", "end", "justify"]},
    color: {control: {type: "select"}, options: ["default", "muted"]},
    type: {
      control: {type: "select"},
      options: ["h1", "h2", "h3", "h4", "h5", "h6", "body", "body-sm", "body-xs", "code"],
    },
    weight: {
      control: {type: "select"},
      options: ["normal", "medium", "semibold", "bold"],
    },
  },
  component: Typography,
  parameters: {layout: "centered"},
  title: "Components/Typography",
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {type: "body"},
  render: (args) => ({
    components,
    setup: () => ({args}),
    template: `<Typography v-bind="args">HeroUI Typography</Typography>`,
  }),
};

export const HeadingScale: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex max-w-2xl flex-col gap-6">
        <Heading v-for="level in 6" :key="level" :level="level">Heading Level {{ level }}</Heading>
      </div>
    `,
  }),
};

export const BodySizes: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex max-w-2xl flex-col gap-6">
        <div>
          <Typography color="muted" type="body-xs" weight="semibold">BODY — DEFAULT (BASE)</Typography>
          <Paragraph>Until now, styling an article or document required a keen eye for typography and a lot of custom CSS.</Paragraph>
        </div>
        <div>
          <Typography color="muted" type="body-xs" weight="semibold">BODY — SMALL</Typography>
          <Paragraph size="sm">Application copy stays readable while taking less visual space.</Paragraph>
        </div>
        <div>
          <Typography color="muted" type="body-xs" weight="semibold">BODY — EXTRA SMALL</Typography>
          <Paragraph size="xs">Fine print, captions, timestamps, and secondary information.</Paragraph>
        </div>
      </div>
    `,
  }),
};

export const InlineCode: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex max-w-2xl flex-col gap-4">
        <Paragraph>Install the package with <Code>pnpm add @heroui/vue</Code> and import <Code>&lt;Typography&gt;</Code> from the library.</Paragraph>
        <Paragraph size="sm">The <Code>typographyVariants</Code> function accepts <Code>type</Code>, <Code>align</Code>, <Code>color</Code>, and <Code>weight</Code> props.</Paragraph>
      </div>
    `,
  }),
};

export const Alignment: Story = {
  render: () => ({
    components,
    setup: () => ({alignments: ["start", "center", "end", "justify"]}),
    template: `
      <div class="flex max-w-2xl flex-col gap-6">
        <div v-for="align in alignments" :key="align">
          <Typography color="muted" type="body-xs" weight="semibold">{{ align.toUpperCase() }}</Typography>
          <Typography :align="align">Text aligned to {{ align }}. Logical alignment follows the document direction automatically.</Typography>
        </div>
      </div>
    `,
  }),
};

export const WeightScale: Story = {
  render: () => ({
    components,
    setup: () => ({weights: ["normal", "medium", "semibold", "bold"]}),
    template: `
      <div class="flex max-w-2xl flex-col gap-4">
        <Typography v-for="weight in weights" :key="weight" :weight="weight">{{ weight }} weight — a useful level of emphasis.</Typography>
      </div>
    `,
  }),
};

export const MutedColor: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex max-w-2xl flex-col gap-4">
        <Heading :level="3">Account Settings</Heading>
        <Paragraph>Manage your account preferences and personal information below.</Paragraph>
        <Paragraph color="muted" size="sm">Changes may take up to 24 hours to propagate across all services.</Paragraph>
      </div>
    `,
  }),
};

export const Truncation: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex max-w-xs flex-col gap-4">
        <Typography color="muted" type="body-xs" weight="semibold">WITHOUT TRUNCATION</Typography>
        <Typography>This long piece of text wraps naturally across multiple lines in a narrow container.</Typography>
        <Typography color="muted" type="body-xs" weight="semibold">WITH TRUNCATION</Typography>
        <Typography truncate>This long piece of text is truncated with an ellipsis when it exceeds the available width.</Typography>
      </div>
    `,
  }),
};

export const ArticleExample: Story = {
  render: () => ({
    components,
    template: `
      <article class="flex max-w-2xl flex-col gap-4">
        <Heading :level="1">Crafting a Design System</Heading>
        <Paragraph color="muted" size="sm">Published May 2026 · 8 min read</Paragraph>
        <Paragraph>A design system is a shared language that unifies product teams, accelerates development, and ensures visual consistency.</Paragraph>
        <Heading :level="2">Why Typography Matters</Heading>
        <Paragraph>Typography establishes hierarchy before a user interacts with a single control.</Paragraph>
        <Heading :level="3">Building the Scale</Heading>
        <Paragraph>Start with <Code>16px</Code> and derive heading sizes using a consistent ratio.</Paragraph>
      </article>
    `,
  }),
};

export const ProseBlock: Story = {
  render: () => ({
    components,
    template: `
      <Prose class="max-w-2xl">
        <h1>Getting Started with HeroUI</h1>
        <p>HeroUI is a modern Vue component library built on <strong>Tailwind CSS v4</strong> with a compound component API.</p>
        <h2>Installation</h2>
        <p>Add the library using your preferred package manager:</p>
        <pre><code>pnpm add @heroui/vue</code></pre>
        <blockquote>Good design concentrates on the essential aspects.</blockquote>
        <h3>Key Features</h3>
        <ul><li>Accessible components</li><li>Tailwind CSS v4 styling</li><li>TypeScript-first APIs</li></ul>
        <hr />
        <p>Explore the <a href="https://heroui.com">component stories</a> for live examples.</p>
      </Prose>
    `,
  }),
};

export const CompoundPrimitives: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex max-w-xl flex-col gap-4">
        <Heading :level="1">Dashboard</Heading>
        <Paragraph>Convenience primitives are thin wrappers over Typography for explicit composition.</Paragraph>
        <Heading :level="4">Recent Activity</Heading>
        <Paragraph color="muted" size="sm">No new notifications. Check back later for updates.</Paragraph>
      </div>
    `,
  }),
};
