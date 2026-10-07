import { test, describe } from 'node:test';
import assert from 'node:assert';
import { validateDestinationUrl, validateSlug } from '../lib/validation';

const BASE_URL = 'https://s.pmkitera.web.id';

describe('Validasi URL Tujuan (validateDestinationUrl)', () => {
  test('Menerima URL https valid', () => {
    const res = validateDestinationUrl('https://pmkitera.web.id/tentang-kami', BASE_URL);
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.url, 'https://pmkitera.web.id/tentang-kami');
  });

  test('Menerima URL http valid dan menambahkan https jika tanpa protokol', () => {
    const res = validateDestinationUrl('docs.google.com/forms/d/12345/viewform', BASE_URL);
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.url, 'https://docs.google.com/forms/d/12345/viewform');
  });

  test('Menjaga query string dan fragment URL tetap utuh', () => {
    const res = validateDestinationUrl('https://example.com/page?ref=pmk&id=123#section-2', BASE_URL);
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.url, 'https://example.com/page?ref=pmk&id=123#section-2');
  });

  test('Menolak skema berbahaya (javascript:, data:, file:)', () => {
    assert.strictEqual(validateDestinationUrl('javascript:alert(1)', BASE_URL).valid, false);
    assert.strictEqual(validateDestinationUrl('data:text/html,<script>alert(1)</script>', BASE_URL).valid, false);
    assert.strictEqual(validateDestinationUrl('file:///etc/passwd', BASE_URL).valid, false);
  });

  test('Menolak URL dengan userinfo kredensial (user:pass@host)', () => {
    const res = validateDestinationUrl('https://admin:secret123@example.com', BASE_URL);
    assert.strictEqual(res.valid, false);
    assert.match(res.error || '', /kredensial/i);
  });

  test('Menolak alamat IP literal (v4 dan v6)', () => {
    assert.strictEqual(validateDestinationUrl('http://192.168.1.1/dashboard', BASE_URL).valid, false);
    assert.strictEqual(validateDestinationUrl('http://127.0.0.1:8080', BASE_URL).valid, false);
    assert.strictEqual(validateDestinationUrl('http://8.8.8.8', BASE_URL).valid, false);
    assert.strictEqual(validateDestinationUrl('http://[::1]', BASE_URL).valid, false);
  });

  test('Menolak localhost', () => {
    assert.strictEqual(validateDestinationUrl('http://localhost:3000/test', BASE_URL).valid, false);
    assert.strictEqual(validateDestinationUrl('http://app.localhost', BASE_URL).valid, false);
  });

  test('Menolak domain internasional / Punycode (anti homograph)', () => {
    assert.strictEqual(validateDestinationUrl('https://xn--google-pra.com', BASE_URL).valid, false);
  });

  test('Menolak loop ke domain PI-LYNK sendiri', () => {
    assert.strictEqual(validateDestinationUrl('https://s.pmkitera.web.id/loop', BASE_URL).valid, false);
    assert.strictEqual(validateDestinationUrl('https://pi-lynk.vercel.app/target', BASE_URL).valid, false);
  });

  test('Mengizinkan domain utama pmkitera.web.id', () => {
    assert.strictEqual(validateDestinationUrl('https://pmkitera.web.id/event/paskah', BASE_URL).valid, true);
  });

  test('Menolak pemendek link lain (bit.ly, tinyurl, linktr.ee, dll)', () => {
    assert.strictEqual(validateDestinationUrl('https://bit.ly/3xyz', BASE_URL).valid, false);
    assert.strictEqual(validateDestinationUrl('https://tinyurl.com/abc', BASE_URL).valid, false);
    assert.strictEqual(validateDestinationUrl('https://linktr.ee/pmk', BASE_URL).valid, false);
    assert.strictEqual(validateDestinationUrl('https://s.id/halo', BASE_URL).valid, false);
  });

  test('Menolak URL kosong atau melebihi 2048 karakter', () => {
    assert.strictEqual(validateDestinationUrl('', BASE_URL).valid, false);
    assert.strictEqual(validateDestinationUrl('   ', BASE_URL).valid, false);
    assert.strictEqual(validateDestinationUrl(`https://example.com/${'a'.repeat(2100)}`, BASE_URL).valid, false);
  });
});

describe('Validasi Slug (validateSlug)', () => {
  test('Menerima slug yang valid dan menormalisasi ke huruf kecil', () => {
    const res = validateSlug('Paskah-2026', false);
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.slug, 'paskah-2026');
  });

  test('Menolak slug kurang dari 3 karakter', () => {
    assert.strictEqual(validateSlug('ab', false).valid, false);
  });

  test('Menolak slug lebih dari 50 karakter', () => {
    assert.strictEqual(validateSlug('a'.repeat(51), false).valid, false);
  });

  test('Menolak karakter tidak valid (spasi, simbol, underscore)', () => {
    assert.strictEqual(validateSlug('paskah 2026', false).valid, false);
    assert.strictEqual(validateSlug('paskah_2026', false).valid, false);
    assert.strictEqual(validateSlug('paskah@2026', false).valid, false);
  });

  test('Menolak tanda hubung di awal atau akhir slug', () => {
    assert.strictEqual(validateSlug('-paskah', false).valid, false);
    assert.strictEqual(validateSlug('paskah-', false).valid, false);
  });

  test('Menolak Reserved Slug sistem untuk publik maupun admin', () => {
    assert.strictEqual(validateSlug('admin', false).valid, false);
    assert.strictEqual(validateSlug('admin', true).valid, false);
    assert.strictEqual(validateSlug('api', false).valid, false);
    assert.strictEqual(validateSlug('laporkan', false).valid, false);
    assert.strictEqual(validateSlug('ketentuan', false).valid, false);
  });

  test('Protected Keywords: ditolak untuk pengguna publik', () => {
    assert.strictEqual(validateSlug('pmk-berita', false).valid, false);
    assert.strictEqual(validateSlug('itera-kegiatan', false).valid, false);
    assert.strictEqual(validateSlug('info-resmi', false).valid, false);
    assert.strictEqual(validateSlug('portal-official', false).valid, false);
  });

  test('Protected Keywords: DIIZINKAN untuk admin', () => {
    const res = validateSlug('pmk-berita', true);
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.slug, 'pmk-berita');
  });
});
