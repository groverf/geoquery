<!--
Copyright 2013 RFGrove. All rights reserved.
-->

<%@page contentType="text/html" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <title>GeoQuery Project</title>
    <link rel="stylesheet" type="text/css" href="static/css/layout-0.8.css">
  </head>
  <body>

    <div id="container">

      <jsp:include page="WEB-INF/include/jsp/header.jsp"/>

      <jsp:include page="WEB-INF/include/jsp/menu.jsp"/>

      <div id="content">
        <h1>Prior Versions</h1>
        <ul>
          <li>
            <a href="geoquery-0.8.html">GeoQuery V0.8</a>
            <br/>
            V0.8 separates the binary spatial relationship from the two
            feature search sections.
          </li> 
          <li>
            <a href="geoquery-0.7.html">GeoQuery V0.7</a>
            <br/>
            V0.7 presents an alternate layout to V0.6.
          </li>      
          <li>
            <a href="geoquery-0.6.html">GeoQuery V0.6</a>
            <br/>
            V0.6 adds a buffer quantum, and allows a combination of search by
            property and search by relation on Feature 2.
          </li>
          <li>
            <a href="geoquery-0.5.html">GeoQuery V0.5</a>
            <br/>
            V0.5 adds spatial relations.
          </li>
          <li>
            <a href="geoquery-0.4.html">GeoQuery V0.4</a>
            <br/>
            V0.4 presents search results in a different way, with more options
            for using spatial operators. Search results and spatial operator results
            are also layered (and colored) individually.
          </li>
          <li>
            <a href="geoquery-0.3.html">GeoQuery V0.3</a>
            <br/>
            V0.3 corrected an error during server change with old feature type vectors 
            not being removed. Also added a button for server change.
          </li>  
          <li>
            <a href="geoquery-0.2.html">GeoQuery V0.2</a>
          </li>      
          <li>
            <a href="geoquery-0.1.html">GeoQuery V0.1</a>
          </li>
        </ul>
        <br/>
        <hr/>
        <h1>Prototypes:</h1>

        <ul>
          <li>
            <a href="p0-geoquery.html">Prototype 0</a> (based on USGS geosparqlviz app)
          </li>
          <li>
            <a href="p1-feature_select.html">Prototype 1 - Select by Feature Type</a> 
          </li>
          <li>
            <a href="p2-name_select.html">Prototype 2 - Select by Name</a> 
          </li>
          <li>
            <a href="p3-spatial.html">Prototype 3 - Spatial Relationships</a> 
          </li>   
          <li>
            <a href="p4-name_select_alt_map.html">Prototype 4 - Select by Name, alternate map</a> 
          </li>
          <li>
            <a href="p5-name_select_alt_map_alt_layout.html">Prototype 5 - Select by Name, alternate map & layout</a> 
          </li>
          <li>
            <a href="p6_find_features_on_map_display.html">Prototype 6 - Find a feature within a region (Use Case #1)</a> 
            <br/>
            This prototype allows the user to search for features based on name, within a 
            bounding box defined by the map viewport. Features listed in the search
            results can then be displayed on the map, and (for non-point features)
            a further search can be made within the bounds of the selected feature. 
            <br/><br/>
            This search is coded to exclude "Nones" (those features coded as 
            http://cegis.usgs.gov/rdf/struct/Features/None), which have been producing
            the globs of point features sometimes displayed in earlier prototypes. 
            The search is also case-insensitive, unlike earlier prototypes.
          </li>
          <li>
            <a href="p7_find_by_type_or_name_within_region.html">Prototype 7 - find within region (Use Case #2)</a>
            <br/>
            This prototype builds on #6 by allowing the user to also select features 
            by type within a preselected region or feature.
          </li>
          <li>
            <a href="p8_find_by_relationship.html">Prototype 8 - find by relationship (Use Case #3)</a>
            <br/>
            This prototype allows the user to select features by relationship to another
            feature.
          </li>          <li>
            <a href="p9_find_distance.html">Prototype 9 - find distance (Use Case #4)</a>
            <br/>
            This prototype allows the user to find the distance between two selected features.
          </li>
          <li>
            <a href="p10_find_closest.html">Prototype 10 - find the closest feature of a specified type (Use Case #5)</a>
            <br/>
            This prototype allows the user to find the closest feature of a specified type to a starting feature.
          </li>
          <li>
            <a href="p11_spatial_operation.html">Prototype 11 - perform a spatial operation on two selected features (Use Case #6)</a>
            <br/>
            This prototype allows the user to select one or two features, and then 
            perform a spatial operation such as convex hull, union or intersection.
            <br/>
            Note: Buffer constant is 1000m.
          </li>
          <li>
            <a href="p12_draw_bounding_box.html">Prototype 12 - draw a bounding area</a>
            <br/>
            This prototype allows the user to draw a bounding area on the map, to 
            constrain the search. The last point selected will be automatically 
            connected to the first point selected, to complete the area.
          </li>
          <li>
            <a href="p13_show_attributes.html">Prototype 13 - show the attributes of a selected feature</a>
            <br/>
            This prototype allows the user to select a feature by name or by type. The attributes of
            the selected feature are then displayed, in addition to placing the feature on the map.
          </li>
          <li>
            <a href="p14_search_within_layers.html">Prototype 14 - search by layers</a>
            <br/>
            This prototype presents feature classes as layers, and allows the user to
            select layers by which to constrain the search. Selected search features are
            added as new layers.
          </li>      

        </ul>

      </div>

      <jsp:include page="WEB-INF/include/jsp/footer.jsp"/>

    </div>

  </body>
</html>
