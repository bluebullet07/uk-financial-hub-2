let investmentChart = null;

const lumpSum = document.getElementById('lumpSum');
const monthlyInv = document.getElementById('monthlyInv');
const returnRate = document.getElementById('returnRate');
const period = document.getElementById('period');

[lumpSum, monthlyInv, returnRate, period].forEach(el => el.addEventListener('input', calculateInvestment));

function calculateInvestment() {
  const initial = parseFloat(lumpSum.value) || 0;
  const monthly = parseFloat(monthlyInv.value) || 0;
  const rate = (parseFloat(returnRate.value) || 0) / 100;
  const years = parseInt(period.value) || 10;
  
  let balance = initial;
  const monthlyRate = rate / 12;
  const yearlyData = [{ year: 0, balance: initial }];
  
  for (let year = 1; year <= years; year++) {
    for (let month = 0; month < 12; month++) {
      balance = balance * (1 + monthlyRate) + monthly;
    }
    yearlyData.push({ year: year, balance: balance });
  }
  
  const totalInvested = initial + (monthly * 12 * years);
  const totalReturns = balance - totalInvested;
  
  document.getElementById('finalValue').textContent = formatCurrency(balance);
  document.getElementById('totalInvested').textContent = formatCurrency(totalInvested);
  document.getElementById('totalReturns').textContent = formatCurrency(totalReturns);
  
  updateChart(yearlyData);
}

function updateChart(data) {
  const ctx = document.getElementById('investmentChart');
  if (investmentChart) investmentChart.destroy();
  
  investmentChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map(d => `Year ${d.year}`),
      datasets: [{
        label: 'Investment Value',
        data: data.map(d => d.balance),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#B4B4BC' }, grid: { color: '#27272a' } },
        y: {
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

function resetInvestmentCalc() {
  lumpSum.value = 10000;
  monthlyInv.value = 500;
  returnRate.value = 7;
  period.value = 10;
  calculateInvestment();
}

document.addEventListener('DOMContentLoaded', calculateInvestment);
