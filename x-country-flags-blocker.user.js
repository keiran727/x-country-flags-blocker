// ==UserScript==
// @name         X Country Flags & Blocker
// @namespace    https://github.com/keiran727/x-country-flags-blocker
// @version      1.0.0
// @description  Country flags next to X usernames, plus hiding posts by country / VPN-proxy. Uses X's own "About this account" data. No third-party servers.
// @author       keiran727
// @homepage     https://github.com/keiran727/x-country-flags-blocker
// @match        https://x.com/*
// @match        https://twitter.com/*
// @run-at       document-start
// @noframes
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        unsafeWindow
// ==/UserScript==

(() => {
  'use strict';

  const W = unsafeWindow;
  const pageFetch = W.fetch.bind(W);

  // Public web-client bearer token (same one X's own site sends with every API call).
  const BEARER = 'AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA';

  /* ---------------------------------------------------------------- settings */
  const S = Object.assign(
    { flags: true, block: '', vpn: false, verified: false, bypass: true, tomb: false, qid: '' },
    GM_getValue('s', {})
  );
  const saveS = () => GM_setValue('s', S);

  /* --------------------------------------------------------- country helpers */
  const CT = 'AF Afghanistan|AX Åland Islands|AL Albania|DZ Algeria|AS American Samoa|AD Andorra|AO Angola|AI Anguilla|AG Antigua and Barbuda|AR Argentina|AM Armenia|AW Aruba|AU Australia|AT Austria|AZ Azerbaijan|BS Bahamas|BH Bahrain|BD Bangladesh|BB Barbados|BY Belarus|BE Belgium|BZ Belize|BJ Benin|BM Bermuda|BT Bhutan|BO Bolivia|BA Bosnia and Herzegovina|BW Botswana|BR Brazil|IO British Indian Ocean Territory|VG British Virgin Islands|BN Brunei|BG Bulgaria|BF Burkina Faso|BI Burundi|KH Cambodia|CM Cameroon|CA Canada|CV Cape Verde|BQ Caribbean Netherlands|KY Cayman Islands|CF Central African Republic|TD Chad|CL Chile|CN China|CO Colombia|KM Comoros|CG Congo - Brazzaville|CD Congo - Kinshasa|CK Cook Islands|CR Costa Rica|CI Côte d’Ivoire|HR Croatia|CU Cuba|CW Curaçao|CY Cyprus|CZ Czechia|DK Denmark|DJ Djibouti|DM Dominica|DO Dominican Republic|EC Ecuador|EG Egypt|SV El Salvador|GQ Equatorial Guinea|ER Eritrea|EE Estonia|SZ Eswatini|ET Ethiopia|FK Falkland Islands|FO Faroe Islands|FJ Fiji|FI Finland|FR France|GF French Guiana|PF French Polynesia|GA Gabon|GM Gambia|GE Georgia|DE Germany|GH Ghana|GI Gibraltar|GR Greece|GL Greenland|GD Grenada|GP Guadeloupe|GU Guam|GT Guatemala|GG Guernsey|GN Guinea|GW Guinea-Bissau|GY Guyana|HT Haiti|HN Honduras|HK Hong Kong|HU Hungary|IS Iceland|IN India|ID Indonesia|IR Iran|IQ Iraq|IE Ireland|IM Isle of Man|IL Israel|IT Italy|JM Jamaica|JP Japan|JE Jersey|JO Jordan|KZ Kazakhstan|KE Kenya|KI Kiribati|XK Kosovo|KW Kuwait|KG Kyrgyzstan|LA Laos|LV Latvia|LB Lebanon|LS Lesotho|LR Liberia|LY Libya|LI Liechtenstein|LT Lithuania|LU Luxembourg|MO Macao|MG Madagascar|MW Malawi|MY Malaysia|MV Maldives|ML Mali|MT Malta|MH Marshall Islands|MQ Martinique|MR Mauritania|MU Mauritius|YT Mayotte|MX Mexico|FM Micronesia|MD Moldova|MC Monaco|MN Mongolia|ME Montenegro|MS Montserrat|MA Morocco|MZ Mozambique|MM Myanmar|NA Namibia|NR Nauru|NP Nepal|NL Netherlands|NC New Caledonia|NZ New Zealand|NI Nicaragua|NE Niger|NG Nigeria|NU Niue|KP North Korea|MK North Macedonia|MP Northern Mariana Islands|NO Norway|OM Oman|PK Pakistan|PW Palau|PS Palestine|PA Panama|PG Papua New Guinea|PY Paraguay|PE Peru|PH Philippines|PL Poland|PT Portugal|PR Puerto Rico|QA Qatar|RE Réunion|RO Romania|RU Russia|RW Rwanda|WS Samoa|SM San Marino|ST São Tomé and Príncipe|SA Saudi Arabia|SN Senegal|RS Serbia|SC Seychelles|SL Sierra Leone|SG Singapore|SX Sint Maarten|SK Slovakia|SI Slovenia|SB Solomon Islands|SO Somalia|ZA South Africa|KR South Korea|SS South Sudan|ES Spain|LK Sri Lanka|BL St. Barthélemy|SH St. Helena|KN St. Kitts and Nevis|LC St. Lucia|MF St. Martin|PM St. Pierre and Miquelon|VC St. Vincent and Grenadines|SD Sudan|SR Suriname|SE Sweden|CH Switzerland|SY Syria|TW Taiwan|TJ Tajikistan|TZ Tanzania|TH Thailand|TL Timor-Leste|TG Togo|TK Tokelau|TO Tonga|TT Trinidad and Tobago|TN Tunisia|TR Türkiye|TM Turkmenistan|TC Turks and Caicos Islands|TV Tuvalu|VI U.S. Virgin Islands|UG Uganda|UA Ukraine|AE United Arab Emirates|GB United Kingdom|US United States|UY Uruguay|UZ Uzbekistan|VU Vanuatu|VA Vatican City|VE Venezuela|VN Vietnam|WF Wallis and Futuna|EH Western Sahara|YE Yemen|ZM Zambia|ZW Zimbabwe';
  const ALIAS = 'CZ Czech Republic|CI Ivory Coast|TR Turkey|MM Burma|MO Macau|SZ Swaziland|GB UK|GB Great Britain|US USA|CD DR Congo|CD Democratic Republic of the Congo|CG Republic of the Congo|KR Korea|MK Macedonia|PS Palestinian Territories|VA Vatican|BN Brunei Darussalam|TL East Timor|CV Cabo Verde|LC Saint Lucia|KN Saint Kitts and Nevis|VC Saint Vincent and the Grenadines|BL Saint Barthelemy|MF Saint Martin|PM Saint Pierre and Miquelon|SH Saint Helena|VI US Virgin Islands|VI United States Virgin Islands|HK Hong Kong SAR China|MO Macao SAR China|FM Federated States of Micronesia';

  const norm = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/&/g, 'and').replace(/[^a-z0-9]/g, '');
  const N2C = new Map();
  const CODES = new Set();
  for (const e of (CT + '|' + ALIAS).split('|')) N2C.set(norm(e.slice(3)), e.slice(0, 2));
  for (const e of CT.split('|')) CODES.add(e.slice(0, 2));

  // "India" / "in" -> "IN"; unknown strings (regions like "South Asia") -> normalised string.
  const keyOf = s => {
    s = String(s).trim();
    if (/^[A-Za-z]{2}$/.test(s) && CODES.has(s.toUpperCase())) return s.toUpperCase();
    const n = norm(s);
    return N2C.get(n) || n;
  };
  const KC = {};
  const kc = c => KC[c] || (KC[c] = keyOf(c));

  const isCode = k => /^[A-Z]{2}$/.test(k);
  const flagURL = k => 'https://abs-0.twimg.com/emoji/v2/svg/' +
    (isCode(k) ? [...k].map(c => (0x1F1E6 + c.charCodeAt(0) - 65).toString(16)).join('-') : '1f310') + '.svg';
  const emoji = k => isCode(k) ? String.fromCodePoint(...[...k].map(c => 0x1F1E6 + c.charCodeAt(0) - 65)) : '🌐';

  let BL = new Set();
  const rebuild = () => { BL = new Set(S.block.split(',').map(x => x.trim()).filter(Boolean).map(keyOf)); };
  rebuild();

  /* ------------------------------------------------------------------- cache */
  // C[handle] = { c: country ('' = none), a: location_accurate, s: source, t: timestamp }
  let C = {};
  try { C = JSON.parse(GM_getValue('c', '{}')) || {}; } catch (e) { /* ignore */ }
  let dirty = false;
  const TTL = 30 * 864e5;   // 30 days for known accounts
  const NEG = 36e5;         // 1 hour for "no data"
  const MAX = 5000;

  const save = () => {
    if (!dirty) return;
    dirty = false;
    const k = Object.keys(C);
    if (k.length > MAX) k.sort((a, b) => C[a].t - C[b].t).slice(0, k.length - MAX + 1000).forEach(x => delete C[x]);
    GM_setValue('c', JSON.stringify(C));
  };
  setInterval(save, 15000);
  addEventListener('pagehide', save);

  const FOL = new Set();    // handles the viewer follows (read from X's own timeline responses)
  const SEEN = new Map();   // handle -> country, this session only

  /* ----------------------------------------------------- AboutAccountQuery API */
  const ST = { hook: 0, tl: 0, ok: 0, err: 0, last: '' };   // counters for the Diagnostics menu item
  const log = (...a) => console.log('%c[x-flags]', 'color:#1d9bf0', ...a);
  let qid = S.qid || GM_getValue('qid', '');
  let qsrc = S.qid ? 'manual' : qid ? 'saved' : 'none';
  let tmpl = GM_getValue('tmpl', '');   // extra query params (features etc.) copied from X's own request
  let qidRetry = 0, hinted = false;
  const own = new Set();   // URLs of our own lookups (the resource timeline records those too)

  // Learn the query ID (and any extra params) from a request X itself made, e.g. when you open "About this account".
  function sawQid(url) {
    try {
      const u = new URL(url, location.href);
      const m = u.pathname.match(/\/graphql\/([\w-]+)\/AboutAccountQuery$/);
      if (!m || own.has(u.href)) return;
      u.searchParams.delete('variables');
      tmpl = u.searchParams.toString();
      GM_setValue('tmpl', tmpl);
      if (!S.qid && qid !== m[1]) {
        qid = m[1]; qsrc = 'x'; GM_setValue('qid', qid); log('query id learned from X:', qid);
        for (const k in retryAt) delete retryAt[k];
        schedule();
      }
    } catch (e) { /* ignore */ }
  }
  // Hook-free: the browser's own resource timeline lists every request X makes, whatever world we run in.
  try {
    new PerformanceObserver(l => l.getEntries().forEach(e => { if (e.name.indexOf('AboutAccountQuery') > 0) sawQid(e.name); }))
      .observe({ type: 'resource', buffered: true });
  } catch (e) { /* unsupported */ }

  const OPRE = /queryId:"([\w-]+)",operationName:"AboutAccountQuery"/;
  async function discoverQid() {
    const urls = new Set();
    document.querySelectorAll('script[src]').forEach(s => urls.add(s.src));
    performance.getEntriesByType('resource').forEach(r => urls.add(r.name));
    const list = [...urls].filter(u => /abs\.twimg\.com\/.*\.js/.test(u))
      .sort((a, b) => /api|main/.test(b) - /api|main/.test(a));
    const lazy = new Set();   // best effort: lazy-loaded "About" chunks named in X's webpack chunk map
    for (const u of list) {
      try {
        const t = await (await pageFetch(u)).text();
        const m = t.match(OPRE);
        if (m) return m[1];
        const base = u.replace(/[^/]*$/, '');
        for (const c of t.matchAll(/"((?:bundle|loader|ondemand\.s)[\w.\-]*about[\w.\-]*)":"([0-9a-f]{7})"/gi))
          lazy.add(base + c[1] + '.' + c[2] + 'a.js');
      } catch (e) { /* try next */ }
    }
    for (const u of [...lazy].slice(0, 12)) {
      try { const m = (await (await pageFetch(u)).text()).match(OPRE); if (m) return m[1]; } catch (e) { /* ignore */ }
    }
    return '';
  }

  async function getQid() {
    if (S.qid) return S.qid;
    if (qid) return qid;
    if (Date.now() < qidRetry) return '';
    qid = await discoverQid();
    if (qid) { qsrc = 'bundle'; GM_setValue('qid', qid); log('query id found in X scripts:', qid); }
    else {
      qidRetry = Date.now() + 12e4;
      ST.last = 'Query ID not found in X scripts';
      if (!hinted) {
        hinted = true;
        toast('X Flags needs one hint: open any profile, tap "Joined ..." and open "About this account" once. (Menu > Diagnostics)', 12000);
      }
    }
    return qid;
  }

  function qidBad() {
    if (S.qid) return;
    qid = ''; qsrc = 'none';
    GM_setValue('qid', '');
    qidRetry = Date.now() + 12e4;
  }

  const ct0 = () => (document.cookie.match(/(?:^|;\s*)ct0=([^;]+)/) || [])[1] || '';
  const findAbout = o => {
    if (!o || typeof o !== 'object') return;
    if (o.about_profile) return o.about_profile;
    for (const k in o) { const r = findAbout(o[k]); if (r) return r; }
  };

  async function fetchAbout(h) {
    const id = await getQid();
    if (!id) throw new Error('no query id');
    const url = '/i/api/graphql/' + id + '/AboutAccountQuery?variables=' +
      encodeURIComponent(JSON.stringify({ screenName: h })) + (tmpl ? '&' + tmpl : '');
    if (own.size > 500) own.clear();
    own.add(new URL(url, location.href).href);
    const r = await pageFetch(url, {
      credentials: 'include',
      headers: {
        authorization: 'Bearer ' + BEARER,
        'x-csrf-token': ct0(),
        'x-twitter-active-user': 'yes',
        'x-twitter-auth-type': 'OAuth2Session',
        'content-type': 'application/json'
      }
    });
    if (r.status === 429) {
      const reset = +r.headers.get('x-rate-limit-reset') * 1000;
      pause = reset > Date.now() ? reset + 1000 : Date.now() + 6e4;
      ST.err++; ST.last = 'Rate limited (429) - pausing';
      throw new Error(ST.last);
    }
    if (!r.ok) {
      ST.err++;
      ST.last = 'HTTP ' + r.status + ' ' + (await r.text().catch(() => '')).slice(0, 160);
      log(ST.last);
      if (r.status === 400 || r.status === 404) qidBad();
      throw new Error(ST.last);
    }
    const j = await r.json();
    if (!j || !j.data) {
      ST.err++; ST.last = 'No data: ' + JSON.stringify(j).slice(0, 160);
      log(ST.last); qidBad();
      throw new Error(ST.last);
    }
    ST.ok++; ST.last = '';
    const ab = findAbout(j);
    C[h] = ab && ab.account_based_in
      ? { c: ab.account_based_in, a: ab.location_accurate, s: ab.source || '', t: Date.now() }
      : { c: '', t: Date.now() };
    dirty = true;
  }

  /* ------------------------------------------------------------------- queue */
  const Q = [], P = new Set(), retryAt = {};
  let busy = false, pause = 0, fails = 0;
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  function enqueue(h) {
    if (P.has(h) || (retryAt[h] || 0) > Date.now()) return;
    P.add(h); Q.push(h);
    if (Q.length > 80) P.delete(Q.shift());
    run();
  }

  async function run() {
    if (busy) return;
    busy = true;
    while (Q.length) {
      const wait = pause - Date.now();
      if (wait > 0) await sleep(wait);
      const h = Q.pop();               // newest first = what you're scrolling into
      try { await fetchAbout(h); fails = 0; }
      catch (e) {
        retryAt[h] = Date.now() + 6e4;
        if (++fails >= 5) { fails = 0; pause = Date.now() + 3e5; ST.last += '  (5 failures in a row: pausing 5 min)'; }
      }
      P.delete(h);
      schedule();
      await sleep(350);
    }
    busy = false;
  }

  function get(h) {
    const e = C[h];
    if (!e || Date.now() - e.t > (e.c ? TTL : NEG)) enqueue(h);
    return e;   // stale data is still shown while it refreshes
  }

  /* ------------------------------------------------ passive reads of X's own traffic */
  const TL = /Timeline|TweetDetail|UserTweets|Search|Likes|Media|Replies|ListLatest|Community/;

  function harvest(o) {
    if (!o || typeof o !== 'object') return;
    if (o.__typename === 'User') {
      const h = (o.core && o.core.screen_name) || (o.legacy && o.legacy.screen_name);
      const rp = o.relationship_perspectives || o.legacy || {};
      if (h && typeof rp.following === 'boolean') rp.following ? FOL.add(h.toLowerCase()) : FOL.delete(h.toLowerCase());
    }
    for (const k in o) harvest(o[k]);
  }

  W.fetch = function (input, init) {
    let u = '';
    try { u = typeof input === 'string' ? input : (input && input.url) || ''; } catch (e) { /* ignore */ }
    const m = u.match(/\/graphql\/([\w-]+)\/(\w+)/);
    if (m) {
      ST.hook++;
      if (m[2] === 'AboutAccountQuery') sawQid(u);
      else if (TL.test(m[2])) {
        const p = pageFetch(input, init);
        p.then(r => r.clone().json()).then(j => { ST.tl++; harvest(j); schedule(); }).catch(() => {});
        return p;
      }
    }
    return pageFetch(input, init);
  };

  /* --------------------------------------------------------------------- DOM */
  const TOMB = /this (post|tweet) (is (unavailable|from a suspended account)|was deleted)/i;
  let tick = 0;
  const schedule = () => { if (!tick) tick = setTimeout(scan, 150); };

  function flag(h, e, k) {
    const s = document.createElement('span');
    s.className = 'xgf'; s.dataset.h = h; s.dataset.c = e.c;
    s.style.cssText = 'display:inline-flex;align-items:center;gap:3px;margin:0 4px;cursor:default;user-select:none;font-size:14px';
    s.title = e.c + (e.a === false ? '\n⚠ Location may be masked (VPN/proxy)' : '') +
      (e.s ? '\nConnected via: ' + e.s : '') + '\nShift+click: block / unblock';
    const i = new Image(16, 16);
    i.alt = ''; i.draggable = false; i.src = flagURL(k);
    i.onerror = () => i.replaceWith(document.createTextNode(emoji(k)));
    s.append(i);
    if (e.a === false) {
      const w = document.createElement('span');
      w.textContent = '⚠'; w.style.color = '#f5a623';
      s.append(w);
    }
    return s;
  }

  function scan() {
    tick = 0;
    const meEl = document.querySelector('a[data-testid="AppTabBar_Profile_Link"]');
    const me = meEl ? (meEl.getAttribute('href') || '').slice(1).toLowerCase() : '';
    const cur = location.pathname.split('/')[1].toLowerCase();   // never hide the profile/post you opened on purpose

    for (const a of document.querySelectorAll('article[data-testid="tweet"]')) {
      const un = a.querySelector('[data-testid="User-Name"]');
      if (!un) continue;
      let link = null;
      for (const x of un.querySelectorAll('a[href^="/"]')) if (x.textContent.charAt(0) === '@') { link = x; break; }
      if (!link) continue;
      const h = link.textContent.slice(1).toLowerCase();
      if (!/^\w{1,15}$/.test(h)) continue;

      const e = get(h);
      const cell = a.closest('[data-testid="cellInnerDiv"]') || a;
      const f = un.querySelector('.xgf');
      let hide = false;

      if (e && e.c) {
        const k = kc(e.c);
        SEEN.set(h, e.c);
        if (S.flags) {
          if (!f || f.dataset.h !== h) { if (f) f.remove(); link.parentElement.after(flag(h, e, k)); }
        } else if (f) f.remove();
        if (h !== me && h !== cur && !(S.bypass && FOL.has(h)) &&
            (!S.verified || un.querySelector('[data-testid="icon-verified"]'))) {
          hide = BL.has(k) || (S.vpn && e.a === false);
        }
      } else if (f) f.remove();

      if (hide) { cell.style.display = 'none'; cell.dataset.xgh = '1'; }
      else if (cell.dataset.xgh) { cell.style.display = ''; delete cell.dataset.xgh; }
    }
    if (S.tomb) tombs();
  }

  function tombs() {
    for (const c of document.querySelectorAll('[data-testid="cellInnerDiv"]:not([data-xgt])')) {
      const t = c.textContent;
      if (!t) continue;
      c.dataset.xgt = '0';
      if (t.length < 250 && !c.querySelector('[data-testid="User-Name"]') && TOMB.test(t)) {
        c.style.display = 'none'; c.dataset.xgt = '1';
      }
    }
  }
  function untomb() {
    document.querySelectorAll('[data-xgt]').forEach(c => {
      if (c.dataset.xgt === '1') c.style.display = '';
      delete c.dataset.xgt;
    });
  }

  function toast(m, ms) {
    let t = document.getElementById('xg-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'xg-toast';
      t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1d9bf0;color:#fff;' +
        'padding:8px 14px;border-radius:8px;font:14px system-ui,sans-serif;z-index:2147483647;pointer-events:none;max-width:90vw;text-align:center';
      (document.body || document.documentElement).append(t);
    }
    t.textContent = m; t.style.display = 'block';
    clearTimeout(t._t); t._t = setTimeout(() => { t.style.display = 'none'; }, ms || 2500);
  }

  // Shift+click a flag to block / unblock that country. Plain click is swallowed so it can't open the post.
  document.addEventListener('click', ev => {
    const f = ev.target.closest && ev.target.closest('.xgf');
    if (!f) return;
    ev.preventDefault(); ev.stopPropagation();
    if (!ev.shiftKey) return;
    const c = f.dataset.c, k = kc(c);
    const list = S.block.split(',').map(x => x.trim()).filter(Boolean);
    if (BL.has(k)) { S.block = list.filter(x => keyOf(x) !== k).join(', '); toast('Unblocked ' + c); }
    else { list.push(c); S.block = list.join(', '); toast('Blocked ' + c); }
    saveS(); rebuild(); menu(); scan();
  }, true);

  /* -------------------------------------------------------------------- menu */
  const LABEL = { flags: 'Show flags', vpn: 'Block VPN/proxy', verified: 'Verified-only mode', bypass: 'Bypass followed accounts', tomb: 'Hide unavailable posts' };
  const tog = k => {
    S[k] = !S[k]; saveS();
    if (k === 'tomb' && !S.tomb) untomb();
    toast(LABEL[k] + ': ' + (S[k] ? 'ON' : 'OFF'));
    menu(); scan();
  };

  function menu() {
    const on = v => (v ? 'ON' : 'OFF');
    const add = (id, name, fn) => GM_registerMenuCommand(name, fn, { id, autoClose: false });
    add('blk', '🚫 Blocked: ' + (S.block || 'none') + '  (edit)', () => {
      const v = prompt('Countries/regions to block, comma-separated.\nNames or 2-letter codes, e.g.  India, PK, South Asia', S.block);
      if (v === null) return;
      S.block = v.trim(); saveS(); rebuild(); menu(); scan();
    });
    add('vpn', '🛡️ Block VPN/proxy: ' + on(S.vpn), () => tog('vpn'));
    add('ver', '✔️ Verified-only mode: ' + on(S.verified), () => tog('verified'));
    add('byp', '👥 Bypass followed: ' + on(S.bypass), () => tog('bypass'));
    add('tmb', '🪦 Hide unavailable posts: ' + on(S.tomb), () => tog('tomb'));
    add('flg', '🏳️ Show flags: ' + on(S.flags), () => tog('flags'));
    add('top', '📊 Top countries (this session)', () => {
      const n = {};
      SEEN.forEach(c => { n[c] = (n[c] || 0) + 1; });
      const rows = Object.entries(n).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([c, v]) => v + '  ' + c);
      alert(rows.length ? 'Accounts seen this session:\n\n' + rows.join('\n') : 'Nothing seen yet - scroll your timeline first.');
    });
    add('dbg', '🩺 Diagnostics', () => {
      alert([
        'Query ID: ' + (qid || 'NOT FOUND') + '   [' + qsrc + ']',
        'Extra params copied from X: ' + (tmpl ? 'yes' : 'no'),
        'Lookups OK / failed: ' + ST.ok + ' / ' + ST.err,
        'Last problem: ' + (ST.last || 'none'),
        'Cache entries: ' + Object.keys(C).length + '    queued: ' + Q.length,
        'Tweets on page: ' + document.querySelectorAll('article[data-testid="tweet"]').length +
          '    flags shown: ' + document.querySelectorAll('.xgf').length,
        'GraphQL calls seen by hook: ' + ST.hook + '    timeline responses read: ' + ST.tl +
          '    followed accounts known: ' + FOL.size
      ].join('\n'));
    });
    add('clr', '🧹 Clear cache', () => {
      C = {}; dirty = true; save();
      document.querySelectorAll('.xgf').forEach(x => x.remove());
      toast('Cache cleared'); scan();
    });
    add('qid', '🔧 Set AboutAccountQuery ID (advanced)', () => {
      const v = prompt('Leave blank for auto-detect.\nCurrent: ' + (qid || 'none'), S.qid);
      if (v === null) return;
      S.qid = v.trim(); if (S.qid) qid = S.qid; saveS(); toast(S.qid ? 'Query ID set' : 'Auto-detect on');
    });
  }

  /* -------------------------------------------------------------------- start */
  new MutationObserver(schedule).observe(document, { childList: true, subtree: true });
  menu();
})();