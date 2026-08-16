<script setup lang="ts" vapor>
import type {HeadingProps, ParagraphProps, TypographyRootProps} from "@/components/typography";

import {Code, Heading, Paragraph, Prose, TypographyRoot} from "@/components/typography";

const props = defineProps<
  TypographyRootProps &
    HeadingProps &
    ParagraphProps & {
      mode?: "root" | "heading" | "paragraph" | "code" | "prose";
    }
>();
</script>

<template>
  <Heading
    v-if="props.mode === 'heading'"
    :align="props.align"
    :class="props.class"
    :color="props.color"
    data-foo="bar"
    :level="props.level"
    :truncate="props.truncate"
    :weight="props.weight"
  >
    Section title
  </Heading>
  <Paragraph
    v-else-if="props.mode === 'paragraph'"
    :class="props.class"
    data-foo="bar"
    :size="props.size"
  >
    Body copy
  </Paragraph>
  <Code v-else-if="props.mode === 'code'" :class="props.class" data-foo="bar"> const x = 1; </Code>
  <Prose v-else-if="props.mode === 'prose'" :class="props.class" data-foo="bar">
    <h2>Prose heading</h2>
    <p>Prose content</p>
  </Prose>
  <TypographyRoot
    v-else
    :align="props.align"
    :class="props.class"
    :color="props.color"
    data-foo="bar"
    :truncate="props.truncate"
    :type="props.type"
    :weight="props.weight"
  >
    HeroUI Typography
  </TypographyRoot>
</template>
