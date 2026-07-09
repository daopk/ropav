export function tokenPath(token) {
    if (token.path) return token.path;
    if (token.ref) return token.ref;
    if (token.key) return token.key.slice(1, -1).split('.');

    throw new Error(`Missing token path for ${JSON.stringify(token)}`);
}

export function cssCustomProperty(token) {
    return `--rp-${ropavExtension(token).cssName ?? tokenPath(token).join('-')}`;
}

export function scssName(token) {
    return ropavExtension(token).scssName ?? tokenPath(token).join('-');
}

export function hasScssVariable(token) {
    return ropavExtension(token).scssVariable !== false;
}

export function hasCssCustomProperty(token) {
    const extension = ropavExtension(token);
    if (extension.cssVariable === false) return false;
    if (extension.cssVariable === true) return true;
    if (extension.cssName) return true;

    const path = tokenPath(token);
    const [category, type] = path;

    if (category === 'color') return true;
    if (category === 'font') return type === 'family' || type === 'size' || type === 'weight';
    if (category === 'line-height') return true;
    if (category === 'spacing') return true;
    if (category === 'radius') return true;
    if (category === 'border' && type === 'width') return true;
    if (category === 'size' && type === 'control') return true;
    if (category === 'opacity' && type === 'disabled') return true;
    if (category === 'shadow') return true;
    if (category === 'transition') return true;

    return false;
}

function ropavExtension(token) {
    return token.extensions?.ropav ?? token.$extensions?.ropav ?? {};
}
