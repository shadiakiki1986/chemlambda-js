////////////////////
// plot graph of input function from the HTML text box


var gid = new GlobalIdRegister() // shared between lambda reader and graph rewriter
var lr = new LambdaReader(gid)
var lt = new LambdaTerms()
var gr = new GraphRewriter(gid)
var gvd3 = new GraphVisualizerD3js()
var utils = new Utils()

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


  {"title":"identity(zero)==zero",
   "description": "Re-writes converting zero to zero via identity",
   "javascript": `_ => {

  var ID = xs => xs
  var expected = fe => xe => xe
  var zero = fa => xa => xa
  var actual = ID(zero)

  return _
}`,
      "rewrites": `beta L0 A0`
  },


  {"title":"constant(whatever)==constant",
   "description": "Re-writes converting anything to a constant via the constant function",
   "javascript": `_ => {

var constant = fa => xa
var whatever = fw => xw
var actual = constant(whatever)
return _
}`,
      "rewrites": `beta L0 A0`
  },


  {"title":"successor(zero)==one",
   "description": "Re-writes converting zero to one",
   "javascript": `_ => {
  var SUCC = ns => fs => xs => fs(ns(fs)(xs))
  var zero = f0 => x0 => x0
  var actual_one = SUCC(zero)
  var expected_one = fe => xe => fe(xe) // for comparison
  return _
}`,
      "rewrites": `beta L2 A3
beta L4 A0
beta L3 A1`
  },


  {"title":"successor(successor(zero))==two",
   "description": "Re-writes converting zero to two",
   "javascript": `_ => {
  var SUCC = ns => fs => xs => fs(ns(fs)(xs))
  var zero = f0 => x0 => x0
  var actual_two = SUCC(SUCC(zero))
  var expected_two = fe => xe => fe(fe(xe)) // for comparison
  return _
}`,
      "rewrites": `beta L2 A4
beta L4 A3
beta L3 A0`
  },


  {"title":"predecessor(one) == zero",
   "description": "PRED(one) == zero",
   "javascript": `_ => {
  // PRED := λn.λf.λx.n (λg.λh.h (g f)) (λu.x) (λu.u)
  var PRED = n => f1 => x1 => {
    var L4 = u1 => x1
    var L5 = u2 => u2
    var L6 = g => h => h(g(f1))
    return ((n(L6))(L4))(L5)
  }

  // one := λf.λx.(f x)
  var one = f2 => x2 => (f2(x2))
  var zero = fe => xe => xe

  // apply PRED to three
  var PRED1 = PRED(one)

  return _
}`,
      "rewrites": `beta L3 A0
beta L6 A6
beta L2 A1
beta L8 A2
beta L7 A5
beta L5 A3
beta L4 A4

# the below re-writes get the result "flipped"
#beta L2 A1
#beta L6 A2
#beta L3 A6
#beta L8 A0
#beta L0 A3
#beta L7 A5
#beta L1 A4`
  },


  {"title":"predecessor(three)",
   "description": "PRED(three)",
   "javascript": `_ => {
  // PRED := λn.λf.λx.n (λg.λh.h (g f)) (λu.x) (λu.u)
  var PRED = n => f1 => x1 => {
    var L4 = u1 => x1
    var L5 = u2 => u2
    var L6 = g => h => h(g(f1))
    return ((n(L6))(L4))(L5)
  }

  // three := λf.λx.f(f(f x))
  var three = f2 => x2 => f2(f2(f2(x2)))

  // apply PRED to three
  var PRED3 = PRED(three)

  return _
}`,
      "rewrites": `beta L6 A8
beta L8 A2

# either perform beta, or dist
# beta L7 A3
# dist all L3 all all
# dist L2  L3 all all
# dist L2  L3 A0  all
# dist L2  L3 A0  A7`
  }
];




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
    "dict2tmp": "", // graph data on which dict2Auto is based, but without plotting
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
    "suggestedRwMethod": "selected",
    "suggestedRwInProgress": false,
    //"dict2FromDict1Callback": false
    "suggestedRwHistory": [],
    "graphManager": "vizjs"

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
      this.rwAuto = utils.clone([])
      this.dict2tmp = ""
      this.dict2Auto = "" // utils.clone(this.dict1Auto) // without any re-writes
      lr.globalIdRegister = [] // to re-issue IDs
      this.suggestedRwStep = 0
      this.suggestedRwHistory = []
    },

    jsExOnChange: function() {
      this.resetInput()
      this.resetOutput()

      this.inTitle = this.jsExSelected.title
      this.inDescription = this.jsExSelected.description
      this.inJavascript = this.jsExSelected.javascript
      this.jsAuto = this.jsExSelected.javascript; // this was utils.clone() eventhough it was just text

      if("rewrites" in this.jsExSelected)  {
        this.rwTxt = this.jsExSelected.rewrites
      }

    },

    /*
    pushDot: function() {
      this.error1Msg = ""
      this.error2Msg = ""
      this.dict1Auto = utils.clone(this.dot1Manual)

      this.graph1Visible = true

      if("rewrites" in this.jsExSelected)  {
        this.rwTxt = this.jsExSelected.rewrites
      } else {
        this.rwTxt = ""
      }

      this.dict2Auto = "" // utils.clone(this.dict1Auto) // without any re-writes
    },
    */

    pushRw: function() {
      this.resetOutput()

      if(this.dot1From=='lambda') {
        this.jsAuto = this.inJavascript;
        this.dict1Auto = utils.clone(this.dict1FromJsAuto)
      } else {
        this.dict1Auto = utils.clone(this.dot1Manual) // FIXME shouldnt set dot to dict
      }

      this.rwAuto = utils.clone(this.rwVal)

      // final step
      try {
        this.dict2tmp = utils.clone(this.dict2FromDict1Auto); // with re-writes
        this.dict2Auto = utils.clone(this.dict2tmp) // here we can copy right away and plot
        this.graph1Visible = false
      } catch (e) {
        // statements to handle any exceptions
        console.error(e);
        this.error2Msg = e;
        return []
      }

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
      var rwCurTxt = ""
      switch(this.suggestedRwMethod) {
        case "selected":
          // just append to the re-writes the selected value
          rwCurTxt = this.suggestedRwSelected
          break
        case "random":
          // choose a random entry from the suggestions
          var idx = utils.randomIntFromInterval(0, this.suggestedRwAll.length-1)
          // append it
          rwCurTxt = this.suggestedRwAll[idx]
          break
        default:
          throw "Unsupported suggestion method " + this.suggestedRwMethod
      }


      /*
      method 0: ... wtf ...
      // now that we have a new entry in the re-writes, re-generate the graph
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
          self.dict2Auto = utils.clone(self.dict2FromDict1Auto);
          return
        }

        // recurse, without plotting yet
        self.suggestedRwAppend(till_none)
      }
      this.rwAuto = utils.clone(this.rwVal)
      */

      // method 1: complete re-calculation of initial graph + re-writes and graphing
      //this.rwTxt += '\n' + rwCurTxt
      //var tmp_step = this.suggestedRwStep
      //this.pushRw()
      //this.suggestedRwStep = tmp_step

      // method 2: calculate new graph based on current graph and re-writes
      this.suggestedRwHistory = this.suggestedRwHistory.concat([rwCurTxt])
      try {

        var rwCurVal = gr.txt2array(rwCurTxt)

        // apply rewrites
        // notice that this inputs dict2tmp and below updates it too
        var lambda_dict = gr.apply_rewrites(utils.clone(this.dict2tmp), rwCurVal)

        // update the dict2tmp and update the global register in "lr"
        this.dict2tmp = utils.clone(lambda_dict)

      } catch (e) {
        // statements to handle any exceptions
        console.error(e);
        this.error2Msg = e;
        return
      }

      if(till_none && this.suggestedRwAll.length > 0 && (this.suggestedRwStep % this.suggestedRwMax) != 0) {
        // recurse, after the previous plotting
        this.suggestedRwAppend(till_none)
      }

      this.suggestedRwInProgress = false

      this.dict2Auto = utils.clone(this.dict2tmp) // copy to graph

      // set visibility of graph after re-writes
      this.graph1Visible = false


    }

  },

  // https://vuejs.org/v2/guide/computed.html#Computed-vs-Watched-Property
  computed: {

    "dot1Auto": function() {
      if(!this.dict1Auto) return ""

      try {
        return lr.dict2dot_main(this.dict1Auto, this.extendedLabels) // dot file before re-writes
      } catch (e) {
        // statements to handle any exceptions
        console.error(e);
        this.error1Msg = e;
        return
      }
    },

    "dot2Auto": function() {
      if(!this.dict2Auto) return ""

      try {
        return lr.dict2dot_main(this.dict2Auto, this.extendedLabels) // dot file after re-writes
      } catch (e) {
        // statements to handle any exceptions
        console.error(e);
        this.error2Msg = e;
        return
      }

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
      return gr.apply_rewrites(utils.clone(this.dict1Auto), this.rwAuto)
    },


    "rwVal": function() {
      return gr.txt2array(this.rwTxt)
    },


    "suggestedRwAll": function() {
      // Note that this is tied to dict2tmp and not dict2FromDict1Auto and not dict2Auto
      // This allows me to perform single-step rewrites while updating dict2tmp without drawing the graph
      // in the `suggestedRwAppend()` function

      if(!this.dict2tmp) return []

      // filter for edges between L and A, and suggest beta moves on them
      var beta_listStr = []
      this.dict2tmp.edges.forEach(e1 => {
        // if not L-A, ignore
        if(!(e1.from.type=="L" && e1.to.type=="A")) return

        // if L has no input, ignore
        var L_in = this.dict2tmp.edges.filter(e2 => e2.to.id == e1.from.id)
        if(L_in.length == 0) return

        // if A has no output, ignore
        var A_out = this.dict2tmp.edges.filter(e2 => e2.from.id == e1.to.id)
        if(A_out.length == 0) return

        // append
        beta_listStr = beta_listStr.concat(["beta " + e1.from.id + " " + e1.to.id])
      })

      // filter for L nodes that have a fan-in or fan-out
      var dist_listStr = []
      var self = this
      this.dict2tmp.nodes.forEach(node_center => {
        if(node_center.type != 'L') return
        var edges_mi = self.dict2tmp.edges.filter(edge => edge.to.id == node_center.id)
        var edges_lo = self.dict2tmp.edges.filter(edge => edge.from.id == node_center.id && edge.from.portname=="l")
        var edges_ro = self.dict2tmp.edges.filter(edge => edge.from.id == node_center.id && edge.from.portname=="r")

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

  }
  /*
  no longer using watch here because it should actually watch 2 variables
  Check below
  watch: {
    "dot1Auto": ,
    "dot2Auto":
  }
  */
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


// wrapper function for plotting
function doplot(plotTarget, self) {
      // cannot move this to a vue.js computed
      // because it returns its value inside a promise

      var dotIn = plotTarget==1 ? self.dot1Auto : self.dot2Auto

      if(!dotIn) return

      var dictIn = plotTarget==1 ? self.dict1Auto : self.dict2Auto

      switch(self.graphManager) {
        case "vizjs":
          // convert to graph
          var viz = new Viz();
          viz.renderSVGElement(dotIn)
            .then(function(element) {
              if(plotTarget==1) {
                self.graph1Svg = element;
              } else {
                self.graph2Svg = element;
              }
            })
            .catch(error => {
              // Create a new Viz instance (@see Caveats page for more info)
              viz = new Viz();
              if(plotTarget==1) {
                self.error1Msg = error
              } else {
                self.error2Msg = error
              }
              console.error(error);
            });
          break

        case "d3js":
          var svgElem = gvd3.renderSVGElement(dictIn, self.extendedLabels)
          var div = document.getElementById(plotTarget==1 ? 'graph1Cont' : 'graph2Cont');
          // this div is sometimes missing due to the envelope v-if in the html
          if(!!div) {
            div.innerHTML = "";
            div.appendChild(svgElem);
          }

          break

        default:
          var e = "Unsupported graph visualization manager"
          // throw e
          if(plotTarget==1) {
            self.error1Msg = error
          } else {
            self.error2Msg = error
          }
          console.error(error);

      }
    }



// execute a function if both dot1Auto and graphManager change
// https://github.com/vuejs/vue/issues/844
app.$watch(
    (vm) => (vm.dot1Auto, vm.graphManager, Object(new Date())),
    function() { doplot(1, this) }
)


app.$watch(
    (vm) => (vm.dot2Auto, vm.graphManager, Object(new Date())),
    function() { doplot(2, this) }
)
