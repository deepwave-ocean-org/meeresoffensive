import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import Fuse from 'https://cdn.jsdelivr.net/npm/fuse.js@6.6.2/dist/fuse.esm.js';

if (
  window.innerWidth > 767
) {

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

    const boundingForce = () => {
      const padding = 100;
      for (let node of nodes) {
        node.x = Math.max(-width / 2 - padding, Math.min(width / 2 + padding, node.x));
        node.y = Math.max(-height / 2 + padding, Math.min(height / 2 - padding, node.y));
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
    const search = document.getElementById('search-bar')
    const searchResults = document.getElementById("search-results")

    const mapSlide = document.getElementById("map-slide-child")

    function closeMap() {
      if (map.classList.contains("hidden")) {
        return
      }
      map.classList.add("hidden");
      document.querySelectorAll(".video-container.hidden, .view-1.hidden, .view-2.hidden").forEach(el => el.classList.remove("hidden"));
      document.querySelector(".mo-background.background-dark").classList.remove("background-dark");
      document.querySelector(".navigation-opener.active").classList.remove("active")
      window.lenis.start();
      document.body.style.overflow = '';
      search.blur();
      search.value = "";
      renderSearchResults()
    }
    function openMap(section) {
      const videoCont = section.querySelector(".video-container");
      const view1 = section.querySelector(".view-1");
      const view2 = section.querySelector(".view-2");
      const background = section.querySelector(".mo-background");
      const navigation = section.querySelector(".navigation-opener ")

      window.scrollTo(0, section.getBoundingClientRect().top + window.scrollY);
      navigation.classList.add("active");
      [videoCont, view1, view2].forEach(el => el.classList.add("hidden"));
      map.classList.remove("hidden");
      background.classList.add("background-dark");
      window.lenis.stop();
      document.body.style.overflow = 'hidden';
      search.focus();
      renderSearchResults()
    }


    window.closeMap = closeMap
    window.openMap = openMap


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
          openMap(currentSection);
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
        menuSvg.classed("hidden", false);
        return;
      }

      const results = fuse.search(searchTerm);
      if (results.length > 0) {
        console.log(results)
        menuSvg.classed("hidden", true);
        const ul = document.createElement('ul');
        ul.className = 'search-results-list';

        results.forEach(result => {
          const li = document.createElement('li');
          li.className = 'search-result-item';
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
    mapSlide.append(initializeMapVisualization(slideSvg, root.links(), root.descendants(), width, height));

  })
}