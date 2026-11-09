(function() {
  // 防止重複載入：若已存在則切換顯示並提示
  if (window.__vibeGamepadLoaded) {
    var existing = document.getElementById('vibe-gp-cursor');
    if (existing) existing.style.display = 'block';
    return;
  }
  window.__vibeGamepadLoaded = true;

  // 1. 頂部狀態提示橫幅 (Toast)
  var toast = document.createElement('div');
  toast.id = 'vibe-gp-toast';
  toast.style.cssText = 'position:fixed;top:16px;left:50%;transform:translateX(-50%);background:#10b981;color:#fff;padding:10px 20px;border-radius:999px;font-family:system-ui,sans-serif;font-size:14px;font-weight:700;z-index:2147483647;box-shadow:0 8px 20px rgba(0,0,0,0.45);pointer-events:none;transition:opacity 0.4s;';
  toast.textContent = '🎮 手把滑鼠已載入！請按手把任意鍵喚醒游標';
  document.body.appendChild(toast);
  setTimeout(function() { toast.style.opacity = '0'; }, 4000);

  // 2. 建立虛擬滑鼠游標
  var cursor = document.createElement('div');
  cursor.id = 'vibe-gp-cursor';
  cursor.style.cssText = 'position:fixed;top:50%;left:50%;width:22px;height:22px;border-radius:50%;background:rgba(0,229,255,0.88);border:2.5px solid #fff;box-shadow:0 0 12px rgba(0,229,255,0.9),0 2px 6px rgba(0,0,0,0.6);transform:translate(-50%,-50%);pointer-events:none;z-index:2147483647;transition:transform 0.08s,background 0.08s;';
  document.body.appendChild(cursor);

  // 3. 建立 B 鍵快捷右鍵選單
  var ctxMenu = document.createElement('div');
  ctxMenu.id = 'vibe-gp-ctx';
  ctxMenu.style.cssText = 'position:fixed;background:#1e293b;color:#f8fafc;border:1px solid #475569;border-radius:10px;padding:6px 0;min-width:165px;box-shadow:0 10px 25px rgba(0,0,0,0.6);z-index:2147483646;display:none;font-family:system-ui,sans-serif;font-size:14px;';
  var menuItems = [
    { label: '⬅️ 返回上一頁', action: function() { history.back(); } },
    { label: '➡️ 前往下一頁', action: function() { history.forward(); } },
    { label: '⬆️ 回到網頁頂部', action: function() { window.scrollTo({ top: 0, behavior: 'smooth' }); } },
    { label: '🔄 重新整理網頁', action: function() { location.reload(); } }
  ];
  menuItems.forEach(function(item) {
    var row = document.createElement('div');
    row.textContent = item.label;
    row.style.cssText = 'padding:10px 16px;cursor:pointer;transition:background 0.12s;';
    row.onmouseenter = function() { row.style.background = '#00e5ff'; row.style.color = '#000'; };
    row.onmouseleave = function() { row.style.background = 'transparent'; row.style.color = '#f8fafc'; };
    row.onclick = function() {
      ctxMenu.style.display = 'none';
      item.action();
    };
    ctxMenu.appendChild(row);
  });
  document.body.appendChild(ctxMenu);

  // 全域設定參數 (可由 gamepad.html 控制面板動態修改)
  window.VibeGPConfig = window.VibeGPConfig || {
    speed: 12,
    scrollSpeed: 15,
    deadzone: 0.16,
    swapAB: true // true: 良值右鍵(A)=左鍵點擊, 下鍵(B)=右鍵選單
  };

  var curX = window.innerWidth / 2;
  var curY = window.innerHeight / 2;
  var prevLeft = false;
  var prevRight = false;
  var lastHovered = null;

  function applyDeadzone(val, dz) {
    return Math.abs(val) < dz ? 0 : val;
  }

  window.addEventListener('gamepadconnected', function(e) {
    toast.style.opacity = '1';
    toast.textContent = '✅ 手把已連線：' + e.gamepad.id;
    setTimeout(function() { toast.style.opacity = '0'; }, 3000);
    window.dispatchEvent(new CustomEvent('vibe-gp-status', { detail: { connected: true, id: e.gamepad.id } }));
  });

  window.addEventListener('gamepaddisconnected', function() {
    window.dispatchEvent(new CustomEvent('vibe-gp-status', { detail: { connected: false } }));
  });

  function updateLoop() {
    var pads = navigator.getGamepads ? navigator.getGamepads() : [];
    var gp = pads[0] || pads[1] || pads[2] || pads[3];

    if (gp) {
      var cfg = window.VibeGPConfig;

      // 1. 左蘑菇頭 (Axes 0, 1) 與十字鍵移動游標
      var dx = applyDeadzone(gp.axes[0] || 0, cfg.deadzone);
      var dy = applyDeadzone(gp.axes[1] || 0, cfg.deadzone);
      if (gp.buttons[12] && gp.buttons[12].pressed) dy = -0.7;
      if (gp.buttons[13] && gp.buttons[13].pressed) dy = 0.7;
      if (gp.buttons[14] && gp.buttons[14].pressed) dx = -0.7;
      if (gp.buttons[15] && gp.buttons[15].pressed) dx = 0.7;

      curX = Math.max(0, Math.min(window.innerWidth, curX + dx * cfg.speed));
      curY = Math.max(0, Math.min(window.innerHeight, curY + dy * cfg.speed));
      cursor.style.left = curX + 'px';
      cursor.style.top = curY + 'px';

      // 2. 右蘑菇頭 (Axes 2, 3) 滾動網頁
      var sx = applyDeadzone(gp.axes[2] || 0, cfg.deadzone);
      var sy = applyDeadzone(gp.axes[3] || 0, cfg.deadzone);
      if (sx !== 0 || sy !== 0) {
        window.scrollBy(sx * cfg.scrollSpeed, sy * cfg.scrollSpeed);
      }

      // 3. 偵測鼠標下方元素並觸發模擬 Hover
      var target = document.elementFromPoint(curX, curY);
      var clickable = target ? target.closest('a, button, input, select, textarea, [onclick], [role="button"]') : null;

      if (lastHovered && lastHovered !== clickable) {
        lastHovered.style.outline = '';
        lastHovered.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
      }
      if (clickable && clickable !== lastHovered) {
        clickable.style.outline = '2px solid #00e5ff';
        clickable.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
        lastHovered = clickable;
      } else if (!clickable) {
        lastHovered = null;
      }

      // 4. A 鍵 (左鍵點擊) 與 B 鍵 (右鍵選單)
      var leftBtnIdx = cfg.swapAB ? 1 : 0;
      var rightBtnIdx = cfg.swapAB ? 0 : 1;
      var isLeft = !!(gp.buttons[leftBtnIdx] && gp.buttons[leftBtnIdx].pressed);
      var isRight = !!(gp.buttons[rightBtnIdx] && gp.buttons[rightBtnIdx].pressed);

      // 左鍵按下瞬間
      if (isLeft && !prevLeft) {
        cursor.style.background = '#ff4081';
        cursor.style.transform = 'translate(-50%,-50%) scale(0.75)';
        if (target) {
          var evOpts = { bubbles: true, cancelable: true, clientX: curX, clientY: curY, button: 0 };
          target.dispatchEvent(new PointerEvent('pointerdown', evOpts));
          target.dispatchEvent(new MouseEvent('mousedown', evOpts));
          target.dispatchEvent(new PointerEvent('pointerup', evOpts));
          target.dispatchEvent(new MouseEvent('mouseup', evOpts));
          target.click();
          if (target.matches && target.matches('input, textarea, select')) target.focus();
        }
        if (!target || !target.closest('#vibe-gp-ctx')) {
          ctxMenu.style.display = 'none';
        }
      } else if (!isLeft && prevLeft) {
        cursor.style.background = 'rgba(0,229,255,0.88)';
        cursor.style.transform = 'translate(-50%,-50%) scale(1)';
      }

      // 右鍵按下瞬間
      if (isRight && !prevRight) {
        cursor.style.background = '#ffeb3b';
        cursor.style.transform = 'translate(-50%,-50%) scale(1.25)';
        if (target) {
          var rOpts = { bubbles: true, cancelable: true, clientX: curX, clientY: curY, button: 2 };
          var notPrevented = target.dispatchEvent(new MouseEvent('contextmenu', rOpts));
          if (notPrevented) {
            ctxMenu.style.left = Math.min(curX, window.innerWidth - 180) + 'px';
            ctxMenu.style.top = Math.min(curY, window.innerHeight - 180) + 'px';
            ctxMenu.style.display = ctxMenu.style.display === 'block' ? 'none' : 'block';
          }
        }
      } else if (!isRight && prevRight) {
        cursor.style.background = 'rgba(0,229,255,0.88)';
        cursor.style.transform = 'translate(-50%,-50%) scale(1)';
      }

      prevLeft = isLeft;
      prevRight = isRight;
    }

    requestAnimationFrame(updateLoop);
  }

  requestAnimationFrame(updateLoop);
})();
