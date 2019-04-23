function GraphVisualizerD3js() {
  // Draw the graph with d3.js
  //
  // Working demo at
  // https://jsfiddle.net/shadiakiki1986/b916cofL/
  //
  // Note that d3.js does nothing to reduce links that criss-cross
  // Might want to use sigma.js
  // https://stackoverflow.com/questions/29006725/avoid-links-criss-cross-overlap-in-d3-js-using-force-layout
  //-------------------------------------------------------------------

  var utils = new Utils()

  this.dict2d3 = function(g1) {
    // make preliminary conversion of format
    //console.log("conversion in", utils.clone(g1))

    // utility map
    type_size_map = {'A': 6, 'L': 6, 'l': 3, 'm': 1, 'r': 1}
    type_colour_map = {'A': '#04B431', 'L': '#FF0000', 'l': '#FFFF00', 'm': '#FFFF00', 'r': '#FFFF00'}

    // init
    var graph = {'nodes': [], 'links': []}
    n_dict = []
    l_core = []
    g1.nodes.forEach(n_main => {

      // split the main node into 4 nodes: core, l, r, m

      // gather all nodes in dict by ID
      // append core node .. note that this gets appended multiple times .. FIXME
      var n_id2 = n_main.id+':core'
      var n_core = {id: n_id2,
                    type: n_main.type,
                    size: type_size_map[n_main.type],
                    colour: type_colour_map[n_main.type]
                   }
      n_dict[n_id2] =n_core

      var l_types = ['l','m','r']
      l_types.forEach(k1 => {
        // append nodes for each of the ports
        var n_inout = utils.type_side_to_inout(n_main.type, k1)
        var n_id1 = n_main.id + ':' + k1 + n_inout
        var n_port = {id: n_id1,
                      type: k1,
                      size: type_size_map[k1],
                      colour: n_inout=="i" ? '#FFFF00' : '#0000FF' // yellow = FFFF00, blue = 0000FF
                     }
        n_dict[n_id1] = n_port

        // append links intra-ports, i.e. from core to ports
        l_core = l_core.concat([{
          source: n_inout=="i" ? n_port : n_core,
          target: n_inout=="i" ? n_core : n_port,
          bond: 3
        }])

      })

    })

    // copy nodes to "graph"
    graph.nodes = Object.keys(n_dict).map(k => n_dict[k])

    // build links inter-ports, i.e. between ports of different cores
    l_ports = g1.edges.map(e => {
      target_id = utils.nodeDict2label(e.to)
      source_id = utils.nodeDict2label(e.from)
      return {
        source: source_id in n_dict ? n_dict[source_id] : null,
        target: target_id in n_dict ? n_dict[target_id] : null,
        bond: 1
      }
    }).filter(n => !!n.target && !!n.source)

    // combine links of inter-port and intra-port
    graph.links = l_core.concat(l_ports)

    //console.log("conversion out", utils.clone(graph))

    return graph
  }


  this.renderSVGElement = function(g1, extendedLabels) {
    // inspired from http://imar.ro/~mbuliga/molecule_with_tricks.js

    var graph = this.dict2d3(utils.clone(g1))

    //console.log("graph viz d3js received graph", graph.nodes, graph.links)

    // from https://cdn.rawgit.com/gmamaladze/d3-dot-graph/cf08847e/example/index.html
    var line = d3.line().curve(d3.curveCatmullRom.alpha(0.5));

    // https://github.com/d3/d3-scale#scaleSqrt
    var radius = d3.scaleSqrt().range([0, 6]);

    // Define the div for the tooltip
    // http://bl.ocks.org/d3noob/a22c42db65eb00d4e369
    var divTooltip = d3.select("#d3jsTooltip").style("opacity", 0);

    var svgNew = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgNew.setAttribute("width",  "600") //960)
    svgNew.setAttribute("height", "600") // 600)

    // https://www.lifewire.com/svg-viewbox-attribute-3469829
    // minx miny width height
    //svgNew.setAttribute("viewBox", "0.00 0.00 148.44 204.60") // random numbers ... will be overwritten below

    var svg = d3.select(svgNew),
      width = +svg.attr("width"),
      height = +svg.attr("height");

    var color = d3.scaleOrdinal(d3.schemeCategory20);

    var simulation = d3.forceSimulation()
      .force(
          "link",
          d3.forceLink()
          //.distance(100)
          .distance(function(d) {
            //if(d.source.id.indexOf(':core')!=-1 || d.target.id.indexOf(':core')!=-1) {
            //  return 1
            //}
            //return 5
            return ((radius(d.source.size) + radius(d.target.size) + 10)/(3*d.bond));

          })
          .id(function(d) { return d.id; })
        )

      // nodes repel
      //.force("charge", d3.forceManyBody().strength(-10))
      .force("charge", d3.forceManyBody().strength(-50))
      //.force("charge", d3.forceManyBody().strength(-200))
      //.force("charge", d3.forceManyBody().strength(d => d.bond/6) )

      // nodes avoid overlap
      .force("collide", d3.forceCollide().radius(function(d) { return 1.5*radius(d.size);  }))

      // center the nodes
      .force("center", d3.forceCenter(width / 2, height / 2))

      // repelling circle
      .force("center", d3.forceRadial(3600, width/2, height/2).strength(-0.002))
      ;

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

        // re-center and re-scale view
        // search for "center_view" on http://bl.ocks.org/pkerpedjiev/0389e39fad95e1cf29ce
        // subtract 10 for some padding
        min_x = d3.min(graph.nodes.map(function(d) {return d.x;})) - 100;
        min_y = d3.min(graph.nodes.map(function(d) {return d.y;})) - 100;
        max_x = d3.max(graph.nodes.map(function(d) {return d.x;})) + 100;
        max_y = d3.max(graph.nodes.map(function(d) {return d.y;})) + 100;
        mol_width = max_x - min_x;
        mol_height = max_y - min_y;
        svgNew.setAttribute("viewBox", min_x + " " + min_y + " " + mol_width + " " + mol_height)
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

        //.attr("r", 5)
        .attr("r", function(d) { return radius(d.size); })
        .style("fill", function(d) { return d.colour; })

        //.attr("fill", function(d) { return color(d.group); })

        .call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended))

        // Add tooltip
        .on("mouseover", function(d) {
            divTooltip.transition()
                .duration(200)
                .style("opacity", .9);
            divTooltip.html(d.id);
            // FIXME this didnt work well
            //    .style("left", (d.x) + "px")
            //    .style("top", (d.y) + "px");
          })

        .on("mouseout", function(d) {
            divTooltip.transition()
                .duration(500)
                .style("opacity", 0);
        })
      ;

      if(extendedLabels) {
        // add the text
        node.append("text")
          .attr("x", 12)
          .attr("dy", ".35em")
          .text(function(d) {
            return d.id;
          });
      }

      simulation
        .nodes(graph.nodes)
        .on("tick", ticked);

      simulation.force("link")
        .links(graph.links);



/*
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
*/

    //console.log("d3js done", svgNew) // svg
    return svgNew

  }

  return this
}
/////////////

//var gv = GraphVisualizerD3js()
//pred_3_url = 'https://cdn.jsdelivr.net/gh/shadiakiki1986/chemlambda-awk/mol/other/pred_3%20v2.dot'
// gv.renderSVGElement(pred_3_url)


module.exports = GraphVisualizerD3js()