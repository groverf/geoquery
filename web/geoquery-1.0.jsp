<%-- 
    Document   : geoquery-1.0
    Created on : Jun 25, 2013, 2:27:48 PM
    Author     : groverf
--%>

<%@page contentType="text/html" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html>
  <head>
    <title>GeoQuery</title>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">

    <link rel="stylesheet" type="text/css" href="static/css/layout-1.0.css">

    <link rel="stylesheet" href="http://code.jquery.com/ui/1.10.0/themes/base/jquery-ui.css" />

    <script src="http://code.jquery.com/jquery-1.8.3.js"></script>
    <script src="http://code.jquery.com/ui/1.10.0/jquery-ui.js"></script>

    <script type="text/javascript" src="static/OpenLayers-2.12.js"></script>
    <script type="text/javascript" src="static/proj4js.js"></script>

    <script type="text/javascript" src="static/script/script-1.0.js"></script>

  <body>

    <div id="container">

      <jsp:include page="WEB-INF/include/jsp/header.jsp"/>

      <div id="resultDiv">
        <div class="colorGroup1 resultBox">
          <span>
            Feature 1: 
            <span id="selectedFeature1NameA" class="nameBox">----------</span>
          </span>
          <div id="feature1Selection">
            <table>
              <tbody>
                <tr>
                  <td>
                    <span id="featureTypeSelector1">
                      <select> <option>--Select Feature Type--</option> </select>
                    </span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <span id="propertySelector1">
                      <select> <option>--Select Property--</option> </select>
                    </span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <input id="searchTerm1" type="text">
                    <input value="Search" onclick="searchFeatures(1);" type="button"/>
                  </td>
                </tr>
                <tr>
                  <td>
                    <label><input type="radio" id="spatialOp1None" name="spatialOp1" 
                                  value="none" checked="checked" onclick="unarySpatialOp(1);"/>No Spatial Operation</label>
                    <label><input type="radio" name="spatialOp1" value="boundary" onclick="unarySpatialOp(1);"/>Boundary</label>
                    <br/>
                    <label><input type="radio" name="spatialOp1" value="convexHull" onclick="unarySpatialOp(1);"/>Convex Hull</label>
                    <label><input type="radio" name="spatialOp1" value="envelope" onclick="unarySpatialOp(1);"/>Envelope</label>
                    <label><input type="radio" name="spatialOp1" value="buffer" onclick="unarySpatialOp(1);"/>Buffer</label>
                    <input type="text" size="3" maxlength="5" id="buffer1" value="1000" />(m)
                  </td>
                </tr>

              </tbody>
            </table>        
          </div>

          <div>
            Search Results: 
            <button onclick="$('#queryResultArea1').slideToggle();" >+/-</button>
            <br/>
            <span id="queryResultArea1">
              ...No search results yet...
            </span>
          </div>
        </div>        

        <div class="colorGroup2 resultBox">
          <span>
            Feature 2: 
            <span id="selectedFeature2NameA" class="nameBox">----------</span>
          </span>
          <div id="feature2Selection">
            <table>
              <tbody>
                <tr>
                  <td>
                    <span id="featureTypeSelector2">
                      <select> <option>--Select Feature Type--</option> </select>
                    </span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <span id="propertySelector2">
                      <select> <option>--Select Property--</option> </select>
                    </span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <input id="searchTerm2" type="text">
                    <input value="Search" onclick="searchFeatures(2);" type="button"/>
                  </td>
                </tr>

                <tr>
                  <td>
                    <label><input type="radio" id="spatia2Op1None" name="spatialOp2" 
                                  value="none" checked="checked" onclick="unarySpatialOp(2);"/>No Spatial Operation</label>
                    <label><input type="radio" name="spatialOp2" value="boundary" onclick="unarySpatialOp(2);"/>Boundary</label>
                    <br/>
                    <label><input type="radio" name="spatialOp2" value="convexHull" onclick="unarySpatialOp(2);"/>Convex Hull</label>
                    <label><input type="radio" name="spatialOp2" value="envelope" onclick="unarySpatialOp(2);"/>Envelope</label>
                    <label><input type="radio" name="spatialOp2" value="buffer" onclick="unarySpatialOp(2);"/>Buffer</label>
                    <input type="text" size="3" maxlength="5" id="buffer2" value="1000" />(m)
                  </td>
                </tr>

              </tbody>
            </table>
          </div>

          <div>
            Search Results: 
            <button onclick="$('#queryResultArea2').slideToggle();">+/-</button>
            <br/>
            <span id="queryResultArea2">
              ...No search results yet...
            </span>
          </div>
        </div>

        <div class="colorGroup3 resultBox">
          
          Spatial Relationship:
          <button id="spatialRelationshipButton" onclick="doSpatialRelationship();">Go</button>
          <br/>
          &nbsp;&nbsp; Select: <span id="selectedFeature1NameB" class="nameBox">--</span>
          <br/>
          &nbsp;&nbsp; with relationship: 
          <select id="spatialRelationshipSelector">
            <option value="--">--Select Relation--</option>
            <option value="sfEquals">SF: Equals</option>
            <option value="sfContains">SF: Contains</option>
            <option value="sfDisjoint">SF: Disjoint</option>
            <option value="sfIntersects">SF: Intersects</option>
            <option value="sfOverlaps">SF: Overlaps</option>
            <option value="sfTouches">SF: Touches</option>
            <option value="sfWithin">SF: Within</option>
            <option value="ehEquals">9-IM: Equals</option>
            <option value="ehDisjoint">9-IM: Disjoint</option>
            <option value="ehMeet">9-IM: Meet</option>
            <option value="ehOverlap">9-IM: Overlap</option>
            <option value="ehCovers">9-IM: Covers</option>
            <option value="chCoveredBy">9-IM: CoveredBy</option>
            <option value="ehInside">9-IM Inside</option>
            <option value="ehContains">9-IM: Contains</option>
            <option value="rcc8Eq">rcc8Eq</option>
            <option value="rcc8dc">rcc8dc</option>
            <option value="rcc8po">rcc8po</option>
            <option value="rcc8tppi">rcc8tppi</option>
            <option value="rcc8tpp">rcc8tpp</option>
            <option value="rcc8ntpp">rcc8ntpp</option>
            <option value="rcc8ntppi">rcc8ntppi</option>
          </select>
          <br/>
          &nbsp;&nbsp; to: <span id="selectedFeature2NameB" class="nameBox">--</span>  
          <div>
            Search Results: 
            <button onclick="$('#queryResultArea3').slideToggle();">+/-</button>
            <br/>
            <span id="queryResultArea3">
              ...No search results yet...
            </span>
          </div>
        </div>
        
        <div class="colorGroup4 resultBox">          
          Binary Spatial Operation:
          <button onclick="doBinarySpatialOp();">Go</button>
          <br/>
          <span id="selectedFeature1NameC" class="nameBox">--</span>
          <br/>
          <select id="binarySpatialOpSelector">
            <option>--Select Operation--</option>
            <option>intersection</option>
            <option>union</option>
            <option>difference</option>
            <option>symDifference</option>
            <option>distance</option>
          </select>
          <br/>
          <span id="selectedFeature2NameC" class="nameBox">--</span>
        </div>

        <div class="resultBox">
          <span>
            <button onclick="clearSearchLayers();" class="right">Clear Map</button>
            <button onclick="$('#queriesDialog').dialog('open');" class="right">Show Queries</button>
            <button onclick="$('#featureListArea').slideToggle();">+/-</button>
            Layers
          </span>
          <br/>&nbsp;
          <span id="featureListArea"></span>
        </div>

      </div>

      <div id="mapArea">
      </div>

      <div id="footer">
        <span class="left">Version: 1.0</span>
        Using <span id="url"></span>
        &nbsp;&nbsp;
        <button id="urlButton" onclick="changeUrl();">Change URL</button>
      </div>

    </div>

    <div id="queriesDialog" class="dialog" title="GeoSparql Queries">
      <pre><span id="queryDialogText"></span></pre>
    </div>
    
    <div id="attributesDialog" class="dialog" title="Attributes">
      <pre><span id="attributesDialogText"></span></pre>
    </div>

  </body>
</html>
