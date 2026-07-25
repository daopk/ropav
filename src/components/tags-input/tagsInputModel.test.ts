import { describe, expect, it } from 'vitest';
import { addTagsInputValues, normalizeTagsInputValue, splitTagsInputValue } from './tagsInputModel';

describe('tagsInputModel', () => {
    it('normalizes and adds valid, unique values', () => {
        expect(normalizeTagsInputValue('  Vue Vapor  ')).toBe('Vue Vapor');
        expect(
            addTagsInputValues(['Vue'], [' Vue ', ' Vapor ', 'VDOM'], {
                allowDuplicates: false,
                maxTags: 2,
                validate: (value) => value !== 'VDOM',
            }),
        ).toEqual(['Vue', 'Vapor']);
    });

    it('can preserve duplicate tags when enabled', () => {
        expect(
            addTagsInputValues(['Vue'], ['Vue', 'Vue'], {
                allowDuplicates: true,
            }),
        ).toEqual(['Vue', 'Vue', 'Vue']);
    });

    it('splits committed values from the remaining input', () => {
        expect(splitTagsInputValue('vue,vapor,', [','])).toEqual({
            tags: ['vue', 'vapor'],
            remainder: '',
        });
        expect(splitTagsInputValue('vue;vapor', [',', ';'])).toEqual({
            tags: ['vue'],
            remainder: 'vapor',
        });
        expect(splitTagsInputValue('unsplit', [','])).toEqual({
            tags: [],
            remainder: 'unsplit',
        });
    });
});
