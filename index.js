// puppeteer-worker/index.js
const express = require("express");
const puppeteer = require("puppeteer");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

app.post("/order", async (req, res) => {
  const { asin } = req.body;

  if (!asin) return res.status(400).json({ error: "ASIN is required" });

  try {
    const url = `https://www.amazon.in/dp/${asin}`;
    const browser = await puppeteer.launch({ headless: false }); // use `true` for Render
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2" });

    // Wait and click "Buy Now"
    await page.waitForSelector("#buy-now-button", { timeout: 10000 });
    await page.click("#buy-now-button");

    // You can also wait for address and continue here...
    await page.waitForTimeout(5000);

    await browser.close();
    return res.status(200).json({ message: "Order attempt done." });
  } catch (err) {
    console.error("Order Failed:", err.message);
    return res.status(500).json({ error: "Failed to place order" });
  }
});

app.listen(3001, () => console.log("✅ Puppeteer Worker running on http://localhost:3001"));
