// Runs in the page's own context (content script with "world": "MAIN").
// Instead of shipping a copy of Steam's economy_v2.js (which breaks whenever Steam
// changes it), we keep Steam's script and only patch a function right after
// economy_v2.js has executed, before the page calls InitInventoryPage().

// load events don't bubble, but a capturing listener on the document still sees them
// (and fires synchronously after the script ran, so no race with the inline init code)
const onResourceLoad = function (event) {
  const node = event.target;

  if (node.tagName !== 'SCRIPT' || !node.getAttribute('src')?.includes('economy_v2.js')) return;

  document.removeEventListener('load', onResourceLoad, true);

  if (typeof InitDynamicInventoryItemAutosizing !== 'function') {
    console.warn('steamsaver: InitDynamicInventoryItemAutosizing not found, Steam changed its inventory script');
    return;
  }

  // Steam adds the next 25 items only when you scroll near the end of the page. After a
  // reload the browser restores the old scroll position before those items exist, clamps it
  // to the short page and you end up back at the top, so create all items right away
  // (their images still load lazily).
  const originalEnsureItems = CSingleResponsivePage.prototype.EnsurePageItemsCreated;

  CSingleResponsivePage.prototype.EnsurePageItemsCreated = function () {
    watchPage(this);

    return originalEnsureItems.call(this, true);
  };

  // Something (another extension, in practice) can remove the loaded items from the page a
  // few seconds after the load without Steam noticing: Steam still thinks every page is
  // loaded, so the grid shrinks back to the first 25 items. Put them back when that happens.
  const MAX_REPAIRS = 5;

  const watchPage = function (page) {
    if (page.m_steamSaverObserver) return;

    let repairs = 0;

    page.m_steamSaverObserver = new MutationObserver(function () {
      const expected = Math.min(page.m_cPagesLoaded * INVENTORY_PAGE_ITEMS, page.m_inventory.m_rgItemElements.length);

      if (!page.m_bMounted || page.m_$Page[0].children.length >= expected || repairs >= MAX_REPAIRS) return;

      repairs++;
      page.m_cPagesLoaded = 0;
      page.EnsurePageItemsCreated();
    });

    page.m_steamSaverObserver.observe(page.m_$Page[0], { childList: true });
  };

  // Steam's responsive mode gives one continuously scrolling page instead of numbered
  // pages. Steam switches it off again on every window resize, so force it back on
  // after the resize handlers have been installed.
  const originalAutosizing = InitDynamicInventoryItemAutosizing;

  InitDynamicInventoryItemAutosizing = function () {
    const result = originalAutosizing.apply(this, arguments);

    $J(window).off('resize.EconomyRepaginateInventory');
    g_bEnableDynamicSizing = true;

    if (typeof UserYou !== 'undefined' && UserYou) UserYou.InvalidatePaging();

    return result;
  };
};

document.addEventListener('load', onResourceLoad, true);
