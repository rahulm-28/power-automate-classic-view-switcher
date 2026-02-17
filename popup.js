const POWER_AUTOMATE_DOMAINS = ["make.powerautomate.com", "flow.microsoft.com"];

// Updated regex pattern to match:
// - /flows/{flowId} (with optional /runs/{runId})
// - Works with /environments/.../solutions/.../flows/{flowId}
// - Works with /flows/shared/{flowId}
const FLOW_EDITOR_PATTERN = /\/flows\/[a-f0-9-]+(\/(runs\/[^/?]+))?$/i;

document.addEventListener("DOMContentLoaded", async () => {
  const statusDiv = document.getElementById("status");
  const switchBtn = document.getElementById("switchBtn");
  const autoModeToggle = document.getElementById("autoMode");
  const modeDescription = document.getElementById("modeDescription");

  // Load saved auto-mode setting
  const { autoMode } = await chrome.storage.sync.get({ autoMode: false });
  autoModeToggle.checked = autoMode;
  updateModeDescription(autoMode);

  // Save setting when toggle changes
  autoModeToggle.addEventListener("change", async () => {
    const isEnabled = autoModeToggle.checked;
    await chrome.storage.sync.set({ autoMode: isEnabled });
    updateModeDescription(isEnabled);
  });

  function updateModeDescription(isEnabled) {
    if (isEnabled) {
      modeDescription.textContent =
        "✅ Auto-switch is ON. Classic designer will load automatically.";
      modeDescription.style.color = "#107c10";
    } else {
      modeDescription.textContent =
        "When enabled, automatically switches to classic designer when editing flows or viewing run history.";
      modeDescription.style.color = "#666";
    }
  }

  // Get current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // Check if URL is valid
  if (!tab.url || tab.url.startsWith("chrome://")) {
    statusDiv.textContent = "❌ Cannot access this page";
    statusDiv.className = "status invalid";
    switchBtn.disabled = true;
    return;
  }

  const url = new URL(tab.url);

  // Check if on Power Automate domain
  const isValidDomain = POWER_AUTOMATE_DOMAINS.some((domain) =>
    url.hostname.includes(domain),
  );

  if (!isValidDomain) {
    statusDiv.textContent = "❌ Not on Power Automate";
    statusDiv.className = "status invalid";
    switchBtn.disabled = true;
    return;
  }

  // Check if it's an edit mode or run history URL
  const pathname = url.pathname;
  const isFlowEditor = FLOW_EDITOR_PATTERN.test(pathname);

  if (!isFlowEditor) {
    statusDiv.textContent = "ℹ️ Not in flow editor or run history";
    statusDiv.className = "status neutral";
    switchBtn.disabled = true;
    return;
  }

  // Check current v3 status
  const currentV3 = url.searchParams.get("v3");

  if (currentV3 === "false") {
    statusDiv.textContent = "✅ Already using Classic Designer";
    statusDiv.className = "status valid";
    switchBtn.textContent = "Switch to New Designer";
  } else {
    statusDiv.textContent = "⚠️ Using New Designer (v3)";
    statusDiv.className = "status invalid";
    switchBtn.textContent = "Switch to Classic Designer";
  }

  // Handle button click
  switchBtn.addEventListener("click", () => {
    if (currentV3 === "false") {
      url.searchParams.set("v3", "true");
    } else {
      url.searchParams.set("v3", "false");
    }

    chrome.tabs.update(tab.id, { url: url.toString() });
    window.close();
  });
});
