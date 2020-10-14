
//
// Fills the 'scanner_inbox' table with events (gates+slices) from the 
// file requested.
// Returns number of slices that have been assigned.
//
// Can be run interpreted or compiled.
//
// May need to do one or both of these before running:
//  .include /usr/include/mysql
//  gSystem->Load("libMySQL");

#include <TFile.h>
#include <TTree.h>
#include <TMySQLServer.h>
#include <iostream>
using namespace std;

//const char* kServer = "mysql://neutrino.otterbein.edu/minervascan";
//const char* kUser = "scanner";
//const char* kPass = "axial";
const char* kServer = "mysql://minerva05.fnal.gov/arachne";
const char* kUser = "ntagg";
const char* kPass = "Eedase1o";

Long64_t populate_inbox(
                    const char* inUserName = "Anonymous Coward",
                    const char* inFilename = "./TP_00000580_0004_numib_v04_0905310748_DST_v6r2p1.root",
                    const int inStartGate = 0,
                    const int inEndGate = 999999999
                    )
{
  // Try to open the file.
  TFile f(inFilename);
  if(!f.IsOpen()) {
    cerr << "Cannot open file " << inFilename << " for reading. Aborting."  << endl;
    return 0;
  }
  
  TTree* tree = (TTree*)(f.Get("minerva"));
  if(!tree) {
    cerr << "Cannot open ntuple on file " << inFilename << "  Aborting."  << endl;
    return 0;
  }
 
  // Connect to database.
  TSQLServer *db = TSQLServer::Connect(kServer,kUser,kPass);
  if(db==0 || !db->IsConnected()) {
    cerr << "Cannot connect to database with " << kServer << " " << kUser << " " << kPass << " Aborting." << endl;
    return 0;
  }
  
  // Create statement instance.
  TSQLStatement* stmt = db->Statement(
    Form("INSERT INTO scanner_inbox (user_name, run, subrun, gate, slice) VALUES ('%s',?,?,?,?)",inUserName)
    );
                      
  // Set up some fields to read.
  tree->SetMakeClass(1);
  tree->SetBranchStatus("*",0); // Speedup: don't read fields we dont need.
  // Load this branch                    Declare variable     Tell it to load branch to the variable
  tree->SetBranchStatus("ev_run",1);     Int_t ev_run;     tree->SetBranchAddress("ev_run"     , &ev_run);      
  tree->SetBranchStatus("ev_sub_run",1); Int_t ev_sub_run; tree->SetBranchAddress("ev_sub_run" , &ev_sub_run);  
  tree->SetBranchStatus("ev_gate",1);    Int_t ev_gate;    tree->SetBranchAddress("ev_gate"    , &ev_gate);     
  tree->SetBranchStatus("n_slices",1);   Int_t n_slices;   tree->SetBranchAddress("n_slices"   , &n_slices);    
  
  Long64_t nentries = tree->GetEntriesFast();
  Long64_t inboxed = 0; // Total entries given to the user for this call.

  // Loop through gates in the file.
  for (Long64_t jentry=0; jentry<nentries;jentry++) {
    tree->GetEntry(jentry);
    // Debugging printout:
    // cout << ev_run << "/" << ev_sub_run << "/" << ev_gate  << endl;
    if(ev_gate < inStartGate) continue;
    if(ev_gate > inEndGate) break;
    for(int slice=1;slice<=n_slices;slice++) {
      
      // Make cuts here as appropriate.
      
      // Debugging printout:
      // cout << ev_run << "/" << ev_sub_run << "/" << ev_gate << "/" << slice << endl;
      if(stmt->NextIteration()) {
        stmt->SetInt(0,ev_run);
        stmt->SetInt(1,ev_sub_run);
        stmt->SetInt(2,ev_gate);
        stmt->SetInt(3,slice);
        inboxed++;        
      }

    }
  }
  stmt->Process();
  cout << "Added " << inboxed << " entries to " << inUserName << " inbox." << endl;
  return inboxed;
}
