/*
 Copyright 2013 RFGrove. All rights reserved.
 */

/*
 * Geoquery app V0.1
 */

var geosparqlUrl = "http://geoquery.cs.jmu.edu/parliament/sparql";

var EPSG4326 = new OpenLayers.Projection("EPSG:4326");
var EPSG900913 = new OpenLayers.Projection("EPSG:900913");

var map;
var wmsLayer;
var osmLayer;
var vectors;

// feature types found in the store
var featureTypes = new Array();

// This array contains features selected with the  most recent search.
var featureSet = new Array();
var displayedFeature;
var selectedFeature1, selectedFeature2;

var layerNames = {};
var layerColors = ['#CCECE6', '#66C2A4', '#006D2C', '#BFD3E6', '#8C96C6', '#810F7C',
  '#F3D49E', '#FC8C59', '#B30000', '#D4B9DA', '#DF65B0', '#980043', '#D9D9D9',
  '#969696', '#252525', '#FFFFB2', '#FEB24C', '#F03B20', '#A51F25', '#FCBBA1'];
var nextColor = 0;

/*
 *  Initialization
 */
$(document).ready(function() {
  // hide dialogs boxes
  $("#queriesDialog").dialog({
    modal: true,
    autoOpen: false,
    width: "auto",
    position: {my: "left top", at: "left top"},
    title: "GeoSparql Query Text"
  });
  $("#attributesDialog").dialog({
    modal: true,
    autoOpen: false,
    width: "auto",
    position: {my: "left top", at: "left top"},
    title: "Attributes"
  });
  
  // display the map
  displayMap();
  setMapBounds();

  // show the current geosparql server url
  $('#url').append(geosparqlUrl);
  
  // get a list of feature types,
  // ..create and list the feature type vectors
  // ..create feature type selectors
  getFeatureTypes();
});

/*
 * Display an initial map;
 */
function displayMap() {
  var mapOptions = {
    projection: new OpenLayers.Projection('EPSG:900913'),
    displayProjection: new OpenLayers.Projection('EPSG:4326'),
    numZoomLevels: 16
  };
  map = new OpenLayers.Map('mapArea', mapOptions);

  wmsLayer = new OpenLayers.Layer.WMS(
          'WMS Layer Title',
          'http://vmap0.tiles.osgeo.org/wms/vmap0',
          {layers: 'basic'},
  {
    "maxResolution": 33395,
    "minResolution": "auto"
  }
  );
  var osmLayer = new OpenLayers.Layer.OSM(
          'OpenStreeetMap Layer'
          );
  vectors = new OpenLayers.Layer.Vector('Search Results');
  map.addLayers([osmLayer, wmsLayer, vectors]);

  map.addControls([
    new OpenLayers.Control.PanZoomBar({}),
    new OpenLayers.Control.LayerSwitcher({'div': OpenLayers.Util.getElement('featureListArea'), overflow: scroll}),
    new OpenLayers.Control.MousePosition(),
    new OpenLayers.Control.Navigation({'zoomWheelEnabled': false})
            // new OpenLayers.Control.OverviewMap(),
            // new OpenLayers.Control.Permalink(),
            // new OpenLayers.Control.ScaleLine(),
            // new OpenLayers.Control.KeyboardDefaults(),
  ]);

  // need to disable mouse zoom for each control
  controls = map.getControlsByClass('OpenLayers.Control.Navigation');
  for (var i = 0; i < controls.length; ++i)
    controls[i].disableZoomWheel();

  if (!map.getCenter()) {
    map.zoomToMaxExtent();
  }
}

/*
 * Set the default map bounds if there is a triple in the data store
 * with this format:
 *
 * <http://geoquery.cs.jmu.edu/rdf/gu/Geometries/initial_bounds> 
 *  <http://www.opengis.net/geosparql#asWKT> 
 *  "POLYGON((...))"^^<http://www.opengis.net/sf#wktLiteral> . 
 */
function setMapBounds() {
  var boundsQuery = '\
SELECT DISTINCT ?wkt \n\
WHERE { \n\
 <http://geoquery.cs.jmu.edu/rdf/gu/Geometries/initial_bounds>  <http://www.opengis.net/geosparql#asWKT> ?wkt . \n\
} ';
  $('#queryDialogText').append(filter(boundsQuery) + "\n");

  var request = $.ajax({
    type: "GET",
    url: geosparqlUrl,
    data: {
      "query": boundsQuery,
      "output": "json"
    }
  });

  request.done(function(msg) {
    var result;

    // sometimes a string, sometimes an object ???
    if (typeof(msg) === "string") {
      result = JSON.parse(msg);
    }
    else {
      result = msg;
    }

    var mapGeom = result['results']['bindings'][0]['wkt'].value;
    //mapGeom= 'POLYGON((-81.25 37.26,-75.95 37.26,-75.95 39.82,-81.25 39.82,-81.25 37.26))';

    var options = {
      'internalProjection': map.baseLayer.projection,
      'externalProjection': new OpenLayers.Projection('EPSG:4269')
    };
    var parser = new OpenLayers.Format.WKT(options);
    var feature = parser.read(mapGeom);
    mapBounds = feature.geometry.getBounds();
    map.zoomToExtent(mapBounds);
  });

  request.fail(function(jqXHR, textStatus) {
    alert("Using default map bounds");
  });
}

/*
 * Get a list of features from the Parliament store.
 */
function getFeatureTypes() {
  var featureQuery = '\
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n\
SELECT DISTINCT ?type \n\
WHERE { \n\
 ?feature rdf:type ?type . \n\
} \n';

  $('#queryDialogText').append(filter(featureQuery) + "\n");

  var request = $.ajax({
    type: "GET",
    url: geosparqlUrl,
    data: {
      "query": featureQuery,
      "output": "json"
    }
  });

  request.done(function(msg) {
    var result;

    // sometimes a string, sometimes an object ???
    if (typeof(msg) === "string") {
      result = JSON.parse(msg);
    }
    else {
      result = msg;
    }

    for (var j = 0; j < result['results']['bindings'].length; ++j) {
      var featureType = result['results']['bindings'][j]['type'].value;
      featureTypes.push(featureType);
    }

    addFeatureTypeVectors();
    buildFeatureTypeSelector();
  });

  request.fail(function(jqXHR, textStatus) {
    alert("Request Failed: " + textStatus);
  });
}

/*
 * Build feature type selectors
 */
function buildFeatureTypeSelector() {
  // build a feature selector
  var $selector1 = $('<select></select>');
  $("<option />", {value: "", text: "Select Feature Type"}).appendTo($selector1);

  // add each feature to the selector
  for (var i in featureTypes) {
    $("<option />", {value: featureTypes[i], text: featureTypes[i]}).appendTo($selector1);
  }

  var $selector2 = $selector1.clone();

  $selector1.change(function() {
    buildRelationshipSelector($(this).val(), 1);
  });
  $selector2.change(function() {
    buildRelationshipSelector($(this).val(), 2);
  });

  // add the feature selector to the input area
  $('#featureTypeSelector1').empty().append($selector1);
  $('#featureTypeSelector2').empty().append($selector2);
}

/*
 * Add a map vector for each feature type.
 */
function addFeatureTypeVectors() {
  for (var i in featureTypes) {
    var layer = new OpenLayers.Layer.Vector(featureTypes[i],
            {visibility: false}
    );

    /*
     *  Add an event handler to each layer.
     *  "this" refers to the vector layer, since the event is
     *  triggered in its context.
     */
    layer.events.register('visibilitychanged', layer,
            function(event) {
              if (this.visibility && !layerNames[this.name]) {
                populateVector(this);
                layerNames[this.name] = true;
                this.style = {
                  'strokeWidth': 1,
                  'strokeColor': '#000000',
                  'fillColor': layerColors[nextColor],
                  'fillOpacity': 0.4
                };
                nextColor = (nextColor + 1) % layerColors.length;
              }
            }
    );
    map.addLayer(layer);
  }
}

/*
 * Add all of the features of the specified type to the vector.
 * 
 * Parameters:
 *  vector: a map vector object
 * Return: none
 */
function populateVector(vector) {
  alert('adding features to: ' + vector.name);

  var query = '\
PREFIX geo: <http://www.opengis.net/ont/geosparql#>\n\
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n\
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n\
SELECT DISTINCT ?wkt\n\
WHERE { \n\
  ?feature rdf:type <' + vector.name + '> . \n\
  FILTER (?feature != <http://cegis.usgs.gov/rdf/struct/Features/None>) . \n\
  ?feature geo:hasGeometry ?geom . \n\
  ?geom geo:asWKT ?wkt . \n\
} LIMIT 100\n';

  $('#queryDialogText').append(filter(query) + "\n");

  var request = $.ajax({
    type: "GET",
    url: geosparqlUrl,
    data: {
      "query": query,
      "output": "json"
    }
  });

  request.done(function(msg) {
    var result;

    // sometimes a string, sometimes an object ???
    if (typeof(msg) === "string") {
      result = JSON.parse(msg);
    }
    else {
      result = msg;
    }

    updateMap(result, vector, true);
    alert('finished feature vector: ' + vector.name);
  });

  request.fail(function(jqXHR, textStatus) {
    alert("Request Failed: " + textStatus);
  });
}

/*
 * Get a list of relationships for the given feature type,
 * and populate the appropriate selector. 
 */
function buildRelationshipSelector(featureType, position) {
  if (typeof(featureType) !== "string" || featureType.length === 0)
    return;

  $('#propertySelector' + position).empty();

  var featureQuery = '\
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n\
SELECT DISTINCT ?rel \n\
WHERE { \n\
?feature rdf:type <' + featureType + '> ; \n\
 ?rel ?obj . \n\
} \n';

  $('#queryDialogText').append(filter(featureQuery) + "\n");

  var request = $.ajax({
    type: "GET",
    url: geosparqlUrl,
    data: {
      "query": featureQuery,
      "output": "json"
    }
  });

  request.done(function(msg) {
    var result;

    // sometimes a string, sometimes an object ???
    if (typeof(msg) === "string") {
      result = JSON.parse(msg);
    }
    else {
      result = msg;
    }

    // build selector
    var $selector = $('<select></select>');
    $("<option />", {value: "", text: "Select Relationship"}).appendTo($selector);
    for (var j = 0; j < result['results']['bindings'].length; ++j) {
      var relationship = result['results']['bindings'][j]['rel'].value;
      $("<option />", {value: relationship, text: relationship}).appendTo($selector);
    }

    $('#propertySelector' + position).empty().append($selector);
  });

  request.fail(function(jqXHR, textStatus) {
    alert("Request Failed: " + textStatus);
  });
}

/*
 * Get a list of features matching the specified string, within
 * the extent of the map, and display the list.
 * 
 * 1. setup and send the ajax query
 * 2. when completed, invoke updateResults to list results
 * 
 * Parameters: none
 * Return: none
 */
function searchFeatures(position) {
  $('#queryResultArea').empty();
  $('#queryResultArea').removeClass("colorGroup1 colorGroup2");
  $('#queryResultArea').addClass("colorGroup" + position);

  // Determine search criteria
  var searchType = $('#featureTypeSelector' + position + ' option:selected').text();
  var searchRelationship = $('#propertySelector' + position + ' option:selected').text();
  var searchTerm = $('#searchTerm' + position).val();

  var query = '\
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n\
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n\
SELECT DISTINCT ?feature ?label \n\
WHERE { \n\
  ?feature rdf:type <' + searchType + '> .\n\
  FILTER (?feature != <http://cegis.usgs.gov/rdf/struct/Features/None>) .\n\
  ?feature <' + searchRelationship + '> ?obj .\n\
  FILTER( regex(str(?obj), "' + searchTerm + '", "i" ) ) .\n\
  ?feature rdfs:label ?label .\n\
} \n';

  $('#queryDialogText').append(filter(query) + "\n");

  var request = $.ajax({
    type: "GET",
    url: geosparqlUrl,
    data: {
      "query": query,
      "output": "json"
    }
  });

  request.done(function(msg) {
    var result;

    // sometimes a string, sometimes an object ???
    if (typeof(msg) === "string") {
      result = JSON.parse(msg);
    }
    else {
      result = msg;
    }

    updateResult(result, position);
  });

  request.fail(function(jqXHR, textStatus) {
    alert("Request Failed: " + textStatus);
  });
}

/*
 * List results of the query.
 *
 * Parameters:  
 *  result: A JSON object encapsulating the GeoSPARQL query result.
 * Return:  none
 * Side-Effects: 
 *  builds featureSet, an array of feature labels
 */
function updateResult(result, position) {
  // build a feature table
  var $tbl = $('<table>').attr('id', 'basicTable');

  // Create table headings
  var $tr = $('<tr>');
  for (var i = 0; i < result['head']['vars'].length; ++i) {
    $tr.append($('<th>').text(result['head']['vars'][i]));
  }
//  $tbl.append($tr);

  // add search result elements to the table and selector
  for (var j = 0; j < result['results']['bindings'].length; j++) {
    $tr = $('<tr>');
    $td = $('<td>').text((j + 1) + '.');
    $tr.append($td);

    var label = result['results']['bindings'][j]['label'].value;
    $td = $('<td>').text(label);

    var feature = result['results']['bindings'][j]['feature'].value;
    featureSet[j] = feature;

    $td.click(function() {
      var row = $(this).parent().parent().children().index($(this).parent());
      addFeatureToMap(featureSet[row], $(this).text(), true);
      $('#soFeature' + position).empty().append($(this).text());
      if (position === 1) {
        selectedFeature1 = featureSet[row];
        $('#spatialOp1Button').removeAttr( "disabled" );
      } else {
        selectedFeature2 = featureSet[row];
        $('#spatialOp2Button').removeAttr( "disabled" );
      }
    });

    $td.dblclick(function() {
      showAttributes();
    });

    $td.mouseenter(function() {
      $(this).css({backgroundColor: 'white'});
    });
    $td.mouseleave(function() {
      $(this).css({backgroundColor: ''});
    });
    $tr.append($td);

    $tbl.append($tr);
  }

  $('#queryResultArea').append($tbl);

  $('#queryResultArea').append('<p>(Click an item to map it, double-click for attributes.)</p>');
  $('#queryResultArea').append('\
        <p>\
          <input type="button" value="Add all to map" onclick="addAllFeaturesToMap();">\
        </p>');
}  // end updateResult()

/*
 * Add all features from the search results to the search vector layer.
 * 
 * Parameters: none
 * Return: none
 */
function addAllFeaturesToMap() {
  addFeatureToMap(featureSet[0], '', true);
  for (var i = 1; i < featureSet.length; i++) {
    addFeatureToMap(featureSet[i], '', false);
  }
}

/*
 * Display the selected feature on the map, and update the selection
 * criteria with the feature name.
 *
 * Parameters:
 *   feature: the id of the feature to be added
 *   label: the label of the feature
 *   clearVector: if true, clear the vector first
 * Returns: none
 */
function addFeatureToMap(feature, label, clearVector) {
  displayedFeature = feature;

  var query = '\
PREFIX geo: <http://www.opengis.net/ont/geosparql#>\n\
SELECT ?wkt \n\
WHERE { \n\
   <' + feature + '> geo:hasGeometry ?g . \n\
   ?g geo:asWKT ?wkt . \n\
} \n';

  $('#queryDialogText').append(filter(query) + "\n");

  var request = $.ajax({
    type: "GET",
    url: geosparqlUrl,
    data: {
      "query": query,
      "output": "json"
    }
  });

  request.done(function(msg) {
    var result;

    // sometimes a string, sometimes an object ???
    if (typeof(msg) === "string") {
      result = JSON.parse(msg);
    }
    else {
      result = msg;
    }

    updateMap(result, vectors, clearVector);
  });

  request.fail(function(jqXHR, textStatus) {
    alert("Request Failed: " + textStatus);
  });
}

/*
 * Perform a single operand spatial operation.
 * 
 * 1. setup and send the ajax query
 * 2. when completed, update the distance.
 */
function spatialOp1() {
  var spatialOperation = $('#spatialOperationSelector1 option:selected').text();

  var queryTerm;
  if (spatialOperation === 'buffer') {
    queryTerm = 'BIND (geof:' + spatialOperation + '(?wkt1, 1000, units:metre) AS ?wkt) .';
  }
  else {
    queryTerm = 'BIND (geof:' + spatialOperation + '(?wkt1) AS ?wkt) .';
  }

  var query = '\
PREFIX geo: <http://www.opengis.net/ont/geosparql#>\n\
PREFIX geof: <http://www.opengis.net/def/function/geosparql/>\n\
PREFIX units: <http://www.opengis.net/def/uom/OGC/1.0/>\n\
\n\
SELECT ?wkt \n\
WHERE { \n\
   <' + selectedFeature1 + '> geo:hasGeometry ?g1 . \n\
   ?g1 geo:asWKT ?wkt1 . \n\
   ' + queryTerm + '\n\
}';

  $('#queryDialogText').append(filter(query) + "\n");

  var request = $.ajax({
    type: "GET",
    url: "http://grove.cs.jmu.edu/parliament/sparql",
    data: {
      "query": query,
      "output": "json"
    }
  });

  request.done(function(msg) {
    var result;

    // sometimes a string, sometimes an object ???
    if (typeof(msg) === "string") {
      result = JSON.parse(msg);
    }
    else {
      result = msg;
    }
    updateMap(result, vectors, true);
  });

  request.fail(function(jqXHR, textStatus) {
    alert("Request Failed: " + textStatus);
  });
}

/*
 * Perform a two operand spatial operation.
 * 
 * 1. setup and send the ajax query
 * 2. when completed, update the distance.
 */
function spatialOp2() {
  var spatialOperation = $('#spatialOperationSelector2 option:selected').text();

  var query1 = '\
PREFIX geo: <http://www.opengis.net/ont/geosparql#>\n\
PREFIX geof: <http://www.opengis.net/def/function/geosparql/>\n\
PREFIX units: <http://www.opengis.net/def/uom/OGC/1.0/>\n\
\n\
SELECT ?wkt \n\
WHERE { \n\
   <' + selectedFeature1 + '> geo:hasGeometry ?g1 . \n\
   ?g1 geo:asWKT ?wkt1 . \n\
   <' + selectedFeature2 + '> geo:hasGeometry ?g2 . \n\
   ?g2 geo:asWKT ?wkt2 . \n\
   BIND (geof:' + spatialOperation + '(?wkt1, ?wkt2) AS ?wkt) . \n\
}';
  
  var query2 = '\n\
PREFIX geo: <http://www.opengis.net/ont/geosparql#>\n\
PREFIX geof: <http://www.opengis.net/def/function/geosparql/>\n\
PREFIX units: <http://www.opengis.net/def/uom/OGC/1.0/>\n\
\n\
SELECT ?distance\n\
WHERE { \n\
   <' + selectedFeature1 + '> geo:hasGeometry ?g1 . \n\
   ?g1 geo:asWKT ?wkt1 . \n\
   <' + selectedFeature2 + '> geo:hasGeometry ?g2 . \n\
   ?g2 geo:asWKT ?wkt2 . \n\
   BIND (geof:distance(?wkt1, ?wkt2, units:metre) AS ?distance) . \n\
}';

  var query = (spatialOperation === "distance") ? query2 : query1;
  $('#queryDialogText').append(filter(query) + "\n");

  var request = $.ajax({
    type: "GET",
    url: "http://grove.cs.jmu.edu/parliament/sparql",
    data: {
      "query": query,
      "output": "json"
    }
  });

  request.done(function(msg) {
    var result;

    // sometimes a string, sometimes an object ???
    if (typeof(msg) == "string") {
      result = JSON.parse(msg);
    }
    else {
      result = msg;
    }

    if (spatialOperation === "distance" ) {
      var km = result['results']['bindings'][0]['distance'].value / 1000;
      alert("Distance from Feature1 to Feature 2 in km: " + km);
    }
    else {
      updateMap(result, vectors, true);
    }
  });

  request.fail(function(jqXHR, textStatus) {
    alert("Request Failed: " + textStatus);
  });
}

/*
 * Update map display with the given result.
 *
 * Parameters: 
 *   result: the value returned from Parliament
 *   vector: the vector to which to add the features
 *   clearVector: if true, clear the vector first
 * Return: none
 */
function updateMap(result, vector, clearVector) {
  var features = new Array();
  var bounds;
  var options = {
    'internalProjection': map.baseLayer.projection,
    'externalProjection': new OpenLayers.Projection('EPSG:4269')
  };
  var parser = new OpenLayers.Format.WKT(options);

  if (clearVector) {
    vectors.removeAllFeatures();
  }

  for (i = 0; i < result['results']['bindings'].length; ++i) {
    var wkt = result['results']['bindings'][i]['wkt'];

    if (wkt === undefined) {
      alert('no wkt available');
      return true;
    }

    // Remove CRS from from of wkt
    var wkt2 = wkt['value'];

    if (wkt2.split(/\>/)[1] !== undefined) {
      wkt2 = wkt2.split(/\>/)[1];
    }

    var feat = parser.read(wkt2);
    if (feat !== undefined) {
      features.push(feat);
    }
  }

  vectors.addFeatures(features);
}

/*
 * Show the attributes of the selected feature
 * 
 * Parameters: none
 * Return: none
 */
function showAttributes() {

  if (!displayedFeature) {
    alert("No feature selected yet!");
    return;
  }

  var query = '\n\
SELECT ?rel ?obj \n\
WHERE { \n\
   <' + displayedFeature + '> ?rel ?obj . \n\
} ';

  $('#queryDialogText').append(filter(query) + "\n");

  var request = $.ajax({
    type: "GET",
    url: geosparqlUrl,
    data: {
      "query": query,
      "output": "json"
    }
  });

  request.done(function(msg) {
    var result;

    // sometimes a string, sometimes an object ???
    if (typeof(msg) === "string") {
      result = JSON.parse(msg);
    }
    else {
      result = msg;
    }

    updateAttributeDialog(result);
  });

  request.fail(function(jqXHR, textStatus) {
    alert("Request Failed: " + textStatus);
  });
}

/*
 * Show the attributes of a selected feature in the attribute
 * dialog box.
 *        
 * Parameters: none
 * Return: none
 */
function updateAttributeDialog(result) {
  $('#attributesDialogText').empty();

  for (i = 0; i < result['results']['bindings'].length; ++i) {
    var rel = result['results']['bindings'][i]['rel']['value'];
    var obj = result['results']['bindings'][i]['obj']['value'];
    $('#attributesDialogText').append(rel + " = " + obj + "\n");
  }

  $('#attributesDialog').dialog('open');
}

/*
 * Replace HTML delimiters (<, >) with HTML escape codes.
 * 
 * Parameters: 
 *  query - a geosparql query
 * Return: the same query, with delimiters (< >) replaced by HTML
 * escape codes (&lt; &gt;).
 */
function filter(query) {
  return query.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/*
 * Show the accumulated Geosparql queries in a dialog box.
 * 
 * Parameters: none
 * Return: none
 */
function showQueries() {
  $('#queriesDialog').dialog('open');
}

/*
 * Change the geosparql server url.
 * 
 * Parameters: none
 * Return: none
 */
function changeUrl() {
  geosparqlUrl = prompt("Enter URL:", geosparqlUrl);
  $('#url').empty().append(geosparqlUrl);
  getFeatureTypes();
}

/*
 * Return the bounds of the current map viewport as a POLYGON string.
 * 
 * Parameters: none
 * Return: A string showing the current map boundary coordinates
 *  as a POLYGON.
 */
function getMapBoundsAsString() {
  var bounds = map.getExtent().clone();
  bounds = bounds.transform(EPSG900913, EPSG4326);
  return bounds.toGeometry().toString();
}
