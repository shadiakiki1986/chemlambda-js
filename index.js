// https://medium.com/functional-javascript/lambda-calculus-in-javascript-part-1-28ff63824d4d
// https://en.wikipedia.org/wiki/Lambda_calculus#Logic_and_predicates
//
// related
// https://stackoverflow.com/questions/10182387/how-to-generate-call-graphs-for-given-javascript
// https://github.com/cheburakshu/Javascript-Explorer-Callgraph
//
// for rendering graphviz in the browser
// https://github.com/dagrejs/dagre/  which replaces vis.js
//---------------------
// Define a few lambda calculus terms using javascript (arrow notation or function notation)

//     TRUE := λx.λy.x
var lc_true = x => (y => x)

// FALSE := λx.λy.y 
/*
Using function declaration
function bla(x) {
  function foo(y) {
    return y;
  }
}
*/
var lc_false = x => (y => y)

//     AND := λp.λq.p q p
var lc_and = p => (q => (p(q))(p))


//     AND := λp.λq.p q p
var lc_and2 = function(p) {
  var o1 = function(q) {
    var o2 = p(q)
    return o2(p)
  }
  return o1
}


// PRED := λn.λf.λx.n (λg.λh.h (g f)) (λu.x) (λu.u)
var PRED = function L1(n) {
  return function L2(f) {
    return function L3(x) {
      var L4 = function(u1) {
        return x
      }
      var L5 = function(u2) {
        return u2
      }
      var L6 = function(g) {
        var L7 = function(h) {
          return h(g(f))
        }
        return L7
      }
      return ((n(L6))(L4))(L5)
    }
  }
}
// re-implementation with arrow notation
var PRED_arrow = n => f => x => {
  var L4 = u1 => x
  var L5 = u2 => u2
  var L6 = g => h => h(g(f))
  return ((n(L6))(L4))(L5)
}

var n0 = (f => x => x) // 0 := λf.λx.x
var n1 = (f => x => f(x)) // 1 := λf.λx.f x
var n2 = (f => x => f(f(x))) // 2 := λf.λx.f (f x)
var n3 = (f => x => f(f(f(x)))) // 3 := λf.λx.f (f (f x))

// test the functions
console.assert(lc_and(lc_true)(lc_false) === lc_false) // returns TRUE in javascript!
console.assert(lc_and(lc_true)(lc_true) === lc_true) // returns TRUE in javascript!

console.assert(lc_and2(lc_true)(lc_false) === lc_false) // returns TRUE in javascript!
console.assert(lc_and2(lc_true)(lc_true) === lc_true) // returns TRUE in javascript!

// for arithmetic, the equality doesn't work without "to_int" below which converts from lambda calculus to javascript integers
var to_int = n => (n(x => x + 1))(0) // http://vanderwijk.info/blog/pure-lambda-calculus-python/
console.assert(to_int(n3) == 3, "to_int(n3)==3 failed")
console.assert(to_int(PRED(n3)) == 2, "to_int(PRED(n3))==2 failed")
console.assert(to_int(PRED_arrow(n3)) == 2, "to_int(PRED_arrow(n3))==2 failed")
//console.assert(PRED(n1) == n0, "PRED(n1) == n0 failed") // same problem as with python, since different function evaluations are happening!

/////////////////////////////
/////////////////////////////
/////////////////////////////

// utility function to gather key-value pairs of "variables"
function var2dict(json_in, vardict1) {

  // prepare variables dict
  var vardict2 = json_in.body.filter(b => (b.type == "VariableDeclaration"))
  vardict2 = vardict2.map(b => {
    var k = b.declarations[0].id.name
    var v = jsjson2lambda(b.declarations[0].init, vardict1)
    return {
      "k": k,
      "v": v
    }
  })
  var vardict3 = vardict2.reduce(function(total, current) {
    total[current.k] = current.v;
    return total;
  }, {});

  // merge vardict1 and vardict3
  // https://stackoverflow.com/a/43449825/4126114
  if (vardict1 != undefined) {

    vardict3 = [vardict1, vardict3].reduce(function(r, o) {
      Object.keys(o).forEach(function(k) {
        r[k] = o[k];
      });
      return r;
    }, {});

  }

  return vardict3
}

/////////////////
// recursive function that can convert esprimajs json output to a string of lambda calculus
// more libraries at https://stackoverflow.com/questions/2554519/javascript-parser-in-javascript
// http://esprima.org/
//
// PS: was using pegjs, but it turned out to be super slow on PRED
// https://pegjs.org/online
// https://github.com/pegjs/pegjs/blob/master/examples/javascript.pegjs
// https://raw.githubusercontent.com/pegjs/pegjs/master/examples/javascript.pegjs
// https://cdn.jsdelivr.net/gh/pegjs/pegjs/examples/javascript.pegjs
function jsjson2lambda(json_in, vardict1, paramname) {
  var out = ""
  //var i = json_in // .body[0]
  //console.log("convert", json_in, vardict1)
  switch (json_in.type) {
    case "Program":
      return jsjson2lambda(json_in.body[0], vardict1)

    case "FunctionExpression": // peg.js
    case "FunctionDeclaration": // esprima
      var result = jsjson2lambda(json_in.body, vardict1)
      return "λ" + json_in.params[0].name + "." + result + ""

    case "BlockStatement":
      var vardict3 = var2dict(json_in, vardict1)
      //console.log("vardict3", vardict3)
      var retStmtDict = json_in.body.filter(b => (b.type == "ReturnStatement"))
      if (retStmtDict.length == 0) throw "Missing return statement from block"
      retStmtDict = retStmtDict[0]
      retStmtStr = jsjson2lambda(retStmtDict, vardict3)
      return retStmtStr

    case "ArrowFunctionExpression":
      return "λ" + json_in.params[0].name + "." + jsjson2lambda(json_in.body, vardict1, json_in.params[0].name)

    case "ReturnStatement":
      return jsjson2lambda(json_in.argument, vardict1)

    case "Identifier":
      if (vardict1 != undefined) {
        if (json_in.name in vardict1) {
          return vardict1[json_in.name]
        }
      }
      return json_in.name

    case "CallExpression":
      return "(" + jsjson2lambda(json_in.callee, vardict1) + " " + jsjson2lambda(json_in.arguments[0], vardict1) + ")"

    case "ExpressionStatement":
      return jsjson2lambda(json_in.expression, vardict1)

    case "VariableDeclaration":
      //  return "var " + json_in.declarations[0].id.name + " = ..."
      throw "Should not get " + json_in.type + " because theyre filtered in FunctionExpression"

    default:
      console.log(json_in)
      throw "Unsupported type1: " + json_in.type
  }
}

////////////////////////////////////////
// unit test the converter functions above
console.log("Unit tests jsjson2lambda: Start")

// fixtures
// PRED := λn.λf.λx.n (λg.λh.h (g f)) (λu.x) (λu.u)
var pred_string = 'λn.λf.λx.(((n λg.λh.(h (g f))) λu1.x) λu2.u2)'
test_data = [
  // simple function tests
  {
    'f': a => b,
    'e': 'λa.b'
  },
  {
    'f': a => {
      return b
    },
    'e': 'λa.b'
  },
  {
    'f': function foo(a) {
      return b
    },
    'e': 'λa.b'
  },
  {
  	'f': n=> n (u=>x),
    'e': 'λn.(n λu.x)'
  },

  // lambda calculus tests
  {
    'f': lc_true,
    'e': 'λx.λy.x'
  }, // TRUE := λx.λy.x
  {
    'f': lc_false,
    'e': 'λx.λy.y'
  }, // FALSE := λx.λy.y
  {
    'f': lc_and,
    'e': 'λp.λq.((p q) p)'
  }, // AND := λp.λq.p q p
  {
    'f': PRED,
    'e': pred_string
  },
  {
    'f': PRED_arrow,
    'e': pred_string
  }
]
test_data.forEach(x => {
  //console.log("testing", x.f.toString(), x.f)
  console.assert(
    jsjson2lambda(esprima.parse(x.f)) == x.e,
    "test failed for " + x.f.toString() + `
    ` + jsjson2lambda(esprima.parse(x.f)) + ' != ' + x.e
  )
})
console.log("Unit tests jsjson2lambda: End")
console.log("(successful if no errors shown in console)")


//------------------------------------------------------------
// utility function to get a new ID for a node
function newNodeId(nodetype, allIds) {
  // skip allIds to imply it from o_dict
  allIds = allIds.filter(x => x.startsWith(nodetype))
  newId = nodetype + '0'
  MAXNUM = 100 // circuit breaker
  for (var i = 0;
    (i < MAXNUM) && (allIds.indexOf(newId) != -1); i++) {
    newId = '' + nodetype + i;
  }
  return newId
}

// unit test
console.log('unit test: newNodeId: start')
test_allIds = ['L0', 'L1', 'A0']
console.assert(newNodeId('L', test_allIds) == 'L2')
console.assert(newNodeId('A', test_allIds) == 'A1')
console.log('unit test: newNodeId: end')
console.log("(successful if no errors shown in console)")

//------------------------------------------------------------
// similar to jsjson2lambda but for outputting mol file
var globalIdRegister = [] // global list of IDs
function jsjson2dict(json_in, vardict1, paramname) {
  var out = []
  if (vardict1 == undefined) {
    // first call should be with "Program"
    if (json_in.type != "Program") throw "Should be a program"
    // first call should also clear the ID register
    globalIdRegister = []
  }

  if (vardict1 == undefined) vardict1 = {}
  if (paramname == undefined) paramname = undefined // FIXME should use `null` isntead of `undefined`

  //var i = json_in // .body[0]
  //console.log("convert", json_in.type, json_in)
  switch (json_in.type) {
    case "Program":
      var o_dict = jsjson2dict(json_in.body[0], vardict1)
      return o_dict

    case "FunctionExpression": // peg.js
    case "FunctionDeclaration": // esprima
      // return jsjson2dict(json_in.body, vardict1, json_in.params[0].name)
      
      var bodyLambdaDict = jsjson2dict(json_in.body, vardict1, json_in.params[0].name)
      // result = result[0] // keeping it as array below for compliance
      envelopeLambdaStr = jsjson2lambda(json_in) // , vardict3, paramname)
      bodyLambdaStr = jsjson2lambda(json_in.body)
      
      var li1 = (json_in.id != null ? json_in.id.name : newNodeId("L", globalIdRegister))
      globalIdRegister = globalIdRegister.concat(li1)

      var envelopeLambdaDict = {
        "type": "L",
        "id": li1,
        "l": json_in.params[0].name,
        "m": bodyLambdaStr,
        "r": envelopeLambdaStr,
        "from": json_in.type
      }

      return bodyLambdaDict.concat([envelopeLambdaDict])

    case "BlockStatement":
      //o2a1 = json_in.body.filter(b => (b.type == "VariableDeclaration")).map(b => jsjson2dict(b)).reduce((a, b) => a.concat(b), [])

      // prepare variables dict key-value pairs
      var vardict3 = var2dict(json_in, vardict1)

      // body dict
      o2a1a = json_in.body.map(b => jsjson2dict(b, vardict3))
      o2a1a = o2a1a.reduce((a, b) => a.concat(b), [])

      // convert non-variables to dict, while passing the variables' dict
      //o2a1b = json_in.body.filter(b => (b.type != "VariableDeclaration")).map(b => jsjson2dict(b, vardict3)) // notice passing vardict arg
      //o2a1b = json_in.body.map(b => jsjson2dict(b, vardict3)) // notice passing vardict arg
      //o2a1b = o2a1b.reduce((a, b) => a.concat(b), [])

      //retStmtDict = json_in.body.filter(b => (b.type == "ReturnStatement"))
      //if (retStmtDict.length == 0) throw "Block missing return statement!"
      //retStmtDict = retStmtDict[0] // take 1st

      //retStmtLambdaStr = jsjson2lambda(retStmtDict, vardict3)
      //envelopeLambdaStr = jsjson2lambda(json_in, vardict3, paramname)

      //var li1 = (json_in.id != null ? json_in.id.name : newNodeId("L", globalIdRegister))
      //globalIdRegister = globalIdRegister.concat(li1)

      // FIXME
      // Check if `li1` is unique otherwsise issue a new one
      // similar to `li2` below

/*
      //var o11 = li1 + " " + '[label="<lo> ' + lv1 + ' |{<mi> '+ o2b1 + '|' + li1 + '} | <ro> λ' + lv1 + '.'+ o2b1 + '"];'
      var o11 = {
        "type": "L",
        "id": li1,
        "l": paramname,
        "m": retStmtLambdaStr,
        "r": envelopeLambdaStr,
        "from": json_in.type
      }*/

      //return o2a1a.concat(o2a1b.concat([o11]))
      //return o2a1b.concat([o11])
      //return o2a1b
      //return [o11]
      return o2a1a

    case "ArrowFunctionExpression":
      var bodyDict = jsjson2dict(json_in.body, vardict1, json_in.params[0].name)
      var bodyStr = jsjson2lambda(json_in.body, vardict1, json_in.params[0].name)
      var envStr = jsjson2lambda(json_in, vardict1, json_in.params[0].name)
      var li2 = (json_in.id != null ? json_in.id.name : newNodeId("L", globalIdRegister))
      globalIdRegister = globalIdRegister.concat(li2)

      //var o12 = li2 + " " + '[label="<lo> ' + paramname + ' |{<mi> '+ o2b2 + '|' + li2 + '} | <ro> λ' + paramname + '.'+ o2b2 + '"];'
      var o12 = {
        "type": "L",
        "id": li2,
        "l": json_in.params[0].name,
        "m": bodyStr,
        "r": envStr,
        "from": json_in.type
      }
      return bodyDict.concat([o12])

    case "ReturnStatement":
    /*
      console.log(
        "return statement: in/out: ",
        json_in,
        jsjson2dict(json_in.argument, vardict1)
      )*/
      return jsjson2dict(json_in.argument, vardict1)

    case "Identifier":
      return []
      //return [{"type": "Identifier", "k": json_in.name}]

    case "CallExpression":
      // var o1a = (  json_in.callee.type=="Identifier" ? json_in.callee.name : jsjson2dict(json_in.callee, vardict1)  )
      var o00 = jsjson2dict(json_in.callee, vardict1)
      var o1a = jsjson2lambda(json_in, vardict1)
      var o1b = jsjson2lambda(json_in.callee, vardict1)

      // replace variable name with value
      var arg_l = jsjson2lambda(json_in.arguments[0], vardict1)
      var arg_d = jsjson2dict(json_in.arguments[0], vardict1)
      
      // Even though this is the only place for variable replacement,
      // I'm commenting it out since it doesn't seem to fit
      //if (vardict1 != undefined) {
      //  if (json_in.arguments[0].name in vardict1) {
      //    argv = vardict1[json_in.arguments[0].name]
      //  }
      //}

      var nodeId = newNodeId("A", globalIdRegister)
      globalIdRegister = globalIdRegister.concat(nodeId)

      return o00.concat(arg_d).concat([{
        "type": "A",
        "id": nodeId,
        "r": arg_l,
        "m": o1a,
        "l": o1b,
        "from": json_in.type
      }])

    case "ExpressionStatement":
      return jsjson2dict(json_in.expression, vardict1)

    case "VariableDeclaration":
      //throw "Should not get " + json_in.type + " because theyre filtered in FunctionExpression"
      //console.log("var ...")
      //console.log(json_in)
      //return [json_in.declarations[0].id.name]
      //return []

      var o1 = jsjson2dict(json_in.declarations[0].init, vardict1)
      //console.log("variable dec", json_in, o1)
      /*
      var o2 = [{
        "type": "var",
        "id": json_in.declarations[0].id.name,
        "v": jsjson2lambda(json_in.declarations[0].init, vardict1)
      }]
      return o1.concat(o2)
      */
      return o1

    default:
      console.log(json_in)
      throw "Unsupported type1: " + json_in.type
  }
}


////////////////////////////////////////
// unit test the converter functions above
console.log("Unit tests jsjson2dict: Start")

// fixtures
// PRED := λn.λf.λx.n (λg.λh.h (g f)) (λu.x) (λu.u)
var pred_string = 'λn.λf.λx.(((n λg.λh.(h (g f))) λu1.x) λu2.u2)'
test_data = [
  // simple function tests
  {
    'f': u=>x,
    'e': [
        {
          "type": "L",
          "id": "L0",
          "l": "u",
          "m": "x",
          "r": "λu.x",
          "from": "ArrowFunctionExpression"
        }
      ]
  },
  {
  	'f': n=> n (u=>x),
    'e': [
        {
          "type": "L",
          "id": "L0",
          "l": "u",
          "m": "x",
          "r": "λu.x",
          "from": "ArrowFunctionExpression"
        },
        {
          "type": "A",
          "id": "A0",
          "r": "λu.x",
          "m": "(n λu.x)",
          "l": "n",
          "from": "CallExpression"
        },
        {
          "type": "L",
          "id": "L1",
          "l": "n",
          "m": "(n λu.x)",
          "r": "λn.(n λu.x)",
          "from": "ArrowFunctionExpression"
        }
      ]
  }
]
test_data.forEach(x => {
  //console.log("testing", x.f.toString(), x.f)
  var actual = jsjson2dict(esprima.parse(x.f))
  actual = JSON.stringify(actual)
  expected = JSON.stringify(x.e)
  console.assert(
     actual == expected,
    "test failed for " + x.f.toString() + `
    ` + actual + ' != ' + expected
  )
})
console.log("Unit tests jsjson2dict: End")
console.log("(successful if no errors shown in console)")

//------------------------------------------------------------

// utility function to convert dict to dot file row, nodes section
function dict2dot_nodes(row) {
  switch (row.type) {
    case "L":
      return (row.id + ' [label="<lo> ' +
        row.l + ' | { <mi> ' +
        row.m + ' | ' +
        row.id + '} | <ro> ' +
        row.r + '"];')
    case "A":
      return (row.id + ' [label="<li> ' +
        row.l + ' | { ' +
        row.id + ' | <mo> ' +
        row.m + '} | <ri> ' +
        row.r + '"];')
    default:
      throw "Unsupported row type " + row.type
  }
}


// utility function to convert dict to dot file row, edges section
function dict2dot_edges(json_out) {
  gather = {}
  json_out.forEach(row => {
    if (!(row.l in gather)) gather[row.l] = []
    if (!(row.m in gather)) gather[row.m] = []
    if (!(row.r in gather)) gather[row.r] = []

    gather[row.l] = gather[row.l].concat([row.id + ':' + (row.type == "L" ? 'lo' : 'li')])
    gather[row.m] = gather[row.m].concat([row.id + ':' + (row.type == "L" ? 'mi' : 'mo')])
    gather[row.r] = gather[row.r].concat([row.id + ':' + (row.type == "L" ? 'ro' : 'ri')])
  })

  return Object.keys(gather).map(function(key) {
    if (gather[key].length == 2) {
    	if(gather[key][0].split(':')[1].endsWith('o')) {
      	if(gather[key][1].split(':')[1].endsWith('i')) {
      		return gather[key][0] + ' -> ' + gather[key][1]
        }
      } else {
      	if(gather[key][1].split(':')[1].endsWith('o')) {
      		return gather[key][1] + ' -> ' + gather[key][0]
        }
      }
      
      throw "Invalid pairs " + JSON.stringify(gather[key])
    }
    if (gather[key].length == 1) {
    	if(gather[key][0].split(':')[1].endsWith('o')) {
        return gather[key][0] + ' -> FROUT'
      } else {
        return gather[key][0] + ' -> FRIN'
      }
      
    }
    console.log('gather = ', gather, 'json_out = ', json_out)
    throw `
    Found a lambda calculus term with neither 1 nor 2 entries: 
    gather["` + key + "\"] = " + gather[key].toString()
  })
}


// utility variables for convert dict to dot
dot_header_all = `
  digraph G {
  rankdir = TB;
`
dot_header_l = `
  // defaults for L
  node [shape=record, color=red, style=filled]; 
`
dot_header_a = `
  // defaults for A
  node [shape=record, color=green, style=filled]; 
`
dot_header_other = `
  // other
  T [ shape=point, color=black, style=filled ]
  FRIN [ style=filled, color=blue ]
  FROUT [ style=filled, color=blue ]
`

// convert dict to dot
function dict2dot_main(o_dict) {
  // reduce list to dot file
  //console.log("program", o)
  var o_nodes_L = o_dict.filter(b => (b.type == "L")).map(b => dict2dot_nodes(b)).reduce((a, b) => a + "\n" + b, "")
  var o_nodes_A = o_dict.filter(b => (b.type == "A")).map(b => dict2dot_nodes(b)).reduce((a, b) => a + "\n" + b, "")
  var o_edges = dict2dot_edges(o_dict).reduce((a, b) => a + "\n" + b, "")

  return (
    dot_header_all +
    dot_header_l +
    o_nodes_L + '\n' +
    dot_header_a +
    o_nodes_A + '\n' +
    dot_header_other +
    o_edges + '\n}'
  )
}


/////////////////////
// Run some examples/

console.log("--------------------")
console.log("n=> n (u=>x)")
console.log("jsjson2dict(esprima(...))")
console.log(jsjson2dict(esprima.parse(n=> n (u=>x))));
console.log("dict2dot_main(...)",  dict2dot_main(jsjson2dict(esprima.parse(n=> n (u=>x)))));

console.log("--------------------")
console.log("TRUE := λx.λy.x")
console.log("jsjson2dict(esprima(...))")
console.log(jsjson2dict(esprima.parse(lc_true)));

console.log("--------------------")
console.log("AND := λp.λq.p q p")
console.log("jsjson2dict(esprima(...))")
console.log(jsjson2dict(esprima.parse(lc_and)));

console.log("--------------------")
console.log("PRED := λn.λf.λx.n (λg.λh.h (g f)) (λu.x) (λu.u)")
console.log("jsjson2dict(esprima(...))")
console.log(jsjson2dict(esprima.parse(PRED)));


console.log("--------------------")
console.log("PRED_arrow := λn.λf.λx.n (λg.λh.h (g f)) (λu.x) (λu.u)")
console.log(
	"jsjson2dict(esprima(...))", 
  jsjson2dict(esprima.parse(PRED_arrow))
);
console.log(
	"dict2dot_main(...)", 
  dict2dot_main(jsjson2dict(esprima.parse(PRED_arrow)))
);

console.log("--------------------")
console.log("a => { return b }")
console.log(
  "jsjson2dict(...)",
  jsjson2dict(esprima.parse(a => { return b }))
);

////////////////////
// plot graph of input function from the HTML text box


function updateGraph() {
  var dot_in = document.getElementById("js_in").value
  //dot_in = 'digraph { a -> b }' // for testing
  //dot_in = pred_arrow_dot // for testing
  
  try {
   dot_in = eval(dot_in)
  }
  catch (e) {
    // statements to handle any exceptions
    document.getElementById("graph_out").innerHTML = e;
    return
  }
  
  var lambda_dict = jsjson2dict(esprima.parse(dot_in));
  console.log("lambda dict", lambda_dict)
  var lambda_dot = dict2dot_main(lambda_dict)
  console.log("lambda dot", lambda_dot)
  var viz = new Viz();
  //console.log('dot_in', dot_in)
  viz.renderSVGElement(lambda_dot)
    .then(function(element) {
      document.getElementById("graph_out").innerHTML = "";
      document.getElementById("graph_out").appendChild(element);
    })
    .catch(error => {
      // Create a new Viz instance (@see Caveats page for more info)
      viz = new Viz();

      // Possibly display the error
      console.error(error);
    });
}

// In jsfiddle, the below requires the option `No wrap - bottom of body`
updateGraph()
