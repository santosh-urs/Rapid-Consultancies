document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();
  switchView('view-landing');
  if (document.getElementById('weight-range')) calc();
});

function switchView(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
  setTimeout(() => lucide.createIcons(), 0);
}

function navigateTo(page) {
  if (!document.getElementById('view-app').classList.contains('active')) {
    switchView('view-app');
  }
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelectorAll('.bn-item').forEach(n => n.classList.remove('active'));
  const navKey = (page === 'loan-detail') ? 'loans' : page;
  document.querySelectorAll('.nav-item[data-page="' + navKey + '"]').forEach(n => n.classList.add('active'));
  document.querySelectorAll('.bn-item[data-page="' + navKey + '"]').forEach(n => n.classList.add('active'));
  window.scrollTo(0, 0);
  setTimeout(() => lucide.createIcons(), 0);
}

function togglePwd(id, btn) {
  const el = document.getElementById(id);
  el.type = el.type === 'password' ? 'text' : 'password';
  btn.innerHTML = el.type === 'password'
    ? '<i data-lucide="eye"></i>'
    : '<i data-lucide="eye-off"></i>';
  lucide.createIcons();
}

function checkPwdRules(v) {
  const rules = {
    len: v.length >= 8,
    upper: /[A-Z]/.test(v),
    num: /[0-9]/.test(v),
    special: /[^A-Za-z0-9]/.test(v),
  };
  Object.keys(rules).forEach(key => {
    const row = document.querySelector('[data-rule="' + key + '"]');
    if (!row) return;
    const met = rules[key];
    row.classList.toggle('met', met);
    row.querySelector('i').setAttribute('data-lucide', met ? 'check-circle-2' : 'circle');
  });
  lucide.createIcons();
}

function openModal(id) {
  document.getElementById(id).classList.add('active');
  setTimeout(() => lucide.createIcons(), 0);
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

function showToast(msg, type) {
  const t = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  t.classList.toggle('success', type === 'success');
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

function copy(text) {
  navigator.clipboard?.writeText(text);
  showToast('Copied: ' + text, 'success');
}

function toggleEdit() {
  const editing = document.getElementById('emailEdit').style.display !== 'none';
  document.getElementById('emailView').style.display = editing ? 'block' : 'none';
  document.getElementById('emailEdit').style.display = editing ? 'none' : 'block';
  document.getElementById('addrView').style.display = editing ? 'block' : 'none';
  document.getElementById('addrEdit').style.display = editing ? 'none' : 'block';
  document.getElementById('editBtn').style.display = editing ? 'inline-flex' : 'none';
  document.getElementById('saveCancel').style.display = editing ? 'none' : 'flex';
  setTimeout(() => lucide.createIcons(), 0);
}

function scrollTo2(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function toggleFaq(el) {
  el.classList.toggle('open');
}

function calc() {
  const weight = +document.getElementById('weight-range').value;
  const purity = +document.getElementById('purity-range').value;
  const tenure = +document.getElementById('tenure-range').value;
  const rate24k = 9000;
  const purityFactor = purity / 24;
  const goldValue = weight * rate24k * purityFactor;
  const loanAmount = Math.round(goldValue * 0.75 / 100) * 100;
  const interest = Math.round(loanAmount * 0.12 * (tenure / 12) / 100) * 100;
  const total = loanAmount + interest;
  document.getElementById('weight-val').textContent = weight + ' g';
  document.getElementById('purity-val').textContent = purity + 'K';
  document.getElementById('tenure-val').textContent = tenure + ' months';
  document.getElementById('calc-amount').textContent = '₹' + fmtINR(loanAmount);
  document.getElementById('calc-interest').textContent = '₹' + fmtINR(interest);
  document.getElementById('calc-total').textContent = '₹' + fmtINR(total);
}

function fmtINR(n) {
  return n.toLocaleString('en-IN');
}
