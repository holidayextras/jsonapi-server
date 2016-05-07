
window.drawDependencyGraph = function(path, graph) {
  var width  = 500;
  var height = 500;
  var colors = d3.scale.category10();
  var svg = d3.select(path)
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  var force = d3.layout.force()
      .nodes(graph.nodes)
      .links(graph.links)
      .size([width, height])
      .linkDistance(100)
      .charge(-5000)
      .on('tick', tick)
      .start()

  svg.append('svg:defs').append('svg:marker')
      .attr('id', 'end-arrow-0')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 6)
      .attr('markerWidth', 3)
      .attr('markerHeight', 3)
      .attr('orient', 'auto')
    .append('svg:path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#000');

  svg.append('svg:defs').append('svg:marker')
      .attr('id', 'end-arrow-1')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 6)
      .attr('markerWidth', 3)
      .attr('markerHeight', 3)
      .attr('orient', 'auto')
    .append('svg:path')
      .attr('d', 'M0,-5L10,0L0,5M5,-5L15,0L5,5')
      .attr('fill', '#000');

  svg.append('svg:defs').append('svg:marker')
      .attr('id', 'start-arrow-0')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 4)
      .attr('markerWidth', 3)
      .attr('markerHeight', 3)
      .attr('orient', 'auto')
    .append('svg:path')
      .attr('d', 'M10,-5L0,0L10,5')
      .attr('fill', '#000');

  svg.append('svg:defs').append('svg:marker')
      .attr('id', 'start-arrow-1')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 4)
      .attr('markerWidth', 3)
      .attr('markerHeight', 3)
      .attr('orient', 'auto')
    .append('svg:path')
      .attr('d', 'M10,-5L0,0L10,5M15,-5L5,0L15,5')
      .attr('fill', '#000');

  // handles to link and node element groups
  var path = svg.append('svg:g').selectAll('path');
  var circle = svg.append('svg:g').selectAll('g');

  // update force layout (called automatically each iteration)
  function tick() {
    // draw directed edges with proper padding from node centers
    path.attr('d', function(d) {
      var deltaX = d.target.x - d.source.x,
          deltaY = d.target.y - d.source.y,
          dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY),
          normX = deltaX / dist,
          normY = deltaY / dist,
          sourcePadding = d.left ? 40 : 35,
          targetPadding = d.right ? 40 : 35,
          sourceX = d.source.x + (sourcePadding * normX),
          sourceY = d.source.y + (sourcePadding * normY),
          targetX = d.target.x - (targetPadding * normX),
          targetY = d.target.y - (targetPadding * normY);
      return 'M' + sourceX + ',' + sourceY + 'L' + targetX + ',' + targetY;
    });

    circle.attr('transform', function(d) {
      return 'translate(' + d.x + ',' + d.y + ')';
    });
  }

  path = path.data(graph.links);
  path.enter().append('svg:path')
    .attr('class', 'link')
    .style('marker-start', function(d) { return d.left ? 'url(#start-arrow-'+d.left+')' : ''; })
    .style('marker-end', function(d) { return d.right ? 'url(#end-arrow-'+d.right+')' : ''; })

  circle = circle.data(graph.nodes, function(d) { return d.id; });
  var g = circle.enter().append('svg:g');
  g.append('svg:circle')
    .attr('class', 'node')
    .attr('r', 35)
    .style('fill', function(d) { return d3.rgb(colors(d.id)).toString(); })
    .style('stroke', function(d) { return d3.rgb(colors(d.id)).darker().toString(); })

  g.append('svg:text')
      .attr('x', 0)
      .attr('y', 4)
      .attr('class', 'id')
      .text(function(d) { return d.type; });
};
