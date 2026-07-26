import { compile } from '@vue/compiler-vapor';

export interface VaporIconCompiler {
    compiler(svg: string, collection: string, icon: string): string;
}

interface SvgTransform {
    svg: string;
    renderLocals: string;
}

const ID_MAP_LOCAL = '__ropavIconIdMap';
const RANDOM_ID_LOCAL = '__ropavIconRandomId';
const RENDER_FUNCTION_START = 'function render(_ctx) {';

const PAINT_SERVER_REFERENCE = /\b([\w-]+)="url\(#(.+?)\)"/g;
const SVG_ID_ATTRIBUTE = /\bid="(.+?)"/g;

function transformSvgIds(svg: string): SvgTransform {
    if (!svg.includes('="url(#')) {
        return { svg, renderLocals: '' };
    }

    const referencedIds = new Set<string>();

    const svgWithBoundReferences = svg.replace(
        PAINT_SERVER_REFERENCE,
        (_, attribute: string, id: string) => {
            referencedIds.add(id);
            return `:${attribute}="'url(#'+${ID_MAP_LOCAL}['${id}']+')'"`;
        },
    );

    if (referencedIds.size === 0) {
        return { svg, renderLocals: '' };
    }

    const svgWithBoundIds = svgWithBoundReferences.replace(
        SVG_ID_ATTRIBUTE,
        (attribute, id: string) =>
            referencedIds.has(id) ? `:id="${ID_MAP_LOCAL}['${id}']"` : attribute,
    );

    const idMapEntries = Array.from(
        referencedIds,
        (id) => `'${id}':'uicons-'+${RANDOM_ID_LOCAL}()`,
    ).join(',');

    return {
        svg: svgWithBoundIds,
        renderLocals: [
            `const ${RANDOM_ID_LOCAL} = () => Math.random().toString(36).slice(2, 12);`,
            `const ${ID_MAP_LOCAL} = {${idMapEntries}};`,
        ].join('\n  '),
    };
}

function injectRenderLocals(code: string, renderLocals: string): string {
    if (!renderLocals) return code;

    if (!code.includes(RENDER_FUNCTION_START)) {
        throw new Error('Unable to inject SVG ID bindings into the Vapor render function');
    }

    return code
        .replaceAll(`_ctx.${ID_MAP_LOCAL}`, ID_MAP_LOCAL)
        .replace(RENDER_FUNCTION_START, `${RENDER_FUNCTION_START}\n  ${renderLocals}`);
}

function createVaporIconModule(renderCode: string, componentName: string): string {
    return `${renderCode}
import { defineVaporComponent, markRaw } from 'vue';

export default markRaw(defineVaporComponent({ name: ${JSON.stringify(componentName)}, render }))
/* vite-plugin-components disabled */`;
}

/** An unplugin-icons compiler that emits zero-VDOM Vue Vapor components. */
export function vaporIconCompiler(): VaporIconCompiler {
    return {
        compiler(svg, collection, icon) {
            const componentName = `${collection}-${icon}`;
            const transformed = transformSvgIds(svg);
            const compiled = compile(transformed.svg, {
                filename: `${componentName}.vue`,
                prefixIdentifiers: true,
            });

            const renderCode = injectRenderLocals(
                compiled.code.replace(/^export /gm, ''),
                transformed.renderLocals,
            );

            return createVaporIconModule(renderCode, componentName);
        },
    };
}
