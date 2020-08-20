// Check if history API is availalble
function supportsHistory() {
  return !!(window.history && window.history.pushState);
}

// Change current history entry
function replaceHistory(hash) {
  if (supportsHistory()) {
    window.history.replaceState(null, null, hash);
  }
}

// Create a new history entry (allows navigating back and forth)
function pushHistory(hash) {
  if (supportsHistory()) {
    window.history.pushState({ hash }, null, hash);
  }
}

// Retrieve hash data from a jQuery wrapped `popstate` event
function getHashFromHistory({ originalEvent: { state } }) {
  return state && state.hash ? state.hash : null;
}

export { supportsHistory, pushHistory, replaceHistory, getHashFromHistory };
