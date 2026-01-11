// Stamp Duty Calculator Logic
let sdltBreakdownChart = null;
let sdltComparisonChart = null;

const propertyPrice = document.getElementById('propertyPrice');
const propertyPriceSlider = document.getElementById('propertyPriceSlider');
const buyerType = document.getElementById('buyerType');
const region = document.getElementById('region');

syncSliderAndInput(propertyPriceSlider, propertyPrice);

propertyPrice.addEventListener('input', () => {
  const price = parseFloat(propertyPrice.value) || 0;
  if (price > 2000000) {
    propertyPriceSlider.max = Math.min(price + 1000000, 10000000);
  }
});

[propertyPrice, buyerType, region].forEach(el => el.addEventListener('input', calculateSDLT));

buyerType.addEventListener('change', () => {
  document.getElementById('firstTimeInfo').style.display = buyerType.value === 'firstTime' ? 'block' : 'none';
  document.getElementById('additionalInfo').style.display = buyerType.value === 'additional' ? 'block' : 'none';
});

region.addEventListener('change', () => {
  document.getElementById('regionalNote').style.display = region.value !== 'england' ? 'block' : 'none';
});

function calculateSDLT() {
  const price = parseFloat(propertyPrice.value) || 0;
  const type = buyerType.value;
  const reg = region.value;
  
  if (reg !== 'england') {
    displayRegionalWarning();
    return;
  }
  
  const bands = type === 'firstTime' && price <= 625000 ? SDLT_BANDS.firstTimeBuyer : 
                type === 'additional' ? SDLT_BANDS.additional : SDLT_BANDS.standard;
  
  const { sdlt, breakdown } = calculateSDLTByBands(price, bands);
  
  // Calculate comparison values
  const standardSDLT = calculateSDLTByBands(price, SDLT_BANDS.standard).sdlt;
  const ftbSDLT = price <= 625000 ? calculateSDLTByBands(price, SDLT_BANDS.firstTimeBuyer).sdlt : standardSDLT;
  const additionalSDLT = calculateSDLTByBands(price, SDLT_BANDS.additional).sdlt;
  
  displaySDLTResults(price, sdlt, type, standardSDLT, ftbSDLT, additionalSDLT, breakdown);
  updateSDLTCharts(breakdown, price, ftbSDLT, standardSDLT, additionalSDLT);
  updateSDLTTable(breakdown, sdlt);
}

function calculateSDLTByBands(price, bands) {
  let sdlt = 0;
  const breakdown = [];
  
  for (const band of bands) {
    if (price > band.min) {
      const amountInBand = Math.min(price, band.max) - band.min;
      const sdltInBand = amountInBand * band.rate;
      sdlt += sdltInBand;
      
      breakdown.push({
        range: `£${formatNumber(band.min, 0)} - ${band.max === Infinity ? 'No limit' : '£' + formatNumber(band.max, 0)}`,
        rate: (band.rate * 100).toFixed(0) + '%',
        amountInBand: amountInBand,
        sdltInBand: sdltInBand
      });
    }
  }
  
  return { sdlt, breakdown };
}

function displaySDLTResults(price, sdlt, type, standardSDLT, ftbSDLT, additionalSDLT, breakdown) {
  document.getElementById('totalSDLT').textContent = formatCurrency(sdlt);
  document.getElementById('displayPrice').textContent = formatCurrency(price);
  document.getElementById('totalCost').textContent = formatCurrency(price + sdlt);
  
  const effectiveRate = price > 0 ? ((sdlt / price) * 100).toFixed(2) : 0;
  document.getElementById('effectiveRate').textContent = effectiveRate + '%';
  
  const buyerTypes = { firstTime: 'First-Time Buyer', standard: 'Standard', additional: 'Additional Property' };
  document.getElementById('displayBuyerType').textContent = buyerTypes[type];
  document.getElementById('sdltSubtext').textContent = `${effectiveRate}% of property price`;
  
  // Show FTB savings
  const ftbSavings = document.getElementById('ftbSavings');
  if (type === 'firstTime' && standardSDLT > ftbSDLT) {
    ftbSavings.classList.remove('hidden');
    document.getElementById('standardSDLT').textContent = formatCurrency(standardSDLT);
    document.getElementById('ftbSDLT').textContent = formatCurrency(ftbSDLT);
    document.getElementById('ftbSaving').textContent = formatCurrency(standardSDLT - ftbSDLT);
  } else {
    ftbSavings.classList.add('hidden');
  }
  
  // Update comparison
  document.getElementById('ftbComparison').textContent = formatCurrency(ftbSDLT);
  document.getElementById('standardComparison').textContent = formatCurrency(standardSDLT);
  document.getElementById('additionalComparison').textContent = formatCurrency(additionalSDLT);
}

function displayRegionalWarning() {
  document.getElementById('totalSDLT').textContent = 'N/A';
  document.getElementById('sdltSubtext').textContent = 'Use regional calculator';
}

function updateSDLTCharts(breakdown, price, ftbSDLT, standardSDLT, additionalSDLT) {
  updateSDLTBreakdownChart(price, breakdown);
  updateSDLTComparisonChart(ftbSDLT, standardSDLT, additionalSDLT);
}

function updateSDLTBreakdownChart(price, breakdown) {
  const ctx = document.getElementById('sdltBreakdownChart');
  if (!ctx) return;
  
  if (sdltBreakdownChart) sdltBreakdownChart.destroy();
  
  const labels = breakdown.map(b => b.range);
  const data = breakdown.map(b => b.sdltInBand);
  
  sdltBreakdownChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: ['#10b981', '#3b82f6', '#8b5cf6', '#ef4444'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { padding: 15, font: { size: 11 } } },
        tooltip: {
          callbacks: {
            label: function(context) {
              return formatCurrency(context.parsed);
            }
          }
        }
      }
    }
  });
}

function updateSDLTComparisonChart(ftb, standard, additional) {
  const ctx = document.getElementById('sdltComparisonChart');
  if (!ctx) return;
  
  if (sdltComparisonChart) sdltComparisonChart.destroy();
  
  sdltComparisonChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['First-Time Buyer', 'Standard', 'Additional Property'],
      datasets: [{
        label: 'Stamp Duty',
        data: [ftb, standard, additional],
        backgroundColor: ['#10b981', '#3b82f6', '#ef4444'],
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
              return 'SDLT: ' + formatCurrency(context.parsed.y);
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

function switchSDLTChart(chartType) {
  document.querySelectorAll('.chart-tab').forEach(tab => tab.classList.remove('active'));
  event.target.classList.add('active');
  
  if (chartType === 'breakdown') {
    document.getElementById('breakdownChartContainer').classList.remove('hidden');
    document.getElementById('comparisonChartContainer').classList.add('hidden');
  } else {
    document.getElementById('breakdownChartContainer').classList.add('hidden');
    document.getElementById('comparisonChartContainer').classList.remove('hidden');
  }
}

function updateSDLTTable(breakdown, total) {
  const tbody = document.getElementById('sdltBandTableBody');
  tbody.innerHTML = '';
  
  breakdown.forEach((band, index) => {
    const row = tbody.insertRow();
    row.innerHTML = `
      <td>Band ${index + 1}</td>
      <td>${band.range}</td>
      <td>${band.rate}</td>
      <td>£${formatNumber(band.amountInBand, 0)}</td>
      <td><strong>£${formatNumber(band.sdltInBand, 0)}</strong></td>
    `;
  });
  
  document.getElementById('sdltTableTotal').textContent = formatCurrency(total);
}

function exportSDLTCSV() {
  const price = document.getElementById('propertyPrice').value;
  const sdlt = document.getElementById('totalSDLT').textContent.replace(/[£,]/g, '');
  const type = document.getElementById('displayBuyerType').textContent;
  
  let csv = 'Property Price,Buyer Type,Total SDLT\n';
  csv += `£${price},${type},£${sdlt}\n\n`;
  csv += 'Band,Range,Rate,Amount in Band,SDLT in Band\n';
  
  const tbody = document.getElementById('sdltBandTableBody');
  Array.from(tbody.rows).forEach(row => {
    csv += Array.from(row.cells).map(cell => cell.textContent).join(',') + '\n';
  });
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'stamp-duty-calculation.csv';
  a.click();
  window.URL.revokeObjectURL(url);
}

function showEmailModal() {
  document.getElementById('emailModal').classList.add('active');
}

function closeEmailModal() {
  document.getElementById('emailModal').classList.remove('active');
}

async function generateSDLTPDF(event) {
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
    doc.text('Stamp Duty Report', 20, 30);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, 20, 40);
    doc.text(`Email: ${email}`, 20, 46);
    
    const price = document.getElementById('propertyPrice').value;
    const sdlt = document.getElementById('totalSDLT').textContent;
    const type = document.getElementById('displayBuyerType').textContent;
    const total = document.getElementById('totalCost').textContent;
    
    doc.setFontSize(14);
    doc.text('Property Details', 20, 60);
    doc.setFontSize(10);
    doc.text(`Property Price: £${formatNumber(price, 0)}`, 20, 70);
    doc.text(`Buyer Type: ${type}`, 20, 76);
    doc.text(`Stamp Duty: ${sdlt}`, 20, 82);
    doc.text(`Total Cost: ${total}`, 20, 88);
    
    doc.setFontSize(8);
    doc.text('This is for guidance only. Consult a solicitor for accurate calculations.', 20, 280);
    
    doc.save(`sdlt-report-${Date.now()}.pdf`);
    closeEmailModal();
    alert('PDF generated! Check downloads.');
  } catch (error) {
    alert('Error generating PDF');
  } finally {
    btn.textContent = 'Generate & Download PDF';
    btn.disabled = false;
  }
}

function resetSDLTCalculator() {
  propertyPrice.value = 300000;
  propertyPriceSlider.value = 300000;
  buyerType.value = 'standard';
  region.value = 'england';
  document.getElementById('firstTimeInfo').style.display = 'none';
  document.getElementById('additionalInfo').style.display = 'none';
  document.getElementById('regionalNote').style.display = 'none';
  calculateSDLT();
}

window.onclick = function(event) {
  if (event.target === document.getElementById('emailModal')) closeEmailModal();
}

document.addEventListener('DOMContentLoaded', calculateSDLT);
