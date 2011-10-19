(function() {
  var Defragger;
  Defragger = (function() {
    var currentLength, fragCount, fragNo, fullData, totalLength;
    function Defragger() {}
    fragCount = 0;
    fragNo = 0;
    currentLength = 4;
    totalLength = 0;
    fullData = "";
    Defragger.prototype.getTotalLength = function() {
      return totalLength;
    };
    Defragger.prototype.setup = function(frag_no, total_length) {
      fragNo = frag_no;
      totalLength = total_length + 4;
      return fullData = new Buffer(total_length);
    };
    Defragger.prototype.push = function(frag_count, data) {
      if (frag_count === fragCount + 1) {
        data.copy(fullData, currentLength, 0, data.length);
        fragCount++;
        currentLength += data.length;
      }
      return fragCount;
    };
    Defragger.prototype.getData = function() {
      return fullData;
    };
    Defragger.prototype.reset = function() {
      fragCount = 0;
      fragNo = 0;
      currentLength = 4;
      totalLength = 0;
      return fullData = "";
    };
    return Defragger;
  })();
  exports.defragger = Defragger;
}).call(this);
