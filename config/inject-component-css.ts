import { posix } from 'node:path';
import { list, parse } from 'postcss';
import type { Plugin } from 'vite';

export function injectComponentCss(): Plugin {
    return {
        name: 'inject-component-css',
        apply(config, { command }) {
            return command === 'build' && !!config.build?.lib;
        },
        enforce: 'post',
        generateBundle(_, bundle) {
            for (const chunk of Object.values(bundle)) {
                if (chunk.type !== 'chunk') continue;
                const importedCss = (chunk as any).viteMetadata?.importedCss as
                    | Set<string>
                    | undefined;
                if (!importedCss?.size) continue;

                const imports = [...importedCss]
                    .map((css) => {
                        const rel = posix.relative(posix.dirname(chunk.fileName), css);
                        return `import '${rel.startsWith('.') ? rel : './' + rel}';`;
                    })
                    .join('\n');
                chunk.code = imports + '\n' + chunk.code;
            }

            const aggregateCss = Object.values(bundle)
                // oxlint-disable-next-line unicorn/no-array-sort -- the configured ES target does not provide toSorted()
                .sort((left, right) => left.fileName.localeCompare(right.fileName))
                .flatMap((entry) =>
                    entry.type === 'asset' && entry.fileName.endsWith('.css')
                        ? String(entry.source)
                        : [],
                )
                .join('\n');
            this.emitFile({
                type: 'asset',
                fileName: 'legacy-unlayered.css',
                source: flattenRopavLayers(aggregateCss),
            });
        },
    };
}

export function flattenRopavLayers(source: string) {
    const root = parse(source);

    root.walkAtRules('layer', (rule) => {
        const layerNames = list.comma(rule.params).map((name) => name.trim());

        if (
            !rule.nodes &&
            layerNames.length === 2 &&
            layerNames[0] === 'ropav.tokens' &&
            layerNames[1] === 'ropav.components'
        ) {
            rule.remove();
            return;
        }

        if (
            rule.nodes &&
            layerNames.length === 1 &&
            (layerNames[0] === 'ropav.tokens' || layerNames[0] === 'ropav.components')
        ) {
            rule.replaceWith(...rule.nodes);
        }
    });

    return root.toString();
}
