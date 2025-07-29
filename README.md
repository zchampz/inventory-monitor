# Tesla Inventory Monitor 🚘

This Node.js app monitors new inventory listings for **Blue Model Y (LR RWD)** vehicles on Tesla's website near zip code `95051` and alerts you via **SMS** (Twilio) and **Email** (Mailgun) when new listings appear.

It checks for updates **every 15 minutes** and is designed to run continuously as a Heroku Worker.

---

## 🔧 Features

- 🕒 Polls Tesla inventory URL every 15 minutes
- 📩 Sends **email alerts** via [Mailgun](https://www.mailgun.com/)
- 📱 Sends **SMS alerts** via [Twilio](https://www.twilio.com/)
- 🟣 Ready to deploy to **Heroku** (with Procfile and environment support)

---

## 🚀 1-Click Deploy

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/zchampz/inventory-monitor)

---

## ⚙️ Setup Locally (Optional)

### 1. Clone the Repo

```bash
git clone https://github.com/zchampz/inventory-monitor.git
cd inventory-monitor