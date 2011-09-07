Installation
------------

Install Node.JS, npm, nodeunit(for nodeunit command line)

then

    npm install express
    npm install expresso
    npm install socket.io
    npm install nodeunit
    npm install coffee-script
    npm install uglify-js

#### Starting the server

    node lib/hwdbservice.min.js

Development
-----------

To autogenerate CoffeeScript as you write it, call

    cake watch

Build tests with

    cake build:test

and run them with

    nodeunit test/js/hwdbservice_test.js
