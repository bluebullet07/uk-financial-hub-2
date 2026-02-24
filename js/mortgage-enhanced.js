// ==========================================================================
// Enhanced Mortgage Calculator Logic
// ==========================================================================

let breakdownChart = null;
let timelineChart = null;
let mortgageData = {
  schedule: [],
  overpaymentSchedule: []
};

// Get DOM elements
const propertyPrice = document.getElementById('propertyPrice');
const propertyPriceSlider = document.getElementById('propertyPriceSlider');
const deposit = document.getElementById('deposit');
const depositSlider = document.getElementById('depositSlider');
const mortgageTerm = document.getElementById('mortgageTerm');
const interestRate = document.getElementById('interestRate');
const interestRateSlider = document.getElementById('interestRateSlider');
const mortgageType = document.getElementById('mortgageType');
const monthlyOverpayment = document.getElementById('monthlyOverpayment');
const monthlyOverpaymentSlider = document.getElementById('monthlyOverpaymentSlider');
const lumpSumPayment = document.getElementById('lumpSumPayment');
const lumpSumSlider = document.getElementById('lumpSumSlider');
const lumpSumYear = document.getElementById('lumpSumYear');

// Sync sliders with inputs
syncSliderAndInput(propertyPriceSlider, propertyPrice);
syncSliderAndInput(depositSlider, deposit);
syncSliderAndInput(interestRateSlider, interestRate);
syncSliderAndInput(monthlyOverpaymentSlider, monthlyOverpayment);
syncSliderAndInput(lumpSumSlider, lumpSumPayment);

// Update deposit slider max based on property price
propertyPrice.addEventListener('input', () => {
  const price = parseFloat(propertyPrice.value) || 0;
  depositSlider.max = price;
  if (parseFloat(deposit.value) > price) {
    deposit.value = price;
    depositSlider.value = price;
  }
  calculateMortgage();
});

// Add event listeners for real-time calculation
[deposit, mortgageTerm, interestRate, mortgageType, monthlyOverpayment, lumpSumPayment, lumpSumYear].forEach(element => {
  element.addEventListener('input', calculateMortgage);
});

/**
 * Main calculation function
 */
function calculateMortgage() {
  // Get values
  const price = parseFloat(propertyPrice.value) || 0;
  const dep = parseFloat(deposit.value) || 0;
  const loanAmount = price - dep;
  const term = parseInt(mortgageTerm.value) || 25;
  const rate = parseFloat(interestRate.value) || 0;
  const type = mortgageType.value;
  const monthlyExtra = parseFloat(monthlyOverpayment.value) || 0;
  const lumpSum = parseFloat(lumpSumPayment.value) || 0;
  const lumpSumYearValue = parseInt(lumpSumYear.value) || 0;
  
  // Update deposit and LTV percentages
  const depPercentage = price > 0 ? ((dep / price) * 100).toFixed(1) : 0;
  const ltvPercentage = price > 0 ? (((price - dep) / price) * 100).toFixed(1) : 0;
  document.getElementById('depositPercentage').textContent = `${depPercentage}%`;
  document.getElementById('ltvPercentage').textContent = `${ltvPercentage}%`;
  
  // Validate inputs
  if (loanAmount <= 0 || rate <= 0) {
    displayResults(0, 0, 0, loanAmount, null);
    return;
  }
  
  // Calculate based on mortgage type
  if (type === 'repayment') {
    calculateRepaymentMortgage(loanAmount, rate, term, monthlyExtra, lumpSum, lumpSumYearValue);
  } else {
    calculateInterestOnlyMortgage(loanAmount, rate, term);
  }
}

/**
 * Calculate repayment mortgage with detailed schedule
 */
function calculateRepaymentMortgage(principal, annualRate, years, monthlyExtra, lumpSum, lumpSumYearValue) {
  const monthlyRate = annualRate / 100 / 12;
  const numberOfPayments = years * 12;
  
  // Standard monthly payment (without overpayments)
  const monthlyPayment = principal * 
    (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
    (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
  
  // Generate detailed payment schedule WITHOUT overpayments
  const standardSchedule = generatePaymentSchedule(principal, monthlyPayment, 0, 0, 0, monthlyRate, numberOfPayments);
  mortgageData.schedule = standardSchedule;
  
  // Calculate WITH overpayments if applicable
  let overpaymentResults = null;
  if (monthlyExtra > 0 || lumpSum > 0) {
    const overpaymentSchedule = generatePaymentSchedule(
      principal, 
      monthlyPayment, 
      monthlyExtra, 
      lumpSum, 
      lumpSumYearValue, 
      monthlyRate, 
      numberOfPayments
    );
    mortgageData.overpaymentSchedule = overpaymentSchedule;
    
    const standardTotal = standardSchedule[standardSchedule.length - 1];
    const overpaymentTotal = overpaymentSchedule[overpaymentSchedule.length - 1];
    
    overpaymentResults = {
      monthsSaved: numberOfPayments - overpaymentSchedule.length,
      interestSaved: standardTotal.totalInterestPaid - overpaymentTotal.totalInterestPaid,
      newTermMonths: overpaymentSchedule.length,
      newPayoffDate: getPayoffDate(overpaymentSchedule.length)
    };
  }
  
  const totalPayment = monthlyPayment * numberOfPayments;
  const totalInterest = totalPayment - principal;
  
  displayResults(monthlyPayment, totalPayment, totalInterest, principal, overpaymentResults);
  updateCharts(standardSchedule, mortgageData.overpaymentSchedule);
  updatePaymentScheduleTable('yearly');
}

/**
 * Generate detailed payment schedule
 */
function generatePaymentSchedule(principal, monthlyPayment, monthlyExtra, lumpSum, lumpSumYearValue, monthlyRate, maxMonths) {
  let balance = principal;
  let month = 0;
  let totalInterestPaid = 0;
  const schedule = [];
  
  while (balance > 0 && month < maxMonths) {
    month++;
    
    // Calculate interest for this month
    const interestPayment = balance * monthlyRate;
    
    // Total payment this month (including overpayment)
    let payment = monthlyPayment + monthlyExtra;
    
    // Add lump sum if this is the right year
    if (month === lumpSumYearValue * 12) {
      payment += lumpSum;
    }
    
    // Calculate principal payment
    let principalPayment = payment - interestPayment;
    
    // Don't pay more than remaining balance
    if (principalPayment > balance) {
      principalPayment = balance;
      payment = balance + interestPayment;
    }
    
    // Update balance and totals
    balance -= principalPayment;
    totalInterestPaid += interestPayment;
    
    // Store this month's data
    schedule.push({
      month: month,
      payment: payment,
      principalPayment: principalPayment,
      interestPayment: interestPayment,
      remainingBalance: balance,
      totalInterestPaid: totalInterestPaid,
      year: Math.ceil(month / 12)
    });
    
    // Break if paid off
    if (balance <= 0) break;
  }
  
  return schedule;
}

/**
 * Calculate interest-only mortgage
 */
function calculateInterestOnlyMortgage(principal, annualRate, years) {
  const monthlyInterest = principal * (annualRate / 100 / 12);
  const totalPayment = (monthlyInterest * years * 12) + principal;
  const totalInterest = totalPayment - principal;
  
  displayResults(monthlyInterest, totalPayment, totalInterest, principal, null);
  
  // Simple schedule for interest-only
  const schedule = [];
  for (let i = 1; i <= years * 12; i++) {
    schedule.push({
      month: i,
      payment: monthlyInterest,
      principalPayment: 0,
      interestPayment: monthlyInterest,
      remainingBalance: principal,
      totalInterestPaid: monthlyInterest * i,
      year: Math.ceil(i / 12)
    });
  }
  mortgageData.schedule = schedule;
  updateCharts(schedule, []);
  updatePaymentScheduleTable('yearly');
}

/**
 * Display calculation results
 */
function displayResults(monthly, total, interest, loan, overpaymentResults) {
  document.getElementById('monthlyPayment').textContent = formatCurrency(monthly);
  document.getElementById('loanAmount').textContent = formatCurrency(loan);
  document.getElementById('totalInterest').textContent = formatCurrency(interest);
  document.getElementById('totalRepayment').textContent = formatCurrency(total);
  document.getElementById('rateType').textContent = mortgageType.value === 'repayment' ? 'Repayment' : 'Interest Only';
  
  // Update subtext
  const rate = parseFloat(interestRate.value);
  const term = parseInt(mortgageTerm.value);
  const subtext = document.getElementById('paymentSubtext');
  if (mortgageType.value === 'interestOnly') {
    subtext.textContent = 'Interest only + £' + formatNumber(loan, 0) + ' balloon payment at end';
  } else {
    subtext.textContent = `Over ${term} years at ${rate.toFixed(1)}% interest`;
  }
  
  // Display overpayment results
  const overpaymentDiv = document.getElementById('overpaymentSavings');
  if (overpaymentResults && (overpaymentResults.monthsSaved > 0 || overpaymentResults.interestSaved > 100)) {
    overpaymentDiv.classList.remove('hidden');
    
    const years = Math.floor(overpaymentResults.monthsSaved / 12);
    const months = overpaymentResults.monthsSaved % 12;
    let timeSavedText = '';
    
    if (years > 0) {
      timeSavedText = `${years} year${years > 1 ? 's' : ''}`;
      if (months > 0) {
        timeSavedText += ` ${months} month${months > 1 ? 's' : ''}`;
      }
    } else {
      timeSavedText = `${months} month${months > 1 ? 's' : ''}`;
    }
    
    document.getElementById('timeSaved').textContent = timeSavedText;
    document.getElementById('interestSaved').textContent = formatCurrency(overpaymentResults.interestSaved);
    document.getElementById('newPayoffDate').textContent = overpaymentResults.newPayoffDate;
  } else {
    overpaymentDiv.classList.add('hidden');
  }
}

/**
 * Get payoff date
 */
function getPayoffDate(months) {
  const today = new Date();
  const payoffDate = new Date(today);
  payoffDate.setMonth(payoffDate.getMonth() + months);
  
  const options = { year: 'numeric', month: 'short' };
  return payoffDate.toLocaleDateString('en-GB', options);
}

/**
 * Update charts
 */
function updateCharts(schedule, overpaymentSchedule) {
  updateBreakdownChart(schedule);
  updateTimelineChart(schedule, overpaymentSchedule);
}

/**
 * Update breakdown chart (doughnut)
 */
function updateBreakdownChart(schedule) {
  const ctx = document.getElementById('breakdownChart');
  if (!ctx) return;
  
  if (breakdownChart) {
    breakdownChart.destroy();
  }
  
  const lastEntry = schedule[schedule.length - 1];
  const principal = parseFloat(document.getElementById('loanAmount').textContent.replace(/[£,]/g, ''));
  const totalInterest = lastEntry.totalInterestPaid;
  
  breakdownChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Principal', 'Total Interest'],
      datasets: [{
        data: [principal, totalInterest],
        backgroundColor: ['#2563eb', '#10b981'],
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
            padding: 20,
            font: { size: 14 }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return context.label + ': ' + formatCurrency(context.parsed);
            }
          }
        }
      }
    }
  });
}

/**
 * Update timeline chart (line)
 */
function updateTimelineChart(schedule, overpaymentSchedule) {
  const ctx = document.getElementById('timelineChart');
  if (!ctx) return;
  
  if (timelineChart) {
    timelineChart.destroy();
  }
  
  // Group by year
  const yearlyData = [];
  const years = Math.ceil(schedule.length / 12);
  
  for (let year = 1; year <= years; year++) {
    const yearEnd = Math.min(year * 12, schedule.length) - 1;
    if (yearEnd >= 0 && schedule[yearEnd]) {
      yearlyData.push({
        year: year,
        balance: schedule[yearEnd].remainingBalance,
        interestPaid: schedule[yearEnd].totalInterestPaid
      });
    }
  }
  
  const datasets = [{
    label: 'Remaining Balance',
    data: yearlyData.map(d => d.balance),
    borderColor: '#2563eb',
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    fill: true,
    tension: 0.4,
    yAxisID: 'y'
  }];
  
  // Add overpayment comparison if exists
  if (overpaymentSchedule && overpaymentSchedule.length > 0) {
    const overpaymentYearlyData = [];
    const overpaymentYears = Math.ceil(overpaymentSchedule.length / 12);
    
    for (let year = 1; year <= overpaymentYears; year++) {
      const yearEnd = Math.min(year * 12, overpaymentSchedule.length) - 1;
      if (yearEnd >= 0 && overpaymentSchedule[yearEnd]) {
        overpaymentYearlyData.push({
          year: year,
          balance: overpaymentSchedule[yearEnd].remainingBalance
        });
      }
    }
    
    datasets.push({
      label: 'With Overpayments',
      data: overpaymentYearlyData.map(d => d.balance),
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      fill: true,
      tension: 0.4,
      yAxisID: 'y',
      borderDash: [5, 5]
    });
  }
  
  timelineChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: yearlyData.map(d => `Year ${d.year}`),
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            font: { size: 14 }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
            }
          }
        }
      },
      scales: {
        y: {
          type: 'linear',
          position: 'left',
          grid: { color: '#27272a' },
          ticks: {
            color: '#B4B4BC',
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
function switchChart(chartType) {
  // Update tab buttons
  document.querySelectorAll('.chart-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  event.target.classList.add('active');
  
  // Show/hide charts
  if (chartType === 'breakdown') {
    document.getElementById('breakdownChartContainer').classList.remove('hidden');
    document.getElementById('timelineChartContainer').classList.add('hidden');
  } else {
    document.getElementById('breakdownChartContainer').classList.add('hidden');
    document.getElementById('timelineChartContainer').classList.remove('hidden');
  }
}

/**
 * Update payment schedule table
 */
function updatePaymentScheduleTable(view, year = 1) {
  const tbody = document.getElementById('scheduleTableBody');
  tbody.innerHTML = '';
  
  const schedule = mortgageData.overpaymentSchedule.length > 0 ? 
    mortgageData.overpaymentSchedule : 
    mortgageData.schedule;
  
  if (schedule.length === 0) return;
  
  if (view === 'yearly') {
    // Show yearly summary
    const years = Math.ceil(schedule.length / 12);
    for (let y = 1; y <= years; y++) {
      const yearEnd = Math.min(y * 12, schedule.length) - 1;
      if (yearEnd >= 0) {
        const entry = schedule[yearEnd];
        const row = tbody.insertRow();
        row.innerHTML = `
          <td>Year ${y}</td>
          <td>${formatCurrency(entry.payment)}</td>
          <td>${formatCurrency(entry.principalPayment)}</td>
          <td>${formatCurrency(entry.interestPayment)}</td>
          <td><strong>${formatCurrency(entry.remainingBalance)}</strong></td>
          <td>${formatCurrency(entry.totalInterestPaid)}</td>
        `;
        
        if (y === 1 || y === years) {
          row.classList.add('highlight-row');
        }
      }
    }
  } else if (view === 'monthly') {
    // Show monthly for specified year
    const startMonth = (year - 1) * 12;
    const endMonth = Math.min(year * 12, schedule.length);
    
    for (let m = startMonth; m < endMonth; m++) {
      const entry = schedule[m];
      const row = tbody.insertRow();
      row.innerHTML = `
        <td>Month ${entry.month}</td>
        <td>${formatCurrency(entry.payment)}</td>
        <td>${formatCurrency(entry.principalPayment)}</td>
        <td>${formatCurrency(entry.interestPayment)}</td>
        <td>${formatCurrency(entry.remainingBalance)}</td>
        <td>${formatCurrency(entry.totalInterestPaid)}</td>
      `;
    }
  }
}

/**
 * Show schedule in different views
 */
function showSchedule(view, year) {
  updatePaymentScheduleTable(view, year);
}

/**
 * Export schedule to CSV
 */
function exportScheduleCSV() {
  const schedule = mortgageData.overpaymentSchedule.length > 0 ? 
    mortgageData.overpaymentSchedule : 
    mortgageData.schedule;
  
  if (schedule.length === 0) {
    alert('No schedule data to export');
    return;
  }
  
  let csv = 'Month,Payment,Principal,Interest,Remaining Balance,Total Interest Paid\n';
  
  schedule.forEach(entry => {
    csv += `${entry.month},${entry.payment.toFixed(2)},${entry.principalPayment.toFixed(2)},${entry.interestPayment.toFixed(2)},${entry.remainingBalance.toFixed(2)},${entry.totalInterestPaid.toFixed(2)}\n`;
  });
  
  // Create download
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'mortgage-schedule.csv';
  a.click();
  window.URL.revokeObjectURL(url);
}

/**
 * Toggle jargon card
 */
function toggleJargon(card) {
  const isActive = card.classList.contains('active');
  
  // Close all cards
  document.querySelectorAll('.jargon-card').forEach(c => {
    c.classList.remove('active');
  });
  
  // Open clicked card if it wasn't active
  if (!isActive) {
    card.classList.add('active');
  }
}

/**
 * Show email modal
 */
function showEmailModal() {
  const modal = document.getElementById('emailModal');
  modal.classList.add('active');
}

/**
 * Close email modal
 */
function closeEmailModal() {
  const modal = document.getElementById('emailModal');
  modal.classList.remove('active');
}

/**
 * Generate PDF report
 */
async function generatePDF(event) {
  event.preventDefault();
  
  const email = document.getElementById('userEmail').value;
  const consent = document.getElementById('privacyConsent').checked;
  
  if (!email || !consent) {
    alert('Please provide your email and accept the privacy policy');
    return;
  }
  
  // Show loading state
  const submitBtn = event.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Generating PDF...';
  submitBtn.disabled = true;
  
  try {
    // Use jsPDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Add content
    doc.setFontSize(20);
    doc.text('UK Financial Hub', 20, 20);
    doc.setFontSize(16);
    doc.text('Mortgage Calculation Report', 20, 30);
    
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-GB')}`, 20, 40);
    doc.text(`Email: ${email}`, 20, 46);
    
    // Add mortgage details
    doc.setFontSize(14);
    doc.text('Mortgage Details', 20, 60);
    doc.setFontSize(10);
    
    const price = document.getElementById('propertyPrice').value;
    const dep = document.getElementById('deposit').value;
    const loan = document.getElementById('loanAmount').textContent;
    const rate = document.getElementById('interestRate').value;
    const term = document.getElementById('mortgageTerm').value;
    const monthly = document.getElementById('monthlyPayment').textContent;
    const totalInt = document.getElementById('totalInterest').textContent;
    const totalPay = document.getElementById('totalRepayment').textContent;
    
    let yPos = 70;
    doc.text(`Property Price: £${formatNumber(price, 0)}`, 20, yPos);
    yPos += 6;
    doc.text(`Deposit: £${formatNumber(dep, 0)}`, 20, yPos);
    yPos += 6;
    doc.text(`Loan Amount: ${loan}`, 20, yPos);
    yPos += 6;
    doc.text(`Interest Rate: ${rate}%`, 20, yPos);
    yPos += 6;
    doc.text(`Term: ${term} years`, 20, yPos);
    yPos += 10;
    
    doc.setFontSize(14);
    doc.text('Results', 20, yPos);
    yPos += 10;
    doc.setFontSize(10);
    
    doc.text(`Monthly Payment: ${monthly}`, 20, yPos);
    yPos += 6;
    doc.text(`Total Interest: ${totalInt}`, 20, yPos);
    yPos += 6;
    doc.text(`Total Repayment: ${totalPay}`, 20, yPos);
    yPos += 10;
    
    // Add overpayment info if applicable
    const overpaymentDiv = document.getElementById('overpaymentSavings');
    if (!overpaymentDiv.classList.contains('hidden')) {
      doc.setFontSize(14);
      doc.text('Overpayment Savings', 20, yPos);
      yPos += 10;
      doc.setFontSize(10);
      
      const timeSaved = document.getElementById('timeSaved').textContent;
      const intSaved = document.getElementById('interestSaved').textContent;
      
      doc.text(`Time Saved: ${timeSaved}`, 20, yPos);
      yPos += 6;
      doc.text(`Interest Saved: ${intSaved}`, 20, yPos);
      yPos += 10;
    }
    
    // Add disclaimer
    doc.setFontSize(8);
    doc.text('Disclaimer: This report is for guidance only and does not constitute financial advice.', 20, 280);
    doc.text('Always consult with a qualified financial advisor before making decisions.', 20, 285);
    
    // Save PDF
    doc.save(`mortgage-report-${Date.now()}.pdf`);
    
    // Close modal
    closeEmailModal();
    
    // Show success message
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
function resetMortgageCalculator() {
  propertyPrice.value = 400000;
  propertyPriceSlider.value = 400000;
  deposit.value = 80000;
  depositSlider.value = 80000;
  mortgageTerm.value = 25;
  interestRate.value = 5.5;
  interestRateSlider.value = 5.5;
  mortgageType.value = 'repayment';
  monthlyOverpayment.value = 0;
  monthlyOverpaymentSlider.value = 0;
  lumpSumPayment.value = 0;
  lumpSumSlider.value = 0;
  lumpSumYear.value = 5;
  
  calculateMortgage();
}

// Close modal when clicking outside
window.onclick = function(event) {
  const modal = document.getElementById('emailModal');
  if (event.target === modal) {
    closeEmailModal();
  }
}

// Initial calculation on page load
document.addEventListener('DOMContentLoaded', () => {
  calculateMortgage();
});
