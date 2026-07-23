import { describe, expect, it } from 'vitest';
import {
    createHoverDisclosureInteractionModel,
    hasActiveHoverDisclosureInteraction,
} from './hoverDisclosureInteractionModel';

describe('hover disclosure interaction model', () => {
    it('tracks hover, focus, and touch pinning as one active interaction', () => {
        const interaction = createHoverDisclosureInteractionModel();

        expect(hasActiveHoverDisclosureInteraction(interaction.read())).toBe(false);

        interaction.send({
            type: 'hover',
            part: 'trigger',
            active: true,
        });
        interaction.send({
            type: 'focus',
            part: 'content',
            active: true,
        });
        expect(hasActiveHoverDisclosureInteraction(interaction.read())).toBe(true);

        interaction.send({ type: 'reset', part: 'trigger' });
        expect(interaction.read().triggerHovered).toBe(false);
        expect(interaction.read().contentFocused).toBe(true);

        interaction.send({ type: 'reset', part: 'content' });
        interaction.send({ type: 'set-touch-pinned', pinned: true });
        expect(hasActiveHoverDisclosureInteraction(interaction.read())).toBe(true);

        interaction.send({ type: 'reset', part: 'all' });
        expect(hasActiveHoverDisclosureInteraction(interaction.read())).toBe(false);
    });

    it('only prepares a click after a completed touch pointer sequence', () => {
        const interaction = createHoverDisclosureInteractionModel();

        interaction.send({ type: 'pointer-down', touch: true });
        expect(interaction.read().touchPointerActive).toBe(true);
        expect(interaction.read().touchClickPending).toBe(false);

        interaction.send({ type: 'pointer-up', touch: true });
        expect(interaction.read().touchPointerActive).toBe(false);
        expect(interaction.read().touchClickPending).toBe(true);

        interaction.send({ type: 'consume-touch-click' });
        expect(interaction.read().touchClickPending).toBe(false);

        interaction.send({ type: 'pointer-down', touch: true });
        interaction.send({ type: 'pointer-cancel' });
        interaction.send({ type: 'pointer-up', touch: true });
        expect(interaction.read().touchClickPending).toBe(false);
    });

    it('does not treat mouse or pen pointer sequences as touch clicks', () => {
        const interaction = createHoverDisclosureInteractionModel();

        interaction.send({ type: 'pointer-down', touch: false });
        interaction.send({ type: 'pointer-up', touch: false });

        expect(interaction.read().touchPointerActive).toBe(false);
        expect(interaction.read().touchClickPending).toBe(false);
    });
});
