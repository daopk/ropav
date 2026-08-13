import { defineConfig } from 'umberkit';

const hues = [
    'gray',
    'red',
    'pink',
    'grape',
    'violet',
    'indigo',
    'blue',
    'cyan',
    'teal',
    'green',
    'lime',
    'yellow',
    'orange',
] as const;

export default defineConfig({
    prefix: 'rp',
    layer: 'ropav.tokens',
    outDir: './src/styles/generated',
    // One seed per palette; step 9 keeps the seed verbatim. Seeds follow the old
    // pipeline's "filled" resolution: the first Mantine shade (from 6 upward)
    // whose white companion clears WCAG 4.5, so solid buttons keep passing the
    // storybook a11y gate. Hues whose generated foreground is black (teal,
    // green, lime, yellow) and hues already passing (blue, violet) keep shade 6
    // (blue keeps its primary shade 8). Orange never reaches 4.5 on the old
    // ramp, so its seed is the old shade 9 darkened to 97% — the same value the
    // old color-mix fallback produced.
    palettes: {
        // Steps 11/12 carry ropav's dimmed/disabled text, which sits on step-3
        // surfaces and under opacity: 0.65 — darker than the curve's AA-vs-step-2
        // anchors, so the storybook axe gate keeps passing (11 ≥ 4.5 on step 3,
        // 12 blended at 65% over near-white ≥ 4.5).
        gray: {
            seed: '#495057',
            overrides: {
                light: {
                    11: { l: 0.5238, c: 0.0128, h: 243.82 },
                    12: { l: 0.2621, c: 0.0095, h: 248.19 },
                },
            },
        },
        red: '#e03131',
        pink: '#d6336c',
        grape: '#ae3ec9',
        violet: '#7950f2',
        indigo: '#4263eb',
        blue: '#1971c2',
        cyan: '#0b7285',
        teal: '#12b886',
        green: '#40c057',
        lime: '#82c91e',
        yellow: '#fab005',
        orange: '#d2460f',
    },
    emit: { css: true, scss: true, docs: true, ts: false, tailwind: false },
    lint: {
        contrast: [
            { fg: 'color.text', bg: 'color.body' },
            { fg: 'color.default-color', bg: 'color.default' },
            { fg: 'color.control.fg', bg: 'color.control.bg' },
            { fg: 'color.dimmed', bg: 'color.body' },
            // No contrast×filled pairs: the generated step-9 companion foreground is
            // validated by `umberkit generate` itself (APCA-first, Radix semantics);
            // requiring Lc 60 AND WCAG 4.5 here would reject seeds the generator accepts.
            ...hues.map((hue) => ({
                fg: `color.${hue}.light-color`,
                bg: `color.${hue}.light`,
            })),
        ],
    },
    contract: { version: 1 },
});
