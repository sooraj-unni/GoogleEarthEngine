var l8 = ee.ImageCollection("LANDSAT/LC08/C01/T1_TOA"),
    l8sr = ee.ImageCollection("LANDSAT/LC08/C01/T1_SR"),
    geometry = /* color: #d63000 */ee.Geometry.Point([-121.4847900390625, 38.57282054792632]);
	
///////////////////////////////////////////////////////////////////////////////////////////////	
	
Map.setCenter(-121.48, 38.57, 10);

var geometry1 = geometry;


function maskL8sr(col) {
  var cloudShadowBitMask = (1 << 3);
  var cloudsBitMask = (1 << 5);
  var qa = col.select('pixel_qa');
  var mask = qa.bitwiseAnd(cloudShadowBitMask).eq(0)
                 .and(qa.bitwiseAnd(cloudsBitMask).eq(0));
  return col.updateMask(mask);
}

/////////////////////////////////////////  END OF GEOMETRY DEFINITION ////////////////////////

var imageSR = ee.Image(l8sr.filterBounds(geometry1).map(maskL8sr).filterDate('2018-04-01', '2018-05-01').sort('CLOUD_COVER').first());

// finding NDVI of a scene - Atmospherically corrected (AC)               // NDVI = (nir - r)/ (nir + r)
{
var ndviSR = imageSR.normalizedDifference(['B5','B4']).rename('NDVI AC'); 
var ndviParamsSR = {min: -1, max: 1, palette: ['red', 'white','green']};
//Map.addLayer(ndviSR, ndviParamsSR,'NDVI AC');
}
print( ndviSR);

// display TOA Brightness Temperature using band-10 - Atmospherically corrected (AC)
{
var thermalSR = imageSR.select('B10').multiply(0.1).rename('TOA');        // eqn (7), Qin 2015
var b10ParamsSR = {min: 273.15, max: 323.15, palette: ['gold','White']};
//Map.addLayer(thermalSR, b10ParamsSR, 'TOA Brightness Temp AC');
}

// find NDVI-min and NDVI-max to get the FVC - Atmospherically corrected (AC)     
{
var minNDVISR = ee.Number(ndviSR.reduceRegion({reducer: ee.Reducer.min(),maxPixels: 1e9}).values().get(0));
var maxNDVISR = ee.Number(ndviSR.reduceRegion({reducer: ee.Reducer.max(),maxPixels: 1e9}).values().get(0));
}

// fractional vegetation cover-FVC - Atmospherically corrected (AC)       // FVC = NDVI - NDVI(min)/ NDVI(max) - NDVI(min)
{
var fvcSR =(ndviSR.subtract(minNDVISR).divide(maxNDVISR.subtract(minNDVISR))).pow(ee.Number(2)).rename('FVC value_AC'); 
var fvcParamsSR = {min:0, max:1,palette: ['green','white']};
//Map.addLayer(fvcSR, fvcParamsSR, 'FVC - AC');
}

// emissivity - Atmospherically corrected (AC)                            // EM = (1 - FVC)* emm1 + (FVC)* emm2
var emm1 = ee.Number(0.004);
var emm2 = ee.Number(0.986);
var EMSR = fvcSR.multiply(emm1).add(emm2).rename('emmisivity value_AC');
var emmParamsSR = {min: 0.98, max:1};
//Map.addLayer(EMSR, emmParamsSR, 'Emmisivity - AC');

// using the above functions to find LST (in K) - Atmospherically corrected (AC)
{
// Select atmospheric model  

// Mid-latitude summer
var aat = 0.6276;                                                         // Table 10, Qin 2015
var Ta = 288.49;  // 15.34 + 273.15

/*
// Tropical
var aat = 0.4829;                                                         // Table 10, Qin 2015
var Ta = 292.84;  // 19.69 + 273.15

// Mid-latitude winter
var aat = 0.8602;                                                         // Table 10, Qin 2015
var Ta = 267.28;  // -5.87 + 273.15
*/  

var C = EMSR.select('emmisivity value_AC').multiply(aat).rename('C');    

var D = EMSR.expression(
    '(1-aat)*(1+(1-em)*aat)',{                                           
      'aat': aat,  // Band average atmospheric transmission
      'em': EMSR.select('emmisivity value_AC')
      }).rename('D');
      
var LSTSR = thermalSR.expression('(a*(1-sum)+(b*(1-sum)+sum)*BT-D*Ta)/C - 273.15',{     // eqn (2), Sobrino 2004
      'a': -70.1775,                                                       // Table 1, Qin 2015
      'b': 0.4581,
      'C': C,
      'D': D,
      'sum': C.add(D),
      'BT': thermalSR,
      'Ta': Ta
      }).rename('LST-Qin 2015');
var LSTParamsSR = {min:10, max:60, palette: ['040274', '040281', '0502a3', '0502b8', '0502ce', '0502e6',
'0602ff', '235cb1', '307ef3', '269db1', '30c8e2', '32d3ef',
'3be285', '3ff38f', '86e26f', '3ae237', 'b5e22e', 'd6e21f',
'fff705', 'ffd611', 'ffb613', 'ff8b13', 'ff6e08', 'ff500d',
'ff0000', 'de0101', 'c21301', 'a71001', '911003']};
Map.addLayer(LSTSR, LSTParamsSR, 'Final LST - AC');

}

/////////////////////////////////////////   END OF LST  //////////////////////////////////////////////

var n1 = 7;                                                       // ENTER NUMBER OF RINGS
var r = 7000;                                                     // ENTER THE RADIUS IN METRE
var collection1 = [1,2,3,4,5,6,7,8,9];
var collection = collection1.slice(0, n1);

var poly1 = geometry1.buffer(r);
Map.addLayer(poly1, {color: '800080'}, 'polygon - inner');

var options1 = {
  title: 'diff0',
  fontSize: 12,
  hAxis: {title: 'diff0-LST (°C)'},
  vAxis: {title: 'frequency'},
  };  
  var histogram_new = ui.Chart.image.histogram(LSTSR, poly1,500).setOptions(options1);
  print(histogram_new);
  
  var meanDictionary = LSTSR.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: poly1,
  scale: 30,
  maxPixels: 1e9
  });
  
  print(meanDictionary);
  
  var meanDictionary1 = LSTSR.reduceRegion({
  reducer: ee.Reducer.stdDev(),
  geometry: poly1,
  scale: 30,
  maxPixels: 1e9
  });
  
  print(meanDictionary1);
  
  
var conditional = function(m) {
  var k = ee.List.sequence(r,10*r,r);
  var ko = ee.List.sequence(0,9*r,r);
  var l = k.get(m);
  var l1 = ko.get(m);
  var p = geometry1.buffer(l);
  var p1 = geometry1.buffer(l1);
  var diff1 = p.difference(p1, ee.ErrorMargin(1));
  var c1 = ['00FFFF','00FF00','FFFF00','FF0000','800080','FFCD33','0AF77F','0AE7F7'];
  var c2 = c1[m];
  var d1 = ['diff1','diff2','diff3','diff4','diff5','diff6','diff7','diff8'];
  var d2 = d1[m-1];
  Map.addLayer(diff1, {color: c2}, d2);
  
  
  var options1 = {
  title: d2,
  fontSize: 12,
  hAxis: {title: d2 + '- LST (°C)'},
  vAxis: {title: 'frequency'},
  };  
  var histogram_new = ui.Chart.image.histogram(LSTSR, diff1,500).setOptions(options1);
  print(histogram_new);
  
  var meanDictionary = LSTSR.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: diff1,
  scale: 30,
  maxPixels: 1e9
  });
  
  print(meanDictionary);
  
  var meanDictionary1 = LSTSR.reduceRegion({
  reducer: ee.Reducer.stdDev(),
  geometry: diff1,
  scale: 30,
  maxPixels: 1e9
  });
  
  print(meanDictionary1);
};

collection.map(conditional);

// To export any scene to drive (tif format) , uncomment this block



Export.image.toDrive({
  image: LSTSR,
  description: 'lst1',
  scale: 30,
  maxPixels: 1e9
});



/*
/////////////////////////////////////////// LEGEND //////////////////////////////////

var vis = {min:10, max:60, palette: ['040274', '040281', '0502a3', '0502b8', '0502ce', '0502e6',
'0602ff', '235cb1', '307ef3', '269db1', '30c8e2', '32d3ef',
'3be285', '3ff38f', '86e26f', '3ae237', 'b5e22e', 'd6e21f',
'fff705', 'ffd611', 'ffb613', 'ff8b13', 'ff6e08', 'ff500d',
'ff0000', 'de0101', 'c21301', 'a71001', '911003']};
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
*/
	