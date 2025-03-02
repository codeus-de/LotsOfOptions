import yfinance as yf
import matplotlib.pyplot as plt
import numpy as np
import tkinter as tk
from tkinter import ttk

class OptionSimulator:
    def __init__(self, root):
        self.root = root
        self.root.title("Cash-Secured Put Simulator")
        self.options = []  # Liste für Strike-Preis und Prämie
        
        # UI-Elemente
        self.ticker_label = ttk.Label(root, text="Ticker (z. B. AAPL):")
        self.ticker_label.grid(row=0, column=0, padx=5, pady=5)
        self.ticker_entry = ttk.Entry(root)
        self.ticker_entry.grid(row=0, column=1, padx=5, pady=5)
        self.ticker_entry.insert(0, "AAPL")  # Standardwert
        
        self.strike_label = ttk.Label(root, text="Strike-Preis ($):")
        self.strike_label.grid(row=1, column=0, padx=5, pady=5)
        self.strike_entry = ttk.Entry(root)
        self.strike_entry.grid(row=1, column=1, padx=5, pady=5)
        
        self.premium_label = ttk.Label(root, text="Prämie ($ pro Aktie):")
        self.premium_label.grid(row=2, column=0, padx=5, pady=5)
        self.premium_entry = ttk.Entry(root)
        self.premium_entry.grid(row=2, column=1, padx=5, pady=5)
        
        self.expiration_label = ttk.Label(root, text="Tage bis Verfall:")
        self.expiration_label.grid(row=3, column=0, padx=5, pady=5)
        self.expiration_entry = ttk.Entry(root)
        self.expiration_entry.grid(row=3, column=1, padx=5, pady=5)
        self.expiration_entry.insert(0, "30")  # Standardwert
        
        self.add_button = ttk.Button(root, text="Option hinzufügen", command=self.add_option)
        self.add_button.grid(row=4, column=0, padx=5, pady=5)
        
        self.plot_button = ttk.Button(root, text="Simulation anzeigen", command=self.plot_simulation)
        self.plot_button.grid(row=4, column=1, padx=5, pady=5)
        
        self.option_listbox = tk.Listbox(root, height=5)
        self.option_listbox.grid(row=5, column=0, columnspan=2, padx=5, pady=5, sticky="ew")
        
        self.delete_button = ttk.Button(root, text="Ausgewählte Option löschen", command=self.delete_option)
        self.delete_button.grid(row=6, column=0, columnspan=2, padx=5, pady=5)

    def add_option(self):
        try:
            strike = float(self.strike_entry.get())
            premium = float(self.premium_entry.get())
            self.options.append({"strike": strike, "premium": premium})
            self.option_listbox.insert(tk.END, f"Strike: ${strike}, Prämie: ${premium}")
            self.strike_entry.delete(0, tk.END)
            self.premium_entry.delete(0, tk.END)
        except ValueError:
            tk.messagebox.showerror("Fehler", "Bitte gültige Zahlen für Strike und Prämie eingeben!")

    def delete_option(self):
        selection = self.option_listbox.curselection()
        if selection:
            index = selection[0]
            self.option_listbox.delete(index)
            self.options.pop(index)

    def plot_simulation(self):
        if not self.options:
            tk.messagebox.showwarning("Warnung", "Füge mindestens eine Option hinzu!")
            return
        
        ticker = self.ticker_entry.get()
        try:
            expiration_days = int(self.expiration_entry.get())
        except ValueError:
            tk.messagebox.showerror("Fehler", "Bitte eine gültige Zahl für Tage bis Verfall eingeben!")
            return
        
        # Kursdaten holen
        stock = yf.Ticker(ticker)
        hist = stock.history(period="1mo")
        current_price = hist['Close'][-1]
        prices = np.linspace(current_price * 0.8, current_price * 1.2, 100)
        
        # Plot erstellen
        plt.figure(figsize=(10, 6))
        for option in self.options:
            strike_price = option["strike"]
            premium = option["premium"]
            profit_loss = []
            for price in prices:
                if price >= strike_price:
                    pl = premium * 100
                else:
                    pl = (premium + (price - strike_price)) * 100
                profit_loss.append(pl)
            plt.plot(prices, profit_loss, label=f"Strike: ${strike_price}, Premium: ${premium}")
        
        plt.axvline(x=current_price, color='gray', linestyle='--', label=f"Aktueller Kurs: ${current_price:.2f}")
        plt.axhline(y=0, color='black', linestyle='-', alpha=0.3)
        plt.title(f"Cash-Secured Put Simulator für {ticker}")
        plt.xlabel("Kurs bei Verfall ($)")
        plt.ylabel("Gewinn/Verlust ($)")
        plt.legend()
        plt.grid(True)
        plt.show()
        
        # Zusammenfassung im Terminal
        print(f"\nZusammenfassung für {ticker} (Aktueller Kurs: ${current_price:.2f}):")
        for option in self.options:
            strike_price = option["strike"]
            premium = option["premium"]
            max_profit = premium * 100
            max_loss = (strike_price - premium) * 100
            breakeven = strike_price - premium
            print(f"\nStrike: ${strike_price}, Prämie: ${premium}")
            print(f"Maximaler Gewinn: ${max_profit:.2f}")
            print(f"Maximaler Verlust: ${max_loss:.2f}")
            print(f"Break-even Kurs: ${breakeven:.2f}")

if __name__ == "__main__":
    root = tk.Tk()
    app = OptionSimulator(root)
    root.mainloop()