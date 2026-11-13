"""Run the paired UI budget without competing browsers or expiring servers.

The baseline directory contains the TASK24 dist whose app/style SHA256 values
are recorded in artifacts/v21-task24-origin.json. Default: /tmp/v21-task24.
"""
import functools,http.server,os,subprocess,sys,threading,socket
from pathlib import Path
servers=[]
for port,directory in [(8025,str(Path.cwd())),(8026,sys.argv[1] if len(sys.argv)>1 else '/tmp/v21-task24')]:
 with socket.socket() as probe:serving=probe.connect_ex(('localhost',port))==0
 if serving:continue
 class QuietHandler(http.server.SimpleHTTPRequestHandler):
  def log_message(self,*args):pass
 server=http.server.ThreadingHTTPServer(('localhost',port),functools.partial(QuietHandler,directory=directory));servers.append(server)
 threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 subprocess.run(['node','scripts/v21-ui-perf.cjs','paired'],env={**os.environ,'V21_PAIR_BASE':'http://localhost:8026/dist'},check=True)
finally:
 for server in servers:server.shutdown()
