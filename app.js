var gphoto2 = require('gphoto2');
var path = require('path');
var fs = require('fs');

var camera;
var GPhoto = new gphoto2.GPhoto2();

function isCanonOrNikon(name) {
    return name.toLowerCase().indexOf('canon') > -1 ||
           name.toLowerCase().indexOf('nikon') > -1;
}

function refreshCamera() {

    console.log('Refreshing camera...');

    GPhoto.list(function(cameras) {
    
        for (var i in cameras) {
            console.log('[', i, ']:', cameras[i].model);
            
            if (isCanonOrNikon(cameras[i].model)) {
                camera = cameras[i];
                console.log('Using:', camera.model);
            }
        }
    
        if (camera) {
            camera.getConfig(function (er, settings) {
                console.log('Camera Settings:', settings);

                if (settings) {
                    camera.setConfigValue('capturetarget', 1, function (error) {
                        if (error) {
                            console.error('Error setting config:', error);
                        }
                    });
                }
            });
        }
    });
}

refreshCamera();

var express = require('express');
var app 	= express();
var port	= process.env.PORT || 8080;

var bodyParser = require('body-parser');
// app.use(bodyParser.json({ limit: '20mb' }));
// app.use(bodyParser.urlencoded({ extended: true, limit: '20mb' }));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/hello', function(req, res) {
	res.send('hi!');
});

app.get('/capture', function(req, res) {

    if (!camera) {
        res.send({
            code: -1,
            data: 'There is no camera'
        });
    } else {

        camera.takePicture({
            targetPath: '/tmp/foo.XXXXXX'
        }, function(error, tmp) {

            var fileName = 'pic' + new Date().getTime() + '.jpg';
            var filePath = path.join(__dirname, 'public', fileName);

            if (error) {
                console.log('Capture error:', error);
                res.send({
                    code: -1,
                    data: 'Error: ' + error
                });
            } else {
                fs.renameSync(tmp, filePath);
                res.send({
                    code: 0,
                    data: fileName
                });
            }
        });
    }

});

app.listen(port, function() {
	console.log('Server listening on port:', port);
});

var usb = require('usb-detection');

usb.on('add', function(device) {
    console.log('USB device added:', device);

    setTimeout(function() {
        refreshCamera();
    }, 1000);
});

usb.on('remove', function(device) {
    console.log('USB device removed:', device);
    
    setTimeout(function() {
        refreshCamera();
    }, 1000);
});

usb.on('change', function(device) {
    console.log('USB device changed:', device);
});