<template>
    <section id="settings-panel" :class="css.panel" data-testid="settings-panel">
        <Input
            v-model="name"
            aria-label="Display name"
            placeholder="Display name"
            :input-attrs="{ title: 'name-input' }"
            :class-names="{ root: css.control, input: css.input }"
        />

        <Select
            v-model="language"
            aria-label="Language"
            :options="languages"
            :class-names="{
                root: css.control,
                trigger: css.selectTrigger,
                option: css.option,
            }"
        />

        <Switch
            v-model="notifications"
            :input-attrs="{ title: 'notifications-input' }"
            :class-names="{
                root: css.switch,
                track: css.switchTrack,
                thumb: css.switchThumb,
            }"
        >
            Product notifications
        </Switch>

        <RadioGroup v-model="plan" name="plan" orientation="horizontal">
            <Radio
                value="free"
                :input-attrs="{ title: 'plan-free' }"
                :class-names="{ root: css.radio, indicator: css.radioIndicator }"
            >
                Free
            </Radio>
            <Radio
                value="pro"
                :input-attrs="{ title: 'plan-pro' }"
                :class-names="{ root: css.radio, indicator: css.radioIndicator }"
            >
                Pro
            </Radio>
        </RadioGroup>

        <Slider
            v-model="volume"
            aria-label="Notification volume"
            :marks="[0, 50, 100]"
            :input-attrs="{ title: 'volume-input' }"
            :class-names="{
                root: css.slider,
                track: css.sliderTrack,
                mark: css.sliderMark,
            }"
        />

        <div :class="css.actions">
            <Button data-testid="open-modal" @click="modalOpen = true">Review</Button>
            <Button data-testid="save-toast" variant="subtle" @click="save">Save</Button>
        </div>

        <Modal
            v-model:open="modalOpen"
            title="Review settings"
            teleport-to="#overlays"
            :class-names="{
                root: css.modal,
                panel: css.modalPanel,
                title: css.modalTitle,
            }"
            :styles="{ panel: { maxWidth: '32rem' } }"
        >
            <p>{{ name }} · {{ language }} · {{ plan }}</p>
        </Modal>
    </section>
</template>

<script lang="ts" setup vapor>
import { ref, useCssModule } from 'vue';
import { Button, Input, Modal, Radio, RadioGroup, Select, Slider, Switch, useToast } from 'ropav';

const name = ref('Dao');
const language = ref<string | number | null>('en');
const notifications = ref(false);
const plan = ref<string | number | null>('free');
const volume = ref(50);
const modalOpen = ref(false);
const css = useCssModule();
const languages = [
    { label: 'English', value: 'en' },
    { label: 'Vietnamese', value: 'vi' },
];
const toast = useToast();

function save() {
    toast.success({ title: 'Settings saved', description: `${name.value} · ${language.value}` });
}
</script>

<style module>
@layer app {
    .panel {
        display: grid;
        width: min(100%, 32rem);
        padding: 1.5rem;
        border: var(--rp-border-width-thin) solid var(--rp-color-default-border);
        border-radius: var(--rp-radius-lg);
        margin: 0 auto;
        background: var(--rp-color-default);
        gap: var(--rp-spacing-4);
    }

    .control,
    .slider {
        width: 100%;
    }

    .input,
    .selectTrigger {
        font-weight: var(--rp-font-weight-medium);
    }

    .option[data-highlighted] {
        outline: var(--rp-border-width-medium) solid var(--rp-color-focus-ring);
    }

    .option[data-selected] {
        font-weight: var(--rp-font-weight-bold);
    }

    .switch[data-state='checked'] .switchTrack {
        filter: saturate(1.15);
    }

    .switchThumb {
        transition-duration: var(--rp-transition-fast);
    }

    .radio[data-state='checked'] .radioIndicator {
        box-shadow: 0 0 0 var(--rp-border-width-thin) var(--rp-color-focus-ring);
    }

    .sliderTrack {
        border-radius: var(--rp-radius-full);
    }

    .sliderMark[data-filled] {
        opacity: 1;
    }

    .actions {
        display: flex;
        justify-content: flex-end;
        gap: var(--rp-spacing-2);
    }

    .modal[data-state='open'] {
        backdrop-filter: blur(2px);
    }

    .modalPanel {
        border: var(--rp-border-width-thin) solid var(--rp-color-default-border);
    }

    .modalTitle {
        color: var(--rp-primary-color-filled);
    }
}
</style>
