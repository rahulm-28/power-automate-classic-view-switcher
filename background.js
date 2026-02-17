const POWER_AUTOMATE_DOMAINS = ["make.powerautomate.com", "flow.microsoft.com"];

// Regex pattern to match flow editor and run history URLs
const FLOW_EDITOR_PATTERN = /\/flows\/[a-f0-9-]+(\/(runs\/[^/?]+))?$/i;

// Track recently redirected tabs to prevent infinite loops
const recentlyRedirected = new Map();

console.log("Background script loaded!");

// Listen for tab updates
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Only act when URL changes
  if (!changeInfo.url) return;

  console.log("=== Tab URL Changed ===");
  console.log("Tab ID:", tabId);
  console.log("New URL:", changeInfo.url);

  // Check if we recently redirected this tab (prevent infinite loop)
  const lastRedirect = recentlyRedirected.get(tabId);
  if (lastRedirect && Date.now() - lastRedirect < 5000) {
    console.log("Skipping - recently redirected this tab");
    return;
  }

  // Check if auto-mode is enabled
  const { autoMode } = await chrome.storage.sync.get({ autoMode: false });
  console.log("Auto mode enabled:", autoMode);

  if (!autoMode) {
    console.log("Auto mode is OFF - skipping");
    return;
  }

  try {
    const url = new URL(changeInfo.url);
    console.log("Hostname:", url.hostname);
    console.log("Pathname:", url.pathname);

    // Check if on Power Automate domain
    const isValidDomain = POWER_AUTOMATE_DOMAINS.some((domain) =>
      url.hostname.includes(domain),
    );
    console.log("Is valid domain:", isValidDomain);

    if (!isValidDomain) {
      console.log("Not a Power Automate domain - skipping");
      return;
    }

    // Check if it's an edit mode or run history URL
    const pathname = url.pathname;
    const isFlowEditor = FLOW_EDITOR_PATTERN.test(pathname);
    console.log("Is flow editor:", isFlowEditor);

    if (!isFlowEditor) {
      console.log("Not a flow editor URL - skipping");
      return;
    }

    // Check current v3 status
    const currentV3 = url.searchParams.get("v3");
    console.log("Current v3 value:", currentV3);

    // If not already set to false, redirect
    if (currentV3 !== "false") {
      url.searchParams.set("v3", "false");
      const newUrl = url.toString();
      console.log(">>> REDIRECTING to:", newUrl);

      // Mark this tab as recently redirected
      recentlyRedirected.set(tabId, Date.now());

      // Clean up old entries after 10 seconds
      setTimeout(() => recentlyRedirected.delete(tabId), 10000);

      chrome.tabs.update(tabId, { url: newUrl });
    } else {
      console.log("Already v3=false - no redirect needed");
    }
  } catch (e) {
    console.log("Error:", e);
  }
});

// Also listen for when a tab completes loading (backup trigger)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete") return;
  if (!tab.url) return;

  // Check if we recently redirected this tab
  const lastRedirect = recentlyRedirected.get(tabId);
  if (lastRedirect && Date.now() - lastRedirect < 5000) {
    return;
  }

  // Check if auto-mode is enabled
  const { autoMode } = await chrome.storage.sync.get({ autoMode: false });
  if (!autoMode) return;

  try {
    const url = new URL(tab.url);

    // Check if on Power Automate domain
    const isValidDomain = POWER_AUTOMATE_DOMAINS.some((domain) =>
      url.hostname.includes(domain),
    );
    if (!isValidDomain) return;

    // Check if it's an edit mode or run history URL
    const isFlowEditor = FLOW_EDITOR_PATTERN.test(url.pathname);
    if (!isFlowEditor) return;

    // Check current v3 status
    const currentV3 = url.searchParams.get("v3");

    if (currentV3 !== "false") {
      url.searchParams.set("v3", "false");
      console.log(">>> BACKUP REDIRECT to:", url.toString());

      recentlyRedirected.set(tabId, Date.now());
      setTimeout(() => recentlyRedirected.delete(tabId), 10000);

      chrome.tabs.update(tabId, { url: url.toString() });
    }
  } catch (e) {
    // Ignore errors
  }
});
