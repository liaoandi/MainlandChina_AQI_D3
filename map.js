
// d3.json("./data/beijing.json")
//     .then(function(geo_bj) {
//         console.log("Read in the first data!");
//         console.log(geo_bj); 
//         d3.json("./data/station.json")
//             .then(function(station) {
//                 console.log("Read in the second data!");
//                 console.log(station);
//                 myVis(geo_bj, station.map(d => d[0]));
//             })
//             .catch(function(error) {
//                 console.log(error);
//                 alert("Something went wrong!");
//             });
//         })
//     .catch(function(error) {
//         console.log(error);
//         alert("Something went wrong!");
//         });

var files = ["./data/beijing.json", "./data/district.json", "./data/station.json"];

Promise.all(files.map(url => d3.json(url))).then(function(data) {
    myVis(data[0], data[1].map(d => d[0]), data[2].map(d => d[0]));
});


function myVis(geo_bj, district, station) {

    console.log("Start drawing");

    var margin = {top: 80, bottom: 50, left: 30, right: 30}
    var width = 800 - margin.left - margin.right;
    var height = 600 - margin.top - margin.bottom;
    var padding = 20;
 
   	// draw slider
    var formatDateIntoYear = d3.timeFormat("%Y");
    var formatDateDisplay = d3.timeFormat("%b %Y");
    var formatDate = d3.timeFormat("%Y%m%d");
    var startDate = new Date("2014-01-01"),
        endDate = new Date("2018-12-31");

    var svg0 = d3.select("#slider")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height/3);
        
    var x = d3.scaleTime()
        .domain([startDate, endDate])
        .range([margin.left, width - margin.right])
        .clamp(true);

    var slider = svg0.append("g")
        .attr("class", "slider")
        .attr("transform", "translate(" + (margin.left) + "," + height / 6 + ")");

    slider.append("line")
            .attr("class", "track")
            .attr("x1", x.range()[0])
            .attr("x2", x.range()[1])
          .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
            .attr("class", "track-inset")
          .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
            .attr("class", "track-overlay")
            .call(d3.drag()
                .on("start.interrupt", function() { slider.interrupt(); })
                .on("start drag", function() { update(x.invert(d3.event.x)); }));

    slider.insert("g", ".track-overlay")
            .attr("class", "ticks")
            .attr("transform", "translate(" + 20 + "," + 20 + ")")
          .selectAll("text")
            .data(x.ticks(5))
            .enter()
            .append("text")
            .attr("x", x)
            .attr("y", 5)
            .attr("text-anchor", "middle")
            .attr("class", "label")
            .text(function(d) { return formatDateIntoYear(d); });

    var handle = slider.insert("circle", ".track-overlay")
                        .attr("class", "handle")
                        .attr("cx", x.range()[0])
                        .attr("r", 8);

    var label = slider.append("text")
    					.attr("class", "label")
    					.attr("text-anchor", "middle")
    					.text(formatDateDisplay(startDate))
    					.attr("transform", "translate(0, " + (-15) + ")");


    // draw map

    var rScale = d3.scaleLinear()
                    // .domain([60, 110])
                    .domain([ 
                        d3.min(station, function(d) {return d.AQI; }),
                        d3.max(station, function(d) {return d.AQI; })])
                    .range([1, 6]);
                    // .nice();

    var svg1 = d3.select("body")
                .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .attr("transform", "translate(" + 0 + "," + 0 + ")");

    var projection = d3.geoMercator()
                        .center([116, 39])
                        .scale([10000])
                        .translate([width/2 , height/2 + 250])
                        .precision([.1]);

    var path = d3.geoPath()
                    .projection(projection);

    var color = d3.scaleQuantize()
                    .domain([20, 500])
                    // .range(["#92AAC7", "#A1BE95", "#E2DFA2", "ED5752"]);
                    .range(["#486824", "#F2C057", "#D13525", "#4C3F54"]);
                    // .range(["F1F1F2", "#f1eef6", "#bdc9e1", "#74a9cf", "#0570b0", "#005073"]);
                //     .domain([ 
                //     d3.min(district, function(d) {return d.value; }),
                //     d3.max(district, function(d) {return d.value; })
                // ]);

        // not working
        svg1.selectAll("circle")
        .data(station)
        .enter()
        .append("circle")
        .attr("cx", function(d) {
            return projection([d.lon, d.lat])[0];
            })
        .attr("cy", function(d) {
            return projection([d.lon, d.lat])[1];
            })
        .attr("r", function(d) {
            return rScale(d.AQI);
            })
        .attr("class", "circle");

    function update(h) {
        handle.attr("cx", x(h));
        label.attr("x", x(h))
        		.text(formatDateDisplay(h));

        var slideDate = formatDate(h);
	    var subset = district.filter((row) => row.date === +slideDate);
	    
	    for (var i = 0; i < subset.length; i ++ ){
	        var dataDistrict = subset[i].district;
	        var dataValue = subset[i].value;

	        for (var j = 0; j < geo_bj.features.length; j ++ ) {
	            var jsonDistrict = geo_bj.features[j].properties.abb;

	            if (dataDistrict === jsonDistrict) {
	                geo_bj.features[j].properties.value = dataValue;
	                break;
	            }
	        }
	    }


        var update = svg1.selectAll("path")
                            .data(geo_bj.features)

        var enter = update.enter()
                            .append("path");

        var exit = update.exit();

        enter.attr("d", path)
                .attr("class", "map")
                .style("fill", function(d) {
                    var value = d.properties.value;;
                    if (value) {
                        return color(value);
                    } else {
                        return "#ccc";
                    }
                });


        exit.remove();

        update.merge(enter)
        		.style("fill", function(d) {
                    var value = d.properties.value;
                    console.log(value);
                    if (value) {
                        return color(value);
                    } else {
                        return "#F1F1F2";
                    }
                });;

    }


    // svg.append("text")
    //     .attr("x", margin.left + padding)
    //     .attr("y", margin.top / 4)
    //     .attr("class", "title")
    //     .text("This silder is still under construction!!! The values are not updated as expected.");

    // // add subtitle
    // svg.append("text")
    //     .attr("x", margin.left + padding)
    //     .attr("y", margin.top / 2 - 5)
    //     .attr("class", "subtitle")
    //     .text("There should be another plot from running,js, but how to place a new svg under the map?");

    // // add data sourcing
    // svg.append("text")
    //     .attr("x", width - margin.right * 12)
    //     .attr("y", height - margin.bottom * 2)
    //     .attr("class", "source")
    //     .text("National Urban Air Quality in Real-Time Publishing Platform");
}
