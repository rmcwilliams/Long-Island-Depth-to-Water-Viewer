$(document).ready(function () {

    var initYear = "2016";

    function getAllUrlParams() {

        // get query string from url (optional) or window
        var queryString = window.location.search.slice(1);
    
        // we'll store the parameters here
        var obj = {};
    
        // if query string exists
        if (queryString) {
    
            // stuff after # is not part of query string, so get rid of it
            queryString = queryString.split('#')[0];
    
            // split our query string into its component parts
            var arr = queryString.split('&');
    
            for (var i = 0; i < arr.length; i++) {
                // separate the keys and the values
                var a = arr[i].split('=');
    
                // in case params look like: list[]=thing1&list[]=thing2
                var paramNum = undefined;
                var paramName = a[0].replace(/\[\d*\]/, function (v) {
                    paramNum = v.slice(1, -1);
                    return '';
                });
    
                // set parameter value (use 'true' if empty)
                var paramValue = typeof (a[1]) === 'undefined' ? true : a[1];
    
                // (optional) keep case consistent
                paramName = paramName.toLowerCase();
                paramValue = paramValue.toLowerCase();
    
                // if parameter name already exists
                if (obj[paramName]) {
                    // convert value to array (if still string)
                    if (typeof obj[paramName] === 'string') {
                        obj[paramName] = [obj[paramName]];
                    }
                    // if no array index number specified...
                    if (typeof paramNum === 'undefined') {
                        // put the value on the end of the array
                        obj[paramName].push(paramValue);
                    }
                    // if array index number specified...
                    else {
                        // put the value at that index number
                        obj[paramName][paramNum] = paramValue;
                    }
                }
                // if param name doesn't exist yet, set it
                else {
                    obj[paramName] = paramValue;
                }
            }
        }
        return obj;
        // return obj;
    }

    //check if the user entered a url param
    var urlParam = getAllUrlParams();
    
    if (urlParam.year) {
        initYear = urlParam.year;
        document.getElementById('mySelect').value=initYear;
    }



    function populateMap(year, map, ArcGISDynamicMapServiceLayer, ImageParameters, InfoTemplate, IdentifyTask,
        IdentifyParameters, Popup, arrayUtils, Color, domConstruct, SimpleFillSymbol, SimpleLineSymbol) {

        map.on("load", mapReady);

        var identifyTask, identifyParams;

        

        //Use the ImageParameters to set map service layer definitions and map service visible layers before adding to the client map.
        var imageParameters = new ImageParameters();

        //I want layers 5,4, and 3 to be visible
        if (year == "2016") {
            imageParameters.layerIds = [14,16];
        } else if (year == "2013" || year == "2010" || year == "2006") {
            imageParameters.layerIds = [0,2];
        }
        imageParameters.layerOption = ImageParameters.LAYER_OPTION_SHOW;
        imageParameters.transparent = true;

        
        var basemap = new esri.layers.ArcGISTiledMapServiceLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer");


        var dynamicMapServiceLayer;
        //construct ArcGISDynamicMapServiceLayer with imageParameters from above
        if (year == "2016") {
            dynamicMapServiceLayer = new ArcGISDynamicMapServiceLayer("https://www.sciencebase.gov/arcgis/rest/services/Catalog/590249a9e4b03ed812df5917/MapServer",
            {"imageParameters": imageParameters,
            "opacity": 0.7});
        } else if (year == "2013") {
            dynamicMapServiceLayer = new ArcGISDynamicMapServiceLayer("https://www.sciencebase.gov/arcgis/rest/services/Catalog/571fa4aee4b071321fe56c9e/MapServer",
            {"imageParameters": imageParameters,
            "opacity": 0.7});
        } else if (year == "2010") {
            dynamicMapServiceLayer = new ArcGISDynamicMapServiceLayer("https://www.sciencebase.gov/arcgis/rest/services/Catalog/56b3b8b2e4b0cc79997fb3a8/MapServer",
            {"imageParameters": imageParameters,
            "opacity": 0.7});
        } else if (year == "2006") {
            dynamicMapServiceLayer = new ArcGISDynamicMapServiceLayer("https://www.sciencebase.gov/arcgis/rest/services/Catalog/56b3b969e4b0cc79997fb3b4/MapServer",
            {"imageParameters": imageParameters,
            "opacity": 0.7});
        }


        map.addLayer(basemap);
        map.addLayer(dynamicMapServiceLayer);

        function mapReady () {
            map.on("click", executeIdentifyTask);
            //create identify tasks and setup parameters
            if (year == "2016") {
                identifyTask = new IdentifyTask("https://www.sciencebase.gov/arcgis/rest/services/Catalog/590249a9e4b03ed812df5917/MapServer");
            } else if (year == "2013") {
                identifyTask = new IdentifyTask("https://www.sciencebase.gov/arcgis/rest/services/Catalog/571fa4aee4b071321fe56c9e/MapServer");

            } else if (year == "2010") {
                identifyTask = new IdentifyTask("https://www.sciencebase.gov/arcgis/rest/services/Catalog/56b3b8b2e4b0cc79997fb3a8/MapServer");
            } else if (year == "2006") {
                identifyTask = new IdentifyTask("https://www.sciencebase.gov/arcgis/rest/services/Catalog/56b3b969e4b0cc79997fb3b4/MapServer");
            }

            identifyParams = new IdentifyParameters();
            identifyParams.tolerance = 3;
            identifyParams.returnGeometry = true;
            if (year == "2016") {
                identifyParams.layerIds = [14, 16];
            } else if (year == "2013" || year == "2010" || year == "2006") {
                identifyParams.layerIds = [0, 2];
            }
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

                    if (result.layerId == 15 || result.layerId == 1 || result.layerId == 0) {
                            
                        //fix formatting -- most values have 2 decimal places but some have more to cut to two
                        var calcDTW = parseFloat(feature.attributes.DTW_Frm_MP).toFixed(2).toString();
                        console.log("calcDTW: ", calcDTW);
                        var template = new esri.InfoTemplate("Results", "${Station_Na} <br/> <a href='${HYPERLINK}' target='_blank'>NWIS web link</a> <br/><br/> Measured depth to water (" + year + "), in feet: " + calcDTW);							
                        feature.setInfoTemplate(template);
                        
                    } else if (result.layerId == 17 || result.layerId == 3 || result.layerId == 2) {
                        
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
    }

    $('#mobile-main-menu').click(function () {
        $('body').toggleClass('isOpenMenu');
    });

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

        var search = new Search({
            map: map
        }, "search");
        search.startup();

        populateMap(initYear, map, ArcGISDynamicMapServiceLayer, ImageParameters, InfoTemplate, IdentifyTask,
        IdentifyParameters, Popup, arrayUtils, Color, domConstruct, SimpleFillSymbol, SimpleLineSymbol);

    });

    $('#yearDropdown').change(
        function() {
            var val = $('#yearDropdown option:selected').val();
            var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?year=' + val;
            window.history.pushState({ path: newurl }, '', newurl);
            //clear map completely

            map.removeAllLayers();

            

            require([
                "esri/layers/ArcGISDynamicMapServiceLayer",
                "esri/layers/ImageParameters",
                "esri/InfoTemplate",
                "esri/tasks/IdentifyTask",
                "esri/tasks/IdentifyParameters",
                "dojo/_base/array",
                "esri/Color",
                "dojo/dom-construct",
                "esri/symbols/SimpleFillSymbol",
                "esri/symbols/SimpleLineSymbol",
                "dojo/domReady!"
            ],
            function (ArcGISDynamicMapServiceLayer, ImageParameters, InfoTemplate, IdentifyTask,
                IdentifyParameters, arrayUtils, Color, domConstruct, SimpleFillSymbol, SimpleLineSymbol) {
                populateMap(val, map, ArcGISDynamicMapServiceLayer, ImageParameters, InfoTemplate, IdentifyTask,
                    IdentifyParameters, arrayUtils, Color, domConstruct, SimpleFillSymbol, SimpleLineSymbol);
            });
        }
    );

});