import http.server, socketserver, os
os.chdir('/Users/ledeng/projects/Sealshot-Website/dist')
socketserver.TCPServer.allow_reuse_address = True
socketserver.TCPServer(("", 8783), http.server.SimpleHTTPRequestHandler).serve_forever()
