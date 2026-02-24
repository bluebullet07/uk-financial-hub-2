// ==========================================================================
// Mortgage Calculator Logic
// ==========================================================================

let mortgageChart = null;

// Get DOM elements
const propertyPrice = document.getElementById('propertyPrice');
const propertyPriceSlider = document.getElementById('propertyPriceSlider');
const deposit = document.getElementById('deposit');
const depositSlider = document.getElementById('depositSlider');
const mortgageTerm = document.getElementById('mortgageTerm');
const interestRate = document.getElementById('interestRate');
const interestRateSlider = document.getElementById('interestRateSlider');
const mortgageType = document.getElementById('mortgageType');
const overpayment = document.getElementById('overpayment');

// Sync sliders with inputs
syncSliderAndInput(propertyPriceSlider, propertyPrice);
syncSliderAndInput(depositSlider, deposit);
syncSliderAndInput(interestRateSlider, interestRate);

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
[deposit, mortgageTerm, interestRate, mortgageType, overpayment].forEach(element => {
  element.addEventListener('input', calculateMortgage);
});

/**
 * Calculate mortgage payments and display results
 */
function calculateMortgage() {
  // Get values
  const price = parseFloat(propertyPrice.value) || 0;
  const dep = parseFloat(deposit.value) || 0;
  const loanAmount = price - dep;
  const term = parseInt(mortgageTerm.value) || 25;
  const rate = parseFloat(interestRate.value) || 0;
  const type = mortgageType.value;
  const extra = parseFloat(overpayment.value) || 0;
  
  // Update deposit percentage
  const depPercentage = price > 0 ? ((dep / price) * 100).toFixed(1) : 0;
  document.getElementById('depositPercentage').textContent = `${depPercentage}%`;
  
  // Validate inputs
  if (loanAmount <= 0 || rate <= 0) {
    displayResults(0, 0, 0, loanAmount, 0, 0, 0);
    return;
  }
  
  // Calculate based on mortgage type
  if (type === 'repayment') {
    calculateRepaymentMortgage(loanAmount, rate, term, extra);
  } else {
    calculateInterestOnlyMortgage(loanAmount, rate, term, extra);
  }
}

/**
 * Calculate repayment mortgage
 */
function calculateRepaymentMortgage(principal, annualRate, years, monthlyExtra) {
  const monthlyRate = annualRate / 100 / 12;
  const numberOfPayments = years * 12;
  
  // Monthly payment formula: P * (r * (1 + r)^n) / ((1 + r)^n - 1)
  const monthlyPayment = principal * 
    (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
    (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
  
  const totalPayment = monthlyPayment * numberOfPayments;
  const totalInterest = totalPayment - principal;
  
  // Calculate with overpayments
  let overpaymentResults = null;
  if (monthlyExtra > 0) {
    overpaymentResults = calculateOverpaymentSavings(
      principal, 
      monthlyPayment, 
      monthlyExtra, 
      monthlyRate, 
      numberOfPayments
    );
  }
  
  displayResults(
    monthlyPayment, 
    totalPayment, 
    totalInterest, 
    principal,
    overpaymentResults,
    annualRate,
    years
  );
  
  updateChart(principal, totalInterest, monthlyPayment, years);
}

/**
 * Calculate interest-only mortgage
 */
function calculateInterestOnlyMortgage(principal, annualRate, years, monthlyExtra) {
  const monthlyInterest = principal * (annualRate / 100 / 12);
  const totalPayment = (monthlyInterest * years * 12) + principal;
  const totalInterest = totalPayment - principal;
  
  displayResults(
    monthlyInterest, 
    totalPayment, 
    totalInterest, 
    principal,
    null,
    annualRate,
    years
  );
  
  updateChart(principal, totalInterest, monthlyInterest, years);
}

/**
 * Calculate overpayment savings
 */
function calculateOverpaymentSavings(principal, monthlyPayment, overpayment, monthlyRate, totalMonths) {
  const newMonthlyPayment = monthlyPayment + overpayment;
  
  let balance = principal;
  let monthsPaid = 0;
  let totalInterestPaid = 0;
  
  while (balance > 0 && monthsPaid < totalMonths) {
    const interestCharge = balance * monthlyRate;
    const principalPayment = newMonthlyPayment - interestCharge;
    
    if (principalPayment <= 0) break;
    
    balance -= principalPayment;
    totalInterestPaid += interestCharge;
    monthsPaid++;
  }
  
  const originalInterest = (monthlyPayment * totalMonths) - principal;
  const interestSaved = originalInterest - totalInterestPaid;
  const monthsSaved = totalMonths - monthsPaid;
  const yearsSaved = Math.floor(monthsSaved / 12);
  const monthsRemaining = monthsSaved % 12;
  
  return {
    monthsSaved: monthsSaved,
    yearsSaved: yearsSaved,
    monthsRemaining: monthsRemaining,
    interestSaved: interestSaved,
    newTermMonths: monthsPaid
  };
}

/**
 * Display calculation results
 */
function displayResults(monthly, total, interest, loan, overpaymentResults, rate, years) {
  document.getElementById('monthlyPayment').textContent = formatCurrency(monthly);
  document.getElementById('loanAmount').textContent = formatCurrency(loan);
  document.getElementById('totalInterest').textContent = formatCurrency(interest);
  document.getElementById('totalRepayment').textContent = formatCurrency(total);
  
  // Update subtext
  const subtext = document.getElementById('paymentSubtext');
  if (mortgageType.value === 'interestOnly') {
    subtext.textContent = 'Interest only + balloon payment of ' + formatCurrency(loan) + ' at end';
  } else {
    subtext.textContent = `Over ${years} years at ${rate}% interest`;
  }
  
  // Display overpayment results if applicable
  const overpaymentDiv = document.getElementById('overpaymentResults');
  if (overpaymentResults && overpaymentResults.monthsSaved > 0) {
    overpaymentDiv.classList.remove('hidden');
    
    let timeSavedText = '';
    if (overpaymentResults.yearsSaved > 0) {
      timeSavedText = `${overpaymentResults.yearsSaved} year${overpaymentResults.yearsSaved > 1 ? 's' : ''}`;
      if (overpaymentResults.monthsRemaining > 0) {
        timeSavedText += ` ${overpaymentResults.monthsRemaining} month${overpaymentResults.monthsRemaining > 1 ? 's' : ''}`;
      }
    } else {
      timeSavedText = `${overpaymentResults.monthsRemaining} month${overpaymentResults.monthsRemaining > 1 ? 's' : ''}`;
    }
    
    document.getElementById('timeSaved').textContent = timeSavedText;
    document.getElementById('interestSaved').textContent = formatCurrency(overpaymentResults.interestSaved);
  } else {
    overpaymentDiv.classList.add('hidden');
  }
}

/**
 * Update mortgage breakdown chart
 */
function updateChart(principal, interest, monthlyPayment, years) {
  const ctx = document.getElementById('mortgageChart');
  if (!ctx) return;
  
  // Destroy existing chart
  if (mortgageChart) {
    mortgageChart.destroy();
  }
  
  // Create new chart
  mortgageChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Principal', 'Interest'],
      datasets: [{
        data: [principal, interest],
        backgroundColor: [
          '#2563eb',
          '#10b981'
        ],
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
            color: '#B4B4BC',
            padding: 20,
            font: {
              size: 14
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = formatCurrency(context.parsed);
              return label + ': ' + value;
            }
          }
        }
      }
    }
  });
}

/**
 * Reset calculator to default values
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
  overpayment.value = 0;
  
  calculateMortgage();
}

// Initial calculation on page load
document.addEventListener('DOMContentLoaded', () => {
  calculateMortgage();
});
