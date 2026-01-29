type BemModifier = string | Record<string, boolean | undefined>;

export function bem(block: string, ...modifiers: BemModifier[]): string[] {
    const classes = [block];
    for (const mod of modifiers) {
        if (typeof mod === 'string') {
            classes.push(`${block}--${mod}`);
        } else {
            for (const [key, val] of Object.entries(mod)) {
                if (val) classes.push(`${block}--${key}`);
            }
        }
    }
    return classes;
}
