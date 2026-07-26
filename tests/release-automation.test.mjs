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

    it('uses an automation token for release pull requests and pushes tags only', async () => {
        const workflow = await readWorkspaceFile('.github/workflows/publish.yml');

        assert.match(workflow, /CHANGESETS_TOKEN is required/);
        assert.match(workflow, /GITHUB_TOKEN: \$\{\{ secrets\.CHANGESETS_TOKEN \}\}/);
        assert.doesNotMatch(workflow, /GITHUB_TOKEN: \$\{\{ secrets\.GITHUB_TOKEN \}\}/);
        assert.match(workflow, /persist-credentials: false/);
        assert.match(workflow, /git push origin --tags/);
        assert.doesNotMatch(workflow, /git push origin --follow-tags/);
    });

    it('only exempts internal Changesets release branches from release intent checks', async () => {
        const workflow = await readWorkspaceFile('.github/workflows/verify.yml');

        assert.match(
            workflow,
            /github\.event\.pull_request\.head\.repo\.full_name == github\.repository/,
        );
        assert.match(workflow, /startsWith\(github\.head_ref, 'changeset-release\/'\)/);
        assert.doesNotMatch(workflow, /github-actions\[bot\]/);
    });
});
