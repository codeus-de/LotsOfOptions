from flask import Flask, render_template, jsonify, request
from yahooquery import Ticker
import os
import logging
from datetime import datetime, timedelta

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)

@app.route('/')
def index():
    """Render the main page of the application."""
    return render_template('index.html')

@app.route('/api/stock-data')
def get_stock_data():
    """API endpoint to fetch stock data."""
    ticker_symbol = request.args.get('ticker', 'AAPL')
    
    try:
        # Get stock data using yahooquery
        app.logger.info(f"Fetching data for ticker: {ticker_symbol}")
        ticker = Ticker(ticker_symbol)
        
        # Get price data
        end_date = datetime.now()
        start_date = end_date - timedelta(days=30)
        hist = ticker.history(start=start_date, end=end_date)
        
        if hist.empty:
            app.logger.error(f"Empty history data for {ticker_symbol}")
            return jsonify({"error": f"No data found for ticker: {ticker_symbol}"}), 404
            
        # Get the last row of data
        current_price = float(hist.iloc[-1]['close'])
        app.logger.info(f"Current price for {ticker_symbol}: {current_price}")
        
        # Get additional info
        info = ticker.summary_detail[ticker_symbol]
        quote = ticker.price[ticker_symbol]
        
        app.logger.info(f"Successfully fetched info for {ticker_symbol}")
        
        # Basic data to return
        data = {
            "ticker": ticker_symbol,
            "current_price": current_price,
            "last_updated": hist.index[-1][1].strftime('%Y-%m-%d'),  # Index contains (symbol, date)
            "company_name": quote.get('shortName', ''),
            "sector": quote.get('sector', ''),
            "market_cap": info.get('marketCap', None),
            "pe_ratio": info.get('trailingPE', None),
            "dividend_yield": info.get('dividendYield', 0) * 100,
            "fifty_two_week_high": info.get('fiftyTwoWeekHigh', None),
            "fifty_two_week_low": info.get('fiftyTwoWeekLow', None)
        }
        
        return jsonify(data)
    
    except Exception as e:
        app.logger.error(f"Error processing request for {ticker_symbol}: {str(e)}")
        return jsonify({
            "error": f"Error fetching data: {str(e)}",
            "details": "If this persists, please try again in a few minutes"
        }), 500

@app.route('/api/simulate', methods=['POST'])
def simulate_options():
    """API endpoint to perform options simulation calculations."""
    try:
        data = request.json
        ticker_symbol = data.get('ticker', 'AAPL')
        options = data.get('options', [])
        expiration_days = data.get('expiration_days', 30)
        
        app.logger.info(f"Simulating options for {ticker_symbol}")
        
        if not options:
            app.logger.error(f"No options provided for {ticker_symbol}")
            return jsonify({"error": "No options provided"}), 400
        
        # Get current stock price using yahooquery
        ticker = Ticker(ticker_symbol)
        current_price = float(ticker.price[ticker_symbol]['regularMarketPrice'])
        
        app.logger.info(f"Current price for {ticker_symbol}: {current_price}")
        
        # Calculate results for each option
        results = []
        for option in options:
            strike = option.get('strike')
            premium = option.get('premium')
            
            if strike is None or premium is None:
                continue
                
            max_profit = premium * 100
            max_loss = (strike - premium) * 100
            breakeven = strike - premium
            
            results.append({
                "strike": strike,
                "premium": premium,
                "max_profit": max_profit,
                "max_loss": max_loss,
                "breakeven": breakeven,
                "current_price": current_price
            })
        
        return jsonify({
            "ticker": ticker_symbol,
            "current_price": current_price,
            "expiration_days": expiration_days,
            "results": results
        })
    
    except Exception as e:
        app.logger.error(f"Error processing request for options simulation: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Ensure the static and templates directories exist
    os.makedirs('static/css', exist_ok=True)
    os.makedirs('static/js', exist_ok=True)
    os.makedirs('templates', exist_ok=True)
    
    # Run the application
    app.run(debug=True, host='0.0.0.0', port=5000)
