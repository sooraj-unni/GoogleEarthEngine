var geometry = /* color: #d63000 */ee.Geometry.Point([-121.4847900390625, 38.57282054792632]);

//////////////////////////////////////////////////////////////////////////////////

Map.setCenter(-121.48, 38.57, 10);

var dataset = ee.ImageCollection('MODIS/006/MOD11A1').filter(ee.Filter.date('2018-04-01', '2018-05-01'));

var landSurfaceTemperature = dataset.select('LST_Day_1km');

var modLSTc = landSurfaceTemperature.map(function(img) {
  return img
    .multiply(0.02)
    .subtract(273.15)
    .copyProperties(img, ['system:time_start']);
});

var mean1 = modLSTc.reduce(ee.Reducer.mean());

//////////////////////////////////////////////////////////////////////////////////////////////////////////////
var geometry1 = geometry;

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
  var histogram_new = ui.Chart.image.histogram(mean1, poly1,500).setOptions(options1);
  print(histogram_new);
  
  var meanDictionary = mean1.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: poly1,
  scale: 30,
  maxPixels: 1e9
  });
  
  print(meanDictionary);
  
  var meanDictionary1 = mean1.reduceRegion({
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
  
  var histogram_new = ui.Chart.image.histogram(mean1, diff1,500).setOptions(options1);
  print(histogram_new);
  
  var meanDictionary = mean1.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: diff1,
  scale: 30,
  maxPixels: 1e9
  });
  
  print(meanDictionary);
  
  var meanDictionary1 = mean1.reduceRegion({
  reducer: ee.Reducer.stdDev(),
  geometry: diff1,
  scale: 30,
  maxPixels: 1e9
  });
  
  print(meanDictionary1);
};

collection.map(conditional);