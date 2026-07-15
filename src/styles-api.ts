import { mergeProps, useAttrs, type HTMLAttributes, type StyleValue } from 'vue';

export type StylesApiClassNames<Part extends string> = Partial<
    Record<Part, HTMLAttributes['class']>
>;

export type StylesApiStyles<Part extends string> = Partial<Record<Part, StyleValue>>;

export interface StylesApiProps<Part extends string> {
    classNames?: StylesApiClassNames<Part>;
    styles?: StylesApiStyles<Part>;
}

export interface StylesApiPartOptions {
    class?: HTMLAttributes['class'];
    style?: StyleValue;
    compatibilityClass?: HTMLAttributes['class'];
    compatibilityStyle?: StyleValue;
}

type StylesApiSource<Part extends string> = Pick<StylesApiProps<Part>, 'classNames' | 'styles'>;

export function presence(value: unknown): '' | undefined {
    return value ? '' : undefined;
}

export function resolveStylesApiPart<Part extends string>(
    source: Readonly<StylesApiSource<Part>>,
    part: Part,
    options: StylesApiPartOptions = {},
): Pick<HTMLAttributes, 'class' | 'style'> {
    return {
        class: [options.class, options.compatibilityClass, source.classNames?.[part]],
        style: [options.style, options.compatibilityStyle, source.styles?.[part]],
    };
}

export function useStylesApi<Part extends string>(
    source: Readonly<StylesApiSource<Part>>,
    rootPart: Part,
) {
    const attrs = useAttrs();

    function getPartAttrs(part: Part, options: StylesApiPartOptions = {}) {
        return resolveStylesApiPart(source, part, options);
    }

    function getRootAttrs(
        internalAttrs: object = {},
        options: Omit<StylesApiPartOptions, 'class' | 'style'> = {},
        excludedAttrs: readonly string[] = [],
    ): Record<string, unknown> {
        const internalRecord = internalAttrs as Record<string, unknown>;
        const { class: attrClass, style: attrStyle, ...candidateAttrs } = attrs;
        const forwardedAttrs = Object.fromEntries(
            Object.entries(candidateAttrs).filter(([name]) => !excludedAttrs.includes(name)),
        );
        const merged = mergeProps(
            internalRecord,
            forwardedAttrs as Record<string, unknown>,
        ) as unknown as Record<string, unknown>;

        // Component-owned semantics remain authoritative. Native listeners are deliberately
        // excluded: mergeProps composes the internal listener before the consumer listener.
        for (const [name, value] of Object.entries(internalRecord)) {
            if (name === 'class' || name === 'style' || /^on[A-Z]/.test(name)) continue;
            merged[name] = value;
        }

        const partAttrs = resolveStylesApiPart(source, rootPart, {
            class: internalRecord.class as HTMLAttributes['class'],
            style: internalRecord.style as StyleValue,
            ...options,
        });

        merged.class = [partAttrs.class, attrClass];
        merged.style = [partAttrs.style, attrStyle];
        return merged;
    }

    return { attrs, getPartAttrs, getRootAttrs };
}
