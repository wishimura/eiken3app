/* ========================================
   共通JavaScript - マッチングシステム HTMLモック
   ======================================== */

// 画面切替
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(screenId);
  if (target) target.classList.add('active');

  // ナビのアクティブ状態更新
  document.querySelectorAll('.app-nav a, .admin-sidebar a').forEach(a => {
    a.classList.remove('active');
    if (a.getAttribute('data-screen') === screenId) {
      a.classList.add('active');
    }
  });

  window.scrollTo(0, 0);
}

// タブ切替
function switchTab(tabGroupId, tabId) {
  const group = document.getElementById(tabGroupId);
  if (!group) return;
  group.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  group.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  const btn = group.querySelector(`[data-tab="${tabId}"]`);
  const content = group.querySelector(`#${tabId}`);
  if (btn) btn.classList.add('active');
  if (content) content.classList.add('active');
}

// モーダル
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('active');
}
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('active');
}

// AI機能シミュレーション
function showAiCheck() {
  const panel = document.getElementById('ai-check-panel');
  if (panel) {
    panel.style.display = panel.style.display === 'none' ? 'block' : 'block';
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}
function showAiTranslation() {
  const panel = document.getElementById('ai-translation-panel');
  if (panel) {
    panel.style.display = panel.style.display === 'none' ? 'block' : 'block';
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

// お気に入りトグル
function toggleFav(btn) {
  btn.classList.toggle('active');
  btn.textContent = btn.classList.contains('active') ? '\u2665' : '\u2661';
}

// ダミーアラート
function dummyAction(msg) {
  alert(msg || 'この操作はモックです。実際の処理は行われません。');
}

// 初期化
document.addEventListener('DOMContentLoaded', function() {
  // ナビリンクのイベント
  document.querySelectorAll('[data-screen]').forEach(a => {
    a.addEventListener('click', function(e) {
      e.preventDefault();
      showScreen(this.getAttribute('data-screen'));
    });
  });

  // タブボタンのイベント
  document.querySelectorAll('.tab-btn[data-tab]').forEach(btn => {
    btn.addEventListener('click', function() {
      const group = this.closest('.tabs')?.parentElement || this.closest('[id]');
      if (group) switchTab(group.id, this.getAttribute('data-tab'));
    });
  });

  // モーダル背景クリックで閉じる
  document.querySelectorAll('.modal-overlay').forEach(m => {
    m.addEventListener('click', function(e) {
      if (e.target === this) this.classList.remove('active');
    });
  });
});
