(function () {
  'use strict';
  window.siteReady = true;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var fine = window.matchMedia('(hover:hover) and (pointer:fine)');
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

  /* Путь к участию из настроек */
  (function () {
    var cfg = window.siteConfig || {};
    var coin = $('#joinCoin'), label = $('#joinCoinLabel'), text = $('#joinText'), alt = $('#joinAlt');
    /* Основной путь к анкете уже записан в index.html и работает без скрипта.
       Здесь только применяются настройки, если их поменяли. */
    var tg = $('a', alt);
    if (cfg.formUrl) {
      coin.href = cfg.formUrl;
      if (cfg.telegramUrl) { tg.href = cfg.telegramUrl; } else { alt.hidden = true; }
    } else if (cfg.telegramUrl) {
      coin.href = cfg.telegramUrl;
      label.textContent = 'Написать';
      text.textContent = 'Напишите в Telegram: расскажем о ближайшей игре. Участие платное, дату и стоимость сообщим лично.';
      alt.hidden = true;
    }
    if (cfg.organizer) { var o = $('#organizer'); o.hidden = false; o.textContent = cfg.organizer; }
  })();

  /* Мобильное меню */
  (function () {
    var btn = $('.burger'), nav = $('#nav');
    function set(open, refocus) {
      nav.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
      btn.firstElementChild.textContent = open ? '✕' : '☰';
      if (open) { $('a', nav).focus(); } else if (refocus) { btn.focus(); }
    }
    btn.addEventListener('click', function () { set(!nav.classList.contains('open'), true); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) set(false, false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) set(false, true);
    });
  })();

  /* Роли: стрелка идёт по кругу, сама или по выбору */
  (function () {
    var roles = $$('.role'), detail = $('#detail'), steps = $$('.route li'), hub = $('.hub');
    var field = $('.field'), angle = -45, current = 1, timer = null, stopped = false, seen = false;
    function pick(b, byUser) {
      roles.forEach(function (x) { x.setAttribute('aria-expanded', String(x === b)); });
      detail.setAttribute('aria-live', byUser ? 'polite' : 'off');
      detail.textContent = b.dataset.text;
      detail.classList.remove('swap'); void detail.offsetWidth; detail.classList.add('swap');
      var step = Number(b.dataset.step);
      steps.forEach(function (s) { s.classList.toggle('on', Number(s.dataset.step) === step); });
      angle += (((step - current) % 4 + 4) % 4) * 90; /* всегда по часовой стрелке */
      current = step;
      hub.style.setProperty('--a', angle + 'deg');
    }
    function next() {
      var step = current % 4 + 1;
      pick(roles.filter(function (r) { return Number(r.dataset.step) === step; })[0], false);
    }
    function play() { if (!timer && !stopped && seen && !reduced.matches) timer = setInterval(next, 3000); }
    function pause() { clearInterval(timer); timer = null; }
    roles.forEach(function (b) {
      b.addEventListener('click', function () { stopped = true; pause(); pick(b, true); });
    });
    field.addEventListener('pointerenter', pause);
    field.addEventListener('pointerleave', play);
    field.addEventListener('focusin', pause);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        seen = es[0].isIntersecting;
        if (seen) play(); else pause();
      }, { threshold: 0.4 }).observe(field);
    }
  })();
  /* Объёмная монета */
  (function () {
    var f = $('.flip'), body = $('#coin3d');
    for (var i = -16; i <= 16; i++) {
      var e = document.createElement('i');
      e.className = 'edge';
      e.style.transform = 'translateZ(' + i + 'px)';
      body.insertBefore(e, body.firstChild);
    }
    f.addEventListener('click', function () {
      f.setAttribute('aria-pressed', String(f.getAttribute('aria-pressed') !== 'true'));
    });
  })();

  /* Голосование-демонстрация */
  (function () {
    var live = $('#voteLive');
    function word(n) {
      var a = n % 10, b = n % 100;
      if (a === 1 && b !== 11) return 'монета';
      if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return 'монеты';
      return 'монет';
    }
    $$('.pile').forEach(function (p) {
      var n = 0, stack = $('.pile__stack', p), small = $('small', p);
      p.addEventListener('click', function () {
        n += 1;
        if (stack.children.length < 12) stack.appendChild(document.createElement('i'));
        small.textContent = n + ' ' + word(n);
        live.textContent = p.dataset.name + ': ' + n + ' ' + word(n) + '. Это демонстрация, настоящее голосование проходит в игре.';
      });
    });
  })();

  /* Счётчики */
  function runCount(el) {
    var end = Number(el.dataset.count);
    if (reduced.matches || end < 2) { el.textContent = end; return; }
    var start = null;
    function tick(t) {
      if (start === null) start = t;
      var p = Math.min((t - start) / 900, 1);
      el.textContent = Math.round(end * p);
      if (p < 1) requestAnimationFrame(tick);
    }
    el.textContent = '0';
    requestAnimationFrame(tick);
  }

  /* Появление блоков */
  (function () {
    $$('.stagger').forEach(function (g) {
      Array.prototype.forEach.call(g.children, function (c, i) { c.style.setProperty('--i', i); });
    });
    var items = $$('.reveal');
    function show(el) {
      el.classList.add('is-in');
      $$('[data-count]', el).forEach(runCount);
    }
    if (!('IntersectionObserver' in window) || reduced.matches) { items.forEach(show); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    items.forEach(function (el) { io.observe(el); });
  })();

  /* Фраза, которая загорается при прокрутке */
  var words = (function () {
    var el = $('[data-words]');
    if (reduced.matches) return null;
    var label = el.textContent;
    el.setAttribute('aria-label', label);
    el.textContent = '';
    var list = label.split(' ').map(function (w, i, all) {
      var s = document.createElement('span');
      s.className = 'w'; s.textContent = w; s.setAttribute('aria-hidden', 'true');
      el.appendChild(s);
      if (i < all.length - 1) el.appendChild(document.createTextNode(' '));
      return s;
    });
    return { el: el, list: list };
  })();

  /* Всё, что зависит от прокрутки */
  (function () {
    var top = $('.coin--top'), layers = $$('[data-parallax]'), bar = $('.bar'), note = $('#note');
    var hero = $('.hero'), track = $('#track'), bits = $$('li', track), prog = $('.progress span');
    var big = window.matchMedia('(min-width:1061px) and (hover:hover) and (pointer:fine)');
    var waiting = false;
    function update() {
      waiting = false;
      var y = window.scrollY, vh = window.innerHeight;
      var doc = document.documentElement.scrollHeight - vh;
      prog.style.setProperty('--p', doc > 0 ? (y / doc).toFixed(4) : 0);
      top.hidden = y < 700;
      bar.classList.toggle('is-stuck', y > 30);
      var on = big.matches && !reduced.matches && y < 1200;
      layers.forEach(function (l) {
        l.style.setProperty('--shift', on ? (y * Number(l.dataset.parallax)).toFixed(1) + 'px' : '0px');
      });
      if (!reduced.matches) note.style.setProperty('--out', clamp(y / hero.offsetHeight, 0, 1).toFixed(3));
      /* Золотая линия шагов */
      var r = track.getBoundingClientRect();
      var p = reduced.matches ? 1 : clamp((vh * 0.82 - r.top) / (vh * 0.5), 0, 1);
      track.style.setProperty('--p', p.toFixed(3));
      bits.forEach(function (li, i) { li.classList.toggle('on', p > 0 && p >= i / (bits.length - 1) - 0.001); });
      /* Слова */
      if (words) {
        var w = words.el.getBoundingClientRect();
        var q = clamp((vh * 0.88 - w.top) / (w.height + vh * 0.32), 0, 1) * words.list.length;
        words.list.forEach(function (s, i) { s.style.setProperty('--o', (0.22 + 0.78 * clamp(q - i, 0, 1)).toFixed(2)); });
      }
    }
    function ask() { if (!waiting) { waiting = true; requestAnimationFrame(update); } }
    window.addEventListener('scroll', ask, { passive: true });
    window.addEventListener('resize', ask);
    update();
  })();

  /* Купюра за мышью, подсветка, магнитные монеты */
  (function () {
    if (!fine.matches || reduced.matches) return;
    var hero = $('.hero'), note = $('#note'), glow = $('.hero__glow'), foil = $('.foil'), medal = $('.medal');
    var tx = 0, ty = 0, cx = 0, cy = 0, run = false;
    function loop() {
      cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
      note.style.setProperty('--ry', (cx * 7).toFixed(2) + 'deg');
      note.style.setProperty('--rx', (cy * -5).toFixed(2) + 'deg');
      foil.style.setProperty('--fx', (50 + cx * 55).toFixed(1) + '%');
      foil.style.setProperty('--fy', (50 + cy * 60).toFixed(1) + '%');
      medal.style.setProperty('--ty2', (50 + cx * 50).toFixed(1) + '%');
      if (Math.abs(tx - cx) + Math.abs(ty - cy) > 0.002) requestAnimationFrame(loop); else run = false;
    }
    function go() { if (!run) { run = true; requestAnimationFrame(loop); } }
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width * 2 - 1;
      ty = (e.clientY - r.top) / r.height * 2 - 1;
      glow.style.setProperty('--gx', e.clientX - r.left + 'px');
      glow.style.setProperty('--gy', e.clientY - r.top + 'px');
      go();
    });
    hero.addEventListener('pointerleave', function () { tx = 0; ty = 0; go(); });
    $$('a.coin:not(.coin--top)').forEach(function (c) {
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        c.style.setProperty('--tx', (x * 12).toFixed(1) + 'px');
        c.style.setProperty('--ty', (y * 12 - 3).toFixed(1) + 'px');
        c.style.setProperty('--cry', (x * 28).toFixed(1) + 'deg');
        c.style.setProperty('--crx', (y * -28).toFixed(1) + 'deg');
      });
      c.addEventListener('pointerleave', function () {
        ['--tx', '--ty', '--cry', '--crx'].forEach(function (k) { c.style.removeProperty(k); });
      });
    });
    $$('.spot').forEach(function (p) {
      p.addEventListener('pointermove', function (e) {
        var r = p.getBoundingClientRect();
        p.style.setProperty('--x', e.clientX - r.left + 'px');
        p.style.setProperty('--y', e.clientY - r.top + 'px');
      });
    });
  })();

  /* Гравировка: линии рисуются как на печатном станке */
  (function () {
    var c = $('#rosette'), g = c.getContext && c.getContext('2d');
    if (!g) return;
    var size = 1500, dpr = Math.min(window.devicePixelRatio || 1, 1.5), R = size / 2;
    c.width = size * dpr; c.height = size * dpr;
    g.scale(dpr, dpr);
    g.lineWidth = 0.7;
    var total = 54, i = 0;
    function curve(k) {
      var f = k / total, base = R * (0.3 + 0.62 * f), amp = R * 0.05, lobes = 12 + (k % 3) * 6, ph = k * 0.37;
      g.strokeStyle = 'rgba(212,175,55,' + (0.3 - 0.16 * f).toFixed(3) + ')';
      g.beginPath();
      for (var t = 0; t <= 720; t++) {
        var a = t / 720 * Math.PI * 2, r = base + amp * Math.sin(lobes * a + ph);
        var x = R + r * Math.cos(a), y = R + r * Math.sin(a);
        if (t) g.lineTo(x, y); else g.moveTo(x, y);
      }
      g.stroke();
    }
    if (reduced.matches) { for (; i < total; i++) curve(i); return; }
    (function draw() {
      curve(i); i += 1;
      if (i < total) requestAnimationFrame(draw);
    })();
  })();

  /* Золотая пыль на первом экране */
  (function () {
    var c = $('#dust'), g = c.getContext && c.getContext('2d');
    if (!g || reduced.matches) return;
    var hero = $('.hero'), w = 0, h = 0, on = true, raf = 0, dots = [];
    var count = window.innerWidth < 700 ? 26 : 64;
    function size() {
      var d = Math.min(window.devicePixelRatio || 1, 2);
      w = hero.clientWidth; h = hero.clientHeight;
      c.width = w * d; c.height = h * d;
      g.setTransform(d, 0, 0, d, 0, 0);
    }
    function dot(any) {
      return { x: Math.random() * w, y: any ? Math.random() * h : h + 8, r: 0.6 + Math.random() * 1.9,
        v: 0.12 + Math.random() * 0.42, s: Math.random() * 6.28, d: 0.4 + Math.random() * 0.8 };
    }
    size();
    for (var i = 0; i < count; i++) dots.push(dot(true));
    function frame(t) {
      g.clearRect(0, 0, w, h);
      dots.forEach(function (p, k) {
        p.y -= p.v; p.x += Math.sin(t / 1800 + p.s) * 0.18;
        if (p.y < -8) dots[k] = dot(false);
        var a = 0.28 + 0.5 * Math.abs(Math.sin(t / 900 * p.d + p.s));
        g.fillStyle = 'rgba(247,228,163,' + a.toFixed(2) + ')';
        g.beginPath(); g.arc(p.x, p.y, p.r, 0, 6.29); g.fill();
      });
      raf = on && !document.hidden ? requestAnimationFrame(frame) : 0;
    }
    function wake() { if (on && !raf && !document.hidden) raf = requestAnimationFrame(frame); }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { on = es[0].isIntersecting; wake(); }).observe(hero);
    }
    document.addEventListener('visibilitychange', wake);
    window.addEventListener('resize', size);
    wake();
  })();

  /* Россыпь монеток от нажатия */
  (function () {
    var c = $('#fx'), g = c.getContext && c.getContext('2d');
    if (!g || reduced.matches) return;
    var bits = [], raf = 0;
    function fit() {
      var d = Math.min(window.devicePixelRatio || 1, 2);
      c.width = window.innerWidth * d; c.height = window.innerHeight * d;
      g.setTransform(d, 0, 0, d, 0, 0);
    }
    function burst(x, y, n) {
      for (var i = 0; i < n; i++) {
        var a = Math.random() * 6.28, s = 2.5 + Math.random() * 6.5;
        bits.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 4, r: 3 + Math.random() * 5, t: Math.random() * 6.28, life: 1 });
      }
      if (!raf) raf = requestAnimationFrame(frame);
    }
    function frame() {
      g.clearRect(0, 0, window.innerWidth, window.innerHeight);
      bits = bits.filter(function (b) { return b.life > 0; });
      bits.forEach(function (b) {
        b.vy += 0.26; b.x += b.vx; b.y += b.vy; b.t += 0.26; b.life -= 0.016;
        g.globalAlpha = clamp(b.life * 1.6, 0, 1);
        g.fillStyle = Math.cos(b.t) > 0 ? '#F4DD92' : '#B98A24';
        g.beginPath(); g.ellipse(b.x, b.y, b.r * Math.max(Math.abs(Math.cos(b.t)), 0.15), b.r, 0, 0, 6.29); g.fill();
      });
      g.globalAlpha = 1;
      raf = bits.length ? requestAnimationFrame(frame) : 0;
    }
    fit();
    window.addEventListener('resize', fit);
    document.addEventListener('click', function (e) {
      var t = e.target.closest('a.coin:not(.coin--top),.pill,.pile,.flip');
      if (!t) return;
      var r = t.getBoundingClientRect();
      burst(e.clientX || r.left + r.width / 2, e.clientY || r.top + r.height / 2, t.classList.contains('pile') ? 10 : 30);
    });
  })();
})();
