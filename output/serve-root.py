# Serves the REPO ROOT (not dist) on :8783, so output/print/testing-manual.html
# and its img/ + paged.polyfill.js resolve without copying anything into dist.
import http.server, socketserver, os
os.chdir('/Users/ledeng/projects/Sealshot-Website')
socketserver.TCPServer.allow_reuse_address = True
socketserver.TCPServer(("", 8783), http.server.SimpleHTTPRequestHandler).serve_forever()
