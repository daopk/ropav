import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';

const workspaceRoot = fileURLToPath(new URL('../', import.meta.url));

const readWorkspaceFile = (path) => readFile(`${workspaceRoot}${path}`, 'utf8');

describe('release automation', () => {
    it('keeps per-package changelogs in the conventional format', async () => {
        const changelog = await readWorkspaceFile('packages/ropav/CHANGELOG.md');

        assert.equal(changelog.split('\n', 1)[0], '# ropav');
        assert.match(
            changelog,
            /^## \[0\.1\.8\]\(https:\/\/github\.com\/daopk\/ropav\/compare\/v0\.1\.7\.\.\.v0\.1\.8\)/m,
        );
    });

    it('releases with bumpp and publishes only on release commits', async () => {
        const workflow = await readWorkspaceFile('.github/workflows/publish.yml');
        const packageJson = await readWorkspaceFile('package.json');

        assert.match(packageJson, /"release": ".*bumpp/);
        assert.match(packageJson, /--all --commit \\"chore\(release\): v\{version\}\\"/);
        assert.match(packageJson, /"changelog": "node scripts\/changelog\.mjs"/);
        assert.doesNotMatch(packageJson, /changeset|@changesets/);

        assert.match(workflow, /pull_request:\n\s+branches:\n\s+- main/);
        assert.match(
            workflow,
            /startsWith\(github\.event\.head_commit\.message, 'chore\(release\): v'\)/,
        );
        assert.match(workflow, /release:\n\s+if: .*\n\s+needs: verify/);
        assert.match(workflow, /pnpm -r publish --access public/);
        assert.doesNotMatch(
            workflow,
            /changeset|CHANGESETS_TOKEN|verified-package-dist|actions\/upload-artifact|actions\/download-artifact|git push origin --tags/,
        );
    });
});
