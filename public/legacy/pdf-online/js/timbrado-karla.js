(function () {
  'use strict';

  function obterBaseUrl() {
    if (window.KD_BASE) return window.KD_BASE;
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].getAttribute('src') || '';
      if (src.indexOf('timbrado-karla.js') !== -1) {
        return src.replace(/js\/timbrado-karla\.js(\?.*)?$/, '');
      }
    }
    var path = location.pathname;
    var slash = path.lastIndexOf('/');
    return slash >= 0 ? path.substring(0, slash + 1) : './';
  }

  var TIMBRADO_URL = obterBaseUrl() + 'assets/karla-dias/timbrado.png';
  var MARGEM_TOP = 52;
  var MARGEM_BOTTOM = 59;
  var MARGEM_LATERAL = 22;
  var LARGURA_A4 = 210;
  var ALTURA_A4 = 297;
  var LARGURA_UTIL = LARGURA_A4 - MARGEM_LATERAL * 2;
  var STORAGE_PSI = 'kd_dados_psicologa';
  var STORAGE_FONTE = 'kd_tamanho_fonte';

  var timbradoBase64 = null;
  var textoFormatado = '';
  var pdfBlobUrl = null;

  var MESES = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ];

  function $(id) {
    return document.getElementById(id);
  }

  function val(id) {
    var el = $(id);
    if (!el) return '';
    return String(el.value != null ? el.value : '').trim();
  }

  function lerCampo(id) {
    return val(id);
  }

  function campoVazio(id) {
    return !lerCampo(id);
  }

  function obterTipoDocumento() {
    var sel = document.querySelector('input[name="kdTipo"]:checked');
    if (sel && sel.value) return sel.value;
    if ($('painelRecibo') && !$('painelRecibo').classList.contains('kd-oculto')) return 'recibo';
    if ($('painelDeclaracao') && !$('painelDeclaracao').classList.contains('kd-oculto')) return 'declaracao';
    if ($('painelComprovante') && !$('painelComprovante').classList.contains('kd-oculto')) return 'comprovante';
    return 'timbrado';
  }

  function mostrarStatus(msg, tipo) {
    var el = $('kdStatus');
    if (!el) return;
    el.textContent = msg;
    el.className = 'kd-status kd-visivel kd-status-' + (tipo || 'info');
  }

  function esconderStatus() {
    var el = $('kdStatus');
    if (el) el.className = 'kd-status';
  }

  function formatarDataBr(iso) {
    if (!iso) return '';
    var p = iso.split('-');
    if (p.length !== 3) return iso;
    return p[2] + '/' + p[1] + '/' + p[0];
  }

  function formatarDataExtenso(iso) {
    if (!iso) return '';
    var p = iso.split('-');
    if (p.length !== 3) return iso;
    return parseInt(p[2], 10) + ' de ' + MESES[parseInt(p[1], 10) - 1] + ' de ' + p[0];
  }

  function formatarHora(hora) {
    if (!hora) return '';
    return hora.replace(':', 'h') + (hora.indexOf('h') === -1 ? '' : '').replace(/h(\d)$/, 'h0$1');
  }

  function formatarHoraSimples(hora) {
    if (!hora) return '';
    return hora.substring(0, 5);
  }

  function formatarHoraTexto(hora) {
    if (!hora) return '';
    var p = hora.substring(0, 5).split(':');
    return p[0] + 'h' + p[1];
  }

  function mascaraMoedaBr(valor) {
    var digits = String(valor || '').replace(/\D/g, '');
    if (!digits) digits = '0';
    while (digits.length < 3) digits = '0' + digits;
    var cents = digits.slice(-2);
    var ints = digits.slice(0, -2).replace(/^0+/, '') || '0';
    ints = parseInt(ints, 10).toLocaleString('pt-BR');
    return 'R$ ' + ints + ',' + cents;
  }

  function extrairValorMoeda(texto) {
    var digits = String(texto || '').replace(/\D/g, '');
    if (!digits || parseInt(digits, 10) === 0) return '';
    while (digits.length < 3) digits = '0' + digits;
    var cents = digits.slice(-2);
    var ints = digits.slice(0, -2).replace(/^0+/, '') || '0';
    return ints + ',' + cents;
  }

  function valorMoedaVazio(texto) {
    var digits = String(texto || '').replace(/\D/g, '');
    return !digits || parseInt(digits, 10) === 0;
  }

  function lerValorMoeda(id) {
    return extrairValorMoeda(lerCampo(id));
  }

  function obterTamanhoFonte() {
    var el = $('kdTamanhoFonte');
    var v = el ? parseInt(el.value, 10) : 12;
    if (isNaN(v) || v < 9) v = 9;
    if (v > 16) v = 16;
    return v;
  }

  function obterAlturaLinha(tamanho) {
    return (tamanho || obterTamanhoFonte()) * 0.48;
  }

  function rotuloTamanhoFonte(v) {
    var mapa = {
      9: 'Pequeno', 10: 'Compacto', 11: 'Normal', 12: 'Médio',
      13: 'Grande', 14: 'Muito grande', 15: 'Extra grande', 16: 'Máximo'
    };
    return v + ' pt — ' + (mapa[v] || 'Personalizado');
  }

  function calcularFontePreviewPx() {
    var papel = $('kdPreviewPapel');
    var pt = obterTamanhoFonte();
    if (!papel || !papel.clientWidth) return Math.round(pt * 1.333) + 'px';
    var contentPx = papel.clientWidth * 0.79;
    var fontPx = (pt * 0.352778 * contentPx) / 166;
    return Math.max(9, Math.round(fontPx * 10) / 10) + 'px';
  }

  function aplicarTamanhoPreview() {
    var alvo = $('kdPreviewConteudo');
    var label = $('kdTamanhoFonteLabel');
    var fontPx = calcularFontePreviewPx();
    if (alvo) {
      alvo.style.fontSize = fontPx;
      alvo.style.lineHeight = String(Math.max(1.35, obterTamanhoFonte() * 0.045));
    }
    if (label) label.textContent = rotuloTamanhoFonte(obterTamanhoFonte());
    try { localStorage.setItem(STORAGE_FONTE, String(obterTamanhoFonte())); } catch (e) { /* ignore */ }
  }

  function carregarTamanhoFonte() {
    try {
      var salvo = localStorage.getItem(STORAGE_FONTE);
      if (salvo && $('kdTamanhoFonte')) $('kdTamanhoFonte').value = salvo;
    } catch (e) { /* ignore */ }
    aplicarTamanhoPreview();
  }

  function nomeProfissional(psi) {
    return psi.nome + (psi.profissao ? ', ' + psi.profissao : '');
  }

  function obterDadosPsicologa() {
    return {
      nome: val('psiNome') || 'Karla Dias',
      crp: val('psiCrp'),
      profissao: val('psiProfissao') || 'Psicóloga · Neuropsicóloga',
      cpf: val('psiCpf'),
      endereco: val('psiEndereco'),
      cidade: val('psiCidade'),
      uf: val('psiUf'),
      telefone: val('psiTelefone'),
      email: val('psiEmail')
    };
  }

  function salvarDadosPsicologa() {
    try {
      localStorage.setItem(STORAGE_PSI, JSON.stringify(obterDadosPsicologa()));
    } catch (e) { /* ignore */ }
  }

  function carregarDadosPsicologa() {
    try {
      var raw = localStorage.getItem(STORAGE_PSI);
      if (!raw) return;
      var d = JSON.parse(raw);
      if (d.nome && $('psiNome')) $('psiNome').value = d.nome;
      if (d.crp && $('psiCrp')) $('psiCrp').value = d.crp;
      if (d.profissao && $('psiProfissao')) $('psiProfissao').value = d.profissao;
      if (d.cpf && $('psiCpf')) $('psiCpf').value = d.cpf;
      if (d.endereco && $('psiEndereco')) $('psiEndereco').value = d.endereco;
      if (d.cidade && $('psiCidade')) $('psiCidade').value = d.cidade;
      if (d.uf && $('psiUf')) $('psiUf').value = d.uf;
      if (d.telefone && $('psiTelefone')) $('psiTelefone').value = d.telefone;
      if (d.email && $('psiEmail')) $('psiEmail').value = d.email;
    } catch (e) { /* ignore */ }
  }

  function linhaAssinatura(psi) {
    var linhas = ['\n\n\n_______________________________', psi.nome, psi.profissao];
    if (psi.crp) linhas.push('CRP ' + psi.crp);
    if (psi.cpf) linhas.push('CPF/CNPJ: ' + psi.cpf);
    if (psi.endereco) linhas.push(psi.endereco);
    var contato = [];
    if (psi.telefone) contato.push(psi.telefone);
    if (psi.email) contato.push(psi.email);
    if (contato.length) linhas.push(contato.join(' · '));
    return linhas.join('\n');
  }

  function localData(psi, iso) {
    var cidade = psi.cidade || '';
    var uf = psi.uf ? ' - ' + psi.uf : '';
    var ext = formatarDataExtenso(iso || new Date().toISOString().slice(0, 10));
    if (cidade) return cidade + uf + ', ' + ext + '.';
    return ext + '.';
  }

  function montarTextoRecibo() {
    var psi = obterDadosPsicologa();
    var paciente = lerCampo('recPaciente');
    var valor = lerValorMoeda('recValor');
    var cpf = lerCampo('recCpf');
    var forma = lerCampo('recForma') || 'Pix';
    var dataIso = lerCampo('recData') || new Date().toISOString().slice(0, 10);

    if (!paciente || !valor) return '';

    var texto =
      'RECIBO DE PAGAMENTO — SESSÃO DE PSICOLOGIA / NEUROPSICOLOGIA\n\n' +
      'Recebi de ' + paciente +
      (cpf ? ', CPF ' + cpf : '') +
      ', a quantia de R$ ' + valor +
      ', referente ao pagamento da sessão de psicologia e neuropsicologia realizada em ' +
      formatarDataBr(dataIso) + ', prestada por ' + nomeProfissional(psi) + '.\n\n' +
      'Forma de pagamento: ' + forma + '.\n' +
      'Data do pagamento: ' + formatarDataBr(dataIso) + '.\n\n' +
      'Para clareza, declaro quitado o valor acima, recebido em favor de ' + psi.nome + '.\n\n' +
      localData(psi, dataIso) +
      linhaAssinatura(psi);

    return texto;
  }

  function montarTextoDeclaracao() {
    var psi = obterDadosPsicologa();
    var paciente = val('decPaciente');
    var responsavel = val('decResponsavel');
    var dataIso = val('decData');
    var hi = val('decHoraIni');
    var hf = val('decHoraFim');
    var finalidade = val('decFinalidade');

    if (!paciente || !dataIso || !hi || !hf) return '';

    var corpo =
      'Declaro, para os devidos fins, que o(a) paciente ' + paciente;
    if (responsavel) corpo += ', representado(a) por ' + responsavel;
    corpo +=
      ', esteve sob consulta de psicologia e neuropsicologia no dia ' + formatarDataBr(dataIso) +
      ', no horário das ' + formatarHoraTexto(hi) + ' às ' + formatarHoraTexto(hf) +
      ', conduzida por ' + nomeProfissional(psi) + '.';

    if (finalidade) corpo += '\n\n' + finalidade;

    corpo += '\n\nPara apresentar aos interessados, firmo a presente declaração.';

    return (
      'DECLARAÇÃO DE PRESENÇA — CONSULTA DE PSICOLOGIA / NEUROPSICOLOGIA\n\n' +
      corpo + '\n\n' +
      localData(psi, dataIso) +
      linhaAssinatura(psi)
    );
  }

  function montarTextoComprovante() {
    var psi = obterDadosPsicologa();
    var numero = val('compNumero') || String(Date.now()).slice(-8);
    var paciente = val('compPaciente');
    var dataIso = val('compData') || new Date().toISOString().slice(0, 10);
    var valor = lerValorMoeda('compValor');
    var obs = val('compObs');
    var servico = val('compServico') ||
      'Sessão de psicologia e neuropsicologia aplicada ao paciente, conduzida por ' + nomeProfissional(psi) + '.';

    if (!paciente) return '';

    var texto =
      'COMPROVANTE DE SESSÃO — PSICOLOGIA / NEUROPSICOLOGIA\n\n' +
      'Comprovante nº: ' + numero + '\n' +
      'Paciente: ' + paciente + '\n' +
      'Data da sessão: ' + formatarDataBr(dataIso) + '\n' +
      'Profissional responsável: ' + nomeProfissional(psi) + '\n' +
      'Serviço prestado: ' + servico + '\n';

    if (valor) texto += 'Valor da sessão: R$ ' + valor + '\n';
    if (obs) texto += '\nObservações: ' + obs + '\n';

    texto +=
      '\nCertifico que a sessão de psicologia / neuropsicologia descrita acima foi realizada com o(a) paciente identificado(a).\n\n' +
      localData(psi, dataIso) +
      linhaAssinatura(psi);

    if ($('compNumero') && !$('compNumero').value.trim()) {
      $('compNumero').value = numero;
    }

    return texto;
  }

  function montarTextoPorTipo() {
    var tipo = obterTipoDocumento();
    if (tipo === 'recibo') return montarTextoRecibo();
    if (tipo === 'declaracao') return montarTextoDeclaracao();
    if (tipo === 'comprovante') return montarTextoComprovante();
    return montarTextoFinal(obterTextoTimbrado());
  }

  function obterChaveOpenAI() {
    var campo = $('kdApiKey');
    if (campo && campo.value.trim()) return campo.value.trim();
    return localStorage.getItem('openai_api_key') || '';
  }

  function formatarTextoLocal(texto) {
    if (!texto || !texto.trim()) return '';
    var limpo = texto.replace(/\r\n/g, '\n').replace(/\t/g, ' ').replace(/[ \u00A0]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
    return limpo.split(/\n\n+/).map(function (p) {
      p = p.replace(/\n/g, ' ').trim();
      if (!p) return '';
      return p.charAt(0).toUpperCase() + p.slice(1);
    }).filter(Boolean).join('\n\n');
  }

  async function formatarTextoComIA(texto) {
    var chave = obterChaveOpenAI();
    if (!chave) return formatarTextoLocal(texto);
    var titulo = val('kdTitulo');
    var prompt =
      'Formate o texto para documento psicológico profissional em português do Brasil. ' +
      'Corrija gramática, organize parágrafos, não invente conteúdo. Retorne só o texto.\n' +
      (titulo ? 'Título: ' + titulo + '\n\n' : '') + texto;
    try {
      var resposta = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + chave },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'Você formata textos para documentos psicológicos.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.4,
          max_tokens: 3000
        })
      });
      if (!resposta.ok) throw new Error('API indisponível');
      var json = await resposta.json();
      var resultado = json.choices && json.choices[0] && json.choices[0].message && json.choices[0].message.content;
      return (resultado && resultado.trim()) || formatarTextoLocal(texto);
    } catch (e) {
      return formatarTextoLocal(texto);
    }
  }

  function obterTextoTimbrado() {
    var alvo = $('kdPreviewConteudo');
    var textarea = $('kdTexto');
    if (obterTipoDocumento() === 'timbrado' && alvo && alvo.classList.contains('kd-editavel')) {
      var t = (alvo.innerText || '').replace(/\u00A0/g, ' ').trim();
      if (textarea) textarea.value = t;
      return t;
    }
    return val('kdTexto');
  }

  function configurarEdicaoPreview(tipo) {
    var alvo = $('kdPreviewConteudo');
    var dica = $('kdPreviewDica');
    if (!alvo) return;
    var timbrado = tipo === 'timbrado';
    alvo.contentEditable = timbrado ? 'true' : 'false';
    alvo.classList.toggle('kd-editavel', timbrado);
    alvo.classList.toggle('kd-somente-leitura', !timbrado);
    if (dica) {
      dica.textContent = timbrado
        ? 'Toque dentro da folha e digite — o tamanho é igual ao PDF.'
        : 'Pré-visualização com o tamanho de fonte escolhido acima.';
    }
  }

  function sincronizarTextareaParaPreview(forcar) {
    var alvo = $('kdPreviewConteudo');
    if (!alvo || obterTipoDocumento() !== 'timbrado') return;
    if (!forcar && document.activeElement === alvo) return;
    var t = val('kdTexto');
    if (!t) {
      if (!alvo.innerText.trim()) alvo.innerHTML = '';
      return;
    }
    alvo.textContent = t;
  }

  function montarTextoFinal(texto) {
    var titulo = val('kdTitulo');
    var corpo = (texto || '').trim();
    if (!corpo) return '';
    if (titulo && corpo.indexOf(titulo) !== 0) return titulo + '\n\n' + corpo;
    return corpo;
  }

  function atualizarPreview(texto, forcar) {
    var alvo = $('kdPreviewConteudo');
    if (!alvo) return;
    aplicarTamanhoPreview();
    var tipo = obterTipoDocumento();

    if (tipo === 'timbrado' && alvo.classList.contains('kd-editavel')) {
      if (!forcar && document.activeElement === alvo) return;
      if (texto && texto.trim()) {
        alvo.textContent = texto;
      } else if (forcar || !alvo.innerText.trim()) {
        alvo.innerHTML = '';
      }
      return;
    }

    if (!texto || !texto.trim()) {
      alvo.textContent = '';
      return;
    }
    alvo.textContent = texto;
  }

  function atualizarPreviewAutomatico() {
    salvarDadosPsicologa();
    var tipo = obterTipoDocumento();
    if (tipo === 'timbrado') {
      sincronizarTextareaParaPreview(false);
      return;
    }
    atualizarPreview(montarTextoPorTipo(), true);
  }

  function trocarTipoDocumento() {
    var tipo = obterTipoDocumento();
    var paineis = ['painelTimbrado', 'painelRecibo', 'painelDeclaracao', 'painelComprovante'];
    var mapa = { timbrado: 0, recibo: 1, declaracao: 2, comprovante: 3 };

    paineis.forEach(function (id, i) {
      var el = $(id);
      if (el) el.classList.toggle('kd-oculto', i !== mapa[tipo]);
    });

    document.querySelectorAll('.kd-tipo-item').forEach(function (item) {
      var input = item.querySelector('input');
      item.classList.toggle('kd-tipo-ativo', input && input.value === tipo);
    });

    var tituloSec = $('kdTituloSecao');
    var descSec = $('kdDescSecao');
    var btnFormatar = $('kdBtnFormatar');

    if (tipo === 'timbrado') {
      if (tituloSec) tituloSec.innerHTML = '<i class="fa fa-pen-to-square"></i> Opções do documento';
      if (descSec) descSec.textContent = 'Digite na folha acima. Aqui: título, upload ou formatação com IA.';
      if (btnFormatar) btnFormatar.style.display = '';
    } else {
      if (tituloSec) tituloSec.innerHTML = '<i class="fa fa-file-lines"></i> Dados do documento';
      if (descSec) descSec.textContent = 'Preencha os campos abaixo. O texto será montado automaticamente.';
      if (btnFormatar) btnFormatar.style.display = 'none';
    }

    configurarEdicaoPreview(tipo);
    definirDatasPadrao();
    atualizarPreviewAutomatico();
    liberarPdfAnterior();
    if ($('kdBtnBaixar')) $('kdBtnBaixar').disabled = true;
    if ($('kdBtnImprimir')) $('kdBtnImprimir').disabled = true;
  }

  function definirDatasPadrao() {
    var hoje = new Date().toISOString().slice(0, 10);
    ['recData', 'decData', 'compData'].forEach(function (id) {
      var el = $(id);
      if (el && !lerCampo(id)) el.value = hoje;
    });
    var valor = $('recValor');
    if (valor && campoVazio('recValor')) valor.value = 'R$ 0,00';
    var compValor = $('compValor');
    if (compValor && campoVazio('compValor')) compValor.value = 'R$ 0,00';
    var forma = $('recForma');
    if (forma && !lerCampo('recForma')) forma.value = 'Pix';
    var hi = $('decHoraIni');
    var hf = $('decHoraFim');
    if (hi && !lerCampo('decHoraIni')) hi.value = '14:00';
    if (hf && !lerCampo('decHoraFim')) hf.value = '15:00';
  }

  function prepararCamposAntesGerar(tipo) {
    definirDatasPadrao();
    if (tipo === 'recibo' && $('recData') && !lerCampo('recData')) {
      $('recData').value = new Date().toISOString().slice(0, 10);
    }
    if (tipo === 'declaracao' && $('decData') && !lerCampo('decData')) {
      $('decData').value = new Date().toISOString().slice(0, 10);
    }
  }

  async function carregarTimbrado() {
    if (timbradoBase64) return timbradoBase64;
    var resp = await fetch(TIMBRADO_URL);
    if (!resp.ok) throw new Error('Não foi possível carregar o timbrado.');
    var blob = await resp.blob();
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { timbradoBase64 = reader.result; resolve(timbradoBase64); };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  function aplicarTimbrado(doc) {
    doc.addImage(timbradoBase64, 'PNG', 0, 0, LARGURA_A4, ALTURA_A4);
  }

  function aplicarEstiloTexto(doc, negrito) {
    var base = obterTamanhoFonte();
    doc.setFont('times', negrito ? 'bold' : 'normal');
    doc.setFontSize(negrito ? base + 2 : base);
    doc.setTextColor(74, 74, 74);
  }

  function novaPaginaPdf(doc) {
    doc.addPage();
    aplicarTimbrado(doc);
    aplicarEstiloTexto(doc, false);
    return MARGEM_TOP;
  }

  function linhaCabeNaPagina(y, alturaLinha) {
    return y + alturaLinha <= ALTURA_A4 - MARGEM_BOTTOM;
  }

  function escreverTextoPdf(doc, texto) {
    var y = MARGEM_TOP;
    var espacoEntreParagrafos = 4;
    var alturaLinha = obterAlturaLinha();
    var alturaTitulo = obterAlturaLinha(obterTamanhoFonte() + 2);
    var paragrafos = texto.split(/\n\n+/);

    paragrafos.forEach(function (paragrafo, idxPar) {
      paragrafo = paragrafo.trim();
      if (!paragrafo) return;

      var ehTitulo = idxPar === 0 && paragrafo.length < 80 && paragrafo === paragrafo.toUpperCase();
      if (ehTitulo) aplicarEstiloTexto(doc, true);
      else aplicarEstiloTexto(doc, false);

      var linhas = doc.splitTextToSize(paragrafo, LARGURA_UTIL);
      var passo = ehTitulo ? alturaTitulo : alturaLinha;

      linhas.forEach(function (linha) {
        if (!linhaCabeNaPagina(y, passo)) y = novaPaginaPdf(doc);
        doc.text(linha, MARGEM_LATERAL, y);
        y += passo;
      });

      aplicarEstiloTexto(doc, false);

      if (idxPar < paragrafos.length - 1) {
        y += espacoEntreParagrafos;
        if (!linhaCabeNaPagina(y, alturaLinha)) y = novaPaginaPdf(doc);
      }
    });

    return doc;
  }

  function gerarPdf(texto) {
    if (!window.jspdf || !window.jspdf.jsPDF) throw new Error('Biblioteca PDF não carregada.');
    var doc = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4', compress: true });
    aplicarTimbrado(doc);
    aplicarEstiloTexto(doc, false);
    escreverTextoPdf(doc, texto);
    if (typeof window.kdRenderImagensPdf === 'function') {
      try {
        doc.setPage(1);
        window.kdRenderImagensPdf(doc, LARGURA_A4, ALTURA_A4);
      } catch (e) { /* imagens são opcionais — ignora falhas */ }
    }
    return doc;
  }

  function liberarPdfAnterior() {
    if (pdfBlobUrl) { URL.revokeObjectURL(pdfBlobUrl); pdfBlobUrl = null; }
  }

  var ROTULOS_CAMPOS = {
    recPaciente: 'Nome do paciente',
    recValor: 'Valor pago pela sessão',
    recData: 'Data do pagamento',
    decPaciente: 'Nome do paciente',
    decData: 'Data da consulta',
    decHoraIni: 'Horário de início',
    decHoraFim: 'Horário de término',
    compPaciente: 'Nome do paciente',
    kdPreviewConteudo: 'Texto na folha'
  };

  var OBRIGATORIOS_POR_TIPO = {
    recibo: ['recPaciente', 'recValor'],
    declaracao: ['decPaciente', 'decData', 'decHoraIni', 'decHoraFim'],
    comprovante: ['compPaciente']
  };

  function limparErrosValidacao() {
    document.querySelectorAll('.kd-campo-invalido').forEach(function (el) {
      el.classList.remove('kd-campo-invalido');
    });
    document.querySelectorAll('.kd-asterisco-erro').forEach(function (el) {
      el.remove();
    });
    var preview = $('kdPreviewConteudo');
    if (preview) preview.classList.remove('kd-preview-vazio-erro');
  }

  function marcarCampoInvalido(id) {
    var input = $(id);
    if (!input) return;
    var campo = input.closest('.kd-campo');
    if (campo) {
      campo.classList.add('kd-campo-invalido');
      var label = campo.querySelector('label');
      if (label && !label.querySelector('.kd-asterisco-erro')) {
        var ast = document.createElement('span');
        ast.className = 'kd-asterisco-erro';
        ast.textContent = ' *';
        ast.setAttribute('aria-hidden', 'true');
        label.appendChild(ast);
      }
    }
  }

  function validarDocumento(tipo) {
    limparErrosValidacao();
    var faltando = [];

    if (tipo === 'timbrado') {
      var texto = obterTextoTimbrado();
      if (!texto || !texto.trim()) {
        faltando.push({ id: 'kdPreviewConteudo', nome: ROTULOS_CAMPOS.kdPreviewConteudo });
        var preview = $('kdPreviewConteudo');
        if (preview) preview.classList.add('kd-preview-vazio-erro');
      }
      return faltando;
    }

    (OBRIGATORIOS_POR_TIPO[tipo] || []).forEach(function (id) {
      var vazio = (id === 'recValor') ? valorMoedaVazio(lerCampo(id)) : campoVazio(id);
      if (vazio) {
        marcarCampoInvalido(id);
        faltando.push({ id: id, nome: ROTULOS_CAMPOS[id] || id });
      }
    });
    return faltando;
  }

  function rolarParaCampo(id) {
    var el = $(id);
    if (!el) return;
    var alvo = el.closest('.kd-campo') || el;
    alvo.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (typeof el.focus === 'function') {
      try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); }
    }
  }

  function limparErroCampo(id) {
    var input = $(id);
    if (!input) return;
    var campo = input.closest('.kd-campo');
    if (campo) {
      campo.classList.remove('kd-campo-invalido');
      var label = campo.querySelector('label');
      var ast = label && label.querySelector('.kd-asterisco-erro');
      if (ast) ast.remove();
    }
  }

  function configurarMascarasMoeda() {
    ['recValor', 'compValor'].forEach(function (id) {
      var el = $(id);
      if (!el) return;
      if (campoVazio(id) || lerCampo(id).indexOf('R$') !== 0) {
        el.value = mascaraMoedaBr(el.value || '0');
      }
      el.addEventListener('input', function () {
        el.value = mascaraMoedaBr(el.value);
        try { el.setSelectionRange(el.value.length, el.value.length); } catch (e) { /* ignore */ }
        limparErroCampo(id);
      });
      el.addEventListener('focus', function () {
        setTimeout(function () {
          try { el.setSelectionRange(el.value.length, el.value.length); } catch (e) { /* ignore */ }
        }, 0);
      });
      el.addEventListener('blur', function () {
        if (valorMoedaVazio(el.value)) el.value = 'R$ 0,00';
        else el.value = mascaraMoedaBr(el.value);
      });
    });
  }

  function configurarValidacaoAoDigitar() {
    ['recPaciente', 'recValor', 'recData', 'decPaciente', 'decData', 'decHoraIni', 'decHoraFim', 'compPaciente'].forEach(function (id) {
      var el = $(id);
      if (!el) return;
      el.addEventListener('input', function () { limparErroCampo(id); });
      el.addEventListener('change', function () { limparErroCampo(id); });
    });
    var preview = $('kdPreviewConteudo');
    if (preview) {
      preview.addEventListener('input', function () {
        preview.classList.remove('kd-preview-vazio-erro');
      });
    }
  }

  async function processarFormatacao() {
    if (obterTipoDocumento() !== 'timbrado') return;
    var bruto = obterTextoTimbrado();
    if (!bruto) { mostrarStatus('Digite na folha antes de formatar.', 'erro'); return; }
    var btn = $('kdBtnFormatar');
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="kd-loading"></span> Formatando…'; }
    mostrarStatus('Processando texto com IA…', 'info');
    try {
      var formatado = await formatarTextoComIA(bruto);
      textoFormatado = montarTextoFinal(formatado);
      if ($('kdTexto')) $('kdTexto').value = textoFormatado;
      atualizarPreview(textoFormatado, true);
      mostrarStatus('Texto formatado. Revise e gere o PDF.', 'ok');
    } catch (e) {
      mostrarStatus('Erro ao formatar: ' + (e.message || e), 'erro');
    } finally {
      if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa fa-wand-magic-sparkles"></i> Formatar com IA'; }
    }
  }

  async function processarPdf() {
    var tipo = obterTipoDocumento();
    prepararCamposAntesGerar(tipo);
    var faltando = validarDocumento(tipo);

    if (faltando.length) {
      var nomes = faltando.map(function (f) { return f.nome; }).join(', ');
      mostrarStatus('Falta preencher: ' + nomes + '.', 'erro');
      rolarParaCampo(faltando[0].id);
      return;
    }

    var texto = tipo === 'timbrado'
      ? montarTextoFinal(obterTextoTimbrado() || textoFormatado)
      : montarTextoPorTipo();

    if (!texto || !String(texto).trim()) {
      faltando = validarDocumento(tipo);
      if (faltando.length) {
        mostrarStatus('Falta preencher: ' + faltando.map(function (f) { return f.nome; }).join(', ') + '.', 'erro');
        rolarParaCampo(faltando[0].id);
      } else {
        mostrarStatus('Não foi possível montar o documento. Recarregue a página e tente novamente.', 'erro');
      }
      return;
    }

    textoFormatado = texto;
    atualizarPreview(texto, true);

    var btn = $('kdBtnPdf');
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="kd-loading"></span> Gerando PDF…'; }
    mostrarStatus('Montando documento no timbrado…', 'info');

    try {
      await carregarTimbrado();
      var doc = gerarPdf(textoFormatado);
      liberarPdfAnterior();
      pdfBlobUrl = doc.output('bloburl');
      if ($('kdBtnBaixar')) $('kdBtnBaixar').disabled = false;
      if ($('kdBtnImprimir')) $('kdBtnImprimir').disabled = false;
      var n = doc.internal.getNumberOfPages();
      mostrarStatus('PDF pronto com ' + n + (n === 1 ? ' página' : ' páginas') + '!', 'ok');
    } catch (e) {
      mostrarStatus('Erro ao gerar PDF: ' + (e.message || e), 'erro');
    } finally {
      if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa fa-file-pdf"></i> Gerar PDF'; }
    }
  }

  function baixarPdf() {
    if (!pdfBlobUrl) { mostrarStatus('Gere o PDF primeiro.', 'erro'); return; }
    var tipo = obterTipoDocumento();
    var nomes = { timbrado: val('kdTitulo') || 'documento', recibo: 'recibo', declaracao: 'declaracao-presenca', comprovante: 'comprovante' };
    var nome = (nomes[tipo] || 'documento').replace(/[^\w\s\-àáâãéêíóôõúüçÀÁÂÃÉÊÍÓÔÕÚÜÇ]/gi, '').replace(/\s+/g, '-').toLowerCase();
    nome += '-' + new Date().toISOString().slice(0, 10) + '.pdf';
    var a = document.createElement('a');
    a.href = pdfBlobUrl;
    a.download = nome;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function imprimirPdf() {
    if (!pdfBlobUrl) { mostrarStatus('Gere o PDF primeiro.', 'erro'); return; }
    var iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = pdfBlobUrl;
    document.body.appendChild(iframe);
    iframe.onload = function () {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(function () { document.body.removeChild(iframe); }, 1000);
    };
  }

  function lerArquivoTxt(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(reader.result); };
      reader.onerror = reject;
      reader.readAsText(file, 'UTF-8');
    });
  }

  async function lerArquivoDocx(file) {
    if (!window.mammoth) throw new Error('Leitor DOCX não disponível.');
    var result = await window.mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return result.value || '';
  }

  async function processarArquivo(file) {
    if (!file) return;
    var ext = file.name.toLowerCase().split('.').pop();
    if (ext !== 'txt' && ext !== 'docx' && ext !== 'doc') {
      mostrarStatus('Formato não suportado. Use .txt ou .docx', 'erro');
      return;
    }
    mostrarStatus('Lendo arquivo…', 'info');
    try {
      var conteudo = ext === 'txt' ? await lerArquivoTxt(file) : await lerArquivoDocx(file);
      if ($('kdTexto')) $('kdTexto').value = conteudo;
      if ($('kdArquivoNome')) $('kdArquivoNome').textContent = 'Arquivo: ' + file.name;
      esconderStatus();
      atualizarPreview(conteudo, true);
    } catch (e) {
      mostrarStatus('Erro ao ler arquivo: ' + (e.message || e), 'erro');
    }
  }

  function configurarUpload() {
    var zona = $('kdUpload');
    var input = $('kdArquivo');
    if (!zona || !input) return;
    zona.addEventListener('click', function () { input.click(); });
    input.addEventListener('change', function () { if (input.files && input.files[0]) processarArquivo(input.files[0]); });
    ['dragenter', 'dragover'].forEach(function (ev) {
      zona.addEventListener(ev, function (e) { e.preventDefault(); zona.classList.add('kd-drag'); });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      zona.addEventListener(ev, function (e) { e.preventDefault(); zona.classList.remove('kd-drag'); });
    });
    zona.addEventListener('drop', function (e) {
      var files = e.dataTransfer && e.dataTransfer.files;
      if (files && files[0]) processarArquivo(files[0]);
    });
  }

  function configurarApiKey() {
    var campo = $('kdApiKey');
    if (!campo) return;
    var salva = sessionStorage.getItem('kd_openai_key') || localStorage.getItem('openai_api_key') || '';
    if (salva) campo.value = salva;
    campo.addEventListener('change', function () { sessionStorage.setItem('kd_openai_key', campo.value.trim()); });
  }

  function configurarListeners() {
    document.querySelectorAll('input[name="kdTipo"]').forEach(function (r) {
      r.addEventListener('change', trocarTipoDocumento);
    });

    document.querySelectorAll('.kd-tipo-item').forEach(function (item) {
      item.addEventListener('click', function () {
        var input = item.querySelector('input[name="kdTipo"]');
        if (!input) return;
        input.checked = true;
        trocarTipoDocumento();
      });
    });

    var idsPsi = ['psiNome', 'psiCrp', 'psiProfissao', 'psiCpf', 'psiEndereco', 'psiCidade', 'psiUf', 'psiTelefone', 'psiEmail'];
    idsPsi.forEach(function (id) {
      var el = $(id);
      if (el) el.addEventListener('input', atualizarPreviewAutomatico);
    });

    var idsModelo = [
      'recValor', 'recData', 'recPaciente', 'recCpf', 'recForma',
      'decPaciente', 'decResponsavel', 'decData', 'decHoraIni', 'decHoraFim', 'decFinalidade',
      'compNumero', 'compData', 'compPaciente', 'compServico', 'compValor', 'compObs'
    ];
    idsModelo.forEach(function (id) {
      var el = $(id);
      if (el) el.addEventListener('input', atualizarPreviewAutomatico);
      if (el && el.tagName === 'SELECT') el.addEventListener('change', atualizarPreviewAutomatico);
    });

    var textarea = $('kdTexto');
    if (textarea) {
      var timer;
      textarea.addEventListener('input', function () {
        clearTimeout(timer);
        timer = setTimeout(function () { sincronizarTextareaParaPreview(true); }, 350);
      });
    }

    var preview = $('kdPreviewConteudo');
    if (preview) {
      preview.addEventListener('input', function () {
        if ($('kdTexto')) $('kdTexto').value = preview.innerText.replace(/\u00A0/g, ' ').trim();
        liberarPdfAnterior();
        if ($('kdBtnBaixar')) $('kdBtnBaixar').disabled = true;
        if ($('kdBtnImprimir')) $('kdBtnImprimir').disabled = true;
      });
    }

    var fonte = $('kdTamanhoFonte');
    if (fonte) {
      fonte.addEventListener('input', function () {
        aplicarTamanhoPreview();
      });
    }

    var papel = $('kdPreviewPapel');
    if (papel && window.ResizeObserver) {
      new ResizeObserver(function () { aplicarTamanhoPreview(); }).observe(papel);
    }
  }

  function iniciarTimbradoKarla() {
    carregarDadosPsicologa();
    carregarTamanhoFonte();
    configurarUpload();
    configurarApiKey();
    configurarListeners();
    configurarMascarasMoeda();
    configurarValidacaoAoDigitar();
    definirDatasPadrao();
    trocarTipoDocumento();

    if ($('kdBtnFormatar')) $('kdBtnFormatar').addEventListener('click', processarFormatacao);
    if ($('kdBtnPdf')) $('kdBtnPdf').addEventListener('click', processarPdf);
    if ($('kdBtnBaixar')) $('kdBtnBaixar').addEventListener('click', baixarPdf);
    if ($('kdBtnImprimir')) $('kdBtnImprimir').addEventListener('click', imprimirPdf);
  }

  var KD_SENHA_ACESSO = 'Freninha87';
  var STORAGE_ACESSO = 'kd_acesso_liberado';
  var KD_SENHA_ANIM_MS = 500;

  function normalizarSenhaDigitada(valor) {
    return String(valor || '').trim();
  }

  function senhaEstaCorreta(valor) {
    return normalizarSenhaDigitada(valor).toLowerCase() === 'freninha87';
  }

  function acessoJaLiberado() {
    try {
      return sessionStorage.getItem(STORAGE_ACESSO) === '1';
    } catch (e) {
      return false;
    }
  }

  function prepararCapaSenha() {
    /* capa escura — sem timbrado */
  }

  function alternarRecuperacaoSenha(mostrar) {
    var box = $('kdSenhaRecuperacao');
    var btn = $('kdSenhaEsqueci');
    if (!box) return;
    if (mostrar) {
      box.classList.remove('kd-oculto');
      box.classList.add('kd-visivel');
      box.setAttribute('aria-hidden', 'false');
      if (btn) btn.textContent = 'Ocultar recuperação';
    } else {
      box.classList.add('kd-oculto');
      box.classList.remove('kd-visivel');
      box.setAttribute('aria-hidden', 'true');
      if (btn) btn.textContent = 'Esqueci a senha';
    }
  }

  function travarPaginaVisual() {
    document.body.classList.add('kd-bloqueado');
    document.body.classList.remove('kd-liberado');
    document.documentElement.classList.add('kd-travado');
    document.documentElement.classList.remove('kd-liberado');
    var page = $('kdPage') || document.querySelector('.kd-page');
    var overlay = $('kdSenhaOverlay');
    if (page) page.style.display = 'none';
    if (overlay) {
      overlay.classList.remove('kd-senha-oculto', 'kd-senha-saindo');
      overlay.style.display = 'flex';
    }
  }

  function finalizarLiberacaoAcesso() {
    document.body.classList.remove('kd-bloqueado');
    document.body.classList.add('kd-liberado');
    document.documentElement.classList.remove('kd-travado');
    document.documentElement.classList.add('kd-liberado');
    var overlay = $('kdSenhaOverlay');
    if (overlay) {
      overlay.classList.remove('kd-senha-saindo');
      overlay.classList.add('kd-senha-oculto');
      overlay.style.display = 'none';
    }
    var page = $('kdPage') || document.querySelector('.kd-page');
    if (page) page.style.display = 'block';
  }

  function liberarTelaAcesso(comAnimacao, callback) {
    var overlay = $('kdSenhaOverlay');

    if (!comAnimacao) {
      finalizarLiberacaoAcesso();
      if (callback) callback();
      return;
    }

    if (overlay) overlay.classList.add('kd-senha-saindo');

    setTimeout(function () {
      finalizarLiberacaoAcesso();
      if (callback) callback();
    }, KD_SENHA_ANIM_MS);
  }

  function tentarLiberarAcesso(callback) {
    var input = $('kdSenhaInput');
    var erro = $('kdSenhaErro');
    if (!input) {
      liberarTelaAcesso(false, callback);
      return true;
    }

    if (!senhaEstaCorreta(input.value)) {
      if (erro) erro.textContent = 'Senha incorreta.';
      input.classList.add('kd-senha-input-erro');
      if ($('kdSenhaEsqueci')) $('kdSenhaEsqueci').classList.add('kd-visivel');
      input.focus();
      return false;
    }

    try { sessionStorage.setItem(STORAGE_ACESSO, '1'); } catch (e) { /* ignore */ }
    if (erro) erro.textContent = '';
    input.classList.remove('kd-senha-input-erro');
    input.disabled = true;
    if ($('kdSenhaBtn')) $('kdSenhaBtn').disabled = true;
    liberarTelaAcesso(true, callback);
    return true;
  }

  function configurarSenhaAcesso(callback) {
    travarPaginaVisual();
    var input = $('kdSenhaInput');
    var btn = $('kdSenhaBtn');
    var esqueci = $('kdSenhaEsqueci');
    if (!input || !btn) {
      liberarTelaAcesso(false, callback);
      return;
    }

    btn.addEventListener('click', function () {
      tentarLiberarAcesso(callback);
    });

    if (esqueci) {
      esqueci.addEventListener('click', function () {
        var box = $('kdSenhaRecuperacao');
        var aberto = box && box.classList.contains('kd-visivel');
        alternarRecuperacaoSenha(!aberto);
        if (!aberto && esqueci) esqueci.classList.add('kd-visivel');
      });
    }

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        tentarLiberarAcesso(callback);
      }
    });

    input.addEventListener('input', function () {
      input.classList.remove('kd-senha-input-erro');
      var erro = $('kdSenhaErro');
      if (erro) erro.textContent = '';
      if (senhaEstaCorreta(input.value)) tentarLiberarAcesso(callback);
    });

    setTimeout(function () { input.focus(); }, 160);
  }

  function iniciarComSenha() {
    function boot() {
      if (window.__kdAppIniciado) return;
      window.__kdAppIniciado = true;
      if (typeof iniciarTimbradoKarla === 'function') iniciarTimbradoKarla();
    }

    window.kdIniciarApp = boot;
    document.addEventListener('kd-acesso-liberado', boot, { once: true });

    if (acessoJaLiberado() || document.body.classList.contains('kd-liberado')) {
      finalizarLiberacaoAcesso();
      boot();
      return;
    }

    if (!window.KD_CAPA_MANUAL) {
      configurarSenhaAcesso(boot);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciarComSenha);
  } else {
    iniciarComSenha();
  }
})();
