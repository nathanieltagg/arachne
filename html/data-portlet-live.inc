<div class="portlet" id="source-port"> <div class="portlet-header">Data</div>
<div class="portlet-content">

  <div id="input-livedata">
    <span id="status" style="float:right; vertical-align:bottom;">Script loading...</span><br/>
    
      <input class="ui-state-default ui-corner-all" type="button" id="go_livedata" value="Get Live Data!" /><br/>
      <div><label id="ctl-refresh-auto-label" for="ctl-refresh-auto">Auto-refresh Live Data:</label><input id="ctl-refresh-auto" name="ctl-refresh-auto" type="checkbox" checked="yes" /><br/></div>
      <label for="ctl-refresh-period">Refresh data every:</label><input id="ctl-refresh-period" name="ctl-refresh-period" type="text" size="5" class=".saveable" value="60.0" />seconds
      <br/>

  </div>

	<br/>
  <div id='slice-navigation'> 
    <div>
      Current slice:<span id="current-slice" class="slice-color">All Hits</span><br/>
      <input type="checkbox" id="ctl-slices-auto"   name="ctl-slice-auto" checked="yes" /><label for="ctl-slice-auto">Auto Advance Slices</label>
    </div>

    <!-- <button class="ui-state-default ui-corner-all do-prev-slice-and-gate">Prev Slice &amp; Gate &nbsp;&nbsp;<span class="keypress-hint">&lt;</span></button>
    <button class="ui-state-default ui-corner-all do-next-slice-and-gate">Next Slice &amp; Gate &nbsp;&nbsp;<span class="keypress-hint">&gt;</span></button>
    <br/> -->
    
    <button class="ui-state-default ui-corner-all do-slice-prev">Prev Slice <span class="keypress-hint">-</span></button>
    <button class="ui-state-default ui-corner-all do-slice-next">Next Slice <span class="keypress-hint">+</span></button>
    <div class="shift">
      <!-- <button class="ui-state-default ui-corner-all do-slice-zero">Orphans <span class="keypress-hint">o</span></button> -->
      <button class="ui-state-default ui-corner-all do-slice-all ">All hits <span class="keypress-hint">a</span></button>
    </div>
    <br/>

  </div>
  <br/>
  <span id="link-to-this-event">Link to this event</span>

	<div id="input-rsg" style="display:none;" >
  	<div id="input-simple-fe" >
  	  <form id="fileform"  action="" > 
        <span style="display: none;">
        <label>Cut:  </label><input style="width:200px" class="inSelection ui-state-default" type="text" id="inFeSelection"   value="1"/>
        <input type="text" style="width:500px" class="ui-state-default"  id="inFilename" value=""/>
        </span>
        <br/>
        <label>Entry:  </label><input class="inEntry ui-state-default" type="text" size="5" id="inFeEntry"   value="1"/>
        <input class="ui-state-default ui-corner-all" type="button" id="go_fe" value="Go!" />
       </form> 

  	</div>
	  <form id="gateForm"  action="" >
    <table border="0" width="100%">
    <tr>
    <td><select id="inRsgDet">
        <option value="MV" >MV</option>
        <option value="MN" selected="selected">MN</option>
        <option value="TP"                    >TP</option>
        <option value="SIM"                    >SIM</option>
        </select></td>
    <td><select id="inRsgRecoVer"><option value="v6r2p1"                  >v6r2p1</option>
                                  <option value="v7r0p1"                  >v7r0p1</option>
                                  <option value="v7r0p3"                  >v7r0p3</option>
                                  <option value="v7r2"                    >v7r2</option>
                                  <option value="v7r3"                    >v7r3</option>
                                  <option value="v7r3p1"                  >v7r3p1</option>                                      
                                  <option value="v7r4">v7r4</option>
                                  <option value="v7r5" >v7r5</option>
                                  <option value="v7r5p1" selected="selected">v7r5p1</option>
                                  <option value="v7r6">v7r6</option>
                                  <option value="v7r7">v7r7</option>
                                  <option value="v8r0">v8r0</option>
                                  
                                  
        </select><br/></td>
    <td><label>Run:   </label><input class="inRun    ui-state-default" type="text" size="5" id="inRsgRun"    value="1020"/></td>
    <td><label>SubRun:</label><input class="inSubrun ui-state-default" type="text" size="5" id="inRsgSubrun" value="10"/></td>
    <td><label>Gate:  </label><input class="inGate   ui-state-default" type="text" size="5" id="inRsgGate"   value="13" />
      </td>
    <td> <input class="ui-state-default ui-corner-all" type="button" id="go_rsg" value="Go!" /></td>
    </tr>
    </table>
    </form> 
  </div>


</div> <!-- portlet-content -->
</div>  <!-- portlet -->
