// read in data
var files = ["./data/beijing.json", "./data/district.json", "./data/station.json", "./data/polluant.json"];

Promise.all(files.map(url => d3.json(url))).then(function(data) {
    myVis(data[0], data[1].map(d => d[0]), data[2].map(d => d[0]), data[3].map(d => d[0]));
});


function myVis(beijing, district, station, polluant) {

    console.log("Start drawing");

    var margin = {top: 80, bottom: 50, left: 30, right: 30}
    var width = 1200 - margin.left - margin.right;
    var height = 600 - margin.top - margin.bottom;
    var padding = 20;
 
   	// draw slider
   	// ref: https://bl.ocks.org/officeofjane/47d2b0bfeecfcb41d2212d06d095c763
    var formatDateIntoYear = d3.timeFormat("%Y");
    var formatDateDisplay = d3.timeFormat("%b %Y");
    var formatDate = d3.timeFormat("%Y%m%d");
    var startDate = new Date("2014-01-01 00:00:00"),
        endDate = new Date("2018-12-31 00:00:00");

    var svg0 = d3.select("body")
                    .append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height/3 + margin.top + margin.bottom)
                    .attr("transform", "translate(" + 0 + "," + 0 + ")");
        
    var x = d3.scaleTime()
                .domain([startDate, endDate])
                .range([margin.left, width - margin.right])
                .clamp(true);

    // draw ticks 
    var xAxis = d3.axisBottom()
                    .scale(x)
                    .ticks(5);

    svg0.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(" + margin.left + ", " + (height / 2 - 50)  + ")")
        .call(xAxis);

    // draw actual slider 
    var slider = svg0.append("g")
        .attr("class", "slider")
        .attr("transform", "translate(" + margin.left + "," + (height / 2 - 50) + ")");

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
            .attr("transform", "translate(" + 100 + "," + 15 + ")")
          .selectAll("text")
            .data(x.ticks(5))
            .enter()
            .append("text")
            .attr("x", x)
            .attr("y", 5)
            .attr("text-anchor", "middle")
            .attr("class", "label")
            .text(function(d) { return formatDateIntoYear(d); });

    // draw handle and slider labels
    var handle = slider.insert("circle", ".track-overlay")
                        .attr("class", "handle")
                        .attr("cx", x.range()[0])
                        .attr("r", 6);

    var sliderLabel = slider.append("text")
                                .attr("class", "label")
                                .attr("text-anchor", "middle")
                                .text(formatDateDisplay(startDate))
                                .attr("transform", "translate(" + 0 + "," + (-15) + ")");

    // add title
    svg0.append("text")
            .attr("x", margin.left + padding)
            .attr("y", margin.top)
            .attr("class", "title")
            .text("Air Quality Index in Beijing, China");


    // draw map
    // ref:textbook
    var rScale = d3.scaleLinear()
                    .domain([ 
                                d3.min(station, function(d) {return d.value; }),
                                d3.max(station, function(d) {return d.value; })
                    ])
                    .range([2, 7]);

    var svg1 = d3.select("body")
                    .append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                    .attr("transform", "translate(" + 0 + "," + 0 + ")");

    var projection = d3.geoMercator()
                        .center([116, 39])
                        .scale([10000])
                        .translate([width/2 - 50, height/2 + 250])
                        .precision([.1]);

    var path = d3.geoPath()
                    .projection(projection);

    var color = d3.scaleQuantize()
                    .domain([50, 200])
                    // .range(["#92AAC7", "#A1BE95", "#E2DFA2", "ED5752"]);
                    // .range(["#486824", "#F2C057", "#D13525", "#4C3F54"]);
                    .range(["#f1eef6", "#bdc9e1", "#74a9cf", "#0570b0", "#005073"]);
                    // .domain([ 
                    //             d3.min(district, function(d) {return d.value; }),
                    //             d3.max(district, function(d) {return d.value; })
                    // ]);

    var div = d3.select("body")
                    .append("div")
                    .attr("class", "tooltip")
                    .style("opacity", 0);


    // big update function 
    function update(h) {

        handle.attr("cx", x(h));
        sliderLabel.attr("x", x(h))
                    .text(formatDateDisplay(h));

        var sliderDate = formatDate(h);
        var subset = district.filter((row) => row.date === +sliderDate);
        
        // map AQI to geojson
        var mapMap = {};
        for (var i = 0; i < subset.length; i ++ ) {
            var dataDistrict = subset[i].district;
            var dataValue = subset[i].value;
            mapMap[dataDistrict] = dataValue;

        }

        for (var j = 0; j < beijing.features.length; j ++ ) {
            var jsonDistrict = beijing.features[j].properties.abb;
            beijing.features[j].properties.value = mapMap[jsonDistrict]; 
            // console.log(beijing.features[j].properties.value);
            // if (dataDistrict === jsonDistrict) {
            //     beijing.features[j].properties.value = dataValue;
            //     break;
            // }
        }

        // district part
        var update0 = svg1.selectAll("path")
                            .data(beijing.features);

        var enter0 = update0.enter()
                            .append("path");

        var exit0 = update0.exit();


        exit0.remove();

        // ref: https://www.d3-graph-gallery.com/graph/interactivity_tooltip.html
        update0.merge(enter0)
                .attr("d", path)
                .attr("class", "map")
                .style("fill", function(d) {
                    var value = d.properties.value;
                    if (value) {
                        return color(value);
                    } else {
                        return "#FFFFFF";
                    }
                })
                .on("mouseover", function(d) {
                    d3.select(this)
                        .style("stroke", "#929292")
                        .style("fill", "#A1BE95");
                })
                .on("mouseout", function(d) {
                    d3.select(this)
                        .style("stroke", "none")
                        .style("fill", function(d){
                           return color(d.properties.value);
                        })
                });


        // station part
        var subset = station.filter((row) => row.date === +sliderDate);

        var update1 = svg1.selectAll("circle")
                .data(subset);

        var enter1 = update1.enter()
                .append("circle");

        var exit1 = update1.exit();

        exit1.remove();
        update1.merge(enter1)
                .attr("cx", function(d) {
                    return projection([d.lon, d.lat])[0];
                    })
                .attr("cy", function(d) {
                    return projection([d.lon, d.lat])[1];
                    })
                .attr("r", function(d) {
                    return rScale(d.value);
                })
                .attr("class", "circle")
                .on("mouseover", function(d) {
                    div.transition()
                        .duration(100)
                        .style("opacity", 0.5);
                    div.html("Date:" + d.date + "<br/>"
                                + "District: " + d.district + "<br/>"
                                + "AQI: "+ d.value)
                        .style("left", (d3.event.pageX) + "px")
                        .style("top", (d3.event.pageY - 30) + "px");
                })
                .on("mouseout", function(d){
                    div.transition()
                        .duration(100)
                        .style("opacity", 0);
                });

    }

    // var svg2 = d3.select("body")
    //             .append("svg")
    //             .attr("width", width + margin.left + margin.right)
    //             .attr("height", height + margin.top + margin.bottom)
    //             .attr("transform", "translate(" + 0 + "," + 0 + ")");

    // svg2.append("text")
    //     .attr("x", margin.left + padding)
    //     .attr("y", margin.top / 4)
    //     .attr("class", "title")
    //     .text("This silder is still under construction!!! The values are not updated as expected.");




    // var svg2 = d3.select("body").append("svg")
    // .attr("width", width + margin.left + margin.right)
    // .attr("height", height + margin.top + margin.bottom)
    // .append("g")
    // .attr("transform",
    // "translate(" + margin.left + "," + margin.top + ")");


    // // add data sourcing
    // svg.append("text")
    //     .attr("x", width - margin.right * 12)
    //     .attr("y", height - margin.bottom * 2)
    //     .attr("class", "source")
    //     .text("National Urban Air Quality in Real-Time Publishing Platform");
}
