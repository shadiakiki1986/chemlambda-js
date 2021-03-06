Version 0.1.5 (2019-05-01)

* feature: sliders for initial re-writes as well as suggested re-writes
  * note that these re-writes are chained, i.e. the suggested come after the initial
  * so when the initial slider is moved, the suggested re-writes might no longer be valid
  * This is why they are reset upon a change of the initial re-writes slider
* enhancement: cleaning some unnecessary commented tags in the html head of index.html
* feature: add `resetIntermezzo()` dedicated to the suggested re-writes
* enhancement: refactor some variable names for distinguishing clearly between pertaining to initial or to suggested re-writes
* feature: suggested re-writes array is now an array of dict instead of array of txt
* enhancement: some shuffling of controls in UI
* bugfix: `predecessor(3)` was still using `L4` for variable name (which confuses the user with the automatically generated node name `L4` (which btw is no longer available since the integration of the `L_parameter` notation))
* feature: `rwAuto{Initial,Suggested}` are both `computed` fields in vue.js now
* feature: filtering the suggested re-writes for `beta reduction` now filters further for edges between L.right and A.left only


Version 0.1.4 (2019-04-30)

* feature: upon a beta re-write, delete the L/A nodes in subject
  * this is justified by https://en.wikipedia.org/wiki/DNA_computing#DNAzymes
    * the section "DNAzymes" states
      * "Because of this, these reactions take place in a device such as a continuous stirred-tank reactor, where old product is removed and new molecules added"
* bugfix: reset the rwRange variable between examples
* feature: stop gathering variables for expansion ... will use variable names instead
* feature: replace expanded strings with variable names when possible
* feature: trick for L of using id instead of r in order to capture edge by variable defined name


Version 0.1.3 (2019-04-27)

* feature: use variable names and function names defined by user in lambda node IDs instead of automatically generating them
  * refactor all examples' re-writes to use these IDs instead of the automatic conversion
  * this solves the issue of automatically generated IDs changing when the javascript input is shuffled
    * and hence the re-writes defined were no longer valid
    * (missing IDs or pointing to other nodes than originally intended)
* feature: add example of `2+2 + 2+2 + 3+3`
* enhancement: clarified in main page, section for re-write syntax, that L should be in left of A for lambda-calculus style beta reduction
* enhancement: rename `paramname` to `definedName`
* feature: use lambda function's signature as node name of ArrowFunctionExpression
* feature: add slider controller for "after re-writes" to go back and forth one re-write at a time


Version 0.1.2 (2019-04-26)

* feature: added example `predecessor(two)==one`
* feature: add example `ackermann(zero)`


Version 0.1.1 (2019-04-24)

* feature: account for loops in beta re-writes .. now the identity test works
* enhancement: minor fixes to examples and drop redundant examples
* feature: implement pair/type T/FRIN/FROUT with m/l/r in `Utils.type_side_to_inout`
* enhancement: add reference to Buliga write-up on beta re-writes in GraphRewriter.js
* feature: add example `predecessor(one)`


Version 0.1.0 (2019-04-24)

* feature: modify example `succ(zero)` to have first set of re-writes converting zero to one via successor
* feature: add example `identity(zero)==zero`
* bugfix: `jsjson2dict_main` now able to add new nodes for FRIN, FROUT, T
* bugfix: conversion to dot script no longer only exports nodes for A and L but also for FRIN, FROUT, T
* feature: add example `constant(whatever)==constant`


Version 0.0.9 (2019-04-23)

* enhancement: d3js visualization to avoid text labels based on extendedLabel
* enhancement: modify collision, charge, center forces and add a bounding circle force ... in an attempt to improve graph readability
* enhancement: factor out code for plotting to avoid duplication
* bugfix: error messages not displayed .. fixed
* enhancement: add example `succ(0)`


Version 0.0.8 (2019-04-22)

* enhancement: clearer error message when including re-write
* enhancement: factor out global ID register to continue IDs during re-writes after initial set
* enhancement: add viewbox to d3.js usage so that the graph is zoomed out automatically to fit all nodes
* enhancement: add collision force to d3js visualization
* bugfix: single step for examples that have no re-writes was not allowing the user to change to "after re-writes" in the graph display
* enhancement: remove unnecessary graph2Visible variable
* enhancement: add tooltip to nodes to be able to identify them when zoomed out too much
* enhancement: aesthetics for row containing suggested re-writes


Version 0.0.7 (2019-04-18)

* feature: change "dist" to require 4 arguments instead of just 1 argument
* feature: add suggested rewrites
* feature: allow to step once with selected/random re-write or roll out 50
    * the application of the graph with the re-writes is inefficient because for each step it computes it from scratch
* feature: dist not allowed on T, FROUT, FRIN
* feature: suggested re-writes to be based on output dict after re-write but before plotting
    * not sure if this was necessary or just an artifact of trying not to use `pushRw` from within `suggestedRwAppend`
* feature: first working version of rolled out random re-writes .. still inefficient though
* enhancement: add "rollout in progress"
* enhancement: "all" no longer used in suggestd re-writes
* enhancement: moved code block into try/catch
* enhancement: split out code into GraphRewriter
* enhancement: moved txt2array to GraphRewriter
* enhancement: introduce `dict2tmp` to enable fast rewrite without graphing
* enhancement: rewrite rollouts are now much more efficient
* enhancement: suggestedRwAll dependent on dict2tmp to facilitate fast iterations in graph rewrites and getting new suggestions
* enhancement: factor out some code to Utils.js
* feature: add visualization via d3js as well as vizjs
    * still requires some sort of zooming. The distances arent great yet too


Version 0.0.6 (2019-04-17)

* enhancement: aesthetics
* bugfix: buttons should not submit the form
* bugfix: rwVal should be pushed into rwAuto to affect the graph, and not "live"
* feature: support move "dist"
* enhancement: simplify the newNodeId usage by not needing to pass in the global ID register list


Version 0.0.5 (2019-04-17)

* bugfix: FRIN to be on input
* enhancement: add an example
* bugfix: node T is now included
* bugfix: nodes FRIN/FROUT/T now have separate IDs
* enhancement: failed attempt at resizing svg
* enhancement: change input of re-writes to be textarea instead of custom dropdowns
* enhancement: example of predecessor(three) now comes with pre-written re-writes
* feature: allow multiple edges to be added/deleted in re-write
* feature: add extended labels checkbox


Version 0.0.4 (2019-04-1{5,6,7})

* feature: use bootstrap css
* feature: convert to vue.js app
* enhancement: instead of live updates of the graph while editing the textarea, stages with "plot" buttons
* feature: prepare for adding re-writes
* feature: integrated first draft of re-writes ... still WIP

Version 0.0.3 (2019-04-13)

* enhancement: major code rewrite to split out the different functions and start official unit testing
    * also upgraded esprima dependency to 4.0.1 from 2.7.3 (now requires string)


Version 0.0.2 (2019-04-12)

* bugfix: wrap the `jsjson2dict` and `dict2dot` in try/catch as well
* bugfix: modify `dict2dot_edges` to support a lambda term that is used in multiple node inputs, e.g. `three` in lambda calculus shows `f` 3 times
* enhancement: add `three` to the examples on the html main page
* bugfix: clearer error message for case of duplicated variable name
* enhancement: add example `PRED(3)` to html page
* enhancement: display the resultant dot file below the graph
* enhancement: add link to viz-js.com for further graph re-writes and manipulation


Version 0.0.1 (2019-04-12)

* feature: first import of original code from the jsfiddle [shadiakiki1986/wnysq1p0](https://jsfiddle.net/shadiakiki1986/wnysq1p0/)
