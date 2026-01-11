# UK Financial Hub

A modern, fast, SEO-friendly web application providing comprehensive financial calculators for UK users.

## Features

- 🏦 Mortgage Calculator
- 💷 Income Tax Calculator
- 🏠 Stamp Duty Land Tax Calculator
- 📈 Simple Interest Calculator
- 💰 Compound Interest Calculator
- 📊 Investment Returns Calculator

## Tech Stack

- Pure HTML5, CSS3, JavaScript (no frameworks)
- Mobile-first responsive design
- Real-time calculations
- SEO optimized with separate pages per calculator
- Lightweight Chart.js for visualizations

## Setup

1. Clone the repository
2. Open `index.html` in a browser or use a local server
3. Deploy to Netlify for production

## Deployment to Netlify

1. Push code to GitHub repository
2. Connect repository to Netlify
3. Build settings: 
   - Build command: (leave empty)
   - Publish directory: `/`
4. Deploy!

## Project Structure

```
uk-financial-hub/
├── index.html                 # Homepage
├── mortgage-calculator.html   # Mortgage calculator
├── income-tax-calculator.html # Income tax calculator
├── stamp-duty-calculator.html # Stamp duty calculator
├── simple-interest-calculator.html
├── compound-interest-calculator.html
├── investment-calculator.html
├── css/
│   └── styles.css            # Global styles
├── js/
│   ├── common.js             # Shared utilities
│   ├── mortgage.js           # Mortgage calculator logic
│   ├── income-tax.js         # Income tax logic
│   ├── stamp-duty.js         # Stamp duty logic
│   ├── simple-interest.js
│   ├── compound-interest.js
│   └── investment.js
├── sitemap.xml               # SEO sitemap
├── robots.txt                # Robots file
└── _redirects                # Netlify redirects

```

## SEO Features

- Semantic HTML5
- Meta descriptions for all pages
- Schema.org structured data
- Separate pages for each calculator
- Sitemap.xml for search engines
- Robots.txt configuration

## License

MIT
