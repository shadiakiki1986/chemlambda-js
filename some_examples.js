// The below were run in a browser
// Some modifications might need to be done to get this to work

var lr = new LambdaReader()
var lt = new LambdaTerms()

/////////////////////
// Run some examples/

console.log("--------------------")
console.log("n=> n (u=>x)")
console.log("jsjson2dict_nodes(esprima(...))")
var ex1 = n=> n (u=>x)
ex1 = lr.jsjson2dict_nodes(esprima.parse(ex1.toString()))
console.log();
console.log("dict2dot_main(...)",  lr.dict2dot_main(ex1));

console.log("--------------------")
console.log("TRUE := λx.λy.x")
console.log("jsjson2dict_nodes(esprima(...))")
console.log(lr.jsjson2dict_nodes(esprima.parse(lt.lc_true.toString())));

console.log("--------------------")
console.log("AND := λp.λq.p q p")
console.log("jsjson2dict_nodes(esprima(...))")
console.log(lr.jsjson2dict_nodes(esprima.parse(lt.lc_and.toString())));

console.log("--------------------")
console.log("PRED := λn.λf.λx.n (λg.λh.h (g f)) (λu.x) (λu.u)")
console.log("jsjson2dict_nodes(esprima(...))")
console.log(lr.jsjson2dict_nodes(esprima.parse(lt.PRED.toString())));


console.log("--------------------")
console.log("PRED_arrow := λn.λf.λx.n (λg.λh.h (g f)) (λu.x) (λu.u)")
console.log(
	"jsjson2dict_nodes(esprima(...))", 
  lr.jsjson2dict_nodes(esprima.parse(lt.PRED_arrow.toString()))
);
console.log(
	"dict2dot_main(...)", 
  lr.dict2dot_main(lr.jsjson2dict_nodes(esprima.parse(lt.PRED_arrow.toString())))
);

console.log("--------------------")
var ex2 = a => { return b }
console.log(ex2.toString())
console.log(
  "jsjson2dict_nodes(...)",
  lr.jsjson2dict_nodes(esprima.parse(ex2.toString()))
);
