// https://medium.com/functional-javascript/lambda-calculus-in-javascript-part-1-28ff63824d4d
// https://en.wikipedia.org/wiki/Lambda_calculus#Logic_and_predicates
//
// related
// https://stackoverflow.com/questions/10182387/how-to-generate-call-graphs-for-given-javascript
// https://github.com/cheburakshu/Javascript-Explorer-Callgraph
//
// for rendering graphviz in the browser
// https://github.com/dagrejs/dagre/  which replaces vis.js
/////////////////////////////
/////////////////////////////
/////////////////////////////

function LambdaReader() {

    // utility function to gather key-value pairs of "variables"
    this.var2dict = function(json_in, vardict1) {
    
      // prepare variables dict
      var vardict2 = json_in.body.filter(b => (b.type == "VariableDeclaration"))
      vardict2 = vardict2.map(b => {
        var k = b.declarations[0].id.name
        var v = this.jsjson2lambda(b.declarations[0].init, vardict1)
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
    this.jsjson2lambda = function(json_in, vardict1, paramname) {
      var out = ""
      //var i = json_in // .body[0]
      //console.log("convert", json_in, vardict1)
      switch (json_in.type) {
        case "Program":
          return this.jsjson2lambda(json_in.body[0], vardict1)
    
        case "FunctionExpression": // peg.js
        case "FunctionDeclaration": // esprima
          var result = this.jsjson2lambda(json_in.body, vardict1)
          return "λ" + json_in.params[0].name + "." + result + ""
    
        case "BlockStatement":
          var vardict3 = this.var2dict(json_in, vardict1)
          //console.log("vardict3", vardict3)
          var retStmtDict = json_in.body.filter(b => (b.type == "ReturnStatement"))
          if (retStmtDict.length == 0) throw "Missing return statement from block"
          retStmtDict = retStmtDict[0]
          retStmtStr = this.jsjson2lambda(retStmtDict, vardict3)
          return retStmtStr
    
        case "ArrowFunctionExpression":
          return "λ" + json_in.params[0].name + "." + this.jsjson2lambda(json_in.body, vardict1, json_in.params[0].name)
    
        case "ReturnStatement":
          return this.jsjson2lambda(json_in.argument, vardict1)
    
        case "Identifier":
          if (vardict1 != undefined) {
            if (json_in.name in vardict1) {
              return vardict1[json_in.name]
            }
          }
          return json_in.name
    
        case "CallExpression":
          return "(" + this.jsjson2lambda(json_in.callee, vardict1) + " " + this.jsjson2lambda(json_in.arguments[0], vardict1) + ")"
    
        case "ExpressionStatement":
          return this.jsjson2lambda(json_in.expression, vardict1)
    
        case "VariableDeclaration":
          //  return "var " + json_in.declarations[0].id.name + " = ..."
          throw "Should not get " + json_in.type + " because theyre filtered in FunctionExpression"
    
        default:
          console.log(json_in)
          throw "Unsupported type1: " + json_in.type
      }
    }
    
    
    
    //------------------------------------------------------------
    // utility function to get a new ID for a node
    this.newNodeId = function(nodetype, allIds) {
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
    
    
    //------------------------------------------------------------
    // similar to this.jsjson2lambda but for outputting mol file
    var globalIdRegister = [] // global list of IDs
    this.jsjson2dict = function(json_in, vardict1, paramname) {
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
          var o_dict = this.jsjson2dict(json_in.body[0], vardict1)
          return o_dict
    
        case "FunctionExpression": // peg.js
        case "FunctionDeclaration": // esprima
          // return this.jsjson2dict(json_in.body, vardict1, json_in.params[0].name)
          
          var bodyLambdaDict = this.jsjson2dict(json_in.body, vardict1, json_in.params[0].name)
          // result = result[0] // keeping it as array below for compliance
          var envelopeLambdaStr = this.jsjson2lambda(json_in) // , vardict3, paramname)
          var bodyLambdaStr = this.jsjson2lambda(json_in.body)
          
          var li1 = (json_in.id != null ? json_in.id.name : this.newNodeId("L", globalIdRegister))
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
          //o2a1 = json_in.body.filter(b => (b.type == "VariableDeclaration")).map(b => this.jsjson2dict(b)).reduce((a, b) => a.concat(b), [])
    
          // prepare variables dict key-value pairs
          var vardict3 = this.var2dict(json_in, vardict1)
    
          // body dict
          var o2a1a = json_in.body.map(b => this.jsjson2dict(b, vardict3))
          var o2a1a = o2a1a.reduce((a, b) => a.concat(b), [])
    
          // convert non-variables to dict, while passing the variables' dict
          //o2a1b = json_in.body.filter(b => (b.type != "VariableDeclaration")).map(b => this.jsjson2dict(b, vardict3)) // notice passing vardict arg
          //o2a1b = json_in.body.map(b => this.jsjson2dict(b, vardict3)) // notice passing vardict arg
          //o2a1b = o2a1b.reduce((a, b) => a.concat(b), [])
    
          //retStmtDict = json_in.body.filter(b => (b.type == "ReturnStatement"))
          //if (retStmtDict.length == 0) throw "Block missing return statement!"
          //retStmtDict = retStmtDict[0] // take 1st
    
          //retStmtLambdaStr = this.jsjson2lambda(retStmtDict, vardict3)
          //envelopeLambdaStr = this.jsjson2lambda(json_in, vardict3, paramname)
    
          //var li1 = (json_in.id != null ? json_in.id.name : this.newNodeId("L", globalIdRegister))
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
          var bodyDict = this.jsjson2dict(json_in.body, vardict1, json_in.params[0].name)
          var bodyStr = this.jsjson2lambda(json_in.body, vardict1, json_in.params[0].name)
          var envStr = this.jsjson2lambda(json_in, vardict1, json_in.params[0].name)
          var li2 = (json_in.id != null ? json_in.id.name : this.newNodeId("L", globalIdRegister))
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
            this.jsjson2dict(json_in.argument, vardict1)
          )*/
          return this.jsjson2dict(json_in.argument, vardict1)
    
        case "Identifier":
          return []
          //return [{"type": "Identifier", "k": json_in.name}]
    
        case "CallExpression":
          // var o1a = (  json_in.callee.type=="Identifier" ? json_in.callee.name : this.jsjson2dict(json_in.callee, vardict1)  )
          var o00 = this.jsjson2dict(json_in.callee, vardict1)
          var o1a = this.jsjson2lambda(json_in, vardict1)
          var o1b = this.jsjson2lambda(json_in.callee, vardict1)
    
          // replace variable name with value
          var arg_l = this.jsjson2lambda(json_in.arguments[0], vardict1)
          var arg_d = this.jsjson2dict(json_in.arguments[0], vardict1)
          
          // Even though this is the only place for variable replacement,
          // I'm commenting it out since it doesn't seem to fit
          //if (vardict1 != undefined) {
          //  if (json_in.arguments[0].name in vardict1) {
          //    argv = vardict1[json_in.arguments[0].name]
          //  }
          //}
    
          var nodeId = this.newNodeId("A", globalIdRegister)
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
          return this.jsjson2dict(json_in.expression, vardict1)
    
        case "VariableDeclaration":
          //throw "Should not get " + json_in.type + " because theyre filtered in FunctionExpression"
          //console.log("var ...")
          //console.log(json_in)
          //return [json_in.declarations[0].id.name]
          //return []
    
          var o1 = this.jsjson2dict(json_in.declarations[0].init, vardict1)
          //console.log("variable dec", json_in, o1)
          /*
          var o2 = [{
            "type": "var",
            "id": json_in.declarations[0].id.name,
            "v": this.jsjson2lambda(json_in.declarations[0].init, vardict1)
          }]
          return o1.concat(o2)
          */
          return o1
    
        default:
          console.log(json_in)
          throw "Unsupported type1: " + json_in.type
      }
    }
    
    
    
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
    
    // utility function to identify in/out type
    function type_side_to_inout(type, side) {
    	switch(type) {
      	case "L":
        	switch(side) {
          	case "l": return 'o'
            case "m": return 'i'
            case "r": return 'o'
          }
      	case "A":
        	switch(side) {
          	case "l": return 'i'
            case "m": return 'o'
            case "r": return 'i'
          }
      }
      throw "type/side pair not supoprted yet " + type + "/" + side
    }
    
    // utility function to convert dict to dot file row, edges section
    function dict2dot_edges(json_out) {
      var gather = {}
      json_out.forEach(row => {
      	['l', 'm', 'r'].forEach(k1 => {
    
    			var k2 = row[k1]
          if (!(k2 in gather)) gather[k2] = {'from': null, 'to': []}
    
    			// build node string labels
          var inout = type_side_to_inout(row.type, k1)
          var nodeLabel = row.id + ':' + k1 + inout
          
          // decide to place the node in "from" or "to"
          switch(inout) {
          	case "o": {
                if(gather[k2].from == null) {
                  gather[k2].from = nodeLabel
                  return
                }
    
                if(gather[k2].from != nodeLabel) {
                  console.error("details for duplicate variable names error", gather)
                  throw "Node label already set for " + k2 + " to be " + gather[k2].from + " and not " + nodeLabel + ". Details in console. Check if you have duplicate variable names and consider appending integer suffixes, e.g. 'f' to 'f1' and 'f2'"
                }
              }
              break
              
            case "i": {
                gather[k2].to = gather[k2].to.concat([nodeLabel])
                return
              }
              break
          }
    
          throw "Unsupported inout " + inout
    
        })
      })
    
      return Object.keys(gather).map(function(key) {
    		if (gather[key].to.length == 0) {
        		return [gather[key].from + ' -> ' + 'FROUT']
        }
    
        return gather[key].to.map(toNodeLabel => {
          	if(gather[key].from == null) {
            	return toNodeLabel + ' -> ' + 'FRIN'
            }
        
        		return gather[key].from + ' -> ' + toNodeLabel
        })
    
      }).reduce((a,b)=>a.concat(b), [])
    }
    
    
    
    // convert dict to dot
    this.dict2dot_main = function(o_dict) {
        // utility variables for convert dict to dot
        var dot_header_all = `
          digraph G {
          rankdir = TB;
        `
        var dot_header_l = `
          // defaults for L
          node [shape=record, color=red, style=filled]; 
        `
        var dot_header_a = `
          // defaults for A
          node [shape=record, color=green, style=filled]; 
        `
        var dot_header_other = `
          // other
          T [ shape=point, color=black, style=filled ]
          FRIN [ style=filled, color=blue ]
          FROUT [ style=filled, color=blue ]
        `
    
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
    
    return this

}


module.exports = LambdaReader()