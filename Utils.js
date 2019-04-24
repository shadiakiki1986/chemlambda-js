function Utils() {

    this.nodeDict2label = function(nd) {
      return nd.id + ':' + nd.portname + nd.inout
    }

    //------------------------------------------------------------

    // utility function to identify in/out type
    this.type_side_to_inout = function(type, side) {
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
      	case "T":
        	switch(side) {
          	case "l": return 'x'
            case "m": return 'i'
            case "r": return 'x'
          }
      	case "FRIN":
        	switch(side) {
          	case "l": return 'x'
            case "m": return 'o'
            case "r": return 'x'
          }
      	case "FROUT":
        	switch(side) {
          	case "l": return 'x'
            case "m": return 'i'
            case "r": return 'x'
          }
      }
      throw "type/side pair not supoprted yet " + type + "/" + side
    }

    // https://stackoverflow.com/a/21147462
    this.clone = function(assArray) {
      return JSON.parse(JSON.stringify(assArray))
    }

    // https://stackoverflow.com/a/7228322/4126114
    this.randomIntFromInterval = function(min,max) // min and max included
    {
        return Math.floor(Math.random()*(max-min+1)+min);
    }


    return this

}


module.exports = Utils()