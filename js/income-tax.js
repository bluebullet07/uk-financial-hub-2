// ==========================================================================
// Income Tax Calculator Logic
// ==========================================================================

let taxBreakdownChart = null;
let taxBandsChart = null;

// Get DOM elements
const salary = document.getElementById('salary');
const salarySlider = document.getElementById('salarySlider');
const region = document.getElementById('region');
const pension = document.getElementById('pension');
const pensionSlider = document.getElementById('pensionSlider');
const studentLoan = document.getElementById('studentLoan');
const otherIncome = document.getElementById('otherIncome');

// Sync sliders
syncSliderAndInput(salarySlider, salary);
syncSliderAndInput(pensionSlider, pension);

// Update salary slider max if needed
salary.addEventListener('input', () => {
  const sal = parseFloat(salary.value) || 0;
  if (sal > 150000) {
    salarySlider.max = Math.min(sal + 50000, 500000);
  }
});

// Add event listeners
[salary, region, pension, studentLoan, otherIncome].forEach(el => {
  el.addEventListener('input', calculateTax);
});

// Student loan thresholds for 2025/26
const STUDENT_LOAN_THRESHOLDS = {
  plan1: { threshold: 24990, rate: 0.09 },
  plan2: { threshold: 27295, rate: 0.09 },
  plan4: { threshold: 31395, rate: 0.09 },
  postgrad: { threshold: 21000, rate: 0.06 }
};

/**
 * Main tax calculation function
 */
function calculateTax() {
  const grossSalary = parseFloat(salary.value) || 0;
  const regionValue = region.value;
  const monthlyPension = parseFloat(pension.value) || 0;
  const annualPension = monthlyPension * 12;
  const otherInc = parseFloat(otherIncome.value) || 0;
  const studentLoanPlan = studentLoan.value;
  
  // Update pension display
  document.getElementById('pensionAnnual').textContent = formatNumber(annualPension, 0);
  const pensionPercent = grossSalary > 0 ? ((annualPension / grossSalary) * 100).toFixed(1) : 0;
  document.getElementById('pensionPercent').textContent = pensionPercent;
  
  // Total income
  const totalIncome = grossSalary + otherInc;
  
  // Taxable income (after pension)
  const taxableIncome = Math.max(0, totalIncome - annualPension);
  
  // Calculate income tax
  const taxBands = UK_TAX_BANDS[regionValue];
  const { tax: incomeTax, breakdown: taxBreakdown } = calculateIncomeTax(taxableIncome, taxBands);
  
  // Calculate National Insurance
  const { ni: nationalInsurance, breakdown: niBreakdown } = calculateNI(grossSalary);
  
  // Calculate student loan
  const studentLoanRepayment = calculateStudentLoan(grossSalary, studentLoanPlan);
  
  // Calculate net income
  const annualNet = grossSalary - incomeTax - nationalInsurance - annualPension - studentLoanRepayment;
  const monthlyNet = annualNet / 12;
  const monthlyGross = grossSalary / 12;
  
  // Effective tax rate
  const totalDeductions = incomeTax + nationalInsurance;
  const effectiveRate = grossSalary > 0 ? ((totalDeductions / grossSalary) * 100).toFixed(1) : 0;
  
  // Display results
  displayTaxResults({
    monthlyGross,
    monthlyNet,
    annualNet,
    incomeTax,
    nationalInsurance,
    annualPension,
    studentLoanRepayment,
    effectiveRate,
    taxBreakdown,
    niBreakdown
  });
  
  // Update charts
  updateTaxCharts(taxableIncome, incomeTax, nationalInsurance, annualPension, studentLoanRepayment, taxBreakdown);
  
  // Update tables
  updateTaxBandTable(taxBreakdown);
  updateNIBandTable(niBreakdown);
}

/**
 * Calculate income tax with breakdown
 */
function calculateIncomeTax(income, taxBands) {
  let tax = 0;
  const breakdown = [];
  
  for (const band of taxBands.bands) {
    if (income > band.min) {
      const taxableInBand = Math.min(income, band.max) - band.min;
      const bandTax = taxableInBand * band.rate;
      tax += bandTax;
      
      if (bandTax > 0 || band.rate === 0) {
        breakdown.push({
          name: band.name,
          min: band.min,
          max: band.max === Infinity ? 'No limit' : band.max,
          rate: (band.rate * 100).toFixed(0) + '%',
          taxableIncome: taxableInBand,
          taxPaid: bandTax
        });
      }
    }
  }
  
  return { tax, breakdown };
}

/**
 * Calculate National Insurance with breakdown
 */
function calculateNI(grossSalary) {
  let ni = 0;
  const breakdown = [];
  
  for (const band of NI_BANDS.class1.primary) {
    if (grossSalary > band.min) {
      const niableInBand = Math.min(grossSalary, band.max) - band.min;
      const bandNI = niableInBand * band.rate;
      ni += bandNI;
      
      if (bandNI > 0 || band.rate === 0) {
        breakdown.push({
          min: band.min,
          max: band.max === Infinity ? 'No limit' : band.max,
          rate: (band.rate * 100).toFixed(0) + '%',
          niPaid: bandNI
        });
      }
    }
  }
  
  return { ni, breakdown };
}

/**
 * Calculate student loan repayment
 */
function calculateStudentLoan(grossSalary, plan) {
  if (plan === 'none') return 0;
  
  const loanDetails = STUDENT_LOAN_THRESHOLDS[plan];
  if (!loanDetails) return 0;
  
  const repayableIncome = Math.max(0, grossSalary - loanDetails.threshold);
  return repayableIncome * loanDetails.rate;
}

/**
 * Display tax results
 */
function displayTaxResults(results) {
  document.getElementById('monthlyTakeHome').textContent = formatCurrency(results.monthlyNet);
  document.getElementById('annualTakeHome').textContent = formatCurrency(results.annualNet);
  document.getElementById('incomeTax').textContent = formatCurrency(results.incomeTax);
  document.getElementById('nationalInsurance').textContent = formatCurrency(results.nationalInsurance);
  document.getElementById('effectiveRate').textContent = results.effectiveRate + '%';
  
  // Update breakdown
  document.getElementById('monthlyGross').textContent = formatCurrency(results.monthlyGross);
  document.getElementById('monthlyTax').textContent = '-' + formatCurrency(results.incomeTax / 12);
  document.getElementById('monthlyNI').textContent = '-' + formatCurrency(results.nationalInsurance / 12);
  document.getElementById('monthlyNet').textContent = formatCurrency(results.monthlyNet);
  
  // Show/hide pension row
  const pensionRow = document.getElementById('pensionRow');
  if (results.annualPension > 0) {
    pensionRow.classList.remove('hidden');
    document.getElementById('monthlyPension').textContent = '-' + formatCurrency(results.annualPension / 12);
  } else {
    pensionRow.classList.add('hidden');
  }
  
  // Show/hide student loan row
  const studentLoanRow = document.getElementById('studentLoanRow');
  if (results.studentLoanRepayment > 0) {
    studentLoanRow.classList.remove('hidden');
    document.getElementById('monthlyStudentLoan').textContent = '-' + formatCurrency(results.studentLoanRepayment / 12);
  } else {
    studentLoanRow.classList.add('hidden');
  }
  
  // Update subtext
  const totalDeductions = results.incomeTax + results.nationalInsurance + results.annualPension + results.studentLoanRepayment;
  const takeHomePercent = ((results.annualNet / (results.monthlyGross * 12)) * 100).toFixed(1);
  document.getElementById('takeHomeSubtext').textContent = `${takeHomePercent}% of gross salary`;
}

/**
 * Update tax charts
 */
function updateTaxCharts(income, tax, ni, pension, studentLoan, taxBreakdown) {
  updateTaxBreakdownChart(income, tax, ni, pension, studentLoan);
  updateTaxBandsChart(taxBreakdown);
}

/**
 * Update tax breakdown chart (pie/doughnut)
 */
function updateTaxBreakdownChart(income, tax, ni, pension, studentLoan) {
  const ctx = document.getElementById('taxBreakdownChart');
  if (!ctx) return;
  
  if (taxBreakdownChart) {
    taxBreakdownChart.destroy();
  }
  
  const netIncome = income - tax - ni - pension - studentLoan;
  
  const data = [netIncome, tax, ni];
  const labels = ['Take-Home Pay', 'Income Tax', 'National Insurance'];
  const colors = ['#10b981', '#ef4444', '#f59e0b'];
  
  if (pension > 0) {
    data.push(pension);
    labels.push('Pension');
    colors.push('#6366f1');
  }
  
  if (studentLoan > 0) {
    data.push(studentLoan);
    labels.push('Student Loan');
    colors.push('#8b5cf6');
  }
  
  taxBreakdownChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors,
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 15,
            font: { size: 12 }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = formatCurrency(context.parsed);
              const percent = ((context.parsed / income) * 100).toFixed(1);
              return context.label + ': ' + value + ' (' + percent + '%)';
            }
          }
        }
      }
    }
  });
}

/**
 * Update tax bands chart (bar)
 */
function updateTaxBandsChart(breakdown) {
  const ctx = document.getElementById('taxBandsChart');
  if (!ctx) return;
  
  if (taxBandsChart) {
    taxBandsChart.destroy();
  }
  
  const labels = breakdown.map(b => b.name);
  const taxPaid = breakdown.map(b => b.taxPaid);
  
  taxBandsChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Tax Paid',
        data: taxPaid,
        backgroundColor: '#2563eb',
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) {
              return 'Tax: ' + formatCurrency(context.parsed.y);
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return '£' + (value / 1000).toFixed(0) + 'k';
            }
          }
        }
      }
    }
  });
}

/**
 * Switch between chart views
 */
function switchTaxChart(chartType) {
  document.querySelectorAll('.chart-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  event.target.classList.add('active');
  
  if (chartType === 'breakdown') {
    document.getElementById('breakdownChartContainer').classList.remove('hidden');
    document.getElementById('bandsChartContainer').classList.add('hidden');
  } else {
    document.getElementById('breakdownChartContainer').classList.add('hidden');
    document.getElementById('bandsChartContainer').classList.remove('hidden');
  }
}

/**
 * Update tax band table
 */
function updateTaxBandTable(breakdown) {
  const tbody = document.getElementById('taxBandTableBody');
  tbody.innerHTML = '';
  
  breakdown.forEach(band => {
    const row = tbody.insertRow();
    row.innerHTML = `
      <td><strong>${band.name}</strong></td>
      <td>£${formatNumber(band.min, 0)} - ${band.max === 'No limit' ? 'No limit' : '£' + formatNumber(band.max, 0)}</td>
      <td>${band.rate}</td>
      <td>£${formatNumber(band.taxableIncome, 0)}</td>
      <td><strong>£${formatNumber(band.taxPaid, 0)}</strong></td>
    `;
    
    if (band.name.includes('Personal Allowance')) {
      row.style.backgroundColor = '#f0fdf4';
    }
  });
}

/**
 * Update NI band table
 */
function updateNIBandTable(breakdown) {
  const tbody = document.getElementById('niBandTableBody');
  tbody.innerHTML = '';
  
  breakdown.forEach(band => {
    const row = tbody.insertRow();
    row.innerHTML = `
      <td>NI Band</td>
      <td>£${formatNumber(band.min, 0)} - ${band.max === 'No limit' ? 'No limit' : '£' + formatNumber(band.max, 0)}</td>
      <td>${band.rate}</td>
      <td><strong>£${formatNumber(band.niPaid, 0)}</strong></td>
    `;
  });
}

/**
 * Show email modal
 */
function showEmailModal() {
  document.getElementById('emailModal').classList.add('active');
}

/**
 * Close email modal
 */
function closeEmailModal() {
  document.getElementById('emailModal').classList.remove('active');
}

/**
 * Generate PDF report
 */
async function generateTaxPDF(event) {
  event.preventDefault();
  
  const email = document.getElementById('userEmail').value;
  const consent = document.getElementById('privacyConsent').checked;
  
  if (!email || !consent) {
    alert('Please provide your email and accept the privacy policy');
    return;
  }
  
  const submitBtn = event.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Generating PDF...';
  submitBtn.disabled = true;
  
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('UK Financial Hub', 20, 20);
    doc.setFontSize(16);
    doc.text('Income Tax Report 2025/26', 20, 30);
    
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, 20, 40);
    doc.text(`Email: ${email}`, 20, 46);
    
    // Income details
    doc.setFontSize(14);
    doc.text('Income Details', 20, 60);
    doc.setFontSize(10);
    
    const sal = document.getElementById('salary').value;
    const reg = document.getElementById('region').options[document.getElementById('region').selectedIndex].text;
    
    let yPos = 70;
    doc.text(`Gross Salary: £${formatNumber(sal, 0)}`, 20, yPos);
    yPos += 6;
    doc.text(`Region: ${reg}`, 20, yPos);
    yPos += 10;
    
    // Results
    doc.setFontSize(14);
    doc.text('Tax Breakdown', 20, yPos);
    yPos += 10;
    doc.setFontSize(10);
    
    const monthlyTH = document.getElementById('monthlyTakeHome').textContent;
    const annualTH = document.getElementById('annualTakeHome').textContent;
    const tax = document.getElementById('incomeTax').textContent;
    const ni = document.getElementById('nationalInsurance').textContent;
    const effRate = document.getElementById('effectiveRate').textContent;
    
    doc.text(`Monthly Take-Home: ${monthlyTH}`, 20, yPos);
    yPos += 6;
    doc.text(`Annual Take-Home: ${annualTH}`, 20, yPos);
    yPos += 6;
    doc.text(`Income Tax: ${tax}`, 20, yPos);
    yPos += 6;
    doc.text(`National Insurance: ${ni}`, 20, yPos);
    yPos += 6;
    doc.text(`Effective Tax Rate: ${effRate}`, 20, yPos);
    yPos += 10;
    
    // Disclaimer
    doc.setFontSize(8);
    doc.text('Disclaimer: This report is for guidance only based on 2025/26 tax rates.', 20, 280);
    doc.text('Not financial or tax advice. Consult HMRC or a tax advisor for specific situations.', 20, 285);
    
    doc.save(`tax-report-${Date.now()}.pdf`);
    closeEmailModal();
    alert('PDF generated successfully! Check your downloads folder.');
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Error generating PDF. Please try again.');
  } finally {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
}

/**
 * Reset calculator
 */
function resetTaxCalculator() {
  salary.value = 50000;
  salarySlider.value = 50000;
  region.value = 'england';
  pension.value = 0;
  pensionSlider.value = 0;
  studentLoan.value = 'none';
  otherIncome.value = 0;
  
  calculateTax();
}

// Close modal on outside click
window.onclick = function(event) {
  const modal = document.getElementById('emailModal');
  if (event.target === modal) {
    closeEmailModal();
  }
}

// Initial calculation
document.addEventListener('DOMContentLoaded', calculateTax);
