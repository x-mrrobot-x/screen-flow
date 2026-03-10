import DOM from "../../lib/dom.js";

const DEFAULT_PAGE_SIZE = 20;

function create({
  container,
  renderItem,
  emptyState,
  pageSize = DEFAULT_PAGE_SIZE
}) {
  let page = 0;
  let allItems = [];
  let sentinel = null;
  let observer = null;

  function hasMoreItems() {
    return page * pageSize < allItems.length;
  }

  function buildBatchFragment() {
    const start = page * pageSize;
    const batch = allItems.slice(start, start + pageSize);
    if (!batch.length) return null;

    const fragment = document.createDocumentFragment();
    batch.forEach((item, i) => {
      const node = renderItem(item, i);
      if (node) fragment.appendChild(node);
    });
    return fragment;
  }

  function appendFragment(fragment) {
    if (sentinel) container.insertBefore(fragment, sentinel);
    else container.appendChild(fragment);
  }

  function insertBatch() {
    const fragment = buildBatchFragment();
    if (!fragment) {
      teardownObserver();
      return;
    }

    appendFragment(fragment);
    page++;
    if (!hasMoreItems()) teardownObserver();
  }

  function createSentinel() {
    const el = document.createElement("div");
    el.className = "pagination-sentinel";
    container.appendChild(el);
    return el;
  }

  function createObserver() {
    const root = DOM.qs("#app");
    return new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) insertBatch();
      },
      { root: root || null, rootMargin: "0px 0px 300px 0px", threshold: 0 }
    );
  }

  function setupObserver() {
    sentinel = createSentinel();
    observer = createObserver();
    observer.observe(sentinel);
  }

  function teardownObserver() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    if (sentinel) {
      sentinel.remove();
      sentinel = null;
    }
  }

  function renderEmptyState() {
    const empty = emptyState();
    if (!empty) return;
    if (typeof empty === "string") container.innerHTML = empty;
    else container.appendChild(empty);
  }

  function reset(items) {
    teardownObserver();
    container.innerHTML = "";
    page = 0;
    allItems = items;

    if (!allItems.length) {
      renderEmptyState();
      return;
    }

    setupObserver();
    insertBatch();
  }

  function destroy() {
    teardownObserver();
    allItems = [];
    page = 0;
  }

  return {
    reset,
    destroy
  };
}

export default {
  create
};
