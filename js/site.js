(() => {
  const yearNodes = document.querySelectorAll("[data-year]");
  yearNodes.forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduceMotion) {
    window.addEventListener(
      "pointermove",
      (event) => {
        document.body.style.setProperty("--spot-x", `${event.clientX}px`);
        document.body.style.setProperty("--spot-y", `${event.clientY}px`);
      },
      { passive: true }
    );
  }

  document.querySelectorAll(".card").forEach((card) => {
    const items = card.querySelectorAll(".details > li");
    if (items.length <= 4) return;

    card.classList.add("has-more");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "more";
    button.setAttribute("aria-expanded", "false");
    button.textContent = "Read more";

    const details = card.querySelector(".details");
    details?.after(button);

    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const open = card.classList.toggle("is-open");
      button.setAttribute("aria-expanded", String(open));
      button.textContent = open ? "Show less" : "Read more";
    });
  });

  const links = [...document.querySelectorAll("[data-section-nav] a")];
  const sections = [...document.querySelectorAll("[data-section]")];
  let lockedId = null;
  let lockGen = 0;
  let unlockTimer = 0;

  const setActive = (id) => {
    if (!id) return;
    links.forEach((link) => {
      const match = link.getAttribute("href") === `#${id}`;
      link.classList.toggle("is-active", match);
      if (match) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  };

  const sectionFromScroll = () => {
    if (!sections.length) return null;
    const probe = Math.round(window.innerHeight * 0.28);
    let current = sections[0].id;
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= probe) current = section.id;
    }
    const scrolled = window.scrollY + window.innerHeight;
    const docHeight = document.documentElement.scrollHeight;
    if (scrolled >= docHeight - 8) current = sections[sections.length - 1].id;
    return current;
  };

  const syncFromScroll = () => {
    if (lockedId) {
      setActive(lockedId);
      return;
    }
    setActive(sectionFromScroll());
  };

  const lockUntilSettled = (id) => {
    const gen = ++lockGen;
    lockedId = id;
    setActive(id);
    window.clearTimeout(unlockTimer);
    const unlock = () => {
      if (gen !== lockGen) return;
      lockedId = null;
      syncFromScroll();
    };
    unlockTimer = window.setTimeout(unlock, reduceMotion ? 80 : 900);
    window.addEventListener("scrollend", unlock, { once: true });
  };

  links.forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href") || "";
      if (!href.startsWith("#")) return;
      const id = href.slice(1);
      const target = document.getElementById(id);
      if (!target) return;
      event.preventDefault();
      lockUntilSettled(id);
      target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      history.replaceState(null, "", href);
      link.blur();
    });
  });

  window.addEventListener("scroll", syncFromScroll, { passive: true });
  window.addEventListener("resize", syncFromScroll);

  const hash = window.location.hash.slice(1);
  if (hash && document.getElementById(hash)) setActive(hash);
  else syncFromScroll();
})();
