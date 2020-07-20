//
// Code for the Arachne Event Display
// Author: Nathaniel Tagg ntagg@otterbein.edu
// 
// Licence: this code is free for non-commertial use. Note other licences may apply to 3rd-party code.
// Any use of this code must include attribution to Nathaniel Tagg at Otterbein University, but otherwise 
// you're free to modify and use it as you like.
//

#include <stdlib.h>
#include <stdio.h>
#include <iostream>
#include <fstream>

#include <TROOT.h>
#include <TRint.h>
#include <TStyle.h>
#include <TSystem.h>
#include <TTimeStamp.h>
#include <TError.h>
#include <signal.h>


#include <algorithm>

#include "SocketServer.h"
#include "make_json.h"


using namespace std;

// Quick and dirty option parsing, from StackOverflow.
char* getCmdOption(char ** begin, char ** end, const std::string & option)
{
    char ** itr = std::find(begin, end, option);
    if (itr != end && ++itr != end) return *itr;
    return 0;
}

bool cmdOptionExists(char** begin, char** end, const std::string& option)
{
    return std::find(begin, end, option) != end;
}


VoidFuncPtr_t initfuncs[] = { 0 };
TROOT root("Rint", "The ROOT Interactive Interface", initfuncs);
void MyErrorHandler(int level, Bool_t abort, const char *location, const char *msg);
void TerminationHandler(int signal);

class MySocketServer : public SocketServer{
public:
  MySocketServer( int port ) : SocketServer(port) {};
  virtual ~MySocketServer() {};
  
  size_t SufficientData( const unsigned char* inData, size_t inSize, size_t inMaxSize) 
  { 
    static char options[100];
    static char filename[990];
    static char selection[990];
    Long64_t entrystart;
    Long64_t entryend;
    int bytes;
    int r =  sscanf((char*)inData,"%99[^,\n],%900[^,\n],%900[^,\n],%lld,%lld\n%n",options,filename,selection,&entrystart,&entryend,&bytes);
    if(r==5) return bytes;
    return 0;
  };
};

bool isChild = false;
int  childClient = -1;
MySocketServer* ss = 0;



int main(int argc, char **argv)
{
  // try{

  int tcpPortNumber = 9090;
  bool forking_ = true;

  std::string progname = argv[0];
  
  if(cmdOptionExists(argv, argv+argc, "-h")) {
    cout << "Usage:" <<endl;
    cout << "  -h         help" << endl;
    cout << "  -p <port>  set listener port " << endl;
    cout << "  -n         no forking (for profiling) " << endl;
    return 0;
  }
  if(cmdOptionExists(argv, argv+argc, "-n")) {
    forking_ = false;
  }

  char * filename = getCmdOption(argv, argv + argc, "-p");
  if (filename) sscanf(filename,"%d",&tcpPortNumber);
  
  // termination handling.
  signal (SIGINT, TerminationHandler);
  signal (SIGHUP, TerminationHandler);
  signal (SIGTERM, TerminationHandler);
  signal ( SIGBUS, TerminationHandler);
  signal ( SIGSEGV, TerminationHandler);
  signal ( SIGILL, TerminationHandler);
  signal ( SIGFPE, TerminationHandler);
  signal (SIGCHLD, SIG_IGN);  // Ignore when a child dies - don't need to wait() or waitpid()
  
  cout << "ntuple-server starting up at " <<  TTimeStamp().AsString() << " on port " << tcpPortNumber << " with forking " << (forking_?"on":"off") << endl;
  
  SetErrorHandler(MyErrorHandler);

  ss = new MySocketServer(tcpPortNumber);
  if(ss->Setup()) exit(1);  // Quit if socket won't bind.

  // write a PID file.
  {
    ofstream pidfile("ntuple-server.pid");
    pidfile << gSystem->GetPid();
    pidfile.close();
  }

  gTimeStart = gSystem->Now();
  gEventsServed = 0;

  while (1) {
    //cout << ".";
    //cout.flush();
    ss->CheckForBadClients();
    
    unsigned char* dataRecvd;
    int   client;
    bool  newClient;
    ss->Listen(100., // seconds timeout
              1000, // bytes max
              dataRecvd, // data recieved in message
              client,    // fd number of client.
              newClient  // true if a new client connected.
              );
    if(newClient) {
      cout << "New client " << client << endl;
    }
    
    if(dataRecvd) {
      // Try to parse format of FILENAME,GATE\n
      char options[100];
      char filename[990];
      char selection[990];
      Long64_t entrystart;
      Long64_t entryend;
      int r =  sscanf((char*)dataRecvd,"%99[^,\n],%900[^,\n],%900[^,\n],%lld,%lld\n",options,filename,selection,&entrystart,&entryend);
      if(r==5) {
        //Successful conversion. Give it a try.
        cout << "Got a valid request at " << TTimeStamp().AsString() << endl;                  
        // fork a process to cope.
        pid_t pid = 0;
        if(forking_) pid = fork();          
        if(pid ==0) {
          if(forking_) { isChild=true; childClient = client; }
          long long unsigned int mypid = getpid();
          // pid=0 either means no forking, or we're the child process
          std::string logfilename = "ntuple_server_fork_" + std::to_string(mypid) + ".log";
          if(forking_) {
            std::cout << "Serving by child process: " << mypid << "  filename " << logfilename << std::endl;
            
            // freopen(logfilename.c_str(),"a",stdout);
            // freopen(logfilename.c_str(),"a",stderr);
          }
          cout << "Got a valid request at " << TTimeStamp().AsString() << endl;
          cout << "    Filename: --" << filename << "--" << endl;
          cout << "    Selection:--" << selection << "--" << endl;
          cout << "    From:     --" << entrystart << " to " << entryend << endl;
          cout << "    Options:  --" << options << endl;
          
          
          // Now do your stuff.
          std::string json = make_json(options,filename,selection,entrystart,entryend);
          cerr << "Composed with " << json.length() << " bytes."<< endl;

          // Send it out.
          ss->SendTo(client, (unsigned char*)json.c_str(),  json.length() );
          cerr << "Request served." << endl;
          ss->Close(client);
          if(forking_) _exit(0);
        }
        close(client);
        ss->RemoveClient(client);
        gEventsServed++;
      }
    }
  }
}

void TerminationHandler(int signal)
{
  cerr << "Received signal " << signal << ". Shutting down the server.\n";
  if(isChild) {
    cerr << "Closing client " << childClient << "\n";
    if(childClient>-1) {
      std::string errormsg("{\"error\":\"Backend crashed hard when reading this event. Maybe a bad input file?\"}\n");
      ss->SendTo(childClient, (unsigned char*)errormsg.c_str(), errormsg.length() );
      close(childClient);
    }
    _exit(1);
  } else {
    if(ss) delete ss;// Shut down the socket server cleanly.
    ss = 0;
    exit(1);
  }
}


void MyErrorHandler(int level, Bool_t abort, const char *location, const char *msg)
{
  // Suppress warning messages about branch sets.
  TString m(msg);
  if(m.BeginsWith("unknown branch")) return;
  
  DefaultErrorHandler(level, abort, location, msg);
//  exit(1);
}
