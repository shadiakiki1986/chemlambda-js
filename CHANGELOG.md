Version 0.0.5 (2019-04-17)

* bugfix: FRIN to be on input
* enhancement: add an example
* bugfix: node T is now included
* bugfix: nodes FRIN/FROUT/T now have separate IDs
* enhancement: failed attempt at resizing svg
* enhancement: change input of re-writes to be textarea instead of custom dropdowns
* enhancement: example of predecessor(three) now comes with pre-written re-writes
* feature: allow multiple edges to be added/deleted in re-write


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
