///////////////////////////////
// Maps of the Start and End of Season (SoS and EoS) estimated using the maximum separation
// The maps were obtained with a dynamic threshold of 50% of the amplitude applied for MODIS LAI for year 2019. 
// 
// Adrià Descals - a.descals@creaf.uab.cat
// CREAF - Centre de Recerca Ecològica i Aplicacions Forestals


Map.addLayer(ee.Image(0),{min:0,max:1},'background',true);
Map.setCenter(0,30,3);
Map.setOptions('satellite')

var image2 = ee.Image("users/adriadescals/shared/MS_pheno_MODISLAI_SH_scale_5000_year_2019");
var image1 = ee.Image("users/adriadescals/shared/MS_pheno_MODISLAI_NH_scale_5000_year_2019");

var image = ee.ImageCollection.fromImages([image1,image2]).mean();
var SoS_MS = image.select('SoS');
var EoS_MS = image.select('EoS');

var phenoPalette = ['ff0000','ff8d00','fbff00','4aff00','00ffe7','01b8ff','0036ff','fb00ff']
var visDate_SoS1 = {min:60 ,max:220, "palette":phenoPalette};
var visDate_EoS1 = {min:140 ,max:300, "palette":phenoPalette};

Map.addLayer(SoS_MS,visDate_SoS1,'SoS (2019)',true);
Map.addLayer(EoS_MS,visDate_EoS1,'EoS (2019)',true);




var point = ee.Geometry.Point([10.954, 51.72]);

var SoSdict = SoS_MS.reduceRegion(ee.Reducer.first(), point, 5000)
var EoSdict = EoS_MS.reduceRegion(ee.Reducer.first(), point, 5000)

var blankImage1 = ee.Image(0).set('doy',SoSdict.get('SoS')).rename('SoS').int()
var blankImage2 = ee.Image(60).set('doy',ee.Number(SoSdict.get('SoS')).add(1)).rename('SoS').int()

var blankImage3 = ee.Image(0).set('doy',EoSdict.get('EoS')).rename('EoS').int()
var blankImage4 = ee.Image(60).set('doy',ee.Number(EoSdict.get('EoS')).add(1)).rename('EoS').int()

var lineSoS = ee.ImageCollection.fromImages([blankImage1,blankImage2])
var lineEoS = ee.ImageCollection.fromImages([blankImage3,blankImage4])




var year = 2019
var MODISlai = ee.ImageCollection("MODIS/006/MCD15A3H").filterDate((year)+'-01-01',(year+1)+'-01-01')

var doysList=ee.List.sequence(1,365)
var MODISlai =  ee.ImageCollection(doysList.map(function(dd) {
  return MODISlai.select('Lai').filter(ee.Filter.calendarRange({
      start: dd, 
      field: 'day_of_year'
  })).mean().set('doy', dd)
}));


var chart1 = ui.Chart.image.series({imageCollection: MODISlai.merge(lineSoS).merge(lineEoS),
  region: point,
  reducer: ee.Reducer.first(), 
  scale: 5000,
  xProperty: 'doy'
})
.setOptions({title: 'Mean MODIS Lai', 
      interpolateNulls: true,
      series: {
        0: {pointSize: 0, lineWidth: 3, color: '2800ff'},
        1: {pointSize: 2, lineWidth: 0, color: '000000'},
        2: {pointSize: 0, lineWidth: 3, color: '3eff00'},
      }})





Map.style().set('cursor', 'crosshair');

var titleLabel = ui.Label(
    'SoS and EoS MODIS LAI (2019)', {fontWeight: 'bold', fontSize: '24px'})
Map.add(titleLabel);

function ColorBar() {
  return ui.Thumbnail({
    image: ee.Image.pixelLonLat().select(0),
    params: {
      bbox: [0, 0, 1, 0.1],
      dimensions: '100x10',
      format: 'png',
      min: 0,
      max: 1,
      palette: phenoPalette,
    },
    style: {stretch: 'horizontal', margin: '0px 8px'},
  });
}

function makeLegend(a,b) {
  var labelPanel = ui.Panel(
      [
        ui.Label(a, {margin: '4px 8px'}),
        ui.Label(' ',{margin: '4px 8px', textAlign: 'center', stretch: 'horizontal'}),
        ui.Label(b, {margin: '4px 8px'})
      ],
      ui.Panel.Layout.flow('horizontal'));
  return ui.Panel([ColorBar(), labelPanel]);
}

var LEGEND_TITLE_STYLE = {
  fontSize: '20px',
  fontWeight: 'bold',
  stretch: 'horizontal',
  textAlign: 'center',
  margin: '4px',
};

var LEGEND_FOOTNOTE_STYLE = {
  fontSize: '14px',
  stretch: 'horizontal',
  textAlign: 'center',
  margin: '4px',
};

Map.add(ui.Panel(
    [
      ui.Label('End of Season', LEGEND_TITLE_STYLE), makeLegend(visDate_EoS1['min'],visDate_EoS1['max']),
      ui.Label('(Day of Year)', LEGEND_FOOTNOTE_STYLE)
    ],
    ui.Panel.Layout.flow('vertical'),
    {width: '230px', position: 'bottom-left'}));
    
Map.add(ui.Panel(
    [
      ui.Label('Start of Season', LEGEND_TITLE_STYLE), makeLegend(visDate_SoS1['min'],visDate_SoS1['max']),
      ui.Label('(Day of Year)', LEGEND_FOOTNOTE_STYLE)
    ],
    ui.Panel.Layout.flow('vertical'),
    {width: '230px', position: 'bottom-left'}));

var resultsPanel = ui.Panel(
    chart1,
    ui.Panel.Layout.flow('vertical'),
    {width: '500px', position: 'bottom-right'});
Map.add(resultsPanel);
    


    



Map.onClick(function(coords) {
  var point = ee.Geometry.Point(coords.lon, coords.lat);


var chart1 = ui.Chart.image.series({imageCollection: MODISlai.merge(lineSoS).merge(lineEoS),
  region: point,
  reducer: ee.Reducer.first(), 
  scale: 5000,
  xProperty: 'doy'
})
.setOptions({title: 'Mean MODIS Lai', 
      interpolateNulls: true,
      series: {
        0: {pointSize: 0, lineWidth: 3, color: '2800ff'},
        1: {pointSize: 2, lineWidth: 0, color: '000000'},
        2: {pointSize: 0, lineWidth: 3, color: '3eff00'},
      }})
  
  resultsPanel.clear().add(chart1);
 

});
