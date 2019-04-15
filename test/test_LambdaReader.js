var assert = require('assert');
var lt = require('../LambdaTerms');
var lr = require('../LambdaReader');
var esprima = require('esprima');

describe('LambdaReader', function() {
  
    it('jsjson2lambda', function() {

        // fixtures
        // PRED := λn.λf.λx.n (λg.λh.h (g f)) (λu.x) (λu.u)
        var pred_string = 'λn.λf.λx.(((n λg.λh.(h (g f))) λu1.x) λu2.u2)'
        var test_data = [
          // simple function tests
          {
            'f': a => b,
            'e': 'λa.b'
          },
          {
            'f': a => {
              return b
            },
            'e': 'λa.b'
          },
          {
            'f': function foo(a) {
              return b
            },
            'e': 'λa.b'
          },
          {
          	'f': n=> n (u=>x),
            'e': 'λn.(n λu.x)'
          },
        
          // lambda calculus tests
          {
            'f': lt.lc_true,
            'e': 'λx.λy.x'
          }, // TRUE := λx.λy.x
          {
            'f': lt.lc_false,
            'e': 'λx.λy.y'
          }, // FALSE := λx.λy.y
          {
            'f': lt.lc_and,
            'e': 'λp.λq.((p q) p)'
          }, // AND := λp.λq.p q p
          {
            'f': lt.PRED,
            'e': pred_string
          },
          {
            'f': lt.PRED_arrow,
            'e': pred_string
          }
        ]
        test_data.forEach(x => {
          //console.log("testing", x.f.toString(), x.f)
          // Note that esprima.parse requires a string instead of a function in version 4.0.1 (unlike version 2.7.3)
          var actual = lr.jsjson2lambda(esprima.parse(x.f.toString()))
          assert.equal(
            actual,
            x.e,
            "test failed for " + x.f.toString() + `
            ` + actual + ' != ' + x.e
          )
        })

    });



    it('newNodeId', function() {
      var test_allIds = ['L0', 'L1', 'A0']
      assert.equal(lr.newNodeId('L', test_allIds), 'L2')
      assert.equal(lr.newNodeId('A', test_allIds), 'A1')
    });



    it('jsjson2dict_nodes', function() {
      
      // fixtures
      // PRED := λn.λf.λx.n (λg.λh.h (g f)) (λu.x) (λu.u)
      var pred_string = 'λn.λf.λx.(((n λg.λh.(h (g f))) λu1.x) λu2.u2)'
      var test_data = [
        // simple function tests
        {
          'f': u=>x,
          'e': [
              {
                "type": "L",
                "id": "L0",
                "l": "u",
                "m": "x",
                "r": "λu.x",
                "from": "ArrowFunctionExpression"
              }
            ]
        },
        {
        	'f': n=> n (u=>x),
          'e': [
              {
                "type": "L",
                "id": "L0",
                "l": "u",
                "m": "x",
                "r": "λu.x",
                "from": "ArrowFunctionExpression"
              },
              {
                "type": "A",
                "id": "A0",
                "r": "λu.x",
                "m": "(n λu.x)",
                "l": "n",
                "from": "CallExpression"
              },
              {
                "type": "L",
                "id": "L1",
                "l": "n",
                "m": "(n λu.x)",
                "r": "λn.(n λu.x)",
                "from": "ArrowFunctionExpression"
              }
            ]
        }
      ]
      test_data.forEach(x => {
        //console.log("testing", x.f.toString(), x.f)
        // Note that esprima.parse requires a string instead of a function in version 4.0.1 (unlike version 2.7.3)
        var actual = lr.jsjson2dict_nodes(esprima.parse(x.f.toString()))
        actual = JSON.stringify(actual)
        var expected = JSON.stringify(x.e)
        assert.equal(
           actual,
           expected,
          "test failed for " + x.f.toString() + `
          ` + actual + ' != ' + expected
        )
      })

    });
      

});
