const express = require("express");
const puppeteer = require("puppeteer");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// Simple sleep helper to pause execution for a given time
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

app.post("/order", async (req, res) => {
  const { asin } = req.body;
  if (!asin) return res.status(400).json({ error: "ASIN is required" });

  let browser;
  try {
    console.log("Launching browser...");
    browser = await puppeteer.launch({
      headless: true, // Set to false to watch the browser
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });

    console.log("Opening new page...");
    const page = await browser.newPage();

    const url = `https://www.amazon.in/dp/${asin}`;
    console.log("Navigating to:", url);
    await page.goto(url, { waitUntil: "networkidle2" });

    console.log("Waiting for Buy Now button...");
    await page.waitForSelector("#buy-now-button", { timeout: 10000 });

    console.log("Clicking Buy Now...");
    await page.click("#buy-now-button");

    console.log("Sleeping for 5 seconds to let page load...");
    await sleep(5000); // Wait for the page to load after clicking "Buy Now"

    // If there's a sign-in page or address selection, wait for them to load
    try {
      console.log("Waiting for Address Selection...");
      await page.waitForSelector('input[name="address1"]', { timeout: 10000 });

      console.log("Address form detected. Filling in address...");
      // Simulate filling in address (this step is optional, can be removed if not needed)
      await page.type('input[name="address1"]', "Test Address");
      await page.type('input[name="city"]', "Test City");
      await page.type('input[name="zip"]', "123456");

      console.log("Sleeping for another 5 seconds...");
      await sleep(5000);

      console.log("Clicking continue...");
      await page.click('input[name="continue"]');

      // Waiting for the next page to load
      await page.waitForTimeout(5000); // Adjust the wait time as needed
    } catch (error) {
      console.log("No address form detected or other issue:", error);
    }

    console.log("Checking for order confirmation...");
    // After all the steps above, make sure the order is being placed
    await page.waitForSelector('button[name="placeYourOrder1"]', { timeout: 10000 });

    console.log("Clicking Place Order...");
    await page.click('button[name="placeYourOrder1"]');

    console.log("Sleeping for 5 seconds to finalize order...");
    await sleep(5000); // Allow some time for the order to finalize

    await browser.close();
    console.log("✅ Order attempt complete.");
    return res.status(200).json({ message: "Order attempt done." });

  } catch (err) {
    console.error("❌ Order Failed:", err);
    if (browser) await browser.close();
    return res.status(500).json({ error: "Failed to place order", details: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Puppeteer Worker running on http://localhost:${PORT}`);
});
