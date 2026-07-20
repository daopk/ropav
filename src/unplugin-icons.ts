import { compile } from '@vue/compiler-vapor';

export interface VaporIconCompiler {
    compiler(svg: string, collection: string, icon: string): string;
}

const idMapBinding = '__ropavIconIdMap';
const randomIdHelper = 'const __ropavIconRandomId = () => Math.random().toString(36).slice(2, 12);';

function handleSVGId(svg: string) {
    if (!/="url\(#/.test(svg)) {
        return { svg, injectScripts: '' };
    }

    const idMap: Record<string, string> = {};
    const handled = svg
        .replace(/\b([\w-]+)="url\(#(.+?)\)"/g, (_, attr: string, id: string) => {
            idMap[id] = `'${id}':'uicons-'+__ropavIconRandomId()`;
            return `:${attr}="'url(#'+${idMapBinding}['${id}']+')'"`;
        })
        .replace(/\bid="(.+?)"/g, (full: string, id: string) => {
            if (idMap[id]) return `:id="${idMapBinding}['${id}']"`;
            return full;
        });

    return {
        svg: handled,
        injectScripts: `${randomIdHelper}\n  const ${idMapBinding} = {${Object.values(idMap).join(',')}};`,
    };
}

function injectRenderLocals(code: string, injectScripts: string) {
    if (!injectScripts) return code;

    const renderStart = 'function render(_ctx) {';
    if (!code.includes(renderStart)) {
        throw new Error('Unable to inject SVG ID bindings into the Vapor render function');
    }

    return code
        .replaceAll(`_ctx.${idMapBinding}`, idMapBinding)
        .replace(renderStart, `${renderStart}\n  ${injectScripts}`);
}

/** An unplugin-icons compiler that emits zero-VDOM Vue Vapor components. */
export function vaporIconCompiler(): VaporIconCompiler {
    return {
        compiler(svg, collection, icon) {
            const name = `${collection}-${icon}`;
            const { injectScripts, svg: handled } = handleSVGId(svg);
            let { code } = compile(handled, {
                filename: `${name}.vue`,
                prefixIdentifiers: true,
            });

            code = injectRenderLocals(code.replace(/^export /gm, ''), injectScripts);

            return `${code}
import { defineVaporComponent, markRaw } from 'vue';

export default markRaw(defineVaporComponent({ name: ${JSON.stringify(name)}, render }))
/* vite-plugin-components disabled */`;
        },
    };
}
