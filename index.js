////////////////////
// plot graph of input function from the HTML text box


var lr = new LambdaReader()
var lt = new LambdaTerms()
var gr = new GraphRewriter()


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
    "suggestedRwInProgress": false
    //"dict2FromDict1Callback": false
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
      this.suggestedRwInProgress = true
      
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
      
      this.suggestedRwInProgress = false
      

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

      var lambda_dict = clone(this.dict1Auto)
      
      try {
        lambda_dict = gr.apply_rewrites(lambda_dict, this.rwAuto)
      } catch (e) {
        // statements to handle any exceptions
        console.error(e);
        this.error2Msg = e;
        return
      }
      
      // return
      //if(this.dict2FromDict1Callback) setTimeout(this.dict2FromDict1Callback, 1)
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
        // dist_listStr = dist_listStr.concat(["dist all " + node_center.id + " all all"])
        
        // now, spell out the nodes
        edges_mi.forEach(edge_mi => {
          node_mi = edge_mi.from
          if(node_mi.type != 'L' && node_mi.type != 'A') return
          
          // 2x all
          // dist_listStr = dist_listStr.concat(["dist " + node_mi.id + " " + node_center.id + " all all"])
          
          edges_lo.forEach(edge_lo => {
            node_lo = edge_lo.to
            if(node_lo.type != 'L' && node_lo.type != 'A') return
            
            // 2x all
            // dist_listStr = dist_listStr.concat(["dist all " + node_center.id + " " + node_lo.id +  " all"])
            // 1x all
            // dist_listStr = dist_listStr.concat(["dist " + node_mi.id + " " + node_center.id + " " + node_lo.id +  " all"])
            
            edges_ro.forEach(edge_ro => {
              node_ro = edge_ro.to
              if(node_ro.type != 'L' && node_ro.type != 'A') return
              
              // 2x all
              // dist_listStr = dist_listStr.concat(["dist all " + node_center.id + " all " + node_ro.id + ""])
              
              // 1x all
              // dist_listStr = dist_listStr.concat(["dist " + node_mi.id + " " + node_center.id + " all " + node_ro.id])

              // 1x all
              // dist_listStr = dist_listStr.concat(["dist all " + node_center.id + " " + node_lo.id +  " " + node_ro.id])

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