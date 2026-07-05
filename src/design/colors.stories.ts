import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { onBeforeUnmount, onMounted, ref } from 'vue';
import coreTokensSource from '../../tokens/default/core.tokens.json?raw';
import semanticTokensSource from '../../tokens/default/semantic.tokens.json?raw';
import darkTokensSource from '../../tokens/dark/overrides.tokens.json?raw';
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

interface CoreColor {
    name: string;
    label: string;
    value: string;
}

interface SemanticColor extends CoreColor {
    variable: string;
    darkValue?: string;
}

const coreTokens = JSON.parse(coreTokensSource) as TokenFile;
const semanticTokens = JSON.parse(semanticTokensSource) as TokenFile;
const darkTokens = JSON.parse(darkTokensSource) as TokenFile;
const defaultTokenValues = collectTokenValueMap(coreTokens, semanticTokens);
const darkTokenValues = collectTokenValueMap(coreTokens, semanticTokens, darkTokens);

const publicAccentNames = new Set(['primary', 'secondary', 'success', 'warning', 'danger', 'info']);

const coreColors = collectColorTokens(coreTokens.color, defaultTokenValues);
const brandColors = coreColors.filter((color) => publicAccentNames.has(color.name));
const neutralColors = coreColors.filter(
    (color) => color.name === 'white' || color.name === 'black' || color.name.startsWith('gray-'),
);

const darkColorByName = new Map(
    collectColorTokens(darkTokens.color, darkTokenValues).map((color) => [color.name, color.value]),
);
const semanticColors: SemanticColor[] = collectColorTokens(semanticTokens.color, defaultTokenValues)
    .filter((color) => isPublicSemanticColor(color.name))
    .map((color) => ({
        name: color.name,
        label: color.label,
        value: color.value,
        variable: `--rp-color-${color.name}`,
        darkValue: darkColorByName.get(color.name),
    }));

const meta = {
    title: 'Design Tokens/Colors',
    parameters: {
        controls: { disable: true },
    },
    render: () => ({
        setup() {
            const computedValues = ref<Record<string, string>>({});
            const themeName = ref('Light');
            let observer: MutationObserver | undefined;

            const updateComputedValues = () => {
                const root = document.documentElement;
                const rootStyle = getComputedStyle(root);
                computedValues.value = Object.fromEntries(
                    semanticColors.map((color) => [
                        color.variable,
                        rootStyle.getPropertyValue(color.variable).trim(),
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
                brandColors,
                neutralColors,
                semanticColors,
                computedValues,
                themeName,
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

                <section class="rp-color-section" aria-labelledby="brand-colors-title">
                    <h2 id="brand-colors-title">Brand and status</h2>
                    <div class="rp-color-grid rp-color-grid--accent">
                        <article
                            v-for="color in brandColors"
                            :key="color.name"
                            class="rp-color-token"
                        >
                            <span
                                class="rp-color-token__swatch"
                                :style="{ backgroundColor: color.value }"
                            />
                            <span class="rp-color-token__meta">
                                <strong>{{ color.label }}</strong>
                                <code>{{ color.value }}</code>
                            </span>
                        </article>
                    </div>
                </section>

                <section class="rp-color-section" aria-labelledby="neutral-colors-title">
                    <h2 id="neutral-colors-title">Neutral</h2>
                    <div class="rp-color-grid rp-color-grid--neutral">
                        <article
                            v-for="color in neutralColors"
                            :key="color.name"
                            class="rp-color-token"
                        >
                            <span
                                class="rp-color-token__swatch"
                                :style="{ backgroundColor: color.value }"
                            />
                            <span class="rp-color-token__meta">
                                <strong>{{ color.label }}</strong>
                                <code>{{ color.value }}</code>
                            </span>
                        </article>
                    </div>
                </section>

                <section class="rp-color-section" aria-labelledby="semantic-colors-title">
                    <h2 id="semantic-colors-title">Semantic CSS variables</h2>
                    <div class="rp-color-table" role="table">
                        <div class="rp-color-table__row rp-color-table__row--head" role="row">
                            <span role="columnheader">Token</span>
                            <span role="columnheader">Source</span>
                            <span role="columnheader">Current</span>
                        </div>
                        <div
                            v-for="color in semanticColors"
                            :key="color.name"
                            class="rp-color-table__row"
                            role="row"
                        >
                            <span class="rp-color-table__token" role="cell">
                                <span
                                    class="rp-color-token__swatch rp-color-token__swatch--small"
                                    :style="{ backgroundColor: 'var(' + color.variable + ')' }"
                                />
                                <span>
                                    <strong>{{ color.label }}</strong>
                                    <code>{{ color.variable }}</code>
                                </span>
                            </span>
                            <span class="rp-color-table__value" role="cell">
                                <code>{{ color.value }}</code>
                                <code v-if="color.darkValue">dark: {{ color.darkValue }}</code>
                            </span>
                            <span class="rp-color-table__value" role="cell">
                                <code>{{ computedValues[color.variable] || '...' }}</code>
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

function collectColorTokens(
    tree: TokenTree,
    tokenValues: TokenValueMap,
    path: string[] = [],
): CoreColor[] {
    return Object.entries(tree).flatMap(([key, value]) => {
        const nextPath = [...path, key];

        if (isDesignToken(value)) {
            return value.$type === 'color' && typeof value.$value === 'string'
                ? [
                      {
                          name: nextPath.join('-'),
                          label: nextPath.join('.'),
                          value: resolveTokenValue(value.$value, tokenValues),
                      },
                  ]
                : [];
        }

        return collectColorTokens(value, tokenValues, nextPath);
    });
}

function isDesignToken(value: DesignToken | TokenTree): value is DesignToken {
    return '$value' in value;
}

function isPublicSemanticColor(name: string) {
    if (name === 'white' || name === 'black') return false;
    if (name.startsWith('gray-')) return false;
    if (name.startsWith('control-')) return false;

    return true;
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

function resolveTokenValue(
    value: string,
    tokenValues: TokenValueMap,
    seen = new Set<string>(),
): string {
    return value.replace(/\{([^}]+)\}/g, (reference: string, path: string): string => {
        const normalizedPath = String(path).replace(/\.\$?value$/, '');
        if (seen.has(normalizedPath)) return reference;

        const nextValue = tokenValues.get(normalizedPath);
        if (typeof nextValue !== 'string') return reference;

        return resolveTokenValue(nextValue, tokenValues, new Set([...seen, normalizedPath]));
    });
}
