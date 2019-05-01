# chemlambda-js

[![Build Status](https://travis-ci.org/shadiakiki1986/chemlambda-js.svg?branch=master)](https://travis-ci.org/shadiakiki1986/chemlambda-js)

Graphic lambda calculus as a framework for molecular computing (fingers crossed :D )

Features:

- Hosted at http://shadiakiki1986.github.io/chemlambda-js/
- Lambda calculus interpreter
- Artificial chemistry based on graph rewrites in the browser
- It is a javascript implementation of [chemlabda-gui](https://github.com/chorasimilarity/chemlambda-gui/blob/gh-pages/dynamic/README.md)
  - Please check there for more details on the original work of the author.

This project is WIP. Check [CHANGELOG](CHANGELOG.md) for more details.


## Goals

The aim is to build a working prototype of a framework for molecular (DNA?) computing. Functions and values are implemented as 3D structures. Interaction between functions and values is implemented with graph re-writes. These graph re-writes correspond to chemical reactions that modify the original 3D structure. The resultant 3D structure would be a representation of a new function/value.


## Usage

In the browser:

1. Open `index.html` in a browser (or hosted version at http://shadiakiki1986.github.io/chemlambda-js/).
2. Choose one of the lambda calculus examples in the top right dropdown
3. Click `Load` (this will also display the graph for the defaults in the example)
4. Read the title, description, and javascript implementation of the loaded example in the left pane
5. Choose the suitable visualization options or modify the lambda terms implementation
6. Click `Run`
7. Read the displayed graph
8. Add re-writes in the text box in the lower left pane, or select suggested re-writes in the top-middle dropdown
9. Click `Run` again
10. You can also choose to execute `Randomly selected re-writes` and roll out 25 such choices


In nodejs:

First, follow the installation instructions in `Testing` below, then run

```
var lt = require('LambdaTerms')
console.log(lt.lc_true) // this is an example "true" from lambda calculus implemented in javascript

var lr = require('LambdaReader')
lr.... # API to be documented here later
```


## Testing

The implemented unit tests can be run via nodejs:

1. Install dependencies

```
# check ndoejs
> nodejs --version
v8.10.0

# install nvm
> curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.34.0/install.sh | bash
# check if ok
> command -v nvm
nvm
# check version
> nvm --version
0.31.7

# install more up-to-date nodejs and its bundled npm (by using the version in .nvmrc)
> nvm install node
# check version
> nvm run node --version
Running node v11.14.0 (npm v6.7.0)

# install packages from npm
> nvm use node
> npm install mocha esprima

# not sure why in aws cloud9 we need this
> mv /home/ubuntu/package-lock.json .
> mv /home/ubuntu/node_modules .
> rm /home/ubuntu/npm-debug.log.*
```

2. Launch tests

```
> ./node_modules/mocha/bin/mocha
```


## License

Similar to [chemlabda-gui](https://github.com/chorasimilarity/chemlambda-gui/)


## Related

- chorasimilarity's [chemlabda-gui](https://github.com/chorasimilarity/chemlambda-gui/)
    - my [chemlmabda-awk](https://github.com/shadiakiki1986/chemlambda-awk/): a small clean-up of `chemlambda-gui`
- jacksongl's [lambda calculus interpreter](https://jacksongl.github.io/files/demo/lambda/index.htm#firstPage) ([src](https://github.com/JacksonGL/jacksongl.github.io/tree/master/files/demo/lambda))
