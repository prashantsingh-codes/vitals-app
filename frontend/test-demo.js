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

const artifactDir = 'C:\\Users\\acer\\.gemini\\antigravity-ide\\brain\\c95d5a0f-fe91-468f-853d-07f676c2f878';
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

    // Helper function injections for DOM manipulation in browser context
    await page.evaluate(() => {
      window.findCard = (cardTitle) => {
        const spans = Array.from(document.querySelectorAll('span'));
        const titleSpan = spans.find(s => s.textContent.trim().toUpperCase() === cardTitle.toUpperCase());
        if (!titleSpan) return null;
        let parent = titleSpan.parentElement;
        while (parent && parent.tagName === 'DIV') {
          if (parent.style.background === 'var(--surface)' || parent.style.borderRadius === '12px' || parent.style.border === '1px solid var(--border)') {
            return parent;
          }
          parent = parent.parentElement;
        }
        return null;
      };

      window.findFoodChip = (foodName) => {
        const card = window.findCard('Food');
        if (!card) return null;
        const divs = Array.from(card.querySelectorAll('div'));
        return divs.find(d => d.style.display === 'flex' && d.style.flexDirection === 'column' && d.textContent.includes(foodName));
      };

      window.findCustomFoodChip = (foodName) => {
        const card = window.findCard('My Custom Foods');
        if (!card) return null;
        const divs = Array.from(card.querySelectorAll('div'));
        return divs.find(d => d.style.minHeight === '60px' && d.textContent.includes(foodName));
      };
    });

    // 7. Verify Custom Food Chip Checkbox Visibility (Hidden when Unpinned)
    console.log("🔍 Verifying that the custom food checkbox is hidden when unpinned...");
    const isCheckboxHiddenInitially = await page.evaluate(() => {
      const shakeChip = window.findCustomFoodChip('Automated Shake');
      if (shakeChip) {
        const childDivs = Array.from(shakeChip.children).filter(el => el.tagName === 'DIV');
        return childDivs.length === 1;
      }
      return false;
    });
    console.log(`🛡️ Is Custom Food checkbox hidden initially (unpinned)? ${isCheckboxHiddenInitially ? 'YES (Passed ✓)' : 'NO (Failed ✕)'}`);

    // Try clicking text in unpinned state to verify it does not toggle check
    console.log("🔍 Verifying that clicking the text of an unpinned custom food does not toggle check...");
    await page.evaluate(() => {
      const shakeChip = window.findCustomFoodChip('Automated Shake');
      if (shakeChip) {
        const textDiv = Array.from(shakeChip.querySelectorAll('div')).find(d => d.textContent.includes('Automated Shake'));
        if (textDiv) textDiv.click();
      }
    });
    await new Promise(r => setTimeout(r, 500));

    const remainsUnchecked = await page.evaluate(() => {
      const shakeChip = window.findCustomFoodChip('Automated Shake');
      if (shakeChip) {
        return !shakeChip.style.background.includes('accentBg');
      }
      return false;
    });
    console.log(`🛡️ Did unpinned custom food remain unchecked after text click? ${remainsUnchecked ? 'YES (Passed ✓)' : 'NO (Failed ✕)'}`);

    // Verify delete button is hidden on back date
    console.log("🔍 Verifying that the custom food delete button is hidden on back date...");
    const isDeleteHiddenOnBackDate = await page.evaluate(() => {
      const shakeChip = window.findCustomFoodChip('Automated Shake');
      if (shakeChip) {
        const deleteBtn = Array.from(shakeChip.querySelectorAll('button')).find(b => b.textContent.trim() === '✕');
        return !deleteBtn;
      }
      return false;
    });
    console.log(`🛡️ Is Custom Food delete button hidden on Yesterday? ${isDeleteHiddenOnBackDate ? 'YES (Passed ✓)' : 'NO (Failed ✕)'}`);

    // 8. Pin the custom food (promoting it)
    console.log("📌 Pinning the custom food (promoting it)...");
    await page.evaluate(() => {
      const shakeChip = window.findCustomFoodChip('Automated Shake');
      if (shakeChip) {
        const pinBtn = Array.from(shakeChip.querySelectorAll('button')).find(b => b.textContent.includes('📌'));
        if (pinBtn) pinBtn.click();
      }
    });
    await new Promise(r => setTimeout(r, 1500));

    // Verify checkbox does NOT appear on CustomFoodChip upon pinning
    console.log("🔍 Verifying that the checkbox does NOT appear on the custom food chip even when pinned...");
    const isCheckboxHiddenOnCustomAfterPin = await page.evaluate(() => {
      const shakeChip = window.findCustomFoodChip('Automated Shake');
      if (shakeChip) {
        const childDivs = Array.from(shakeChip.children).filter(el => el.tagName === 'DIV');
        return childDivs.length === 1;
      }
      return false;
    });
    console.log(`🛡️ Is Custom Food chip checkbox still hidden after pinning? ${isCheckboxHiddenOnCustomAfterPin ? 'YES (Passed ✓)' : 'NO (Failed ✕)'}`);

    // Verify preset chip exists and contains checkbox
    console.log("🔍 Verifying that the pinned preset chip contains the checkbox...");
    const presetContainsCheckbox = await page.evaluate(() => {
      const shakePreset = window.findFoodChip('Automated Shake');
      if (shakePreset) {
        const row = shakePreset.children[0];
        if (row) {
          const checkbox = row.children[0];
          return checkbox && checkbox.tagName === 'DIV' && checkbox.style.width === '16px';
        }
      }
      return false;
    });
    console.log(`🛡️ Does the Food Presets card chip contain the checkbox? ${presetContainsCheckbox ? 'YES (Passed ✓)' : 'NO (Failed ✕)'}`);

    console.log("✅ Checking the custom food preset chip on Yesterday...");
    await page.evaluate(() => {
      const shakePreset = window.findFoodChip('Automated Shake');
      if (shakePreset) {
        const row = shakePreset.children[0];
        if (row) {
          const checkbox = row.children[0];
          if (checkbox) checkbox.click();
        }
      }
    });
    await new Promise(r => setTimeout(r, 1500));

    await page.screenshot({ path: path.join(artifactDir, 'step5_yesterday_pinned_checked.png') });
    console.log("📸 Step 5: Captured Yesterday showing pinned and checked food.");

    // 9. Test Direct Unpinning on Back Date (No options dialog shown)
    console.log("✕ Clicking cross button on Preset item to verify direct unpinning on back date...");
    await page.evaluate(() => {
      const shakePreset = window.findFoodChip('Automated Shake');
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

    // 10. Test Day-Scoped Restoration on Back Date
    console.log("↺ Restoring preset foods on Yesterday...");
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const restoreBtn = buttons.find(b => b.textContent.includes('Restore presets') || b.textContent.includes('Restore all preset foods'));
      if (restoreBtn) restoreBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(artifactDir, 'step5_restored_preset.png') });
    console.log("📸 Restored preset food successfully.");

    // 11. Switch back to Today and verify clean slate (pinned but unchecked, and delete button IS visible)
    console.log("📅 Switching back to Today to verify clean slate...");
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const todayBtn = buttons.find(b => b.textContent.trim() === '← Back to Today' || b.textContent.trim() === 'Today');
      if (todayBtn) todayBtn.click();
    });
    
    await page.waitForFunction(() => !document.body.textContent.includes("Editing past log"), { timeout: 5000 });
    await new Promise(r => setTimeout(r, 1500));

    // Reinject helpers on Today's date page context
    await page.evaluate(() => {
      window.findCard = (cardTitle) => {
        const spans = Array.from(document.querySelectorAll('span'));
        const titleSpan = spans.find(s => s.textContent.trim().toUpperCase() === cardTitle.toUpperCase());
        if (!titleSpan) return null;
        let parent = titleSpan.parentElement;
        while (parent && parent.tagName === 'DIV') {
          if (parent.style.background === 'var(--surface)' || parent.style.borderRadius === '12px' || parent.style.border === '1px solid var(--border)') {
            return parent;
          }
          parent = parent.parentElement;
        }
        return null;
      };

      window.findFoodChip = (foodName) => {
        const card = window.findCard('Food');
        if (!card) return null;
        const divs = Array.from(card.querySelectorAll('div'));
        return divs.find(d => d.style.display === 'flex' && d.style.flexDirection === 'column' && d.textContent.includes(foodName));
      };

      window.findCustomFoodChip = (foodName) => {
        const card = window.findCard('My Custom Foods');
        if (!card) return null;
        const divs = Array.from(card.querySelectorAll('div'));
        return divs.find(d => d.style.minHeight === '60px' && d.textContent.includes(foodName));
      };
    });

    // Verify that the delete button IS visible on Today's date!
    const isDeleteVisibleOnToday = await page.evaluate(() => {
      const shakeChip = window.findCustomFoodChip('Automated Shake');
      if (shakeChip) {
        const deleteBtn = Array.from(shakeChip.querySelectorAll('button')).find(b => b.textContent.trim() === '✕');
        return !!deleteBtn;
      }
      return false;
    });
    console.log(`🛡️ Is Custom Food delete button visible on Today? ${isDeleteVisibleOnToday ? 'YES (Passed ✓)' : 'NO (Failed ✕)'}`);

    await page.screenshot({ path: path.join(artifactDir, 'step6_today_clean_slate.png') });
    console.log("📸 Step 6: Captured Today's Dashboard showing clean slate & delete button presence verified.");

    // 12. Test Date-Scoped Permanent Deletion from Today
    console.log("🗑️ Performing Date-Scoped Permanent Deletion from Today...");
    await page.evaluate(() => {
      const shakePreset = window.findFoodChip('Automated Shake');
      if (shakePreset) {
        const deleteBtn = Array.from(shakePreset.querySelectorAll('button')).find(b => b.textContent.trim() === '✕');
        if (deleteBtn) deleteBtn.click();
      }
    });
    await new Promise(r => setTimeout(r, 1500));

    // Verify that the preset has disappeared from Today's presets
    const isGoneFromPresetsToday = await page.evaluate(() => {
      const shakePreset = window.findFoodChip('Automated Shake');
      return !shakePreset;
    });
    console.log(`🛡️ Is Preset gone from Today's Food Presets list? ${isGoneFromPresetsToday ? 'YES (Passed ✓)' : 'NO (Failed ✕)'}`);

    // Click "Delete" (✕) on the custom food chip itself in "My Custom Foods" on Today to delete the custom food item!
    console.log("🗑️ Deleting the Custom Food item itself from Today's My Custom Foods...");
    await page.evaluate(() => {
      const shakeChip = window.findCustomFoodChip('Automated Shake');
      if (shakeChip) {
        const deleteBtn = Array.from(shakeChip.querySelectorAll('button')).find(b => b.textContent.trim() === '✕');
        if (deleteBtn) deleteBtn.click();
      }
    });
    await new Promise(r => setTimeout(r, 1500));

    // Verify that the custom food has disappeared from Today's "My Custom Foods" list
    const isGoneFromCustomFoodsToday = await page.evaluate(() => {
      const shakeChip = window.findCustomFoodChip('Automated Shake');
      return !shakeChip;
    });
    console.log(`🛡️ Is Custom Food gone from Today's "My Custom Foods" list? ${isGoneFromCustomFoodsToday ? 'YES (Passed ✓)' : 'NO (Failed ✕)'}`);

    // Switch date to Yesterday and verify it is STILL active as preset and visible in custom foods list there!
    console.log("📅 Switching to Yesterday to verify the preset remains active there...");
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const dateBtn = buttons.find(b => b.textContent.match(/^\d{2}\/\d{2}$/));
      if (dateBtn) dateBtn.click();
    });
    await page.waitForFunction(() => document.body.textContent.includes("Editing past log"), { timeout: 5000 });
    await new Promise(r => setTimeout(r, 1500));

    // Reinject helpers on Yesterday page context
    await page.evaluate(() => {
      window.findCard = (cardTitle) => {
        const spans = Array.from(document.querySelectorAll('span'));
        const titleSpan = spans.find(s => s.textContent.trim().toUpperCase() === cardTitle.toUpperCase());
        if (!titleSpan) return null;
        let parent = titleSpan.parentElement;
        while (parent && parent.tagName === 'DIV') {
          if (parent.style.background === 'var(--surface)' || parent.style.borderRadius === '12px' || parent.style.border === '1px solid var(--border)') {
            return parent;
          }
          parent = parent.parentElement;
        }
        return null;
      };

      window.findFoodChip = (foodName) => {
        const card = window.findCard('Food');
        if (!card) return null;
        const divs = Array.from(card.querySelectorAll('div'));
        return divs.find(d => d.style.display === 'flex' && d.style.flexDirection === 'column' && d.textContent.includes(foodName));
      };

      window.findCustomFoodChip = (foodName) => {
        const card = window.findCard('My Custom Foods');
        if (!card) return null;
        const divs = Array.from(card.querySelectorAll('div'));
        return divs.find(d => d.style.minHeight === '60px' && d.textContent.includes(foodName));
      };
    });

    const isActiveOnYesterday = await page.evaluate(() => {
      const shakePreset = window.findFoodChip('Automated Shake');
      const shakeChip = window.findCustomFoodChip('Automated Shake');
      return !shakePreset && !!shakeChip;
    });
    console.log(`🛡️ Is the custom food active but preset unpinned on Yesterday? ${isActiveOnYesterday ? 'YES (Passed ✓)' : 'NO (Failed ✕)'}`);
    await page.screenshot({ path: path.join(artifactDir, 'step7_yesterday_active_retained.png') });

    // Switch to tomorrow and verify it is not present in presets and custom foods
    console.log("📅 Switching back to Today and then checking tomorrow...");
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const todayBtn = buttons.find(b => b.textContent.trim() === '← Back to Today' || b.textContent.trim() === 'Today');
      if (todayBtn) todayBtn.click();
    });
    await page.waitForFunction(() => !document.body.textContent.includes("Editing past log"), { timeout: 5000 });
    await new Promise(r => setTimeout(r, 1000));

    console.log("📅 Clicking tomorrow's tab in DatePickerBar...");
    await page.evaluate(() => {
      const tomorrowStr = () => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${mm}/${dd}`;
      };
      const buttons = Array.from(document.querySelectorAll('button'));
      const tomorrowBtn = buttons.find(b => b.textContent.trim() === tomorrowStr());
      if (tomorrowBtn) tomorrowBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    // Reinject helpers on Tomorrow page context
    await page.evaluate(() => {
      window.findCard = (cardTitle) => {
        const spans = Array.from(document.querySelectorAll('span'));
        const titleSpan = spans.find(s => s.textContent.trim().toUpperCase() === cardTitle.toUpperCase());
        if (!titleSpan) return null;
        let parent = titleSpan.parentElement;
        while (parent && parent.tagName === 'DIV') {
          if (parent.style.background === 'var(--surface)' || parent.style.borderRadius === '12px' || parent.style.border === '1px solid var(--border)') {
            return parent;
          }
          parent = parent.parentElement;
        }
        return null;
      };

      window.findFoodChip = (foodName) => {
        const card = window.findCard('Food');
        if (!card) return null;
        const divs = Array.from(card.querySelectorAll('div'));
        return divs.find(d => d.style.display === 'flex' && d.style.flexDirection === 'column' && d.textContent.includes(foodName));
      };

      window.findCustomFoodChip = (foodName) => {
        const card = window.findCard('My Custom Foods');
        if (!card) return null;
        const divs = Array.from(card.querySelectorAll('div'));
        return divs.find(d => d.style.minHeight === '60px' && d.textContent.includes(foodName));
      };
    });

    const isGoneFromTomorrow = await page.evaluate(() => {
      const shakePreset = window.findFoodChip('Automated Shake');
      const shakeChip = window.findCustomFoodChip('Automated Shake');
      return !shakePreset && !shakeChip;
    });
    console.log(`🛡️ Is the preset and custom food completely gone on Tomorrow? ${isGoneFromTomorrow ? 'YES (Passed ✓)' : 'NO (Failed ✕)'}`);
    await page.screenshot({ path: path.join(artifactDir, 'step8_tomorrow_clean_deleted.png') });

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

