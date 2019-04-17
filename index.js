////////////////////
// plot graph of input function from the HTML text box


var lr = new LambdaReader()
var lt = new LambdaTerms()




// set options of dropdown
// https://stackoverflow.com/a/9895164/4126114
var jsExamplesOpt = [
  {"title": "λu.x", "lambda": "λu.x", "javascript": "u=>x", "default": true},
  {"title": "λn.n(λu.x)", "lambda": "λn.n(λu.x)", "javascript": "n=> n (u=>x)"},
  {"title": "λf.λx.x(y)", "lambda": "λf.λx.x(y)", "javascript": "f => x => x(y)"},
  
  {"title": "three",
   "lambda": "three := λf.λx.f(f(f x))",
   "javascript": "f => x => f(f(f(x)))"
  },
  {"title": "predecessor",
   "lambda": "PRED := λn.λf.λx.n (λg.λh.h (g f)) (λu.x) (λu.u)",
   "javascript": `n => f => x => {
        var L4 = u1 => x
        var L5 = u2 => u2 // notice that this is u2 (versus u1 above) instead of plain "u"
        var L6 = g => h => h(g(f))
        return ((n(L6))(L4))(L5)
      }`
  },
  {"title":"predecessor(three)",
   "lambda": "PRED(three)", 
   "javascript": `PRED3 => {
      
        var PRED = n => f1 => x1 => {
          var L4 = u1 => x1
          var L5 = u2 => u2
          var L6 = g => h => h(g(f1))
          return ((n(L6))(L4))(L5)
        }
      
        var three = f2 => x2 => f2(f2(f2(x2)))
      
        return PRED(three)
      }`
  },
  {"title": "other", "lambda": "other", "javascript": ""}
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
    "dotFrom": "lambda",
    "rwFrom": "none",

    "jsExamplesOpt": jsExamplesOpt,
    "jsExSelected": jsExamplesOpt[0],
    
    "dot1Manual": "",
    "rwNew": {"type": "", "n1": "", "n2": ""},
    "rwVal": [],

    "jsAuto": "",
    "dict1Auto": "",
    "dict2Auto": "",

    "error1Msg": "",
    "error2Msg": "",
    
    "graph1Svg": "",
    "graph2Svg": "",
    
    "jsExVisible": false,
    "dot1Visible": false,
    "dot2Visible": false,
    "graph1Visible": true
  },
  
  methods: {
    pushJs: function() {
      this.error1Msg = ""
      this.error2Msg = ""
      this.jsAuto = clone(this.jsExSelected.javascript);
      this.dict1Auto = clone(this.dict1FromJsAuto)
      this.dict2Auto = "" // clone(this.dict1Auto) // without any re-writes
      this.graph1Visible = true
      this.graph2Visible = false
    },
    
    pushDot: function() {
      this.error1Msg = ""
      this.error2Msg = ""
      this.dict1Auto = clone(this.dot1Manual)
      this.dict2Auto = "" // clone(this.dict1Auto) // without any re-writes
      this.graph1Visible = true
      this.graph2Visible = false
    },
    
    pushRw: function() {
      this.error1Msg = ""
      this.error2Msg = ""
      if(this.dotFrom=='lambda') {
        this.jsAuto = clone(this.jsExSelected.javascript);
        this.dict1Auto = clone(this.dict1FromJsAuto)
      } else {
        this.dict1Auto = clone(this.dot1Manual)
      }
      // final step
      this.dict2Auto = clone(this.dict2FromDict1Auto); // with re-writes
      this.graph1Visible = false
      this.graph2Visible = true
    },
    
    addRewrite: function() {
      var k = this.rwVal.length
      // https://vuejs.org/v2/guide/list.html#Caveats
      this.rwVal.push({
          "k": k,
          "type": this.rwNew.type,
          "n1": this.rwNew.n1,
          "n2": this.rwNew.n2
        })
      this.rwNew = {"type": "", "n1": "", "n2": ""}
    },
    
    rmRewrite: function(k) {
      // set null instead of delete to maintain key from length

      // https://vuejs.org/v2/guide/list.html#Caveats
      // this.rwVal[k] = null
      Vue.set(this.rwVal, k, null)
    },
    
    dict2graph: function(lambda_dict) {

      // convert to dot
      try {
        
        var lambda_dot = lr.dict2dot_main(lambda_dict)
        //console.log("lambda dot", lambda_dot)
      } catch (e) {
        // statements to handle any exceptions
        console.error(e);
        this.error1Msg = e;
        return
      }

      // convert to graph
      var viz = new Viz();
      return viz.renderSVGElement(lambda_dot);

    }
    
  },
  
  // https://vuejs.org/v2/guide/computed.html#Computed-vs-Watched-Property
  computed: {
    
    "dot1Auto": function() {
      if(!this.dict1Auto) return ""
      return lr.dict2dot_main(this.dict1Auto) // dot file before re-writes
    },
    
    "dot2Auto": function() {
      if(!this.dict2Auto) return ""
      return lr.dict2dot_main(this.dict2Auto) // dot file after re-writes
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
      // compute new graph from re-writes (rwVal)
      console.log("re-calculuate dict2fromdict1auto", this.rwVal)

      // init
      var lambda_dict = clone(this.dict1Auto)
      
      if(this.rwFrom=='none') {
        // no re-writes
        return lambda_dict;
      }
      
      if(this.rwVal.filter(x => x!=null).length == 0) {
        // no re-writes
        return lambda_dict;
      }
      
      console.log("there are rewrites")
      
      
      // convert edges array to associative array
      var edges_keys = lambda_dict.edges.map(lr.edgeDict2dot);
      var edges_dict = createAssociativeArray(edges_keys, lambda_dict.edges)
      
      // pass dict through re-writes
      console.log("dict2auto, rewrites", this.rwVal)
      this.rwVal.forEach(rwi => {
        if(rwi == null) return
        
        switch(rwi.type) {
          case "beta":
            // e.g. beta L1 A1
            console.log("beta move", rwi)
            
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
              
              // there is supposed to be 1 such edge of each above
              Object.keys(edges_labeled).forEach(k => {
                if(edges_labeled[k].length == 0) throw "Failed to identify edge " + k + ". Found none"
                if(edges_labeled[k].length  > 1) {
                  console.error("edges > 1. Details: ", edges_labeled[k])
                  throw "Failed to identify edge " + k + ". Found > 1"
                }
                
                edges_labeled[k] = edges_labeled[k][0]
              })
            } catch (e) {
              this.error2Msg = e
              console.error(e)
              return
            }
            
            // add edges
            [ {'from': edges_dict[edges_labeled["L_in"]].from, 
               'to': edges_dict[edges_labeled["A_out"]].to
              },
              {'from': edges_dict[edges_labeled["A_in_notL"]].from, 
               'to': edges_dict[edges_labeled["L_out_notA"]].to
              }
            ].forEach(e => {
              var k = lr.edgeDict2dot(e)
              edges_dict[k] = e
            })

            // delete edges
            Object.keys(edges_labeled).forEach(k1 => {
              var k2 = edges_labeled[k1]
              delete edges_dict[k2]
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
        var lambda_dot = lr.dict2dot_main(lambda_dict)
        //console.log("lambda dot", lambda_dot)
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
        var lambda_dot = lr.dict2dot_main(lambda_dict)
        //console.log("lambda dot", lambda_dot)
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