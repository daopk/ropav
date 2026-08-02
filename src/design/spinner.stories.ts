import type { Meta, StoryObj } from '@storybook/vue3-vite';
import IconLoaderCircle from '~icons/lucide/loader-circle';
import IconRefreshCw from '~icons/lucide/refresh-cw';
import IconSparkles from '~icons/lucide/sparkles';
import './spinner.stories.scss';

const importCode = `import 'ropav/base.css';

<IconLoaderCircle class="rp-spinner" aria-hidden="true" />`;

const sizeCode = `<IconLoaderCircle
    class="rp-spinner"
    aria-hidden="true"
    style="font-size: 24px;"
/>`;

const statusCode = `<span class="rp-spinner" role="status" aria-label="Loading">
    <IconLoaderCircle />
</span>`;

const meta = {
    title: 'Utilities/Spinner',
    parameters: {
        controls: { disable: true },
    },
    render: () => ({
        components: { IconLoaderCircle, IconRefreshCw, IconSparkles },
        setup: () => ({
            importCode,
            sizeCode,
            statusCode,
        }),
        template: `
            <main class="rp-spinner-story">
                <header class="rp-spinner-story__header">
                    <p class="rp-spinner-story__eyebrow">Utility CSS</p>
                    <h1>.rp-spinner</h1>
                    <p>
                        Use the public spinner utility when a custom loading icon should share
                        Ropav's standard motion and sizing behavior.
                    </p>
                </header>

                <section class="rp-spinner-demo" aria-labelledby="spinner-preview-title">
                    <div class="rp-spinner-demo__copy">
                        <h2 id="spinner-preview-title">Preview</h2>
                        <p>
                            The utility sets the spinner to 1em, so it follows text size unless
                            a width or height is supplied by the consumer.
                        </p>
                    </div>

                    <div class="rp-spinner-demo__stage" aria-label="Spinner examples">
                        <span class="rp-spinner-sample rp-spinner-sample--sm">
                            <IconLoaderCircle class="rp-spinner" aria-hidden="true" />
                            <span>Small</span>
                        </span>
                        <span class="rp-spinner-sample">
                            <IconRefreshCw class="rp-spinner" aria-hidden="true" />
                            <span>Default</span>
                        </span>
                        <span class="rp-spinner-sample rp-spinner-sample--lg">
                            <IconSparkles class="rp-spinner" aria-hidden="true" />
                            <span>Large</span>
                        </span>
                    </div>
                </section>

                <section class="rp-spinner-section" aria-labelledby="spinner-basic-title">
                    <h2 id="spinner-basic-title">Basic usage</h2>
                    <p>
                        Import <code>ropav/base.css</code>, then place <code>.rp-spinner</code>
                        on an SVG icon or an inline wrapper.
                    </p>
                    <pre><code>{{ importCode }}</code></pre>
                </section>

                <section class="rp-spinner-section" aria-labelledby="spinner-size-title">
                    <h2 id="spinner-size-title">Sizing</h2>
                    <p>
                        Prefer font-size for contextual sizing. Width and height still work for
                        one-off fixed sizes.
                    </p>
                    <pre><code>{{ sizeCode }}</code></pre>
                </section>

                <section class="rp-spinner-section" aria-labelledby="spinner-a11y-title">
                    <h2 id="spinner-a11y-title">Accessibility</h2>
                    <p>
                        Mark decorative spinners as hidden. If the spinner is the only loading
                        indicator, give the wrapper status semantics.
                    </p>
                    <pre><code>{{ statusCode }}</code></pre>
                </section>
            </main>
        `,
    }),
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Usage: Story = {};
