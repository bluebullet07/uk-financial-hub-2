let simpleChart = null;

const principal = document.getElementById('principal');
const rate = document.getElementById('rate');
const time = document.getElementById('time');

[principal, rate, time].forEach(el => el.addEventListener('input', calculateSimple));

function calculateSimple() {
  const P = parseFloat(principal.value) || 0;
  const R = (parseFloat(rate.value) || 0) / 100;
  const T = parseInt(time.value) || 5;
  
  const interest = P * R * T;
  const final = P + interest;
  
  document.getElementById('interest').textContent = formatCurrency(interest);
  document.getElementById('showPrincipal').textContent = formatCurrency(P);
  document.getElementById('finalAmount').textContent = formatCurrency(final);
  
  updateChart(P, interest);
}

function updateChart(principal, interest) {
  const ctx = document.getElementById('simpleChart');
  if (simpleChart) simpleChart.destroy();
  
  simpleChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Principal', 'Interest'],
      datasets: [{
        data: [principal, interest],
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

function resetSimpleCalc() {
  principal.value = 10000;
  rate.value = 5;
  time.value = 5;
  calculateSimple();
}

document.addEventListener('DOMContentLoaded', calculateSimple);
