    <div class="portlet" id="tridview-port">
      <div class="portlet-header">3D Display</div>     
      
      <div class="portlet-content" style="height: inherit;" >
      <div id="triD-view" class ="pad" ></div> 
        <div id="triD-controls">
          <span class="trid-ctl trid-zoom-in"   >Zoom In</span>
          <span class="trid-ctl trid-zoom-out"  >Zoom Out</span>
          <span class="trid-ctl trid-pan-left"  >Pan Left</span>
          <span class="trid-ctl trid-pan-right" >Pan Right</span>
          <span class="trid-ctl trid-pan-up"    >Pan Up</span>
          <span class="trid-ctl trid-pan-down"  >Pan Down</span>
          <span class="trid-ctl trid-pan-upstream"    >Pan Upstream</span>
          <span class="trid-ctl trid-pan-downstream"  >Pan Downstream</span>
          <input type="checkbox" class="trid-ctl trid-autorotate" id="trid-check1" /><label for="trid-check1">AutoRotate</label>
          <span class="trid-ctl trid-reset"     >Reset</span>
          <span class="trid-ctl trid-create-animation"     >Animate</span>
          
          <span class="trid-ctl-mouse-set">
          		<input type="radio" class="trid-ctl trid-ctl-mouse-rotate" name="trid-radio" id="trid-radio1" value="rotate" checked="yes"/><label for="trid-radio1">Mouse Rotate</label>
          		<input type="radio" class="trid-ctl trid-ctl-mouse-pan"    name="trid-radio" id="trid-radio2" value="pan" />             <label for="trid-radio2">Mouse Pan</label>
          </span>
          <span class="trid-ctl-view-set">
            <input type="radio" class="trid-ctl trid-ctl-view-3D" name="trid-radio-view" id="trid-radio-view1" value="3D" checked="yes"/><label for="trid-radio-view1">3D</label>
            <input type="radio" class="trid-ctl trid-ctl-view-xz" name="trid-radio-view" id="trid-radio-view2" value="XZ" /><label for="trid-radio-view2">XZ</label>
            <input type="radio" class="trid-ctl trid-ctl-view-yz" name="trid-radio-view" id="trid-radio-view3" value="YZ" /><label for="trid-radio-view3">YZ</label>
            <input type="radio" class="trid-ctl trid-ctl-view-xy" name="trid-radio-view" id="trid-radio-view4" value="XY" /><label for="trid-radio-view4">XY</label>
          </span>
          <br/>
          <span style="display: inline-block"><input type="checkbox" class="trid-ctl trid-ctl-show-hits"   name="trid-ctl-show-hits"   checked="yes" />
                <label for="trid-ctl-show-hits">Show MINERvA hits</label></span>&nbsp;&nbsp;&nbsp;
                <span style="display: inline-block"><input type="checkbox" class="trid-ctl trid-ctl-show-minos-hits"   name="trid-ctl-show-minos-hits"   checked="yes" />
                      <label for="trid-ctl-show-minos-hits">Show MINOS hits</label></span>
        </div>
      </div>
    </div>

