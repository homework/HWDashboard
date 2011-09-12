(function() {
  var arc, arcs, color, data, donut, h, paths, r, tweenDonut, tweenPie, vis, w;
  tweenPie = function(b) {
    var i;
    b.innerRadius = 0;
    i = d3.interpolate({
      startAngle: 0,
      endAngle: 0
    }, b);
    return function(t) {
      return arc(i(t));
    };
  };
  tweenDonut = function(b) {
    var i;
    b.innerRadius = r * .6;
    i = d3.interpolate({
      innerRadius: 0
    }, b);
    return function(t) {
      return arc(i(t));
    };
  };
  w = 600;
  h = 600;
  r = Math.min(w, h) / 2;
  data = d3.range(5).map(Math.random);
  color = d3.scale.category20();
  arc = d3.svg.arc().outerRadius(r);
  donut = d3.layout.pie();
  vis = d3.select("body").append("svg:svg").data([data.sort(d3.descending)]).attr("width", w).attr("height", h);
  arcs = vis.selectAll("g.arc").data(donut).enter().append("svg:g").attr("class", "arc").attr("transform", "translate(" + r + "," + r + ")");
  paths = arcs.append("svg:path").attr("fill", function(d, i) {
    return color(i);
  });
  paths.transition().ease("bounce").duration(2000).attrTween("d", tweenPie);
  paths.transition().ease("elastic").delay(function(d, i) {
    return 2000 + i * 50;
  }).duration(750).attrTween("d", tweenDonut);
}).call(this);
