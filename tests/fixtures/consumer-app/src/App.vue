<template>
    <main :class="css.page" :data-consumer-theme="dark ? 'dark' : 'light'">
        <header :class="css.header">
            <h1>Account settings</h1>
            <Button
                data-testid="theme-toggle"
                variant="outline"
                :class-names="{ root: css.themeButton, label: css.buttonLabel }"
                @click="dark = !dark"
            >
                Toggle theme
            </Button>
            <Button data-testid="public-color-contrast" color="blue" variant="solid" auto-contrast>
                <IconSearch data-testid="consumer-vapor-icon" aria-hidden="true" />
                Public color contrast
            </Button>
            <ButtonLink data-testid="consumer-button-link" href="#settings-panel" variant="outline">
                Account link
            </ButtonLink>
            <IconButton data-testid="consumer-icon-button" ariaLabel="Search account">
                <IconSearch />
            </IconButton>
            <IconGradient data-testid="consumer-gradient-icon" aria-hidden="true" />
            <IconGradient data-testid="consumer-gradient-icon" aria-hidden="true" />
        </header>

        <ToastProvider>
            <SettingsPanel />
            <ToastViewport
                teleport-to="#overlays"
                position="bottom-right"
                :class-names="{
                    root: css.viewport,
                    item: css.toastItem,
                    toast: css.toast,
                }"
            />
        </ToastProvider>
    </main>
</template>

<script lang="ts" setup vapor>
import { ref, useCssModule } from 'vue';
import { Button, ToastProvider, ToastViewport } from 'ropav';
import { ButtonLink } from 'ropav/button-link';
import { IconButton } from 'ropav/icon-button';
import IconSearch from '~icons/lucide/search';
import IconGradient from '~icons/regression/gradient';
import SettingsPanel from './SettingsPanel.vue';

const dark = ref(false);
const css = useCssModule();
</script>

<style module>
@layer app {
    :global(:root) {
        --rp-color-blue-filled: #000;
        --rp-color-blue-filled-hover: #111;
        --rp-color-blue-contrast: #fff;
    }

    .page {
        min-height: 100vh;
        padding: 2rem;
        color: var(--rp-color-text);
        background: var(--rp-color-body);
        font-family: var(--rp-font-family);
    }

    .header {
        display: flex;
        max-width: 48rem;
        align-items: center;
        justify-content: space-between;
        margin: 0 auto 2rem;
    }

    .themeButton {
        min-width: 8rem;
    }

    .buttonLabel {
        letter-spacing: 0.01em;
    }

    .viewport {
        max-width: 24rem;
    }

    .toastItem {
        margin-top: 0.5rem;
    }

    .toast {
        box-shadow: var(--rp-shadow-lg);
    }
}
</style>
