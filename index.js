const express = require("express");
const puppeteer = require("puppeteer");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.post("/order", async (req, res) => {
  const { asin } = req.body;
  if (!asin) return res.status(400).send("ASIN is required");

  try {
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    const page = await browser.newPage();

    const url = `https://www.amazon.in/dp/${asin}`;
    await page.goto(url, { waitUntil: "networkidle2" });

    console.log("Opened URL:", url);
    await browser.close();
    res.send("Product opened successfully");
  } catch (err) {
    console.error("Puppeteer error:", err);
    res.status(500).send("Failed to open product");
  }
});

app.get("/", (req, res) => {
  res.send("Puppeteer worker running ✅");
});

app.listen(PORT, () => {
  console.log(`Worker running on port ${PORT}`);
});
