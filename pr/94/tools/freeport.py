# Port for a test's own local web server: ST_PORT if set, otherwise a free port chosen by the system,
# so another app's server already on 8765 or 8799 cannot make a test load the wrong page.
import os,socket
def get():
    p=os.environ.get('ST_PORT')
    if p:return str(int(p))
    s=socket.socket();s.bind(('127.0.0.1',0));n=s.getsockname()[1];s.close();return str(n)
