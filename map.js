// read in data
var files = ["./data/beijing.json", 
                "./data/daily.json", 
                "./data/district.json", 
                "./data/station.json", 
                "./data/time.json"];

Promise.all(files.map(url => d3.json(url))).then(function(data) {
    myVis(data[0], 
            data[1].map(d => d[0]), 
            data[2].map(d => d[0]), 
            data[3].map(d => d[0]), 
            data[4].map(d => d[0])
    );
});


function myVis(beijing, daily, district, station, time) {

    console.log("Start drawing");

    var margin = {top: 80, bottom: 50, left: 30, right: 30}
    var width = 1200 - margin.left - margin.right;
    var height = 600 - margin.top - margin.bottom;
    var padding = 20;
 
    var formatDateIntoYear = d3.timeFormat("%Y");
    var formatDateDisplay = d3.timeFormat("%b %Y");
    var formatDate = d3.timeFormat("%Y%m%d");
    var startDate = new Date("2014-01-01 00:00:00");
    var endDate = new Date("2018-12-31 00:00:00");
    var formatDecimal = d3.format(".2f");
    var parser = d3.timeParse("%Y%m%d");

    daily.forEach(function(d) {
        d.date = parser(d.date);
    });

    var counter = 0

    time.forEach(function(d) {
        d.date = parser(d.date);
        d.id = counter;
        counter += 1;
    });


    var color = d3.scaleQuantize()
                    .domain([50, 200])
                    // .range(["#92AAC7", "#A1BE95", "#E2DFA2", "ED5752"]);
                    // .range(["#486824", "#F2C057", "#D13525", "#4C3F54"]);
                    .range(["#f1eef6", "#bdc9e1", "#74a9cf", "#0570b0", "#005073"]);
                    // .domain([ 
                    //             d3.min(district, function(d) {return d.value; }),
                    //             d3.max(district, function(d) {return d.value; })
                    // ]);

    var x = d3.scaleTime()
                .domain([startDate, endDate])
                .range([margin.left, width - margin.right])
                .clamp(true);


    var svg0 = d3.select("body")
                    .append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height /2 + margin.top + margin.bottom)
                    .attr("transform", "translate(" + 0 + "," + 0 + ")");
        
    // ---begin draw slider---
    // ref: https://bl.ocks.org/officeofjane/47d2b0bfeecfcb41d2212d06d095c763
    // https://bl.ocks.org/officeofjane/f132634f67b114815ba686484f9f7a77

    // draw ticks 
    var sliderAxis = d3.axisBottom()
                        .scale(x)
                        .ticks(5);

    svg0.append("g")
            .attr("class", "slideraxis")
            .attr("transform", "translate(" + margin.left + ", " + (0.5 * height)  + ")")
            .attr("id", "sliderAxis")
            .call(sliderAxis);

    // draw actual slider 
    var slider = svg0.append("g")
                        .attr("class", "slider")
                        .attr("transform", "translate(" + margin.left + "," + (0.5 * height) + ")");

    slider.append("line")
            .attr("class", "track")
            .attr("x1", x.range()[0])
            .attr("x2", x.range()[1])
          .select(function() { 
                return this.parentNode.appendChild(this.cloneNode(true)); 
            })
            .attr("class", "track-inset")
          .select(function() { 
                return this.parentNode.appendChild(this.cloneNode(true)); 
            })
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
            .attr("y", 10)
            .attr("text-anchor", "middle")
            .attr("class", "label")
            .text(function(d) { 
                return formatDateIntoYear(d); 
            });

    // draw handle and slider labels
    var handle = slider.insert("circle", ".track-overlay")
                            .attr("class", "handle")
                            .attr("cx", x.range()[0])
                            .attr("r", 6);

    var sliderLabel = slider.append("text")
                                .attr("class", "label")
                                .attr("text-anchor", "middle")
                                .text(formatDateDisplay(startDate))
                                .attr("transform", "translate(" + 0 + "," + (15) + ")");
    // ---end drawing slider---

    // add title
    svg0.append("text")
            .attr("x", width/2)
            .attr("y", margin.top/2)
            .attr("class", "title")
            .attr("text-anchor", "middle")
            .text("Air Quality Index in Beijing, China");

    // draw histrogram
    // ref:https://bl.ocks.org/d3noob/96b74d0bd6d11427dd797892551a103c
    // https://bl.ocks.org/officeofjane/f132634f67b114815ba686484f9f7a77

    function drawhist(h) {

        var histogram = d3.histogram()
                            .value(function(d) { 
                                return d.date; 
                            })
                            .domain(x.domain())
                            .thresholds(x.ticks(d3.timeMonth));

        var hist = svg0.append("g")
                        .attr("class", "histogram")
                        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var bins = histogram(daily).map(d => {
                            return {...d, sum: d.reduce((acc,row) => acc + row.value, 0) || 0, 
                                          cnt: d.reduce((acc,row) => acc + 1, 0) || 0};
                          });

        var histHeight = 0.31 * height;
        var y = d3.scaleLinear()
                        .range([histHeight, 0])
                        .domain([0, d3.max(bins, function(d) {return (d.sum/d.cnt); })]);

        var bar = hist.selectAll(".bar")
                          .data(bins)
                          .enter()
                          .append("g")
                          .attr("transform", function(d) {
                                return "translate(" + x(d.x0) + "," + y(d.sum/d.cnt) + ")";
                          });

        var div0 = d3.select("body")
                        .append("div")
                        .attr("class", "tooltip0")
                        .style("opacity", 0);

        bar.append("rect")
                .attr("x", 1)
                .attr("width", function(d) { 
                    return x(d.x1) - x(d.x0) ; })
                .attr("height", function(d) { 
                    return histHeight - y(d.sum/d.cnt); })
                .attr("fill", function(d) { 
                    // change color when selected
                    if (formatDateDisplay(d.x0) === formatDateDisplay(+h)){
                        return "#EC96A4";
                    } else {
                        return color(d.sum/d.cnt); 
                }})
                .attr("stroke", "#929292")
                .attr("stroke-width", "0.5px")
                .on("mouseover", function(d) {
                    d3.select(this)
                        .style("stroke-width", "2px")
                        .style("fill", "#A1BE95");
                    div0.transition()
                        .duration(100)
                        .style("opacity", "0.8");
                    div0.html(formatDateDisplay(d.x0) + "<br/>" 
                        + "AQI:" + formatDecimal(d.sum/d.cnt))
                        .style("left", (d3.event.pageX + 20) + "px" )
                        .style("top", (d3.event.pageY - 20) + "px");
                    })
                .on("mouseout", function(d) {
                    d3.select(this)
                        .style("stroke-width", "0.5px")
                        .style("fill", function(d){
                           return color(d.sum/d.cnt)
                        });
                    div0.transition()
                        .duration(100)
                        .style("opacity", 0);
                });

        // draw y axis
        var yAxisLeft = d3.axisLeft()
                        .scale(y)
                        .tickValues([50, 100, 150]);

        var yAxisRight = d3.axisRight()
                .scale(y)
                .tickValues([50, 100, 150]);

        svg0.append("g")
                .attr("class", "axis")
                .attr("transform", "translate(" + margin.left * 2 + ", " + margin.top  + ")")
                .call(yAxisLeft);

        svg0.append("g")
                .attr("class", "axis")
                .attr("transform", "translate(" + width + ", " + margin.top  + ")")
                .call(yAxisRight);

        svg0.append("text")
            .attr("x", 20)
            .attr("y", 75)
            .attr("class", "label")
            .text("Monthly AQI");
    }


    var svg1 = d3.select("body")
                    .append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height)
                    .attr("transform", "translate(" + 0 + "," + (-80    ) + ")")
                    .attr("id","id_1");;

    // add legends
    function addlegend() {

        var legendVals = ["Daily AQI Range",  
                            "0-50", "50-150", "150-250", "250-500", ">500",
                            "Observation Station"];

        var legendCols = ["#FFFFFF", 
                            "#f1eef6", "#bdc9e1", "#74a9cf", "#0570b0", "#005073",
                            "#EC96A4"];

        var legend = svg1.selectAll(".legend")
                            .data(legendVals)
                            .enter()
                            .append("g")
                            .attr("class", "legend")
                            .attr("transform", function (d, i) {
                                return "translate(0," + i * 25 + ")"
                            });
        
        legend.append("rect")
                .attr("x", margin.left * 6)
                .attr("y", margin.top  * 1.5)
                .attr("width", 10)
                .attr("height", 10)
                .style("fill", function (d, i) {
                    return legendCols[i]
                });
        
        legend.append("text")
                .attr("x", margin.left * 7)
                .attr("y", margin.top  * 1.5 + 9)
                .text(function (d, i) {
                    return d
                })
                .attr("class", "legend");
    }

    // prep for drawmap function
    var rScale = d3.scaleLinear()
                    .domain([ 
                            d3.min(station, function(d) { return d.value; }),
                            d3.max(station, function(d) { return d.value; })])
                    .range([2, 7]);

    var projection = d3.geoMercator()
                        .center([116, 39])
                        .scale([10000])
                        .translate([width/2 - 50, height/2 + 250])
                        .precision([.1]);

    var path = d3.geoPath()
                    .projection(projection);

    var div1 = d3.select("body")
                    .append("div")
                    .attr("class", "tooltip1")
                    .style("opacity", 0);


    function drawmap(h, show) {
        // if (show === false) {
        //     svg1.attr("opacity", 0);
        // }

        var subset = district.filter((row) => row.date === +h);
        
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
                    return color(d.properties.value);
                })
                .style("stroke", "#929292")
                .style("stroke-width", "0.5px")
                .on("mouseover", function(d) {
                    d3.select(this)
                        .style("stroke-width", "2px")
                        .style("fill", "#A1BE95");
                    div1.transition()
                        .duration(100)
                        .style("opacity", 0.8);
                    div1.html("Date:" + h + "<br/>"
                                + "District: " + d.properties.abb + "<br/>"
                                + "AQI: "+ d.properties.value)
                        .style("left", (d3.event.pageX + 30) + "px")
                        .style("top", (d3.event.pageY - 30) + "px");
                })
                .on("mouseleave", function(d) {
                    d3.select(this)
                        .style("stroke-width", "0.5px")
                        .style("fill", function(d){
                           return color(d.properties.value);
                        })  
                    div1.transition()
                        .duration(100)
                        .style("opacity", 0);   
                });

        // station part
        var subset = station.filter((row) => row.date === +h);

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
                .attr("class", "circleStation")
                .on("mouseover", function(d) {
                    d3.select(this)
                        .attr("r", 10)
                        .style("stroke", "#929292")
                        .style("fill", "#A1BE95");
                    div1.transition()
                        .duration(100)
                        .style("opacity", 0.8);
                    div1.html("Date:" + d.date + "<br/>"
                                + "District: " + d.district + "<br/>"
                                + "AQI: "+ d.value)
                        .style("left", (d3.event.pageX + 30) + "px")
                        .style("top", (d3.event.pageY - 30) + "px");
                })
                .on("mouseout", function(d){
                    d3.select(this)
                        .attr("r", function(d) {
                            return rScale(d.value);
                        })
                        .style("stroke", "none")
                        .style("fill", "#EC96A4");
                    div1.transition()
                        .duration(100)
                        .style("opacity", 0);
                });     
    }


    // silder update function 
    function update(h) {
        handle.attr("cx", x(h));
        sliderLabel.attr("x", x(h))
                    .text(formatDateDisplay(h));
        drawmap(formatDate(h), true);
        drawhist(h);
    }


    // var yScale = d3.scaleTime()
    //                 .domain([
    //                         d3.min(time, function(d) { return d.date; }), 
    //                         d3.max(time, function(d) {return d.date;})])
    //                 .range([margin.top, height - margin.bottom])
    //                 .nice();

    // var yAxis0 = d3.axisRight()
    //                 .scale(yScale)
    //                 .ticks(5);

    var svg2 = d3.select("body")
                    .append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                    .attr("transform", "translate(" + 0 + "," + (-550) + ")")
                    .attr("id","id_2");

    function drawrunning(show) {

        var yScale = d3.scaleOrdinal()
                            .domain(["good", "fair", "unhealthy", "dangerous"])
                            .range([margin.left + 0.05 * width, margin.left + 0.3 * width, 
                                    margin.left + 0.55 * width, margin.left + 0.8 * width]);


        var yAxis = d3.axisBottom()
                        .scale(yScale)
                        .tickValues(["good", "fair", "unhealthy", "dangerous"]);

        var y = svg2.append("g")
                        .attr("class", "axis")
                        .attr("transform", "translate(" + 0 + "," + 300 + ")")
                        .call(yAxis);

        allCircles = svg2.selectAll("circle")
                            .data(time)
                            .enter()
                            .append("circle")
                            .attr("cx", function(d) {
                                return (margin.left + x(d.date));
                            })
                            .attr("cy", 10)
                            .attr("r", 5)
                            .attr("class", "circle")
                            .each(running);

        // ref: https://bl.ocks.org/officeofjane/47d2b0bfeecfcb41d2212d06d095c763
        function running (d, i) {

            d3.select(this)
                .transition()
                .delay(i * 1)
                .duration(200)
                .ease(d3.easeElasticOut)
                .attr("cy", 10)
                .attr("cx", function(d) {
                    return (margin.left + x(d.date));
                    })
                .attr("r", 5)
                .attr("class", "circle")
                .text(function(d) {
                        return d.date
                    })
                .transition()
                    .ease(d3.easeLinear)
                    .duration(1000)
                    .attr("cx", function(d) {
                        if (d.category === "good"){ return yScale.range()[0] + i * 0.1 }
                        if (d.category === "fair"){ return yScale.range()[1] + i * 0.1}
                        if (d.category === "unhealthy"){ return yScale.range()[2] + i * 0.1 }
                        if (d.category === "dangerous"){ return yScale.range()[3] + i * 0.1 }
                        else { return yScale.range()[0] + i * 0.1 }
                    })
                    .attr("cy", 300)
                    .style("fill", function(d) {
                        if (d.category === "good"){ return "#486824" }
                        if (d.category === "fair"){ return "#F2C057" }
                        if (d.category === "unhealthy"){ return "#D13525" }
                        if (d.category === "dangerous"){ return "#4C3F54" }
                        else { return "#486824" }
                    });
            }
    }

    // initialize everything
    // addlegend(); 
    // drawmap(formatDate(startDate), true);
    drawhist(startDate);

    var playButton = d3.select("body")
                            .append("button")
                            .text("Play")
                            .attr("class", "button")
                            .on("click", function(){
                                var button = d3.select(this);
                                if (button.text() === "Play") {
                                    d3.select(this)
                                        .style("background-color", "#ccc")
                                        .text("Return");   
                                    // d3.select("#id_1").remove();          
                                    // drawmap(formatDate(startDate), false);
                                    drawrunning(true);
                                } else {
                                    d3.select(this)
                                        .style("background-color", "#EC96A4")
                                        .text("None");
                                    d3.select("#id_2").remove(); 
                                    // drawrunning(false);
                                    addlegend(); 
                                    drawmap(formatDate(startDate), true);
                                    
                                }
                            });

}