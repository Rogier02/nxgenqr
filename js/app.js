(function () {
  'use strict';

  // -------------------------------------------------------------------
  // Feature flags
  //
  // Donations are intentionally built but kept hidden until the project
  // is ready to launch them publicly. Flip this to true (the matching
  // `hidden` attribute on #donate-section in index.html is removed
  // automatically below) when that day comes. The actual payment +
  // ledger backend still needs to be built before this is meaningful.
  // -------------------------------------------------------------------
  var FEATURES = {
    donations: false
  };

  // The vendored qrcode-generator library defaults to a "byte truncation"
  // string encoder, which mangles any non-Latin1 character. Use the
  // proper UTF-8 encoder it ships with instead, so any link or text
  // (accented characters, emoji, non-Latin domains, etc.) survives intact.
  if (window.qrcode && qrcode.stringToBytesFuncs && qrcode.stringToBytesFuncs['UTF-8']) {
    qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];
  }

  var SIZES = {
    small: 256,
    medium: 512,
    large: 1024,
    xlarge: 2048
  };

  var QUIET_ZONE_MODULES = 4; // standard QR "quiet zone" margin, in modules

  var form = document.getElementById('qr-form');
  var input = document.getElementById('qr-input');
  var errorEl = document.getElementById('qr-error');
  var resultSection = document.getElementById('qr-result');
  var canvas = document.getElementById('qr-canvas');
  var sizeButtons = document.querySelectorAll('.size-option');
  var downloadButtons = document.querySelectorAll('[data-format]');
  var donateSection = document.getElementById('donate-section');

  var state = {
    size: 'medium',
    text: '',
    qr: null
  };

  function normalizeLink(value) {
    var v = value.trim();
    if (!v) return '';

    var hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(v);
    var looksLikeBareDomain = /^[a-z0-9-]+(\.[a-z0-9-]+)+([/?#].*)?$/i.test(v);

    if (!hasScheme && looksLikeBareDomain) {
      return 'https://' + v;
    }
    return v;
  }

  function showError(message) {
    errorEl.textContent = message || '';
    errorEl.hidden = !message;
  }

  function buildQr(text) {
    var qr = qrcode(0, 'M'); // typeNumber 0 = let the library auto-pick the smallest size
    qr.addData(text);
    qr.make();
    return qr;
  }

  function drawToCanvas(qr, pixelSize, targetCanvas) {
    var moduleCount = qr.getModuleCount();
    var totalModules = moduleCount + QUIET_ZONE_MODULES * 2;
    var cellSize = Math.max(1, Math.floor(pixelSize / totalModules));
    var actualSize = cellSize * totalModules;

    targetCanvas.width = actualSize;
    targetCanvas.height = actualSize;

    var ctx = targetCanvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, actualSize, actualSize);
    ctx.fillStyle = '#000000';

    for (var row = 0; row < moduleCount; row++) {
      for (var col = 0; col < moduleCount; col++) {
        if (qr.isDark(row, col)) {
          ctx.fillRect(
            (col + QUIET_ZONE_MODULES) * cellSize,
            (row + QUIET_ZONE_MODULES) * cellSize,
            cellSize,
            cellSize
          );
        }
      }
    }
  }

  function round2(n) {
    return Math.round(n * 100) / 100;
  }

  function buildSvg(qr, pixelSize) {
    var moduleCount = qr.getModuleCount();
    var totalModules = moduleCount + QUIET_ZONE_MODULES * 2;
    var cellSize = pixelSize / totalModules;
    var actualSize = round2(cellSize * totalModules);

    var rects = [];
    for (var row = 0; row < moduleCount; row++) {
      for (var col = 0; col < moduleCount; col++) {
        if (qr.isDark(row, col)) {
          var x = round2((col + QUIET_ZONE_MODULES) * cellSize);
          var y = round2((row + QUIET_ZONE_MODULES) * cellSize);
          rects.push(
            '<rect x="' + x + '" y="' + y + '" width="' + round2(cellSize) +
            '" height="' + round2(cellSize) + '"/>'
          );
        }
      }
    }

    return (
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + actualSize + ' ' + actualSize +
      '" width="' + actualSize + '" height="' + actualSize + '" shape-rendering="crispEdges">' +
      '<rect width="100%" height="100%" fill="#ffffff"/>' +
      '<g fill="#000000">' + rects.join('') + '</g>' +
      '</svg>'
    );
  }

  function renderPreview() {
    if (!state.qr) return;
    drawToCanvas(state.qr, SIZES[state.size], canvas);
  }

  function generate() {
    var link = normalizeLink(input.value);

    if (!link) {
      showError('Please enter a link or text to generate a QR code for.');
      resultSection.hidden = true;
      return;
    }

    try {
      state.text = link;
      state.qr = buildQr(link);
      showError('');
      renderPreview();
      resultSection.hidden = false;
    } catch (err) {
      state.qr = null;
      resultSection.hidden = true;
      showError(
        'Could not generate a QR code for that input (it may be too long). ' +
        'Try a shorter link or text.'
      );
    }
  }

  function triggerDownload(url, filename) {
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function download(format) {
    if (!state.qr) return;

    var pixelSize = SIZES[state.size];
    var baseName = 'qrcode-' + state.size;

    if (format === 'svg') {
      var svg = buildSvg(state.qr, pixelSize);
      var blob = new Blob([svg], { type: 'image/svg+xml' });
      var url = URL.createObjectURL(blob);
      triggerDownload(url, baseName + '.svg');
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      return;
    }

    var mimeByFormat = { png: 'image/png', jpeg: 'image/jpeg', webp: 'image/webp' };
    var extByFormat = { png: 'png', jpeg: 'jpg', webp: 'webp' };
    var mime = mimeByFormat[format];
    if (!mime) return;

    // Render at the exact requested resolution for the download (the
    // on-screen canvas is the same one, so this just re-renders it at
    // the current size before exporting).
    drawToCanvas(state.qr, pixelSize, canvas);
    var quality = format === 'jpeg' ? 0.92 : undefined;
    var dataUrl = canvas.toDataURL(mime, quality);
    triggerDownload(dataUrl, baseName + '.' + extByFormat[format]);
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    generate();
  });

  sizeButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      sizeButtons.forEach(function (b) {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      state.size = btn.dataset.size;
      renderPreview();
    });
  });

  downloadButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      download(btn.dataset.format);
    });
  });

  if (donateSection) {
    donateSection.hidden = !FEATURES.donations;
  }
})();
