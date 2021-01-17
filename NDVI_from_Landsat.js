var l8 = ee.ImageCollection('LANDSAT/LC08/C01/T1_TOA');
var point = ee.Geometry.Point([-122.426, 37.758]);
var image = ee.Image(l8.filterBounds(point).filterDate('2014-01-01', '2015-12-31').sort('CLOUD_COVER').first());

// Finding NDVI of a scene
{
var ndvi = image.normalizedDifference(['B5','B4']).rename('ndvi1');
var ndviParams = {min: -1, max: 1, palette: ['red', 'white','green']};
Map.addLayer(ndvi, ndviParams,'NDVI map');
}

// Finding NDWI of a scene
{
var ndwi = image.normalizedDifference(['B5','B6']).rename('ndwi1');
var ndwiParams = {min: -1, max: 1, palette: ['red', 'white','green']};
Map.addLayer(ndwi, ndwiParams,'NDWI map');
}

// Finding NDBI of a scene
{
var ndbi = image.normalizedDifference(['B6','B5']).rename('ndbi1');
var ndbiParams = {min: -1, max: 1, palette: ['red', 'white','blue']};
Map.addLayer(ndbi, ndbiParams,'NDBI map');
}

// Create a task that you can launch from the Tasks tab.
Export.image.toDrive({
  image: ndvi,
  description: 'ndvi1',
  scale: 30,
  maxPixels: 1e9
});





