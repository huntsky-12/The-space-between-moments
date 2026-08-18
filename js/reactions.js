(() => {
  const API_BASE =
    window.WRITINGS_API_URL || "https://the-space-between-moments.onrender.com";

  const clientKey =
    "space-between-moments-client-id";


  // =========================================================
  // CLIENT ID
  // =========================================================

  function getClientId() {
    let id = localStorage.getItem(clientKey);

    if (!id) {
      if (
        window.crypto &&
        typeof window.crypto.randomUUID === "function"
      ) {
        id = window.crypto.randomUUID();
      } else {
        id =
          "client-" +
          Date.now() +
          "-" +
          Math.random().toString(36).slice(2);
      }

      localStorage.setItem(clientKey, id);
    }

    return id;
  }


  // =========================================================
  // GET WRITING SLUG
  // =========================================================

  function getSlug() {
    const match =
      window.location.pathname.match(/\/writings\/([^/]+)/);

    return match ? match[1] : null;
  }


  // =========================================================
  // LOAD LIKE STATE + COUNT
  // =========================================================

  async function loadLikeState(button, slug) {
    try {
      const clientId = getClientId();

      const response = await fetch(
        `${API_BASE}/api/writings/${encodeURIComponent(
          slug
        )}/likes?client_id=${encodeURIComponent(clientId)}`
      );

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      // Heart
      button.textContent =
        data.liked ? "♥" : "♡";

      button.classList.toggle(
        "liked",
        data.liked
      );

      button.setAttribute(
        "aria-label",
        data.liked
          ? "Unlike this writing"
          : "Like this writing"
      );

      // Like count
      updateLikeCount(
        button,
        data.count
      );

    } catch (error) {

      console.error(
        "Could not load like state:",
        error
      );

    }
  }


  // =========================================================
  // LIKE COUNT
  // =========================================================

  function updateLikeCount(button, count) {

    let countElement =
      button.querySelector(".reaction-count");

    if (!countElement) {

      countElement =
        document.createElement("span");

      countElement.className =
        "reaction-count";

      button.appendChild(countElement);
    }

    countElement.textContent = count;
  }


  // =========================================================
  // LIKE / UNLIKE
  // =========================================================

  async function toggleLike(button, slug) {

    const clientId =
      getClientId();

    const isLiked =
      button.classList.contains("liked");

    const method =
      isLiked ? "DELETE" : "POST";

    button.disabled = true;

    try {

      const response = await fetch(
        `${API_BASE}/api/writings/${encodeURIComponent(
          slug
        )}/like`,
        {
          method: method,

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            client_id: clientId
          })
        }
      );

      if (!response.ok) {
        throw new Error(
          "Like request failed"
        );
      }

      const data =
        await response.json();


      // Update heart
      button.classList.toggle(
        "liked",
        data.liked
      );

      button.textContent =
        data.liked ? "♥" : "♡";


      // Update count
      updateLikeCount(
        button,
        data.count
      );


      button.setAttribute(
        "aria-label",
        data.liked
          ? "Unlike this writing"
          : "Like this writing"
      );

    } catch (error) {

      console.error(
        "Like request failed:",
        error
      );

    } finally {

      button.disabled = false;

    }
  }


  // =========================================================
  // COPY LINK FALLBACK
  // =========================================================

  async function copyLink(url) {

    // Modern clipboard API
    if (
      navigator.clipboard &&
      typeof navigator.clipboard.writeText ===
        "function" &&
      window.isSecureContext
    ) {
      await navigator.clipboard.writeText(url);
      return true;
    }


    // Older / file:// fallback
    const textarea =
      document.createElement("textarea");

    textarea.value = url;

    textarea.style.position =
      "fixed";

    textarea.style.left =
      "-9999px";

    textarea.style.top =
      "0";

    document.body.appendChild(
      textarea
    );

    textarea.focus();
    textarea.select();

    const success =
      document.execCommand("copy");

    textarea.remove();

    return success;
  }


  // =========================================================
  // SHARE
  // =========================================================

  async function shareWriting(
    button,
    slug
  ) {

    const url =
      window.location.href;

    const title =
      document.querySelector(
        ".hero h1"
      )?.textContent?.trim()
      || document.title;


    button.disabled = true;


    try {

      // =====================================================
      // LOCAL FILE
      //
      // DO NOT USE navigator.share() HERE.
      // This prevents the Chrome crash you're seeing.
      // =====================================================

      if (
        window.location.protocol ===
        "file:"
      ) {

        await copyLink(url);

        showShareSuccess(button);

        return;
      }


      // =====================================================
      // HOSTED WEBSITE
      //
      // Use native share only on a proper web origin.
      // =====================================================

      if (
        typeof navigator.share ===
          "function" &&
        window.isSecureContext
      ) {

        try {

          await navigator.share({
            title: title,
            text: title,
            url: url
          });

          return;

        } catch (error) {

          /*
           * User cancelled the share sheet.
           * Don't show an error.
           */

          console.log(
            "Share cancelled:",
            error
          );

          return;
        }
      }


      // =====================================================
      // FALLBACK
      // =====================================================

      await copyLink(url);

      showShareSuccess(button);


    } catch (error) {

      console.error(
        "Share failed:",
        error
      );

      showShareError(button);

    } finally {

      button.disabled = false;

    }
  }


  // =========================================================
  // SHARE SUCCESS
  // =========================================================

  function showShareSuccess(button) {

    const original =
      "↗";

    button.textContent =
      "✓";

    setTimeout(() => {

      button.textContent =
        original;

    }, 1200);
  }


  // =========================================================
  // SHARE ERROR
  // =========================================================

  function showShareError(button) {

    button.textContent =
      "×";

    setTimeout(() => {

      button.textContent =
        "↗";

    }, 1200);
  }


  // =========================================================
  // SETUP
  // =========================================================

  function setup() {

    const slug =
      getSlug();

    if (!slug) {
      return;
    }


    const shareButton =
      document.querySelector(
        ".share-btn"
      );

    const likeButton =
      document.querySelector(
        ".like-btn"
      );


    // -------------------------------------------------------
    // Load Like count/state
    // -------------------------------------------------------

    if (likeButton) {

      loadLikeState(
        likeButton,
        slug
      );

      likeButton.addEventListener(
        "click",
        () =>
          toggleLike(
            likeButton,
            slug
          )
      );
    }


    // -------------------------------------------------------
    // Share
    // -------------------------------------------------------

    if (shareButton) {

      shareButton.addEventListener(
        "click",
        () =>
          shareWriting(
            shareButton,
            slug
          )
      );
    }

  }


  // =========================================================
  // START
  // =========================================================

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      setup
    );

  } else {

    setup();

  }

})();