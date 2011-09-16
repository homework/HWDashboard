(function() {
  var Defragger;
  Defragger = (function() {
    var fragCount, fragNo, fullData, totalLength;
    fragCount = 0;
    fragNo = 0;
    totalLength = 0;
    fullData = "";
    function Defragger(frag_no, total_length) {
      fragNo = frag_no;
      totalLength = total_length;
      console.log("Initialized defragger: Length " + totalLength + ", Count " + fragNo);
      fragCount++;
    }
    Defragger.prototype.push = function(frag_count, data) {
      console.log("Got", frag_count);
      console.log("Before", fullData.length, "of", totalLength);
      if (frag_count === fragCount + 1) {
        fullData += data;
        fragCount++;
      }
      return console.log("After", fullData.length, "of", totalLength);
    };
    Defragger.prototype.getData = function() {
      return fullData;
    };
    return Defragger;
  })();
  exports.defragger = Defragger;
}).call(this);
