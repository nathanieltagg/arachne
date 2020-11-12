      <div class="portlet" id="time-hist-port"> 
       <div class="portlet-header">Time Histogram</div>
       <div class="portlet-content" id="timehist-enclosure">
         <div class="pad" id="timehist-div"></div>

           <div id="timehist-options">
           <button class="ui-state-default ui-corner-all open-dialog" id='open-time-dialog'>Options</button>        
           
          <button class="ui-state-default ui-corner-all reset-button" >Reset</button>   
          
           <div class="dialog" id="time-dialog" title="Time Histogram Options">

                          <input class="saveable" type="checkbox" id="ctl-cut-no-disc-fired" 
             name="ctl-cut-no-disc-fired" 
              /><label for="ctl-cut-no-disc-fired">Cut hits with no discriminator fire</label><br/>

                       <input class="saveable" type="checkbox" id="ctl-cut-timeunder" 
          name="ctl-cut-timeunder" 
          checked="yes" /><label for="ctl-cut-timeunder">Cut underscale</label><br/>
                       <input class="saveable" type="checkbox" id="ctl-cut-timeover"  
          name="ctl-cut-timeover"  
          checked="yes" /><label for="ctl-cut-timeover">Cut overscale</label><br/>
                       Current range: <span id="cutinfo-time-range"></span><br/>
           </div>
          </div>
       </div>
      </div>
