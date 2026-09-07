/* ---------- theme switch ---------- */
(function () {
  var btn = document.getElementById('themeToggle');
  if (!btn) return;

  var root = document.documentElement;
  var label = document.getElementById('themeLabel');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function paint() {
    var dark = root.getAttribute('data-theme') === 'dark';
    btn.setAttribute('aria-pressed', String(dark));
    if (label) label.textContent = dark ? 'dark' : 'light';
    var knob = document.getElementById('themeKnob');
    if (knob) knob.textContent = dark ? 'SYS' : 'ON';
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', dark ? '#0d1117' : '#1a73c7');
  }

  function flash(dark) {
    if (reduce) return;
    var el = document.createElement('div');
    el.className = 'theme-flash';
    el.setAttribute('data-msg', dark ? '// theme :: dark' : '// theme :: light');
    document.body.appendChild(el);
    setTimeout(function () { el.remove(); }, 520);
  }

  btn.addEventListener('click', function () {
    var dark = root.getAttribute('data-theme') !== 'dark';
    if (dark) root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');
    try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch (e) {}
    paint();
    flash(dark);
  });

  // another tab flipped it: follow along
  window.addEventListener('storage', function (e) {
    if (e.key !== 'theme') return;
    if (e.newValue === 'dark') root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');
    paint();
  });

  paint();
})();

/* ---------- gate sequence (guides) ---------- */
(function () {
  var root = document.documentElement;
  var gate = document.getElementById('gate');
  if (!gate || !root.classList.contains('gate')) return;



  var bar = document.getElementById('gateBar');
  var sub = document.getElementById('gateSub');
  var dots = document.getElementById('gateSteps').children;

  var stages = ['verifying access', 'decrypting content', 'rendering manual', 'ready'];
  var timers = [];
  var done = false;
  var STEP = 235; // 4 stages -> ~0.95s, panes split after -> ~1.5s total

  stages.forEach(function (label, i) {
    timers.push(setTimeout(function () {
      sub.textContent = label;
      bar.style.width = ((i + 1) / stages.length * 100) + '%';
      if (dots[i]) dots[i].className = 'on';
    }, i * STEP));
  });

  timers.push(setTimeout(finish, stages.length * STEP));

  function finish() {
    if (done) return;
    done = true;
    timers.forEach(clearTimeout);
    bar.style.width = '100%';
    gate.classList.add('open');          // panes slide apart
    root.classList.remove('gate');
    document.body.classList.add('ready');
    setTimeout(function () { gate.remove(); }, 700);
  }

  gate.addEventListener('click', finish);
  document.addEventListener('keydown', finish, { once: true });
  setTimeout(finish, 3000); // hard stop
})();

/* ---------- boot sequence (index) ---------- */
(function () {
  var root = document.documentElement;
  var boot = document.getElementById('boot');
  if (!boot || !root.classList.contains('boot')) return;



  var log = document.getElementById('bootLog');
  var bar = document.getElementById('bootBar');
  var pct = document.getElementById('bootPct');
  var title = document.getElementById('bootTitle');

  var lines = [
    'rmu-cybersec :: init',
    'checking network gateway',
    'verifying certificates',
    'loading security policy',
    'session secured'
  ];
  var timers = [];
  var done = false;

  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }

  /* hex scramble on the wordmark */
  var target = title.textContent;
  var glyphs = '0123456789ABCDEF#$%&*/<>';
  var frame = 0;
  var scramble = setInterval(function () {
    frame++;
    var out = '';
    for (var i = 0; i < target.length; i++) {
      if (target[i] === ' ') { out += ' '; continue; }
      out += i < frame * 1.1 ? target[i] : glyphs[(Math.random() * glyphs.length) | 0];
    }
    title.textContent = out;
    if (frame * 1.1 > target.length) { clearInterval(scramble); title.textContent = target; }
  }, 40);

  /* log lines */
  lines.forEach(function (text, i) {
    later(function () {
      var el = document.createElement('span');
      el.textContent = text;
      log.appendChild(el);
      later(function () { el.className = 'ok'; }, 260);
    }, 60 + i * 115);
  });

  /* progress */
  var p = 0;
  var run = setInterval(function () {
    p = Math.min(100, p + Math.random() * 6 + 5.5);
    bar.style.width = p + '%';
    pct.textContent = Math.round(p) + '%';
    if (p >= 100) { clearInterval(run); later(finish, 300); }
  }, 55);

  function finish() {
    if (done) return;
    done = true;
    clearInterval(run);
    clearInterval(scramble);
    timers.forEach(clearTimeout);
    title.textContent = target;
    bar.style.width = '100%';
    pct.textContent = '100%';
    boot.classList.add('out');
    root.classList.remove('boot');
    document.body.classList.add('ready');
    setTimeout(function () { boot.remove(); }, 600);
  }

  boot.addEventListener('click', finish);
  document.addEventListener('keydown', finish, { once: true });
  setTimeout(finish, 2600); // hard stop, never trap the page
})();

/* ---------- mobile menu ---------- */
(function () {
  var burger = document.getElementById('burger');
  var menu = document.getElementById('menu');
  if (!burger || !menu) return;

  var closing = null;

  function stagger(items, delayOf) {
    for (var i = 0; i < items.length; i++) {
      items[i].style.animation = 'none';
      void items[i].offsetWidth; // force reflow
      items[i].style.animation = '';
      items[i].style.animationDelay = delayOf(i, items.length) + 's';
    }
  }

  function reset() {
    clearTimeout(closing);
    closing = null;
    menu.classList.remove('open', 'closing');
    var items = menu.querySelectorAll('a');
    for (var i = 0; i < items.length; i++) {
      items[i].classList.remove('picked');
      items[i].style.animation = '';
      items[i].style.animationDelay = '';
    }
    burger.setAttribute('aria-expanded', 'false');
  }

  function open() {
    clearTimeout(closing);
    closing = null;
    menu.classList.remove('closing');
    menu.classList.add('open');
    burger.setAttribute('aria-expanded', 'true');
    // items slide in from the left, top to bottom
    stagger(menu.querySelectorAll('a'), function (i) { return 0.05 + i * 0.07; });
  }

  // play the opening stagger backwards: last item leaves first, back the way it came in
  function close(picked) {
    if (!menu.classList.contains('open') || closing) return;
    menu.classList.add('closing');
    stagger(menu.querySelectorAll('a'), function (i, n) { return (n - 1 - i) * 0.05; });
    if (picked) picked.classList.add('picked');
    closing = setTimeout(reset, 420);
  }

  burger.addEventListener('click', function () {
    if (menu.classList.contains('open')) close(null);
    else open();
  });

  menu.addEventListener('click', function (e) {
    var link = e.target.closest ? e.target.closest('a') : null;
    if (link) close(link);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu.classList.contains('open')) {
      close(null);
      burger.focus();
    }
  });

  document.addEventListener('click', function (e) {
    if (!menu.classList.contains('open')) return;
    if (menu.contains(e.target) || burger.contains(e.target)) return;
    close(null);
  });

})();

/* ---------- typing brand subtitle ---------- */
(function () {
  var el = document.querySelector('.type');
  if (!el) return;

  var words = (el.getAttribute('data-words') || '').split('|').filter(Boolean);
  if (!words.length) return;

  var text = document.createElement('span');
  var caret = document.createElement('span');
  caret.className = 'caret';
  el.appendChild(text);
  el.appendChild(caret);

  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    text.textContent = words[0];
    return;
  }

  var w = 0, i = 0, erasing = false;

  function tick() {
    var word = words[w];
    i += erasing ? -1 : 1;
    text.textContent = word.slice(0, i);

    var wait = erasing ? 45 : 85;
    if (!erasing && i === word.length) {       // finished typing: hold, then erase
      erasing = true;
      wait = 1800;
    } else if (erasing && i === 0) {           // erased: move to the next phrase
      erasing = false;
      w = (w + 1) % words.length;
      wait = 400;
    }
    setTimeout(tick, wait);
  }
  setTimeout(tick, 600);
})();

/* ---------- person modal (team page) ---------- */
(function () {
  var modal = document.getElementById('modal');
  var box = document.getElementById('modalBox');
  if (!modal || !box) return;

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lastFocused = null;
  var running = [];

  // every clickable person on the page, in the order they appear
  var people = [].map.call(document.querySelectorAll('[data-person]'), function (el) {
    return el.getAttribute('data-person');
  });
  var at = -1;
  var prevBtn = document.getElementById('modalPrev');
  var nextBtn = document.getElementById('modalNext');
  var count = document.getElementById('modalCount');
  var single = people.length < 2;
  if (single) {
    if (prevBtn) prevBtn.hidden = true;
    if (nextBtn) nextBtn.hidden = true;
  }

  /* decode one element — four different styles so no two fields resolve alike */
  var GLYPH = {
    hex: '0123456789ABCDEF',
    junk: '01<>[]{}/\#$%&*+=?!',
    bin: '01',
    mask: '█▓▒░'
  };

  function decode(el, delay, mode) {
    if (!el) return;
    var target = el.textContent;
    if (!target.trim()) return;

    var set = mode === 'binary' ? GLYPH.bin : mode === 'mask' ? GLYPH.mask : mode === 'type' ? '' : GLYPH.junk;
    var step = mode === 'type' ? 26 : 22;   // ms per frame
    var speed = mode === 'type' ? 1.4 : 1.7; // chars resolved per frame
    var frame = 0;
    el.classList.add('decoding');

    var id = setTimeout(function () {
      var tick = setInterval(function () {
        frame++;
        var cut = frame * speed;
        var out = '';
        for (var i = 0; i < target.length; i++) {
          if (i < cut) { out += target[i]; continue; }
          if (mode === 'type') break;                       // typewriter: nothing past the caret
          out += target[i] === ' ' ? ' ' : set[(Math.random() * set.length) | 0];
        }
        el.textContent = out;
        if (cut > target.length) {
          clearInterval(tick);
          el.textContent = target;
          el.classList.remove('decoding');
        }
      }, step);
      running.push({ stop: function () { clearInterval(tick); el.textContent = target; el.classList.remove('decoding'); } });
    }, delay);
    running.push({ stop: function () { clearTimeout(id); el.textContent = target; el.classList.remove('decoding'); } });
  }

  function stopAll() {
    running.forEach(function (r) { r.stop(); });
    running = [];
  }

  function open(id, opener) {
    var tpl = document.getElementById(id);
    if (!tpl) return;
    // only remember the opener on the first open; stepping between people keeps it
    if (opener) lastFocused = opener;
    at = people.indexOf(id);
    if (count && !single) count.textContent = (at + 1) + ' / ' + people.length;
    stopAll();
    closing = false;
    modal.classList.remove('closing');
    box.innerHTML = '';
    box.appendChild(tpl.content.cloneNode(true));
    modal.classList.add('open');
    document.body.classList.add('no-scroll');

    if (!reduce) {
      var fx = (tpl.getAttribute('data-fx') || 'a');
      box.className = 'modal-box';
      void box.offsetWidth; // restart the panel animation
      box.classList.add('hack');
      if (fx === 'b') box.classList.add('fx-b');

      var tag = document.createElement('span');
      tag.className = 'granted';
      tag.textContent = fx === 'b' ? '// decrypt ok' : '// access granted';
      box.appendChild(tag);
      setTimeout(function () { if (tag.parentNode) tag.remove(); }, 1500);

      // each field gets its own resolve style; the two cards use different sets
      var head = fx === 'b'
        ? ['mask', 'binary', 'type']
        : ['type', 'scramble', 'binary'];
      decode(box.querySelector('.modal-head .person-role'), 0, head[0]);
      decode(box.querySelector('.modal-head .person-name'), 60, head[1]);
      decode(box.querySelector('.modal-head .person-sub'), 120, head[2]);
      var cells = box.querySelectorAll('.modal-body .kv-row dd');
      for (var j = 0; j < cells.length; j++) {
        if (cells[j].querySelector('a')) continue;          // leave links clickable
        var mode = fx === 'b' ? (j % 2 ? 'binary' : 'type') : (j % 2 ? 'mask' : 'scramble');
        decode(cells[j], 110 + j * 45, mode);
      }
    }

    var closeBtn = box.querySelector('[data-close]');
    if (closeBtn) closeBtn.focus();
  }

  // wrap around: last -> first, first -> last
  function step(dir) {
    if (single || at < 0) return;
    open(people[(at + dir + people.length) % people.length]);
  }

  var closing = false;

  function teardown() {
    closing = false;
    var back = lastFocused;
    lastFocused = null;
    modal.classList.remove('open', 'closing');
    box.className = 'modal-box';
    document.body.classList.remove('no-scroll');
    box.innerHTML = '';
    if (back && document.contains(back)) back.focus();
  }

  function close() {
    if (closing || !modal.classList.contains('open')) return;
    stopAll();
    if (reduce) { teardown(); return; }
    closing = true;
    box.classList.add('out');       // glitch apart (A) or power off (B)
    modal.classList.add('closing'); // backdrop fades with it
    setTimeout(teardown, 340);
  }

  if (prevBtn) prevBtn.addEventListener('click', function () { step(-1); });
  if (nextBtn) nextBtn.addEventListener('click', function () { step(1); });

  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('.modal-nav')) return;
    var card = e.target.closest ? e.target.closest('[data-person]') : null;
    if (card) {
      if (!reduce) {
        card.classList.remove('hit');
        void card.offsetWidth;
        card.classList.add('hit');
        setTimeout(function () { card.classList.remove('hit'); }, 340);
      }
      open(card.getAttribute('data-person'), card);
      return;
    }
    if (e.target.closest && e.target.closest('[data-close]')) { close(); return; }
    if (e.target === modal || (e.target.classList && e.target.classList.contains('modal-shell'))) close();
  });

  var FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

  document.addEventListener('keydown', function (e) {
    if (!modal.classList.contains('open')) return;

    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); return; }
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1); return; }

    if (e.key === 'Tab') {           // keep tabbing inside the dialog
      var items = modal.querySelectorAll(FOCUSABLE);
      if (!items.length) return;
      var first = items[0];
      var last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      else if (!modal.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    }
  });
})();

/* ---------- guide scrollspy ---------- */
(function () {
  var nav = document.querySelector('.guide-nav');
  if (!nav) return;

  var links = [].slice.call(nav.querySelectorAll('a[href^="#"]'));
  var bar = document.getElementById('guideProgress');
  var cards = links.map(function (a) { return document.querySelector(a.getAttribute('href')); });
  if (!cards.length || cards.indexOf(null) > -1) return;

  var current = -1;

  function mark(i) {
    if (i === current) return;
    current = i;
    for (var k = 0; k < links.length; k++) links[k].classList.toggle('active', k === i);
    if (bar) bar.style.width = ((i + 1) / links.length * 100) + '%';
    // keep the active chip in view on the horizontal mobile bar
    if (nav.scrollWidth > nav.clientWidth) {
      var a = links[i];
      var left = a.offsetLeft - (nav.clientWidth - a.offsetWidth) / 2;
      nav.scrollTo ? nav.scrollTo({ left: left, behavior: 'smooth' }) : (nav.scrollLeft = left);
    }
  }

  function update() {
    var line = window.innerHeight * 0.32;   // the "you are here" line
    var i = 0;
    for (var k = 0; k < cards.length; k++) {
      if (cards[k].getBoundingClientRect().top <= line) i = k;
    }
    // bottom of the page: always show the last item as reached
    if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) i = cards.length - 1;
    mark(i);
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { update(); ticking = false; });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
})();

/* ---------- header scrollspy (same-page sections) ---------- */
(function () {
  var menu = document.getElementById('menu');
  if (!menu) return;

  var pairs = [];
  [].forEach.call(menu.querySelectorAll('a[href^="#"]'), function (a) {
    var el = document.querySelector(a.getAttribute('href'));
    if (el) pairs.push({ link: a, target: el });
  });
  if (pairs.length < 2) return;   // subpages link out, nothing to track

  // the menu is not in document order (เกี่ยวกับเรา sits after บริการ on the page),
  // so sort by where each section actually is before deciding which one you are in
  pairs.sort(function (a, b) {
    return (a.target.compareDocumentPosition(b.target) & Node.DOCUMENT_POSITION_FOLLOWING) ? -1 : 1;
  });
  var links = pairs.map(function (p) { return p.link; });
  var targets = pairs.map(function (p) { return p.target; });

  // the home link lights up while you are still above the first tracked section
  var home = menu.querySelector('a[href="index.html"], a[href="./"], a[href="/"]');
  var current = -2;

  function update() {
    var line = window.innerHeight * 0.34;
    var i = -1;
    for (var k = 0; k < targets.length; k++) {
      if (targets[k].getBoundingClientRect().top <= line) i = k;
    }
    if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) i = targets.length - 1;
    if (i === current) return;
    current = i;
    for (var n = 0; n < links.length; n++) links[n].classList.toggle('active', n === i);
    if (home) home.classList.toggle('active', i === -1);
  }

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { update(); ticking = false; });
  }, { passive: true });
  window.addEventListener('resize', update);
  update();
})();
