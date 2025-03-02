// Global variables for tab management
let tabsData = {};
let activeTicker = "";

// New function: Create a new tab for a ticker
function createTab(ticker) {
    // Create tab header
    const tabsHeader = document.getElementById('tabs-header');
    const tab = document.createElement('div');
    tab.className = 'tab';
    tab.setAttribute('data-ticker', ticker);
    tab.innerHTML = ticker + ' <span class="tab-close" data-ticker="' + ticker + '">×</span>';
    tab.addEventListener('click', function(e) {
        // Avoid triggering if close button clicked
        if (e.target.classList.contains('tab-close')) return;
        switchTab(ticker);
    });
    tabsHeader.appendChild(tab);
    
    // Create tab pane with a chart canvas and summary section only
    const tabsContent = document.getElementById('tabs-content');
    const tabPane = document.createElement('div');
    tabPane.className = 'tab-pane';
    tabPane.setAttribute('data-ticker', ticker);
    tabPane.innerHTML = `
        <div class="tab-content-inner">
            <div class="chart-wrapper">
                <canvas id="simulation-chart-${ticker}"></canvas>
            </div>
            <div class="summary-section">
                <h3 class="summary-title">Option Summary</h3>
                <div id="summary-grid-${ticker}" class="summary-grid">
                    <!-- Summary cards will be added here dynamically -->
                </div>
            </div>
        </div>
    `;
    tabsContent.appendChild(tabPane);
    
    // Add event listener for close button
    tab.querySelector('.tab-close').addEventListener('click', function(e) {
        e.stopPropagation();
        removeTab(ticker);
    });
}

// Function to switch active tab
function switchTab(ticker) {
    activeTicker = ticker;
    // Update active class on tab headers
    document.querySelectorAll('.tabs-header .tab').forEach(tab => {
        if (tab.getAttribute('data-ticker') === ticker) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    // Update active class on tab panes
    document.querySelectorAll('.tabs-content .tab-pane').forEach(pane => {
        if (pane.getAttribute('data-ticker') === ticker) {
            pane.classList.add('active');
        } else {
            pane.classList.remove('active');
        }
    });
    
    // When switching, fetch stock data for the active ticker
    fetchStockData();
    // Also update simulation if options exist
    if (tabsData[ticker] && tabsData[ticker].options && tabsData[ticker].options.length > 0) {
        plotSimulation();
    }
}

// Function to add a new ticker
function addTicker() {
    const tickerInput = document.getElementById('ticker-input');
    let ticker = tickerInput.value.trim().toUpperCase();
    if (!ticker) return;
    // If ticker already exists, just switch to it
    if (tabsData[ticker]) {
        switchTab(ticker);
    } else {
        // Initialize data for the new ticker
        tabsData[ticker] = { options: [], currentPrice: 0, chart: null };
        createTab(ticker);
        switchTab(ticker);
    }
    tickerInput.value = '';
}

// Function to remove a ticker tab
function removeTab(ticker) {
    // Remove from DOM
    const tab = document.querySelector('.tabs-header .tab[data-ticker="' + ticker + '"]');
    if (tab) tab.remove();
    const pane = document.querySelector('.tabs-content .tab-pane[data-ticker="' + ticker + '"]');
    if (pane) pane.remove();
    // Remove from data
    delete tabsData[ticker];
    
    // If removed ticker was active, switch to another if exists
    if (activeTicker === ticker) {
        const remaining = Object.keys(tabsData);
        if (remaining.length > 0) {
            switchTab(remaining[0]);
        } else {
            activeTicker = "";
        }
    }
}

// Modify DOMContentLoaded initialization
document.addEventListener('DOMContentLoaded', function() {
    // Set up event listeners
    document.getElementById('add-option-btn').addEventListener('click', addOption);
    document.getElementById('plot-btn').addEventListener('click', plotSimulation);
    document.getElementById('add-ticker-btn').addEventListener('click', addTicker);
    
    // Initially add default ticker from input
    let defaultTicker = document.getElementById('ticker-input').value.trim().toUpperCase();
    if(defaultTicker === '') defaultTicker = 'AAPL';
    tabsData[defaultTicker] = { options: [], currentPrice: 0, chart: null };
    createTab(defaultTicker);
    switchTab(defaultTicker);
    
    // Initialize Yahoo Finance link
    updateYahooLink();
});

// Update Yahoo Finance link function remains unchanged
function updateYahooLink() {
    // Use activeTicker instead of ticker-input value
    const yahooLink = document.getElementById('yahoo-options-link');
    if (activeTicker) {
        yahooLink.href = `https://de.finance.yahoo.com/quote/${activeTicker}/options/?type=puts`;
        yahooLink.style.display = 'inline-flex';
    } else {
        yahooLink.href = '#';
        yahooLink.style.display = 'none';
    }
}

// Update fetchStockData to use activeTicker
async function fetchStockData() {
    if (!activeTicker) return;
    try {
        const currentPriceContainer = document.getElementById('current-price-container');
        currentPriceContainer.innerHTML = '<div class="spinner"></div>';
        
        const response = await fetch(`/api/stock-data?ticker=${activeTicker}`);
        if (!response.ok) {
            throw new Error('Failed to fetch stock data');
        }
        const data = await response.json();
        tabsData[activeTicker].currentPrice = data.current_price;
        currentPriceContainer.innerHTML = `<strong>Current Price (${activeTicker}):</strong> $${data.current_price.toFixed(2)}`;
        
        // If options exist, update simulation
        if (tabsData[activeTicker].options && tabsData[activeTicker].options.length > 0) {
            plotSimulation();
        }
    } catch (error) {
        console.error('Error fetching stock data:', error);
        document.getElementById('current-price-container').innerHTML = `<span style="color: red;">Error fetching data for ${activeTicker}</span>`;
    }
}

// Update addOption to target the active tab's options list
function addOption() {
    const strikeInput = document.getElementById('strike-input');
    const premiumInput = document.getElementById('premium-input');
    const strike = parseFloat(strikeInput.value);
    const premium = parseFloat(premiumInput.value);
    if (isNaN(strike) || isNaN(premium)) {
        showAlert('Please enter valid numbers for strike price and premium', 'error');
        return;
    }
    // Add option to active tab's options array
    tabsData[activeTicker].options.push({ strike, premium });
    
    // Instead, update the summary cards to reflect the new option
    const expirationValue = parseInt(document.getElementById('expiration-input').value) || 30;
    updateSummary(activeTicker, expirationValue);
    
    // Clear inputs
    strikeInput.value = '';
    premiumInput.value = '';
    strikeInput.focus();
    
    // Update the chart if current price is available
    if (tabsData[activeTicker].currentPrice > 0) {
        plotSimulation();
    }
    
    showAlert('Option added successfully', 'success');
}

// Update deleteOption to use active tab's options
function deleteOption(index) {
    tabsData[activeTicker].options.splice(index, 1);
    const expirationValue = parseInt(document.getElementById('expiration-input').value) || 30;
    updateSummary(activeTicker, expirationValue);
    showAlert('Option removed', 'info');
}

// Updated plotSimulation function
function plotSimulation() {
    const ticker = activeTicker;
    // Ensure any existing chart is destroyed before re-plotting
    if (tabsData[ticker].chart) {
        tabsData[ticker].chart.destroy();
        tabsData[ticker].chart = null;
    }

    const ctx = document.getElementById('simulation-chart-' + ticker).getContext('2d');
    const expirationDays = parseInt(document.getElementById('expiration-input').value) || 30;
    
    let currentPrice = tabsData[ticker].currentPrice;
    let optionsArray = tabsData[ticker].options;
    
    // Determine strike range from options
    let minStrike = Infinity;
    let maxStrike = -Infinity;
    optionsArray.forEach(option => {
        minStrike = Math.min(minStrike, option.strike);
        maxStrike = Math.max(maxStrike, option.strike);
    });
    if (maxStrike - minStrike === 0) {
        minStrike = Math.min(minStrike, currentPrice);
        maxStrike = Math.max(maxStrike, currentPrice);
    }
    const strikePadding = 0.2;
    const strikeRange = maxStrike - minStrike;
    const paddedRange = strikeRange === 0 ? maxStrike * strikePadding : strikeRange * (1 + strikePadding);
    let minPrice = Math.max(minStrike - paddedRange * 0.5, 0);
    let maxPrice = maxStrike + paddedRange * 0.5;
    minPrice = Math.min(minPrice, currentPrice * 0.8);
    maxPrice = Math.max(maxPrice, currentPrice * 1.2);
    
    const prices = [];
    const step = (maxPrice - minPrice) / 100;
    for (let price = minPrice; price <= maxPrice; price += step) {
        prices.push(price);
    }
    
    // Prepare datasets for each option series
    const datasets = optionsArray.map((option, index) => {
        const profitLoss = prices.map(price => {
            if (price >= option.strike) {
                return option.premium * 100;
            } else {
                return (option.premium + (price - option.strike)) * 100;
            }
        });

        return {
            label: `Strike: $${option.strike.toFixed(2)}, Premium: $${option.premium.toFixed(2)}`,
            data: prices.map((price, i) => ({ x: price, y: profitLoss[i] })),
            borderColor: getRandomColor(index),
            backgroundColor: getRandomColor(index, 0.1),
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.1,
            fill: false
        };
    });

    // Create a new chart
    tabsData[ticker].chart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: datasets
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: {
                        display: true,
                        text: 'Stock Price ($)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Profit / Loss ($)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: true
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            }
        }
    });
}

// Update updateSummary function to target the active tab's summary grid
function updateSummary(ticker, expirationDays) {
    const summaryGrid = document.getElementById('summary-grid-' + ticker);
    if (!summaryGrid) return;
    let html = '';
    tabsData[ticker].options.forEach((option, index) => {
        const { strike, premium } = option;
        const maxProfit = premium * 100;
        const maxLoss = (strike - premium) * 100;
        const breakeven = strike - premium;
        html += `
           <div class="summary-card" data-index="${index}">
              <div class="summary-info">
                <p><strong>Strike:</strong> $${strike.toFixed(2)}</p>
                <p><strong>Premium:</strong> $${premium.toFixed(2)}</p>
                <p><strong>Max Profit:</strong> $${maxProfit.toFixed(2)}</p>
                <p><strong>Max Loss:</strong> $${maxLoss.toFixed(2)}</p>
                <p><strong>Breakeven:</strong> $${breakeven.toFixed(2)}</p>
              </div>
              <button class="delete-series" data-index="${index}"><i class="fas fa-trash"></i></button>
           </div>
         `;
    });
    summaryGrid.innerHTML = html;
    
    // Attach delete event listeners
    summaryGrid.querySelectorAll('.delete-series').forEach(btn => {
         btn.addEventListener('click', function() {
             const idx = parseInt(this.getAttribute('data-index'));
             deleteOption(idx);
         });
    });
    
    // Update chart simulation: if options exist, update simulation; else, destroy the chart if exists
    if (tabsData[ticker].options.length > 0 && tabsData[ticker].currentPrice > 0) {
         plotSimulation();
    } else {
         if (tabsData[ticker].chart) {
             tabsData[ticker].chart.destroy();
             tabsData[ticker].chart = null;
         }
    }
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
