var test = require('tap').test;
var bouncy = require('../');
var http = require('http');
var net = require('net');
var through = require('through2');
var concat = require('concat-stream');

test('POST with content-length', function (t) {
    t.plan(2);
    t.on('end', function () {
        b.close();
        s.close();
    });
    
    var b = bouncy(function (req, res, bounce) {
        t.equal(req.method, 'POST');
        bounce(s.address().port);
    });
    var s = http.createServer(function (req, res) {
        var size = 0;
        req.pipe(through(write, end));
        function write (buf, _, cb) {
            size += buf.length
            cb()
        }
        function end (cb) {
            var s = String(size);
            res.setHeader('content-length', s.length);
            res.end(s)
            cb()
        }
    });
    s.listen(0);
    
    b.listen(function () {
        var c = net.connect(b.address().port);
        c.write([
            'POST / HTTP/1.1',
            'Host: localhost',
            'Content-Length: 9',
            'Connection: close',
            '',
            'beep boop'
        ].join('\r\n'));
        
        c.pipe(concat(function (data) {
            t.equal(String(data).split('\n').slice(-1)[0], '9')
            c.end()
        }))
    });
});
