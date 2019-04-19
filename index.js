////////////////////
// plot graph of input function from the HTML text box


var lr = new LambdaReader()
var lt = new LambdaTerms()




// set options of dropdown
// https://stackoverflow.com/a/9895164/4126114
var jsExamplesOpt = [
  { "title": "λu.x", 
    "description": "λu.x", 
    "javascript": "u=>x",
    "default": true
  },
  { "title": "λn.n(λu.x)", 
    "description": "λn.n(λu.x)", 
    "javascript": "n=> n (u=>x)"
  },
  { "title": "λf.λx.x(y)", 
    "description": "λf.λx.x(y)", 
    "javascript": "f => x => x(y)"
  },
  { "title": "three",
    "description": "three := λf.λx.f(f(f x))",
    "javascript": "f => x => f(f(f(x)))"
  },
  { "title": "predecessor",
    "description": "PRED := λn.λf.λx.n (λg.λh.h (g f)) (λu.x) (λu.u)",
    "javascript": `n => f => x => {
  var L4 = u1 => x
  var L5 = u2 => u2 // notice that this is u2 (versus u1 above) instead of plain "u"
  var L6 = g => h => h(g(f))
  return ((n(L6))(L4))(L5)
}`
  },
  {"title":"predecessor(three)",
   "description": "PRED(three)", 
   "javascript": `PRED3 => {
  var PRED = n => f1 => x1 => {
    var L4 = u1 => x1
    var L5 = u2 => u2
    var L6 = g => h => h(g(f1))
    return ((n(L6))(L4))(L5)
  }

  var three = f2 => x2 => f2(f2(f2(x2)))

  return PRED(three)
}`,
      "rewrites": `beta L6 A8
beta L8 A2

# either perform beta, or dist
# beta L7 A3
# dist all L3 all all
# dist L2  L3 all all
# dist L2  L3 A0  all
# dist L2  L3 A0  A7
`
  }
]; 

// https://stackoverflow.com/a/10290924/4126114
// create an associative array from two regular arrays
function createAssociativeArray(arr1, arr2) {
    /*
    var array1 = ["key1", "Key2", "Key3"];
    var array2 = ["Value1", "Value2", "Value3"];
    var associativeArray = createAssociativeArray(array1, array2);
    */
    var arr = {};
    for(var i = 0, ii = arr1.length; i<ii; i++) {
        arr[arr1[i]] = arr2[i];
    }
    return arr;
}

// https://stackoverflow.com/a/21147462
function clone(assArray) {
  return JSON.parse(JSON.stringify(assArray))
}

// https://stackoverflow.com/a/7228322/4126114
function randomIntFromInterval(min,max) // min and max included
{
    return Math.floor(Math.random()*(max-min+1)+min);
}


var app = new Vue({
  el: '#app',
  data: {
    "inTitle": "",
    "inDescription": "",
    "inJavascript": "",
    
    "dot1From": "lambda",

    "jsExamplesOpt": jsExamplesOpt,
    "jsExSelected": jsExamplesOpt[0],
    
    "dot1Manual": "",
    "rwTxt": "",

    "jsAuto": "",
    "dict1Auto": "",
    "dict2Auto": "",
    "rwAuto": [],

    "error1Msg": "",
    "error2Msg": "",
    
    "graph1Svg": "",
    "graph2Svg": "",
    
    "graph1Visible": true,
    
    "extendedLabels": true,
    "suggestedRwSelected": "",
    "suggestedRwStep": 0,
    
    "suggestedRwMax": 25, // maximum steps to roll out each time
    "suggestedRwMethod": "",
    "dict2FromDict1Callback": false
  },
  
  methods: {
    resetInput: function() {
      this.inTitle=""
      this.inDescription=""
      this.inJavascript=""
      this.dot1From="lambda"
      this.rwTxt = ""
    },
    
    resetOutput: function() {
      this.error1Msg = ""
      this.error2Msg = ""
      this.jsAuto = ""
      this.dict1Auto = ""
      this.graph1Visible = true
      this.graph2Visible = false
      this.rwAuto = clone([])
      this.dict2Auto = "" // clone(this.dict1Auto) // without any re-writes
      lr.globalIdRegister = [] // to re-issue IDs
      this.suggestedRwStep = 0
    },
    
    jsExOnChange: function() {
      this.resetInput()
      this.resetOutput()
      
      this.inTitle = this.jsExSelected.title
      this.inDescription = this.jsExSelected.description
      this.inJavascript = this.jsExSelected.javascript
      this.jsAuto = this.jsExSelected.javascript; // this was clone() eventhough it was just text

      if("rewrites" in this.jsExSelected)  {
        this.rwTxt = this.jsExSelected.rewrites
      }

    },
    
    /*
    pushDot: function() {
      this.error1Msg = ""
      this.error2Msg = ""
      this.dict1Auto = clone(this.dot1Manual)
      
      this.graph1Visible = true
      this.graph2Visible = false
      
      if("rewrites" in this.jsExSelected)  {
        this.rwTxt = this.jsExSelected.rewrites
      } else {
        this.rwTxt = ""
      }
      
      this.dict2Auto = "" // clone(this.dict1Auto) // without any re-writes
    },
    */
    
    pushRw: function() {
      this.resetOutput()

      if(this.dot1From=='lambda') {
        this.jsAuto = this.inJavascript;
        this.dict1Auto = clone(this.dict1FromJsAuto)
      } else {
        this.dict1Auto = clone(this.dot1Manual)
      }
      
      this.rwAuto = clone(this.rwVal)
      // final step
      this.dict2Auto = clone(this.dict2FromDict1Auto); // with re-writes
      this.graph1Visible = false
      this.graph2Visible = true
    },
    
    suggestedRwAppend: function(till_none) {
      // sanity check
      if(till_none && this.suggestedRwMethod!='random') {
        throw "suggestedRwAppend(till_none=true) only supported when suggestedRwMethod=='random'."
      }

      // increment
      this.suggestedRwStep += 1
      
      // check method
      switch(this.suggestedRwMethod) {
        case "selected":
          // just append to the re-writes the selected value
          this.rwTxt += '\n' + this.suggestedRwSelected
          break
        case "random":
          // choose a random entry from the suggestions
          var idx = randomIntFromInterval(0, this.suggestedRwAll.length-1)
          // append it
          this.rwTxt += '\n' + this.suggestedRwAll[idx]
          break
        default:
          throw "Unsupported suggestion method " + this.suggestedRwMethod
      }
      
      // now that we have a new entry in the re-writes, re-generate the graph
      /*
      var self = this
      this.dict2FromDict1Callback = function() {
        console.log("inside callback")
        // stop the callback since fulfilled
        self.dict2FromDict1Callback = false
        
        // if done, then plot and return, otherwise recurse
        // done = loop not requested or no more suggestions or reached a multiple of the max
        if(!till_none || self.suggestedRwAll.length == 0 || self.suggestedRwStep % self.suggestedRwMax == 0) {
          // plot with re-writes
          console.log("plotting with rewrites", self.dict2FromDict1Auto)
          self.dict2Auto = clone(self.dict2FromDict1Auto);
          return
        }
        
        // recurse, without plotting yet
        self.suggestedRwAppend(till_none)
      }
      this.rwAuto = clone(this.rwVal)
      */
      
      // complete re-calculation of initial graph + re-writes and graphing
      var tmp_step = this.suggestedRwStep
      this.pushRw()
      this.suggestedRwStep = tmp_step
      
      if(till_none && this.suggestedRwAll.length > 0 && (this.suggestedRwStep % this.suggestedRwMax) != 0) {
        // recurse, after the previous plotting
        this.suggestedRwAppend(till_none)
      }
      

    }
    
  },
  
  // https://vuejs.org/v2/guide/computed.html#Computed-vs-Watched-Property
  computed: {
    
    "dot1Auto": function() {
      if(!this.dict1Auto) return ""
      return lr.dict2dot_main(this.dict1Auto, this.extendedLabels) // dot file before re-writes
    },
    
    "dot2Auto": function() {
      if(!this.dict2Auto) return ""
      return lr.dict2dot_main(this.dict2Auto, this.extendedLabels) // dot file after re-writes
    },
    
    "dict1FromJsAuto": function () {

      if(this.jsAuto == "") {
        return ""
      }
      
      var dot_in = this.jsAuto;
      //dot_in = 'digraph { a -> b }' // for testing
      //dot_in = pred_arrow_dot // for testing
      
      try {
        
        dot_in = eval(dot_in);
        var lambda_dict = lr.jsjson2dict_main(esprima.parse(dot_in.toString()));
        //var lambda_dot = lr.dict2dot_main(lambda_dict) // dot file before re-writes
        //console.log("lambda dot", lambda_dot)
      }
      catch (e) {
        // statements to handle any exceptions
        console.error(e);
        this.error1Msg = e;
        return
      }
      
      //return lambda_dot;
      return lambda_dict; // return dict even if dot is available
      
    },
    
    
    "dict2FromDict1Auto": function() {
      // compute new graph from re-writes (rwAuto)

      // init
      var lambda_dict = clone(this.dict1Auto)
      
      if(this.rwAuto.length==0 || this.rwAuto.filter(x => x!=null).length == 0) {
        // no re-writes
        if(this.dict2FromDict1Callback) setTimeout(this.dict2FromDict1Callback, 1)
        return lambda_dict;
      }

      // pass dict through re-writes
      this.rwAuto.forEach(rwi => {
        if(rwi == null) return
        
        //console.log("applying re-write ", JSON.stringify(rwi))
        //console.log("lambda_dict", lambda_dict.nodes.map(x=>x.id))

        // convert edges array to associative array
        // Note that these 2 lines need to be inside the forEach
        // because the graph evoloves as the re-writes are made
        // and hance there are possibly new nodes
        var edges_keys = lambda_dict.edges.map(lr.edgeDict2dot);
        var edges_dict = createAssociativeArray(edges_keys, lambda_dict.edges)
        
        // check re-write type and apply the corresponding actions
        switch(rwi.type) {
          case "beta":
            // e.g. beta L1 A1

            try {
              // get nodes
              var n1 = lambda_dict.nodes.filter(node => node.id==rwi.n1)
              var n2 = lambda_dict.nodes.filter(node => node.id==rwi.n2)
              
              // sanity checks
              if(n1.length==0) throw ("Rewrite error: Node " + rwi.n1 + " not found")
              if(n2.length==0) throw ("Rewrite error: Node " + rwi.n2 + " not found")
              if(n1.length >1) throw ("Rewrite error: Node " + rwi.n1 + " found > 1")
              if(n2.length >1) throw ("Rewrite error: Node " + rwi.n2 + " found > 1")
  
              // take first element of each array
              n1 = n1[0]
              n2 = n2[0]
              
              // check types
              if(n1.type!='L') throw ("Rewrite error: 1st node for beta is expected to have type L. Got '" + n1.type + "' instead")
              if(n2.type!='A') throw ("Rewrite error: 2nd node for beta is expected to have type A. Got '" + n2.type + "' instead")
              
              // identify edges
              var edges_labeled = {
                "L_in": Object.keys(edges_dict).filter(k => edges_dict[k].to.id==rwi.n1),
                "A_out": Object.keys(edges_dict).filter(k => edges_dict[k].from.id==rwi.n2),
                "A_in_notL": Object.keys(edges_dict).filter(k => (edges_dict[k].to.id==n2.id)&&(edges_dict[k].from.id!=n1.id)),
                "L_out_notA": Object.keys(edges_dict).filter(k => (edges_dict[k].from.id==n1.id)&&(edges_dict[k].to.id!=n2.id))
              }
              
            } catch (e) {
              this.error2Msg = e
              console.error(e)
              return
            }
            
            // add edges
            [ 
              edges_labeled["L_in"].map(L_in => {
                return edges_labeled["A_out"].map(A_out => {
                  return {
                    'from': edges_dict[L_in].from, 
                    'to': edges_dict[A_out].to
                  }
                })
              }).reduce((a,b)=>a.concat(b), []),

              
              edges_labeled["A_in_notL"].map(A_in_notL => {
                return edges_labeled["L_out_notA"].map(L_out_notA => {
                  return {
                    'from': edges_dict[A_in_notL].from, 
                    'to': edges_dict[L_out_notA].to
                  }
                })
              }).reduce((a,b)=>a.concat(b), [])
              
            ].reduce((a,b)=>a.concat(b), []).forEach(e => {
              var k = lr.edgeDict2dot(e)
              edges_dict[k] = e
            })

            // delete edges
            Object.keys(edges_labeled).forEach(k1 => {
              edges_labeled[k1].map(k2 => {
                delete edges_dict[k2]
              })
            })

            break;
            
            
          case "dist":
            // e.g. dist L1 L2 L3 L4

            try {
              // sanity check
              if(rwi.n_in == null) throw("Rewrite error: Move " + rwi.type + " received node 1 == null. Aborting")
              if(rwi.n_center == null) throw("Rewrite error: Move " + rwi.type + " received node 2 == null. Aborting")
              if(rwi.n_left == null) throw("Rewrite error: Move " + rwi.type + " received node 3 == null. Aborting")
              if(rwi.n_right == null) throw("Rewrite error: Move " + rwi.type + " received node 4 == null. Aborting")
              
              // get node
              var n_in = (rwi.n_in=="all") ? "all" : lambda_dict.nodes.filter(node => node.id==rwi.n_in)
              var n_center = lambda_dict.nodes.filter(node => node.id==rwi.n_center)
              var n_left = (rwi.n_left=="all") ? "all" : lambda_dict.nodes.filter(node => node.id==rwi.n_left)
              var n_right = (rwi.n_right=="all") ? "all" : lambda_dict.nodes.filter(node => node.id==rwi.n_right)
              
              // sanity checks
              if(n_in!="all") {
                if(n_in.length==0) throw ("Rewrite error: Node " + rwi.n_in + " not found")
                if(n_in.length >1) throw ("Rewrite error: Node " + rwi.n_in + " found > 1")
                n_in = n_in[0] // take first element of array
              }

              if(n_center.length==0) throw ("Rewrite error: Node " + rwi.n_center + " not found")
              if(n_center.length >1) throw ("Rewrite error: Node " + rwi.n_center + " found > 1")
              n_center = n_center[0] // take first element of array
              // check types
              if(n_center.type!='L') throw ("Rewrite error: center node for dist is expected to have type L. Got '" + n_center.type + "' instead")

              if(n_left!="all") {
                if(n_left.length==0) throw ("Rewrite error: Node " + rwi.n_left + " not found")
                if(n_left.length >1) throw ("Rewrite error: Node " + rwi.n_left + " found > 1")
                n_left = n_left[0] // take first element of array
                // check types
                if(n_left.type !='L' && n_left.type !='A') throw ("Rewrite error: left  node for dist is expected to have type L or A. Got '" + n_left.type  + "' instead")
              }

              if(n_right!="all") {
                if(n_right.length==0) throw ("Rewrite error: Node " + rwi.n_right + " not found")
                if(n_right.length >1) throw ("Rewrite error: Node " + rwi.n_right + " found > 1")
                n_right = n_right[0] // take first element of array
                // check types
                if(n_right.type!='L' && n_right.type!='A') throw ("Rewrite error: right node for dist is expected to have type L or A. Got '" + n_right.type + "' instead")
              }

              // identify all edges
              var edges_labeled = {
                "L_in"   : Object.keys(edges_dict).filter(k =>  edges_dict[k].to.id  ==rwi.n_center),
                "L_out_r": Object.keys(edges_dict).filter(k => (edges_dict[k].from.id==n_center.id )&&(edges_dict[k].from.portname=="r")),
                "L_out_l": Object.keys(edges_dict).filter(k => (edges_dict[k].from.id==n_center.id )&&(edges_dict[k].from.portname=="l"))
              }
              
              // identify branching ports
              var is_branch = []
              Object.keys(edges_labeled).forEach(k => {
                is_branch[k] = (edges_labeled[k].length > 1)
              })
              
              // require at least 1 output to be branching, otherwise what's the point of dist?
              if(Object.keys(is_branch).filter(k => is_branch[k]).filter(x => x).length == 0) {
                throw "For 'dist', at least one port on the central node is required to be branching. Aborting for " + rwi.toString()
              }

              // filter edges for subset identified by nodes
              if(n_in   !="all") edges_labeled["L_in"   ] = edges_labeled["L_in"   ].filter(k => edges_dict[k].from.id==rwi.n_in   )
              if(n_left !="all") edges_labeled["L_out_l"] = edges_labeled["L_out_l"].filter(k => edges_dict[k].to.id  ==rwi.n_left )
              if(n_right!="all") edges_labeled["L_out_r"] = edges_labeled["L_out_r"].filter(k => edges_dict[k].to.id  ==rwi.n_right)

            } catch (e) {
              this.error2Msg = e
              console.error(e)
              return
            }
            
            // add edges
            edges_labeled["L_in"].map(L_in => {
              return edges_labeled["L_out_r"].map(L_out_r => {
                return edges_labeled["L_out_l"].map(L_out_l => {
                  // clone the old L node
                  var old_L_id = rwi.n_center
                  var old_L_node = lambda_dict.nodes.filter(n => n.id==old_L_id)
                  if(old_L_node.length == 0) throw "Failed to identify node " + old_L_id + ". Found 0"
                  if(old_L_node.length  > 1) throw "Failed to identify node " + old_L_id + ". Found > 1"
                  old_L_node = old_L_node[0]
                  
                  var new_L_id = lr.newNodeId("L")
                  var new_L_node = clone(old_L_node)
                  new_L_node.id = new_L_id
                  new_L_node.from = rwi.toString()
                  
                  // add the new L node to the list of nodes
                  lambda_dict.nodes = lambda_dict.nodes.concat([new_L_node])
                  
                  // add the new L node's edges to the list of edges
                  // Notice that none of the outputs here are branched
                  var new_L_l = {"type": "L", "id": new_L_id, "portname": "l", "inout": "o"}
                  var new_L_m = {"type": "L", "id": new_L_id, "portname": "m", "inout": "i"}
                  var new_L_r = {"type": "L", "id": new_L_id, "portname": "r", "inout": "o"}
  
                  return [
                    { 'from': edges_dict[L_in].from, 
                      'to': new_L_m
                    },
                    { 'from': new_L_l, 
                      'to': edges_dict[L_out_l].to
                    },
                    { 'from': new_L_r, 
                      'to': edges_dict[L_out_r].to
                    },
                  ]
                }).reduce((a,b)=>a.concat(b), [])
              }).reduce((a,b)=>a.concat(b), [])
            }).reduce((a,b)=>a.concat(b), []).forEach(e => {
              var k = lr.edgeDict2dot(e)
              edges_dict[k] = e
            })

            // delete edges
            Object.keys(edges_labeled).forEach(k1 => {
              // only delete edges that belong to a branching port
              if(is_branch[k1]) {
                edges_labeled[k1].map(k2 => {
                  delete edges_dict[k2]
                })
              }
            })

            break;
            
            
          default:
            throw "Unsupported move " + rwi.type
        }
        
        // convert edges dict back to array and store in main variable
        // Note that this needs to be inside the forEach instead of outside
        // so that the graph would evolve. Check related note at beginning
        // of forEach section
        lambda_dict.edges = Object.keys(edges_dict).map(k => edges_dict[k])

      })
      
      // return
      if(this.dict2FromDict1Callback) setTimeout(this.dict2FromDict1Callback, 1)
      return lambda_dict
    },
    
    "rwVal": function() {
      return this.rwTxt.split("\n").map(l => l.trim()).filter(l => !!l).map(l => {
        // cut off everything after a # (as comment character)
        // https://stackoverflow.com/a/4059018/4126114
        if(l.indexOf("#") != -1) {
          l = l.substr(0, l.indexOf("#"));
        }
        
        // split on space and drop empty words (due to consecutive spaces)
        var row_all = l.split(" ").filter(w => w.length > 0)
        if(row_all.length == 0) return null // these are filtered out later
        
        // sanity check of length based on type
        var row_type = row_all[0]
        switch(row_type) {
          case "beta":
            if(row_all.length != 3) throw "beta should have 2 arguments. " + row_all.length + " found"
            
            var out = {
              'type': row_type,
              'n1': row_all[1],
              'n2': row_all[2]
            }
            return out
            break
          case "dist":
            if(row_all.length != 5) throw "dist should have 4 arguments. " + row_all.length + " found"
            var out = {
              'type': row_type,
              'n_in': row_all[1],
              'n_center': row_all[2],
              'n_left': row_all[3],
              'n_right': row_all[4]
            }
            return out
            break
          default:
            throw "Unsupported command " + row_type + " encountered. Only beta and dist supported ATM"
        }
        
      }).filter(l => !!l)
    },
    
    "suggestedRwAll": function() {
      // Note that this is tied to dict2FromDict1Auto and not to dict2Auto
      // because with suggestions, the graph is not drawn until the end
      // and that is when dict2Auto is updated
      if(!this.dict2FromDict1Auto) return []
      
      // filter for edges between L and A, and suggest beta moves on them
      var beta_listStr = []
      this.dict2FromDict1Auto.edges.forEach(e1 => {
        // if not L-A, ignore
        if(!(e1.from.type=="L" && e1.to.type=="A")) return
        
        // if L has no input, ignore
        var L_in = this.dict2FromDict1Auto.edges.filter(e2 => e2.to.id == e1.from.id)
        if(L_in.length == 0) return

        // if A has no output, ignore
        var A_out = this.dict2FromDict1Auto.edges.filter(e2 => e2.from.id == e1.to.id)
        if(A_out.length == 0) return
        
        // append
        beta_listStr = beta_listStr.concat(["beta " + e1.from.id + " " + e1.to.id])
      })
      
      // filter for L nodes that have a fan-in or fan-out
      var dist_listStr = []
      this.dict2FromDict1Auto.nodes.forEach(node_center => {
        if(node_center.type != 'L') return
        var edges_mi = this.dict2FromDict1Auto.edges.filter(edge => edge.to.id == node_center.id)
        var edges_lo = this.dict2FromDict1Auto.edges.filter(edge => edge.from.id == node_center.id && edge.from.portname=="l")
        var edges_ro = this.dict2FromDict1Auto.edges.filter(edge => edge.from.id == node_center.id && edge.from.portname=="r")
        
        if(edges_mi.length <= 1 && edges_lo.length <= 1 && edges_ro.length <= 1) return null
        
        // 3x all
        dist_listStr = dist_listStr.concat(["dist all " + node_center.id + " all all"])
        
        // now, spell out the nodes
        edges_mi.forEach(edge_mi => {
          node_mi = edge_mi.from
          if(node_mi.type != 'L' && node_mi.type != 'A') return
          
          // 2x all
          dist_listStr = dist_listStr.concat(["dist " + node_mi.id + " " + node_center.id + " all all"])
          
          edges_lo.forEach(edge_lo => {
            node_lo = edge_lo.to
            if(node_lo.type != 'L' && node_lo.type != 'A') return
            
            // 2x all
            dist_listStr = dist_listStr.concat(["dist all " + node_center.id + " " + node_lo.id +  " all"])
            // 1x all
            dist_listStr = dist_listStr.concat(["dist " + node_mi.id + " " + node_center.id + " " + node_lo.id +  " all"])
            
            edges_ro.forEach(edge_ro => {
              node_ro = edge_ro.to
              if(node_ro.type != 'L' && node_ro.type != 'A') return
              
              // 2x all
              dist_listStr = dist_listStr.concat(["dist all " + node_center.id + " all " + node_ro.id + ""])
              
              // 1x all
              dist_listStr = dist_listStr.concat(["dist " + node_mi.id + " " + node_center.id + " all " + node_ro.id])

              // 1x all
              dist_listStr = dist_listStr.concat(["dist all " + node_center.id + " " + node_lo.id +  " " + node_ro.id])

              // 0x all
              dist_listStr = dist_listStr.concat(["dist " + node_mi.id + " " + node_center.id + " " + node_lo.id +  " " + node_ro.id])
            })
          })
        })
        
      })
      
      // return
      return beta_listStr.concat(dist_listStr)
    }
    
  },
  
  watch: {
    
    "dict1Auto": function() {
      // cannot move this to a vue.js computed
      // because it returns its value inside a promise
      if(!this.dict1Auto) return ""
      
      var self = this;
      var lambda_dict = this.dict1Auto
      
      // convert to dot
      try {
        var lambda_dot = lr.dict2dot_main(lambda_dict, this.extendedLabels)
      } catch (e) {
        // statements to handle any exceptions
        console.error(e);
        this.error1Msg = e;
        return
      }

      // convert to graph
      var viz = new Viz();
      viz.renderSVGElement(lambda_dot)
        .then(function(element) {
          /*
          // for responsive SVG https://stackoverflow.com/a/25978286
          element.preserveAspectRatio = "xMinYMin meet"
          element.viewBox = "0 0 600 400"
          element.classList.add("svg-content-responsive");
          element.setAttribute("height", "");
          element.setAttribute("width", "");

          console.log("svg element", element)
          */

          // return
          self.graph1Svg = element;
        })
        .catch(error => {
          // Create a new Viz instance (@see Caveats page for more info)
          viz = new Viz();
          self.error1Msg = error
          console.error(error);
        });
    },

    
    "dict2Auto": function() {
      // cannot move this to a vue.js computed
      // because it returns its value inside a promise
      
      if(!this.dict2Auto) return ""
      
      var self = this;
      var lambda_dict = this.dict2Auto
      
      // convert to dot
      try {
        var lambda_dot = lr.dict2dot_main(lambda_dict, this.extendedLabels)
      } catch (e) {
        // statements to handle any exceptions
        console.error(e);
        this.error2Msg = e;
        return
      }

      // convert to graph
      var viz = new Viz();
      viz.renderSVGElement(lambda_dot)
        .then(function(element) {
          self.graph2Svg = element;
        })
        .catch(error => {
          // Create a new Viz instance (@see Caveats page for more info)
          viz = new Viz();
          self.error2Msg = error
          console.error(error);
        });
    }
    
  }
})


/*
Vue.config.errorHandler = function (err, vm, info) {
  // handle error
  // `info` is a Vue-specific error info, e.g. which lifecycle hook
  // the error was found in. Only available in 2.2.0+
  console.log("vuejs error handler")
  console.log(info)
  console.error(err)
  app.error1Msg = err
}
*/