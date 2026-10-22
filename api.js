/* Kento raw - 共通 API ヘルパー (Table API: tables/pastes) */
(function (global) {
  'use strict';

  var TABLE = 'pastes';
  var SLUG_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  function randomSlug(len) {
    len = len || 8;
    var out = '';
    var buf = new Uint32Array(len);
    if (global.crypto && global.crypto.getRandomValues) {
      global.crypto.getRandomValues(buf);
    } else {
      for (var i = 0; i < len; i++) buf[i] = Math.floor(Math.random() * 4294967296);
    }
    for (var j = 0; j < len; j++) out += SLUG_CHARS[buf[j] % SLUG_CHARS.length];
    return out;
  }

  async function createPaste(data) {
    var res = await fetch('tables/' + TABLE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('保存に失敗しました (HTTP ' + res.status + ')');
    return res.json();
  }

  async function getById(id) {
    var res = await fetch('tables/' + TABLE + '/' + encodeURIComponent(id));
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('読み込みに失敗しました (HTTP ' + res.status + ')');
    return res.json();
  }

  async function getBySlug(slug) {
    var res = await fetch('tables/' + TABLE + '?search=' + encodeURIComponent(slug) + '&limit=100');
    if (!res.ok) throw new Error('読み込みに失敗しました (HTTP ' + res.status + ')');
    var json = await res.json();
    var rows = json.data || [];
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].slug === slug) return rows[i];
    }
    return null;
  }

  /* ?p=xxxx (slug) または ?id=uuid でペーストを取得 */
  async function resolveFromQuery() {
    var params = new URLSearchParams(global.location.search);
    var slug = params.get('p');
    var id = params.get('id');
    if (slug) {
      var bySlug = await getBySlug(slug);
      if (bySlug) return bySlug;
      // slug が見つからなければ UUID として再試行
      if (slug.length >= 32) return getById(slug);
      return null;
    }
    if (id) return getById(id);
    return null;
  }

  async function listPastes(limit) {
    var res = await fetch('tables/' + TABLE + '?limit=' + (limit || 100) + '&sort=created_at');
    if (!res.ok) throw new Error('一覧の取得に失敗しました (HTTP ' + res.status + ')');
    var json = await res.json();
    var rows = (json.data || []).filter(function (r) { return !r.unlisted && !r.deleted; });
    rows.sort(function (a, b) { return (b.created_at || 0) - (a.created_at || 0); });
    return rows;
  }

  async function incrementViews(paste) {
    try {
      var next = (Number(paste.views) || 0) + 1;
      await fetch('tables/' + TABLE + '/' + encodeURIComponent(paste.id), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ views: next })
      });
      return next;
    } catch (e) {
      return paste.views || 0;
    }
  }

  /* サイトのベース URL (index.html と同じディレクトリ) */
  function baseUrl() {
    var href = global.location.href.split('#')[0].split('?')[0];
    return href.replace(/[^\/]*$/, '');
  }

  function rawUrl(paste) {
    return baseUrl() + 'raw.html?p=' + encodeURIComponent(paste.slug || paste.id);
  }

  function viewUrl(paste) {
    return baseUrl() + 'view.html?p=' + encodeURIComponent(paste.slug || paste.id);
  }

  function formatDate(ms) {
    if (!ms) return '';
    var d = new Date(Number(ms));
    return d.toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  function formatBytes(str) {
    var n = new Blob([str || '']).size;
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
    return (n / 1024 / 1024).toFixed(2) + ' MB';
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
      document.body.removeChild(ta);
      return ok;
    }
  }

  var toastTimer = null;
  function toast(msg) {
    var el = document.getElementById('toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      el.className = 'toast';
      el.setAttribute('role', 'status');
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 2200);
  }

  global.KentoRaw = {
    randomSlug: randomSlug,
    createPaste: createPaste,
    getById: getById,
    getBySlug: getBySlug,
    resolveFromQuery: resolveFromQuery,
    listPastes: listPastes,
    incrementViews: incrementViews,
    rawUrl: rawUrl,
    viewUrl: viewUrl,
    formatDate: formatDate,
    formatBytes: formatBytes,
    escapeHtml: escapeHtml,
    copyText: copyText,
    toast: toast
  };
})(window);
