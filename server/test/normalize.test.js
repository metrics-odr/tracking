import test from 'node:test';
import assert from 'node:assert/strict';
import { sha256, hashField, validFbc, validFbp } from '../src/normalize.js';
import { buildUserData, buildEvent } from '../src/capi.js';

// Vetor público da documentação da Meta para e-mail
test('em: trim + lowercase + sha256', () => {
  assert.equal(hashField('em', '  Maria@Exemplo.COM '), sha256('maria@exemplo.com'));
});

test('ph: BR com máscara recebe DDI 55', () => {
  assert.equal(hashField('ph', '(11) 99999-8888'), sha256('5511999998888'));
  assert.equal(hashField('ph', '+55 11 99999-8888'), sha256('5511999998888'));
  assert.equal(hashField('ph', '011999998888'), sha256('5511999998888'));
});

test('geo: ct/st/zp/country', () => {
  assert.equal(hashField('ct', 'São Paulo'), sha256('sãopaulo'));
  assert.equal(hashField('st', 'SP'), sha256('sp'));
  assert.equal(hashField('zp', '01310-100'), sha256('01310100'));
  assert.equal(hashField('country', 'BR'), sha256('br'));
});

test('db/ge', () => {
  assert.equal(hashField('db', '31/01/1990'), sha256('19900131'));
  assert.equal(hashField('db', '1990-01-31'), sha256('19900131'));
  assert.equal(hashField('ge', 'Feminino'), sha256('f'));
});

test('vazio é omitido e hash existente não é re-hasheado', () => {
  assert.equal(hashField('em', '   '), undefined);
  const h = sha256('a@b.com');
  assert.equal(hashField('em', h), h);
});

test('fbc/fbp só aceitos se válidos', () => {
  assert.ok(validFbc('fb.1.1700000000000.AbCdEf'));
  assert.equal(validFbc('abc'), undefined);
  assert.ok(validFbp('fb.1.1700000000000.1234567890'));
  assert.equal(validFbp(''), undefined);
  // sufixo da Parameter Builder Library não pode invalidar o valor
  assert.ok(validFbp('fb.1.1700000000000.1234567890.AQYBAQIA'));
  assert.ok(validFbc('fb.1.1700000000000.AbCdEf.AQYBAQIA'));
});

test('user_data: IP/UA/fbc/fbp não são hasheados', () => {
  const ud = buildUserData({
    em: 'a@b.com', client_ip_address: '2804:14d::1', client_user_agent: 'UA/1',
    fbc: 'fb.1.1700000000000.AbC', fbp: 'fb.1.1700000000000.99',
  });
  assert.equal(ud.client_ip_address, '2804:14d::1');
  assert.equal(ud.client_user_agent, 'UA/1');
  assert.equal(ud.fbc, 'fb.1.1700000000000.AbC');
  assert.equal(ud.em, sha256('a@b.com'));
});

test('buildEvent valida regras principais', () => {
  assert.throws(() => buildEvent({ event_name: 'Lead' }), /event_id/);
  assert.throws(() => buildEvent({ event_name: 'Purchase', event_id: '1' }), /value/);
  assert.throws(() => buildEvent({ event_name: 'Lead', event_id: '1', event_time: Date.now() }), /segundos/);
  const ev = buildEvent({
    event_name: 'Purchase', event_id: 'x', event_source_url: 'https://s.com/ok',
    custom_data: { value: 10, currency: 'BRL' }, user: { em: 'a@b.com' },
  });
  assert.equal(ev.action_source, 'website');
});
