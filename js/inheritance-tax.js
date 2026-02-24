// ==========================================================================
// UK Financial Hub - Inheritance Tax Calculator Logic
// 2025/26 Tax Year
// ==========================================================================

let ihtBreakdownChart = null;
let ihtComparisonChart = null;

// ---- IHT Constants (2025/26) ----
const IHT_RATE = 0.40;
const IHT_CHARITY_RATE = 0.36;
const NIL_RATE_BAND = 325000;
const RNRB = 175000; // Residence nil-rate band
const RNRB_TAPER_THRESHOLD = 2000000;
const ANNUAL_EXEMPTION = 3000;
const SMALL_GIFT_LIMIT = 250;
const MARRIAGE_EXEMPTION_PARENT = 5000;
const MARRIAGE_EXEMPTION_GRANDPARENT = 2500;
const MARRIAGE_EXEMPTION_OTHER = 1000;

// Taper relief for gifts (Potentially Exempt Transfers)
const TAPER_RELIEF = [
  { yearsMin: 0, yearsMax: 3, relief: 0 },
  { yearsMin: 3, yearsMax: 4, relief: 0.20 },
  { yearsMin: 4, yearsMax: 5, relief: 0.40 },
  { yearsMin: 5, yearsMax: 6, relief: 0.60 },
  { yearsMin: 6, yearsMax: 7, relief: 0.80 },
  { yearsMin: 7, yearsMax: Infinity, relief: 1.0 }
];

// ---- DOM Elements ----
const propertyValue = document.getElementById('propertyValue');
const propertyValueSlider = document.getElementById('propertyValueSlider');
const savingsValue = document.getElementById('savingsValue');
const savingsValueSlider = document.getElementById('savingsValueSlider');
const investmentsValue = document.getElementById('investmentsValue');
const investmentsValueSlider = document.getElementById('investmentsValueSlider');
const otherAssetsValue = document.getElementById('otherAssetsValue');
const maritalStatus = document.getElementById('maritalStatus');
const passToChildren = document.getElementById('passToChildren');
const giftsLast7 = document.getElementById('giftsLast7');
const giftsLast7Slider = document.getElementById('giftsLast7Slider');
const charitableDonation = document.getElementById('charitableDonation');
const charitableDonationSlider = document.getElementById('charitableDonationSlider');
const liabilities = document.getElementById('liabilities');
const liabilitiesSlider = document.getElementById('liabilitiesSlider');

// ---- Sync Sliders ----
syncSliderAndInput(propertyValueSlider, propertyValue);
syncSliderAndInput(savingsValueSlider, savingsValue);
syncSliderAndInput(investmentsValueSlider, investmentsValue);
syncSliderAndInput(giftsLast7Slider, giftsLast7);
syncSliderAndInput(charitableDonationSlider, charitableDonation);
syncSliderAndInput(liabilitiesSlider, liabilities);

// ---- Extend slider max for large values ----
[propertyValue, savingsValue, investmentsValue].forEach(input => {
  input.addEventListener('input', () => {
    const slider = document.getElementById(input.id + 'Slider');
    const val = parseFloat(input.value) || 0;
    if (val > parseFloat(slider.max)) {
      slider.max = Math.min(val + 500000, 10000000);
    }
  });
});

// ---- Event Listeners ----
const allInputs = [
  propertyValue, savingsValue, investmentsValue, otherAssetsValue,
  maritalStatus, passToChildren, giftsLast7, charitableDonation, liabilities
];
allInputs.forEach(el => {
  if (el) el.addEventListener('input', calculateIHT);
  if (el) el.addEventListener('change', calculateIHT);
});

// ---- Main Calculation ----
function calculateIHT() {
  const property = parseFloat(propertyValue.value) || 0;
  const savings = parseFloat(savingsValue.value) || 0;
  const investments = parseFloat(investmentsValue.value) || 0;
  const otherAssets = parseFloat(otherAssetsValue.value) || 0;
  const status = maritalStatus.value;
  const toChildren = passToChildren.checked;
  const gifts = parseFloat(giftsLast7.value) || 0;
  const charity = parseFloat(charitableDonation.value) || 0;
  const debts = parseFloat(liabilities.value) || 0;

  // 1. Total estate
  const grossEstate = property + savings + investments + otherAssets;
  const netEstate = Math.max(0, grossEstate - debts);

  // 2. Deductions
  const charitableDeduction = charity;
  const taxableEstate = Math.max(0, netEstate - charitableDeduction);

  // 3. Nil-rate band calculation
  let nilRateBand = NIL_RATE_BAND;
  let residenceNilRate = 0;

  // Married/civil partner - transferable NRB
  if (status === 'widowed') {
    nilRateBand = NIL_RATE_BAND * 2; // £650,000
  }

  // RNRB if passing property to children/grandchildren
  if (toChildren && property > 0) {
    residenceNilRate = RNRB;
    if (status === 'widowed') {
      residenceNilRate = RNRB * 2; // £350,000
    }
    // Taper RNRB for estates over £2M
    if (netEstate > RNRB_TAPER_THRESHOLD) {
      const excess = netEstate - RNRB_TAPER_THRESHOLD;
      const reduction = Math.min(residenceNilRate, excess / 2);
      residenceNilRate = Math.max(0, residenceNilRate - reduction);
    }
  }

  const totalNilRate = nilRateBand + residenceNilRate;

  // 4. Spouse exemption
  let spouseExemption = 0;
  if (status === 'married') {
    // Spouse exemption means NO IHT on first death
    spouseExemption = taxableEstate;
  }

  // 5. Taxable amount after exemptions
  let taxableAmount = Math.max(0, taxableEstate - spouseExemption - totalNilRate);

  // 6. Gifts in last 7 years (PETs that failed)
  // Gifts above the NRB are taxed - we simplify here
  let giftTax = 0;
  if (gifts > 0) {
    // Gifts use up the NRB first
    const giftsAboveNRB = Math.max(0, gifts - nilRateBand);
    giftTax = giftsAboveNRB * IHT_RATE;
    // Note: taper relief would apply based on years
  }

  // 7. Apply IHT rate
  let useCharityRate = false;
  if (charity > 0 && charity >= (netEstate * 0.10)) {
    useCharityRate = true;
  }
  const rate = useCharityRate ? IHT_CHARITY_RATE : IHT_RATE;
  const ihtOnEstate = taxableAmount * rate;
  const totalIHT = Math.max(0, ihtOnEstate);

  // 8. What beneficiaries receive
  const beneficiariesReceive = Math.max(0, netEstate - totalIHT - charitableDeduction);

  // 9. Effective rate
  const effectiveRate = netEstate > 0 ? ((totalIHT / netEstate) * 100) : 0;

  // 10. Monthly equivalent (if saving to cover IHT over 10 years)
  const monthlySaving = totalIHT > 0 ? totalIHT / 120 : 0;

  // ---- Display Results ----
  displayResults({
    grossEstate, netEstate, taxableEstate, taxableAmount, nilRateBand,
    residenceNilRate, totalNilRate, spouseExemption, charitableDeduction,
    totalIHT, beneficiariesReceive, effectiveRate, monthlySaving,
    rate, useCharityRate, status, toChildren, gifts, giftTax
  });

  updateCharts({
    totalIHT, beneficiariesReceive, charitableDeduction,
    nilRateBand, residenceNilRate, taxableAmount, netEstate, status
  });

  updateBreakdownTable({
    grossEstate, debts: debts, netEstate, charitableDeduction, taxableEstate,
    spouseExemption, nilRateBand, residenceNilRate, totalNilRate,
    taxableAmount, rate, totalIHT, beneficiariesReceive, status
  });
}

function displayResults(data) {
  // Main result
  document.getElementById('totalIHT').textContent = formatCurrency(data.totalIHT, 0);
  document.getElementById('ihtSubtext').textContent =
    data.status === 'married' ? 'Spouse exemption — no IHT on first death' :
    data.totalIHT === 0 ? 'Your estate is within the tax-free threshold' :
    `${data.effectiveRate.toFixed(1)}% effective rate on your estate`;

  // Mini cards
  document.getElementById('grossEstateDisplay').textContent = formatCurrency(data.grossEstate, 0);
  document.getElementById('nilRateDisplay').textContent = formatCurrency(data.totalNilRate, 0);
  document.getElementById('taxableDisplay').textContent = formatCurrency(data.taxableAmount, 0);
  document.getElementById('effectiveRateDisplay').textContent = data.effectiveRate.toFixed(1) + '%';

  // Beneficiaries card
  document.getElementById('beneficiariesReceive').textContent = formatCurrency(data.beneficiariesReceive, 0);
  document.getElementById('beneficiariesPercent').textContent =
    data.netEstate > 0
      ? ((data.beneficiariesReceive / data.netEstate) * 100).toFixed(1) + '% of your net estate'
      : '';

  // Estate total live display
  const estateDisplay = document.getElementById('estateTotal');
  if (estateDisplay) estateDisplay.textContent = formatNumber(data.grossEstate, 0);

  // Tax-free allowance info
  const nrbInfo = document.getElementById('nrbInfo');
  if (nrbInfo) {
    let text = `NRB: ${formatCurrency(data.nilRateBand, 0)}`;
    if (data.residenceNilRate > 0) {
      text += ` + RNRB: ${formatCurrency(data.residenceNilRate, 0)}`;
    }
    text += ` = ${formatCurrency(data.totalNilRate, 0)} tax-free`;
    nrbInfo.textContent = text;
  }
}

function updateCharts(data) {
  // Doughnut chart - estate breakdown
  const ctx1 = document.getElementById('ihtBreakdownChart');
  if (!ctx1) return;

  if (ihtBreakdownChart) ihtBreakdownChart.destroy();

  const chartData = [];
  const chartLabels = [];
  const chartColors = [];

  if (data.beneficiariesReceive > 0) {
    chartLabels.push('Beneficiaries Receive');
    chartData.push(data.beneficiariesReceive);
    chartColors.push('#10b981');
  }
  if (data.totalIHT > 0) {
    chartLabels.push('Inheritance Tax (IHT)');
    chartData.push(data.totalIHT);
    chartColors.push('#ef4444');
  }
  if (data.charitableDeduction > 0) {
    chartLabels.push('Charitable Donations');
    chartData.push(data.charitableDeduction);
    chartColors.push('#8b5cf6');
  }

  if (chartData.length === 0) {
    chartLabels.push('Full Estate (Tax-Free)');
    chartData.push(data.netEstate || 1);
    chartColors.push('#10b981');
  }

  ihtBreakdownChart = new Chart(ctx1, {
    type: 'doughnut',
    data: {
      labels: chartLabels,
      datasets: [{
        data: chartData,
        backgroundColor: chartColors,
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { position: 'bottom', labels: { padding: 15, font: { size: 11 }, color: '#B4B4BC' } },
        tooltip: {
          callbacks: {
            label: function(context) {
              return context.label + ': ' + formatCurrency(context.parsed, 0);
            }
          }
        }
      }
    }
  });

  // Bar chart - scenario comparison
  const ctx2 = document.getElementById('ihtComparisonChart');
  if (!ctx2) return;

  if (ihtComparisonChart) ihtComparisonChart.destroy();

  // Compare: single vs widowed vs married
  const estate = data.netEstate;
  const singleIHT = Math.max(0, (estate - NIL_RATE_BAND) * IHT_RATE);
  const singleWithRNRB = Math.max(0, (estate - NIL_RATE_BAND - RNRB) * IHT_RATE);
  const widowedWithRNRB = Math.max(0, (estate - NIL_RATE_BAND * 2 - RNRB * 2) * IHT_RATE);

  ihtComparisonChart = new Chart(ctx2, {
    type: 'bar',
    data: {
      labels: ['Single (no RNRB)', 'Single + RNRB', 'Widowed + RNRB'],
      datasets: [{
        label: 'IHT Bill',
        data: [Math.max(0, singleIHT), Math.max(0, singleWithRNRB), Math.max(0, widowedWithRNRB)],
        backgroundColor: ['#ef4444', '#f59e0b', '#10b981'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) {
              return 'IHT: ' + formatCurrency(context.parsed.y, 0);
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: '#9CA3AF',
            callback: function(value) { return '£' + (value / 1000).toFixed(0) + 'k'; }
          },
          grid: { color: '#27272a' }
        },
        x: {
          ticks: { color: '#B4B4BC', font: { size: 11 } },
          grid: { display: false }
        }
      }
    }
  });
}

function updateBreakdownTable(data) {
  const tbody = document.getElementById('ihtBreakdownBody');
  if (!tbody) return;

  const rows = [
    { component: 'Gross Estate', calculation: 'Property + Savings + Investments + Other', rate: '—', amount: data.grossEstate },
    { component: 'Less: Liabilities', calculation: 'Debts, mortgages, funeral costs', rate: '—', amount: -data.debts },
    { component: 'Net Estate', calculation: 'Gross estate minus liabilities', rate: '—', amount: data.netEstate },
  ];

  if (data.charitableDeduction > 0) {
    rows.push({ component: 'Less: Charitable Donations', calculation: 'Tax-exempt donations', rate: 'Exempt', amount: -data.charitableDeduction });
  }

  if (data.status === 'married') {
    rows.push({ component: 'Spouse Exemption', calculation: 'Everything to spouse is exempt', rate: '100%', amount: -data.netEstate, highlight: true });
    rows.push({ component: 'Inheritance Tax Due', calculation: 'No IHT on first death', rate: '0%', amount: 0, highlight: true });
  } else {
    rows.push({ component: 'Nil-Rate Band (NRB)', calculation: data.status === 'widowed' ? '£325k × 2 (transferable)' : '£325,000 threshold', rate: '0%', amount: -data.nilRateBand });

    if (data.residenceNilRate > 0) {
      rows.push({ component: 'Residence Nil-Rate Band', calculation: data.status === 'widowed' ? '£175k × 2 (home to children)' : '£175k (home to children)', rate: '0%', amount: -data.residenceNilRate });
    }

    rows.push({ component: 'Taxable Amount', calculation: 'Net estate minus all allowances', rate: '—', amount: data.taxableAmount });
    rows.push({ component: 'Inheritance Tax Due', calculation: `${(data.rate * 100).toFixed(0)}% of taxable amount`, rate: (data.rate * 100).toFixed(0) + '%', amount: data.totalIHT, highlight: true });
    rows.push({ component: 'Beneficiaries Receive', calculation: 'Net estate minus IHT & donations', rate: '—', amount: data.beneficiariesReceive, highlight: true });
  }

  tbody.innerHTML = '';
  rows.forEach(row => {
    const tr = document.createElement('tr');
    if (row.highlight) tr.classList.add('highlight-row');
    tr.innerHTML = `
      <td><strong>${row.component}</strong></td>
      <td>${row.calculation}</td>
      <td>${row.rate}</td>
      <td><strong>${row.amount < 0 ? '-' : ''}${formatCurrency(Math.abs(row.amount), 0)}</strong></td>
    `;
    tbody.appendChild(tr);
  });
}

// ---- Chart Switching ----
function switchIHTChart(chart) {
  document.querySelectorAll('.chart-tab').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.chart-container').forEach(c => c.classList.add('hidden'));

  document.querySelector(`[data-chart="${chart}"]`).classList.add('active');
  document.getElementById(chart + 'ChartContainer').classList.remove('hidden');
}

// ---- Quick Examples ----
function setIHTExample(property, savings, investments, status, children) {
  propertyValue.value = property;
  propertyValueSlider.value = Math.min(property, parseInt(propertyValueSlider.max));
  savingsValue.value = savings;
  savingsValueSlider.value = Math.min(savings, parseInt(savingsValueSlider.max));
  investmentsValue.value = investments;
  investmentsValueSlider.value = Math.min(investments, parseInt(investmentsValueSlider.max));
  otherAssetsValue.value = 0;
  maritalStatus.value = status;
  passToChildren.checked = children;
  giftsLast7.value = 0;
  giftsLast7Slider.value = 0;
  charitableDonation.value = 0;
  charitableDonationSlider.value = 0;
  liabilities.value = 0;
  liabilitiesSlider.value = 0;
  calculateIHT();
}

// ---- Reset ----
function resetIHTCalculator() {
  propertyValue.value = 350000;
  propertyValueSlider.value = 350000;
  savingsValue.value = 100000;
  savingsValueSlider.value = 100000;
  investmentsValue.value = 50000;
  investmentsValueSlider.value = 50000;
  otherAssetsValue.value = 0;
  maritalStatus.value = 'single';
  passToChildren.checked = true;
  giftsLast7.value = 0;
  giftsLast7Slider.value = 0;
  charitableDonation.value = 0;
  charitableDonationSlider.value = 0;
  liabilities.value = 0;
  liabilitiesSlider.value = 0;
  calculateIHT();
}

// ---- PDF Export ----
function showEmailModal() {
  document.getElementById('emailModal').classList.add('active');
}

function closeEmailModal() {
  document.getElementById('emailModal').classList.remove('active');
}

async function generateIHTPDF(event) {
  event.preventDefault();

  const email = document.getElementById('userEmail').value;
  if (!email || !document.getElementById('privacyConsent').checked) {
    alert('Please provide email and accept privacy policy');
    return;
  }

  const btn = event.target.querySelector('button[type="submit"]');
  btn.textContent = 'Generating...';
  btn.disabled = true;

  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text('UK Financial Hub', 20, 20);
    doc.setFontSize(16);
    doc.text('Inheritance Tax Report', 20, 30);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, 20, 40);
    doc.text(`Email: ${email}`, 20, 46);

    const iht = document.getElementById('totalIHT').textContent;
    const estate = document.getElementById('grossEstateDisplay').textContent;
    const nrb = document.getElementById('nilRateDisplay').textContent;
    const taxable = document.getElementById('taxableDisplay').textContent;
    const beneficiaries = document.getElementById('beneficiariesReceive').textContent;

    doc.setFontSize(14);
    doc.text('Estate Summary', 20, 60);
    doc.setFontSize(10);
    doc.text(`Gross Estate: ${estate}`, 20, 70);
    doc.text(`Tax-Free Allowance: ${nrb}`, 20, 76);
    doc.text(`Taxable Amount: ${taxable}`, 20, 82);
    doc.text(`Inheritance Tax Due: ${iht}`, 20, 88);
    doc.text(`Beneficiaries Receive: ${beneficiaries}`, 20, 94);

    doc.setFontSize(8);
    doc.text('This is for guidance only. Consult a qualified estate planner or solicitor.', 20, 280);

    doc.save(`iht-report-${Date.now()}.pdf`);
    closeEmailModal();
    alert('PDF generated! Check downloads.');
  } catch (error) {
    alert('Error generating PDF');
  } finally {
    btn.textContent = 'Generate & Download PDF';
    btn.disabled = false;
  }
}

window.onclick = function(event) {
  if (event.target === document.getElementById('emailModal')) closeEmailModal();
};

// ---- Taper Relief Calculator (for 7-year rule info) ----
function getTaperRelief(yearsSinceGift) {
  for (const band of TAPER_RELIEF) {
    if (yearsSinceGift >= band.yearsMin && yearsSinceGift < band.yearsMax) {
      return band.relief;
    }
  }
  return 1.0;
}

// ---- Initial Calculation ----
document.addEventListener('DOMContentLoaded', calculateIHT);
