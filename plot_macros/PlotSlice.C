#define analyzeDST_cxx
#include "analyzeDST.h"
#include <TH2.h>
#include <TStyle.h>
#include<limits>


// HMS 6-13-2009 add in ability to plot all slices automatically

//=========================================================================
// This macro is a standard MakeClass macro made from the v6r1 version
//  of the Minerva DST created by the DSTWriter package.
//
// To use it, you must load the macro in a ROOT session:
//      Root > .L analyzeDST.C
//
// and create an instance of the analyzeDST class with a DST file:
//      Root > analyzeDST t( filename.root )
//
// then you can call any of the available sub-routines to make plots.  
//  The available routines are (2009/03/20): 
//
// Loop over events and draw ID/OD event displays: 
//      Root > t.LoopEventDisplay( int first_event = 1, int num_events = 10, int num_modules = 24, int first_module = 74, 
//                                 bool show_clusters = false, bool print_files = false, bool pause_between = false );
//
//      Root > t.PauseEventDisplay( double pe_cut, int num_modules = 24, int first_module = 74, 
//                                  bool show_clusters = false, bool print_files = false );
//
// Draw individual event:
//      Root > t.event_display( const int event, int num_modules = 24, int first_module = 74, double pe_cut = 0, double maxPE = 35, TCanvas *cEventDisplay = NULL, bool print_files = false );
//      Root > t.raw_data( int event );
//
//
// Loop over events and draw some timing distributions:      
//      Root > t.LoopTimeCalib(int first_event = 1, int num_events = 10000000, int croc = 0, int chain1 = 0, int chain2 = 1, double tmax = 16, bool print_files = false );
//
// Loop over events and draw some cluster PE distibutions:
//      Root > t.LoopClusterPEs(char* label = "", int first_event = 1, int num_events = 10000000, int num_modules = 12, bool print_files = false );
//
//
//==========================================================================


//===========================================================================
// LoopEventDisplays
//===========================================================================

void analyzeDST::LoopEventDisplay(int first_event, int num_events, int num_modules, int first_module, bool show_clusters, bool print_files, bool pause_between, double Cx, double Cy ){

 
  cout << "################################################" << endl;
  cout << " Event Displays" << endl;
  cout << "################################################" << endl;

  set_root_env();

  if (fChain == 0) return;
  
  Long64_t nentries = fChain->GetEntriesFast();
  Long64_t nbytes = 0, nb = 0;

  int slice = -1;
  double pe_cut = 0;
 
  if( show_clusters )
    TCanvas *cEventDisplay = new TCanvas( "cEventDisplay", "cEventDisplay", Cx, Cy );
  else
    TCanvas *cEventDisplay = new TCanvas( "cEventDisplay", "cEventDisplay", Cx, Cy );


  //===============================
  //-- Loop over events in NTuple
  //===============================

  if( first_event < 1 ) return;

  for (Long64_t jentry=first_event-1; jentry<nentries && jentry<first_event+num_events-1;jentry++) {
 
    Long64_t ientry = LoadTree(jentry);
    if (ientry < 0) break;
    nb = fChain->GetEntry(jentry);   nbytes += nb;
    
    const int gatenum = ev_gate;
    cout << " an event " << gatenum << endl;


    event_display(gatenum, slice, pe_cut, 35, show_clusters, print_files, num_modules, first_module, cEventDisplay );
 

   // hms --  do all the slices not just the event
    if( ! pause_between){
      cout << gatenum << " " << slice << " " << n_slices << endl;
      slice++;
      int next = 0;
      if (slice >= n_slices){
	next = gatenum+1;
	slice = -1;
      }
      else{
	next = gatenum;
      }
      jentry = next -2;
    }
    if( pause_between ){
      int next = pause( slice, pe_cut );
      if( next > 0 )
	jentry = next-2;
      else if( next == 0 ){;}
      else
	jentry = first_event+num_events-1;
    }

  }
 
}

//===========================================================================
// PauseEventDisplays
//===========================================================================

void analyzeDST::PauseEventDisplay(double pe_cut, int num_modules, int first_module, bool show_clusters, 
				   bool print_files, double Cx, double Cy ){

  cout << "################################################" << endl;
  cout << " Starting MINERvA Event Display" << endl;
  cout << "################################################" << endl;

  set_root_env();

  if (fChain == 0) return;

  Long64_t nentries = fChain->GetEntriesFast();
  Long64_t nbytes = 0, nb = 0;

  int slice = -1;
  double new_pe_cut = 0;

  if( show_clusters )
    TCanvas *cEventDisplay = new TCanvas( "cEventDisplay", "cEventDisplay", Cx, Cy );
  else
    TCanvas *cEventDisplay = new TCanvas( "cEventDisplay", "cEventDisplay", Cx, Cy );


  //===============================
  //-- Loop over events in NTuple
  //===============================

  for (Long64_t jentry=0; jentry<nentries; jentry++) {
 
    Long64_t ientry = LoadTree(jentry);
    if (ientry < 0) break;
    nb = fChain->GetEntry(jentry);   nbytes += nb;
    
    const int gatenum = ev_gate;
  
    event_display(gatenum, slice, pe_cut, 35, show_clusters, print_files, num_modules, first_module, cEventDisplay );
  
    if( slice < 0 || slice > n_slices ){
      if( pe_cut == 0 )
	sprintf(words,"event_display_run%d_sub%d_ev%d.jpg",ev_run, ev_sub_run, gatenum );
      else
	sprintf(words,"event_display_run%d_sub%d_ev%d_c%2.1f.jpg",ev_run, ev_sub_run, gatenum, pe_cut );
    }else{
      if( pe_cut == 0 )
	sprintf(words,"event_display_run%d_sub%d_ev%d_sl%d.jpg",ev_run, ev_sub_run, gatenum, slice );
      else
	sprintf(words,"event_display_run%d_sub%d_ev%d_sl%d_c%2.1f.jpg",ev_run, ev_sub_run, gatenum, slice, pe_cut );
    }
    
    int next = pause( slice, new_pe_cut );
    cout << " next, slice " << next << " ," << slice << endl;

    // asked for the next slice
    if(next == -99){  
      if (slice >= n_slices){ 
	next = gatenum+1;
	slice = -1;
      }
      else{
	next = gatenum;
      }
      cout << " next " << gatenum << " " << slice << " " << n_slices <<  endl;
    }
    if( next == -2 ){   
      cEventDisplay->Print(words,"jpg");
      next = pause( slice, new_pe_cut );
    // asked for the next slice
      if(next == -99){  
	if (slice >= n_slices ){ 
	  next = gatenum+1;
	  slice = -1;
	}
	else{
	  next = gatenum;
	}
	cout << " next " << gatenum << " " << slice << " " << n_slices <<  endl;
      }


    }
 
    if( next > 0 )
      jentry = next-2;
    else if( next == 0 ){;}
    else
      jentry = nentries-1;

    pe_cut = new_pe_cut;

  }
  
}


//===========================================================================
// LoopClusterPEs
//===========================================================================

void analyzeDST::LoopClusterPEs(char* label, int first_event, int num_events, int num_modules, bool print_files){

  cout << "################################################" << endl;
  cout << " Cluster Plots" << endl;
  cout << "################################################" << endl;

  set_root_env();

  if (fChain == 0) return;
  
  Long64_t nentries = fChain->GetEntriesFast();
  Long64_t nbytes = 0, nb = 0;
  
  //-----------------------
  //-- Create canvases
  //-----------------------
  TCanvas *cPE1 = new TCanvas( "cPE1", "cPE1", 1200,  600 );
  cPE1->Divide(2,1);
  TCanvas *cPE2 = new TCanvas( "cPE2", "cPE2", 1200,  600 );
  cPE2->Divide(2,1);
  TCanvas *cPathL  = new TCanvas( "cPathL",  "cPathL",  800,  600 );

  TCanvas *cPEPlanes = new TCanvas( "cPEPlanes", "cPEPlanes", 1200, 800 );
  cPEPlanes->Divide(8,6);

  //-----------------------
  //-- Create Histograms
  //-----------------------
  TH1F *PE_clus_all   = new TH1F("PE_clus_all","PE_clus_all",200,0,60);

  TH1F *PE_clus_nodes = new TH1F("PE_clus_nodes","PE_clus_nodes",200,0,60);
  TH2F *PE_plane = new TH2F("PE_plane","PE_plane",2*num_modules,1,2*num_modules+1,100,0,60);

  TH1F *PE_clus_nodes_norm = new TH1F("PE_clus_nodes_norm","PE_clus_nodes_norm",200,0,60);
  TH2F *PE_plane_norm = new TH2F("PE_plane_norm","PE_plane_norm",2*num_modules,1,2*num_modules+1,100,0,60);

  TH1F *PE_plane_mean = new TH1F("PE_plane_mean","PE_plane_mean",2*num_modules,1,2*num_modules+1);

  TH1F *pathL = new TH1F("pathL","pathL",100,0,5);

  //===============================
  //-- Loop over events in NTuple
  //===============================

  double path_length = 0;

  if( first_event < 1 ) return;

  for (Long64_t jentry=first_event-1; jentry<nentries && jentry<first_event+num_events-1;jentry++) {

    //cout << jentry << endl;
 
    Long64_t ientry = LoadTree(jentry);
    if (ientry < 0) break;
    nb = fChain->GetEntry(jentry);   nbytes += nb;
   
    //- all clusters
    for( int i = 0; i < n_clusters; i++ ){
      PE_clus_all->Fill( clus_pe[i] );
    }
    
    int clusidx, hitidx, num_front_planes;
    bool muon;

    //- clusters on tracks
    for( int i = 0; i < n_tracks; i++ ){

      //--try to select through-going muons
      muon = true;
      num_front_planes = 0;

      if( trk_nodes[i] < 30 ) muon = false;
      
      for( int j = 0; j < trk_nodes[i]; j++ ){	
	clusidx = trk_node_cluster_idx[i][j];
	hitidx = clus_hits_idx[clusidx][0];
	if( hit_module[hitidx]-75 < 2 ) num_front_planes++;
      }
      if( num_front_planes < 2 ) muon = false;

      if( muon ){

	for( int j = 0; j < trk_nodes[i]; j++ ){	
	  
	  path_length = sqrt(1.0 + trk_node_aX[i][j]*trk_node_aX[i][j] + trk_node_aY[i][j]*trk_node_aY[i][j]); 
	  pathL->Fill(path_length);
	  
	  clusidx = trk_node_cluster_idx[i][j];
	  
	  if( clus_pe[clusidx] != 0 ){
	    
	    PE_clus_nodes->Fill( clus_pe[clusidx] );
	    PE_clus_nodes_norm->Fill( clus_pe[clusidx]/path_length );
	    
	    hitidx = clus_hits_idx[clusidx][0];
	    
	    PE_plane->Fill( 2*(hit_module[hitidx]-75) + hit_plane[hitidx], clus_pe[clusidx] ); 
	    PE_plane_norm->Fill( 2*(hit_module[hitidx]-75) + hit_plane[hitidx], clus_pe[clusidx]/path_length ); 
	  }
	}
      }
    }
    
  }
  
  //=======================
  //-- Draw canvases
  //=======================
  
  cPE1->cd(1);
  PE_clus_all->GetXaxis()->SetTitle("PE/cluster");
  PE_clus_all->GetXaxis()->SetTitleSize(0.06);
  PE_clus_all->GetXaxis()->SetTitleOffset(0.8);
  PE_clus_all->GetXaxis()->SetLabelSize(0.04);
  PE_clus_all->GetYaxis()->SetTitle("events");
  PE_clus_all->GetYaxis()->SetTitleSize(0.06);
  PE_clus_all->GetYaxis()->SetTitleOffset(0.9);
  PE_clus_all->GetYaxis()->SetLabelSize(0.035);
  PE_clus_all->DrawCopy();

  PE_clus_nodes->SetLineColor(2);
  PE_clus_nodes->DrawCopy("same");

  add_plot_label( "all clusters", 0.45, 0.7, 0.04, 1 );
  add_plot_label( "clusters on tracks", 0.45, 0.65, 0.04, 2 );
  sprintf(words, "mean %4.2f", PE_clus_nodes->GetMean() );
  add_plot_label( words, 0.5, 0.6, 0.03, 2 );
  sprintf(words, "max bin %4.2f", PE_clus_nodes->GetBinCenter(PE_clus_nodes->GetMaximumBin()) );
  add_plot_label( words, 0.5, 0.56, 0.03, 2 );
  sprintf(words, "Run %d", ev_run );
  add_plot_label( words, 0.65, 0.85, 0.05, 1);
  add_plot_label( label, 0.45, 0.8, 0.05, 1);

  cPE1->cd(2);
  PE_clus_nodes_norm->SetLineColor(2);
  PE_clus_nodes_norm->GetXaxis()->SetTitle("PE/cluster");
  PE_clus_nodes_norm->GetXaxis()->SetTitleSize(0.06);
  PE_clus_nodes_norm->GetXaxis()->SetTitleOffset(0.8);
  PE_clus_nodes_norm->GetXaxis()->SetLabelSize(0.04);
  PE_clus_nodes_norm->GetYaxis()->SetTitle("events");
  PE_clus_nodes_norm->GetYaxis()->SetTitleSize(0.06);
  PE_clus_nodes_norm->GetYaxis()->SetTitleOffset(0.9);
  PE_clus_nodes_norm->GetYaxis()->SetLabelSize(0.035);
  PE_clus_nodes_norm->DrawCopy();

  add_plot_label( "norm. clusters", 0.45, 0.65, 0.04, 2 );
  sprintf(words, "mean %4.2f", PE_clus_nodes_norm->GetMean() );
  add_plot_label( words, 0.5, 0.6, 0.03, 2 );
  sprintf(words, "max bin %4.2f", PE_clus_nodes_norm->GetBinCenter(PE_clus_nodes_norm->GetMaximumBin()) );
  add_plot_label( words, 0.5, 0.56, 0.03, 2 );
  sprintf(words, "Run %d", ev_run);
  add_plot_label( words, 0.65, 0.85, 0.05, 1);
  add_plot_label( label, 0.45, 0.8, 0.05, 1);


  cPE2->cd(1);
  PE_plane->GetXaxis()->SetTitle("plane");
  PE_plane->GetXaxis()->SetTitleSize(0.06);
  PE_plane->GetXaxis()->SetTitleOffset(0.8);
  PE_plane->GetXaxis()->SetLabelSize(0.04);
  PE_plane->GetYaxis()->SetTitle("PE/cluster");
  PE_plane->GetYaxis()->SetTitleSize(0.06);
  PE_plane->GetYaxis()->SetTitleOffset(0.9);
  PE_plane->GetYaxis()->SetLabelSize(0.035);
  PE_plane->DrawCopy("box");

  // loop over planes to get means of PE distributions
  for( int i = 1; i <= 2*num_modules; i++ ){
    PE_plane->ProjectionY("pe",i,i);
    PE_plane_mean->SetBinContent(i,pe->GetMean());
  }
  PE_plane_mean->SetLineColor(2);
  PE_plane_mean->SetLineWidth(3);
  PE_plane_mean->DrawCopy("same hist");

  add_plot_label( "mean PE", 0.18, 0.85, 0.04, 2 );
  sprintf(words, "Run %d", ev_run);
  add_plot_label( words, 0.65, 0.85, 0.05, 1);
  add_plot_label( label, 0.45, 0.8, 0.05, 1);


  cPE2->cd(2);
  PE_plane_norm->GetXaxis()->SetTitle("plane");
  PE_plane_norm->GetXaxis()->SetTitleSize(0.06);
  PE_plane_norm->GetXaxis()->SetTitleOffset(0.8);
  PE_plane_norm->GetXaxis()->SetLabelSize(0.04);
  PE_plane_norm->GetYaxis()->SetTitle("PE/cluster");
  PE_plane_norm->GetYaxis()->SetTitleSize(0.06);
  PE_plane_norm->GetYaxis()->SetTitleOffset(0.9);
  PE_plane_norm->GetYaxis()->SetLabelSize(0.035);
  PE_plane_norm->DrawCopy("box");

  // loop over planes to get means of PE distributions
  for( int i = 1; i <= 2*num_modules; i++ ){
    PE_plane_norm->ProjectionY("pe",i,i);
    PE_plane_mean->SetBinContent(i,pe->GetMean());
  }
  PE_plane_mean->SetLineColor(2);
  PE_plane_mean->SetLineWidth(3);
  PE_plane_mean->DrawCopy("same hist");

  add_plot_label( "mean PE (norm.)", 0.18, 0.85, 0.04, 2 );
  sprintf(words, "Run %d", ev_run);
  add_plot_label( words, 0.65, 0.85, 0.05, 1);
  add_plot_label( label, 0.45, 0.8, 0.05, 1);


  cPathL->cd();
  pathL->GetXaxis()->SetTitle("dr/dz (z=plane width)");
  pathL->GetXaxis()->SetTitleSize(0.05);
  pathL->GetXaxis()->SetTitleOffset(1.0);
  pathL->GetXaxis()->SetLabelSize(0.04);
  pathL->Draw();

  sprintf(words, "Run %d", ev_run);
  add_plot_label( words, 0.65, 0.85, 0.05, 1);
  add_plot_label( label, 0.45, 0.8, 0.05, 1);

  for( int i = 1; i <= 2*num_modules; i++ ){
    cPEPlanes->cd(i);
    PE_plane_norm->ProjectionY("pe",i,i);
    pe->DrawCopy();
  }
    

}

//===========================================================================
// LoopTimeCalib
//===========================================================================

void analyzeDST::LoopTimeCalib(int first_event, int num_events, int croc, int chain1, int chain2, double tmax, bool print_files){

  cout << "################################################" << endl;
  cout << " Timing Plots" << endl;
  cout << "################################################" << endl;

  set_root_env();

  char words[500];
  char filename[500];

  if (fChain == 0) return;
  
  Long64_t nentries = fChain->GetEntriesFast();
  Long64_t nbytes = 0, nb = 0;
  
  //-----------------------
  //-- Create canvases
  //-----------------------
  TCanvas *cT1  = new TCanvas( "cT1",  "cT1",  600, 800 );
  cT1->Divide(1,3);
  TCanvas *cT2  = new TCanvas( "cT2",  "cT2",  600, 500 );
  TCanvas *cT3  = new TCanvas( "cT3",  "cT3",  600, 800 );
  cT3->Divide(1,2);
  TCanvas *cT4  = new TCanvas( "cT4",  "cT4",  600, 500 );
  TCanvas *cT5  = new TCanvas( "cT5",  "cT5",  800, 500 );
  cT5->Divide(2,1);
  TCanvas *cTiming_Lego = new TCanvas( "cTiming_Lego", "cTiming_Lego", 600, 500 );

  //-----------------------
  //-- Create Histograms
  //-----------------------
  TH1F *systicks_allHits   = new TH1F("systicks_allHits","systicks_allHits",1000,0,tmax*110);
  TH1F *delayticks_allHits   = new TH1F("delayticks_allHits","delayticks_allHits",17,0,17);
  TH1F *quarterticks_allHits   = new TH1F("quarterticks_allHits","quarterticks_allHits",4,0,4);
  TH1F *caltime = new TH1F("caltime", "caltime", 1000, 0, tmax );

  TH1F *hInterChainTime     = new TH1F("hInterChainTime", "hInterChainTime", 40,1,21);
  TH2F *hInterChainTimeDiff = new TH2F("hInterChainTimeDiff", "hInterChainTimeDiff",40,1,21,25,-50,50);
  TH2F *hInterChainCharge   = new TH2F("hInterChainCharge", "hInterChainCharge",200,0,tmax,500,0,3000);
  TH1F *hInterChainTimeDist = new TH1F("hInterChainDist", "hInterChainDist", 500,-50,50);
  TH1F *hInterChainTimeDist1 = new TH1F("hInterChainDist1", "hInterChainDist1", 500,-30,30);
  TH1F *hInterChainTimeDist2 = new TH1F("hInterChainDist2", "hInterChainDist2", 500,-30,30);

  
  //===============================
  //-- Loop over events in NTuple
  //===============================

  if( first_event < 1 ) return;

  for (Long64_t jentry=first_event-1; jentry<nentries && jentry<first_event+num_events-1;jentry++) {
 
    Long64_t ientry = LoadTree(jentry);
    if (ientry < 0) break;
    nb = fChain->GetEntry(jentry);   nbytes += nb;

    for( int i = 0; i < 40; i++ )
      hInterChainTime->SetBinContent(i+1, 100000.);


    int hit_num_ref = 0;


    for( int idig = 0; idig < n_rawhits; idig++ ){

      if( croc == 0 || (hit_croc[idig] == croc && (hit_chain[idig] == chain1 || hit_chain[idig] == chain2))){
	if( hit_disc_fired[idig] == 1 ){
	  systicks_allHits->Fill( hit_sys_ticks[idig] );
	  delayticks_allHits->Fill( hit_delay_ticks[idig] );
	  quarterticks_allHits->Fill( hit_quarter_ticks[idig] );
	  caltime->Fill( hit_time[idig]/1000. );
	  hInterChainCharge->Fill( hit_time[idig]/1000., hit_qhi[idig] );
	}
      }

      if( hit_croc[idig] == croc && (hit_chain[idig] == chain1 || hit_chain[idig] == chain2) ){

	int bin = 2*(hit_board[idig]-1) + 1;
	if (hit_chain[idig] == chain2 && hit_chain[idig] != chain1) bin += 20;
	if (hit_pixel[idig] > 31) bin += 1;

	if( hit_disc_fired[idig] == 1 && hit_num[idig] == hit_num_ref && hit_time[idig] > 0 && hit_time[idig] < hInterChainTime->GetBinContent(bin)){
	  hInterChainTime->SetBinContent(bin, hit_time[idig]);
	}
      }
    }

    for( int i = 1; i <= 40; i++ ){

      if( hInterChainTime->GetBinContent(1) != 100000. ){
	hInterChainTimeDiff->Fill((float)(i+1)/2.+.01, (hInterChainTime->GetBinContent(i)-hInterChainTime->GetBinContent(1)));
	if( i != 1 ){
	  hInterChainTimeDist->Fill(hInterChainTime->GetBinContent(i)-hInterChainTime->GetBinContent(1));
	  if( i < 21 )
	    hInterChainTimeDist1->Fill(hInterChainTime->GetBinContent(i)-hInterChainTime->GetBinContent(1));
	  else if( i > 21 )
	    hInterChainTimeDist2->Fill(hInterChainTime->GetBinContent(i)-hInterChainTime->GetBinContent(21));

	}
      }
    }
  }
  
  //=======================
  //-- Draw canvases
  //=======================
  
  sprintf(words, "croc %d, chain %d,%d", croc, chain1, chain2 );

  cT1->cd(1);
  gPad->SetLogy();
  systicks_allHits->GetXaxis()->SetTitle("sys_ticks");
  systicks_allHits->GetXaxis()->SetTitleSize(0.06);
  systicks_allHits->GetXaxis()->SetTitleOffset(0.8);
  systicks_allHits->GetXaxis()->SetLabelSize(0.04);
  systicks_allHits->GetYaxis()->SetTitle("Events");
  systicks_allHits->GetYaxis()->SetTitleSize(0.06);
  systicks_allHits->GetYaxis()->SetTitleOffset(0.9);
  systicks_allHits->GetYaxis()->SetLabelSize(0.035);
  systicks_allHits->SetFillColor(46);
  systicks_allHits->DrawCopy();
 
  cT1->cd(2);
  gPad->SetLogy(0);
  delayticks_allHits->GetXaxis()->SetTitle("delay_ticks");
  delayticks_allHits->GetXaxis()->SetTitleSize(0.06);
  delayticks_allHits->GetXaxis()->SetTitleOffset(0.8);
  delayticks_allHits->GetXaxis()->SetLabelSize(0.04);
  delayticks_allHits->GetYaxis()->SetTitle("Events");
  delayticks_allHits->GetYaxis()->SetTitleSize(0.06);
  delayticks_allHits->GetYaxis()->SetTitleOffset(0.9);
  delayticks_allHits->GetYaxis()->SetLabelSize(0.035);
  delayticks_allHits->SetFillColor(46);
  delayticks_allHits->SetMinimum(0);
  delayticks_allHits->DrawCopy();
  add_plot_label(words, 0.4, 0.8, 0.05, 1);
   
  cT1->cd(3);
  gPad->SetLogy(0);
  quarterticks_allHits->GetXaxis()->SetTitle("quarter_ticks");
  quarterticks_allHits->GetXaxis()->SetTitleSize(0.06);
  quarterticks_allHits->GetXaxis()->SetTitleOffset(0.8);
  quarterticks_allHits->GetXaxis()->SetLabelSize(0.04);
  quarterticks_allHits->GetYaxis()->SetTitle("Events");
  quarterticks_allHits->GetYaxis()->SetTitleSize(0.06);
  quarterticks_allHits->GetYaxis()->SetTitleOffset(0.9);
  quarterticks_allHits->GetYaxis()->SetLabelSize(0.035);
  quarterticks_allHits->SetFillColor(46);
  quarterticks_allHits->SetMinimum(0);
  quarterticks_allHits->DrawCopy();

  if( print_files ){
    sprintf( filename, "run%d_subrun%d_croc%d_chains%d-%d_ticks_allhits.jpg",ev_run,ev_sub_run,croc,chain1,chain2);
    cT1->Print(filename,"jpg");
  }

  cT2->cd();
  gPad->SetLogy();
  caltime->GetXaxis()->SetTitle("time (us)");
  caltime->GetXaxis()->SetTitleSize(0.06);
  caltime->GetXaxis()->SetTitleOffset(0.8);
  caltime->GetXaxis()->SetLabelSize(0.04);
  caltime->GetYaxis()->SetTitle("Events");
  caltime->GetYaxis()->SetTitleSize(0.06);
  caltime->GetYaxis()->SetTitleOffset(0.9);
  caltime->GetYaxis()->SetLabelSize(0.035);
  caltime->SetMarkerStyle(20);
  caltime->SetMarkerSize(0.6);
  caltime->SetFillColor(42);
  caltime->DrawCopy("H E");
  add_plot_label(words, 0.4, 0.8, 0.05, 1);

  if( print_files ){
    sprintf( filename, "run%d_subrun%d_croc%d_chains%d-%d_time_allhits.jpg",ev_run,ev_sub_run,croc,chain1,chain2);
    cT2->Print(filename,"jpg");
  }


  cT3->cd(1);
  hInterChainTimeDiff->GetXaxis()->SetTitle("board");
  hInterChainTimeDiff->GetXaxis()->SetTitleSize(0.06);
  hInterChainTimeDiff->GetXaxis()->SetTitleOffset(0.8);
  hInterChainTimeDiff->GetXaxis()->SetLabelSize(0.04);
  hInterChainTimeDiff->GetYaxis()->SetTitle("t_{i} - t_{1} (ns)");
  hInterChainTimeDiff->GetYaxis()->SetTitleSize(0.06);
  hInterChainTimeDiff->GetYaxis()->SetTitleOffset(0.9);
  hInterChainTimeDiff->GetYaxis()->SetLabelSize(0.035);
  hInterChainTimeDiff->SetMarkerStyle(20);
  hInterChainTimeDiff->SetMarkerSize(0.6);
  hInterChainTimeDiff->DrawCopy("colz");
  add_plot_label(words, 0.4, 0.8, 0.05, 1);

  cT3->cd(2);
  hInterChainTimeDist->GetXaxis()->SetTitle("t_{i} - t_{1} (ns)");
  hInterChainTimeDist->GetXaxis()->SetTitleSize(0.06);
  hInterChainTimeDist->GetXaxis()->SetTitleOffset(0.8);
  hInterChainTimeDist->GetXaxis()->SetLabelSize(0.04);
  hInterChainTimeDist->GetYaxis()->SetTitle("Event");
  hInterChainTimeDist->GetYaxis()->SetTitleSize(0.06);
  hInterChainTimeDist->GetYaxis()->SetTitleOffset(0.9);
  hInterChainTimeDist->GetYaxis()->SetLabelSize(0.035);
  hInterChainTimeDist->SetMarkerStyle(20);
  hInterChainTimeDist->SetMarkerSize(1);
  hInterChainTimeDist->DrawCopy("E1");
  TF1 *fgaus = new TF1("gaus","gaus",-50,50);
  hInterChainTimeDist->Fit(fgaus,"N");
  fgaus->SetLineColor(2);
  fgaus->Draw("same");
  sprintf(words,"mean: %3.2f ns",fgaus->GetParameter(1));
  add_plot_label(words, 0.6, 0.75, 0.05, 1);
  sprintf(words,"#sigma: %3.2f ns",fgaus->GetParameter(2));
  add_plot_label(words, 0.6, 0.7, 0.05, 1);

  if( print_files ){
    sprintf( filename, "run%d_subrun%d_croc%d_chains%d-%d_timing.jpg",ev_run,ev_sub_run,croc,chain1,chain2);
    cT3->Print(filename,"jpg");
  }

  
  cTiming_Lego->cd();
  hInterChainTimeDiff->GetXaxis()->SetTitleOffset(2.0);
  hInterChainTimeDiff->GetYaxis()->SetTitleOffset(2.0);
  hInterChainTimeDiff->SetOption("lego2");
  hInterChainTimeDiff->DrawCopy();
  add_plot_label(words, 0.4, 0.8, 0.05, 1);

  if( print_files ){
    sprintf( filename, "run%d_subrun%d_croc%d_chains%d-%d_lego.jpg",ev_run,ev_sub_run,croc,chain1,chain2);
    cTiming_Lego->Print(filename,"jpg");
  }


  cT5->cd(1);
  hInterChainTimeDist1->GetXaxis()->SetTitle("t_{i} - t_{1} (ns)");
  hInterChainTimeDist1->GetXaxis()->SetTitleSize(0.06);
  hInterChainTimeDist1->GetXaxis()->SetTitleOffset(0.8);
  hInterChainTimeDist1->GetXaxis()->SetLabelSize(0.04);
  hInterChainTimeDist1->GetYaxis()->SetTitle("Event");
  hInterChainTimeDist1->GetYaxis()->SetTitleSize(0.06);
  hInterChainTimeDist1->GetYaxis()->SetTitleOffset(0.9);
  hInterChainTimeDist1->GetYaxis()->SetLabelSize(0.035);
  hInterChainTimeDist1->SetMarkerStyle(20);
  hInterChainTimeDist1->SetMarkerSize(1);
  hInterChainTimeDist1->DrawCopy("E1");
  TF1 *fgaus1 = new TF1("gaus","gaus",-50,50);
  hInterChainTimeDist1->Fit(fgaus1,"N");
  fgaus1->SetLineColor(2);
  fgaus1->Draw("same");
  sprintf(words,"mean: %3.2f ns",fgaus1->GetParameter(1));
  add_plot_label(words, 0.55, 0.8, 0.04, 1);
  sprintf(words,"#sigma: %3.2f ns",fgaus1->GetParameter(2));
  add_plot_label(words, 0.55, 0.75, 0.04, 1);
  sprintf(words, "croc %d, chain %d", croc, chain1 );
  add_plot_label(words, 0.2, 0.85, 0.04, 1);

  cT5->cd(2);
  hInterChainTimeDist2->GetXaxis()->SetTitle("t_{i} - t_{1} (ns)");
  hInterChainTimeDist2->GetXaxis()->SetTitleSize(0.06);
  hInterChainTimeDist2->GetXaxis()->SetTitleOffset(0.8);
  hInterChainTimeDist2->GetXaxis()->SetLabelSize(0.04);
  hInterChainTimeDist2->GetYaxis()->SetTitle("Event");
  hInterChainTimeDist2->GetYaxis()->SetTitleSize(0.06);
  hInterChainTimeDist2->GetYaxis()->SetTitleOffset(0.9);
  hInterChainTimeDist2->GetYaxis()->SetLabelSize(0.035);
  hInterChainTimeDist2->SetMarkerStyle(20);
  hInterChainTimeDist2->SetMarkerSize(1);
  hInterChainTimeDist2->DrawCopy("E1");
  TF1 *fgaus2 = new TF1("gaus","gaus",-50,50);
  hInterChainTimeDist2->Fit(fgaus2,"N");
  fgaus2->SetLineColor(2);
  fgaus2->Draw("same");
  sprintf(words,"mean: %3.2f ns",fgaus2->GetParameter(1));
  add_plot_label(words, 0.55, 0.8, 0.04, 1);
  sprintf(words,"#sigma: %3.2f ns",fgaus2->GetParameter(2));
  add_plot_label(words, 0.55, 0.75, 0.04, 1);
  sprintf(words, "croc %d, chain %d", croc, chain2 );
  add_plot_label(words, 0.2, 0.85, 0.04, 1);

  if( print_files ){
    sprintf( filename, "run%d_subrun%d_croc%d_chains%d-%d_tres_chains.jpg",ev_run,ev_sub_run,croc,chain1,chain2);
    cT5->Print(filename,"jpg");
  }

  cT4->cd();
  hInterChainCharge->GetXaxis()->SetTitle("time (us)");
  hInterChainCharge->GetXaxis()->SetTitleSize(0.06);
  hInterChainCharge->GetXaxis()->SetTitleOffset(0.8);
  hInterChainCharge->GetXaxis()->SetLabelSize(0.04);
  hInterChainCharge->GetYaxis()->SetTitle("q_{hi} (ADC)");
  hInterChainCharge->GetYaxis()->SetTitleSize(0.06);
  hInterChainCharge->GetYaxis()->SetTitleOffset(0.9);
  hInterChainCharge->GetYaxis()->SetLabelSize(0.035);
  hInterChainCharge->SetMarkerStyle(20);
  hInterChainCharge->SetMarkerSize(0.6);
  hInterChainCharge->DrawCopy("colz");
  sprintf(words, "croc %d, chain %d,%d", croc, chain1, chain2 );
  add_plot_label(words, 0.4, 0.8, 0.05, 1);

  if( print_files ){
    sprintf( filename, "run%d_subrun%d_croc%d_chains%d-%d_charge.jpg",ev_run,ev_sub_run,croc,chain1,chain2);
    cT4->Print(filename,"jpg");
  }

}


//===========================================================================
//
// simple plot utility functions that do not require looping over the ntuple
//
//===========================================================================


//=========================================================
// event_display 
//=========================================================

void analyzeDST::event_display( const int gate, int slice, double pe_cut, double maxPE, 
				bool show_clusters, bool print_files, int num_modules, 
				int first_module, TCanvas *cEventDisplay, double Cx, double Cy ){

  if( cEventDisplay == NULL ){
    if( show_clusters )
      cEventDisplay = new TCanvas( "cEventDisplay", "cEventDisplay", Cx, Cy );
    else
      cEventDisplay = new TCanvas( "cEventDisplay", "cEventDisplay", Cx, Cy );
  }
  
  int slice_color = kBlack;
  if( slice == 1 ) slice_color = kRed+2;
  if( slice == 2 ) slice_color = kBlue+1;
  if( slice == 3 ) slice_color = kGreen+2;
  if( slice == 4 ) slice_color = kOrange+2;
  if( slice == 5 ) slice_color = kYellow+1;
  if( slice > 5 )  slice_color = slice;
  
  cEventDisplay->Clear();
  cEventDisplay->Divide(1,4);
  
  double idheight = 0.7;
  double odheight = 0.14;
  double theight  = 1.0-idheight-odheight;
  
  TPad *pTime = cEventDisplay->GetPad(1);
  pTime->SetPad(0,1-theight,1,1);
  TPad *odtop = cEventDisplay->GetPad(2);
  odtop->SetPad(0,1-theight-odheight,1,1-theight);
  TPad *XUV = cEventDisplay->GetPad(3);
  XUV->SetPad(0,1.5*odheight,1,1-theight-odheight);
  TPad *odbot = cEventDisplay->GetPad(4);
  odbot->SetPad(0,0,1,1.5*odheight);
  
  if( show_clusters )
    XUV->Divide(6,1);
  else
    XUV->Divide(3,1);
  
  odtop->Divide(3,1);
  odbot->Divide(3,1);


  //---------------------------------------------
  // ID displays
  //---------------------------------------------

  XUV->cd(1);
  gPad->SetTopMargin(0.013);
  gPad->SetBottomMargin(0.015);
  gPad->SetGridx();
  TH2F *stripsX = new TH2F("stripsX","stripsX",num_modules,1,num_modules+1,127,0,127);
  if( slice < 0 || slice > n_slices )
    sprintf( words, "hit_pe_cal*(ev_gate==%d && hit_module>0 && hit_pe_cal>%f && hit_view==1)", gate, pe_cut );
  else
    sprintf( words, "hit_pe_cal*(ev_gate==%d && hit_module>0 && hit_pe_cal>%f && hit_view==1 && hit_time_slice==%d)", gate, pe_cut, slice );
  sprintf( words2,"hit_strip:hit_module-%d",first_module);  
  minerva->Project("stripsX", words2, words);
  stripsX->GetXaxis()->SetTitle("module");
  stripsX->GetXaxis()->SetTitleSize(0.0);
  stripsX->GetXaxis()->SetTitleOffset(0.6);
  stripsX->GetXaxis()->SetLabelSize(0.0);
  stripsX->GetYaxis()->SetTitle("strip       ");
  stripsX->GetYaxis()->SetTitleSize(0.06);
  stripsX->GetYaxis()->SetTitleOffset(1.2);
  stripsX->GetYaxis()->SetLabelSize(0.045);
  stripsX->GetZaxis()->SetLabelSize(0.05);
  stripsX->GetZaxis()->SetRangeUser(0,maxPE);
  stripsX->GetZaxis()->SetTitle("PE    ");
  stripsX->GetZaxis()->SetTitleSize(0.07);
  stripsX->GetZaxis()->SetTitleOffset(-0.9);
  stripsX->DrawCopy("col");

  for( int i = 0; i < 128; i++ ){
    if( i%8 == 0 ){
      sprintf(words,"%d",i);
      TF1 *line = new TF1("line",words,0,num_modules+1);
      line->SetLineWidth(1);
      line->SetLineStyle(3);
      line->SetLineColor(46);
      line->DrawCopy("same");
      delete line;
    }
  }

  if( show_clusters ){
    XUV->cd(2);
    gPad->SetTopMargin(0.013);
    gPad->SetBottomMargin(0.015);
    if( num_modules <= 8 )
      TH2F *clustersX = new TH2F("clustersX","clustersX",350,-450,-100,2000,-1100,1100);
    else if( num_modules <= 12 )
      TH2F *clustersX = new TH2F("clustersX","clustersX",550,-450,100,2000,-1100,1100);
    else if( num_modules <= 16 )
      TH2F *clustersX = new TH2F("clustersX","clustersX",700,-450,250,2000,-1100,1100);
    else
    TH2F *clustersX = new TH2F("clustersX","clustersX",1000, 0,1200, 1000,-1100,1100);
    if( slice < 0 || slice > n_slices )
      sprintf( words, "ev_gate==%d && clus_view==1", gate );
    else
      sprintf( words, "ev_gate==%d && clus_view==1 && clus_time_slice==%d", gate, slice );
    minerva->Project("clustersX","clus_coord:clus_z", words );
    clustersX->SetMarkerStyle(20);
    clustersX->SetMarkerSize(0.7);
    clustersX->SetMarkerColor(14);
    clustersX->GetXaxis()->SetTitle("Z (mm)");
    clustersX->GetXaxis()->SetTitleSize(0.09);
    clustersX->GetXaxis()->SetTitleOffset(0.6);
    clustersX->GetXaxis()->SetLabelSize(0.05);
    clustersX->GetYaxis()->SetTitle("X (mm)  ");
    clustersX->GetYaxis()->SetTitleSize(0.08);
    clustersX->GetYaxis()->SetTitleOffset(0.9);
    clustersX->GetYaxis()->SetLabelSize(0.04);
    clustersX->DrawCopy();
  }
  
  add_plot_label( "X-view", 0.40, 0.9, 0.07, 1 );
  sprintf( words, "run: %d/%d", ev_run, ev_sub_run );
  add_plot_label( words, 0.2, 0.13, 0.055, 1 );
  if( slice < 0 || slice > n_slices ){
    sprintf( words, "gate: %d    slice:  all", gate );
    add_plot_label( words, 0.2, 0.06, 0.055, 1 );
  }
  else{
    sprintf( words, "gate: %d    slice:", gate );
    add_plot_label( words, 0.2, 0.06, 0.055, 1 );
    sprintf( words, "%d", slice );
    add_plot_label( words, 0.63, 0.06, 0.07, slice_color );
  }
  
  if( show_clusters )
    XUV->cd(3);
  else
    XUV->cd(2);
  gPad->SetTopMargin(0.013);
  gPad->SetBottomMargin(0.015);
  gPad->SetGridx();
  TH2F *stripsU = new TH2F("stripsU","stripsU",num_modules,1,num_modules+1,127,0,127);
  if( slice < 0 || slice > n_slices )
    sprintf( words, "hit_pe_cal*(ev_gate==%d && hit_module>0 && hit_pe_cal>%f && hit_view==2)", gate, pe_cut );
  else
    sprintf( words, "hit_pe_cal*(ev_gate==%d && hit_module>0 && hit_pe_cal>%f && hit_view==2 && hit_time_slice==%d)", gate, pe_cut, slice );
  sprintf( words2,"hit_strip:hit_module-%d",first_module);  
  minerva->Project("stripsU", words2, words);
  stripsU->GetXaxis()->SetTitle("module");
  stripsU->GetXaxis()->SetTitleSize(0.0);
  stripsU->GetXaxis()->SetTitleOffset(0.6);
  stripsU->GetXaxis()->SetLabelSize(0.0);
  stripsU->GetYaxis()->SetTitle("strip       ");
  stripsU->GetYaxis()->SetTitleSize(0.06);
  stripsU->GetYaxis()->SetTitleOffset(1.2);
  stripsU->GetYaxis()->SetLabelSize(0.045);
  stripsU->GetZaxis()->SetLabelSize(0.05);
  stripsU->GetZaxis()->SetRangeUser(0,maxPE);
  stripsU->GetZaxis()->SetTitle("PE    ");
  stripsU->GetZaxis()->SetTitleSize(0.07);
  stripsU->GetZaxis()->SetTitleOffset(-0.9);
  stripsU->DrawCopy("col");

  for( int i = 0; i < 128; i++ ){
    if( i%8 == 0 ){
      sprintf(words,"%d",i);
      TF1 *line = new TF1("line",words,0,num_modules+1);
      line->SetLineWidth(1);
      line->SetLineStyle(3);
      line->SetLineColor(46);
      line->DrawCopy("same");
      delete line;
    }
  }

  if( show_clusters ){
    XUV->cd(4);
    gPad->SetTopMargin(0.013);
    gPad->SetBottomMargin(0.015);
    if( num_modules <= 8 )
      TH2F *clustersU = new TH2F("clustersU","clustersU",400,-450,-50,2000,-1100,1100);
    else if( num_modules <= 12 )
      TH2F *clustersU = new TH2F("clustersU","clustersU",500,-450,50,2000,-1100,1100);
    else if( num_modules <= 16 )
      TH2F *clustersU = new TH2F("clustersU","clustersU",550,-450,200,2000,-1100,1100);
    else
      TH2F *clustersU = new TH2F("clustersU","clustersU",1000, 0, 1200,1000,-1100,1100);
    if( slice < 0 || slice > n_slices )
      sprintf( words, "(ev_gate==%d && clus_view==2)", gate );
    else
      sprintf( words, "(ev_gate==%d && clus_view==2 && clus_time_slice==%d)", gate, slice );
    minerva->Project("clustersU","clus_coord:clus_z", words );
    clustersU->SetMarkerStyle(20);
    clustersU->SetMarkerSize(0.7);
    clustersU->SetMarkerColor(14);
    clustersU->GetXaxis()->SetTitle("Z (mm)");
    clustersU->GetXaxis()->SetTitleSize(0.09);
    clustersU->GetXaxis()->SetTitleOffset(0.6);
    clustersU->GetXaxis()->SetLabelSize(0.05);
    clustersU->GetYaxis()->SetTitle("U (mm)  ");
    clustersU->GetYaxis()->SetTitleSize(0.08);
    clustersU->GetYaxis()->SetTitleOffset(0.9);
    clustersU->GetYaxis()->SetLabelSize(0.04);
    clustersU->DrawCopy();
    
  }

  add_plot_label( "U-view", 0.40, 0.9, 0.07, 1 );
  
  if( show_clusters )
    XUV->cd(5);
  else
    XUV->cd(3);
  gPad->SetTopMargin(0.013);
  gPad->SetBottomMargin(0.015);
  gPad->SetGridx();
  TH2F *stripsV = new TH2F("stripsV","stripsV",num_modules,1,num_modules+1,127,0,127);
  if( slice < 0 || slice > n_slices )
    sprintf( words, "hit_pe_cal*(ev_gate==%d && hit_module>0 && hit_pe_cal>%f && hit_view==3)", gate, pe_cut );
  else
    sprintf( words, "hit_pe_cal*(ev_gate==%d && hit_module>0 && hit_pe_cal>%f && hit_view==3 && hit_time_slice==%d)", gate, pe_cut, slice );
  sprintf( words2,"hit_strip:hit_module-%d",first_module);  
  minerva->Project("stripsV", words2, words);
  stripsV->GetXaxis()->SetTitle("module");
  stripsV->GetXaxis()->SetTitleSize(0.0);
  stripsV->GetXaxis()->SetTitleOffset(0.6);
  stripsV->GetXaxis()->SetLabelSize(0.0);
  stripsV->GetYaxis()->SetTitle("strip       ");
  stripsV->GetYaxis()->SetTitleSize(0.06);
  stripsV->GetYaxis()->SetTitleOffset(1.2);
  stripsV->GetYaxis()->SetLabelSize(0.045);
  stripsV->GetZaxis()->SetLabelSize(0.05);
  stripsV->GetZaxis()->SetRangeUser(0,maxPE);
  stripsV->GetZaxis()->SetTitle("PE    ");
  stripsV->GetZaxis()->SetTitleSize(0.07);
  stripsV->GetZaxis()->SetTitleOffset(-0.9);
  stripsV->DrawCopy("colz");
  
  for( int i = 0; i < 128; i++ ){
    if( i%8 == 0 ){
      sprintf(words,"%d",i);
      TF1 *line = new TF1("line",words,0,num_modules+1);
      line->SetLineWidth(1);
      line->SetLineStyle(3);
      line->SetLineColor(46);
      line->DrawCopy("same");
      delete line;
    }
  }

  if( show_clusters ){
    XUV->cd(6);
    gPad->SetTopMargin(0.013);
    gPad->SetBottomMargin(0.015);
    if( num_modules <= 8 )
      TH2F *clustersV = new TH2F("clustersV","clustersV",400,-450,-50,2000,-1100,1100);
    else if( num_modules <= 12 )
      TH2F *clustersV = new TH2F("clustersV","clustersV",500,-450,100,2000,-1100,1100);
    else if( num_modules <= 16 )
      TH2F *clustersV = new TH2F("clustersV","clustersV",550,-450,250,2000,-1100,1100);
    else
      TH2F *clustersV = new TH2F("clustersV","clustersV",1000,0,1200,1000,-1100,1100);
    if( slice < 0 || slice > n_slices )
      sprintf( words, "(ev_gate==%d && clus_view==3)", gate );
    else
      sprintf( words, "(ev_gate==%d && clus_view==3 && clus_time_slice==%d)", gate, slice );
    minerva->Project("clustersV","clus_coord:clus_z", words );
    clustersV->SetMarkerStyle(20);
    clustersV->SetMarkerSize(0.7);
    clustersV->SetMarkerColor(14);
    clustersV->GetXaxis()->SetTitle("Z (mm)");
    clustersV->GetXaxis()->SetTitleSize(0.09);
    clustersV->GetXaxis()->SetTitleOffset(0.6);
    clustersV->GetXaxis()->SetLabelSize(0.05);
    clustersV->GetYaxis()->SetTitle("V (mm)  ");
    clustersV->GetYaxis()->SetTitleSize(0.08);
    clustersV->GetYaxis()->SetTitleOffset(0.9);
    clustersV->GetYaxis()->SetLabelSize(0.04);
    clustersV->DrawCopy();
    
  }

  add_plot_label( "V-view", 0.40, 0.9, 0.07, 1 );

  if( pe_cut > 0 ){
    sprintf( words, "PE > %2.1f", pe_cut );
    add_plot_label( words, 0.2, 0.06, 0.055, 1 );
  }

  //---------------------------------------------
  // OD displays
  //---------------------------------------------

  bool top, bottom;

  for( int itower = 1; itower <= 6; itower++ ){

    if( itower == 1 ) odbot->cd(3); 
    if( itower == 2 ) odbot->cd(1);
    if( itower == 3 ) odbot->cd(2);
    if( itower == 4 ) odtop->cd(3);
    if( itower == 5 ) odtop->cd(1);
    if( itower == 6 ) odtop->cd(2);
    
    if( itower == 1 || itower == 2 || itower == 3 ){
      top = false; bottom = true;
      gPad->SetTopMargin(0.02);
      gPad->SetBottomMargin(0.5);
    }
    if( itower == 4 || itower == 5 || itower == 6 ){
      top = true; bottom = false;
      gPad->SetTopMargin(0.2);
      gPad->SetBottomMargin(0.02);
    } 
    gPad->SetGridx();
    TH2F *stories = new TH2F("stories","stories",num_modules,1,num_modules+1,8,1,5);
    if( slice < 0 || slice > n_slices )
      sprintf( words, "hit_pe_cal*(ev_gate==%d && hit_tower==%d && hit_pe_cal>%f && hit_location==2)", gate, itower, pe_cut );
    else
      sprintf( words, "hit_pe_cal*(ev_gate==%d && hit_tower==%d && hit_pe_cal>%f && hit_location==2 && hit_time_slice==%d)", gate, itower, pe_cut, slice );
    sprintf( words2,"hit_story+0.5*(hit_bar-1):hit_frame-%d",first_module);  
    minerva->Project("stories", words2, words);

    stories->GetYaxis()->SetTitle("story+0.5*(bar-1)");
    if( top ){
      stories->GetYaxis()->SetTitleSize(0.1);
      stories->GetYaxis()->SetTitleOffset(0.5);
      stories->GetYaxis()->SetLabelSize(0.1);
      stories->GetXaxis()->SetLabelSize(0.0);
    }
    if( bottom ){
      stories->GetXaxis()->SetTitle("module           ");
      stories->GetXaxis()->SetTitleSize(0.18);
      stories->GetXaxis()->SetTitleOffset(0.8);
      stories->GetXaxis()->SetLabelSize(0.13);
      stories->GetYaxis()->SetTitleSize(0.067);
      stories->GetYaxis()->SetTitleOffset(0.75);
      stories->GetYaxis()->SetLabelSize(0.067);
    }
    stories->GetZaxis()->SetLabelSize(0.0);
    stories->GetZaxis()->SetRangeUser(0,maxPE);
    stories->DrawCopy("col");
    
    for( int i = 2; i < 5; i++ ){
      sprintf(words,"%d",i);
      TF1 *line = new TF1("line",words,0,num_modules+1);
      line->SetLineWidth(3);
      line->SetLineStyle(3);
      line->SetLineColor(46);
      line->Draw("same");
      delete line;
    }

    sprintf( words, "tower  %d", itower );
    if( top )
      add_plot_label( words, 0.65, 0.53, 0.15, 1 );
    if( bottom )
      add_plot_label( words, 0.65, 0.8, 0.1, 1 );

    delete stories;

  }

  //---------------------------------------------
  // Plot the time distribution for the hits
  //---------------------------------------------

  pTime->cd();
  pTime->SetBottomMargin(0.065);
  pTime->SetLeftMargin(0.06);
  pTime->SetRightMargin(0.05);

  gPad->SetGridx();
  gPad->SetGridy();
  gPad->SetLogy();

  TH1F *hitTime = new TH1F("hitTime","hitTime",1600,0,16);

  for( int islice = n_slices; islice >= 0; islice-- ){

    hitTime->Reset();
    sprintf( words, "ev_gate==%d && hit_pe_cal>%f && hit_disc_fired==1 && hit_location!=0 && hit_time_slice==%d", gate, pe_cut, islice );
    minerva->Project("hitTime", "hit_time/1000.", words);
    hitTime->GetXaxis()->SetTitle("time (#mus)  ");
    hitTime->GetXaxis()->SetTitleSize(0.18);
    hitTime->GetXaxis()->SetTitleOffset(-0.6);
    hitTime->GetXaxis()->SetLabelSize(0.075);
    hitTime->GetYaxis()->SetTitle("hits  ");
    hitTime->GetYaxis()->SetTitleSize(0.15);
    hitTime->GetYaxis()->SetTitleOffset(0.15);
    hitTime->GetYaxis()->SetLabelSize(0.08);
    hitTime->GetYaxis()->SetRangeUser(1,100);
    
    if( islice == 0 ){
      hitTime->SetFillColor(kBlack);
      hitTime->SetLineColor(kBlack);
    }
    else if( islice == 1 ){
      hitTime->SetFillColor(kRed+2);
      hitTime->SetLineColor(kRed+2);
    }
    else if( islice == 2 ){
      hitTime->SetFillColor(kBlue+1);
      hitTime->SetLineColor(kBlue+1);
    }
    else if( islice == 3 ){
      hitTime->SetFillColor(kGreen+2);
      hitTime->SetLineColor(kGreen+2);
    }
    else if( islice == 4 ){
      hitTime->SetFillColor(kOrange+2);
      hitTime->SetLineColor(kOrange+2);
    }
    else if( islice == 5 ){
      hitTime->SetFillColor(kYellow+1);
      hitTime->SetLineColor(kYellow+1);
    }
    else{
      hitTime->SetFillColor(islice);
      hitTime->SetLineColor(islice);
    }

    if( islice == n_slices )
      hitTime->DrawCopy();
    else
      hitTime->DrawCopy("same");
  
    pTime->Update();

  }

  if( print_files ){
    if(slice == -1){
      sprintf(words,"event_display_run%d_sub%d_ev%d.jpg",ev_run, ev_sub_run, gate);
    }
    else{
      sprintf(words,"event_display_run%d_sub%d_ev%d_sl%d.jpg",ev_run, ev_sub_run, gate,slice);
    }
    cEventDisplay->Print(words,"jpg");
  }
  else
    cEventDisplay->Update();

  delete hitTime;
  delete stripsX;
  delete stripsU;
  delete stripsV;
  
  if( show_clusters ){
    delete clustersX;
    delete clustersU;
    delete clustersV;
  }

}


//=========================================================
// raw_data - draws raw ADC hits (qhi) for all pixels for
//            each PMT for a single event
//=========================================================

void analyzeDST::raw_data( int event ){

  set_root_env();

  int num_crocs  = 3;
  int num_chains = 4;
  int num_boards_per_chain = 10;
  int max_num_hits = 4;
  
  char words[200];

  TH2F *hist = new TH2F("hist","hist",64,0,64,300,0,3000);

  for( int croc = 1; croc <= num_crocs; croc++ ){

    for( int chain = 0; chain < num_chains; chain++ ){

      sprintf( words, "croc_%d_chain_%d", croc, chain );
      TCanvas *c = new TCanvas(words,words,1400,800);

      c->Divide(max_num_hits, num_boards_per_chain);

      for( int board = 1; board <= num_boards_per_chain; board++ ){
	
	for( int hit = 0; hit < max_num_hits; hit++ ){
	  
	  c->cd((board-1)*max_num_hits + hit + 1);
	  
	  sprintf( words, "ev_gate==%d && hit_croc==%d && hit_chain==%d && hit_board==%d && hit_num==%d", event, croc, chain, board, hit );
	  
	  hist->Reset();
	  
	  minerva->Project("hist","hit_qhi[]:hit_pixel[]",words);
	  
	  hist->GetXaxis()->SetRangeUser(0,64);
	  hist->GetYaxis()->SetRangeUser(0,3000);
	  hist->SetMarkerStyle(20);
	  hist->SetMarkerSize(0.6);
	  
	  hist->DrawCopy();
	  
	} //- hit
      } //- board
      
      //sprintf( words, "plots/event_%d_chain_%d.ps", event, chain );
      //c->Print( words );

    } //- chain
  } //- croc

}


//=========================================================
// utility for easily adding Latex labels on plots
//=========================================================

void analyzeDST::add_plot_label( char* label, double x, double y, double size, int color  ){

  TLatex *latex = new TLatex( x, y, label );
  latex->SetNDC();
  latex->SetTextSize(size);
  latex->SetTextColor(color);
  latex->Draw();

}

//=========================================================
// utility to set up basic root environment
//=========================================================

void analyzeDST::set_root_env(){

  //gStyle->SetPalette(1);
  gStyle->SetOptStat(0000);
  gStyle->SetOptFit(0000);
  gStyle->SetOptTitle(0);
  gStyle->SetCanvasColor(0);
  gStyle->SetPadBorderMode(0);
  gStyle->SetFrameBorderMode(0);
  gStyle->SetCanvasBorderMode(0);
  gStyle->SetPadTopMargin(0.08);
  gStyle->SetPadBottomMargin(0.15);
  gStyle->SetPadLeftMargin(0.15);
  gStyle->SetPadRightMargin(0.15);

  set_color_pallete();

}

//=========================================================
// utility to set up color pallete
//=========================================================

void analyzeDST::set_color_pallete(){

  //const Int_t NRGBs = 5;
  const Int_t NRGBs = 6;
  const Int_t NCont = 150;

  //-- rainbow scale
  //Double_t stops[NRGBs] = { 0.00, 0.34, 0.61, 0.84, 1.00 };
  //Double_t red[NRGBs]   = { 0.00, 0.00, 0.87, 1.00, 0.51 };
  //Double_t green[NRGBs] = { 0.00, 0.81, 1.00, 0.20, 0.00 };
  //Double_t blue[NRGBs]  = { 0.51, 1.00, 0.12, 0.00, 0.00 };
  
  //-- gray scale
  //Double_t stops[NRGBs] = { 0.00, 0.34, 0.61, 0.84, 1.00 };
  //Double_t red[NRGBs]   = { 1.00, 0.84, 0.61, 0.34, 0.00 };
  //Double_t green[NRGBs] = { 1.00, 0.84, 0.61, 0.34, 0.00 };
  //Double_t blue[NRGBs]  = { 1.00, 0.84, 0.61, 0.34, 0.00 };
  
  //-- white to red scale
  //Double_t stops[NRGBs] = { 0.00, 0.12, 0.41, 0.68, 1.00 };
  //Double_t red[NRGBs]   = { 0.95, 0.70, 0.87, 1.00, 1.00 };
  //Double_t green[NRGBs] = { 0.95, 0.70, 1.00, 0.50, 0.00 };
  //Double_t blue[NRGBs]  = { 0.95, 0.70, 0.12, 0.00, 0.00 };
  
  //-- gray to red to purple scale
  Double_t stops[NRGBs] = { 0.00, 0.03, 0.12, 0.35, 0.70, 1.00 };
  Double_t red[NRGBs]   = { 0.95, 0.70, 0.87, 0.90, 1.00, 0.20 };
  Double_t green[NRGBs] = { 0.95, 0.70, 0.80, 0.50, 0.00, 0.10 };
  Double_t blue[NRGBs]  = { 0.95, 0.70, 0.12, 0.00, 0.00, 0.50 };
  
  TColor::CreateGradientColorTable(NRGBs, stops, red, green, blue, NCont);
  gStyle->SetNumberContours(NCont);

}

//=========================================================
// utility to pause between displays
//=========================================================

int analyzeDST::pause( int &slice, double &pe_cut ){

  const int length = 20;
  char junk[length];
  char evstr[length];
  char slstr[length];
  char cutstr[length];
  int del1 = length-1;
  int del2 = length-1;
  int i;

  //slice = -1;
  pe_cut = 0;

  cout << " pause slice " << slice << endl;
  cout << "Options:" << endl;
  cout << "  RETURN for next spill" << endl;
  cout << "  Enter \'spill\' you wish to view" << endl;
  cout << "  Enter \'spill/slice\' you wish to view" << endl;
  cout << "  add a 'cX' to any command to make a min pe cut on display" << endl;
  cout << "     -Ex.  131c1.5  or  250/3c2.5" << endl; 
  cout << "  'p' to print the current display to .jpg" << endl;
  cout << "  'q' to exit and make current display an active canvas" << endl;
  cout << "  'n' to get the next slice " << endl;

  cin.getline( junk, length, '\n');
  cin.clear();

  //-- loop over and find '/'
  for( i = 0; i < length; i++ ){
    if( junk[i] == '/' ){
      del1 = i;
      continue;
    }
  }

  //-- loop over and find 'c'
  for( i = 0; i < length; i++ ){
    if( junk[i] == 'c' ){
      del2 = i;
      continue;
    }
  }

  //-- fill spill number before / or c
  for( i = 0; i < del1 && i < del2; i++ )
    evstr[i] = junk[i];

  //-- slice is between / and c
  for( i = del1+1; i < del2; i++ )
    slstr[i-(del1+1)] = junk[i];
 
  //-- cut is after c
  for( i = del2+1; i < length; i++ )
    cutstr[i-(del2+1)] = junk[i];
  
  if( evstr[0] == 'p' ) return -2;
  if( evstr[0] == 'q' ) return -1;

  // -- just show the next slice;
  if( evstr[0] == 'n' ) {
    slice++;
    return -99;
  }
  else{
    slice = -1;
  }
  int ev = atoi(evstr);
  if( del1 < length-1 )
    slice = atoi(slstr);
  if( del2 < length-1 )
    pe_cut = atof(cutstr);
  
  return ev;
 
}


//#####################################################################################
//
// END
//
//#####################################################################################
