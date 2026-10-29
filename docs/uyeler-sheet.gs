/**
 * EV Türkiye üye listesi → Google E-Tablolar (Apps Script)
 *
 * Firestore'daki "users" koleksiyonunu okur ve "Üyeler" sayfasına yazar (en yeni üye en üstte).
 * Anahtar/şifre gerekmez: script, Firebase projesinin sahibi olan Google hesabınızla çalışır.
 *
 * Kurulum: docs/uyeler-sheet.md
 */
const PROJECT_ID = 'evturkiye-uyelik';
const SHEET_NAME = 'Üyeler';
const HEADERS = ['Kayıt tarihi', 'Ad soyad', 'E-posta', 'Şehir', 'Araç durumu', 'Kayıtlı araç', 'Ticari ileti onayı', 'KVKK onayı', 'Son güncelleme', 'UID'];
const DURUM = { ev: 'Elektrikli araç sahibi', phev: 'Plug-in hibrit sahibi', buyer: 'Almayı düşünüyor', none: 'Aracı yok' };

function uyeleriGuncelle() {
  const docs = firestoreList_('users');
  const rows = docs.map((d) => {
    const f = d.fields || {};
    const v = val_(f.vehicle) || {};
    return {
      created: val_(f.createdAt) || null,
      row: [
        val_(f.createdAt) || '',
        val_(f.name) || '',
        val_(f.email) || '',
        val_(f.city) || '',
        DURUM[v.status] || v.status || '',
        val_(f.car) || v.car || v.carOther || '',
        (val_(f.consents) || {}).marketing ? 'Evet' : 'Hayır',
        (val_(f.consents) || {}).kvkk ? 'Evet' : 'Hayır',
        val_(f.updatedAt) || '',
        d.name.split('/').pop(),
      ],
    };
  });
  rows.sort((a, b) => (b.created ? b.created.getTime() : 0) - (a.created ? a.created.getTime() : 0));

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  const before = Math.max(sh.getLastRow() - 1, 0);
  sh.clearContents();
  sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
  if (rows.length) sh.getRange(2, 1, rows.length, HEADERS.length).setValues(rows.map((r) => r.row));
  sh.getRange('A:A').setNumberFormat('dd.mm.yyyy hh:mm');
  sh.getRange('I:I').setNumberFormat('dd.mm.yyyy hh:mm');
  sh.setFrozenRows(1);

  // Özet sayfası
  const ozet = ss.getSheetByName('Özet') || ss.insertSheet('Özet');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const week = new Date(today.getTime() - 6 * 864e5);
  const c = (fn) => rows.filter(fn).length;
  ozet.clearContents();
  ozet.getRange(1, 1, 6, 2).setValues([
    ['Toplam üye', rows.length],
    ['Bugün katılan', c((r) => r.created && r.created >= today)],
    ['Son 7 gün', c((r) => r.created && r.created >= week)],
    ['Ticari ileti onayı veren', c((r) => r.row[6] === 'Evet')],
    ['Elektrikli araç sahibi', c((r) => r.row[4] === DURUM.ev)],
    ['Son güncelleme', new Date()],
  ]);
  ozet.getRange('A:A').setFontWeight('bold');
  ozet.getRange('B6').setNumberFormat('dd.mm.yyyy hh:mm');

  // İsteğe bağlı: yeni üye gelince e-posta bildirimi (BILDIRIM_EPOSTA boş değilse)
  const to = PropertiesService.getScriptProperties().getProperty('BILDIRIM_EPOSTA');
  if (to && before > 0 && rows.length > before) {
    const yeni = rows.slice(0, rows.length - before).map((r) => `${r.row[1] || '(adsız)'} · ${r.row[2]} · ${r.row[3] || ''}`).join('\n');
    MailApp.sendEmail(to, `EV Türkiye: ${rows.length - before} yeni üye`, `${yeni}\n\nToplam üye: ${rows.length}\n${ss.getUrl()}`);
  }
}

/** Her 10 dakikada bir otomatik güncelleme kurar (bir kez çalıştırın). */
function otomatikGuncellemeKur() {
  ScriptApp.getProjectTriggers().forEach((t) => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('uyeleriGuncelle').timeBased().everyMinutes(10).create();
  uyeleriGuncelle();
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('EV Türkiye').addItem('Üyeleri şimdi güncelle', 'uyeleriGuncelle').addToUi();
}

function firestoreList_(collection) {
  const out = [];
  let token = '';
  do {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}?pageSize=300${token ? '&pageToken=' + encodeURIComponent(token) : ''}`;
    const res = UrlFetchApp.fetch(url, { headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }, muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) throw new Error('Firestore okunamadı (' + res.getResponseCode() + '): ' + res.getContentText().slice(0, 300));
    const j = JSON.parse(res.getContentText());
    (j.documents || []).forEach((d) => out.push(d));
    token = j.nextPageToken || '';
  } while (token);
  return out;
}

/** Firestore REST değerini düz JS değerine çevirir. */
function val_(v) {
  if (!v) return undefined;
  if ('stringValue' in v) return v.stringValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('timestampValue' in v) return new Date(v.timestampValue);
  if ('nullValue' in v) return null;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(val_);
  if ('mapValue' in v) { const o = {}; Object.entries(v.mapValue.fields || {}).forEach(([k, x]) => (o[k] = val_(x))); return o; }
  return undefined;
}
