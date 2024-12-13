// Helper function to extract game ID from chessgames.com URL
function getChessGamesId() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('gid') || 'unknown';
}

// Helper function to create storage key
function createStorageKey(gameId) {
  return `pgnData_${gameId}`;
}

// Check which site we're on
if (window.location.hostname === "www.chessgames.com") {
  const gameId = getChessGamesId();
  const storageKey = createStorageKey(gameId);

  let pngUrl = Array.from(document.querySelectorAll("a"))
    .map(n => n.href)
    .filter(href => href.includes("viewGamePGN"))[0];

  fetch(pngUrl)
    .then(response => response.text())
    .then(pgnContent => {
      // Store the PGN content with game ID in the key
      chrome.storage.local.set({
        [storageKey]: {
          pgn: pgnContent,
          timestamp: Date.now()
        }
      }, function () {
        // Pass the game ID in the URL to lichess
        window.location.href = `https://lichess.org/paste#${gameId}`;
      });
    })
    .catch((e) => {
      console.error("Error:", e);
      alert("Error fetching the game");
    });

} else if (window.location.hostname === "lichess.org") {
  // Get the game ID from the URL hash
  const gameId = window.location.hash.slice(1);
  const storageKey = createStorageKey(gameId);

  chrome.storage.local.get([storageKey], function (result) {
    const data = result[storageKey];
    if (data && data.pgn) {
      const checkForm = setInterval(() => {
        const textarea = document.querySelector("form.import textarea[name=pgn]");
        if (textarea) {
          clearInterval(checkForm);

          // Fill the textarea with PGN
          textarea.value = data.pgn;

          // Find and check the analyze checkbox
          const analyzeCheckbox = document.querySelector("input[name=analyse]");
          if (analyzeCheckbox) {
            analyzeCheckbox.checked = true;
          }

          // Submit the form
          const form = document.querySelector("form.import");
          if (form) {
            form.submit();
          }

          // Clear just this game's stored PGN
          chrome.storage.local.remove(storageKey);
        }
      }, 100);
    }
  });

  // Cleanup old stored PGNs (older than 5 minutes)
  chrome.storage.local.get(null, function (items) {
    const now = Date.now();
    const keysToRemove = Object.entries(items)
      .filter(([key, value]) =>
        key.startsWith('pgnData_') &&
        (now - value.timestamp) > 5 * 60 * 1000
      )
      .map(([key]) => key);
    
    if (keysToRemove.length > 0) {
      chrome.storage.local.remove(keysToRemove);
    }
  });
}