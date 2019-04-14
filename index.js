
////////////////////
// plot graph of input function from the HTML text box


function updateGraph() {
  var dot_in = document.getElementById("js_in").value
  //dot_in = 'digraph { a -> b }' // for testing
  //dot_in = pred_arrow_dot // for testing
  
  try {
    dot_in = eval(dot_in)
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
  

  var viz = new Viz();
  //console.log('dot_in', dot_in)
  viz.renderSVGElement(lambda_dot)
    .then(function(element) {
      document.getElementById("graph_out").innerHTML = "";
      document.getElementById("graph_out").appendChild(element);
      document.getElementById("dot_out").innerHTML = lambda_dot;
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

