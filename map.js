// read in data
var files = ["./data/beijing.json", 
                "./data/daily.json", 
                "./data/district.json", 
                "./data/districtReady.json", 
                "./data/station.json", 
                "./data/time.json"];


Promise.all(files.map(url => d3.json(url))).then(function(data) {
    myVis(data[0], 
            data[1].map(d => d[0]), 
            data[2].map(d => d[0]), 
            data[3].map(d => d[0]), 
            data[4].map(d => d[0]),
            data[5].map(d => d[0]) 
    );
});


function myVis(beijing, daily, district, districtReady, station, time) {

    var margin = {top: 80, bottom: 30, left: 30, right: 30};
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

    // modify date for use
    daily.forEach(function(d) {
        d.date = parser(d.date);
    });

    districtReady.forEach(function(d) {
        d.date = parser(d.date);
    });


    // set up for slider
    var color = d3.scaleQuantize()
                    .domain([50, 200])
                    .range(["#F1EEF6", "#BDC9E1", "#74A9CF", "#0570B0", "#005073"]);

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

    // draw ticks 
    var sliderAxis = d3.axisBottom()
                        .scale(x)
                        .ticks(5);

    svg0.append("g")
            .attr("class", "slideraxis")
            .attr("transform", "translate(" + margin.left + ", " + (0.55 * height)  + ")")
            .attr("id", "sliderAxis")
            .call(sliderAxis);

    // draw actual slider 
    var slider = svg0.append("g")
                        .attr("class", "slider")
                        .attr("transform", "translate(" + margin.left + "," + (0.55 * height) + ")");

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
                .on("start drag", function() { update(x.invert(d3.event.x), now_t); }));

    slider.insert("g", ".track-overlay")
            .attr("transform", "translate(" + 100 + "," + 15 + ")")
          .selectAll("text")
            .data(x.ticks(5))
            .enter()
            .append("text")
            .attr("x", x)
            .attr("y", 0)
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
                                .attr("transform", "translate(" + 0 + "," + (25) + ")");
    // ---end drawing slider---


    // add title and author
    svg0.append("text")
            .attr("x", width/2)
            .attr("y", margin.top/2)
            .attr("class", "title")
            .attr("text-anchor", "middle")
            .text("Air Quality Index in Beijing, China");

    svg0.append("text")
        .attr("x", width/2)
        .attr("y", 0.8 * margin.top)
        .attr("class", "source")
        .attr("text-anchor", "middle")
        .text("Andi Liao");


    // set up for hist
    var histHeight = 0.31 * height;

    var histogram = d3.histogram()
                        .value(function(d) { return d.date; })
                        .domain(x.domain())
                        .thresholds(x.ticks(d3.timeMonth));

    var hist = svg0.append("g")
                        .attr("class", "histogram")
                        .attr("transform", "translate(" + margin.left + "," + margin.top * 1.25 + ")");

    var bins = histogram(daily).map(d => {
                    return {...d, sum: d.reduce((acc,row) => acc + row.value, 0) || 0, 
                                  cnt: d.reduce((acc,row) => acc + 1, 0) || 0};
                    });

    var y = d3.scaleLinear()
                    .range([histHeight, 0])
                    .domain([0, d3.max(bins, function(d) {
                        return (d.sum/d.cnt); 
                    })]);

    // draw axis and label
    var yAxisLeft = d3.axisLeft()
                        .scale(y)
                        .tickValues([50, 100, 150]);

    var yAxisRight = d3.axisRight()
                        .scale(y)
                        .tickValues([50, 100, 150]);

    svg0.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(" + margin.left * 2 + ", " + margin.top * 1.25  + ")")
            .call(yAxisLeft);

    svg0.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(" + width + ", " + margin.top * 1.25 + ")")
            .call(yAxisRight);

    svg0.append("text")
            .attr("x", 20)
            .attr("y", 95)
            .attr("class", "label")
            .text("Monthly AQI");

    svg0.append("text")
            .attr("x", width - 20)
            .attr("y", 95)
            .attr("class", "label")
            .text("Monthly AQI");


    // silder update everything function
    var now_t = "cyq";

    function update(h, t) {
        handle.attr("cx", x(h));
        sliderLabel.attr("x", x(h))
                    .text(formatDateDisplay(h));
        drawmap(formatDate(h));
        drawhist(h);
        drawpoint(formatDate(h), now_t);
    };


    // draw histrogram
    // ref:https://bl.ocks.org/d3noob/96b74d0bd6d11427dd797892551a103c
    function drawhist(h) {

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
                    return x(d.x1) - x(d.x0); })
                .attr("height", function(d) { 
                    return histHeight - y(d.sum/d.cnt); })
                .attr("fill", function(d) { 
                    if (formatDateDisplay(d.x0) === formatDateDisplay(+h)) {
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
                    div0.html(
                            formatDateDisplay(d.x0) + "<br/>" 
                            + "AQI:" + formatDecimal(d.sum/d.cnt))
                        .style("left", (d3.event.pageX + 20) + "px" )
                        .style("top", (d3.event.pageY - 20) + "px");
                    })
                .on("click", function(d){
                    update(d.x0);
                    d3.select(this)
                        .style("stroke-width", "2px")
                        .style("fill", "#A1BE95");
                    div0.transition()
                        .duration(100)
                        .style("opacity", "0.8");
                    div0.html(
                            formatDateDisplay(d.x0) + "<br/>" 
                            + "AQI:" + formatDecimal(d.sum/d.cnt))
                        .style("left", (d3.event.pageX + 20) + "px" )
                        .style("top", (d3.event.pageY - 20) + "px");
                })
                .on("mouseout", function(d) {
                    d3.select(this)
                        .style("stroke-width", "0.5px")
                        .style("fill", function(d) {
                           return color(d.sum/d.cnt)
                        });
                    div0.transition()
                        .duration(100)
                        .style("opacity", 0);
                });
    };


    var svg1 = d3.select("body")
                    .append("svg")
                    .attr("width", width/2 + 200)
                    .attr("height", height * 1.2)
                    .attr("transform", "translate(" + 0 + "," + (-20) + ")");

    // add legends
    function addlegend() {

        var legendVals = ["Color Encoding",
                            "System Selection", "User Selection", "Observation Station",
                            "", "", "Daily AQI Range",  
                            "Good", "Moderate", "Unhealthy", "Very Unhealthy", "Hazardous"];

        var legendCols = ["#FFFFFF",
                            "#EC96A4", "#A1BE95","#F2C057",
                            "#FFFFFF", "#FFFFFF", "#FFFFFF", 
                            "#F1EEF6", "#BDC9E1", "#74A9CF", "#0570B0", "#005073"];

        var legend = svg1.selectAll(".legend")
                            .data(legendVals)
                            .enter()
                            .append("g")
                            .attr("class", "legend")
                            .attr("transform", function (d, i) {
                                return "translate(0," + i * 20 + ")"
                            });
        
        legend.append("rect")
                .attr("x", margin.left * 2)
                .attr("y", margin.top * 1.2 )
                .attr("width", 10)
                .attr("height", 10)
                .style("fill", function(d, i) {
                    return legendCols[i]
                })
                .style("rx", function (d) {
                    if (d === "Observation Station") {
                        return 10
                    } else {
                        return 0
                    }
                })
                .style("ry", function (d) {
                    if (d === "Observation Station") {
                        return 10
                    } else {
                        return 0
                    }
                });
        
        legend.append("text")
                .attr("x", margin.left * 3)
                .attr("y", margin.top * 1.2 + 9)
                .text(function(d, i) {
                    return d
                })
                .attr("class", "legend");

        // add title and axis label
        svg1.append("text")
                .attr("x", width/3)
                .attr("y", 15)
                .attr("class", "subtitle")
                .text("Beijing City");
    };


    // set up for map
    var rScale = d3.scaleLinear()
                    .domain([ 
                            d3.min(station, function(d) { return d.value; }),
                            d3.max(station, function(d) { return d.value; })])
                    .range([2, 7]);

    var projection = d3.geoMercator()
                        .center([116, 39])
                        .scale([10000])
                        .translate([width/2 - 230, height/2 + 260])
                        .precision([.1]);

    var path = d3.geoPath()
                    .projection(projection);

    var div1 = d3.select("body")
                    .append("div")
                    .attr("class", "tooltip1")
                    .style("opacity", 0);
    

    // draw the main map
    // ref: https://www.d3-graph-gallery.com/graph/interactivity_tooltip.html
    function drawmap(h) {

        var subset = district.filter((row) => row.date === +h);
        
        // map AQI to geojson
        var mapMap = {};
        for (var i = 0; i < subset.length; i ++ ) {
            var dataDistrict = subset[i].district;
            var dataValue = subset[i].value;
            mapMap[dataDistrict] = dataValue;
        };

        for (var j = 0; j < beijing.features.length; j ++ ) {
            var jsonDistrict = beijing.features[j].properties.abb;
            beijing.features[j].properties.value = mapMap[jsonDistrict]; 
        };

        // district part
        var update0 = svg1.selectAll("path")
                            .data(beijing.features);

        var enter0 = update0.enter()
                            .append("path");

        var exit0 = update0.exit();

        exit0.remove();

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
                        .style("left", (d3.event.pageX + 20) + "px")
                        .style("top", (d3.event.pageY - 20) + "px");
                    now_t = d.properties.abb;
                    drawpoint(h, d.properties.abb);
                })
                .on("click", function(d) {
                    now_t = d.properties.abb;
                    drawpoint(h, d.properties.abb);
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
                        .style("left", (d3.event.pageX + 20) + "px")
                        .style("top", (d3.event.pageY - 20) + "px");
                })
                .on("mouseout", function(d){
                    d3.select(this)
                        .attr("r", function(d) {
                            return rScale(d.value);
                        })
                        .style("stroke", "none")
                        .style("fill", "#F2C057");
                    div1.transition()
                        .duration(100)
                        .style("opacity", 0);
                });    
    };


    // set up for scatterplot
    var div2 = d3.select("body")
                    .append("div")
                    .attr("class", "tooltip0")
                    .style("opacity", 0);

    var nameMap = {"syq": "ShunYi District(syq)", "pgq": "PingGu District(pgq)", 
                    "myx": "MingYun District(myx)", "hrq": "HuaiRou District(hrq)", 
                    "yqx": "YanQing District(yqx)", "cpq": "ChangPing District(cpq)",
                    "hdq": "HaiDian District(hdq)", "sjsq": "ShiJingShan District(sjsq)",
                    "xcq": "XiCheng District(xcq)", "dcq": "DongCheng District(dcq)",
                    "cyq": "ChaoYang District(cyq)", "ftq": "FengTai District(ftq)",
                    "mtgq": "MenTouGou District(mtgq)", "fsq": "FangShan District(fsq)",
                    "dxq": "DaXing District(dxq)", "tzq":"TongZhou District(tzq)" };

    var svg2 = d3.select("body")
                    .append("svg")
                    .attr("width", width)
                    .attr("height", height + margin.top + margin.bottom)
                    .attr("transform", "translate(" + (width/2 + 60)+ "," + (-650) + ")");
    

    // ref:http://bl.ocks.org/hopelessoptimism/5d558563599aea1bfab93089a4036c22
    function drawpoint(h, t) {

        svg2.selectAll("*").remove();

        var subset = districtReady.filter((row) => row.district === t);

        var xScale = d3.scaleTime()
                        .domain([
                                d3.min(subset, function(d) { return d.date; }), 
                                d3.max(subset, function(d) { return d.date; })])
                        .range([margin.left, width/2 - margin.right - margin.left])
                        .clamp(true);

        var yScale = d3.scaleLinear()
                        .domain([
                                d3.min(subset, function(d) { return d.value; }), 
                                d3.max(subset, function(d) { return d.value;} )])
                        .range([height - margin.bottom, margin.top * 1.5]);

        var xAxis = d3.axisBottom()
                        .scale(xScale)
                        .ticks(5);

        var yAxis = d3.axisRight()
                        .scale(yScale)
                        .ticks(5);

        // draw axis
        svg2.append("g")
                .attr("class", "axis")
                .attr("transform", "translate(" + (0) + ", " + (height - margin.bottom * 2)  + ")")
                .call(xAxis);

        svg2.append("g")
                .attr("class", "axis")
                .attr("transform", "translate(" + (width /2 - margin.left * 2) + ", "  + (-margin.bottom)  + ")")
                .call(yAxis);

        // add title and axis label
        svg2.append("text")
                .attr("x", width/7)
                .attr("y", 0.7 * margin.top)
                .attr("class", "subtitle")
                .text(nameMap[t]);

        svg2.append("text")
                .attr("x", width/2 - margin.left * 2.5)
                .attr("y", 85)
                .attr("class", "label")
                .text("Daily AQI");

        // add points
        var update2 = svg2.selectAll("circle")
                             .data(subset);

        var enter2 = update2.enter()
                             .append("circle");

        var exit2 = update2.exit();

        exit2.remove();

        update2.merge(enter2)
                .attr("cx", function(d) {
                    return xScale(d.date);
                    })
                .attr("cy", function(d) {
                    return yScale(d.value);
                    })
                .attr("r", function(d) {
                    if (formatDate(d.date) === h) {
                        return 8;
                    } else {
                        return 1.2;
                    }})
                .style("fill", function(d) {
                    if (formatDate(d.date) === h) {
                        return "#EC96A4";
                    } else {
                        return "#D3D3D3";
                    }})
                .style("stroke", function(d) {
                    if (formatDate(d.date) === h){
                        return "#929292";
                    } else {
                        return "none";
                    }})
                .attr("transform", "translate(" + (0) + ", "  + (-margin.bottom) + ")")
                .on("mouseover", function(d) {
                    d3.select(this)
                        .attr("r", 8)
                        .style("stroke", "#929292")
                        .style("fill", "#A1BE95");
                    div2.transition()
                        .duration(100)
                        .style("opacity", 0.8);
                    div2.html("Date:" + formatDate(d.date) + "<br/>"
                                + "AQI: "+ formatDecimal(d.value))
                        .style("left", (width - margin.left * 3.5) + "px")
                        .style("top", (400) + "px");
                })
                .on("click", function(d) {
                    update(d.date);          
                    d3.select(this)
                        .attr("r", 8)
                        .style("stroke", "#929292")
                        .style("fill", "#A1BE95");
                    div2.transition()
                        .duration(100)
                        .style("opacity", 0.8);
                    div2.html("Date:" + formatDate(d.date) + "<br/>"
                                + "AQI: "+ formatDecimal(d.value))
                        .style("left", (width - margin.left * 3.5) + "px")
                        .style("top", (300) + "px");
                })
                .on("mouseout", function(d){
                    d3.select(this)
                        .attr("r", 1.2)
                        .style("stroke", "none")
                        .style("fill", "#D3D3D3");
                    div2.transition()
                        .duration(100)
                        .style("opacity", 0);
                })  
    };


    // initialize everything
    addlegend(); 
    drawhist(startDate);
    drawmap(formatDate(startDate))
    drawpoint(formatDate(startDate), now_t);

    var currentValue = d3.timeDay.offset(startDate, +15)
    var targetValue = endDate;


    // https://bl.ocks.org/officeofjane/47d2b0bfeecfcb41d2212d06d095c763
    function step() {
          update(currentValue, now_t);
          currentValue = d3.timeMonth.offset(currentValue, +1);

          if (d3.timeDay.offset(currentValue, +15) > targetValue) {
                playButton.text("Reset")
                            .style("background-color", "#EC96A4");
                currentValue = startDate;
                clearInterval(timer);
          }
    }

    // draw play button
    var playButton = d3.select("body")
                        .append("button")
                        .text("Play")
                        .attr("class", "button")
                        .on("click", function(){
                            var button = d3.select(this);
                            if (button.text() === "Play") {
                                moving = true;
                                timer = setInterval(step, 5);
                                button.text("Wait")
                                        .style("background-color", "#ccc");
                            }
                            if (button.text() === "Reset") {
                                update(startDate, now_t);
                                button.text("Play");
                        }});


    svg1.append("text")
            .attr("x", margin.left * 2)
            .attr("y", 440)
            .attr("class", "footnote")
            .text("Footnote: Please click the following texts!"); 

    svg1.append("text")
            .attr("x", margin.left * 2)
            .attr("y", 460)
            .attr("class", "source")
            .text("All Data Source: National Urban Air Quality in Real-Time Publishing Platform")
            .on("click", function() { 
                window.open("http://beijingair.sinaapp.com/" ); 
            }); 

    svg1.append("text")
            .attr("x", margin.left * 2)
            .attr("y", 480)
            .attr("class", "source")
            .text("Github Code: MainlandChina_AQI_D3")
            .on("click", function() { 
                window.open("https://github.com/liaoandi/MainlandChina_AQI_D3" ); 
            }); 

    svg1.append("text")
            .attr("x", margin.left * 2)
            .attr("y", 500)
            .attr("class", "source")
            .text("Reference Code 1: Date Slider + Play Button")
            .on("click", function() { 
                window.open("https://bl.ocks.org/officeofjane/47d2b0bfeecfcb41d2212d06d095c763" ); 
            }); 

    svg1.append("text")
        .attr("x", margin.left * 2)
        .attr("y", 520)
        .attr("class", "source")
        .text("Reference Code 2: Link Chart")
        .on("click", function() { 
            window.open("http://bl.ocks.org/hopelessoptimism/5d558563599aea1bfab93089a4036c22" ); 
        }); 

    svg1.append("text")
        .attr("x", margin.left * 2)
        .attr("y", 540)
        .attr("class", "source")
        .text("Reference Code 3: Interactive Tooltip")
        .on("click", function() { 
            window.open("https://www.d3-graph-gallery.com/graph/interactivity_tooltip.html" ); 
        }); 
    // var counter = 0

    // time.forEach(function(d) {
    //     d.date = parser(d.date);
    //     // d.id = counter;
    //     // counter += 1;
    // });

    // var yScale = d3.scaleTime()
    //                 .domain([
    //                         d3.min(time, function(d) { return d.date; }), 
    //                         d3.max(time, function(d) {return d.date;})])
    //                 .range([margin.top, height - margin.bottom])
    //                 .nice();

    // var yAxis0 = d3.axisRight()
    //                 .scale(yScale)
    //                 .ticks(5);

    // var svg2 = d3.select("body")
    //                 .append("svg")
    //                 .attr("width", width + margin.left + margin.right)
    //                 .attr("height", height + margin.top + margin.bottom)
    //                 .attr("transform", "translate(" + 0 + "," + (-600) + ")")
    //                 .attr("id","id_2");

    // function drawrunning() {

    //     var yScale = d3.scaleOrdinal()
    //                         .domain(["good", "fair", "unhealthy", "dangerous"])
    //                         .range([margin.left + 0.05 * width, margin.left + 0.3 * width, 
    //                                 margin.left + 0.55 * width, margin.left + 0.8 * width]);


    //     var yAxis = d3.axisBottom()
    //                     .scale(yScale)
    //                     .tickValues(["good", "fair", "unhealthy", "dangerous"]);

    //     var y = svg2.append("g")
    //                     .attr("class", "axis")
    //                     .attr("transform", "translate(" + 0 + "," + 100 + ")")
    //                     .call(yAxis);
    //                                 // .append("text")
    //                                 // .attr("x", 100)
    //                                 // // .attr("y", 20)
    //                                 // // .attr("text-anchor", "middle")
    //                                 // .attr("class", "label")
    //                                 // .style("text-anchor", "middle");

    //     // var yLabel = y.append("text")
    //     //                     .attr("class", "label")
    //     //                     .attr("text-anchor", "middle")
    //     //                     .text(formatDateDisplay(startDate))
    //     //                     .attr("transform", "translate(" + 0 + "," + (15) + ")");

    //     var div2 = d3.select("body")
    //                     .append("div")
    //                     .attr("class", "tooltip0")
    //                     .style("opacity", 0);

    //     function getAllIndexes(arr, val) {
    //         var indexes = [], i;
    //         for(i = 0; i < arr.length; i++)
    //             if (arr[i].category === val)
    //                 indexes.push(i);
    //         return indexes;
    //     }

    //     var fairIndex = getAllIndexes(time, "fair");
    //     console.log(fairIndex);


    //     allCircles = svg2.selectAll("circle")
    //                         .data(time)
    //                         .enter()
    //                         .append("circle")
    //                         .attr("cx", function(d) {
    //                             return (margin.left + x(d.date));
    //                         })
    //                         .attr("cy", 10)
    //                         .attr("r", 5)
    //                         .attr("class", "circle")
    //                         .on("mouseover", function(d) {
    //                             d3.select(this)
    //                                 .style("stroke-width", "2px")
    //                                 .style("fill", "#A1BE95");
    //                             div2.transition()
    //                                 .duration(100)
    //                                 .style("opacity", "0.8");
    //                             div2.html("Date:" + formatDate(d.date) + "<br/>" 
    //                                         + "AQI:" + formatDecimal(d.value))
    //                                 .style("left", (d3.event.pageX + 20) + "px" )
    //                                 .style("top", (d3.event.pageY - 20) + "px");
    //                             })
    //                         .on("mouseout", function(d) {
    //                             d3.select(this)
    //                                 .style("stroke-width", "0.5px")
    //                                 .style("fill", function(d) {
    //                                    return changeColor(d);
    //                                 });
    //                             div2.transition()
    //                                 .duration(100)
    //                                 .style("opacity", 0);
    //                         })
    //                         .each(running);

    //     function changeColor(d) {
    //         if (d.category === "good") { 
    //             return "#486824" }
    //         if (d.category === "fair") { 
    //             return "#F2C057" }
    //         if (d.category === "unhealthy") { 
    //             return "#D13525" }
    //         if (d.category === "dangerous") { 
    //             return "#4C3F54" }
    //         else { 
    //             return "#486824" }
    //     }

    //     // ref: https://bl.ocks.org/officeofjane/47d2b0bfeecfcb41d2212d06d095c763
    //     function running (d, i) {

    //         d3.select(this)
    //             .transition()
    //             .delay(i * 1)
    //             .duration(200)
    //             .ease(d3.easeElasticOut)
    //             .attr("cx", function(d) {
    //                 return (margin.left + x(d.date));
    //                 })
    //             .attr("cy", 10)
    //             .attr("r", 5)
    //             .attr("class", "circle")
    //             .transition()
    //                 .ease(d3.easeLinear)
    //                 .duration(200)
    //                 .attr("cx", function(d) {
    //                     if (d.category === "good") { 
    //                         return yScale.range()[0] + i * 0.1 }
    //                     if (d.category === "fair") { 
    //                         return yScale.range()[1] + i * 0.1 }
    //                     if (d.category === "unhealthy") {
    //                         return yScale.range()[2] + i * 0.1 }
    //                     if (d.category === "dangerous") { 
    //                         return yScale.range()[3] + i * 0.1 }
    //                     else { 
    //                         return yScale.range()[0] + i * 0.1 }
    //                 })
    //                 .attr("cy", 100)
    //                 .style("fill", function(d) {
    //                     return changeColor(d);
    //                 })
    //                 .end()
    //                 .then(_ => {
    //                     console.log('HI!', d)
    //                     //d3 select corresponding counter,
    //                     // get the text value from it, 
    //                     // increment that value
    //                 });
    //         }
    // }

}