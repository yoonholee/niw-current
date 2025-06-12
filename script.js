// Function to parse date string to Date object, using bulletin month if 'C'
function parseDate(dateStr, monthLabel) {
    if (dateStr === 'C' || !dateStr) {
        // Use the bulletin month as the date (first of the month)
        const [month, year] = monthLabel.split(' ');
        const monthNum = [
            'January','February','March','April','May','June','July','August','September','October','November','December'
        ].indexOf(month) + 1;
        return new Date(`${year}-${String(monthNum).padStart(2, '0')}-01`);
    }
    if (dateStr === 'U') return null;
    return new Date(dateStr);
}

function getMonthDate(monthLabel) {
    const [month, year] = monthLabel.split(' ');
    const monthNum = [
        'January','February','March','April','May','June','July','August','September','October','November','December'
    ].indexOf(month) + 1;
    return new Date(`${year}-${String(monthNum).padStart(2, '0')}-01`);
}

// Function to format date for display
function formatDate(date) {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function daysBetween(date1, date2) {
    if (!date1 || !date2) return null;
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.abs(Math.round((date1 - date2) / msPerDay));
}

function daysToYearsMonths(days) {
    if (!days) return '';
    const years = Math.floor(days / 365);
    const months = Math.floor((days % 365) / 30.44); // average month length
    let result = '';
    if (years > 0) result += `${years} year${years > 1 ? 's' : ''}`;
    if (months > 0) {
        if (result) result += ', ';
        result += `${months} month${months > 1 ? 's' : ''}`;
    }
    return result || '0 months';
}

// Function to process data
async function processData() {
    try {
        // Use the data from data.js
        return visaData.sort((a, b) => {
            // Sort by year and month
            const getYearMonth = (m) => {
                const [month, year] = m.month.split(' ');
                return [parseInt(year), [
                    'January','February','March','April','May','June','July','August','September','October','November','December'
                ].indexOf(month)];
            };
            const [aYear, aMonth] = getYearMonth(a);
            const [bYear, bMonth] = getYearMonth(b);
            return aYear !== bYear ? aYear - bYear : aMonth - bMonth;
        });
    } catch (error) {
        console.error('Error processing data:', error);
        return [];
    }
}

// Function to create the chart
async function createChart() {
    const data = await processData();
    const months = data.map(d => d.month);
    const minDate = new Date('2020-01-01');
    const maxDate = new Date('2025-12-31');

    // Prepare data for the two lines
    const finalActionDates = data.map(d => parseDate(d.final_action, d.month));
    const datesForFilingDates = data.map(d => parseDate(d.dates_for_filing, d.month));
    const monthDates = data.map(d => getMonthDate(d.month));

    const ctx = document.getElementById('visaChart').getContext('2d');

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: monthDates,
            datasets: [
                {
                    label: 'Y = X',
                    data: monthDates,
                    borderColor: '#888',
                    backgroundColor: 'rgba(200,200,200,0.1)',
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: false,
                    order: 1,
                },
                {
                    label: 'Final Action Date',
                    data: finalActionDates,
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    tension: 0.4,
                    fill: {
                        target: 0,
                        above: 'rgba(76, 175, 80, 0.15)',
                        below: 'rgba(255,0,0,0.05)'
                    },
                    pointRadius: 4,
                    pointHoverRadius: 8,
                    pointBackgroundColor: '#4CAF50',
                    pointBorderColor: '#000',
                    pointBorderWidth: 2,
                    pointStyle: 'circle',
                    pointHoverBackgroundColor: '#388E3C',
                    pointShadowOffsetX: 1,
                    pointShadowOffsetY: 1,
                    pointShadowBlur: 4,
                    pointShadowColor: 'rgba(76,175,80,0.25)',
                    order: 2,
                },
                {
                    label: 'Dates for Filing',
                    data: datesForFilingDates,
                    borderColor: '#2196F3',
                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                    tension: 0.4,
                    fill: false,
                    pointRadius: 4,
                    pointHoverRadius: 8,
                    pointBackgroundColor: '#2196F3',
                    pointBorderColor: '#000',
                    pointBorderWidth: 2,
                    pointStyle: 'circle',
                    pointHoverBackgroundColor: '#1565C0',
                    pointShadowOffsetX: 1,
                    pointShadowOffsetY: 1,
                    pointShadowBlur: 4,
                    pointShadowColor: 'rgba(33,150,243,0.25)',
                    order: 3,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                annotation: {
                    annotations: {
                        line1: {
                            type: 'line',
                            yMin: new Date('2025-01-13').getTime(),
                            yMax: new Date('2025-01-13').getTime(),
                            borderColor: 'gray',
                            borderWidth: 2,
                            borderDash: [6, 6],
                            label: {
                                enabled: true,
                                content: '01/13/2025',
                                position: 'start',
                                backgroundColor: 'rgba(200,200,200,0.8)',
                                color: '#333',
                                font: { weight: 'bold' }
                            }
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const idx = context.dataIndex;
                            const faDate = finalActionDates[idx];
                            const dfDate = datesForFilingDates[idx];
                            const refDate = monthDates[idx];
                            const gap = daysBetween(faDate, refDate);
                            let label = '';
                            
                            if (context.dataset.label === 'Final Action Date') {
                                label = 'Final Action: ' + formatDate(faDate);
                                if (gap !== null) {
                                    label += ` (Gap: ${gap} days`;
                                    const ym = daysToYearsMonths(gap);
                                    if (ym) label += `, ~${ym}`;
                                    label += ')';
                                }
                            } else if (context.dataset.label === 'Dates for Filing') {
                                label = 'Dates for Filing: ' + formatDate(dfDate);
                            } else if (context.dataset.label === 'Y = X') {
                                label = 'Reference: ' + formatDate(refDate);
                            }
                            return label;
                        }
                    }
                },
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    type: 'time',
                    min: new Date('2021-10-01'),
                    max: new Date('2025-12-31'),
                    time: {
                        unit: 'month',
                        stepSize: 3,
                        displayFormats: {
                            month: 'MMM yyyy'
                        }
                    },
                    grid: {
                        display: true,
                        color: 'rgba(180,180,180,0.18)',
                        lineWidth: 1
                    },
                    title: {
                        display: false
                    }
                },
                y: {
                    type: 'time',
                    min: new Date('2021-10-01'),
                    max: new Date('2025-12-31'),
                    time: {
                        unit: 'month',
                        stepSize: 3,
                        displayFormats: {
                            month: 'MMM yyyy'
                        }
                    },
                    grid: {
                        display: true,
                        color: 'rgba(180,180,180,0.18)',
                        lineWidth: 1
                    },
                    title: {
                        display: false
                    }
                }
            },
            aspectRatio: 1  // This ensures the chart is a perfect square
        }
    });
}

// Initialize the chart when the page loads
document.addEventListener('DOMContentLoaded', createChart);