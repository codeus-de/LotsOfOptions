import yfinance as yf
import matplotlib.pyplot as plt
import numpy as np
from datetime import datetime, timedelta

# Funktion zur Berechnung des Gewinns/Verlusts bei Cash-Secured Puts
def simulate_cash_secured_put(ticker, strike_price, premium, expiration_days):
    # Aktuelle Kursdaten von Yahoo Finance holen
    stock = yf.Ticker(ticker)
    hist = stock.history(period="1mo")  # Letzter Monat für Basisdaten
    current_price = hist['Close'][-1]  # Aktueller Kurs
    
    # Zeitrahmen für die Simulation
    days = np.arange(0, expiration_days + 1)
    prices = np.linspace(current_price * 0.8, current_price * 1.2, 100)  # Preisspanne +/- 20%
    
    # Gewinn/Verlust Berechnung für verschiedene Kurse am Verfall
    profit_loss = []
    for price in prices:
        if price >= strike_price:
            # Option verfällt wertlos, Prämie ist Gewinn
            pl = premium * 100  # Prämie pro Kontrakt (100 Aktien)
        else:
            # Option wird ausgeübt, Aktien werden gekauft
            pl = (premium + (price - strike_price)) * 100
        profit_loss.append(pl)
    
    # Plot erstellen
    plt.figure(figsize=(10, 6))
    plt.plot(prices, profit_loss, label=f"Cash-Secured Put (Strike: ${strike_price}, Premium: ${premium})")
    plt.axvline(x=current_price, color='gray', linestyle='--', label=f"Aktueller Kurs: ${current_price:.2f}")
    plt.axhline(y=0, color='black', linestyle='-', alpha=0.3)
    plt.title(f"Cash-Secured Put Simulator für {ticker}")
    plt.xlabel("Kurs bei Verfall ($)")
    plt.ylabel("Gewinn/Verlust ($)")
    plt.legend()
    plt.grid(True)
    plt.show()
    
    # Zusammenfassung ausgeben
    max_profit = premium * 100
    max_loss = (strike_price - premium) * 100  # Bei Kurs = 0
    breakeven = strike_price - premium
    
    print(f"\nZusammenfassung für {ticker}:")
    print(f"Strike-Preis: ${strike_price}")
    print(f"Prämie pro Aktie: ${premium}")
    print(f"Maximaler Gewinn: ${max_profit:.2f}")
    print(f"Maximaler Verlust: ${max_loss:.2f}")
    print(f"Break-even Kurs: ${breakeven:.2f}")
    print(f"Aktueller Kurs: ${current_price:.2f}")

# Beispielaufruf
if __name__ == "__main__":
    # Parameter definieren
    ticker = "AAPL"  # Beispiel: Apple Aktie
    strike_price = 200  # Strike-Preis der Option
    premium = 5  # Erhaltene Prämie pro Aktie
    expiration_days = 30  # Tage bis Verfall
    
    # Simulator ausführen
    simulate_cash_secured_put(ticker, strike_price, premium, expiration_days)