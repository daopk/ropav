import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { decideReleaseTag } from '../scripts/reconcile-release-tags.mjs';

describe('release tag reconciliation', () => {
    const head = '1111111111111111111111111111111111111111';

    it('only creates a tag for a package published from the current commit', () => {
        assert.equal(
            decideReleaseTag({
                head,
                publishedGitHead: head,
            }),
            'create',
        );
        assert.equal(
            decideReleaseTag({
                head,
                publishedGitHead: undefined,
            }),
            'skip-unpublished',
        );
        assert.equal(
            decideReleaseTag({
                head,
                publishedGitHead: '2222222222222222222222222222222222222222',
            }),
            'skip-other-commit',
        );
    });

    it('distinguishes tags that need pushing from tags already on the remote', () => {
        assert.equal(
            decideReleaseTag({
                head,
                localTagCommit: head,
                publishedGitHead: head,
            }),
            'push-existing',
        );
        assert.equal(
            decideReleaseTag({
                head,
                localTagCommit: head,
                publishedGitHead: head,
                remoteTagCommit: head,
            }),
            'already-remote',
        );
    });

    it('rejects an existing tag that points to a different commit', () => {
        assert.throws(
            () =>
                decideReleaseTag({
                    head,
                    localTagCommit: '2222222222222222222222222222222222222222',
                    publishedGitHead: head,
                }),
            /local tag points to/,
        );
        assert.throws(
            () =>
                decideReleaseTag({
                    head,
                    publishedGitHead: head,
                    remoteTagCommit: '2222222222222222222222222222222222222222',
                }),
            /remote tag points to/,
        );
    });
});
