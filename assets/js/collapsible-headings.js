document.addEventListener("DOMContentLoaded", () => {
  // Runs on /work/ pages (as on the old site) or on any page whose
  // front matter sets `collapsible: true` (the layout then marks <main>).
  const optedIn = document.querySelector("main[data-collapsible]");
  if (!optedIn && !window.location.pathname.includes("/work/")) {
    return;
  }

  makeH2Sections();
  makeH3Subsections();
});

function makeH2Sections() {
  // Skip the course sidebar's own heading.
  const headings = Array.from(document.querySelectorAll("main h2")).filter(
    (h) => !h.closest(".course-nav")
  );

  headings.forEach((heading) => {
    if (heading.dataset.collapsibleProcessed === "true") {
      return;
    }

    heading.dataset.collapsibleProcessed = "true";

    const wrapper = document.createElement("div");
    wrapper.className = "collapsible-content collapsible-content-h2";

    let node = heading.nextSibling;
    let movedAnything = false;

    while (node) {
      const next = node.nextSibling;

      if (
        node.nodeType === Node.ELEMENT_NODE &&
        /^H[1-2]$/.test(node.tagName)
      ) {
        break;
      }

      wrapper.appendChild(node);
      movedAnything = true;
      node = next;
    }

    if (!movedAnything) {
      return;
    }

    heading.classList.add("collapsible-heading", "collapsible-heading-h2");
    heading.parentNode.insertBefore(wrapper, heading.nextSibling);

    heading.addEventListener("click", () => {
      heading.classList.toggle("is-collapsed");
      wrapper.classList.toggle("is-collapsed-h2");
    });
  });
}

function makeH3Subsections() {
  // Skip the course sidebar's own heading.
  const headings = Array.from(document.querySelectorAll("main h3")).filter(
    (h) => !h.closest(".course-nav")
  );

  headings.forEach((heading) => {
    if (heading.dataset.subcollapsibleProcessed === "true") {
      return;
    }

    heading.dataset.subcollapsibleProcessed = "true";

    const wrapper = document.createElement("div");
    wrapper.className = "collapsible-content collapsible-content-h3";

    let node = heading.nextSibling;
    let movedAnything = false;

    while (node) {
      const next = node.nextSibling;

      if (
        node.nodeType === Node.ELEMENT_NODE &&
        /^H[1-3]$/.test(node.tagName)
      ) {
        break;
      }

      wrapper.appendChild(node);
      movedAnything = true;
      node = next;
    }

    if (!movedAnything) {
      return;
    }

    heading.classList.add("collapsible-heading", "collapsible-heading-h3");
    heading.classList.add("is-collapsed");
    wrapper.classList.add("is-collapsed");
    heading.parentNode.insertBefore(wrapper, heading.nextSibling);

    heading.addEventListener("click", (event) => {
      event.stopPropagation();
      heading.classList.toggle("is-collapsed");
      wrapper.classList.toggle("is-collapsed");
    });
  });
}
