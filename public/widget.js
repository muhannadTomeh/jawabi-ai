/* Jawabi embeddable chat widget
 * Usage:
 * <script src="https://YOUR_DOMAIN/widget.js" data-slug="BOT_SLUG" defer></script>
 * Optional attributes: data-position="left|right" data-color="#16a34a" data-label="تحدث معنا"
 */
(function () {
  var script =
    document.currentScript ||
    (function () {
      var all = document.getElementsByTagName('script');
      for (var i = all.length - 1; i >= 0; i--) {
        if ((all[i].src || '').indexOf('widget.js') !== -1) return all[i];
      }
      return null;
    })();
  if (!script) return;

  var slug = script.getAttribute('data-slug');
  if (!slug) {
    console.error('[Jawabi] data-slug is required on the widget script tag.');
    return;
  }
  if (window.__jawabiWidgetLoaded) return;
  window.__jawabiWidgetLoaded = true;

  var origin = new URL(script.src, window.location.href).origin;
  var position = script.getAttribute('data-position') === 'left' ? 'left' : 'right';
  var color = script.getAttribute('data-color') || '#16a34a';
  var label = script.getAttribute('data-label') || 'تحدث معنا';
  var chatUrl = origin + '/chat/' + encodeURIComponent(slug) + '?embed=1';

  var side = position + ': 20px;';
  var open = false;

  var style = document.createElement('style');
  style.textContent = [
    '.jawabi-w-btn{position:fixed;bottom:20px;' + side + 'z-index:2147483000;display:flex;align-items:center;gap:8px;',
    'border:0;cursor:pointer;border-radius:999px;padding:12px 18px;color:#fff;font:600 15px/1 system-ui,-apple-system,"Segoe UI",sans-serif;',
    'background:' + color + ';box-shadow:0 8px 24px rgba(0,0,0,.22);transition:transform .18s ease,opacity .18s ease}',
    '.jawabi-w-btn:hover{transform:translateY(-2px)}',
    '.jawabi-w-frame{position:fixed;bottom:88px;' + side + 'z-index:2147483000;width:380px;height:min(620px,calc(100vh - 120px));',
    'border:0;border-radius:16px;overflow:hidden;background:#fff;box-shadow:0 18px 50px rgba(0,0,0,.28);',
    'opacity:0;transform:translateY(12px) scale(.98);pointer-events:none;transition:opacity .2s ease,transform .2s ease}',
    '.jawabi-w-frame.jawabi-open{opacity:1;transform:none;pointer-events:auto}',
    '@media (max-width:480px){.jawabi-w-frame{width:calc(100vw - 24px);' + position + ':12px;bottom:80px;height:calc(100vh - 100px)}}',
  ].join('');
  document.head.appendChild(style);

  var iframe = document.createElement('iframe');
  iframe.className = 'jawabi-w-frame';
  iframe.title = 'Jawabi Chat';
  iframe.setAttribute('allow', 'clipboard-write');
  iframe.loading = 'lazy';

  var btn = document.createElement('button');
  btn.className = 'jawabi-w-btn';
  btn.type = 'button';
  btn.setAttribute('aria-label', label);
  var iconOpen =
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9.9 9.9 0 0 1-4.2-.9L3 21l1.9-4.1A8.4 8.4 0 0 1 12 3.1a8.4 8.4 0 0 1 9 8.4z"/></svg>';
  var iconClose =
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>';
  btn.innerHTML = iconOpen + '<span>' + label + '</span>';

  function toggle(force) {
    open = typeof force === 'boolean' ? force : !open;
    if (open && !iframe.src) iframe.src = chatUrl;
    iframe.classList.toggle('jawabi-open', open);
    btn.innerHTML = open ? iconClose + '<span>إغلاق</span>' : iconOpen + '<span>' + label + '</span>';
  }

  btn.addEventListener('click', function () {
    toggle();
  });

  window.addEventListener('message', function (e) {
    if (e.origin !== origin || !e.data) return;
    if (e.data === 'jawabi:close' || e.data.type === 'jawabi:close') toggle(false);
  });

  function mount() {
    document.body.appendChild(iframe);
    document.body.appendChild(btn);
  }
  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount);

  window.JawabiWidget = { open: function () { toggle(true); }, close: function () { toggle(false); }, toggle: toggle };
})();
