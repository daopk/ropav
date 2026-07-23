export type AttributeSnapshot<Name extends string = string> = ReadonlyMap<Name, string | null>;

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
