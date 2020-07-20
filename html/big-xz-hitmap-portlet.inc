    <div class="portlet" id="big-hitmap-port">
      <div class="portlet-header">Big Hitmap</div>
      
      <div class='portlet-content'>
      <!--#if expr="$PageStyle != simple" -->
        <div id="bigXZ" class="pad" ></div> 
        <input type="checkbox" class="bighitmap-colorscale-button" name="bighitmap-colorscale-button" />
        <label for="bighitmap-colorscale-button">Draw Color Scale</label>
        
        <span class="bighitmap-select align-right">
          <input type="radio" class="bighitmap-select-button" name='bighitmap-select' id="bighitmap-select-xz" value='1'  checked="yes"/>
          <label for="bighitmap-select-xz">XZ</label>

          <input type="radio" class="bighitmap-select-button" name='bighitmap-select' id="bighitmap-select-uz" value='2'  />
          <label for="bighitmap-select-uz">UZ</label>                                            

          <input type="radio" class="bighitmap-select-button" name='bighitmap-select' id="bighitmap-select-vz" value='3'  />
          <label for="bighitmap-select-vz">VZ</label>

        </span>
      <!--#else -->
        <div id="bigXZ" class="portlet-content pad" settings="margin_left:40, margin_bottom:40 ,ylabel:'Strip', xlabel:'Module'"></div>              
      <!--#endif -->
      </div> <!-- portlet-content -->
    </div> <!-- portlet -->


