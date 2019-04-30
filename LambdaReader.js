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

function LambdaReader(gid) {

    var utils = new Utils()

    // list of nodes (in dict format)
    // This is a property of the class so that it can be modified in jsjson2dict_edges
    this.dict_nodes = null

    // global ID register
    this.gid = gid

    // utility function to gather key-value pairs of "variables"
    this.var2dict = function(json_in, vardict1) {

      // 2019-04-30 Stop gathering variable definitions
      //            and instead use the variable names for creating the edges
      //            Check the special treatment of L nodes in jsjson2dict_edges
      return vardict1

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
    this.jsjson2lambda = function(json_in, vardict1, definedName) {
      // vardict1: This is a dict with keys being the names of variables and values being the definition of each variable
      //           The purpose is that when a variable name appears inside of an expression, it can be identified here
      //            and replaced as needed

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


    // utility function to replace expanded lambda expressions with variable names
    function lambdastr2varname(arg_rd, arg_rs) {
      if(arg_rd.length == 0) return arg_rs

      var prevNode = arg_rd[arg_rd.length - 1]
      //console.log("lambdastr2varname", arg_rs, prevNode)
      switch(prevNode.type) {
        case "L":
          // for .. of https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...of
          for(const k1 of ['l','r']) {
            //console.log("k1", k1, prevNode[k1], arg_rs)
            if(prevNode[k1]==arg_rs) {
              return prevNode.id
            }
          }
          break // switch
        case "A":
        /*
          var k1 = 'm'
          if(prevNode[k1]==arg_rs) {
            return prevNode.id
          }
          break // switch
          */
          return arg_rs
        default:
          throw "Unsupported type " + prevNode.type
      }

      return arg_rs

    }




    //------------------------------------------------------------
    // similar to this.jsjson2lambda but for outputting mol file
    this.jsjson2dict_nodes = function(json_in, vardict1, definedName) {
      var out = []
      if (vardict1 == undefined) {
        // first call should be with "Program"
        if (json_in.type != "Program") throw "Should be a program"
        // first call should also clear the ID register
        this.gid.globalIdRegister = []
      }

      if (vardict1 == undefined) vardict1 = {}
      if (definedName == undefined) definedName = undefined // FIXME should use `null` isntead of `undefined`

      //var i = json_in // .body[0]
      //console.log("convert", json_in.type, json_in)
      //console.log("definedName", definedName)
      switch (json_in.type) {
        case "Program":
          var o_dict = this.jsjson2dict_nodes(json_in.body[0], vardict1)
          return o_dict

        case "FunctionExpression": // peg.js
        case "FunctionDeclaration": // esprima
          // return this.jsjson2dict_nodes(json_in.body, vardict1, json_in.params[0].name)

          var bodyDict = this.jsjson2dict_nodes(json_in.body, vardict1, json_in.params[0].name)
          // result = result[0] // keeping it as array below for compliance
          var envStr = this.jsjson2lambda(json_in) // , vardict3, definedName)
          var bodyStr = this.jsjson2lambda(json_in.body)

          var li1 = null
          if(json_in.id != null) {
            // get user's defined name
            li1 = this.gid.useNodeId(json_in.id.name)
          } else {
            // generate an automatic node name
            li1 = this.gid.newNodeId("L")
          }

          // check if bodyStr (going to m) can be replaced by a node ID
          bodyStr = lambdastr2varname(bodyDict, bodyStr)

          var envelopeLambdaDict = {
            "type": "L",
            "id": li1,
            "l": json_in.params[0].name,
            "m": bodyStr,
            "r": envStr,
            "from": json_in.type
          }

          return bodyDict.concat([envelopeLambdaDict])

        case "BlockStatement":
          //o2a1 = json_in.body.filter(b => (b.type == "VariableDeclaration")).map(b => this.jsjson2dict_nodes(b)).reduce((a, b) => a.concat(b), [])

          // prepare variables dict key-value pairs
          var vardict3 = this.var2dict(json_in, vardict1)

          // body dict
          var o2a1a = json_in.body.map(b => this.jsjson2dict_nodes(b, vardict3))
          var o2a1a = o2a1a.reduce((a, b) => a.concat(b), [])

          // convert non-variables to dict, while passing the variables' dict
          //o2a1b = json_in.body.filter(b => (b.type != "VariableDeclaration")).map(b => this.jsjson2dict_nodes(b, vardict3)) // notice passing vardict arg
          //o2a1b = json_in.body.map(b => this.jsjson2dict_nodes(b, vardict3)) // notice passing vardict arg
          //o2a1b = o2a1b.reduce((a, b) => a.concat(b), [])

          //retStmtDict = json_in.body.filter(b => (b.type == "ReturnStatement"))
          //if (retStmtDict.length == 0) throw "Block missing return statement!"
          //retStmtDict = retStmtDict[0] // take 1st

          //retStmtLambdaStr = this.jsjson2lambda(retStmtDict, vardict3)
          //envelopeLambdaStr = this.jsjson2lambda(json_in, vardict3, definedName)

          //var li1 = (json_in.id != null ? json_in.id.name : this.gid.newNodeId("L"))

          // FIXME
          // Check if `li1` is unique otherwsise issue a new one
          // similar to `li2` below

    /*
          //var o11 = li1 + " " + '[label="<lo> ' + lv1 + ' |{<mi> '+ o2b1 + '|' + li1 + '} | <ro> λ' + lv1 + '.'+ o2b1 + '"];'
          var o11 = {
            "type": "L",
            "id": li1,
            "l": definedName,
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
          var bodyDict = this.jsjson2dict_nodes(json_in.body, vardict1)
          // FIXME in below, should I also mimic the above in terms of the definedName parameter?
          var bodyStr = this.jsjson2lambda(json_in.body, vardict1, json_in.params[0].name)
          var envStr = this.jsjson2lambda(json_in, vardict1, json_in.params[0].name)

          // Figure out the node names
          // First, check if there is a variable name definedName
          // Second, try to use the function signature
          // Third, fall back to automatic generation of node name
          // console.log("arrow definedName", definedName, "arrow function", json_in)
          // json_id is always null for arrow function expression, so resort to a passed definedName
          // var li2 = (json_in.id != null ? json_in.id.name : this.gid.newNodeId("L"))
          var li2 = null
          if(definedName != undefined) {
            // use defined name
            li2 = this.gid.useNodeId(definedName)
          } else {
            if(json_in.params[0].name != undefined) {
              // use signature of lambda function
              li2 = this.gid.useNodeId("L_"+json_in.params[0].name)
            } else {
              // generate an automatic node name
              li2 = this.gid.newNodeId("L")
            }
          }

          // check if bodyStr (going to m) can be replaced by a node ID
          bodyStr = lambdastr2varname(bodyDict, bodyStr)

          //var o12 = li2 + " " + '[label="<lo> ' + definedName + ' |{<mi> '+ o2b2 + '|' + li2 + '} | <ro> λ' + definedName + '.'+ o2b2 + '"];'
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
            this.jsjson2dict_nodes(json_in.argument, vardict1)
          )*/
          return this.jsjson2dict_nodes(json_in.argument, vardict1)

        case "Identifier":
          return []
          //return [{"type": "Identifier", "k": json_in.name}]

        case "CallExpression":
          // var o1_m = (  json_in.callee.type=="Identifier" ? json_in.callee.name : this.jsjson2dict_nodes(json_in.callee, vardict1)  )
          var o1_ld = this.jsjson2dict_nodes(json_in.callee, vardict1)
          var o1_ls = this.jsjson2lambda(json_in.callee, vardict1)

          // replace variable name with value
          var arg_rs = this.jsjson2lambda(json_in.arguments[0], vardict1)
          var arg_rd = this.jsjson2dict_nodes(json_in.arguments[0], vardict1)

          // Even though this is the only place for variable replacement,
          // I'm commenting it out since it doesn't seem to fit
          //if (vardict1 != undefined) {
          //  if (json_in.arguments[0].name in vardict1) {
          //    argv = vardict1[json_in.arguments[0].name]
          //  }
          //}

          var nodeId = this.gid.newNodeId("A")

          // Set the middle node
          // Use the variable declared name if possible
          var o1_ms = null
          if(definedName != undefined) {
            // use defined name
            o1_ms = definedName
          } else {
            o1_ms = this.jsjson2lambda(json_in, vardict1)
          }

          // check if arg_rs can be replaced by a node ID
          arg_rs = lambdastr2varname(arg_rd, arg_rs)
          // same for o1_ls
          o1_ls = lambdastr2varname(o1_ld, o1_ls)

          // concatenate and return
          return o1_ld.concat(arg_rd).concat([{
            "type": "A",
            "id": nodeId,
            "r": arg_rs,
            "m": o1_ms,
            "l": o1_ls,
            "from": json_in.type
          }])

        case "ExpressionStatement":
          return this.jsjson2dict_nodes(json_in.expression, vardict1)

        case "VariableDeclaration":
          //throw "Should not get " + json_in.type + " because theyre filtered in FunctionExpression"
          //console.log("var ...")
          //console.log(json_in)
          //return [json_in.declarations[0].id.name]
          //return []

          // pass the variable name as the definedName
          var o1 = this.jsjson2dict_nodes(json_in.declarations[0].init, vardict1, json_in.declarations[0].id.name)
          // console.log("variable dec", json_in, o1)
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

    //-----------------------------------

    this.jsjson2dict_edges = function() {
      // first gather data in an associative array of structure
      // key = from node
      // value = list of to nodes
      var gather = {}
      var self = this

      // iterate over a copy to be able to append new nodes to the original
      var dict_nodes_copy = utils.clone(this.dict_nodes)
      dict_nodes_copy.forEach(row => {
      	['l', 'm', 'r'].forEach(k1 => {

          // get the value of the k1 key, except in case of L, use the ID
          // This will facilitate later matching with shorter "unexpanded" values
          // Check the usage of "vardict1" in the jsjson2lambda
    			var k2 = (row.type=='L' && k1=='r') ? row.id : row[k1]
          if (!(k2 in gather)) gather[k2] = {'from': null, 'to': []}

    			// build node string labels
          var inout = utils.type_side_to_inout(row.type, k1)
          var nodeDict = {'type': row.type, 'id': row.id, 'portname': k1, 'inout': inout}
          var nodeLabel = utils.nodeDict2label(nodeDict)

          // decide to place the node in "from" or "to"
          switch(inout) {
          	case "o": {
                if(gather[k2].from == null) {
                  gather[k2].from = nodeDict
                  return
                }

                if(gather[k2].from != nodeLabel) {
                  console.error("details for duplicate variable names error", gather)
                  throw "Node label already set for " + k2 + " to be " + gather[k2].from.id + " and not " + nodeLabel + `.
                         Details in console.
                         Check if you have duplicate variable names and consider appending integer suffixes,
                         e.g. 'f' to 'f1' and 'f2'`
                }
              }
              break

            case "i": {
                gather[k2].to = gather[k2].to.concat([nodeDict])
                return
              }
              break
          }

          throw "Unsupported inout " + inout

        })
      })

      // dicts below match with input to nodeDict2label
      var node_frout = {"type": "FROUT", "id": "FROUT", "portname": "m", "inout": "i"}
      var node_t = {"type": "T", "id": "T", "portname": "m", "inout": "i"}
      var node_frin = {"type": "FRIN", "id": "FRIN", "portname": "m", "inout": "o"}

      return Object.keys(gather).map(function(key) {
    		if (gather[key].to.length == 0) {
    		  if(gather[key].from.type=='L' && gather[key].from.portname=='l') {
    		    var node_i = utils.clone(node_t)
    		    node_i.id = self.gid.newNodeId("T")
    		    self.dict_nodes = self.dict_nodes.concat([node_i])
    		    return {'from': gather[key].from, 'to': node_i}
    		  } else {
    		    var node_i = utils.clone(node_frout)
    		    node_i.id = self.gid.newNodeId("FROUT")
    		    self.dict_nodes = self.dict_nodes.concat([node_i])
        		return {'from': gather[key].from, 'to': node_i}
    		  }
        }

        return gather[key].to.map(toNodeLabel => {
          	if(gather[key].from == null) {
      		    var node_i = utils.clone(node_frin)
      		    node_i.id = self.gid.newNodeId("FRIN")
      		    self.dict_nodes = self.dict_nodes.concat([node_i])
            	return {'from': node_i, 'to': toNodeLabel}
            }

        		return {'from': gather[key].from, 'to': toNodeLabel}
        })

      }).reduce((a,b)=>a.concat(b), [])
    }


    this.jsjson2dict_main = function(json_in) {
      // reset
      this.dict_nodes = null

      // calculate list of nodes
      this.dict_nodes = this.jsjson2dict_nodes(json_in);

      // calculate list of edges
      // this also appends nodes FROUT, FRIN, T if needed
      dict_edges = this.jsjson2dict_edges();

      // done
      return {"nodes": this.dict_nodes, "edges": dict_edges}
    }



    //------------------------------------------------------------

    // utility function to convert dict to dot file row, nodes section
    function dict2dot_nodes(row, extendedLabels) {
      switch (row.type) {
        case "L":
          if(!extendedLabels) {
            return (row.id + ' [label="<lo> l | { <mi> m | ' + row.id + '} | <ro> r"];')
          }
          return (row.id + ' [label="<lo> ' +
            row.l + ' | { <mi> ' +
            row.m + ' | ' +
            row.id + '} | <ro> ' +
            row.r + '"];')
        case "A":
          if(!extendedLabels) {
            return (row.id + ' [label="<li> l | { ' + row.id + ' | <mo> m } | <ri> r"];')
          }
          return (row.id + ' [label="<li> ' +
            row.l + ' | { ' +
            row.id + ' | <mo> ' +
            row.m + '} | <ri> ' +
            row.r + '"];')

        case "T":
          //T [ shape=point, color=black, style=filled ]
          return (row.id) + " [ shape=point, color=black, style=filled ]"

        case "FRIN":
          //FRIN [ style=filled, color=blue ]
          return (row.id) + " [ style=filled, color=blue ]"

        case "FROUT":
          //FROUT [ style=filled, color=blue ]`
          return (row.id) + " [ style=filled, color=blue ]"

        default:
          throw "Unsupported row type " + row.type
      }
    }

    // utility function to convert dict to dot file row, edges section
    this.edgeDict2dot = function(edgeDict) {
        var nodeLabelFrom = utils.nodeDict2label(edgeDict.from)
        var nodeLabelTo   = utils.nodeDict2label(edgeDict.to)
    		return nodeLabelFrom + ' -> ' + nodeLabelTo
    }



    // convert dict to dot
    this.dict2dot_main = function(o_dict, extendedLabels) {

      // utility variables for convert dict to dot
      var dot_header_all = `
digraph G {
rankdir = TB;`
      var dot_header_l = `
// defaults for L
node [shape=record, color=red, style=filled];`
      var dot_header_a = `
// defaults for A
node [shape=record, color=green, style=filled];`
      var dot_header_other = `
// other nodes, e.g. T, FROUT, FRIN
node [shape=record, color=blue, style=filled];
//T [ shape=point, color=black, style=filled ]
//FRIN [ style=filled, color=blue ]
//FROUT [ style=filled, color=blue ]`
      var dot_header_edges = `
// edges`

      // reduce list to dot file
      //console.log("program", o)
      var o_nodes_L = o_dict.nodes.filter(b => (b.type == "L")).map(b => dict2dot_nodes(b, extendedLabels)).reduce((a, b) => a + "\n" + b, "")
      var o_nodes_A = o_dict.nodes.filter(b => (b.type == "A")).map(b => dict2dot_nodes(b, extendedLabels)).reduce((a, b) => a + "\n" + b, "")
      var o_nodes_other = o_dict.nodes.filter(b => (b.type != "L" && b.type != "A")).map(b => dict2dot_nodes(b, extendedLabels)).reduce((a, b) => a + "\n" + b, "")
      var o_edges_s = o_dict.edges.map(this.edgeDict2dot).reduce((a, b) => a + "\n" + b, "")

      return (
        dot_header_all + '\n' +
        dot_header_l + '\n' +
        o_nodes_L + '\n' +
        dot_header_a + '\n' +
        o_nodes_A + '\n' +
        dot_header_other + '\n' +
        o_nodes_other + '\n' +
        dot_header_edges + '\n' +
        o_edges_s + '\n}'
      )
    }

    return this

}


module.exports = LambdaReader()
