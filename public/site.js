(function () {
  /* ---------- Traces ---------- */
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var colors = {};
  function hexToRgb(h) {
    h = h.replace("#", "");
    if (h.length === 3) h = h.split("").map(function (c) { return c + c; }).join("");
    var n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function readColors() {
    var cs = getComputedStyle(document.documentElement);
    ["--panel", "--ink", "--muted", "--rule", "--signal", "--accent"].forEach(function (k) {
      colors[k] = cs.getPropertyValue(k).trim();
    });
    buildLut();
  }

  function Scope(id, draw) {
    this.c = document.getElementById(id);
    this.ctx = this.c.getContext("2d");
    this.draw = draw;
    this.visible = true;
    var self = this;
    this.size = function () {
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      self.w = self.c.clientWidth; self.h = self.c.clientHeight;
      self.c.width = Math.max(1, Math.round(self.w * dpr));
      self.c.height = Math.max(1, Math.round(self.h * dpr));
      self.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    this.size();
  }
  Scope.prototype.render = function (t) { this.draw(this.ctx, this.w, this.h, t); };

  /* Logic analyzer: CLK + DATA spelling the initials "AG" in ASCII */
  var bits = [];
  "AG".split("").forEach(function (ch) {
    var v = ch.charCodeAt(0);
    for (var i = 7; i >= 0; i--) bits.push((v >> i) & 1);
  });
  function drawLogic(ctx, w, h, t) {
    ctx.clearRect(0, 0, w, h);
    var bw = 16, n = bits.length, off = reduce ? 0 : (t * 0.03) % (n * bw);
    var rows = [{ y: h * 0.18, amp: h * 0.2, clk: true }, { y: h * 0.56, amp: h * 0.24, clk: false }];
    ctx.strokeStyle = "#0d3a8f"; ctx.lineWidth = 1;   /* waterfall palette: grid in deep blue */
    ctx.setLineDash([2, 4]);
    for (var x = bw - (off % bw); x < w; x += bw) { ctx.beginPath(); ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, h); ctx.stroke(); }
    ctx.setLineDash([]);
    rows.forEach(function (r) {
      ctx.beginPath();
      ctx.strokeStyle = r.clk ? "#18b7e0" : "#f2e22e";   /* CLK cyan, DATA yellow, like the waterfall peaks */
      ctx.lineWidth = r.clk ? 1.25 : 2;
      var step = r.clk ? bw / 2 : bw, prev = null;
      for (var k = Math.floor(off / step) - 1; k * step - off <= w + step; k++) {
        var gx = k * step - off;
        var v = r.clk ? (((k % 2) + 2) % 2) : bits[((k % n) + n) % n];
        var y = r.y + (1 - v) * r.amp;
        if (prev === null) ctx.moveTo(gx, y); else ctx.lineTo(gx, y);
        ctx.lineTo(gx + step, y);
        prev = y;
      }
      ctx.stroke();
    });
  }

  /* Bass: four strings (G D A E, tab order) played by a simple riff.
     The plucked string lights up through the waterfall palette and decays;
     frets follow the real scale formula, the caption shows the live note. */
  var OPEN = [97.999, 73.416, 55.0, 41.203];          /* G2 D2 A1 E1 */
  var OPEN_MIDI = [43, 38, 33, 28];
  var SNAME = ["G", "D", "A", "E"];
  var NOTE = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  /* [string index, fret]: root-fifth-octave groove in E, then A */
  var RIFF = [[3, 0], [3, 0], [2, 2], [1, 2], [3, 0], [3, 0], [2, 2], [3, 3],
              [2, 0], [2, 0], [1, 2], [0, 2], [2, 0], [1, 0], [1, 2], [2, 2]];
  var STEP_MS = 950;
  var amp = [0, 0, 0, 0], plucked = [0, 0, 0, 0], fretOn = [0, 0, 0, 0], lastStep = -1;
  var noteEl = document.getElementById("bass-note");
  function fmtHz(f) {
    var s = f.toFixed(1);
    return document.documentElement.lang === "it" ? s.replace(".", ",") : s;
  }
  function showNote(si, fret) {
    if (!noteEl) return;
    var midi = OPEN_MIDI[si] + fret, f = OPEN[si] * Math.pow(2, fret / 12);
    noteEl.textContent = NOTE[midi % 12] + (Math.floor(midi / 12) - 1) + " · " + fmtHz(f) + " Hz";
  }
  function lutColor(v) {
    var i = Math.max(0, Math.min(255, v * 255 | 0)) * 3;
    return "rgb(" + lut[i] + "," + lut[i + 1] + "," + lut[i + 2] + ")";
  }
  function drawString(ctx, w, h, t) {
    ctx.clearRect(0, 0, w, h);
    var x0 = 30, x1 = w - 10, L = (x1 - x0) * 1.6;   /* scale length longer than the view: frets 0..~13 visible */
    function fretX(n) { return x0 + L * (1 - Math.pow(2, -n / 12)); }
    var step = reduce ? 0 : Math.floor(t / STEP_MS);
    if (step !== lastStep) {
      var n = RIFF[((step % RIFF.length) + RIFF.length) % RIFF.length];
      amp[n[0]] = 1; plucked[n[0]] = t; fretOn[n[0]] = n[1];
      showNote(n[0], n[1]);
      lastStep = step;
    }
    /* fretboard: nut, frets, inlay dots at 3, 5, 7, 9, 12 */
    ctx.fillStyle = "#06246e";
    ctx.fillRect(x0 - 3, h * 0.12, 3, h * 0.76);
    ctx.strokeStyle = "#0d3a8f"; ctx.lineWidth = 1;
    for (var f = 1; fretX(f) < x1; f++) {
      var fx = Math.round(fretX(f)) + .5;
      ctx.beginPath(); ctx.moveTo(fx, h * 0.14); ctx.lineTo(fx, h * 0.86); ctx.stroke();
      if ([3, 5, 7, 9].indexOf(f) >= 0 || f === 12) {
        var mx = (fretX(f - 1) + fretX(f)) / 2;
        ctx.fillStyle = "#0d3a8f";
        if (f === 12) { ctx.beginPath(); ctx.arc(mx, h * 0.31, 2.5, 0, 6.3); ctx.arc(mx, h * 0.69, 2.5, 0, 6.3); ctx.fill(); }
        else { ctx.beginPath(); ctx.arc(mx, h * 0.5, 2.5, 0, 6.3); ctx.fill(); }
      }
    }
    ctx.font = "500 11px " + getComputedStyle(document.documentElement).getPropertyValue("--f-mono");
    ctx.textBaseline = "middle";
    for (var s = 0; s < 4; s++) {
      var y = h * (0.2 + s * 0.2);
      var age = reduce ? 300 : t - plucked[s];
      var a = reduce ? (s === 3 ? 0.8 : 0) : amp[s] * Math.exp(-age / 1300);
      var start = fretOn[s] > 0 ? (fretX(fretOn[s] - 1) + fretX(fretOn[s])) / 2 : x0;
      ctx.fillStyle = a > 0.05 ? lutColor(0.55 + 0.25 * a) : "#3f63a8";
      ctx.fillText(SNAME[s], 8, y);
      ctx.strokeStyle = a > 0.03 ? lutColor(0.4 + 0.33 * a) : "#1257c9";
      ctx.lineWidth = [1.4, 1.8, 2.3, 2.8][s];
      ctx.beginPath();
      ctx.moveTo(x0, y);
      if (a > 0.01) {
        ctx.lineTo(start, y);
        var visF = 1.6 + OPEN[s] * Math.pow(2, fretOn[s] / 12) / 30;   /* slowed down so the eye can follow */
        var ph = 2 * Math.PI * visF * (reduce ? 0.13 : age / 1000);
        var A = h * 0.085 * a;
        for (var x = start; x <= x1; x += 2) {
          var u = (x - start) / (x1 - start);
          ctx.lineTo(x, y + A * Math.sin(Math.PI * u) * Math.sin(ph) + A * 0.3 * Math.sin(2 * Math.PI * u) * Math.sin(2 * ph + 1));
        }
      } else {
        ctx.lineTo(x1, y);
      }
      ctx.stroke();
      if (fretOn[s] > 0 && a > 0.05) {          /* fingertip on the fret */
        ctx.fillStyle = lutColor(0.72);
        ctx.beginPath(); ctx.arc(start, y, 3.2, 0, 6.3); ctx.fill();
      }
    }
  }

  /* SDR waterfall: band noise, a few weak carriers and IU8DKG keyed in CW */
  var COLS = 200, ROWS = 64;
  var vals = new Float32Array(COLS * ROWS);
  var off = document.createElement("canvas"); off.width = COLS; off.height = ROWS;
  var octx = off.getContext("2d");
  var img = octx.createImageData(COLS, ROWS);
  var lut = new Uint8ClampedArray(256 * 3);
  /* Classic SDR waterfall palette: navy noise floor, blue, cyan, yellow, red peaks */
  var STOPS = [[0, "#000a24"], [0.2, "#06246e"], [0.38, "#1257c9"], [0.55, "#18b7e0"], [0.72, "#f2e22e"], [0.86, "#f07a12"], [1, "#d8141c"]];
  function buildLut() {
    for (var i = 0; i < 256; i++) {
      var v = i / 255, s = 0;
      while (s < STOPS.length - 2 && v > STOPS[s + 1][0]) s++;
      var p = hexToRgb(STOPS[s][1]), q = hexToRgb(STOPS[s + 1][1]);
      var k = (v - STOPS[s][0]) / (STOPS[s + 1][0] - STOPS[s][0]);
      for (var j = 0; j < 3; j++) lut[i * 3 + j] = p[j] + (q[j] - p[j]) * k;
    }
  }
  var morse = { I: "..", U: "..-", "8": "---..", D: "-..", K: "-.-", G: "--." };
  var key = [];
  "IU8DKG".split("").forEach(function (ch) {
    morse[ch].split("").forEach(function (s) {
      for (var i = 0; i < (s === "." ? 1 : 3); i++) key.push(1);
      key.push(0);
    });
    key.push(0, 0);
  });
  for (var g = 0; g < 7; g++) key.push(0);
  var keyPos = 0, rowCount = 0;
  var carriers = [{ c: 34, s: 0.35 }, { c: 52, s: 0.5 }, { c: 58, s: 0.3 }, { c: 61, s: 0.42 }, { c: 170, s: 0.28 }];
  function newRow() {
    vals.copyWithin(COLS, 0, COLS * (ROWS - 1));
    var on = key[Math.floor(keyPos / 2) % key.length] === 1;
    keyPos++; rowCount++;
    for (var x = 0; x < COLS; x++) {
      var v = Math.random() * 0.22 + 0.05;
      for (var i = 0; i < carriers.length; i++) {
        var d = Math.abs(x - carriers[i].c);
        if (d < 2) v += carriers[i].s * (0.6 + 0.4 * Math.random()) * (d === 0 ? 1 : 0.4);
      }
      var cw = Math.abs(x - 122);
      if (on && cw < 3) v += cw === 0 ? 0.95 : cw === 1 ? 0.7 : 0.35;
      vals[x] = Math.min(1, v);
    }
  }
  for (var r = 0; r < ROWS; r++) newRow();
  function paintWaterfall() {
    var d = img.data;
    for (var i = 0; i < vals.length; i++) {
      var li = (vals[i] * 255 | 0) * 3;
      d[i * 4] = lut[li]; d[i * 4 + 1] = lut[li + 1]; d[i * 4 + 2] = lut[li + 2]; d[i * 4 + 3] = 255;
    }
    octx.putImageData(img, 0, 0);
  }
  var lastRow = 0;
  function drawWaterfall(ctx, w, h, t) {
    if (!reduce && t - lastRow > 55) { newRow(); lastRow = t; }
    paintWaterfall();
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(off, 0, 0, w, h);
  }

  readColors();
  var scopes = [
    new Scope("scope-logic", drawLogic),
    new Scope("scope-string", drawString),
    new Scope("scope-waterfall", drawWaterfall)
  ];
  function renderAll(t) { scopes.forEach(function (s) { if (s.visible) s.render(t || 0); }); }
  renderAll(0);

  if ("ResizeObserver" in window) {
    var ro = new ResizeObserver(function () { scopes.forEach(function (s) { s.size(); }); renderAll(performance.now()); });
    scopes.forEach(function (s) { ro.observe(s.c); });
  }
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { scopes.forEach(function (s) { if (s.c === e.target) s.visible = e.isIntersecting; }); });
    });
    scopes.forEach(function (s) { io.observe(s.c); });
  }
  function onTheme() { readColors(); renderAll(performance.now()); }
  var mq = window.matchMedia("(prefers-color-scheme: dark)");
  if (mq.addEventListener) mq.addEventListener("change", onTheme);
  new MutationObserver(onTheme).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  if (!reduce) {
    (function loop(t) { renderAll(t); requestAnimationFrame(loop); })(0);
  }
})();
