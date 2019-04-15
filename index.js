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



var app = new Vue({
  el: '#app',
  data: {
    "dotFrom": "lambda",
    "rwFrom": "none",

    "jsExamplesOpt": jsExamplesOpt,
    "jsExSelected": jsExamplesOpt[0],
    "dot1Manual": "",
    "rwVal": "",

    "jsAuto": "",
    "dot1Auto": "",
    "dot2Auto": "",
    
    "graphOut": ""
  },
  
  methods: {
    pushJs: function() {
      this.jsAuto = this.jsExSelected.javascript;
      this.dot1Auto = this.dot1FromJsAuto
      this.dot2Auto = this.dot1Auto // without any re-writes
    },
    
    pushDot: function() {
      this.dot1Auto = this.dot1Manual
      this.dot2Auto = this.dot1Auto // without any re-writes
    },
    
    pushRw: function() {
      if(this.dotFrom=='lambda') {
        this.jsAuto = this.jsExSelected.javascript;
        this.dot1Auto = this.dot1FromJsAuto
      } else {
        this.dot1Auto = this.dot1Manual
      }
      // final step
      this.dot2Auto = this.dot2FromDot1Auto; // with re-writes
    }
    
  },
  
  // https://vuejs.org/v2/guide/computed.html#Computed-vs-Watched-Property
  computed: {
    
    "dot1FromJsAuto": function () {

      if(this.jsAuto == "") {
        return ""
      }
      
      var dot_in = this.jsAuto;
      //dot_in = 'digraph { a -> b }' // for testing
      //dot_in = pred_arrow_dot // for testing
      
      try {
        dot_in = eval(dot_in);
        var lambda_dict = lr.jsjson2dict(esprima.parse(dot_in.toString()));
        console.log("lambda dict", lambda_dict)
        var lambda_dot = lr.dict2dot_main(lambda_dict)
        console.log("lambda dot", lambda_dot)
      }
      catch (e) {
        // statements to handle any exceptions
        document.getElementById("graph_out").innerHTML = e;
        return
      }
      
      return lambda_dot;
      //document.getElementById("dot_out").innerHTML = lambda_dot;
      //dotChange()
    },
    
    
    "dot2FromDot1Auto": function() {
      // compute new graph from re-writes (rwVal)
      // FIXME should compute something
      return this.dot1Auto;
    }
    
  },
  
  watch: {
    
    "dot2Auto": function() {
      // cannot move this to a vue.js computed
      // because it returns its value inside a promise
      
      // convert to graph
      var lambda_dot = this.dot2Auto;

      var viz = new Viz();
      var self= this;
      viz.renderSVGElement(lambda_dot)
        .then(function(element) {
          //document.getElementById("graph_out").innerHTML = "";
          //document.getElementById("graph_out").appendChild(element);
          //console.log("graphout", element.innerHTML)
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