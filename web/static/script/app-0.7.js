/*
 Copyright 2013 RFGrove. All rights reserved.
 */

/*
 * Geoquery app V0.4
 */
var geosparqlUrl = "http://geoquery.cs.jmu.edu/parliament/sparql";

var EPSG4326 = new OpenLayers.Projection("EPSG:4326");
var EPSG900913 = new OpenLayers.Projection("EPSG:900913");

var map;
var wmsLayer;
var osmLayer;
var searchResultLayers = new Array();

// feature types found in the store
var featureTypes = new Array();
var featureVectorLayers = new Array();

// These arrays contain features selected with the most recent search.
var featureSet1, featureSet2;

// These are the features selected from each set of search results
var selectedFeature1 = {featureId: undefined, spatialOpTerm: undefined};
var selectedFeature2 = {featureId: undefined, spatialOpTerm: undefined};

var layerNames = {};
var layerColors = ['#CCECE6', '#66C2A4', '#006D2C', '#BFD3E6', '#8C96C6', '#810F7C',
  '#F3D49E', '#FC8C59', '#B30000', '#D4B9DA', '#DF65B0', '#980043', '#D9D9D9',
  '#969696', '#252525', '#FFFFB2', '#FEB24C', '#F03B20', '#A51F25', '#FCBBA1'];
var nextColor = 0;

// Necessary to allow cross-domain Ajax requestss in IE
jQuery.support.cors = true;

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
    title: "Queries",
    buttons: {
      Close: function() {
        jQuery(this).dialog('close');
      }
    }
  });
  $("#attributesDialog").dialog({
    modal: true,
    autoOpen: false,
    width: "auto",
    position: {my: "left top", at: "left top"},
    title: "Attributes",
    buttons: {
      Close: function() {
        jQuery(this).dialog('close');
      }
    }
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
 * 
 * @param none
 * @return none
 */
function displayMap() {
  var mapOptions = {
    projection: new OpenLayers.Projection('EPSG:900913'),
    displayProjection: new OpenLayers.Projection('EPSG:4326'),
    numZoomLevels: 16
  };
  map = new OpenLayers.Map('mapArea', mapOptions);

  wmsLayer = new OpenLayers.Layer.WMS(
          'Web Map Service',
          'http://vmap0.tiles.osgeo.org/wms/vmap0',
          {layers: 'basic'},
  {
    "maxResolution": 33395,
    "minResolution": "auto"
  }
  );
  var osmLayer = new OpenLayers.Layer.OSM(
          'Open Streeet Map'
          );
  map.addLayers([osmLayer, wmsLayer]);

  searchResultLayers[1] = new OpenLayers.Layer.Vector('Feature 1 Selection');
  searchResultLayers[1].style = {
    'strokeWidth': 1,
    'strokeColor': '#000000',
    'fillColor': '#F79F81',
    'fillOpacity': 0.4,
    'pointRadius': 6
  };
  searchResultLayers[2] = new OpenLayers.Layer.Vector('Feature 2 Selection');
  searchResultLayers[2].style = {
    'strokeWidth': 1,
    'strokeColor': '#000000',
    'fillColor': '#81F7D8',
    'fillOpacity': 0.4,
    'pointRadius': 6
  };
  searchResultLayers[0] = new OpenLayers.Layer.Vector('Binary Spatial Operation');
  map.addLayers([searchResultLayers[1], searchResultLayers[2], searchResultLayers[0]]);

  map.addControls([
    new OpenLayers.Control.PanZoomBar({}),
    new OpenLayers.Control.LayerSwitcher({
      'div': OpenLayers.Util.getElement('featureListArea'),
      overflow: scroll}),
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
 *  
 * @param none
 * @return none
 */
function setMapBounds() {
  var boundsQuery = '\
SELECT DISTINCT ?wkt \n\
WHERE { \n\
 <http://geoquery.cs.jmu.edu/rdf/gu/Geometries/initial_bounds>  <http://www.opengis.net/geosparql#asWKT> ?wkt . \n\
} ';
  log(boundsQuery);


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
 * Get a list of feature types from the Parliament store.
 * 
 * @param none
 * @return none
 */
function getFeatureTypes() {
  // reset array to remove old feature types 
  featureTypes = new Array();

  // remove old feature vectors from map
  for (var i in featureVectorLayers) {
    map.removeLayer(featureVectorLayers[i]);
  }
  featureVectorLayers = new Array();

  var featureQuery = '\
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n\
SELECT DISTINCT ?type \n\
WHERE { \n\
 ?feature rdf:type ?type . \n\
} \n';

  log(featureQuery);

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

    addFeatureTypeVectorLayers();
    buildFeatureTypeSelector();
  });

  request.fail(function(jqXHR, textStatus) {
    alert("Request Failed: " + textStatus);
  });
}

/*
 * Build feature type selectors
 * 
 * @param none
 * @return none
 */
function buildFeatureTypeSelector() {
  // build a feature selector
  var $selector1 = $('<select></select>');
  $("<option />", {value: "", text: "--Select Feature Type--"}).appendTo($selector1);

  // add each feature to the selector
  for (var i in featureTypes) {
    $("<option />", {value: featureTypes[i], text: featureTypes[i]}).appendTo($selector1);
  }

  var $selector2 = $selector1.clone();

  $selector1.change(function() {
    buildPropertySelector($(this).val(), 1);
  });
  $selector2.change(function() {
    buildPropertySelector($(this).val(), 2);
  });

  // add the feature selector to the input area
  $('#featureTypeSelector1').empty().append($selector1);
  $('#featureTypeSelector2').empty().append($selector2);
}

/*
 * Add a map vector layer for each feature type.
 * 
 * @param none
 * @return none
 */
function addFeatureTypeVectorLayers() {
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
    featureVectorLayers.push(layer);
    map.addLayer(layer);
  }
}

/*
 * Add all of the features of the specified type to the vector.
 * 
 * @param
 *  vector: a map vector object
 * @return none
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
  # Eliminate the group of features ending in "/None" \n\
  FILTER(! regex(str(?feature), "/None$", "i" ) ) . \n\
  ?feature geo:hasGeometry ?geom . \n\
  ?geom geo:asWKT ?wkt . \n\
} LIMIT 100\n';

  log(query);

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

    vector.removeAllFeatures();
    updateMap(result, vector);
    alert('finished feature vector: ' + vector.name);
  });

  request.fail(function(jqXHR, textStatus) {
    alert("Request Failed: " + textStatus);
  });
}

/*
 * Get a list of relationships for the given feature type,
 * and populate the appropriate selector. 
 * 
 * @param 
 *   featureType: the selected feature type
 *   position: the search position 1 (left) or 2 (right)
 * @return none
 */
function buildPropertySelector(featureType, position) {
  if (typeof(featureType) !== "string" || featureType.length === 0)
    return;

  $('#propertySelector' + position).empty().append('...working...');

  var featureQuery = '\
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n\
SELECT DISTINCT ?rel \n\
WHERE { \n\
?feature rdf:type <' + featureType + '> ; \n\
 ?rel ?obj . \n\
} \n';

  log(featureQuery);

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
    $("<option />", {value: "", text: "--Select Property--"}).appendTo($selector);
    for (var j = 0; j < result['results']['bindings'].length; ++j) {
      var relationship = result['results']['bindings'][j]['rel'].value;
      $("<option />", {value: relationship, text: relationship}).appendTo($selector);
    }

    $('#propertySelector' + position).empty().append($selector);
    $('#searchTerm' + position).val('');
  });

  request.fail(function(jqXHR, textStatus) {
    alert("Request Failed: " + textStatus);
  });
}

/*
 * Get a list of features matching the specified query, and display
 * the list.
 * 
 * 1. setup and send the ajax query
 * 2. when completed, invoke updateResults to list results
 * 
 * @param position The position of the query (1=left, 2=right)
 * @return none
 */
function searchFeatures(position) {
  $('#queryResultArea' + position).empty().append('...working...');

  // Determine search criteria
  var searchType = $('#featureTypeSelector' + position + ' option:selected').text();
  var searchProperty = $('#propertySelector' + position + ' option:selected').text();
  var searchTerm = $('#searchTerm' + position).val();
  var searchRelation = (position === 1 ? "--" : $('#spatialRelationSelector2 option:selected').val());

  // must have a search type selected
  if (searchType.search(/^--/) >= 0) {
    alert('A Feature Type must be selected.');
    return;
  }

  // must have a valid search term or search relation (only position 2 has relations)
  if (position === 1) {
    if (searchProperty.search(/^--/) >= 0) {
      alert('A search property must be specified.');
      return;
    }
  }
  else { // position 2
    if (searchProperty.search(/^--/) >= 0 && searchRelation.search(/^--/) >= 0) {
      alert('A search property or relation must be specified.');
      return;
    }
    if (searchRelation.search(/^--/) < 0 && !selectedFeature1.featureId) {
      alert('Feature 1 must be selected in order to use a spatial relation.');
      return;
    }
  }

  var spatialOpTerm1 = undefined;
  if (selectedFeature1.spatialOpTerm) {
    spatialOpTerm1 = selectedFeature1.spatialOpTerm.replace(/wkt/g, "wkt1");
  }

  var query = '\
PREFIX geo: <http://www.opengis.net/ont/geosparql#>\n\
PREFIX geof: <http://www.opengis.net/def/function/geosparql/>\n\
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n\
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n\
PREFIX units: <http://www.opengis.net/def/uom/OGC/1.0/>\n\
SELECT DISTINCT ?feature ?label \n\
WHERE { \n\
 # Select features of the specified type:\n\
  ?feature rdf:type <' + searchType + '> . \n\
  # Eliminate the group of features ending in "/None" \n\
  FILTER(! regex(str(?feature), "/None$", "i" ) ) . \n\
  ?feature rdfs:label ?label . \n';

  // add search by property terms if applicable
  if (searchProperty.search(/^--/) == -1) {
    query += '\
 # Filter features by property: \n\
  ?feature <' + searchProperty + '> ?obj .\n\
  FILTER( regex(str(?obj), "' + searchTerm + '", "i" ) ) . \n';
  }

  // add search by relationship terms if applicable
  if (searchRelation.search(/^--/) == -1) {
    query += '\
 # Filter features by relation to feature1: \n\
  <' + selectedFeature1.featureId + '> geo:hasGeometry ?g1.\n\
  ?g1 geo:asWKT ?wkt1f. \n\
  ' + spatialOpTerm1 + ' \n\
  ?feature geo:hasGeometry ?g2.\n\
  ?g2 geo:asWKT ?wkt2.\n\
  FILTER (geof:' + searchRelation + '(?wkt2, ?wkt1)). \n';
  }

  // close query
  query += '}';

  log(query);

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

    updateSearchResult(result, position);
  });

  request.fail(function(jqXHR, textStatus) {
    alert("Request Failed: " + textStatus);
  });
}

/*
 * List results of the query, and display them on the map.
 *
 * @param  
 *  result: A JSON object encapsulating the GeoSPARQL query result.
 * @return  none
 * Side-Effects: 
 *  builds featureSet, an array of feature labels
 */
function updateSearchResult(result, position) {
  var featureSet = new Array();
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
      handleFeatureSelection($(this), position);
    });

    $td.dblclick(function() {
      showAttributes($(this), position);
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

  $('#queryResultArea' + position).empty().append('<p>(Click to select; Double-click for attributes)</p>');
  $('#queryResultArea' + position).append($tbl);

  // save the new feature set 
  if (position === 1) {
    featureSet1 = featureSet;
  }
  else {
    featureSet2 = featureSet;
  }

  // add all features to map
  $('#selectedFeature' + position + 'NameA').empty().append('ALL');
  addFeatureToMap(position, featureSet[0], '', true);
  for (var i = 1; i < featureSet.length; i++) {
    addFeatureToMap(position, featureSet[i], '', false);
  }
}  // end updateResult()

/*
 * Handle a click on a feature listed under Search Results.
 * 
 * @param
 *   entry - a reference to the td entry from the feature list table
 *   position - 1 or 2, the number of the feature selection block that generated
 *     the table originally.
 * @return none
 */
function handleFeatureSelection(entry, position) {
  var featureSet = (position === 1 ? featureSet1 : featureSet2);

  // get the row number of the feature that was clicked
  var row = entry.parent().parent().children().index(entry.parent());

  //add the corresponding feature to the map
  addFeatureToMap(position, featureSet[row], entry.text(), true);

  // list the feature in the search block
  $('#selectedFeature' + position + 'NameA').empty().append(entry.text());
  $('#selectedFeature' + position + 'NameB').empty().append(entry.text());
  $('#selectedFeature' + position + 'NameC').empty().append(entry.text());

  // turn on the spatial op buttons
  if (position === 1) {
    selectedFeature1.featureId = featureSet[row];
    $('#spatialOp1None').attr('checked', 'checked');
    selectedFeature1.spatialOpTerm = 'BIND (?wktf AS ?wkt) .';
  } else {
    selectedFeature2.featureId = featureSet[row];
    $('#spatialOp2None').attr('checked', 'checked');
    selectedFeature2.spatialOpTerm = 'BIND (?wktf AS ?wkt) .';
  }
}

/*
 * Display the selected feature on the map, and update the selection
 * criteria with the feature name.
 *
 * @param
 *   position: the search position (0 - default map, 1 - left, 2 - right)
 *   feature: the id of the feature to be added
 *   label: the label of the feature
 *   clearVector: if true, clear the vector first
 * Returns: none
 */
function addFeatureToMap(position, feature, label, clearVector) {
  if (clearVector) {
    searchResultLayers[position].removeAllFeatures();
  }

  var query = '\
PREFIX geo: <http://www.opengis.net/ont/geosparql#>\n\
SELECT ?wkt \n\
WHERE { \n\
   <' + feature + '> geo:hasGeometry ?g . \n\
   ?g geo:asWKT ?wkt . \n\
} \n';

  log(query);

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
    updateMap(result, searchResultLayers[position]);
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
 * 
 * @param
 *   position: the search position, 1 (left) or 2 (right)
 * @return none
 */
function unarySpatialOp(position) {
  if (position < 1 || position > 2)
    return; // validate parameter

  var spatialOperation = $('input:radio[name=spatialOp' + position + ']:checked').val();

  var queryTerm;
  if (spatialOperation === 'none') {
    queryTerm = 'BIND (?wktf AS ?wkt) .';
  }
  else if (spatialOperation === 'buffer') {
    var bufferSize = $('#buffer' + position).val();
    var intRegExp = new RegExp("^[0-9]+$");
    if (bufferSize === undefined || !intRegExp.test(bufferSize)) {
      alert('You must provide an integer buffer size.');
      return;
    }
    queryTerm = 'BIND (geof:' + spatialOperation + '(?wktf, ' + bufferSize + ', units:metre) AS ?wkt) .';
  }
  else {
    queryTerm = 'BIND (geof:' + spatialOperation + '(?wktf) AS ?wkt) .';
  }

  if (position == 1) {
    selectedFeature1.spatialOpTerm = queryTerm;
  }
  else {
    selectedFeature2.spatialOpTerm = queryTerm;
  }


  var query = '\
PREFIX geo: <http://www.opengis.net/ont/geosparql#>\n\
PREFIX geof: <http://www.opengis.net/def/function/geosparql/>\n\
PREFIX units: <http://www.opengis.net/def/uom/OGC/1.0/>\n\
SELECT ?wkt \n\
WHERE { \n\
   <'
          + (position === 1 ? selectedFeature1.featureId : selectedFeature2.featureId)
          + '> geo:hasGeometry ?g1 . \n\
   ?g1 geo:asWKT ?wktf . \n\
   ' + queryTerm + '\n\
}';

  log(query);

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

    searchResultLayers[position].removeAllFeatures();
    updateMap(result, searchResultLayers[position]);
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
 * 
 * @param none
 * @return none
 */
function binarySpatialOp() {
  if (!selectedFeature1.featureId || !selectedFeature2.featureId) {
    return;
  }

  var spatialOperation = $('#spatialOperationSelector3 option:selected').text();

  // Prepare the unary spatial operator terms from feature 1 and feater 2
  var spatialOpTerm1 = selectedFeature1.spatialOpTerm.replace(/wkt/g, "wkt1");
  var spatialOpTerm2 = selectedFeature2.spatialOpTerm.replace(/wkt/g, "wkt2");

  var query1 = '\
PREFIX geo: <http://www.opengis.net/ont/geosparql#>\n\
PREFIX geof: <http://www.opengis.net/def/function/geosparql/>\n\
PREFIX units: <http://www.opengis.net/def/uom/OGC/1.0/>\n\
SELECT ?wkt \n\
WHERE { \n\
   <' + selectedFeature1.featureId + '> geo:hasGeometry ?g1 . \n\
   ?g1 geo:asWKT ?wkt1f . \n\
   ' + spatialOpTerm1 + ' \n\
   <' + selectedFeature2.featureId + '> geo:hasGeometry ?g2 . \n\
   ?g2 geo:asWKT ?wkt2f . \n\
   ' + spatialOpTerm2 + ' \n\
   BIND (geof:' + spatialOperation + '(?wkt1, ?wkt2) AS ?wkt) . \n\
}';

  var query2 = '\n\
PREFIX geo: <http://www.opengis.net/ont/geosparql#>\n\
PREFIX geof: <http://www.opengis.net/def/function/geosparql/>\n\
PREFIX units: <http://www.opengis.net/def/uom/OGC/1.0/>\n\
\n\
SELECT ?distance\n\
WHERE { \n\
   <' + selectedFeature1.featureId + '> geo:hasGeometry ?g1 . \n\
   ?g1 geo:asWKT ?wkt1 . \n\
   <' + selectedFeature2.featureId + '> geo:hasGeometry ?g2 . \n\
   ?g2 geo:asWKT ?wkt2 . \n\
   BIND (geof:distance(?wkt1, ?wkt2, units:metre) AS ?distance) . \n\
}';

  var query = (spatialOperation === "distance") ? query2 : query1;
  log(query);

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

    if (spatialOperation === "distance") {
      var km = result['results']['bindings'][0]['distance'].value / 1000;
      alert("Distance from Feature1 to Feature 2 in km: " + km);
    }
    else {
      updateMap(result, searchResultLayers[0]);
    }
  });

  request.fail(function(jqXHR, textStatus) {
    alert("Request Failed: " + textStatus);
  });
}

/*
 * Update map display with the given result.
 *
 * @param 
 *   result: the value returned from Parliament
 *   vector: the vector to which to add the features
 *   clearVector: if true, clear the vector first
 * @return none
 */
function updateMap(result, vector) {
  var features = new Array();
  var options = {
    'internalProjection': map.baseLayer.projection,
    'externalProjection': new OpenLayers.Projection('EPSG:4269')
  };
  var parser = new OpenLayers.Format.WKT(options);

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

    // the parser doesn't recognie LINEARRING, which is a specialized form of LINESTRING
    if (wkt2.search("LINEARRING") >= 0) {
      wkt2 = wkt2.replace("LINEARRING", "LINESTRING");
    }

    var feat = parser.read(wkt2);
    if (feat !== undefined) {
      features.push(feat);
    }
  }

  vector.addFeatures(features);
}

/*
 * Show the attributes of the selected feature
 * 
 * @param none
 * @return none
 */
function showAttributes(entry, position) {
  var featureSet = (position === 1 ? featureSet1 : featureSet2);
  var row = entry.parent().parent().children().index(entry.parent());

  var query = '\n\
SELECT ?rel ?obj \n\
WHERE { \n\
   <' + featureSet[row] + '> ?rel ?obj . \n\
} ';

  log(query);

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
 * @param none
 * @return none
 */
function updateAttributeDialog(result) {
  $('#attributesDialogText').empty();

  for (i = 0; i < result['results']['bindings'].length; ++i) {
    var rel = result['results']['bindings'][i]['rel']['value'];
    var obj = result['results']['bindings'][i]['obj']['value'];
    $('#attributesDialogText').append(rel + " = " + obj + "<br/>");
  }

  $('#attributesDialog').dialog('open');
}

/*
 * Add a query to the query log.
 * Replace HTML delimiters with escape codes.
 * 
 * @param {type} query test
 * @returns {undefined}
 */
function log(query) {
  var htmlText =
          '<pre>'
          + query.replace(/</g, "&lt;").replace(/>/g, "&gt;")
          + '</pre>';
  $('#queryDialogText').append(htmlText);
}

/*
 * Change the geosparql server url.
 * 
 * @param none
 * @return none
 */
function changeUrl() {
  var newUrl = prompt("Enter URL:", geosparqlUrl);
  if (newUrl !== null) {
    geosparqlUrl = newUrl;
    $('#url').empty().append(geosparqlUrl);
    getFeatureTypes();
  }
}

/*
 * Clear search results from the map.
 * 
 * @param none
 * @return none
 */
function clearSearchLayers() {
  for (i in searchResultLayers) {
    searchResultLayers[i].removeAllFeatures();
  }
}