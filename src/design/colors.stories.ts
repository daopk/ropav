import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { onBeforeUnmount, onMounted, ref } from 'vue';
import ColorSwatch from '../components/color-swatch/color-swatch.vue';
import { componentColors, componentColorShades } from '../utils/componentColors';
import './colors.stories.scss';

const variantSuffixes = [
    'filled',
    'filled-hover',
    'contrast',
    'light',
    'light-hover',
    'light-active',
    'light-color',
    'outline',
    'outline-hover',
];
const schemeVariables = [
    '--rp-color-text',
    '--rp-color-body',
    '--rp-color-default',
    '--rp-color-default-hover',
    '--rp-color-default-color',
    '--rp-color-default-border',
    '--rp-color-dimmed',
    '--rp-color-disabled',
    '--rp-color-disabled-color',
    '--rp-color-disabled-border',
    '--rp-color-placeholder',
    '--rp-color-bright',
    '--rp-color-focus-ring',
    '--rp-color-control-bg',
    '--rp-color-control-fg',
    '--rp-color-control-border',
    '--rp-color-control-border-focus',
    '--rp-color-control-selected-bg',
    '--rp-color-control-selected-fg',
];
const primaryVariables = [
    ...componentColorShades.map((shade) => `--rp-color-primary-${shade}`),
    ...variantSuffixes.map((suffix) => `--rp-color-primary-${suffix}`),
];

const paletteColors = componentColors
    .filter((name) => name !== 'primary')
    .map((name) => ({
        name,
        shades: [
            ...componentColorShades.map((shade) => ({
                shade,
                label: `${name}.${shade}`,
                variable: `--rp-color-${name}-${shade}`,
            })),
            {
                shade: 'contrast',
                label: `${name}.contrast`,
                variable: `--rp-color-${name}-contrast`,
            },
        ],
    }));
const fixedColors = ['white', 'black'].map((name) => ({
    shade: name,
    label: name,
    variable: `--rp-color-${name}`,
}));
const variantVariables = componentColors.map((name) => ({
    name,
    variables: variantSuffixes.map((suffix) => ({
        name: `--rp-color-${name}-${suffix}`,
        label: suffix,
    })),
}));

const meta = {
    title: 'Foundations/Colors',
    parameters: {
        controls: { disable: true },
    },
    render: () => ({
        components: { ColorSwatch },
        setup() {
            const storyRoot = ref<HTMLElement>();
            const themeLabel = ref<HTMLElement>();
            let observer: MutationObserver | undefined;
            let updateTimer: number | undefined;

            const updateComputedValues = () => {
                if (!storyRoot.value) return;

                const rootStyle = getComputedStyle(document.documentElement);
                const valueElements = storyRoot.value.querySelectorAll<HTMLElement>(
                    '[data-rp-color-variable]',
                );

                for (const element of valueElements) {
                    const variable = element.dataset.rpColorVariable;
                    if (!variable) continue;

                    updateTextNode(
                        element,
                        rootStyle.getPropertyValue(variable).trim() || variable,
                    );
                }
            };

            const updateThemeLabel = () => {
                if (!themeLabel.value) return;

                const themeName =
                    document.documentElement.getAttribute('data-scheme') === 'dark'
                        ? 'Dark'
                        : 'Light';
                updateTextNode(themeLabel.value, `${themeName} theme`);
            };

            const scheduleComputedValueUpdate = () => {
                updateThemeLabel();
                window.clearTimeout(updateTimer);
                updateTimer = window.setTimeout(updateComputedValues, 80);
            };

            onMounted(() => {
                updateThemeLabel();
                updateComputedValues();
                observer = new MutationObserver(scheduleComputedValueUpdate);
                observer.observe(document.documentElement, {
                    attributes: true,
                    attributeFilter: ['data-scheme'],
                });
            });

            onBeforeUnmount(() => {
                observer?.disconnect();
                window.clearTimeout(updateTimer);
            });

            return {
                fixedColors,
                paletteColors,
                primaryVariables,
                schemeVariables,
                storyRoot,
                themeLabel,
                variantVariables,
            };
        },
        template: `
            <main ref="storyRoot" class="rp-color-story">
                <header class="rp-color-story__header">
                    <div>
                        <p class="rp-color-story__eyebrow">Ropav tokens</p>
                        <h1>Colors</h1>
                    </div>
                    <span ref="themeLabel" class="rp-color-story__theme">Dark theme</span>
                </header>

                <section class="rp-color-section" aria-labelledby="palette-colors-title">
                    <h2 id="palette-colors-title">Color palette</h2>
                    <div class="rp-color-fixed-grid">
                        <article
                            v-for="color in fixedColors"
                            :key="color.variable"
                            class="rp-color-token"
                        >
                            <ColorSwatch
                                :color="'var(' + color.variable + ')'"
                                :size="56"
                                aria-hidden="true"
                            />
                            <span class="rp-color-token__meta">
                                <strong>{{ color.label }}</strong>
                                <code>{{ color.variable }}</code>
                                <code :data-rp-color-variable="color.variable">
                                    {{ color.variable }}
                                </code>
                            </span>
                        </article>
                    </div>
                    <div class="rp-color-scales">
                        <article
                            v-for="color in paletteColors"
                            :key="color.name"
                            class="rp-color-scale"
                        >
                            <h3>{{ color.name }}</h3>
                            <div class="rp-color-scale__grid">
                                <span
                                    v-for="shade in color.shades"
                                    :key="shade.variable"
                                    class="rp-color-scale__shade"
                                >
                                    <span
                                        class="rp-color-scale__swatch"
                                        :style="{ backgroundColor: 'var(' + shade.variable + ')' }"
                                    />
                                    <code>{{ shade.shade }}</code>
                                </span>
                            </div>
                        </article>
                    </div>
                </section>

                <section class="rp-color-section" aria-labelledby="variant-colors-title">
                    <h2 id="variant-colors-title">Semantic variants</h2>
                    <div class="rp-color-variant-grid">
                        <article
                            v-for="color in variantVariables"
                            :key="color.name"
                            class="rp-color-variant"
                        >
                            <h3>{{ color.name }}</h3>
                            <div class="rp-color-variant__items">
                                <span
                                    v-for="variable in color.variables"
                                    :key="variable.name"
                                    class="rp-color-variant__item"
                                >
                                    <ColorSwatch
                                        :color="'var(' + variable.name + ')'"
                                        :size="32"
                                        aria-hidden="true"
                                    />
                                    <span>
                                        <strong>{{ variable.label }}</strong>
                                        <code :data-rp-color-variable="variable.name">
                                            {{ variable.name }}
                                        </code>
                                    </span>
                                </span>
                            </div>
                        </article>
                    </div>
                </section>

                <section class="rp-color-section" aria-labelledby="aliases-title">
                    <h2 id="aliases-title">Primary and scheme aliases</h2>
                    <div class="rp-color-table" role="table">
                        <div class="rp-color-table__row rp-color-table__row--head" role="row">
                            <span role="columnheader">Variable</span>
                            <span role="columnheader">Current</span>
                        </div>
                        <div
                            v-for="variable in primaryVariables"
                            :key="variable"
                            class="rp-color-table__row"
                            role="row"
                        >
                            <span class="rp-color-table__token" role="cell">
                                <ColorSwatch
                                    :color="'var(' + variable + ')'"
                                    :size="32"
                                    aria-hidden="true"
                                />
                                <code>{{ variable }}</code>
                            </span>
                            <span class="rp-color-table__value" role="cell">
                                <code :data-rp-color-variable="variable">{{ variable }}</code>
                            </span>
                        </div>
                        <div
                            v-for="variable in schemeVariables"
                            :key="variable"
                            class="rp-color-table__row"
                            role="row"
                        >
                            <span class="rp-color-table__token" role="cell">
                                <ColorSwatch
                                    :color="'var(' + variable + ')'"
                                    :size="32"
                                    aria-hidden="true"
                                />
                                <code>{{ variable }}</code>
                            </span>
                            <span class="rp-color-table__value" role="cell">
                                <code :data-rp-color-variable="variable">{{ variable }}</code>
                            </span>
                        </div>
                    </div>
                </section>
            </main>
        `,
    }),
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Palette: Story = {};

function updateTextNode(element: HTMLElement, value: string) {
    const textNode = element.firstChild;
    if (textNode?.nodeType !== Node.TEXT_NODE || textNode.nodeValue === value) return;

    textNode.nodeValue = value;
}
