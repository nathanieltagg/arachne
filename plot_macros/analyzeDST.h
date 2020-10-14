#ifndef analyzeDST_h
#define analyzeDST_h

#include <TROOT.h>
#include <TChain.h>
#include <TFile.h>
#include <TCanvas.h>

class analyzeDST {
public :
   TTree          *fChain;   //!pointer to the analyzed TTree or TChain
   Int_t           fCurrent; //!current Tree number in a TChain

   // Declaration of leaf types
   Int_t           ev_detector;
   Int_t           ev_det_config;
   Int_t           ev_run;
   Int_t           ev_sub_run;
   Int_t           ev_trigger_type;
   Int_t           ev_cal_settings;
   Int_t           ev_gl_gate;
   Int_t           ev_gate;
   Int_t           ev_gps_time_sec;
   Int_t           ev_gps_time_usec;
   Int_t           ev_readout;
   Int_t           ev_errors;
   Int_t           n_febs;
   Int_t           feb_id[1000];   //[n_febs]
   Int_t           feb_hv_on[1000];   //[n_febs]
   Int_t           feb_hv_targ[1000];   //[n_febs]
   Int_t           feb_hv_act[1000];   //[n_febs]
   Int_t           feb_hv_per_man[1000];   //[n_febs]
   Int_t           feb_hv_per_auto[1000];   //[n_febs]
   Int_t           n_rawhits;
   Int_t           hit_feb_id[10000];   //[n_rawhits]
   Int_t           hit_channel_id[10000];   //[n_rawhits]
   Int_t           hit_index[10000];   //[n_rawhits]
   Int_t           hit_location[10000];   //[n_rawhits]
   Int_t           hit_num[10000];   //[n_rawhits]
   Int_t           hit_pixel[10000];   //[n_rawhits]
   Int_t           hit_board[10000];   //[n_rawhits]
   Int_t           hit_chain[10000];   //[n_rawhits]
   Int_t           hit_croc[10000];   //[n_rawhits]
   Int_t           hit_crate[10000];   //[n_rawhits]
   Int_t           hit_link[10000];   //[n_rawhits]
   Int_t           hit_disc_fired[10000];   //[n_rawhits]
   Int_t           hit_sys_ticks[10000];   //[n_rawhits]
   Int_t           hit_delay_ticks[10000];   //[n_rawhits]
   Int_t           hit_quarter_ticks[10000];   //[n_rawhits]
   Int_t           hit_qlo[10000];   //[n_rawhits]
   Int_t           hit_qmed[10000];   //[n_rawhits]
   Int_t           hit_qhi[10000];   //[n_rawhits]
   Int_t           n_idhits;
   Float_t         hits_id_per_mod;
   Int_t           hit_strip[10000];   //[n_rawhits]
   Int_t           hit_plane[10000];   //[n_rawhits]
   Int_t           hit_module[10000];   //[n_rawhits]
   Int_t           hit_view[10000];   //[n_rawhits]
   Int_t           n_odhits;
   Float_t         hits_od_per_mod;
   Int_t           hit_bar[10000];   //[n_rawhits]
   Int_t           hit_story[10000];   //[n_rawhits]
   Int_t           hit_tower[10000];   //[n_rawhits]
   Int_t           hit_frame[10000];   //[n_rawhits]
   Int_t           n_slices;
   Float_t         hit_pe_raw[10000];   //[n_rawhits]
   Float_t         hit_pe_cal[10000];   //[n_rawhits]
   Float_t         hit_time[10000];   //[n_rawhits]
   Int_t           hit_time_slice[10000];   //[n_rawhits]
   Float_t         hits_total_pe;
   Int_t           n_clusters;
   Int_t           clus_index[200];   //[n_clusters]
   Int_t           clus_strip[200];   //[n_clusters]
   Int_t           clus_module[200];   //[n_clusters]
   Float_t         clus_coord[200];   //[n_clusters]
   Float_t         clus_z[200];   //[n_clusters]
   Int_t           clus_view[200];   //[n_clusters]
   Float_t         clus_pe[200];   //[n_clusters]
   Float_t         clus_time[200];   //[n_clusters]
   Int_t           clus_time_slice[200];   //[n_clusters]
   Int_t           clus_size[200];   //[n_clusters]
   Int_t           clus_hits_idx[200][10];   //[n_clusters]
   Int_t           n_tracks;
   Int_t           trk_index[50];   //[n_tracks]
   Int_t           trk_hits[50];   //[n_tracks]
   Int_t           trk_dof[50];   //[n_tracks]
   Float_t         trk_chi2perDof[50];   //[n_tracks]
   Int_t           trk_nodes[50];   //[n_tracks]
   Float_t         trk_node_X[50][50];   //[n_tracks]
   Float_t         trk_node_Y[50][50];   //[n_tracks]
   Float_t         trk_node_Z[50][50];   //[n_tracks]
   Float_t         trk_node_aX[50][50];   //[n_tracks]
   Float_t         trk_node_aY[50][50];   //[n_tracks]
   Float_t         trk_node_qOverP[50][50];   //[n_tracks]
   Float_t         trk_node_chi2[50][50];   //[n_tracks]
   Int_t           trk_node_cluster_idx[50][50];   //[n_tracks]
   Int_t           n_minos_trks;
   Int_t           minos_trk_ns[50];   //[n_minos_trks]
   Int_t           minos_run;
   Int_t           minos_subrun;
   Int_t           minos_snarl;
   Int_t           minos_trk_num[50];   //[n_minos_trks]
   Float_t         minos_trk_pass[50];   //[n_minos_trks]
   Float_t         minos_trk_chi2[50];   //[n_minos_trks]
   Float_t         minos_trk_ndf[50];   //[n_minos_trks]
   Float_t         minos_trk_bave[50];   //[n_minos_trks]
   Float_t         minos_trk_range[50];   //[n_minos_trks]
   Int_t           minos_trk_con[50];   //[n_minos_trks]
   Float_t         minos_trk_p[50];   //[n_minos_trks]
   Float_t         minos_trk_prange[50];   //[n_minos_trks]
   Float_t         minos_trk_qp[50];   //[n_minos_trks]
   Float_t         minos_trk_eqp[50];   //[n_minos_trks]
   Int_t           minos_trk_vtxp[50];   //[n_minos_trks]
   Float_t         minos_trk_vtxu[50];   //[n_minos_trks]
   Float_t         minos_trk_vtxv[50];   //[n_minos_trks]
   Float_t         minos_trk_vtxz[50];   //[n_minos_trks]
   Float_t         minos_trk_vtxt[50];   //[n_minos_trks]
   Float_t         minos_trk_vtxdcosu[50];   //[n_minos_trks]
   Float_t         minos_trk_vtxdcosv[50];   //[n_minos_trks]
   Float_t         minos_trk_vtxdcosz[50];   //[n_minos_trks]
   Int_t           minos_trk_endp[50];   //[n_minos_trks]
   Float_t         minos_trk_endu[50];   //[n_minos_trks]
   Float_t         minos_trk_endv[50];   //[n_minos_trks]
   Float_t         minos_trk_endz[50];   //[n_minos_trks]
   Float_t         minos_trk_endt[50];   //[n_minos_trks]
   Float_t         minos_trk_enddcosu[50];   //[n_minos_trks]
   Float_t         minos_trk_enddcosv[50];   //[n_minos_trks]
   Float_t         minos_trk_enddcosz[50];   //[n_minos_trks]
   Int_t           minos_trk_stp_fit[50][564];   //[n_minos_trks]
   Float_t         minos_trk_stp_u[50][564];   //[n_minos_trks]
   Float_t         minos_trk_stp_v[50][564];   //[n_minos_trks]
   Float_t         minos_trk_stp_z[50][564];   //[n_minos_trks]
   Float_t         minos_trk_stp_t[50][564];   //[n_minos_trks]
   Float_t         minos_trk_stp_meu[50][564];   //[n_minos_trks]

   // List of branches
   TBranch        *b_ev_detector;   //!
   TBranch        *b_ev_det_config;   //!
   TBranch        *b_ev_run;   //!
   TBranch        *b_ev_sub_run;   //!
   TBranch        *b_ev_trigger_type;   //!
   TBranch        *b_ev_cal_settings;   //!
   TBranch        *b_ev_gl_gate;   //!
   TBranch        *b_ev_gate;   //!
   TBranch        *b_ev_gps_time_sec;   //!
   TBranch        *b_ev_gps_time_usec;   //!
   TBranch        *b_ev_readout;   //!
   TBranch        *b_ev_errors;   //!
   TBranch        *b_n_febs;   //!
   TBranch        *b_feb_id;   //!
   TBranch        *b_feb_hv_on;   //!
   TBranch        *b_feb_hv_targ;   //!
   TBranch        *b_feb_hv_act;   //!
   TBranch        *b_feb_hv_per_man;   //!
   TBranch        *b_feb_hv_per_auto;   //!
   TBranch        *b_n_rawhits;   //!
   TBranch        *b_hit_feb_id;   //!
   TBranch        *b_hit_channel_id;   //!
   TBranch        *b_hit_index;   //!
   TBranch        *b_hit_location;   //!
   TBranch        *b_hit_num;   //!
   TBranch        *b_hit_pixel;   //!
   TBranch        *b_hit_board;   //!
   TBranch        *b_hit_chain;   //!
   TBranch        *b_hit_croc;   //!
   TBranch        *b_hit_crate;   //!
   TBranch        *b_hit_link;   //!
   TBranch        *b_hit_disc_fired;   //!
   TBranch        *b_hit_sys_ticks;   //!
   TBranch        *b_hit_delay_ticks;   //!
   TBranch        *b_hit_quarter_ticks;   //!
   TBranch        *b_hit_qlo;   //!
   TBranch        *b_hit_qmed;   //!
   TBranch        *b_hit_qhi;   //!
   TBranch        *b_n_idhits;   //!
   TBranch        *b_hits_id_per_mod;   //!
   TBranch        *b_hit_strip;   //!
   TBranch        *b_hit_plane;   //!
   TBranch        *b_hit_module;   //!
   TBranch        *b_hit_view;   //!
   TBranch        *b_n_odhits;   //!
   TBranch        *b_hits_od_per_mod;   //!
   TBranch        *b_hit_bar;   //!
   TBranch        *b_hit_story;   //!
   TBranch        *b_hit_tower;   //!
   TBranch        *b_hit_frame;   //!
   TBranch        *b_n_slices;   //!
   TBranch        *b_hit_pe_raw;   //!
   TBranch        *b_hit_pe_cal;   //!
   TBranch        *b_hit_time;   //!
   TBranch        *b_hit_time_slice;   //!
   TBranch        *b_hits_total_pe;   //!
   TBranch        *b_n_clusters;   //!
   TBranch        *b_clus_index;   //!
   TBranch        *b_clus_strip;   //!
   TBranch        *b_clus_module;   //!
   TBranch        *b_clus_coord;   //!
   TBranch        *b_clus_z;   //!
   TBranch        *b_clus_view;   //!
   TBranch        *b_clus_pe;   //!
   TBranch        *b_clus_time;   //!
   TBranch        *b_clus_time_slice;   //!
   TBranch        *b_clus_size;   //!
   TBranch        *b_clus_hits_idx;   //!
   TBranch        *b_n_tracks;   //!
   TBranch        *b_trk_index;   //!
   TBranch        *b_trk_hits;   //!
   TBranch        *b_trk_dof;   //!
   TBranch        *b_trk_chi2perDof;   //!
   TBranch        *b_trk_nodes;   //!
   TBranch        *b_trk_node_X;   //!
   TBranch        *b_trk_node_Y;   //!
   TBranch        *b_trk_node_Z;   //!
   TBranch        *b_trk_node_aX;   //!
   TBranch        *b_trk_node_aY;   //!
   TBranch        *b_trk_node_qOverP;   //!
   TBranch        *b_trk_node_chi2;   //!
   TBranch        *b_trk_node_cluster_idx;   //!
   TBranch        *b_n_minos_trks;   //!
   TBranch        *b_minos_trk_ns;   //!
   TBranch        *b_minos_run;   //!
   TBranch        *b_minos_subrun;   //!
   TBranch        *b_minos_snarl;   //!
   TBranch        *b_minos_trk_num;   //!
   TBranch        *b_minos_trk_pass;   //!
   TBranch        *b_minos_trk_chi2;   //!
   TBranch        *b_minos_trk_ndf;   //!
   TBranch        *b_minos_trk_bave;   //!
   TBranch        *b_minos_trk_range;   //!
   TBranch        *b_minos_trk_con;   //!
   TBranch        *b_minos_trk_p;   //!
   TBranch        *b_minos_trk_prange;   //!
   TBranch        *b_minos_trk_qp;   //!
   TBranch        *b_minos_trk_eqp;   //!
   TBranch        *b_minos_trk_vtxp;   //!
   TBranch        *b_minos_trk_vtxu;   //!
   TBranch        *b_minos_trk_vtxv;   //!
   TBranch        *b_minos_trk_vtxz;   //!
   TBranch        *b_minos_trk_vtxt;   //!
   TBranch        *b_minos_trk_vtxdcosu;   //!
   TBranch        *b_minos_trk_vtxdcosv;   //!
   TBranch        *b_minos_trk_vtxdcosz;   //!
   TBranch        *b_minos_trk_endp;   //!
   TBranch        *b_minos_trk_endu;   //!
   TBranch        *b_minos_trk_endv;   //!
   TBranch        *b_minos_trk_endz;   //!
   TBranch        *b_minos_trk_endt;   //!
   TBranch        *b_minos_trk_enddcosu;   //!
   TBranch        *b_minos_trk_enddcosv;   //!
   TBranch        *b_minos_trk_enddcosz;   //!
   TBranch        *b_minos_trk_stp_fit;   //!
   TBranch        *b_minos_trk_stp_u;   //!
   TBranch        *b_minos_trk_stp_v;   //!
   TBranch        *b_minos_trk_stp_z;   //!
   TBranch        *b_minos_trk_stp_t;   //!
   TBranch        *b_minos_trk_stp_meu;   //!

   analyzeDST(char* filename);
   virtual ~analyzeDST();
   virtual Int_t    Cut(Long64_t entry);
   virtual Int_t    GetEntry(Long64_t entry);
   virtual Long64_t LoadTree(Long64_t entry);
   virtual void     Init(TTree *tree);
   virtual void     Loop();
   virtual Bool_t   Notify();
   virtual void     Show(Long64_t entry = -1);
   virtual void     add_plot_label( char* label, double x, double y, double size = 0.05, int color = 1 );
   virtual void     set_root_env( );

   //-- EventDisplay
   virtual void     LoopEventDisplay(int first_event = 1, int num_events = 10, int num_modules = 24, int first_module = 74,
				     bool show_clusters = false, bool print_files = false, bool pause_between = false,
				     double Cx = 1200, double Cy = 800 );

   virtual void     PauseEventDisplay(double pe_cut = 0, int num_modules = 24, int first_module = 74, 
				      bool show_clusters = false, bool print_files = false, double Cx = 1200, double Cy = 800 );

   virtual void     event_display( const int gate, int slice = -1, double pe_cut = 0, double maxPE = 35, 
				   bool show_clusters = false, bool print_files = false, int num_modules = 24, 
				   int first_module = 74, TCanvas *cEventDisplay = NULL,
				   double Cx = 1200, double Cy = 800 );

   virtual void     set_color_pallete();
   virtual int      pause( int &slice, double &pe_cut );

   //-- EnergyCalib
   virtual void     LoopClusterPEs(char* label = "", int first_event = 1, int num_events = 10000000, 
				   int num_modules = 24, bool print_files = false );

   //-- TimeCalib
   virtual void     LoopTimeCalib(int first_event = 1, int num_events = 10000000, int croc = 0, int chain1 = 0, 
				  int chain2 = 1, double tmax = 18, bool print_files = false );
 
   virtual void     raw_data( int event );

 private:

   char* words;
   char* words2;

};

#endif

#ifdef analyzeDST_cxx


//== constructor
analyzeDST::analyzeDST( char* filename ){

  TFile *f = new TFile(filename);
  tree = (TTree*)f->Get("minerva");

  words = new char[1000];
  words2 = new char[1000];


  if (tree == 0) {
  
    cout << "must specify a DST input file with a Tree labeled minerva" << endl;

   }
   Init(tree);
}

//== destructor
analyzeDST::~analyzeDST()
{
   if (!fChain) return;
   delete fChain->GetCurrentFile();
}


Int_t analyzeDST::GetEntry(Long64_t entry)
{
// Read contents of entry.
   if (!fChain) return 0;
   return fChain->GetEntry(entry);
}
Long64_t analyzeDST::LoadTree(Long64_t entry)
{
// Set the environment to read one entry
   if (!fChain) return -5;
   Long64_t centry = fChain->LoadTree(entry);
   if (centry < 0) return centry;
   if (!fChain->InheritsFrom(TChain::Class()))  return centry;
   TChain *chain = (TChain*)fChain;
   if (chain->GetTreeNumber() != fCurrent) {
      fCurrent = chain->GetTreeNumber();
      Notify();
   }
   return centry;
}

void analyzeDST::Init(TTree *tree)
{
   // The Init() function is called when the selector needs to initialize
   // a new tree or chain. Typically here the branch addresses and branch
   // pointers of the tree will be set.
   // It is normally not necessary to make changes to the generated
   // code, but the routine can be extended by the user if needed.
   // Init() will be called many times when running on PROOF
   // (once per file to be processed).

   // Set branch addresses and branch pointers
   if (!tree) return;
   fChain = tree;
   fCurrent = -1;
   fChain->SetMakeClass(1);

   fChain->SetBranchAddress("ev_detector", &ev_detector, &b_ev_detector);
   fChain->SetBranchAddress("ev_det_config", &ev_det_config, &b_ev_det_config);
   fChain->SetBranchAddress("ev_run", &ev_run, &b_ev_run);
   fChain->SetBranchAddress("ev_sub_run", &ev_sub_run, &b_ev_sub_run);
   fChain->SetBranchAddress("ev_trigger_type", &ev_trigger_type, &b_ev_trigger_type);
   fChain->SetBranchAddress("ev_cal_settings", &ev_cal_settings, &b_ev_cal_settings);
   fChain->SetBranchAddress("ev_gl_gate", &ev_gl_gate, &b_ev_gl_gate);
   fChain->SetBranchAddress("ev_gate", &ev_gate, &b_ev_gate);
   fChain->SetBranchAddress("ev_gps_time_sec", &ev_gps_time_sec, &b_ev_gps_time_sec);
   fChain->SetBranchAddress("ev_gps_time_usec", &ev_gps_time_usec, &b_ev_gps_time_usec);
   fChain->SetBranchAddress("ev_readout", &ev_readout, &b_ev_readout);
   fChain->SetBranchAddress("ev_errors", &ev_errors, &b_ev_errors);
   fChain->SetBranchAddress("n_febs", &n_febs, &b_n_febs);
   fChain->SetBranchAddress("feb_id", feb_id, &b_feb_id);
   fChain->SetBranchAddress("feb_hv_on", feb_hv_on, &b_feb_hv_on);
   fChain->SetBranchAddress("feb_hv_targ", feb_hv_targ, &b_feb_hv_targ);
   fChain->SetBranchAddress("feb_hv_act", feb_hv_act, &b_feb_hv_act);
   fChain->SetBranchAddress("feb_hv_per_man", feb_hv_per_man, &b_feb_hv_per_man);
   fChain->SetBranchAddress("feb_hv_per_auto", feb_hv_per_auto, &b_feb_hv_per_auto);
   fChain->SetBranchAddress("n_rawhits", &n_rawhits, &b_n_rawhits);
   fChain->SetBranchAddress("hit_feb_id", hit_feb_id, &b_hit_feb_id);
   fChain->SetBranchAddress("hit_channel_id", hit_channel_id, &b_hit_channel_id);
   fChain->SetBranchAddress("hit_index", hit_index, &b_hit_index);
   fChain->SetBranchAddress("hit_location", hit_location, &b_hit_location);
   fChain->SetBranchAddress("hit_num", hit_num, &b_hit_num);
   fChain->SetBranchAddress("hit_pixel", hit_pixel, &b_hit_pixel);
   fChain->SetBranchAddress("hit_board", hit_board, &b_hit_board);
   fChain->SetBranchAddress("hit_chain", hit_chain, &b_hit_chain);
   fChain->SetBranchAddress("hit_croc", hit_croc, &b_hit_croc);
   fChain->SetBranchAddress("hit_crate", hit_crate, &b_hit_crate);
   fChain->SetBranchAddress("hit_link", hit_link, &b_hit_link);
   fChain->SetBranchAddress("hit_disc_fired", hit_disc_fired, &b_hit_disc_fired);
   fChain->SetBranchAddress("hit_sys_ticks", hit_sys_ticks, &b_hit_sys_ticks);
   fChain->SetBranchAddress("hit_delay_ticks", hit_delay_ticks, &b_hit_delay_ticks);
   fChain->SetBranchAddress("hit_quarter_ticks", hit_quarter_ticks, &b_hit_quarter_ticks);
   fChain->SetBranchAddress("hit_qlo", hit_qlo, &b_hit_qlo);
   fChain->SetBranchAddress("hit_qmed", hit_qmed, &b_hit_qmed);
   fChain->SetBranchAddress("hit_qhi", hit_qhi, &b_hit_qhi);
   fChain->SetBranchAddress("n_idhits", &n_idhits, &b_n_idhits);
   fChain->SetBranchAddress("hits_id_per_mod", &hits_id_per_mod, &b_hits_id_per_mod);
   fChain->SetBranchAddress("hit_strip", hit_strip, &b_hit_strip);
   fChain->SetBranchAddress("hit_plane", hit_plane, &b_hit_plane);
   fChain->SetBranchAddress("hit_module", hit_module, &b_hit_module);
   fChain->SetBranchAddress("hit_view", hit_view, &b_hit_view);
   fChain->SetBranchAddress("n_odhits", &n_odhits, &b_n_odhits);
   fChain->SetBranchAddress("hits_od_per_mod", &hits_od_per_mod, &b_hits_od_per_mod);
   fChain->SetBranchAddress("hit_bar", hit_bar, &b_hit_bar);
   fChain->SetBranchAddress("hit_story", hit_story, &b_hit_story);
   fChain->SetBranchAddress("hit_tower", hit_tower, &b_hit_tower);
   fChain->SetBranchAddress("hit_frame", hit_frame, &b_hit_frame);
   fChain->SetBranchAddress("n_slices", &n_slices, &b_n_slices);
   fChain->SetBranchAddress("hit_pe_raw", hit_pe_raw, &b_hit_pe_raw);
   fChain->SetBranchAddress("hit_pe_cal", hit_pe_cal, &b_hit_pe_cal);
   fChain->SetBranchAddress("hit_time", hit_time, &b_hit_time);
   fChain->SetBranchAddress("hit_time_slice", hit_time_slice, &b_hit_time_slice);
   fChain->SetBranchAddress("hits_total_pe", &hits_total_pe, &b_hits_total_pe);
   fChain->SetBranchAddress("n_clusters", &n_clusters, &b_n_clusters);
   fChain->SetBranchAddress("clus_index", clus_index, &b_clus_index);
   fChain->SetBranchAddress("clus_strip", clus_strip, &b_clus_strip);
   fChain->SetBranchAddress("clus_module", clus_module, &b_clus_module);
   fChain->SetBranchAddress("clus_coord", clus_coord, &b_clus_coord);
   fChain->SetBranchAddress("clus_z", clus_z, &b_clus_z);
   fChain->SetBranchAddress("clus_view", clus_view, &b_clus_view);
   fChain->SetBranchAddress("clus_pe", clus_pe, &b_clus_pe);
   fChain->SetBranchAddress("clus_time", clus_time, &b_clus_time);
   fChain->SetBranchAddress("clus_time_slice", clus_time_slice, &b_clus_time_slice);
   fChain->SetBranchAddress("clus_size", clus_size, &b_clus_size);
   fChain->SetBranchAddress("clus_hits_idx", clus_hits_idx, &b_clus_hits_idx);
   fChain->SetBranchAddress("n_tracks", &n_tracks, &b_n_tracks);
   fChain->SetBranchAddress("trk_index", trk_index, &b_trk_index);
   fChain->SetBranchAddress("trk_hits", trk_hits, &b_trk_hits);
   fChain->SetBranchAddress("trk_dof", trk_dof, &b_trk_dof);
   fChain->SetBranchAddress("trk_chi2perDof", trk_chi2perDof, &b_trk_chi2perDof);
   fChain->SetBranchAddress("trk_nodes", trk_nodes, &b_trk_nodes);
   fChain->SetBranchAddress("trk_node_X", trk_node_X, &b_trk_node_X);
   fChain->SetBranchAddress("trk_node_Y", trk_node_Y, &b_trk_node_Y);
   fChain->SetBranchAddress("trk_node_Z", trk_node_Z, &b_trk_node_Z);
   fChain->SetBranchAddress("trk_node_aX", trk_node_aX, &b_trk_node_aX);
   fChain->SetBranchAddress("trk_node_aY", trk_node_aY, &b_trk_node_aY);
   fChain->SetBranchAddress("trk_node_qOverP", trk_node_qOverP, &b_trk_node_qOverP);
   fChain->SetBranchAddress("trk_node_chi2", trk_node_chi2, &b_trk_node_chi2);
   fChain->SetBranchAddress("trk_node_cluster_idx", trk_node_cluster_idx, &b_trk_node_cluster_idx);
   fChain->SetBranchAddress("n_minos_trks", &n_minos_trks, &b_n_minos_trks);
   fChain->SetBranchAddress("minos_trk_ns", minos_trk_ns, &b_minos_trk_ns);
   fChain->SetBranchAddress("minos_run", &minos_run, &b_minos_run);
   fChain->SetBranchAddress("minos_subrun", &minos_subrun, &b_minos_subrun);
   fChain->SetBranchAddress("minos_snarl", &minos_snarl, &b_minos_snarl);
   fChain->SetBranchAddress("minos_trk_num", minos_trk_num, &b_minos_trk_num);
   fChain->SetBranchAddress("minos_trk_pass", minos_trk_pass, &b_minos_trk_pass);
   fChain->SetBranchAddress("minos_trk_chi2", minos_trk_chi2, &b_minos_trk_chi2);
   fChain->SetBranchAddress("minos_trk_ndf", minos_trk_ndf, &b_minos_trk_ndf);
   fChain->SetBranchAddress("minos_trk_bave", minos_trk_bave, &b_minos_trk_bave);
   fChain->SetBranchAddress("minos_trk_range", minos_trk_range, &b_minos_trk_range);
   fChain->SetBranchAddress("minos_trk_con", minos_trk_con, &b_minos_trk_con);
   fChain->SetBranchAddress("minos_trk_p", minos_trk_p, &b_minos_trk_p);
   fChain->SetBranchAddress("minos_trk_prange", minos_trk_prange, &b_minos_trk_prange);
   fChain->SetBranchAddress("minos_trk_qp", minos_trk_qp, &b_minos_trk_qp);
   fChain->SetBranchAddress("minos_trk_eqp", minos_trk_eqp, &b_minos_trk_eqp);
   fChain->SetBranchAddress("minos_trk_vtxp", minos_trk_vtxp, &b_minos_trk_vtxp);
   fChain->SetBranchAddress("minos_trk_vtxu", minos_trk_vtxu, &b_minos_trk_vtxu);
   fChain->SetBranchAddress("minos_trk_vtxv", minos_trk_vtxv, &b_minos_trk_vtxv);
   fChain->SetBranchAddress("minos_trk_vtxz", minos_trk_vtxz, &b_minos_trk_vtxz);
   fChain->SetBranchAddress("minos_trk_vtxt", minos_trk_vtxt, &b_minos_trk_vtxt);
   fChain->SetBranchAddress("minos_trk_vtxdcosu", minos_trk_vtxdcosu, &b_minos_trk_vtxdcosu);
   fChain->SetBranchAddress("minos_trk_vtxdcosv", minos_trk_vtxdcosv, &b_minos_trk_vtxdcosv);
   fChain->SetBranchAddress("minos_trk_vtxdcosz", minos_trk_vtxdcosz, &b_minos_trk_vtxdcosz);
   fChain->SetBranchAddress("minos_trk_endp", minos_trk_endp, &b_minos_trk_endp);
   fChain->SetBranchAddress("minos_trk_endu", minos_trk_endu, &b_minos_trk_endu);
   fChain->SetBranchAddress("minos_trk_endv", minos_trk_endv, &b_minos_trk_endv);
   fChain->SetBranchAddress("minos_trk_endz", minos_trk_endz, &b_minos_trk_endz);
   fChain->SetBranchAddress("minos_trk_endt", minos_trk_endt, &b_minos_trk_endt);
   fChain->SetBranchAddress("minos_trk_enddcosu", minos_trk_enddcosu, &b_minos_trk_enddcosu);
   fChain->SetBranchAddress("minos_trk_enddcosv", minos_trk_enddcosv, &b_minos_trk_enddcosv);
   fChain->SetBranchAddress("minos_trk_enddcosz", minos_trk_enddcosz, &b_minos_trk_enddcosz);
   fChain->SetBranchAddress("minos_trk_stp_fit", minos_trk_stp_fit, &b_minos_trk_stp_fit);
   fChain->SetBranchAddress("minos_trk_stp_u", minos_trk_stp_u, &b_minos_trk_stp_u);
   fChain->SetBranchAddress("minos_trk_stp_v", minos_trk_stp_v, &b_minos_trk_stp_v);
   fChain->SetBranchAddress("minos_trk_stp_z", minos_trk_stp_z, &b_minos_trk_stp_z);
   fChain->SetBranchAddress("minos_trk_stp_t", minos_trk_stp_t, &b_minos_trk_stp_t);
   fChain->SetBranchAddress("minos_trk_stp_meu", minos_trk_stp_meu, &b_minos_trk_stp_meu);
   Notify();
}

Bool_t analyzeDST::Notify()
{
   // The Notify() function is called when a new file is opened. This
   // can be either for a new TTree in a TChain or when when a new TTree
   // is started when using PROOF. It is normally not necessary to make changes
   // to the generated code, but the routine can be extended by the
   // user if needed. The return value is currently not used.

   return kTRUE;
}

void analyzeDST::Show(Long64_t entry)
{
// Print contents of entry.
// If entry is not specified, print current entry
   if (!fChain) return;
   fChain->Show(entry);
}
Int_t analyzeDST::Cut(Long64_t entry)
{
// This function may be called from Loop.
// returns  1 if entry is accepted.
// returns -1 otherwise.
   return 1;
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

}

#endif // #ifdef analyzeDST_cxx
