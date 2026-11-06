/* Слой оживления: мягкий свет за курсором, плывущие блики, искры на монетах, дождь монет. */
(function () {
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduced.matches) return;
  var fine = window.matchMedia('(pointer: fine)');

  /* Плывущие золотые блики на весь сайт (лёгкий canvas, останавливается на скрытой вкладке) */
  (function () {
    var c = document.createElement('canvas'); c.className = 'fx-bokeh'; c.setAttribute('aria-hidden', 'true');
    document.body.appendChild(c);
    var g = c.getContext('2d'); if (!g) return;
    var W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 1.5), P = [], N = window.innerWidth < 700 ? 14 : 26;
    function size() { W = window.innerWidth; H = window.innerHeight; c.width = W * dpr; c.height = H * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0); }
    function make(initial) {
      return { x: Math.random() * W, y: initial ? Math.random() * H : H + 40, r: 5 + Math.random() * 20,
        vy: 0.08 + Math.random() * 0.22, vx: (Math.random() - 0.5) * 0.12, a: 0.04 + Math.random() * 0.09,
        ph: Math.random() * 6.28, sp: 0.2 + Math.random() * 0.4 };
    }
    size(); for (var i = 0; i < N; i++) P.push(make(true));
    window.addEventListener('resize', size);
    var last = 0, running = true;
    document.addEventListener('visibilitychange', function () { running = !document.hidden; if (running) requestAnimationFrame(tick); });
    function tick(t) {
      if (!running) return;
      var dt = Math.min(40, t - last || 16); last = t;
      g.clearRect(0, 0, W, H);
      for (var i = 0; i < P.length; i++) {
        var p = P[i];
        p.y -= p.vy * dt * 0.06 * 16 / 16; p.x += p.vx * dt * 0.06 + Math.sin(t / 1000 * p.sp + p.ph) * 0.15;
        if (p.y < -40) P[i] = p = make(false);
        var k = 0.6 + 0.4 * Math.sin(t / 1000 * p.sp * 2 + p.ph);
        var gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        gr.addColorStop(0, 'rgba(255,240,190,' + (p.a * k).toFixed(3) + ')');
        gr.addColorStop(0.6, 'rgba(212,175,55,' + (p.a * k * 0.5).toFixed(3) + ')');
        gr.addColorStop(1, 'rgba(212,175,55,0)');
        g.fillStyle = gr; g.beginPath(); g.arc(p.x, p.y, p.r, 0, 6.2832); g.fill();
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  })();

  /* Мягкий тёплый свет следует за курсором */
  (function () {
    if (!fine.matches) return;
    var el = document.createElement('div'); el.className = 'fx-light'; el.setAttribute('aria-hidden', 'true');
    document.body.appendChild(el);
    var tx = 0, ty = 0, cx = 0, cy = 0, run = false;
    function loop() {
      cx += (tx - cx) * 0.07; cy += (ty - cy) * 0.07;
      el.style.setProperty('--lx', cx.toFixed(1) + 'px'); el.style.setProperty('--ly', cy.toFixed(1) + 'px');
      if (Math.abs(tx - cx) + Math.abs(ty - cy) > 0.5) requestAnimationFrame(loop); else run = false;
    }
    window.addEventListener('pointermove', function (e) {
      tx = e.clientX; ty = e.clientY; el.classList.add('on');
      if (!run) { run = true; requestAnimationFrame(loop); }
    }, { passive: true });
    document.addEventListener('pointerleave', function () { el.classList.remove('on'); });
  })();

  /* Искры при нажатии на монету, кнопку или стопку */
  (function () {
    document.addEventListener('click', function (e) {
      var t = e.target.closest && e.target.closest('.coin,.pill,.flip,.pile,.role');
      if (!t) return;
      var r = t.getBoundingClientRect(), x = e.clientX || r.left + r.width / 2, y = e.clientY || r.top + r.height / 2;
      for (var i = 0; i < 12; i++) {
        var s = document.createElement('span'); s.className = 'fx-spark';
        var a = Math.random() * 6.283, d = 30 + Math.random() * 54;
        s.style.left = x + 'px'; s.style.top = y + 'px';
        s.style.setProperty('--dx', (Math.cos(a) * d).toFixed(0) + 'px');
        s.style.setProperty('--dy', (Math.sin(a) * d - 14).toFixed(0) + 'px');
        s.style.width = s.style.height = (4 + Math.random() * 5).toFixed(1) + 'px';
        document.body.appendChild(s);
        setTimeout(function (n) { n.remove(); }.bind(null, s), 1200);
      }
    });
  })();

  /* Дождь из монет во всех блоках: только пока блок на экране */
  (function () {
    if (!('IntersectionObserver' in window)) return;
    var secs = document.querySelectorAll('.hero, .section');
    var n = window.innerWidth < 700 ? 4 : 7;
    for (var k = 0; k < secs.length; k++) (function (sec) {
      var rain = document.createElement('div'); rain.className = 'fx-rain'; rain.setAttribute('aria-hidden', 'true');
      for (var i = 0; i < n; i++) {
        var c = document.createElement('i'); c.className = 'fx-coin';
        c.style.setProperty('--x', (3 + Math.random() * 94).toFixed(1) + '%');
        c.style.setProperty('--s', (22 + Math.random() * 22).toFixed(0) + 'px');
        c.style.setProperty('--d', (11 + Math.random() * 9).toFixed(1) + 's');
        c.style.setProperty('--w', (-Math.random() * 14).toFixed(1) + 's');
        c.style.setProperty('--sw', ((Math.random() - 0.5) * 120).toFixed(0) + 'px');
        rain.appendChild(c);
      }
      sec.insertBefore(rain, sec.firstChild);
      new IntersectionObserver(function (es) { rain.classList.toggle('go', es[0].isIntersecting); }, { threshold: 0.05 }).observe(sec);
    })(secs[k]);
  })();
})();
