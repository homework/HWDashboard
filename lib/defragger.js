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
      fragCount++;
    }
    Defragger.prototype.push = function(frag_count, data) {
      if (frag_count === fragCount + 1) {
        fullData += data;
        fragCount++;
      }
      return fragCount;
    };
    Defragger.prototype.getData = function() {
      return fullData;
    };
    return Defragger;
  })();
  exports.defragger = Defragger;
}).call(this);
