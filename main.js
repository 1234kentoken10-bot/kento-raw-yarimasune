/* Kento raw - トップページ (作成フォーム + 最近のペースト) */
(function () {
  'use strict';
  var K = window.KentoRaw;
  var MAX_BYTES = 500 * 1024;

  var form = document.getElementById('paste-form');
  var titleEl = document.getElementById('title');
  var langEl = document.getElementById('language');
  var contentEl = document.getElementById('content');
  var unlistedEl = document.getElementById('unlisted');
  var submitBtn = document.getElementById('submit-btn');
  var counter = document.getElementById('counter');
  var result = document.getElementById('result');
  var errorBox = document.getElementById('error');
  var listEl = document.getElementById('paste-list');

  function updateCounter() {
    var v = contentEl.value;
    counter.textContent = v.length.toLocaleString('ja-JP') + ' 文字 / ' + K.formatBytes(v);
  }
  contentEl.addEventListener('input', updateCounter);
  updateCounter();

  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.hidden = false;
    result.hidden = true;
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    errorBox.hidden = true;

    var content = contentEl.value;
    if (!content.trim()) {
      showError('内容を入力してください。');
      contentEl.focus();
      return;
    }
    if (new Blob([content]).size > MAX_BYTES) {
      showError('内容が大きすぎます（最大 500KB）。');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = '作成中...';
    try {
      var paste = await K.createPaste({
        slug: K.randomSlug(8),
        title: titleEl.value.trim() || 'Untitled',
        content: content,
        language: langEl.value || 'plaintext',
        unlisted: !!unlistedEl.checked,
        views: 0
      });

      var raw = K.rawUrl(paste);
      var view = K.viewUrl(paste);
      document.getElementById('raw-link').value = raw;
      document.getElementById('view-link').value = view;
      document.getElementById('open-raw').href = raw;
      document.getElementById('open-view').href = view;
      result.hidden = false;
      result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

      // フォームをリセット（タイトル・内容のみ）
      contentEl.value = '';
      titleEl.value = '';
      updateCounter();
      K.toast('raw リンクを作成しました');
      loadRecent();
    } catch (err) {
      showError(err.message || '保存に失敗しました。');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'raw リンクを作成';
    }
  });

  document.getElementById('copy-raw').addEventListener('click', async function () {
    var ok = await K.copyText(document.getElementById('raw-link').value);
    K.toast(ok ? 'raw リンクをコピーしました' : 'コピーに失敗しました');
  });
  document.getElementById('copy-view').addEventListener('click', async function () {
    var ok = await K.copyText(document.getElementById('view-link').value);
    K.toast(ok ? '表示リンクをコピーしました' : 'コピーに失敗しました');
  });

  // Ctrl/Cmd + Enter で送信
  contentEl.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      form.requestSubmit ? form.requestSubmit() : submitBtn.click();
    }
    // Tab でインデント挿入
    if (e.key === 'Tab') {
      e.preventDefault();
      var s = contentEl.selectionStart, en = contentEl.selectionEnd;
      contentEl.value = contentEl.value.substring(0, s) + '  ' + contentEl.value.substring(en);
      contentEl.selectionStart = contentEl.selectionEnd = s + 2;
      updateCounter();
    }
  });

  async function loadRecent() {
    try {
      var rows = await K.listPastes(100);
      rows = rows.slice(0, 15);
      if (!rows.length) {
        listEl.innerHTML = '<li class="empty">まだペーストがありません。最初の1件を作成しましょう！</li>';
        return;
      }
      listEl.innerHTML = rows.map(function (p) {
        return '<li>' +
          '<a class="title" href="' + K.escapeHtml(K.viewUrl(p)) + '">' + K.escapeHtml(p.title || 'Untitled') + '</a>' +
          '<div class="meta">' +
            '<span class="badge">' + K.escapeHtml(p.language || 'plaintext') + '</span>' +
            '<span>' + K.escapeHtml(K.formatDate(p.created_at)) + '</span>' +
            '<a href="' + K.escapeHtml(K.rawUrl(p)) + '">raw</a>' +
          '</div>' +
        '</li>';
      }).join('');
    } catch (err) {
      listEl.innerHTML = '<li class="empty">一覧を読み込めませんでした。</li>';
    }
  }
  loadRecent();
})();
