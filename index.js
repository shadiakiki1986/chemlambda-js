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
dist L3`
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
    
    "extendedLabels": true
  },
  
  methods: {
    resetInput: function() {
      this.error1Msg = ""
      this.error2Msg = ""
      this.inTitle=""
      this.inDescription=""
      this.inJavascript=""
      this.dot1From="lambda"
      this.jsAuto = ""
      this.dict1Auto = ""
      this.graph1Visible = true
      this.graph2Visible = false
      this.rwTxt = ""
      this.rwAuto = clone([])
      this.dict2Auto = "" // clone(this.dict1Auto) // without any re-writes
    },
    
    jsExOnChange: function() {
      this.resetInput()
      
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
      this.error1Msg = ""
      this.error2Msg = ""
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
      
      if(this.rwAuto.length==0) {
        // no re-writes
        return lambda_dict;
      }
      
      if(this.rwAuto.filter(x => x!=null).length == 0) {
        // no re-writes
        return lambda_dict;
      }
      
      // convert edges array to associative array
      var edges_keys = lambda_dict.edges.map(lr.edgeDict2dot);
      var edges_dict = createAssociativeArray(edges_keys, lambda_dict.edges)
      
      // pass dict through re-writes
      this.rwAuto.forEach(rwi => {
        if(rwi == null) return
        
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
            // e.g. dist L1

            try {
              // sanity check
              if(n2 != null) throw("Rewrite error: Move " + rwi.type + " only supports 1 node as input. Two were passed")
              
              // get node
              var n1 = lambda_dict.nodes.filter(node => node.id==rwi.n1)

              // sanity checks
              if(n1.length==0) throw ("Rewrite error: Node " + rwi.n1 + " not found")
              if(n1.length >1) throw ("Rewrite error: Node " + rwi.n1 + " found > 1")

              // take first element of each array
              n1 = n1[0]

              // check types
              if(n1.type!='L') throw ("Rewrite error: 1st node for beta is expected to have type L. Got '" + n1.type + "' instead")

              // identify edges
              var edges_labeled = {
                "L_in": Object.keys(edges_dict).filter(k => edges_dict[k].to.id==rwi.n1),
                "L_out_r": Object.keys(edges_dict).filter(k => (edges_dict[k].from.id==n1.id)&&(edges_dict[k].from.portname=="r")),
                "L_out_l": Object.keys(edges_dict).filter(k => (edges_dict[k].from.id==n1.id)&&(edges_dict[k].from.portname=="l"))
              }
              
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
                  var old_L_id = rwi.n1
                  var old_L_node = lambda_dict.nodes.filter(n => n.id==old_L_id)[0]
                  var new_L_id = lr.newNodeId("L")
                  var new_L_node = clone(old_L_node)
                  new_L_node.id = new_L_id
                  new_L_node.from = "dist " + rwi.n1
                  
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
                      'to': edges_dict[L_out_r].to
                    },
                    { 'from': new_L_r, 
                      'to': edges_dict[L_out_l].to
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
              edges_labeled[k1].map(k2 => {
                delete edges_dict[k2]
              })
            })

            break;
            
            
          default:
            throw "Unsupported move " + rwi.type
        }
      })
      
      // convert edges dict back to array and store in main variable
      lambda_dict.edges = Object.keys(edges_dict).map(k => edges_dict[k])
      
      // return
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
        var row = l.split(" ").filter(w => w.length > 0)
        if(row.length <= 1) return null // these are filtered out later
        
        var out = {
          'type': row[0],
          'n1': row[1],
          'n2': row.length >= 3 ? row[2] : null
        }
        return out
      }).filter(l => !!l)
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