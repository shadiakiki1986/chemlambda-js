# chemlambda-js

[![Build Status](https://travis-ci.org/shadiakiki1986/chemlambda-js.svg?branch=master)](https://travis-ci.org/shadiakiki1986/chemlambda-js)

Artificial chemistry based on graph rewrites in the browser

A javascript implementation of [chemlabda-gui](https://github.com/chorasimilarity/chemlambda-gui/blob/gh-pages/dynamic/README.md)

It is WIP. Check [CHANGELOG](CHANGELOG.md) for more details.

Please check the original repository for more details on the work of the author.

It is licensed similarly to the original repository, `chemlambda-gui`.

Related reopsitory: [chemlmabda-awk](https://github.com/shadiakiki1986/chemlambda-awk/)


## Usage

In the browser:

Open `index.html` in a browser (or hosted version [here](http://www.teamshadi.net/chemlambda-js/)) and follow the instructions on the page


In nodejs:

First, follow the installation instructions in `Testing` below, then run

```
var lt = require('LambdaTerms')
console.log(lt.lc_true)

var lr = require('LambdaReader')
lr.... # API to be documented here later
```


## Testing

Install dependencies

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

Launch tests

```
> ./node_modules/mocha/bin/mocha
```


## License

Similar to [chemlabda-gui](https://github.com/chorasimilarity/chemlambda-gui/)


## Related

- chorasimilarity's [chemlabda-gui](https://github.com/chorasimilarity/chemlambda-gui/)
- jacksongl's [lambda calculus interpreter](https://jacksongl.github.io/files/demo/lambda/index.htm#firstPage) ([src](https://github.com/JacksonGL/jacksongl.github.io/tree/master/files/demo/lambda))
