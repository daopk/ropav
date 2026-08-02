import { describe, expect, it } from 'vitest';
import { parseCssColor } from './color';

describe('parseCssColor', () => {
    it.each([
        ['#abc', { red: 170, green: 187, blue: 204, opacity: 100 }],
        ['#abcd', { red: 170, green: 187, blue: 204, opacity: 86.67 }],
        ['#11223380', { red: 17, green: 34, blue: 51, opacity: 50.2 }],
        ['rgb(255, 0, 127)', { red: 255, green: 0, blue: 127, opacity: 100 }],
        ['rgba(100%, 0%, 50%, 25%)', { red: 255, green: 0, blue: 128, opacity: 25 }],
        ['rgb(100% 0 50% / .5)', { red: 255, green: 0, blue: 128, opacity: 50 }],
        ['hsl(0 100% 50%)', { red: 255, green: 0, blue: 0, opacity: 100 }],
        ['hsl(.5turn 100% 50%)', { red: 0, green: 255, blue: 255, opacity: 100 }],
        ['hsl(200grad 100% 50%)', { red: 0, green: 255, blue: 255, opacity: 100 }],
        ['hsl(3.141592653589793rad 100% 50%)', { red: 0, green: 255, blue: 255, opacity: 100 }],
        ['black', { red: 0, green: 0, blue: 0, opacity: 100 }],
        ['white', { red: 255, green: 255, blue: 255, opacity: 100 }],
        ['transparent', { red: 0, green: 0, blue: 0, opacity: 0 }],
    ])('parses %s', (value, expected) => {
        expect(parseCssColor(value)).toEqual(expected);
    });

    it.each([
        '',
        'red',
        '#12',
        'rgb(255oops, 0, 0)',
        'rgb(10%, 20, 30%)',
        'rgba(1, 2, 3, nope)',
        'rgba(1, 2, 3, .5, .25)',
        'rgb(1 2 3 / .5 / .25)',
        'rgb(1, 2, 3 / .5)',
        'rgb(1 2 3 4)',
        'hsl(.5turns 100% 50%)',
        'hsl(20deg, 50foo%, 50%)',
        'hsl(20deg 50% 50% /)',
    ])('rejects malformed color %s', (value) => {
        expect(parseCssColor(value)).toBeUndefined();
    });
});
