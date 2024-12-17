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
              map.classList.add("hidden");
              document.querySelectorAll(".video-container, .view-1, .view-2").forEach(el => el.classList.remove("hidden"));
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


    // const MapState = {
    //   mapInitialized: false, // set to true once map is rendered
    //   mouseX: 0, // mouse X position on screen
    //   mouseY: 0, // mouse Y position on screen
    //   offsetX: window.screen.width / 7, // Initital offset (position of all islands on canvas)
    //   offsetY: 0, // Initial offset (position of all islands on canvas)
    //   scale: (((window.screen.width / 1920) + 1) / 2) * 0.8, // Initial zoom
    //   doNotUpdateCursor: false,
    //   activeMapPlace: -1,
    //   placePositions: [ // where each "place" (aka. the smalltitles) are placed relative to their islands.
    //     [{ x: 50, y: 50 }, { x: 0, y: -80 }, { x: 60, y: -20 }, { x: 0, y: 10 }],
    //     [{ x: 120, y: -180 }, { x: 0, y: -40 }, { x: -40, y: 30 }, { x: 20, y: -110 }],
    //     [{ x: 100, y: 100 }, { x: 110, y: 30 }, { x: -140, y: 200 }, { x: -160, y: 120 }, { x: -200, y: -46 }, { x: -150, y: -120 }, { x: -80, y: -200 }, { x: 40, y: -80 }, { x: 50, y: -130 }, { x: 70, y: -180 }],
    //     [{ x: -8, y: 22 }, { x: -145, y: 110 }, { x: 30, y: -150 }, { x: -100, y: 0 }, { x: 0, y: -45 }],
    //     [{ x: -50, y: -50 }, { x: 20, y: -240 }, { x: -70, y: -180 }, { x: 100, y: -140 }, { x: 65, y: -20 }, { x: 0, y: 20 }],
    //   ],
    //   islands: [ // The islands where path is the svg path.
    //     {
    //       path: "M915.5 772C915.552 779.668 917.368 797.816 909 802C900.448 806.276 862.696 793.607 853 813C849.192 820.616 854.529 828.645 856 836C856.111 836.557 847.273 879.159 845 882C835.603 893.746 816.172 903.314 814 912C812.157 919.374 785.51 966.019 786 967C788.265 971.53 811.944 960.378 816 962C828.524 967.01 855.078 991.156 861 1003C865.386 1011.77 857.425 1027.14 862 1034C879.02 1059.53 902.955 1082.61 922 1108C925.98 1113.31 939.44 1114.76 941 1121C944.091 1133.37 934.539 1145.7 937 1158C940.048 1173.24 950.677 1231.45 962 1239C978.463 1249.98 1007.21 1231.16 1023 1243C1030.64 1248.73 1039.23 1259.23 1044 1264C1045.68 1265.68 1052.47 1261.35 1056 1264C1062.42 1268.82 1064.93 1282.98 1073 1285C1081.79 1287.2 1091.38 1277.08 1101 1279C1106.7 1280.14 1109.76 1287.75 1116 1289C1138.28 1293.46 1163.83 1291.73 1187 1301C1195.93 1304.57 1201.82 1313.09 1210 1318C1233.2 1331.92 1267.91 1343.77 1295 1337C1298.99 1336 1292.02 1320.99 1300 1317C1316.48 1308.76 1349.3 1310.7 1363 1297C1377.84 1282.16 1366.92 1272.2 1373 1257C1377.76 1245.11 1400.9 1227.42 1411 1219C1431.77 1201.69 1470.18 1197.71 1485 1173C1493.96 1158.06 1461.81 1156.62 1458 1149C1454.11 1141.23 1473.99 1117.03 1477 1110C1484.19 1093.23 1472.09 1082.54 1475 1068C1478.81 1048.97 1494.07 1044.87 1501 1031C1513.27 1006.46 1516.01 922.34 1493 907C1489.58 904.72 1490.99 894.663 1487 892C1486.38 891.589 1461.72 918.642 1457 921C1447.26 925.871 1425.62 916.501 1420 921C1407.85 930.721 1361.44 997.442 1338 974C1332.1 968.098 1333.63 948.551 1340 944C1349.66 937.098 1363.34 933.572 1371 924C1375.01 918.989 1370.51 913.485 1376 908C1378.58 905.421 1389.02 899.965 1390 898C1394.6 888.806 1392 874.986 1394 865C1396.23 853.874 1405.34 844.64 1407 833C1410.75 806.749 1394.79 736.146 1378 716C1372.76 709.709 1348.18 710.527 1342 713C1331.95 717.019 1331.05 746.682 1330 754C1329.62 756.64 1330 762 1330 762C1330 762 1318.45 770.775 1312 774C1306.81 776.597 1305.93 764.035 1302 766C1300.81 766.597 1297.92 776.667 1295 779C1284.64 787.286 1271.53 790.466 1262 800C1255.39 806.612 1255.16 817.84 1249 824C1246.34 826.658 1240.35 821 1237 821C1195.93 821 1228.24 805.238 1211 788C1200.73 777.733 1194.91 804.631 1192 809C1190.56 811.161 1188.47 804.694 1185 804C1180.61 803.123 1170.68 808.706 1168 802C1163.78 791.458 1169.09 780.448 1167 770C1162.99 749.952 1144.41 687.965 1127 681C1117.25 677.101 1092.53 673.799 1090 689C1088.88 695.714 1096 698.475 1096 703C1096 711.246 1079.38 705.312 1072 709C1062.55 713.724 1054.12 726.976 1044 729C1022.56 733.289 993.647 720.741 973 729C964.478 732.409 951.967 743.62 943 749C935.359 753.585 915.442 763.375 915.5 772Z",
    //       x: 300,
    //       y: 280,
    //       places: null,
    //     },
    //     {
    //       path: "M1131 833C1131.49 831.274 1127.53 830.059 1126 831C1111.52 839.911 1121.98 838.019 1116 844C1106.99 853.007 1086.32 856.682 1078 865C1070.58 872.418 1077.22 886.311 1063 892C1055.49 895.002 1009.95 889.048 1002 897C993.71 905.29 968 910.979 968 911C968 912.242 948.294 919.076 940 925C917.193 941.291 886.684 958.755 870 981C863.815 989.246 879.343 998.313 874 1009C870.449 1016.1 842.491 1036.65 848 1044C852.431 1049.91 871.895 1038.73 871 1045C868.663 1061.36 847.593 1077.5 839 1091C827.344 1109.32 822.462 1134.38 810 1151C790.689 1176.75 745.622 1201.09 714 1209C703.661 1211.58 692.909 1205.02 683 1207C669.988 1209.6 653.448 1222.85 642 1230C626.958 1239.4 612.718 1246.28 601 1258C598.518 1260.48 594.219 1263.39 591 1265C588.829 1266.09 582.284 1265.28 584 1267C586.055 1269.05 648.001 1267.75 654 1264C657.539 1261.79 674.591 1243.53 679 1245C681.584 1245.86 680.138 1251.6 682 1253C697.178 1264.38 714.565 1273.42 730 1285C747.109 1297.83 765.833 1290.13 783 1297C799.346 1303.54 801.118 1322.56 816 1330C821.937 1332.97 845.816 1337.47 852 1335C857.997 1332.6 860.843 1321.98 869 1323C877.409 1324.05 921.796 1330.08 927 1328C935.765 1324.49 926.469 1311.89 930 1306C933.803 1299.66 940.578 1296.34 946 1292C954.087 1285.53 954.577 1264.71 962 1261C966.487 1258.76 973.796 1262.1 978 1260C984.388 1256.81 981.792 1245.81 985 1241C988.641 1235.54 1008.87 1231.45 1015 1229C1058.38 1211.65 1090.86 1235.86 1132 1241C1160.62 1244.58 1185.83 1230.18 1213 1226C1221.14 1224.75 1243.75 1230.16 1250 1226C1260.53 1218.98 1226.88 1198.33 1223 1196C1219.48 1193.89 1216.08 1191.82 1212 1191C1210.82 1190.76 1208.15 1193.85 1209 1193C1217.43 1184.57 1207.94 1165.09 1214 1156C1217.08 1151.38 1225.15 1156.39 1227 1149C1230.78 1133.89 1223.51 1113.74 1229 1100C1233.72 1088.21 1251.24 1076.15 1262 1070C1266.84 1067.23 1273.94 1070.05 1278 1067C1282.54 1063.6 1281.77 1059.23 1285 1056C1293.68 1047.32 1312.09 1047.36 1323 1043C1329.84 1040.26 1334.36 1032.99 1341 1029C1352.35 1022.19 1374.47 1018.05 1381 1005C1385.28 996.437 1334.14 990.662 1336 986C1342.36 970.098 1391.06 915.972 1407 908C1413.19 904.904 1420.84 913.093 1428 909C1447.12 898.073 1460.68 879.659 1479 868C1492.88 859.167 1509.89 860.743 1523 852C1546.41 836.397 1600.36 781.702 1610 756C1619.34 731.092 1588.08 708.313 1582 684C1576.16 660.656 1598.65 632.55 1595 607C1593.56 596.905 1573.77 566.775 1567 560C1565.95 558.946 1564.45 557.638 1563 558C1559.32 558.921 1558.34 567.22 1553 569C1538.37 573.876 1523.19 571.907 1509 579C1494.39 586.306 1483.52 598.181 1468 604C1447.97 611.51 1426.79 611.805 1407 619C1392.06 624.432 1379.26 639.374 1363 641C1328.22 644.478 1312 619.2 1281 613C1267.92 610.383 1270.95 626.027 1263 630C1258.9 632.051 1246.48 630.448 1242 630C1226.31 628.431 1201.7 620.584 1188 632C1180.87 637.938 1177.49 648.866 1174 657C1167.49 672.201 1151.52 681.443 1146 698C1145.79 698.625 1154.02 771.115 1155 776C1156.96 785.802 1138.16 792.506 1135 802C1132.19 810.436 1128.26 842.614 1131 833Z",
    //       x: 360,
    //       y: 780,
    //       places: null,
    //     },
    //     {
    //       path: "M553.956 843.886C555.668 843.014 558.248 877.624 526.847 877.624C482.797 877.624 452.954 894.087 422.579 919.506C412.662 927.805 406.635 947.545 397.555 953.244C393.131 956.021 346.117 962.762 346.117 964.878C346.117 972.574 349.088 1006.92 357.238 1013.74C375.785 1029.26 420.624 1030.46 428.14 1055.62C435.252 1079.43 425.36 1095.92 425.36 1118.44C425.36 1119.87 437.717 1129.56 439.262 1134.73C445.433 1155.39 435.24 1203.79 430.921 1225.48C421.059 1274.99 375.653 1303.14 336.385 1336C325.18 1345.37 323.499 1360.46 314.141 1370.9C309.63 1375.93 276.798 1416.43 282.166 1420.92C298.945 1434.97 332.558 1405.15 346.117 1402.31C363.893 1398.59 407.077 1405 422.579 1412.78C453.691 1428.4 484.688 1471.87 503.213 1497.71C506.926 1502.89 500.212 1517.75 505.993 1520.98C510.99 1523.76 516.52 1532.87 524.066 1533.77C529.158 1534.38 540.556 1529.45 543.529 1530.28C547.174 1531.3 550.469 1542.78 554.651 1545.41C568.83 1554.31 586.933 1562.13 601.919 1572.16C617.725 1582.75 621.896 1618.89 635.285 1633.82C662.388 1664.06 703.448 1687.15 740.942 1707.12C746.737 1710.2 790.288 1740.28 797.942 1733.87C800.58 1731.67 798.982 1723.55 802.112 1722.24C807.621 1719.94 818.077 1726.03 824.356 1723.4C836.18 1718.46 844.776 1699.06 856.331 1696.65C878.256 1692.06 888.972 1699.46 910.55 1685.01C916.187 1681.24 916.157 1674.59 911.941 1669.89C911.171 1669.03 899.397 1660.61 899.429 1660.58C902.272 1658.2 915.768 1661.34 920.282 1660.58C942.78 1656.82 998.837 1650.83 1012.04 1631.5C1024.65 1613.03 1000.35 1587.23 998.135 1568.67C996.014 1550.93 1000.7 1533.8 1002.31 1516.32C1002.86 1510.34 1003.6 1480.67 1013.43 1477.93C1014.11 1477.74 1023.61 1485.3 1027.33 1486.07C1065.19 1494 1056.42 1468.9 1088.5 1504.69C1095.38 1512.36 1092.58 1534.54 1103.79 1536.1C1149.4 1542.46 1231.65 1528.43 1276.18 1520.98C1290.85 1518.52 1300.34 1506 1315.11 1503.52C1330.51 1500.95 1346.31 1508.09 1362.38 1505.85C1373.02 1504.37 1384.61 1497.71 1395.74 1495.38C1419.94 1490.32 1465.33 1501.44 1486.11 1488.4C1504 1477.17 1483.22 1452.42 1494.45 1443.03C1502.65 1436.17 1527.53 1435.61 1537.54 1432.56C1570.41 1422.56 1632.52 1398.59 1651.54 1372.06C1667.39 1349.97 1619.57 1351.88 1619.57 1334.83C1619.57 1324.97 1655.84 1305.97 1651.54 1298.77C1645.18 1288.12 1599.75 1306.09 1588.98 1295.28C1574.01 1280.25 1592.77 1255.85 1597.32 1240.6C1607.21 1207.51 1569.19 1169.6 1584.81 1134.73C1593.47 1115.42 1615.25 1100.13 1623.74 1082.38C1631.57 1065.99 1624.16 1048.55 1637.64 1033.52C1650.03 1019.69 1670.7 1014.19 1682.13 997.453C1692.72 981.949 1677.61 980.065 1687.69 964.878C1704.3 939.856 1733.4 912.21 1739.13 883.441C1741.44 871.816 1727.2 875.164 1729.4 865.99C1733.91 847.114 1769.51 833.897 1762.76 811.311C1758.71 797.758 1738.51 783.511 1730.79 770.593C1724.4 759.905 1729.27 747.969 1726.62 736.854C1719.29 706.201 1709.74 668.134 1673.79 653.091C1645.72 641.346 1537.69 660.306 1522.25 634.477C1516.37 624.638 1532.37 614.933 1527.81 605.392C1509.37 566.803 1525.2 515.438 1495.84 478.583C1476.18 453.905 1444.82 452.989 1415.2 452.989C1413.01 452.989 1397.42 427.113 1381.84 429.721C1375.66 430.755 1368.8 449.499 1367.94 449.499C1367.77 449.499 1360.32 444.124 1358.2 443.682C1339.68 439.806 1318.7 455.26 1302.6 447.172C1272.61 432.116 1244.16 372.124 1224.74 368.062C1201.4 363.178 1201.09 396.812 1174.69 393.656C1127.19 387.977 1095.28 339.239 1048.18 347.121C1031.48 349.917 1046.37 362.333 1041.23 368.062C1033.23 376.994 1005.75 363.589 998.135 371.552C989.577 380.504 988.843 399.164 985.623 409.944C977.521 437.063 959.41 456.29 955.038 485.564C954.865 486.718 955.038 487.89 955.038 489.054C955.038 513.129 954.166 537.637 949.477 561.183C949.342 561.861 949.566 571.654 949.477 571.654C944.347 571.654 933.99 565.481 927.233 564.674C896.724 561.026 844.913 560.876 818.795 548.386C798.683 538.769 782.667 518.146 763.186 509.995C755.547 506.798 743.3 511.664 736.772 513.485C724.268 516.973 654.593 520.142 639.455 516.975C597.254 508.146 571.344 519.134 531.017 523.955C526.383 524.509 510.649 524.712 507.383 527.445C505.563 528.969 512.107 534.888 512.944 535.589C518.503 540.241 526.517 553.244 532.408 556.53C544.468 563.258 562.113 558.12 574.114 568.164C578.939 572.201 552.933 581.785 550.481 587.941C547.838 594.577 555.983 600.493 557.432 606.555C560.086 617.661 551.966 622.523 549.09 632.15C546.385 641.207 556.739 644.355 554.651 653.091C551.259 667.283 521.149 661.691 517.115 675.195C508.938 702.565 565.321 723.65 549.09 750.815C544.834 757.939 533.582 760.843 531.017 769.429C526.733 783.769 550.324 788.55 553.261 800.841C556.199 813.135 551.925 844.921 553.956 843.886Z",
    //       x: 900,
    //       y: 380,
    //       places: null,
    //     },
    //     {
    //       path: "M908 837C894.334 856.184 906.33 867.894 895 883C883.902 897.797 825.209 891.187 812 911C808.876 915.686 812.831 929.325 814 934C816.118 942.471 811.882 952.529 814 961C815.446 966.783 821.163 969.744 824 974C831.188 984.782 815.453 1017.55 808 1025C799.784 1033.22 787.026 1038.26 778 1046C758.933 1062.34 745.193 1083.13 731 1103C726.909 1108.73 709.46 1123.3 711 1131C713.603 1144.01 774.128 1163.65 790 1170C810.917 1178.37 819.135 1210.54 824 1230C826.775 1241.1 802.27 1239.92 800 1249C798.704 1254.18 804 1254.46 804 1258C804 1263.9 798.213 1272.93 797 1279C795.266 1287.67 800.791 1296.04 799 1305C796.456 1317.72 786.228 1327.63 784 1341C782.241 1351.55 787.696 1362.61 783 1372C780.644 1376.71 777.355 1406.18 783 1409C787.743 1411.37 796.734 1407.95 802 1409C828.061 1414.21 852.587 1412 879 1412C886.678 1412 893.345 1417.09 901 1416C908.641 1414.91 916.164 1407.42 923 1404C929.252 1400.87 940.713 1406.52 946 1403C957.634 1395.24 945.567 1377.43 956 1367C962.755 1360.25 990.035 1361.86 994 1346C1000.28 1320.88 951.699 1233.78 983 1215C1004.69 1201.99 1007.98 1234.14 1018 1237C1028.19 1239.91 1046.62 1244.48 1057 1243C1061.9 1242.3 1073.31 1234.66 1078 1237C1093.31 1244.66 1097.08 1261.08 1108 1272C1128.24 1292.24 1213.63 1333.28 1238 1315C1275.32 1287.01 1244 1255.59 1244 1218C1244 1214.72 1242.21 1204.69 1244 1202C1245.89 1199.17 1255.03 1201.48 1258 1200C1262.8 1197.6 1281.55 1178.8 1283 1173C1287.27 1155.92 1267.78 1127.04 1278 1110C1281.23 1104.62 1288.88 1106.16 1292 1102C1295.98 1096.69 1291.73 1088.45 1295 1083C1300.34 1074.1 1314.35 1072.42 1320 1063C1334.48 1038.87 1357.04 1019.43 1371 995C1383.21 973.628 1392.38 949.438 1402 927C1408.08 912.804 1418.09 906.164 1420 889C1422.44 867.083 1400.42 866.096 1397 849C1394.4 835.987 1398.85 818.391 1396 807C1393.65 797.604 1387.4 788.615 1385 779C1380.56 761.234 1394.53 741.815 1387 723C1384.9 717.738 1375.25 714.872 1372 710C1355.37 685.061 1368.35 651.735 1363 625C1361.04 615.212 1350.96 617.616 1346 611C1342.51 606.341 1339.3 590.576 1333 589C1312.22 583.805 1295.95 615.35 1282 620C1279.64 620.786 1274.7 612.151 1269 615C1261.6 618.698 1261.1 629.901 1256 635C1254.63 636.371 1208.07 654.827 1203 657C1171.9 670.328 1147.23 629.616 1116 643C1096.19 651.492 1094.7 687.199 1077 699C1069.49 704.004 1071.82 730.605 1071 738C1069.28 753.463 1057.3 758.814 1054 772C1051.72 781.127 1048.96 826.691 1041 832C1026.98 841.347 1000.87 792.579 997 790C992.362 786.908 999.459 785.459 997 783C994.732 780.732 976.23 788.354 973 789C962.244 791.151 957.109 785.973 949 788C939.012 790.497 936.998 798 928 798C927.255 798 926.527 798.473 926 799C921.027 803.973 925.98 814.02 922 818C915.722 824.278 911.902 831.522 908 837Z",
    //       x: 1400,
    //       y: 780,
    //       places: null,
    //     },
    //     {
    //       path: "M885.5 617C882.435 612.178 855.776 620.636 851 622C838.496 625.572 825.182 628.273 815 637C805.007 645.566 799.078 656.641 786 661C778.746 663.418 759.04 659.799 757 670C755.188 679.06 763.419 719.581 763 720C742.507 740.493 694.72 769.882 704 807C705.384 812.535 701.253 820.835 706 824C712.857 828.571 730.512 816.512 736 822C740.005 826.005 735.481 830.62 745 833C747.722 833.68 752.626 833.566 754 837C758.039 847.098 739.809 854.955 738 864C735.44 876.799 747.787 889.066 745 903C742.757 914.213 740.975 929.7 734 939C719.687 958.085 679.178 970.712 687 1002C698.703 1048.81 753.454 1078.73 796 1100C820.396 1112.2 836.776 1133.83 866 1138C885.453 1140.78 903.948 1124.78 922 1132C933.296 1136.52 931.068 1156.36 942 1160C958.741 1165.58 986.138 1156.91 1000 1168C1010.55 1176.44 1006.07 1201.1 1015 1213C1022.74 1223.32 1054.99 1235 1067 1238C1104.6 1247.4 1222.14 1248.88 1250 1225C1270.59 1207.35 1272.14 1189.73 1283 1168C1290.06 1153.88 1320.82 1140.32 1335 1135C1362.97 1124.51 1396.21 1123.48 1423 1112C1445.17 1102.5 1462.96 1088.69 1484 1077C1498.84 1068.76 1511.84 1061.22 1522 1047C1546.6 1012.57 1485.54 982.748 1492 944C1497.29 912.241 1578.36 908.833 1586 863C1593.82 816.057 1574.67 788.226 1557 747C1553.53 738.893 1555.42 727.233 1550 720C1543.2 710.935 1528.84 703.378 1526 692C1520.94 671.754 1525.03 649.101 1520 629C1517.78 620.132 1511.85 613.266 1510 604C1506.23 585.152 1491.73 569.921 1487 551C1484.86 542.427 1485.5 522.624 1478 517C1457.9 501.924 1412.13 535.065 1398 528C1389.54 523.769 1391.62 496.617 1383 488C1378.53 483.53 1369.27 483.636 1364 481C1349.54 473.768 1337.52 462.206 1322 456C1299.05 446.819 1255.82 478.206 1227 471C1217.37 468.593 1204.02 471.51 1195 467C1179.78 459.389 1166.63 443.86 1151 438C1097.22 417.833 1042 434.003 1000 469C981.686 484.262 952.804 506.392 942 528C934.654 542.692 938.483 562.033 931 577C923.706 591.588 909.806 595.597 897 602C893.817 603.592 886.669 618.839 885.5 617Z",
    //       x: 670,
    //       y: 1000,
    //       places: null,
    //     }
    //   ],
    // }

    // function generateAllPlaces() {
    //   for (let i = 0; i < MapState.islands.length; i++) {
    //     MapState.islands[i].places = generatePlaces(i);
    //   }
    // }

    // const canvas = document.getElementById('map');
    // const ctx = canvas.getContext('2d');
    // console.log("dhuewhdiebd", canvas)

    // const MAX_ZOOM = 8;
    // const MIN_ZOOM = 0.3;
    // const SCROLL_SENSITIVITY = -0.011;
    // const CLICK_MARGIN = 3;
    // const DEBOUNCE_TIME = 400;

    // const ratio = window.devicePixelRatio;

    // canvas.width = window.innerWidth * ratio;
    // canvas.height = window.innerHeight * ratio;

    // ctx.scale(ratio, ratio);

    // if (window.screen.width < window.screen.height) {
    //   MapState.offsetX = -250;
    //   MapState.scale = 0.7;
    // }

    // function generatePlaces(islandNumber) {
    //   const places = [];
    //   const count = window.smalltitles[islandNumber].length;
    //   for (let i = 0; i < count; i++) {
    //     places.push({
    //       name: window.smalltitles[islandNumber][i].title,
    //       x: MapState.placePositions[islandNumber][i].x,
    //       y: MapState.placePositions[islandNumber][i].y,
    //       order: window.smalltitles[islandNumber][i].order
    //     });

    //     console.log(window.smalltitles[islandNumber][i].order)
    //   }
    //   return places;
    // }

    // function drawIsland(island) {
    //   const path = new Path2D(island.path);
    //   ctx.save();
    //   ctx.translate(island.x - 550, island.y - 510); // Adjust positioning if necessary
    //   ctx.scale(0.45, 0.45);
    //   ctx.fillStyle = 'rgba(255,255,255,0.64)';  // Green fill
    //   ctx.fill(path);
    //   ctx.lineWidth = 25;
    //   ctx.strokeStyle = '#ffffff';  // Darker outline for comic style
    //   ctx.stroke(path);
    //   ctx.restore();
    // }

    // function drawMap() {
    //   requestAnimationFrame(() => {
    //     ctx.clearRect(0, 0, canvas.width, canvas.height);
    //     ctx.save();
    //     ctx.translate(MapState.offsetX, MapState.offsetY);
    //     ctx.scale(MapState.scale, MapState.scale);

    //     textPositions = [];

    //     MapState.islands.forEach(island => {
    //       drawIsland(island);
    //       placeHeadlines(island.x, island.y, island.places);
    //     });

    //     MapState.doNotUpdateCursor = false;

    //     ctx.restore();
    //   })
    // }

    // function placeHeadlines(x, y, places) {
    //   places.forEach(place => {
    //     ctx.fillStyle = 'black'; // Ensure the text is visible
    //     ctx.font = "16px 'Arial'";

    //     let text = place.name.replace("&shy;", "");
    //     const textWidth = ctx.measureText(text).width;
    //     const textX = x + 15 + place.x - textWidth;
    //     const textY = y + place.y - CLICK_MARGIN;

    //     ctx.fillText(text, textX, textY);

    //     // render red dot next to the text facing origin
    //     if (MapState.activeMapPlace === place.order) {
    //       ctx.beginPath();

    //       let dotX;
    //       let dotY;

    //       if (place.x > 0) {
    //         dotX = x + 15 + place.x - textWidth - 10;
    //         dotY = y + place.y - 10;
    //       } else {
    //         dotX = x + 15 + place.x + 10;
    //         dotY = y + place.y - 10;
    //       }


    //       ctx.arc(dotX, dotY, 5, 0, 2 * Math.PI);
    //       ctx.fillStyle = 'red';
    //       ctx.fill();
    //     }

    //     // if text is hovered, underline
    //     if (MapState.mouseX >= textX - CLICK_MARGIN && MapState.mouseX - CLICK_MARGIN <= textX + textWidth &&
    //       MapState.mouseY >= textY - 26 && MapState.mouseY - CLICK_MARGIN <= (textY - 16) + 16) {
    //       ctx.beginPath();
    //       ctx.moveTo(textX, textY + 2);
    //       ctx.lineTo(textX + textWidth, textY + 2);
    //       ctx.stroke();
    //       canvas.style.cursor = "pointer";
    //       MapState.doNotUpdateCursor = true;
    //     } else if (!MapState.doNotUpdateCursor) {
    //       canvas.style.cursor = "move";
    //     }

    //     // Store the bounding box for each text
    //     textPositions.push({
    //       x: textX,
    //       y: textY - 16, // Adjust based on font size, assuming text height ~16px
    //       width: textWidth,
    //       height: 16,
    //       name: text,
    //       order: place.order
    //     });
    //   });
    // }

    // function onDrag(event) {
    //   MapState.offsetX += event.movementX;
    //   MapState.offsetY += event.movementY;
    // }

    // let isDragging = false;
    // let lastTouchX, lastTouchY, lastTouchDist;

    // let timestamp = 0;
    // let timeBetweenMouseUpAndDown = 0;

    // function addEventListeners() {
    //   canvas.addEventListener('wheel', handleWheel, { passive: false });
    //   canvas.addEventListener('mousedown', handleMouseDown);
    //   canvas.addEventListener('mousemove', handleMouseMove);
    //   canvas.addEventListener('mouseup', handleMouseUp);
    //   canvas.addEventListener('mouseleave', handleMouseLeave);
    //   canvas.addEventListener('touchstart', handleTouchStart);
    //   canvas.addEventListener('touchmove', handleTouchMove);
    //   canvas.addEventListener('touchend', handleTouchEnd);
    //   window.addEventListener('resize', handleResize);
    // }

    // let timestampTouch = 0;
    // let timeBetweenTouchEndAndStart = 0;

    // function handleMouseMove(event) {
    //   MapState.mouseX = (event.clientX - event.target.getBoundingClientRect().left - MapState.offsetX) / MapState.scale;
    //   MapState.mouseY = (event.clientY - event.target.getBoundingClientRect().top - MapState.offsetY) / MapState.scale;
    //   drawMap();
    // }

    // function handleResize() {
    //   const ratio = window.devicePixelRatio;
    //   canvas.width = window.innerWidth * ratio;
    //   canvas.height = window.innerHeight * ratio;
    //   ctx.scale(ratio, ratio);
    //   drawMap();
    // }

    // // Allow mouse wheel to zoom in and out.
    // function handleWheel(event) {
    //   event.preventDefault();
    //   const delta = event.deltaY * SCROLL_SENSITIVITY;
    //   const newScale = Math.min(Math.max(MIN_ZOOM, MapState.scale + delta), MAX_ZOOM);

    //   MapState.offsetX -= MapState.mouseX * (newScale - MapState.scale);
    //   MapState.offsetY -= MapState.mouseY * (newScale - MapState.scale);

    //   if (document.getElementById("scroll-hint")) {
    //     document.getElementById("scroll-hint").remove();
    //   }

    //   MapState.scale = newScale;
    //   drawMap();
    // }

    // function handleMouseDown() {
    //   isDragging = true;


    //   timestamp = new Date().getTime();
    //   canvas.addEventListener('mousemove', onDrag);
    // }

    // function handleMouseUp(event) {
    //   isDragging = false;
    //   timeBetweenMouseUpAndDown = new Date().getTime() - timestamp;

    //   if (document.getElementById("scroll-hint")) {
    //     document.getElementById("scroll-hint").remove();
    //   }

    //   if (timeBetweenMouseUpAndDown < DEBOUNCE_TIME) {
    //     handleClick(event);
    //   }

    //   canvas.removeEventListener('mousemove', onDrag);
    // }

    // function handleMouseLeave() {
    //   isDragging = false;
    //   canvas.removeEventListener('mousemove', onDrag);
    // }

    // function handleTouchStart(event) {
    //   if (event.touches.length === 1) {

    //     timestampTouch = new Date().getTime();

    //     isDragging = true;
    //     lastTouchX = event.touches[0].clientX;
    //     lastTouchY = event.touches[0].clientY;
    //   } else if (event.touches.length === 2) {
    //     event.preventDefault()
    //     isDragging = false;
    //     const dx = event.touches[0].clientX - event.touches[1].clientX;
    //     const dy = event.touches[0].clientY - event.touches[1].clientY;
    //     lastTouchDist = Math.sqrt(dx * dx + dy * dy);
    //   }
    // }

    // function handleTouchMove(event) {
    //   event.preventDefault()

    //   if (document.getElementById("scroll-hint")) {
    //     document.getElementById("scroll-hint").remove();
    //   }

    //   if (event.touches.length === 1 && isDragging) {
    //     const touchX = event.touches[0].clientX;
    //     const touchY = event.touches[0].clientY;
    //     MapState.offsetX += touchX - lastTouchX;
    //     MapState.offsetY += touchY - lastTouchY;
    //     lastTouchX = touchX;
    //     lastTouchY = touchY;
    //     drawMap();
    //   } else if (event.touches.length === 2) {
    //     const dx = event.touches[0].clientX - event.touches[1].clientX;
    //     const dy = event.touches[0].clientY - event.touches[1].clientY;
    //     const dist = Math.sqrt(dx * dx + dy * dy);
    //     const scaleChange = dist / lastTouchDist;
    //     const touchCenterX = (event.touches[0].clientX + event.touches[1].clientX) / 2;
    //     const touchCenterY = (event.touches[0].clientY + event.touches[1].clientY) / 2;

    //     const touchX = (touchCenterX - MapState.offsetX) / MapState.scale;
    //     const touchY = (touchCenterY - MapState.offsetY) / MapState.scale;

    //     const newScale = Math.min(Math.max(MIN_ZOOM, MapState.scale * scaleChange), MAX_ZOOM);

    //     MapState.offsetX -= touchX * (newScale - MapState.scale);
    //     MapState.offsetY -= touchY * (newScale - MapState.scale);

    //     MapState.scale = newScale;
    //     lastTouchDist = dist;
    //     drawMap();
    //   }
    // }

    // function handleTouchEnd(event) {
    //   event.preventDefault();
    //   isDragging = false;

    //   timeBetweenTouchEndAndStart = new Date().getTime() - timestampTouch;

    //   if (timeBetweenTouchEndAndStart < 200) {
    //     handleTouchClick(event);
    //   }

    // }

    // function handleClick(event) {
    //   MapState.mouseX = (event.clientX - event.target.getBoundingClientRect().left - MapState.offsetX) / MapState.scale;
    //   MapState.mouseY = (event.clientY - event.target.getBoundingClientRect().top - MapState.offsetY) / MapState.scale;

    //   textPositions.forEach(text => {
    //     if (MapState.mouseX >= text.x - CLICK_MARGIN && MapState.mouseX - CLICK_MARGIN <= text.x + text.width &&
    //       MapState.mouseY >= text.y - CLICK_MARGIN && MapState.mouseY - CLICK_MARGIN <= text.y + text.height) {


    //       fromSection = document.querySelector(".order-" + MapState.activeMapPlace)
    //       console.log(fromSection)
    //       fromSection.querySelector(".navigation-opener").classList.remove("active")
    //       gsap.to([fromSection.querySelector(".video-container"), fromSection.querySelector(".view-1"), fromSection.querySelector(".view-2")], {
    //         visibility: "visible",
    //         duration: 0,
    //       })

    //       navigateTo = document.querySelector('.order-' + text.order)
    //       navigateTo.scrollIntoView({
    //         behavior: 'smooth'
    //       });
    //       window.closeNavigationMap();
    //     }
    //   });
    // }

    // function handleTouchClick(event) {
    //   const touchX = (event.changedTouches[0].clientX - MapState.offsetX) / MapState.scale;
    //   const touchY = (event.changedTouches[0].clientY - MapState.offsetY) / MapState.scale;

    //   textPositions.forEach(text => {
    //     if (touchX >= text.x - CLICK_MARGIN && touchX - CLICK_MARGIN <= text.x + text.width &&
    //       touchY >= text.y - CLICK_MARGIN && touchY - CLICK_MARGIN <= text.y + text.height) {
    //       document.getElementById("map-container-container").classList.add("map-hidden");
    //       window.scrollToMo(text.order, true);
    //       document.getElementById('mo-progress').classList.remove("hidden");
    //     }
    //   });
    // }

    // function initializeMap() {

    //   if (!localStorage.getItem("mapHasOpened")) {
    //     const scrollHint = document.createElement("div");
    //     scrollHint.id = "scroll-hint";

    //     const scrollHintText = document.createElement("p");
    //     scrollHintText.textContent = "Zoome hinein zum Entdecken";
    //     scrollHint.appendChild(scrollHintText);

    //     document.body.appendChild(scrollHint);

    //     localStorage.setItem("mapHasOpened", "true");
    //   }

    //   generateAllPlaces();
    //   drawMap();
    //   addEventListeners();
    // }

    // window.openNavigationMap = () => {
    //   console.log("dhuewhdiebd")
    //   if (!MapState.mapInitialized) {
    //     initializeMap();
    //     MapState.mapInitialized = true;
    //   }
    //   drawMap();
    //   document.getElementById("map-container-container").classList.remove("map-hidden");
    // }

    // window.closeNavigationMap = () => {

    //   if (document.getElementById("scroll-hint")) {
    //     document.getElementById("scroll-hint").remove();
    //   }

    //   document.getElementById("map-container-container").classList.add("map-hidden");
    // }

    // window.setActiveMapPlace = (order) => {
    //   MapState.activeMapPlace = order;
    // }
  })
}