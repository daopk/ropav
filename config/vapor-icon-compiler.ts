import type { CustomCompiler } from 'unplugin-icons';
import { compile } from '@vue/compiler-vapor';

const randomIdHelper = 'const __randId = () => Math.random().toString(36).substr(2, 10);';

function handleSVGId(svg: string) {
    if (!/="url\(#/.test(svg)) {
        return { svg, injectScripts: '' };
    }

    const idMap: Record<string, string> = {};
    const handled = svg
        .replace(/\b([\w-]+)="url\(#(.+?)\)"/g, (_, attr: string, id: string) => {
            idMap[id] = `'${id}':'uicons-'+__randId()`;
            return `:${attr}="'url(#'+idMap['${id}']+')'"`;
        })
        .replace(/\bid="(.+?)"/g, (full: string, id: string) => {
            if (idMap[id]) return `:id="idMap['${id}']"`;
            return full;
        });

    return {
        svg: handled,
        injectScripts: `${randomIdHelper}const idMap = {${Object.values(idMap).join(',')}};`,
    };
}

export function createVaporIconCompiler(): CustomCompiler {
    return {
        compiler(svg, collection, icon) {
            const name = `${collection}-${icon}`;
            const { injectScripts, svg: handled } = handleSVGId(svg);
            let { code } = compile(handled, {
                filename: `${name}.vue`,
            });

            code = code.replace(/^export /gm, '');
            const setup = injectScripts ? `,\n    setup() {${injectScripts};return { idMap }}` : '';

            return `${code}
import { defineVaporComponent, markRaw } from 'vue';

export default markRaw(defineVaporComponent({ name: ${JSON.stringify(name)}, render${setup} }))
/* vite-plugin-components disabled */`;
        },
    };
}
