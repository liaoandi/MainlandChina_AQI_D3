
d3.csv("./data/2018_polluant_part1.csv")
    .then(function(data) {
        console.log("Read in the first data!");
        console.log(data); 
        myVis(data.map(d => d[0]))
        })
    .catch(function(error) {
        console.log(error);
        alert("Something went wrong!");
        });

    function myVis(data) {

        console.log("Start drawing");
        console.log(data.value);

        var margin = {top: 1000, bottom: 50, left: 30, right: 30}
        var width = 800 - margin.left - margin.right;
        var height = 800 - margin.top - margin.bottom;
        var padding = 20;

        var xScale = d3.scaleLinear()
                        .domain([0, d3.max(data, function(d) {
                            return d.metrics;
                            })])
                        .range([width - margin.right, margin.left])
                        .nice();
        
        var yScale = d3.scaleLinear()
                        .domain([30, d3.max(data, function(d) { 
                            return d.metrics;
                            })])
                        .range([margin.top, height - margin.bottom])
                        .nice();

        var xAxis = d3.axisTop()
                        .scale(xScale)
                        .ticks(5);

        var yAxis = d3.axisRight()
                        .scale(yScale)
                        .tickValues([30, 60, 90, 120, 150]);
                        // .ticks(5);

        var rScale = d3.scaleLinear()
                        .domain([0, d3.max(data, function(d) {
                            return d.metrics;
                            })])
                        .range([5, 15])
                        .nice();

        var svg = d3.select("body")
                    .append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


        svg.selectAll("circle")
            .data(data)
            .enter()
            .append("circle")
            .attr("cx", function(d) {
                return xScale(d.year);
                })
            .attr("cy", function(d) {
                return yScale(d.metrics);
                })
            .attr("r", function(d) {
                return rScale(d.metrics);
                });
            // .attr("class", function(d) {
            //     if (d.population_2014 >= 5000){
            //         console.log(d.population_2014)
            //         return "circle1";
            //     } else {
            //         return "circle2";
            //     }});
        // var color = d3.scaleQuantize()
        //                 // TBD: modify domain according to selected year
        //                 .domain([60, 110])
        //                 .range(["#f1eef6", "#bdc9e1", "#74a9cf", "#0570b0"]);
        //                 // .domain([ 
        //                 // d3.min(data2, function(d) {return d.AQI; }),
        //                 // d3.max(data2, function(d) {return d.AQI; })
        //             // ]);

        // draw labels
        svg.selectAll("text")
            .data(data)
            .enter()
            .append("text")
            .text(function(d){
                return d.region;
                })
            .attr("x", function(d){
                return xScale(d.metrics) - 10;
                })
            .attr("y", function(d){
                return yScale(d.metrics) + 10;
                })
            .attr("class", "label");

        // add title
        // svg.append("text")
        //     .attr("x", margin.left + padding)
        //     .attr("y", margin.top / 4)
        //     .attr("class", "title")
        //     .text("With the increase of forest coverage rate, the air qulaity is better.");

        // // add subtitle
        // svg.append("text")
        //     .attr("x", margin.left + padding)
        //     .attr("y", margin.top / 2 - 5)
        //     .attr("class", "subtitle")
        //     .text("The population doesn't affect air quality much. Each point is a province in mainland China.");

        // // add data sourcing
        // svg.append("text")
        //     .attr("x", width - margin.right * 12)
        //     .attr("y", height - margin.bottom * 2)
        //     .attr("class", "source")
        //     .text("National Urban Air Quality in Real-Time Publishing Platform");

        // draw x axis and label
        svg.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(" + margin.left + ", " + margin.top  + ")")
            .call(xAxis)

       .append("text")
            .attr("class", "label")
            .attr("x", width / 2)
            .attr("y", -25)
            .style("text-anchor", "end")
            .text("Forest");

        // draw y axis and label
        svg.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(" + (width - margin.right + margin.left) + ", 0)")
            .call(yAxis)

        .append("text")
            .attr("transform", "rotate(90)")
            .attr("x", height / 2)
            .attr("y", -35)
            .style("text-anchor", "middle")
            .text("Air Quality Index");

//         // add legends
//         var legend1 = svg.selectAll(legend1)
//                         .data(data)
//                         .enter()
//                         .append("g")
//                         .attr("height", 20)
//                         .attr("width", 20)
//                         .attr("class", "legend");

//         legend1.append("rect")
//                 .attr("x", margin.left * 2)
//                 .attr("y", height / 2 + margin.bottom * 3.5)
//                 .attr("width", 20)
//                 .attr("height", 20)
//                 .style("fill", "#EC96A4");
        
//         legend1.append("text")
//                 .attr("x", margin.left * 3)
//                 .attr("y", height / 2 + margin.bottom * 3.5 + 10)
//                 .text("Population larger than 5,000k");

//         var legend2 = svg.selectAll(legend2)
//                         .data(data)
//                         .enter()
//                         .append("g")
//                         .attr("height", 20)
//                         .attr("width", 20)
//                         .attr("class", "legend");

//         legend2.append("rect")
//                 .attr("x", margin.left * 2)
//                 .attr("y", height / 2 + margin.bottom * 4)
//                 .attr("width", 20)
//                 .attr("height", 20)
//                 .style("fill", "#92AAC7");
        
//         legend2.append("text")
//                 .attr("x", margin.left * 3)
//                 .attr("y", height / 2 + margin.bottom * 4 + 10)
//                 .text("Population less than 5,000k");
    };