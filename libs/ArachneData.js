//
// Code for the Arachne Event Display
// Author: Nathaniel Tagg ntagg@otterbein.edu
// 
// Licence: this code is free for non-commertial use. Note other licences may apply to 3rd-party code.
// Any use of this code must include attribution to Nathaniel Tagg at Otterbein University, but otherwise 
// you're free to modify and use it as you like.
//

// Configuration


kTooManyHits = 10000;


// Global variables.
gWhichSliceOnNextLoad=-1;
gCurrentSlice = -1;

gFile = "";
gDet = "";
gRecoVer = "";
gRun = 0;
gSubrun = 0;
gGate  = 0;
gEntry = 0;

gLatestCache = null;
gRecentCache = null;

// Useful slices of the data
gNumSlices=0;
xmlDoc = null;
gjqXHR = null;
gServing = null;   // Data element from server, including wrapper with possible error messages.
gRecord = null;    // This is the core data element

gHits = [];
gIdHits = [];
gOdHits = [];
gVetoHits = [];
gIdClusters = [];
gVertices = [];
gTracks = [];
gBlobs = [];
gMinosStrips = [];
gMinosTracks = [];
gThereAreTooManyHits = false;


gHoverHits = [];
gSelectedHits = [];
gHoverCluster = null;
gHoverTrack = null;
gHoverVertex = null;
gHoverBlob = null;
gSelectedTrack = null;
gSelectedVertex = null;
gSelectedBlob = null;
gSelectedTrajectories = [];

var gUrlToThisEvent = null;
var gUrlToLastEvent = null;

// Profiling
var gServerRequestTime;
var gServerResponseTime;
var gFinishedDrawTime;

gEventsLoadedThisSession = 0;
gBlockWhenQuerying = true;

function ShouldIHighlightThisTrack(track)
{
  if(track == gSelectedTrack || track == gHoverTrack) return true;
  var idx = track.index;
  var i;
  if(gHoverVertex) {
    for(i=0;i<gHoverVertex.track_idx.length;i++) {
      if(gHoverVertex.track_idx[i]==idx) return true;
    }
  }
  
  if(gSelectedVertex) {
    for(i=0;i<gSelectedVertex.track_idx.length;i++) {
      if(gSelectedVertex.track_idx[i]==idx) return true;
    }
  }
  
  return false;
}

function FindImportantJsonHandles()
{
  // Set global hit structures.
  gHoverHits = [];
  gSelectedHits = [];
    
  gIdHits = gRecord.hits.idhits;
  gOdHits = gRecord.hits.odhits;
  gVetoHits = gRecord.hits.vetohits;
  
  gHits = gRecord.hits.misc_hits.concat(gIdHits,gOdHits,gVetoHits);
  
  gTracks = gRecord.tracks;
  gVertices = gRecord.vertices;
  
                                                    
  gMinosStrips = gRecord.minos.strips || [];
  gMinosTracks = gRecord.minos.tracks || [];

  gIdClusters = gRecord.clusters;
  gBlobs    =   gRecord.id_blobs;
  
  gBlobColors = [];
  // Assign blob colors
  var ic = 0;
  for(var i=0;i<gBlobs.length;i++) {
    var b = gBlobs[i];
    var id = b.index;
    var pat = b.patrec;
    var c ="";
    switch(pat) {
      case 1: //"Dispersed Blob" 
        c = "rgba(0,0,150,0.1)";
        break;
      case 2: // Vertex blob.
        c = "rgba(0,255,0,0.7)";
        break;
      case 3: // isolated
      case 4: // cone
        var s = new ColorScaleRedBlue();
        ic +=1;
        c = "rgba(" + s.GetColor((ic)/10.) + ",0.7)";
        break;
      default: // shouldn't happen
        c = "rgba(200,255,200,1.0)";
    }
    gBlobColors[id] = c;
  }
}

function BuildHitToTrackMap()
{
  // Find an index-to-cluster map to save time.
  gClusters_by_index = [];
  var n = gIdClusters.length;
  for(var i=0;i<n;i++)
  {
    var clus = gIdClusters[i];
    var index = clus.index;
    gClusters_by_index[index] = clus;
  }

  gHitToTrack = [];
  n = gTracks.length;
  for(var i=0;i<n;i++) {
        var trk = gTracks[i];

        // Find all the node/clusters
        var nodes = trk.nodes;
        var nnode = 0;
        for(var inode=0;inode<nodes.length;inode++) {
          var node = nodes[inode];

          var clus_idx = node.cluster_index;
          var clus = gClusters_by_index[clus_idx];
          
          if(clus){
            var hit_ids = clus.hits_idx;          
            for(var ihit=0;ihit<hit_ids.length;ihit++) {
              gHitToTrack[hit_ids[ihit]] = trk;
            }
          }
       }
  }

  
}


function DoEvent()
{
  $("#status").text("Drawing...");
  
  console.log('DoEvent');
  var el;

  // ev_detector types (I think)
  // PMTTestStand           = 0x01,
  // TrackingPrototype      = 0x02,
  // TestBeam               = 0x04,
  // FrozenDetector         = 0x08,
  // UpstreamDetector       = 0x10,
  // FullMinerva            = 0x20,
  // DTReserved7            = 0x40,
  // DTReserved8            = 0x80'


  // Get some basic info.  Notes here show some basic jQuery magic.
  gFile   = decodeURIComponent(gRecord.source.file);         // Gets text of xml node 'file'
  gDet    = "TP";                           // Fixme for new detector versions.
  if(gRecord.ev.detector >= 8 ) gDet = "MN";
  if(gRecord.ev.detector == 0 ) gDet = "MV";
  if(gRecord.ev.detector >= 32 ) gDet = "MV";
  if(gRecord.ev.detector == 4 ) gDet = "TB"; // Testbeam
  
  // Override by filename, if it makes sense.
  
  var lastslash = gFile.lastIndexOf('/');
  var firstunder = gFile.indexOf('_',lastslash);
  var secondunder = gFile.indexOf('_',firstunder+1);
  var detcode = gFile.substring(lastslash+1,firstunder);

  if(detcode=='TP')  gDet = detcode;
  if(detcode=='MV')  gDet = detcode;
  if(detcode=='MN')  gDet = detcode;
  if(detcode=='TB')  gDet = detcode;
  if(detcode=='UN')  gDet = detcode;
  if(detcode=='SIM') {
    detcode = gFile.substring(lastslash+1,secondunder);    
    gDet = detcode;
  }

  gRecoVer= gRecord.source.reco_version;
  gRun    = gRecord.ev.run;
  gSubrun = gRecord.ev.sub_run;
  gGate   = gRecord.ev.gate;
  gEntry  = gRecord.source.entry;

  if(gRecord.mc && gRecord.mc.mc_run)    gRun = gRecord.mc.mc_run;
  if(gRecord.mc && gRecord.mc.mc_subrun) gSubrun = gRecord.mc.mc_subrun;
  if(gRecord.mc && gRecord.mc.mc_spill)  gGate = gRecord.mc.mc_spill;

  // Update the input forms with up-to-date data.
  $("#inRsgDet").val(gDet);
  $("#inRsgRecoVer").val(gRecoVer);
  $("#inRsgRun").val(gRun);
  $("#inRsgSubrun").val(gSubrun);
  $('#inFileRsgRun').val(gRun);
  $('#inFileRsgSubrun').val(gSubrun);
  $('#inFileRsgGate').val(gGate);

  $(".inGate").each(function(i){
    $(this).val(gGate);
    });
  $(".inEntry").each(function(i){
    $(this).val(gEntry);
    });
  $('#inFilenameMenu').val(gFile);
  $('#inFilename').val(gFile);
  $('#inXmlText').val(gjqXHR.responseText);
  
  // Load cache data if it's a live request.
  var live_cache = gServing["live_cache_file"];
  if(live_cache) {
    gRecentCache = live_cache;  //#timestamp of the event they were just looking at.
    if(gLatestCache == null || gRecentCache > gLatestCache) 
      gLatestCache = gRecentCache;    //filename of the latest event yet seen by that client
  } 

  ResetScannerForm();

  gNumSlices = gRecord.n_slices;
  gWhichSliceOnNextLoad = parseInt(gWhichSliceOnNextLoad); // Just to be sure.
  // Set current slice number.
  console.log("Loading first slice as ",gWhichSliceOnNextLoad," Total slices:",gNumSlices);
  gCurrentSlice = gWhichSliceOnNextLoad; // if(gWhichSliceOnNextLoad === 'all') gCurrentSlice = -1;
  if(gCurrentSlice > gNumSlices) gCurrentSlice = gNumSlices;
  if(gNumSlices <= 0) gCurrentSlice = -1;
  console.log("Set slice to",gCurrentSlice);

  // Set global hit structures.
  FindImportantJsonHandles(); // Put this into a function for better profiling.
  gHoverTrack = gSelectedTrack = null;
  

  var sel = $('#ctl-color-scale option:selected').val();
  gPhColorScaler.SetScale(sel);
  // gPhColorScaler.min=0;
  // gPhColorScaler.max=30;


  // Set up the correct configuration for the detector:
  if (gDet == "UN" ) { // 2014 testbeam?
    gGeo = new TBGeometry_20ECAL20HCAL;
  } else if (gDet == "TB" ) {  // testbeam
    if(gRun>1500) gGeo = new TBGeometry_TrackerSuperHCAL;
    else if(gRun<238 || (gRun>=1000)) gGeo = new TBGeometry_20ECAL20HCAL;
    else              gGeo = new TBGeometry_20Tracker20ECAL;
  }
  else if(gDet=="TP" || gDet=="SIM_prototype") {
    // TP:
    gGeo = new TPGeometry;
  }
  else if(gDet=="MN" || gDet=="SIM_frozen") { 
    gGeo = new MNGeometry;
  } else {

    // Fallback: full detector.
    gGeo = new MVGeometry;
  }
  

  // OK, time to impliment some sort of data limiter
  gThereAreTooManyHits = (gHits.length > kTooManyHits);
  if(gThereAreTooManyHits) {
    $('#num-hits-untruncated').text(gHits.length);
    $.blockUI({  theme:     true,
                  title: "Too Many Hits!",
                message: $('#too-many-hits-confirmation'), css: { width: '275px' } }); 


  } else {
    DoEvent_Part2();
  }
}

$(function(){
  $('#too-many-hits-continue').click(function() { 
              $.unblockUI();
              DoEvent_Part2();
          });
  $('#too-many-hits-truncate').click(function() { 
              $.unblockUI();
              gHits.splice(kTooManyHits);
              gIdHits.splice(kTooManyHits);
              gOdHits.splice(kTooManyHits);
              DoEvent_Part2();
            });
  $('#too-many-hits-stop') .click(function() { 
              $.unblockUI();
              gHits = [];
              gIdHits = [];
              gOdHits = [];
              DoEvent_Part2();
              
            });
  
})

function DoPerformanceStats()
{
  var nserved = gRecord.backend_monitor.events_served;
  var walltime = gRecord.backend_monitor.WallClockTime;

  if(walltime> (60*60*24)) {
    wallstring = Math.round(walltime/(60*60*24)) + " days";
  } else if (walltime > 60*60) {
    wallstring = Math.round(walltime/(60*60)) + " hours";    
  } else if (walltime > 60) {
    wallstring = Math.round(walltime/(60)) + " min";    
  } else {
    wallstring = walltime + " sec";
  }
  
  var t_backend = gRecord.ElapsedServerTime;
  var t_get = (gServerResponseTime - gServerRequestTime - t_backend);
  var t_parse = (gClientParseTime - gServerResponseTime);
  var t_draw = ( gFinishedDrawTime - gClientParseTime);
  
  $("#debuginfo").html(
      "Time for backend to build JSON from disk: " + t_backend + "ms<br/>"
    + "Time to transfer JSON over network: " + t_get + " ms<br/>"
    + "Time to parse JSON on client: " + t_parse + " ms<br/>"
    + "Time to build and draw event: " +  t_draw + " ms<br/>"
    + "Backend: " + nserved + " events served, running unstopped for " + wallstring
   );
  var h = $('#debugbench').html();
  h+= gEntry
  + "   size: " + (gjqXHR.responseText.length) + " bytes   " //+ gHits.length + " hits"
  + "   backend: " + t_backend + " ms"
  + "   get:" + t_get + " ms "
  + "   parse:" + t_parse+ " ms "
  + "   draw: " + t_draw + " ms <br/>";
  $('#debugbench').html(h);
  
}

function DoEvent_Part2()
{
  // Build any once-per-record data indices.
  BuildHitToTrackMap();

  gEventsLoadedThisSession +=1;

  // Trigger the automatic routines - stuff not yet pulled out of this routine.
  gStateMachine.Trigger('gateChange');
  $("#status").text("Done!");
  $('#status').attr('class', 'status-ok');
  if(gThereAreTooManyHits) {
    // Boom! Too much data!
    $("#status").text("Warning. More than " +kTooManyHits+ " hits.");
    $('#status').attr('class', 'status-warning');
  }
};

function DoSlice(slice)
{
  stop_auto_refresh();
  ResetScannerForm();
  if(gRecord === null){
    gCurrentSlice = -1;
    return false;
  }
  if(slice <= gNumSlices) gCurrentSlice=slice;
  gStateMachine.Trigger('sliceChange');
  return false;
}

function DoSliceNext(dont_stop_refresh)
{
  if(!dont_stop_refresh) stop_auto_refresh();
  ResetScannerForm();
  
  if(gRecord === null){
    gCurrentSlice = -1;
    return false;
  } 
  gCurrentSlice++;
  if(gCurrentSlice < 1) gCurrentSlice = 1;
  if(gCurrentSlice > gNumSlices) { gCurrentSlice = 1;};
  if(gNumSlices<=0) gCurrentSlice = -1;
  
  gStateMachine.Trigger('sliceChange');
  
  return false;
}

function DoSlicePrev()
{
  stop_auto_refresh();
  ResetScannerForm();
  if(gRecord === null){
    gCurrentSlice = -1;
    return false;
  } 
  gCurrentSlice--;
  if(gCurrentSlice < 1) { gCurrentSlice = gNumSlices;  }
  gStateMachine.Trigger('sliceChange');
  return false;  
}

function DoSliceZero(event)
{
  stop_auto_refresh();
  ResetScannerForm();
  if(gRecord === null){
     gCurrentSlice = -1;
     gStateMachine.Trigger('sliceChange');
     return false;
   }
   gCurrentSlice = 0;
   gStateMachine.Trigger('sliceChange');
   return false;
}

function DoSliceAll(event)
{
  stop_auto_refresh();
  ResetScannerForm();
  gCurrentSlice = -1;
  gStateMachine.Trigger('sliceChange');
  return false;
}

function DoNextSliceAndGate(event)
{
  stop_auto_refresh();
  ResetScannerForm();
  if(gCurrentSlice<1) gCurrentSlice=1;
  else{
    gCurrentSlice++;
    if(gCurrentSlice > gNumSlices) {
      gWhichSliceOnNextLoad=1;
      DoNextEvent();
      return false;
    }
  }
  gStateMachine.Trigger('sliceChange');
  return false;
}

function DoPrevSliceAndGate(event)
{
  stop_auto_refresh();
  ResetScannerForm();
  gCurrentSlice--;
  if(gCurrentSlice<1) {
    gWhichSliceOnNextLoad=99999;
    DoPrevEvent();
    return false;    
  }
  gStateMachine.Trigger('sliceChange');
  return false;
}

function DoNextEvent()
{
  // Check bounds - are we about to hit end of file?
  var n = gRecord.source.numEntriesInFile;
  if(gEntry+1 >= n) {
    $('#warning-dialog-message').html("You are at the last entry of the file/subrun. Can't advance.");
    $( "#warning-dialog" ).dialog({
          modal: true,
          buttons: {
            Ok: function() {$( this ).dialog( "close" );}
          }
    });
  } else {

      if(gLastQueryType=='rsg' || gLastQueryType=='rsg_file') {
        gGate = gGate+1;
        $('.inGate').val(gGate);
      } else if(gLastQueryType=='fe_reco' || gLastQueryType=='fe_dst') {
        gEntry = gEntry+1;
        $('.inEntry').val(gEntry)
      }
      if(gPageName=='simple') gWhichSliceOnNextLoad = 1;
      else gWhichSliceOnNextLoad=-1;
      QueryServer('last_query_type');
  }
}

function DoPrevEvent()
{
  stop_auto_refresh();
  
  if(gEntry <= 0) {
    $('#warning-dialog-message').html("You are at the first entry of the file/subrun. Can't move back.");
    $( "#warning-dialog" ).dialog({
          modal: true,
          buttons: {
            Ok: function() {$( this ).dialog( "close" );}
          }
    });
  } else {
  
  
    if(gLastQueryType=='rsg' || gLastQueryType=='rsg_file') {
      gGate = gGate-1;
      $('.inGate').val(gGate);
    } else if(gLastQueryType=='fe_reco' || gLastQueryType=='fe_dst') {
      gEntry = gEntry-1;
      $('.inEntry').val(gEntry)
    }
    gWhichSliceOnNextLoad=-1;
    QueryServer('last_query_type');
  }
}

function DoJumpToEvent(next_det, next_ver, next_run, next_subrun, next_gate, next_slice)
{
  var cur_ver     = gRecoVer;
  var cur_run     = gRun;
  var cur_subrun  = gSubrun;
  var cur_gate    = gGate
  var cur_slice   = gCurrentSlice;

  if(next_ver==null) { next_ver = gRecoVer; }
  if(next_det==null) { next_ver = gDet; }

  if((next_ver == gRecoVer) && (next_run == gRun) && (next_subrun==gSubrun) && (next_gate==gGate)) {
    // Just the slice needs changing.
    DoSlice(next_slice);
    return;
  }

  // Otherwise, we need a new event loaded. Set the input form.
  $('#inRsgRecoVer').val(next_ver);
  $('#inRsgDet').val(next_det);
  $('.inRun').val(next_run);
  $('.inSubrun').val(next_subrun);
  $('.inGate').val(next_gate);
  gWhichSliceOnNextLoad=next_slice;
  QueryServer('rsg');
}


function QueryFilter(data, type)
{
  // This function is called before processing, I think: it might be used to do timing.
  gServerResponseTime = (new Date).getTime();
  return data;
}

function QueryError(jqxhr, textStatus, errorThrown )
{ 
  $.unblockUI();
  gServing = null;
  gRecord = null;
  
  document.body.style.cursor='auto';
  
  gjqXHR = jqxhr;
  console.log("QueryError! Result:",gjqXHR);
  $('#status').attr('class', 'status-error');

  if(textStatus == 'error') {
    $("#status").text("Server gave error "+textStatus+": \""+errorThrown+"\" ");      
  } else {
    $("#status").text("Problem with data: \""+textStatus+"\"");    
  }
}


function QuerySuccess(data,textStatus,jqxhr)
{
  var ok = ProcessXml(data,textStatus,jqxhr);
  if(!ok) {
    gStateMachine.Trigger('gateChange'); // Wipe all the displays to show it's not loaded.
  }
}

function ProcessXml(data,textStatus,jqxhr)
{
  // Nuke all the current data.
  gNumSlices=0;
  gHits = [];
  gIdHits = [];
  gOdHits = [];
  gIdClusters = [];
  gOdClusters = [];
  gTracks = [];
  gIdClusters = [];
  gThereAreTooManyHits = false;

  gHoverHits = [];
  gSelectedHits = [];
  gHoverTrack = null;
  gSelectedTrack = null;
  
  gServing = null;   // Data element from server, including wrapper with possible error messages.
  gRecord = null;    // This is the core data element
  
  
  $.unblockUI();
  gClientParseTime = (new Date).getTime();
  $("#status").text("Response received.");

  gjqXHR = jqxhr;
  
  gServing = data;


  document.body.style.cursor='progress';
  
  if(gServing.error) { 
    $("#status").attr('class','status-error');
    $("#status").text("Error:" + gServing.error);
    return false;
  }

  console.log( "serve-event log:", gServing.serve_event_log );
  $("#debuglog").html(gServing.serve_event_log );
 
 
  if(gServing.record) {
    gRecord = gServing.record;
    console.warn("Got New Record:");
    console.warn(gRecord);
    if(gRecord.error) {
      $("#status").attr('class','status-error');
      $("#status").text("Error:" + gRecord.error);
      return false;
    }
    DoEvent();
    gFinishedDrawTime = (new Date).getTime();
    DoPerformanceStats();
  } else { 
    return false;
  }
  
  // console.profileEnd();
  document.body.style.cursor='auto';
  return true;  
}

function QueryServer( querytype )
{
    // Clear all selection targets.
    $("input").blur();
    
    //logclear();
    var request = "";
    //var myurl = "http://minerva05.fnal.gov:8080/tagg/Arachne/server/serve_event.cgi"; // Note relative url.

    var myurl = "server/serve_event.cgi"; // Note relative url.

    // Used for next/prev increment buttons.
    if(querytype == 'last_query_type') querytype = gLastQueryType;
    console.log("QueryServer("+querytype+")");
    
    if(querytype === "rsg") {
      var filetype=$("#ctl-rsg-file-type input:radio:checked").val();
      if(filetype == 'reco') myurl = "server/serve_event_fromreco.cgi"; // Note relative url.

      var det    = $('#inRsgDet').val();
      var ver    = $('#inRsgRecoVer').val();
      var run    = Math.round($('#inRsgRun').val());
      var subrun = Math.round($('#inRsgSubrun').val());
      var gate   = Math.round($('#inRsgGate').val());
      request = "det="+det+"&ver="+ver+"&run="+run+"&subrun="+subrun+"&gate="+gate;
    } else if(querytype === "rsg_file") {
      myurl = "server/serve_event_fromreco.cgi"; // Note relative url.

      var file = encodeURIComponent($('#inFilenameReco').val());
      var run    = Math.round($('#inFileRsgRun').val());
      var subrun = Math.round($('#inFileRsgSubrun').val());
      var gate   = Math.round($('#inFileRsgGate').val());
      request = "filename="+file+"&run="+run+"&subrun="+subrun+"&gate="+gate;

    } else if(querytype === "fe_reco") {
      myurl = "server/serve_event_fromreco.cgi"; // Note relative url.
      var file = encodeURIComponent($('#inFilenameReco').val());
      var entry = $('#inFeEntryReco').val();
      var selection = encodeURIComponent($('#inFeSelection').val());
      request = "filename="+file+"&selection="+selection+"&entry="+entry;
    } else if(querytype === "fe_dst") {
      var file = encodeURIComponent($('#inFilenameDST').val());
      var entry = $('#inFeEntryDST').val();
      var selection = encodeURIComponent($('#inFeSelection').val());
      request = "filename="+file+"&selection="+selection+"&entry="+entry;
    } else if(querytype === "xmlurl") {
      myurl = $('#inXmlUrl').val();
    } else if(querytype === "livedata") {
      myurl = 'server/serve_live.cgi';
      if(gLatestCache) {
        request="latest_cache="+gLatestCache+'&recent_cache='+gRecentCache;
      }
    } else {
      $('#status').attr('class', 'status-error');
      $("#status").text("Unknown request type "+ querytype);
      return;      
    }
    
    
    $('#status').attr('class', 'status-transition');
    $("#status").text("Querying server for event data...");
    $("#status").text("This is a test message");
    console.log("requesting "+myurl+request);
    $("#debuglinks").html(
      "Link to xml data: <a href=\""+myurl+"?"+request+"\">"+myurl+"?"+request+"</a>"
    );

    gLastQueryType = querytype;

    gServerRequestTime = (new Date).getTime();

    // Modify the cursor to show we're fetching.
    document.body.style.cursor='wait';

    // JQuery call for compatibility.
    $.ajax({
            type: "GET",
            url: myurl,
            data: request,
            contentType: "application/json; charset=utf-8",            
            dataType: "json",
            async: true,
            dataFilter: QueryFilter,
            error:    QueryError,
            success:  QuerySuccess
            });
    // QueryRecievedData is called via callback when this is done.
    
    // Issue a google analytics request
    if(typeof _gat !== 'undefined'){
      var pageTracker = _gat._getTracker("UA-32019205-1");
      pageTracker._trackPageview("/Arachne"+myurl+"?"+request);
    }

    // User feedback that we are querying
    if(gBlockWhenQuerying){
      // var msg = '<p><img src="images/busy.gif" /> &nbsp;&nbsp;Querying server for event data...</p>'+gMOTD;
      $.blockUI({ 
                theme:     true, 
                title:    'Please wait', 
                message:   $('#MOTD')
                // ,timeout:   2000 
            });
    }
    
    // Modify the "URL to an XML file" link with the actual query.
    console.log(myurl+"?"+request);
    $('#inXmlUrl').val(myurl+"?"+request);
    return false;
}

// Function for auto-refresh
gRefreshTimeout = null;
function refresh_live(ev) {
  // console.log("refresh_live");
  if(gRefreshTimeout) clearTimeout(gRefreshTimeout);
  // console.log('refresh',$('#ctl-refresh-auto'),$('#ctl-refresh-auto').is(":checked"));
  if($('#ctl-refresh-auto').is(":checked")) {
    QueryServer('livedata');
    // restart timer.
    var delay = parseFloat($('#ctl-refresh-period').val())*1000;
    gRefreshTimeout = setTimeout(refresh_live,delay);
    // console.log('Starting refresh timer',gRefreshTimeout,delay);
  }
}

function stop_auto_refresh()
{
  // Highlight to user that we have flipped the switch off.
  $('#ctl-refresh-auto').parents("div:first").effect("highlight", {}, 5000);
  
  $('#ctl-refresh-auto').attr('checked', false);
}

// Function for slice-sycling
gSliceCycleTimeout = null;
function advance_slice()
{
  // console.log("advance_slice()");
  if(gSliceCycleTimeout) clearTimeout(gSliceCycleTimeout);
  if($('#ctl-slices-auto').is(":checked")) {
    DoSliceNext(true);
    var delay = 2000;
    gSliceCycleTimeout = setTimeout(advance_slice,delay);
  }
}

