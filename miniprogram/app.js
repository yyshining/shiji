App({ onLaunch() { require('./lib/ui').run(()=>require('./lib/store').read()); } });
