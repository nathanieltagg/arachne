
<div class="portlet" id="source-port"> <div class="portlet-header">Data Source</div>
<div id="tabs" class="portlet-content">
	<ul>
		<li><a href="#input-rsg">Official Reco files</a></li>
		<li><a href="#input-fe">Reco file by name</a></li>
    <!-- <li><a href="#input-xmlurl">URL to an XML file</a></li> -->
    <li><a href="#input-uploadjson">Upload local JSON File</a></li>
    <!-- <li><a href="#input-xmltext">Cut-and-paste xml</a></li> -->
    <li><a href="#input-livedata">Live Data</a></li>
	</ul>
	<div id="input-rsg" >
	  <form id="gateForm"  action="" >
    <table border="0" width="100%">
    <tr>
    <td><select id="inRsgDet">
        <option value="MV">MV</option>
        <option value="MN">MN</option>
        <option value="TP"        >TP</option>
        <option value="SIM_minerva"  selected="selected" >SIM_minerva</option>
        <option value="SIM_frozen">SIM_frozen</option>
        <option value="SIM_prototype">SIM_prototype</option>
        </select></td>
    <td><select id="inRsgRecoVer"><option value="v6r2p1" >v6r2p1</option>
                                  <option value="v7r0p1" >v7r0p1</option>
                                  <option value="v7r0p3" >v7r0p3</option>
                                  <option value="v7r2"   >v7r2</option>
                                  <option value="v7r3"   >v7r3</option>
                                  <option value="v7r3p1" >v7r3p1</option>                                      
                                  <option value="v7r4"   >v7r4</option>
                                  <option value="v7r5"   >v7r5</option>
                                  <option value="v7r5p1" >v7r5p1</option>
                                  <option value="v7r6"   >v7r6</option>
                                  <option value="v7r7"   >v7r7</option>
                                  <option value="v8r0"   >v8r0</option>
                                  <option value="v8r1" >v8r1</option>
                                  <option value="v8r2p1">v8r2p1</option>
                                  <option value="v8r2p2">v8r2p2</option>
                                  <option value="v8r3" >v8r3</option>
                                  <option value="v8r3_DEV" >v8r3_DEV</option>
                                  <option value="v9r1" >v9r1</option>
                                  <option value="v10r2">v10r2</option>                                  
                                  <option value="v10r2p2">v10r2p2</option>
                                  <option value="v10r4p3">v10r4p3</option>
                                  <option value="v10r6" selected="selected">v10r6</option>
 				  <option value="v10r8p6">v10r8p6</option>                                 
                                  
                                  
        </select><br/></td>
    <td><label>Run:   </label><input class="inRun    ui-state-default" type="text" size="5" name="inRsgRun"   id="inRsgRun"    value="10200"/></td>
    <td><label>SubRun:</label><input class="inSubrun ui-state-default" type="text" size="5" name="inRsgSubrun"id="inRsgSubrun" value="2"/></td>
    <td><label>Gate:  </label><input class="inGate   ui-state-default" type="text" size="5" name="inRsgGate"  id="inRsgGate"   value="1" />
      </td>
    <td> <span id="ctl-rsg-file-type">
         <input type="radio" id="ctl-rsg-file-type-reco" value="reco"  name="ctl-rsg-file-type-radio" checked="checked"/><label for="ctl-rsg-file-type-reco">Reco</label>
         <input type="radio" id="ctl-rsg-file-type-dst"  value="dst"   name="ctl-rsg-file-type-radio"                  /><label for="ctl-rsg-file-type-dst">DST</label>
         </span>
    </td>
    <td> <input class="ui-state-default ui-corner-all" type="button" id="go_rsg" value="Go!" /></td>
    </tr>
    </table>
    </form> 
  </div>
  
  <div id="input-fe">
    <a href="server/file_browser.cgi">Arachne File Browser</a>
    <form id="fileform"  action="" > 
      <label>Filename on minerva05:</label>
      <input type="text" style="width:500px" class="ui-state-default"  id="inFilename" name="inFilename" value=""/>
      <br/>
      &nbsp;&nbsp;&nbsp; <label>Entry:  </label><input class="inEntry ui-state-default" type="text" size="5" id="inFeEntry" name="inFeEntry"  value="1"/>
      <input class="ui-state-default ui-corner-all" type="button" id="go_fe" value="Go!" /><br/>

      or<br/>
   <label>Run:   </label><input class="inRun    ui-state-default" type="text" size="5" name="inFileRsgRun"   id="inFileRsgRun"    value="10200"/>
    <label>SubRun:</label><input class="inSubrun ui-state-default" type="text" size="5" name="inFileRsgSubrun" id="inFileRsgSubrun" value="2"/>
    <label>Gate:  </label><input class="inGate   ui-state-default" type="text" size="5" name="inFileRsgGate"  id="inFileRsgGate"   value="1" /> 
      <input class="ui-state-default ui-corner-all" type="button" id="go_rsg_file" value="Go!" />
     </form> 
	</div>

  <!-- <div id="input-xmlurl">
    <table border="0" width="100%">
      <tr>
        <td>
          <label>URL to XML file (must be same as web page host)</label> 
          <input style="width:400px" type="text" class="ui-state-default" id="inXmlUrl" name="inXmlUrl" value="" />
        </td>
        <td>
          <input class="ui-state-default ui-corner-all" type="button" id="go_xmlurl" value="Go!" />
        </td>
      </tr>
    </table>
  </div> -->
  
  <div id="input-uploadjson">
    <table border="0" width="100%">
     <tr>
       <td>
         <form id="formFileUpload" action="server/echoFile.cgi" method="post">
           <input type="file" id="inFileUpload" name="thefile" size="10"/>
           <input type="submit" value="Upload" /> 
         </form>
       </td></tr>
    </table>
  </div>

  <!-- <div id="input-xmltext">
    <table border="0" width="100%">
      <tr>
        <td>
          Copy or paste the event XML here.<br/>
          <textarea class="ui-state-default"  cols="100" rows="5" style="width: 550px; height: 70px;" id="inXmlText" name="inXmlText"></textarea> 
         </td>
        <td>
          <input class="ui-state-default ui-corner-all" type="button" id="go_xmltext" value="Load" /><br/><br/>
         </td>
      </tr>
    </table>  
  </div> -->

  <div id="input-livedata">
      <input class="ui-state-default ui-corner-all" type="button" id="go_livedata" value="Get Live Data!" />
      <label for="ctl-refresh-auto">Auto-refresh Live Data:</label>
        <input name="ctl-refresh-auto" id="ctl-refresh-auto" type="checkbox" />
      <label for="ctl-refresh-period">Refresh data every:</label>
        <input name=""ctl-refresh-period"" id="ctl-refresh-period" type="text" size="5" class=".saveable" value="30.0" />seconds
      <br/>
  </div>

	
</div> <!-- tabs -->
</div>  <!-- portlet -->
