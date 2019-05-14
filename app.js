$(document).ready(function () {

    var map;

    require([
    "esri/map",
    "esri/dijit/Search",
    "esri/layers/ArcGISDynamicMapServiceLayer",
    "esri/layers/ImageParameters",
    "esri/InfoTemplate",
    "esri/tasks/IdentifyTask",
    "esri/tasks/IdentifyParameters",
    "esri/dijit/Popup",
    "dojo/_base/array",
    "esri/Color",
    "dojo/dom-construct",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/SimpleLineSymbol",
    "dojo/domReady!"
    ],
    function (Map, Search, ArcGISDynamicMapServiceLayer, ImageParameters, InfoTemplate, IdentifyTask,
    IdentifyParameters, Popup, arrayUtils, Color, domConstruct, SimpleFillSymbol, SimpleLineSymbol) {

        var identifyTask, identifyParams;

        var popup = new Popup({
          fillSymbol: new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
            new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
              new Color([255, 0, 0]), 2), new Color([255, 255, 0, 0.25]))
        }, domConstruct.create("div"));

        map = new Map("mapDiv", {
            center: [-73.1350, 40.7891],
            zoom: 9,
            infoWindow: popup
        });
        
        map.on("load", mapReady);

        //Use the ImageParameters to set map service layer definitions and map service visible layers before adding to the client map.
        var imageParameters = new ImageParameters();

        //I want layers 5,4, and 3 to be visible
        imageParameters.layerIds = [14,16];
        imageParameters.layerOption = ImageParameters.LAYER_OPTION_SHOW;
        imageParameters.transparent = true;

        //construct basemap
        var basemap = new esri.layers.ArcGISTiledMapServiceLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer");


        //construct ArcGISDynamicMapServiceLayer with imageParameters from above
        var dynamicMapServiceLayer = new ArcGISDynamicMapServiceLayer("https://www.sciencebase.gov/arcgis/rest/services/Catalog/590249a9e4b03ed812df5917/MapServer",
        {"imageParameters": imageParameters,
        "opacity": 0.7});

        map.addLayer(basemap);
        map.addLayer(dynamicMapServiceLayer);

        var search = new Search({
            map: map
         }, "search");
         search.startup();

         function mapReady () {
            map.on("click", executeIdentifyTask);
            //create identify tasks and setup parameters
            identifyTask = new IdentifyTask("https://www.sciencebase.gov/arcgis/rest/services/Catalog/590249a9e4b03ed812df5917/MapServer");
  
            identifyParams = new IdentifyParameters();
            identifyParams.tolerance = 3;
            identifyParams.returnGeometry = true;
            identifyParams.layerIds = [14, 16];
            identifyParams.layerOption = IdentifyParameters.LAYER_OPTION_ALL;
            identifyParams.width = map.width;
            identifyParams.height = map.height;
          }

          function executeIdentifyTask (event) {
            identifyParams.geometry = event.mapPoint;
            identifyParams.mapExtent = map.extent;
  
            var deferred = identifyTask
              .execute(identifyParams)
              .addCallback(function (response) {
                // response is an array of identify result objects
                // Let's return an array of features.
                return arrayUtils.map(response, function (result) {
                    console.log("Identified Layer: ", result.layerId);
                  var feature = result.feature;
                  feature.attributes.layerId = result.layerId;
                  //var layerName = result.layerName;
  
                  //feature.attributes.layerName = layerName;

                    //ddsafdsaf

                    if (result.layerId == 15) {
							
                        //fix formatting -- most values have 2 decimal places but some have more to cut to two
                        var calcDTW = parseFloat(feature.attributes.DTW_Frm_MP).toFixed(2).toString();
                        console.log("calcDTW: ", calcDTW);
                        var template = new esri.InfoTemplate("Results", "${Station_Na} <br/> <a href='${HYPERLINK}' target='_blank'>NWIS web link</a> <br/><br/> Measured depth to water (2016), in feet: " + calcDTW);							
                        feature.setInfoTemplate(template);
                        
                    } else if (result.layerId == 17) {
                        
                        //fix formatting -- values are integers with filled in decimal places to truncate to integer
                        var estDTW = parseInt(feature.attributes['Pixel Value']).toString();
                        console.log("estDTW: ", estDTW);
                        var template = new esri.InfoTemplate("Results", "Estimated depth to water below land surface, in feet: " + estDTW);
                        feature.setInfoTemplate(template);
                    }
                    return feature;
                });
              });
  
              map.infoWindow.setFeatures([deferred]);
              map.infoWindow.show(event.mapPoint);
          }
    });


});