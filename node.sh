apt-get update
apt-get install g++ libssl-dev
git clone git://github.com/joyent/node.git
cd node
git checkout v0.4
./configure
make
make install
#Make sure proxy is set
curl http://npmjs.org/install.sh | sh
npm install mysql log underscore express socket.io cron 
