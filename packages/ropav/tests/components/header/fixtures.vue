<script setup lang="ts" vapor>
import type { HeaderProps } from "@/components/header";

import { Header } from "@/components/header";
import { provideFieldIdsContext, useFieldIds } from "@/composables/use-field-ids";

/**
 * `headingRole` stands in for a listbox or menu section, which needs its heading demoted to
 * `presentation` and reused as the group's visual label.
 */
const props = defineProps<
  HeaderProps & { headingRole?: string; text?: string; withFieldIds?: boolean }
>();

const fieldIds = useFieldIds({ headingRole: props.headingRole });

if (props.withFieldIds) provideFieldIdsContext(fieldIds.context);
</script>

<template>
  <div :aria-labelledby="fieldIds.headingId.value" role="group">
    <Header :class="props.class">{{ props.text ?? "Actions" }}</Header>
  </div>
</template>
