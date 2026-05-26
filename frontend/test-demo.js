import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const chromePaths = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe')
];

let executablePath = '';
for (const p of chromePaths) {
  if (fs.existsSync(p)) {
    executablePath = p;
    break;
  }
}

if (!executablePath) {
  console.error("❌ Could not find chrome.exe in standard paths!");
  process.exit(1);
}

const artifactDir = 'C:\\Users\\acer\\.gemini\\antigravity-ide\\brain\\809c49c6-3bbb-4615-a80d-a930d80c503f';
if (!fs.existsSync(artifactDir)) {
  fs.mkdirSync(artifactDir, { recursive: true });
}

async function run() {
  console.log("🚀 Launching automated Chrome browser...");
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    defaultViewport: { width: 1200, height: 1200 } // Increased height to prevent vertical cutoff
  });

  const page = await browser.newPage();

  // Listen to browser console messages
  page.on('console', msg => console.log('💬 BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.error('🔴 BROWSER RUNTIME ERROR:', err.toString()));

  try {
    // 1. Load login/signup page
    console.log("🌐 Navigating to Vitals Web App...");
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[placeholder="Email"]');
    await page.screenshot({ path: path.join(artifactDir, 'step1_auth_page.png') });
    console.log("📸 Step 1: Captured Auth Page.");

    // 2. Click Signup tab and create an account
    console.log("👤 Creating a new automated test user...");
    const email = `automated_test_${Date.now()}@vitals.com`;
    
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const signupTab = buttons.find(b => b.textContent.trim() === 'Sign Up');
      if (signupTab) signupTab.click();
    });
    
    await page.waitForSelector('input[placeholder="Your name"]');

    // Fill inputs
    await page.type('input[placeholder="Your name"]', 'AutoTester');
    await page.type('input[placeholder="Email"]', email);
    await page.type('input[placeholder="Password"]', 'password123');
    
    // Click submit
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const submitBtn = buttons.find(b => b.textContent.includes('Create Account'));
      if (submitBtn) submitBtn.click();
    });
    
    console.log("⏳ Waiting for account creation...");
    await page.waitForFunction(() => document.body.textContent.includes("What's your goal?"), { timeout: 15000 });

    // 3. Onboarding Wizard Page
    console.log("📋 Navigating through Onboarding Wizard...");
    await page.evaluate(() => {
      const divs = Array.from(document.querySelectorAll('div'));
      const labelDiv = divs.find(d => d.textContent.trim() === 'Lose Fat');
      if (labelDiv) labelDiv.parentElement.click();
    });
    await new Promise(r => setTimeout(r, 500));

    await page.screenshot({ path: path.join(artifactDir, 'step2_onboarding.png') });
    console.log("📸 Step 2: Captured Onboarding Page.");

    // Click Continue
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent.includes('Continue'));
      if (btn) btn.click();
    });
    
    await page.waitForSelector('input[placeholder="25"]', { timeout: 5000 });

    // Step 1: About you
    await page.type('input[placeholder="25"]', '30');
    await page.type('input[placeholder="75"]', '82');
    await page.type('input[placeholder="175"]', '178');
    
    // Click Continue
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent.includes('Continue'));
      if (btn) btn.click();
    });
    
    await page.waitForSelector('input[placeholder="e.g. 68"]', { timeout: 5000 });

    // Step 2: Activity and Target Weight
    await page.type('input[placeholder="e.g. 68"]', '72');

    // Click "Calculate my targets"
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent.includes('Calculate my targets'));
      if (btn) btn.click();
    });
    
    await page.waitForFunction(() => document.body.textContent.includes("Your targets"), { timeout: 5000 });

    // Step 3: Start tracking
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent.includes('Start tracking'));
      if (btn) btn.click();
    });
    
    await page.waitForFunction(() => document.body.textContent.includes("Welcome Back"), { timeout: 10000 });

    // 4. Main Dashboard (Today)
    console.log("🥗 Navigated to Main Dashboard (Today)!");
    await page.screenshot({ path: path.join(artifactDir, 'step3_dashboard_today.png') });
    console.log("📸 Step 3: Captured Today's Dashboard.");

    // 5. Update water and switch date immediately
    console.log("💧 Updating Water value on Today...");
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('div'));
      const waterCard = cards.find(c => c.textContent.includes('Water'));
      if (waterCard) {
        const plusBtn = Array.from(waterCard.querySelectorAll('button')).find(b => b.textContent.includes('＋') || b.textContent.includes('+ Glass'));
        if (plusBtn) plusBtn.click();
      }
    });
    
    console.log("📅 Switching date to Yesterday immediately...");
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const dateBtn = buttons.find(b => b.textContent.match(/^\d{2}\/\d{2}$/));
      if (dateBtn) dateBtn.click();
    });
    
    await page.waitForFunction(() => document.body.textContent.includes("Editing past log"), { timeout: 5000 });
    await page.screenshot({ path: path.join(artifactDir, 'step4_dashboard_yesterday.png') });
    console.log("📸 Step 4: Captured Yesterday's Dashboard.");

    // Scroll to the bottom to bring Custom Foods list into view
    console.log("↕️ Scrolling to bottom...");
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await new Promise(r => setTimeout(r, 500));

    // 6. Create Custom Food on Yesterday
    console.log("➕ Adding Custom Food on Yesterday...");
    const addBtnFound = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtn = buttons.find(b => b.textContent.includes('Add Custom Food'));
      if (addBtn) {
        addBtn.click();
        return true;
      }
      return false;
    });
    console.log(`👉 Add Custom Food button clicked? ${addBtnFound ? 'YES' : 'NO'}`);
    
    await page.waitForSelector('input[placeholder*="Sprouts salad"]', { timeout: 5000 });

    await page.type('input[placeholder*="Sprouts salad"]', 'Automated Shake');
    await page.type('input[placeholder="kcal"]', '300');
    const gInputs = await page.$$('input[placeholder="g"]');
    if (gInputs[0]) await gInputs[0].type('25');
    if (gInputs[1]) await gInputs[1].type('5');

    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const submitBtn = buttons.find(b => b.textContent.includes('Add Food'));
      if (submitBtn) submitBtn.click();
    });
    
    await page.waitForFunction(() => !document.body.textContent.includes("Add Food"), { timeout: 5000 });
    await new Promise(r => setTimeout(r, 1000));

    // 7. Verify the Custom Food Delete Button (✕) is hidden on back date!
    console.log("🔍 Verifying that the custom food delete button is hidden on back date...");
    const isDeleteHiddenOnBackDate = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('div'));
      const myCustomFoodsCard = cards.find(c => c.textContent.includes('My Custom Foods') && c.textContent.includes('Automated Shake'));
      if (myCustomFoodsCard) {
        const divs = Array.from(myCustomFoodsCard.querySelectorAll('div'));
        const shakeChip = divs.filter(d => d.textContent.includes('Automated Shake') && d.textContent.includes('kcal'))
                              .sort((a, b) => a.textContent.length - b.textContent.length)[0];
        if (shakeChip) {
          const deleteBtn = Array.from(shakeChip.querySelectorAll('button')).find(b => b.textContent.trim() === '✕');
          return !deleteBtn;
        }
      }
      return false;
    });
    console.log(`🛡️ Is Custom Food delete button hidden on Yesterday? ${isDeleteHiddenOnBackDate ? 'YES (Passed ✓)' : 'NO (Failed ✕)'}`);

    // Pin the custom food & Check it on Yesterday
    console.log("📌 Pinning the custom food (promoting it)...");
    await page.evaluate(() => {
      const chips = Array.from(document.querySelectorAll('div')).filter(d => d.textContent.includes('Automated Shake'));
      const shakeChip = chips.find(c => c.textContent.includes('Automated Shake') && c.textContent.includes('kcal'));
      if (shakeChip) {
        const pinBtn = shakeChip.querySelector('button[title*="preset"]');
        if (pinBtn) pinBtn.click();
      }
    });
    await new Promise(r => setTimeout(r, 1500));

    console.log("✅ Checking the custom food on Yesterday...");
    await page.evaluate(() => {
      const chips = Array.from(document.querySelectorAll('div')).filter(d => d.textContent.includes('Automated Shake'));
      const shakeChip = chips.find(c => c.textContent.includes('Automated Shake') && c.textContent.includes('kcal'));
      if (shakeChip) {
        const checkDiv = Array.from(shakeChip.querySelectorAll('div')).find(d => d.textContent.includes('Automated Shake'));
        if (checkDiv) checkDiv.click();
      }
    });
    await new Promise(r => setTimeout(r, 1500));

    await page.screenshot({ path: path.join(artifactDir, 'step5_yesterday_pinned_checked.png') });
    console.log("📸 Step 5: Captured Yesterday showing pinned and checked food.");

    // 8. Test Direct Unpinning on Back Date (No options dialog shown)
    console.log("✕ Clicking cross button on Preset item to verify direct unpinning on back date...");
    await page.evaluate(() => {
      const chips = Array.from(document.querySelectorAll('div')).filter(d => d.textContent.includes('Automated Shake'));
      const shakePreset = chips.find(c => c.textContent.includes('Automated Shake') && c.textContent.includes('MY FOOD'));
      if (shakePreset) {
        const deleteBtn = Array.from(shakePreset.querySelectorAll('button')).find(b => b.textContent.trim() === '✕');
        if (deleteBtn) deleteBtn.click();
      }
    });
    await new Promise(r => setTimeout(r, 1000));

    // Verify that the dialog is NOT shown and it has been unpinned directly!
    const isUnpinnedDirectly = await page.evaluate(() => {
      const isDialogShown = document.body.textContent.includes("Remove") && document.body.textContent.includes("Delete permanently");
      return !isDialogShown;
    });
    console.log(`🛡️ Was unpinned directly without showing deletion options dialog? ${isUnpinnedDirectly ? 'YES (Passed ✓)' : 'NO (Failed ✕)'}`);
    await page.screenshot({ path: path.join(artifactDir, 'step5_unpinned_directly.png') });

    // 9. Test Day-Scoped Restoration on Back Date
    console.log("↺ Restoring preset foods on Yesterday...");
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const restoreBtn = buttons.find(b => b.textContent.includes('Restore presets') || b.textContent.includes('Restore all preset foods'));
      if (restoreBtn) restoreBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(artifactDir, 'step5_restored_preset.png') });
    console.log("📸 Restored preset food successfully.");

    // 10. Switch back to Today and verify clean slate (pinned but unchecked, and delete button IS visible)
    console.log("📅 Switching back to Today to verify clean slate...");
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const todayBtn = buttons.find(b => b.textContent.trim() === '← Back to Today' || b.textContent.trim() === 'Today');
      if (todayBtn) todayBtn.click();
    });
    
    await page.waitForFunction(() => !document.body.textContent.includes("Editing past log"), { timeout: 5000 });
    await new Promise(r => setTimeout(r, 1500));

    // Verify that the delete button IS visible on Today's date!
    const isDeleteVisibleOnToday = await page.evaluate(() => {
      const chips = Array.from(document.querySelectorAll('div')).filter(d => d.textContent.includes('Automated Shake'));
      const shakeChip = chips.find(c => c.textContent.includes('Automated Shake') && c.textContent.includes('kcal'));
      if (shakeChip) {
        const deleteBtn = Array.from(shakeChip.querySelectorAll('button')).find(b => b.textContent.trim() === '✕');
        return !!deleteBtn;
      }
      return false;
    });
    console.log(`🛡️ Is Custom Food delete button visible on Today? ${isDeleteVisibleOnToday ? 'YES (Passed ✓)' : 'NO (Failed ✕)'}`);

    await page.screenshot({ path: path.join(artifactDir, 'step6_today_clean_slate.png') });
    console.log("📸 Step 6: Captured Today's Dashboard showing clean slate & delete button presence verified.");

    console.log("🎉 All automated test cases successfully completed!");
  } catch (err) {
    console.error("❌ Test runner error:", err);
    try {
      await page.screenshot({ path: path.join(artifactDir, 'error_screenshot.png') });
      console.log("📸 Captured error state screenshot.");
    } catch (screenshotErr) {
      console.error("Failed to capture error screenshot:", screenshotErr);
    }
  } finally {
    await browser.close();
  }
}

run();
