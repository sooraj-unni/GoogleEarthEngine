var geometry = /* color: #d63000 */ee.Geometry.Point([78.47377777099602, 17.423221059129755]),
    l8 = ee.ImageCollection("LANDSAT/LC08/C01/T1_TOA"),
    l8sr = ee.ImageCollection("LANDSAT/LC08/C01/T1_SR");
	
//////////////////////////////////////////////////////////////////////////////////////	

var geometry1 = geometry;

var r = 4000;  // enter radius in m

var j=1;
var k = ee.List.sequence(r*j,5*r,j*r);
var kr0 = k.get(0);
var kr1 = k.get(1);
var kr2 = k.get(2);
var kr3 = k.get(3);
var kr4 = k.get(4);

// define circle radius from center
var poly1 = geometry1.buffer(kr0);  // r km
var centroid1 = poly1.centroid();
var poly2 = geometry1.buffer(kr1);  // 2r km
var centroid2 = poly2.centroid();
//Map.addLayer(centroid1, {}, 'centroid-outer');
var poly3 = geometry1.buffer(kr2);  // 3r km
var centroid3 = poly3.centroid();
//Map.addLayer(centroid2, {}, 'centroid-inner');
var poly4 = geometry1.buffer(kr3);  // 4r km
var centroid4 = poly4.centroid();
var poly5 = geometry1.buffer(kr4); // 5r km
var centroid5 = poly5.centroid();

// display innermost circle
Map.addLayer(poly1, {color: '800080'}, 'polygon - inner');

// create concentric circles, display concentric circles
var diff1 = poly2.difference(poly1, ee.ErrorMargin(1));
Map.addLayer(diff1, {color: '00FFFF'}, 'diff1');
var diff2 = poly3.difference(poly2, ee.ErrorMargin(1));
Map.addLayer(diff2, {color: '00FF00'}, 'diff2');
var diff3 = poly4.difference(poly3, ee.ErrorMargin(1));
Map.addLayer(diff3, {color: 'FFFF00'}, 'diff3');
var diff4 = poly5.difference(poly4, ee.ErrorMargin(1));
Map.addLayer(diff4, {color: 'FF0000	'}, 'diff4');


///////////////////////// END OF GEOMETRY DEFINITION //////////////////////

var imageSR = ee.Image(l8sr.filterBounds(geometry1).filterDate('2017-04-01', '2017-05-01').sort('CLOUD_COVER').first());

// finding NDVI of a scene - Atmospherically corrected (AC)
{
var ndviSR = imageSR.normalizedDifference(['B5','B4']).rename('NDVI AC');
var ndviParamsSR = {min: -1, max: 1, palette: ['red', 'white','green']};
//Map.addLayer(ndviSR, ndviParamsSR,'NDVI AC');
}

// display TOA Brightness Temperature using band-10 - Atmospherically corrected (AC)
{
var thermalSR = imageSR.select('B10').multiply(0.1).rename('TOA');
var b10ParamsSR = {min: 273.15, max: 323.15, palette: ['gold','White']};
//Map.addLayer(thermalSR, b10ParamsSR, 'TOA Brightness Temp AC');
}

// find NDVI-min and NDVI-max to get the FVC - Atmospherically corrected (AC) 
{
var minNDVISR = ee.Number(ndviSR.reduceRegion({reducer: ee.Reducer.min(),maxPixels: 1e9}).values().get(0));
var maxNDVISR = ee.Number(ndviSR.reduceRegion({reducer: ee.Reducer.max(),maxPixels: 1e9}).values().get(0));
}

// fractional vegetation cover-FVC - Atmospherically corrected (AC) 
{
var fvcSR =(ndviSR.subtract(minNDVISR).divide(maxNDVISR.subtract(minNDVISR))).pow(ee.Number(2)).rename('FVC value_AC'); 
var fvcParamsSR = {min:0, max:1,palette: ['green','white']};
//Map.addLayer(fvcSR, fvcParamsSR, 'FVC - AC');
}

// emissivity - Atmospherically corrected (AC)
var a2 = ee.Number(0.004);
var b2 = ee.Number(0.986);
var EMSR = fvcSR.multiply(a2).add(b2).rename('emmisivity value_AC');
var emmParamsSR = {min: 0.98, max:1};
//Map.addLayer(EMSR, emmParamsSR, 'Emmisivity - AC');

// using the above functions to find LST (in K) - Atmospherically corrected (AC)
{
var LSTSR = thermalSR.expression('(Tb/(1 + (0.00115* (Tb / 1.438))*log(Ep)))-273.15', {'Tb': thermalSR,'Ep': EMSR}).rename('LST-AC');
var LSTParamsSR = {min:293.15, max:323.15, palette: ['3363FF','B0F370','FB0F0F']};
Map.addLayer(LSTSR, LSTParamsSR, 'Final LST - AC');
}

/////////////////////////////////////////// LEGEND //////////////////////////////////

var vis = {min: 10, max: 50, palette: ['3363FF','B0F370','FB0F0F']};
// Creates a color bar thumbnail image for use in legend from the given color
// palette.
function makeColorBarParams(palette) {
  return {
    bbox: [0, 0, 1, 0.1],
    dimensions: '500x5',
    format: 'png',
    min: 0,
    max: 1,
    palette: palette,
  };
}
// Create the color bar for the legend.
var colorBar = ui.Thumbnail({
  image: ee.Image.pixelLonLat().select(0),
  params: makeColorBarParams(vis.palette),
  style: {stretch: 'horizontal', margin: '0px 8px', maxHeight: '24px'},
});
// Create a panel with three numbers for the legend.
var legendLabels = ui.Panel({
  widgets: [
    ui.Label(vis.min, {margin: '4px 8px'}),
    ui.Label(
        (vis.max / 2),
        {margin: '4px 8px', textAlign: 'center', stretch: 'horizontal'}),
    ui.Label(vis.max, {margin: '4px 8px'})
  ],
  layout: ui.Panel.Layout.flow('horizontal')
});
var legendTitle = ui.Label({
  value: 'Map Legend: Land Surface Temperature (°C)',
  style: {fontWeight: 'bold'}
});
// Add the legendPanel to the map.
var legendPanel = ui.Panel([legendTitle, colorBar, legendLabels]);
Map.add(legendPanel);

/////////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////   END OF LST  //////////////////////////////////////////////

var options1 = {
  title: 'polygon-inner ',
  fontSize: 12,
  hAxis: {title: 'polygon-inner'},
  vAxis: {title: 'frequency'},
  };
  
var options2 = {
  title: 'diff1',
  fontSize: 12,
  hAxis: {title: 'diff1'},
  vAxis: {title: 'frequency'},
  };  
  
var options3 = {
  title: 'diff2',
  fontSize: 12,
  hAxis: {title: 'diff2'},
  vAxis: {title: 'frequency'},
  };    
  
var options4 = {
  title: 'diff3',
  fontSize: 12,
  hAxis: {title: 'diff3'},
  vAxis: {title: 'frequency'},
  };
  
var options5 = {
  title: 'diff4',
  fontSize: 12,
  hAxis: {title: 'diff4'},
  vAxis: {title: 'frequency'},
  };  
  
var histogram_inner = ui.Chart.image.histogram(LSTSR, poly1,50).setOptions(options1);
print(histogram_inner);
var histogram_diff1 = ui.Chart.image.histogram(LSTSR, diff1,50).setOptions(options2);
print(histogram_diff1);
var histogram_diff2 = ui.Chart.image.histogram(LSTSR, diff2,50).setOptions(options3);
print(histogram_diff2);
var histogram_diff3 = ui.Chart.image.histogram(LSTSR, diff3,50).setOptions(options4);
print(histogram_diff3);
var histogram_diff4 = ui.Chart.image.histogram(LSTSR, diff4,50).setOptions(options5);
print(histogram_diff4);
