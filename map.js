// read in data
var files = ["./data/beijing.json", "./data/daily.json", "./data/district.json", "./data/station.json", "./data/time.json"];

Promise.all(files.map(url => d3.json(url))).then(function(data) {
    myVis(data[0], data[1].map(d => d[0]), data[2].map(d => d[0]), data[3].map(d => d[0]), data[4].map(d => d[0]));
});


function myVis(beijing, daily, district, station, time) {

    console.log("Start drawing");

    var margin = {top: 80, bottom: 50, left: 30, right: 30}
    var width = 1200 - margin.left - margin.right;
    var height = 600 - margin.top - margin.bottom;
    var padding = 20;
 
   	// draw slider
   	// ref: https://bl.ocks.org/officeofjane/47d2b0bfeecfcb41d2212d06d095c763
    // https://bl.ocks.org/officeofjane/f132634f67b114815ba686484f9f7a77
    var formatDateIntoYear = d3.timeFormat("%Y");
    var formatDateDisplay = d3.timeFormat("%b %Y");
    var formatDate = d3.timeFormat("%Y%m%d");
    var startDate = new Date("2014-01-01 00:00:00"),
        endDate = new Date("2018-12-31 00:00:00");


    var color = d3.scaleQuantize()
                    .domain([50, 200])
                    // .range(["#92AAC7", "#A1BE95", "#E2DFA2", "ED5752"]);
                    // .range(["#486824", "#F2C057", "#D13525", "#4C3F54"]);
                    .range(["#f1eef6", "#bdc9e1", "#74a9cf", "#0570b0", "#005073"]);
                    // .domain([ 
                    //             d3.min(district, function(d) {return d.value; }),
                    //             d3.max(district, function(d) {return d.value; })
                    // ]);  

    var svg0 = d3.select("body")
                    .append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                    .attr("transform", "translate(" + 0 + "," + 0 + ")");
        
    var x = d3.scaleTime()
                .domain([startDate, endDate])
                .range([margin.left, width - margin.right])
                .clamp(true);

    // draw ticks 
    var sliderAxis = d3.axisBottom()
                        .scale(x)
                        .ticks(5);

    svg0.append("g")
            .attr("class", "slideraxis")
            .attr("transform", "translate(" + margin.left + ", " + (height)  + ")")
            .attr("id", "sliderAxis")
            .call(sliderAxis);

    // draw actual slider 
    var slider = svg0.append("g")
                        .attr("class", "slider")
                        .attr("transform", "translate(" + margin.left + "," + (height ) + ")");

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
            .attr("y", 5)
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
                                .attr("transform", "translate(" + 0 + "," + (35) + ")");

    // add title
    svg0.append("text")
            .attr("x", margin.left + padding)
            .attr("y", margin.top /2)
            .attr("class", "title")
            .text("Air Quality Index in Beijing, China");

    var parser = d3.timeParse("%Y%m%d");

    daily.forEach(function(d) {
        d.date = parser(d.date);
    });

    var histogram = d3.histogram()
                        .value(function(d) { return d.date; })
                        .domain(x.domain())
                        .thresholds(x.ticks(d3.timeMonth));

    var hist = svg0.append("g")
                    .attr("class", "histogram")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // group data for bars
    var bins = histogram(daily).map(d => {
                        return {...d, sum: d.reduce((acc,row) => acc + row.value, 0) || 0, 
                                      cnt: d.reduce((acc,row) => acc + 1, 0) || 0};
                      });
    // y domain based on binned data
    var histHeight = 0.82 * height;
    var y = d3.scaleLinear()
                    .range([histHeight, 0])
                    .domain([0, d3.max(bins, function(d) {return d.sum; })]);

    var bar = hist.selectAll(".bar")
                      .data(bins)
                      .enter()
                      .append("g")
                      .attr("class", "bar")
                      .attr("transform", function(d) {
                            return "translate(" + x(d.x0) + "," + y(d.sum) + ")";
                      });
      
    bar.append("rect")
          .attr("class", "bar")
          .attr("x", 1)
          .attr("width", function(d) { return x(d.x1) - x(d.x0) - 1; })
          .attr("height", function(d) { return histHeight - y(d.sum); })
          .attr("fill", function(d) { return color(d.sum/d.cnt); });

    var div0 = d3.select("svg0")
                .append("div")
                .attr("class", "tooltip")
                .style("opacity", 0);

    bar.append("text")
          .attr("dy", ".75em")
          .attr("y", "6")
          .attr("x", function(d) { return (x(d.x1) - x(d.x0))/2; })
          .attr("text-anchor", "middle")
          // .text(function(d) { if (d.sum>15) { return d.sum; } })
          // .style("fill", "white")
          .on("mouseover", function(d) {
                    d3.select(this)
                        .style("stroke", "#929292")
                        .style("fill", "#A1BE95");
                    div0.transition()
                        .duration(100)
                        .style("opacity", 0.5);
                    div0.html("Date:" + d.x0 + "<br/>"
                                + "AQI: "+ d.sum)
                        .style("left", (d3.event.pageX + 30) + "px")
                        .style("top", (d3.event.pageY - 30) + "px");
                    })
                .on("mouseout", function(d) {
                    d3.select(this)
                        .style("stroke", "none")
                        .style("fill", function(d){
                           return color(d.properties.value);
                    // div.transition()
                    //     .duration(100)
                    //     .style("opacity", 0);
                    div0.style("opacity", 0);
                    })
                });;




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
                    .attr("height", height)
                    .attr("transform", "translate(" + 0 + "," + 0 + ")");

    var projection = d3.geoMercator()
                        .center([116, 39])
                        .scale([10000])
                        .translate([width/2 - 50, height/2 + 250])
                        .precision([.1]);

    var path = d3.geoPath()
                    .projection(projection);

    var div = d3.select("body")
                .append("div")
                .attr("class", "tooltip")
                .style("opacity", 0);

    // add legends
    // var legend1 = svg1.append("g")
    //                 .attr("height", 20)
    //                 .attr("width", 20)
    //                 .attr("class", "legend");

    // legend1.append("rect")
    //         .attr("x", margin.left * 2)
    //         .attr("y", height / 3)
    //         .attr("width", 20)
    //         .attr("height", 20)
    //         .style("fill", "#EC96A4");

    // legend1.append("text")
    //         .attr("x", margin.left * 3)
    //         .attr("y", height / 3 + 10)
    //         .text("Population larger than 5,000k");

    // var legend2 = svg1.append("g")
    //                 .attr("height", 20)
    //                 .attr("width", 20)
    //                 .attr("class", "legend");

    // legend2.append("rect")
    //         .attr("x", margin.left * 2)
    //         .attr("y", height / 4)
    //         .attr("width", 20)
    //         .attr("height", 20)
    //         .style("fill", "#92AAC7");

    // legend2.append("text")
    //         .attr("x", margin.left * 3)
    //         .attr("y", height / 4 + 10)
    //         .text("Population less than 5,000k");

    var legendVals = ["AQI: 0-50", "AQI: 50-150", "AQI: 150-250", "AQI: 250-500", "AQI: >500"]
    var legendCols = ["#f1eef6", "#bdc9e1", "#74a9cf", "#0570b0", "#005073"]

    var legend = svg1.selectAll('.legend3')
        .data(legendVals)
        .enter()
        .append('g')
        .attr("class", "legends3")
        .attr("transform", function (d, i) {
            return "translate(0," + i * 20 + ")"
        });
    
    legend.append('rect')
        .attr("x", margin.left * 7)
        .attr("y", margin.top)
        .attr("width", 10)
        .attr("height", 10)
        .style("fill", function (d, i) {
        return legendCols[i]
    });
    
    legend.append('text')
        .attr("x", margin.left * 8)
        .attr("y", margin.top + 10)
    //.attr("dy", ".35em")
        .text(function (d, i) {
            return d
        })
            .attr("class", "label");


    function drawmap(h) {
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
                    div.transition()
                        .duration(100)
                        .style("opacity", 0.5);
                    div.html("Date:" + h + "<br/>"
                                + "District: " + d.properties.abb + "<br/>"
                                + "AQI: "+ d.properties.value)
                        .style("left", (d3.event.pageX + 30) + "px")
                        .style("top", (d3.event.pageY - 30) + "px");
                    })
                .on("mouseout", function(d) {
                    d3.select(this)
                        .style("stroke", "none")
                        .style("fill", function(d){
                           return color(d.properties.value);
                    // div.transition()
                    //     .duration(100)
                    //     .style("opacity", 0);
                    div.style("opacity", 0);
                    })
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
                    div.transition()
                        .duration(100)
                        .style("opacity", 0.5);
                    div.html("Date:" + d.date + "<br/>"
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
                    div.transition()
                        .duration(100)
                        .style("opacity", 0);
                });     
    }


    // small update function 
    function update(h) {

        handle.attr("cx", x(h));
        sliderLabel.attr("x", x(h))
                    .text(formatDateDisplay(h));

        var sliderDate = formatDate(h);
        drawmap(sliderDate);
    }

    drawmap(formatDate(startDate));






    var parser = d3.timeParse("%Y%m%d");
    // console.log(formatDate(parser("20140101")));
    var counter = 0
    time.forEach(function(d) {
        d.date = parser(d.date);
        d.id = counter;
        counter += 1;
    });
    console.log(time)

    var yScale = d3.scaleTime()
                    .domain([d3.min(time, function(d) { 
                                return d.date;
                            }), 
                            d3.max(time, function(d) {
                                return d.date;
                            })])
                    .range([margin.top, height - margin.bottom])
                    .nice();

    var destScale = d3.scaleOrdinal()
                        // .domain([d3.min(time, function(d) {
                        //             return d.value;
                        //         }),
                        //         d3.max(time, function(d) {
                        //             return d.value;
                        //         })])
                        .domain(["good", "fair", "unhealthy", "dangerous"])
                        .range([100, 200, 300, 400]);

    var yAxis0 = d3.axisRight()
                    .scale(yScale)
                    .ticks(5);

    var yAxis1 = d3.axisLeft()
                    .scale(destScale)
                    .tickValues(["good", "fair", "unhealthy", "dangerous"]);

    var svg2 = d3.select("body")
                .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .attr("transform", "translate(" + 0 + "," + 0 + ")");

    // draw y axis and label
    svg2.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(" + (margin.left * 5) +  ", 0)")
            .call(yAxis0);

    // svg2.selectAll("circle")
    //         .data(time)
    //         .enter()
    //         .append("circle")
    //         .attr("cx", margin.left * 5)
    //         .attr("cy", function(d) {
    //             return yScale(d.date);
    //             })
    //         .attr("r", 5)
    //         .attr("class", "circle")
    //         .attr("id", function(d, idx){
    //             console.log(idx +'-point')
    //             return idx +'-point';

    //         });
            // .each(running);

    svg2.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(" + (width * 0.9) +  ", 0)")
            .call(yAxis1);

    // let counter = 0;
    var counter = 0 
    setInterval(function(){
            // var data = useData.map(function(d){return Math.random()})  
            //   console.log(data[0]);   
            // console.log(counter);   
            // if (counter === 1000){
            //     break;
            // }          
            running(counter);
            counter +=1
            }, 500)

    // ref: http://bl.ocks.org/nbremer/b6cd1c9973eb24caa7cabb3437b0a248
    //the circle runs from left to right
    function running(d) {
        console.log(d)
        var subset = time.filter((row) => row.id === +d);
        // console.log(subset);
        // var circle = d3.select(this);
        // var element = d;
        // var circle = d3.select"(pointid + " "-point)";
        // console.log("(pointid + " + "-point")；
        //Move the circle left and right
        // https://bl.ocks.org/Kcnarf/9e4813ba03ef34beac6e
        // svg2.selectAll("circle")
        //     .data(subset)
        //     .enter()
        //     .append("circle")
        //     .attr("cx", margin.left * 5)
        //     .attr("cy", function(d) {
        //         console.log("!!!")
        //         return yScale(d.date);
        //         })
        //     .attr("r", 5)
        //     .attr("class", "circle")
        //     .transition()
        //                 .ease(d3.easeLinear)
        //                 .duration(200)
        //                 .attr("cx", width * 0.9)
        //                 .attr("cy", function(d){
        //                     if (d.category === "good"){ return 100}
        //                     if (d.category === "fair"){ return 200}
        //                     if (d.category === "unhealthy"){ return 300}
        //                     if (d.category === "dangerous"){ return 400}
        //                 })
        //                 .style("fill", function(d){
        //                     if (d.category === "good"){ return "#486824"}
        //                     if (d.category === "fair"){ return "#F2C057"}
        //                     if (d.category === "unhealthy"){ return "#D13525"}
        //                     if (d.category === "dangerous"){ return "#4C3F54"}
        //                 });

        var update2 = svg2.selectAll("circle")
                .data(subset);

        var enter2 = update2.enter()
                .append("circle");

        var exit2 = update2.exit();

        exit2.remove();
        update2.merge(enter2)
                .attr("cx", margin.left * 5)
                .attr("cy", function(d) {
                    return yScale(d.date);
                    })
                .attr("r", 5)
                .attr("class", "circle")
                .text(function(d){return d.date})
                .transition()
                        .ease(d3.easeLinear)
                        .duration(500)
                        .attr("cx", width * 0.9)
                        .attr("cy", function(d){
                            if (d.category === "good"){ return 100}
                            if (d.category === "fair"){ return 200}
                            if (d.category === "unhealthy"){ return 300}
                            if (d.category === "dangerous"){ return 400}
                        })
                        .style("fill", function(d){
                            if (d.category === "good"){ return "#486824"}
                            if (d.category === "fair"){ return "#F2C057"}
                            if (d.category === "unhealthy"){ return "#D13525"}
                            if (d.category === "dangerous"){ return "#4C3F54"}
                        });

        // svg2.append("text")
        //     .data(subset)
        //     .enter()
        //     .attr("x", margin.left + padding)
        //     .attr("y", margin.top * 4)
        //     .attr("class", "title")
        //     .text(function(d){console.log("!!!",d); return d.date});
        
        // circle = circle.transition()
        //                 .ease(d3.easeLinear)
        //                 .duration(5000)
        //                 .attr("cx", width * 0.9)
        //                 .attr("cy", function(d){
        //                     if (d.category === "good"){ return 100}
        //                     if (d.category === "fair"){ return 200}
        //                     if (d.category === "unhealthy"){ return 300}
        //                     if (d.category === "dangerous"){ return 400}
        //                 })
        //                 .style("fill", function(d){
        //                     if (d.category === "good"){ return "#486824"}
        //                     if (d.category === "fair"){ return "#F2C057"}
        //                     if (d.category === "unhealthy"){ return "#D13525"}
        //                     if (d.category === "dangerous"){ return "#4C3F54"}
        //                 });


        // function updatepoint(pointid) {
        //     select +'(pointid +' '-point'
        //     .attr("cx", width * 0.9)
        //     .transition(500)
        //                             .attr("cy", function(d){
        //                     if (d.category === "good"){ return 100}
        //                     if (d.category === "fair"){ return 200}
        //                     if (d.category === "unhealthy"){ return 300}
        //                     if (d.category === "dangerous"){ return 400}
        //                 })
        //                 .style("fill", function(d){
        //                     if (d.category === "good"){ return "#486824"}
        //                     if (d.category === "fair"){ return "#F2C057"}
        //                     if (d.category === "unhealthy"){ return "#D13525"}
        //                     if (d.category === "dangerous"){ return "#4C3F54"}
        //                 });
        // }
        // updatepoint();
    }
    


    // svg2.append("text")
    //     .attr("x", margin.left + padding)
    //     .attr("y", padding)
    //     .attr("class", "title")
    //     .text("This running plot is under construction!!! ");

    // svg2.append("g")
    //     .attr("class", "axis")
    //     .attr("transform", "translate(" + (width - margin.right + margin.left * 2) + ", 0)")
    //     .call(yAxis1)
    // .append("text")
    //     .attr("transform", "rotate(90)")
    //     .attr("x", height / 2)
    //     .attr("y", 0)
    //     .style("text-anchor", "middle")
    //     .text("Air Quality Index");

    // // add data sourcing
    // svg.append("text")
    //     .attr("x", width - margin.right * 12)
    //     .attr("y", height - margin.bottom * 2)
    //     .attr("class", "source")
    //     .text("National Urban Air Quality in Real-Time Publishing Platform");
}