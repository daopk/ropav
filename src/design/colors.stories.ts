import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { onBeforeUnmount, onMounted, ref } from 'vue';
import coreTokensSource from '../../tokens/default/core.tokens.json?raw';
import ColorSwatch from '../components/color-swatch/color-swatch.vue';
import { componentColors, componentColorShades } from '../utils/componentColors';
import './colors.stories.scss';

type TokenValue = string | number;

interface DesignToken {
    $type?: string;
    $value: TokenValue;
}

interface TokenTree {
    [key: string]: DesignToken | TokenTree;
}

interface TokenFile {
    color: TokenTree;
}

type TokenValueMap = Map<string, TokenValue>;

const coreTokens = JSON.parse(coreTokensSource) as TokenFile;
const defaultTokenValues = collectTokenValueMap(coreTokens);
const variantSuffixes = [
    'filled',
    'filled-hover',
    'contrast',
    'light',
    'light-hover',
    'light-color',
    'outline',
    'outline-hover',
];
const schemeVariables = [
    '--rp-color-scheme',
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
    ...componentColorShades.map((shade) => `--rp-primary-color-${shade}`),
    ...variantSuffixes.map((suffix) => `--rp-primary-color-${suffix}`),
];

const paletteColors = componentColors.map((name) => ({
    name,
    shades: componentColorShades.map((shade) => {
        const token = getColorToken([name, shade]);

        return {
            shade,
            label: `${name}.${shade}`,
            value: resolveTokenValue(token.$value, defaultTokenValues),
            variable: `--rp-color-${name}-${shade}`,
            contrastVariable: `--rp-color-${name}-${shade}-contrast`,
        };
    }),
}));
const fixedColors = ['white', 'black'].map((name) => {
    const token = getColorToken([name]);

    return {
        shade: name,
        label: name,
        value: resolveTokenValue(token.$value, defaultTokenValues),
        variable: `--rp-color-${name}`,
    };
});
const variantVariables = componentColors.map((name) => ({
    name,
    variables: variantSuffixes.map((suffix) => ({
        name: `--rp-color-${name}-${suffix}`,
        label: suffix,
    })),
}));

const meta = {
    title: 'Design Tokens/Colors',
    parameters: {
        controls: { disable: true },
    },
    render: () => ({
        components: { ColorSwatch },
        setup() {
            const computedValues = ref<Record<string, string>>({});
            const themeName = ref('Light');
            let observer: MutationObserver | undefined;

            const updateComputedValues = () => {
                const root = document.documentElement;
                const rootStyle = getComputedStyle(root);
                const variables = [
                    ...variantVariables.flatMap((color) =>
                        color.variables.map((variable) => variable.name),
                    ),
                    ...primaryVariables,
                    ...schemeVariables,
                ];

                computedValues.value = Object.fromEntries(
                    variables.map((variable) => [
                        variable,
                        rootStyle.getPropertyValue(variable).trim(),
                    ]),
                );
                themeName.value = root.classList.contains('dark') ? 'Dark' : 'Light';
            };

            onMounted(() => {
                updateComputedValues();
                observer = new MutationObserver(updateComputedValues);
                observer.observe(document.documentElement, {
                    attributes: true,
                    attributeFilter: ['class'],
                });
            });

            onBeforeUnmount(() => {
                observer?.disconnect();
            });

            return {
                computedValues,
                fixedColors,
                paletteColors,
                primaryVariables,
                schemeVariables,
                themeName,
                variantVariables,
            };
        },
        template: `
            <main class="rp-color-story">
                <header class="rp-color-story__header">
                    <div>
                        <p class="rp-color-story__eyebrow">Ropav tokens</p>
                        <h1>Colors</h1>
                    </div>
                    <span class="rp-color-story__theme">{{ themeName }} theme</span>
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
                                :color="color.value"
                                :size="56"
                                aria-hidden="true"
                            />
                            <span class="rp-color-token__meta">
                                <strong>{{ color.label }}</strong>
                                <code>{{ color.variable }}</code>
                                <code>{{ color.value }}</code>
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
                                        :style="{ backgroundColor: shade.value }"
                                    />
                                    <code>{{ shade.shade }}</code>
                                    <code>{{ shade.contrastVariable }}</code>
                                </span>
                            </div>
                        </article>
                    </div>
                </section>

                <section class="rp-color-section" aria-labelledby="variant-colors-title">
                    <h2 id="variant-colors-title">Generated variants</h2>
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
                                        <code>{{ computedValues[variable.name] || variable.name }}</code>
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
                                <code>{{ computedValues[variable] || '...' }}</code>
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
                                <code>{{ computedValues[variable] || '...' }}</code>
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

function getColorToken(path: string[]): DesignToken {
    let current: DesignToken | TokenTree = coreTokens.color;

    for (const segment of path) {
        current = (current as TokenTree)[segment];
    }

    if (!isDesignToken(current)) {
        throw new Error(`Missing color token: color.${path.join('.')}`);
    }

    return current;
}

function isDesignToken(value: DesignToken | TokenTree): value is DesignToken {
    return '$value' in value;
}

function collectTokenValueMap(...files: TokenFile[]): TokenValueMap {
    const values = new Map<string, TokenValue>();

    for (const file of files) {
        collectTokenValues(file as unknown as TokenTree, [], values);
    }

    return values;
}

function collectTokenValues(tree: TokenTree, path: string[], values: TokenValueMap) {
    for (const [key, value] of Object.entries(tree)) {
        const nextPath = [...path, key];

        if (isDesignToken(value)) {
            values.set(nextPath.join('.'), value.$value);
            continue;
        }

        collectTokenValues(value, nextPath, values);
    }
}

function resolveTokenValue(value: TokenValue, tokenValues: TokenValueMap): string {
    if (typeof value !== 'string') return String(value);

    const exactReference = value.match(/^\{([^}]+)\}$/);
    if (exactReference) {
        const referencedValue = tokenValues.get(exactReference[1]);
        return referencedValue == null ? value : resolveTokenValue(referencedValue, tokenValues);
    }

    return value.replace(/\{([^}]+)\}/g, (match, path) => {
        const referencedValue = tokenValues.get(path);
        return referencedValue == null ? match : resolveTokenValue(referencedValue, tokenValues);
    });
}
