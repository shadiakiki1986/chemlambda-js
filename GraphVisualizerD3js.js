// working demo at
// https://jsfiddle.net/shadiakiki1986/b916cofL/

function GraphVisualizerD3js() {

  this.renderSVGElement = function(graph) {
    // make preliminary conversion of format
    graph.links = graph.edges
    console.log("graph viz d3js received graph", graph.nodes, graph.links)

    // from https://cdn.rawgit.com/gmamaladze/d3-dot-graph/cf08847e/example/index.html
    var line = d3.line()
      .curve(d3.curveCatmullRom.alpha(0.5));

    var svgNew = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    var svg = d3.select(svgNew),
      width = +svg.attr("width"),
      height = +svg.attr("height");

    var color = d3.scaleOrdinal(d3.schemeCategory20);

    var simulation = d3.forceSimulation()
      .force("link", d3.forceLink().distance(100).id(function(d) {
        return d.id;
      }))
      .force("charge", d3.forceManyBody().strength(-10))
      .force("collide", d3.forceCollide(50))
      .force("center", d3.forceCenter(width / 2, height / 2));

    function dragstarted(d) {
      if (!d3.event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(d) {
      d.fx = d3.event.x;
      d.fy = d3.event.y;
    }

    function dragended(d) {
      if (!d3.event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

      // build the arrow.
      svg.append("svg:defs").selectAll("marker")
        .data(["end"]) // Different link/path types can be defined here
        .enter().append("svg:marker") // This section adds in the arrows
        .attr("id", String)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 15)
        .attr("refY", -0.5)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("svg:path")
        .attr("d", "M0,-5L10,0L0,5");;

      // add the links and the arrows
      var path = svg.append("svg:g").attr("class", "links").selectAll("path")
        .data(graph.links)
        .enter().append("svg:path")
        //    .attr("class", function(d) { return "link " + d.type; })
        .attr("marker-end", "url(#end)");

      //console.log("nodes", graph.nodes)
      var node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(graph.nodes)
        .enter().append("g")

      node
        .append("circle")
        .attr("r", 5)
        //.attr("fill", function(d) { return color(d.group); })
        .call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended));

      // add the text
      node.append("text")
        .attr("x", 12)
        .attr("dy", ".35em")
        .text(function(d) {
          return d.id;
        });

      simulation
        .nodes(graph.nodes)
        .on("tick", ticked);

      simulation.force("link")
        .links(graph.links);

      let linkGen = d3.linkVertical().x(function(d) {
          return d.x;
        })
        .y(function(d) {
          return d.y;
        });;

      var linkRad = d3.linkRadial()
        .angle(function(d) {
          return d.x;
        })
        .radius(function(d) {
          return d.y;
        });

      function ticked() {
        path.attr("d", function(d) {
          var dx = d.target.x - d.source.x,
            dy = d.target.y - d.source.y,
            dr = Math.sqrt(dx * dx + dy * dy);
          return "M" +
            d.source.x + "," +
            d.source.y + "A" +
            dr + "," + dr + " 0 0,1 " +
            d.target.x + "," +
            d.target.y;
        });
        node
          .attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")";
          });
      }

    return svgNew

  }

  return this
}
/////////////

//var gv = GraphVisualizerD3js()
//pred_3_url = 'https://cdn.jsdelivr.net/gh/shadiakiki1986/chemlambda-awk/mol/other/pred_3%20v2.dot'
// gv.renderSVGElement(pred_3_url)


module.exports = GraphVisualizerD3js()