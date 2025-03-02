// Options Simulator Web Application

// Global variables
let chart = null;
let options = [];
let currentPrice = 0;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Set up event listeners
    document.getElementById('add-option-btn').addEventListener('click', addOption);
    document.getElementById('plot-btn').addEventListener('click', plotSimulation);
    document.getElementById('ticker-input').addEventListener('change', fetchStockData);
    
    // Initial stock data fetch for default ticker
    fetchStockData();
});

// Fetch stock data from the server
async function fetchStockData() {
    const ticker = document.getElementById('ticker-input').value;
    if (!ticker) return;
    
    try {
        document.getElementById('current-price-container').innerHTML = '<div class="spinner"></div>';
        
        const response = await fetch(`/api/stock-data?ticker=${ticker}`);
        if (!response.ok) {
            throw new Error('Failed to fetch stock data');
        }
        
        const data = await response.json();
        currentPrice = data.current_price;
        
        document.getElementById('current-price-container').innerHTML = 
            `<strong>Current Price:</strong> $${currentPrice.toFixed(2)}`;
            
        // Update the chart if we have options
        if (options.length > 0) {
            plotSimulation();
        }
    } catch (error) {
        console.error('Error fetching stock data:', error);
        document.getElementById('current-price-container').innerHTML = 
            `<span style="color: red;">Error fetching data for ${ticker}</span>`;
    }
}

// Add an option to the list
function addOption() {
    const strikeInput = document.getElementById('strike-input');
    const premiumInput = document.getElementById('premium-input');
    
    const strike = parseFloat(strikeInput.value);
    const premium = parseFloat(premiumInput.value);
    
    if (isNaN(strike) || isNaN(premium)) {
        showAlert('Please enter valid numbers for strike price and premium', 'error');
        return;
    }
    
    // Add to options array
    options.push({ strike, premium });
    
    // Add to UI
    const optionsList = document.getElementById('options-list');
    const optionItem = document.createElement('div');
    optionItem.className = 'option-item';
    optionItem.innerHTML = `
        <span class="option-info">Strike: $${strike.toFixed(2)}, Premium: $${premium.toFixed(2)}</span>
        <button class="delete-option" data-index="${options.length - 1}">
            <i class="fas fa-trash"></i>
        </button>
    `;
    optionsList.appendChild(optionItem);
    
    // Add delete event listener
    optionItem.querySelector('.delete-option').addEventListener('click', function() {
        const index = parseInt(this.getAttribute('data-index'));
        deleteOption(index, optionItem);
    });
    
    // Clear inputs
    strikeInput.value = '';
    premiumInput.value = '';
    strikeInput.focus();
    
    // Update the chart
    if (currentPrice > 0) {
        plotSimulation();
    }
    
    showAlert('Option added successfully', 'success');
}

// Delete an option from the list
function deleteOption(index, element) {
    options.splice(index, 1);
    element.remove();
    
    // Reindex the remaining options
    const deleteButtons = document.querySelectorAll('.delete-option');
    deleteButtons.forEach((button, i) => {
        button.setAttribute('data-index', i);
    });
    
    // Update the chart
    if (options.length > 0 && currentPrice > 0) {
        plotSimulation();
    } else {
        // Clear the chart if no options left
        if (chart) {
            chart.destroy();
            chart = null;
        }
    }
    
    showAlert('Option removed', 'info');
}

// Plot the simulation
function plotSimulation() {
    if (options.length === 0) {
        showAlert('Please add at least one option first', 'warning');
        return;
    }
    
    const ticker = document.getElementById('ticker-input').value;
    const expirationDays = parseInt(document.getElementById('expiration-input').value) || 30;
    
    if (isNaN(expirationDays) || expirationDays <= 0) {
        showAlert('Please enter a valid number of days until expiration', 'error');
        return;
    }
    
    // Find the minimum and maximum strike prices to adjust the display range
    let minStrike = Infinity;
    let maxStrike = -Infinity;
    
    options.forEach(option => {
        minStrike = Math.min(minStrike, option.strike);
        maxStrike = Math.max(maxStrike, option.strike);
    });
    
    // Add padding to ensure we show a good range around all strike prices
    const strikePadding = 0.2; // 20% padding
    const strikeRange = maxStrike - minStrike;
    
    // If we only have one option or all options have the same strike, use current price as reference
    if (strikeRange === 0) {
        minStrike = Math.min(minStrike, currentPrice);
        maxStrike = Math.max(maxStrike, currentPrice);
    }
    
    // Calculate display range with padding
    const paddedRange = strikeRange === 0 ? maxStrike * strikePadding : strikeRange * (1 + strikePadding);
    let minPrice = Math.max(minStrike - paddedRange * 0.5, 0); // Ensure we don't go below 0
    let maxPrice = maxStrike + paddedRange * 0.5;
    
    // Ensure current price is within the range
    minPrice = Math.min(minPrice, currentPrice * 0.8);
    maxPrice = Math.max(maxPrice, currentPrice * 1.2);
    
    // Generate price range for x-axis
    const prices = [];
    const profitLossData = [];
    
    // Create price range
    const step = (maxPrice - minPrice) / 100;
    
    for (let price = minPrice; price <= maxPrice; price += step) {
        prices.push(price);
    }
    
    // Calculate profit/loss for each option
    options.forEach((option, index) => {
        const { strike, premium } = option;
        const profitLoss = [];
        
        prices.forEach(price => {
            if (price >= strike) {
                // Option expires worthless, premium is profit
                profitLoss.push(premium * 100);
            } else {
                // Option is exercised
                profitLoss.push((premium + (price - strike)) * 100);
            }
        });
        
        profitLossData.push({
            label: `Strike: $${strike.toFixed(2)}, Premium: $${premium.toFixed(2)}`,
            data: profitLoss,
            borderColor: getRandomColor(index),
            backgroundColor: getRandomColor(index, 0.1),
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.1
        });
    });
    
    // Update or create chart
    const ctx = document.getElementById('simulation-chart').getContext('2d');
    
    if (chart) {
        chart.destroy();
    }
    
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: prices.map(p => p.toFixed(2)),
            datasets: profitLossData
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: `Cash-Secured Put Simulator for ${ticker}`,
                    font: {
                        size: 16
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: $${context.raw.toFixed(2)}`;
                        }
                    }
                },
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Stock Price at Expiration ($)'
                    },
                    ticks: {
                        callback: function(value, index, values) {
                            // Show fewer ticks for readability
                            if (index % 10 === 0) {
                                return '$' + prices[index].toFixed(2);
                            }
                            return '';
                        }
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Profit/Loss ($)'
                    },
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toFixed(2);
                        }
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            },
            annotation: {
                annotations: {
                    currentPrice: {
                        type: 'line',
                        mode: 'vertical',
                        scaleID: 'x',
                        value: currentPrice.toFixed(2),
                        borderColor: 'rgba(150, 150, 150, 0.7)',
                        borderWidth: 2,
                        borderDash: [6, 6],
                        label: {
                            content: `Current: $${currentPrice.toFixed(2)}`,
                            enabled: true,
                            position: 'top'
                        }
                    },
                    breakEven: {
                        type: 'line',
                        mode: 'horizontal',
                        scaleID: 'y',
                        value: 0,
                        borderColor: 'rgba(0, 0, 0, 0.3)',
                        borderWidth: 1
                    }
                }
            }
        }
    });
    
    // Update summary section
    updateSummary(ticker, expirationDays);
}

// Update the summary section with option details
function updateSummary(ticker, expirationDays) {
    const summaryGrid = document.getElementById('summary-grid');
    summaryGrid.innerHTML = '';
    
    options.forEach(option => {
        const { strike, premium } = option;
        const maxProfit = premium * 100;
        const maxLoss = (strike - premium) * 100;
        const breakeven = strike - premium;
        
        const summaryCard = document.createElement('div');
        summaryCard.className = 'summary-card';
        summaryCard.innerHTML = `
            <h4>Option Summary</h4>
            <p><strong>Strike Price:</strong> $${strike.toFixed(2)}</p>
            <p><strong>Premium:</strong> $${premium.toFixed(2)}</p>
            <p><strong>Max Profit:</strong> $${maxProfit.toFixed(2)}</p>
            <p><strong>Max Loss:</strong> $${maxLoss.toFixed(2)}</p>
            <p><strong>Break-even:</strong> $${breakeven.toFixed(2)}</p>
            <p><strong>Days to Expiration:</strong> ${expirationDays}</p>
        `;
        
        summaryGrid.appendChild(summaryCard);
    });
}

// Helper function to generate random colors for chart lines
function getRandomColor(index, alpha = 1) {
    const colors = [
        `rgba(52, 152, 219, ${alpha})`,  // Blue
        `rgba(46, 204, 113, ${alpha})`,  // Green
        `rgba(231, 76, 60, ${alpha})`,   // Red
        `rgba(155, 89, 182, ${alpha})`,  // Purple
        `rgba(241, 196, 15, ${alpha})`,  // Yellow
        `rgba(230, 126, 34, ${alpha})`,  // Orange
        `rgba(26, 188, 156, ${alpha})`,  // Turquoise
        `rgba(52, 73, 94, ${alpha})`     // Dark Blue
    ];
    
    return colors[index % colors.length];
}

// Show alert messages as toast notifications
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alert-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Get appropriate icon based on type
    let icon = '';
    switch(type) {
        case 'success':
            icon = '<i class="fas fa-check-circle toast-icon success"></i>';
            break;
        case 'error':
            icon = '<i class="fas fa-exclamation-circle toast-icon error"></i>';
            break;
        case 'warning':
            icon = '<i class="fas fa-exclamation-triangle toast-icon warning"></i>';
            break;
        default:
            icon = '<i class="fas fa-info-circle toast-icon info"></i>';
    }
    
    toast.innerHTML = `
        <div class="toast-content">
            ${icon}
            <span class="toast-message">${message}</span>
        </div>
        <button class="toast-close">&times;</button>
        <div class="toast-progress">
            <div class="toast-progress-bar"></div>
        </div>
    `;
    
    alertContainer.appendChild(toast);
    
    // Add event listener to close button
    toast.querySelector('.toast-close').addEventListener('click', function() {
        removeToast(toast);
    });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        removeToast(toast);
    }, 5000);
}

// Helper function to remove toast with animation
function removeToast(toast) {
    if (!toast.parentNode) return;
    
    // Add exit animation
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    
    // Remove after animation completes
    setTimeout(() => {
        if (toast.parentNode) {
            toast.remove();
        }
    }, 300);
}
