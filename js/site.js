/* =========================================================
   INSANITY IS A BANE — NATIVE SCROLL CANVAS

   IMPORTANT:
   There is intentionally NO wheel-event handler.

   Trackpad/mouse wheel scrolling is handled natively by the browser,
   which means it works immediately without clicking/focusing anything.

   CSS scroll-snap locks each scene to exactly one viewport.
   ========================================================= */

(() => {
  const viewport = document.querySelector(".site-viewport");
  const scenes = [...document.querySelectorAll(".site-scene")];

  if (!viewport || !scenes.length) return;

  let currentPage = 1;
  let scrollTimer = null;

  const pageFromHash = () => {
    const match = location.hash.match(/^#page([1-4])$/);
    return match ? Number(match[1]) : 1;
  };

  const clamp = (page) =>
    Math.max(1, Math.min(scenes.length, Number(page)));

  const go = (page, updateHistory = true) => {
    page = clamp(page);

    scenes[page - 1].scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

    if (updateHistory) {
      history.pushState({ page }, "", `#page${page}`);
    }
  };

  const syncPage = () => {
    const center = viewport.scrollTop + viewport.clientHeight * 0.5;

    let closest = 0;
    let distance = Infinity;

    scenes.forEach((scene, index) => {
      const sceneCenter = scene.offsetTop + scene.offsetHeight * 0.5;
      const d = Math.abs(sceneCenter - center);

      if (d < distance) {
        distance = d;
        closest = index;
      }
    });

    const page = closest + 1;

    if (page !== currentPage) {
      currentPage = page;
      history.replaceState(
        { page },
        "",
        `#page${page}`
      );
    }
  };

  /*
   * Click / ENTER / MENU controls.
   */
  document.addEventListener("click", (event) => {
    const link = event.target.closest("[data-page]");
    if (!link) return;

    const page = Number(link.dataset.page);
    if (!page) return;

    event.preventDefault();
    go(page, true);
  });

  /*
   * Native scroll is already handling:
   *   trackpad swipe up/down
   *   mouse wheel
   *   touch scrolling
   *
   * We only observe the result.
   */
  viewport.addEventListener(
    "scroll",
    () => {
      window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(syncPage, 60);
    },
    { passive: true }
  );

  /*
   * Browser Back / Forward.
   */
  window.addEventListener("popstate", (event) => {
    const page = clamp(
      event.state?.page ?? pageFromHash()
    );

    currentPage = page;

    scenes[page - 1].scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });

  /*
   * Keyboard.
   */
  document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" || event.key === "PageDown") {
      event.preventDefault();
      go(currentPage + 1, true);
    }

    if (event.key === "ArrowUp" || event.key === "PageUp") {
      event.preventDefault();
      go(currentPage - 1, true);
    }
  });

  /*
   * Initial position.
   */
  const initialPage = clamp(pageFromHash());

  history.replaceState(
    { page: initialPage },
    "",
    `#page${initialPage}`
  );

  requestAnimationFrame(() => {
    viewport.scrollTo({
      top: scenes[initialPage - 1].offsetTop,
      behavior: "auto"
    });
    currentPage = initialPage;
  });
})();
