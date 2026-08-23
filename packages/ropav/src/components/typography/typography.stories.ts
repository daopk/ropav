import type { StoryMeta } from "../../utils/story-meta";
import type { StoryObj } from "@storybook/vue3";

import { Code, Heading, Paragraph, Prose, Typography } from "./index";

const components = { Code, Heading, Paragraph, Prose, Typography };

const meta: StoryMeta = {
  argTypes: {
    align: { control: { type: "select" }, options: ["start", "center", "end", "justify"] },
    color: { control: { type: "select" }, options: ["default", "muted"] },
    type: {
      control: { type: "select" },
      options: ["h1", "h2", "h3", "h4", "h5", "h6", "body", "body-sm", "body-xs", "code"],
    },
    weight: {
      control: { type: "select" },
      options: ["normal", "medium", "semibold", "bold"],
    },
  },
  component: Typography,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  title: "Components/Typography",
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { type: "body" },
  render: (args) => ({
    components,
    setup: () => ({ args }),
    template: `<Typography v-bind="args">Ropav Typography</Typography>`,
  }),
};

export const HeadingScale: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex max-w-2xl flex-col gap-6">
        <Heading :level="1">Heading Level 1</Heading>
        <Heading :level="2">Heading Level 2</Heading>
        <Heading :level="3">Heading Level 3</Heading>
        <Heading :level="4">Heading Level 4</Heading>
        <Heading :level="5">Heading Level 5</Heading>
        <Heading :level="6">Heading Level 6</Heading>
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
          <Paragraph>
            Until now, trying to style an article, document, or blog post with Tailwind has been a
            tedious task that required a keen eye for typography and a lot of complex custom CSS.
          </Paragraph>
        </div>
        <div>
          <Typography color="muted" type="body-xs" weight="semibold">BODY — SMALL</Typography>
          <Paragraph size="sm">
            By default, Tailwind removes all of the default browser styling from paragraphs, headings,
            lists and more. This ends up being really useful for building application UIs because you
            spend less time undoing user-agent styles.
          </Paragraph>
        </div>
        <div>
          <Typography color="muted" type="body-xs" weight="semibold">BODY — EXTRA SMALL</Typography>
          <Paragraph size="xs">
            Fine print, captions, and secondary information are rendered at the smallest body size.
            This size is ideal for metadata, timestamps, or auxiliary details that should not compete
            with the primary content.
          </Paragraph>
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
        <Paragraph>
          Install the package with <Code>pnpm add ropav</Code> and import
          <Code>&lt;Typography&gt;</Code> from the library.
        </Paragraph>
        <Paragraph size="sm">The <Code>typographyVariants</Code> function accepts <Code>type</Code>, <Code>align</Code>, <Code>color</Code>, and <Code>weight</Code> props.</Paragraph>
      </div>
    `,
  }),
};

export const Alignment: Story = {
  render: () => ({
    components,
    setup: () => ({ alignments: ["start", "center", "end", "justify"] }),
    template: `
      <div class="flex max-w-2xl flex-col gap-6">
        <div v-for="align in alignments" :key="align">
          <Typography color="muted" type="body-xs" weight="semibold">
            {{ align === "start" ? "START (DEFAULT)" : align.toUpperCase() }}
          </Typography>
          <Typography v-if="align === 'start'" align="start">
            Text aligned to the start edge. In LTR layouts this means left-aligned; in RTL it flips
            automatically.
          </Typography>
          <Typography v-else-if="align === 'center'" align="center">
            Center-aligned text works well for hero sections, headings, and call-to-action blocks
            where symmetry is important.
          </Typography>
          <Typography v-else-if="align === 'end'" align="end">
            End-aligned text is useful for numerical columns, timestamps, or any content that benefits
            from right-alignment in LTR contexts.
          </Typography>
          <Typography v-else align="justify">
            Justified text stretches each line so that both left and right edges are flush. This style
            is common in print design and long-form reading experiences where a clean text block is
            desired.
          </Typography>
        </div>
      </div>
    `,
  }),
};

export const WeightScale: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex max-w-2xl flex-col gap-4">
        <Typography weight="normal">Normal weight — the browser default for body text.</Typography>
        <Typography weight="medium">Medium weight — slightly heavier for subtle emphasis.</Typography>
        <Typography weight="semibold">Semibold weight — used for subheadings and labels.</Typography>
        <Typography weight="bold">Bold weight — strong emphasis for important content.</Typography>
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
        <Paragraph color="muted" size="sm">
          Changes to your profile may take up to 24 hours to propagate across all services. Contact
          support if you need immediate assistance.
        </Paragraph>
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
        <Typography>
          This is a long piece of text that will wrap naturally across multiple lines in a narrow
          container without any truncation applied.
        </Typography>
        <Typography color="muted" type="body-xs" weight="semibold">WITH TRUNCATION</Typography>
        <Typography truncate>
          This is a long piece of text that will be truncated with an ellipsis when it exceeds the
          available width of its container.
        </Typography>
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
        <Paragraph>
          A design system is more than a collection of reusable components. It is a shared language
          that unifies product teams, accelerates development, and ensures visual consistency at every
          level of an application.
        </Paragraph>
        <Heading :level="2">Why Typography Matters</Heading>
        <Paragraph>
          Typography accounts for roughly 95% of web design. The typefaces you choose, the scale you
          define, and the rhythm you establish between headings and body text determine how users
          perceive your product before they interact with a single button or form.
        </Paragraph>
        <Paragraph>
          A well-tuned type scale creates a clear visual hierarchy. Readers can scan a page, locate
          the information they need, and absorb your content without friction.
        </Paragraph>
        <Heading :level="3">Building the Scale</Heading>
        <Paragraph>
          Start with a base size — <Code>16px</Code> (1rem) is the industry standard — and derive
          heading sizes using a consistent ratio. Ropav uses a tracking-tight heading stack from
          <Code>text-base</Code> through <Code>text-4xl</Code>, giving six levels of hierarchy.
        </Paragraph>
        <Heading :level="3">Readable Body Copy</Heading>
        <Paragraph>
          Good body text should feel effortless to read. A line height of 1.75 (Tailwind's
          <Code>leading-7</Code>) paired with a measure of roughly 65 characters keeps readers
          comfortable across long passages.
        </Paragraph>
        <Paragraph color="muted" size="sm">
          Shorter paragraphs, generous whitespace, and intentional weight contrast all contribute to
          readability. These defaults work out of the box with Ropav's Typography primitive.
        </Paragraph>
      </article>
    `,
  }),
};

export const ProseBlock: Story = {
  render: () => ({
    components,
    template: `
      <Prose class="max-w-2xl">
        <h1>Getting Started with Ropav</h1>
        <p>
          Ropav is a modern Vue component library built on top of <strong>Tailwind CSS v4</strong>
          and <strong>Vapor Mode</strong>. It provides accessible, customizable primitives that you
          can compose into complex interfaces.
        </p>
        <h2>Installation</h2>
        <p>
          Add the library to your project using your preferred package manager. The
          <code>ropav</code> package includes every component:
        </p>
        <pre><code>pnpm add ropav</code></pre>
        <h3>Quick Setup</h3>
        <p>
          Import the stylesheet in your application entry point and wrap your app with the provider:
        </p>
        <blockquote>
          Good design is as little design as possible. Less, but better — because it concentrates on
          the essential aspects, and the products are not burdened with non-essentials.
        </blockquote>
        <h3>Key Features</h3>
        <ul>
          <li>Fully accessible components following the ARIA authoring patterns</li>
          <li>Compound component API inspired by Radix UI for maximum flexibility</li>
          <li>Tailwind CSS v4 styling with BEM-inspired class naming</li>
          <li>TypeScript-first with comprehensive type exports</li>
          <li>Dark mode support out of the box via CSS custom properties</li>
        </ul>
        <h3>Component Categories</h3>
        <ol>
          <li><strong>Layout</strong> — Card, Surface, Header, Separator</li>
          <li><strong>Navigation</strong> — Tabs, Accordion, Breadcrumbs, Link, Pagination</li>
          <li><strong>Forms</strong> — TextField, Checkbox, Radio, Select, Switch</li>
          <li><strong>Feedback</strong> — Alert, Spinner, Toast, Progress, Skeleton</li>
          <li><strong>Typography</strong> — Typography, Heading, Code, Prose</li>
        </ol>
        <hr />
        <h2>Next Steps</h2>
        <p>
          Explore the <a href="https://github.com/daopk/ropav">component stories</a> in Storybook to see every
          variant and composition in action. Each component ships with comprehensive documentation and
          live examples.
        </p>
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
        <Paragraph>
          Convenience primitives are thin wrappers over Typography for explicit composition. Use
          <Code>Typography.Heading</Code>, <Code>Typography.Paragraph</Code>, and
          <Code>Typography.Code</Code> when you want the semantic element chosen automatically.
        </Paragraph>
        <Heading :level="4">Recent Activity</Heading>
        <Paragraph color="muted" size="sm">
          No new notifications. Check back later for updates on your projects and team activity.
        </Paragraph>
      </div>
    `,
  }),
};
