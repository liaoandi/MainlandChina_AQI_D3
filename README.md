# MainlandChina_AQI_D3

Link: https://liaoandi.github.io/MainlandChina_AQI_D3/

Progress records & Questions:

-- 20190317

- Added the histogram, together with tooltip and syncing with slider.

- Fixed bug in the map interaction and initialization.

- Made the running plot running!

- Added the button for switching between plots.

1) How to made svg elements switch positions?

2) How to sync plots outside different functions?



-- 20190310

- Solved all the problems from last week.

- Finished the slider + map interaction.

- Working on running circles part.

- Fixing the "magic time" button: it should clear the slider and the map, and bring the running circles to the front.

1) How to let every circle runs to its own category on the right side? And how to let one circle move at a time?

2) CSS selectors. How to select circles from the map but excluding the circles from the scatterplot? 




-- 20190303

1) How to let a svg start at a new place(e.g. under the map)? 
Now I couldn't get it working, so I keep only the map.js to display in GitHub Pages. And my date slider is not in the ideal place.

2) Should I write all the js code in one file or seperate them into different files?

3) How to read in multiple files elegantly?

4) The update function in map.js doesn't update the values, although the loop is running. It seems that enter-update-exit part is 
not executing. But I couldn't figure out why.

5) How to remeber all records in one district in one year in loop, and average them as the assigned value for geojson.properties.value?
