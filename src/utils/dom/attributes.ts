export type AttributeSnapshot<Name extends string = string> = ReadonlyMap<Name, string | null>;

export interface CompatibilityAttributes {
    class?: unknown;
    style?: unknown;
}

export type EventHandler<EventType extends Event> = (event: EventType) => unknown;

export function splitCompatibilityAttributes<Attributes extends CompatibilityAttributes>(
    attributes: Attributes,
): {
    compatibilityClass: Attributes['class'];
    compatibilityStyle: Attributes['style'];
    forwardedAttributes: Omit<Attributes, 'class' | 'style'>;
} {
    const {
        class: compatibilityClass,
        style: compatibilityStyle,
        ...forwardedAttributes
    } = attributes;

    return { compatibilityClass, compatibilityStyle, forwardedAttributes };
}

export function composeEventHandlers<EventType extends Event>(
    ...handlers: ReadonlyArray<EventHandler<EventType> | undefined>
) {
    return (event: EventType) => {
        for (const handler of handlers) handler?.(event);
    };
}

export function parseAttributeTokens(value: string | null | undefined): string[] {
    return value?.split(/\s+/).filter(Boolean) ?? [];
}

export function hasAttributeToken(value: string | null | undefined, token: string) {
    return parseAttributeTokens(value).includes(token);
}

export function snapshotAttributes<Name extends string>(
    element: Element,
    attributes: readonly Name[],
): AttributeSnapshot<Name> {
    return new Map(attributes.map((attribute) => [attribute, element.getAttribute(attribute)]));
}

export function restoreAttributes(element: Element, snapshot: AttributeSnapshot) {
    for (const [attribute, value] of snapshot) {
        if (value == null) element.removeAttribute(attribute);
        else element.setAttribute(attribute, value);
    }
}
