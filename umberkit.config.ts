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
    // One seed per palette; step 9 keeps the seed verbatim. Seeds are the old
    // Mantine "filled" shade (shade 6), except blue which was the primary at shade 8.
    palettes: {
        gray: '#868e96',
        red: '#fa5252',
        pink: '#e64980',
        grape: '#be4bdb',
        violet: '#7950f2',
        indigo: '#4c6ef5',
        blue: '#1971c2',
        cyan: '#15aabf',
        teal: '#12b886',
        green: '#40c057',
        lime: '#82c91e',
        yellow: '#fab005',
        orange: '#fd7e14',
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
