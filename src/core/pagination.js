const PaginationManager = (() => {
  "use strict";

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

    function insertBatch() {
      const start = page * pageSize;
      const batch = allItems.slice(start, start + pageSize);

      if (!batch.length) {
        teardownObserver();
        return;
      }

      const fragment = document.createDocumentFragment();
      batch.forEach((item, i) => {
        const node = renderItem(item, i);
        if (node) fragment.appendChild(node);
      });

      if (sentinel) {
        container.insertBefore(fragment, sentinel);
      } else {
        container.appendChild(fragment);
      }

      page++;

      if (page * pageSize >= allItems.length) {
        teardownObserver();
      }
    }

    function setupObserver() {
      sentinel = document.createElement("div");
      sentinel.className = "pagination-sentinel";
      container.appendChild(sentinel);

      const root = DOM.qs("#app");

      observer = new IntersectionObserver(
        entries => {
          if (entries[0].isIntersecting) insertBatch();
        },
        {
          root: root || null,
          rootMargin: "0px 0px 300px 0px",
          threshold: 0
        }
      );

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

    function reset(items) {
      teardownObserver();
      container.innerHTML = "";
      page = 0;
      allItems = items;

      if (!allItems.length) {
        const empty = emptyState();
        if (empty) {
          if (typeof empty === "string") {
            container.innerHTML = empty;
          } else {
            container.appendChild(empty);
          }
        }
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

  return {
    create
  };
})();
