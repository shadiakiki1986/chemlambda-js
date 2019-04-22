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

    // global ID register
    this.gid = gid

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
    // similar to this.jsjson2lambda but for outputting mol file
    this.jsjson2dict_nodes = function(json_in, vardict1, paramname) {
      var out = []
      if (vardict1 == undefined) {
        // first call should be with "Program"
        if (json_in.type != "Program") throw "Should be a program"
        // first call should also clear the ID register
        this.globalIdRegister = []
      }

      if (vardict1 == undefined) vardict1 = {}
      if (paramname == undefined) paramname = undefined // FIXME should use `null` isntead of `undefined`

      //var i = json_in // .body[0]
      //console.log("convert", json_in.type, json_in)
      switch (json_in.type) {
        case "Program":
          var o_dict = this.jsjson2dict_nodes(json_in.body[0], vardict1)
          return o_dict

        case "FunctionExpression": // peg.js
        case "FunctionDeclaration": // esprima
          // return this.jsjson2dict_nodes(json_in.body, vardict1, json_in.params[0].name)

          var bodyLambdaDict = this.jsjson2dict_nodes(json_in.body, vardict1, json_in.params[0].name)
          // result = result[0] // keeping it as array below for compliance
          var envelopeLambdaStr = this.jsjson2lambda(json_in) // , vardict3, paramname)
          var bodyLambdaStr = this.jsjson2lambda(json_in.body)

          var li1 = (json_in.id != null ? json_in.id.name : this.gid.newNodeId("L"))

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
          //envelopeLambdaStr = this.jsjson2lambda(json_in, vardict3, paramname)

          //var li1 = (json_in.id != null ? json_in.id.name : this.gid.newNodeId("L"))

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
          var bodyDict = this.jsjson2dict_nodes(json_in.body, vardict1, json_in.params[0].name)
          var bodyStr = this.jsjson2lambda(json_in.body, vardict1, json_in.params[0].name)
          var envStr = this.jsjson2lambda(json_in, vardict1, json_in.params[0].name)
          var li2 = (json_in.id != null ? json_in.id.name : this.gid.newNodeId("L"))

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
            this.jsjson2dict_nodes(json_in.argument, vardict1)
          )*/
          return this.jsjson2dict_nodes(json_in.argument, vardict1)

        case "Identifier":
          return []
          //return [{"type": "Identifier", "k": json_in.name}]

        case "CallExpression":
          // var o1a = (  json_in.callee.type=="Identifier" ? json_in.callee.name : this.jsjson2dict_nodes(json_in.callee, vardict1)  )
          var o00 = this.jsjson2dict_nodes(json_in.callee, vardict1)
          var o1a = this.jsjson2lambda(json_in, vardict1)
          var o1b = this.jsjson2lambda(json_in.callee, vardict1)

          // replace variable name with value
          var arg_l = this.jsjson2lambda(json_in.arguments[0], vardict1)
          var arg_d = this.jsjson2dict_nodes(json_in.arguments[0], vardict1)

          // Even though this is the only place for variable replacement,
          // I'm commenting it out since it doesn't seem to fit
          //if (vardict1 != undefined) {
          //  if (json_in.arguments[0].name in vardict1) {
          //    argv = vardict1[json_in.arguments[0].name]
          //  }
          //}

          var nodeId = this.gid.newNodeId("A")

          return o00.concat(arg_d).concat([{
            "type": "A",
            "id": nodeId,
            "r": arg_l,
            "m": o1a,
            "l": o1b,
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

          var o1 = this.jsjson2dict_nodes(json_in.declarations[0].init, vardict1)
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

    //-----------------------------------

    this.jsjson2dict_edges = function(json_out) {
      // first gather data in an associative array of structure
      // key = from node
      // value = list of to nodes
      var gather = {}
      var self = this
      json_out.forEach(row => {
      	['l', 'm', 'r'].forEach(k1 => {

    			var k2 = row[k1]
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
                  throw "Node label already set for " + k2 + " to be " + gather[k2].from + " and not " + nodeLabel + `.
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
    		    return {'from': gather[key].from, 'to': node_i}
    		  } else {
    		    var node_i = utils.clone(node_frout)
    		    node_i.id = self.gid.newNodeId("FROUT")
        		return {'from': gather[key].from, 'to': node_i}
    		  }
        }

        return gather[key].to.map(toNodeLabel => {
          	if(gather[key].from == null) {
      		    var node_i = utils.clone(node_frin)
      		    node_i.id = self.gid.newNodeId("FRIN")
            	return {'from': node_i, 'to': toNodeLabel}
            }

        		return {'from': gather[key].from, 'to': toNodeLabel}
        })

      }).reduce((a,b)=>a.concat(b), [])
    }


    this.jsjson2dict_main = function(json_in) {
      var dict_nodes = this.jsjson2dict_nodes(json_in);
      var dict_edges = this.jsjson2dict_edges(dict_nodes);
      return {"nodes": dict_nodes, "edges": dict_edges}
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
        // other nodes, e.g. T, FROUT, FRIN
        node [shape=record, color=blue, style=filled];
        //T [ shape=point, color=black, style=filled ]
        //FRIN [ style=filled, color=blue ]
        //FROUT [ style=filled, color=blue ]
        `

      // reduce list to dot file
      //console.log("program", o)
      var o_nodes_L = o_dict.nodes.filter(b => (b.type == "L")).map(b => dict2dot_nodes(b, extendedLabels)).reduce((a, b) => a + "\n" + b, "")
      var o_nodes_A = o_dict.nodes.filter(b => (b.type == "A")).map(b => dict2dot_nodes(b, extendedLabels)).reduce((a, b) => a + "\n" + b, "")
      var o_edges_s = o_dict.edges.map(this.edgeDict2dot).reduce((a, b) => a + "\n" + b, "")

      return (
        dot_header_all +
        dot_header_l +
        o_nodes_L + '\n' +
        dot_header_a +
        o_nodes_A + '\n' +
        dot_header_other +
        o_edges_s + '\n}'
      )
    }

    return this

}


module.exports = LambdaReader()