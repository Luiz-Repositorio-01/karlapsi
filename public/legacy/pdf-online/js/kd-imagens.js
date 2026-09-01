/*
 * kd-imagens.js — Inserção de imagem livre sobre o timbrado.
 * Módulo independente: adiciona, move, redimensiona, gira e exclui imagens
 * posicionadas livremente sobre a folha de pré-visualização. As imagens são
 * independentes do texto e são reproduzidas no PDF gerado na mesma posição,
 * tamanho e rotação. Não altera nenhuma função existente do editor.
 */
(function () {
  'use strict';

  var papel, btn, fileInput;
  var imagens = [];       // { el, imEl, dataUrl, fmt, ratio, rot }
  var selecionado = null;

  var MIN_W = 24;         // largura mínima em px
  var DEFAULT_W_PCT = 0.35;

  function $(id) { return document.getElementById(id); }

  function formatoDataUrl(dataUrl) {
    if (/^data:image\/jpe?g/i.test(dataUrl)) return 'JPEG';
    if (/^data:image\/webp/i.test(dataUrl)) return 'WEBP';
    return 'PNG';
  }

  function selecionar(obj) {
    if (selecionado && selecionado.el) selecionado.el.classList.remove('kd-img-sel');
    selecionado = obj;
    if (obj && obj.el) obj.el.classList.add('kd-img-sel');
  }

  function removerImagem(obj) {
    var i = imagens.indexOf(obj);
    if (i !== -1) imagens.splice(i, 1);
    if (obj.el && obj.el.parentNode) obj.el.parentNode.removeChild(obj.el);
    if (selecionado === obj) selecionado = null;
  }

  function centroLocal(el) {
    return {
      x: parseFloat(el.style.left) + parseFloat(el.style.width) / 2,
      y: parseFloat(el.style.top) + parseFloat(el.style.height) / 2
    };
  }

  function clientParaLocal(e) {
    var r = papel.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function aplicarRot(obj) {
    obj.el.style.transform = 'rotate(' + obj.rot + 'deg)';
  }

  /* ---------- Interações (mouse + toque via Pointer Events) ---------- */

  function wireMover(obj) {
    var el = obj.el;
    el.addEventListener('pointerdown', function (e) {
      if (e.target.closest('.kd-img-handle') || e.target.closest('.kd-img-del')) return;
      e.preventDefault();
      selecionar(obj);
      var start = clientParaLocal(e);
      var left0 = parseFloat(el.style.left);
      var top0 = parseFloat(el.style.top);
      try { el.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }

      function mover(ev) {
        var p = clientParaLocal(ev);
        var w = parseFloat(el.style.width);
        var h = parseFloat(el.style.height);
        var nl = left0 + (p.x - start.x);
        var nt = top0 + (p.y - start.y);
        nl = Math.max(-w * 0.5, Math.min(papel.clientWidth - w * 0.5, nl));
        nt = Math.max(-h * 0.5, Math.min(papel.clientHeight - h * 0.5, nt));
        el.style.left = nl + 'px';
        el.style.top = nt + 'px';
      }
      function soltar(ev) {
        el.removeEventListener('pointermove', mover);
        el.removeEventListener('pointerup', soltar);
        try { el.releasePointerCapture(ev.pointerId); } catch (err) { /* ignore */ }
      }
      el.addEventListener('pointermove', mover);
      el.addEventListener('pointerup', soltar);
    });
  }

  function wireResize(obj, handle) {
    handle.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      selecionar(obj);
      var el = obj.el;
      var c = centroLocal(el);            // centro fixo (coords da folha)
      var r = papel.getBoundingClientRect();
      var cxCli = r.left + c.x, cyCli = r.top + c.y;
      var startDist = Math.hypot(e.clientX - cxCli, e.clientY - cyCli) || 1;
      var startW = parseFloat(el.style.width);
      var maxW = papel.clientWidth * 1.5;
      try { handle.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }

      function mover(ev) {
        var d = Math.hypot(ev.clientX - cxCli, ev.clientY - cyCli);
        var nw = Math.max(MIN_W, Math.min(maxW, startW * (d / startDist)));
        var nh = nw / obj.ratio;
        el.style.width = nw + 'px';
        el.style.height = nh + 'px';
        el.style.left = (c.x - nw / 2) + 'px';
        el.style.top = (c.y - nh / 2) + 'px';
      }
      function soltar(ev) {
        handle.removeEventListener('pointermove', mover);
        handle.removeEventListener('pointerup', soltar);
        try { handle.releasePointerCapture(ev.pointerId); } catch (err) { /* ignore */ }
      }
      handle.addEventListener('pointermove', mover);
      handle.addEventListener('pointerup', soltar);
    });
  }

  function wireRotate(obj, handle) {
    handle.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      selecionar(obj);
      var el = obj.el;
      var c = centroLocal(el);
      var r = papel.getBoundingClientRect();
      var cxCli = r.left + c.x, cyCli = r.top + c.y;
      try { handle.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }

      function mover(ev) {
        var ang = Math.atan2(ev.clientY - cyCli, ev.clientX - cxCli) * 180 / Math.PI + 90;
        obj.rot = Math.round(ang);
        aplicarRot(obj);
      }
      function soltar(ev) {
        handle.removeEventListener('pointermove', mover);
        handle.removeEventListener('pointerup', soltar);
        try { handle.releasePointerCapture(ev.pointerId); } catch (err) { /* ignore */ }
      }
      handle.addEventListener('pointermove', mover);
      handle.addEventListener('pointerup', soltar);
    });
  }

  function criarObjeto(dataUrl, imEl, ratio) {
    if (!papel) return;
    var pw = papel.clientWidth || 480;
    var ph = papel.clientHeight || 679;
    var wPx = pw * DEFAULT_W_PCT;
    var hPx = wPx / ratio;
    if (hPx > ph * 0.42) { hPx = ph * 0.42; wPx = hPx * ratio; }

    var el = document.createElement('div');
    el.className = 'kd-img-obj';
    el.style.width = wPx + 'px';
    el.style.height = hPx + 'px';
    el.style.left = ((pw - wPx) / 2) + 'px';
    el.style.top = ((ph - hPx) / 2) + 'px';
    el.style.transform = 'rotate(0deg)';

    var img = document.createElement('img');
    img.src = dataUrl;
    img.alt = 'Imagem inserida';
    img.draggable = false;
    el.appendChild(img);

    var del = document.createElement('button');
    del.type = 'button';
    del.className = 'kd-img-del';
    del.setAttribute('aria-label', 'Excluir imagem');
    del.innerHTML = '<i class="fa fa-times" aria-hidden="true"></i>';

    var rs = document.createElement('span');
    rs.className = 'kd-img-handle kd-img-resize';
    rs.setAttribute('aria-label', 'Redimensionar');

    var rot = document.createElement('span');
    rot.className = 'kd-img-handle kd-img-rotate';
    rot.setAttribute('aria-label', 'Girar');

    el.appendChild(del);
    el.appendChild(rs);
    el.appendChild(rot);
    papel.appendChild(el);

    var obj = { el: el, imEl: imEl, dataUrl: dataUrl, fmt: formatoDataUrl(dataUrl), ratio: ratio, rot: 0 };
    imagens.push(obj);

    del.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    del.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); removerImagem(obj); });

    wireMover(obj);
    wireResize(obj, rs);
    wireRotate(obj, rot);
    selecionar(obj);
  }

  function adicionarImagem(dataUrl) {
    var imEl = new Image();
    imEl.onload = function () {
      var ratio = (imEl.naturalWidth / imEl.naturalHeight) || 1;
      criarObjeto(dataUrl, imEl, ratio);
    };
    imEl.onerror = function () { /* ignora arquivo inválido */ };
    imEl.src = dataUrl;
  }

  function carregarArquivo(file) {
    if (!file || !/^image\//i.test(file.type)) return;
    var reader = new FileReader();
    reader.onload = function () { adicionarImagem(reader.result); };
    reader.readAsDataURL(file);
  }

  /* ---------- Reprodução no PDF (jsPDF) ---------- */

  window.kdRenderImagensPdf = function (doc, larguraMm, alturaMm) {
    if (!imagens.length || !papel) return;
    var pw = papel.clientWidth, ph = papel.clientHeight;
    if (!pw || !ph) return;

    imagens.forEach(function (obj) {
      var el = obj.el;
      var left = parseFloat(el.style.left);
      var top = parseFloat(el.style.top);
      var w = parseFloat(el.style.width);
      var h = parseFloat(el.style.height);
      var rot = obj.rot || 0;

      if (!rot) {
        doc.addImage(
          obj.dataUrl, obj.fmt,
          (left / pw) * larguraMm, (top / ph) * alturaMm,
          (w / pw) * larguraMm, (h / ph) * alturaMm,
          undefined, 'FAST'
        );
        return;
      }

      // Rotação: pré-renderiza a imagem girada num canvas (em torno do centro),
      // e insere o retângulo envolvente centralizado — reproduz fielmente o
      // transform: rotate() da pré-visualização (que gira em torno do centro).
      try {
        var rad = rot * Math.PI / 180;
        var absCos = Math.abs(Math.cos(rad));
        var absSin = Math.abs(Math.sin(rad));
        var scale = 3; // densidade para boa qualidade no PDF
        var bw = (w * absCos + h * absSin);
        var bh = (w * absSin + h * absCos);

        var cv = document.createElement('canvas');
        cv.width = Math.max(1, Math.round(bw * scale));
        cv.height = Math.max(1, Math.round(bh * scale));
        var ctx = cv.getContext('2d');
        ctx.translate(cv.width / 2, cv.height / 2);
        ctx.rotate(rad);
        ctx.drawImage(obj.imEl, -w * scale / 2, -h * scale / 2, w * scale, h * scale);
        var rotUrl = cv.toDataURL('image/png');

        var cx = left + w / 2;
        var cy = top + h / 2;
        var bwMm = (bw / pw) * larguraMm;
        var bhMm = (bh / ph) * alturaMm;
        var xMm = (cx / pw) * larguraMm - bwMm / 2;
        var yMm = (cy / ph) * alturaMm - bhMm / 2;
        doc.addImage(rotUrl, 'PNG', xMm, yMm, bwMm, bhMm, undefined, 'FAST');
      } catch (err) {
        // fallback sem rotação
        doc.addImage(
          obj.dataUrl, obj.fmt,
          (left / pw) * larguraMm, (top / ph) * alturaMm,
          (w / pw) * larguraMm, (h / ph) * alturaMm,
          undefined, 'FAST'
        );
      }
    });
  };

  /* ---------- Inicialização ---------- */

  function init() {
    papel = $('kdPreviewPapel');
    btn = $('kdBtnInserirImagem');
    fileInput = $('kdInputImagem');
    if (!papel || !btn || !fileInput) return;

    btn.addEventListener('click', function () { fileInput.value = ''; fileInput.click(); });
    fileInput.addEventListener('change', function () {
      if (fileInput.files && fileInput.files[0]) carregarArquivo(fileInput.files[0]);
    });

    // Clicar fora de qualquer imagem desmarca a seleção (esconde alças).
    document.addEventListener('pointerdown', function (e) {
      if (!e.target.closest('.kd-img-obj')) selecionar(null);
    });

    // Tecla Delete/Backspace remove a imagem selecionada (fora de campos de texto).
    document.addEventListener('keydown', function (e) {
      if (!selecionado) return;
      var alvo = e.target;
      var editavel = alvo && (alvo.isContentEditable || alvo.tagName === 'INPUT' || alvo.tagName === 'TEXTAREA' || alvo.tagName === 'SELECT');
      if (editavel) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        removerImagem(selecionado);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
