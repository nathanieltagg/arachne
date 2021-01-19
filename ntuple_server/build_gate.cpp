//
// Code for the Arachne Event Display
// Author: Nathaniel Tagg ntagg@otterbein.edu
// 
// Licence: this code is free for non-commertial use. Note other licences may apply to 3rd-party code.
// Any use of this code must include attribution to Nathaniel Tagg at Otterbein University, but otherwise 
// you're free to modify and use it as you like.
//

#include <TTree.h>
#include <TLeaf.h>
#include <TFile.h>
#include <TROOT.h>
#include <iostream>
#include <fstream>
#include <sstream>
#include <vector>
#include <time.h>
#include <math.h>
#include <stdio.h>

#include "XmlElement.h"
#include "TreeReader.h"

using namespace std;

// utility
std::string stringify_vector(const vector<int>& v)
{
  UInt_t n = v.size();
  std::string o;
  char b[10];
  for(UInt_t i=0;i<n;++i){
    if(i>0) o+=",";
    snprintf(b,10,"%d",v[i]);    
    o+=b;
  }
  return o;
}

static const char* const kVersion ="ArachneJson v1";

void build_gate( JsonObject& result,
                TTree*      inTree,
                Long64_t    inEntry,
                Int_t majorVer,
                Int_t revVer,
                Int_t patchVer,
                Int_t devVer)
{
  // A useful version ID
  UInt_t recoVer = majorVer*1000000 + revVer*1000 + patchVer*10 + devVer;
  // v8r1 is   8001000
  // v10r4 is 10004000 
  
  
  // Start building the output.
  result.add("version", kVersion);
  result.add("converter","build_xml.cpp $Revision: 1399 $ $Date: 2015-04-15 09:04:45 -0500 (Wed, 15 Apr 2015) $ ");
  
  // inTree->SetBranchStatus("*",1);


  TreeReader reader(inTree);
  TObjArray* leafList = inTree->GetListOfLeaves();


  
  //
  // OK, now build the XML entry.
  //
  
  // Header data.
  JsonObject ev;

  for(int i=0;i<leafList->GetEntriesFast();i++) {
    const char* n = leafList->At(i)->GetName();
    if(string(n).compare(0,3,"ev_",3)==0) {
      ev.add(n+3, reader.getJson(n));
    }
  }
  
  // convert times.
  struct tm tm_local;
  time_t tt= reader.getInt("ev_gps_time_sec");
  localtime_r(&tt,&tm_local);
  ev.add("local_gmt_offset",tm_local.tm_gmtoff);
  ev.add("local_timezone",tm_local.tm_zone);



  // Add preferred slice, if it exists.
  bool weirdoRobFineFile = false;

  TLeaf* lpreferredslice     = inTree->GetLeaf("preferredSlice");
  if(lpreferredslice) {
    std::cout << "Preferred Slice exists, so this is a wierdoRobFineFile" << std::endl;
    weirdoRobFineFile = true;
    Int_t preferredSlice = reader.getInt("preferredSlice");
    ev.add("preferredSlice",preferredSlice);
  }

  result.add("ev",ev);


  ///
  /// Clusters
  ///
  
  // Build cluster lookup table.
  std::map<int, vector<int> > mapClusterToHits;
  std::map<int, vector<int> > mapHitToClusters;
  std::map<int, vector<int> > mapHitToTracks;
  std::map<int, vector<int> > mapHitToBlobs;
  
  std::string clus_prefix = "clus_id_";
  Int_t n_clusters = reader.getInt("n_clusters_id");
  if(recoVer < 8001000) {
    clus_prefix = "clus_";
    n_clusters = reader.getInt("n_clusters");
  }
  TLeaf* l_clus_strip     = inTree->GetLeaf((clus_prefix+"strip"     ).c_str());
  TLeaf* l_clus_module    = inTree->GetLeaf((clus_prefix+"module"    ).c_str());
  TLeaf* l_clus_plane     = inTree->GetLeaf((clus_prefix+"plane"     ).c_str());
  TLeaf* l_clus_coord     = inTree->GetLeaf((clus_prefix+"coord"     ).c_str());
  TLeaf* l_clus_coordErr  = inTree->GetLeaf((clus_prefix+"coordErr"  ).c_str());
  TLeaf* l_clus_width     = inTree->GetLeaf((clus_prefix+"width"     ).c_str());
  TLeaf* l_clus_z         = inTree->GetLeaf("clus_z"                );
  TLeaf* l_clus_view      = inTree->GetLeaf((clus_prefix+"view"      ).c_str());
  TLeaf* l_clus_pe        = inTree->GetLeaf((clus_prefix+"pe"        ).c_str());
  TLeaf* l_clus_energy    = inTree->GetLeaf((clus_prefix+"energy"    ).c_str());
  TLeaf* l_clus_time      = inTree->GetLeaf((clus_prefix+"time"      ).c_str());
  TLeaf* l_clus_time_slice= inTree->GetLeaf((clus_prefix+"time_slice").c_str());
  TLeaf* l_clus_size      = inTree->GetLeaf((clus_prefix+"size"      ).c_str());
  TLeaf* l_clus_type      = inTree->GetLeaf((clus_prefix+"type"      ).c_str());
  TLeaf* l_clus_flag      = inTree->GetLeaf((clus_prefix+"flag"      ).c_str());
  TLeaf* l_clus_usedFor   = inTree->GetLeaf((clus_prefix+"usedFor"   ).c_str());
  TLeaf* l_clus_lpos      = inTree->GetLeaf((clus_prefix+"lpos"      ).c_str());

  JsonArray clusters;
  for(int i=0;i<n_clusters;i++) {
    JsonObject clus;
    Int_t index = reader.getInt(clus_prefix+"index",i);
    clus.add("index",  index);
    clus.add("strip"     , reader.getInt(l_clus_strip      , i) );
    clus.add("module"    , reader.getInt(l_clus_module     , i) );
    clus.add("plane"     , reader.getInt(l_clus_plane      , i) );
    clus.add("coord"     , reader.getVal(l_clus_coord      , i) );
    clus.add("coorderr"  , reader.getVal(l_clus_coordErr   , i) );
    clus.add("width"     , reader.getVal(l_clus_width      , i) );
    clus.add("z"         , reader.getVal(l_clus_z          , i) );
    clus.add("view"      , reader.getInt(l_clus_view       , i) );
    clus.add("pe"        , reader.getVal(l_clus_pe         , i) );
    clus.add("energy"    , reader.getVal(l_clus_energy     , i) );
    clus.add("time"      , reader.getVal(l_clus_time       , i) );
    clus.add("slice"     , reader.getInt(l_clus_time_slice , i) );
    clus.add("size"      , reader.getInt(l_clus_size       , i) );
    clus.add("type"      , reader.getInt(l_clus_type       , i) );
    clus.add("flag"      , reader.getInt(l_clus_flag       , i) );
    clus.add("usedFor"   , reader.getInt(l_clus_usedFor    , i) );
    clus.add("lpos"      , reader.getInt(l_clus_lpos       , i) );

    JsonArray hits_idx;
    Int_t clus_size = reader.getInt(clus_prefix+"size",i);
    for(int j=0;j<clus_size;j++) {
      Int_t hit_id;
      if(weirdoRobFineFile) 
        hit_id = reader.getInt(clus_prefix+"hits_idx",60*i+j);
      else 
        hit_id = reader.getInt(clus_prefix+"hits_idx",i,j);
      hits_idx.add(hit_id);
      mapHitToClusters[hit_id].push_back(index);
      mapClusterToHits[index].push_back(hit_id);
    }
    //clus << hits_idx;
    clus.add("hits_idx",hits_idx);
  
    clusters.add(clus);
  }    
  result.add("clusters",clusters);
  
  ///
  /// Tracks
  ///
  Int_t n_tracks = reader.getInt("n_tracks");
  if(n_tracks<0) n_tracks = 0;
  std::vector<JsonObject> tracks(n_tracks);
  
  for(int i=0;i<n_tracks;i++) {
    JsonObject& trk = tracks[i];
    trk.add("index",      reader.getJson("trk_index",i));
    trk.add("slice",      reader.getJson("trk_time_slice"  , i ) );
    trk.add("patrec",     reader.getJson("trk_patrec"      , i ) );
    trk.add("vis_energy", reader.getJson("trk_vis_energy"  , i ) );
    trk.add("theta",      reader.getJson("trk_theta"      , i ) );

    Double_t phi = reader.getVal("trk_phi",i);
    if(recoVer < 8001000 )  phi = M_PI/2. - phi;
    trk.add("phi",phi);
    trk.add("hits",        reader.getJson("trk_hits"      , i ) );
    trk.add("dof",         reader.getJson("trk_dof"       , i ) );
    trk.add("chi2perDof",  reader.getJson("trk_chi2perDof", i ) );
    trk.add("flag",        reader.getJson("trk_flag"      , i ) );
    trk.add("usedFor",     reader.getJson("trk_usedFor"      , i ) );

    //
    // Nodes.
    //
    JsonArray nodes;
    Int_t n_nodes = reader.getInt("trk_nodes",i);
    int weirdo_offset = (weirdoRobFineFile)?300:1;
    for(int j=0;j<n_nodes;j++) {
      JsonObject node;
      node.add("index",j);
      Int_t clus_idx;
      if(weirdoRobFineFile) {
        node.add("x"             , reader.getJson("trk_node_X"           , 300*i+j ));
        node.add("y"             , reader.getJson("trk_node_Y"           , 300*i+j ));
        node.add("z"             , reader.getJson("trk_node_Z"           , 300*i+j ));
        node.add("ax"            , reader.getJson("trk_node_aX"          , 300*i+j ));
        node.add("ay"            , reader.getJson("trk_node_aX"          , 300*i+j ));
        node.add("qp"            , reader.getJson("trk_node_qOverP"      , 300*i+j ));
        node.add("chi2"          , reader.getJson("trk_node_chi2"        , 300*i+j ));
   
        clus_idx =  reader.getInt("trk_node_cluster_idx" , 300*i+j );

      }else{
        node.add("x"             , reader.getJson("trk_node_X"           , weirdo_offset*i , j ));
        node.add("y"             , reader.getJson("trk_node_Y"           , weirdo_offset*i , j ));
        node.add("z"             , reader.getJson("trk_node_Z"           , weirdo_offset*i , j ));
        node.add("ax"            , reader.getJson("trk_node_aX"          , weirdo_offset*i , j ));
        node.add("ay"            , reader.getJson("trk_node_aX"          , weirdo_offset*i , j ));
        node.add("qp"            , reader.getJson("trk_node_qOverP"      , weirdo_offset*i , j ));
        node.add("chi2"          , reader.getJson("trk_node_chi2"        , weirdo_offset*i , j ));

        clus_idx =  reader.getInt("trk_node_cluster_idx" , weirdo_offset*i , j );

      }
      node.add("cluster_index",clus_idx);
      nodes.add(node);
      
      vector<int>& clus = mapClusterToHits[clus_idx];
      for(UInt_t ihit=0;ihit<clus.size();ihit++) {
        mapHitToTracks[clus[ihit]].push_back(i);
      }
    }
    trk.add("nodes",nodes);
  }



  int n_matched_tracks = reader.getInt("n_prongs_MinosMatch");

  //if MINERVA_VER >= 700700000   // For earlier versions, this SHOULD fail gracefully.
  // Do explicit track matching. Loop through prongs to see where the match is.
  if(inTree->GetLeaf("n_prongs_MinosMatch")) {
    Int_t n_prongs_MinosMatch = reader.getInt("n_prongs_MinosMatch");
  
    for(int iprong = 0 ; iprong < n_prongs_MinosMatch; iprong++){
      // For each prong:
      Int_t n_trks = reader.getInt("prong_MinosMatch.n_trks",iprong);
      for(int iprongtrk = 0; iprongtrk < n_trks; iprongtrk++) {
        // For each minerva track listed in this prong
        int idx = reader.getInt("prong_MinosMatch.trk_idx",iprong,iprongtrk);
        if(idx>=0) {
          // OK, there's a match on the minerva side
          Int_t n_minos_trks = reader.getInt("prong_MinosMatch.n_minos_trks",iprong);
          for(int iminostrk=0 ;iminostrk <  n_minos_trks; iminostrk++) {
            // Add this index to the minerva track object.
            tracks[idx].add("minos_track_idx",reader.getJson("prong_MinosMatch.minos_trk_idx",iprong, iminostrk));
          }
        }
      }
    }
  } //endif
  
  // Do explcit track matching using >v9 ntuples.
  if(inTree->GetLeaf("minos_trk_minervatrk_idx")) {
    n_matched_tracks = 0;
    Int_t n_minos_trk = reader.getInt("n_minos_trk");
    for(int j=0;j<n_minos_trk;j++) {
      int minostrack = j;
      int minertrack = reader.getInt("minos_trk_minervatrk_idx",j);
      if(minertrack>=0 && minertrack< tracks.size()) {
        tracks[minertrack].add("minos_track_idx", j); 
        n_matched_tracks++;
      }
    }
  } 
  
  
  

  JsonArray jtracks;
  result.add("n_minosMatch",n_matched_tracks);
  for(unsigned int i=0;i<tracks.size();i++) {jtracks.add(tracks[i]);};
  result.add("tracks",jtracks);
  
  
  ///
  /// ID Blobs
  ///
  JsonArray id_blobs;
  Int_t n_blobs_id = reader.getInt("n_blobs_id");
  for(int i=0;i<n_blobs_id;i++) {
    JsonObject blob;
    blob.add("index",i);
    blob.add("subdet",       reader.getJson("blob_id_subdet",    i));
    blob.add("history",      reader.getJson("blob_id_history",   i));
    blob.add("patrec",       reader.getJson("blob_id_patrec",    i));
    blob.add("size",         reader.getJson("blob_id_size",      i));
    blob.add("visible_e",    reader.getJson("blob_id_visible_e", i));
    blob.add("e",            reader.getJson("blob_id_e",         i));
    blob.add("time",         reader.getJson("blob_id_time",      i));
    blob.add("slice",        reader.getJson("blob_id_time_slice",i));
    blob.add("startpoint_x", reader.getJson("blob_id_startpoint_x",i));
    blob.add("startpoint_y", reader.getJson("blob_id_startpoint_y",i));
    blob.add("startpoint_z", reader.getJson("blob_id_startpoint_z",i));


    // clusters.
    JsonArray jclus_idx;
    JsonArray jhits_idx;
    TLeaf* lclusidx = inTree->GetLeaf("blob_id_clus_idx");
    int bnhits = 0;
    if(lclusidx) {
      Int_t n = lclusidx->GetLenStatic();
      for(int j=0;j<n;++j) {
        Int_t clus_idx;
        if(weirdoRobFineFile)
           clus_idx = reader.getInt(lclusidx,1500*i+j);
        else
          clus_idx = reader.getInt(lclusidx,i,j);

        if(clus_idx==-1) break;
        jclus_idx.add(clus_idx);
        
        // Reverse lookup table.
        vector<int>& clus = mapClusterToHits[clus_idx];
        for(UInt_t ihit=0;ihit<clus.size();ihit++) {
          mapHitToBlobs[clus[ihit]].push_back(i);
        }
        
        
        // Add hits of that cluster.
        Int_t clus_size = reader.getInt("clus_id_size",clus_idx);
        for(int k=0;k<clus_size;k++) {
          jhits_idx.add(reader.getInt("clus_id_hits_idx",clus_idx,k));
        }
        
      }
    }
    blob.add("clus_idx",jclus_idx);
    blob.add("hits_idx",jhits_idx);
    id_blobs.add(blob);
  } 
  result.add("id_blobs",id_blobs);
  
  
  
  ///
  /// Vertices
  ///
  JsonArray vertices;
  Int_t n_vertices = reader.getInt("n_vertices");
  for(int j=0;j<n_vertices;j++) {
    JsonObject vtx;
    vtx.add("id",reader.getInt("vtx_index",j));
    vtx.add("slice",reader.getJson("vtx_time_slice"  , j ));
    vtx.add("x",    reader.getJson("vtx_x"           , j ));
    vtx.add("y",    reader.getJson("vtx_y"           , j ));
    vtx.add("z",    reader.getJson("vtx_z"           , j ));
    vtx.add("xerr", reader.getJson("vtx_x_err"       , j ));
    vtx.add("yerr", reader.getJson("vtx_y_err"       , j ));
    vtx.add("zerr", reader.getJson("vtx_z_err"       , j ));
    vtx.add("type", reader.getJson("vtx_type"        , j ));
    vtx.add("flag", reader.getJson("vtx_flag"        , j ));
    Int_t n_trks_on_vertex = reader.getInt("vtx_n_tracks",j);
    JsonArray vtx_tracks_idx;
    for(int k=0;k<n_trks_on_vertex;k++)
      vtx_tracks_idx.add(reader.getJson("vtx_tracks_idx",j,k));
    vtx.add("track_idx",vtx_tracks_idx);
    vertices.add(vtx);
  }
  result.add("vertices",vertices);
  
  
  
  ///
  /// Raw Hits
  ///
  // Maybe this goes inside rawhits block?
  result.add("n_idhits"        ,reader.getJson( "n_idhits"  ));
  result.add("n_odhits"        ,reader.getJson( "n_odhits"  ));
  result.add("n_vetohits"      ,reader.getJson( "n_vetohits"  ));
  result.add("n_slices"        ,reader.getJson( "n_slices"  ));
  result.add("hits_id_per_mod" ,reader.getJson( "hits_id_per_mod" ));
  result.add("hits_od_per_mod" ,reader.getJson( "hits_od_per_mod" ));
  result.add("hits_total_pe"   ,reader.getJson( "hits_total_pe"   ));


  JsonObject rawhits;
  rawhits.add("n",       reader.getInt("n_rawhits"));
  rawhits.add("n_idhits",reader.getInt("n_idhits"));
  rawhits.add("n_odhits",reader.getInt("n_odhits"));
  rawhits.add("n_slices",reader.getInt("n_slices"));

  JsonArray idhits;
  JsonArray odhits;
  JsonArray vetohits;
  JsonArray misc_hits;

  Int_t n_slices = reader.getInt("n_slices");
  if(n_slices<0) n_slices = 0; // Protect against missing leaf.

  std::vector<double> slice_t_start(n_slices+1,1e9);
  std::vector<double> slice_t_end  (n_slices+1,-1e9);
  // std::vector<XmlElement> slices(n_slices+1,XmlElement("aslice"));
  // std::vector<XmlElement> slices_idhits(n_slices+1,XmlElement("idhits"));
  // std::vector<XmlElement> slices_odhits(n_slices+1,XmlElement("odhits"));
  // std::vector<XmlElement> slices_vetohits(n_slices+1,XmlElement("vetohits"));

  // This is one of the most intensive bits, so let's actually do some caching.
  TLeaf* l_hit_channel_id  = inTree->GetLeaf("hit_channel_id");
  TLeaf* l_hit_disc_fired  = inTree->GetLeaf("hit_disc_fired");
  TLeaf* l_hit_pe          = inTree->GetLeaf("hit_pe"         );
  TLeaf* l_hit_qlo         = inTree->GetLeaf("hit_qlo"        );
  TLeaf* l_hit_qhigh       = inTree->GetLeaf("hit_qhi"        );
  TLeaf* l_hit_qmed        = inTree->GetLeaf("hit_qmed"       );
  TLeaf* l_hit_norm_energy = inTree->GetLeaf("hit_norm_energy");
  TLeaf* l_hit_time        = inTree->GetLeaf("hit_time"       );
  TLeaf* l_hit_time_slice  = inTree->GetLeaf("hit_time_slice" );
  TLeaf* l_hit_flag        = inTree->GetLeaf("hit_flag"       );
  TLeaf* l_hit_strip       = inTree->GetLeaf("hit_strip"      );
  TLeaf* l_hit_plane       = inTree->GetLeaf("hit_plane"      );
  TLeaf* l_hit_module      = inTree->GetLeaf("hit_module"     );
  TLeaf* l_hit_view        = inTree->GetLeaf("hit_view"       );
  TLeaf* l_hit_bar         = inTree->GetLeaf("hit_bar"        );
  TLeaf* l_hit_story       = inTree->GetLeaf("hit_story"      );
  TLeaf* l_hit_tower       = inTree->GetLeaf("hit_tower"      );
  TLeaf* l_hit_frame       = inTree->GetLeaf("hit_frame"      );

  TLeaf* l_hit_wall        = inTree->GetLeaf("hit_wall"      );
  TLeaf* l_hit_paddle      = inTree->GetLeaf("hit_paddle"      );
  TLeaf* l_hit_pmt         = inTree->GetLeaf("hit_pmt"      );
  TLeaf* l_hit_user_color  = inTree->GetLeaf("hit_user_color" );
  if(!l_hit_user_color) cerr<< "Can't find hit_user_color leaf." << endl;;

  Int_t n_rawhits = reader.getInt("n_rawhits");
  for(int i=0;i<n_rawhits;i++) {
    JsonObject hit;
    hit.add("index",i);
    double t = reader.getVal(l_hit_time         ,i );           

    hit.add("channel_id"      , reader.getJson( l_hit_channel_id     ,i));
    hit.add("disc_fired"      , reader.getJson(l_hit_disc_fired   , i));
    hit.add("pe"              , reader.getVal(l_hit_pe            ,i ));
    hit.add("qlo"             , reader.getVal(l_hit_qlo            ,i ));
    hit.add("qmed"            , reader.getVal(l_hit_qmed           ,i ));
    hit.add("qhigh"           , reader.getVal(l_hit_qhigh            ,i ));
    hit.add("norm_energy"     , reader.getVal(l_hit_norm_energy   ,i ));    
    hit.add("time"            , t );

    int slice = reader.getInt(l_hit_time_slice    ,i );
    if(slice <0) slice = 0;
    hit.add("slice"           , slice) ;

    int usercolor = reader.getInt(l_hit_user_color, i);
    if(usercolor>=0) {
      hit.add("usercolor"       , Form("#%06x",(unsigned int)usercolor));
    }

    JsonArray jtrack_id;
    map<int,vector<int> >::iterator it;
    it = mapHitToTracks.find(i);
    if(it != mapHitToTracks.end()) {
      for(int mi=0;mi<it->second.size();mi++) {
        jtrack_id.add(it->second[mi]);
      }
    }
    if(jtrack_id.length()>0)  hit.add("track_id",jtrack_id);
      
    JsonArray jblob_id;
    it = mapHitToBlobs.find(i);
    if(it != mapHitToBlobs.end()) {
      for(int mi=0;mi<it->second.size();mi++) {
        jblob_id.add(it->second[mi]);
      }
    }
    if(jblob_id.length()>0)  hit.add("blob_id",jblob_id);
      
    // hit << XmlElement("track_id",stringify_vector(mapHitToTracks[i]));
    // hit << XmlElement("blob_id2",stringify_vector(mapHitToBlobs[i]));
    hit.add("cluster_id",stringify_vector(mapHitToClusters[i]));

    hit.add("flag",reader.getInt(l_hit_flag,i));
    
    bool is_idhit = (reader.getInt(l_hit_strip,i) >=0);
    bool is_odhit = (reader.getInt(l_hit_bar  ,i) >= 0);
    bool is_vetohit=(reader.getInt(l_hit_wall ,i) >= 0);
    if(is_idhit) {
      // ID hit.
      hit.add("det","ID");
      hit.add("strip"  ,reader.getInt( l_hit_strip  ,i  ));
      hit.add("plane"  ,reader.getInt( l_hit_plane  ,i  ));
      hit.add("module" ,reader.getInt( l_hit_module ,i  ));
      hit.add("view"   ,reader.getInt( l_hit_view   ,i  ));          
    } 
    else if(is_odhit) {
      // OD hit.
      hit.add("det","OD");
      // XmlElement address("ODAddress");
      hit.add("bar"   , reader.getInt(l_hit_bar   , i ));
      hit.add("story" , reader.getInt(l_hit_story , i ));
      hit.add("tower" , reader.getInt(l_hit_tower , i ));
      hit.add("frame" , reader.getInt(l_hit_frame , i ));          
	  }
	  else if(is_vetohit) {
  	  // Veto hit.
      // XmlElement address("VetoAddress");
	    hit.add("det","Veto");
      hit.add("wall"  , reader.getInt(l_hit_wall   ,i) );
		  hit.add("paddle", reader.getInt(l_hit_paddle ,i) );
      hit.add("pmt"   , reader.getInt(l_hit_pmt    ,i) );
		  //hit << address;
    } else {
 	      continue; // Ignore hits that aren't in the ID OR the OD.
    }
        
    if(is_idhit) idhits.add(hit);
    else if(is_odhit) odhits.add(hit);
    else if(is_vetohit) vetohits.add(hit);
    else misc_hits.add(hit); // Add to generic list.          

    if(slice >=0 && slice<=n_slices+1)   {
      if(t < slice_t_start[slice]) slice_t_start[slice] = t;
      if(t > slice_t_end  [slice]) slice_t_end  [slice] = t;
    }
   }

   rawhits.add("idhits",idhits);
   rawhits.add("odhits",odhits);
   rawhits.add("vetohits",vetohits);
   rawhits.add("misc_hits",misc_hits);
   result.add("hits",rawhits);

   // Slice stats and filter info.
   
   // Cleverness. Look through the list of leaves for things that match 'filt_'
   std::vector<const char*> filter_names;
   for(int i=0;i<leafList->GetEntriesFast();i++) {
     const char* n = leafList->At(i)->GetName();
     if(string(n).compare(0,5,"filt_",5)==0) {
       filter_names.push_back(n);
     }
   }
   
   JsonArray jslices;
   for(UInt_t islice=0;islice<n_slices+1;islice++) {
     JsonObject jslice;
     
     jslice.add("sliceId",islice);
     jslice.add("t_start",slice_t_start[islice]);
     jslice.add("t_end",slice_t_end[islice]);

     JsonObject filters;
     // Create an XML element <NAME></NAME> from a tree leaf named filt_NAME.
     for(UInt_t i=0; i< filter_names.size(); i++) {
       filters.add((filter_names[i])+5, reader.getJson(filter_names[i], islice));
     }
     jslice.add("filters",filters);
     
     jslices.add(jslice);
    
   }
   result.add("slices",jslices);
  
  

  ///
  /// Minos Tracks
  ///
  JsonObject minos;
  minos.add("minos_run",    reader.getJson("minos_run"));
  minos.add("minos_subrun", reader.getJson("minos_subrun"));
  minos.add("minos_snarl",  reader.getJson("minos_snarl"));
  minos.add("minos_sec",    reader.getJson("minos_sec"));
  minos.add("minos_nanosec",reader.getJson("minos_nanosec"));

  JsonArray minos_tracks;
  Int_t n_minos_trk = reader.getInt("n_minos_trk");
  for(int j=0;j<n_minos_trk;j++) {
    JsonObject trk;
    trk.add("index",reader.getInt("minos_trk_idx",j ));
    trk.add("index"     ,reader.getJson("minos_trk_idx"      , j ));
    trk.add("quality"   ,reader.getJson("minos_trk_quality"  , j ));
    trk.add("pass"      ,reader.getJson("minos_trk_pass"     , j ));
    trk.add("chi2"      ,reader.getJson("minos_trk_chi2"     , j ));
    trk.add("ndf"       ,reader.getJson("minos_trk_ndf"      , j ));
    trk.add("bave"      ,reader.getJson("minos_trk_bave"     , j ));
    trk.add("range"     ,reader.getJson("minos_trk_range"    , j ));
    trk.add("con"       ,reader.getJson("minos_trk_con"      , j ));
    trk.add("p"         ,reader.getJson("minos_trk_p"        , j ));
    trk.add("prange"    ,reader.getJson("minos_trk_prange"   , j ));
    trk.add("qp"        ,reader.getJson("minos_trk_qp"       , j ));
    trk.add("eqp"       ,reader.getJson("minos_trk_eqp"      , j ));
    trk.add("vtxp"      ,reader.getJson("minos_trk_vtxp"     , j ));
    trk.add("vtxu"      ,reader.getJson("minos_trk_vtxu"     , j ));
    trk.add("vtxv"      ,reader.getJson("minos_trk_vtxv"     , j ));
    trk.add("vtxx"      ,reader.getJson("minos_trk_vtxx"     , j ));
    trk.add("vtxy"      ,reader.getJson("minos_trk_vtxy"     , j ));
    trk.add("vtxz"      ,reader.getJson("minos_trk_vtxz"     , j ));
    trk.add("vtxt"      ,reader.getJson("minos_trk_vtxt"     , j ));
    trk.add("mvax"      ,reader.getJson("minos_trk_mvax"     , j ));
    trk.add("mvau"      ,reader.getJson("minos_trk_mvau"     , j ));
    trk.add("mvav"      ,reader.getJson("minos_trk_mvav"     , j ));
    trk.add("vtx_dxdz"  ,reader.getJson("minos_trk_vtx_dxdz" , j ));
    trk.add("vtx_dydz"  ,reader.getJson("minos_trk_vtx_dydz" , j ));
    trk.add("vtx_dudz"  ,reader.getJson("minos_trk_vtx_dudz" , j ));
    trk.add("vtx_dvdz"  ,reader.getJson("minos_trk_vtx_dvdz" , j ));
    trk.add("endp"      ,reader.getJson("minos_trk_endp"     , j ));
    trk.add("endu"      ,reader.getJson("minos_trk_endu"     , j ));
    trk.add("endv"      ,reader.getJson("minos_trk_endv"     , j ));
    trk.add("endx"      ,reader.getJson("minos_trk_endx"     , j ));
    trk.add("endy"      ,reader.getJson("minos_trk_endy"     , j ));
    trk.add("endz"      ,reader.getJson("minos_trk_endz"     , j ));
    trk.add("endt"      ,reader.getJson("minos_trk_endt"     , j ));
    trk.add("ns"        ,reader.getJson("minos_trk_ns"       , j ));
    trk.add("minerva_index",reader.getJson("minos_minerva_trk_idx" ,j ));

    // estimate the slice.
    double t = 0.5*(reader.getVal("minos_trk_vtxt", j ) + reader.getVal("minos_trk_endt" , j ));
    int slice = -1;
    for(UInt_t islice=0;islice<n_slices;islice++) {
      if((t >= slice_t_start[islice]) && ( t <= slice_t_end[islice] )) slice=islice;
    }
    trk.add("slice",slice);

    JsonArray trkstrips;
    // How deep should I look?
    TLeaf* zleaf = inTree->GetLeaf("minos_trk_stp_z");
    if(zleaf) {
      Int_t max_stps = zleaf->GetLenStatic();
      
      Double_t endz = reader.getVal("minos_trk_endz",j);
      
      int trknstrips = reader.getInt("minos_trk_ns",j);
      if(trknstrips > max_stps) trknstrips = max_stps;
      // Need to sort the strips.
      std::multimap<double,JsonObject> stpByZ;
      std::multimap<double,JsonObject>::iterator stpit;
      for(int istp=0;istp<trknstrips;istp++) {
        Double_t z = reader.getVal("minos_trk_stp_z",j,istp);
        // if(z<=0) continue;
        // if(z>=endz) continue;
        JsonObject trkstrip;
        trkstrip.add("x"    ,reader.getJson("minos_trk_stp_x",j,istp));
        trkstrip.add("y"    ,reader.getJson("minos_trk_stp_y",j,istp));
        trkstrip.add("z"    ,reader.getJson("minos_trk_stp_z",j,istp));
        trkstrip.add("t"    ,reader.getJson("minos_trk_stp_t",j,istp));
        trkstrip.add("u"    ,reader.getJson("minos_trk_stp_u",j,istp));
        trkstrip.add("v"    ,reader.getJson("minos_trk_stp_v",j,istp));
                                          
        stpByZ.insert(pair<double,JsonObject>(z,trkstrip));
      }
      for(stpit = stpByZ.begin(); stpit != stpByZ.end(); stpit++) {
          trkstrips.add(stpit->second);
      }
        
        trk.add("trk_strips",trkstrips);
      }
    
    minos_tracks.add(trk);    
  }
  minos.add("tracks",minos_tracks);
  
  ///
  /// Minos Strips
  ///
  JsonArray minos_strips;
  Int_t n_minos_stp = reader.getInt("n_minos_stp");
  for(int j=0;j<n_minos_stp;j++) {
    JsonObject stp;
    stp.add("index",j);
    stp.add("plane"     ,reader.getJson("minos_stp_plane"      , j ));
    stp.add("strip"     ,reader.getJson("minos_stp_strip"      , j ));
    stp.add("view"      ,reader.getJson("minos_stp_view"       , j ));
    stp.add("tpos"      ,reader.getJson("minos_stp_tpos"       , j ));
    stp.add("time"      ,reader.getJson("minos_stp_time"       , j ));
    stp.add("ph"        ,reader.getJson("minos_stp_ph"         , j ));
    stp.add("trkidx"    ,reader.getJson("minos_stp_trkidx"     , j ));
    
    // Take an educated guess at which time slice this should be stuck into.
    double t = reader.getVal("minos_stp_time"       , j);
    int slice = -1;
    for(UInt_t islice=0;islice<n_slices;islice++) {
      if((t >= slice_t_start[islice]) && ( t <= slice_t_end[islice] )) slice=islice;
    }
    stp.add("slice",slice);
    minos_strips.add(stp);
  }
  if(n_minos_stp>0) minos.add("strips",minos_strips);
  result.add("minos",minos);
  
  ///
  /// Beam
  ///
  JsonObject beam;
  bool doBeam = false;
  for(int i=0;i<leafList->GetEntriesFast();i++) {
    const char* n = leafList->At(i)->GetName();
    if(string(n).compare(0,5,"beam_",5)==0) {
      beam.add(n+5,reader.getJson(n));
      doBeam = true;
    }
  }
  if(doBeam) result.add("beam",beam);


  ///
  /// Monte Carlo Truth Info
  ///
  // See if the basic MC truth structure is there. If so, let's append MC data to the XML.
  if(inTree->GetLeaf("n_interactions"))
  {
    JsonObject mc;
  
    mc.add("mc_run"           , reader.getJson("mc_run"));
    mc.add("mc_subrun"        , reader.getJson("mc_subrun"));
    mc.add("mc_spill"         , reader.getJson("mc_spill"));
    mc.add("mc_MIState"       , reader.getJson("mc_MIState"));
    mc.add("mc_pot"           , reader.getJson("mc_pot"));
    mc.add("mc_beamConfig"    , reader.getJson("mc_beamConfig"));


    JsonArray interactions;
    Int_t n_interactions = reader.getInt("n_interactions");
    for(int i=0;i<n_interactions;i++) {
      // Convert units for older versions of reco code.

      // v8r1 is 8001000
      double unit_conv = 1.0;
      if(recoVer < 10001010) {
        unit_conv = 1000;
      }
      
      JsonObject interaction;
      interaction.add("index",i);
      interaction.add("processType",    reader.getJson("mc_int_processType"  , i ));
      interaction.add("nevSpill",       reader.getJson("mc_int_nevSpill"     , i ));
      interaction.add("nevFile",        reader.getJson("mc_int_nevFile"      , i ));
      interaction.add("channel",        reader.getJson("mc_int_channel"      , i ));
      interaction.add("current",        reader.getJson("mc_int_current"      , i ));
      interaction.add("charm",          reader.getJson("mc_int_charm"        , i ));
      interaction.add("weight",         reader.getJson("mc_int_weight"       , i ));
      interaction.add("xSection",       reader.getJson("mc_int_xSection"     , i ));
      interaction.add("incomingPDG",    reader.getJson("mc_int_incomingPDG"  , i ));
      interaction.add("tgtNucleus",     reader.getJson("mc_int_tgtNucleus"   , i ));
      interaction.add("tgtNucleon",     reader.getJson("mc_int_tgtNucleon"   , i ));
      interaction.add("targetZ",        reader.getJson("mc_int_targetZ"      , i ));
      interaction.add("targetA",        reader.getJson("mc_int_targetA"      , i ));
      interaction.add("hitQuark",       reader.getJson("mc_int_hitQuark"     , i ));
      interaction.add("seaQuark",       reader.getJson("mc_int_seaQuark"     , i ));
      interaction.add("resID",          reader.getJson("mc_int_resID"        , i ));
      interaction.add("FSLepton",       reader.getJson("mc_int_FSLepton"     , i ));
      // Convert to MeV if required.
      double incomingE = reader.getVal("mc_int_incomingE",i);
      double QSquared  = reader.getVal("mc_int_QSquared",i);
      double W         = reader.getVal("mc_int_W",i);
      interaction.add("incomingE",incomingE*unit_conv);
      interaction.add("QSquared",QSquared*unit_conv);
      interaction.add("W",W*unit_conv);
      
      interaction.add("incomingE",      reader.getJson("mc_int_incomingE"    , i ));
      interaction.add("QSquared",       reader.getJson("mc_int_QSquared"     , i ));
      interaction.add("W",              reader.getJson("mc_int_W"            , i ));
      interaction.add("bjorkenX",       reader.getJson("mc_int_bjorkenX"     , i ));
      interaction.add("bjorkenY",       reader.getJson("mc_int_bjorkenY"     , i ));
      interaction.add("nucleonT",       reader.getJson("mc_int_nucleonT"     , i ));
      interaction.add("vtx",            reader.getJsonArray("mc_int_vtx"          , i ));
      interaction.add("incoming4p",     reader.getJsonArray("mc_int_incoming4p"   , i ));
      interaction.add("incoming4p",     reader.getJsonArray("mc_int_incoming4P"   , i ));
      interaction.add("tgtNucleon4p",   reader.getJsonArray("mc_int_tgtNucleon4p" , i ));
      interaction.add("FSLepton4p",     reader.getJsonArray("mc_int_FSLepton4p"   , i ));
      // Final state particles.
      
      JsonArray FSParticles; 
      Int_t nFS = reader.getInt("mc_int_nFSParticles",i);
      for(int j=0;j<nFS;j++) {
        JsonObject part; 
        part.add("index",j);        
        part.add("Pdg", reader.getJson("mc_int_FSPdg"          ,i,j));
        part.add("Px",  reader.getJson("mc_int_FSParticlesPx"  ,i,j));
        part.add("Py",  reader.getJson("mc_int_FSParticlesPy"  ,i,j));
        part.add("Pz",  reader.getJson("mc_int_FSParticlesPz"  ,i,j));
        part.add("E",   reader.getJson("mc_int_FSParticlesE"   ,i,j));

        FSParticles.add(part);
      } // loop over final state 
      interaction.add("FSParticles",FSParticles);
      
      interactions.add(interaction);
    }
    mc.add("interactions",interactions);
    
    
    Int_t n_mc_particles = reader.getInt("n_mc_particles");
    JsonArray particles;
    for(int i=0;i<n_mc_particles;i++) {
      JsonObject particle; 
      particle.add("index",reader.getInt("mc_part_index",i));
      particle.add("pid"     ,reader.getJson( "mc_part_pid"    ,i ));
      particle.add("type"    ,reader.getJson( "mc_part_type"   ,i ));
      particle.add("mother"  ,reader.getJson( "mc_part_mother" ,i ));
      particle.add("mpid"    ,reader.getJson( "mc_part_mpid"   ,i ));
      particle.add("x"       ,reader.getJson( "mc_part_x"      ,i ));
      particle.add("y"       ,reader.getJson( "mc_part_y"      ,i ));
      particle.add("z"       ,reader.getJson( "mc_part_z"      ,i ));
      particle.add("t"       ,reader.getJson( "mc_part_t"      ,i ));
      particle.add("px"      ,reader.getJson( "mc_part_px"     ,i ));
      particle.add("py"      ,reader.getJson( "mc_part_py"     ,i ));
      particle.add("pz"      ,reader.getJson( "mc_part_pz"     ,i ));
      particle.add("E"       ,reader.getJson( "mc_part_E"      ,i ));
      particle.add("p"       ,reader.getJson( "mc_part_p"      ,i ));
      
      particles.add(particle);
    }
    mc.add("particles",particles);

    // MC trajectory information.
    Int_t n_mc_trajectories = reader.getInt("n_mc_trajectories");
    // Earlier versions of the code badly coded this value. Leads to nasty buffer over-runs.
    if((recoVer < 10004000) && (reader.getInt("m_mc_traj_overflow") > 0)) n_mc_trajectories = 500;
    if((recoVer < 10004000) && (n_mc_trajectories > 500)) n_mc_trajectories = 500;
    JsonArray trajectories;
    for(int i=0; i< n_mc_trajectories; i++) {
      JsonObject traj;
      traj.add("strlength"  , reader.getVal("mc_traj_strlength",i));
      traj.add("curvlength" , reader.getVal("mc_traj_curvlength",i));
      traj.add("leaving"    , reader.getInt("mc_traj_leaving",i));
      traj.add("trkid"      , reader.getInt("mc_traj_trkid",i));
      traj.add("parentid"   , reader.getInt("mc_traj_parentid",i));
      traj.add("pdg"        , reader.getInt("mc_traj_pdg",i));
      traj.add("hit_e"      , reader.getVal("mc_traj_hit_e",i));
      Int_t npoints =  reader.getInt("mc_traj_npoints",i);
      traj.add("npoints"    , npoints);
      JsonArray trajpoints;
      for(int j=0;j<npoints;j++) {
        JsonObject trajpoint;
        trajpoint.add("i"    , j);
        trajpoint.add("x"    , reader.getVal("mc_traj_point_x",i,j));
        trajpoint.add("y"    , reader.getVal("mc_traj_point_y",i,j));
        trajpoint.add("z"    , reader.getVal("mc_traj_point_z",i,j));
        trajpoint.add("t"    , reader.getVal("mc_traj_point_t",i,j));
        trajpoint.add("px"   , reader.getVal("mc_traj_point_px",i,j));
        trajpoint.add("py"   , reader.getVal("mc_traj_point_py",i,j));
        trajpoint.add("pz"   , reader.getVal("mc_traj_point_pz",i,j));
        trajpoint.add("E"    , reader.getVal("mc_traj_point_E",i,j));
        trajpoints.add(trajpoint);
      }
      traj.add("trajpoint",trajpoints);
      trajectories.add(traj);
    }
    mc.add("trajectories",trajectories);

    // I don't really use this yet, so let's take it out: too big!
    /*
    XmlElement digits("digits"); 
    Int_t n_mc_id_digits = reader.getInt("n_mc_id_digits");
    Int_t n_mc_od_digits = reader.getInt("n_mc_od_digits");
    digits.addAttr("n",n_mc_id_digits + n_mc_od_digits);
    digits.addAttr("n_id",n_mc_id_digits);
    digits.addAttr("n_od",n_mc_od_digits);
    for(int i=0;i<n_mc_id_digits;i++) {
      XmlElement digit("digit");
      XmlElement add("IDAddress");
      add << reader.getXml("strip", "mc_id_strip" , i);
      add << reader.getXml("plane", "mc_id_plane" , i);
      add << reader.getXml("module","mc_id_module", i);
      add << reader.getXml("view",  "mc_id_view"  , i);
      digit<< add;

      digit << reader.getXml("pe"        ,"mc_id_pe"      , i);
      digit << reader.getXml("time"      ,"mc_id_time"    , i);
      digit << reader.getXml("npart"     ,"mc_id_npart"   , i);
      digit << reader.getXml("particle"  ,"mc_id_particle", i);
      digit << reader.getXml("pid"       ,"mc_id_pid"     , i);
      digit << reader.getXml("part_x"    ,"mc_id_part_x"  , i);
      digit << reader.getXml("part_y"    ,"mc_id_part_y"  , i);
      digit << reader.getXml("part_z"    ,"mc_id_part_z"  , i);
      digit << reader.getXml("part_t"    ,"mc_id_part_t"  , i);
      digit << reader.getXml("part_p"    ,"mc_id_part_p"  , i);
            
      digits << digit;
    }
    for(int i=0;i<n_mc_od_digits;i++) {
      XmlElement digit("digit");
      XmlElement add("ODAddress");
      add << reader.getXml("frame", "mc_od_frame" , i);
      add << reader.getXml("tower", "mc_od_tower" , i);
      add << reader.getXml("story", "mc_od_story" , i);
      add << reader.getXml("bar"  , "mc_od_bar"   , i);
      digit<< add;

      digit << reader.getXml("pe"        ,"mc_od_pe"        ,i );
      digit << reader.getXml("time"      ,"mc_od_time"      ,i );
      digit << reader.getXml("npart"     ,"mc_od_npart"     ,i );
      digit << reader.getXml("particle"  ,"mc_od_particle"  ,i );
      digit << reader.getXml("pid"       ,"mc_od_pid"       ,i );
      digit << reader.getXml("part_x"    ,"mc_od_part_x"    ,i );
      digit << reader.getXml("part_y"    ,"mc_od_part_y"    ,i );
      digit << reader.getXml("part_z"    ,"mc_od_part_z"    ,i );
      digit << reader.getXml("part_t"    ,"mc_od_part_t"    ,i );
      digit << reader.getXml("part_p"    ,"mc_od_part_p"    ,i );
            
      digits << digit;    
    }
    mc << digits;
    */
    result.add("mc",mc);
  }

  //
  // Test beam
  //
  JsonObject mtest;
  bool doMtest = false;
  for(int i=0;i<leafList->GetEntriesFast();i++) {
    const char* n = leafList->At(i)->GetName();
    if(string(n).compare(0,6,"mtest_",6)==0) {
      mtest.add(n+6,reader.getJson(n));
      doMtest = true;
    }
  }
  if(doMtest) result.add("mtest",mtest);
  

}

