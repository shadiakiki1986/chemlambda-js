function MovesVisualizer() {
  // Draw a tree of the moves along different paths
  //-----------------------------------------------

  var utils = new Utils()
  var gr = new GraphRewriter()
  var gid = new GlobalIdRegister()
  var paths = []
  var reg_n = [] // register for nodes, maps txt of re-write to an ID
  var reg_e = [] // register for edges, maps ID of parent to list of IDs of children

  this.reset = function() {
    this.gid.globalIdRegister = []
    this.paths = []
    this.reg_n = []
    this.reg_e = []
  }


  this.appendPath = function(rwValX) {
    // rwValX - list of dict, same as output from txt2array

    // convert back to list of txt
    rwValX = rwValX.map(rwi => gr.array2txt(rwi))

    // register in register
    var self = this
    rwValX.forEach(rwi => {
      // if already exists, skip
      if(Object.keys(self.reg_n).indexOf(rwi) != -1) return
      // otherwise generate a new Node ID and append
      self.reg_n[rwi] = gid.newNodeId("R")
    })

    // append to paths
    self.paths = self.paths.concat([rwValX])
  }


  this.paths2dot = function() {
    // convert to dot script

    // add nodes
    var dot_nodes = Object.keys(self.reg_n).map(reg_v => {
      var reg_k = self.reg_n[reg_v]
      return reg_k + ' [label="' + reg_v + '"];'
    })

    // add edges
    var dot_edges = []
    var self = this
    this.paths.forEach(path_i => {
      if(path_i.length==0) return
      for(i=1; i<path_i.length; i++) {
        // some utility variables
        parent_txt = path_i[i-1]
        child_txt = path_i[i]
        parent_id = self.reg_n[parent_txt]
        child_id = self.reg_n[child_txt]

        // init
        if(Object.keys(self.reg_e).indexOf(parent_id) == -1) {
          self.reg_e[parent_id] = []
        }

        // check if already added this edge
        if(self.reg_e[parent_id].indexOf(child_id)) != -1) {
          return // since found already
        }

        // otherwise append new one
        self.reg_e[parent_id] = self.reg_e[parent_id].concat([self.reg_e[child_id]])
        var dot_i = parent_id + " -> " + child_id + ";"
        dot_edges = dot_edges.concat([dot_i])
      }
    })

    // finalize
    var dot_all = dot_nodes.concat(dot_edges)
    return "digraph G {\n" + dot_all.join("\n") + "\n}"
  }


  return this
}
/////////////

//var gv = GraphVisualizerD3js()
//pred_3_url = 'https://cdn.jsdelivr.net/gh/shadiakiki1986/chemlambda-awk/mol/other/pred_3%20v2.dot'
// gv.renderSVGElement(pred_3_url)


module.exports = MovesVisualizer()
