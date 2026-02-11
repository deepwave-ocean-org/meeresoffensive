import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import Fuse from 'https://cdn.jsdelivr.net/npm/fuse.js@6.6.2/dist/fuse.esm.js';

if (
  window.matchMedia('(pointer: fine)').matches
) {
  const SIDEBAR_HIGHLIGHT_LIMIT = 3;

  function initializeMapVisualization(svg, links, nodes, width, height) {

    // -------- Rendering the Map --------------//
    const drag = (simulation) => {
      let dragStart = null
      function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.1).restart();
        d.fx = d.x;
        d.fy = d.y;
        dragStart = { x: event.x, y: event.y };
      }

      function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
      }

      function dragended(event, d) {

        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
        if (dragStart &&
          Math.abs(dragStart.x - event.x) < 15 &&
          Math.abs(dragStart.y - event.y) < 15) {
          // This was a click - handle navigation
          if (d.data.anchor) {
            const targetElement = document.getElementById(d.data.anchor);

            if (targetElement) {
              window.closeMap()
              const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY;
              window.scrollTo(0, targetPosition);
              history.pushState(null, null, d.data.href);
            }
          }
        }
      }

      return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }
	console.log(width, height, "hello")
    const boundingForce = () => {
      const padding = 200;
      const y_padding = 100;
      for (let node of nodes) {
        node.x = Math.max(-width / 2 + padding, Math.min(width / 2 - padding, node.x));
        node.y = Math.max(-height / 2 + y_padding, Math.min(height / 2 - y_padding, node.y));
      }
    }

    const simulation = d3.forceSimulation(nodes)
      .force("center", d3.forceCenter(0, 0))
      .force("link", d3.forceLink(links)
        .id(d => d.id)
        .distance(d => {
          return d.target.depth === 2 ? 40 : 20;
        })
        .strength(d => {
          return d.target.depth === 2 ? 0.2 : 0.3;
        }))
      .force("charge", d3.forceManyBody()
        .strength(d => {
          return d.depth === 2 ? -window.innerWidth / 1.4 : -window.innerWidth / 4.5;
        }))
      .force("collide", d3.forceCollide()
        .radius(d => d.depth === 2 ? 55 : 20)
        .strength(0.6))
      .force("bounds", boundingForce);

    const defs = svg.append("defs");

    const gradientLeft = defs.append("linearGradient")
      .attr("id", "lineGradientLeft")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "0%");

    gradientLeft.selectAll("stop")
      .data([
        { offset: "50%", color: "#999", opacity: 1 },
        { offset: "80%", color: "#999", opacity: 0 }
      ])
      .join("stop")
      .attr("offset", d => d.offset)
      .attr("stop-color", d => d.color)
      .attr("stop-opacity", d => d.opacity);

    const gradientRight = defs.append("linearGradient")
      .attr("id", "lineGradientRight")
      .attr("x1", "100%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "0%");

    gradientRight.selectAll("stop")
      .data([
        { offset: "50%", color: "#999", opacity: 1 },
        { offset: "80%", color: "#999", opacity: 0 }
      ])
      .join("stop")
      .attr("offset", d => d.offset)
      .attr("stop-color", d => d.color)
      .attr("stop-opacity", d => d.opacity);

    const link = svg.append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("opacity", 0.7)
      .attr("stroke", d => {
        if (d.source.depth < 1) { return "#999" } else {
          return d.target.x < d.source.x ? "url(#lineGradientRight)" : "url(#lineGradientLeft)"
        }
      })
      .attr("stroke-width", 1.5);

    const textContainer = svg.append("g")
      .attr("class", "text-labels")
      .attr("pointer-events", "none");

    const node = svg.append("g")
      .attr("fill", "#fff")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("fill", d => {
        if (d.depth > 1) return "transparent";
      })
      .attr("r", 6)
      .style("cursor", "pointer")
      // .style("display", d => d.depth === 0 ? "none" : null)
      .call(drag(simulation));

    const imageSize = 100
    node.each(function (d) {
      const element = d3.select(this);

      if (d.data.thumbnail && d.depth !== 0) {
        element.append("image")
          .attr("xlink:href", d.data.thumbnail)
          .attr("width", imageSize)
          .attr("height", imageSize)
          .attr("x", -imageSize / 2)
          .attr("y", -imageSize + 10)
          .attr("visibility", "hidden")
        element.append("foreignObject")
          .datum(d)
          .attr("x", d.x - 150)
          .attr("y", d.y - 30)
          // .attr("y", d.y + 10)
          .attr("width", 250)
          .attr("height", 30)
          .append("xhtml:div")
          .attr("class", "hover-text")
          .style("display", d => d.depth === 1 ? "none" : null)
          .text(d.data.name);
      } else {
        element.append("circle")
          .attr("fill", d.depth <= 1 ? "#fff" : "transparent")
          .attr("r", d.depth === 0 ? 7 : 6);
      }
    });

    // let activeText = null;

    // node.on("mouseover", (event, d) => {
    //   textContainer.selectAll("text").remove();
    //   node.selectAll("g").attr("class", "node-inactive")
    //   activeText = textContainer
    //     .append("foreignObject")
    //     .datum(d)
    //     .attr("x", d.x - 100)
    //     .attr("y", d.y + 10)
    //     .attr("width", 200)
    //     .attr("height", 300)
    //     .append("xhtml:div")
    //     .attr("class", "hover-text")
    //     .style("display", d => d.depth === 1 ? "none" : null)
    //     .text(d.data.name);
    // })
    //   .on("mouseout", () => {
    //     textContainer.selectAll("foreignObject").remove();
    //     node.selectAll("circle").attr("class", "")
    //     activeText = null;
    //   })


    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y)
        .attr("stroke", d => {
          if (d.source.depth < 1) { return "#999" } else {
            return d.target.x < d.source.x ? "url(#lineGradientRight)" : "url(#lineGradientLeft)"
          }
        })

      node.attr("transform", d => `translate(${d.x},${d.y})`);

      // if (activeText) {
      //   const d = activeText.datum();
      //   activeText.attr("transform", d => `translate(${d.x},${d.y})`);
      // }
    });

    return svg.node();
  }

  document.addEventListener('DOMContentLoaded', function () {
    const width = window.innerWidth;
    const height = window.innerHeight - 50;
    const firstMenuHeight = window.innerHeight - 100;

    const menuSvg = d3.create("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [-width / 2, -height / 2, width, height])
      .attr("style", "max-width: 100%; height: auto;");
    const slideSvg = d3.create("svg")
      .attr("width", width)
      .attr("height", firstMenuHeight)
      .attr("viewBox", [-width / 2, -height / 2, width, firstMenuHeight])
      .attr("style", "max-width: 100%; height: auto; margin-top: 40px");

    console.log(window.mapdata);
    const root = d3.hierarchy(window.mapdata);
    const nodes = root.descendants();

    // ---- toggling the Map ------ //
    const map = document.getElementById('map');
    const sidebar = document.getElementById('desktop-sidebar-nav');
    const infoVideo = document.getElementById('info-video');
    const search = document.getElementById('search-bar')
    const searchResults = document.getElementById("search-results")
    const searchContainer = document.getElementById("search-container");
    let sidebarClearTimer = null;

    const mapSlide = document.getElementById("map-slide-child")
    let overlayCloseTimer = null;

    function showOverlay(mode = "search") {
      if (overlayCloseTimer) {
        clearTimeout(overlayCloseTimer);
        overlayCloseTimer = null;
      }
      map.classList.remove("hidden");
      if (mode === "sidebar") {
        map.classList.add("sidebar-mode");
      } else {
        map.classList.remove("sidebar-mode");
      }
      requestAnimationFrame(() => {
        map.classList.add("is-overlay-open");
      });
    }

    function hideOverlay() {
      map.classList.remove("is-overlay-open");
      overlayCloseTimer = setTimeout(() => {
        map.classList.add("hidden");
        map.classList.remove("sidebar-mode");
      }, 220);
    }

    function closeMap() {
      console.log("closeMap")
      if (sidebar) {
        sidebar.classList.remove("is-open");
        sidebar.querySelectorAll(".desktop-sidebar-toggle[aria-expanded='true']").forEach(toggle => {
          toggle.setAttribute("aria-expanded", "false");
        });
        sidebar.querySelectorAll(".desktop-sidebar-level-2").forEach(list => {
          list.classList.add("is-collapsed");
        });
      }

      hideOverlay();
      infoVideo.classList.add("hidden");
      document.querySelectorAll(".video-container.hidden, .view-1.hidden, .view-2.hidden").forEach(el => el.classList.remove("hidden"));
      const darkBackground = document.querySelector(".mo-background.background-dark");
      if (darkBackground) {
        darkBackground.classList.remove("background-dark");
      }
      const activeEtikett = document.querySelector(".desktop-search-etikett.active");
      if (activeEtikett) {
        activeEtikett.classList.remove("active");
        activeEtikett.classList.remove("is-hidden");
        activeEtikett.setAttribute("aria-expanded", "false");
      }
      window.lenis.start();
      document.body.style.overflow = '';
      search.blur();
      search.value = "";
      renderSearchResults()
    }

    function openSidebar(section) {
      console.log("openSidebar", section)
      if (!sidebar) {
        return;
      }
      const videoCont = section.querySelector(".video-container");
      const view1 = section.querySelector(".view-1");
      const view2 = section.querySelector(".view-2");
      const background = section.querySelector(".mo-background");
      const etikett = section.querySelector(".desktop-search-etikett")

      window.scrollTo(0, section.getBoundingClientRect().top + window.scrollY);
      if (etikett) {
        etikett.classList.add("active");
        etikett.classList.add("is-hidden");
        etikett.setAttribute("aria-expanded", "true");
      }
      [videoCont, view1, view2].forEach(el => el.classList.add("hidden"));
      sidebar.classList.add("is-open");
      showOverlay("sidebar");
      background.classList.add("background-dark");
      window.lenis.stop();
      document.body.style.overflow = 'hidden';
      search.focus();
      renderSearchResults()
    }

    function openSearchOverlay(section) {
      console.log("openSearchOverlay", section)
      const videoCont = section.querySelector(".video-container");
      const view1 = section.querySelector(".view-1");
      const view2 = section.querySelector(".view-2");
      const background = section.querySelector(".mo-background");
      const etikett = section.querySelector(".desktop-search-etikett")

      window.scrollTo(0, section.getBoundingClientRect().top + window.scrollY);
      if (etikett) {
        etikett.classList.add("active");
        etikett.classList.add("is-hidden");
        etikett.setAttribute("aria-expanded", "true");
      }
      [videoCont, view1, view2].forEach(el => el.classList.add("hidden"));
      showOverlay("search");
      if (sidebar) {
        sidebar.classList.remove("is-open");
      }
      background.classList.add("background-dark");
      window.lenis.stop();
      document.body.style.overflow = 'hidden';
      search.focus();
      renderSearchResults()
    }
    function openInfoVideo(section) {
      console.log("openInfoVideo", section)
      const videoCont = section.querySelector(".video-container");
      const view1 = section.querySelector(".view-1");
      const view2 = section.querySelector(".view-2");
      const background = section.querySelector(".mo-background");

      const etikett = section.querySelector(".desktop-search-etikett")
      window.scrollTo(0, section.getBoundingClientRect().top + window.scrollY);
      if (etikett) {
        etikett.classList.add("active");
        etikett.classList.add("is-hidden");
        etikett.setAttribute("aria-expanded", "true");
      }
      [videoCont, view1, view2].forEach(el => el.classList.add("hidden"));
      infoVideo.classList.remove("hidden");
      background.classList.add("background-dark");
      window.lenis.stop();
      document.body.style.overflow = 'hidden';
      // search.focus();
      // renderSearchResults()
    }


    window.closeMap = closeMap
    window.openMap = openSidebar
    window.openInfoVideo = openInfoVideo

    if (sidebar) {
      // Keep sidebar highlights when mouse moves from search results to sidebar
      sidebar.addEventListener("mouseenter", () => {
        if (sidebarClearTimer) { clearTimeout(sidebarClearTimer); sidebarClearTimer = null; }
      });
      sidebar.addEventListener("wheel", (event) => {
        event.stopPropagation();
      }, { passive: true });
      sidebar.addEventListener("touchmove", (event) => {
        event.stopPropagation();
      }, { passive: true });

      sidebar.querySelectorAll(".desktop-sidebar-toggle").forEach(toggle => {
        toggle.addEventListener("click", () => {
          const sectionId = toggle.dataset.sidebarSection;
          const childList = sidebar.querySelector(`[data-sidebar-children="${sectionId}"]`);
          const isExpanded = toggle.getAttribute("aria-expanded") === "true";
          toggle.setAttribute("aria-expanded", isExpanded ? "false" : "true");
          if (childList) {
            childList.classList.toggle("is-collapsed", isExpanded);
          }
        });
      });

      sidebar.querySelectorAll(".desktop-sidebar-link").forEach(link => {
        link.addEventListener("click", () => {
          closeMap();
        });
      });

      // Active state tracking: highlight current section in sidebar
      function updateSidebarActiveState() {
        const currentHash = normalizeAnchor(window.location.hash);
        if (!currentHash) return;

        // Clear all active states
        sidebar.querySelectorAll(".desktop-sidebar-link.is-active").forEach(el => el.classList.remove("is-active"));
        sidebar.querySelectorAll(".desktop-sidebar-toggle.is-active-parent").forEach(el => el.classList.remove("is-active-parent"));

        // Find matching link
        const activeLink = getSidebarLinkByAnchor(currentHash);
        if (activeLink) {
          activeLink.classList.add("is-active");
          // Also highlight parent toggle
          const parentItem = activeLink.closest(".desktop-sidebar-item");
          if (parentItem) {
            const parentToggle = parentItem.querySelector(".desktop-sidebar-toggle");
            if (parentToggle) {
              parentToggle.classList.add("is-active-parent");
            }
          }
        }
      }

      // Update on hash change and on replaceState
      window.addEventListener("hashchange", updateSidebarActiveState);
      const origReplaceState = history.replaceState.bind(history);
      history.replaceState = function() {
        origReplaceState.apply(this, arguments);
        updateSidebarActiveState();
      };
      updateSidebarActiveState();
    }

    map.addEventListener("click", (event) => {
      if (map.classList.contains("hidden")) {
        return;
      }
      const clickedInsideSearch = searchContainer?.contains(event.target);
      const clickedInsideSidebar = sidebar?.contains(event.target);
      if (!clickedInsideSearch && !clickedInsideSidebar) {
        closeMap();
      }
    });

    infoVideo.addEventListener("click", (event) => {
      const clickedInsideFrame = event.target.closest("iframe");
      if (!clickedInsideFrame) {
        closeMap();
      }
    });

    function normalizeAnchor(value) {
      if (!value) {
        return "";
      }
      let normalized = String(value).replace(/^#/, "");
      let previous = "";
      while (normalized !== previous) {
        previous = normalized;
        try {
          normalized = decodeURIComponent(normalized);
        } catch {
          break;
        }
      }
      return normalized.toLowerCase();
    }

    function getSidebarLinkByAnchor(anchor) {
      if (!sidebar) {
        return null;
      }
      const targetAnchor = normalizeAnchor(anchor);
      const sidebarLinks = sidebar.querySelectorAll(".desktop-sidebar-link");
      for (const link of sidebarLinks) {
        const href = link.getAttribute("href") || "";
        if (normalizeAnchor(href) === targetAnchor) {
          return link;
        }
      }
      return null;
    }

    function clearSidebarSearchHighlights(collapseLists = false) {
      if (!sidebar) {
        return;
      }
      sidebar.querySelectorAll(".desktop-sidebar-link.is-search-hit").forEach(link => {
        link.classList.remove("is-search-hit");
        delete link.dataset.searchRank;
      });
      if (collapseLists) {
        sidebar.querySelectorAll(".desktop-sidebar-toggle").forEach(toggle => {
          toggle.setAttribute("aria-expanded", "false");
        });
        sidebar.querySelectorAll(".desktop-sidebar-level-2").forEach(list => {
          list.classList.add("is-collapsed");
        });
      }
    }

    function syncSidebarSearchHighlights(results, searchTerm) {
      if (!sidebar) {
        return;
      }

      clearSidebarSearchHighlights(true);
      if (!searchTerm) {
        return;
      }

      const topResults = [];
      const seenAnchors = new Set();

      const addResult = (result) => {
        const key = normalizeAnchor(result?.item?.anchor);
        if (!key || seenAnchors.has(key)) {
          return;
        }
        seenAnchors.add(key);
        topResults.push(result);
      };

      // Ground truth = currently shown search ranking from Fuse.
      for (const result of results) {
        addResult(result);
        if (topResults.length >= SIDEBAR_HIGHLIGHT_LIMIT) {
          break;
        }
      }
      topResults.forEach((result, index) => {
        const sidebarLink = getSidebarLinkByAnchor(result.item.anchor);
        if (!sidebarLink) {
          return;
        }
        sidebarLink.classList.add("is-search-hit");
        sidebarLink.dataset.searchRank = String(index + 1);

        const childList = sidebarLink.closest(".desktop-sidebar-level-2");
        if (!childList) {
          return;
        }
        childList.classList.remove("is-collapsed");
        const toggle = childList.parentElement?.querySelector(".desktop-sidebar-toggle");
        if (toggle) {
          toggle.setAttribute("aria-expanded", "true");
        }
      });
    }


    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();

        // Find most visible section at the moment Ctrl+K is pressed
        const sections = document.querySelectorAll('section');
        let currentSection = null;
        let maxVisibleArea = 0;

        sections.forEach(section => {
          const rect = section.getBoundingClientRect();
          const viewHeight = window.innerHeight;
          const visibleHeight = Math.min(rect.bottom, viewHeight) - Math.max(rect.top, 0);
          const visibleArea = Math.max(0, visibleHeight);

          if (visibleArea > maxVisibleArea) {
            maxVisibleArea = visibleArea;
            currentSection = section;
          }
        });

        if (currentSection) {
          openSidebar(currentSection);
          search.focus();
        }
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        closeMap();
      }
    });


    // -------- Search --------------//
    const searchableNodes = nodes.filter(n => n.depth > 1).map(n => ({
      name: n.data.name,
      node: n,
      anchor: n.data.anchor,
      content: typeof n.data.content === 'string' ? JSON.parse(n.data.content) : n.data.content,
      thumbnail: n.data.thumbnail
    }));

    const fuse = new Fuse(searchableNodes, {
      keys: ['name',
        'content.text_translation',
        'content.title',
        'content.explanations.text',
      ],
      threshold: 0.2,
      includeMatches: true,
      minMatchCharLength: 3,
      includeScore: true,
      ignoreLocation: true,
    });


    function renderSearchResults(e) {
      let searchTerm = ""
      if (e) {
        searchTerm = e.target.value.trim();
      }

      searchResults.innerHTML = '';

      if (searchTerm === '') {
        clearSidebarSearchHighlights(true);
        menuSvg.classed("hidden", false);
        return;
      }

      const results = fuse.search(searchTerm);
      clearSidebarSearchHighlights(true);
      if (results.length > 0) {
        console.log(results)
        menuSvg.classed("hidden", true);
        const ul = document.createElement('ul');
        ul.className = 'search-results-list';

        results.forEach(result => {
          const li = document.createElement('li');
          li.className = 'search-result-item';

          // Highlight sidebar item on hover — collapse all, then open only the relevant chapter
          li.addEventListener("mouseenter", () => {
            if (sidebarClearTimer) { clearTimeout(sidebarClearTimer); sidebarClearTimer = null; }
            clearSidebarSearchHighlights(true);
            const sidebarLink = getSidebarLinkByAnchor(result.item.anchor);
            if (sidebarLink) {
              sidebarLink.classList.add("is-search-hit");
              const childList = sidebarLink.closest(".desktop-sidebar-level-2");
              if (childList) {
                childList.classList.remove("is-collapsed");
                const toggle = childList.parentElement?.querySelector(".desktop-sidebar-toggle");
                if (toggle) toggle.setAttribute("aria-expanded", "true");
              }
            }
          });
          li.addEventListener("mouseleave", () => {
            sidebarClearTimer = setTimeout(() => { clearSidebarSearchHighlights(true); }, 400);
          });

          const link = document.createElement('a');
          link.href = "#" + result.item.anchor;
          link.addEventListener("click", (e) => {
            window.closeMap();
            if (result.matches[0].key == "content.explanations.text") {
              e.preventDefault();
              const section = document.getElementById(result.item.anchor)
              console.log(result, section, result.matches[0].refIndex, section.querySelectorAll('a[href^="#"]'))
              const explanationLink = section.querySelectorAll('a[href^="#"]')[result.matches[0].refIndex]
              const explanation = section.querySelectorAll('.mo-explanation')[result.matches[0].refIndex]
              explanationLink.classList.toggle('active')
              explanation.classList.toggle('active')

              window.scrollTo(0, section.getBoundingClientRect().bottom + window.scrollY - window.innerHeight)
              explanationLink.scrollTo({
                top: section.querySelector(".mo-main-content").offsetTop - 15,
                behavior: 'smooth'
              });
              explanationLink.scrollTo({
                top: section.querySelector(".mo-translation").offsetTop - 9,
                behavior: 'smooth'
              });
            }
          })
          const thumb = document.createElement('img');
          thumb.src = result.item.thumbnail;
          link.append(thumb)
          const nameText = document.createTextNode(result.item.name);
          link.appendChild(nameText);
          if (result.matches[0].key == "content.explanations.text") {
            const explanation = document.createElement('span');
            explanation.textContent = ": " + result.item.content.explanations[result.matches[0].refIndex].title;
            link.appendChild(explanation)
          }
          li.appendChild(link);
          ul.appendChild(li);
        })
        searchResults.append(ul)
      }

    }

    function debounce(func, wait) {
      let timeout;
      return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
      };
    }

    search.addEventListener('input', debounce(e => {
      renderSearchResults(e)
    }, 300));

    map.append(initializeMapVisualization(menuSvg, root.links(), root.descendants(), width, height));
    if (mapSlide) {
      mapSlide.append(initializeMapVisualization(slideSvg, root.links(), root.descendants(), width, height));
    }


  })
}
