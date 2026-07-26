import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';

const workspaceRoot = fileURLToPath(new URL('../', import.meta.url));

const readWorkspaceFile = (path) => readFile(`${workspaceRoot}${path}`, 'utf8');

describe('release automation', () => {
    it('keeps the legacy changelog compatible with Changesets', async () => {
        const changelog = await readWorkspaceFile('packages/ropav/CHANGELOG.md');

        assert.equal(changelog.split('\n', 1)[0], '# ropav');
    });

    it('gates releases on verification and reuses outputs from the verified commit', async () => {
        const workflow = await readWorkspaceFile('.github/workflows/publish.yml');

        assert.match(workflow, /pull_request:\n\s+branches:\n\s+- main/);
        assert.match(workflow, /release:\n\s+if: .*\n\s+needs: verify/);
        assert.equal(workflow.match(/run: pnpm run verify/g)?.length, 1);
        assert.equal(
            workflow.match(/name: verified-package-dist-\$\{\{ github\.sha \}\}/g)?.length,
            2,
        );
        assert.match(workflow, /tar -czf verified-package-dist\.tgz packages\/\*\/dist/);
        assert.match(workflow, /tar -xzf verified-package-dist\.tgz/);
        assert.match(workflow, /node scripts\/verify-workspace-contracts\.mjs --bundles/);
        assert.doesNotMatch(workflow, /changeset status|release intent|reconcile-release|gitHead/);
    });

    it('uses an automation token for release pull requests and pushes tags only', async () => {
        const workflow = await readWorkspaceFile('.github/workflows/publish.yml');

        assert.match(workflow, /CHANGESETS_TOKEN is required/);
        assert.match(workflow, /GITHUB_TOKEN: \$\{\{ secrets\.CHANGESETS_TOKEN \}\}/);
        assert.doesNotMatch(workflow, /GITHUB_TOKEN: \$\{\{ secrets\.GITHUB_TOKEN \}\}/);
        assert.match(workflow, /persist-credentials: false/);
        assert.match(workflow, /pnpm exec changeset publish/);
        assert.doesNotMatch(workflow, /pnpm run release/);
        assert.match(workflow, /git push origin --tags/);
        assert.doesNotMatch(workflow, /git push origin --follow-tags/);
    });
});
