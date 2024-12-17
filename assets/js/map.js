import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

if (
  window.innerWidth > 767
) {
  document.addEventListener('DOMContentLoaded', function () {

    console.log(window.mapdata)

    const width = window.innerWidth;
    const height = window.innerHeight - 50;

    const root = d3.hierarchy(window.mapdata);
    const links = root.links();
    const nodes = root.descendants();

    const map = document.getElementById('map');

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
        node.x = Math.max(-width / 2 + padding, Math.min(width / 2 - padding, node.x));
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
          return d.depth === 2 ? -window.innerWidth / 1.8 : -window.innerWidth / 3.6;
        }))
      .force("collide", d3.forceCollide()
        .radius(d => d.depth === 2 ? 50 : 20)
        .strength(0.7))
      .force("bounds", boundingForce);

    // Create the container SVG.
    const svg = d3.create("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [-width / 2, -height / 2, width, height])
      .attr("style", "max-width: 100%; height: auto;");

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
      .attr("stroke", d => {
        if (d.source.depth < 1) { return "#999" } else {
          return d.target.x < d.source.x ? "url(#lineGradientRight)" : "url(#lineGradientLeft)"
        }
      })
      .attr("stroke-width", 1.5);

    const textContainer = svg.append("g")
      .attr("class", "text-labels")
      .attr("pointer-events", "none"); // Prevent text from interfering with hover

    // Modify your node selection
    const node = svg.append("g")
      .attr("fill", "#fff")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("fill", d => {
        if (d.depth === 2) return "transparent";
      })
      .attr("r", d => 10 - d.depth * 2)
      .style("cursor", "pointer")
      .style("display", d => d.depth === 0 ? "none" : null)
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
      } else if (d.depth !== 0) {
        element.append("circle")
          .attr("fill", d.depth === 2 ? "transparent" : "#fff")
          .attr("r", 10 - d.depth * 2);
      }
    });

    let activeText = null;

    node.on("mouseover", (event, d) => {
      textContainer.selectAll("text").remove();
      node.selectAll("g").attr("class", "node-inactive")
      activeText = textContainer
        .append("foreignObject")
        .datum(d)
        .attr("x", d.x - 100)
        .attr("y", d.y + 10)
        .attr("width", 200)
        .attr("height", 300)
        .append("xhtml:div")
        .attr("class", "hover-text")
        .style("display", d => d.depth === 1 ? "none" : null)
        .text(d.data.name);
    })
      .on("mousemove", (event, d) => {
        console.log("hellodjeiwo")
        this.attr("transform", `translate(${d.x},${d.y})`);
      })
      .on("mouseout", () => {
        textContainer.selectAll("foreignObject").remove();
        node.selectAll("circle").attr("class", "")
        activeText = null;
      })


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

      if (activeText) {
        const d = activeText.datum();
        activeText.attr("transform", d => `translate(${d.x},${d.y})`);
      }
    });

    map.append(svg.node())

  })
}