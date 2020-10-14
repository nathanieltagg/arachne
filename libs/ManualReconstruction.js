//
// Code for the Arachne Event Display
// Author: Nathaniel Tagg ntagg@otterbein.edu
// 
// Licence: this code is free for non-commertial use. Note other licences may apply to 3rd-party code.
// Any use of this code must include attribution to Nathaniel Tagg at Otterbein University, but otherwise 
// you're free to modify and use it as you like.
//

//
// Functions and tools for doing manual reconstruction.
//


// an individual action is a simple struct: 
// {verb: "addpath", "deletepath", or "click"
//  pathId: integer (index into current list),
//  view: integer
//  t: transverse coordinate
//  z: longitudinal coordinate


// A reco state is represnted as
// path = { 
//          id: <unique integer>
//          type: 'vertex' or 'track'
//          view: <integer>,
//          nodes: []
//          }
// A node is an object:
// { t: <value> , z: <value>, hit: <xml> }  Just transverse and longitudinal coordinates, plus the actual hit data.

function ManReco(element) {
  // Graphical element.
  this.element = element;

  // User actions to build reconstruction - history for undo/redo
  this.history = {
    actions: [],
    cur: 0
  }
  

  // Current state of manual reconstruction.
  this.ClearState();

  this.editingPath = -1;
  this.uniquePathCount = 0;
  
  
  gStateMachine.BindObj('gateChange',this,"Reset");
  gStateMachine.BindObj('sliceChange',this,"Reset");
  
}

ManReco.prototype.Reset = function()
{
  // console.debug("ManReco::Reset()");
  // User actions to build reconstruction - history for undo/redo
  this.history = {
    actions: [],
    cur: 0
  }
  // Current state of manual reconstruction.
  this.ClearState();
  
  // Hide all existing buttons
  $("div.manreco-path",this.element).hide();
  
  this.editingPath = -1;
  this.uniquePathCount = 0;

  $('div.manreco-path',this.element).hide();
  
}

ManReco.prototype.ClearState = function()
{
  this.state = {
    npaths: 0,
    paths: [],
    nvertices: 0,
    vertices: 0
  };
}



ManReco.prototype.Undo = function()
{
  if(this.history.cur<=0) return false; // nothing to undo.
  
  // Decrement history pointer
  this.history.cur--;

  // Hide all existing buttons
  $("div.manreco-path",this.element).hide();
  // Fixme: will look more elegant to just hide newly-created buttons and reveal newly-deleted buttons, but that's too much work.

  // Rebuild state from scratch.
  this.ClearState();  // Rebuild the initial state.  
  
  for(var i=0; i<this.history.cur; i++) {
    this.ApplyAction(this.history.actions[i],false);
  }
  
  // Update displays  
  gStateMachine.Trigger('phColorChange');  // Really should use more specific trigger here, but it would require bigger changes.
}

ManReco.prototype.Redo = function()
{
  if(this.history.actions.length <= this.history.actions.cur) return false; // nothing to redo.
  
  // Modify current state.
  this.ApplyAction(this.history.actions[this.history.cur],true)

  // Increment history pointer
  this.history.cur++;
  gStateMachine.Trigger('phColorChange');  // Really should use more specific trigger here, but it would require bigger changes.
}

ManReco.prototype.Click = function(view,t,z,hit)
{
  if(this.editingPath<0) return false;
  this.DoAction({
                    verb: "click",
                    pathId: this.editingPath,
                    view: view,
                    t: t,
                    z: z,
                    hit: hit
                });
}

ManReco.prototype.NewTrack = function()
{
  this.StopEditing();  // Stop editing.
  var pathId = this.uniquePathCount++;
  console.log("ManReco::NewPath id = ",pathId);
  this.DoAction({verb: "newtrack", pathId: pathId});
  this.StartEditing(pathId);
}

ManReco.prototype.NewVertex = function()
{
  this.StopEditing();  // Stop editing.
  var pathId = this.uniquePathCount++;
  console.log("ManReco::NewPath id = ",pathId);
  this.DoAction({verb: "newvertex", pathId: pathId});
  this.StartEditing(pathId);
}

ManReco.prototype.DeletePath = function(which)
{
  this.StopEditing(); // Stop editing
  this.DoAction({verb: "delete", pathId: which});
}

ManReco.prototype.ToggleEditing = function(pathId)
{
  if(this.editingPath==pathId) this.StopEditing();
  else this.StartEditing(pathId);
}

ManReco.prototype.StartEditing = function(pathId)
{
  Glow.Stop($('.manreco-path .glowbutton'));

  var p = this.GetPathById(pathId);
  if(p) {
    this.editingPath = pathId;
    if(p) p.isBeingEdited = true;
    var button = $('#manreco-path-'+pathId+' .glowbutton');
    Glow.Start(button);  
  } else 
  console.log('no such pathId to edit!');
}

ManReco.prototype.StopEditing = function()
{
  if(this.editingPath>=0) {
    var p = this.GetPathById(this.editingPath);
    if(p) p.isBeingEdited = false;
  }
  
  this.editingPath = -1;
  Glow.Stop($('.manreco-path .glowbutton'));
}

ManReco.prototype.DoAction = function(action)
{
  // Kill any future history items - redo is now defunct.
  this.history.actions.splice(this.history.cur); // Deletes everything after and including cur

  // Add the action to the history.
  this.history.actions.push(action);
  this.history.cur++;
  
  // Apply action to current state, animate displays.
  this.ApplyAction(action,true);
}

ManReco.prototype.FindPathIndexById = function(id)
{
  var i;
  for(i=0;i<this.state.paths.length;i++) {
    if(this.state.paths[i].pathId == id) return i;
  }
  return -1;
}

ManReco.prototype.GetPathById = function(id)
{
  var i;
  for(i=0;i<this.state.paths.length;i++) {
    if(this.state.paths[i].pathId == id) return this.state.paths[i];
  }
  return null;
}

ManReco.prototype.ApplyAction = function(action,animate)
{
  // Apply the action to the current state of paths.
  // If animate=true, update the buttons with pretty presentation, and trigger view redraws.
  // If animate=false, update the buttons without animation, and don't trigger view redraws (for doing a rebuild of the state)
  console.log("ManReco::ApplyAction",action.verb,action.pathId);

  if(action.verb == "newtrack" ) { // Add a new empty path.
    this.state.paths.push({pathId: action.pathId, type: 'track', view: 'Not Set', nodes: []});
    this.state.npaths++;
    
    // Add new path button, if it doesn't exist.
    this.ShowPathButton(action.pathId,animate);
    
    return true;
  } 
  else if(action.verb == "newvertex" ) { // Add a new empty path.
    this.state.paths.push({pathId: action.pathId, type: 'vertex', nodes: []});
    this.state.npaths++;
    
    // Add new path button, if it doesn't exist.
    this.ShowPathButton(action.pathId,animate);
    
    return true;
  } 
  
   else if(action.verb == "delete" ) { // Remove this path from the list.
    var index = this.FindPathIndexById(action.pathId);
    if(index>=0) {
      this.state.npaths--;
      this.state.paths.splice(index,1);

      this.HidePathButton(action.pathId,animate);
      if(animate)
        gStateMachine.Trigger('phColorChange');  // Really should use more specific trigger here, but it would require bigger changes.

      return true;      
    } else return false;
  } 
  else if(action.verb == "click") {
    var p = this.GetPathById(action.pathId); // Get a handle to the path we're modifying.

    if(p === null) {
      console.log("ManReco::ApplyAction. Acted on non-extant path.");
      return false;
    }
    
    // Do tracklike things
    if(p.type == 'track') {
      // If the view changed, delete node list and start over.
      if('view' in p) {
        if(action.view != p.view) {
          p.nodes=[];
          p.view = action.view;
        }
      } else {
        p.nodes=[];
        p.view = action.view;      
      }

      // If a node exists with same z, delete existing node.
      for(var i=0;i<p.nodes.length;i++) {
        if(p.nodes[i].z == action.z) { p.nodes.splice(i,1);}
      }
    }
    
    if(p.type == 'vertex') {
      for(var i=0;i<p.nodes.length;i++) {
        // If a node exists with view, delete existing node.
        if(p.nodes[i].view == action.view) { p.nodes.splice(i,1);}
      }
    }

    // Add the t/z node.
    p.nodes.push({t: action.t, z: action.z, view:action.view, hit: action.hit});

    
    // Sort the nodes by z for ease when drawing.
    function sortfunction(a, b){ return (a.z-b.z); }
    p.nodes.sort(sortfunction);
    
    this.UpdatePathButton(action.pathId,animate);
    
    if(animate) {
      gStateMachine.Trigger('phColorChange');  // Really should use more specific trigger here, but it would require bigger changes.
    }
    return true;
  } 
  
  return false;
}




ManReco.prototype.ShowPathButton = function(pathId,animate)
{ 
  // Does the button already exist? If so, find it. If not, create it.
  var buttondiv = $('#manreco-path-'+pathId);
  if(buttondiv.size()==0) {
    buttondiv = $('<div></div>')
    .attr('id','manreco-path-'+pathId)
    .addClass('manreco-path');
    
    var button = $('<span>Path '+pathId+' </span>')
      .attr('pathId',pathId)
      .addClass('ui-button glowbutton  manreco-path ');
      
    var delbutton = $('<a href="#">Delete</a>')
      .attr('pathId',pathId)
      .addClass('manreco-path-delete');
    buttondiv.append(button);
    buttondiv.append(delbutton)
    
    buttondiv.hide();
    $(this.element).append(buttondiv);
  }
  this.UpdatePathButton(pathId,animate);    
  if(animate) buttondiv.show("slow");
  else        buttondiv.show();
}

ManReco.prototype.HidePathButton = function(pathId,animate)
{ 
  var buttondiv = $('#manreco-path-'+pathId);
  if(buttondiv.size()==0) return;
  if(animate) {
    buttondiv.hide("slow");
  } else {
    buttondiv.hide();
  }
}

ManReco.prototype.UpdatePathButton = function(pathId,animate)
{ 
  var button = $('#manreco-path-'+pathId+' span');
  if(button.size()==0) return;
  button.text('Path '+pathId);
  var p = this.GetPathById(pathId);
  if(p === null) {
    console.log("ManReco::UpdatePathButton. Acted on non-extant path.");
    return false;
  }
  
  var Type = p.type;
  var info ='View:'+p.view+' Nodes:'+p.nodes.length;
  
  if(Type=='vertex'){
    Type = "Vertex";
    
    var have = {};
    var meanz =0;
    var n = 0;
    for(var i=0;i<p.nodes.length;i++) {
      if(p.nodes[i].view==1) have.X=1;
      if(p.nodes[i].view==2) have.U=1;
      if(p.nodes[i].view==3) have.V=1;
      meanz += p.nodes[i].z;
      n+=1;
    }
    if(n>0) meanz = meanz/n;

    var nviews =0;
    var views = "";
    if(have.X==1) { nviews++; views += "X"; };
    if(have.U==1) { nviews++; views += "U"; };
    if(have.V==1) { nviews++; views += "V"; };
    if(nviews==0) views = "none";
    
    info = "Views: " + views + " Avg Z: " + meanz.toFixed(1);
  }
  
  if(Type=='track'){
    Type = "Track";
    var view = p.view;
    if(view==1) view = "X";
    if(view==2) view = "U";
    if(view==3) view = "V";
    
    info = "View: " + p.view + " Nodes: " + p.nodes.length;
  } 
  
  button.text(Type+' #'+pathId+"  ("+info+")");
}


ManReco.prototype.GetTracks = function(view,editingOnly)
{
  // Get a subset of the current tracks. 
  // view argument -  so hitmaps can request only matches
  // editingOnly argument - returns only the currently-edited path if true
  var result = [];
  for(var i=0;i<this.state.paths.length;i++) {
    var p = this.state.paths[i];
    if(p.type != 'track') continue;
    if(p.view == view) {
      if(editingOnly == true && p.pathId != this.editingPath) continue;
      result.push(p);
    }
  } 
  return result;
}

ManReco.prototype.GetVertices = function(editingOnly)
{
  // Get a subset of the current vertices. 
  // view argument -  so hitmaps can request only matches
  // editingOnly argument - returns only the currently-edited path if true
  var result = [];
  for(var i=0;i<this.state.paths.length;i++) {
    var p = this.state.paths[i];
    if(p.type != 'vertex') continue;
    if(editingOnly == true && p.pathId != this.editingPath) continue;
    result.push(p);
  } 
  return result;  
}


ManReco.prototype.GetXml = function()
{
  if(this.state.paths.length<=0) {
    return "";
  }
  var serial = new XMLSerializer();  // Mozilla and IE only?
  var result = '<ManualReconstruction>';
  for(var ipath=0;ipath<this.state.paths.length;ipath++) {
    var p = this.state.paths[ipath];
    if(p.nodes.length>0) {
      result += '<path index="'+ipath+'">';
      result += '<type>'+p.type+'</type>';
      if('view' in p) {result += '<view>'+p.view+'</view>';}
      for(var inode=0;inode<p.nodes.length;inode++) {
        result += serial.serializeToString(p.nodes[inode].hit);
      }
      result += '</path>';
    }
  }
    
  result += '</ManualReconstruction>';
  return result;
}



$(function(){
  // Initial setup.
  gManReco = new ManReco($(".manreco-paths").get(0));
  
  $(".manreco-add-track").click(function(){
    console.log('click add track');
    gManReco.NewTrack()
  });
  $(".manreco-add-vertex").click(function(){
     console.log('click add vertex');
     gManReco.NewVertex()
   });

  $(".manreco-undo").click(function(){
    console.log('click undo');
    gManReco.Undo()
  });

  $(".manreco-redo").click(function(){
    console.log('click redo');
    gManReco.Redo()
  });

  $(".manreco-showxml").click(function(){
    var str = gManReco.GetXml();
    
    newWin= window.open('');
    newWin.document.open();
    newWin.document.write( "<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.0 Transitional//EN\" \"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd\">" );
    newWin.document.write('<html><body><head></head>');
    newWin.document.write('<pre></pre></body></html>');
    newWin.document.close();
    $("pre",newWin.document).text(formatXml(str));
    $(body)
  }); 
  
  
  // Click handler for each path
  $('.manreco-path .glowbutton').live('click',function() {
    console.log("clicked ",this);
    var pathId = $(this).attr('pathId');
    gManReco.ToggleEditing(pathId)
  });

  // Click handler for each delete
  $('.manreco-path .manreco-path-delete').live('click',function() {
    console.log("clicked ",this);
    var pathId = $(this).attr('pathId');
    gManReco.DeletePath(pathId);
    return false;
  });

});

function formatXml(xml) {
    var formatted = '';
    var reg = /(>)(<)(\/*)/g;
    xml = xml.replace(reg, '$1\r\n$2$3');
    var pad = 0;
    jQuery.each(xml.split('\r\n'), function(index, node) {
        var indent = 0;
        if (node.match( /.+<\/\w[^>]*>$/ )) {
            indent = 0;
        } else if (node.match( /^<\/\w/ )) {
            if (pad != 0) {
                pad -= 1;
            }
        } else if (node.match( /^<\w[^>]*[^\/]>.*$/ )) {
            indent = 1;
        } else {
            indent = 0;
        }

        var padding = '';
        for (var i = 0; i < pad; i++) {
            padding += '  ';
        }

        formatted += padding + node + '\r\n';
        pad += indent;
    });

    return formatted;
}


