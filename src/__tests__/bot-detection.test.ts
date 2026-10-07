import { test, describe } from 'node:test';
import assert from 'node:assert';
import { isBot } from '../lib/bot-detection';

describe('Deteksi Bot Link Preview (isBot)', () => {
  test('Mendeteksi crawler preview WhatsApp', () => {
    assert.strictEqual(isBot('WhatsApp/2.21.12.21 A'), true);
  });

  test('Mendeteksi crawler preview Telegram', () => {
    assert.strictEqual(isBot('TelegramBot (like TwitterBot)'), true);
  });

  test('Mendeteksi crawler preview Facebook & Twitter', () => {
    assert.strictEqual(isBot('facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)'), true);
    assert.strictEqual(isBot('Twitterbot/1.0'), true);
  });

  test('Mendeteksi crawler Discord & Slack', () => {
    assert.strictEqual(isBot('Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)'), true);
    assert.strictEqual(isBot('Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)'), true);
  });

  test('Mendeteksi CLI tools (curl, wget)', () => {
    assert.strictEqual(isBot('curl/7.88.1'), true);
    assert.strictEqual(isBot('Wget/1.21.3'), true);
  });

  test('Mengidentifikasi user-agent kosong sebagai bot', () => {
    assert.strictEqual(isBot(null), true);
    assert.strictEqual(isBot(''), true);
  });

  test('Mengizinkan browser manusia biasa (Chrome, Firefox, Safari)', () => {
    assert.strictEqual(
      isBot('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'),
      false
    );
    assert.strictEqual(
      isBot('Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1'),
      false
    );
  });
});
