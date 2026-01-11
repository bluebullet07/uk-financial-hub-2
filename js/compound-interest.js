let growthChart = null, breakdownChart = null, yearlyData = [];

const principal = document.getElementById('principal');
const principalSlider = document.getElementById('principalSlider');
const monthly = document.getElementById('monthly');
const monthlySlider = document.getElementById('monthlySlider');
const rate = document.getElementById('rate');
const rateSlider = document.getElementById('rateSlider');
const years = document.getElementById('years');
const frequency = document.getElementById('frequency');

syncSliderAndInput(principalSlider, principal);
syncSliderAndInput(monthlySlider, monthly);
syncSliderAndInput(rateSlider, rate);

[principal, monthly, rate, years, frequency].forEach(el => el.addEventListener('input', calculate));

function calculate() {
  const P = parseFloat(principal.value) || 0;
  const monthlyContrib = parseFloat(monthly.value) || 0;
  const r = (parseFloat(rate.value) || 0) / 100;
  const t = parseInt(years.value) || 10;
  const n = parseInt(frequency.value) || 12;
  
  yearlyData = [];
  let balance = P;
  let totalContrib = P;
  const monthlyRate = r / 12;
  
  for (let year = 0; year <= t; year++) {
    if (year > 0) {
      for (let month = 0; month < 12; month++) {
        balance = balance * (1 + monthlyRate) + monthlyContrib;
        totalContrib += monthlyContrib;
      }
    }
    yearlyData.push({
      year: year,
      balance: balance,
      contributions: totalContrib,
      interest: balance - totalContrib
    });
  }
  
  const final = yearlyData[yearlyData.length - 1];
  const interest = final.interest;
  const effectiveRate = totalContrib > 0 ? ((interest / totalContrib) * 100).toFixed(1) : 0;
  const multiple = P > 0 ? (final.balance / P).toFixed(2) : 0;
  
  document.getElementById('finalBalance').textContent = formatCurrency(final.balance);
  document.getElementById('totalContributions').textContent = formatCurrency(totalContrib);
  document.getElementById('interestEarned').textContent = formatCurrency(interest);
  document.getElementById('effectiveRate').textContent = effectiveRate + '%';
  document.getElementById('growthMultiple').textContent = multiple + 'x';
  document.getElementById('subtitle').textContent = `After ${t} years at ${rate.value}%`;
  
  updateCharts();
  updateTable();
}

function updateCharts() {
  const ctx1 = document.getElementById('growthChart');
  if (growthChart) growthChart.destroy();
  
  growthChart = new Chart(ctx1, {
    type: 'line',
    data: {
      labels: yearlyData.map(d => `Year ${d.year}`),
      datasets: [{
        label: 'Balance',
        data: yearlyData.map(d => d.balance),
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          ticks: {
            callback: function(value) {
              return '£' + (value / 1000).toFixed(0) + 'k';
            }
          }
        }
      }
    }
  });
  
  const ctx2 = document.getElementById('breakdownChart');
  if (breakdownChart) breakdownChart.destroy();
  
  const final = yearlyData[yearlyData.length - 1];
  breakdownChart = new Chart(ctx2, {
    type: 'doughnut',
    data: {
      labels: ['Contributions', 'Interest Earned'],
      datasets: [{
        data: [final.contributions, final.interest],
        backgroundColor: ['#3b82f6', '#10b981'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' },
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

function switchChart(type) {
  document.querySelectorAll('.chart-tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  
  if (type === 'growth') {
    document.getElementById('growthChartContainer').classList.remove('hidden');
    document.getElementById('breakdownChartContainer').classList.add('hidden');
  } else {
    document.getElementById('growthChartContainer').classList.add('hidden');
    document.getElementById('breakdownChartContainer').classList.remove('hidden');
  }
}

function updateTable() {
  const tbody = document.getElementById('growthTableBody');
  tbody.innerHTML = '';
  yearlyData.forEach(d => {
    const row = tbody.insertRow();
    row.innerHTML = `
      <td>${d.year}</td>
      <td><strong>${formatCurrency(d.balance)}</strong></td>
      <td>${formatCurrency(d.contributions)}</td>
      <td>${formatCurrency(d.interest)}</td>
    `;
  });
}

function exportCSV() {
  let csv = 'Year,Balance,Contributions,Interest\n';
  yearlyData.forEach(d => {
    csv += `${d.year},${d.balance.toFixed(2)},${d.contributions.toFixed(2)},${d.interest.toFixed(2)}\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'compound-interest.csv';
  a.click();
  window.URL.revokeObjectURL(url);
}

function showEmailModal() {
  document.getElementById('emailModal').classList.add('active');
}

function closeEmailModal() {
  document.getElementById('emailModal').classList.remove('active');
}

function generatePDF(event) {
  event.preventDefault();
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text('Compound Interest Report', 20, 20);
  doc.text(`Final Balance: ${document.getElementById('finalBalance').textContent}`, 20, 30);
  doc.save('compound-interest.pdf');
  closeEmailModal();
  alert('PDF generated!');
}

function resetCompoundCalculator() {
  principal.value = 10000;
  principalSlider.value = 10000;
  monthly.value = 200;
  monthlySlider.value = 200;
  rate.value = 5;
  rateSlider.value = 5;
  years.value = 10;
  frequency.value = 12;
  calculate();
}

window.onclick = function(e) {
  if (e.target === document.getElementById('emailModal')) closeEmailModal();
}

document.addEventListener('DOMContentLoaded', calculate);
