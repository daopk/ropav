import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, within } from 'storybook/test';
import './cascade-layers.stories.scss';

const contractColors = {
    blue: 'rgb(0, 0, 255)',
    green: 'rgb(0, 128, 0)',
    purple: 'rgb(128, 0, 128)',
    red: 'rgb(255, 0, 0)',
} as const;

const cascadeCases = [
    {
        number: '01',
        key: 'declared',
        testId: 'declared-order',
        category: 'Named layers',
        title: 'Declared order beats source order',
        description:
            'The strongest layer loads first and the weakest loads last. The declared layer list still makes app win.',
        rulesLabel: 'Source order',
        rules: [
            {
                source: '@layer app',
                value: 'green',
                color: contractColors.green,
                status: 'winner',
                highlighted: true,
            },
            {
                source: '@layer ropav.components',
                value: 'blue',
                color: contractColors.blue,
                status: 'overridden',
            },
            {
                source: '@layer reset',
                value: 'red',
                color: contractColors.red,
                status: 'overridden',
            },
        ],
        winner: '@layer app',
        expected: contractColors.green,
        reason: 'app is last in the declared layer list, so it has the highest normal priority.',
    },
    {
        number: '02',
        key: 'reverse',
        testId: 'reverse-load',
        category: 'Mixed loading',
        title: 'A different load order has the same result',
        description:
            'Changing the arrival order of reset and component rules does not change which declared layer wins.',
        rulesLabel: 'Source order',
        rules: [
            {
                source: '@layer app',
                value: 'green',
                color: contractColors.green,
                status: 'winner',
                highlighted: true,
            },
            {
                source: '@layer reset',
                value: 'red',
                color: contractColors.red,
                status: 'overridden',
            },
            {
                source: '@layer ropav.components',
                value: 'blue',
                color: contractColors.blue,
                status: 'overridden',
            },
        ],
        winner: '@layer app',
        expected: contractColors.green,
        reason: 'Once layer order is established, later loading cannot promote a weaker layer.',
    },
    {
        number: '03',
        key: 'unlayered',
        testId: 'unlayered',
        category: 'Consumer CSS',
        title: 'Unlayered rules outrank named layers',
        description:
            'The consumer rule loads before the component rule, but normal unlayered CSS still has higher priority.',
        rulesLabel: 'Source order',
        rules: [
            {
                source: 'unlayered consumer rule',
                value: 'purple',
                color: contractColors.purple,
                status: 'winner',
                highlighted: true,
            },
            {
                source: '@layer ropav.components',
                value: 'blue',
                color: contractColors.blue,
                status: 'overridden',
            },
        ],
        winner: 'unlayered rule',
        expected: contractColors.purple,
        reason: 'For normal declarations, unlayered styles sit above every named layer.',
    },
    {
        number: '04',
        key: 'legacy',
        testId: 'legacy',
        category: 'Legacy cascade',
        title: 'Without layers, the last rule wins',
        description:
            'Both selectors have equal specificity and both are unlayered, so regular source order decides the result.',
        rulesLabel: 'Source order',
        rules: [
            {
                source: 'first rule',
                value: 'red',
                color: contractColors.red,
                status: 'overridden',
            },
            {
                source: 'last rule',
                value: 'blue',
                color: contractColors.blue,
                status: 'winner',
                highlighted: true,
            },
        ],
        winner: 'last rule',
        expected: contractColors.blue,
        reason: 'With equal origin, importance and specificity, the later declaration wins.',
    },
    {
        number: '05',
        key: 'dark',
        testId: 'dark-lazy',
        theme: 'dark',
        category: 'Theme tokens',
        title: 'Dark tokens resolve when components consume them',
        description:
            'The theme overrides the custom property in the token layer. The component reads the resolved value later.',
        rulesLabel: 'Resolution path',
        rules: [
            {
                source: 'tokens · default',
                value: 'red fallback',
                color: contractColors.red,
                status: 'fallback',
            },
            {
                source: 'tokens · [data-theme="dark"]',
                value: 'green token',
                color: contractColors.green,
                status: 'resolved',
                highlighted: true,
            },
            {
                source: 'components · var(--contract-color)',
                value: 'green output',
                color: contractColors.green,
                status: 'consumed',
                highlighted: true,
            },
        ],
        winner: 'dark theme token',
        expected: contractColors.green,
        reason: 'Custom properties keep cascading until the component resolves var(--contract-color).',
    },
] as const;

const meta = {
    title: 'Contracts/Cascade layers',
    parameters: {
        controls: { disable: true },
        layout: 'fullscreen',
    },
    render: () => ({
        setup: () => ({ cascadeCases }),
        template: `
            <main class="cascade-contract-story">
                <header class="cascade-contract-story__header">
                    <div class="cascade-contract-story__intro">
                        <p class="cascade-contract-story__eyebrow">Public CSS contract</p>
                        <h1>Cascade layer load order</h1>
                        <p>
                            Five checks show which declaration wins when Ropav, application,
                            legacy and theme styles compete.
                        </p>
                    </div>

                    <div class="cascade-contract-story__status" data-testid="contract-status">
                        Running 5 checks…
                    </div>
                </header>

                <section class="cascade-contract-order" aria-labelledby="cascade-order-title">
                    <div>
                        <p class="cascade-contract-order__label" id="cascade-order-title">
                            Normal declaration priority
                        </p>
                        <p class="cascade-contract-order__hint">Lower priority → higher priority</p>
                    </div>

                    <ol class="cascade-contract-order__flow">
                        <li><code>reset</code></li>
                        <li><code>ropav.tokens</code></li>
                        <li><code>ropav.components</code></li>
                        <li><code>app</code></li>
                    </ol>

                    <div class="cascade-contract-order__unlayered">
                        <span aria-hidden="true">↑</span>
                        <div>
                            <strong>Unlayered CSS</strong>
                            <span>outranks all named layers</span>
                        </div>
                    </div>
                </section>

                <section class="cascade-contract-cases" aria-label="Cascade contract cases">
                    <article
                        v-for="caseItem in cascadeCases"
                        :key="caseItem.key"
                        class="cascade-contract-case"
                    >
                        <div class="cascade-contract-case__body">
                            <header class="cascade-contract-case__header">
                                <span class="cascade-contract-case__number">{{ caseItem.number }}</span>
                                <span class="cascade-contract-case__category">{{ caseItem.category }}</span>
                            </header>

                            <div class="cascade-contract-case__copy">
                                <h2>{{ caseItem.title }}</h2>
                                <p>{{ caseItem.description }}</p>
                            </div>

                            <div class="cascade-contract-rules">
                                <p>{{ caseItem.rulesLabel }}</p>
                                <ol>
                                    <li
                                        v-for="(rule, ruleIndex) in caseItem.rules"
                                        :key="rule.source"
                                        :class="{ 'cascade-contract-rule--highlighted': rule.highlighted }"
                                    >
                                        <span class="cascade-contract-rule__index">{{ ruleIndex + 1 }}</span>
                                        <code>{{ rule.source }}</code>
                                        <span class="cascade-contract-rule__value">
                                            <span
                                                class="cascade-contract-rule__swatch"
                                                :style="{ '--cascade-rule-color': rule.color }"
                                                aria-hidden="true"
                                            ></span>
                                            {{ rule.value }}
                                        </span>
                                        <span class="cascade-contract-rule__status">{{ rule.status }}</span>
                                    </li>
                                </ol>
                            </div>
                        </div>

                        <aside class="cascade-contract-result" :aria-label="caseItem.title + ' result'">
                            <span class="cascade-contract-result__label">Expected winner</span>
                            <div class="cascade-contract-result__winner">
                                <span
                                    class="cascade-contract-result__swatch"
                                    :data-testid="caseItem.testId"
                                    :data-cascade-case="caseItem.key"
                                    :data-theme="caseItem.theme"
                                    aria-hidden="true"
                                ></span>
                                <strong>{{ caseItem.winner }}</strong>
                            </div>
                            <code>{{ caseItem.expected }}</code>
                            <p>{{ caseItem.reason }}</p>
                        </aside>
                    </article>
                </section>
            </main>
        `,
    }),
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const LoadOrderMatrix: Story = {
    play: async ({ canvasElement }) => {
        const style = document.createElement('style');
        style.dataset.cascadeContractRules = '';
        style.textContent = `
            @layer reset, ropav.tokens, ropav.components, app;
            @layer app { [data-cascade-case="declared"] { color: ${contractColors.green}; } }
            @layer ropav.components { [data-cascade-case="declared"] { color: ${contractColors.blue}; } }
            @layer reset { [data-cascade-case="declared"] { color: ${contractColors.red}; } }

            @layer app { [data-cascade-case="reverse"] { color: ${contractColors.green}; } }
            @layer reset { [data-cascade-case="reverse"] { color: ${contractColors.red}; } }
            @layer ropav.components { [data-cascade-case="reverse"] { color: ${contractColors.blue}; } }

            [data-cascade-case="unlayered"] { color: ${contractColors.purple}; }
            @layer ropav.components { [data-cascade-case="unlayered"] { color: ${contractColors.blue}; } }

            [data-cascade-case="legacy"] { color: ${contractColors.red}; }
            [data-cascade-case="legacy"] { color: ${contractColors.blue}; }

            @layer ropav.tokens {
                [data-cascade-case="dark"] { --contract-color: ${contractColors.red}; }
                [data-cascade-case="dark"][data-theme="dark"] { --contract-color: ${contractColors.green}; }
            }
            @layer ropav.components {
                [data-cascade-case="dark"] { color: var(--contract-color); }
            }
        `;
        canvasElement.append(style);

        const canvas = within(canvasElement);
        await expect(canvas.getByTestId('declared-order')).toHaveStyle({
            color: contractColors.green,
        });
        await expect(canvas.getByTestId('reverse-load')).toHaveStyle({
            color: contractColors.green,
        });
        await expect(canvas.getByTestId('unlayered')).toHaveStyle({
            color: contractColors.purple,
        });
        await expect(canvas.getByTestId('legacy')).toHaveStyle({
            color: contractColors.blue,
        });
        await expect(canvas.getByTestId('dark-lazy')).toHaveStyle({
            color: contractColors.green,
        });

        const status = canvas.getByTestId('contract-status');
        status.dataset.state = 'passed';
        status.textContent = '5 / 5 checks passed';
    },
};
