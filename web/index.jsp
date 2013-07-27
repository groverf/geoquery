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
        <p>
          GeoQuery is an interactive tool for accessing a geographical
          database stored as an RDF triple store, using GeoSparql queries.
        </p>
        
        <p>
          The following videos illustrate some sample queries executed with GeoQuery.
        </p>
        <ul>
          <li>
            <a href="http://jmutube.cit.jmu.edu/users/groverf/presentations/GeoQuery_Demo_1_MP4_with_Smart_Player_Large_20130726_06_39_26PM.zip.content/">
              Query 1:</a> Find all airports within Augusta County.
          </li>
          <li>
            <a href="http://jmutube.cit.jmu.edu/users/groverf/presentations/GeoQuery_Demo_2_MP4_with_Smart_Player_Large_20130726_10_44_57PM.zip.content/">
              Query 2:</a> Find the area within 5000m of the city of Waynesboro that
            also lies within the borders of Augusta County.
          </li>
        </ul>
      </div>

      <jsp:include page="WEB-INF/include/jsp/footer.jsp"/>

    </div>

  </body>
</html>
