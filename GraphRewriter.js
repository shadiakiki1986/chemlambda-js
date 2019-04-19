/*
 * Class that can apply re-writes to a graph.
 */


function GraphRewriter() {


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
    
    this.apply_beta = function(lambda_dict, edges_dict, rwi) {
            // e.g. beta L1 A1

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

            // add edges
            var el1 = edges_labeled["L_in"].map(L_in => {
                return edges_labeled["A_out"].map(A_out => {
                  return {
                    'from': edges_dict[L_in].from, 
                    'to': edges_dict[A_out].to
                  }
                })
              }).reduce((a,b)=>a.concat(b), [])
              
            var el2 = edges_labeled["A_in_notL"].map(A_in_notL => {
                return edges_labeled["L_out_notA"].map(L_out_notA => {
                  return {
                    'from': edges_dict[A_in_notL].from, 
                    'to': edges_dict[L_out_notA].to
                  }
                })
              }).reduce((a,b)=>a.concat(b), [])
              
            //console.log("edges labeled", edges_labeled)
            var el3 = [el1, el2].reduce((a,b)=>a.concat(b), [])
            el3.forEach(e => {
              var k = lr.edgeDict2dot(e)
              edges_dict[k] = e
            })

            // delete edges
            Object.keys(edges_labeled).forEach(k1 => {
              edges_labeled[k1].map(k2 => {
                delete edges_dict[k2]
              })
            })
            
            return edges_dict
    }
    
    
    this.apply_dist = function(lambda_dict, edges_dict, rwi) {
            // e.g. dist L1 L2 L3 L4

            // sanity check
            if(rwi.n_in == null) throw("Rewrite error: Move " + rwi.type + " received node 1 == null. Aborting")
            if(rwi.n_center == null) throw("Rewrite error: Move " + rwi.type + " received node 2 == null. Aborting")
            if(rwi.n_left == null) throw("Rewrite error: Move " + rwi.type + " received node 3 == null. Aborting")
            if(rwi.n_right == null) throw("Rewrite error: Move " + rwi.type + " received node 4 == null. Aborting")
            
            // get node
            var n_in = (rwi.n_in=="all") ? "all" : lambda_dict.nodes.filter(node => node.id==rwi.n_in)
            var n_center = lambda_dict.nodes.filter(node => node.id==rwi.n_center)
            var n_left = (rwi.n_left=="all") ? "all" : lambda_dict.nodes.filter(node => node.id==rwi.n_left)
            var n_right = (rwi.n_right=="all") ? "all" : lambda_dict.nodes.filter(node => node.id==rwi.n_right)
            
            // sanity checks
            if(n_in!="all") {
              if(n_in.length==0) throw ("Rewrite error: Node " + rwi.n_in + " not found")
              if(n_in.length >1) throw ("Rewrite error: Node " + rwi.n_in + " found > 1")
              n_in = n_in[0] // take first element of array
            }

            if(n_center.length==0) throw ("Rewrite error: Node " + rwi.n_center + " not found")
            if(n_center.length >1) throw ("Rewrite error: Node " + rwi.n_center + " found > 1")
            n_center = n_center[0] // take first element of array
            // check types
            if(n_center.type!='L') throw ("Rewrite error: center node for dist is expected to have type L. Got '" + n_center.type + "' instead")

            if(n_left!="all") {
              if(n_left.length==0) throw ("Rewrite error: Node " + rwi.n_left + " not found")
              if(n_left.length >1) throw ("Rewrite error: Node " + rwi.n_left + " found > 1")
              n_left = n_left[0] // take first element of array
              // check types
              if(n_left.type !='L' && n_left.type !='A') throw ("Rewrite error: left  node for dist is expected to have type L or A. Got '" + n_left.type  + "' instead")
            }

            if(n_right!="all") {
              if(n_right.length==0) throw ("Rewrite error: Node " + rwi.n_right + " not found")
              if(n_right.length >1) throw ("Rewrite error: Node " + rwi.n_right + " found > 1")
              n_right = n_right[0] // take first element of array
              // check types
              if(n_right.type!='L' && n_right.type!='A') throw ("Rewrite error: right node for dist is expected to have type L or A. Got '" + n_right.type + "' instead")
            }

            // identify all edges
            var edges_labeled = {
              "L_in"   : Object.keys(edges_dict).filter(k =>  edges_dict[k].to.id  ==rwi.n_center),
              "L_out_r": Object.keys(edges_dict).filter(k => (edges_dict[k].from.id==n_center.id )&&(edges_dict[k].from.portname=="r")),
              "L_out_l": Object.keys(edges_dict).filter(k => (edges_dict[k].from.id==n_center.id )&&(edges_dict[k].from.portname=="l"))
            }
            
            // identify branching ports
            var is_branch = []
            Object.keys(edges_labeled).forEach(k => {
              is_branch[k] = (edges_labeled[k].length > 1)
            })
            
            // require at least 1 output to be branching, otherwise what's the point of dist?
            if(Object.keys(is_branch).filter(k => is_branch[k]).filter(x => x).length == 0) {
              throw "For 'dist', at least one port on the central node is required to be branching. Aborting for " + rwi.toString()
            }

            // filter edges for subset identified by nodes
            if(n_in   !="all") edges_labeled["L_in"   ] = edges_labeled["L_in"   ].filter(k => edges_dict[k].from.id==rwi.n_in   )
            if(n_left !="all") edges_labeled["L_out_l"] = edges_labeled["L_out_l"].filter(k => edges_dict[k].to.id  ==rwi.n_left )
            if(n_right!="all") edges_labeled["L_out_r"] = edges_labeled["L_out_r"].filter(k => edges_dict[k].to.id  ==rwi.n_right)

            // add edges
            edges_labeled["L_in"].map(L_in => {
              return edges_labeled["L_out_r"].map(L_out_r => {
                return edges_labeled["L_out_l"].map(L_out_l => {
                  // clone the old L node
                  var old_L_id = rwi.n_center
                  var old_L_node = lambda_dict.nodes.filter(n => n.id==old_L_id)
                  if(old_L_node.length == 0) throw "Failed to identify node " + old_L_id + ". Found 0"
                  if(old_L_node.length  > 1) throw "Failed to identify node " + old_L_id + ". Found > 1"
                  old_L_node = old_L_node[0]
                  
                  var new_L_id = lr.newNodeId("L")
                  var new_L_node = clone(old_L_node)
                  new_L_node.id = new_L_id
                  new_L_node.from = rwi.toString()
                  
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
                      'to': edges_dict[L_out_l].to
                    },
                    { 'from': new_L_r, 
                      'to': edges_dict[L_out_r].to
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
              // only delete edges that belong to a branching port
              if(is_branch[k1]) {
                edges_labeled[k1].map(k2 => {
                  delete edges_dict[k2]
                })
              }
            })

            return {"edges_dict": edges_dict, "lambda_dict": lambda_dict}
    }
    

    this.apply_rewrites = function(lambda_dict, rwAuto) {
      // compute new graph from re-writes (rwAuto)

      if(rwAuto.length==0 || rwAuto.filter(x => x!=null).length == 0) {
        // no re-writes
        // if(this.dict2FromDict1Callback) setTimeout(this.dict2FromDict1Callback, 1)
        return lambda_dict;
      }

      // pass dict through re-writes
      rwAuto.forEach(rwi => {
        if(rwi == null) return
        
        //console.log("applying re-write ", JSON.stringify(rwi))
        //console.log("lambda_dict", lambda_dict.nodes.map(x=>x.id))

        // convert edges array to associative array
        // Note that these 2 lines need to be inside the forEach
        // because the graph evoloves as the re-writes are made
        // and hance there are possibly new nodes
        var edges_keys = lambda_dict.edges.map(lr.edgeDict2dot);
        var edges_dict = createAssociativeArray(edges_keys, lambda_dict.edges)
        
        // check re-write type and apply the corresponding actions
        switch(rwi.type) {
          case "beta":
            edges_dict = this.apply_beta(lambda_dict, edges_dict, rwi)
            break;
            
          case "dist":
            var o = this.apply_dist(lambda_dict, edges_dict, rwi)
            edges_dict = o.edges_dict
            lambda_dict = o.lambda_dict
            break;
            
          default:
            throw "Unsupported move " + rwi.type
        }
        
        // convert edges dict back to array and store in main variable
        // Note that this needs to be inside the forEach instead of outside
        // so that the graph would evolve. Check related note at beginning
        // of forEach section
        lambda_dict.edges = Object.keys(edges_dict).map(k => edges_dict[k])

      })
      
      // return
      //if(this.dict2FromDict1Callback) setTimeout(this.dict2FromDict1Callback, 1)
      return lambda_dict
    }

    
    return this

}


module.exports = LambdaReader()