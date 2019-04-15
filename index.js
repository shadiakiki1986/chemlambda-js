////////////////////
// plot graph of input function from the HTML text box


var lr = new LambdaReader()
var lt = new LambdaTerms()




// set options of dropdown
// https://stackoverflow.com/a/9895164/4126114
var jsExamplesOpt = [
  {"title": "λu.x", "lambda": "λu.x", "javascript": "u=>x", "default": true},
  {"title": "λn.n(λu.x)", "lambda": "λn.n(λu.x)", "javascript": "n=> n (u=>x)"},
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

    "errorMsg": "",
    "graphOut": ""
  },
  
  methods: {
    pushJs: function() {
      this.jsAuto = this.jsExSelected.javascript;
      this.dict1Auto = this.dict1FromJsAuto
      this.dict2Auto = this.dict1Auto // without any re-writes
    },
    
    pushDot: function() {
      this.dict1Auto = this.dot1Manual
      this.dict2Auto = this.dict1Auto // without any re-writes
    },
    
    pushRw: function() {
      if(this.dotFrom=='lambda') {
        this.jsAuto = this.jsExSelected.javascript;
        this.dict1Auto = this.dict1FromJsAuto
      } else {
        this.dict1Auto = this.dot1Manual
      }
      // final step
      this.dict2Auto = this.dict2FromDict1Auto; // with re-writes
    },
    
    addRewrite: function() {
      var k = this.rwVal.length
      this.rwVal[k] = {
          "k": k,
          "type": this.rwNew.type,
          "n1": this.rwNew.n1,
          "n2": this.rwNew.n2
        }
      this.rwNew = {"type": "", "n1": "", "n2": ""}
    },
    
    rmRewrite: function(k) {
      // set null instead of delete to maintain key from length
      this.rwVal[k] = null
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
        this.errorMsg = e;
        return
      }
      
      //return lambda_dot;
      return lambda_dict; // return dict even if dot is available
      
    },
    
    
    "dict2FromDict1Auto": function() {
      // compute new graph from re-writes (rwVal)
      // FIXME should compute something like below dict2Auto
      return this.dict1Auto;
    }
    
  },
  
  watch: {
    
    "dict2Auto": function() {
      // cannot move this to a vue.js computed
      // because it returns its value inside a promise
      var lambda_dict = this.dict2Auto;
      
      // convert edges array to associative array
      var edges_keys = lambda_dict.edges.map(lr.edgeDict2dot);
      var edges_dict = createAssociativeArray(edges_keys, lambda_dict.edges)
      
      // pass dict through re-writes
      console.log("rewrites", this.rwVal)
      this.rwVal.forEach(rwi => {
        if(rwi == null) return
        
        switch(rwi.type) {
          case "beta":
            // e.g. beta L1 A1
            console.log("beta move", rwi)
            
            // get nodes
            var n1 = lambda_dict.nodes.filter(node => node.id==rwi.n1)
            var n2 = lambda_dict.nodes.filter(node => node.id==rwi.n2)
            
            // sanity checks
            if(n1.length==0) throw ("Node " + rwi.n1 + "not found")
            if(n2.length==0) throw ("Node " + rwi.n2 + "not found")
            if(n1.length >1) throw ("Node " + rwi.n1 + "found > 1")
            if(n2.length >1) throw ("Node " + rwi.n2 + "found > 1")

            // take first element of each array
            n1 = n1[0]
            n2 = n2[0]
            
            // check types
            if(n1.type!='L') throw ("1st node for beta is expected to have type L. Got: " + n1.type + "instead")
            if(n2.type!='A') throw ("2nd node for beta is expected to have type A. Got: " + n2.type + "instead")

            // identify edges
            var edge_L_in = Object.keys(edges_dict).filter(k => edges_dict[k].to.id==rwi.n1)[0] // there is supposed to be 1 such edge only
            var edge_A_out = Object.keys(edges_dict).filter(k => edges_dict[k].from.id==rwi.n2)[0] // there is supposed to be 1 such edge only
            var edge_A_in_notL = Object.keys(edges_dict).filter(k => (edges_dict[k].to.id==n2.id)&&(edges_dict[k].from.id!=n1.id))[0] // there is supposed to be 1 such edge only
            var edge_L_out_notA = Object.keys(edges_dict).filter(k => (edges_dict[k].from.id==n1.id)&&(edges_dict[k].to.id!=n2.id))[0] // there is supposed to be 1 such edge only
            
            // add edges
            [ {'from': edges_dict[edge_L_in].from, 
               'to': edges_dict[edge_A_out].to
              },
              {'from': edges_dict[edge_A_in_notL].from, 
               'to': edges_dict[edge_L_out_notA].to
              }
            ].forEach(e => {
              var k = lr.edgeDict2dot(e)
              edges_dict[k] = e
            })

            // delete edges
            [edge_L_in, edge_A_out, edge_A_in_notL, edge_L_out_notA].forEach(k => {
              delete edges_dict[k]
            })

            break;
          default:
            throw "Unsupported move " + rwi.type
        }
      })
      
      // convert edges dict back to array and store in main variable
      lambda_dict.edges = Object.keys(edges_dict).map(k => edges_dict[k])
      
      // convert to dot
      try {
        var lambda_dot = lr.dict2dot_main(lambda_dict)
        //console.log("lambda dot", lambda_dot)
      } catch (e) {
        // statements to handle any exceptions
        console.error(e);
        this.errorMsg = e;
        return
      }

      // convert to graph
      var viz = new Viz();
      var self= this;
      viz.renderSVGElement(lambda_dot)
        .then(function(element) {
          self.graphOut = element;
        })
        .catch(error => {
          // Create a new Viz instance (@see Caveats page for more info)
          viz = new Viz();
    
          // Possibly display the error
          console.error(error);
          
          self.graphOut = error;
        });
      
    }

  }
})