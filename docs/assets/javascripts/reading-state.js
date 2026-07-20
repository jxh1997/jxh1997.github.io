(function () {
  const STORAGE_KEY = "pm-reading-state:v1";
  const LAST_COLUMN_KEY = "pm-last-column-page:v1";
  const COLUMN_PREFIX = "/columns/";
  const THROTTLE_MS = 600;
  const RESTORE_DELAYS = [40, 160, 400, 900, 1600, 2600];

  let lastSave = 0;
  let activeKey = null;
  let activePath = null;
  let activeTitle = "";
  let initialized = false;

  function isColumnPath(pathname = window.location.pathname) {
    return pathname.includes(COLUMN_PREFIX);
  }

  function isColumnLanding(pathname = window.location.pathname) {
    const path = normalizePath(pathname);
    return path.endsWith("/columns") || path.endsWith("/columns/product");
  }

  function isColumnArticlePath(pathname = window.location.pathname) {
    return isColumnPath(pathname) && !isColumnLanding(pathname);
  }

  function normalizePath(pathname = window.location.pathname) {
    return pathname.replace(/\/$/, "");
  }

  function loadState() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch (_) {
      return {};
    }
  }

  function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function currentTitle() {
    const title = document.querySelector("h1");
    return title ? title.textContent.trim() : document.title;
  }

  function getScrollPercent() {
    const doc = document.documentElement;
    const scrollable = doc.scrollHeight - window.innerHeight;
    if (scrollable <= 0) return 100;
    return Math.min(100, Math.max(0, Math.round((window.scrollY / scrollable) * 100)));
  }

  function rememberActivePage() {
    if (!isColumnArticlePath()) return;
    activeKey = normalizePath();
    activePath = window.location.pathname;
    activeTitle = currentTitle();
    localStorage.setItem(LAST_COLUMN_KEY, activePath);
  }

  function persistProgress(force = false) {
    if (!activeKey) return;
    if (activePath && normalizePath() !== normalizePath(activePath)) return;

    const now = Date.now();
    if (!force && now - lastSave < THROTTLE_MS) return;
    lastSave = now;

    const state = loadState();
    const previous = state[activeKey] || {};
    const progress = Math.max(previous.progress || 0, getScrollPercent());

    state[activeKey] = {
      ...previous,
      title: activeTitle || currentTitle(),
      path: activePath || window.location.pathname,
      progress,
      scrollY: window.scrollY,
      updatedAt: new Date().toISOString(),
      done: previous.done || progress >= 96,
    };

    saveState(state);
  }

  function restoreProgress(record) {
    if (!record || !record.scrollY) return;

    RESTORE_DELAYS.forEach((delay) => {
      window.setTimeout(() => {
        if (normalizePath() === activeKey) {
          window.scrollTo({ top: record.scrollY, behavior: "auto" });
        }
      }, delay);
    });
  }

  function initPage() {
    persistProgress(true);

    if (isColumnLanding()) {
      const lastColumnPage = localStorage.getItem(LAST_COLUMN_KEY);
      if (lastColumnPage && normalizePath(lastColumnPage) !== normalizePath()) {
        window.location.assign(lastColumnPage);
        return;
      }
    }

    if (!isColumnArticlePath()) {
      activeKey = null;
      activePath = null;
      activeTitle = "";
      return;
    }

    rememberActivePage();
    const record = loadState()[activeKey];
    restoreProgress(record);
    window.setTimeout(() => persistProgress(true), 1300);
  }

  function bindGlobalEvents() {
    if (initialized) return;
    initialized = true;

    window.addEventListener("scroll", () => persistProgress(), { passive: true });
    window.addEventListener("pagehide", () => persistProgress(true));
    window.addEventListener("beforeunload", () => persistProgress(true));
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") persistProgress(true);
    });
    document.addEventListener(
      "click",
      (event) => {
        const link = event.target.closest && event.target.closest("a[href]");
        if (!link) return;
        persistProgress(true);

        const url = new URL(link.href, window.location.href);
        const lastColumnPage = localStorage.getItem(LAST_COLUMN_KEY);
        if (
          lastColumnPage
          && url.origin === window.location.origin
          && isColumnLanding(url.pathname)
        ) {
          event.preventDefault();
          window.location.assign(lastColumnPage);
        }
      },
      true,
    );
  }

  bindGlobalEvents();

  if (typeof document$ !== "undefined") {
    document$.subscribe(initPage);
  } else {
    document.addEventListener("DOMContentLoaded", initPage);
  }
})();
