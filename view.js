/* Kento raw - ペースト表示ページ */
(function () {
  'use strict';
  var K = window.KentoRaw;

  var titleEl = document.getElementById('paste-title');
  var metaEl = document.getElementById('paste-meta');
  var codeEl = document.getElementById('paste-code');
  var wrapEl = document.getElementById('code-wrap');
  var btnRaw = document.getElementById('btn-raw');
  var btnCopyRaw = document.getElementById('btn-copy-raw');
  var btnCopy = document.getElementById('btn-copy');
  var btnDownload = document.getElementById('btn-download');
  var btnWrap = document.getElementById('btn-wrap');

  var EXT = {
    javascript: 'js', typescript: 'ts', python: 'py', json: 'json', html: 'html', css: 'css',
    bash: 'sh', java: 'java', c: 'c', cpp: 'cpp', csharp: 'cs', go: 'go', rust: 'rs', php: 'php',
    ruby: 'rb', sql: 'sql', yaml: 'yml', xml: 'xml', markdown: 'md', lua: 'lua', kotlin: 'kt',
    swift: 'swift', plaintext: 'txt'
  };

  function fail(msg) {
    titleEl.textContent = 'ペーストが見つかりません';
    metaEl.textContent = msg || 'URL が正しいか確認してください。';
    codeEl.textContent = '';
    document.title = 'Not Found - Kento raw';
  }

  async function init() {
    var paste;
    try {
      paste = await K.resolveFromQuery();
    } catch (err) {
      return fail(err.message);
    }
    if (!paste) return fail();

    var title = paste.title || 'Untitled';
    var lang = paste.language || 'plaintext';
    var content = paste.content || '';

    document.title = title + ' - Kento raw';
    titleEl.textContent = title;

    var views = (Number(paste.views) || 0) + 1;
    // 閲覧数はバックグラウンドで更新（描画をブロックしない）
    K.incrementViews(paste);
    metaEl.innerHTML =
      '<span class="badge">' + K.escapeHtml(lang) + '</span>' +
      '<span>' + K.escapeHtml(K.formatDate(paste.created_at)) + '</span>' +
      '<span>' + K.escapeHtml(K.formatBytes(content)) + '</span>' +
      '<span>' + content.split('\n').length.toLocaleString('ja-JP') + ' 行</span>' +
      '<span>' + Number(views).toLocaleString('ja-JP') + ' 回閲覧</span>';

    codeEl.textContent = content;
    if (window.hljs) {
      try {
        if (lang !== 'plaintext' && hljs.getLanguage(lang)) {
          codeEl.className = 'hljs language-' + lang;
          hljs.highlightElement(codeEl);
        }
      } catch (e) { /* ハイライト失敗時はプレーン表示 */ }
    }

    var raw = K.rawUrl(paste);
    btnRaw.href = raw;

    btnCopyRaw.addEventListener('click', async function () {
      var ok = await K.copyText(raw);
      K.toast(ok ? 'raw リンクをコピーしました' : 'コピーに失敗しました');
    });
    btnCopy.addEventListener('click', async function () {
      var ok = await K.copyText(content);
      K.toast(ok ? '内容をコピーしました' : 'コピーに失敗しました');
    });
    btnDownload.addEventListener('click', function () {
      var ext = EXT[lang] || 'txt';
      var safe = title.replace(/[\\/:*?"<>|]+/g, '_').slice(0, 60) || 'paste';
      var blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = safe + '.' + ext;
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    });
    btnWrap.addEventListener('click', function () {
      var on = wrapEl.classList.toggle('wrap');
      btnWrap.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  init();
})();
