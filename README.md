# QuantDash

QuantDash is a responsive educational trading dashboard with current market
quotes, technical indicators, position sizing, simulated backtesting, a paper
trading journal, and a market-news demo feed.

## View Locally

Requirements:

- Node.js 20.9 or newer
- npm

From this folder, run:

```powershell
npm install
npm run dev
```

Then open the local address printed in the terminal, normally:

```text
http://localhost:3000
```

For a production-style local preview:

```powershell
npm run preview
```

You can also double-click `start-local.bat` on Windows. It installs missing
packages, starts the development server, and opens QuantDash in your browser.

## Main Features

- Latest quotes covering US, Australian, Japanese, Hong Kong, and futures markets
- RSI and MACD analysis backed by recent market history
- Fixed-fractional position sizing calculator
- Clearly labelled synthetic backtest simulator
- Browser-persistent paper trading journal
- Quick Actions for navigating tickers and existing dashboard tools
- Responsive desktop and mobile layouts

Market information is supplied for educational use and may be delayed. QuantDash
does not provide financial advice.
