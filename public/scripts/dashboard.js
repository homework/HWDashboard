(function() {
  var arc, arcs, b_h, b_w, barHeight, bars, color, data, donut, p_h, p_w, paths, r, tweenDonut, tweenPie, vis, x, y;
  tweenPie = function(b) {
    var i;
    b.innerRadius = 0;
    i = d3.interpolate({
      startAngle: 0,
      endAngle: 100
    }, b);
    return function(t) {
      return arc(i(t));
    };
  };
  tweenDonut = function(b) {
    var i;
    b.innerRadius = r * .7;
    i = d3.interpolate({
      innerRadius: 0
    }, b);
    return function(t) {
      return arc(i(t));
    };
  };
  p_w = 344;
  p_h = 344;
  r = p_w / 2;
  data = [
    {
      x: "TLodge",
      y: 40000
    }, {
      x: "TRodden",
      y: 60000
    }, {
      x: "RSpencer",
      y: 25000
    }, {
      x: "KGlover",
      y: 55000
    }, {
      x: "Mort",
      y: 65000
    }, {
      x: "RSpencer",
      y: 25000
    }, {
      x: "KGlover",
      y: 55000
    }, {
      x: "Mort",
      y: 65000
    }, {
      x: "RSpencer",
      y: 25000
    }, {
      x: "KGlover",
      y: 55000
    }, {
      x: "Mort",
      y: 65000
    }, {
      x: "RSpencer",
      y: 25000
    }, {
      x: "KGlover",
      y: 55000
    }, {
      x: "Mort",
      y: 65000
    }
  ];
  color = d3.scale.category20();
  arc = d3.svg.arc().outerRadius(r);
  donut = d3.layout.pie().value(function(d) {
    return d.y;
  });
  vis = d3.select("#pie_chart").append("svg:svg").data([data]).attr("width", p_w).attr("height", p_h);
  arcs = vis.selectAll("g.arc").data(donut).enter().append("svg:g").attr("class", "arc").attr("transform", "translate(" + r + "," + r + ")");
  paths = arcs.append("svg:path").attr("fill", function(d, i) {
    return color(i);
  });
  paths.transition().ease("elastic").duration(750).attrTween("d", tweenDonut);
  barHeight = 40;
  b_h = (barHeight + 10) * data.length;
  b_w = 528;
  console.log(b_h, b_w, data.length);
  x = d3.scale.linear().domain([
    0, d3.max(data, function(datum) {
      return datum.y;
    })
  ]).rangeRound([0, b_w]);
  y = d3.scale.linear().domain([0, data.length]).range([0, b_h]);
  bars = d3.select("#bar_graph").append("svg:svg").attr("width", b_w).attr("height", b_h);
  bars.selectAll("rect").data(data).enter().append("svg:rect").attr("y", function(datum, index) {
    return y(index);
  }).attr("height", barHeight).attr("width", function(datum) {
    return x(datum.y);
  }).attr("fill", "#2D578B");
}).call(this);
