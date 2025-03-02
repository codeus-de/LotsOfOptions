# Options Simulator Web Application

A beautiful web application for simulating cash-secured put options strategies, built with Flask, Chart.js, and modern web technologies.

## Features

- **Interactive Options Simulator**: Add and remove multiple options to visualize potential profit/loss scenarios
- **Real-time Stock Data**: Fetches current stock prices using Yahoo Finance API
- **Beautiful UI**: Modern, responsive design with intuitive user interface
- **Detailed Analysis**: View maximum profit, maximum loss, and break-even points for each option
- **Multi-option Comparison**: Compare different strike prices and premiums side by side

## Screenshots

![Options Simulator Screenshot](https://via.placeholder.com/800x450.png?text=Options+Simulator+Screenshot)

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/options-simulator.git
   cd options-simulator
   ```

2. Create and activate a virtual environment (optional but recommended):
   ```
   python -m venv .venv
   .venv\Scripts\activate  # On Windows
   source .venv/bin/activate  # On macOS/Linux
   ```

3. Install the required dependencies:
   ```
   pip install -r requirements.txt
   ```

## Usage

1. Start the Flask application:
   ```
   python app.py
   ```

2. Open your web browser and navigate to:
   ```
   http://localhost:5000
   ```

3. Enter a ticker symbol, strike price, and premium to add an option to the simulation.

4. Click "Add Option" to add the option to your simulation.

5. Click "Update Simulation" to view the profit/loss chart and summary information.

## Project Structure

```
options-simulator/
├── app.py                 # Flask application
├── static/                # Static files
│   ├── css/               # CSS stylesheets
│   │   └── styles.css     # Main stylesheet
│   └── js/                # JavaScript files
│       └── app.js         # Main JavaScript file
├── templates/             # HTML templates
│   └── index.html         # Main page template
├── requirements.txt       # Python dependencies
└── README.md              # This file
```

## Technologies Used

- **Backend**: Flask (Python)
- **Frontend**: HTML5, CSS3, JavaScript
- **Charts**: Chart.js
- **Icons**: Font Awesome
- **Stock Data**: Yahoo Finance API (yfinance)
- **Styling**: Custom CSS with responsive design

## License

MIT

## Acknowledgements

- [Yahoo Finance](https://finance.yahoo.com/) for providing stock data
- [Chart.js](https://www.chartjs.org/) for the interactive charts
- [Font Awesome](https://fontawesome.com/) for the icons
