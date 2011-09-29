Installation
------------

Install Node.JS, npm, nodeunit(for nodeunit command line)

then

    npm install express log now coffee-script uglify-js

#### Starting the server

    node lib/dashboard.js

Development 
-----------

To autogenerate CoffeeScript as you write it, call

    cake watch

for server development and

    coffee -o public/scripts public_src

for client development

