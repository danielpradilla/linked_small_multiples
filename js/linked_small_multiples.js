var linked_small_multiples = function() {

	var width = 150;
	var height = 120;
	var margin = {top: 15, right: 10, bottom: 40, left: 35};
	var data = [];

	var format = d3.time.format("%Y");

	var display = function(error, rawData) {
		var data = transformData(rawData);
		var selection = d3.select('#vis').datum(data);
		drawChart(selection);
		setupIsoytpe(); // the Isotope library allows for reordering ov div
	};

	var transformData = function(rawData) {
		rawData.forEach(function(d){
			d.date = format.parse(d.year);
			d.n = +d.n;
		});
		var nest = d3.nest()
			.key(ƒ('category'))
			.sortValues(function(a,b){ return d3.ascending(a.date,b.date);})
			.entries(rawData);
		return nest;
	};

	var drawChart = function(selection){

		var xValue = ƒ('date');
		var yValue = ƒ('n');
		var xScale = d3.time.scale().range([0, width]);
		var yScale = d3.scale.linear().range([height,0]);

		var area = d3.svg.area()
			.x(function(d) {return xScale(xValue(d));})
			.y0(height)
			.y1(function(d){return yScale(yValue(d));});

		var line = d3.svg.line()
			.x(function(d) {return xScale(xValue(d));})
			.y(function(d){return yScale(yValue(d));});

		var yAxis = d3.svg.axis()
			.scale(yScale)
			.orient("left").ticks(4)
			.outerTickSize(0)
			.tickSubdivide(1)
			.tickSize(-width);

		//a bisector returns where in the object the corresponding date is.
		var bisect = d3.bisector(ƒ('date')).left;

		var setupScales = function(data) {
			var maxY = d3.max(data, function(c){return d3.max(c.values, function(d) {return yValue(d);})});
			maxY = maxY + (maxY * 1/4);
	  		yScale.domain([0,maxY]);
	 		extentX = d3.extent(data[0].values, function(d){ return xValue(d);});
	  		xScale.domain(extentX);
		};


		selection.each(function(data, i){
			//create a div for each element in the data array
			var div = d3.select(this).selectAll('.chart').data(data)
			div.enter().append('div').attr('class','chart')
				.append('svg').append('g')
			svg = div.select('svg')
				.attr('width', width + margin.left + margin.right)
				.attr('height', height + margin.top + margin.bottom);
			g = svg.select('g')
				.attr('transform', 'translate('+margin.left+','+margin.top+')');



			setupScales(data);

			//paint chart
			lines = g.append("g");
		    lines.append("path")
				.attr("class", "area")
				.style("pointer-events", "none")
				.attr("d", function(c){ return area(c.values);});
		 
		    lines.append("path")
				.attr("class", "line")
				.style("pointer-events", "none")
				.attr("d", function(c){ return line(c.values);});

			//add x Axis labels
			lines.append("text")
				.attr("class", "title")
				.attr("text-anchor", "middle")
				.attr("y", height)
				.attr("dy", margin.bottom / 2 + 5)
				.attr("x", width / 2)
				.text(ƒ('key'));

			lines.append("text")
				.attr("class", "static_year")
				.attr("text-anchor", "start")
				.style("pointer-events", "none")
				.attr("dy", 13)
				.attr("y", height)
				.attr("x", 0)
				.text(function(c){ return xValue(c.values[0]).getFullYear(); });

			lines.append("text")
				.attr("class", "static_year")
				.attr("text-anchor", "end")
				.style("pointer-events", "none")
				.attr("dy", 13)
				.attr("y", height)
				.attr("x", width)
				.text(function(c) {return xValue(c.values[c.values.length-1]).getFullYear(); });

			//add Y axis
			g.append('g')
				.attr('class','y axis')
				.call(yAxis);

			//add scrubbing elements
			var circle = lines.append("circle")
				.attr("r", 2.2)
				.attr("opacity", 0)
				.style("pointer-events", "none");

			var caption = lines.append("text")
				.attr("class", "caption")
				.attr("text-anchor", "middle")
				.style("pointer-events", "none")
				.attr("dy", -8);

			var curYear = lines.append("text")
				.attr("class", "year")
				.attr("text-anchor", "middle")
				.style("pointer-events", "none")
				.attr("dy", 13)
				.attr("y", height);

			var mouseover = function() {
				circle.attr("opacity", 1.0);
				d3.selectAll(".static_year").classed("hidden", true);
				mousemove.call(this);
			};

			var mouseout = function(){
				d3.selectAll(".static_year").classed("hidden", false);
				circle.attr("opacity", 0);
				caption.text("");
				curYear.text("");
			};

			var mousemove = function() {
				var year = xScale.invert(d3.mouse(this)[0]).getFullYear()
				var date = format.parse('' + year);
				var index= 0;
				/*
				we use bisect to get the index into the values array for the currently selected date. 
				Then we feed the yValue for that position (the count) into our yScale 
				to get the y position for the circle and value annotations. 
				*/
				circle.attr('cx',xScale(date))
					.attr('cy',function(c){
						index = bisect(c.values, date, 0, c.values.length - 1);
						return yScale(yValue(c.values[index]));
					});
				caption.attr('x',xScale(date))
					.attr('y', function(c){return yScale(yValue(c.values[index])); })
					.text(function(c){ return yValue(c.values[index]);});
				curYear.attr('x', xScale(date))
					.text(year);
			};

			//invisible background rectangle that will capture all the mouse movements
			g.append('rect')
				.attr('class','background')
				.style("pointer-events", "all")
				.attr("width", width + margin.right )
				.attr("height", height)
				.on("mouseover", mouseover)
				.on("mousemove", mousemove)
				.on("mouseout", mouseout);



		});
	};

	var setupIsoytpe =  function(){
		$("#vis").isotope({
			itemSelector: '.chart',
			layoutMode: 'fitRows',
			getSortData: {
				count: function(e) {
					d = d3.select(e).datum();
					sum = d3.sum(d.values, ƒ('n'));
					return sum * -1; // reverse the sort so largest is first
				},
				name: function(e) {
					d = d3.select(e).datum();
					return d.key;
				}
			}
		});
		$("#vis").isotope({sortBy:'count'});
	};
 
  	

	queue()
	.defer(d3.tsv,"data/askmefi_category_year.tsv")
	.await(display);

};