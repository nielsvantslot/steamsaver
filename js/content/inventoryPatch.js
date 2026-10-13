// Runs in the page's own context (content script with "world": "MAIN").
// Instead of shipping a copy of Steam's economy_v2.js (which breaks whenever Steam changes it),
// we keep Steam's script and patch a few of its functions right after it has executed, before
// the page calls InitInventoryPage(). Every patch below changes one thing and lists the Steam
// internals it relies on, so a rename on Steam's side points straight at the patch to fix.
(function () {
  // one continuously scrolling grid instead of numbered pages
  class ContinuousScrollPatch {
    name = 'continuous scrolling (InitDynamicInventoryItemAutosizing, g_bEnableDynamicSizing)';

    isApplicable() {
      return typeof InitDynamicInventoryItemAutosizing === 'function';
    }

    // Steam's responsive mode has the continuous page, but switches it off again on every
    // window resize. Force it back on after the resize handlers have been installed.
    apply() {
      const original = InitDynamicInventoryItemAutosizing;

      InitDynamicInventoryItemAutosizing = function () {
        const result = original.apply(this, arguments);

        $J(window).off('resize.EconomyRepaginateInventory');
        g_bEnableDynamicSizing = true;

        if (typeof UserYou !== 'undefined' && UserYou) UserYou.InvalidatePaging();

        return result;
      };
    }
  }

  // Something (another extension, in practice) can remove the loaded items from the page a few
  // seconds after the load without Steam noticing: Steam still thinks every page is loaded, so
  // the grid shrinks back to the first 25 items. Put them back when that happens.
  class ItemGridRepair {
    static MAX_REPAIRS = 5;

    #observed = new WeakSet();

    watch(page) {
      if (this.#observed.has(page)) return;

      this.#observed.add(page);

      let repairs = 0;

      new MutationObserver(() => {
        if (!this.#isMissingItems(page) || repairs >= ItemGridRepair.MAX_REPAIRS) return;

        repairs++;
        page.m_cPagesLoaded = 0;
        page.EnsurePageItemsCreated();
      }).observe(page.m_$Page[0], { childList: true });
    }

    #isMissingItems(page) {
      const expected = Math.min(page.m_cPagesLoaded * INVENTORY_PAGE_ITEMS, page.m_inventory.m_rgItemElements.length);

      return page.m_bMounted && page.m_$Page[0].children.length < expected;
    }
  }

  // Steam adds the next 25 items only when you scroll near the end of the page. After a reload
  // the browser restores the old scroll position before those items exist, clamps it to the
  // short page and you end up back at the top, so create all items right away (their images
  // still load lazily).
  class EagerItemsPatch {
    name = 'creating all items up front (CSingleResponsivePage.EnsurePageItemsCreated)';

    #repair;

    constructor(repair) {
      this.#repair = repair;
    }

    isApplicable() {
      return typeof CSingleResponsivePage === 'function';
    }

    apply() {
      const original = CSingleResponsivePage.prototype.EnsurePageItemsCreated;
      const repair = this.#repair;

      CSingleResponsivePage.prototype.EnsurePageItemsCreated = function () {
        repair.watch(this);

        // the argument is Steam's "keep going" flag, normally only set while filtering
        return original.call(this, true);
      };
    }
  }

  class InventoryPatcher {
    #patches;

    constructor(patches) {
      this.#patches = patches;
    }

    apply() {
      for (const patch of this.#patches) {
        if (patch.isApplicable()) {
          patch.apply();
        } else {
          console.warn(`steamsaver: skipped ${patch.name}, Steam changed its inventory script`);
        }
      }
    }
  }

  // load events don't bubble, but a capturing listener on the document still sees them (and
  // fires synchronously after the script ran, so there is no race with the inline init code)
  class ScriptLoadObserver {
    #document;
    #scriptName;
    #onLoad;

    constructor(document, scriptName, onLoad) {
      this.#document = document;
      this.#scriptName = scriptName;
      this.#onLoad = onLoad;
    }

    start() {
      const listener = (event) => {
        const node = event.target;

        if (node.tagName !== 'SCRIPT' || !node.getAttribute('src')?.includes(this.#scriptName)) return;

        this.#document.removeEventListener('load', listener, true);
        this.#onLoad();
      };

      this.#document.addEventListener('load', listener, true);
    }
  }

  const patcher = new InventoryPatcher([
    new ContinuousScrollPatch(),
    new EagerItemsPatch(new ItemGridRepair()),
  ]);

  new ScriptLoadObserver(document, 'economy_v2.js', () => patcher.apply()).start();
})();
