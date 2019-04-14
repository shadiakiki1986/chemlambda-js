// Define a few lambda calculus terms using javascript (arrow notation or function notation)

function LambdaTerms() {
  
    //     TRUE := λx.λy.x
    this.lc_true = x => (y => x)
    
    // FALSE := λx.λy.y 
    /*
    Using function declaration
    function bla(x) {
      function foo(y) {
        return y;
      }
    }
    */
    this.lc_false = x => (y => y)
    
    //     AND := λp.λq.p q p
    this.lc_and = p => (q => (p(q))(p))
    
    
    //     AND := λp.λq.p q p
    this.lc_and2 = function(p) {
      var o1 = function(q) {
        var o2 = p(q)
        return o2(p)
      }
      return o1
    }
    
    
    // PRED := λn.λf.λx.n (λg.λh.h (g f)) (λu.x) (λu.u)
    this.PRED = function L1(n) {
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
    this.PRED_arrow = n => f => x => {
      var L4 = u1 => x
      var L5 = u2 => u2
      var L6 = g => h => h(g(f))
      return ((n(L6))(L4))(L5)
    }
    
    this.n0 = (f => x => x) // 0 := λf.λx.x
    this.n1 = (f => x => f(x)) // 1 := λf.λx.f x
    this.n2 = (f => x => f(f(x))) // 2 := λf.λx.f (f x)
    this.n3 = (f => x => f(f(f(x)))) // 3 := λf.λx.f (f (f x))
    
    // for arithmetic, the equality doesn't work without "to_int" below which converts from lambda calculus to javascript integers
    this.to_int = n => (n(x => x + 1))(0) // http://vanderwijk.info/blog/pure-lambda-calculus-python/

    return this
}


module.exports = LambdaTerms()