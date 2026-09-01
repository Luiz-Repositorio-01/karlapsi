// templates.js — modelos de documento da Karla (recibo, comprovante, declaração de presença,
// comprovante de pagamento). Gera o texto formatado e insere na folha (sobre o timbrado).
import { el, toast } from './utils.js';
import { editor } from './editor-core.js';
import { openModal } from './ui.js';

const PROF_KEY = 'kd_prof_v1';
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

// ---------- Dados da profissional (padrão: Karla) ----------
function defaultProf() {
  return {
    nome: 'Karla Dias',
    profissao: 'Psicóloga · Neuropsicóloga',
    crp: '', cpf: '', endereco: '', cidade: '', uf: '',
    telefone: '(11) 98883-0377', email: 'karlaapcdias@gmail.com',
  };
}
export function getProf() {
  try { return { ...defaultProf(), ...JSON.parse(localStorage.getItem(PROF_KEY) || '{}') }; } catch { return defaultProf(); }
}
function saveProf(p) { try { localStorage.setItem(PROF_KEY, JSON.stringify(p)); } catch { /* ignore */ } }

// ---------- Formatação ----------
const hoje = () => new Date().toISOString().slice(0, 10);
function dataBR(iso) { if (!iso) return ''; const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}`; }
function dataExtenso(iso) { if (!iso) return ''; const [y, m, d] = iso.split('-'); return `${parseInt(d, 10)} de ${MESES[parseInt(m, 10) - 1]} de ${y}`; }
function horaTexto(h) { if (!h) return ''; const [hh, mm] = h.substring(0, 5).split(':'); return `${hh}h${mm}`; }
function moeda(v) {
  const n = parseFloat(String(v).replace(/[^\d,.-]/g, '').replace('.', '').replace(',', '.')) || 0;
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
const esc = (s) => String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

function nomeProf(p) { return p.nome + (p.profissao ? ', ' + p.profissao : ''); }
function localData(p, iso) {
  const cid = p.cidade ? p.cidade + (p.uf ? ' - ' + p.uf : '') + ', ' : '';
  return cid + dataExtenso(iso || hoje()) + '.';
}
function assinatura(p) {
  const linhas = [p.nome, p.profissao];
  if (p.crp) linhas.push('CRP ' + p.crp);
  if (p.cpf) linhas.push('CPF/CNPJ: ' + p.cpf);
  if (p.endereco) linhas.push(p.endereco);
  const contato = [p.telefone, p.email].filter(Boolean).join(' · ');
  if (contato) linhas.push(contato);
  return `<p style="text-align:center;margin-top:56px">_______________________________________</p>` +
    linhas.map((l, i) => `<p style="text-align:center;margin:0${i === 0 ? ';font-weight:600' : ''}">${esc(l)}</p>`).join('');
}
function titulo(t) { return `<h2 style="text-align:center;text-transform:uppercase;letter-spacing:.02em;margin-bottom:22px">${esc(t)}</h2>`; }
function par(html) { return `<p style="text-align:justify;margin-bottom:12px">${html}</p>`; }

// ---------- Construtores de texto ----------
function htmlRecibo(f, p) {
  return titulo('Recibo de Pagamento') +
    par(`Recebi de <strong>${esc(f.paciente)}</strong>${f.cpf ? ', CPF ' + esc(f.cpf) : ''}, a quantia de <strong>R$ ${moeda(f.valor)}</strong>, referente ao pagamento da sessão de psicologia e neuropsicologia realizada em ${dataBR(f.data)}, prestada por ${esc(nomeProf(p))}.`) +
    par(`Forma de pagamento: ${esc(f.forma)}.`) +
    par(`Para clareza, declaro quitado o valor acima, recebido em favor de ${esc(p.nome)}.`) +
    `<p style="text-align:right;margin-top:20px">${esc(localData(p, f.data))}</p>` + assinatura(p);
}

function htmlDeclaracao(f, p) {
  let corpo = `Declaro, para os devidos fins, que o(a) paciente <strong>${esc(f.paciente)}</strong>`;
  if (f.responsavel) corpo += `, representado(a) por ${esc(f.responsavel)}`;
  corpo += `, esteve sob consulta de psicologia e neuropsicologia no dia ${dataBR(f.data)}, no horário das <strong>${horaTexto(f.hi)}</strong> às <strong>${horaTexto(f.hf)}</strong>, conduzida por ${esc(nomeProf(p))}.`;
  return titulo('Declaração de Presença') + par(corpo) +
    (f.obs ? par(esc(f.obs)) : '') +
    par('Para apresentar aos interessados, firmo a presente declaração.') +
    `<p style="text-align:right;margin-top:20px">${esc(localData(p, f.data))}</p>` + assinatura(p);
}

function htmlComprovante(f, p) {
  const linha = (k, v) => `<p style="margin-bottom:6px"><strong>${k}:</strong> ${esc(v)}</p>`;
  return titulo('Comprovante de Sessão') +
    linha('Comprovante nº', f.numero) +
    linha('Paciente', f.paciente) +
    linha('Data da sessão', dataBR(f.data)) +
    linha('Profissional responsável', nomeProf(p)) +
    linha('Serviço prestado', f.servico || `Sessão de psicologia e neuropsicologia conduzida por ${nomeProf(p)}.`) +
    (f.valor && moeda(f.valor) !== '0,00' ? linha('Valor da sessão', 'R$ ' + moeda(f.valor)) : '') +
    (f.obs ? linha('Observações', f.obs) : '') +
    par('Certifico que a sessão de psicologia / neuropsicologia descrita acima foi realizada com o(a) paciente identificado(a).') +
    `<p style="text-align:right;margin-top:20px">${esc(localData(p, f.data))}</p>` + assinatura(p);
}

function htmlComprovantePagamento(f, p) {
  const linha = (k, v) => `<p style="margin-bottom:6px"><strong>${k}:</strong> ${esc(v)}</p>`;
  return titulo('Comprovante de Pagamento') +
    linha('Comprovante nº', f.numero) +
    linha('Pagador', f.paciente + (f.cpf ? ', CPF ' + f.cpf : '')) +
    linha('Valor pago', 'R$ ' + moeda(f.valor)) +
    linha('Forma de pagamento', f.forma) +
    linha('Data do pagamento', dataBR(f.data)) +
    linha('Referente a', f.referente || 'Sessão de psicologia e neuropsicologia.') +
    par('Certifico o recebimento do valor acima, referente ao serviço identificado.') +
    `<p style="text-align:right;margin-top:20px">${esc(localData(p, f.data))}</p>` + assinatura(p);
}

// ---------- Inserção na folha ----------
function inserirDocumento(html) {
  let content = editor.activeContentEl();
  if (!content) return;
  // Se a página atual já tem conteúdo, cria uma nova.
  if (content.textContent.trim()) { editor.addPage(); content = editor.activeContentEl(); }
  content.innerHTML = html;
  editor.markDirty();
  editor.snapshot();
  editor.emit('changed', {});
  content.focus();
  toast('Documento inserido no timbrado.', 'ok');
}

// ---------- Campos e diálogos ----------
function campo(label, node) { return el('div', { class: 'field' }, [el('label', { text: label }), node]); }
const inputTexto = (v = '', ph = '') => el('input', { type: 'text', value: v, placeholder: ph });
const inputData = (v = hoje()) => el('input', { type: 'date', value: v });
const inputHora = (v) => el('input', { type: 'time', value: v });
const selForma = (v = 'Pix') => { const s = el('select', {}, ['Pix', 'Dinheiro', 'Cartão de crédito', 'Cartão de débito', 'Transferência'].map((o) => el('option', { text: o, selected: o === v ? '' : null }))); s.value = v; return s; };
const numeroAuto = () => String(Date.now()).slice(-8);

function dialogModelo(titulo, camposNode, coletar, construir) {
  const p = getProf();
  const m = openModal({
    title: titulo, wide: true, bodyNode: camposNode,
    footNodes: [
      el('button', { class: 'btn', text: 'Cancelar', onclick: () => m.close() }),
      el('button', { class: 'btn btn--primary', text: 'Inserir no timbrado', onclick: () => {
        const f = coletar();
        if (f._erro) { toast(f._erro, 'erro'); return; }
        inserirDocumento(construir(f, p));
        m.close();
      } }),
    ],
  });
  return m;
}

export function abrirRecibo() {
  const paciente = inputTexto('', 'Nome de quem pagou');
  const valor = inputTexto('', 'Ex.: 150,00');
  const cpf = inputTexto('', 'Opcional');
  const data = inputData();
  const forma = selForma();
  const body = el('div', {}, [
    campo('Nome de quem pagou *', paciente),
    el('div', { class: 'field-row' }, [campo('Valor pago (R$) *', valor), campo('Data', data)]),
    el('div', { class: 'field-row' }, [campo('Forma de pagamento', forma), campo('CPF (opcional)', cpf)]),
  ]);
  dialogModelo('Recibo de pagamento', body,
    () => (!paciente.value.trim() || !valor.value.trim()) ? { _erro: 'Preencha nome e valor.' }
      : { paciente: paciente.value.trim(), valor: valor.value, cpf: cpf.value.trim(), data: data.value, forma: forma.value },
    htmlRecibo);
}

export function abrirDeclaracao() {
  const paciente = inputTexto('', 'Nome do paciente');
  const responsavel = inputTexto('', 'Se menor de idade');
  const data = inputData();
  const hi = inputHora('14:00');
  const hf = inputHora('15:00');
  const obs = el('textarea', { rows: '2', placeholder: 'Observação (opcional)' });
  const body = el('div', {}, [
    campo('Nome do paciente *', paciente),
    el('div', { class: 'field-row' }, [campo('Data da consulta', data), campo('Início *', hi), campo('Término *', hf)]),
    campo('Responsável (opcional)', responsavel),
    campo('Observação (opcional)', obs),
  ]);
  dialogModelo('Declaração de presença (horas)', body,
    () => (!paciente.value.trim() || !hi.value || !hf.value) ? { _erro: 'Preencha nome e horários.' }
      : { paciente: paciente.value.trim(), responsavel: responsavel.value.trim(), data: data.value, hi: hi.value, hf: hf.value, obs: obs.value.trim() },
    htmlDeclaracao);
}

export function abrirComprovante() {
  const numero = inputTexto(numeroAuto());
  const paciente = inputTexto('', 'Nome do paciente');
  const data = inputData();
  const servico = inputTexto('', 'Deixe em branco para texto padrão');
  const valor = inputTexto('', 'Opcional');
  const obs = el('textarea', { rows: '2', placeholder: 'Opcional' });
  const body = el('div', {}, [
    el('div', { class: 'field-row' }, [campo('Nº do comprovante', numero), campo('Data da sessão', data)]),
    campo('Nome do paciente *', paciente),
    campo('Descrição do serviço (opcional)', servico),
    el('div', { class: 'field-row' }, [campo('Valor da sessão (opcional)', valor), campo('Observações', obs)]),
  ]);
  dialogModelo('Comprovante de sessão', body,
    () => (!paciente.value.trim()) ? { _erro: 'Preencha o nome do paciente.' }
      : { numero: numero.value.trim() || numeroAuto(), paciente: paciente.value.trim(), data: data.value, servico: servico.value.trim(), valor: valor.value, obs: obs.value.trim() },
    htmlComprovante);
}

export function abrirComprovantePagamento() {
  const numero = inputTexto(numeroAuto());
  const paciente = inputTexto('', 'Nome do pagador');
  const cpf = inputTexto('', 'Opcional');
  const valor = inputTexto('', 'Ex.: 150,00');
  const forma = selForma();
  const data = inputData();
  const referente = inputTexto('', 'Ex.: Sessão de psicologia e neuropsicologia');
  const body = el('div', {}, [
    el('div', { class: 'field-row' }, [campo('Nº do comprovante', numero), campo('Data do pagamento', data)]),
    campo('Nome do pagador *', paciente),
    el('div', { class: 'field-row' }, [campo('Valor pago (R$) *', valor), campo('Forma de pagamento', forma), campo('CPF (opcional)', cpf)]),
    campo('Referente a (opcional)', referente),
  ]);
  dialogModelo('Comprovante de pagamento', body,
    () => (!paciente.value.trim() || !valor.value.trim()) ? { _erro: 'Preencha nome e valor.' }
      : { numero: numero.value.trim() || numeroAuto(), paciente: paciente.value.trim(), cpf: cpf.value.trim(), valor: valor.value, forma: forma.value, data: data.value, referente: referente.value.trim() },
    htmlComprovantePagamento);
}

export function abrirDadosProfissional() {
  const p = getProf();
  const f = {};
  const mk = (k, label, ph = '') => { const i = inputTexto(p[k] || '', ph); f[k] = i; return campo(label, i); };
  const body = el('div', {}, [
    el('div', { class: 'field-row' }, [mk('nome', 'Nome completo'), mk('profissao', 'Profissão / título')]),
    el('div', { class: 'field-row' }, [mk('crp', 'CRP'), mk('cpf', 'CPF/CNPJ')]),
    mk('endereco', 'Endereço do consultório'),
    el('div', { class: 'field-row' }, [mk('cidade', 'Cidade'), mk('uf', 'UF')]),
    el('div', { class: 'field-row' }, [mk('telefone', 'Telefone'), mk('email', 'E-mail')]),
    el('p', { class: 'hint', text: 'Estes dados entram na assinatura dos modelos. Salvos no navegador.' }),
  ]);
  const m = openModal({
    title: 'Dados da profissional', wide: true, bodyNode: body,
    footNodes: [
      el('button', { class: 'btn', text: 'Cancelar', onclick: () => m.close() }),
      el('button', { class: 'btn btn--primary', text: 'Salvar', onclick: () => {
        const np = {}; Object.keys(f).forEach((k) => { np[k] = f[k].value.trim(); });
        saveProf(np); toast('Dados salvos.', 'ok'); m.close();
      } }),
    ],
  });
}
