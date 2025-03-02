from flask import Flask, render_template, jsonify, request
import yfinance as yf
import os

app = Flask(__name__)

@app.route('/')
def index():
    """Render the main page of the application."""
    return render_template('index.html')

@app.route('/api/stock-data')
def get_stock_data():
    """API endpoint to fetch stock data."""
    ticker = request.args.get('ticker', 'AAPL')
    
    try:
        # Get stock data using yfinance
        stock = yf.Ticker(ticker)
        hist = stock.history(period="1mo")
        
        if hist.empty:
            return jsonify({"error": f"No data found for ticker: {ticker}"}), 404
        
        current_price = hist['Close'][-1]
        
        # Get additional info if available
        info = {}
        try:
            info = stock.info
        except:
            pass
        
        # Basic data to return
        data = {
            "ticker": ticker,
            "current_price": current_price,
            "last_updated": hist.index[-1].strftime('%Y-%m-%d'),
        }
        
        # Add additional data if available
        if info:
            additional_data = {
                "company_name": info.get('shortName', ''),
                "sector": info.get('sector', ''),
                "market_cap": info.get('marketCap', None),
                "pe_ratio": info.get('trailingPE', None),
                "dividend_yield": info.get('dividendYield', None) * 100 if info.get('dividendYield') else None,
                "fifty_two_week_high": info.get('fiftyTwoWeekHigh', None),
                "fifty_two_week_low": info.get('fiftyTwoWeekLow', None)
            }
            data.update(additional_data)
        
        return jsonify(data)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/simulate', methods=['POST'])
def simulate_options():
    """API endpoint to perform options simulation calculations."""
    try:
        data = request.json
        ticker = data.get('ticker', 'AAPL')
        options = data.get('options', [])
        expiration_days = data.get('expiration_days', 30)
        
        if not options:
            return jsonify({"error": "No options provided"}), 400
        
        # Get current stock price
        stock = yf.Ticker(ticker)
        hist = stock.history(period="1mo")
        
        if hist.empty:
            return jsonify({"error": f"No data found for ticker: {ticker}"}), 404
        
        current_price = hist['Close'][-1]
        
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
            "ticker": ticker,
            "current_price": current_price,
            "expiration_days": expiration_days,
            "results": results
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Ensure the static and templates directories exist
    os.makedirs('static/css', exist_ok=True)
    os.makedirs('static/js', exist_ok=True)
    os.makedirs('templates', exist_ok=True)
    
    # Run the application
    app.run(debug=True, host='0.0.0.0', port=5000)
