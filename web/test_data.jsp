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
        <h1>Datasets</h1>
        <p>
          The data were extracted from the USGS National Map using the viewer 
          available at: http://nationalmap.gov/viewer.html. 
          <br/>
          The following themes have been extracted (though all of the themes 
          may not be represented in the results):
        </p>
        <ul>
          <li>Structures</li>
          <li>Transportation</li>
          <li>Boundaries</li>
          <li>Hydrography</li>
        </ul>
        <p>
          These are all vector datasets with multiple feature classes and multiple 
          attributes for each feature class.  
          <br/>
          <br/>TNM: The National Map vector data, except hydro
          <br/>NHD: National Hydrography Dataset 
        </p>

        <p><a href="http://geoquery.cs.jmu.edu/geoquery-data">Dataset Versions</a></p>

      </div>

      <jsp:include page="WEB-INF/include/jsp/footer.jsp"/>

    </div>

  </body>
</html>
