import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { canManageLink, forbiddenLinkChange, lynkRoleFrom, ownsLink } from '../lib/permissions';
import { accessReason } from '../lib/auth/access-messages';
import { googleLoginError, handoffMatches, newHandoff, picoreGoogleUrl } from '../lib/auth/google-login';

describe('lynkRoleFrom (PI-CORE my_app_roles)', () => {
  it('admin wins, pengurus next, otherwise no access', () => {
    assert.equal(lynkRoleFrom(['admin', 'pengurus']), 'admin');
    assert.equal(lynkRoleFrom(['pengurus']), 'pengurus');
    assert.equal(lynkRoleFrom(['other']), null);
    assert.equal(lynkRoleFrom([]), null);
    assert.equal(lynkRoleFrom(null), null);
  });
});

describe('link ownership', () => {
  const mine = { createdBy: 'Maria@Example.com' };
  it('matches the creator email case-insensitively', () => {
    assert.equal(ownsLink('maria@example.com', mine), true);
    assert.equal(ownsLink('other@example.com', mine), false);
    assert.equal(ownsLink('maria@example.com', { createdBy: null }), false);
  });
  it('admins manage every link, pengurus only their own', () => {
    assert.equal(canManageLink('admin', 'x@example.com', { createdBy: null }), true);
    assert.equal(canManageLink('pengurus', 'maria@example.com', mine), true);
    assert.equal(canManageLink('pengurus', 'other@example.com', mine), false);
  });
});

describe('forbiddenLinkChange', () => {
  const active = { status: 'active', isOfficial: false };
  it('lets admins change anything', () => {
    assert.equal(forbiddenLinkChange('admin', { status: 'blocked', isOfficial: true }, active), null);
  });
  it('stops pengurus from blocking, touching a blocked link, or changing the official mark', () => {
    assert.match(forbiddenLinkChange('pengurus', { status: 'blocked' }, active)!, /memblokir/);
    assert.match(forbiddenLinkChange('pengurus', { status: 'active' }, { status: 'blocked', isOfficial: false })!, /diblokir/);
    assert.match(forbiddenLinkChange('pengurus', { isOfficial: true }, active)!, /resmi/);
    assert.equal(forbiddenLinkChange('pengurus', { status: 'inactive', isOfficial: false }, active), null);
    assert.equal(forbiddenLinkChange('pengurus', { isOfficial: true }, { status: 'active', isOfficial: true }), null);
  });
});

describe('Google login through PI-CORE', () => {
  it('sends the lynk app key and a fresh handoff', () => {
    const h = newHandoff();
    assert.match(h, /^[A-Za-z0-9_-]{43}$/);
    assert.notEqual(h, newHandoff());
    const u = new URL(picoreGoogleUrl(h));
    assert.equal(u.pathname, '/auth/google');
    assert.equal(u.searchParams.get('app'), 'lynk');
    assert.equal(u.searchParams.get('handoff'), h);
  });
  it('compares the handoff exactly and only passes known codes', () => {
    assert.equal(handoffMatches('abc', 'abc'), true);
    assert.equal(handoffMatches('abc', 'abd'), false);
    assert.equal(handoffMatches(undefined, 'abc'), false);
    assert.equal(googleLoginError('<x>'), 'failed');
    assert.equal(accessReason('temporary_password'), 'temporary_password');
    assert.equal(accessReason('x'), 'no_role');
  });
});
