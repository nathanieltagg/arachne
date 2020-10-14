//
// Code for the Arachne Event Display
// Author: Nathaniel Tagg ntagg@otterbein.edu
// 
// Licence: this code is free for non-commertial use. Note other licences may apply to 3rd-party code.
// Any use of this code must include attribution to Nathaniel Tagg at Otterbein University, but otherwise 
// you're free to modify and use it as you like.
//

///
/// Boilerplate:  Javascript utilities for MINERvA event display, codenamed "Arachne"
/// Nathaniel Tagg  - NTagg@otterbein.edu - June 2009
///


//
// 'Main' scripts for arachne.html
// Used to be in 'head', but it was too unwieldly.
//


gPhColorScaler = new ColorScaler();
gPhColorScaler.max=10;

// Global cuts
gPhCut   = { min: null, max: null };
gTimeCut = { min: null, max: null };
gShowFlaggedHitsOnly = false;
gShowFlaggedClustersOnly = false;
gShowFlaggedTracksOnly = false;
gShowFlaggedVerticesOnly = false;

gInteraction = 0;

// Setup
gSuppressTracks = null;


function HitSatisfiesCutSetup()
{
  // Do a few one-time things to speed up the following (inner loop) calculation.
  gHSC_ph_type = $('#ctl-ph-field').val();
  gHSC_NoDiscFired = $('#ctl-cut-no-disc-fired').is(':checked');
}

function HitSatisfiesCut(hit,ignore_ph_cut)
{
  var slice,t,ph;
  if(gCurrentSlice >=0 ) {
    if(hit.slice != gCurrentSlice) {return false;}
  }

  if((gTimeCut.min !== null) ||(gTimeCut.max !== null)  ) {
    t = hit.time;
    if((gTimeCut.min !== null) && (t<gTimeCut.min)) return false;
    if((gTimeCut.max !== null) && (t>=gTimeCut.max)) return false;
  }

  if(!ignore_ph_cut) {
   if((gPhCut.min !== null) ||(gPhCut.max !== null)  ) {
     ph = hit[gHSC_ph_type];
     if((gPhCut.min !== null) && (ph<gPhCut.min)) return false;
     if((gPhCut.max !== null) && (ph>=gPhCut.max)) return false;
   }
  }

  if(gShowFlaggedHitsOnly) {
    if(! (hit.flag>0) ) return false;
    if(! (hit["type"]>0) ) return false;
  }

  if(gHSC_NoDiscFired) {
    if(hit.disc_fired==0) return false;
  }
    

  return true;
}



function MiscSliceChange()
{
  ///
  /// Misc stuff to do on slice change.
  ///
  
  // $('#status').attr('class', 'status-transition');
  // $("#status").text("Redrawing..");
  // console.log('redraw '+gCurrentSlice);

  var stxt = "All Hits";
  if(gCurrentSlice === 0) stxt = "Orphan Hits";
  if(gCurrentSlice >  0) stxt = "Slice "+gCurrentSlice;
  $('#current-slice').text(stxt);
  // Set color of slice caption.
  var cindex = gCurrentSlice;
  if(cindex<0) cindex = 0;
  var s = new ColorScaleIndexed(cindex);
  $('.slice-color').css('color',s.GetCssColor());

  if(gUrlToThisEvent) gUrlToLastEvent = gUrlToThisEvent;
  var baseurl = location.href.split('?')[0];
  baseurl = baseurl.replace("live\.html","arachne.html");

  if(gLastQueryType=='fe_dst' || gLastQueryType=='fe_reco' || gLastQueryType=='livedata') {
    gUrlToThisEvent = baseurl + "?"
                    +"filename="+gFile
                    +"&entry="+gEntry
                    +"&slice="+gCurrentSlice
                    +"&filetype=" + (gLastQueryType=='fe_reco' ? "reco" : "dst");
  } else if(gLastQueryType=='rsg_file'){
    gUrlToThisEvent = baseurl + "?"
                    +"filename="+gFile
                    +"&gate="+gGate
                    +"&slice="+gCurrentSlice
                    +"&filetype=reco"; // This is probably safe because rsg_file isn't used for dsts
  } else {
    // Assume it's an rsg type, since some don't work.
    gUrlToThisEvent = baseurl+ "?"
                    +"det="+gDet
                    +"&recoVer="+gRecoVer
                    +"&run="+gRun
                    +"&subrun="+gSubrun
                    +"&gate="+gGate
                    +"&slice="+gCurrentSlice;
    
  }
  $('#link-to-this-event').html('<a href="'+gUrlToThisEvent+'">Link to this event</a>');
  $('#email-this-event').html('<a href="mailto:ntagg@otterbein.edu,prodrigues@pas.rochester.edu?subject=Arachne Bug&body='+escape(gUrlToThisEvent)+'">Email this event (Bug Report)</a>');

}



//
// Function to look up 'GET' parameters from an encoded URL.
function GetUrlParameter( name )
{
  name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
  var regexS = "[\\?&]"+name+"=([^&#]*)";
  var regex = new RegExp( regexS );
  var results = regex.exec( window.location.href );
  if( results === null )
    return null;
  else
    return results[1];
}




$(function(){
  // Bindings for run/subrun/gate input.
  $('#inRsgRecoVer');
  $('#inRsgRun')   .keydown(function(e){if (e.keyCode == 13) { QueryServer('rsg'); }});
  $('#inRsgSubrun').keydown(function(e){if (e.keyCode == 13) { QueryServer('rsg'); }});
  $('#inRsgGate')  .keydown(function(e){if (e.keyCode == 13) { QueryServer('rsg'); }});
  $('#go_rsg').click(function(){QueryServer('rsg'); return false;});

  $('#inFilenameMenu').change(function(){$('#inFilenameDST').val($(this).val())}); // copy into (hidden) text field.
  $('#inFilenameReco')  .keydown(function(e){if (e.keyCode == 13) { QueryServer('fe_reco'); }});
  $('#inFeEntryReco')   .keydown(function(e){if (e.keyCode == 13) { QueryServer('fe_reco'); }});
  $('#inFilenameDST')  .keydown(function(e){if (e.keyCode == 13) { QueryServer('fe_dst'); }});
  $('#inFeEntryDST')   .keydown(function(e){if (e.keyCode == 13) { QueryServer('fe_dst'); }});
  $('#go_fe_reco')  .click(function(){QueryServer('fe_reco'); return false;});
  $('#go_fe_dst')   .click(function(){QueryServer('fe_dst'); return false;});

  $('#inFileRsgRun')   .keydown(function(e){if (e.keyCode == 13) { QueryServer('rsg_file'); }});
  $('#inFileRsgSubrun').keydown(function(e){if (e.keyCode == 13) { QueryServer('rsg_file'); }});
  $('#inFileRsgGate')  .keydown(function(e){if (e.keyCode == 13) { QueryServer('rsg_file'); }});
  $('#go_rsg_file').click(function(){QueryServer('rsg_file'); return false;});

  // Bindings for XML URL input.
  $('#inXmlUrl').val(window.location.protocol+"//"+window.location.host+"/");
  $('#inXmlUrl').keydown(function(e){if (e.keyCode == 13) { QueryServer('xmlurl'); }});
  $('#go_xmlurl').click(function(){QueryServer('xmlurl'); return false;});
  
  
  // Bindings for XML upload
  $('#formFileUpload').ajaxForm({
    dataType: 'json',
    success: QuerySuccess
  });
  
  
  // Bindings for live data.
  $('#go_livedata').click(function(){
    console.log("go_livedata");
    if(gRefreshTimeout) clearTimeout(gRefreshTimeout);
    QueryServer('livedata');
    if($('#ctl-refresh-auto').is(":checked")) {
      // restart timer.
      var delay = parseFloat($('#ctl-refresh-period').val())*1000;
      gRefreshTimeout = setTimeout(refresh_live,delay);
      // console.log('Starting refresh timer',gRefreshTimeout,delay);
    }
  }
  );
  $('#ctl-refresh-auto').click(refresh_live);

  // Binding for slice cycling.
  $('#ctl-slices-auto').click(advance_slice);
  if($('#ctl-slices-auto').is(":checked")) {advance_slice();}
  
  // Set up histograms and other displays.
  // Bind this first, so it happens first. Better response time for scan info, which is asyncronous.
  gStateMachine.Bind('gateChange',RequestScannerInfo);
  gStateMachine.Bind('sliceChange',RequestScannerInfo);
  
  ///
  /// Code that sets up tabs.
  ///
  $("#tabs").tabs();// ({collapsible: true}); // Collapsible sets it to close on a second click.
  
  /// Fill event info display.
  mcinfo = new MCInfoDisplay($("#mc-info"));
  mcdigraph = new MCDigraph($("#mc-digraph"));
  beaminfo = new BeamInfoDisplay($("#beam-info"));
  
  hc_ph = new PhHistCanvas;  
  hc_time = new TimeHistCanvas;
  // hmBigXZ = new HitMapSvg($('#bigXZ'),{num_u:gGeo.NumModules, min_u: gGeo.FirstModule, max_u: gGeo.LastModule, num_v:128, min_v:0, max_v:128, view: 1});
  hmBigXZ = new HitMap($('#bigXZ'),{num_u:gGeo.NumModules, min_u: gGeo.FirstModule, max_u: gGeo.LastModule, num_v:128, min_v:0, max_v:128, view: 1});
  hmXZ =    new HitMap($('#xz'),   {num_u:gGeo.NumModules, min_u: gGeo.FirstModule, max_u: gGeo.LastModule, num_v:128, min_v:0, max_v:128, view: 1});
  hmUZ =    new HitMap($('#uz'),   {num_u:gGeo.NumModules, min_u: gGeo.FirstModule, max_u: gGeo.LastModule, num_v:128, min_v:0, max_v:128, view: 2});
  hmVZ =    new HitMap($('#vz'),   {num_u:gGeo.NumModules, min_u: gGeo.FirstModule, max_u: gGeo.LastModule, num_v:128, min_v:0, max_v:128, view: 3});

  hmTower1 = new TowerHitMap($('#tower1'),{num_u:gGeo.NumModules, min_u: gGeo.FirstModule, max_u: gGeo.LastModule, num_v:8, min_v:0, max_v:8, tower: 1});
  hmTower2 = new TowerHitMap($('#tower2'),{num_u:gGeo.NumModules, min_u: gGeo.FirstModule, max_u: gGeo.LastModule, num_v:8, min_v:0, max_v:8, tower: 2});
  hmTower3 = new TowerHitMap($('#tower3'),{num_u:gGeo.NumModules, min_u: gGeo.FirstModule, max_u: gGeo.LastModule, num_v:8, min_v:0, max_v:8, tower: 3});
  hmTower4 = new TowerHitMap($('#tower4'),{num_u:gGeo.NumModules, min_u: gGeo.FirstModule, max_u: gGeo.LastModule, num_v:8, min_v:0, max_v:8, tower: 4});
  hmTower5 = new TowerHitMap($('#tower5'),{num_u:gGeo.NumModules, min_u: gGeo.FirstModule, max_u: gGeo.LastModule, num_v:8, min_v:0, max_v:8, tower: 5});
  hmTower6 = new TowerHitMap($('#tower6'),{num_u:gGeo.NumModules, min_u: gGeo.FirstModule, max_u: gGeo.LastModule, num_v:8, min_v:0, max_v:8, tower: 6});

  elecView0 = new ElecView($("#elecview0"));
  elecView1 = new ElecView($("#elecview1"));
  vetoView1 = new VetoView($("#vetoview1"));
  vetoView2 = new VetoView($("#vetoview2"));

  hitinfo = new HitInfo($('#hit-info'));

  energyprofile = new EnergyProfile($('#energy-profile-div'));
  mriview = new MriView($('#mri-view'),{z:[gGeo.FirstModule,gGeo.FirstModule+2]});

  if($('#minos').length>0) {
    hMinosU = new MinosHitMap($('#minos_u'));
    hMinosV = new MinosHitMap($('#minos_v'));
  }

  gStateMachine.Bind('gateChange',MiscSliceChange);
  gStateMachine.Bind('sliceChange',MiscSliceChange);

  // Set up 3d area.
  tridview = new TriDView($('#triD-view'));

  $('#status').attr('class', 'status-ok');  
  $("#status").text("Ready.");
  
  // Let's see if data was requested in the URL to this page.
  var recDet = GetUrlParameter("det");            if(recDet)       $("#inRsgDet").val(recDet);
  var recVer = GetUrlParameter("recoVer");        if(recVer)       $("#inRsgRecoVer").val(recVer);
  var recRun = GetUrlParameter("run");            if(recRun)       $("#inRsgRun").val(recRun);
  var recSubrun = GetUrlParameter("subrun");      if(recSubrun)    $("#inRsgSubrun").val(recSubrun);
  var recFilename = GetUrlParameter("filename");  
  // If the filetype is specified in the URL params, use that,
  // otherwise default to dst for backwards compatibility
  var recFileType = GetUrlParameter("filetype");  if(!recFileType) recFileType="dst";

    if(recFilename){
      if(recFileType=="dst"){
        $('#inFilenameDST').val(recFilename);
      } else {
        $('#inFilenameReco').val(recFilename);
      }

      $('#inFilenameMenu').val(recFilename);        
      if($('#inFilenameMenu').val()!=recFilename) {
        // The file in question doesn't exist. Add it to the selection list.
        var name = recFilename.substr(recFilename.lastIndexOf('/')+1,100);
        $('#inFilenameMenu').append('<option value="'+recFilename+'">'+name+'</option>');
        $('#inFilenameMenu').val(recFilename);
        
      }
    }
                                                                   
  var recGate = GetUrlParameter("gate");          if(recGate)      $(".inGate").each(function(){$(this).val(recGate);});
  var recEntry = GetUrlParameter("entry");        if(recEntry)     $(".inEntry").each(function(){$(this).val(recEntry);});
  var recSlice= GetUrlParameter("slice");         if(recSlice)     gWhichSliceOnNextLoad = recSlice;
  var recSelection = GetUrlParameter("selection");
	if(recSelection) $(".inSelection").each(function(){$(this).val(decodeURIComponent(recSelection));});
  var recLive = GetUrlParameter("live");
  recSuppressTracks = GetUrlParameter("suppressTracks"); 
  
  
  // Miscellaneous
  var recPhCutLow  = GetUrlParameter("phCutLow");
  var recPhCutHigh = GetUrlParameter("phCutHigh");
  if(recPhCutLow) {
    hc_ph.ChangeRange(parseFloat(recPhCutLow),hc_ph.max_u);
    hc_ph.FinishRangeChange();
  }
  if(recPhCutHigh) {
    hc_ph.ChangeRange(hc_ph.min_u,parseFloat(recPhCutHigh));
    hc_ph.FinishRangeChange();
  }
  

  console.log("Requested via url:",recDet,recVer,recRun,recFilename,recGate,recEntry,recSlice,recSelection,recLive);
  if(recFilename && recEntry) {
    if(recFileType === "dst") {
      QueryServer('fe_dst');    
      $("#tabs").tabs('select','#input-fe-dst');
    } else {
      QueryServer('fe_reco');    
      $("#tabs").tabs('select','#input-fe-reco');
    }
  } else if ( recFilename && recGate ) {
    if(recFileType === "dst") {
        // TODO: I don't think this will work: we're asking for a
        // particular gate (not entry) in a dst file
        QueryServer('rsg_file');    
        $("#tabs").tabs('select','#input-fe-dst');
    } else {
        QueryServer('rsg_file');    
        $("#tabs").tabs('select','#input-fe-reco');
    }
  } else if ( recRun && recSubrun && recGate) {
    QueryServer('rsg');
  } else if ( recLive ) {
    $("#tabs").tabs('select','#input-live');
    $('#ctl-refresh-auto').attr("checked",true);
    $('#go_livedata').click();
  } else if(gPageName=="live") {
    // This is a live version of the page. Start with live data.
    $('#go_livedata').click();
  } else {

    
    // This is the default action on load. Currently it will load run 580, rubrun 4, event 12.
    if($("#inRsgRun").length>0) QueryServer('rsg');
    else QueryServer('fe_reco');
  }
  
  
  if(gPageName=="live")
  {
    // Tweak some things:
     // tridview.autoRotate(true);
     // $('.trid-autorotate').attr('checked',true);
     // $('.trid-autorotate').button("refresh");
     
     // $('.mri-autoscan').attr('checked',true);
     // $('.mri-autoscan').button('refresh');
     // mriview.autoScan(true);
     
     // console.log('live page!',$('input.trid-autorotate').val());
     hc_ph.margin_bottom = 20;
     hc_ph.xlabel = null;
     hc_time.margin_bottom = 20;
     hc_time.xlabel = null;
  }
  
});




///
/// Code that sets up slice-changing
///
$(function() {

  $('.do-slice-next').each(function(i){$(this).click(DoSliceNext);});
  $('.do-slice-prev').each(function(i){$(this).click(DoSlicePrev);}); 
  $('.do-slice-zero').each(function(i){$(this).click(DoSliceZero); });
  $('.do-slice-all') .each(function(i){$(this).click(DoSliceAll); });
  $('.do-next-slice-and-gate').each(function(i){$(this).click(DoNextSliceAndGate); });
  $('.do-prev-slice-and-gate').each(function(i){$(this).click(DoPrevSliceAndGate); });
  $('.do-next-gate').each(function(i){$(this).click(DoNextEvent); });
  $('.do-prev-gate').each(function(i){$(this).click(DoPrevEvent); });
  
  $('input:radio').on("focus",function(ev){this.blur();});;
  $('input:checkbox').on("focus",function(ev){this.blur();});;
  $('select').on("focus",function(ev){this.blur();});
  $('button').on("focus",function(ev){this.blur();});
   
  $(window).keypress(function(event){
    if($(event.target).is(":input")) return true;
    if(event.ctrlKey || event.altKey || event.metaKey) return true; // Don't intercept control-N for new window.
    console.log("keypress",event.which);
    switch(event.which) {
      case 44: // ',' key
      case 60: // '<' key
        DoPrevSliceAndGate(); return false;
      case 46: // '.' key
      case 62: // '>' key
        DoNextSliceAndGate(); return false;
      case 49: DoSlice(1); return false;  // number keys
      case 50: DoSlice(2); return false;  // number keys
      case 51: DoSlice(3); return false;  // number keys
      case 52: DoSlice(4); return false;  // number keys
      case 53: DoSlice(5); return false;  // number keys
      case 54: DoSlice(6); return false;  // number keys
      case 55: DoSlice(7); return false;  // number keys
      case 56: DoSlice(8); return false;  // number keys
      case 57: DoSlice(9); return false;  // number keys
      case 111: // 'o' key
      case 48:  // '0' key
        DoSlice(0); return false;  // '1' key
      case 97: DoSlice(-1); return false;  // 'a' key
      case 45: //'-'
      case 95: //'_'
        DoSlicePrev(); return false;
      case 43: //'+'
      case 61: //'='
        DoSliceNext(); return false;
      case 112: // 'p'
        DoPrevEvent(); return false;
      case 110: // 'n'
        DoNextEvent(); return false;

      case 104: // 'h'
        $('#ctl-show-hitmap-hits').click(); gStateMachine.Trigger('phColorChange');
        return false;
      case 98: // 'b'
        $('#ctl-show-hitmap-blobs').click(); gStateMachine.Trigger('phColorChange');
        return false;
      case 99: // 'c'
        $('#ctl-show-hitmap-clusters').click(); gStateMachine.Trigger('phColorChange');
        return false;
      case 118: // 'v'
        $('#ctl-show-hitmap-vertices').click(); gStateMachine.Trigger('phColorChange');
        return false;
      case 116: // 't'
        $('#ctl-show-hitmap-tracks').click(); gStateMachine.Trigger('phColorChange');
        return false;
      case 114: // 'r'
        $('#ctl-show-hitmap-regions').click(); gStateMachine.Trigger('phColorChange');
        return false;
      case 109: // 'm'
        $('#ctl-show-hitmap-truth').click(); gStateMachine.Trigger('phColorChange');
        return false;

      case 117: // 'u'
        $('#ctl-show-hitmap-hits-user-color').click();
        return false;

      case 92: // '\'
        // Cycle through MC interactions
        var active = $('#mc-info .accordion').accordion('option', 'active');  
        var count = $('#mc-info .accordion h3').size();
        var next = (active+1)%count;
        // console.log("active accordion: ",active,count,next);
        $('#mc-info .accordion').accordion('activate', next);  
        return false;


      case 105: // 'i'
        if($('#hit-info').is(":hidden")) {
          $('#hit-info').dialog('open').dialog('moveToTop').effect('highlight');
        } else {
          $('#hit-info').dialog('close');
        }
        return false;

      case 80:
        // console.log("P:",event);
        DoPrint(gPortletHover);
        break;
        
      case 76:
        // shift-L: print everything.
        return DoPrint($('body'),true);
        break;
        
      default:
        return true;
    }
  });
});

///
/// Code that sets up collapsibles.
///
function make_collapsibles(elem)
{
  $(".collapsible-title",elem).addClass('ui-helper-clearfix').prepend('<span class="collapsible-icon ui-icon ui-icon-triangle-1-s" />')
                         .click(function(){
                           $(".collapsible-icon",this).toggleClass('ui-icon-triangle-1-e')
                                                      .toggleClass('ui-icon-triangle-1-s');
                           $(this).next().toggle();                       
                         })
                         .filter("[revealed=false]")
                         .click();
}
  
$(function(){
  make_collapsibles($('body'));
});

///
/// Code that sets up portlets.
///
$(function(){
  
  // style portlets and add icons.
  var headers = $(".portlet").addClass("ui-widget ui-widget-content ui-helper-clearfix ui-corner-all")
                .find(".portlet-header");
  headers.addClass("ui-widget-header ui-corner-all");
  // headers.prepend('<span class="ui-icon ui-icon-arrow-4-diag icon-explode"></span>');
  if(!isIOS()) {
    headers.each(function(){
      if($('#'+$(this).parents(".portlet:first").attr("id")+"-help-text").length>0)
        $(this).prepend('<span class="ui-icon ui-icon-help"></span>')                             
    });
    headers.prepend('<span class="ui-icon ui-icon-print"></span>');                       
  }
  headers.each(function(){
    if($(this).parents(".portlet:first").find(".portlet-content").is(":hidden")) {
      // console.log($(this).text(),"is hidden");
      $(this).prepend('<span class="ui-icon ui-icon-plusthick icon-shrink"></span>');
    } else {
      // console.log($(this).text(),"is not hidden");
      $(this).prepend('<span class="ui-icon ui-icon-minusthick icon-shrink"></span>');      
    }
  });
  // Printable.
  
  // This doesn't actually work. Returns all messed up.
  $('#Print').click(function(){return DoPrint($('#everything'),true);});

  $(".portlet-header .ui-icon-print").click(function(){    
                                                      var portlet = $(this).parents(".portlet:first");
                                                      var content = $('.portlet-content',portlet);
                                                      return DoPrint(content);
                                                    } );
                                                  
  $(".portlet").mouseover(function(event){
        // console.log("mouseover",this);
        gPortletHover = this;
  });
  
  // Explodeable.
  $(".portlet-header .icon-explode").click(function(){
    
    var portlet = $(this).parents(".portlet:first");
    var content = portlet.find(".portlet-content");

    $(portlet).toggleClass("portlet-fullscreen");
    content
      .trigger("resize")
      .find(".pad").trigger("resize");
  });


  // Expandable and contractable.
  $(".portlet-header .icon-shrink").click(function() {
          $(this).toggleClass("ui-icon-minusthick");
          $(this).toggleClass("ui-icon-plusthick");
          $(this).parents(".portlet:first").find(".portlet-content")
            .toggle()
            .trigger("resize")
            .find(".pad").trigger("resize");
  });
  $(".portlet-header").dblclick(function() { $(".icon-shrink",this).trigger("click"); return false; });


  // Help function:
  $(".portlet-header .ui-icon-help").click(function() {
    $('#'+$(this).parents(".portlet:first").attr("id")+"-help-text")
      .dialog({
            modal: true,
            buttons: {
              Ok: function() {
                $(this).dialog('close');
              }
            }
          }).dialog('open');
  });
  
  // Make portlets resizable.
  // $(".portlet-content").resizable({
  //   containment: 'parent' 
  //  
  // });  

  // Make portlets sortable.
  $(".dock").sortable({
                connectWith: '.dock',
                handle: '.portlet-header'
        });
        
  // Make portlets blow-up-able
  // Disabled above. I didn't like the effect.
  $(".portlet-header .icon-expand").click(function() {
    var portlet = $(this).parents(".portlet:first");
    if(!portlet.hasClass("portlet-fullscreen")) {
      // expand.
      $("<div id='expando-placeholder'></div>").insertAfter($(portlet));
      $('#expando-target').prepend($(portlet));
      
      $('#expando-target').addClass("portlet-fullscreen");
      portlet.addClass("portlet-fullscreen");
      portlet.resize();
      
    } else {
      // contract
      portlet.removeClass("portlet-fullscreen");
      portlet.insertAfter($('#expando-placeholder'));
      portlet.resize();
      $('#expando-placeholder').remove();
    }
  });

  // Issue custom commands to resize inner content.
  $(".dock").bind('sortstop', function(event, ui) {
    $('.pad',ui.item).trigger("resize");
  });
  
});


//
// Dialogs:
//
// $.ui.dialog.defaults.bgiframe = true;
$(function() {
  // Some specific dialogs.
  $("#hit-info").dialog({autoOpen:false,position:'left',width:250,height:330});

  // Generic configuration dialogs
  $(".dialog").dialog({autoOpen:false,position:'left'});

  // Dialog-activating buttons.
  $(".open-dialog").addClass("ui-state-default ui-corner-all")
                   .click(function(ev){
                     // Cleverness: #open-time-dialog opens the dialog named #time-dialog
                     $('#'+this.id.replace(/^open-/,"")).dialog('open').dialog('moveToTop').effect('highlight');
                   });
});

  



///
/// Code that sets up configuration callbacks.
///

$(function(){
  $('#ctl-color-scale').addClass("saveable").change(function(){
    var sel = $('#ctl-color-scale option:selected').val();
    gPhColorScaler.SetScale(sel);
    gStateMachine.Trigger('phColorChange');
  });

  $('#ctl-show-hitmap-hits-user-color').addClass("saveable").change(function(){
    gStateMachine.Trigger('phColorChange');
  });
  
  $('#ctl-magnifying-glass').addClass("saveable").change(function(){
    gStateMachine.Trigger('phColorChange');
  });
  
  $('#ctl-magnifier-mag').addClass("saveable");
  $('#ctl-magnifier-size').addClass("saveable");
  $('#ctl-magnifier-mag-slider').slider(
    {
      value: parseFloat($('#ctl-magnifier-mag').val()),
			min: 1,
			max: 10,
			step: 0.1,
			slide: function(event, ui) {
       $("#ctl-magnifier-mag").val(ui.value);
       }
    }
	);
  
  $('#ctl-magnifier-size-slider').slider(
    {
      value: parseFloat($('#ctl-magnifier-size').val()),
			min: 10,
			max: 200,
			slide: function(event, ui) {
				$("#ctl-magnifier-size").val(ui.value);
			}
		}	
  );
  
  
  
  $('#ctl-blob-opacity,#ctl-show-hitmap-vertices,#ctl-show-hitmap-tracks,#ctl-show-hitmap-hits,#ctl-show-hitmap-clusters,#ctl-show-hitmap-la-clusters,#ctl-show-hitmap-blobs,'+
    '#ctl-show-hitmap-hits-flagged-only,#ctl-show-hitmap-tracks-flagged-only,#ctl-show-hitmap-vertices-flagged-only,#ctl-show-hitmap-regions,'+
    '#ctl-show-hitmap-truth,#ctl-show-minos-strips')
    .addClass("saveable").change(function(){
      gStateMachine.Trigger('phColorChange');
    });

  $('#ctl-blob-opacity').addClass("saveable");
  $('#ctl-blob-opacity-slider').slider({min:0, max: 1, step:0.01,
                                 value:   $('#ctl-blob-opacity').val(),
                                slide: function(event,ui) {$('#ctl-show-hitmap-blobs').attr('checked',1); $('#ctl-blob-opacity').val(ui.value); gStateMachine.Trigger('phColorChange');}
                                });
    
  $('#ctl-show-hitmap-hits-flagged-only,#ctl-show-hitmap-tracks-flagged-only,#ctl-show-hitmap-vertices-flagged-only,#ctl-show-hitmap-clusters-flagged-only')
      .addClass("saveable").change(function(){
        gShowFlaggedHitsOnly = $('#ctl-show-hitmap-hits-flagged-only').is(":checked");
        gShowFlaggedBlobsOnly = $('#ctl-show-hitmap-blobs-flagged-only').is(":checked");
        gShowFlaggedTracksOnly = $('#ctl-show-hitmap-tracks-flagged-only').is(":checked");
        gShowFlaggedVerticesOnly = $('#ctl-show-hitmap-vertices-flagged-only').is(":checked");
        gShowFlaggedClustersOnly = $('#ctl-show-hitmap-vertices-flagged-only').is(":checked");
        
        gStateMachine.Trigger('phCutChange');
    });

  $("input[name='hitmap-clus-radio']").change(function(){
      
      gStateMachine.Trigger('phCutChange');      
  });
  $("input[name='hitmap-track-radio']").change(function(){

      gStateMachine.Trigger('phCutChange');      
  });


  $('#ctl-hitmap-triangles,#ctl-show-labels,#ctl-show-tick-labels')
    .addClass("saveable").change(function(){
        gStateMachine.Trigger('phCutChange');
      });
  

  // Time dialog:
  $('#ctl-cut-timeunder,#ctl-cut-timeover').addClass("saveable").change(function(){hc_time.FinishRangeChange();}); // Recut.
  $('#ctl-cut-no-disc-fired').addClass("saveable").change(function(){ gStateMachine.Trigger('timeCutChange'); }); // Recut.

  // PH dialog:
  $('#ctl-cut-phunder,#ctl-cut-phover').addClass("saveable").change(function(){hc_ph.FinishRangeChange();}); // Recut.
  $('#ctl-ph-includeID,#ctl-ph-includeOD').addClass("saveable").change(function(){hc_ph.ReBuild();});
  $('#ctl-ph-field').change(function(){hc_ph.ChangeField();});
  $('#ctl-show-hitmap-hits-user-color').change(function(){gStateMachine.Trigger('phColorChange');});
  
  //
  // Cookies!
  //
  // Look at each portlet: this is a debugging check at page-load.
  $(".portlet").each(function(){
     var myid = this.id;
     if(myid==="" || myid===null || myid===undefined) 
       console.warn("Did not define an ID for one of the porlets:",$(".portlet-header",this).text());
  });
  
  ////////////////////////////////////////
  // Save
  ////////////////////////////////////////
  function SaveSettings( slot ) {
    // Cookie expiration date.
    expdate = new Date();
    expdate.setFullYear(2020);
    
    var hidden_list = [];
    var unhidden_list = [];
    $(".portlet").each(function(){
      if($(".portlet-content",this).is(":hidden"))   hidden_list.push(this.id);
      else                                         unhidden_list.push(this.id);
    });

    $.cookie(slot+":hidden-portlets",     hidden_list.join(","),{expires: expdate});
    $.cookie(slot+":unhidden-portlets", unhidden_list.join(","),{expires: expdate});
    // console.log("saving ","hidden-portlets",hidden_list.join(","));
    // console.log("saving ","unhidden-portlets",unhidden_list.join(","));
    
    // Save portlet positions.
    $(".dock").each(function(){
      $.cookie(slot+":dock:"+this.id,
                $(this).sortable("toArray")
                ,{expires: expdate});
      // console.log("saving ","dock:"+this.id,$(this).sortable("toArray"));
      
    });
    
    // Save misc. configuration boxes.
    $(".saveable").each(function(){
      val = $(this).val();
      if($(this).is(":checkbox")) val = $(this).is(":checked");
      if($(this).is(":radio")   ) val = $(this).is(":checked");
      $.cookie(slot+":"+this.id,val);
      // console.log("saving ",this.id,val);
    });
    
    console.log("cookies saved.");
    
  }

  $('#ctl-save-config').click(function() {
    SaveSettings("save");
  });

  ////////////////////////////////////////
  // Restore
  ////////////////////////////////////////
  function RestoreSettings( slot ) {
    console.log("RestoreSettings, slot=",slot);
    // see ideas at http://www.shopdev.co.uk/blog/sortable-lists-using-jquery-ui/
    var hidden_list_str = $.cookie(slot+":hidden-portlets");
    var unhidden_list_str = $.cookie(slot+":unhidden-portlets");
    if(hidden_list_str === null) hidden_list_str = "";
    if(unhidden_list_str === null) unhidden_list_str = "";
    var hidden_list = hidden_list_str.split(',');
    var unhidden_list = unhidden_list_str.split(',');
    
    $(".portlet").each(function(){
      var should_be_hidden = false;
      var this_portlet_is_configured = false;
      if(jQuery.inArray(this.id,  hidden_list)>=0) {should_be_hidden=true; this_portlet_is_configured=true;}
      if(jQuery.inArray(this.id,unhidden_list)>=0) {should_be_hidden=false; this_portlet_is_configured=true;}

      if(this_portlet_is_configured==false) return;

      var ishidden = $(".portlet-content",this).is(":hidden");
      // console.log(this,"ishidden:"+ishidden,"should be hidden:"+should_be_hidden);
      if(ishidden != should_be_hidden) {
           // hide or expose it
           console.warn("Toggling!",$('.portlet-header',this).text());
           $(".portlet-header .icon-shrink",this).toggleClass("ui-icon-minusthick")
                                             .toggleClass("ui-icon-plusthick");
           $(".portlet-content",this)
             .toggle()
             .trigger("resize");
       }
     });

     // console.log("RestoreSettings, slot=",slot);
     // The hard part: rebuilding the docks.
     $(".dock").each(function(){
       var cval = $.cookie(slot+":dock:"+this.id);
       // console.log("evaluating cookie","dock:"+this.id,cval);
       if(cval === null) return;
       var list = cval.split(',');
       for(var i=list.length-1;i>=0;i--){
         if(list[i]=="") continue;
         // Move through the list backwards. For each item, remove it from it's current location and insert at the top of the list.
         $(this).prepend($('#'+list[i]));
         // Fire the element's dom-change callback
         $('#'+list[i]+" .pad").trigger("resize");
       }
     });

     // Reset controls in list 
     // console.log("***RESTORING CONTROLS****");
      $(".saveable").each(function(){
        var val = $.cookie(slot+":"+this.id);
        if(val!=null){
          // console.log("restoring:",this.id,val);
          var changed = false;
          if($(this).is(':checkbox') || $(this).is(':radio')){

            if( (val=='true') != $(this).is(':checked')) changed = true;
            $(this).attr('checked',val=='true');

          } else {
            if( val != $(this).val() ) changed = true;
            $(this).val(val);
          } 

          if(changed) $(this).trigger('change'); // Just in case
         }
      });
  }

  $('#ctl-load-config').click(function(){
    RestoreSettings("save");
  });

  // Scanner defaults.
  $("#ctl-scanner-config").click(function(){
    $.cookie("scanner:hidden-portlets","source-port,mri-view-port,tridview-port,elecview-port");
    $.cookie("scanner:dock:content-left" ,"time-hist-port,ph-hist-port,config-port,elecview-port");
    $.cookie("scanner:dock:content-right","gate-info-port,scan-record-port,mri-view-port,tridview-port");
    $.cookie("scanner:dock:content-middle","big-hitmap-port,scan-entry-port,hit-map-port")   
    $.cookie("scanner:ctl-ph-includeOD","false");
    $.cookie("scanner:ctl-ph-includeID","true");
    $.cookie("scanner:ctl-cut-phover","false");
    $.cookie("scanner:ctl-cut-phunder","true");
    $.cookie("scanner:ctl-cut-timeover","true");
    $.cookie("scanner:ctl-cut-timeunder","true");
    $.cookie("scanner:ctl-magnifying-glass","false");
    $.cookie("scanner:ctl-color-scale","BrownPurplePalette");

    RestoreSettings("scanner");
  });
  
  // Clear all cookies.
  $("#ctl-restore-defaults").click(function(){
  	var Cookies = document.cookie.split(";");

  	for ( var Cnt=0; Cnt < Cookies.length; Cnt++ ) {
  		var CurCookie = Cookies[Cnt].split("=");
  		// console.log("unbinding "+CurCookie[0]);
  		$.cookie(CurCookie[0],null);
  	};

    if(gUrlToThisEvent) window.location = gUrlToThisEvent;
    else window.location.reload();
  });
  

  
  // By default, load the saved cookie.
  RestoreSettings("save");

});


// Track Selection Dialog
function TrackSelectionDialogRedraw()
{
  // console.log("TrackSelectionDialogRedraw");
  
  if($('#track-hider-checkbox-table').length == 0) return;
  $('.track-hider-checkbox').each(function(){
    $(this).parents("td:first").hide();
  });

  var tracksOn = $('#ctl-show-hitmap-tracks').is(':checked');
  // console.log("tracksOn",tracksOn);
  var tracks = gRecord.tracks;

  for(var i=0;i<tracks.length;i++) {
    var box = $('#track-hider-checkbox-'+i).parents('td:first');
    box.show();
    if(tracksOn) $('#track-hider-checkbox-'+i).removeAttr('disabled');
    else         $('#track-hider-checkbox-'+i).attr('disabled', 'disabled');
  }
}

function TrackSelectionChanged()
{ 
  gSuppressTracks = [];
  $('.track-hider-checkbox').each(function(){
    var id = parseInt(this.id.replace(/^track-hider-checkbox-/,""));
    var sup = 1;
    if($(this).is(':checked')) sup=0;
    gSuppressTracks[id]=sup;      
  });
  // console.log("gSuppressTracks",gSuppressTracks);
  gStateMachine.Trigger('phCutChange');
}

function TrackSelectionReset()
{
  // The idea here: This extra-bonus url argument needs to be applied to the first event, but not subsequent ones.
  $('.track-hider-checkbox').attr('checked',"checked");
  gSuppressTracks = null;
  
  if (recSuppressTracks) {
    var a = recSuppressTracks.split(',');
    gSuppressTracks = []; 
    for(var i=0;i<100;i++) gSuppressTracks[i]=0;
    for(var i=0;i<a.length;i++){
      gSuppressTracks[a[i]]=1;
      $('#track-hider-checkbox-'+a[i]).attr('checked','');
    }
    recSuppressTracks = null;
    gStateMachine.Trigger('phCutChange');    
  }

  TrackSelectionDialogRedraw();
}

$(function(){
  $('#ctl-show-hitmap-tracks').change(TrackSelectionDialogRedraw);
  
  gStateMachine.Bind('gateChange',TrackSelectionReset);
 $('.track-hider-checkbox').click(TrackSelectionChanged);
  
});

