import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));

const readRepoFile = (path) => readFile(`${repoRoot}${path}`, 'utf8');

describe('release automation', () => {
    it('keeps the changelog in the conventional format', async () => {
        const changelog = await readRepoFile('CHANGELOG.md');

        assert.equal(changelog.split('\n', 1)[0], '# ropav');
        assert.match(changelog, /^## \[\d+\.\d+\.\d+\]\(/m);
    });

    it('releases with bumpp and publishes only on release commits', async () => {
        const workflow = await readRepoFile('.github/workflows/publish.yml');
        const packageJson = await readRepoFile('package.json');

        assert.match(packageJson, /"release": ".*bumpp/);
        assert.match(packageJson, /--commit \\"chore\(release\): v\{version\}\\"/);
        assert.match(packageJson, /"changelog": "node scripts\/changelog\.mjs"/);
        assert.doesNotMatch(packageJson, /changeset|@changesets/);

        assert.match(workflow, /pull_request:\n\s+branches:\n\s+- main/);
        assert.match(
            workflow,
            /startsWith\(github\.event\.head_commit\.message, 'chore\(release\): v'\)/,
        );
        assert.match(workflow, /release:\n\s+if: .*\n\s+needs: verify/);
        assert.match(workflow, /pnpm publish --access public/);
        assert.doesNotMatch(
            workflow,
            /changeset|CHANGESETS_TOKEN|verified-package-dist|actions\/upload-artifact|actions\/download-artifact|git push origin --tags/,
        );
    });
});
