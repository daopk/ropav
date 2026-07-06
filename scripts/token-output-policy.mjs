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
    if (isPrivateToken(token)) return false;

    return ropavExtension(token).scssVariable !== false;
}

export function hasCssCustomProperty(token) {
    if (isPrivateToken(token)) return false;

    const extension = ropavExtension(token);
    if (extension.cssVariable === false) return false;
    if (extension.cssVariable === true) return true;

    const path = tokenPath(token);
    const [category, type] = path;

    if (category === 'color') return isPublicColorToken(path);
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

function isPublicColorToken(path) {
    const colorName = path.slice(1).join('-');

    if (path[1] === 'palette') return false;
    if (path[1] === 'gray') return false;
    if (colorName === 'white' || colorName === 'black') return false;
    if (colorName.startsWith('control-')) return false;

    return true;
}

function isPrivateToken(token) {
    const path = tokenPath(token);

    return path[0] === 'color' && path[1] === 'palette';
}

function ropavExtension(token) {
    return token.extensions?.ropav ?? token.$extensions?.ropav ?? {};
}
