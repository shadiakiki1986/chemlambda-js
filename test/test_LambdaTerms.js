var assert = require('assert');
var lt = require('../LambdaTerms');

describe('LambdaTerms', function() {
    it('expected equalities', function() {

        // test the functions
        assert.equal(lt.lc_and(lt.lc_true)(lt.lc_false), lt.lc_false); // returns TRUE in javascript!
        assert.equal(lt.lc_and(lt.lc_true)(lt.lc_true), lt.lc_true); // returns TRUE in javascript!
        
        assert.equal(lt.lc_and2(lt.lc_true)(lt.lc_false), lt.lc_false); // returns TRUE in javascript!
        assert.equal(lt.lc_and2(lt.lc_true)(lt.lc_true), lt.lc_true); // returns TRUE in javascript!
        
        assert.equal(lt.to_int(lt.n3), 3, "to_int(n3)==3 failed");
        assert.equal(lt.to_int(lt.PRED(lt.n3)), 2, "to_int(PRED(n3))==2 failed");
        assert.equal(lt.to_int(lt.PRED_arrow(lt.n3)), 2, "to_int(PRED_arrow(n3))==2 failed");
        //assert.equal(lt.PRED(lt.n1) == lt.n0, "PRED(n1) == n0 failed"); // same problem as with python, since different function evaluations are happening!
    });
});

