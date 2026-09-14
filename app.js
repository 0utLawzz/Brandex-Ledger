/* Brandex.pk Consultants Ledger App */
(function () {
  'use strict';

  let LEDGERS = {};
  let currentLedger = null;

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  function formatNum(n) {
    if (n === null || n === undefined || n === '') return '—';
    const num = Number(n);
    if (isNaN(num)) return '—';
    return num.toLocaleString('en-PK');
  }

  function balClass(n) {
    const num = Number(n) || 0;
    if (num > 0) return 'pos';
    if (num < 0) return 'neg';
    return 'zero';
  }

  function isPaymentRow(tx) {
    if (!tx.details) return false;
    const d = String(tx.details).toUpperCase();
    return d.includes('PAYMENT') || d.includes('RECVED') || d.includes('RECEIVED') || d.includes('PAYMENT RECV');
  }

  async function loadData() {
    try {
      const res = await fetch('ledgers_data.json');
      if (!res.ok) throw new Error('Failed to load data');
      LEDGERS = await res.json();
      init();
    } catch (err) {
      console.error(err);
      $('#pageTitle').textContent = 'Error loading data';
      $('#pageSubtitle').textContent = err.message;
    }
  }

  function getSortedLedgers() {
    return Object.keys(LEDGERS)
      .sort((a, b) => {
        const pa = a.replace('A-', '').replace(/([A-Z])/g, '.$1');
        const pb = b.replace('A-', '').replace(/([A-Z])/g, '.$1');
        return pa.localeCompare(pb, undefined, { numeric: true });
      })
      .map((k) => ({ key: k, ...LEDGERS[k] }));
  }

  function calcTotalBalance() {
    return getSortedLedgers().reduce((sum, l) => sum + (Number(l.balance) || 0), 0);
  }

  function renderSidebar(filter = '') {
    const list = $('#ledgerList');
    const q = filter.trim().toLowerCase();
    const items = getSortedLedgers().filter((l) => {
      if (!q) return true;
      return (
        l.ledgerNo.toLowerCase().includes(q) ||
        (l.name || '').toLowerCase().includes(q) ||
        l.key.toLowerCase().includes(q)
      );
    });

    list.innerHTML = items
      .map((l) => {
        const active = currentLedger === l.key ? 'active' : '';
        const bal = Number(l.balance) || 0;
        return `
        <div class="ledger-item ${active}" data-key="${l.key}">
          <span class="ledger-code">${l.ledgerNo || l.key}</span>
          <span class="ledger-name" title="${l.name || ''}">${l.name || '—'}</span>
          <span class="ledger-bal ${balClass(bal)}">${formatNum(bal)}</span>
        </div>`;
      })
      .join('');

    list.querySelectorAll('.ledger-item').forEach((el) => {
      el.addEventListener('click', () => openLedger(el.dataset.key));
    });
  }

  function renderDashboard() {
    currentLedger = null;
    $('#dashboardView').classList.add('active');
    $('#ledgerView').classList.remove('active');
    $('#pageTitle').textContent = 'Dashboard';
    $('#pageSubtitle').textContent = 'All consultants overview';
    renderSidebar($('#searchInput').value);

    const ledgers = getSortedLedgers();
    const total = calcTotalBalance();
    $('#totalBalance').textContent = formatNum(total);
    $('#ledgerCount').textContent = ledgers.length;

    const cardsEl = $('#dashboardCards');
    const withBal = ledgers.filter((l) => Number(l.balance) !== 0);
    const show = withBal.length ? withBal.slice(0, 24) : ledgers.slice(0, 12);
    cardsEl.innerHTML = show
      .map((l) => {
        const bal = Number(l.balance) || 0;
        return `
        <div class="card" data-key="${l.key}">
          <div class="card-code">${l.ledgerNo || l.key}</div>
          <div class="card-name">${l.name || '—'}</div>
          <div class="card-bal ${balClass(bal)}">${formatNum(bal)}</div>
        </div>`;
      })
      .join('');

    cardsEl.querySelectorAll('.card').forEach((el) => {
      el.addEventListener('click', () => openLedger(el.dataset.key));
    });

    const tbody = $('#dashboardTable tbody');
    tbody.innerHTML = ledgers
      .map((l) => {
        const bal = Number(l.balance) || 0;
        return `
        <tr>
          <td><strong>${l.ledgerNo || l.key}</strong></td>
          <td>${l.name || '—'}</td>
          <td class="num ${balClass(bal)}">${formatNum(bal)}</td>
          <td><button class="link-btn" data-key="${l.key}">Open</button></td>
        </tr>`;
      })
      .join('');

    tbody.querySelectorAll('.link-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openLedger(btn.dataset.key);
      });
    });
  }

  function openLedger(key) {
    const data = LEDGERS[key];
    if (!data) return;

    currentLedger = key;
    $('#dashboardView').classList.remove('active');
    $('#ledgerView').classList.add('active');
    closeSidebar();

    const bal = Number(data.balance) || 0;
    $('#pageTitle').textContent = data.ledgerNo || key;
    $('#pageSubtitle').textContent = data.name || 'Ledger detail';

    $('#ledgerHeader').innerHTML = `
      <div>
        <h3>${data.name || '—'}</h3>
        <div class="meta">Ledger: <strong>${data.ledgerNo || key}</strong> · ${data.transactions.length} entries</div>
        <div class="bank-info">
          OFFICE NO 1&amp;2, 2ND FLOOR, ABDULLAH PLAZA NEAR GHURI GARDEN GATE ISLAMABAD<br>
          🏦 MEEZAN BANK LIMITED ISLAMABAD · Title: BRANDEX.PK · AC: 9814-0104862477 · IBAN: PK12MEZN0098140104862477
        </div>
      </div>
      <div class="balance-big">
        <div class="label">Current Balance</div>
        <div class="value ${balClass(bal)}">${formatNum(bal)}</div>
      </div>
    `;

    const tbody = $('#ledgerTable tbody');
    tbody.innerHTML = data.transactions
      .map((tx) => {
        const isPay = isPaymentRow(tx);
        const balCls = balClass(tx.balance);
        return `
        <tr class="${isPay ? 'row-payment' : ''}">
          <td>${tx.date || '—'}</td>
          <td>${tx.folderNo ?? '—'}</td>
          <td>${tx.stage || '—'}</td>
          <td>${tx.tmNo || '—'}</td>
          <td>${tx.details || '—'}</td>
          <td class="num">${formatNum(tx.due)}</td>
          <td class="num">${formatNum(tx.received)}</td>
          <td class="num ${balCls}">${formatNum(tx.balance)}</td>
        </tr>`;
      })
      .join('');

    renderSidebar($('#searchInput').value);
  }

  function openSidebar() {
    $('#sidebar').classList.add('open');
    let overlay = $('.sidebar-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'sidebar-overlay';
      document.body.appendChild(overlay);
      overlay.addEventListener('click', closeSidebar);
    }
    overlay.classList.add('show');
  }

  function closeSidebar() {
    $('#sidebar').classList.remove('open');
    const overlay = $('.sidebar-overlay');
    if (overlay) overlay.classList.remove('show');
  }

  function init() {
    renderDashboard();

    $('#searchInput').addEventListener('input', (e) => {
      renderSidebar(e.target.value);
    });

    $('#homeBtn').addEventListener('click', () => {
      renderDashboard();
      closeSidebar();
    });

    $('#openSidebar').addEventListener('click', openSidebar);
    $('#closeSidebar').addEventListener('click', closeSidebar);

    $('#printBtn').addEventListener('click', () => {
      window.print();
    });
  }

  loadData();
})();
