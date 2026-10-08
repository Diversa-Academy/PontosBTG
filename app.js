(() => {
  'use strict';

  const WHATSAPP = '5544999371668';
  const MAX_POINTS = 300000;
  const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const BRL_INPUT = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const INTEGER = new Intl.NumberFormat('pt-BR');
  const form = document.querySelector('#simulator');
  const amountInput = document.querySelector('#amount');
  const amountRange = document.querySelector('#amount-range');
  const presetButtons = [...document.querySelectorAll('.amount-presets button')];
  const institutionInput = document.querySelector('#institution');
  const trigger = document.querySelector('#institution-trigger');
  const currentName = document.querySelector('#institution-current-name');
  const currentLogo = document.querySelector('#institution-current-logo');
  const dialog = document.querySelector('#institution-dialog');
  const search = document.querySelector('#institution-search');
  const popularSection = document.querySelector('#popular-section');
  const popularContainer = document.querySelector('#popular-institutions');
  const allContainer = document.querySelector('#all-institutions');
  const count = document.querySelector('#institution-count');
  const custom = document.querySelector('#institution-custom');
  const formError = document.querySelector('#form-error');
  const simulateButton = document.querySelector('#simulate-button');
  const result = document.querySelector('#resultado');
  let submissionId = crypto.randomUUID();
  const institutions = Array.isArray(window.INSTITUTION_CATALOG) ? window.INSTITUTION_CATALOG : [];

  const localLogos = new Map([
    ['Nubank', 'nubank.svg'], ['Itaú', 'itau.svg'], ['Banco XP S.A.', 'xp.svg'],
    ['Ágora Investimentos', 'agora.svg'], ['Bradesco Pessoa Física', 'bradesco.svg'],
    ['Banco do Brasil', 'bb.svg'], ['Banco Santander Pessoa Física', 'santander.svg'],
    ['CAIXA', 'caixa.svg'], ['Sicoob', 'sicoob.svg'], ['Sicredi', 'sicredi.svg'],
    ['Banco Inter PF', 'inter.svg']
  ]);
  const featured = [
    ['Nubank', 'Nubank'], ['Itaú', 'Itaú'], ['Banco XP S.A.', 'XP'],
    ['Ágora Investimentos', 'Ágora'], ['Bradesco Pessoa Física', 'Bradesco'],
    ['Banco Santander Pessoa Física', 'Santander'], ['Banco do Brasil', 'Banco do Brasil'],
    ['CAIXA', 'Caixa'], ['Banco Inter PF', 'Inter'], ['Sicoob', 'Sicoob'],
    ['Sicredi', 'Sicredi'], ['Brasilprev', 'Brasilprev']
  ];
  const byName = new Map(institutions.map(item => [item.name, item]));
  const fold = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim();

  function parseBRL(raw) {
    let value = String(raw).replace(/[^\d,.]/g, '');
    if (!value) return NaN;
    if (value.includes(',')) value = value.replace(/\./g, '').replace(',', '.');
    else if ((value.match(/\./g) || []).length > 1 || /\.\d{3}$/.test(value)) value = value.replace(/\./g, '');
    return Number(value);
  }

  function makeLogo(item) {
    const stack = document.createElement('span');
    stack.className = 'logo-stack';
    const fallback = document.createElement('span');
    fallback.className = 'institution-initials';
    fallback.textContent = item.name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toLocaleUpperCase('pt-BR');
    stack.append(fallback);
    const source = localLogos.has(item.name)
      ? `assets/brands/${localLogos.get(item.name)}`
      : item.logo;
    if (!source || !/^(assets\/|https:\/\/)/i.test(source)) return stack;
    const image = document.createElement('img');
    image.alt = '';
    image.loading = 'lazy';
    image.referrerPolicy = 'no-referrer';
    image.style.visibility = 'hidden';
    image.onload = () => { fallback.style.visibility = 'hidden'; image.style.visibility = 'visible'; };
    image.onerror = () => image.remove();
    image.src = source;
    stack.append(image);
    return stack;
  }

  function choose(item) {
    institutionInput.value = item.name;
    currentName.textContent = item.label || item.name;
    currentLogo.replaceChildren(makeLogo(item));
    trigger.classList.add('selected');
    trigger.removeAttribute('aria-invalid');
    formError.hidden = true;
    dialog.close();
    trigger.focus();
  }

  function makeInstitutionButton(item, label = item.name, popular = false) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = popular ? 'popular-option' : 'institution-option';
    button.append(makeLogo(item));
    const text = document.createElement('span');
    text.textContent = label;
    button.append(text);
    button.addEventListener('click', () => choose({ ...item, label }));
    return button;
  }

  function renderFeatured() {
    const fragment = document.createDocumentFragment();
    for (const [name, label] of featured) {
      const item = byName.get(name);
      if (item) fragment.append(makeInstitutionButton(item, label, true));
    }
    popularContainer.replaceChildren(fragment);
  }

  function renderInstitutions() {
    const query = fold(search.value);
    const matches = query
      ? institutions.filter(item => fold(item.name).includes(query))
      : institutions;
    const fragment = document.createDocumentFragment();
    for (const item of matches) fragment.append(makeInstitutionButton(item));
    allContainer.replaceChildren(fragment);
    popularSection.hidden = Boolean(query);
    count.textContent = `${matches.length} de ${institutions.length}`;
    custom.hidden = !query || matches.some(item => fold(item.name) === query);
    if (!custom.hidden) custom.textContent = `Não encontrou? Usar “${search.value.trim()}”`;
    if (!matches.length) {
      const empty = document.createElement('p');
      empty.className = 'institution-empty';
      empty.textContent = 'Nenhuma marca com esse nome na lista.';
      allContainer.append(empty);
    }
  }

  trigger.addEventListener('click', () => {
    search.value = '';
    renderInstitutions();
    dialog.showModal();
    search.focus();
  });
  document.querySelector('#institution-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  search.addEventListener('input', renderInstitutions);
  custom.addEventListener('click', () => {
    const name = search.value.trim();
    if (name) choose({ name, logo: '' });
  });
  renderFeatured();
  renderInstitutions();

  function syncAmountControls() {
    const amount = parseBRL(amountInput.value);
    const clamped = Number.isFinite(amount) ? Math.min(3000000, Math.max(0, amount)) : 0;
    amountRange.value = String(Math.round(clamped / 10000) * 10000);
    amountRange.style.setProperty('--range-progress', `${clamped / 3000000 * 100}%`);
    presetButtons.forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.amount) === amount)));
  }
  amountInput.addEventListener('input', syncAmountControls);
  amountRange.addEventListener('input', () => {
    amountInput.value = BRL_INPUT.format(Number(amountRange.value));
    syncAmountControls();
    amountInput.removeAttribute('aria-invalid');
    formError.hidden = true;
  });
  presetButtons.forEach(button => button.addEventListener('click', () => {
    amountInput.value = BRL_INPUT.format(Number(button.dataset.amount));
    syncAmountControls();
    amountInput.removeAttribute('aria-invalid');
    formError.hidden = true;
  }));
  amountInput.addEventListener('blur', () => {
    const amount = parseBRL(amountInput.value);
    if (Number.isFinite(amount) && amount >= 0) amountInput.value = BRL_INPUT.format(amount);
    syncAmountControls();
  });
  amountInput.addEventListener('focus', () => { if (amountInput.value) amountInput.select(); });
  syncAmountControls();
  form.querySelectorAll('input').forEach(input => input.addEventListener('input', () => {
    input.removeAttribute('aria-invalid');
    formError.hidden = true;
  }));

  function showError(input, message) {
    formError.textContent = message;
    formError.hidden = false;
    input.setAttribute('aria-invalid', 'true');
    input.focus();
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const amount = parseBRL(amountInput.value);
    const institution = institutionInput.value.trim();
    const satisfaction = form.querySelector('input[name="satisfaction"]:checked');
    const name = form.elements.name.value.trim();
    const email = form.elements.email.value.trim();
    const phone = form.elements.phone.value.replace(/\D/g, '');

    if (!Number.isFinite(amount) || amount <= 0) return showError(amountInput, 'Informe um valor de previdência maior que zero.');
    if (!institution) return showError(trigger, 'Selecione onde está sua previdência.');
    if (!satisfaction) return showError(form.querySelector('input[name="satisfaction"]'), 'Selecione como você avalia o resultado da sua previdência.');
    if (name.length < 2) return showError(form.elements.name, 'Informe seu nome para continuar.');
    if (!form.elements.email.validity.valid || !email) return showError(form.elements.email, 'Informe um e-mail válido.');
    if (phone.length < 10 || phone.length > 11) return showError(form.elements.phone, 'Informe um WhatsApp com DDD.');

    const blocks = Math.floor(amount / 100000);
    let points = Math.min(MAX_POINTS, blocks * 10000);
    result.hidden = true;
    simulateButton.disabled = true;
    simulateButton.textContent = 'ENVIANDO DADOS...';
    form.setAttribute('aria-busy', 'true');
    formError.hidden = true;
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          submissionId,
          amountCents: Math.round(amount * 100),
          institution,
          satisfaction: satisfaction.value,
          name,
          email,
          phone,
          consent: true,
          consentVersion: '2026-10-08'
        })
      });
      if (!response.ok) throw new Error('lead_save_failed');
      const receipt = await response.json();
      if (receipt.saved !== true || !Number.isInteger(receipt.points)) throw new Error('lead_receipt_invalid');
      points = receipt.points;
      submissionId = crypto.randomUUID();
    } catch {
      formError.textContent = 'Não foi possível enviar seus dados. Tente novamente para ver a simulação.';
      formError.hidden = false;
      formError.scrollIntoView({ block: 'center' });
      return;
    } finally {
      simulateButton.disabled = false;
      simulateButton.textContent = 'VER MINHA SIMULAÇÃO';
      form.removeAttribute('aria-busy');
    }
    document.querySelector('#points-number').textContent = INTEGER.format(points);
    document.querySelector('#result-amount').textContent = BRL.format(amount);
    document.querySelector('#progress-fill').style.transform = `scaleX(${Math.min(1, points / MAX_POINTS)})`;
    document.querySelector('#result-intro').textContent = `Estimativa para ${BRL.format(amount)} em previdência na ${institution}.`;
    document.querySelector('#points-explanation').textContent = amount < 100000
      ? 'A campanha considera blocos completos de R$ 100 mil. Para esse valor, a estimativa é de 0 pontos.'
      : amount >= 3000000
        ? 'Você atingiu o teto ilustrativo de 300 mil pontos por participante.'
        : `Estimativa para ${INTEGER.format(blocks)} bloco${blocks === 1 ? '' : 's'} completo${blocks === 1 ? '' : 's'} de R$ 100 mil.`;
    document.querySelector('#eligibility-note').textContent = 'A pontuação é uma estimativa. A concessão depende da edição vigente da campanha, da elegibilidade da portabilidade e das demais condições do regulamento.';

    const message = [
      'Olá! Quero falar com um profissional da Diversa sobre a campanha de portabilidade de previdência e Pontos BTG.',
      `Nome: ${name}`,
      `E-mail: ${email}`,
      `Meu WhatsApp: ${form.elements.phone.value.trim()}`,
      `Valor em previdência: ${BRL.format(amount)}`,
      `Instituição atual: ${institution}`,
      `Satisfação com o fundo: ${satisfaction.value}`,
      `Simulação ilustrativa: ${INTEGER.format(points)} Pontos BTG.`,
      'Gostaria de confirmar minha elegibilidade e receber o regulamento vigente.'
    ].join('\n');
    const whatsappLink = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`;
    document.querySelector('#whatsapp-cta').href = whatsappLink;
    document.querySelector('#whatsapp-quick').href = whatsappLink;

    result.hidden = false;
    result.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    const resultTitle = document.querySelector('#result-title');
    resultTitle.setAttribute('tabindex', '-1');
    setTimeout(() => resultTitle.focus({ preventScroll: true }), 400);
  });
})();
