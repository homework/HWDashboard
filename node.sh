apt-get update
apt-get install g++ libssl-dev
git clone git://github.com/joyent/node.git
cd node
git checkout v0.4.11
./configure
make
make install
curl http://npmjs.org/install.sh | sh
cd ..
rm -rf node
npm install forever express socket.io
