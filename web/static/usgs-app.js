/*
 * Globals
 */
var myLayout;
var map;
var vectors;
var centerLon = -78.14;
var centerLat = 38.98;

var queryBase = '\
PREFIX geo0:   <http://www.opengis.net/def/geosparql/>\n\
PREFIX geo:    <http://www.opengis.net/ont/geosparql#>\n\
PREFIX geof:   <http://www.opengis.net/ont/geosparql#/function/>\n\
PREFIX geo-sf: <http://www.opengis.net/ont/geosparql#/sf/> \n\
PREFIX rdf:    <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n\
PREFIX rdfs:   <http://www.w3.org/2000/01/rdf-schema#>\n\
PREFIX gnis:   <http://cegis.usgs.gov/rdf/gnis/>\n\
PREFIX nhd:    <http://cegis.usgs.gov/rdf/nhd/>\n\
PREFIX gu:     <http://cegis.usgs.gov/rdf/gu/>\n\
\n'

var query1 = '\
SELECT ?label\n \
WHERE {\n \
  ?feature rdf:type gu:countyOrEquivalent .\n \
  ?feature rdfs:label ?label .\n \
}\n'

var query2 = '\
SELECT ?wkt\n \
WHERE {\n \
  ?feature rdf:type gu:countyOrEquivalent .\n \
  ?feature rdfs:label ?label .\n \
  ?feature geo:hasGeometry ?g .\n \
  ?g geo:asWKT ?wkt .\n \
}\n'


/*
 *  Initialization - execute when document is loaded
 */
$(document).ready(function() {
  myLayout = $('body').layout();

  $(".header-footer").hover(
          function() {
            $(this).addClass('ui-state-hover');
          },
          function() {
            $(this).removeClass('ui-state-hover');
          }
  );

  myLayout.sizePane("north", 70);
  myLayout.resizeAll();

  $("input:submit, a, button", ".demo").button();
  $("input:submit, a, button", ".tresults").button();
  $("input:submit, a, button", ".sresults").button();

  $(".demo").click(function() {
    $("#queryarea").val(queryBase);
    $('#query1').dialog('open');
    return false;
  });
  $(".tresults").click(function() {
    $('#tab_2').dialog('open');
    return false;
  });
  $(".sresults").click(function() {
    $('#tab_3').dialog('open');
    return false;
  });

  $(".reset").click(function() {
    var proj = new OpenLayers.Projection('EPSG:4326');
    var mercator = new OpenLayers.Projection('EPSG:900913');
    var center = new OpenLayers.LonLat(centerLon, centerLat);
    map.setCenter(center.transform(proj, mercator), 9);
    return false;
  });

  $('#sample1').click(function() {
    $('#queryarea').val(queryBase + query1);
  });
  $('#sample2').click(function() {
    $('#queryarea').val(queryBase + query2);
  });


  $("#query1").dialog({
    modal: true,
    autoOpen: false,
    width: "auto"
  });

  $("#tab_2").dialog({
    modal: true,
    autoOpen: false,
    width: "auto"
  });

  $("#tab_3").dialog({
    modal: true,
    autoOpen: false,
    width: "auto",
    height: "500",
    resizable: true
  });

});

///* 
// * Configure jQuery to user Django's CRSF protection
// * 
// */
//jQuery(document).ajaxSend(function(event, xhr, settings) {
//  function getCookie(name) {
//    var cookieValue = null;
//    if (document.cookie && document.cookie != '') {
//      var cookies = document.cookie.split(';');
//      for (var i = 0; i < cookies.length; i++) {
//        var cookie = jQuery.trim(cookies[i]);
//        // Does this cookie string begin with the name we want?
//        if (cookie.substring(0, name.length + 1) == (name + '=')) {
//          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
//          break;
//        }
//      }
//    }
//    return cookieValue;
//  }
//  function sameOrigin(url) {
//    // url could be relative or scheme relative or absolute
//    var host = document.location.host; // host + port
//    var protocol = document.location.protocol;
//    var sr_origin = '//' + host;
//    var origin = protocol + sr_origin;
//    // Allow absolute or scheme relative URLs to same origin
//    return (url == origin || url.slice(0, origin.length + 1) == origin + '/') ||
//    (url == sr_origin || url.slice(0, sr_origin.length + 1) == sr_origin + '/') ||
//    // or any other URL that isn't scheme relative or absolute i.e relative.
//    !(/^(\/\/|http:|https:).*/.test(url));
//  }
//  function safeMethod(method) {
//    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
//  }
//			      
//  if (!safeMethod(settings.type) && sameOrigin(settings.url)) {
//    xhr.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
//  }
//});

/*
 Destroys popups when the feature they members of are unselected.
 Parameters:
 {Openlayers.Feature} feature - The feature that is being unselected.
 Returns: None
 */
function onFeatureUnselect(feature) {
  map.removePopup(feature.popup);
  feature.popup.destroy();
  feature.popup = null;
}


/*
 Creates popups when the feature is selected.
 Parameters:
 {Openlayers.Feature} feature - The feature that is being selected.
 Returns: None
 */
function onFeatureSelect(feature) {
  selectedFeature = feature;
  var proj = new OpenLayers.Projection('EPSG:4326');
  var mercator = new OpenLayers.Projection('EPSG:900913');

  popup = new OpenLayers.Popup.FramedCloud('popup',
          feature.geometry.getBounds().getCenterLonLat(), null,
          feature.id + ': ' + feature.geometry.transform(mercator, proj).x +
          ',' + feature.geometry.y,
          null, true, onPopupClose);

  feature.geometry.transform(proj, mercator);
  feature.popup = popup;
  map.addPopup(popup);
}

/*
 * Initializes the Openlayers map, its layers, the function that selects
 * coordinates, and the events taht switch from the small to large scale maps
 * 
 * Parameters:None
 * Returns: None
 * 
 * Changes:
 * 11/22/12: modified maxExtent, point to focus on Shenandoah Valley  -RFG
 */
function init()
{
  //var maxExtent = new OpenLayers.Bounds(-20037508, -20037508, 20037508, 20037508),
  var maxExtent = new OpenLayers.Bounds(-10000000, 3000000, -5000000, 6000000),
          restrictedExtent = maxExtent.clone(),
          maxResolution = 156543.0339;

  var options = {
    projection: new OpenLayers.Projection('EPSG:900913'),
    displayProjection: new OpenLayers.Projection('EPSG:4326'),
    units: 'm',
    numZoomLevels: 18,
    maxResolution: maxResolution,
    maxExtent: maxExtent,
    restrictedExtent: restrictedExtent
  };

  map = new OpenLayers.Map('map', options);

  var smallScale = new OpenLayers.Layer.ArcGIS93Rest(
          'SmallScale',
          'http://raster1.nationalmap.gov/ArcGIS/rest' +
          '/services/TNM_Small_Scale_Imagery/MapServer/export',
          {});

  var nationalMapWMS = new OpenLayers.Layer.ArcGIS93Rest(
          'NationalMapLarge',
          'http://isse.cr.usgs.gov/ArcGIS/rest/services/TNM_Large_Scale_Imagery/MapServer/export',
          {});

  vectors = new OpenLayers.Layer.Vector('Vector Layer');

  var control = new OpenLayers.Control();
  OpenLayers.Util.extend(control, {
    draw: function() {
      this.box = new OpenLayers.Handler.Box(control, {
        'done': this.notice
      },
      {
        keyMask: OpenLayers.Handler.MOD_SHIFT
      });
      this.box.activate();
    },
    notice: function(bounds) {
      var ll = map.getLonLatFromPixel(new OpenLayers.Pixel(bounds.left, bounds.bottom));
      var ur = map.getLonLatFromPixel(new OpenLayers.Pixel(bounds.right, bounds.top));
      var ul = map.getLonLatFromPixel(new OpenLayers.Pixel(bounds.left, bounds.top));
      var lr = map.getLonLatFromPixel(new OpenLayers.Pixel(bounds.right, bounds.bottom));

      input(
              OpenLayers.Layer.SphericalMercator.inverseMercator(ll.lon.toFixed(4), ll.lat.toFixed(4)),
              OpenLayers.Layer.SphericalMercator.inverseMercator(ul.lon.toFixed(4), ul.lat.toFixed(4)),
              OpenLayers.Layer.SphericalMercator.inverseMercator(lr.lon.toFixed(4), lr.lat.toFixed(4)),
              OpenLayers.Layer.SphericalMercator.inverseMercator(ur.lon.toFixed(4), ur.lat.toFixed(4)));
    }
  });

  map.addControl(new OpenLayers.Control.MousePosition());
  map.addLayers([vectors, nationalMapWMS, smallScale]);
  map.addLayers([vectors, nationalMapWMS, nationalMapWMS]);
  map.addControl(control);

  selectControl = new OpenLayers.Control.SelectFeature(vectors,
          {
            onSelect: onFeatureSelect,
            onUnselect: onFeatureUnselect
          });

  drawControls = {
    polygon: new OpenLayers.Control.DrawFeature(vectors,
            OpenLayers.Handler.Point),
    select: selectControl
  };

  for (var key in drawControls)
  {
    map.addControl(drawControls[key]);
  }

  nationalMapWMS.events.on({
    moveend: function(e) {
      if (e.zoomChanged) {
        if (map.zoom < 12)
          map.setBaseLayer(smallScale);
      }
    }
  });

  smallScale.events.on({
    moveend: function(e) {
      if (e.zoomChanged) {
        if (map.zoom >= 12)
          map.setBaseLayer(nationalMapWMS);
      }
    }
  });

  var proj = new OpenLayers.Projection('EPSG:4326');
  var mercator = new OpenLayers.Projection('EPSG:900913');
  //var point = new OpenLayers.LonLat(-84.445, 33.7991);   
  var center = new OpenLayers.LonLat(centerLon, centerLat);
  map.setCenter(center.transform(proj, mercator), 9);
}

/*
 * Clear the SPARQL response
 *
 * Return: none
 */
function clearsparql()
{
  $('#tab_3').empty();
  $('#tab_3').append('No results yet');
}

/*
 * Update the SPARQL response
 * 
 * Parameter: result, the return value from Parliament
 * Return: none
 */
function updatesparql(result)
{
  $('#tab_3').empty();
  $('#tab_3').append(JSON.stringify(result, null, 2));

  return true;
}

/*
 * Clear the tabular results
 * 
 * Return: none
 */
function cleartable()
{
  $('#tab_2').empty();
  $('#tab_2').append('No results yet');
}

/*
 * Update the tabular results
 * 
 * Parameter: result, the return value from Parliament
 * Return: none
 */
function updatetable(result)
{
  var $wrap = $('<div>').attr('id', 'tableWrap');

  var $tbl = $('<table>').attr('id', 'basicTable');

  /* Create table headings */
  var $tr = $('<tr>');

  for (var i = 0; i < result['head']['vars'].length; ++i) {
    $tr.append($('<th>').text(result['head']['vars'][i]));
  }
  $tbl.append($tr);
  for (var j = 0; j < result['results']['bindings'].length; ++j) {
    $tr = $('<tr>');
    for (var key in result['results']['bindings'][j]) {
      if (key == "wkt") {
        var bindings = result['results']['bindings'];
        $tr.append($('<td>').text(bindings[j][key].value.substring(0, 100) + '...'));
      } else {
        var bindings = result['results']['bindings'];
        $tr.append($('<td>').text(bindings[j][key].value));
      }
    }
    $tbl.append($tr);
  }

  $('#tab_2').empty();
  $('#tab_2').append($tbl);

  return true;
}

/*
 * Update map display
 * 
 * Parameters: result, the value returned from Parliament
 * Return:
 */
function updatemap(result)
{
  var features = new Array();
  var bounds;
  var options = {
    'internalProjection': map.baseLayer.projection,
    'externalProjection': new OpenLayers.Projection('EPSG:4269')
  };
  var parser = new OpenLayers.Format.WKT(options);

  vectors.removeAllFeatures();

  for (i = 0; i < result['results']['bindings'].length; ++i) {
    var wkt = result['results']['bindings'][i]['wkt'];

    if (wkt == undefined) {
      return true;
    }

    // Remove CRS from from of wkt
    var wkt2 = wkt['value'];

    if (wkt2.split(/\>/)[1] != undefined) {
      wkt2 = wkt2.split(/\>/)[1];
    }

    var feat = parser.read(wkt2);
    if (feat != undefined) {
      features.push(feat);
    }
  }

  for (i = 0; i < features.length; ++i) {
    if (!bounds) {
      bounds = features[i].geometry.getBounds();
    } else {
      bounds.extend(features[i].geometry.getBounds());
    }
  }

  vectors.addFeatures(features);
  map.zoomToExtent(bounds);

  /*
   var overCallback = { over: featureOver, out: hideTooltip };
   var layers = map.getLayersByClass('OpenLayers.Layer.Vector');
   var selectControl = new OpenLayers.Control.SelectFeature(layers,
   { callbacks: overCallback });
   selectControl.onSelect = function(feature) {
   if (feature.attributes.clickable != 'off') alert('Feature!');
   };
   map.addControl(selectControl);
   selectControl.activate();
   function featureOver(feature) {
   // 'this' is selectFeature control
   var fname = feature.attributes.name || feature.attributes.title || feature.attributes.id || feature.fid;
   if (feature.geometry.CLASS_NAME == "OpenLayers.Geometry.LineString") {
   fname += ' '+ Math.round(feature.geometry.getGeodesicLength(feature.layer.map.baseLayer.projection) * 0.1) / 100 + 'km';
   }
   var xy = this.map.getControl('ll_mouse').lastXy || { x: 0, y: 0 };
   showTooltip(fname, xy.x, xy.y);
   }
   
   function getViewport() {
   var e = window, a = 'inner';
   if ( !( 'innerWidth' in window ) ) {
   a = 'client';
   e = document.documentElement || document.body;
   }
   return { width : e[ a+'Width' ], height : e[ a+'Height' ] };
   }
   function showTooltip(ttText, x, y) {
   var windowWidth = getViewport().width;
   var o = document.getElementById('tooltip');
   o.innerHTML = ttText;
   if(o.offsetWidth) {
   var ew = o.offsetWidth;
   } else if(o.clip.width) {
   var ew = o.clip.width;
   }
   y = y + 16;
   x = x - (ew / 4);
   if (x < 2) {
   x = 2;
   } else if(x + ew > windowWidth) {
   x = windowWidth - ew - 4;
   }
   o.style.left = x + 'px';
   o.style.top = y + 'px';
   o.style.visibility = 'visible';
   }
   function hideTooltip() {
   document.getElementById('tooltip').style.visibility = 'hidden';
   }
   */

  return true;
}

/*
 * Invoked when a query is submitted.
 * 
 * Parameters: none
 * Return: 
 * 
 * Changes:
 * 11/23/12 - Added conditional JSON deserialization, due to inconsistent 
 *   behavior of browsers - some were seeing an object, some a string.
 */
function submitquery()
{
  cleartable();
  clearsparql();

  var request = $.ajax({
    type: "GET",
    url: "http://grove.cs.jmu.edu/parliament/sparql",
    data: {
      "query": $("#queryarea").val(),
      "output": "json"
    }
  });

  request.done(function(msg) {
    var result;
    alert('Request Completed');

    // sometimes a string, sometimes an object ???
    if (typeof(msg) == "string") {
      result = JSON.parse(msg);
    }
    else {
      result = msg;
    }

    updatemap(result);
    updatetable(result);
    updatesparql(result);
  });

  request.fail(function(jqXHR, textStatus) {
    alert("Request Failed: " + textStatus);
  });
}
