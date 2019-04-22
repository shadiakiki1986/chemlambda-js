function GlobalIdRegister() {

    var utils = new Utils()


    // utility function to get a new ID for a node
    this.globalIdRegister = [] // global list of IDs

    this.newNodeId = function(nodetype) {
      var allIds = this.globalIdRegister.filter(x => x.startsWith(nodetype))
      newId = nodetype + '0'
      MAXNUM = 1000 // circuit breaker
      for (var i = 0;
        (i < MAXNUM) && (allIds.indexOf(newId) != -1); i++) {
        newId = '' + nodetype + i;
      }

      if(i==MAXNUM) throw "The limit of maximum number of node IDs has been hit"

      // append to global register
      this.globalIdRegister = this.globalIdRegister.concat([newId])

      //return
      return newId
    }



    return this

}


module.exports = GlobalIdRegister()