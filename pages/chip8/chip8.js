
var Module;

if (typeof Module === 'undefined') Module = {};

if (!Module.expectedDataFileDownloads) {
  Module.expectedDataFileDownloads = 0;
  Module.finishedDataFileDownloads = 0;
}
Module.expectedDataFileDownloads++;
(function() {
 var loadPackage = function(metadata) {

    var PACKAGE_PATH;
    if (typeof window === 'object') {
      PACKAGE_PATH = window['encodeURIComponent'](window.location.pathname.toString().substring(0, window.location.pathname.toString().lastIndexOf('/')) + '/');
    } else if (typeof location !== 'undefined') {
      // worker
      PACKAGE_PATH = encodeURIComponent(location.pathname.toString().substring(0, location.pathname.toString().lastIndexOf('/')) + '/');
    } else {
      throw 'using preloaded data can only be done on a web page or in a web worker';
    }
    var PACKAGE_NAME = 'build/chip8.data';
    var REMOTE_PACKAGE_BASE = 'chip8.data';
    if (typeof Module['locateFilePackage'] === 'function' && !Module['locateFile']) {
      Module['locateFile'] = Module['locateFilePackage'];
      Module.printErr('warning: you defined Module.locateFilePackage, that has been renamed to Module.locateFile (using your locateFilePackage for now)');
    }
    var REMOTE_PACKAGE_NAME = typeof Module['locateFile'] === 'function' ?
                              Module['locateFile'](REMOTE_PACKAGE_BASE) :
                              ((Module['filePackagePrefixURL'] || '') + REMOTE_PACKAGE_BASE);
  
    var REMOTE_PACKAGE_SIZE = metadata.remote_package_size;
    var PACKAGE_UUID = metadata.package_uuid;
  
    function fetchRemotePackage(packageName, packageSize, callback, errback) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', packageName, true);
      xhr.responseType = 'arraybuffer';
      xhr.onprogress = function(event) {
        var url = packageName;
        var size = packageSize;
        if (event.total) size = event.total;
        if (event.loaded) {
          if (!xhr.addedTotal) {
            xhr.addedTotal = true;
            if (!Module.dataFileDownloads) Module.dataFileDownloads = {};
            Module.dataFileDownloads[url] = {
              loaded: event.loaded,
              total: size
            };
          } else {
            Module.dataFileDownloads[url].loaded = event.loaded;
          }
          var total = 0;
          var loaded = 0;
          var num = 0;
          for (var download in Module.dataFileDownloads) {
          var data = Module.dataFileDownloads[download];
            total += data.total;
            loaded += data.loaded;
            num++;
          }
          total = Math.ceil(total * Module.expectedDataFileDownloads/num);
          if (Module['setStatus']) Module['setStatus']('Downloading data... (' + loaded + '/' + total + ')');
        } else if (!Module.dataFileDownloads) {
          if (Module['setStatus']) Module['setStatus']('Downloading data...');
        }
      };
      xhr.onerror = function(event) {
        throw new Error("NetworkError for: " + packageName);
      }
      xhr.onload = function(event) {
        if (xhr.status == 200 || xhr.status == 304 || xhr.status == 206 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
          var packageData = xhr.response;
          callback(packageData);
        } else {
          throw new Error(xhr.statusText + " : " + xhr.responseURL);
        }
      };
      xhr.send(null);
    };

    function handleError(error) {
      console.error('package error:', error);
    };
  
      var fetched = null, fetchedCallback = null;
      fetchRemotePackage(REMOTE_PACKAGE_NAME, REMOTE_PACKAGE_SIZE, function(data) {
        if (fetchedCallback) {
          fetchedCallback(data);
          fetchedCallback = null;
        } else {
          fetched = data;
        }
      }, handleError);
    
  function runWithFS() {

    function assert(check, msg) {
      if (!check) throw msg + new Error().stack;
    }
Module['FS_createPath']('/', 'data', true, true);
Module['FS_createPath']('/data', 'roms', true, true);

    function DataRequest(start, end, crunched, audio) {
      this.start = start;
      this.end = end;
      this.crunched = crunched;
      this.audio = audio;
    }
    DataRequest.prototype = {
      requests: {},
      open: function(mode, name) {
        this.name = name;
        this.requests[name] = this;
        Module['addRunDependency']('fp ' + this.name);
      },
      send: function() {},
      onload: function() {
        var byteArray = this.byteArray.subarray(this.start, this.end);

          this.finish(byteArray);

      },
      finish: function(byteArray) {
        var that = this;

        Module['FS_createDataFile'](this.name, null, byteArray, true, true, true); // canOwn this data in the filesystem, it is a slide into the heap that will never change
        Module['removeRunDependency']('fp ' + that.name);

        this.requests[this.name] = null;
      },
    };

        var files = metadata.files;
        for (i = 0; i < files.length; ++i) {
          new DataRequest(files[i].start, files[i].end, files[i].crunched, files[i].audio).open('GET', files[i].filename);
        }

  
    function processPackageData(arrayBuffer) {
      Module.finishedDataFileDownloads++;
      assert(arrayBuffer, 'Loading data file failed.');
      assert(arrayBuffer instanceof ArrayBuffer, 'bad input to processPackageData');
      var byteArray = new Uint8Array(arrayBuffer);
      var curr;
      
        // copy the entire loaded file into a spot in the heap. Files will refer to slices in that. They cannot be freed though
        // (we may be allocating before malloc is ready, during startup).
        if (Module['SPLIT_MEMORY']) Module.printErr('warning: you should run the file packager with --no-heap-copy when SPLIT_MEMORY is used, otherwise copying into the heap may fail due to the splitting');
        var ptr = Module['getMemory'](byteArray.length);
        Module['HEAPU8'].set(byteArray, ptr);
        DataRequest.prototype.byteArray = Module['HEAPU8'].subarray(ptr, ptr+byteArray.length);
  
          var files = metadata.files;
          for (i = 0; i < files.length; ++i) {
            DataRequest.prototype.requests[files[i].filename].onload();
          }
              Module['removeRunDependency']('datafile_build/chip8.data');

    };
    Module['addRunDependency']('datafile_build/chip8.data');
  
    if (!Module.preloadResults) Module.preloadResults = {};
  
      Module.preloadResults[PACKAGE_NAME] = {fromCache: false};
      if (fetched) {
        processPackageData(fetched);
        fetched = null;
      } else {
        fetchedCallback = processPackageData;
      }
    
  }
  if (Module['calledRun']) {
    runWithFS();
  } else {
    if (!Module['preRun']) Module['preRun'] = [];
    Module["preRun"].push(runWithFS); // FS is not initialized yet, wait for it
  }

 }
 loadPackage({"files": [{"audio": 0, "start": 0, "crunched": 0, "end": 145, "filename": "/data/choosegame"}, {"audio": 0, "start": 145, "crunched": 0, "end": 822, "filename": "/data/roms/Worm_V4_[RB-Revival_Studios,_2007].ch8"}, {"audio": 0, "start": 822, "crunched": 0, "end": 1210, "filename": "/data/roms/Slide_[Joyce_Weisbecker].ch8"}, {"audio": 0, "start": 1210, "crunched": 0, "end": 1496, "filename": "/data/roms/Brick_(Brix_hack,_1990).ch8"}, {"audio": 0, "start": 1496, "crunched": 0, "end": 2797, "filename": "/data/roms/Space_Invaders_[David_Winter].ch8"}, {"audio": 0, "start": 2797, "crunched": 0, "end": 2951, "filename": "/data/roms/Spooky_Spot_[Joseph_Weisbecker,_1978].ch8"}, {"audio": 0, "start": 2951, "crunched": 0, "end": 3961, "filename": "/data/roms/Most_Dangerous_Game_[Peter_Maruhnic].ch8"}, {"audio": 0, "start": 3961, "crunched": 0, "end": 4159, "filename": "/data/roms/Filter.ch8"}, {"audio": 0, "start": 4159, "crunched": 0, "end": 4193, "filename": "/data/roms/Maze_[David_Winter,_199x].ch8"}, {"audio": 0, "start": 4193, "crunched": 0, "end": 4753, "filename": "/data/roms/Tank.ch8"}, {"audio": 0, "start": 4753, "crunched": 0, "end": 5773, "filename": "/data/roms/Programmable_Spacefighters_[Jef_Winsor].ch8"}, {"audio": 0, "start": 5773, "crunched": 0, "end": 5929, "filename": "/data/roms/Russian_Roulette_[Carmelo_Cortez,_1978].ch8"}, {"audio": 0, "start": 5929, "crunched": 0, "end": 6140, "filename": "/data/roms/Squash_[David_Winter].ch8"}, {"audio": 0, "start": 6140, "crunched": 0, "end": 6246, "filename": "/data/roms/X-Mirror.ch8"}, {"audio": 0, "start": 6246, "crunched": 0, "end": 6358, "filename": "/data/roms/Rocket_Launcher.ch8"}, {"audio": 0, "start": 6358, "crunched": 0, "end": 8150, "filename": "/data/roms/Lunar_Lander_(Udo_Pernisz,_1979).ch8"}, {"audio": 0, "start": 8150, "crunched": 0, "end": 8342, "filename": "/data/roms/Craps_[Camerlo_Cortez,_1978].ch8"}, {"audio": 0, "start": 8342, "crunched": 0, "end": 8724, "filename": "/data/roms/Tron.ch8"}, {"audio": 0, "start": 8724, "crunched": 0, "end": 8900, "filename": "/data/roms/Sum_Fun_[Joyce_Weisbecker].ch8"}, {"audio": 0, "start": 8900, "crunched": 0, "end": 9192, "filename": "/data/roms/Mastermind_FourRow_(Robert_Lindley,_1978).ch8"}, {"audio": 0, "start": 9192, "crunched": 0, "end": 10216, "filename": "/data/roms/Deflection_[John_Fort].ch8"}, {"audio": 0, "start": 10216, "crunched": 0, "end": 10422, "filename": "/data/roms/Wipe_Off_[Joseph_Weisbecker].ch8"}, {"audio": 0, "start": 10422, "crunched": 0, "end": 10706, "filename": "/data/roms/Tapeworm_[JDR,_1999].ch8"}, {"audio": 0, "start": 10706, "crunched": 0, "end": 10874, "filename": "/data/roms/Addition_Problems_[Paul_C._Moews].ch8"}, {"audio": 0, "start": 10874, "crunched": 0, "end": 11590, "filename": "/data/roms/Space_Flight.ch8"}, {"audio": 0, "start": 11590, "crunched": 0, "end": 11814, "filename": "/data/roms/UFO_[Lutz_V,_1992].ch8"}, {"audio": 0, "start": 11814, "crunched": 0, "end": 12078, "filename": "/data/roms/15_Puzzle_[Roger_Ivie]_(alt).ch8"}, {"audio": 0, "start": 12078, "crunched": 0, "end": 12572, "filename": "/data/roms/Tetris_[Fran_Dachille,_1991].ch8"}, {"audio": 0, "start": 12572, "crunched": 0, "end": 12928, "filename": "/data/roms/Airplane.ch8"}, {"audio": 0, "start": 12928, "crunched": 0, "end": 13218, "filename": "/data/roms/Figures.ch8"}, {"audio": 0, "start": 13218, "crunched": 0, "end": 13402, "filename": "/data/roms/ZeroPong_[zeroZshadow,_2007].ch8"}, {"audio": 0, "start": 13402, "crunched": 0, "end": 14348, "filename": "/data/roms/Syzygy_[Roy_Trevino,_1990].ch8"}, {"audio": 0, "start": 14348, "crunched": 0, "end": 14908, "filename": "/data/roms/Paddles.ch8"}, {"audio": 0, "start": 14908, "crunched": 0, "end": 15088, "filename": "/data/roms/Missile_[David_Winter].ch8"}, {"audio": 0, "start": 15088, "crunched": 0, "end": 15574, "filename": "/data/roms/Tic-Tac-Toe_[David_Winter].ch8"}, {"audio": 0, "start": 15574, "crunched": 0, "end": 16857, "filename": "/data/roms/Space_Invaders_[David_Winter]_(alt).ch8"}, {"audio": 0, "start": 16857, "crunched": 0, "end": 16965, "filename": "/data/roms/Coin_Flipping_[Carmelo_Cortez,_1978].ch8"}, {"audio": 0, "start": 16965, "crunched": 0, "end": 17169, "filename": "/data/roms/Shooting_Stars_[Philip_Baltzer,_1978].ch8"}, {"audio": 0, "start": 17169, "crunched": 0, "end": 17449, "filename": "/data/roms/Brix_[Andreas_Gustafsson,_1990].ch8"}, {"audio": 0, "start": 17449, "crunched": 0, "end": 17794, "filename": "/data/roms/Merlin_[David_Winter].ch8"}, {"audio": 0, "start": 17794, "crunched": 0, "end": 18023, "filename": "/data/roms/Wall_[David_Winter].ch8"}, {"audio": 0, "start": 18023, "crunched": 0, "end": 18287, "filename": "/data/roms/Pong_(alt).ch8"}, {"audio": 0, "start": 18287, "crunched": 0, "end": 18435, "filename": "/data/roms/Guess_[David_Winter]_(alt).ch8"}, {"audio": 0, "start": 18435, "crunched": 0, "end": 18667, "filename": "/data/roms/Breakout_[Carmelo_Cortez,_1979].ch8"}, {"audio": 0, "start": 18667, "crunched": 0, "end": 18961, "filename": "/data/roms/Pong_2_(Pong_hack)_[David_Winter,_1997].ch8"}, {"audio": 0, "start": 18961, "crunched": 0, "end": 19468, "filename": "/data/roms/Vertical_Brix_[Paul_Robson,_1996].ch8"}, {"audio": 0, "start": 19468, "crunched": 0, "end": 19618, "filename": "/data/roms/Guess_[David_Winter].ch8"}, {"audio": 0, "start": 19618, "crunched": 0, "end": 20812, "filename": "/data/roms/Animal_Race_[Brian_Astle].ch8"}, {"audio": 0, "start": 20812, "crunched": 0, "end": 20934, "filename": "/data/roms/Kaleidoscope_[Joseph_Weisbecker,_1978].ch8"}, {"audio": 0, "start": 20934, "crunched": 0, "end": 21428, "filename": "/data/roms/Rocket_Launch_[Jonas_Lindstedt].ch8"}, {"audio": 0, "start": 21428, "crunched": 0, "end": 21610, "filename": "/data/roms/Nim_[Carmelo_Cortez,_1978].ch8"}, {"audio": 0, "start": 21610, "crunched": 0, "end": 21856, "filename": "/data/roms/Pong_[Paul_Vervalin,_1990].ch8"}, {"audio": 0, "start": 21856, "crunched": 0, "end": 22144, "filename": "/data/roms/Submarine_[Carmelo_Cortez,_1978].ch8"}, {"audio": 0, "start": 22144, "crunched": 0, "end": 22424, "filename": "/data/roms/Breakout_(Brix_hack)_[David_Winter,_1997].ch8"}, {"audio": 0, "start": 22424, "crunched": 0, "end": 22568, "filename": "/data/roms/Timebomb.ch8"}, {"audio": 0, "start": 22568, "crunched": 0, "end": 22892, "filename": "/data/roms/Sequence_Shoot_[Joyce_Weisbecker].ch8"}, {"audio": 0, "start": 22892, "crunched": 0, "end": 23283, "filename": "/data/roms/Blitz_[David_Winter].ch8"}, {"audio": 0, "start": 23283, "crunched": 0, "end": 23467, "filename": "/data/roms/Puzzle.ch8"}, {"audio": 0, "start": 23467, "crunched": 0, "end": 23661, "filename": "/data/roms/Connect_4_[David_Winter].ch8"}, {"audio": 0, "start": 23661, "crunched": 0, "end": 27243, "filename": "/data/roms/Rush_Hour_[Hap,_2006]_(alt).ch8"}, {"audio": 0, "start": 27243, "crunched": 0, "end": 27435, "filename": "/data/roms/Space_Intercept_[Joseph_Weisbecker,_1978].ch8"}, {"audio": 0, "start": 27435, "crunched": 0, "end": 31017, "filename": "/data/roms/Rush_Hour_[Hap,_2006].ch8"}, {"audio": 0, "start": 31017, "crunched": 0, "end": 31408, "filename": "/data/roms/Blitz_[David_Winter]_(fix).ch8"}, {"audio": 0, "start": 31408, "crunched": 0, "end": 32258, "filename": "/data/roms/Hidden_[David_Winter,_1996].ch8"}, {"audio": 0, "start": 32258, "crunched": 0, "end": 32592, "filename": "/data/roms/Soccer.ch8"}, {"audio": 0, "start": 32592, "crunched": 0, "end": 33502, "filename": "/data/roms/Biorhythm_[Jef_Winsor].ch8"}, {"audio": 0, "start": 33502, "crunched": 0, "end": 34384, "filename": "/data/roms/Cave.ch8"}, {"audio": 0, "start": 34384, "crunched": 0, "end": 34660, "filename": "/data/roms/Landing.ch8"}, {"audio": 0, "start": 34660, "crunched": 0, "end": 34790, "filename": "/data/roms/Rocket_[Joseph_Weisbecker,_1978].ch8"}, {"audio": 0, "start": 34790, "crunched": 0, "end": 35984, "filename": "/data/roms/Bowling_[Gooitzen_van_der_Wal].ch8"}, {"audio": 0, "start": 35984, "crunched": 0, "end": 36562, "filename": "/data/roms/Reversi_[Philip_Baltzer].ch8"}, {"audio": 0, "start": 36562, "crunched": 0, "end": 38640, "filename": "/data/roms/Blinky_[Hans_Christian_Egeberg]_(alt).ch8"}, {"audio": 0, "start": 38640, "crunched": 0, "end": 39753, "filename": "/data/roms/Astro_Dodge_[Revival_Studios,_2008].ch8"}, {"audio": 0, "start": 39753, "crunched": 0, "end": 39923, "filename": "/data/roms/Hi-Lo_[Jef_Winsor,_1978].ch8"}, {"audio": 0, "start": 39923, "crunched": 0, "end": 40307, "filename": "/data/roms/15_Puzzle_[Roger_Ivie].ch8"}, {"audio": 0, "start": 40307, "crunched": 0, "end": 40553, "filename": "/data/roms/Pong_(1_player).ch8"}, {"audio": 0, "start": 40553, "crunched": 0, "end": 40783, "filename": "/data/roms/Vers_[JMN,_1991].ch8"}, {"audio": 0, "start": 40783, "crunched": 0, "end": 43139, "filename": "/data/roms/Blinky_[Hans_Christian_Egeberg,_1991].ch8"}], "remote_package_size": 43139, "package_uuid": "3fe5f2ac-131e-4641-bf6b-545db5b8f8e9"});

})();

// The Module object: Our interface to the outside world. We import
// and export values on it, and do the work to get that through
// closure compiler if necessary. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to do an eval in order to handle the closure compiler
// case, where this code here is minified but Module was defined
// elsewhere (e.g. case 4 above). We also need to check if Module
// already exists (e.g. case 3 above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module;
if (!Module) Module = (typeof Module !== 'undefined' ? Module : null) || {};

// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
for (var key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}

// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_WEB = false;
var ENVIRONMENT_IS_WORKER = false;
var ENVIRONMENT_IS_NODE = false;
var ENVIRONMENT_IS_SHELL = false;

// Three configurations we can be running in:
// 1) We could be the application main() thread running in the main JS UI thread. (ENVIRONMENT_IS_WORKER == false and ENVIRONMENT_IS_PTHREAD == false)
// 2) We could be the application main() thread proxied to worker. (with Emscripten -s PROXY_TO_WORKER=1) (ENVIRONMENT_IS_WORKER == true, ENVIRONMENT_IS_PTHREAD == false)
// 3) We could be an application pthread running in a worker. (ENVIRONMENT_IS_WORKER == true and ENVIRONMENT_IS_PTHREAD == true)

if (Module['ENVIRONMENT']) {
  if (Module['ENVIRONMENT'] === 'WEB') {
    ENVIRONMENT_IS_WEB = true;
  } else if (Module['ENVIRONMENT'] === 'WORKER') {
    ENVIRONMENT_IS_WORKER = true;
  } else if (Module['ENVIRONMENT'] === 'NODE') {
    ENVIRONMENT_IS_NODE = true;
  } else if (Module['ENVIRONMENT'] === 'SHELL') {
    ENVIRONMENT_IS_SHELL = true;
  } else {
    throw new Error('The provided Module[\'ENVIRONMENT\'] value is not valid. It must be one of: WEB|WORKER|NODE|SHELL.');
  }
} else {
  ENVIRONMENT_IS_WEB = typeof window === 'object';
  ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
  ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function' && !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_WORKER;
  ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
}


if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  if (!Module['print']) Module['print'] = console.log;
  if (!Module['printErr']) Module['printErr'] = console.warn;

  var nodeFS;
  var nodePath;

  Module['read'] = function read(filename, binary) {
    if (!nodeFS) nodeFS = require('fs');
    if (!nodePath) nodePath = require('path');

    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename);
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename);
    }
    if (ret && !binary) ret = ret.toString();
    return ret;
  };

  Module['readBinary'] = function readBinary(filename) {
    var ret = Module['read'](filename, true);
    if (!ret.buffer) {
      ret = new Uint8Array(ret);
    }
    assert(ret.buffer);
    return ret;
  };

  Module['load'] = function load(f) {
    globalEval(read(f));
  };

  if (!Module['thisProgram']) {
    if (process['argv'].length > 1) {
      Module['thisProgram'] = process['argv'][1].replace(/\\/g, '/');
    } else {
      Module['thisProgram'] = 'unknown-program';
    }
  }

  Module['arguments'] = process['argv'].slice(2);

  if (typeof module !== 'undefined') {
    module['exports'] = Module;
  }

  process['on']('uncaughtException', function(ex) {
    // suppress ExitStatus exceptions from showing an error
    if (!(ex instanceof ExitStatus)) {
      throw ex;
    }
  });

  Module['inspect'] = function () { return '[Emscripten Module object]'; };
}
else if (ENVIRONMENT_IS_SHELL) {
  if (!Module['print']) Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm

  if (typeof read != 'undefined') {
    Module['read'] = read;
  } else {
    Module['read'] = function read() { throw 'no read() available (jsc?)' };
  }

  Module['readBinary'] = function readBinary(f) {
    if (typeof readbuffer === 'function') {
      return new Uint8Array(readbuffer(f));
    }
    var data = read(f, 'binary');
    assert(typeof data === 'object');
    return data;
  };

  if (typeof scriptArgs != 'undefined') {
    Module['arguments'] = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }

}
else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function read(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };

  Module['readAsync'] = function readAsync(url, onload, onerror) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = function xhr_onload() {
      if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
        onload(xhr.response);
      } else {
        onerror();
      }
    };
    xhr.onerror = onerror;
    xhr.send(null);
  };

  if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }

  if (typeof console !== 'undefined') {
    if (!Module['print']) Module['print'] = function print(x) {
      console.log(x);
    };
    if (!Module['printErr']) Module['printErr'] = function printErr(x) {
      console.warn(x);
    };
  } else {
    // Probably a worker, and without console.log. We can do very little here...
    var TRY_USE_DUMP = false;
    if (!Module['print']) Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
  }

  if (ENVIRONMENT_IS_WORKER) {
    Module['load'] = importScripts;
  }

  if (typeof Module['setWindowTitle'] === 'undefined') {
    Module['setWindowTitle'] = function(title) { document.title = title };
  }
}
else {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}

function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] && Module['read']) {
  Module['load'] = function load(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['print']) {
  Module['print'] = function(){};
}
if (!Module['printErr']) {
  Module['printErr'] = Module['print'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
if (!Module['thisProgram']) {
  Module['thisProgram'] = './this.program';
}

// *** Environment setup code ***

// Closure helpers
Module.print = Module['print'];
Module.printErr = Module['printErr'];

// Callbacks
Module['preRun'] = [];
Module['postRun'] = [];

// Merge back in the overrides
for (var key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}
// Free the object hierarchy contained in the overrides, this lets the GC
// reclaim data used e.g. in memoryInitializerRequest, which is a large typed array.
moduleOverrides = undefined;



// {{PREAMBLE_ADDITIONS}}

// === Preamble library stuff ===

// Documentation for the public APIs defined in this file must be updated in: 
//    site/source/docs/api_reference/preamble.js.rst
// A prebuilt local version of the documentation is available at: 
//    site/build/text/docs/api_reference/preamble.js.txt
// You can also build docs locally as HTML or other formats in site/
// An online HTML version (which may be of a different version of Emscripten)
//    is up at http://kripken.github.io/emscripten-site/docs/api_reference/preamble.js.html

//========================================
// Runtime code shared with compiler
//========================================

var Runtime = {
  setTempRet0: function (value) {
    tempRet0 = value;
  },
  getTempRet0: function () {
    return tempRet0;
  },
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  getNativeTypeSize: function (type) {
    switch (type) {
      case 'i1': case 'i8': return 1;
      case 'i16': return 2;
      case 'i32': return 4;
      case 'i64': return 8;
      case 'float': return 4;
      case 'double': return 8;
      default: {
        if (type[type.length-1] === '*') {
          return Runtime.QUANTUM_SIZE; // A pointer
        } else if (type[0] === 'i') {
          var bits = parseInt(type.substr(1));
          assert(bits % 8 === 0);
          return bits/8;
        } else {
          return 0;
        }
      }
    }
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  STACK_ALIGN: 16,
  prepVararg: function (ptr, type) {
    if (type === 'double' || type === 'i64') {
      // move so the load is aligned
      if (ptr & 7) {
        assert((ptr & 7) === 4);
        ptr += 4;
      }
    } else {
      assert((ptr & 3) === 0);
    }
    return ptr;
  },
  getAlignSize: function (type, size, vararg) {
    // we align i64s and doubles on 64-bit boundaries, unlike x86
    if (!vararg && (type == 'i64' || type == 'double')) return 8;
    if (!type) return Math.min(size, 8); // align structures internally to 64 bits
    return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE);
  },
  dynCall: function (sig, ptr, args) {
    if (args && args.length) {
      assert(args.length == sig.length-1);
      if (!args.splice) args = Array.prototype.slice.call(args);
      args.splice(0, 0, ptr);
      assert(('dynCall_' + sig) in Module, 'bad function pointer type - no table for sig \'' + sig + '\'');
      return Module['dynCall_' + sig].apply(null, args);
    } else {
      assert(sig.length == 1);
      assert(('dynCall_' + sig) in Module, 'bad function pointer type - no table for sig \'' + sig + '\'');
      return Module['dynCall_' + sig].call(null, ptr);
    }
  },
  functionPointers: [],
  addFunction: function (func) {
    for (var i = 0; i < Runtime.functionPointers.length; i++) {
      if (!Runtime.functionPointers[i]) {
        Runtime.functionPointers[i] = func;
        return 2*(1 + i);
      }
    }
    throw 'Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.';
  },
  removeFunction: function (index) {
    Runtime.functionPointers[(index-2)/2] = null;
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func, sig) {
    assert(sig);
    if (!Runtime.funcWrappers[sig]) {
      Runtime.funcWrappers[sig] = {};
    }
    var sigCache = Runtime.funcWrappers[sig];
    if (!sigCache[func]) {
      sigCache[func] = function dynCall_wrapper() {
        return Runtime.dynCall(sig, func, arguments);
      };
    }
    return sigCache[func];
  },
  getCompilerSetting: function (name) {
    throw 'You must build with -s RETAIN_COMPILER_SETTINGS=1 for Runtime.getCompilerSetting or emscripten_get_compiler_setting to work';
  },
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = (((STACKTOP)+15)&-16);(assert((((STACKTOP|0) < (STACK_MAX|0))|0))|0); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + (assert(!staticSealed),size))|0;STATICTOP = (((STATICTOP)+15)&-16); return ret; },
  dynamicAlloc: function (size) { var ret = DYNAMICTOP;DYNAMICTOP = (DYNAMICTOP + (assert(DYNAMICTOP > 0),size))|0;DYNAMICTOP = (((DYNAMICTOP)+15)&-16); if (DYNAMICTOP >= TOTAL_MEMORY) { var success = enlargeMemory(); if (!success) { DYNAMICTOP = ret;  return 0; } }; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 16))*(quantum ? quantum : 16); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? ((+((low>>>0)))+((+((high>>>0)))*4294967296.0)) : ((+((low>>>0)))+((+((high|0)))*4294967296.0))); return ret; },
  GLOBAL_BASE: 8,
  QUANTUM_SIZE: 4,
  __dummy__: 0
}



Module["Runtime"] = Runtime;



//========================================
// Runtime essentials
//========================================

var ABORT = false; // whether we are quitting the application. no code should run after this. set in exit() and abort()
var EXITSTATUS = 0;

function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}

var globalScope = this;

// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  var func = Module['_' + ident]; // closure exported function
  if (!func) {
    try { func = eval('_' + ident); } catch(e) {}
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  return func;
}

var cwrap, ccall;
(function(){
  var JSfuncs = {
    // Helpers for cwrap -- it can't refer to Runtime directly because it might
    // be renamed by closure, instead it calls JSfuncs['stackSave'].body to find
    // out what the minified function name is.
    'stackSave': function() {
      Runtime.stackSave()
    },
    'stackRestore': function() {
      Runtime.stackRestore()
    },
    // type conversion from js to c
    'arrayToC' : function(arr) {
      var ret = Runtime.stackAlloc(arr.length);
      writeArrayToMemory(arr, ret);
      return ret;
    },
    'stringToC' : function(str) {
      var ret = 0;
      if (str !== null && str !== undefined && str !== 0) { // null string
        // at most 4 bytes per UTF-8 code point, +1 for the trailing '\0'
        ret = Runtime.stackAlloc((str.length << 2) + 1);
        writeStringToMemory(str, ret);
      }
      return ret;
    }
  };
  // For fast lookup of conversion functions
  var toC = {'string' : JSfuncs['stringToC'], 'array' : JSfuncs['arrayToC']};

  // C calling interface. 
  ccall = function ccallFunc(ident, returnType, argTypes, args, opts) {
    var func = getCFunc(ident);
    var cArgs = [];
    var stack = 0;
    assert(returnType !== 'array', 'Return type should not be "array".');
    if (args) {
      for (var i = 0; i < args.length; i++) {
        var converter = toC[argTypes[i]];
        if (converter) {
          if (stack === 0) stack = Runtime.stackSave();
          cArgs[i] = converter(args[i]);
        } else {
          cArgs[i] = args[i];
        }
      }
    }
    var ret = func.apply(null, cArgs);
    if ((!opts || !opts.async) && typeof EmterpreterAsync === 'object') {
      assert(!EmterpreterAsync.state, 'cannot start async op with normal JS calling ccall');
    }
    if (opts && opts.async) assert(!returnType, 'async ccalls cannot return values');
    if (returnType === 'string') ret = Pointer_stringify(ret);
    if (stack !== 0) {
      if (opts && opts.async) {
        EmterpreterAsync.asyncFinalizers.push(function() {
          Runtime.stackRestore(stack);
        });
        return;
      }
      Runtime.stackRestore(stack);
    }
    return ret;
  }

  var sourceRegex = /^function\s*[a-zA-Z$_0-9]*\s*\(([^)]*)\)\s*{\s*([^*]*?)[\s;]*(?:return\s*(.*?)[;\s]*)?}$/;
  function parseJSFunc(jsfunc) {
    // Match the body and the return value of a javascript function source
    var parsed = jsfunc.toString().match(sourceRegex).slice(1);
    return {arguments : parsed[0], body : parsed[1], returnValue: parsed[2]}
  }

  // sources of useful functions. we create this lazily as it can trigger a source decompression on this entire file
  var JSsource = null;
  function ensureJSsource() {
    if (!JSsource) {
      JSsource = {};
      for (var fun in JSfuncs) {
        if (JSfuncs.hasOwnProperty(fun)) {
          // Elements of toCsource are arrays of three items:
          // the code, and the return value
          JSsource[fun] = parseJSFunc(JSfuncs[fun]);
        }
      }
    }
  }
  
  cwrap = function cwrap(ident, returnType, argTypes) {
    argTypes = argTypes || [];
    var cfunc = getCFunc(ident);
    // When the function takes numbers and returns a number, we can just return
    // the original function
    var numericArgs = argTypes.every(function(type){ return type === 'number'});
    var numericRet = (returnType !== 'string');
    if ( numericRet && numericArgs) {
      return cfunc;
    }
    // Creation of the arguments list (["$1","$2",...,"$nargs"])
    var argNames = argTypes.map(function(x,i){return '$'+i});
    var funcstr = "(function(" + argNames.join(',') + ") {";
    var nargs = argTypes.length;
    if (!numericArgs) {
      // Generate the code needed to convert the arguments from javascript
      // values to pointers
      ensureJSsource();
      funcstr += 'var stack = ' + JSsource['stackSave'].body + ';';
      for (var i = 0; i < nargs; i++) {
        var arg = argNames[i], type = argTypes[i];
        if (type === 'number') continue;
        var convertCode = JSsource[type + 'ToC']; // [code, return]
        funcstr += 'var ' + convertCode.arguments + ' = ' + arg + ';';
        funcstr += convertCode.body + ';';
        funcstr += arg + '=(' + convertCode.returnValue + ');';
      }
    }

    // When the code is compressed, the name of cfunc is not literally 'cfunc' anymore
    var cfuncname = parseJSFunc(function(){return cfunc}).returnValue;
    // Call the function
    funcstr += 'var ret = ' + cfuncname + '(' + argNames.join(',') + ');';
    if (!numericRet) { // Return type can only by 'string' or 'number'
      // Convert the result to a string
      var strgfy = parseJSFunc(function(){return Pointer_stringify}).returnValue;
      funcstr += 'ret = ' + strgfy + '(ret);';
    }
    funcstr += "if (typeof EmterpreterAsync === 'object') { assert(!EmterpreterAsync.state, 'cannot start async op with normal JS calling cwrap') }";
    if (!numericArgs) {
      // If we had a stack, restore it
      ensureJSsource();
      funcstr += JSsource['stackRestore'].body.replace('()', '(stack)') + ';';
    }
    funcstr += 'return ret})';
    return eval(funcstr);
  };
})();
Module["ccall"] = ccall;
Module["cwrap"] = cwrap;

function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[((ptr)>>0)]=value; break;
      case 'i8': HEAP8[((ptr)>>0)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,(+(Math_abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math_min((+(Math_floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': HEAPF64[((ptr)>>3)]=value; break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module["setValue"] = setValue;


function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[((ptr)>>0)];
      case 'i8': return HEAP8[((ptr)>>0)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module["getValue"] = getValue;

var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_DYNAMIC = 3; // Cannot be freed except through sbrk
var ALLOC_NONE = 4; // Do not allocate
Module["ALLOC_NORMAL"] = ALLOC_NORMAL;
Module["ALLOC_STACK"] = ALLOC_STACK;
Module["ALLOC_STATIC"] = ALLOC_STATIC;
Module["ALLOC_DYNAMIC"] = ALLOC_DYNAMIC;
Module["ALLOC_NONE"] = ALLOC_NONE;

// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }

  var singleType = typeof types === 'string' ? types : null;

  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [typeof _malloc === 'function' ? _malloc : Runtime.staticAlloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }

  if (zeroinit) {
    var ptr = ret, stop;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)>>0)]=0;
    }
    return ret;
  }

  if (singleType === 'i8') {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(slab, ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
    return ret;
  }

  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];

    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }

    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }
    assert(type, 'Must know what type to store in allocate!');

    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later

    setValue(ret+i, curr, type);

    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = Runtime.getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }

  return ret;
}
Module["allocate"] = allocate;

// Allocate memory during any stage of startup - static memory early on, dynamic memory later, malloc when ready
function getMemory(size) {
  if (!staticSealed) return Runtime.staticAlloc(size);
  if ((typeof _sbrk !== 'undefined' && !_sbrk.called) || !runtimeInitialized) return Runtime.dynamicAlloc(size);
  return _malloc(size);
}
Module["getMemory"] = getMemory;

function Pointer_stringify(ptr, /* optional */ length) {
  if (length === 0 || !ptr) return '';
  // TODO: use TextDecoder
  // Find the length, and check for UTF while doing so
  var hasUtf = 0;
  var t;
  var i = 0;
  while (1) {
    assert(ptr + i < TOTAL_MEMORY);
    t = HEAPU8[(((ptr)+(i))>>0)];
    hasUtf |= t;
    if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;

  var ret = '';

  if (hasUtf < 128) {
    var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }
  return Module['UTF8ToString'](ptr);
}
Module["Pointer_stringify"] = Pointer_stringify;

// Given a pointer 'ptr' to a null-terminated ASCII-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.

function AsciiToString(ptr) {
  var str = '';
  while (1) {
    var ch = HEAP8[((ptr++)>>0)];
    if (!ch) return str;
    str += String.fromCharCode(ch);
  }
}
Module["AsciiToString"] = AsciiToString;

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in ASCII form. The copy will require at most str.length+1 bytes of space in the HEAP.

function stringToAscii(str, outPtr) {
  return writeAsciiToMemory(str, outPtr, false);
}
Module["stringToAscii"] = stringToAscii;

// Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the given array that contains uint8 values, returns
// a copy of that string as a Javascript String object.

function UTF8ArrayToString(u8Array, idx) {
  var u0, u1, u2, u3, u4, u5;

  var str = '';
  while (1) {
    // For UTF8 byte structure, see http://en.wikipedia.org/wiki/UTF-8#Description and https://www.ietf.org/rfc/rfc2279.txt and https://tools.ietf.org/html/rfc3629
    u0 = u8Array[idx++];
    if (!u0) return str;
    if (!(u0 & 0x80)) { str += String.fromCharCode(u0); continue; }
    u1 = u8Array[idx++] & 63;
    if ((u0 & 0xE0) == 0xC0) { str += String.fromCharCode(((u0 & 31) << 6) | u1); continue; }
    u2 = u8Array[idx++] & 63;
    if ((u0 & 0xF0) == 0xE0) {
      u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
    } else {
      u3 = u8Array[idx++] & 63;
      if ((u0 & 0xF8) == 0xF0) {
        u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | u3;
      } else {
        u4 = u8Array[idx++] & 63;
        if ((u0 & 0xFC) == 0xF8) {
          u0 = ((u0 & 3) << 24) | (u1 << 18) | (u2 << 12) | (u3 << 6) | u4;
        } else {
          u5 = u8Array[idx++] & 63;
          u0 = ((u0 & 1) << 30) | (u1 << 24) | (u2 << 18) | (u3 << 12) | (u4 << 6) | u5;
        }
      }
    }
    if (u0 < 0x10000) {
      str += String.fromCharCode(u0);
    } else {
      var ch = u0 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    }
  }
}
Module["UTF8ArrayToString"] = UTF8ArrayToString;

// Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.

function UTF8ToString(ptr) {
  return UTF8ArrayToString(HEAPU8,ptr);
}
Module["UTF8ToString"] = UTF8ToString;

// Copies the given Javascript String object 'str' to the given byte array at address 'outIdx',
// encoded in UTF8 form and null-terminated. The copy will require at most str.length*4+1 bytes of space in the HEAP.
// Use the function lengthBytesUTF8() to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   outU8Array: the array to copy to. Each index in this array is assumed to be one 8-byte element.
//   outIdx: The starting offset in the array to begin the copying.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array. This count should include the null 
//                    terminator, i.e. if maxBytesToWrite=1, only the null terminator will be written and nothing else.
//                    maxBytesToWrite=0 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF8Array(str, outU8Array, outIdx, maxBytesToWrite) {
  if (!(maxBytesToWrite > 0)) // Parameter maxBytesToWrite is not optional. Negative values, 0, null, undefined and false each don't write out any bytes.
    return 0;

  var startIdx = outIdx;
  var endIdx = outIdx + maxBytesToWrite - 1; // -1 for string null terminator.
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! So decode UTF16->UTF32->UTF8.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    // For UTF8 byte structure, see http://en.wikipedia.org/wiki/UTF-8#Description and https://www.ietf.org/rfc/rfc2279.txt and https://tools.ietf.org/html/rfc3629
    var u = str.charCodeAt(i); // possibly a lead surrogate
    if (u >= 0xD800 && u <= 0xDFFF) u = 0x10000 + ((u & 0x3FF) << 10) | (str.charCodeAt(++i) & 0x3FF);
    if (u <= 0x7F) {
      if (outIdx >= endIdx) break;
      outU8Array[outIdx++] = u;
    } else if (u <= 0x7FF) {
      if (outIdx + 1 >= endIdx) break;
      outU8Array[outIdx++] = 0xC0 | (u >> 6);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    } else if (u <= 0xFFFF) {
      if (outIdx + 2 >= endIdx) break;
      outU8Array[outIdx++] = 0xE0 | (u >> 12);
      outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    } else if (u <= 0x1FFFFF) {
      if (outIdx + 3 >= endIdx) break;
      outU8Array[outIdx++] = 0xF0 | (u >> 18);
      outU8Array[outIdx++] = 0x80 | ((u >> 12) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    } else if (u <= 0x3FFFFFF) {
      if (outIdx + 4 >= endIdx) break;
      outU8Array[outIdx++] = 0xF8 | (u >> 24);
      outU8Array[outIdx++] = 0x80 | ((u >> 18) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 12) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    } else {
      if (outIdx + 5 >= endIdx) break;
      outU8Array[outIdx++] = 0xFC | (u >> 30);
      outU8Array[outIdx++] = 0x80 | ((u >> 24) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 18) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 12) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    }
  }
  // Null-terminate the pointer to the buffer.
  outU8Array[outIdx] = 0;
  return outIdx - startIdx;
}
Module["stringToUTF8Array"] = stringToUTF8Array;

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF8 form. The copy will require at most str.length*4+1 bytes of space in the HEAP.
// Use the function lengthBytesUTF8() to compute the exact number of bytes (excluding null terminator) that this function will write.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF8(str, outPtr, maxBytesToWrite) {
  assert(typeof maxBytesToWrite == 'number', 'stringToUTF8(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
  return stringToUTF8Array(str, HEAPU8,outPtr, maxBytesToWrite);
}
Module["stringToUTF8"] = stringToUTF8;

// Returns the number of bytes the given Javascript string takes if encoded as a UTF8 byte array, EXCLUDING the null terminator byte.

function lengthBytesUTF8(str) {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! So decode UTF16->UTF32->UTF8.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var u = str.charCodeAt(i); // possibly a lead surrogate
    if (u >= 0xD800 && u <= 0xDFFF) u = 0x10000 + ((u & 0x3FF) << 10) | (str.charCodeAt(++i) & 0x3FF);
    if (u <= 0x7F) {
      ++len;
    } else if (u <= 0x7FF) {
      len += 2;
    } else if (u <= 0xFFFF) {
      len += 3;
    } else if (u <= 0x1FFFFF) {
      len += 4;
    } else if (u <= 0x3FFFFFF) {
      len += 5;
    } else {
      len += 6;
    }
  }
  return len;
}
Module["lengthBytesUTF8"] = lengthBytesUTF8;

// Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.

function UTF16ToString(ptr) {
  var i = 0;

  var str = '';
  while (1) {
    var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
    if (codeUnit == 0)
      return str;
    ++i;
    // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
    str += String.fromCharCode(codeUnit);
  }
}


// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF16 form. The copy will require at most str.length*4+2 bytes of space in the HEAP.
// Use the function lengthBytesUTF16() to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   outPtr: Byte address in Emscripten HEAP where to write the string to.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array. This count should include the null 
//                    terminator, i.e. if maxBytesToWrite=2, only the null terminator will be written and nothing else.
//                    maxBytesToWrite<2 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF16(str, outPtr, maxBytesToWrite) {
  assert(typeof maxBytesToWrite == 'number', 'stringToUTF16(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
  // Backwards compatibility: if max bytes is not specified, assume unsafe unbounded write is allowed.
  if (maxBytesToWrite === undefined) {
    maxBytesToWrite = 0x7FFFFFFF;
  }
  if (maxBytesToWrite < 2) return 0;
  maxBytesToWrite -= 2; // Null terminator.
  var startPtr = outPtr;
  var numCharsToWrite = (maxBytesToWrite < str.length*2) ? (maxBytesToWrite / 2) : str.length;
  for (var i = 0; i < numCharsToWrite; ++i) {
    // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    HEAP16[((outPtr)>>1)]=codeUnit;
    outPtr += 2;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP16[((outPtr)>>1)]=0;
  return outPtr - startPtr;
}


// Returns the number of bytes the given Javascript string takes if encoded as a UTF16 byte array, EXCLUDING the null terminator byte.

function lengthBytesUTF16(str) {
  return str.length*2;
}


function UTF32ToString(ptr) {
  var i = 0;

  var str = '';
  while (1) {
    var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
    if (utf32 == 0)
      return str;
    ++i;
    // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    if (utf32 >= 0x10000) {
      var ch = utf32 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    } else {
      str += String.fromCharCode(utf32);
    }
  }
}


// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF32 form. The copy will require at most str.length*4+4 bytes of space in the HEAP.
// Use the function lengthBytesUTF32() to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   outPtr: Byte address in Emscripten HEAP where to write the string to.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array. This count should include the null 
//                    terminator, i.e. if maxBytesToWrite=4, only the null terminator will be written and nothing else.
//                    maxBytesToWrite<4 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF32(str, outPtr, maxBytesToWrite) {
  assert(typeof maxBytesToWrite == 'number', 'stringToUTF32(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
  // Backwards compatibility: if max bytes is not specified, assume unsafe unbounded write is allowed.
  if (maxBytesToWrite === undefined) {
    maxBytesToWrite = 0x7FFFFFFF;
  }
  if (maxBytesToWrite < 4) return 0;
  var startPtr = outPtr;
  var endPtr = startPtr + maxBytesToWrite - 4;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
      var trailSurrogate = str.charCodeAt(++i);
      codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
    }
    HEAP32[((outPtr)>>2)]=codeUnit;
    outPtr += 4;
    if (outPtr + 4 > endPtr) break;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP32[((outPtr)>>2)]=0;
  return outPtr - startPtr;
}


// Returns the number of bytes the given Javascript string takes if encoded as a UTF16 byte array, EXCLUDING the null terminator byte.

function lengthBytesUTF32(str) {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var codeUnit = str.charCodeAt(i);
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) ++i; // possibly a lead surrogate, so skip over the tail surrogate.
    len += 4;
  }

  return len;
}


function demangle(func) {
  var hasLibcxxabi = !!Module['___cxa_demangle'];
  if (hasLibcxxabi) {
    try {
      var buf = _malloc(func.length);
      writeStringToMemory(func.substr(1), buf);
      var status = _malloc(4);
      var ret = Module['___cxa_demangle'](buf, 0, 0, status);
      if (getValue(status, 'i32') === 0 && ret) {
        return Pointer_stringify(ret);
      }
      // otherwise, libcxxabi failed, we can try ours which may return a partial result
    } catch(e) {
      // failure when using libcxxabi, we can try ours which may return a partial result
      return func;
    } finally {
      if (buf) _free(buf);
      if (status) _free(status);
      if (ret) _free(ret);
    }
  }
  Runtime.warnOnce('warning: build with  -s DEMANGLE_SUPPORT=1  to link in libcxxabi demangling');
  return func;
}

function demangleAll(text) {
  return text.replace(/__Z[\w\d_]+/g, function(x) { var y = demangle(x); return x === y ? x : (x + ' [' + y + ']') });
}

function jsStackTrace() {
  var err = new Error();
  if (!err.stack) {
    // IE10+ special cases: It does have callstack info, but it is only populated if an Error object is thrown,
    // so try that as a special-case.
    try {
      throw new Error(0);
    } catch(e) {
      err = e;
    }
    if (!err.stack) {
      return '(no stack trace available)';
    }
  }
  return err.stack.toString();
}

function stackTrace() {
  return demangleAll(jsStackTrace());
}
Module["stackTrace"] = stackTrace;

// Memory management

var PAGE_SIZE = 4096;

function alignMemoryPage(x) {
  if (x % 4096 > 0) {
    x += (4096 - (x % 4096));
  }
  return x;
}

var HEAP;
var buffer;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;

function updateGlobalBuffer(buf) {
  Module['buffer'] = buffer = buf;
}

function updateGlobalBufferViews() {
  Module['HEAP8'] = HEAP8 = new Int8Array(buffer);
  Module['HEAP16'] = HEAP16 = new Int16Array(buffer);
  Module['HEAP32'] = HEAP32 = new Int32Array(buffer);
  Module['HEAPU8'] = HEAPU8 = new Uint8Array(buffer);
  Module['HEAPU16'] = HEAPU16 = new Uint16Array(buffer);
  Module['HEAPU32'] = HEAPU32 = new Uint32Array(buffer);
  Module['HEAPF32'] = HEAPF32 = new Float32Array(buffer);
  Module['HEAPF64'] = HEAPF64 = new Float64Array(buffer);
}

var STATIC_BASE = 0, STATICTOP = 0, staticSealed = false; // static area
var STACK_BASE = 0, STACKTOP = 0, STACK_MAX = 0; // stack area
var DYNAMIC_BASE = 0, DYNAMICTOP = 0; // dynamic area handled by sbrk


// Initializes the stack cookie. Called at the startup of main and at the startup of each thread in pthreads mode.
function writeStackCookie() {
  assert((STACK_MAX & 3) == 0);
  HEAPU32[(STACK_MAX >> 2)-1] = 0x02135467;
  HEAPU32[(STACK_MAX >> 2)-2] = 0x89BACDFE;
}

function checkStackCookie() {
  if (HEAPU32[(STACK_MAX >> 2)-1] != 0x02135467 || HEAPU32[(STACK_MAX >> 2)-2] != 0x89BACDFE) {
    abort('Stack overflow! Stack cookie has been overwritten, expected hex dwords 0x89BACDFE and 0x02135467, but received 0x' + HEAPU32[(STACK_MAX >> 2)-2].toString(16) + ' ' + HEAPU32[(STACK_MAX >> 2)-1].toString(16));
  }
}

function abortStackOverflow(allocSize) {
  abort('Stack overflow! Attempted to allocate ' + allocSize + ' bytes on the stack, but stack has only ' + (STACK_MAX - asm.stackSave() + allocSize) + ' bytes available!');
}

function abortOnCannotGrowMemory() {
  abort('Cannot enlarge memory arrays. Either (1) compile with  -s TOTAL_MEMORY=X  with X higher than the current value ' + TOTAL_MEMORY + ', (2) compile with  -s ALLOW_MEMORY_GROWTH=1  which adjusts the size at runtime but prevents some optimizations, (3) set Module.TOTAL_MEMORY to a higher value before the program runs, or if you want malloc to return NULL (0) instead of this abort, compile with  -s ABORTING_MALLOC=0 ');
}

function enlargeMemory() {
  abortOnCannotGrowMemory();
}


var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 16468992;

var totalMemory = 64*1024;
while (totalMemory < TOTAL_MEMORY || totalMemory < 2*TOTAL_STACK) {
  if (totalMemory < 16*1024*1024) {
    totalMemory *= 2;
  } else {
    totalMemory += 16*1024*1024
  }
}
if (totalMemory !== TOTAL_MEMORY) {
  Module.printErr('increasing TOTAL_MEMORY to ' + totalMemory + ' to be compliant with the asm.js spec (and given that TOTAL_STACK=' + TOTAL_STACK + ')');
  TOTAL_MEMORY = totalMemory;
}

// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(typeof Int32Array !== 'undefined' && typeof Float64Array !== 'undefined' && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
       'JS engine does not provide full typed array support');



// Use a provided buffer, if there is one, or else allocate a new one
if (Module['buffer']) {
  buffer = Module['buffer'];
  assert(buffer.byteLength === TOTAL_MEMORY, 'provided buffer should be ' + TOTAL_MEMORY + ' bytes, but it is ' + buffer.byteLength);
} else {
  buffer = new ArrayBuffer(TOTAL_MEMORY);
}
updateGlobalBufferViews();


// Endianness check (note: assumes compiler arch was little-endian)
HEAP32[0] = 255;
if (HEAPU8[0] !== 255 || HEAPU8[3] !== 0) throw 'Typed arrays 2 must be run on a little-endian system';

Module['HEAP'] = HEAP;
Module['buffer'] = buffer;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;

function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Runtime.dynCall('v', func);
      } else {
        Runtime.dynCall('vi', func, [callback.arg]);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}

var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATMAIN__    = []; // functions called when main() is to be run
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the runtime has exited

var runtimeInitialized = false;
var runtimeExited = false;


function preRun() {
  // compatibility - merge in anything from Module['preRun'] at this time
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}

function ensureInitRuntime() {
  checkStackCookie();
  if (runtimeInitialized) return;
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}

function preMain() {
  checkStackCookie();
  callRuntimeCallbacks(__ATMAIN__);
}

function exitRuntime() {
  checkStackCookie();
  callRuntimeCallbacks(__ATEXIT__);
  runtimeExited = true;
}

function postRun() {
  checkStackCookie();
  // compatibility - merge in anything from Module['postRun'] at this time
  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}

function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}
Module["addOnPreRun"] = addOnPreRun;

function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}
Module["addOnInit"] = addOnInit;

function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}
Module["addOnPreMain"] = addOnPreMain;

function addOnExit(cb) {
  __ATEXIT__.unshift(cb);
}
Module["addOnExit"] = addOnExit;

function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}
Module["addOnPostRun"] = addOnPostRun;

// Tools


function intArrayFromString(stringy, dontAddNull, length /* optional */) {
  var len = length > 0 ? length : lengthBytesUTF8(stringy)+1;
  var u8array = new Array(len);
  var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
  if (dontAddNull) u8array.length = numBytesWritten;
  return u8array;
}
Module["intArrayFromString"] = intArrayFromString;

function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      assert(false, 'Character code ' + chr + ' (' + String.fromCharCode(chr) + ')  at offset ' + i + ' not in 0x00-0xFF.');
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module["intArrayToString"] = intArrayToString;

function writeStringToMemory(string, buffer, dontAddNull) {
  var array = intArrayFromString(string, dontAddNull);
  var i = 0;
  while (i < array.length) {
    var chr = array[i];
    HEAP8[(((buffer)+(i))>>0)]=chr;
    i = i + 1;
  }
}
Module["writeStringToMemory"] = writeStringToMemory;

function writeArrayToMemory(array, buffer) {
  for (var i = 0; i < array.length; i++) {
    HEAP8[((buffer++)>>0)]=array[i];
  }
}
Module["writeArrayToMemory"] = writeArrayToMemory;

function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; ++i) {
    assert(str.charCodeAt(i) === str.charCodeAt(i)&0xff);
    HEAP8[((buffer++)>>0)]=str.charCodeAt(i);
  }
  // Null-terminate the pointer to the HEAP.
  if (!dontAddNull) HEAP8[((buffer)>>0)]=0;
}
Module["writeAsciiToMemory"] = writeAsciiToMemory;

function unSign(value, bits, ignore) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}


// check for imul support, and also for correctness ( https://bugs.webkit.org/show_bug.cgi?id=126345 )
if (!Math['imul'] || Math['imul'](0xffffffff, 5) !== -5) Math['imul'] = function imul(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};
Math.imul = Math['imul'];


if (!Math['clz32']) Math['clz32'] = function(x) {
  x = x >>> 0;
  for (var i = 0; i < 32; i++) {
    if (x & (1 << (31 - i))) return i;
  }
  return 32;
};
Math.clz32 = Math['clz32']

if (!Math['trunc']) Math['trunc'] = function(x) {
  return x < 0 ? Math.ceil(x) : Math.floor(x);
};
Math.trunc = Math['trunc'];

var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_min = Math.min;
var Math_clz32 = Math.clz32;
var Math_trunc = Math.trunc;

// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled
var runDependencyTracking = {};

function getUniqueRunDependency(id) {
  var orig = id;
  while (1) {
    if (!runDependencyTracking[id]) return id;
    id = orig + Math.random();
  }
  return id;
}

function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(!runDependencyTracking[id]);
    runDependencyTracking[id] = 1;
    if (runDependencyWatcher === null && typeof setInterval !== 'undefined') {
      // Check for missing dependencies every few seconds
      runDependencyWatcher = setInterval(function() {
        if (ABORT) {
          clearInterval(runDependencyWatcher);
          runDependencyWatcher = null;
          return;
        }
        var shown = false;
        for (var dep in runDependencyTracking) {
          if (!shown) {
            shown = true;
            Module.printErr('still waiting on run dependencies:');
          }
          Module.printErr('dependency: ' + dep);
        }
        if (shown) {
          Module.printErr('(end of list)');
        }
      }, 10000);
    }
  } else {
    Module.printErr('warning: run dependency added without ID');
  }
}
Module["addRunDependency"] = addRunDependency;

function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(runDependencyTracking[id]);
    delete runDependencyTracking[id];
  } else {
    Module.printErr('warning: run dependency removed without ID');
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}
Module["removeRunDependency"] = removeRunDependency;

Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data



var memoryInitializer = null;




// === Body ===

var ASM_CONSTS = [];




STATIC_BASE = 8;

STATICTOP = STATIC_BASE + 31248;
  /* global initializers */  __ATINIT__.push();
  

/* memory initializer */ allocate([183,4,0,0,8,0,0,0,191,4,0,0,9,0,0,0,198,4,0,0,156,4,0,0,207,4,0,0,13,0,0,0,217,4,0,0,225,4,0,0,226,4,0,0,224,4,0,0,237,4,0,0,118,4,0,0,245,4,0,0,27,0,0,0,255,4,0,0,32,0,0,0,8,5,0,0,75,4,0,0,17,5,0,0,78,4,0,0,25,5,0,0,77,4,0,0,32,5,0,0,74,4,0,0,40,5,0,0,80,4,0,0,48,5,0,0,82,4,0,0,54,5,0,0,79,4,0,0,63,5,0,0,81,4,0,0,71,5,0,0,73,4,0,0,81,5,0,0,127,0,0,0,91,5,0,0,48,0,0,0,93,5,0,0,49,0,0,0,95,5,0,0,50,0,0,0,97,5,0,0,51,0,0,0,99,5,0,0,52,0,0,0,101,5,0,0,53,0,0,0,103,5,0,0,54,0,0,0,105,5,0,0,55,0,0,0,107,5,0,0,57,0,0,0,109,5,0,0,57,0,0,0,111,5,0,0,97,0,0,0,113,5,0,0,98,0,0,0,115,5,0,0,99,0,0,0,117,5,0,0,100,0,0,0,119,5,0,0,101,0,0,0,121,5,0,0,102,0,0,0,123,5,0,0,103,0,0,0,125,5,0,0,104,0,0,0,127,5,0,0,105,0,0,0,129,5,0,0,106,0,0,0,131,5,0,0,107,0,0,0,133,5,0,0,108,0,0,0,135,5,0,0,109,0,0,0,137,5,0,0,110,0,0,0,139,5,0,0,111,0,0,0,141,5,0,0,112,0,0,0,143,5,0,0,113,0,0,0,145,5,0,0,114,0,0,0,147,5,0,0,115,0,0,0,149,5,0,0,116,0,0,0,151,5,0,0,117,0,0,0,153,5,0,0,118,0,0,0,155,5,0,0,119,0,0,0,157,5,0,0,120,0,0,0,159,5,0,0,121,0,0,0,161,5,0,0,122,0,0,0,163,5,0,0,98,4,0,0,174,5,0,0,89,4,0,0,185,5,0,0,90,4,0,0,196,5,0,0,91,4,0,0,207,5,0,0,92,4,0,0,218,5,0,0,93,4,0,0,229,5,0,0,94,4,0,0,240,5,0,0,95,4,0,0,251,5,0,0,97,4,0,0,6,6,0,0,97,4,0,0,17,6,0,0,85,4,0,0,29,6,0,0,87,4,0,0,36,6,0,0,86,4,0,0,48,6,0,0,99,4,0,0,59,6,0,0,84,4,0,0,69,6,0,0,225,4,0,0,79,6,0,0,229,4,0,0,89,6,0,0,224,4,0,0,101,6,0,0,228,4,0,0,113,6,0,0,226,4,0,0,122,6,0,0,230,4,0,0,0,0,0,0,0,0,0,0,1,0,0,0,2,0,0,0,3,0,0,0,4,0,0,0,5,0,0,0,6,0,0,0,7,0,0,0,8,0,0,0,9,0,0,0,10,0,0,0,11,0,0,0,12,0,0,0,13,0,0,0,14,0,0,0,15,0,0,0,16,0,0,0,180,2,0,0,5,0,0,0,0,0,0,0,0,0,0,0,17,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,18,0,0,0,19,0,0,0,250,117,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,255,255,255,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,40,3,0,0,5,0,0,0,0,0,0,0,0,0,0,0,17,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,20,0,0,0,19,0,0,0,2,118,0,0,0,4,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,10,255,255,255,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,40,3,0,0,71,76,95,73,78,86,65,76,73,68,95,69,78,85,77,0,71,76,95,73,78,86,65,76,73,68,95,86,65,76,85,69,0,71,76,95,73,78,86,65,76,73,68,95,79,80,69,82,65,84,73,79,78,0,71,76,95,73,78,86,65,76,73,68,95,70,82,65,77,69,66,85,70,70,69,82,95,79,80,69,82,65,84,73,79,78,0,71,76,95,79,85,84,95,79,70,95,77,69,77,79,82,89,0,71,76,95,83,84,65,67,75,95,85,78,68,69,82,70,76,79,87,0,71,76,95,83,84,65,67,75,95,79,86,69,82,70,76,79,87,0,60,85,110,107,110,111,119,110,32,101,114,114,111,114,62,0,114,98,0,77,97,112,112,105,110,103,58,32,37,115,10,0,85,110,107,110,111,119,110,32,107,101,121,58,32,37,115,10,0,37,115,44,32,37,115,58,32,37,100,10,0,100,97,116,97,47,99,104,111,111,115,101,103,97,109,101,0,73,110,105,116,105,97,108,105,122,101,100,32,99,104,105,109,112,56,32,99,111,114,101,10,0,73,110,105,116,105,97,108,105,122,101,32,71,76,32,115,116,97,116,101,10,0,83,101,116,116,105,110,103,32,109,97,105,110,32,108,111,111,112,10,0,86,75,95,66,65,67,75,0,86,75,95,84,65,66,0,86,75,95,67,76,69,65,82,0,86,75,95,82,69,84,85,82,78,0,86,75,95,83,72,73,70,84,0,86,75,95,67,79,78,84,82,79,76,0,86,75,95,77,69,78,85,0,86,75,95,69,83,67,65,80,69,0,86,75,95,83,80,65,67,69,0,86,75,95,80,82,73,79,82,0,86,75,95,78,69,88,84,0,86,75,95,69,78,68,0,86,75,95,72,79,77,69,0,86,75,95,76,69,70,84,0,86,75,95,85,80,0,86,75,95,82,73,71,72,84,0,86,75,95,68,79,87,78,0,86,75,95,73,78,83,69,82,84,0,86,75,95,68,69,76,69,84,69,0,48,0,49,0,50,0,51,0,52,0,53,0,54,0,55,0,56,0,57,0,65,0,66,0,67,0,68,0,69,0,70,0,71,0,72,0,73,0,74,0,75,0,76,0,77,0,78,0,79,0,80,0,81,0,82,0,83,0,84,0,85,0,86,0,87,0,88,0,89,0,90,0,86,75,95,78,85,77,80,65,68,48,0,86,75,95,78,85,77,80,65,68,49,0,86,75,95,78,85,77,80,65,68,50,0,86,75,95,78,85,77,80,65,68,51,0,86,75,95,78,85,77,80,65,68,52,0,86,75,95,78,85,77,80,65,68,53,0,86,75,95,78,85,77,80,65,68,54,0,86,75,95,78,85,77,80,65,68,55,0,86,75,95,78,85,77,80,65,68,56,0,86,75,95,78,85,77,80,65,68,57,0,86,75,95,77,85,76,84,73,80,76,89,0,86,75,95,65,68,68,0,86,75,95,83,85,66,84,82,65,67,84,0,86,75,95,68,69,67,73,77,65,76,0,86,75,95,68,73,86,73,68,69,0,86,75,95,76,83,72,73,70,84,0,86,75,95,82,83,72,73,70,84,0,86,75,95,76,67,79,78,84,82,79,76,0,86,75,95,82,67,79,78,84,82,79,76,0,86,75,95,76,77,69,78,85,0,86,75,95,82,77,69,78,85,0,37,100,58,32,37,115,10,0,105,110,105,116,32,105,109,97,103,101,32,112,114,111,103,114,97,109,46,46,46,10,0,70,97,105,108,101,100,32,116,111,32,105,110,105,116,32,105,109,97,103,101,32,112,114,111,103,114,97,109,10,0,10,35,105,102,100,101,102,32,71,76,95,69,83,10,112,114,101,99,105,115,105,111,110,32,109,101,100,105,117,109,112,32,102,108,111,97,116,59,10,35,101,110,100,105,102,10,118,97,114,121,105,110,103,32,118,101,99,50,32,118,95,116,101,120,99,111,111,114,100,59,10,117,110,105,102,111,114,109,32,115,97,109,112,108,101,114,50,68,32,117,95,115,97,109,112,108,101,114,59,10,117,110,105,102,111,114,109,32,118,101,99,52,32,117,95,99,111,108,111,114,59,10,118,111,105,100,32,109,97,105,110,40,41,10,123,10,9,118,101,99,52,32,99,111,108,111,114,32,61,32,116,101,120,116,117,114,101,50,68,40,117,95,115,97,109,112,108,101,114,44,32,118,95,116,101,120,99,111,111,114,100,41,59,10,9,103,108,95,70,114,97,103,67,111,108,111,114,32,61,32,99,111,108,111,114,32,42,32,117,95,99,111,108,111,114,59,10,125,10,0,10,35,105,102,100,101,102,32,71,76,95,69,83,10,112,114,101,99,105,115,105,111,110,32,109,101,100,105,117,109,112,32,102,108,111,97,116,59,10,35,101,110,100,105,102,10,117,110,105,102,111,114,109,32,118,101,99,50,32,117,95,111,102,102,115,101,116,59,10,117,110,105,102,111,114,109,32,118,101,99,50,32,117,95,115,99,97,108,101,59,10,97,116,116,114,105,98,117,116,101,32,118,101,99,52,32,97,95,112,111,115,105,116,105,111,110,59,10,97,116,116,114,105,98,117,116,101,32,118,101,99,50,32,97,95,116,101,120,99,111,111,114,100,59,10,118,97,114,121,105,110,103,32,118,101,99,50,32,118,95,116,101,120,99,111,111,114,100,59,10,118,111,105,100,32,109,97,105,110,40,41,10,123,10,9,103,108,95,80,111,115,105,116,105,111,110,32,61,32,118,101,99,52,40,40,97,95,112,111,115,105,116,105,111,110,46,120,121,32,45,32,117,95,111,102,102,115,101,116,41,32,42,32,117,95,115,99,97,108,101,44,32,49,46,48,44,32,49,46,48,41,59,10,9,118,95,116,101,120,99,111,111,114,100,32,61,32,97,95,116,101,120,99,111,111,114,100,59,10,125,10,0,37,115,10,0,117,95,111,102,102,115,101,116,0,117,95,115,99,97,108,101,0,97,95,112,111,115,105,116,105,111,110,0,97,95,116,101,120,99,111,111,114,100,0,117,95,115,97,109,112,108,101,114,0,117,95,99,111,108,111,114,0,99,111,109,112,105,108,101,95,115,116,97,116,117,115,32,33,61,32,71,76,95,84,82,85,69,0,108,105,110,107,95,115,116,97,116,117,115,32,33,61,32,71,76,95,84,82,85,69,0,99,104,105,109,112,56,32,101,114,114,111,114,58,32,37,115,10,0,32,32,105,110,115,116,114,117,99,116,105,111,110,58,32,48,120,37,88,10,0,79,107,0,67,97,108,108,101,100,32,82,67,65,32,49,56,48,50,32,80,114,111,103,114,97,109,0,78,111,32,115,117,99,104,32,105,110,115,116,114,117,99,116,105,111,110,0,82,79,77,32,116,111,111,32,108,97,114,103,101,0,79,117,116,32,111,102,32,109,101,109,111,114,121,0,67,111,117,108,100,32,110,111,116,32,114,101,97,100,32,101,110,116,105,114,101,32,114,111,109,0,85,110,107,110,111,119,110,0,240,144,144,144,240,32,96,32,32,112,240,16,240,128,240,240,16,240,16,240,144,144,240,16,16,240,128,240,16,240,240,128,240,144,240,240,16,32,64,64,240,144,240,144,240,240,144,240,16,240,240,144,240,144,144,224,144,224,144,224,240,128,128,128,240,224,144,144,144,224,240,128,240,128,240,240,128,240,128,128,17,0,10,0,17,17,17,0,0,0,0,5,0,0,0,0,0,0,9,0,0,0,0,11,0,0,0,0,0,0,0,0,17,0,15,10,17,17,17,3,10,7,0,1,19,9,11,11,0,0,9,6,11,0,0,11,0,6,17,0,0,0,17,17,17,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,11,0,0,0,0,0,0,0,0,17,0,10,10,17,17,17,0,10,0,0,2,0,9,11,0,0,0,9,0,11,0,0,11,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,12,0,0,0,0,12,0,0,0,0,9,12,0,0,0,0,0,12,0,0,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,14,0,0,0,0,0,0,0,0,0,0,0,13,0,0,0,4,13,0,0,0,0,9,14,0,0,0,0,0,14,0,0,14,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,0,0,0,0,0,0,0,0,0,0,0,15,0,0,0,0,15,0,0,0,0,9,16,0,0,0,0,0,16,0,0,16,0,0,18,0,0,0,18,18,18,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,18,0,0,0,18,18,18,0,0,0,0,0,0,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,11,0,0,0,0,0,0,0,0,0,0,0,10,0,0,0,0,10,0,0,0,0,9,11,0,0,0,0,0,11,0,0,11,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,12,0,0,0,0,12,0,0,0,0,9,12,0,0,0,0,0,12,0,0,12,0,0,48,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,45,43,32,32,32,48,88,48,120,0,84,33,34,25,13,1,2,3,17,75,28,12,16,4,11,29,18,30,39,104,110,111,112,113,98,32,5,6,15,19,20,21,26,8,22,7,40,36,23,24,9,10,14,27,31,37,35,131,130,125,38,42,43,60,61,62,63,67,71,74,77,88,89,90,91,92,93,94,95,96,97,99,100,101,102,103,105,106,107,108,114,115,116,121,122,123,124,0,73,108,108,101,103,97,108,32,98,121,116,101,32,115,101,113,117,101,110,99,101,0,68,111,109,97,105,110,32,101,114,114,111,114,0,82,101,115,117,108,116,32,110,111,116,32,114,101,112,114,101,115,101,110,116,97,98,108,101,0,78,111,116,32,97,32,116,116,121,0,80,101,114,109,105,115,115,105,111,110,32,100,101,110,105,101,100,0,79,112,101,114,97,116,105,111,110,32,110,111,116,32,112,101,114,109,105,116,116,101,100,0,78,111,32,115,117,99,104,32,102,105,108,101,32,111,114,32,100,105,114,101,99,116,111,114,121,0,78,111,32,115,117,99,104,32,112,114,111,99,101,115,115,0,70,105,108,101,32,101,120,105,115,116,115,0,86,97,108,117,101,32,116,111,111,32,108,97,114,103,101,32,102,111,114,32,100,97,116,97,32,116,121,112,101,0,78,111,32,115,112,97,99,101,32,108,101,102,116,32,111,110,32,100,101,118,105,99,101,0,79,117,116,32,111,102,32,109,101,109,111,114,121,0,82,101,115,111,117,114,99,101,32,98,117,115,121,0,73,110,116,101,114,114,117,112,116,101,100,32,115,121,115,116,101,109,32,99,97,108,108,0,82,101,115,111,117,114,99,101,32,116,101,109,112,111,114,97,114,105,108,121,32,117,110,97,118,97,105,108,97,98,108,101,0,73,110,118,97,108,105,100,32,115,101,101,107,0,67,114,111,115,115,45,100,101,118,105,99,101,32,108,105,110,107,0,82,101,97,100,45,111,110,108,121,32,102,105,108,101,32,115,121,115,116,101,109,0,68,105,114,101,99,116,111,114,121,32,110,111,116,32,101,109,112,116,121,0,67,111,110,110,101,99,116,105,111,110,32,114,101,115,101,116,32,98,121,32,112,101,101,114,0,79,112,101,114,97,116,105,111,110,32,116,105,109,101,100,32,111,117,116,0,67,111,110,110,101,99,116,105,111,110,32,114,101,102,117,115,101,100,0,72,111,115,116,32,105,115,32,100,111,119,110,0,72,111,115,116,32,105,115,32,117,110,114,101,97,99,104,97,98,108,101,0,65,100,100,114,101,115,115,32,105,110,32,117,115,101,0,66,114,111,107,101,110,32,112,105,112,101,0,73,47,79,32,101,114,114,111,114,0,78,111,32,115,117,99,104,32,100,101,118,105,99,101,32,111,114,32,97,100,100,114,101,115,115,0,66,108,111,99,107,32,100,101,118,105,99,101,32,114,101,113,117,105,114,101,100,0,78,111,32,115,117,99,104,32,100,101,118,105,99,101,0,78,111,116,32,97,32,100,105,114,101,99,116,111,114,121,0,73,115,32,97,32,100,105,114,101,99,116,111,114,121,0,84,101,120,116,32,102,105,108,101,32,98,117,115,121,0,69,120,101,99,32,102,111,114,109,97,116,32,101,114,114,111,114,0,73,110,118,97,108,105,100,32,97,114,103,117,109,101,110,116,0,65,114,103,117,109,101,110,116,32,108,105,115,116,32,116,111,111,32,108,111,110,103,0,83,121,109,98,111,108,105,99,32,108,105,110,107,32,108,111,111,112,0,70,105,108,101,110,97,109,101,32,116,111,111,32,108,111,110,103,0,84,111,111,32,109,97,110,121,32,111,112,101,110,32,102,105,108,101,115,32,105,110,32,115,121,115,116,101,109,0,78,111,32,102,105,108,101,32,100,101,115,99,114,105,112,116,111,114,115,32,97,118,97,105,108,97,98,108,101,0,66,97,100,32,102,105,108,101,32,100,101,115,99,114,105,112,116,111,114,0,78,111,32,99,104,105,108,100,32,112,114,111,99,101,115,115,0,66,97,100,32,97,100,100,114,101,115,115,0,70,105,108,101,32,116,111,111,32,108,97,114,103,101,0,84,111,111,32,109,97,110,121,32,108,105,110,107,115,0,78,111,32,108,111,99,107,115,32,97,118,97,105,108,97,98,108,101,0,82,101,115,111,117,114,99,101,32,100,101,97,100,108,111,99,107,32,119,111,117,108,100,32,111,99,99,117,114,0,83,116,97,116,101,32,110,111,116,32,114,101,99,111,118,101,114,97,98,108,101,0,80,114,101,118,105,111,117,115,32,111,119,110,101,114,32,100,105,101,100,0,79,112,101,114,97,116,105,111,110,32,99,97,110,99,101,108,101,100,0,70,117,110,99,116,105,111,110,32,110,111,116,32,105,109,112,108,101,109,101,110,116,101,100,0,78,111,32,109,101,115,115,97,103,101,32,111,102,32,100,101,115,105,114,101,100,32,116,121,112,101,0,73,100,101,110,116,105,102,105,101,114,32,114,101,109,111,118,101,100,0,68,101,118,105,99,101,32,110,111,116,32,97,32,115,116,114,101,97,109,0,78,111,32,100,97,116,97,32,97,118,97,105,108,97,98,108,101,0,68,101,118,105,99,101,32,116,105,109,101,111,117,116,0,79,117,116,32,111,102,32,115,116,114,101,97,109,115,32,114,101,115,111,117,114,99,101,115,0,76,105,110,107,32,104,97,115,32,98,101,101,110,32,115,101,118,101,114,101,100,0,80,114,111,116,111,99,111,108,32,101,114,114,111,114,0,66,97,100,32,109,101,115,115,97,103,101,0,70,105,108,101,32,100,101,115,99,114,105,112,116,111,114,32,105,110,32,98,97,100,32,115,116,97,116,101,0,78,111,116,32,97,32,115,111,99,107,101,116,0,68,101,115,116,105,110,97,116,105,111,110,32,97,100,100,114,101,115,115,32,114,101,113,117,105,114,101,100,0,77,101,115,115,97,103,101,32,116,111,111,32,108,97,114,103,101,0,80,114,111,116,111,99,111,108,32,119,114,111,110,103,32,116,121,112,101,32,102,111,114,32,115,111,99,107,101,116,0,80,114,111,116,111,99,111,108,32,110,111,116,32,97,118,97,105,108,97,98,108,101,0,80,114,111,116,111,99,111,108,32,110,111,116,32,115,117,112,112,111,114,116,101,100,0,83,111,99,107,101,116,32,116,121,112,101,32,110,111,116,32,115,117,112,112,111,114,116,101,100,0,78,111,116,32,115,117,112,112,111,114,116,101,100,0,80,114,111,116,111,99,111,108,32,102,97,109,105,108,121,32,110,111,116,32,115,117,112,112,111,114,116,101,100,0,65,100,100,114,101,115,115,32,102,97,109,105,108,121,32,110,111,116,32,115,117,112,112,111,114,116,101,100,32,98,121,32,112,114,111,116,111,99,111,108,0,65,100,100,114,101,115,115,32,110,111,116,32,97,118,97,105,108,97,98,108,101,0,78,101,116,119,111,114,107,32,105,115,32,100,111,119,110,0,78,101,116,119,111,114,107,32,117,110,114,101,97,99,104,97,98,108,101,0,67,111,110,110,101,99,116,105,111,110,32,114,101,115,101,116,32,98,121,32,110,101,116,119,111,114,107,0,67,111,110,110,101,99,116,105,111,110,32,97,98,111,114,116,101,100,0,78,111,32,98,117,102,102,101,114,32,115,112,97,99,101,32,97,118,97,105,108,97,98,108,101,0,83,111,99,107,101,116,32,105,115,32,99,111,110,110,101,99,116,101,100,0,83,111,99,107,101,116,32,110,111,116,32,99,111,110,110,101,99,116,101,100,0,67,97,110,110,111,116,32,115,101,110,100,32,97,102,116,101,114,32,115,111,99,107,101,116,32,115,104,117,116,100,111,119,110,0,79,112,101,114,97,116,105,111,110,32,97,108,114,101,97,100,121,32,105,110,32,112,114,111,103,114,101,115,115,0,79,112,101,114,97,116,105,111,110,32,105,110,32,112,114,111,103,114,101,115,115,0,83,116,97,108,101,32,102,105,108,101,32,104,97,110,100,108,101,0,82,101,109,111,116,101,32,73,47,79,32,101,114,114,111,114,0,81,117,111,116,97,32,101,120,99,101,101,100,101,100,0,78,111,32,109,101,100,105,117,109,32,102,111,117,110,100,0,87,114,111,110,103,32,109,101,100,105,117,109,32,116,121,112,101,0,78,111,32,101,114,114,111,114,32,105,110,102,111,114,109,97,116,105,111,110,0,0,40,110,117,108,108,41,0,45,48,88,43,48,88,32,48,88,45,48,120,43,48,120,32,48,120,0,105,110,102,0,73,78,70,0,110,97,110,0,78,65,78,0,46,0,114,119,97,0], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE);





/* no memory initializer */
var tempDoublePtr = STATICTOP; STATICTOP += 16;

assert(tempDoublePtr % 8 == 0);

function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much

  HEAP8[tempDoublePtr] = HEAP8[ptr];

  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];

  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];

  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];

}

function copyTempDouble(ptr) {

  HEAP8[tempDoublePtr] = HEAP8[ptr];

  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];

  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];

  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];

  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];

  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];

  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];

  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];

}

// {{PRE_LIBRARY}}


   
  Module["_i64Subtract"] = _i64Subtract;

  
  var GL={counter:1,lastError:0,buffers:[],mappedBuffers:{},programs:[],framebuffers:[],renderbuffers:[],textures:[],uniforms:[],shaders:[],vaos:[],contexts:[],currentContext:null,byteSizeByTypeRoot:5120,byteSizeByType:[1,1,2,2,4,4,4,2,3,4,8],programInfos:{},stringCache:{},packAlignment:4,unpackAlignment:4,init:function () {
        GL.miniTempBuffer = new Float32Array(GL.MINI_TEMP_BUFFER_SIZE);
        for (var i = 0; i < GL.MINI_TEMP_BUFFER_SIZE; i++) {
          GL.miniTempBufferViews[i] = GL.miniTempBuffer.subarray(0, i+1);
        }
      },recordError:function recordError(errorCode) {
        if (!GL.lastError) {
          GL.lastError = errorCode;
        }
      },getNewId:function (table) {
        var ret = GL.counter++;
        for (var i = table.length; i < ret; i++) {
          table[i] = null;
        }
        return ret;
      },MINI_TEMP_BUFFER_SIZE:256,miniTempBuffer:null,miniTempBufferViews:[0],getSource:function (shader, count, string, length) {
        var source = '';
        for (var i = 0; i < count; ++i) {
          var frag;
          if (length) {
            var len = HEAP32[(((length)+(i*4))>>2)];
            if (len < 0) {
              frag = Pointer_stringify(HEAP32[(((string)+(i*4))>>2)]);
            } else {
              frag = Pointer_stringify(HEAP32[(((string)+(i*4))>>2)], len);
            }
          } else {
            frag = Pointer_stringify(HEAP32[(((string)+(i*4))>>2)]);
          }
          source += frag;
        }
        return source;
      },createContext:function (canvas, webGLContextAttributes) {
        if (typeof webGLContextAttributes.majorVersion === 'undefined' && typeof webGLContextAttributes.minorVersion === 'undefined') {
          webGLContextAttributes.majorVersion = 1;
          webGLContextAttributes.minorVersion = 0;
        }
        var ctx;
        var errorInfo = '?';
        function onContextCreationError(event) {
          errorInfo = event.statusMessage || errorInfo;
        }
        try {
          canvas.addEventListener('webglcontextcreationerror', onContextCreationError, false);
          try {
            if (webGLContextAttributes.majorVersion == 1 && webGLContextAttributes.minorVersion == 0) {
              ctx = canvas.getContext("webgl", webGLContextAttributes) || canvas.getContext("experimental-webgl", webGLContextAttributes);
            } else if (webGLContextAttributes.majorVersion == 2 && webGLContextAttributes.minorVersion == 0) {
              ctx = canvas.getContext("webgl2", webGLContextAttributes) || canvas.getContext("experimental-webgl2", webGLContextAttributes);
            } else {
              throw 'Unsupported WebGL context version ' + majorVersion + '.' + minorVersion + '!'
            }
          } finally {
            canvas.removeEventListener('webglcontextcreationerror', onContextCreationError, false);
          }
          if (!ctx) throw ':(';
        } catch (e) {
          Module.print('Could not create canvas: ' + [errorInfo, e, JSON.stringify(webGLContextAttributes)]);
          return 0;
        }
        // possible GL_DEBUG entry point: ctx = wrapDebugGL(ctx);
  
        if (!ctx) return 0;
        return GL.registerContext(ctx, webGLContextAttributes);
      },registerContext:function (ctx, webGLContextAttributes) {
        var handle = GL.getNewId(GL.contexts);
        var context = {
          handle: handle,
          version: webGLContextAttributes.majorVersion,
          GLctx: ctx
        };
        // Store the created context object so that we can access the context given a canvas without having to pass the parameters again.
        if (ctx.canvas) ctx.canvas.GLctxObject = context;
        GL.contexts[handle] = context;
        if (typeof webGLContextAttributes['enableExtensionsByDefault'] === 'undefined' || webGLContextAttributes.enableExtensionsByDefault) {
          GL.initExtensions(context);
        }
        return handle;
      },makeContextCurrent:function (contextHandle) {
        var context = GL.contexts[contextHandle];
        if (!context) return false;
        GLctx = Module.ctx = context.GLctx; // Active WebGL context object.
        GL.currentContext = context; // Active Emscripten GL layer context object.
        return true;
      },getContext:function (contextHandle) {
        return GL.contexts[contextHandle];
      },deleteContext:function (contextHandle) {
        if (GL.currentContext === GL.contexts[contextHandle]) GL.currentContext = null;
        if (typeof JSEvents === 'object') JSEvents.removeAllHandlersOnTarget(GL.contexts[contextHandle].GLctx.canvas); // Release all JS event handlers on the DOM element that the GL context is associated with since the context is now deleted.
        if (GL.contexts[contextHandle] && GL.contexts[contextHandle].GLctx.canvas) GL.contexts[contextHandle].GLctx.canvas.GLctxObject = undefined; // Make sure the canvas object no longer refers to the context object so there are no GC surprises.
        GL.contexts[contextHandle] = null;
      },initExtensions:function (context) {
        // If this function is called without a specific context object, init the extensions of the currently active context.
        if (!context) context = GL.currentContext;
  
        if (context.initExtensionsDone) return;
        context.initExtensionsDone = true;
  
        var GLctx = context.GLctx;
  
        context.maxVertexAttribs = GLctx.getParameter(GLctx.MAX_VERTEX_ATTRIBS);
  
        // Detect the presence of a few extensions manually, this GL interop layer itself will need to know if they exist. 
  
        if (context.version < 2) {
          // Extension available from Firefox 26 and Google Chrome 30
          var instancedArraysExt = GLctx.getExtension('ANGLE_instanced_arrays');
          if (instancedArraysExt) {
            GLctx['vertexAttribDivisor'] = function(index, divisor) { instancedArraysExt['vertexAttribDivisorANGLE'](index, divisor); };
            GLctx['drawArraysInstanced'] = function(mode, first, count, primcount) { instancedArraysExt['drawArraysInstancedANGLE'](mode, first, count, primcount); };
            GLctx['drawElementsInstanced'] = function(mode, count, type, indices, primcount) { instancedArraysExt['drawElementsInstancedANGLE'](mode, count, type, indices, primcount); };
          }
  
          // Extension available from Firefox 25 and WebKit
          var vaoExt = GLctx.getExtension('OES_vertex_array_object');
          if (vaoExt) {
            GLctx['createVertexArray'] = function() { return vaoExt['createVertexArrayOES'](); };
            GLctx['deleteVertexArray'] = function(vao) { vaoExt['deleteVertexArrayOES'](vao); };
            GLctx['bindVertexArray'] = function(vao) { vaoExt['bindVertexArrayOES'](vao); };
            GLctx['isVertexArray'] = function(vao) { return vaoExt['isVertexArrayOES'](vao); };
          }
  
          var drawBuffersExt = GLctx.getExtension('WEBGL_draw_buffers');
          if (drawBuffersExt) {
            GLctx['drawBuffers'] = function(n, bufs) { drawBuffersExt['drawBuffersWEBGL'](n, bufs); };
          }
        }
  
        // These are the 'safe' feature-enabling extensions that don't add any performance impact related to e.g. debugging, and
        // should be enabled by default so that client GLES2/GL code will not need to go through extra hoops to get its stuff working.
        // As new extensions are ratified at http://www.khronos.org/registry/webgl/extensions/ , feel free to add your new extensions
        // here, as long as they don't produce a performance impact for users that might not be using those extensions.
        // E.g. debugging-related extensions should probably be off by default.
        var automaticallyEnabledExtensions = [ "OES_texture_float", "OES_texture_half_float", "OES_standard_derivatives",
                                               "OES_vertex_array_object", "WEBGL_compressed_texture_s3tc", "WEBGL_depth_texture",
                                               "OES_element_index_uint", "EXT_texture_filter_anisotropic", "ANGLE_instanced_arrays",
                                               "OES_texture_float_linear", "OES_texture_half_float_linear", "WEBGL_compressed_texture_atc",
                                               "WEBGL_compressed_texture_pvrtc", "EXT_color_buffer_half_float", "WEBGL_color_buffer_float",
                                               "EXT_frag_depth", "EXT_sRGB", "WEBGL_draw_buffers", "WEBGL_shared_resources",
                                               "EXT_shader_texture_lod" ];
  
        function shouldEnableAutomatically(extension) {
          var ret = false;
          automaticallyEnabledExtensions.forEach(function(include) {
            if (ext.indexOf(include) != -1) {
              ret = true;
            }
          });
          return ret;
        }
  
        var exts = GLctx.getSupportedExtensions();
        if (exts && exts.length > 0) {
          GLctx.getSupportedExtensions().forEach(function(ext) {
            if (automaticallyEnabledExtensions.indexOf(ext) != -1) {
              GLctx.getExtension(ext); // Calling .getExtension enables that extension permanently, no need to store the return value to be enabled.
            }
          });
        }
      },populateUniformTable:function (program) {
        var p = GL.programs[program];
        GL.programInfos[program] = {
          uniforms: {},
          maxUniformLength: 0, // This is eagerly computed below, since we already enumerate all uniforms anyway.
          maxAttributeLength: -1 // This is lazily computed and cached, computed when/if first asked, "-1" meaning not computed yet.
        };
  
        var ptable = GL.programInfos[program];
        var utable = ptable.uniforms;
        // A program's uniform table maps the string name of an uniform to an integer location of that uniform.
        // The global GL.uniforms map maps integer locations to WebGLUniformLocations.
        var numUniforms = GLctx.getProgramParameter(p, GLctx.ACTIVE_UNIFORMS);
        for (var i = 0; i < numUniforms; ++i) {
          var u = GLctx.getActiveUniform(p, i);
  
          var name = u.name;
          ptable.maxUniformLength = Math.max(ptable.maxUniformLength, name.length+1);
  
          // Strip off any trailing array specifier we might have got, e.g. "[0]".
          if (name.indexOf(']', name.length-1) !== -1) {
            var ls = name.lastIndexOf('[');
            name = name.slice(0, ls);
          }
  
          // Optimize memory usage slightly: If we have an array of uniforms, e.g. 'vec3 colors[3];', then 
          // only store the string 'colors' in utable, and 'colors[0]', 'colors[1]' and 'colors[2]' will be parsed as 'colors'+i.
          // Note that for the GL.uniforms table, we still need to fetch the all WebGLUniformLocations for all the indices.
          var loc = GLctx.getUniformLocation(p, name);
          var id = GL.getNewId(GL.uniforms);
          utable[name] = [u.size, id];
          GL.uniforms[id] = loc;
  
          for (var j = 1; j < u.size; ++j) {
            var n = name + '['+j+']';
            loc = GLctx.getUniformLocation(p, n);
            id = GL.getNewId(GL.uniforms);
  
            GL.uniforms[id] = loc;
          }
        }
      }};function _glClearColor(x0, x1, x2, x3) { GLctx.clearColor(x0, x1, x2, x3) }

   
  Module["_i64Add"] = _i64Add;

  function _glUseProgram(program) {
      GLctx.useProgram(program ? GL.programs[program] : null);
    }

  function _glDisableVertexAttribArray(index) {
      GLctx.disableVertexAttribArray(index);
    }

  function _glLinkProgram(program) {
      GLctx.linkProgram(GL.programs[program]);
      GL.programInfos[program] = null; // uniforms no longer keep the same names after linking
      GL.populateUniformTable(program);
    }

  function _glShaderSource(shader, count, string, length) {
      var source = GL.getSource(shader, count, string, length);
      GLctx.shaderSource(GL.shaders[shader], source);
    }

  function _glBindTexture(target, texture) {
      GLctx.bindTexture(target, texture ? GL.textures[texture] : null);
    }

  
  
  
  var ERRNO_CODES={EPERM:1,ENOENT:2,ESRCH:3,EINTR:4,EIO:5,ENXIO:6,E2BIG:7,ENOEXEC:8,EBADF:9,ECHILD:10,EAGAIN:11,EWOULDBLOCK:11,ENOMEM:12,EACCES:13,EFAULT:14,ENOTBLK:15,EBUSY:16,EEXIST:17,EXDEV:18,ENODEV:19,ENOTDIR:20,EISDIR:21,EINVAL:22,ENFILE:23,EMFILE:24,ENOTTY:25,ETXTBSY:26,EFBIG:27,ENOSPC:28,ESPIPE:29,EROFS:30,EMLINK:31,EPIPE:32,EDOM:33,ERANGE:34,ENOMSG:42,EIDRM:43,ECHRNG:44,EL2NSYNC:45,EL3HLT:46,EL3RST:47,ELNRNG:48,EUNATCH:49,ENOCSI:50,EL2HLT:51,EDEADLK:35,ENOLCK:37,EBADE:52,EBADR:53,EXFULL:54,ENOANO:55,EBADRQC:56,EBADSLT:57,EDEADLOCK:35,EBFONT:59,ENOSTR:60,ENODATA:61,ETIME:62,ENOSR:63,ENONET:64,ENOPKG:65,EREMOTE:66,ENOLINK:67,EADV:68,ESRMNT:69,ECOMM:70,EPROTO:71,EMULTIHOP:72,EDOTDOT:73,EBADMSG:74,ENOTUNIQ:76,EBADFD:77,EREMCHG:78,ELIBACC:79,ELIBBAD:80,ELIBSCN:81,ELIBMAX:82,ELIBEXEC:83,ENOSYS:38,ENOTEMPTY:39,ENAMETOOLONG:36,ELOOP:40,EOPNOTSUPP:95,EPFNOSUPPORT:96,ECONNRESET:104,ENOBUFS:105,EAFNOSUPPORT:97,EPROTOTYPE:91,ENOTSOCK:88,ENOPROTOOPT:92,ESHUTDOWN:108,ECONNREFUSED:111,EADDRINUSE:98,ECONNABORTED:103,ENETUNREACH:101,ENETDOWN:100,ETIMEDOUT:110,EHOSTDOWN:112,EHOSTUNREACH:113,EINPROGRESS:115,EALREADY:114,EDESTADDRREQ:89,EMSGSIZE:90,EPROTONOSUPPORT:93,ESOCKTNOSUPPORT:94,EADDRNOTAVAIL:99,ENETRESET:102,EISCONN:106,ENOTCONN:107,ETOOMANYREFS:109,EUSERS:87,EDQUOT:122,ESTALE:116,ENOTSUP:95,ENOMEDIUM:123,EILSEQ:84,EOVERFLOW:75,ECANCELED:125,ENOTRECOVERABLE:131,EOWNERDEAD:130,ESTRPIPE:86};
  
  var ERRNO_MESSAGES={0:"Success",1:"Not super-user",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"I/O error",6:"No such device or address",7:"Arg list too long",8:"Exec format error",9:"Bad file number",10:"No children",11:"No more processes",12:"Not enough core",13:"Permission denied",14:"Bad address",15:"Block device required",16:"Mount device busy",17:"File exists",18:"Cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Not a typewriter",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read only file system",31:"Too many links",32:"Broken pipe",33:"Math arg out of domain of func",34:"Math result not representable",35:"File locking deadlock error",36:"File or path name too long",37:"No record locks available",38:"Function not implemented",39:"Directory not empty",40:"Too many symbolic links",42:"No message of desired type",43:"Identifier removed",44:"Channel number out of range",45:"Level 2 not synchronized",46:"Level 3 halted",47:"Level 3 reset",48:"Link number out of range",49:"Protocol driver not attached",50:"No CSI structure available",51:"Level 2 halted",52:"Invalid exchange",53:"Invalid request descriptor",54:"Exchange full",55:"No anode",56:"Invalid request code",57:"Invalid slot",59:"Bad font file fmt",60:"Device not a stream",61:"No data (for no delay io)",62:"Timer expired",63:"Out of streams resources",64:"Machine is not on the network",65:"Package not installed",66:"The object is remote",67:"The link has been severed",68:"Advertise error",69:"Srmount error",70:"Communication error on send",71:"Protocol error",72:"Multihop attempted",73:"Cross mount point (not really error)",74:"Trying to read unreadable message",75:"Value too large for defined data type",76:"Given log. name not unique",77:"f.d. invalid for this operation",78:"Remote address changed",79:"Can   access a needed shared lib",80:"Accessing a corrupted shared lib",81:".lib section in a.out corrupted",82:"Attempting to link in too many libs",83:"Attempting to exec a shared library",84:"Illegal byte sequence",86:"Streams pipe error",87:"Too many users",88:"Socket operation on non-socket",89:"Destination address required",90:"Message too long",91:"Protocol wrong type for socket",92:"Protocol not available",93:"Unknown protocol",94:"Socket type not supported",95:"Not supported",96:"Protocol family not supported",97:"Address family not supported by protocol family",98:"Address already in use",99:"Address not available",100:"Network interface is not configured",101:"Network is unreachable",102:"Connection reset by network",103:"Connection aborted",104:"Connection reset by peer",105:"No buffer space available",106:"Socket is already connected",107:"Socket is not connected",108:"Can't send after socket shutdown",109:"Too many references",110:"Connection timed out",111:"Connection refused",112:"Host is down",113:"Host is unreachable",114:"Socket already connected",115:"Connection already in progress",116:"Stale file handle",122:"Quota exceeded",123:"No medium (in tape drive)",125:"Operation canceled",130:"Previous owner died",131:"State not recoverable"};
  
  function ___setErrNo(value) {
      if (Module['___errno_location']) HEAP32[((Module['___errno_location']())>>2)]=value;
      else Module.printErr('failed to set errno from JS');
      return value;
    }
  
  var PATH={splitPath:function (filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },normalizeArray:function (parts, allowAboveRoot) {
        // if the path tries to go above the root, `up` ends up > 0
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];
          if (last === '.') {
            parts.splice(i, 1);
          } else if (last === '..') {
            parts.splice(i, 1);
            up++;
          } else if (up) {
            parts.splice(i, 1);
            up--;
          }
        }
        // if the path is allowed to go above the root, restore leading ..s
        if (allowAboveRoot) {
          for (; up--; up) {
            parts.unshift('..');
          }
        }
        return parts;
      },normalize:function (path) {
        var isAbsolute = path.charAt(0) === '/',
            trailingSlash = path.substr(-1) === '/';
        // Normalize the path
        path = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), !isAbsolute).join('/');
        if (!path && !isAbsolute) {
          path = '.';
        }
        if (path && trailingSlash) {
          path += '/';
        }
        return (isAbsolute ? '/' : '') + path;
      },dirname:function (path) {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
          // No dirname whatsoever
          return '.';
        }
        if (dir) {
          // It has a dirname, strip trailing slash
          dir = dir.substr(0, dir.length - 1);
        }
        return root + dir;
      },basename:function (path) {
        // EMSCRIPTEN return '/'' for '/', not an empty string
        if (path === '/') return '/';
        var lastSlash = path.lastIndexOf('/');
        if (lastSlash === -1) return path;
        return path.substr(lastSlash+1);
      },extname:function (path) {
        return PATH.splitPath(path)[3];
      },join:function () {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.join('/'));
      },join2:function (l, r) {
        return PATH.normalize(l + '/' + r);
      },resolve:function () {
        var resolvedPath = '',
          resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
          var path = (i >= 0) ? arguments[i] : FS.cwd();
          // Skip empty and invalid entries
          if (typeof path !== 'string') {
            throw new TypeError('Arguments to path.resolve must be strings');
          } else if (!path) {
            return ''; // an invalid portion invalidates the whole thing
          }
          resolvedPath = path + '/' + resolvedPath;
          resolvedAbsolute = path.charAt(0) === '/';
        }
        // At this point the path should be resolved to a full absolute path, but
        // handle relative paths to be safe (might happen when process.cwd() fails)
        resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter(function(p) {
          return !!p;
        }), !resolvedAbsolute).join('/');
        return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
      },relative:function (from, to) {
        from = PATH.resolve(from).substr(1);
        to = PATH.resolve(to).substr(1);
        function trim(arr) {
          var start = 0;
          for (; start < arr.length; start++) {
            if (arr[start] !== '') break;
          }
          var end = arr.length - 1;
          for (; end >= 0; end--) {
            if (arr[end] !== '') break;
          }
          if (start > end) return [];
          return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split('/'));
        var toParts = trim(to.split('/'));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
          if (fromParts[i] !== toParts[i]) {
            samePartsLength = i;
            break;
          }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
          outputParts.push('..');
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join('/');
      }};
  
  var TTY={ttys:[],init:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // currently, FS.init does not distinguish if process.stdin is a file or TTY
        //   // device, it always assumes it's a TTY device. because of this, we're forcing
        //   // process.stdin to UTF8 encoding to at least make stdin reading compatible
        //   // with text files until FS.init can be refactored.
        //   process['stdin']['setEncoding']('utf8');
        // }
      },shutdown:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // inolen: any idea as to why node -e 'process.stdin.read()' wouldn't exit immediately (with process.stdin being a tty)?
        //   // isaacs: because now it's reading from the stream, you've expressed interest in it, so that read() kicks off a _read() which creates a ReadReq operation
        //   // inolen: I thought read() in that case was a synchronous operation that just grabbed some amount of buffered data if it exists?
        //   // isaacs: it is. but it also triggers a _read() call, which calls readStart() on the handle
        //   // isaacs: do process.stdin.pause() and i'd think it'd probably close the pending call
        //   process['stdin']['pause']();
        // }
      },register:function (dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },stream_ops:{open:function (stream) {
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          stream.tty = tty;
          stream.seekable = false;
        },close:function (stream) {
          // flush any pending line data
          stream.tty.ops.flush(stream.tty);
        },flush:function (stream) {
          stream.tty.ops.flush(stream.tty);
        },read:function (stream, buffer, offset, length, pos /* ignored */) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            if (result === undefined && bytesRead === 0) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
            if (result === null || result === undefined) break;
            bytesRead++;
            buffer[offset+i] = result;
          }
          if (bytesRead) {
            stream.node.timestamp = Date.now();
          }
          return bytesRead;
        },write:function (stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          for (var i = 0; i < length; i++) {
            try {
              stream.tty.ops.put_char(stream.tty, buffer[offset+i]);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
          }
          if (length) {
            stream.node.timestamp = Date.now();
          }
          return i;
        }},default_tty_ops:{get_char:function (tty) {
          if (!tty.input.length) {
            var result = null;
            if (ENVIRONMENT_IS_NODE) {
              // we will read data by chunks of BUFSIZE
              var BUFSIZE = 256;
              var buf = new Buffer(BUFSIZE);
              var bytesRead = 0;
  
              var fd = process.stdin.fd;
              // Linux and Mac cannot use process.stdin.fd (which isn't set up as sync)
              var usingDevice = false;
              try {
                fd = fs.openSync('/dev/stdin', 'r');
                usingDevice = true;
              } catch (e) {}
  
              bytesRead = fs.readSync(fd, buf, 0, BUFSIZE, null);
  
              if (usingDevice) { fs.closeSync(fd); }
              if (bytesRead > 0) {
                result = buf.slice(0, bytesRead).toString('utf-8');
              } else {
                result = null;
              }
  
            } else if (typeof window != 'undefined' &&
              typeof window.prompt == 'function') {
              // Browser.
              result = window.prompt('Input: ');  // returns null on cancel
              if (result !== null) {
                result += '\n';
              }
            } else if (typeof readline == 'function') {
              // Command line.
              result = readline();
              if (result !== null) {
                result += '\n';
              }
            }
            if (!result) {
              return null;
            }
            tty.input = intArrayFromString(result, true);
          }
          return tty.input.shift();
        },put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['print'](UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          } else {
            if (val != 0) tty.output.push(val); // val == 0 would cut text output off in the middle.
          }
        },flush:function (tty) {
          if (tty.output && tty.output.length > 0) {
            Module['print'](UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          }
        }},default_tty1_ops:{put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['printErr'](UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          } else {
            if (val != 0) tty.output.push(val);
          }
        },flush:function (tty) {
          if (tty.output && tty.output.length > 0) {
            Module['printErr'](UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          }
        }}};
  
  var MEMFS={ops_table:null,mount:function (mount) {
        return MEMFS.createNode(null, '/', 16384 | 511 /* 0777 */, 0);
      },createNode:function (parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          // no supported
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (!MEMFS.ops_table) {
          MEMFS.ops_table = {
            dir: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                lookup: MEMFS.node_ops.lookup,
                mknod: MEMFS.node_ops.mknod,
                rename: MEMFS.node_ops.rename,
                unlink: MEMFS.node_ops.unlink,
                rmdir: MEMFS.node_ops.rmdir,
                readdir: MEMFS.node_ops.readdir,
                symlink: MEMFS.node_ops.symlink
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek
              }
            },
            file: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek,
                read: MEMFS.stream_ops.read,
                write: MEMFS.stream_ops.write,
                allocate: MEMFS.stream_ops.allocate,
                mmap: MEMFS.stream_ops.mmap,
                msync: MEMFS.stream_ops.msync
              }
            },
            link: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                readlink: MEMFS.node_ops.readlink
              },
              stream: {}
            },
            chrdev: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: FS.chrdev_stream_ops
            }
          };
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = MEMFS.ops_table.dir.node;
          node.stream_ops = MEMFS.ops_table.dir.stream;
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = MEMFS.ops_table.file.node;
          node.stream_ops = MEMFS.ops_table.file.stream;
          node.usedBytes = 0; // The actual number of bytes used in the typed array, as opposed to contents.buffer.byteLength which gives the whole capacity.
          // When the byte data of the file is populated, this will point to either a typed array, or a normal JS array. Typed arrays are preferred
          // for performance, and used by default. However, typed arrays are not resizable like normal JS arrays are, so there is a small disk size
          // penalty involved for appending file writes that continuously grow a file similar to std::vector capacity vs used -scheme.
          node.contents = null; 
        } else if (FS.isLink(node.mode)) {
          node.node_ops = MEMFS.ops_table.link.node;
          node.stream_ops = MEMFS.ops_table.link.stream;
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = MEMFS.ops_table.chrdev.node;
          node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.timestamp = Date.now();
        // add the new node to the parent
        if (parent) {
          parent.contents[name] = node;
        }
        return node;
      },getFileDataAsRegularArray:function (node) {
        if (node.contents && node.contents.subarray) {
          var arr = [];
          for (var i = 0; i < node.usedBytes; ++i) arr.push(node.contents[i]);
          return arr; // Returns a copy of the original data.
        }
        return node.contents; // No-op, the file contents are already in a JS array. Return as-is.
      },getFileDataAsTypedArray:function (node) {
        if (!node.contents) return new Uint8Array;
        if (node.contents.subarray) return node.contents.subarray(0, node.usedBytes); // Make sure to not return excess unused bytes.
        return new Uint8Array(node.contents);
      },expandFileStorage:function (node, newCapacity) {
        // If we are asked to expand the size of a file that already exists, revert to using a standard JS array to store the file
        // instead of a typed array. This makes resizing the array more flexible because we can just .push() elements at the back to
        // increase the size.
        if (node.contents && node.contents.subarray && newCapacity > node.contents.length) {
          node.contents = MEMFS.getFileDataAsRegularArray(node);
          node.usedBytes = node.contents.length; // We might be writing to a lazy-loaded file which had overridden this property, so force-reset it.
        }
  
        if (!node.contents || node.contents.subarray) { // Keep using a typed array if creating a new storage, or if old one was a typed array as well.
          var prevCapacity = node.contents ? node.contents.buffer.byteLength : 0;
          if (prevCapacity >= newCapacity) return; // No need to expand, the storage was already large enough.
          // Don't expand strictly to the given requested limit if it's only a very small increase, but instead geometrically grow capacity.
          // For small filesizes (<1MB), perform size*2 geometric increase, but for large sizes, do a much more conservative size*1.125 increase to
          // avoid overshooting the allocation cap by a very large margin.
          var CAPACITY_DOUBLING_MAX = 1024 * 1024;
          newCapacity = Math.max(newCapacity, (prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2.0 : 1.125)) | 0);
          if (prevCapacity != 0) newCapacity = Math.max(newCapacity, 256); // At minimum allocate 256b for each file when expanding.
          var oldContents = node.contents;
          node.contents = new Uint8Array(newCapacity); // Allocate new storage.
          if (node.usedBytes > 0) node.contents.set(oldContents.subarray(0, node.usedBytes), 0); // Copy old data over to the new storage.
          return;
        }
        // Not using a typed array to back the file storage. Use a standard JS array instead.
        if (!node.contents && newCapacity > 0) node.contents = [];
        while (node.contents.length < newCapacity) node.contents.push(0);
      },resizeFileStorage:function (node, newSize) {
        if (node.usedBytes == newSize) return;
        if (newSize == 0) {
          node.contents = null; // Fully decommit when requesting a resize to zero.
          node.usedBytes = 0;
          return;
        }
        if (!node.contents || node.contents.subarray) { // Resize a typed array if that is being used as the backing store.
          var oldContents = node.contents;
          node.contents = new Uint8Array(new ArrayBuffer(newSize)); // Allocate new storage.
          if (oldContents) {
            node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes))); // Copy old data over to the new storage.
          }
          node.usedBytes = newSize;
          return;
        }
        // Backing with a JS array.
        if (!node.contents) node.contents = [];
        if (node.contents.length > newSize) node.contents.length = newSize;
        else while (node.contents.length < newSize) node.contents.push(0);
        node.usedBytes = newSize;
      },node_ops:{getattr:function (node) {
          var attr = {};
          // device numbers reuse inode numbers.
          attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
          attr.ino = node.id;
          attr.mode = node.mode;
          attr.nlink = 1;
          attr.uid = 0;
          attr.gid = 0;
          attr.rdev = node.rdev;
          if (FS.isDir(node.mode)) {
            attr.size = 4096;
          } else if (FS.isFile(node.mode)) {
            attr.size = node.usedBytes;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.timestamp);
          attr.mtime = new Date(node.timestamp);
          attr.ctime = new Date(node.timestamp);
          // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
          //       but this is not required by the standard.
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        },setattr:function (node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
          if (attr.size !== undefined) {
            MEMFS.resizeFileStorage(node, attr.size);
          }
        },lookup:function (parent, name) {
          throw FS.genericErrors[ERRNO_CODES.ENOENT];
        },mknod:function (parent, name, mode, dev) {
          return MEMFS.createNode(parent, name, mode, dev);
        },rename:function (old_node, new_dir, new_name) {
          // if we're overwriting a directory at new_name, make sure it's empty.
          if (FS.isDir(old_node.mode)) {
            var new_node;
            try {
              new_node = FS.lookupNode(new_dir, new_name);
            } catch (e) {
            }
            if (new_node) {
              for (var i in new_node.contents) {
                throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
              }
            }
          }
          // do the internal rewiring
          delete old_node.parent.contents[old_node.name];
          old_node.name = new_name;
          new_dir.contents[new_name] = old_node;
          old_node.parent = new_dir;
        },unlink:function (parent, name) {
          delete parent.contents[name];
        },rmdir:function (parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
          }
          delete parent.contents[name];
        },readdir:function (node) {
          var entries = ['.', '..']
          for (var key in node.contents) {
            if (!node.contents.hasOwnProperty(key)) {
              continue;
            }
            entries.push(key);
          }
          return entries;
        },symlink:function (parent, newname, oldpath) {
          var node = MEMFS.createNode(parent, newname, 511 /* 0777 */ | 40960, 0);
          node.link = oldpath;
          return node;
        },readlink:function (node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return node.link;
        }},stream_ops:{read:function (stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= stream.node.usedBytes) return 0;
          var size = Math.min(stream.node.usedBytes - position, length);
          assert(size >= 0);
          if (size > 8 && contents.subarray) { // non-trivial, and typed array
            buffer.set(contents.subarray(position, position + size), offset);
          } else {
            for (var i = 0; i < size; i++) buffer[offset + i] = contents[position + i];
          }
          return size;
        },write:function (stream, buffer, offset, length, position, canOwn) {
          if (!length) return 0;
          var node = stream.node;
          node.timestamp = Date.now();
  
          if (buffer.subarray && (!node.contents || node.contents.subarray)) { // This write is from a typed array to a typed array?
            if (canOwn) { // Can we just reuse the buffer we are given?
              assert(position === 0, 'canOwn must imply no weird position inside the file');
              node.contents = buffer.subarray(offset, offset + length);
              node.usedBytes = length;
              return length;
            } else if (node.usedBytes === 0 && position === 0) { // If this is a simple first write to an empty file, do a fast set since we don't need to care about old data.
              node.contents = new Uint8Array(buffer.subarray(offset, offset + length));
              node.usedBytes = length;
              return length;
            } else if (position + length <= node.usedBytes) { // Writing to an already allocated and used subrange of the file?
              node.contents.set(buffer.subarray(offset, offset + length), position);
              return length;
            }
          }
  
          // Appending to an existing file and we need to reallocate, or source data did not come as a typed array.
          MEMFS.expandFileStorage(node, position+length);
          if (node.contents.subarray && buffer.subarray) node.contents.set(buffer.subarray(offset, offset + length), position); // Use typed array write if available.
          else {
            for (var i = 0; i < length; i++) {
             node.contents[position + i] = buffer[offset + i]; // Or fall back to manual write if not.
            }
          }
          node.usedBytes = Math.max(node.usedBytes, position+length);
          return length;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.usedBytes;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return position;
        },allocate:function (stream, offset, length) {
          MEMFS.expandFileStorage(stream.node, offset + length);
          stream.node.usedBytes = Math.max(stream.node.usedBytes, offset + length);
        },mmap:function (stream, buffer, offset, length, position, prot, flags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          // Only make a new copy when MAP_PRIVATE is specified.
          if ( !(flags & 2) &&
                (contents.buffer === buffer || contents.buffer === buffer.buffer) ) {
            // We can't emulate MAP_SHARED when the file is not backed by the buffer
            // we're mapping to (e.g. the HEAP buffer).
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            // Try to avoid unnecessary slices.
            if (position > 0 || position + length < stream.node.usedBytes) {
              if (contents.subarray) {
                contents = contents.subarray(position, position + length);
              } else {
                contents = Array.prototype.slice.call(contents, position, position + length);
              }
            }
            allocated = true;
            ptr = _malloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOMEM);
            }
            buffer.set(contents, ptr);
          }
          return { ptr: ptr, allocated: allocated };
        },msync:function (stream, buffer, offset, length, mmapFlags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          if (mmapFlags & 2) {
            // MAP_PRIVATE calls need not to be synced back to underlying fs
            return 0;
          }
  
          var bytesWritten = MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
          // should we check if bytesWritten and length are the same?
          return 0;
        }}};
  
  var IDBFS={dbs:{},indexedDB:function () {
        if (typeof indexedDB !== 'undefined') return indexedDB;
        var ret = null;
        if (typeof window === 'object') ret = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
        assert(ret, 'IDBFS used, but indexedDB not supported');
        return ret;
      },DB_VERSION:21,DB_STORE_NAME:"FILE_DATA",mount:function (mount) {
        // reuse all of the core MEMFS functionality
        return MEMFS.mount.apply(null, arguments);
      },syncfs:function (mount, populate, callback) {
        IDBFS.getLocalSet(mount, function(err, local) {
          if (err) return callback(err);
  
          IDBFS.getRemoteSet(mount, function(err, remote) {
            if (err) return callback(err);
  
            var src = populate ? remote : local;
            var dst = populate ? local : remote;
  
            IDBFS.reconcile(src, dst, callback);
          });
        });
      },getDB:function (name, callback) {
        // check the cache first
        var db = IDBFS.dbs[name];
        if (db) {
          return callback(null, db);
        }
  
        var req;
        try {
          req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION);
        } catch (e) {
          return callback(e);
        }
        req.onupgradeneeded = function(e) {
          var db = e.target.result;
          var transaction = e.target.transaction;
  
          var fileStore;
  
          if (db.objectStoreNames.contains(IDBFS.DB_STORE_NAME)) {
            fileStore = transaction.objectStore(IDBFS.DB_STORE_NAME);
          } else {
            fileStore = db.createObjectStore(IDBFS.DB_STORE_NAME);
          }
  
          if (!fileStore.indexNames.contains('timestamp')) {
            fileStore.createIndex('timestamp', 'timestamp', { unique: false });
          }
        };
        req.onsuccess = function() {
          db = req.result;
  
          // add to the cache
          IDBFS.dbs[name] = db;
          callback(null, db);
        };
        req.onerror = function(e) {
          callback(this.error);
          e.preventDefault();
        };
      },getLocalSet:function (mount, callback) {
        var entries = {};
  
        function isRealDir(p) {
          return p !== '.' && p !== '..';
        };
        function toAbsolute(root) {
          return function(p) {
            return PATH.join2(root, p);
          }
        };
  
        var check = FS.readdir(mount.mountpoint).filter(isRealDir).map(toAbsolute(mount.mountpoint));
  
        while (check.length) {
          var path = check.pop();
          var stat;
  
          try {
            stat = FS.stat(path);
          } catch (e) {
            return callback(e);
          }
  
          if (FS.isDir(stat.mode)) {
            check.push.apply(check, FS.readdir(path).filter(isRealDir).map(toAbsolute(path)));
          }
  
          entries[path] = { timestamp: stat.mtime };
        }
  
        return callback(null, { type: 'local', entries: entries });
      },getRemoteSet:function (mount, callback) {
        var entries = {};
  
        IDBFS.getDB(mount.mountpoint, function(err, db) {
          if (err) return callback(err);
  
          var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readonly');
          transaction.onerror = function(e) {
            callback(this.error);
            e.preventDefault();
          };
  
          var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
          var index = store.index('timestamp');
  
          index.openKeyCursor().onsuccess = function(event) {
            var cursor = event.target.result;
  
            if (!cursor) {
              return callback(null, { type: 'remote', db: db, entries: entries });
            }
  
            entries[cursor.primaryKey] = { timestamp: cursor.key };
  
            cursor.continue();
          };
        });
      },loadLocalEntry:function (path, callback) {
        var stat, node;
  
        try {
          var lookup = FS.lookupPath(path);
          node = lookup.node;
          stat = FS.stat(path);
        } catch (e) {
          return callback(e);
        }
  
        if (FS.isDir(stat.mode)) {
          return callback(null, { timestamp: stat.mtime, mode: stat.mode });
        } else if (FS.isFile(stat.mode)) {
          // Performance consideration: storing a normal JavaScript array to a IndexedDB is much slower than storing a typed array.
          // Therefore always convert the file contents to a typed array first before writing the data to IndexedDB.
          node.contents = MEMFS.getFileDataAsTypedArray(node);
          return callback(null, { timestamp: stat.mtime, mode: stat.mode, contents: node.contents });
        } else {
          return callback(new Error('node type not supported'));
        }
      },storeLocalEntry:function (path, entry, callback) {
        try {
          if (FS.isDir(entry.mode)) {
            FS.mkdir(path, entry.mode);
          } else if (FS.isFile(entry.mode)) {
            FS.writeFile(path, entry.contents, { encoding: 'binary', canOwn: true });
          } else {
            return callback(new Error('node type not supported'));
          }
  
          FS.chmod(path, entry.mode);
          FS.utime(path, entry.timestamp, entry.timestamp);
        } catch (e) {
          return callback(e);
        }
  
        callback(null);
      },removeLocalEntry:function (path, callback) {
        try {
          var lookup = FS.lookupPath(path);
          var stat = FS.stat(path);
  
          if (FS.isDir(stat.mode)) {
            FS.rmdir(path);
          } else if (FS.isFile(stat.mode)) {
            FS.unlink(path);
          }
        } catch (e) {
          return callback(e);
        }
  
        callback(null);
      },loadRemoteEntry:function (store, path, callback) {
        var req = store.get(path);
        req.onsuccess = function(event) { callback(null, event.target.result); };
        req.onerror = function(e) {
          callback(this.error);
          e.preventDefault();
        };
      },storeRemoteEntry:function (store, path, entry, callback) {
        var req = store.put(entry, path);
        req.onsuccess = function() { callback(null); };
        req.onerror = function(e) {
          callback(this.error);
          e.preventDefault();
        };
      },removeRemoteEntry:function (store, path, callback) {
        var req = store.delete(path);
        req.onsuccess = function() { callback(null); };
        req.onerror = function(e) {
          callback(this.error);
          e.preventDefault();
        };
      },reconcile:function (src, dst, callback) {
        var total = 0;
  
        var create = [];
        Object.keys(src.entries).forEach(function (key) {
          var e = src.entries[key];
          var e2 = dst.entries[key];
          if (!e2 || e.timestamp > e2.timestamp) {
            create.push(key);
            total++;
          }
        });
  
        var remove = [];
        Object.keys(dst.entries).forEach(function (key) {
          var e = dst.entries[key];
          var e2 = src.entries[key];
          if (!e2) {
            remove.push(key);
            total++;
          }
        });
  
        if (!total) {
          return callback(null);
        }
  
        var errored = false;
        var completed = 0;
        var db = src.type === 'remote' ? src.db : dst.db;
        var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readwrite');
        var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
  
        function done(err) {
          if (err) {
            if (!done.errored) {
              done.errored = true;
              return callback(err);
            }
            return;
          }
          if (++completed >= total) {
            return callback(null);
          }
        };
  
        transaction.onerror = function(e) {
          done(this.error);
          e.preventDefault();
        };
  
        // sort paths in ascending order so directory entries are created
        // before the files inside them
        create.sort().forEach(function (path) {
          if (dst.type === 'local') {
            IDBFS.loadRemoteEntry(store, path, function (err, entry) {
              if (err) return done(err);
              IDBFS.storeLocalEntry(path, entry, done);
            });
          } else {
            IDBFS.loadLocalEntry(path, function (err, entry) {
              if (err) return done(err);
              IDBFS.storeRemoteEntry(store, path, entry, done);
            });
          }
        });
  
        // sort paths in descending order so files are deleted before their
        // parent directories
        remove.sort().reverse().forEach(function(path) {
          if (dst.type === 'local') {
            IDBFS.removeLocalEntry(path, done);
          } else {
            IDBFS.removeRemoteEntry(store, path, done);
          }
        });
      }};
  
  var NODEFS={isWindows:false,staticInit:function () {
        NODEFS.isWindows = !!process.platform.match(/^win/);
      },mount:function (mount) {
        assert(ENVIRONMENT_IS_NODE);
        return NODEFS.createNode(null, '/', NODEFS.getMode(mount.opts.root), 0);
      },createNode:function (parent, name, mode, dev) {
        if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node = FS.createNode(parent, name, mode);
        node.node_ops = NODEFS.node_ops;
        node.stream_ops = NODEFS.stream_ops;
        return node;
      },getMode:function (path) {
        var stat;
        try {
          stat = fs.lstatSync(path);
          if (NODEFS.isWindows) {
            // On Windows, directories return permission bits 'rw-rw-rw-', even though they have 'rwxrwxrwx', so
            // propagate write bits to execute bits.
            stat.mode = stat.mode | ((stat.mode & 146) >> 1);
          }
        } catch (e) {
          if (!e.code) throw e;
          throw new FS.ErrnoError(ERRNO_CODES[e.code]);
        }
        return stat.mode;
      },realPath:function (node) {
        var parts = [];
        while (node.parent !== node) {
          parts.push(node.name);
          node = node.parent;
        }
        parts.push(node.mount.opts.root);
        parts.reverse();
        return PATH.join.apply(null, parts);
      },flagsToPermissionStringMap:{0:"r",1:"r+",2:"r+",64:"r",65:"r+",66:"r+",129:"rx+",193:"rx+",514:"w+",577:"w",578:"w+",705:"wx",706:"wx+",1024:"a",1025:"a",1026:"a+",1089:"a",1090:"a+",1153:"ax",1154:"ax+",1217:"ax",1218:"ax+",4096:"rs",4098:"rs+"},flagsToPermissionString:function (flags) {
        flags &= ~0100000 /*O_LARGEFILE*/; // Ignore this flag from musl, otherwise node.js fails to open the file.
        flags &= ~02000000 /*O_CLOEXEC*/; // Some applications may pass it; it makes no sense for a single process.
        if (flags in NODEFS.flagsToPermissionStringMap) {
          return NODEFS.flagsToPermissionStringMap[flags];
        } else {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
      },node_ops:{getattr:function (node) {
          var path = NODEFS.realPath(node);
          var stat;
          try {
            stat = fs.lstatSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          // node.js v0.10.20 doesn't report blksize and blocks on Windows. Fake them with default blksize of 4096.
          // See http://support.microsoft.com/kb/140365
          if (NODEFS.isWindows && !stat.blksize) {
            stat.blksize = 4096;
          }
          if (NODEFS.isWindows && !stat.blocks) {
            stat.blocks = (stat.size+stat.blksize-1)/stat.blksize|0;
          }
          return {
            dev: stat.dev,
            ino: stat.ino,
            mode: stat.mode,
            nlink: stat.nlink,
            uid: stat.uid,
            gid: stat.gid,
            rdev: stat.rdev,
            size: stat.size,
            atime: stat.atime,
            mtime: stat.mtime,
            ctime: stat.ctime,
            blksize: stat.blksize,
            blocks: stat.blocks
          };
        },setattr:function (node, attr) {
          var path = NODEFS.realPath(node);
          try {
            if (attr.mode !== undefined) {
              fs.chmodSync(path, attr.mode);
              // update the common node structure mode as well
              node.mode = attr.mode;
            }
            if (attr.timestamp !== undefined) {
              var date = new Date(attr.timestamp);
              fs.utimesSync(path, date, date);
            }
            if (attr.size !== undefined) {
              fs.truncateSync(path, attr.size);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },lookup:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          var mode = NODEFS.getMode(path);
          return NODEFS.createNode(parent, name, mode);
        },mknod:function (parent, name, mode, dev) {
          var node = NODEFS.createNode(parent, name, mode, dev);
          // create the backing node for this in the fs root as well
          var path = NODEFS.realPath(node);
          try {
            if (FS.isDir(node.mode)) {
              fs.mkdirSync(path, node.mode);
            } else {
              fs.writeFileSync(path, '', { mode: node.mode });
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return node;
        },rename:function (oldNode, newDir, newName) {
          var oldPath = NODEFS.realPath(oldNode);
          var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
          try {
            fs.renameSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },unlink:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.unlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },rmdir:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.rmdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readdir:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },symlink:function (parent, newName, oldPath) {
          var newPath = PATH.join2(NODEFS.realPath(parent), newName);
          try {
            fs.symlinkSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readlink:function (node) {
          var path = NODEFS.realPath(node);
          try {
            path = fs.readlinkSync(path);
            path = NODEJS_PATH.relative(NODEJS_PATH.resolve(node.mount.opts.root), path);
            return path;
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        }},stream_ops:{open:function (stream) {
          var path = NODEFS.realPath(stream.node);
          try {
            if (FS.isFile(stream.node.mode)) {
              stream.nfd = fs.openSync(path, NODEFS.flagsToPermissionString(stream.flags));
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },close:function (stream) {
          try {
            if (FS.isFile(stream.node.mode) && stream.nfd) {
              fs.closeSync(stream.nfd);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },read:function (stream, buffer, offset, length, position) {
          if (length === 0) return 0; // node errors on 0 length reads
          // FIXME this is terrible.
          var nbuffer = new Buffer(length);
          var res;
          try {
            res = fs.readSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          if (res > 0) {
            for (var i = 0; i < res; i++) {
              buffer[offset + i] = nbuffer[i];
            }
          }
          return res;
        },write:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(buffer.subarray(offset, offset + length));
          var res;
          try {
            res = fs.writeSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return res;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              try {
                var stat = fs.fstatSync(stream.nfd);
                position += stat.size;
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
              }
            }
          }
  
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
  
          return position;
        }}};
  
  var WORKERFS={DIR_MODE:16895,FILE_MODE:33279,reader:null,mount:function (mount) {
        assert(ENVIRONMENT_IS_WORKER);
        if (!WORKERFS.reader) WORKERFS.reader = new FileReaderSync();
        var root = WORKERFS.createNode(null, '/', WORKERFS.DIR_MODE, 0);
        var createdParents = {};
        function ensureParent(path) {
          // return the parent node, creating subdirs as necessary
          var parts = path.split('/');
          var parent = root;
          for (var i = 0; i < parts.length-1; i++) {
            var curr = parts.slice(0, i+1).join('/');
            if (!createdParents[curr]) {
              createdParents[curr] = WORKERFS.createNode(parent, curr, WORKERFS.DIR_MODE, 0);
            }
            parent = createdParents[curr];
          }
          return parent;
        }
        function base(path) {
          var parts = path.split('/');
          return parts[parts.length-1];
        }
        // We also accept FileList here, by using Array.prototype
        Array.prototype.forEach.call(mount.opts["files"] || [], function(file) {
          WORKERFS.createNode(ensureParent(file.name), base(file.name), WORKERFS.FILE_MODE, 0, file, file.lastModifiedDate);
        });
        (mount.opts["blobs"] || []).forEach(function(obj) {
          WORKERFS.createNode(ensureParent(obj["name"]), base(obj["name"]), WORKERFS.FILE_MODE, 0, obj["data"]);
        });
        (mount.opts["packages"] || []).forEach(function(pack) {
          pack['metadata'].files.forEach(function(file) {
            var name = file.filename.substr(1); // remove initial slash
            WORKERFS.createNode(ensureParent(name), base(name), WORKERFS.FILE_MODE, 0, pack['blob'].slice(file.start, file.end));
          });
        });
        return root;
      },createNode:function (parent, name, mode, dev, contents, mtime) {
        var node = FS.createNode(parent, name, mode);
        node.mode = mode;
        node.node_ops = WORKERFS.node_ops;
        node.stream_ops = WORKERFS.stream_ops;
        node.timestamp = (mtime || new Date).getTime();
        assert(WORKERFS.FILE_MODE !== WORKERFS.DIR_MODE);
        if (mode === WORKERFS.FILE_MODE) {
          node.size = contents.size;
          node.contents = contents;
        } else {
          node.size = 4096;
          node.contents = {};
        }
        if (parent) {
          parent.contents[name] = node;
        }
        return node;
      },node_ops:{getattr:function (node) {
          return {
            dev: 1,
            ino: undefined,
            mode: node.mode,
            nlink: 1,
            uid: 0,
            gid: 0,
            rdev: undefined,
            size: node.size,
            atime: new Date(node.timestamp),
            mtime: new Date(node.timestamp),
            ctime: new Date(node.timestamp),
            blksize: 4096,
            blocks: Math.ceil(node.size / 4096),
          };
        },setattr:function (node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
        },lookup:function (parent, name) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        },mknod:function (parent, name, mode, dev) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        },rename:function (oldNode, newDir, newName) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        },unlink:function (parent, name) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        },rmdir:function (parent, name) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        },readdir:function (node) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        },symlink:function (parent, newName, oldPath) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        },readlink:function (node) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }},stream_ops:{read:function (stream, buffer, offset, length, position) {
          if (position >= stream.node.size) return 0;
          var chunk = stream.node.contents.slice(position, position + length);
          var ab = WORKERFS.reader.readAsArrayBuffer(chunk);
          buffer.set(new Uint8Array(ab), offset);
          return chunk.size;
        },write:function (stream, buffer, offset, length, position) {
          throw new FS.ErrnoError(ERRNO_CODES.EIO);
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.size;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return position;
        }}};
  
  var _stdin=STATICTOP; STATICTOP += 16;;
  
  var _stdout=STATICTOP; STATICTOP += 16;;
  
  var _stderr=STATICTOP; STATICTOP += 16;;var FS={root:null,mounts:[],devices:[null],streams:[],nextInode:1,nameTable:null,currentPath:"/",initialized:false,ignorePermissions:true,trackingDelegate:{},tracking:{openFlags:{READ:1,WRITE:2}},ErrnoError:null,genericErrors:{},filesystems:null,syncFSRequests:0,handleFSError:function (e) {
        if (!(e instanceof FS.ErrnoError)) throw e + ' : ' + stackTrace();
        return ___setErrNo(e.errno);
      },lookupPath:function (path, opts) {
        path = PATH.resolve(FS.cwd(), path);
        opts = opts || {};
  
        if (!path) return { path: '', node: null };
  
        var defaults = {
          follow_mount: true,
          recurse_count: 0
        };
        for (var key in defaults) {
          if (opts[key] === undefined) {
            opts[key] = defaults[key];
          }
        }
  
        if (opts.recurse_count > 8) {  // max recursive lookup of 8
          throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
        }
  
        // split the path
        var parts = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), false);
  
        // start at the root
        var current = FS.root;
        var current_path = '/';
  
        for (var i = 0; i < parts.length; i++) {
          var islast = (i === parts.length-1);
          if (islast && opts.parent) {
            // stop resolving
            break;
          }
  
          current = FS.lookupNode(current, parts[i]);
          current_path = PATH.join2(current_path, parts[i]);
  
          // jump to the mount's root node if this is a mountpoint
          if (FS.isMountpoint(current)) {
            if (!islast || (islast && opts.follow_mount)) {
              current = current.mounted.root;
            }
          }
  
          // by default, lookupPath will not follow a symlink if it is the final path component.
          // setting opts.follow = true will override this behavior.
          if (!islast || opts.follow) {
            var count = 0;
            while (FS.isLink(current.mode)) {
              var link = FS.readlink(current_path);
              current_path = PATH.resolve(PATH.dirname(current_path), link);
  
              var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count });
              current = lookup.node;
  
              if (count++ > 40) {  // limit max consecutive symlinks to 40 (SYMLOOP_MAX).
                throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
              }
            }
          }
        }
  
        return { path: current_path, node: current };
      },getPath:function (node) {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            var mount = node.mount.mountpoint;
            if (!path) return mount;
            return mount[mount.length-1] !== '/' ? mount + '/' + path : mount + path;
          }
          path = path ? node.name + '/' + path : node.name;
          node = node.parent;
        }
      },hashName:function (parentid, name) {
        var hash = 0;
  
  
        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
      },hashAddNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
      },hashRemoveNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
          FS.nameTable[hash] = node.name_next;
        } else {
          var current = FS.nameTable[hash];
          while (current) {
            if (current.name_next === node) {
              current.name_next = node.name_next;
              break;
            }
            current = current.name_next;
          }
        }
      },lookupNode:function (parent, name) {
        var err = FS.mayLookup(parent);
        if (err) {
          throw new FS.ErrnoError(err, parent);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
          var nodeName = node.name;
          if (node.parent.id === parent.id && nodeName === name) {
            return node;
          }
        }
        // if we failed to find it in the cache, call into the VFS
        return FS.lookup(parent, name);
      },createNode:function (parent, name, mode, rdev) {
        if (!FS.FSNode) {
          FS.FSNode = function(parent, name, mode, rdev) {
            if (!parent) {
              parent = this;  // root node sets parent to itself
            }
            this.parent = parent;
            this.mount = parent.mount;
            this.mounted = null;
            this.id = FS.nextInode++;
            this.name = name;
            this.mode = mode;
            this.node_ops = {};
            this.stream_ops = {};
            this.rdev = rdev;
          };
  
          FS.FSNode.prototype = {};
  
          // compatibility
          var readMode = 292 | 73;
          var writeMode = 146;
  
          // NOTE we must use Object.defineProperties instead of individual calls to
          // Object.defineProperty in order to make closure compiler happy
          Object.defineProperties(FS.FSNode.prototype, {
            read: {
              get: function() { return (this.mode & readMode) === readMode; },
              set: function(val) { val ? this.mode |= readMode : this.mode &= ~readMode; }
            },
            write: {
              get: function() { return (this.mode & writeMode) === writeMode; },
              set: function(val) { val ? this.mode |= writeMode : this.mode &= ~writeMode; }
            },
            isFolder: {
              get: function() { return FS.isDir(this.mode); }
            },
            isDevice: {
              get: function() { return FS.isChrdev(this.mode); }
            }
          });
        }
  
        var node = new FS.FSNode(parent, name, mode, rdev);
  
        FS.hashAddNode(node);
  
        return node;
      },destroyNode:function (node) {
        FS.hashRemoveNode(node);
      },isRoot:function (node) {
        return node === node.parent;
      },isMountpoint:function (node) {
        return !!node.mounted;
      },isFile:function (mode) {
        return (mode & 61440) === 32768;
      },isDir:function (mode) {
        return (mode & 61440) === 16384;
      },isLink:function (mode) {
        return (mode & 61440) === 40960;
      },isChrdev:function (mode) {
        return (mode & 61440) === 8192;
      },isBlkdev:function (mode) {
        return (mode & 61440) === 24576;
      },isFIFO:function (mode) {
        return (mode & 61440) === 4096;
      },isSocket:function (mode) {
        return (mode & 49152) === 49152;
      },flagModes:{"r":0,"rs":1052672,"r+":2,"w":577,"wx":705,"xw":705,"w+":578,"wx+":706,"xw+":706,"a":1089,"ax":1217,"xa":1217,"a+":1090,"ax+":1218,"xa+":1218},modeStringToFlags:function (str) {
        var flags = FS.flagModes[str];
        if (typeof flags === 'undefined') {
          throw new Error('Unknown file open mode: ' + str);
        }
        return flags;
      },flagsToPermissionString:function (flag) {
        var perms = ['r', 'w', 'rw'][flag & 3];
        if ((flag & 512)) {
          perms += 'w';
        }
        return perms;
      },nodePermissions:function (node, perms) {
        if (FS.ignorePermissions) {
          return 0;
        }
        // return 0 if any user, group or owner bits are set.
        if (perms.indexOf('r') !== -1 && !(node.mode & 292)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('w') !== -1 && !(node.mode & 146)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('x') !== -1 && !(node.mode & 73)) {
          return ERRNO_CODES.EACCES;
        }
        return 0;
      },mayLookup:function (dir) {
        var err = FS.nodePermissions(dir, 'x');
        if (err) return err;
        if (!dir.node_ops.lookup) return ERRNO_CODES.EACCES;
        return 0;
      },mayCreate:function (dir, name) {
        try {
          var node = FS.lookupNode(dir, name);
          return ERRNO_CODES.EEXIST;
        } catch (e) {
        }
        return FS.nodePermissions(dir, 'wx');
      },mayDelete:function (dir, name, isdir) {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var err = FS.nodePermissions(dir, 'wx');
        if (err) {
          return err;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return ERRNO_CODES.ENOTDIR;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
            return ERRNO_CODES.EBUSY;
          }
        } else {
          if (FS.isDir(node.mode)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return 0;
      },mayOpen:function (node, flags) {
        if (!node) {
          return ERRNO_CODES.ENOENT;
        }
        if (FS.isLink(node.mode)) {
          return ERRNO_CODES.ELOOP;
        } else if (FS.isDir(node.mode)) {
          if (FS.flagsToPermissionString(flags) !== 'r' || // opening for write
              (flags & 512)) { // TODO: check for O_SEARCH? (== search for dir only)
            return ERRNO_CODES.EISDIR;
          }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
      },MAX_OPEN_FDS:4096,nextfd:function (fd_start, fd_end) {
        fd_start = fd_start || 0;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(ERRNO_CODES.EMFILE);
      },getStream:function (fd) {
        return FS.streams[fd];
      },createStream:function (stream, fd_start, fd_end) {
        if (!FS.FSStream) {
          FS.FSStream = function(){};
          FS.FSStream.prototype = {};
          // compatibility
          Object.defineProperties(FS.FSStream.prototype, {
            object: {
              get: function() { return this.node; },
              set: function(val) { this.node = val; }
            },
            isRead: {
              get: function() { return (this.flags & 2097155) !== 1; }
            },
            isWrite: {
              get: function() { return (this.flags & 2097155) !== 0; }
            },
            isAppend: {
              get: function() { return (this.flags & 1024); }
            }
          });
        }
        // clone it, so we can return an instance of FSStream
        var newStream = new FS.FSStream();
        for (var p in stream) {
          newStream[p] = stream[p];
        }
        stream = newStream;
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
      },closeStream:function (fd) {
        FS.streams[fd] = null;
      },chrdev_stream_ops:{open:function (stream) {
          var device = FS.getDevice(stream.node.rdev);
          // override node's stream ops with the device's
          stream.stream_ops = device.stream_ops;
          // forward the open call
          if (stream.stream_ops.open) {
            stream.stream_ops.open(stream);
          }
        },llseek:function () {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }},major:function (dev) {
        return ((dev) >> 8);
      },minor:function (dev) {
        return ((dev) & 0xff);
      },makedev:function (ma, mi) {
        return ((ma) << 8 | (mi));
      },registerDevice:function (dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
      },getDevice:function (dev) {
        return FS.devices[dev];
      },getMounts:function (mount) {
        var mounts = [];
        var check = [mount];
  
        while (check.length) {
          var m = check.pop();
  
          mounts.push(m);
  
          check.push.apply(check, m.mounts);
        }
  
        return mounts;
      },syncfs:function (populate, callback) {
        if (typeof(populate) === 'function') {
          callback = populate;
          populate = false;
        }
  
        FS.syncFSRequests++;
  
        if (FS.syncFSRequests > 1) {
          console.log('warning: ' + FS.syncFSRequests + ' FS.syncfs operations in flight at once, probably just doing extra work');
        }
  
        var mounts = FS.getMounts(FS.root.mount);
        var completed = 0;
  
        function doCallback(err) {
          assert(FS.syncFSRequests > 0);
          FS.syncFSRequests--;
          return callback(err);
        }
  
        function done(err) {
          if (err) {
            if (!done.errored) {
              done.errored = true;
              return doCallback(err);
            }
            return;
          }
          if (++completed >= mounts.length) {
            doCallback(null);
          }
        };
  
        // sync all mounts
        mounts.forEach(function (mount) {
          if (!mount.type.syncfs) {
            return done(null);
          }
          mount.type.syncfs(mount, populate, done);
        });
      },mount:function (type, opts, mountpoint) {
        var root = mountpoint === '/';
        var pseudo = !mountpoint;
        var node;
  
        if (root && FS.root) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        } else if (!root && !pseudo) {
          var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
          mountpoint = lookup.path;  // use the absolute path
          node = lookup.node;
  
          if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
          }
  
          if (!FS.isDir(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
          }
        }
  
        var mount = {
          type: type,
          opts: opts,
          mountpoint: mountpoint,
          mounts: []
        };
  
        // create a root node for the fs
        var mountRoot = type.mount(mount);
        mountRoot.mount = mount;
        mount.root = mountRoot;
  
        if (root) {
          FS.root = mountRoot;
        } else if (node) {
          // set as a mountpoint
          node.mounted = mount;
  
          // add the new mount to the current mount's children
          if (node.mount) {
            node.mount.mounts.push(mount);
          }
        }
  
        return mountRoot;
      },unmount:function (mountpoint) {
        var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
        if (!FS.isMountpoint(lookup.node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
  
        // destroy the nodes for this mount, and all its child mounts
        var node = lookup.node;
        var mount = node.mounted;
        var mounts = FS.getMounts(mount);
  
        Object.keys(FS.nameTable).forEach(function (hash) {
          var current = FS.nameTable[hash];
  
          while (current) {
            var next = current.name_next;
  
            if (mounts.indexOf(current.mount) !== -1) {
              FS.destroyNode(current);
            }
  
            current = next;
          }
        });
  
        // no longer a mountpoint
        node.mounted = null;
  
        // remove this mount from the child mounts
        var idx = node.mount.mounts.indexOf(mount);
        assert(idx !== -1);
        node.mount.mounts.splice(idx, 1);
      },lookup:function (parent, name) {
        return parent.node_ops.lookup(parent, name);
      },mknod:function (path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        if (!name || name === '.' || name === '..') {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var err = FS.mayCreate(parent, name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      },create:function (path, mode) {
        mode = mode !== undefined ? mode : 438 /* 0666 */;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
      },mkdir:function (path, mode) {
        mode = mode !== undefined ? mode : 511 /* 0777 */;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
      },mkdev:function (path, mode, dev) {
        if (typeof(dev) === 'undefined') {
          dev = mode;
          mode = 438 /* 0666 */;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
      },symlink:function (oldpath, newpath) {
        if (!PATH.resolve(oldpath)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        if (!parent) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        var newname = PATH.basename(newpath);
        var err = FS.mayCreate(parent, newname);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      },rename:function (old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        // parents must exist
        var lookup, old_dir, new_dir;
        try {
          lookup = FS.lookupPath(old_path, { parent: true });
          old_dir = lookup.node;
          lookup = FS.lookupPath(new_path, { parent: true });
          new_dir = lookup.node;
        } catch (e) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        if (!old_dir || !new_dir) throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        // need to be part of the same mount
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(ERRNO_CODES.EXDEV);
        }
        // source must exist
        var old_node = FS.lookupNode(old_dir, old_name);
        // old path should not be an ancestor of the new path
        var relative = PATH.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        // new path should not be an ancestor of the old path
        relative = PATH.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
        }
        // see if the new path already exists
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {
          // not fatal
        }
        // early out if nothing needs to change
        if (old_node === new_node) {
          return;
        }
        // we'll need to delete the old entry
        var isdir = FS.isDir(old_node.mode);
        var err = FS.mayDelete(old_dir, old_name, isdir);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // need delete permissions if we'll be overwriting.
        // need create permissions if new doesn't already exist.
        err = new_node ?
          FS.mayDelete(new_dir, new_name, isdir) :
          FS.mayCreate(new_dir, new_name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // if we are going to change the parent, check write permissions
        if (new_dir !== old_dir) {
          err = FS.nodePermissions(old_dir, 'w');
          if (err) {
            throw new FS.ErrnoError(err);
          }
        }
        try {
          if (FS.trackingDelegate['willMovePath']) {
            FS.trackingDelegate['willMovePath'](old_path, new_path);
          }
        } catch(e) {
          console.log("FS.trackingDelegate['willMovePath']('"+old_path+"', '"+new_path+"') threw an exception: " + e.message);
        }
        // remove the node from the lookup hash
        FS.hashRemoveNode(old_node);
        // do the underlying fs rename
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
        } catch (e) {
          throw e;
        } finally {
          // add the node back to the hash (in case node_ops.rename
          // changed its name)
          FS.hashAddNode(old_node);
        }
        try {
          if (FS.trackingDelegate['onMovePath']) FS.trackingDelegate['onMovePath'](old_path, new_path);
        } catch(e) {
          console.log("FS.trackingDelegate['onMovePath']('"+old_path+"', '"+new_path+"') threw an exception: " + e.message);
        }
      },rmdir:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, true);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        try {
          if (FS.trackingDelegate['willDeletePath']) {
            FS.trackingDelegate['willDeletePath'](path);
          }
        } catch(e) {
          console.log("FS.trackingDelegate['willDeletePath']('"+path+"') threw an exception: " + e.message);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
        try {
          if (FS.trackingDelegate['onDeletePath']) FS.trackingDelegate['onDeletePath'](path);
        } catch(e) {
          console.log("FS.trackingDelegate['onDeletePath']('"+path+"') threw an exception: " + e.message);
        }
      },readdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        return node.node_ops.readdir(node);
      },unlink:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, false);
        if (err) {
          // POSIX says unlink should set EPERM, not EISDIR
          if (err === ERRNO_CODES.EISDIR) err = ERRNO_CODES.EPERM;
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        try {
          if (FS.trackingDelegate['willDeletePath']) {
            FS.trackingDelegate['willDeletePath'](path);
          }
        } catch(e) {
          console.log("FS.trackingDelegate['willDeletePath']('"+path+"') threw an exception: " + e.message);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
        try {
          if (FS.trackingDelegate['onDeletePath']) FS.trackingDelegate['onDeletePath'](path);
        } catch(e) {
          console.log("FS.trackingDelegate['onDeletePath']('"+path+"') threw an exception: " + e.message);
        }
      },readlink:function (path) {
        var lookup = FS.lookupPath(path);
        var link = lookup.node;
        if (!link) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        return PATH.resolve(FS.getPath(link.parent), link.node_ops.readlink(link));
      },stat:function (path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        if (!node) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        if (!node.node_ops.getattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return node.node_ops.getattr(node);
      },lstat:function (path) {
        return FS.stat(path, true);
      },chmod:function (path, mode, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          timestamp: Date.now()
        });
      },lchmod:function (path, mode) {
        FS.chmod(path, mode, true);
      },fchmod:function (fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chmod(stream.node, mode);
      },chown:function (path, uid, gid, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          timestamp: Date.now()
          // we ignore the uid / gid for now
        });
      },lchown:function (path, uid, gid) {
        FS.chown(path, uid, gid, true);
      },fchown:function (fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chown(stream.node, uid, gid);
      },truncate:function (path, len) {
        if (len < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var err = FS.nodePermissions(node, 'w');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        node.node_ops.setattr(node, {
          size: len,
          timestamp: Date.now()
        });
      },ftruncate:function (fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        FS.truncate(stream.node, len);
      },utime:function (path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        node.node_ops.setattr(node, {
          timestamp: Math.max(atime, mtime)
        });
      },open:function (path, flags, mode, fd_start, fd_end) {
        if (path === "") {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        flags = typeof flags === 'string' ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === 'undefined' ? 438 /* 0666 */ : mode;
        if ((flags & 64)) {
          mode = (mode & 4095) | 32768;
        } else {
          mode = 0;
        }
        var node;
        if (typeof path === 'object') {
          node = path;
        } else {
          path = PATH.normalize(path);
          try {
            var lookup = FS.lookupPath(path, {
              follow: !(flags & 131072)
            });
            node = lookup.node;
          } catch (e) {
            // ignore
          }
        }
        // perhaps we need to create the node
        var created = false;
        if ((flags & 64)) {
          if (node) {
            // if O_CREAT and O_EXCL are set, error out if the node already exists
            if ((flags & 128)) {
              throw new FS.ErrnoError(ERRNO_CODES.EEXIST);
            }
          } else {
            // node doesn't exist, try to create it
            node = FS.mknod(path, mode, 0);
            created = true;
          }
        }
        if (!node) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        // can't truncate a device
        if (FS.isChrdev(node.mode)) {
          flags &= ~512;
        }
        // if asked only for a directory, then this must be one
        if ((flags & 65536) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        // check permissions, if this is not a file we just created now (it is ok to
        // create and write to a file with read-only permissions; it is read-only
        // for later use)
        if (!created) {
          var err = FS.mayOpen(node, flags);
          if (err) {
            throw new FS.ErrnoError(err);
          }
        }
        // do truncation if necessary
        if ((flags & 512)) {
          FS.truncate(node, 0);
        }
        // we've already handled these, don't pass down to the underlying vfs
        flags &= ~(128 | 512);
  
        // register the stream with the filesystem
        var stream = FS.createStream({
          node: node,
          path: FS.getPath(node),  // we want the absolute path to the node
          flags: flags,
          seekable: true,
          position: 0,
          stream_ops: node.stream_ops,
          // used by the file family libc calls (fopen, fwrite, ferror, etc.)
          ungotten: [],
          error: false
        }, fd_start, fd_end);
        // call the new stream's open function
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        if (Module['logReadFiles'] && !(flags & 1)) {
          if (!FS.readFiles) FS.readFiles = {};
          if (!(path in FS.readFiles)) {
            FS.readFiles[path] = 1;
            Module['printErr']('read file: ' + path);
          }
        }
        try {
          if (FS.trackingDelegate['onOpenFile']) {
            var trackingFlags = 0;
            if ((flags & 2097155) !== 1) {
              trackingFlags |= FS.tracking.openFlags.READ;
            }
            if ((flags & 2097155) !== 0) {
              trackingFlags |= FS.tracking.openFlags.WRITE;
            }
            FS.trackingDelegate['onOpenFile'](path, trackingFlags);
          }
        } catch(e) {
          console.log("FS.trackingDelegate['onOpenFile']('"+path+"', flags) threw an exception: " + e.message);
        }
        return stream;
      },close:function (stream) {
        if (stream.getdents) stream.getdents = null; // free readdir state
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e) {
          throw e;
        } finally {
          FS.closeStream(stream.fd);
        }
      },llseek:function (stream, offset, whence) {
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        stream.position = stream.stream_ops.llseek(stream, offset, whence);
        stream.ungotten = [];
        return stream.position;
      },read:function (stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },write:function (stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if (stream.flags & 1024) {
          // seek to the end before writing in append mode
          FS.llseek(stream, 0, 2);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        try {
          if (stream.path && FS.trackingDelegate['onWriteToFile']) FS.trackingDelegate['onWriteToFile'](stream.path);
        } catch(e) {
          console.log("FS.trackingDelegate['onWriteToFile']('"+path+"') threw an exception: " + e.message);
        }
        return bytesWritten;
      },allocate:function (stream, offset, length) {
        if (offset < 0 || length <= 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        if (!stream.stream_ops.allocate) {
          throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
        }
        stream.stream_ops.allocate(stream, offset, length);
      },mmap:function (stream, buffer, offset, length, position, prot, flags) {
        // TODO if PROT is PROT_WRITE, make sure we have write access
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EACCES);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags);
      },msync:function (stream, buffer, offset, length, mmapFlags) {
        if (!stream || !stream.stream_ops.msync) {
          return 0;
        }
        return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags);
      },munmap:function (stream) {
        return 0;
      },ioctl:function (stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTTY);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
      },readFile:function (path, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'r';
        opts.encoding = opts.encoding || 'binary';
        if (opts.encoding !== 'utf8' && opts.encoding !== 'binary') {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === 'utf8') {
          ret = UTF8ArrayToString(buf, 0);
        } else if (opts.encoding === 'binary') {
          ret = buf;
        }
        FS.close(stream);
        return ret;
      },writeFile:function (path, data, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'w';
        opts.encoding = opts.encoding || 'utf8';
        if (opts.encoding !== 'utf8' && opts.encoding !== 'binary') {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        var stream = FS.open(path, opts.flags, opts.mode);
        if (opts.encoding === 'utf8') {
          var buf = new Uint8Array(lengthBytesUTF8(data)+1);
          var actualNumBytes = stringToUTF8Array(data, buf, 0, buf.length);
          FS.write(stream, buf, 0, actualNumBytes, 0, opts.canOwn);
        } else if (opts.encoding === 'binary') {
          FS.write(stream, data, 0, data.length, 0, opts.canOwn);
        }
        FS.close(stream);
      },cwd:function () {
        return FS.currentPath;
      },chdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        if (!FS.isDir(lookup.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        var err = FS.nodePermissions(lookup.node, 'x');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        FS.currentPath = lookup.path;
      },createDefaultDirectories:function () {
        FS.mkdir('/tmp');
        FS.mkdir('/home');
        FS.mkdir('/home/web_user');
      },createDefaultDevices:function () {
        // create /dev
        FS.mkdir('/dev');
        // setup /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
          read: function() { return 0; },
          write: function(stream, buffer, offset, length, pos) { return length; }
        });
        FS.mkdev('/dev/null', FS.makedev(1, 3));
        // setup /dev/tty and /dev/tty1
        // stderr needs to print output using Module['printErr']
        // so we register a second tty just for it.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', FS.makedev(6, 0));
        // setup /dev/[u]random
        var random_device;
        if (typeof crypto !== 'undefined') {
          // for modern web browsers
          var randomBuffer = new Uint8Array(1);
          random_device = function() { crypto.getRandomValues(randomBuffer); return randomBuffer[0]; };
        } else if (ENVIRONMENT_IS_NODE) {
          // for nodejs
          random_device = function() { return require('crypto').randomBytes(1)[0]; };
        } else {
          // default for ES5 platforms
          random_device = function() { return (Math.random()*256)|0; };
        }
        FS.createDevice('/dev', 'random', random_device);
        FS.createDevice('/dev', 'urandom', random_device);
        // we're not going to emulate the actual shm device,
        // just create the tmp dirs that reside in it commonly
        FS.mkdir('/dev/shm');
        FS.mkdir('/dev/shm/tmp');
      },createSpecialDirectories:function () {
        // create /proc/self/fd which allows /proc/self/fd/6 => readlink gives the name of the stream for fd 6 (see test_unistd_ttyname)
        FS.mkdir('/proc');
        FS.mkdir('/proc/self');
        FS.mkdir('/proc/self/fd');
        FS.mount({
          mount: function() {
            var node = FS.createNode('/proc/self', 'fd', 16384 | 0777, 73);
            node.node_ops = {
              lookup: function(parent, name) {
                var fd = +name;
                var stream = FS.getStream(fd);
                if (!stream) throw new FS.ErrnoError(ERRNO_CODES.EBADF);
                var ret = {
                  parent: null,
                  mount: { mountpoint: 'fake' },
                  node_ops: { readlink: function() { return stream.path } }
                };
                ret.parent = ret; // make it look like a simple root node
                return ret;
              }
            };
            return node;
          }
        }, {}, '/proc/self/fd');
      },createStandardStreams:function () {
        // TODO deprecate the old functionality of a single
        // input / output callback and that utilizes FS.createDevice
        // and instead require a unique set of stream ops
  
        // by default, we symlink the standard streams to the
        // default tty devices. however, if the standard streams
        // have been overwritten we create a unique device for
        // them instead.
        if (Module['stdin']) {
          FS.createDevice('/dev', 'stdin', Module['stdin']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdin');
        }
        if (Module['stdout']) {
          FS.createDevice('/dev', 'stdout', null, Module['stdout']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdout');
        }
        if (Module['stderr']) {
          FS.createDevice('/dev', 'stderr', null, Module['stderr']);
        } else {
          FS.symlink('/dev/tty1', '/dev/stderr');
        }
  
        // open default streams for the stdin, stdout and stderr devices
        var stdin = FS.open('/dev/stdin', 'r');
        assert(stdin.fd === 0, 'invalid handle for stdin (' + stdin.fd + ')');
  
        var stdout = FS.open('/dev/stdout', 'w');
        assert(stdout.fd === 1, 'invalid handle for stdout (' + stdout.fd + ')');
  
        var stderr = FS.open('/dev/stderr', 'w');
        assert(stderr.fd === 2, 'invalid handle for stderr (' + stderr.fd + ')');
      },ensureErrnoError:function () {
        if (FS.ErrnoError) return;
        FS.ErrnoError = function ErrnoError(errno, node) {
          //Module.printErr(stackTrace()); // useful for debugging
          this.node = node;
          this.setErrno = function(errno) {
            this.errno = errno;
            for (var key in ERRNO_CODES) {
              if (ERRNO_CODES[key] === errno) {
                this.code = key;
                break;
              }
            }
          };
          this.setErrno(errno);
          this.message = ERRNO_MESSAGES[errno];
          if (this.stack) this.stack = demangleAll(this.stack);
        };
        FS.ErrnoError.prototype = new Error();
        FS.ErrnoError.prototype.constructor = FS.ErrnoError;
        // Some errors may happen quite a bit, to avoid overhead we reuse them (and suffer a lack of stack info)
        [ERRNO_CODES.ENOENT].forEach(function(code) {
          FS.genericErrors[code] = new FS.ErrnoError(code);
          FS.genericErrors[code].stack = '<generic error, no stack>';
        });
      },staticInit:function () {
        FS.ensureErrnoError();
  
        FS.nameTable = new Array(4096);
  
        FS.mount(MEMFS, {}, '/');
  
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
        FS.createSpecialDirectories();
  
        FS.filesystems = {
          'MEMFS': MEMFS,
          'IDBFS': IDBFS,
          'NODEFS': NODEFS,
          'WORKERFS': WORKERFS,
        };
      },init:function (input, output, error) {
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
  
        FS.ensureErrnoError();
  
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        Module['stdin'] = input || Module['stdin'];
        Module['stdout'] = output || Module['stdout'];
        Module['stderr'] = error || Module['stderr'];
  
        FS.createStandardStreams();
      },quit:function () {
        FS.init.initialized = false;
        // force-flush all streams, so we get musl std streams printed out
        var fflush = Module['_fflush'];
        if (fflush) fflush(0);
        // close all of our streams
        for (var i = 0; i < FS.streams.length; i++) {
          var stream = FS.streams[i];
          if (!stream) {
            continue;
          }
          FS.close(stream);
        }
      },getMode:function (canRead, canWrite) {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode;
      },joinPath:function (parts, forceRelative) {
        var path = PATH.join.apply(null, parts);
        if (forceRelative && path[0] == '/') path = path.substr(1);
        return path;
      },absolutePath:function (relative, base) {
        return PATH.resolve(base, relative);
      },standardizePath:function (path) {
        return PATH.normalize(path);
      },findObject:function (path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },analyzePath:function (path, dontResolveLastLink) {
        // operate from within the context of the symlink's target
        try {
          var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          path = lookup.path;
        } catch (e) {
        }
        var ret = {
          isRoot: false, exists: false, error: 0, name: null, path: null, object: null,
          parentExists: false, parentPath: null, parentObject: null
        };
        try {
          var lookup = FS.lookupPath(path, { parent: true });
          ret.parentExists = true;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = PATH.basename(path);
          lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          ret.exists = true;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === '/';
        } catch (e) {
          ret.error = e.errno;
        };
        return ret;
      },createFolder:function (parent, name, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.mkdir(path, mode);
      },createPath:function (parent, path, canRead, canWrite) {
        parent = typeof parent === 'string' ? parent : FS.getPath(parent);
        var parts = path.split('/').reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join2(parent, part);
          try {
            FS.mkdir(current);
          } catch (e) {
            // ignore EEXIST
          }
          parent = current;
        }
        return current;
      },createFile:function (parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode);
      },createDataFile:function (parent, name, data, canRead, canWrite, canOwn) {
        var path = name ? PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name) : parent;
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          if (typeof data === 'string') {
            var arr = new Array(data.length);
            for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
            data = arr;
          }
          // make sure we can write to the file
          FS.chmod(node, mode | 146);
          var stream = FS.open(node, 'w');
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(node, mode);
        }
        return node;
      },createDevice:function (parent, name, input, output) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        // Create a fake device that a set of stream ops to emulate
        // the old behavior.
        FS.registerDevice(dev, {
          open: function(stream) {
            stream.seekable = false;
          },
          close: function(stream) {
            // flush any pending line data
            if (output && output.buffer && output.buffer.length) {
              output(10);
            }
          },
          read: function(stream, buffer, offset, length, pos /* ignored */) {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
              if (result === undefined && bytesRead === 0) {
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset+i] = result;
            }
            if (bytesRead) {
              stream.node.timestamp = Date.now();
            }
            return bytesRead;
          },
          write: function(stream, buffer, offset, length, pos) {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset+i]);
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
            }
            if (length) {
              stream.node.timestamp = Date.now();
            }
            return i;
          }
        });
        return FS.mkdev(path, mode, dev);
      },createLink:function (parent, name, target, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        return FS.symlink(target, path);
      },forceLoadFile:function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (Module['read']) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(Module['read'](obj.url), true);
            obj.usedBytes = obj.contents.length;
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success;
      },createLazyFile:function (parent, name, url, canRead, canWrite) {
        // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
        function LazyUint8Array() {
          this.lengthKnown = false;
          this.chunks = []; // Loaded chunks. Index is the chunk number
        }
        LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
          if (idx > this.length-1 || idx < 0) {
            return undefined;
          }
          var chunkOffset = idx % this.chunkSize;
          var chunkNum = (idx / this.chunkSize)|0;
          return this.getter(chunkNum)[chunkOffset];
        }
        LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
          this.getter = getter;
        }
        LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
          // Find length
          var xhr = new XMLHttpRequest();
          xhr.open('HEAD', url, false);
          xhr.send(null);
          if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
          var datalength = Number(xhr.getResponseHeader("Content-length"));
          var header;
          var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
          var usesGzip = (header = xhr.getResponseHeader("Content-Encoding")) && header === "gzip";
  
          var chunkSize = 1024*1024; // Chunk size in bytes
  
          if (!hasByteServing) chunkSize = datalength;
  
          // Function to get a range from the remote URL.
          var doXHR = (function(from, to) {
            if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
            if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
  
            // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, false);
            if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
  
            // Some hints to the browser that we want binary data.
            if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
            if (xhr.overrideMimeType) {
              xhr.overrideMimeType('text/plain; charset=x-user-defined');
            }
  
            xhr.send(null);
            if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
            if (xhr.response !== undefined) {
              return new Uint8Array(xhr.response || []);
            } else {
              return intArrayFromString(xhr.responseText || '', true);
            }
          });
          var lazyArray = this;
          lazyArray.setDataGetter(function(chunkNum) {
            var start = chunkNum * chunkSize;
            var end = (chunkNum+1) * chunkSize - 1; // including this byte
            end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
            if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
              lazyArray.chunks[chunkNum] = doXHR(start, end);
            }
            if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
            return lazyArray.chunks[chunkNum];
          });
  
          if (usesGzip || !datalength) {
            // if the server uses gzip or doesn't supply the length, we have to download the whole file to get the (uncompressed) length
            chunkSize = datalength = 1; // this will force getter(0)/doXHR do download the whole file
            datalength = this.getter(0).length;
            chunkSize = datalength;
            console.log("LazyFiles on gzip forces download of the whole file when length is accessed");
          }
  
          this._length = datalength;
          this._chunkSize = chunkSize;
          this.lengthKnown = true;
        }
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          var lazyArray = new LazyUint8Array();
          Object.defineProperties(lazyArray, {
            length: {
              get: function() {
                if(!this.lengthKnown) {
                  this.cacheLength();
                }
                return this._length;
              }
            },
            chunkSize: {
              get: function() {
                if(!this.lengthKnown) {
                  this.cacheLength();
                }
                return this._chunkSize;
              }
            }
          });
  
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
  
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        // This is a total hack, but I want to get this lazy file code out of the
        // core of MEMFS. If we want to keep this lazy file concept I feel it should
        // be its own thin LAZYFS proxying calls to MEMFS.
        if (properties.contents) {
          node.contents = properties.contents;
        } else if (properties.url) {
          node.contents = null;
          node.url = properties.url;
        }
        // Add a function that defers querying the file size until it is asked the first time.
        Object.defineProperties(node, {
          usedBytes: {
            get: function() { return this.contents.length; }
          }
        });
        // override each stream op with one that tries to force load the lazy file first
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(function(key) {
          var fn = node.stream_ops[key];
          stream_ops[key] = function forceLoadLazyFile() {
            if (!FS.forceLoadFile(node)) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            return fn.apply(null, arguments);
          };
        });
        // use a custom read function
        stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
          if (!FS.forceLoadFile(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EIO);
          }
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (contents.slice) { // normal array
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          } else {
            for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
              buffer[offset + i] = contents.get(position + i);
            }
          }
          return size;
        };
        node.stream_ops = stream_ops;
        return node;
      },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn, preFinish) {
        Browser.init(); // XXX perhaps this method should move onto Browser?
        // TODO we should allow people to just pass in a complete filename instead
        // of parent and name being that we just join them anyways
        var fullname = name ? PATH.resolve(PATH.join2(parent, name)) : parent;
        var dep = getUniqueRunDependency('cp ' + fullname); // might have several active requests for the same fullname
        function processData(byteArray) {
          function finish(byteArray) {
            if (preFinish) preFinish();
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
            }
            if (onload) onload();
            removeRunDependency(dep);
          }
          var handled = false;
          Module['preloadPlugins'].forEach(function(plugin) {
            if (handled) return;
            if (plugin['canHandle'](fullname)) {
              plugin['handle'](byteArray, fullname, finish, function() {
                if (onerror) onerror();
                removeRunDependency(dep);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency(dep);
        if (typeof url == 'string') {
          Browser.asyncLoad(url, function(byteArray) {
            processData(byteArray);
          }, onerror);
        } else {
          processData(url);
        }
      },indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_NAME:function () {
        return 'EM_FS_' + window.location.pathname;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",saveFilesToDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
          console.log('creating db');
          var db = openRequest.result;
          db.createObjectStore(FS.DB_STORE_NAME);
        };
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          var transaction = db.transaction([FS.DB_STORE_NAME], 'readwrite');
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var putRequest = files.put(FS.analyzePath(path).object.contents, path);
            putRequest.onsuccess = function putRequest_onsuccess() { ok++; if (ok + fail == total) finish() };
            putRequest.onerror = function putRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      },loadFilesFromDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = onerror; // no database to load from
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          try {
            var transaction = db.transaction([FS.DB_STORE_NAME], 'readonly');
          } catch(e) {
            onerror(e);
            return;
          }
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var getRequest = files.get(path);
            getRequest.onsuccess = function getRequest_onsuccess() {
              if (FS.analyzePath(path).exists) {
                FS.unlink(path);
              }
              FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
              ok++;
              if (ok + fail == total) finish();
            };
            getRequest.onerror = function getRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      }};
  
  
  
  function _emscripten_set_main_loop_timing(mode, value) {
      Browser.mainLoop.timingMode = mode;
      Browser.mainLoop.timingValue = value;
  
      if (!Browser.mainLoop.func) {
        console.error('emscripten_set_main_loop_timing: Cannot set timing mode for main loop since a main loop does not exist! Call emscripten_set_main_loop first to set one up.');
        return 1; // Return non-zero on failure, can't set timing mode when there is no main loop.
      }
  
      if (mode == 0 /*EM_TIMING_SETTIMEOUT*/) {
        Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_setTimeout() {
          setTimeout(Browser.mainLoop.runner, value); // doing this each time means that on exception, we stop
        };
        Browser.mainLoop.method = 'timeout';
      } else if (mode == 1 /*EM_TIMING_RAF*/) {
        Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_rAF() {
          Browser.requestAnimationFrame(Browser.mainLoop.runner);
        };
        Browser.mainLoop.method = 'rAF';
      } else if (mode == 2 /*EM_TIMING_SETIMMEDIATE*/) {
        if (!window['setImmediate']) {
          // Emulate setImmediate. (note: not a complete polyfill, we don't emulate clearImmediate() to keep code size to minimum, since not needed)
          var setImmediates = [];
          var emscriptenMainLoopMessageId = '__emcc';
          function Browser_setImmediate_messageHandler(event) {
            if (event.source === window && event.data === emscriptenMainLoopMessageId) {
              event.stopPropagation();
              setImmediates.shift()();
            }
          }
          window.addEventListener("message", Browser_setImmediate_messageHandler, true);
          window['setImmediate'] = function Browser_emulated_setImmediate(func) {
            setImmediates.push(func);
            window.postMessage(emscriptenMainLoopMessageId, "*");
          }
        }
        Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_setImmediate() {
          window['setImmediate'](Browser.mainLoop.runner);
        };
        Browser.mainLoop.method = 'immediate';
      }
      return 0;
    }function _emscripten_set_main_loop(func, fps, simulateInfiniteLoop, arg, noSetTiming) {
      Module['noExitRuntime'] = true;
  
      assert(!Browser.mainLoop.func, 'emscripten_set_main_loop: there can only be one main loop function at once: call emscripten_cancel_main_loop to cancel the previous one before setting a new one with different parameters.');
  
      Browser.mainLoop.func = func;
      Browser.mainLoop.arg = arg;
  
      var thisMainLoopId = Browser.mainLoop.currentlyRunningMainloop;
  
      Browser.mainLoop.runner = function Browser_mainLoop_runner() {
        if (ABORT) return;
        if (Browser.mainLoop.queue.length > 0) {
          var start = Date.now();
          var blocker = Browser.mainLoop.queue.shift();
          blocker.func(blocker.arg);
          if (Browser.mainLoop.remainingBlockers) {
            var remaining = Browser.mainLoop.remainingBlockers;
            var next = remaining%1 == 0 ? remaining-1 : Math.floor(remaining);
            if (blocker.counted) {
              Browser.mainLoop.remainingBlockers = next;
            } else {
              // not counted, but move the progress along a tiny bit
              next = next + 0.5; // do not steal all the next one's progress
              Browser.mainLoop.remainingBlockers = (8*remaining + next)/9;
            }
          }
          console.log('main loop blocker "' + blocker.name + '" took ' + (Date.now() - start) + ' ms'); //, left: ' + Browser.mainLoop.remainingBlockers);
          Browser.mainLoop.updateStatus();
          
          // catches pause/resume main loop from blocker execution
          if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop) return;
          
          setTimeout(Browser.mainLoop.runner, 0);
          return;
        }
  
        // catch pauses from non-main loop sources
        if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop) return;
  
        // Implement very basic swap interval control
        Browser.mainLoop.currentFrameNumber = Browser.mainLoop.currentFrameNumber + 1 | 0;
        if (Browser.mainLoop.timingMode == 1/*EM_TIMING_RAF*/ && Browser.mainLoop.timingValue > 1 && Browser.mainLoop.currentFrameNumber % Browser.mainLoop.timingValue != 0) {
          // Not the scheduled time to render this frame - skip.
          Browser.mainLoop.scheduler();
          return;
        }
  
        // Signal GL rendering layer that processing of a new frame is about to start. This helps it optimize
        // VBO double-buffering and reduce GPU stalls.
  
        if (Browser.mainLoop.method === 'timeout' && Module.ctx) {
          Module.printErr('Looks like you are rendering without using requestAnimationFrame for the main loop. You should use 0 for the frame rate in emscripten_set_main_loop in order to use requestAnimationFrame, as that can greatly improve your frame rates!');
          Browser.mainLoop.method = ''; // just warn once per call to set main loop
        }
  
        Browser.mainLoop.runIter(function() {
          if (typeof arg !== 'undefined') {
            Runtime.dynCall('vi', func, [arg]);
          } else {
            Runtime.dynCall('v', func);
          }
        });
  
        checkStackCookie();
  
        // catch pauses from the main loop itself
        if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop) return;
  
        // Queue new audio data. This is important to be right after the main loop invocation, so that we will immediately be able
        // to queue the newest produced audio samples.
        // TODO: Consider adding pre- and post- rAF callbacks so that GL.newRenderingFrameStarted() and SDL.audio.queueNewAudioData()
        //       do not need to be hardcoded into this function, but can be more generic.
        if (typeof SDL === 'object' && SDL.audio && SDL.audio.queueNewAudioData) SDL.audio.queueNewAudioData();
  
        Browser.mainLoop.scheduler();
      }
  
      if (!noSetTiming) {
        if (fps && fps > 0) _emscripten_set_main_loop_timing(0/*EM_TIMING_SETTIMEOUT*/, 1000.0 / fps);
        else _emscripten_set_main_loop_timing(1/*EM_TIMING_RAF*/, 1); // Do rAF by rendering each frame (no decimating)
  
        Browser.mainLoop.scheduler();
      }
  
      if (simulateInfiniteLoop) {
        throw 'SimulateInfiniteLoop';
      }
    }var Browser={mainLoop:{scheduler:null,method:"",currentlyRunningMainloop:0,func:null,arg:0,timingMode:0,timingValue:0,currentFrameNumber:0,queue:[],pause:function () {
          Browser.mainLoop.scheduler = null;
          Browser.mainLoop.currentlyRunningMainloop++; // Incrementing this signals the previous main loop that it's now become old, and it must return.
        },resume:function () {
          Browser.mainLoop.currentlyRunningMainloop++;
          var timingMode = Browser.mainLoop.timingMode;
          var timingValue = Browser.mainLoop.timingValue;
          var func = Browser.mainLoop.func;
          Browser.mainLoop.func = null;
          _emscripten_set_main_loop(func, 0, false, Browser.mainLoop.arg, true /* do not set timing and call scheduler, we will do it on the next lines */);
          _emscripten_set_main_loop_timing(timingMode, timingValue);
          Browser.mainLoop.scheduler();
        },updateStatus:function () {
          if (Module['setStatus']) {
            var message = Module['statusMessage'] || 'Please wait...';
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;
            if (remaining) {
              if (remaining < expected) {
                Module['setStatus'](message + ' (' + (expected - remaining) + '/' + expected + ')');
              } else {
                Module['setStatus'](message);
              }
            } else {
              Module['setStatus']('');
            }
          }
        },runIter:function (func) {
          if (ABORT) return;
          if (Module['preMainLoop']) {
            var preRet = Module['preMainLoop']();
            if (preRet === false) {
              return; // |return false| skips a frame
            }
          }
          try {
            func();
          } catch (e) {
            if (e instanceof ExitStatus) {
              return;
            } else {
              if (e && typeof e === 'object' && e.stack) Module.printErr('exception thrown: ' + [e, e.stack]);
              throw e;
            }
          }
          if (Module['postMainLoop']) Module['postMainLoop']();
        }},isFullScreen:false,pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],init:function () {
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = []; // needs to exist even in workers
  
        if (Browser.initted) return;
        Browser.initted = true;
  
        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch(e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : (typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : (!Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null));
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : undefined;
        if (!Module.noImageDecoding && typeof Browser.URLObject === 'undefined') {
          console.log("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
          Module.noImageDecoding = true;
        }
  
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
  
        var imagePlugin = {};
        imagePlugin['canHandle'] = function imagePlugin_canHandle(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
        };
        imagePlugin['handle'] = function imagePlugin_handle(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: Browser.getMimetype(name) });
              if (b.size !== byteArray.length) { // Safari bug #118630
                // Safari's Blob can only take an ArrayBuffer
                b = new Blob([(new Uint8Array(byteArray)).buffer], { type: Browser.getMimetype(name) });
              }
            } catch(e) {
              Runtime.warnOnce('Blob constructor present but fails: ' + e + '; falling back to blob builder');
            }
          }
          if (!b) {
            var bb = new Browser.BlobBuilder();
            bb.append((new Uint8Array(byteArray)).buffer); // we need to pass a buffer, and must copy the array to get the right data range
            b = bb.getBlob();
          }
          var url = Browser.URLObject.createObjectURL(b);
          assert(typeof url == 'string', 'createObjectURL must return a url as a string');
          var img = new Image();
          img.onload = function img_onload() {
            assert(img.complete, 'Image ' + name + ' could not be decoded');
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            Module["preloadedImages"][name] = canvas;
            Browser.URLObject.revokeObjectURL(url);
            if (onload) onload(byteArray);
          };
          img.onerror = function img_onerror(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
  
        var audioPlugin = {};
        audioPlugin['canHandle'] = function audioPlugin_canHandle(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function audioPlugin_handle(byteArray, name, onload, onerror) {
          var done = false;
          function finish(audio) {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = audio;
            if (onload) onload(byteArray);
          }
          function fail() {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = new Audio(); // empty shim
            if (onerror) onerror();
          }
          if (Browser.hasBlobConstructor) {
            try {
              var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
            } catch(e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b); // XXX we never revoke this!
            assert(typeof url == 'string', 'createObjectURL must return a url as a string');
            var audio = new Audio();
            audio.addEventListener('canplaythrough', function() { finish(audio) }, false); // use addEventListener due to chromium bug 124926
            audio.onerror = function audio_onerror(event) {
              if (done) return;
              console.log('warning: browser could not fully decode audio ' + name + ', trying slower base64 approach');
              function encode64(data) {
                var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var PAD = '=';
                var ret = '';
                var leftchar = 0;
                var leftbits = 0;
                for (var i = 0; i < data.length; i++) {
                  leftchar = (leftchar << 8) | data[i];
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits-6)) & 0x3f;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar&3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar&0xf) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src = 'data:audio/x-' + name.substr(-3) + ';base64,' + encode64(byteArray);
              finish(audio); // we don't wait for confirmation this worked - but it's worth trying
            };
            audio.src = url;
            // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
            Browser.safeSetTimeout(function() {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10000);
          } else {
            return fail();
          }
        };
        Module['preloadPlugins'].push(audioPlugin);
  
        // Canvas event setup
  
        var canvas = Module['canvas'];
        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === canvas ||
                                document['mozPointerLockElement'] === canvas ||
                                document['webkitPointerLockElement'] === canvas ||
                                document['msPointerLockElement'] === canvas;
        }
        if (canvas) {
          // forced aspect ratio can be enabled by defining 'forcedAspectRatio' on Module
          // Module['forcedAspectRatio'] = 4 / 3;
          
          canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                      canvas['mozRequestPointerLock'] ||
                                      canvas['webkitRequestPointerLock'] ||
                                      canvas['msRequestPointerLock'] ||
                                      function(){};
          canvas.exitPointerLock = document['exitPointerLock'] ||
                                   document['mozExitPointerLock'] ||
                                   document['webkitExitPointerLock'] ||
                                   document['msExitPointerLock'] ||
                                   function(){}; // no-op if function does not exist
          canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
  
  
          document.addEventListener('pointerlockchange', pointerLockChange, false);
          document.addEventListener('mozpointerlockchange', pointerLockChange, false);
          document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
          document.addEventListener('mspointerlockchange', pointerLockChange, false);
  
          if (Module['elementPointerLock']) {
            canvas.addEventListener("click", function(ev) {
              if (!Browser.pointerLock && canvas.requestPointerLock) {
                canvas.requestPointerLock();
                ev.preventDefault();
              }
            }, false);
          }
        }
      },createContext:function (canvas, useWebGL, setInModule, webGLContextAttributes) {
        if (useWebGL && Module.ctx && canvas == Module.canvas) return Module.ctx; // no need to recreate GL context if it's already been created for this canvas.
  
        var ctx;
        var contextHandle;
        if (useWebGL) {
          // For GLES2/desktop GL compatibility, adjust a few defaults to be different to WebGL defaults, so that they align better with the desktop defaults.
          var contextAttributes = {
            antialias: false,
            alpha: false
          };
  
          if (webGLContextAttributes) {
            for (var attribute in webGLContextAttributes) {
              contextAttributes[attribute] = webGLContextAttributes[attribute];
            }
          }
  
          contextHandle = GL.createContext(canvas, contextAttributes);
          if (contextHandle) {
            ctx = GL.getContext(contextHandle).GLctx;
          }
          // Set the background of the WebGL canvas to black
          canvas.style.backgroundColor = "black";
        } else {
          ctx = canvas.getContext('2d');
        }
  
        if (!ctx) return null;
  
        if (setInModule) {
          if (!useWebGL) assert(typeof GLctx === 'undefined', 'cannot set in module if GLctx is used, but we are a non-GL context that would replace it');
  
          Module.ctx = ctx;
          if (useWebGL) GL.makeContextCurrent(contextHandle);
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) { callback() });
          Browser.init();
        }
        return ctx;
      },destroyContext:function (canvas, useWebGL, setInModule) {},fullScreenHandlersInstalled:false,lockPointer:undefined,resizeCanvas:undefined,requestFullScreen:function (lockPointer, resizeCanvas, vrDevice) {
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        Browser.vrDevice = vrDevice;
        if (typeof Browser.lockPointer === 'undefined') Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas === 'undefined') Browser.resizeCanvas = false;
        if (typeof Browser.vrDevice === 'undefined') Browser.vrDevice = null;
  
        var canvas = Module['canvas'];
        function fullScreenChange() {
          Browser.isFullScreen = false;
          var canvasContainer = canvas.parentNode;
          if ((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
               document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
               document['fullScreenElement'] || document['fullscreenElement'] ||
               document['msFullScreenElement'] || document['msFullscreenElement'] ||
               document['webkitCurrentFullScreenElement']) === canvasContainer) {
            canvas.cancelFullScreen = document['cancelFullScreen'] ||
                                      document['mozCancelFullScreen'] ||
                                      document['webkitCancelFullScreen'] ||
                                      document['msExitFullscreen'] ||
                                      document['exitFullscreen'] ||
                                      function() {};
            canvas.cancelFullScreen = canvas.cancelFullScreen.bind(document);
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullScreen = true;
            if (Browser.resizeCanvas) Browser.setFullScreenCanvasSize();
          } else {
            
            // remove the full screen specific parent of the canvas again to restore the HTML structure from before going full screen
            canvasContainer.parentNode.insertBefore(canvas, canvasContainer);
            canvasContainer.parentNode.removeChild(canvasContainer);
            
            if (Browser.resizeCanvas) Browser.setWindowedCanvasSize();
          }
          if (Module['onFullScreen']) Module['onFullScreen'](Browser.isFullScreen);
          Browser.updateCanvasDimensions(canvas);
        }
  
        if (!Browser.fullScreenHandlersInstalled) {
          Browser.fullScreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullScreenChange, false);
          document.addEventListener('mozfullscreenchange', fullScreenChange, false);
          document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
          document.addEventListener('MSFullscreenChange', fullScreenChange, false);
        }
  
        // create a new parent to ensure the canvas has no siblings. this allows browsers to optimize full screen performance when its parent is the full screen root
        var canvasContainer = document.createElement("div");
        canvas.parentNode.insertBefore(canvasContainer, canvas);
        canvasContainer.appendChild(canvas);
  
        // use parent of canvas as full screen root to allow aspect ratio correction (Firefox stretches the root to screen size)
        canvasContainer.requestFullScreen = canvasContainer['requestFullScreen'] ||
                                            canvasContainer['mozRequestFullScreen'] ||
                                            canvasContainer['msRequestFullscreen'] ||
                                           (canvasContainer['webkitRequestFullScreen'] ? function() { canvasContainer['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
  
        if (vrDevice) {
          canvasContainer.requestFullScreen({ vrDisplay: vrDevice });
        } else {
          canvasContainer.requestFullScreen();
        }
      },nextRAF:0,fakeRequestAnimationFrame:function (func) {
        // try to keep 60fps between calls to here
        var now = Date.now();
        if (Browser.nextRAF === 0) {
          Browser.nextRAF = now + 1000/60;
        } else {
          while (now + 2 >= Browser.nextRAF) { // fudge a little, to avoid timer jitter causing us to do lots of delay:0
            Browser.nextRAF += 1000/60;
          }
        }
        var delay = Math.max(Browser.nextRAF - now, 0);
        setTimeout(func, delay);
      },requestAnimationFrame:function requestAnimationFrame(func) {
        if (typeof window === 'undefined') { // Provide fallback to setTimeout if window is undefined (e.g. in Node.js)
          Browser.fakeRequestAnimationFrame(func);
        } else {
          if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                           window['mozRequestAnimationFrame'] ||
                                           window['webkitRequestAnimationFrame'] ||
                                           window['msRequestAnimationFrame'] ||
                                           window['oRequestAnimationFrame'] ||
                                           Browser.fakeRequestAnimationFrame;
          }
          window.requestAnimationFrame(func);
        }
      },safeCallback:function (func) {
        return function() {
          if (!ABORT) return func.apply(null, arguments);
        };
      },allowAsyncCallbacks:true,queuedAsyncCallbacks:[],pauseAsyncCallbacks:function () {
        Browser.allowAsyncCallbacks = false;
      },resumeAsyncCallbacks:function () { // marks future callbacks as ok to execute, and synchronously runs any remaining ones right now
        Browser.allowAsyncCallbacks = true;
        if (Browser.queuedAsyncCallbacks.length > 0) {
          var callbacks = Browser.queuedAsyncCallbacks;
          Browser.queuedAsyncCallbacks = [];
          callbacks.forEach(function(func) {
            func();
          });
        }
      },safeRequestAnimationFrame:function (func) {
        return Browser.requestAnimationFrame(function() {
          if (ABORT) return;
          if (Browser.allowAsyncCallbacks) {
            func();
          } else {
            Browser.queuedAsyncCallbacks.push(func);
          }
        });
      },safeSetTimeout:function (func, timeout) {
        Module['noExitRuntime'] = true;
        return setTimeout(function() {
          if (ABORT) return;
          if (Browser.allowAsyncCallbacks) {
            func();
          } else {
            Browser.queuedAsyncCallbacks.push(func);
          }
        }, timeout);
      },safeSetInterval:function (func, timeout) {
        Module['noExitRuntime'] = true;
        return setInterval(function() {
          if (ABORT) return;
          if (Browser.allowAsyncCallbacks) {
            func();
          } // drop it on the floor otherwise, next interval will kick in
        }, timeout);
      },getMimetype:function (name) {
        return {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'bmp': 'image/bmp',
          'ogg': 'audio/ogg',
          'wav': 'audio/wav',
          'mp3': 'audio/mpeg'
        }[name.substr(name.lastIndexOf('.')+1)];
      },getUserMedia:function (func) {
        if(!window.getUserMedia) {
          window.getUserMedia = navigator['getUserMedia'] ||
                                navigator['mozGetUserMedia'];
        }
        window.getUserMedia(func);
      },getMovementX:function (event) {
        return event['movementX'] ||
               event['mozMovementX'] ||
               event['webkitMovementX'] ||
               0;
      },getMovementY:function (event) {
        return event['movementY'] ||
               event['mozMovementY'] ||
               event['webkitMovementY'] ||
               0;
      },getMouseWheelDelta:function (event) {
        var delta = 0;
        switch (event.type) {
          case 'DOMMouseScroll': 
            delta = event.detail;
            break;
          case 'mousewheel': 
            delta = event.wheelDelta;
            break;
          case 'wheel': 
            delta = event['deltaY'];
            break;
          default:
            throw 'unrecognized mouse wheel event: ' + event.type;
        }
        return delta;
      },mouseX:0,mouseY:0,mouseMovementX:0,mouseMovementY:0,touches:{},lastTouches:{},calculateMouseEvent:function (event) { // event should be mousemove, mousedown or mouseup
        if (Browser.pointerLock) {
          // When the pointer is locked, calculate the coordinates
          // based on the movement of the mouse.
          // Workaround for Firefox bug 764498
          if (event.type != 'mousemove' &&
              ('mozMovementX' in event)) {
            Browser.mouseMovementX = Browser.mouseMovementY = 0;
          } else {
            Browser.mouseMovementX = Browser.getMovementX(event);
            Browser.mouseMovementY = Browser.getMovementY(event);
          }
          
          // check if SDL is available
          if (typeof SDL != "undefined") {
          	Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
          	Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
          } else {
          	// just add the mouse delta to the current absolut mouse position
          	// FIXME: ideally this should be clamped against the canvas size and zero
          	Browser.mouseX += Browser.mouseMovementX;
          	Browser.mouseY += Browser.mouseMovementY;
          }        
        } else {
          // Otherwise, calculate the movement based on the changes
          // in the coordinates.
          var rect = Module["canvas"].getBoundingClientRect();
          var cw = Module["canvas"].width;
          var ch = Module["canvas"].height;
  
          // Neither .scrollX or .pageXOffset are defined in a spec, but
          // we prefer .scrollX because it is currently in a spec draft.
          // (see: http://www.w3.org/TR/2013/WD-cssom-view-20131217/)
          var scrollX = ((typeof window.scrollX !== 'undefined') ? window.scrollX : window.pageXOffset);
          var scrollY = ((typeof window.scrollY !== 'undefined') ? window.scrollY : window.pageYOffset);
          // If this assert lands, it's likely because the browser doesn't support scrollX or pageXOffset
          // and we have no viable fallback.
          assert((typeof scrollX !== 'undefined') && (typeof scrollY !== 'undefined'), 'Unable to retrieve scroll position, mouse positions likely broken.');
  
          if (event.type === 'touchstart' || event.type === 'touchend' || event.type === 'touchmove') {
            var touch = event.touch;
            if (touch === undefined) {
              return; // the "touch" property is only defined in SDL
  
            }
            var adjustedX = touch.pageX - (scrollX + rect.left);
            var adjustedY = touch.pageY - (scrollY + rect.top);
  
            adjustedX = adjustedX * (cw / rect.width);
            adjustedY = adjustedY * (ch / rect.height);
  
            var coords = { x: adjustedX, y: adjustedY };
            
            if (event.type === 'touchstart') {
              Browser.lastTouches[touch.identifier] = coords;
              Browser.touches[touch.identifier] = coords;
            } else if (event.type === 'touchend' || event.type === 'touchmove') {
              var last = Browser.touches[touch.identifier];
              if (!last) last = coords;
              Browser.lastTouches[touch.identifier] = last;
              Browser.touches[touch.identifier] = coords;
            } 
            return;
          }
  
          var x = event.pageX - (scrollX + rect.left);
          var y = event.pageY - (scrollY + rect.top);
  
          // the canvas might be CSS-scaled compared to its backbuffer;
          // SDL-using content will want mouse coordinates in terms
          // of backbuffer units.
          x = x * (cw / rect.width);
          y = y * (ch / rect.height);
  
          Browser.mouseMovementX = x - Browser.mouseX;
          Browser.mouseMovementY = y - Browser.mouseY;
          Browser.mouseX = x;
          Browser.mouseY = y;
        }
      },asyncLoad:function (url, onload, onerror, noRunDep) {
        Module['readAsync'](url, function(arrayBuffer) {
          assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
          onload(new Uint8Array(arrayBuffer));
          if (!noRunDep) removeRunDependency('al ' + url);
        }, function(event) {
          if (onerror) {
            onerror();
          } else {
            throw 'Loading data file "' + url + '" failed.';
          }
        });
        if (!noRunDep) addRunDependency('al ' + url);
      },resizeListeners:[],updateResizeListeners:function () {
        var canvas = Module['canvas'];
        Browser.resizeListeners.forEach(function(listener) {
          listener(canvas.width, canvas.height);
        });
      },setCanvasSize:function (width, height, noUpdates) {
        var canvas = Module['canvas'];
        Browser.updateCanvasDimensions(canvas, width, height);
        if (!noUpdates) Browser.updateResizeListeners();
      },windowedWidth:0,windowedHeight:0,setFullScreenCanvasSize:function () {
        // check if SDL is available   
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },setWindowedCanvasSize:function () {
        // check if SDL is available       
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },updateCanvasDimensions:function (canvas, wNative, hNative) {
        if (wNative && hNative) {
          canvas.widthNative = wNative;
          canvas.heightNative = hNative;
        } else {
          wNative = canvas.widthNative;
          hNative = canvas.heightNative;
        }
        var w = wNative;
        var h = hNative;
        if (Module['forcedAspectRatio'] && Module['forcedAspectRatio'] > 0) {
          if (w/h < Module['forcedAspectRatio']) {
            w = Math.round(h * Module['forcedAspectRatio']);
          } else {
            h = Math.round(w / Module['forcedAspectRatio']);
          }
        }
        if (((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
             document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
             document['fullScreenElement'] || document['fullscreenElement'] ||
             document['msFullScreenElement'] || document['msFullscreenElement'] ||
             document['webkitCurrentFullScreenElement']) === canvas.parentNode) && (typeof screen != 'undefined')) {
           var factor = Math.min(screen.width / w, screen.height / h);
           w = Math.round(w * factor);
           h = Math.round(h * factor);
        }
        if (Browser.resizeCanvas) {
          if (canvas.width  != w) canvas.width  = w;
          if (canvas.height != h) canvas.height = h;
          if (typeof canvas.style != 'undefined') {
            canvas.style.removeProperty( "width");
            canvas.style.removeProperty("height");
          }
        } else {
          if (canvas.width  != wNative) canvas.width  = wNative;
          if (canvas.height != hNative) canvas.height = hNative;
          if (typeof canvas.style != 'undefined') {
            if (w != wNative || h != hNative) {
              canvas.style.setProperty( "width", w + "px", "important");
              canvas.style.setProperty("height", h + "px", "important");
            } else {
              canvas.style.removeProperty( "width");
              canvas.style.removeProperty("height");
            }
          }
        }
      },wgetRequests:{},nextWgetRequestHandle:0,getNextWgetRequestHandle:function () {
        var handle = Browser.nextWgetRequestHandle;
        Browser.nextWgetRequestHandle++;
        return handle;
      }};
  
  
  function _malloc(bytes) {
      /* Over-allocate to make sure it is byte-aligned by 8.
       * This will leak memory, but this is only the dummy
       * implementation (replaced by dlmalloc normally) so
       * not an issue.
       */
      var ptr = Runtime.dynamicAlloc(bytes + 8);
      return (ptr+8) & 0xFFFFFFF8;
    }
  Module["_malloc"] = _malloc;
  
  function _free() {
  }
  Module["_free"] = _free;
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  var _environ=STATICTOP; STATICTOP += 16;;var ___environ=_environ;function ___buildEnvironment(env) {
      // WARNING: Arbitrary limit!
      var MAX_ENV_VALUES = 64;
      var TOTAL_ENV_SIZE = 1024;
  
      // Statically allocate memory for the environment.
      var poolPtr;
      var envPtr;
      if (!___buildEnvironment.called) {
        ___buildEnvironment.called = true;
        // Set default values. Use string keys for Closure Compiler compatibility.
        ENV['USER'] = ENV['LOGNAME'] = 'web_user';
        ENV['PATH'] = '/';
        ENV['PWD'] = '/';
        ENV['HOME'] = '/home/web_user';
        ENV['LANG'] = 'C';
        ENV['_'] = Module['thisProgram'];
        // Allocate memory.
        poolPtr = allocate(TOTAL_ENV_SIZE, 'i8', ALLOC_STATIC);
        envPtr = allocate(MAX_ENV_VALUES * 4,
                          'i8*', ALLOC_STATIC);
        HEAP32[((envPtr)>>2)]=poolPtr;
        HEAP32[((_environ)>>2)]=envPtr;
      } else {
        envPtr = HEAP32[((_environ)>>2)];
        poolPtr = HEAP32[((envPtr)>>2)];
      }
  
      // Collect key=value lines.
      var strings = [];
      var totalSize = 0;
      for (var key in env) {
        if (typeof env[key] === 'string') {
          var line = key + '=' + env[key];
          strings.push(line);
          totalSize += line.length;
        }
      }
      if (totalSize > TOTAL_ENV_SIZE) {
        throw new Error('Environment size exceeded TOTAL_ENV_SIZE!');
      }
  
      // Make new.
      var ptrSize = 4;
      for (var i = 0; i < strings.length; i++) {
        var line = strings[i];
        writeAsciiToMemory(line, poolPtr);
        HEAP32[(((envPtr)+(i * ptrSize))>>2)]=poolPtr;
        poolPtr += line.length + 1;
      }
      HEAP32[(((envPtr)+(strings.length * ptrSize))>>2)]=0;
    }var ENV={};function _getenv(name) {
      // char *getenv(const char *name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/getenv.html
      if (name === 0) return 0;
      name = Pointer_stringify(name);
      if (!ENV.hasOwnProperty(name)) return 0;
  
      if (_getenv.ret) _free(_getenv.ret);
      _getenv.ret = allocate(intArrayFromString(ENV[name]), 'i8', ALLOC_NORMAL);
      return _getenv.ret;
    }
  
  function _putenv(string) {
      // int putenv(char *string);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/putenv.html
      // WARNING: According to the standard (and the glibc implementation), the
      //          string is taken by reference so future changes are reflected.
      //          We copy it instead, possibly breaking some uses.
      if (string === 0) {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return -1;
      }
      string = Pointer_stringify(string);
      var splitPoint = string.indexOf('=')
      if (string === '' || string.indexOf('=') === -1) {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return -1;
      }
      var name = string.slice(0, splitPoint);
      var value = string.slice(splitPoint + 1);
      if (!(name in ENV) || ENV[name] !== value) {
        ENV[name] = value;
        ___buildEnvironment(ENV);
      }
      return 0;
    }
  
  function _SDL_RWFromConstMem(mem, size) {
      var id = SDL.rwops.length; // TODO: recycle ids when they are null
      SDL.rwops.push({ bytes: mem, count: size });
      return id;
    }function _TTF_FontHeight(font) {
      var fontData = SDL.fonts[font];
      return fontData.size;
    }function _TTF_SizeText(font, text, w, h) {
      var fontData = SDL.fonts[font];
      if (w) {
        HEAP32[((w)>>2)]=SDL.estimateTextWidth(fontData, Pointer_stringify(text));
      }
      if (h) {
        HEAP32[((h)>>2)]=fontData.size;
      }
      return 0;
    }function _TTF_RenderText_Solid(font, text, color) {
      // XXX the font and color are ignored
      text = Pointer_stringify(text) || ' '; // if given an empty string, still return a valid surface
      var fontData = SDL.fonts[font];
      var w = SDL.estimateTextWidth(fontData, text);
      var h = fontData.size;
      var color = SDL.loadColorToCSSRGB(color); // XXX alpha breaks fonts?
      var fontString = h + 'px ' + fontData.name;
      var surf = SDL.makeSurface(w, h, 0, false, 'text:' + text); // bogus numbers..
      var surfData = SDL.surfaces[surf];
      surfData.ctx.save();
      surfData.ctx.fillStyle = color;
      surfData.ctx.font = fontString;
      surfData.ctx.textBaseline = 'top';
      surfData.ctx.fillText(text, 0, 0);
      surfData.ctx.restore();
      return surf;
    }function _Mix_HaltMusic() {
      var audio = SDL.music.audio;
      if (audio) {
        audio.src = audio.src; // rewind <media> element
        audio.currentPosition = 0; // rewind Web Audio graph playback.
        audio.pause();
      }
      SDL.music.audio = null;
      if (SDL.hookMusicFinished) {
        Runtime.dynCall('v', SDL.hookMusicFinished);
      }
      return 0;
    }function _Mix_PlayMusic(id, loops) {
      // Pause old music if it exists.
      if (SDL.music.audio) {
        if (!SDL.music.audio.paused) Module.printErr('Music is already playing. ' + SDL.music.source);
        SDL.music.audio.pause();
      }
      var info = SDL.audios[id];
      var audio;
      if (info.webAudio) { // Play via Web Audio API
        // Create an instance of the WebAudio object.
        audio = {};
        audio.resource = info; // This new webAudio object is an instance that refers to this existing resource.
        audio.paused = false;
        audio.currentPosition = 0;
        audio.play = function() { SDL.playWebAudio(this); }
        audio.pause = function() { SDL.pauseWebAudio(this); }
      } else if (info.audio) { // Play via the <audio> element
        audio = info.audio;
      }
      audio['onended'] = function() { if (SDL.music.audio == this) _Mix_HaltMusic(); } // will send callback
      audio.loop = loops != 0; // TODO: handle N loops for finite N
      audio.volume = SDL.music.volume;
      SDL.music.audio = audio;
      audio.play();
      return 0;
    }function _Mix_FreeChunk(id) {
      SDL.audios[id] = null;
    }function _Mix_LoadWAV_RW(rwopsID, freesrc) {
      var rwops = SDL.rwops[rwopsID];
  
  
      if (rwops === undefined)
        return 0;
  
      var filename = '';
      var audio;
      var webAudio;
      var bytes;
  
      if (rwops.filename !== undefined) {
        filename = PATH.resolve(rwops.filename);
        var raw = Module["preloadedAudios"][filename];
        if (!raw) {
          if (raw === null) Module.printErr('Trying to reuse preloaded audio, but freePreloadedMediaOnUse is set!');
          if (!Module.noAudioDecoding) Runtime.warnOnce('Cannot find preloaded audio ' + filename);
  
          // see if we can read the file-contents from the in-memory FS
          try {
            bytes = FS.readFile(filename);
          } catch (e) {
            Module.printErr('Couldn\'t find file for: ' + filename);
            return 0;
          }
        }
        if (Module['freePreloadedMediaOnUse']) {
          Module["preloadedAudios"][filename] = null;
        }
        audio = raw;
      }
      else if (rwops.bytes !== undefined) {
        // For Web Audio context buffer decoding, we must make a clone of the audio data, but for <media> element,
        // a view to existing data is sufficient.
        if (SDL.webAudioAvailable()) bytes = HEAPU8.buffer.slice(rwops.bytes, rwops.bytes + rwops.count);
        else bytes = HEAPU8.subarray(rwops.bytes, rwops.bytes + rwops.count);
      }
      else {
        return 0;
      }
  
      var arrayBuffer = bytes ? bytes.buffer || bytes : bytes;
  
      // To allow user code to work around browser bugs with audio playback on <audio> elements an Web Audio, enable
      // the user code to hook in a callback to decide on a file basis whether each file should use Web Audio or <audio> for decoding and playback.
      // In particular, see https://bugzilla.mozilla.org/show_bug.cgi?id=654787 and ?id=1012801 for tradeoffs.
      var canPlayWithWebAudio = Module['SDL_canPlayWithWebAudio'] === undefined || Module['SDL_canPlayWithWebAudio'](filename, arrayBuffer);
  
      if (bytes !== undefined && SDL.webAudioAvailable() && canPlayWithWebAudio) {
        audio = undefined;
        webAudio = {};
        // The audio decoding process is asynchronous, which gives trouble if user code plays the audio data back immediately
        // after loading. Therefore prepare an array of callback handlers to run when this audio decoding is complete, which
        // will then start the playback (with some delay).
        webAudio.onDecodeComplete = []; // While this member array exists, decoding hasn't finished yet.
        function onDecodeComplete(data) {
          webAudio.decodedBuffer = data;
          // Call all handlers that were waiting for this decode to finish, and clear the handler list.
          webAudio.onDecodeComplete.forEach(function(e) { e(); });
          webAudio.onDecodeComplete = undefined; // Don't allow more callback handlers since audio has finished decoding.
        }
  
        SDL.audioContext['decodeAudioData'](arrayBuffer, onDecodeComplete);
      } else if (audio === undefined && bytes) {
        // Here, we didn't find a preloaded audio but we either were passed a filepath for
        // which we loaded bytes, or we were passed some bytes
        var blob = new Blob([bytes], {type: rwops.mimetype});
        var url = URL.createObjectURL(blob);
        audio = new Audio();
        audio.src = url;
        audio.mozAudioChannelType = 'content'; // bugzilla 910340
      }
  
      var id = SDL.audios.length;
      // Keep the loaded audio in the audio arrays, ready for playback
      SDL.audios.push({
        source: filename,
        audio: audio, // Points to the <audio> element, if loaded
        webAudio: webAudio // Points to a Web Audio -specific resource object, if loaded
      });
      return id;
    }function _Mix_PlayChannel(channel, id, loops) {
      // TODO: handle fixed amount of N loops. Currently loops either 0 or infinite times.
  
      // Get the audio element associated with the ID
      var info = SDL.audios[id];
      if (!info) return -1;
      if (!info.audio && !info.webAudio) return -1;
  
      // If the user asks us to allocate a channel automatically, get the first
      // free one.
      if (channel == -1) {
        for (var i = SDL.channelMinimumNumber; i < SDL.numChannels; i++) {
          if (!SDL.channels[i].audio) {
            channel = i;
            break;
          }
        }
        if (channel == -1) {
          Module.printErr('All ' + SDL.numChannels + ' channels in use!');
          return -1;
        }
      }
      var channelInfo = SDL.channels[channel];
      var audio;
      if (info.webAudio) {
        // Create an instance of the WebAudio object.
        audio = {};
        audio.resource = info; // This new object is an instance that refers to this existing resource.
        audio.paused = false;
        audio.currentPosition = 0;
        // Make our instance look similar to the instance of a <media> to make api simple.
        audio.play = function() { SDL.playWebAudio(this); }
        audio.pause = function() { SDL.pauseWebAudio(this); }
      } else {
        // We clone the audio node to utilize the preloaded audio buffer, since
        // the browser has already preloaded the audio file.
        audio = info.audio.cloneNode(true);
        audio.numChannels = info.audio.numChannels;
        audio.frequency = info.audio.frequency;
      }
      audio['onended'] = function SDL_audio_onended() { // TODO: cache these
        if (channelInfo.audio == this) { channelInfo.audio.paused = true; channelInfo.audio = null; }
        if (SDL.channelFinished) Runtime.getFuncWrapper(SDL.channelFinished, 'vi')(channel);
      }
      channelInfo.audio = audio;
      // TODO: handle N loops. Behavior matches Mix_PlayMusic
      audio.loop = loops != 0;
      audio.volume = channelInfo.volume;
      audio.play();
      return channel;
    }function _SDL_PauseAudio(pauseOn) {
      if (!SDL.audio) {
        return;
      }
      if (pauseOn) {
        if (SDL.audio.timer !== undefined) {
          clearTimeout(SDL.audio.timer);
          SDL.audio.numAudioTimersPending = 0;
          SDL.audio.timer = undefined;
        }
      } else if (!SDL.audio.timer) {
        // Start the audio playback timer callback loop.
        SDL.audio.numAudioTimersPending = 1;
        SDL.audio.timer = Browser.safeSetTimeout(SDL.audio.caller, 1);
      }
      SDL.audio.paused = pauseOn;
    }function _SDL_CloseAudio() {
      if (SDL.audio) {
        _SDL_PauseAudio(1);
        _free(SDL.audio.buffer);
        SDL.audio = null;
        SDL.allocateChannels(0);
      }
    }function _SDL_LockSurface(surf) {
      var surfData = SDL.surfaces[surf];
  
      surfData.locked++;
      if (surfData.locked > 1) return 0;
  
      if (!surfData.buffer) {
        surfData.buffer = _malloc(surfData.width * surfData.height * 4);
        HEAP32[(((surf)+(20))>>2)]=surfData.buffer;
      }
  
      // Mark in C/C++-accessible SDL structure
      // SDL_Surface has the following fields: Uint32 flags, SDL_PixelFormat *format; int w, h; Uint16 pitch; void *pixels; ...
      // So we have fields all of the same size, and 5 of them before us.
      // TODO: Use macros like in library.js
      HEAP32[(((surf)+(20))>>2)]=surfData.buffer;
  
      if (surf == SDL.screen && Module.screenIsReadOnly && surfData.image) return 0;
  
      if (SDL.defaults.discardOnLock) {
        if (!surfData.image) {
          surfData.image = surfData.ctx.createImageData(surfData.width, surfData.height);
        }
        if (!SDL.defaults.opaqueFrontBuffer) return;
      } else {
        surfData.image = surfData.ctx.getImageData(0, 0, surfData.width, surfData.height);
      }
  
      // Emulate desktop behavior and kill alpha values on the locked surface. (very costly!) Set SDL.defaults.opaqueFrontBuffer = false
      // if you don't want this.
      if (surf == SDL.screen && SDL.defaults.opaqueFrontBuffer) {
        var data = surfData.image.data;
        var num = data.length;
        for (var i = 0; i < num/4; i++) {
          data[i*4+3] = 255; // opacity, as canvases blend alpha
        }
      }
  
      if (SDL.defaults.copyOnLock && !SDL.defaults.discardOnLock) {
        // Copy pixel data to somewhere accessible to 'C/C++'
        if (surfData.isFlagSet(0x00200000 /* SDL_HWPALETTE */)) {
          // If this is neaded then
          // we should compact the data from 32bpp to 8bpp index.
          // I think best way to implement this is use
          // additional colorMap hash (color->index).
          // Something like this:
          //
          // var size = surfData.width * surfData.height;
          // var data = '';
          // for (var i = 0; i<size; i++) {
          //   var color = SDL.translateRGBAToColor(
          //     surfData.image.data[i*4   ], 
          //     surfData.image.data[i*4 +1], 
          //     surfData.image.data[i*4 +2], 
          //     255);
          //   var index = surfData.colorMap[color];
          //   HEAP8[(((surfData.buffer)+(i))>>0)]=index;
          // }
          throw 'CopyOnLock is not supported for SDL_LockSurface with SDL_HWPALETTE flag set' + new Error().stack;
        } else {
          HEAPU8.set(surfData.image.data, surfData.buffer);
        }
      }
  
      return 0;
    }
  
  function _SDL_FreeRW(rwopsID) {
      SDL.rwops[rwopsID] = null;
      while (SDL.rwops.length > 0 && SDL.rwops[SDL.rwops.length-1] === null) {
        SDL.rwops.pop();
      }
    }function _IMG_Load_RW(rwopsID, freeSrc) {
      try {
        // stb_image integration support
        function cleanup() {
          if (rwops && freeSrc) _SDL_FreeRW(rwopsID);
        };
        function addCleanup(func) {
          var old = cleanup;
          cleanup = function added_cleanup() {
            old();
            func();
          }
        }
        function callStbImage(func, params) {
          var x = Module['_malloc'](4);
          var y = Module['_malloc'](4);
          var comp = Module['_malloc'](4);
          addCleanup(function() {
            Module['_free'](x);
            Module['_free'](y);
            Module['_free'](comp);
            if (data) Module['_stbi_image_free'](data);
          });
          var data = Module['_' + func].apply(null, params.concat([x, y, comp, 0]));
          if (!data) return null;
          return {
            rawData: true,
            data: data,
            width: HEAP32[((x)>>2)],
            height: HEAP32[((y)>>2)],
            size: HEAP32[((x)>>2)] * HEAP32[((y)>>2)] * HEAP32[((comp)>>2)],
            bpp: HEAP32[((comp)>>2)]
          };
        }
  
        var rwops = SDL.rwops[rwopsID];
        if (rwops === undefined) {
          return 0;
        }
  
        var filename = rwops.filename;
        if (filename === undefined) {
          Runtime.warnOnce('Only file names that have been preloaded are supported for IMG_Load_RW. Consider using STB_IMAGE=1 if you want synchronous image decoding (see settings.js), or package files with --use-preload-plugins');
          return 0;
        }
  
        if (!raw) {
          filename = PATH.resolve(filename);
          var raw = Module["preloadedImages"][filename];
          if (!raw) {
            if (raw === null) Module.printErr('Trying to reuse preloaded image, but freePreloadedMediaOnUse is set!');
            Runtime.warnOnce('Cannot find preloaded image ' + filename);
            Runtime.warnOnce('Cannot find preloaded image ' + filename + '. Consider using STB_IMAGE=1 if you want synchronous image decoding (see settings.js), or package files with --use-preload-plugins');
            return 0;
          } else if (Module['freePreloadedMediaOnUse']) {
            Module["preloadedImages"][filename] = null;
          }
        }
  
        var surf = SDL.makeSurface(raw.width, raw.height, 0, false, 'load:' + filename);
        var surfData = SDL.surfaces[surf];
        surfData.ctx.globalCompositeOperation = "copy";
        if (!raw.rawData) {
          surfData.ctx.drawImage(raw, 0, 0, raw.width, raw.height, 0, 0, raw.width, raw.height);
        } else {
          var imageData = surfData.ctx.getImageData(0, 0, surfData.width, surfData.height);
          if (raw.bpp == 4) {
            // rgba
            imageData.data.set(HEAPU8.subarray((raw.data),(raw.data+raw.size)));
          } else if (raw.bpp == 3) {
            // rgb
            var pixels = raw.size/3;
            var data = imageData.data;
            var sourcePtr = raw.data;
            var destPtr = 0;
            for (var i = 0; i < pixels; i++) {
              data[destPtr++] = HEAPU8[((sourcePtr++)>>0)];
              data[destPtr++] = HEAPU8[((sourcePtr++)>>0)];
              data[destPtr++] = HEAPU8[((sourcePtr++)>>0)];
              data[destPtr++] = 255;
            }
          } else if (raw.bpp == 1) {
            // grayscale
            var pixels = raw.size;
            var data = imageData.data;
            var sourcePtr = raw.data;
            var destPtr = 0;
            for (var i = 0; i < pixels; i++) {
              var value = HEAPU8[((sourcePtr++)>>0)];
              data[destPtr++] = value;
              data[destPtr++] = value;
              data[destPtr++] = value;
              data[destPtr++] = 255;
            }
          } else {
            Module.printErr('cannot handle bpp ' + raw.bpp);
            return 0;
          }
          surfData.ctx.putImageData(imageData, 0, 0);
        }
        surfData.ctx.globalCompositeOperation = "source-over";
        // XXX SDL does not specify that loaded images must have available pixel data, in fact
        //     there are cases where you just want to blit them, so you just need the hardware
        //     accelerated version. However, code everywhere seems to assume that the pixels
        //     are in fact available, so we retrieve it here. This does add overhead though.
        _SDL_LockSurface(surf);
        surfData.locked--; // The surface is not actually locked in this hack
        if (SDL.GL) {
          // After getting the pixel data, we can free the canvas and context if we do not need to do 2D canvas blitting
          surfData.canvas = surfData.ctx = null;
        }
        return surf;
      } finally {
        cleanup();
      }
    }
  
  function _SDL_RWFromFile(_name, mode) {
      var id = SDL.rwops.length; // TODO: recycle ids when they are null
      var name = Pointer_stringify(_name)
      SDL.rwops.push({ filename: name, mimetype: Browser.getMimetype(name) });
      return id;
    }function _IMG_Load(filename){
      var rwops = _SDL_RWFromFile(filename);
      var result = _IMG_Load_RW(rwops, 1);
      return result;
    }function _SDL_UpperBlitScaled(src, srcrect, dst, dstrect) {
      return SDL.blitSurface(src, srcrect, dst, dstrect, true);
    }function _SDL_UpperBlit(src, srcrect, dst, dstrect) {
      return SDL.blitSurface(src, srcrect, dst, dstrect, false);
    }function _SDL_GetTicks() {
      return (Date.now() - SDL.startTime)|0;
    }var SDL={defaults:{width:320,height:200,copyOnLock:true,discardOnLock:false,opaqueFrontBuffer:true},version:null,surfaces:{},canvasPool:[],events:[],fonts:[null],audios:[null],rwops:[null],music:{audio:null,volume:1},mixerFrequency:22050,mixerFormat:32784,mixerNumChannels:2,mixerChunkSize:1024,channelMinimumNumber:0,GL:false,glAttributes:{0:3,1:3,2:2,3:0,4:0,5:1,6:16,7:0,8:0,9:0,10:0,11:0,12:0,13:0,14:0,15:1,16:0,17:0,18:0},keyboardState:null,keyboardMap:{},canRequestFullscreen:false,isRequestingFullscreen:false,textInput:false,startTime:null,initFlags:0,buttonState:0,modState:0,DOMButtons:[0,0,0],DOMEventToSDLEvent:{},TOUCH_DEFAULT_ID:0,eventHandler:null,eventHandlerContext:null,eventHandlerTemp:0,keyCodes:{16:1249,17:1248,18:1250,20:1081,33:1099,34:1102,35:1101,36:1098,37:1104,38:1106,39:1103,40:1105,44:316,45:1097,46:127,91:1251,93:1125,96:1122,97:1113,98:1114,99:1115,100:1116,101:1117,102:1118,103:1119,104:1120,105:1121,106:1109,107:1111,109:1110,110:1123,111:1108,112:1082,113:1083,114:1084,115:1085,116:1086,117:1087,118:1088,119:1089,120:1090,121:1091,122:1092,123:1093,124:1128,125:1129,126:1130,127:1131,128:1132,129:1133,130:1134,131:1135,132:1136,133:1137,134:1138,135:1139,144:1107,160:94,161:33,162:34,163:35,164:36,165:37,166:38,167:95,168:40,169:41,170:42,171:43,172:124,173:45,174:123,175:125,176:126,181:127,182:129,183:128,188:44,190:46,191:47,192:96,219:91,220:92,221:93,222:39,224:1251},scanCodes:{8:42,9:43,13:40,27:41,32:44,35:204,39:53,44:54,46:55,47:56,48:39,49:30,50:31,51:32,52:33,53:34,54:35,55:36,56:37,57:38,58:203,59:51,61:46,91:47,92:49,93:48,96:52,97:4,98:5,99:6,100:7,101:8,102:9,103:10,104:11,105:12,106:13,107:14,108:15,109:16,110:17,111:18,112:19,113:20,114:21,115:22,116:23,117:24,118:25,119:26,120:27,121:28,122:29,127:76,305:224,308:226,316:70},loadRect:function (rect) {
        return {
          x: HEAP32[((rect + 0)>>2)],
          y: HEAP32[((rect + 4)>>2)],
          w: HEAP32[((rect + 8)>>2)],
          h: HEAP32[((rect + 12)>>2)]
        };
      },updateRect:function (rect, r) {
        HEAP32[((rect)>>2)]=r.x;
        HEAP32[(((rect)+(4))>>2)]=r.y;
        HEAP32[(((rect)+(8))>>2)]=r.w;
        HEAP32[(((rect)+(12))>>2)]=r.h;
      },intersectionOfRects:function (first, second) {
        var leftX = Math.max(first.x, second.x);
        var leftY = Math.max(first.y, second.y);
        var rightX = Math.min(first.x + first.w, second.x + second.w);
        var rightY = Math.min(first.y + first.h, second.y + second.h);
  
        return {
          x: leftX,
          y: leftY,
          w: Math.max(leftX, rightX) - leftX,
          h: Math.max(leftY, rightY) - leftY
        }
      },checkPixelFormat:function (fmt) {
        // Canvas screens are always RGBA.
        var format = HEAP32[((fmt)>>2)];
        if (format != -2042224636) {
          Runtime.warnOnce('Unsupported pixel format!');
        }
      },loadColorToCSSRGB:function (color) {
        var rgba = HEAP32[((color)>>2)];
        return 'rgb(' + (rgba&255) + ',' + ((rgba >> 8)&255) + ',' + ((rgba >> 16)&255) + ')';
      },loadColorToCSSRGBA:function (color) {
        var rgba = HEAP32[((color)>>2)];
        return 'rgba(' + (rgba&255) + ',' + ((rgba >> 8)&255) + ',' + ((rgba >> 16)&255) + ',' + (((rgba >> 24)&255)/255) + ')';
      },translateColorToCSSRGBA:function (rgba) {
        return 'rgba(' + (rgba&0xff) + ',' + (rgba>>8 & 0xff) + ',' + (rgba>>16 & 0xff) + ',' + (rgba>>>24)/0xff + ')';
      },translateRGBAToCSSRGBA:function (r, g, b, a) {
        return 'rgba(' + (r&0xff) + ',' + (g&0xff) + ',' + (b&0xff) + ',' + (a&0xff)/255 + ')';
      },translateRGBAToColor:function (r, g, b, a) {
        return r | g << 8 | b << 16 | a << 24;
      },makeSurface:function (width, height, flags, usePageCanvas, source, rmask, gmask, bmask, amask) {
        flags = flags || 0;
        var is_SDL_HWSURFACE = flags & 0x00000001;
        var is_SDL_HWPALETTE = flags & 0x00200000;
        var is_SDL_OPENGL = flags & 0x04000000;
  
        var surf = _malloc(60);
        var pixelFormat = _malloc(44);
        //surface with SDL_HWPALETTE flag is 8bpp surface (1 byte)
        var bpp = is_SDL_HWPALETTE ? 1 : 4;
        var buffer = 0;
  
        // preemptively initialize this for software surfaces,
        // otherwise it will be lazily initialized inside of SDL_LockSurface
        if (!is_SDL_HWSURFACE && !is_SDL_OPENGL) {
          buffer = _malloc(width * height * 4);
        }
  
        HEAP32[((surf)>>2)]=flags;
        HEAP32[(((surf)+(4))>>2)]=pixelFormat;
        HEAP32[(((surf)+(8))>>2)]=width;
        HEAP32[(((surf)+(12))>>2)]=height;
        HEAP32[(((surf)+(16))>>2)]=width * bpp;  // assuming RGBA or indexed for now,
                                                                                          // since that is what ImageData gives us in browsers
        HEAP32[(((surf)+(20))>>2)]=buffer;
  
        HEAP32[(((surf)+(36))>>2)]=0;
        HEAP32[(((surf)+(40))>>2)]=0;
        HEAP32[(((surf)+(44))>>2)]=Module["canvas"].width;
        HEAP32[(((surf)+(48))>>2)]=Module["canvas"].height;
  
        HEAP32[(((surf)+(56))>>2)]=1;
  
        HEAP32[((pixelFormat)>>2)]=-2042224636;
        HEAP32[(((pixelFormat)+(4))>>2)]=0;// TODO
        HEAP8[(((pixelFormat)+(8))>>0)]=bpp * 8;
        HEAP8[(((pixelFormat)+(9))>>0)]=bpp;
  
        HEAP32[(((pixelFormat)+(12))>>2)]=rmask || 0x000000ff;
        HEAP32[(((pixelFormat)+(16))>>2)]=gmask || 0x0000ff00;
        HEAP32[(((pixelFormat)+(20))>>2)]=bmask || 0x00ff0000;
        HEAP32[(((pixelFormat)+(24))>>2)]=amask || 0xff000000;
  
        // Decide if we want to use WebGL or not
        SDL.GL = SDL.GL || is_SDL_OPENGL;
        var canvas;
        if (!usePageCanvas) {
          if (SDL.canvasPool.length > 0) {
            canvas = SDL.canvasPool.pop();
          } else {
            canvas = document.createElement('canvas');
          }
          canvas.width = width;
          canvas.height = height;
        } else {
          canvas = Module['canvas'];
        }
  
        var webGLContextAttributes = {
          antialias: ((SDL.glAttributes[13 /*SDL_GL_MULTISAMPLEBUFFERS*/] != 0) && (SDL.glAttributes[14 /*SDL_GL_MULTISAMPLESAMPLES*/] > 1)),
          depth: (SDL.glAttributes[6 /*SDL_GL_DEPTH_SIZE*/] > 0),
          stencil: (SDL.glAttributes[7 /*SDL_GL_STENCIL_SIZE*/] > 0),
          alpha: (SDL.glAttributes[3 /*SDL_GL_ALPHA_SIZE*/] > 0)
        };
        
        var ctx = Browser.createContext(canvas, is_SDL_OPENGL, usePageCanvas, webGLContextAttributes);
              
        SDL.surfaces[surf] = {
          width: width,
          height: height,
          canvas: canvas,
          ctx: ctx,
          surf: surf,
          buffer: buffer,
          pixelFormat: pixelFormat,
          alpha: 255,
          flags: flags,
          locked: 0,
          usePageCanvas: usePageCanvas,
          source: source,
  
          isFlagSet: function(flag) {
            return flags & flag;
          }
        };
  
        return surf;
      },copyIndexedColorData:function (surfData, rX, rY, rW, rH) {
        // HWPALETTE works with palette
        // setted by SDL_SetColors
        if (!surfData.colors) {
          return;
        }
        
        var fullWidth  = Module['canvas'].width;
        var fullHeight = Module['canvas'].height;
  
        var startX  = rX || 0;
        var startY  = rY || 0;
        var endX    = (rW || (fullWidth - startX)) + startX;
        var endY    = (rH || (fullHeight - startY)) + startY;
        
        var buffer  = surfData.buffer;
  
        if (!surfData.image.data32) {
          surfData.image.data32 = new Uint32Array(surfData.image.data.buffer);
        }
        var data32   = surfData.image.data32;
  
        var colors32 = surfData.colors32;
  
        for (var y = startY; y < endY; ++y) {
          var base = y * fullWidth;
          for (var x = startX; x < endX; ++x) {
            data32[base + x] = colors32[HEAPU8[((buffer + base + x)>>0)]];
          }
        }
      },freeSurface:function (surf) {
        var refcountPointer = surf + 56;
        var refcount = HEAP32[((refcountPointer)>>2)];
        if (refcount > 1) {
          HEAP32[((refcountPointer)>>2)]=refcount - 1;
          return;
        }
  
        var info = SDL.surfaces[surf];
        if (!info.usePageCanvas && info.canvas) SDL.canvasPool.push(info.canvas);
        if (info.buffer) _free(info.buffer);
        _free(info.pixelFormat);
        _free(surf);
        SDL.surfaces[surf] = null;
  
        if (surf === SDL.screen) {
          SDL.screen = null;
        }
      },blitSurface__deps:["SDL_LockSurface"],blitSurface:function (src, srcrect, dst, dstrect, scale) {
        var srcData = SDL.surfaces[src];
        var dstData = SDL.surfaces[dst];
        var sr, dr;
        if (srcrect) {
          sr = SDL.loadRect(srcrect);
        } else {
          sr = { x: 0, y: 0, w: srcData.width, h: srcData.height };
        }
        if (dstrect) {
          dr = SDL.loadRect(dstrect);
        } else {
          dr = { x: 0, y: 0, w: srcData.width, h: srcData.height };
        }
        if (dstData.clipRect) {
          var widthScale = (!scale || sr.w === 0) ? 1 : sr.w / dr.w;
          var heightScale = (!scale || sr.h === 0) ? 1 : sr.h / dr.h;
          
          dr = SDL.intersectionOfRects(dstData.clipRect, dr);
          
          sr.w = dr.w * widthScale;
          sr.h = dr.h * heightScale;
          
          if (dstrect) {
            SDL.updateRect(dstrect, dr);
          }
        }
        var blitw, blith;
        if (scale) {
          blitw = dr.w; blith = dr.h;
        } else {
          blitw = sr.w; blith = sr.h;
        }
        if (sr.w === 0 || sr.h === 0 || blitw === 0 || blith === 0) {
          return 0;
        }
        var oldAlpha = dstData.ctx.globalAlpha;
        dstData.ctx.globalAlpha = srcData.alpha/255;
        dstData.ctx.drawImage(srcData.canvas, sr.x, sr.y, sr.w, sr.h, dr.x, dr.y, blitw, blith);
        dstData.ctx.globalAlpha = oldAlpha;
        if (dst != SDL.screen) {
          // XXX As in IMG_Load, for compatibility we write out |pixels|
          Runtime.warnOnce('WARNING: copying canvas data to memory for compatibility');
          _SDL_LockSurface(dst);
          dstData.locked--; // The surface is not actually locked in this hack
        }
        return 0;
      },downFingers:{},savedKeydown:null,receiveEvent:function (event) {
        function unpressAllPressedKeys() {
          // Un-press all pressed keys: TODO
          for (var code in SDL.keyboardMap) {
            SDL.events.push({
              type: 'keyup',
              keyCode: SDL.keyboardMap[code]
            });
          }
        };
        switch(event.type) {
          case 'touchstart': case 'touchmove': {
            event.preventDefault();
  
            var touches = [];
            
            // Clear out any touchstart events that we've already processed
            if (event.type === 'touchstart') {
              for (var i = 0; i < event.touches.length; i++) {
                var touch = event.touches[i];
                if (SDL.downFingers[touch.identifier] != true) {
                  SDL.downFingers[touch.identifier] = true;
                  touches.push(touch);
                }
              }
            } else {
              touches = event.touches;
            }
            
            var firstTouch = touches[0];
            if (event.type == 'touchstart') {
              SDL.DOMButtons[0] = 1;
            }
            var mouseEventType;
            switch(event.type) {
              case 'touchstart': mouseEventType = 'mousedown'; break;
              case 'touchmove': mouseEventType = 'mousemove'; break;
            }
            var mouseEvent = {
              type: mouseEventType,
              button: 0,
              pageX: firstTouch.clientX,
              pageY: firstTouch.clientY
            };
            SDL.events.push(mouseEvent);
  
            for (var i = 0; i < touches.length; i++) {
              var touch = touches[i];
              SDL.events.push({
                type: event.type,
                touch: touch
              });
            };
            break;
          }
          case 'touchend': {
            event.preventDefault();
            
            // Remove the entry in the SDL.downFingers hash
            // because the finger is no longer down.
            for(var i = 0; i < event.changedTouches.length; i++) {
              var touch = event.changedTouches[i];
              if (SDL.downFingers[touch.identifier] === true) {
                delete SDL.downFingers[touch.identifier];
              }
            }
  
            var mouseEvent = {
              type: 'mouseup',
              button: 0,
              pageX: event.changedTouches[0].clientX,
              pageY: event.changedTouches[0].clientY
            };
            SDL.DOMButtons[0] = 0;
            SDL.events.push(mouseEvent);
            
            for (var i = 0; i < event.changedTouches.length; i++) {
              var touch = event.changedTouches[i];
              SDL.events.push({
                type: 'touchend',
                touch: touch
              });
            };
            break;
          }
          case 'DOMMouseScroll': case 'mousewheel': case 'wheel':
            var delta = -Browser.getMouseWheelDelta(event); // Flip the wheel direction to translate from browser wheel direction (+:down) to SDL direction (+:up)
            delta = (delta == 0) ? 0 : (delta > 0 ? Math.max(delta, 1) : Math.min(delta, -1)); // Quantize to integer so that minimum scroll is at least +/- 1.
  
            // Simulate old-style SDL events representing mouse wheel input as buttons
            var button = delta > 0 ? 3 /*SDL_BUTTON_WHEELUP-1*/ : 4 /*SDL_BUTTON_WHEELDOWN-1*/; // Subtract one since JS->C marshalling is defined to add one back.
            SDL.events.push({ type: 'mousedown', button: button, pageX: event.pageX, pageY: event.pageY });
            SDL.events.push({ type: 'mouseup', button: button, pageX: event.pageX, pageY: event.pageY });
  
            // Pass a delta motion event.
            SDL.events.push({ type: 'wheel', deltaX: 0, deltaY: delta });
            event.preventDefault(); // If we don't prevent this, then 'wheel' event will be sent again by the browser as 'DOMMouseScroll' and we will receive this same event the second time.
            break;
          case 'mousemove':
            if (SDL.DOMButtons[0] === 1) {
              SDL.events.push({
                type: 'touchmove',
                touch: {
                  identifier: 0,
                  deviceID: -1,
                  pageX: event.pageX,
                  pageY: event.pageY
                }
              });
            }
            if (Browser.pointerLock) {
              // workaround for firefox bug 750111
              if ('mozMovementX' in event) {
                event['movementX'] = event['mozMovementX'];
                event['movementY'] = event['mozMovementY'];
              }
              // workaround for Firefox bug 782777
              if (event['movementX'] == 0 && event['movementY'] == 0) {
                // ignore a mousemove event if it doesn't contain any movement info
                // (without pointer lock, we infer movement from pageX/pageY, so this check is unnecessary)
                event.preventDefault();
                return;
              }
            }
            // fall through
          case 'keydown': case 'keyup': case 'keypress': case 'mousedown': case 'mouseup':
            // If we preventDefault on keydown events, the subsequent keypress events
            // won't fire. However, it's fine (and in some cases necessary) to
            // preventDefault for keys that don't generate a character. Otherwise,
            // preventDefault is the right thing to do in general.
            if (event.type !== 'keydown' || (!SDL.unicode && !SDL.textInput) || (event.keyCode === 8 /* backspace */ || event.keyCode === 9 /* tab */)) {
              event.preventDefault();
            }
  
            if (event.type == 'mousedown') {
              SDL.DOMButtons[event.button] = 1;
              SDL.events.push({
                type: 'touchstart',
                touch: {
                  identifier: 0,
                  deviceID: -1,
                  pageX: event.pageX,
                  pageY: event.pageY
                }
              });
            } else if (event.type == 'mouseup') {
              // ignore extra ups, can happen if we leave the canvas while pressing down, then return,
              // since we add a mouseup in that case
              if (!SDL.DOMButtons[event.button]) {
                return;
              }
  
              SDL.events.push({
                type: 'touchend',
                touch: {
                  identifier: 0,
                  deviceID: -1,
                  pageX: event.pageX,
                  pageY: event.pageY
                }
              });
              SDL.DOMButtons[event.button] = 0;
            }
  
            // We can only request fullscreen as the result of user input.
            // Due to this limitation, we toggle a boolean on keydown which
            // SDL_WM_ToggleFullScreen will check and subsequently set another
            // flag indicating for us to request fullscreen on the following
            // keyup. This isn't perfect, but it enables SDL_WM_ToggleFullScreen
            // to work as the result of a keypress (which is an extremely
            // common use case).
            if (event.type === 'keydown' || event.type === 'mousedown') {
              SDL.canRequestFullscreen = true;
            } else if (event.type === 'keyup' || event.type === 'mouseup') {
              if (SDL.isRequestingFullscreen) {
                Module['requestFullScreen'](true, true);
                SDL.isRequestingFullscreen = false;
              }
              SDL.canRequestFullscreen = false;
            }
  
            // SDL expects a unicode character to be passed to its keydown events.
            // Unfortunately, the browser APIs only provide a charCode property on
            // keypress events, so we must backfill in keydown events with their
            // subsequent keypress event's charCode.
            if (event.type === 'keypress' && SDL.savedKeydown) {
              // charCode is read-only
              SDL.savedKeydown.keypressCharCode = event.charCode;
              SDL.savedKeydown = null;
            } else if (event.type === 'keydown') {
              SDL.savedKeydown = event;
            }
  
            // Don't push keypress events unless SDL_StartTextInput has been called.
            if (event.type !== 'keypress' || SDL.textInput) {
              SDL.events.push(event);
            }
            break;
          case 'mouseout':
            // Un-press all pressed mouse buttons, because we might miss the release outside of the canvas
            for (var i = 0; i < 3; i++) {
              if (SDL.DOMButtons[i]) {
                SDL.events.push({
                  type: 'mouseup',
                  button: i,
                  pageX: event.pageX,
                  pageY: event.pageY
                });
                SDL.DOMButtons[i] = 0;
              }
            }
            event.preventDefault();
            break;
          case 'focus':
            SDL.events.push(event);
            event.preventDefault();
            break;
          case 'blur':
            SDL.events.push(event);
            unpressAllPressedKeys();
            event.preventDefault();
            break;
          case 'visibilitychange':
            SDL.events.push({
              type: 'visibilitychange',
              visible: !document.hidden
            });
            unpressAllPressedKeys();
            event.preventDefault();
            break;
          case 'unload':
            if (Browser.mainLoop.runner) {
              SDL.events.push(event);
              // Force-run a main event loop, since otherwise this event will never be caught!
              Browser.mainLoop.runner();
            }
            return;
          case 'resize':
            SDL.events.push(event);
            // manually triggered resize event doesn't have a preventDefault member
            if (event.preventDefault) {
              event.preventDefault();
            }
            break;
        }
        if (SDL.events.length >= 10000) {
          Module.printErr('SDL event queue full, dropping events');
          SDL.events = SDL.events.slice(0, 10000);
        }
        // If we have a handler installed, this will push the events to the app
        // instead of the app polling for them.
        SDL.flushEventsToHandler();
        return;
      },lookupKeyCodeForEvent:function (event) {
          var code = event.keyCode;
          if (code >= 65 && code <= 90) {
            code += 32; // make lowercase for SDL
          } else {
            code = SDL.keyCodes[event.keyCode] || event.keyCode;
            // If this is one of the modifier keys (224 | 1<<10 - 227 | 1<<10), and the event specifies that it is
            // a right key, add 4 to get the right key SDL key code.
            if (event.location === KeyboardEvent.DOM_KEY_LOCATION_RIGHT && code >= (224 | 1<<10) && code <= (227 | 1<<10)) {
              code += 4;
            }
          }
          return code;
      },handleEvent:function (event) {
        if (event.handled) return;
        event.handled = true;
  
        switch (event.type) {
          case 'touchstart': case 'touchend': case 'touchmove': {
            Browser.calculateMouseEvent(event);
            break;
          }
          case 'keydown': case 'keyup': {
            var down = event.type === 'keydown';
            var code = SDL.lookupKeyCodeForEvent(event);
            HEAP8[(((SDL.keyboardState)+(code))>>0)]=down;
            // TODO: lmeta, rmeta, numlock, capslock, KMOD_MODE, KMOD_RESERVED
            SDL.modState = (HEAP8[(((SDL.keyboardState)+(1248))>>0)] ? 0x0040 : 0) | // KMOD_LCTRL
              (HEAP8[(((SDL.keyboardState)+(1249))>>0)] ? 0x0001 : 0) | // KMOD_LSHIFT
              (HEAP8[(((SDL.keyboardState)+(1250))>>0)] ? 0x0100 : 0) | // KMOD_LALT
              (HEAP8[(((SDL.keyboardState)+(1252))>>0)] ? 0x0080 : 0) | // KMOD_RCTRL
              (HEAP8[(((SDL.keyboardState)+(1253))>>0)] ? 0x0002 : 0) | // KMOD_RSHIFT
              (HEAP8[(((SDL.keyboardState)+(1254))>>0)] ? 0x0200 : 0); //  KMOD_RALT
            if (down) {
              SDL.keyboardMap[code] = event.keyCode; // save the DOM input, which we can use to unpress it during blur
            } else {
              delete SDL.keyboardMap[code];
            }
  
            break;
          }
          case 'mousedown': case 'mouseup':
            if (event.type == 'mousedown') {
              // SDL_BUTTON(x) is defined as (1 << ((x)-1)).  SDL buttons are 1-3,
              // and DOM buttons are 0-2, so this means that the below formula is
              // correct.
              SDL.buttonState |= 1 << event.button;
            } else if (event.type == 'mouseup') {
              SDL.buttonState &= ~(1 << event.button);
            }
            // fall through
          case 'mousemove': {
            Browser.calculateMouseEvent(event);
            break;
          }
        }
      },flushEventsToHandler:function () {
        if (!SDL.eventHandler) return;
  
        while (SDL.pollEvent(SDL.eventHandlerTemp)) {
          Runtime.dynCall('iii', SDL.eventHandler, [SDL.eventHandlerContext, SDL.eventHandlerTemp]);
        }
      },pollEvent:function (ptr) {
        if (SDL.initFlags & 0x200 && SDL.joystickEventState) {
          // If SDL_INIT_JOYSTICK was supplied AND the joystick system is configured
          // to automatically query for events, query for joystick events.
          SDL.queryJoysticks();
        }
        if (ptr) {
          while (SDL.events.length > 0) {
            if (SDL.makeCEvent(SDL.events.shift(), ptr) !== false) return 1;
          }
          return 0;
        } else {
          // XXX: somewhat risky in that we do not check if the event is real or not (makeCEvent returns false) if no pointer supplied
          return SDL.events.length > 0;
        }
      },makeCEvent:function (event, ptr) {
        if (typeof event === 'number') {
          // This is a pointer to a copy of a native C event that was SDL_PushEvent'ed
          _memcpy(ptr, event, 28);
          _free(event); // the copy is no longer needed
          return;
        }
  
        SDL.handleEvent(event);
  
        switch (event.type) {
          case 'keydown': case 'keyup': {
            var down = event.type === 'keydown';
            //Module.print('Received key event: ' + event.keyCode);
            var key = SDL.lookupKeyCodeForEvent(event);
            var scan;
            if (key >= 1024) {
              scan = key - 1024;
            } else {
              scan = SDL.scanCodes[key] || key;
            }
  
            HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
            HEAP8[(((ptr)+(8))>>0)]=down ? 1 : 0;
            HEAP8[(((ptr)+(9))>>0)]=0; // TODO
            HEAP32[(((ptr)+(12))>>2)]=scan;
            HEAP32[(((ptr)+(16))>>2)]=key;
            HEAP16[(((ptr)+(20))>>1)]=SDL.modState;
            // some non-character keys (e.g. backspace and tab) won't have keypressCharCode set, fill in with the keyCode.
            HEAP32[(((ptr)+(24))>>2)]=event.keypressCharCode || key;
  
            break;
          }
          case 'keypress': {
            HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
            // Not filling in windowID for now
            var cStr = intArrayFromString(String.fromCharCode(event.charCode));
            for (var i = 0; i < cStr.length; ++i) {
              HEAP8[(((ptr)+(8 + i))>>0)]=cStr[i];
            }
            break;
          }
          case 'mousedown': case 'mouseup': case 'mousemove': {
            if (event.type != 'mousemove') {
              var down = event.type === 'mousedown';
              HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
              HEAP32[(((ptr)+(4))>>2)]=0;
              HEAP32[(((ptr)+(8))>>2)]=0;
              HEAP32[(((ptr)+(12))>>2)]=0;
              HEAP8[(((ptr)+(16))>>0)]=event.button+1; // DOM buttons are 0-2, SDL 1-3
              HEAP8[(((ptr)+(17))>>0)]=down ? 1 : 0;
              HEAP32[(((ptr)+(20))>>2)]=Browser.mouseX;
              HEAP32[(((ptr)+(24))>>2)]=Browser.mouseY;
            } else {
              HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
              HEAP32[(((ptr)+(4))>>2)]=0;
              HEAP32[(((ptr)+(8))>>2)]=0;
              HEAP32[(((ptr)+(12))>>2)]=0;
              HEAP32[(((ptr)+(16))>>2)]=SDL.buttonState;
              HEAP32[(((ptr)+(20))>>2)]=Browser.mouseX;
              HEAP32[(((ptr)+(24))>>2)]=Browser.mouseY;
              HEAP32[(((ptr)+(28))>>2)]=Browser.mouseMovementX;
              HEAP32[(((ptr)+(32))>>2)]=Browser.mouseMovementY;
            }
            break;
          }
          case 'wheel': {
            HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
            HEAP32[(((ptr)+(16))>>2)]=event.deltaX;
            HEAP32[(((ptr)+(20))>>2)]=event.deltaY; 
            break;       
          }
          case 'touchstart': case 'touchend': case 'touchmove': {
            var touch = event.touch;
            if (!Browser.touches[touch.identifier]) break;
            var w = Module['canvas'].width;
            var h = Module['canvas'].height;
            var x = Browser.touches[touch.identifier].x / w;
            var y = Browser.touches[touch.identifier].y / h;
            var lx = Browser.lastTouches[touch.identifier].x / w;
            var ly = Browser.lastTouches[touch.identifier].y / h;
            var dx = x - lx;
            var dy = y - ly;
            if (touch['deviceID'] === undefined) touch.deviceID = SDL.TOUCH_DEFAULT_ID;
            if (dx === 0 && dy === 0 && event.type === 'touchmove') return false; // don't send these if nothing happened
            HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
            HEAP32[(((ptr)+(4))>>2)]=_SDL_GetTicks();
            (tempI64 = [touch.deviceID>>>0,(tempDouble=touch.deviceID,(+(Math_abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math_min((+(Math_floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[(((ptr)+(8))>>2)]=tempI64[0],HEAP32[(((ptr)+(12))>>2)]=tempI64[1]);
            (tempI64 = [touch.identifier>>>0,(tempDouble=touch.identifier,(+(Math_abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math_min((+(Math_floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[(((ptr)+(16))>>2)]=tempI64[0],HEAP32[(((ptr)+(20))>>2)]=tempI64[1]);
            HEAPF32[(((ptr)+(24))>>2)]=x;
            HEAPF32[(((ptr)+(28))>>2)]=y;
            HEAPF32[(((ptr)+(32))>>2)]=dx;
            HEAPF32[(((ptr)+(36))>>2)]=dy;
            if (touch.force !== undefined) {
              HEAPF32[(((ptr)+(40))>>2)]=touch.force;
            } else { // No pressure data, send a digital 0/1 pressure.
              HEAPF32[(((ptr)+(40))>>2)]=event.type == "touchend" ? 0 : 1;
            }
            break;
          }
          case 'unload': {
            HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
            break;
          }
          case 'resize': {
            HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
            HEAP32[(((ptr)+(4))>>2)]=event.w;
            HEAP32[(((ptr)+(8))>>2)]=event.h;
            break;
          }
          case 'joystick_button_up': case 'joystick_button_down': {
            var state = event.type === 'joystick_button_up' ? 0 : 1;
            HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
            HEAP8[(((ptr)+(4))>>0)]=event.index;
            HEAP8[(((ptr)+(5))>>0)]=event.button;
            HEAP8[(((ptr)+(6))>>0)]=state;
            break;
          }
          case 'joystick_axis_motion': {
            HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
            HEAP8[(((ptr)+(4))>>0)]=event.index;
            HEAP8[(((ptr)+(5))>>0)]=event.axis;
            HEAP32[(((ptr)+(8))>>2)]=SDL.joystickAxisValueConversion(event.value);
            break;
          }
          case 'focus': {
            var SDL_WINDOWEVENT_FOCUS_GAINED = 12 /* SDL_WINDOWEVENT_FOCUS_GAINED */;
            HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
            HEAP32[(((ptr)+(4))>>2)]=0;
            HEAP8[(((ptr)+(8))>>0)]=SDL_WINDOWEVENT_FOCUS_GAINED;
            break;
          }
          case 'blur': {
            var SDL_WINDOWEVENT_FOCUS_LOST = 13 /* SDL_WINDOWEVENT_FOCUS_LOST */;
            HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
            HEAP32[(((ptr)+(4))>>2)]=0;
            HEAP8[(((ptr)+(8))>>0)]=SDL_WINDOWEVENT_FOCUS_LOST;
            break;
          }
          case 'visibilitychange': {
            var SDL_WINDOWEVENT_SHOWN  = 1 /* SDL_WINDOWEVENT_SHOWN */;
            var SDL_WINDOWEVENT_HIDDEN = 2 /* SDL_WINDOWEVENT_HIDDEN */;
            var visibilityEventID = event.visible ? SDL_WINDOWEVENT_SHOWN : SDL_WINDOWEVENT_HIDDEN;
            HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
            HEAP32[(((ptr)+(4))>>2)]=0;
            HEAP8[(((ptr)+(8))>>0)]=visibilityEventID;
            break;
          }
          default: throw 'Unhandled SDL event: ' + event.type;
        }
      },estimateTextWidth:function (fontData, text) {
        var h = fontData.size;
        var fontString = h + 'px ' + fontData.name;
        var tempCtx = SDL.ttfContext;
        assert(tempCtx, 'TTF_Init must have been called');
        tempCtx.save();
        tempCtx.font = fontString;
        var ret = tempCtx.measureText(text).width | 0;
        tempCtx.restore();
        return ret;
      },allocateChannels:function (num) { // called from Mix_AllocateChannels and init
        if (SDL.numChannels && SDL.numChannels >= num && num != 0) return;
        SDL.numChannels = num;
        SDL.channels = [];
        for (var i = 0; i < num; i++) {
          SDL.channels[i] = {
            audio: null,
            volume: 1.0
          };
        }
      },setGetVolume:function (info, volume) {
        if (!info) return 0;
        var ret = info.volume * 128; // MIX_MAX_VOLUME
        if (volume != -1) {
          info.volume = Math.min(Math.max(volume, 0), 128) / 128;
          if (info.audio) {
            try {
              info.audio.volume = info.volume; // For <audio> element
              if (info.audio.webAudioGainNode) info.audio.webAudioGainNode['gain']['value'] = info.volume; // For WebAudio playback
            } catch(e) {
              Module.printErr('setGetVolume failed to set audio volume: ' + e);
            }
          }
        }
        return ret;
      },setPannerPosition:function (info, x, y, z) {
        if (!info) return;
        if (info.audio) {
          if (info.audio.webAudioPannerNode) {
            info.audio.webAudioPannerNode['setPosition'](x, y, z);
          }
        }
      },playWebAudio:function (audio) {
        if (!audio) return;
        if (audio.webAudioNode) return; // This instance is already playing, don't start again.
        if (!SDL.webAudioAvailable()) return;
        try {
          var webAudio = audio.resource.webAudio;
          audio.paused = false;
          if (!webAudio.decodedBuffer) {
            if (webAudio.onDecodeComplete === undefined) abort("Cannot play back audio object that was not loaded");
            webAudio.onDecodeComplete.push(function() { if (!audio.paused) SDL.playWebAudio(audio); });
            return;
          }
          audio.webAudioNode = SDL.audioContext['createBufferSource']();
          audio.webAudioNode['buffer'] = webAudio.decodedBuffer;
          audio.webAudioNode['loop'] = audio.loop;
          audio.webAudioNode['onended'] = function() { audio['onended'](); } // For <media> element compatibility, route the onended signal to the instance.
  
          audio.webAudioPannerNode = SDL.audioContext['createPanner']();
          audio.webAudioPannerNode['panningModel'] = 'equalpower';
  
          // Add an intermediate gain node to control volume.
          audio.webAudioGainNode = SDL.audioContext['createGain']();
          audio.webAudioGainNode['gain']['value'] = audio.volume;
  
          audio.webAudioNode['connect'](audio.webAudioPannerNode);
          audio.webAudioPannerNode['connect'](audio.webAudioGainNode);
          audio.webAudioGainNode['connect'](SDL.audioContext['destination']);
  
          audio.webAudioNode['start'](0, audio.currentPosition);
          audio.startTime = SDL.audioContext['currentTime'] - audio.currentPosition;
        } catch(e) {
          Module.printErr('playWebAudio failed: ' + e);
        }
      },pauseWebAudio:function (audio) {
        if (!audio) return;
        if (audio.webAudioNode) {
          try {
            // Remember where we left off, so that if/when we resume, we can restart the playback at a proper place.
            audio.currentPosition = (SDL.audioContext['currentTime'] - audio.startTime) % audio.resource.webAudio.decodedBuffer.duration;
            // Important: When we reach here, the audio playback is stopped by the user. But when calling .stop() below, the Web Audio
            // graph will send the onended signal, but we don't want to process that, since pausing should not clear/destroy the audio
            // channel.
            audio.webAudioNode['onended'] = undefined;
            audio.webAudioNode.stop(0); // 0 is a default parameter, but WebKit is confused by it #3861
            audio.webAudioNode = undefined;
          } catch(e) {
            Module.printErr('pauseWebAudio failed: ' + e);
          }
        }
        audio.paused = true;
      },openAudioContext:function () {
        // Initialize Web Audio API if we haven't done so yet. Note: Only initialize Web Audio context ever once on the web page,
        // since initializing multiple times fails on Chrome saying 'audio resources have been exhausted'.
        if (!SDL.audioContext) {
          if (typeof(AudioContext) !== 'undefined') SDL.audioContext = new AudioContext();
          else if (typeof(webkitAudioContext) !== 'undefined') SDL.audioContext = new webkitAudioContext();
        }
      },webAudioAvailable:function () { return !!SDL.audioContext; },fillWebAudioBufferFromHeap:function (heapPtr, sizeSamplesPerChannel, dstAudioBuffer) {
        // The input audio data is interleaved across the channels, i.e. [L, R, L, R, L, R, ...] and is either 8-bit or 16-bit as
        // supported by the SDL API. The output audio wave data for Web Audio API must be in planar buffers of [-1,1]-normalized Float32 data,
        // so perform a buffer conversion for the data.
        var numChannels = SDL.audio.channels;
        for(var c = 0; c < numChannels; ++c) {
          var channelData = dstAudioBuffer['getChannelData'](c);
          if (channelData.length != sizeSamplesPerChannel) {
            throw 'Web Audio output buffer length mismatch! Destination size: ' + channelData.length + ' samples vs expected ' + sizeSamplesPerChannel + ' samples!';
          }
          if (SDL.audio.format == 0x8010 /*AUDIO_S16LSB*/) {
            for(var j = 0; j < sizeSamplesPerChannel; ++j) {
              channelData[j] = (HEAP16[(((heapPtr)+((j*numChannels + c)*2))>>1)]) / 0x8000;
            }
          } else if (SDL.audio.format == 0x0008 /*AUDIO_U8*/) {
            for(var j = 0; j < sizeSamplesPerChannel; ++j) {
              var v = (HEAP8[(((heapPtr)+(j*numChannels + c))>>0)]);
              channelData[j] = ((v >= 0) ? v-128 : v+128) /128;
            }
          }
        }
      },debugSurface:function (surfData) {
        console.log('dumping surface ' + [surfData.surf, surfData.source, surfData.width, surfData.height]);
        var image = surfData.ctx.getImageData(0, 0, surfData.width, surfData.height);
        var data = image.data;
        var num = Math.min(surfData.width, surfData.height);
        for (var i = 0; i < num; i++) {
          console.log('   diagonal ' + i + ':' + [data[i*surfData.width*4 + i*4 + 0], data[i*surfData.width*4 + i*4 + 1], data[i*surfData.width*4 + i*4 + 2], data[i*surfData.width*4 + i*4 + 3]]);
        }
      },joystickEventState:1,lastJoystickState:{},joystickNamePool:{},recordJoystickState:function (joystick, state) {
        // Standardize button state.
        var buttons = new Array(state.buttons.length);
        for (var i = 0; i < state.buttons.length; i++) {
          buttons[i] = SDL.getJoystickButtonState(state.buttons[i]);
        }
  
        SDL.lastJoystickState[joystick] = {
          buttons: buttons,
          axes: state.axes.slice(0),
          timestamp: state.timestamp,
          index: state.index,
          id: state.id
        };
      },getJoystickButtonState:function (button) {
        if (typeof button === 'object') {
          // Current gamepad API editor's draft (Firefox Nightly)
          // https://dvcs.w3.org/hg/gamepad/raw-file/default/gamepad.html#idl-def-GamepadButton
          return button.pressed;
        } else {
          // Current gamepad API working draft (Firefox / Chrome Stable)
          // http://www.w3.org/TR/2012/WD-gamepad-20120529/#gamepad-interface
          return button > 0;
        }
      },queryJoysticks:function () {
        for (var joystick in SDL.lastJoystickState) {
          var state = SDL.getGamepad(joystick - 1);
          var prevState = SDL.lastJoystickState[joystick];
          // Check only if the timestamp has differed.
          // NOTE: Timestamp is not available in Firefox.
          if (typeof state.timestamp !== 'number' || state.timestamp !== prevState.timestamp) {
            var i;
            for (i = 0; i < state.buttons.length; i++) {
              var buttonState = SDL.getJoystickButtonState(state.buttons[i]);
              // NOTE: The previous state already has a boolean representation of
              //       its button, so no need to standardize its button state here.
              if (buttonState !== prevState.buttons[i]) {
                // Insert button-press event.
                SDL.events.push({
                  type: buttonState ? 'joystick_button_down' : 'joystick_button_up',
                  joystick: joystick,
                  index: joystick - 1,
                  button: i
                });
              }
            }
            for (i = 0; i < state.axes.length; i++) {
              if (state.axes[i] !== prevState.axes[i]) {
                // Insert axes-change event.
                SDL.events.push({
                  type: 'joystick_axis_motion',
                  joystick: joystick,
                  index: joystick - 1,
                  axis: i,
                  value: state.axes[i]
                });
              }
            }
  
            SDL.recordJoystickState(joystick, state);
          }
        }
      },joystickAxisValueConversion:function (value) {
        // Make sure value is properly clamped
        value = Math.min(1, Math.max(value, -1));
        // Ensures that 0 is 0, 1 is 32767, and -1 is 32768.
        return Math.ceil(((value+1) * 32767.5) - 32768);
      },getGamepads:function () {
        var fcn = navigator.getGamepads || navigator.webkitGamepads || navigator.mozGamepads || navigator.gamepads || navigator.webkitGetGamepads;
        if (fcn !== undefined) {
          // The function must be applied on the navigator object.
          return fcn.apply(navigator);
        } else {
          return [];
        }
      },getGamepad:function (deviceIndex) {
        var gamepads = SDL.getGamepads();
        if (gamepads.length > deviceIndex && deviceIndex >= 0) {
          return gamepads[deviceIndex];
        }
        return null;
      }};function _SDL_SetVideoMode(width, height, depth, flags) {
      ['touchstart', 'touchend', 'touchmove', 'mousedown', 'mouseup', 'mousemove', 'DOMMouseScroll', 'mousewheel', 'wheel', 'mouseout'].forEach(function(event) {
        Module['canvas'].addEventListener(event, SDL.receiveEvent, true);
      });
  
      var canvas = Module['canvas'];
  
      // (0,0) means 'use fullscreen' in native; in Emscripten, use the current canvas size.
      if (width == 0 && height == 0) {
        width = canvas.width;
        height = canvas.height;
      }
  
      if (!SDL.addedResizeListener) {
        SDL.addedResizeListener = true;
        Browser.resizeListeners.push(function(w, h) {
          if (!SDL.settingVideoMode) {
            SDL.receiveEvent({
              type: 'resize',
              w: w,
              h: h
            });
          }
        });
      }
  
      if (width !== canvas.width || height !== canvas.height) {
        SDL.settingVideoMode = true; // SetVideoMode itself should not trigger resize events
        Browser.setCanvasSize(width, height);
        SDL.settingVideoMode = false;
      }
  
      // Free the old surface first if there is one
      if (SDL.screen) {
        SDL.freeSurface(SDL.screen);
        assert(!SDL.screen);
      }
  
      if (SDL.GL) flags = flags | 0x04000000; // SDL_OPENGL - if we are using GL, then later calls to SetVideoMode may not mention GL, but we do need it. Once in GL mode, we never leave it.
  
      SDL.screen = SDL.makeSurface(width, height, flags, true, 'screen');
  
      return SDL.screen;
    }

  function _glDrawArrays(mode, first, count) {
  
      GLctx.drawArrays(mode, first, count);
  
    }

  function _SDL_GL_SetAttribute(attr, value) {
      if (!(attr in SDL.glAttributes)) {
        abort('Unknown SDL GL attribute (' + attr + '). Please check if your SDL version is supported.');
      }
  
      SDL.glAttributes[attr] = value;
    }

  function _SDL_PollEvent(ptr) {
      return SDL.pollEvent(ptr);
    }

  function _glClear(x0) { GLctx.clear(x0) }

  function _glEnableVertexAttribArray(index) {
      GLctx.enableVertexAttribArray(index);
    }

  function _glBindBuffer(target, buffer) {
      var bufferObj = buffer ? GL.buffers[buffer] : null;
  
  
      GLctx.bindBuffer(target, bufferObj);
    }

  function _glCompileShader(shader) {
      GLctx.compileShader(GL.shaders[shader]);
    }

  
  var SYSCALLS={DEFAULT_POLLMASK:5,mappings:{},umask:511,calculateAt:function (dirfd, path) {
        if (path[0] !== '/') {
          // relative path
          var dir;
          if (dirfd === -100) {
            dir = FS.cwd();
          } else {
            var dirstream = FS.getStream(dirfd);
            if (!dirstream) throw new FS.ErrnoError(ERRNO_CODES.EBADF);
            dir = dirstream.path;
          }
          path = PATH.join2(dir, path);
        }
        return path;
      },doStat:function (func, path, buf) {
        try {
          var stat = func(path);
        } catch (e) {
          if (e && e.node && PATH.normalize(path) !== PATH.normalize(FS.getPath(e.node))) {
            // an error occurred while trying to look up the path; we should just report ENOTDIR
            return -ERRNO_CODES.ENOTDIR;
          }
          throw e;
        }
        HEAP32[((buf)>>2)]=stat.dev;
        HEAP32[(((buf)+(4))>>2)]=0;
        HEAP32[(((buf)+(8))>>2)]=stat.ino;
        HEAP32[(((buf)+(12))>>2)]=stat.mode;
        HEAP32[(((buf)+(16))>>2)]=stat.nlink;
        HEAP32[(((buf)+(20))>>2)]=stat.uid;
        HEAP32[(((buf)+(24))>>2)]=stat.gid;
        HEAP32[(((buf)+(28))>>2)]=stat.rdev;
        HEAP32[(((buf)+(32))>>2)]=0;
        HEAP32[(((buf)+(36))>>2)]=stat.size;
        HEAP32[(((buf)+(40))>>2)]=4096;
        HEAP32[(((buf)+(44))>>2)]=stat.blocks;
        HEAP32[(((buf)+(48))>>2)]=(stat.atime.getTime() / 1000)|0;
        HEAP32[(((buf)+(52))>>2)]=0;
        HEAP32[(((buf)+(56))>>2)]=(stat.mtime.getTime() / 1000)|0;
        HEAP32[(((buf)+(60))>>2)]=0;
        HEAP32[(((buf)+(64))>>2)]=(stat.ctime.getTime() / 1000)|0;
        HEAP32[(((buf)+(68))>>2)]=0;
        HEAP32[(((buf)+(72))>>2)]=stat.ino;
        return 0;
      },doMsync:function (addr, stream, len, flags) {
        var buffer = new Uint8Array(HEAPU8.subarray(addr, addr + len));
        FS.msync(stream, buffer, 0, len, flags);
      },doMkdir:function (path, mode) {
        // remove a trailing slash, if one - /a/b/ has basename of '', but
        // we want to create b in the context of this function
        path = PATH.normalize(path);
        if (path[path.length-1] === '/') path = path.substr(0, path.length-1);
        FS.mkdir(path, mode, 0);
        return 0;
      },doMknod:function (path, mode, dev) {
        // we don't want this in the JS API as it uses mknod to create all nodes.
        switch (mode & 61440) {
          case 32768:
          case 8192:
          case 24576:
          case 4096:
          case 49152:
            break;
          default: return -ERRNO_CODES.EINVAL;
        }
        FS.mknod(path, mode, dev);
        return 0;
      },doReadlink:function (path, buf, bufsize) {
        if (bufsize <= 0) return -ERRNO_CODES.EINVAL;
        var ret = FS.readlink(path);
        ret = ret.slice(0, Math.max(0, bufsize));
        writeStringToMemory(ret, buf, true);
        return ret.length;
      },doAccess:function (path, amode) {
        if (amode & ~7) {
          // need a valid mode
          return -ERRNO_CODES.EINVAL;
        }
        var node;
        var lookup = FS.lookupPath(path, { follow: true });
        node = lookup.node;
        var perms = '';
        if (amode & 4) perms += 'r';
        if (amode & 2) perms += 'w';
        if (amode & 1) perms += 'x';
        if (perms /* otherwise, they've just passed F_OK */ && FS.nodePermissions(node, perms)) {
          return -ERRNO_CODES.EACCES;
        }
        return 0;
      },doDup:function (path, flags, suggestFD) {
        var suggest = FS.getStream(suggestFD);
        if (suggest) FS.close(suggest);
        return FS.open(path, flags, 0, suggestFD, suggestFD).fd;
      },doReadv:function (stream, iov, iovcnt, offset) {
        var ret = 0;
        for (var i = 0; i < iovcnt; i++) {
          var ptr = HEAP32[(((iov)+(i*8))>>2)];
          var len = HEAP32[(((iov)+(i*8 + 4))>>2)];
          var curr = FS.read(stream, HEAP8,ptr, len, offset);
          if (curr < 0) return -1;
          ret += curr;
          if (curr < len) break; // nothing more to read
        }
        return ret;
      },doWritev:function (stream, iov, iovcnt, offset) {
        var ret = 0;
        for (var i = 0; i < iovcnt; i++) {
          var ptr = HEAP32[(((iov)+(i*8))>>2)];
          var len = HEAP32[(((iov)+(i*8 + 4))>>2)];
          var curr = FS.write(stream, HEAP8,ptr, len, offset);
          if (curr < 0) return -1;
          ret += curr;
        }
        return ret;
      },varargs:0,get:function (varargs) {
        SYSCALLS.varargs += 4;
        var ret = HEAP32[(((SYSCALLS.varargs)-(4))>>2)];
        return ret;
      },getStr:function () {
        var ret = Pointer_stringify(SYSCALLS.get());
        return ret;
      },getStreamFromFD:function () {
        var stream = FS.getStream(SYSCALLS.get());
        if (!stream) throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        return stream;
      },getSocketFromFD:function () {
        var socket = SOCKFS.getSocket(SYSCALLS.get());
        if (!socket) throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        return socket;
      },getSocketAddress:function (allowNull) {
        var addrp = SYSCALLS.get(), addrlen = SYSCALLS.get();
        if (allowNull && addrp === 0) return null;
        var info = __read_sockaddr(addrp, addrlen);
        if (info.errno) throw new FS.ErrnoError(info.errno);
        info.addr = DNS.lookup_addr(info.addr) || info.addr;
        return info;
      },get64:function () {
        var low = SYSCALLS.get(), high = SYSCALLS.get();
        if (low >= 0) assert(high === 0);
        else assert(high === -1);
        return low;
      },getZero:function () {
        assert(SYSCALLS.get() === 0);
      }};function ___syscall54(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // ioctl
      var stream = SYSCALLS.getStreamFromFD(), op = SYSCALLS.get();
      switch (op) {
        case 21505: {
          if (!stream.tty) return -ERRNO_CODES.ENOTTY;
          return 0;
        }
        case 21506: {
          if (!stream.tty) return -ERRNO_CODES.ENOTTY;
          return 0; // no-op, not actually adjusting terminal settings
        }
        case 21519: {
          if (!stream.tty) return -ERRNO_CODES.ENOTTY;
          var argp = SYSCALLS.get();
          HEAP32[((argp)>>2)]=0;
          return 0;
        }
        case 21520: {
          if (!stream.tty) return -ERRNO_CODES.ENOTTY;
          return -ERRNO_CODES.EINVAL; // not supported
        }
        case 21531: {
          var argp = SYSCALLS.get();
          return FS.ioctl(stream, op, argp);
        }
        default: abort('bad ioctl syscall ' + op);
      }
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  function _glUniform4f(location, v0, v1, v2, v3) {
      location = GL.uniforms[location];
      GLctx.uniform4f(location, v0, v1, v2, v3);
    }

   
  Module["_bitshift64Lshr"] = _bitshift64Lshr;

  function _glBufferData(target, size, data, usage) {
      switch (usage) { // fix usages, WebGL only has *_DRAW
        case 0x88E1: // GL_STREAM_READ
        case 0x88E2: // GL_STREAM_COPY
          usage = 0x88E0; // GL_STREAM_DRAW
          break;
        case 0x88E5: // GL_STATIC_READ
        case 0x88E6: // GL_STATIC_COPY
          usage = 0x88E4; // GL_STATIC_DRAW
          break;
        case 0x88E9: // GL_DYNAMIC_READ
        case 0x88EA: // GL_DYNAMIC_COPY
          usage = 0x88E8; // GL_DYNAMIC_DRAW
          break;
      }
      if (!data) {
        GLctx.bufferData(target, size, usage);
      } else {
        GLctx.bufferData(target, HEAPU8.subarray(data, data+size), usage);
      }
    }

  function _pthread_cleanup_push(routine, arg) {
      __ATEXIT__.push(function() { Runtime.dynCall('vi', routine, [arg]) })
      _pthread_cleanup_push.level = __ATEXIT__.length;
    }

  function _glGetError() {
      // First return any GL error generated by the emscripten library_gl.js interop layer.
      if (GL.lastError) {
        var error = GL.lastError;
        GL.lastError = 0/*GL_NO_ERROR*/;
        return error;
      } else { // If there were none, return the GL error from the browser GL context.
        return GLctx.getError();
      }
    }

  function _pthread_cleanup_pop() {
      assert(_pthread_cleanup_push.level == __ATEXIT__.length, 'cannot pop if something else added meanwhile!');
      __ATEXIT__.pop();
      _pthread_cleanup_push.level = __ATEXIT__.length;
    }

  
  function _emscripten_memcpy_big(dest, src, num) {
      HEAPU8.set(HEAPU8.subarray(src, src+num), dest);
      return dest;
    } 
  Module["_memcpy"] = _memcpy;

  function _sbrk(bytes) {
      // Implement a Linux-like 'memory area' for our 'process'.
      // Changes the size of the memory area by |bytes|; returns the
      // address of the previous top ('break') of the memory area
      // We control the "dynamic" memory - DYNAMIC_BASE to DYNAMICTOP
      var self = _sbrk;
      if (!self.called) {
        DYNAMICTOP = alignMemoryPage(DYNAMICTOP); // make sure we start out aligned
        self.called = true;
        assert(Runtime.dynamicAlloc);
        self.alloc = Runtime.dynamicAlloc;
        Runtime.dynamicAlloc = function() { abort('cannot dynamically allocate, sbrk now has control') };
      }
      var ret = DYNAMICTOP;
      if (bytes != 0) {
        var success = self.alloc(bytes);
        if (!success) return -1 >>> 0; // sbrk failure code
      }
      return ret;  // Previous break location.
    }

  function _glGenTextures(n, textures) {
      for (var i = 0; i < n; i++) {
        var texture = GLctx.createTexture();
        if (!texture) {
          GL.recordError(0x0502 /* GL_INVALID_OPERATION */); // GLES + EGL specs don't specify what should happen here, so best to issue an error and create IDs with 0.
          while(i < n) HEAP32[(((textures)+(i++*4))>>2)]=0;
          return;
        }
        var id = GL.getNewId(GL.textures);
        texture.name = id;
        GL.textures[id] = texture;
        HEAP32[(((textures)+(i*4))>>2)]=id;
      }
    }

  function _glCreateShader(shaderType) {
      var id = GL.getNewId(GL.shaders);
      GL.shaders[id] = GLctx.createShader(shaderType);
      return id;
    }

  function _glUniform1i(location, v0) {
      location = GL.uniforms[location];
      GLctx.uniform1i(location, v0);
    }

  
  
  function emscriptenWebGLComputeImageSize(width, height, sizePerPixel, alignment) {
      function roundedToNextMultipleOf(x, y) {
        return Math.floor((x + y - 1) / y) * y
      }
      var plainRowSize = width * sizePerPixel;
      var alignedRowSize = roundedToNextMultipleOf(plainRowSize, alignment);
      return (height <= 0) ? 0 :
               ((height - 1) * alignedRowSize + plainRowSize);
    }function emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, internalFormat) {
      var sizePerPixel;
      var numChannels;
      switch(format) {
        case 0x1906 /* GL_ALPHA */:
        case 0x1909 /* GL_LUMINANCE */:
        case 0x1902 /* GL_DEPTH_COMPONENT */:
        case 0x1903 /* GL_RED */:
          numChannels = 1;
          break;
        case 0x190A /* GL_LUMINANCE_ALPHA */:
        case 0x8227 /* GL_RG */:
          numChannels = 2;
          break;
        case 0x1907 /* GL_RGB */:
        case 0x8C40 /* GL_SRGB_EXT */:
          numChannels = 3;
          break;
        case 0x1908 /* GL_RGBA */:
        case 0x8C42 /* GL_SRGB_ALPHA_EXT */:
          numChannels = 4;
          break;
        default:
          GL.recordError(0x0500); // GL_INVALID_ENUM
          return {
            pixels: null,
            internalFormat: 0x0
          };
      }
      switch (type) {
        case 0x1401 /* GL_UNSIGNED_BYTE */:
          sizePerPixel = numChannels*1;
          break;
        case 0x1403 /* GL_UNSIGNED_SHORT */:
        case 0x8D61 /* GL_HALF_FLOAT_OES */:
          sizePerPixel = numChannels*2;
          break;
        case 0x1405 /* GL_UNSIGNED_INT */:
        case 0x1406 /* GL_FLOAT */:
          sizePerPixel = numChannels*4;
          break;
        case 0x84FA /* UNSIGNED_INT_24_8_WEBGL/UNSIGNED_INT_24_8 */:
          sizePerPixel = 4;
          break;
        case 0x8363 /* GL_UNSIGNED_SHORT_5_6_5 */:
        case 0x8033 /* GL_UNSIGNED_SHORT_4_4_4_4 */:
        case 0x8034 /* GL_UNSIGNED_SHORT_5_5_5_1 */:
          sizePerPixel = 2;
          break;
        default:
          GL.recordError(0x0500); // GL_INVALID_ENUM
          return {
            pixels: null,
            internalFormat: 0x0
          };
      }
      var bytes = emscriptenWebGLComputeImageSize(width, height, sizePerPixel, GL.unpackAlignment);
      if (type == 0x1401 /* GL_UNSIGNED_BYTE */) {
        pixels = HEAPU8.subarray((pixels),(pixels+bytes));
      } else if (type == 0x1406 /* GL_FLOAT */) {
        pixels = HEAPF32.subarray((pixels)>>2,(pixels+bytes)>>2);
      } else if (type == 0x1405 /* GL_UNSIGNED_INT */ || type == 0x84FA /* UNSIGNED_INT_24_8_WEBGL */) {
        pixels = HEAPU32.subarray((pixels)>>2,(pixels+bytes)>>2);
      } else {
        pixels = HEAPU16.subarray((pixels)>>1,(pixels+bytes)>>1);
      }
      return {
        pixels: pixels,
        internalFormat: internalFormat
      };
    }function _glTexSubImage2D(target, level, xoffset, yoffset, width, height, format, type, pixels) {
      var pixelData;
      if (pixels) {
        pixelData = emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, -1).pixels;
      } else {
        pixelData = null;
      }
      GLctx.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, pixelData);
    }

  function _glTexImage2D(target, level, internalFormat, width, height, border, format, type, pixels) {
      var pixelData;
      if (pixels) {
        var data = emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, internalFormat);
        pixelData = data.pixels;
        internalFormat = data.internalFormat;
      } else {
        pixelData = null;
      }
      GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, pixelData);
    }

  function _glGetProgramInfoLog(program, maxLength, length, infoLog) {
      var log = GLctx.getProgramInfoLog(GL.programs[program]);
      if (log === null) log = '(unknown error)';
  
      log = log.substr(0, maxLength - 1);
      if (maxLength > 0 && infoLog) {
        writeStringToMemory(log, infoLog);
        if (length) HEAP32[((length)>>2)]=log.length;
      } else {
        if (length) HEAP32[((length)>>2)]=0;
      }
    }

  function _glUniform2f(location, v0, v1) {
      location = GL.uniforms[location];
      GLctx.uniform2f(location, v0, v1);
    }

   
  Module["_memset"] = _memset;

  function _glGetProgramiv(program, pname, p) {
      if (!p) {
        // GLES2 specification does not specify how to behave if p is a null pointer. Since calling this function does not make sense
        // if p == null, issue a GL error to notify user about it. 
        GL.recordError(0x0501 /* GL_INVALID_VALUE */);
        return;
      }
      if (pname == 0x8B84) { // GL_INFO_LOG_LENGTH
        var log = GLctx.getProgramInfoLog(GL.programs[program]);
        if (log === null) log = '(unknown error)';
        HEAP32[((p)>>2)]=log.length + 1;
      } else if (pname == 0x8B87 /* GL_ACTIVE_UNIFORM_MAX_LENGTH */) {
        var ptable = GL.programInfos[program];
        if (ptable) {
          HEAP32[((p)>>2)]=ptable.maxUniformLength;
          return;
        } else if (program < GL.counter) {
          GL.recordError(0x0502 /* GL_INVALID_OPERATION */);
        } else {
          GL.recordError(0x0501 /* GL_INVALID_VALUE */);
        }
      } else if (pname == 0x8B8A /* GL_ACTIVE_ATTRIBUTE_MAX_LENGTH */) {
        var ptable = GL.programInfos[program];
        if (ptable) {
          if (ptable.maxAttributeLength == -1) {
            var program = GL.programs[program];
            var numAttribs = GLctx.getProgramParameter(program, GLctx.ACTIVE_ATTRIBUTES);
            ptable.maxAttributeLength = 0; // Spec says if there are no active attribs, 0 must be returned.
            for (var i = 0; i < numAttribs; ++i) {
              var activeAttrib = GLctx.getActiveAttrib(program, i);
              ptable.maxAttributeLength = Math.max(ptable.maxAttributeLength, activeAttrib.name.length+1);
            }
          }
          HEAP32[((p)>>2)]=ptable.maxAttributeLength;
          return;
        } else if (program < GL.counter) {
          GL.recordError(0x0502 /* GL_INVALID_OPERATION */);
        } else {
          GL.recordError(0x0501 /* GL_INVALID_VALUE */);
        }
      } else {
        HEAP32[((p)>>2)]=GLctx.getProgramParameter(GL.programs[program], pname);
      }
    }

  function _glVertexAttribPointer(index, size, type, normalized, stride, ptr) {
      GLctx.vertexAttribPointer(index, size, type, normalized, stride, ptr);
    }

  function _glGetShaderInfoLog(shader, maxLength, length, infoLog) {
      var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
      if (log === null) log = '(unknown error)';
      log = log.substr(0, maxLength - 1);
      if (maxLength > 0 && infoLog) {
        writeStringToMemory(log, infoLog);
        if (length) HEAP32[((length)>>2)]=log.length;
      } else {
        if (length) HEAP32[((length)>>2)]=0;
      }
    }

   
  Module["_bitshift64Shl"] = _bitshift64Shl;

  function _abort() {
      Module['abort']();
    }

  function _glGetUniformLocation(program, name) {
      name = Pointer_stringify(name);
  
      var arrayOffset = 0;
      // If user passed an array accessor "[index]", parse the array index off the accessor.
      if (name.indexOf(']', name.length-1) !== -1) {
        var ls = name.lastIndexOf('[');
        var arrayIndex = name.slice(ls+1, -1);
        if (arrayIndex.length > 0) {
          arrayOffset = parseInt(arrayIndex);
          if (arrayOffset < 0) {
            return -1;
          }
        }
        name = name.slice(0, ls);
      }
  
      var ptable = GL.programInfos[program];
      if (!ptable) {
        return -1;
      }
      var utable = ptable.uniforms;
      var uniformInfo = utable[name]; // returns pair [ dimension_of_uniform_array, uniform_location ]
      if (uniformInfo && arrayOffset < uniformInfo[0]) { // Check if user asked for an out-of-bounds element, i.e. for 'vec4 colors[3];' user could ask for 'colors[10]' which should return -1.
        return uniformInfo[1]+arrayOffset;
      } else {
        return -1;
      }
    }

  function ___lock() {}

  function ___unlock() {}

  function _emscripten_force_exit(status) {
      Module['noExitRuntime'] = false;
      Module['exit'](status);
    }

  function _glGenBuffers(n, buffers) {
      for (var i = 0; i < n; i++) {
        var buffer = GLctx.createBuffer();
        if (!buffer) {
          GL.recordError(0x0502 /* GL_INVALID_OPERATION */);
          while(i < n) HEAP32[(((buffers)+(i++*4))>>2)]=0;
          return;
        }
        var id = GL.getNewId(GL.buffers);
        buffer.name = id;
        GL.buffers[id] = buffer;
        HEAP32[(((buffers)+(i*4))>>2)]=id;
      }
    }

  function _glDeleteProgram(id) {
      if (!id) return;
      var program = GL.programs[id];
      if (!program) { // glDeleteProgram actually signals an error when deleting a nonexisting object, unlike some other GL delete functions.
        GL.recordError(0x0501 /* GL_INVALID_VALUE */);
        return;
      }
      GLctx.deleteProgram(program);
      program.name = 0;
      GL.programs[id] = null;
      GL.programInfos[id] = null;
    }

  function _glGetAttribLocation(program, name) {
      program = GL.programs[program];
      name = Pointer_stringify(name);
      return GLctx.getAttribLocation(program, name);
    }

  function _glAttachShader(program, shader) {
      GLctx.attachShader(GL.programs[program],
                              GL.shaders[shader]);
    }

  function _glDeleteShader(id) {
      if (!id) return;
      var shader = GL.shaders[id];
      if (!shader) { // glDeleteShader actually signals an error when deleting a nonexisting object, unlike some other GL delete functions.
        GL.recordError(0x0501 /* GL_INVALID_VALUE */);
        return;
      }
      GLctx.deleteShader(shader);
      GL.shaders[id] = null;
    }

  function _glCreateProgram() {
      var id = GL.getNewId(GL.programs);
      var program = GLctx.createProgram();
      program.name = id;
      GL.programs[id] = program;
      return id;
    }


  function ___syscall5(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // open
      var pathname = SYSCALLS.getStr(), flags = SYSCALLS.get(), mode = SYSCALLS.get() // optional TODO
      var stream = FS.open(pathname, flags, mode);
      return stream.fd;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  function ___syscall6(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // close
      var stream = SYSCALLS.getStreamFromFD();
      FS.close(stream);
      return 0;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  function _SDL_GL_SwapBuffers() {
      if (Browser.doSwapBuffers) Browser.doSwapBuffers(); // in workers, this is used to send out a buffered frame
    }

  function _glBufferSubData(target, offset, size, data) {
      GLctx.bufferSubData(target, offset, HEAPU8.subarray(data, data+size));
    }

  function _glTexParameterf(x0, x1, x2) { GLctx.texParameterf(x0, x1, x2) }

  function _SDL_Init(initFlags) {
      SDL.startTime = Date.now();
      SDL.initFlags = initFlags;
  
      // capture all key events. we just keep down and up, but also capture press to prevent default actions
      if (!Module['doNotCaptureKeyboard']) {
        var keyboardListeningElement = Module['keyboardListeningElement'] || document;
        keyboardListeningElement.addEventListener("keydown", SDL.receiveEvent);
        keyboardListeningElement.addEventListener("keyup", SDL.receiveEvent);
        keyboardListeningElement.addEventListener("keypress", SDL.receiveEvent);
        window.addEventListener("focus", SDL.receiveEvent);
        window.addEventListener("blur", SDL.receiveEvent);
        document.addEventListener("visibilitychange", SDL.receiveEvent);
      }
  
      if (initFlags & 0x200) {
        // SDL_INIT_JOYSTICK
        // Firefox will not give us Joystick data unless we register this NOP
        // callback.
        // https://bugzilla.mozilla.org/show_bug.cgi?id=936104
        addEventListener("gamepadconnected", function() {});
      }
  
      window.addEventListener("unload", SDL.receiveEvent);
      SDL.keyboardState = _malloc(0x10000); // Our SDL needs 512, but 64K is safe for older SDLs
      _memset(SDL.keyboardState, 0, 0x10000);
      // Initialize this structure carefully for closure
      SDL.DOMEventToSDLEvent['keydown']    = 0x300  /* SDL_KEYDOWN */;
      SDL.DOMEventToSDLEvent['keyup']      = 0x301  /* SDL_KEYUP */;
      SDL.DOMEventToSDLEvent['keypress']   = 0x303  /* SDL_TEXTINPUT */;
      SDL.DOMEventToSDLEvent['mousedown']  = 0x401  /* SDL_MOUSEBUTTONDOWN */;
      SDL.DOMEventToSDLEvent['mouseup']    = 0x402  /* SDL_MOUSEBUTTONUP */;
      SDL.DOMEventToSDLEvent['mousemove']  = 0x400  /* SDL_MOUSEMOTION */;
      SDL.DOMEventToSDLEvent['wheel']      = 0x403  /* SDL_MOUSEWHEEL */; 
      SDL.DOMEventToSDLEvent['touchstart'] = 0x700  /* SDL_FINGERDOWN */;
      SDL.DOMEventToSDLEvent['touchend']   = 0x701  /* SDL_FINGERUP */;
      SDL.DOMEventToSDLEvent['touchmove']  = 0x702  /* SDL_FINGERMOTION */;
      SDL.DOMEventToSDLEvent['unload']     = 0x100  /* SDL_QUIT */;
      SDL.DOMEventToSDLEvent['resize']     = 0x7001 /* SDL_VIDEORESIZE/SDL_EVENT_COMPAT2 */;
      SDL.DOMEventToSDLEvent['visibilitychange'] = 0x200 /* SDL_WINDOWEVENT */;
      SDL.DOMEventToSDLEvent['focus']      = 0x200 /* SDL_WINDOWEVENT */;
      SDL.DOMEventToSDLEvent['blur']       = 0x200 /* SDL_WINDOWEVENT */;
  
      // These are not technically DOM events; the HTML gamepad API is poll-based.
      // However, we define them here, as the rest of the SDL code assumes that
      // all SDL events originate as DOM events.
      SDL.DOMEventToSDLEvent['joystick_axis_motion'] = 0x600 /* SDL_JOYAXISMOTION */;
      SDL.DOMEventToSDLEvent['joystick_button_down'] = 0x603 /* SDL_JOYBUTTONDOWN */;
      SDL.DOMEventToSDLEvent['joystick_button_up'] = 0x604 /* SDL_JOYBUTTONUP */;
      return 0; // success
    }

  function _glTexParameteri(x0, x1, x2) { GLctx.texParameteri(x0, x1, x2) }

  function _glGetShaderiv(shader, pname, p) {
      if (!p) {
        // GLES2 specification does not specify how to behave if p is a null pointer. Since calling this function does not make sense
        // if p == null, issue a GL error to notify user about it. 
        GL.recordError(0x0501 /* GL_INVALID_VALUE */);
        return;
      }
      if (pname == 0x8B84) { // GL_INFO_LOG_LENGTH
        var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
        if (log === null) log = '(unknown error)';
        HEAP32[((p)>>2)]=log.length + 1;
      } else {
        HEAP32[((p)>>2)]=GLctx.getShaderParameter(GL.shaders[shader], pname);
      }
    }

   
  Module["_pthread_self"] = _pthread_self;

  function ___syscall140(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // llseek
      var stream = SYSCALLS.getStreamFromFD(), offset_high = SYSCALLS.get(), offset_low = SYSCALLS.get(), result = SYSCALLS.get(), whence = SYSCALLS.get();
      var offset = offset_low;
      assert(offset_high === 0);
      FS.llseek(stream, offset, whence);
      HEAP32[((result)>>2)]=stream.position;
      if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null; // reset readdir state
      return 0;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  function ___syscall146(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // writev
      var stream = SYSCALLS.getStreamFromFD(), iov = SYSCALLS.get(), iovcnt = SYSCALLS.get();
      return SYSCALLS.doWritev(stream, iov, iovcnt);
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  function ___syscall221(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // fcntl64
      var stream = SYSCALLS.getStreamFromFD(), cmd = SYSCALLS.get();
      switch (cmd) {
        case 0: {
          var arg = SYSCALLS.get();
          if (arg < 0) {
            return -ERRNO_CODES.EINVAL;
          }
          var newStream;
          newStream = FS.open(stream.path, stream.flags, 0, arg);
          return newStream.fd;
        }
        case 1:
        case 2:
          return 0;  // FD_CLOEXEC makes no sense for a single process.
        case 3:
          return stream.flags;
        case 4: {
          var arg = SYSCALLS.get();
          stream.flags |= arg;
          return 0;
        }
        case 12:
        case 12: {
          var arg = SYSCALLS.get();
          var offset = 0;
          // We're always unlocked.
          HEAP16[(((arg)+(offset))>>1)]=2;
          return 0;
        }
        case 13:
        case 14:
        case 13:
        case 14:
          return 0; // Pretend that the locking is successful.
        case 16:
        case 8:
          return -ERRNO_CODES.EINVAL; // These are for sockets. We don't have them fully implemented yet.
        case 9:
          // musl trusts getown return values, due to a bug where they must be, as they overlap with errors. just return -1 here, so fnctl() returns that, and we set errno ourselves.
          ___setErrNo(ERRNO_CODES.EINVAL);
          return -1;
        default: {
          return -ERRNO_CODES.EINVAL;
        }
      }
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  function ___syscall145(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // readv
      var stream = SYSCALLS.getStreamFromFD(), iov = SYSCALLS.get(), iovcnt = SYSCALLS.get();
      return SYSCALLS.doReadv(stream, iov, iovcnt);
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }
var GLctx; GL.init();
FS.staticInit();__ATINIT__.unshift(function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() });__ATMAIN__.push(function() { FS.ignorePermissions = false });__ATEXIT__.push(function() { FS.quit() });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;Module["FS_unlink"] = FS.unlink;;
__ATINIT__.unshift(function() { TTY.init() });__ATEXIT__.push(function() { TTY.shutdown() });;
if (ENVIRONMENT_IS_NODE) { var fs = require("fs"); var NODEJS_PATH = require("path"); NODEFS.staticInit(); };
Module["requestFullScreen"] = function Module_requestFullScreen(lockPointer, resizeCanvas, vrDevice) { Browser.requestFullScreen(lockPointer, resizeCanvas, vrDevice) };
  Module["requestAnimationFrame"] = function Module_requestAnimationFrame(func) { Browser.requestAnimationFrame(func) };
  Module["setCanvasSize"] = function Module_setCanvasSize(width, height, noUpdates) { Browser.setCanvasSize(width, height, noUpdates) };
  Module["pauseMainLoop"] = function Module_pauseMainLoop() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function Module_resumeMainLoop() { Browser.mainLoop.resume() };
  Module["getUserMedia"] = function Module_getUserMedia() { Browser.getUserMedia() }
  Module["createContext"] = function Module_createContext(canvas, useWebGL, setInModule, webGLContextAttributes) { return Browser.createContext(canvas, useWebGL, setInModule, webGLContextAttributes) };
___buildEnvironment(ENV);;
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);

staticSealed = true; // seal the static portion of memory

STACK_MAX = STACK_BASE + TOTAL_STACK;

DYNAMIC_BASE = DYNAMICTOP = Runtime.alignMemory(STACK_MAX);

assert(DYNAMIC_BASE < TOTAL_MEMORY, "TOTAL_MEMORY not big enough for stack");

 var cttz_i8 = allocate([8,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,7,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0], "i8", ALLOC_DYNAMIC);


function nullFunc_iiii(x) { Module["printErr"]("Invalid function pointer called with signature 'iiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  Module["printErr"]("Build with ASSERTIONS=2 for more info.");abort(x) }

function nullFunc_viiiii(x) { Module["printErr"]("Invalid function pointer called with signature 'viiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  Module["printErr"]("Build with ASSERTIONS=2 for more info.");abort(x) }

function nullFunc_vi(x) { Module["printErr"]("Invalid function pointer called with signature 'vi'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  Module["printErr"]("Build with ASSERTIONS=2 for more info.");abort(x) }

function nullFunc_vii(x) { Module["printErr"]("Invalid function pointer called with signature 'vii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  Module["printErr"]("Build with ASSERTIONS=2 for more info.");abort(x) }

function nullFunc_ii(x) { Module["printErr"]("Invalid function pointer called with signature 'ii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  Module["printErr"]("Build with ASSERTIONS=2 for more info.");abort(x) }

function nullFunc_v(x) { Module["printErr"]("Invalid function pointer called with signature 'v'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  Module["printErr"]("Build with ASSERTIONS=2 for more info.");abort(x) }

function invoke_iiii(index,a1,a2,a3) {
  try {
    return Module["dynCall_iiii"](index,a1,a2,a3);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_viiiii(index,a1,a2,a3,a4,a5) {
  try {
    Module["dynCall_viiiii"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_vi(index,a1) {
  try {
    Module["dynCall_vi"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_vii(index,a1,a2) {
  try {
    Module["dynCall_vii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_ii(index,a1) {
  try {
    return Module["dynCall_ii"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_v(index) {
  try {
    Module["dynCall_v"](index);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

Module.asmGlobalArg = { "Math": Math, "Int8Array": Int8Array, "Int16Array": Int16Array, "Int32Array": Int32Array, "Uint8Array": Uint8Array, "Uint16Array": Uint16Array, "Uint32Array": Uint32Array, "Float32Array": Float32Array, "Float64Array": Float64Array, "NaN": NaN, "Infinity": Infinity };

Module.asmLibraryArg = { "abort": abort, "assert": assert, "abortStackOverflow": abortStackOverflow, "nullFunc_iiii": nullFunc_iiii, "nullFunc_viiiii": nullFunc_viiiii, "nullFunc_vi": nullFunc_vi, "nullFunc_vii": nullFunc_vii, "nullFunc_ii": nullFunc_ii, "nullFunc_v": nullFunc_v, "invoke_iiii": invoke_iiii, "invoke_viiiii": invoke_viiiii, "invoke_vi": invoke_vi, "invoke_vii": invoke_vii, "invoke_ii": invoke_ii, "invoke_v": invoke_v, "_glUseProgram": _glUseProgram, "___syscall221": ___syscall221, "_glDeleteShader": _glDeleteShader, "_putenv": _putenv, "_glVertexAttribPointer": _glVertexAttribPointer, "_glGetProgramiv": _glGetProgramiv, "emscriptenWebGLGetTexPixelData": emscriptenWebGLGetTexPixelData, "_SDL_GL_SetAttribute": _SDL_GL_SetAttribute, "_IMG_Load": _IMG_Load, "_glGetUniformLocation": _glGetUniformLocation, "_glBufferData": _glBufferData, "_TTF_FontHeight": _TTF_FontHeight, "_glGetProgramInfoLog": _glGetProgramInfoLog, "_emscripten_set_main_loop_timing": _emscripten_set_main_loop_timing, "_SDL_GetTicks": _SDL_GetTicks, "_glTexSubImage2D": _glTexSubImage2D, "_glDeleteProgram": _glDeleteProgram, "___buildEnvironment": ___buildEnvironment, "emscriptenWebGLComputeImageSize": emscriptenWebGLComputeImageSize, "_glBindBuffer": _glBindBuffer, "_glGetShaderInfoLog": _glGetShaderInfoLog, "_SDL_LockSurface": _SDL_LockSurface, "___setErrNo": ___setErrNo, "_glAttachShader": _glAttachShader, "_SDL_SetVideoMode": _SDL_SetVideoMode, "_glBindTexture": _glBindTexture, "_SDL_PauseAudio": _SDL_PauseAudio, "_glClearColor": _glClearColor, "_SDL_PollEvent": _SDL_PollEvent, "_SDL_Init": _SDL_Init, "_glGetAttribLocation": _glGetAttribLocation, "_glDisableVertexAttribArray": _glDisableVertexAttribArray, "_Mix_PlayChannel": _Mix_PlayChannel, "_TTF_RenderText_Solid": _TTF_RenderText_Solid, "_Mix_FreeChunk": _Mix_FreeChunk, "_glUniform1i": _glUniform1i, "_IMG_Load_RW": _IMG_Load_RW, "_glClear": _glClear, "_glDrawArrays": _glDrawArrays, "_emscripten_memcpy_big": _emscripten_memcpy_big, "_emscripten_force_exit": _emscripten_force_exit, "_glGetError": _glGetError, "_glUniform4f": _glUniform4f, "_glCreateShader": _glCreateShader, "_glGetShaderiv": _glGetShaderiv, "_abort": _abort, "_TTF_SizeText": _TTF_SizeText, "_glGenTextures": _glGenTextures, "_SDL_FreeRW": _SDL_FreeRW, "_SDL_UpperBlit": _SDL_UpperBlit, "_SDL_UpperBlitScaled": _SDL_UpperBlitScaled, "___syscall54": ___syscall54, "___unlock": ___unlock, "_glLinkProgram": _glLinkProgram, "_pthread_cleanup_pop": _pthread_cleanup_pop, "_glCreateProgram": _glCreateProgram, "_emscripten_set_main_loop": _emscripten_set_main_loop, "_Mix_LoadWAV_RW": _Mix_LoadWAV_RW, "_glGenBuffers": _glGenBuffers, "_glShaderSource": _glShaderSource, "_Mix_PlayMusic": _Mix_PlayMusic, "_glBufferSubData": _glBufferSubData, "_glCompileShader": _glCompileShader, "_getenv": _getenv, "_glEnableVertexAttribArray": _glEnableVertexAttribArray, "___lock": ___lock, "_SDL_GL_SwapBuffers": _SDL_GL_SwapBuffers, "___syscall6": ___syscall6, "_pthread_cleanup_push": _pthread_cleanup_push, "___syscall5": ___syscall5, "_Mix_HaltMusic": _Mix_HaltMusic, "_glTexParameteri": _glTexParameteri, "_sbrk": _sbrk, "_glTexImage2D": _glTexImage2D, "___syscall140": ___syscall140, "_SDL_CloseAudio": _SDL_CloseAudio, "_glUniform2f": _glUniform2f, "_SDL_RWFromConstMem": _SDL_RWFromConstMem, "_glTexParameterf": _glTexParameterf, "___syscall145": ___syscall145, "___syscall146": ___syscall146, "_SDL_RWFromFile": _SDL_RWFromFile, "STACKTOP": STACKTOP, "STACK_MAX": STACK_MAX, "tempDoublePtr": tempDoublePtr, "ABORT": ABORT, "cttz_i8": cttz_i8 };
// EMSCRIPTEN_START_ASM
var asm = (function(global, env, buffer) {
  'almost asm';
  
  
  var HEAP8 = new global.Int8Array(buffer);
  var HEAP16 = new global.Int16Array(buffer);
  var HEAP32 = new global.Int32Array(buffer);
  var HEAPU8 = new global.Uint8Array(buffer);
  var HEAPU16 = new global.Uint16Array(buffer);
  var HEAPU32 = new global.Uint32Array(buffer);
  var HEAPF32 = new global.Float32Array(buffer);
  var HEAPF64 = new global.Float64Array(buffer);


  var STACKTOP=env.STACKTOP|0;
  var STACK_MAX=env.STACK_MAX|0;
  var tempDoublePtr=env.tempDoublePtr|0;
  var ABORT=env.ABORT|0;
  var cttz_i8=env.cttz_i8|0;

  var __THREW__ = 0;
  var threwValue = 0;
  var setjmpId = 0;
  var undef = 0;
  var nan = global.NaN, inf = global.Infinity;
  var tempInt = 0, tempBigInt = 0, tempBigIntP = 0, tempBigIntS = 0, tempBigIntR = 0.0, tempBigIntI = 0, tempBigIntD = 0, tempValue = 0, tempDouble = 0.0;

  var tempRet0 = 0;
  var tempRet1 = 0;
  var tempRet2 = 0;
  var tempRet3 = 0;
  var tempRet4 = 0;
  var tempRet5 = 0;
  var tempRet6 = 0;
  var tempRet7 = 0;
  var tempRet8 = 0;
  var tempRet9 = 0;
  var Math_floor=global.Math.floor;
  var Math_abs=global.Math.abs;
  var Math_sqrt=global.Math.sqrt;
  var Math_pow=global.Math.pow;
  var Math_cos=global.Math.cos;
  var Math_sin=global.Math.sin;
  var Math_tan=global.Math.tan;
  var Math_acos=global.Math.acos;
  var Math_asin=global.Math.asin;
  var Math_atan=global.Math.atan;
  var Math_atan2=global.Math.atan2;
  var Math_exp=global.Math.exp;
  var Math_log=global.Math.log;
  var Math_ceil=global.Math.ceil;
  var Math_imul=global.Math.imul;
  var Math_min=global.Math.min;
  var Math_clz32=global.Math.clz32;
  var abort=env.abort;
  var assert=env.assert;
  var abortStackOverflow=env.abortStackOverflow;
  var nullFunc_iiii=env.nullFunc_iiii;
  var nullFunc_viiiii=env.nullFunc_viiiii;
  var nullFunc_vi=env.nullFunc_vi;
  var nullFunc_vii=env.nullFunc_vii;
  var nullFunc_ii=env.nullFunc_ii;
  var nullFunc_v=env.nullFunc_v;
  var invoke_iiii=env.invoke_iiii;
  var invoke_viiiii=env.invoke_viiiii;
  var invoke_vi=env.invoke_vi;
  var invoke_vii=env.invoke_vii;
  var invoke_ii=env.invoke_ii;
  var invoke_v=env.invoke_v;
  var _glUseProgram=env._glUseProgram;
  var ___syscall221=env.___syscall221;
  var _glDeleteShader=env._glDeleteShader;
  var _putenv=env._putenv;
  var _glVertexAttribPointer=env._glVertexAttribPointer;
  var _glGetProgramiv=env._glGetProgramiv;
  var emscriptenWebGLGetTexPixelData=env.emscriptenWebGLGetTexPixelData;
  var _SDL_GL_SetAttribute=env._SDL_GL_SetAttribute;
  var _IMG_Load=env._IMG_Load;
  var _glGetUniformLocation=env._glGetUniformLocation;
  var _glBufferData=env._glBufferData;
  var _TTF_FontHeight=env._TTF_FontHeight;
  var _glGetProgramInfoLog=env._glGetProgramInfoLog;
  var _emscripten_set_main_loop_timing=env._emscripten_set_main_loop_timing;
  var _SDL_GetTicks=env._SDL_GetTicks;
  var _glTexSubImage2D=env._glTexSubImage2D;
  var _glDeleteProgram=env._glDeleteProgram;
  var ___buildEnvironment=env.___buildEnvironment;
  var emscriptenWebGLComputeImageSize=env.emscriptenWebGLComputeImageSize;
  var _glBindBuffer=env._glBindBuffer;
  var _glGetShaderInfoLog=env._glGetShaderInfoLog;
  var _SDL_LockSurface=env._SDL_LockSurface;
  var ___setErrNo=env.___setErrNo;
  var _glAttachShader=env._glAttachShader;
  var _SDL_SetVideoMode=env._SDL_SetVideoMode;
  var _glBindTexture=env._glBindTexture;
  var _SDL_PauseAudio=env._SDL_PauseAudio;
  var _glClearColor=env._glClearColor;
  var _SDL_PollEvent=env._SDL_PollEvent;
  var _SDL_Init=env._SDL_Init;
  var _glGetAttribLocation=env._glGetAttribLocation;
  var _glDisableVertexAttribArray=env._glDisableVertexAttribArray;
  var _Mix_PlayChannel=env._Mix_PlayChannel;
  var _TTF_RenderText_Solid=env._TTF_RenderText_Solid;
  var _Mix_FreeChunk=env._Mix_FreeChunk;
  var _glUniform1i=env._glUniform1i;
  var _IMG_Load_RW=env._IMG_Load_RW;
  var _glClear=env._glClear;
  var _glDrawArrays=env._glDrawArrays;
  var _emscripten_memcpy_big=env._emscripten_memcpy_big;
  var _emscripten_force_exit=env._emscripten_force_exit;
  var _glGetError=env._glGetError;
  var _glUniform4f=env._glUniform4f;
  var _glCreateShader=env._glCreateShader;
  var _glGetShaderiv=env._glGetShaderiv;
  var _abort=env._abort;
  var _TTF_SizeText=env._TTF_SizeText;
  var _glGenTextures=env._glGenTextures;
  var _SDL_FreeRW=env._SDL_FreeRW;
  var _SDL_UpperBlit=env._SDL_UpperBlit;
  var _SDL_UpperBlitScaled=env._SDL_UpperBlitScaled;
  var ___syscall54=env.___syscall54;
  var ___unlock=env.___unlock;
  var _glLinkProgram=env._glLinkProgram;
  var _pthread_cleanup_pop=env._pthread_cleanup_pop;
  var _glCreateProgram=env._glCreateProgram;
  var _emscripten_set_main_loop=env._emscripten_set_main_loop;
  var _Mix_LoadWAV_RW=env._Mix_LoadWAV_RW;
  var _glGenBuffers=env._glGenBuffers;
  var _glShaderSource=env._glShaderSource;
  var _Mix_PlayMusic=env._Mix_PlayMusic;
  var _glBufferSubData=env._glBufferSubData;
  var _glCompileShader=env._glCompileShader;
  var _getenv=env._getenv;
  var _glEnableVertexAttribArray=env._glEnableVertexAttribArray;
  var ___lock=env.___lock;
  var _SDL_GL_SwapBuffers=env._SDL_GL_SwapBuffers;
  var ___syscall6=env.___syscall6;
  var _pthread_cleanup_push=env._pthread_cleanup_push;
  var ___syscall5=env.___syscall5;
  var _Mix_HaltMusic=env._Mix_HaltMusic;
  var _glTexParameteri=env._glTexParameteri;
  var _sbrk=env._sbrk;
  var _glTexImage2D=env._glTexImage2D;
  var ___syscall140=env.___syscall140;
  var _SDL_CloseAudio=env._SDL_CloseAudio;
  var _glUniform2f=env._glUniform2f;
  var _SDL_RWFromConstMem=env._SDL_RWFromConstMem;
  var _glTexParameterf=env._glTexParameterf;
  var ___syscall145=env.___syscall145;
  var ___syscall146=env.___syscall146;
  var _SDL_RWFromFile=env._SDL_RWFromFile;
  var tempFloat = 0.0;

// EMSCRIPTEN_START_FUNCS

function stackAlloc(size) {
  size = size|0;
  var ret = 0;
  ret = STACKTOP;
  STACKTOP = (STACKTOP + size)|0;
  STACKTOP = (STACKTOP + 15)&-16;
  if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(size|0);

  return ret|0;
}
function stackSave() {
  return STACKTOP|0;
}
function stackRestore(top) {
  top = top|0;
  STACKTOP = top;
}
function establishStackSpace(stackBase, stackMax) {
  stackBase = stackBase|0;
  stackMax = stackMax|0;
  STACKTOP = stackBase;
  STACK_MAX = stackMax;
}

function setThrew(threw, value) {
  threw = threw|0;
  value = value|0;
  if ((__THREW__|0) == 0) {
    __THREW__ = threw;
    threwValue = value;
  }
}
function copyTempFloat(ptr) {
  ptr = ptr|0;
  HEAP8[tempDoublePtr>>0] = HEAP8[ptr>>0];
  HEAP8[tempDoublePtr+1>>0] = HEAP8[ptr+1>>0];
  HEAP8[tempDoublePtr+2>>0] = HEAP8[ptr+2>>0];
  HEAP8[tempDoublePtr+3>>0] = HEAP8[ptr+3>>0];
}
function copyTempDouble(ptr) {
  ptr = ptr|0;
  HEAP8[tempDoublePtr>>0] = HEAP8[ptr>>0];
  HEAP8[tempDoublePtr+1>>0] = HEAP8[ptr+1>>0];
  HEAP8[tempDoublePtr+2>>0] = HEAP8[ptr+2>>0];
  HEAP8[tempDoublePtr+3>>0] = HEAP8[ptr+3>>0];
  HEAP8[tempDoublePtr+4>>0] = HEAP8[ptr+4>>0];
  HEAP8[tempDoublePtr+5>>0] = HEAP8[ptr+5>>0];
  HEAP8[tempDoublePtr+6>>0] = HEAP8[ptr+6>>0];
  HEAP8[tempDoublePtr+7>>0] = HEAP8[ptr+7>>0];
}

function setTempRet0(value) {
  value = value|0;
  tempRet0 = value;
}
function getTempRet0() {
  return tempRet0|0;
}

function __Z18gl_error_to_stringj($err) {
 $err = $err|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $1 = $err;
 $2 = $1;
 switch ($2|0) {
 case 1280:  {
  $0 = 924;
  break;
 }
 case 1281:  {
  $0 = 940;
  break;
 }
 case 1282:  {
  $0 = 957;
  break;
 }
 case 1286:  {
  $0 = 978;
  break;
 }
 case 1285:  {
  $0 = 1011;
  break;
 }
 case 1284:  {
  $0 = 1028;
  break;
 }
 case 1283:  {
  $0 = 1047;
  break;
 }
 default: {
  $0 = 1065;
 }
 }
 $3 = $0;
 STACKTOP = sp;return ($3|0);
}
function __Z15VirtualKeyToIntPKc($vkey) {
 $vkey = $vkey|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $mapping = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $1 = $vkey;
 $mapping = 8;
 while(1) {
  $2 = $mapping;
  $3 = HEAP32[$2>>2]|0;
  $4 = ($3|0)!=(0|0);
  if (!($4)) {
   label = 6;
   break;
  }
  $5 = $1;
  $6 = $mapping;
  $7 = HEAP32[$6>>2]|0;
  $8 = (_strcasecmp($5,$7)|0);
  $9 = ($8|0)==(0);
  $10 = $mapping;
  if ($9) {
   label = 4;
   break;
  }
  $13 = ((($10)) + 8|0);
  $mapping = $13;
 }
 if ((label|0) == 4) {
  $11 = ((($10)) + 4|0);
  $12 = HEAP32[$11>>2]|0;
  $0 = $12;
  $14 = $0;
  STACKTOP = sp;return ($14|0);
 }
 else if ((label|0) == 6) {
  $0 = -1;
  $14 = $0;
  STACKTOP = sp;return ($14|0);
 }
 return (0)|0;
}
function _load_game($game_path,$keymap) {
 $game_path = $game_path|0;
 $keymap = $keymap|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0;
 var $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0;
 var $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0;
 var $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $9 = 0, $hex_start = 0, $i = 0, $key_start = 0, $len = 0, $mapping = 0, $mapping_received = 0, $or$cond = 0, $romfile = 0, $sdl_key = 0, $state = 0, $vararg_buffer = 0, $vararg_buffer2 = 0, $vararg_buffer5 = 0;
 var $vararg_ptr8 = 0, $vararg_ptr9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 80|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $vararg_buffer5 = sp + 16|0;
 $vararg_buffer2 = sp + 8|0;
 $vararg_buffer = sp;
 $0 = $game_path;
 $1 = $keymap;
 $state = 5008;
 $2 = $0;
 $3 = (_fopen($2,1081)|0);
 $romfile = $3;
 $4 = $romfile;
 $5 = ($4|0)!=(0|0);
 if (!($5)) {
  STACKTOP = sp;return;
 }
 $6 = $state;
 $7 = ((($6)) + 8|0);
 $8 = $state;
 __ZL19chimp8_clear_screenP10chimp8corePv($7,$8);
 $9 = $state;
 $10 = ((($9)) + 8|0);
 $11 = $romfile;
 (_chimp8_initialize($10,$11)|0);
 $12 = $state;
 $13 = ((($12)) + 8|0);
 $14 = $state;
 _chimp8_set_user_data($13,$14);
 $15 = $state;
 $16 = ((($15)) + 8|0);
 _chimp8_set_clear_screen_cb($16,21);
 $17 = $state;
 $18 = ((($17)) + 8|0);
 _chimp8_set_draw_sprite_cb($18,22);
 $19 = $romfile;
 (_fclose($19)|0);
 $20 = $state;
 $21 = ((($20)) + 22896|0);
 _memset(($21|0),-1,1536)|0;
 $mapping_received = 0;
 $22 = $1;
 $23 = (___strdup($22)|0);
 $mapping = $23;
 $24 = $mapping;
 HEAP32[$vararg_buffer>>2] = $24;
 (_printf(1084,$vararg_buffer)|0);
 $25 = $mapping;
 $26 = (_strlen($25)|0);
 $len = $26;
 $27 = $mapping;
 $hex_start = $27;
 $key_start = 0;
 $i = 0;
 while(1) {
  $28 = $i;
  $29 = $len;
  $30 = ($28|0)<($29|0);
  if (!($30)) {
   break;
  }
  $31 = $i;
  $32 = $mapping;
  $33 = (($32) + ($31)|0);
  $34 = HEAP8[$33>>0]|0;
  $35 = $34 << 24 >> 24;
  $36 = ($35|0)==(58);
  $37 = $i;
  $38 = $mapping;
  $39 = (($38) + ($37)|0);
  do {
   if ($36) {
    HEAP8[$39>>0] = 0;
    $40 = $i;
    $41 = (($40) + 1)|0;
    $42 = $mapping;
    $43 = (($42) + ($41)|0);
    $key_start = $43;
   } else {
    $44 = HEAP8[$39>>0]|0;
    $45 = $44 << 24 >> 24;
    $46 = ($45|0)==(45);
    if (!($46)) {
     $47 = $i;
     $48 = $len;
     $49 = (($48) - 1)|0;
     $50 = ($47|0)==($49|0);
     if (!($50)) {
      break;
     }
    }
    $51 = $i;
    $52 = $len;
    $53 = (($52) - 1)|0;
    $54 = ($51|0)!=($53|0);
    if ($54) {
     $55 = $i;
     $56 = $mapping;
     $57 = (($56) + ($55)|0);
     HEAP8[$57>>0] = 0;
    }
    $58 = $hex_start;
    $59 = ($58|0)!=(0|0);
    $60 = $key_start;
    $61 = ($60|0)!=(0|0);
    $or$cond = $59 & $61;
    do {
     if ($or$cond) {
      $62 = $key_start;
      $63 = (__Z15VirtualKeyToIntPKc($62)|0);
      $sdl_key = $63;
      $64 = $sdl_key;
      $65 = ($64|0)<(0);
      if ($65) {
       $66 = $key_start;
       HEAP32[$vararg_buffer2>>2] = $66;
       (_printf(1097,$vararg_buffer2)|0);
       break;
      } else {
       $67 = $hex_start;
       $68 = $key_start;
       $69 = $sdl_key;
       HEAP32[$vararg_buffer5>>2] = $67;
       $vararg_ptr8 = ((($vararg_buffer5)) + 4|0);
       HEAP32[$vararg_ptr8>>2] = $68;
       $vararg_ptr9 = ((($vararg_buffer5)) + 8|0);
       HEAP32[$vararg_ptr9>>2] = $69;
       (_printf(1114,$vararg_buffer5)|0);
       $70 = $hex_start;
       $71 = (_atoi($70)|0);
       $72 = $71&255;
       $73 = $sdl_key;
       $74 = $state;
       $75 = ((($74)) + 22896|0);
       $76 = (($75) + ($73)|0);
       HEAP8[$76>>0] = $72;
       $mapping_received = 1;
       break;
      }
     }
    } while(0);
    $77 = $i;
    $78 = (($77) + 1)|0;
    $79 = $mapping;
    $80 = (($79) + ($78)|0);
    $hex_start = $80;
    $key_start = 0;
   }
  } while(0);
  $81 = $i;
  $82 = (($81) + 1)|0;
  $i = $82;
 }
 $83 = $mapping_received;
 $84 = $83&1;
 if (!($84)) {
  $85 = $state;
  __ZL24load_default_key_mappingP9MainState($85);
 }
 $86 = $mapping;
 _free($86);
 STACKTOP = sp;return;
}
function __ZL19chimp8_clear_screenP10chimp8corePv($0,$user_data) {
 $0 = $0|0;
 $user_data = $user_data|0;
 var $1 = 0, $10 = 0, $11 = 0, $12 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $err = 0, $state = 0, $vararg_buffer = 0, $vararg_ptr1 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $vararg_buffer = sp;
 $1 = $0;
 $2 = $user_data;
 $3 = $2;
 $state = $3;
 $4 = $state;
 $5 = ((($4)) + 20848|0);
 _memset(($5|0),0,2048)|0;
 $6 = $state;
 $7 = ((($6)) + 20848|0);
 _glTexSubImage2D(3553,0,0,0,64,32,6409,5121,($7|0));
 $8 = (_glGetError()|0);
 $err = $8;
 $9 = $err;
 $10 = ($9|0)!=(0);
 if (!($10)) {
  STACKTOP = sp;return;
 }
 $11 = $err;
 $12 = (__Z18gl_error_to_stringj($11)|0);
 HEAP32[$vararg_buffer>>2] = 320;
 $vararg_ptr1 = ((($vararg_buffer)) + 4|0);
 HEAP32[$vararg_ptr1>>2] = $12;
 (_printf(1667,$vararg_buffer)|0);
 _emscripten_force_exit(1);
 STACKTOP = sp;return;
}
function __ZL18chimp8_draw_spriteP10chimp8corehhhPv($0,$x,$y,$h,$user_data) {
 $0 = $0|0;
 $x = $x|0;
 $y = $y|0;
 $h = $h|0;
 $user_data = $user_data|0;
 var $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0;
 var $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0;
 var $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0;
 var $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0;
 var $82 = 0, $83 = 0, $84 = 0, $85 = 0, $9 = 0, $draw_byte = 0, $err = 0, $ix = 0, $iy = 0, $state = 0, $vararg_buffer = 0, $vararg_ptr1 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $vararg_buffer = sp;
 $draw_byte = sp + 26|0;
 $1 = $0;
 $2 = $x;
 $3 = $y;
 $4 = $h;
 $5 = $user_data;
 $6 = $5;
 $state = $6;
 $iy = 0;
 while(1) {
  $7 = $iy;
  $8 = $7&255;
  $9 = $4;
  $10 = $9&255;
  $11 = ($8|0)<($10|0);
  if (!($11)) {
   break;
  }
  $12 = $3;
  $13 = $12&255;
  $14 = $13 & 31;
  $15 = $14&255;
  $3 = $15;
  $16 = $2;
  $17 = $16&255;
  $18 = $2;
  $19 = $18&255;
  $20 = $19 & 7;
  $21 = (($17) - ($20))|0;
  $22 = $21 & 63;
  $23 = $22&255;
  $ix = $23;
  $24 = $ix;
  $25 = $24&255;
  $26 = $3;
  $27 = $26&255;
  $28 = $27<<6;
  $29 = (($25) + ($28))|0;
  $30 = $state;
  $31 = ((($30)) + 20848|0);
  $32 = (($31) + ($29)|0);
  $33 = $ix;
  $34 = $33&255;
  $35 = $34 >> 3;
  $36 = $3;
  $37 = $36&255;
  $38 = $37<<3;
  $39 = (($35) + ($38))|0;
  $40 = $state;
  $41 = ((($40)) + 8|0);
  $42 = ((($41)) + 4170|0);
  $43 = (($42) + ($39)|0);
  $44 = HEAP8[$43>>0]|0;
  $45 = $ix;
  $46 = $3;
  __ZZL18chimp8_draw_spriteP10chimp8corehhhPvENK3__0clEPhhhh($draw_byte,$32,$44,$45,$46);
  $47 = $ix;
  $48 = $47&255;
  $49 = (($48) + 8)|0;
  $50 = $49 & 63;
  $51 = $50&255;
  $ix = $51;
  $52 = $ix;
  $53 = $52&255;
  $54 = $3;
  $55 = $54&255;
  $56 = $55<<6;
  $57 = (($53) + ($56))|0;
  $58 = $state;
  $59 = ((($58)) + 20848|0);
  $60 = (($59) + ($57)|0);
  $61 = $ix;
  $62 = $61&255;
  $63 = $62 >> 3;
  $64 = $3;
  $65 = $64&255;
  $66 = $65<<3;
  $67 = (($63) + ($66))|0;
  $68 = $state;
  $69 = ((($68)) + 8|0);
  $70 = ((($69)) + 4170|0);
  $71 = (($70) + ($67)|0);
  $72 = HEAP8[$71>>0]|0;
  $73 = $ix;
  $74 = $3;
  __ZZL18chimp8_draw_spriteP10chimp8corehhhPvENK3__0clEPhhhh($draw_byte,$60,$72,$73,$74);
  $75 = $3;
  $76 = (($75) + 1)<<24>>24;
  $3 = $76;
  $77 = $iy;
  $78 = (($77) + 1)<<24>>24;
  $iy = $78;
 }
 $79 = $state;
 $80 = ((($79)) + 20848|0);
 _glTexSubImage2D(3553,0,0,0,64,32,6409,5121,($80|0));
 $81 = (_glGetError()|0);
 $err = $81;
 $82 = $err;
 $83 = ($82|0)!=(0);
 if (!($83)) {
  STACKTOP = sp;return;
 }
 $84 = $err;
 $85 = (__Z18gl_error_to_stringj($84)|0);
 HEAP32[$vararg_buffer>>2] = 347;
 $vararg_ptr1 = ((($vararg_buffer)) + 4|0);
 HEAP32[$vararg_ptr1>>2] = $85;
 (_printf(1667,$vararg_buffer)|0);
 _emscripten_force_exit(1);
 STACKTOP = sp;return;
}
function __ZL24load_default_key_mappingP9MainState($state) {
 $state = $state|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0;
 var $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $state;
 $1 = $0;
 $2 = ((($1)) + 22896|0);
 _memset(($2|0),-1,1536)|0;
 $3 = $0;
 $4 = ((($3)) + 22896|0);
 $5 = ((($4)) + 49|0);
 HEAP8[$5>>0] = 0;
 $6 = $0;
 $7 = ((($6)) + 22896|0);
 $8 = ((($7)) + 50|0);
 HEAP8[$8>>0] = 1;
 $9 = $0;
 $10 = ((($9)) + 22896|0);
 $11 = ((($10)) + 51|0);
 HEAP8[$11>>0] = 2;
 $12 = $0;
 $13 = ((($12)) + 22896|0);
 $14 = ((($13)) + 52|0);
 HEAP8[$14>>0] = 3;
 $15 = $0;
 $16 = ((($15)) + 22896|0);
 $17 = ((($16)) + 113|0);
 HEAP8[$17>>0] = 4;
 $18 = $0;
 $19 = ((($18)) + 22896|0);
 $20 = ((($19)) + 119|0);
 HEAP8[$20>>0] = 5;
 $21 = $0;
 $22 = ((($21)) + 22896|0);
 $23 = ((($22)) + 101|0);
 HEAP8[$23>>0] = 6;
 $24 = $0;
 $25 = ((($24)) + 22896|0);
 $26 = ((($25)) + 114|0);
 HEAP8[$26>>0] = 7;
 $27 = $0;
 $28 = ((($27)) + 22896|0);
 $29 = ((($28)) + 97|0);
 HEAP8[$29>>0] = 8;
 $30 = $0;
 $31 = ((($30)) + 22896|0);
 $32 = ((($31)) + 115|0);
 HEAP8[$32>>0] = 9;
 $33 = $0;
 $34 = ((($33)) + 22896|0);
 $35 = ((($34)) + 100|0);
 HEAP8[$35>>0] = 10;
 $36 = $0;
 $37 = ((($36)) + 22896|0);
 $38 = ((($37)) + 102|0);
 HEAP8[$38>>0] = 11;
 $39 = $0;
 $40 = ((($39)) + 22896|0);
 $41 = ((($40)) + 122|0);
 HEAP8[$41>>0] = 12;
 $42 = $0;
 $43 = ((($42)) + 22896|0);
 $44 = ((($43)) + 120|0);
 HEAP8[$44>>0] = 13;
 $45 = $0;
 $46 = ((($45)) + 22896|0);
 $47 = ((($46)) + 99|0);
 HEAP8[$47>>0] = 14;
 $48 = $0;
 $49 = ((($48)) + 22896|0);
 $50 = ((($49)) + 118|0);
 HEAP8[$50>>0] = 15;
 STACKTOP = sp;return;
}
function _main() {
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $3 = 0, $4 = 0, $5 = 0;
 var $6 = 0, $7 = 0, $8 = 0, $9 = 0, $romfile = 0, $state = 0, $vararg_buffer = 0, $vararg_buffer1 = 0, $vararg_buffer3 = 0, $video_surface = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 48|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $vararg_buffer3 = sp + 16|0;
 $vararg_buffer1 = sp + 8|0;
 $vararg_buffer = sp;
 $0 = 0;
 $state = 5008;
 $1 = $state;
 _memset(($1|0),0,24628)|0;
 (_SDL_Init(32)|0);
 (_SDL_GL_SetAttribute(0,5)|0);
 (_SDL_GL_SetAttribute(1,5)|0);
 (_SDL_GL_SetAttribute(2,5)|0);
 (_SDL_GL_SetAttribute(3,5)|0);
 (_SDL_GL_SetAttribute(6,16)|0);
 (_SDL_GL_SetAttribute(5,1)|0);
 $2 = (_SDL_SetVideoMode(640,320,24,218103809)|0);
 $video_surface = $2;
 $3 = (_fopen(1126,1081)|0);
 $romfile = $3;
 $4 = $romfile;
 $5 = ($4|0)!=(0|0);
 if ($5) {
  $6 = $state;
  $7 = ((($6)) + 8|0);
  $8 = $romfile;
  $9 = (_chimp8_initialize($7,$8)|0);
  $10 = ($9|0)==(0);
  if ($10) {
   $11 = $state;
   $12 = ((($11)) + 8|0);
   $13 = $state;
   _chimp8_set_user_data($12,$13);
   $14 = $state;
   $15 = ((($14)) + 8|0);
   _chimp8_set_clear_screen_cb($15,21);
   $16 = $state;
   $17 = ((($16)) + 8|0);
   _chimp8_set_draw_sprite_cb($17,22);
   (_printf(1142,$vararg_buffer)|0);
   $18 = $state;
   $19 = ((($18)) + 4|0);
   HEAP8[$19>>0] = 1;
  }
  $20 = $romfile;
  (_fclose($20)|0);
 }
 $21 = $state;
 __ZL24load_default_key_mappingP9MainState($21);
 (_printf(1167,$vararg_buffer1)|0);
 $22 = $state;
 __ZL13initialize_glP9MainState($22);
 (_printf(1188,$vararg_buffer3)|0);
 _emscripten_set_main_loop((23|0),0,1);
 $23 = $0;
 STACKTOP = sp;return ($23|0);
}
function __ZL13initialize_glP9MainState($state) {
 $state = $state|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0;
 var $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0;
 var $63 = 0, $7 = 0, $8 = 0, $9 = 0, $err = 0, $err1 = 0, $err2 = 0, $err3 = 0, $err4 = 0, $err5 = 0, $err6 = 0, $err7 = 0, $err8 = 0, $err9 = 0, $vararg_buffer = 0, $vararg_buffer10 = 0, $vararg_buffer14 = 0, $vararg_buffer18 = 0, $vararg_buffer2 = 0, $vararg_buffer22 = 0;
 var $vararg_buffer26 = 0, $vararg_buffer30 = 0, $vararg_buffer34 = 0, $vararg_buffer38 = 0, $vararg_buffer40 = 0, $vararg_buffer6 = 0, $vararg_ptr1 = 0, $vararg_ptr13 = 0, $vararg_ptr17 = 0, $vararg_ptr21 = 0, $vararg_ptr25 = 0, $vararg_ptr29 = 0, $vararg_ptr33 = 0, $vararg_ptr37 = 0, $vararg_ptr5 = 0, $vararg_ptr9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 144|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $vararg_buffer40 = sp + 88|0;
 $vararg_buffer38 = sp + 80|0;
 $vararg_buffer34 = sp + 72|0;
 $vararg_buffer30 = sp + 64|0;
 $vararg_buffer26 = sp + 56|0;
 $vararg_buffer22 = sp + 48|0;
 $vararg_buffer18 = sp + 40|0;
 $vararg_buffer14 = sp + 32|0;
 $vararg_buffer10 = sp + 24|0;
 $vararg_buffer6 = sp + 16|0;
 $vararg_buffer2 = sp + 8|0;
 $vararg_buffer = sp;
 $0 = $state;
 $1 = $0;
 $2 = ((($1)) + 24624|0);
 _glGenBuffers(1,($2|0));
 $3 = (_glGetError()|0);
 $err = $3;
 $4 = $err;
 $5 = ($4|0)!=(0);
 if ($5) {
  $6 = $err;
  $7 = (__Z18gl_error_to_stringj($6)|0);
  HEAP32[$vararg_buffer>>2] = 493;
  $vararg_ptr1 = ((($vararg_buffer)) + 4|0);
  HEAP32[$vararg_ptr1>>2] = $7;
  (_printf(1667,$vararg_buffer)|0);
  _emscripten_force_exit(1);
 }
 $8 = $0;
 $9 = ((($8)) + 24624|0);
 $10 = HEAP32[$9>>2]|0;
 _glBindBuffer(34962,($10|0));
 $11 = (_glGetError()|0);
 $err1 = $11;
 $12 = $err1;
 $13 = ($12|0)!=(0);
 if ($13) {
  $14 = $err1;
  $15 = (__Z18gl_error_to_stringj($14)|0);
  HEAP32[$vararg_buffer2>>2] = 494;
  $vararg_ptr5 = ((($vararg_buffer2)) + 4|0);
  HEAP32[$vararg_ptr5>>2] = $15;
  (_printf(1667,$vararg_buffer2)|0);
  _emscripten_force_exit(1);
 }
 _glBufferData(34962,96,(0|0),35048);
 $16 = (_glGetError()|0);
 $err2 = $16;
 $17 = $err2;
 $18 = ($17|0)!=(0);
 if ($18) {
  $19 = $err2;
  $20 = (__Z18gl_error_to_stringj($19)|0);
  HEAP32[$vararg_buffer6>>2] = 495;
  $vararg_ptr9 = ((($vararg_buffer6)) + 4|0);
  HEAP32[$vararg_ptr9>>2] = $20;
  (_printf(1667,$vararg_buffer6)|0);
  _emscripten_force_exit(1);
 }
 $21 = $0;
 $22 = ((($21)) + 24500|0);
 _glGenTextures(1,($22|0));
 $23 = (_glGetError()|0);
 $err3 = $23;
 $24 = $err3;
 $25 = ($24|0)!=(0);
 if ($25) {
  $26 = $err3;
  $27 = (__Z18gl_error_to_stringj($26)|0);
  HEAP32[$vararg_buffer10>>2] = 497;
  $vararg_ptr13 = ((($vararg_buffer10)) + 4|0);
  HEAP32[$vararg_ptr13>>2] = $27;
  (_printf(1667,$vararg_buffer10)|0);
  _emscripten_force_exit(1);
 }
 $28 = $0;
 $29 = ((($28)) + 24500|0);
 $30 = HEAP32[$29>>2]|0;
 _glBindTexture(3553,($30|0));
 $31 = (_glGetError()|0);
 $err4 = $31;
 $32 = $err4;
 $33 = ($32|0)!=(0);
 if ($33) {
  $34 = $err4;
  $35 = (__Z18gl_error_to_stringj($34)|0);
  HEAP32[$vararg_buffer14>>2] = 498;
  $vararg_ptr17 = ((($vararg_buffer14)) + 4|0);
  HEAP32[$vararg_ptr17>>2] = $35;
  (_printf(1667,$vararg_buffer14)|0);
  _emscripten_force_exit(1);
 }
 _glTexParameterf(3553,10241,9728.0);
 $36 = (_glGetError()|0);
 $err5 = $36;
 $37 = $err5;
 $38 = ($37|0)!=(0);
 if ($38) {
  $39 = $err5;
  $40 = (__Z18gl_error_to_stringj($39)|0);
  HEAP32[$vararg_buffer18>>2] = 499;
  $vararg_ptr21 = ((($vararg_buffer18)) + 4|0);
  HEAP32[$vararg_ptr21>>2] = $40;
  (_printf(1667,$vararg_buffer18)|0);
  _emscripten_force_exit(1);
 }
 _glTexParameterf(3553,10240,9728.0);
 $41 = (_glGetError()|0);
 $err6 = $41;
 $42 = $err6;
 $43 = ($42|0)!=(0);
 if ($43) {
  $44 = $err6;
  $45 = (__Z18gl_error_to_stringj($44)|0);
  HEAP32[$vararg_buffer22>>2] = 500;
  $vararg_ptr25 = ((($vararg_buffer22)) + 4|0);
  HEAP32[$vararg_ptr25>>2] = $45;
  (_printf(1667,$vararg_buffer22)|0);
  _emscripten_force_exit(1);
 }
 _glTexParameteri(3553,10242,10497);
 $46 = (_glGetError()|0);
 $err7 = $46;
 $47 = $err7;
 $48 = ($47|0)!=(0);
 if ($48) {
  $49 = $err7;
  $50 = (__Z18gl_error_to_stringj($49)|0);
  HEAP32[$vararg_buffer26>>2] = 501;
  $vararg_ptr29 = ((($vararg_buffer26)) + 4|0);
  HEAP32[$vararg_ptr29>>2] = $50;
  (_printf(1667,$vararg_buffer26)|0);
  _emscripten_force_exit(1);
 }
 _glTexParameteri(3553,10243,10497);
 $51 = (_glGetError()|0);
 $err8 = $51;
 $52 = $err8;
 $53 = ($52|0)!=(0);
 if ($53) {
  $54 = $err8;
  $55 = (__Z18gl_error_to_stringj($54)|0);
  HEAP32[$vararg_buffer30>>2] = 502;
  $vararg_ptr33 = ((($vararg_buffer30)) + 4|0);
  HEAP32[$vararg_ptr33>>2] = $55;
  (_printf(1667,$vararg_buffer30)|0);
  _emscripten_force_exit(1);
 }
 _glTexImage2D(3553,0,6409,64,32,0,6409,5121,(0|0));
 $56 = (_glGetError()|0);
 $err9 = $56;
 $57 = $err9;
 $58 = ($57|0)!=(0);
 if ($58) {
  $59 = $err9;
  $60 = (__Z18gl_error_to_stringj($59)|0);
  HEAP32[$vararg_buffer34>>2] = 503;
  $vararg_ptr37 = ((($vararg_buffer34)) + 4|0);
  HEAP32[$vararg_ptr37>>2] = $60;
  (_printf(1667,$vararg_buffer34)|0);
  _emscripten_force_exit(1);
 }
 (_printf(1675,$vararg_buffer38)|0);
 $61 = $0;
 $62 = ((($61)) + 24508|0);
 $63 = (__ZL18program_image_initP13Program_image($62)|0);
 if ($63) {
  STACKTOP = sp;return;
 }
 (_printf(1698,$vararg_buffer40)|0);
 STACKTOP = sp;return;
}
function __ZL9main_loopv() {
 var $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0;
 var $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0;
 var $134 = 0, $135 = 0, $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0;
 var $152 = 0, $153 = 0, $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0, $159 = 0, $16 = 0, $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0, $168 = 0, $169 = 0, $17 = 0;
 var $170 = 0, $171 = 0, $172 = 0, $173 = 0, $174 = 0, $175 = 0, $176 = 0, $177 = 0, $178 = 0, $179 = 0, $18 = 0, $180 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0;
 var $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0.0, $36 = 0.0, $37 = 0.0, $38 = 0.0, $39 = 0, $4 = 0, $40 = 0, $41 = 0.0, $42 = 0.0, $43 = 0.0;
 var $44 = 0.0, $45 = 0.0, $46 = 0.0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0;
 var $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0;
 var $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0;
 var $99 = 0, $data = 0, $err = 0, $err1 = 0, $err2 = 0, $err3 = 0, $event = 0, $g = 0.0, $program = 0, $r = 0.0, $ret = 0, $state = 0, $u = 0, $vararg_buffer = 0, $vararg_buffer12 = 0, $vararg_buffer16 = 0, $vararg_buffer2 = 0, $vararg_buffer6 = 0, $vararg_buffer9 = 0, $vararg_ptr1 = 0;
 var $vararg_ptr15 = 0, $vararg_ptr19 = 0, $vararg_ptr5 = 0, dest = 0, label = 0, sp = 0, stop = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 480|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $vararg_buffer16 = sp + 88|0;
 $vararg_buffer12 = sp + 80|0;
 $vararg_buffer9 = sp + 72|0;
 $vararg_buffer6 = sp + 64|0;
 $vararg_buffer2 = sp + 56|0;
 $vararg_buffer = sp + 48|0;
 $event = sp;
 $data = sp + 352|0;
 $0 = sp + 344|0;
 $1 = sp + 336|0;
 $2 = sp + 328|0;
 $3 = sp + 320|0;
 $4 = sp + 312|0;
 $5 = sp + 304|0;
 $6 = sp + 296|0;
 $7 = sp + 288|0;
 $8 = sp + 280|0;
 $9 = sp + 272|0;
 $10 = sp + 264|0;
 $11 = sp + 256|0;
 $u = sp + 168|0;
 $12 = sp + 160|0;
 $13 = sp + 152|0;
 $14 = sp + 136|0;
 $15 = sp + 116|0;
 $16 = sp + 96|0;
 $state = 5008;
 $17 = $state;
 $18 = HEAP32[$17>>2]|0;
 $19 = (($18) + 1)|0;
 HEAP32[$17>>2] = $19;
 L1: while(1) {
  $20 = (_SDL_PollEvent(($event|0))|0);
  $21 = ($20|0)!=(0);
  if (!($21)) {
   break;
  }
  $22 = HEAP32[$event>>2]|0;
  switch ($22|0) {
  case 769:  {
   $23 = $state;
   $24 = ((($23)) + 8|0);
   $25 = ((($event)) + 12|0);
   $26 = ((($25)) + 4|0);
   $27 = HEAP32[$26>>2]|0;
   __ZL12handle_keyupP10chimp8corei($24,$27);
   continue L1;
   break;
  }
  case 768:  {
   $28 = $state;
   $29 = ((($28)) + 8|0);
   $30 = ((($event)) + 12|0);
   $31 = ((($30)) + 4|0);
   $32 = HEAP32[$31>>2]|0;
   __ZL14handle_keydownP10chimp8corei($29,$32);
   continue L1;
   break;
  }
  default: {
   continue L1;
  }
  }
 }
 $33 = $state;
 $34 = HEAP32[$33>>2]|0;
 $35 = (+($34|0));
 $36 = $35 / 60.0;
 $37 = (+Math_sin((+$36)));
 $38 = $37 * 0.40000000596046448;
 $r = $38;
 $39 = $state;
 $40 = HEAP32[$39>>2]|0;
 $41 = (+($40|0));
 $42 = $41 / 60.0;
 $43 = (+Math_cos((+$42)));
 $44 = $43 * 0.40000000596046448;
 $g = $44;
 $45 = $r;
 $46 = $g;
 _glClearColor((+$45),(+$46),0.0,1.0);
 $47 = (_glGetError()|0);
 $err = $47;
 $48 = $err;
 $49 = ($48|0)!=(0);
 if ($49) {
  $50 = $err;
  $51 = (__Z18gl_error_to_stringj($50)|0);
  HEAP32[$vararg_buffer>>2] = 557;
  $vararg_ptr1 = ((($vararg_buffer)) + 4|0);
  HEAP32[$vararg_ptr1>>2] = $51;
  (_printf(1667,$vararg_buffer)|0);
  _emscripten_force_exit(1);
 }
 _glClear(16384);
 $52 = (_glGetError()|0);
 $err1 = $52;
 $53 = $err1;
 $54 = ($53|0)!=(0);
 if ($54) {
  $55 = $err1;
  $56 = (__Z18gl_error_to_stringj($55)|0);
  HEAP32[$vararg_buffer2>>2] = 558;
  $vararg_ptr5 = ((($vararg_buffer2)) + 4|0);
  HEAP32[$vararg_ptr5>>2] = $56;
  (_printf(1667,$vararg_buffer2)|0);
  _emscripten_force_exit(1);
 }
 $57 = $state;
 $58 = ((($57)) + 4|0);
 $59 = HEAP8[$58>>0]|0;
 $60 = $59&1;
 if (!($60)) {
  _SDL_GL_SwapBuffers();
  STACKTOP = sp;return;
 }
 $61 = $state;
 $62 = ((($61)) + 8|0);
 $63 = (_chimp8_update($62,16,24)|0);
 $ret = $63;
 $64 = $state;
 $65 = ((($64)) + 8|0);
 $66 = ((($65)) + 4|0);
 $67 = HEAP8[$66>>0]|0;
 $68 = $67&255;
 $69 = ($68|0)>(0);
 if ($69) {
  $70 = $state;
  $71 = ((($70)) + 8|0);
  $72 = ((($71)) + 4|0);
  $73 = HEAP8[$72>>0]|0;
  $74 = $73&255;
  $75 = (($74) - 1)|0;
  $76 = $75&255;
  HEAP8[$72>>0] = $76;
 }
 $77 = $state;
 $78 = ((($77)) + 8|0);
 $79 = ((($78)) + 5|0);
 $80 = HEAP8[$79>>0]|0;
 $81 = $80&255;
 $82 = ($81|0)>(0);
 if ($82) {
  $83 = $state;
  $84 = ((($83)) + 8|0);
  $85 = ((($84)) + 5|0);
  $86 = HEAP8[$85>>0]|0;
  $87 = $86&255;
  $88 = (($87) - 1)|0;
  $89 = $88&255;
  HEAP8[$85>>0] = $89;
 }
 $90 = $ret;
 $91 = ($90|0)!=(0);
 if ($91) {
  $92 = $ret;
  $93 = (_chimp8_strerror($92)|0);
  HEAP32[$vararg_buffer6>>2] = $93;
  (_printf(2340,$vararg_buffer6)|0);
  $94 = $state;
  $95 = ((($94)) + 8|0);
  $96 = HEAP16[$95>>1]|0;
  $97 = $96&65535;
  $98 = $state;
  $99 = ((($98)) + 8|0);
  $100 = ((($99)) + 42|0);
  $101 = (($100) + ($97)|0);
  $102 = HEAP8[$101>>0]|0;
  $103 = $102&255;
  $104 = $103 << 8;
  $105 = $state;
  $106 = ((($105)) + 8|0);
  $107 = HEAP16[$106>>1]|0;
  $108 = $107&65535;
  $109 = (($108) + 1)|0;
  $110 = $state;
  $111 = ((($110)) + 8|0);
  $112 = ((($111)) + 42|0);
  $113 = (($112) + ($109)|0);
  $114 = HEAP8[$113>>0]|0;
  $115 = $114&255;
  $116 = $104 | $115;
  HEAP32[$vararg_buffer9>>2] = $116;
  (_printf(2358,$vararg_buffer9)|0);
  $117 = $state;
  $118 = ((($117)) + 4|0);
  HEAP8[$118>>0] = 0;
 }
 HEAPF32[$0>>2] = -1.0;
 $119 = ((($0)) + 4|0);
 HEAPF32[$119>>2] = -1.0;
 ;HEAP32[$data>>2]=HEAP32[$0>>2]|0;HEAP32[$data+4>>2]=HEAP32[$0+4>>2]|0;
 $120 = ((($data)) + 16|0);
 HEAPF32[$1>>2] = -1.0;
 $121 = ((($1)) + 4|0);
 HEAPF32[$121>>2] = 1.0;
 ;HEAP32[$120>>2]=HEAP32[$1>>2]|0;HEAP32[$120+4>>2]=HEAP32[$1+4>>2]|0;
 $122 = ((($data)) + 32|0);
 HEAPF32[$2>>2] = 1.0;
 $123 = ((($2)) + 4|0);
 HEAPF32[$123>>2] = -1.0;
 ;HEAP32[$122>>2]=HEAP32[$2>>2]|0;HEAP32[$122+4>>2]=HEAP32[$2+4>>2]|0;
 $124 = ((($data)) + 48|0);
 HEAPF32[$3>>2] = 1.0;
 $125 = ((($3)) + 4|0);
 HEAPF32[$125>>2] = -1.0;
 ;HEAP32[$124>>2]=HEAP32[$3>>2]|0;HEAP32[$124+4>>2]=HEAP32[$3+4>>2]|0;
 $126 = ((($data)) + 64|0);
 HEAPF32[$4>>2] = -1.0;
 $127 = ((($4)) + 4|0);
 HEAPF32[$127>>2] = 1.0;
 ;HEAP32[$126>>2]=HEAP32[$4>>2]|0;HEAP32[$126+4>>2]=HEAP32[$4+4>>2]|0;
 $128 = ((($data)) + 80|0);
 HEAPF32[$5>>2] = 1.0;
 $129 = ((($5)) + 4|0);
 HEAPF32[$129>>2] = 1.0;
 ;HEAP32[$128>>2]=HEAP32[$5>>2]|0;HEAP32[$128+4>>2]=HEAP32[$5+4>>2]|0;
 $130 = ((($data)) + 8|0);
 HEAPF32[$6>>2] = 0.0;
 $131 = ((($6)) + 4|0);
 HEAPF32[$131>>2] = 1.0;
 ;HEAP32[$130>>2]=HEAP32[$6>>2]|0;HEAP32[$130+4>>2]=HEAP32[$6+4>>2]|0;
 $132 = ((($data)) + 16|0);
 $133 = ((($132)) + 8|0);
 HEAPF32[$7>>2] = 0.0;
 $134 = ((($7)) + 4|0);
 HEAPF32[$134>>2] = 0.0;
 ;HEAP32[$133>>2]=HEAP32[$7>>2]|0;HEAP32[$133+4>>2]=HEAP32[$7+4>>2]|0;
 $135 = ((($data)) + 32|0);
 $136 = ((($135)) + 8|0);
 HEAPF32[$8>>2] = 1.0;
 $137 = ((($8)) + 4|0);
 HEAPF32[$137>>2] = 1.0;
 ;HEAP32[$136>>2]=HEAP32[$8>>2]|0;HEAP32[$136+4>>2]=HEAP32[$8+4>>2]|0;
 $138 = ((($data)) + 48|0);
 $139 = ((($138)) + 8|0);
 HEAPF32[$9>>2] = 1.0;
 $140 = ((($9)) + 4|0);
 HEAPF32[$140>>2] = 1.0;
 ;HEAP32[$139>>2]=HEAP32[$9>>2]|0;HEAP32[$139+4>>2]=HEAP32[$9+4>>2]|0;
 $141 = ((($data)) + 64|0);
 $142 = ((($141)) + 8|0);
 HEAPF32[$10>>2] = 0.0;
 $143 = ((($10)) + 4|0);
 HEAPF32[$143>>2] = 0.0;
 ;HEAP32[$142>>2]=HEAP32[$10>>2]|0;HEAP32[$142+4>>2]=HEAP32[$10+4>>2]|0;
 $144 = ((($data)) + 80|0);
 $145 = ((($144)) + 8|0);
 HEAPF32[$11>>2] = 1.0;
 $146 = ((($11)) + 4|0);
 HEAPF32[$146>>2] = 0.0;
 ;HEAP32[$145>>2]=HEAP32[$11>>2]|0;HEAP32[$145+4>>2]=HEAP32[$11+4>>2]|0;
 $147 = $state;
 $148 = ((($147)) + 24624|0);
 $149 = HEAP32[$148>>2]|0;
 _glBindBuffer(34962,($149|0));
 $150 = (_glGetError()|0);
 $err2 = $150;
 $151 = $err2;
 $152 = ($151|0)!=(0);
 if ($152) {
  $153 = $err2;
  $154 = (__Z18gl_error_to_stringj($153)|0);
  HEAP32[$vararg_buffer12>>2] = 595;
  $vararg_ptr15 = ((($vararg_buffer12)) + 4|0);
  HEAP32[$vararg_ptr15>>2] = $154;
  (_printf(1667,$vararg_buffer12)|0);
  _emscripten_force_exit(1);
 }
 _glBufferSubData(34962,0,96,($data|0));
 $155 = (_glGetError()|0);
 $err3 = $155;
 $156 = $err3;
 $157 = ($156|0)!=(0);
 if ($157) {
  $158 = $err3;
  $159 = (__Z18gl_error_to_stringj($158)|0);
  HEAP32[$vararg_buffer16>>2] = 597;
  $vararg_ptr19 = ((($vararg_buffer16)) + 4|0);
  HEAP32[$vararg_ptr19>>2] = $159;
  (_printf(1667,$vararg_buffer16)|0);
  _emscripten_force_exit(1);
 }
 $160 = $state;
 $161 = ((($160)) + 24508|0);
 $program = $161;
 dest=$u; stop=dest+76|0; do { HEAP32[dest>>2]=0|0; dest=dest+4|0; } while ((dest|0) < (stop|0));
 HEAPF32[$12>>2] = 0.0;
 $162 = ((($12)) + 4|0);
 HEAPF32[$162>>2] = 0.0;
 ;HEAP32[$u>>2]=HEAP32[$12>>2]|0;HEAP32[$u+4>>2]=HEAP32[$12+4>>2]|0;
 $163 = ((($u)) + 8|0);
 HEAPF32[$13>>2] = 1.0;
 $164 = ((($13)) + 4|0);
 HEAPF32[$164>>2] = 1.0;
 ;HEAP32[$163>>2]=HEAP32[$13>>2]|0;HEAP32[$163+4>>2]=HEAP32[$13+4>>2]|0;
 $165 = ((($u)) + 16|0);
 HEAP32[$165>>2] = 0;
 $166 = ((($u)) + 20|0);
 HEAPF32[$14>>2] = 1.0;
 $167 = ((($14)) + 4|0);
 HEAPF32[$167>>2] = 1.0;
 $168 = ((($14)) + 8|0);
 HEAPF32[$168>>2] = 1.0;
 $169 = ((($14)) + 12|0);
 HEAPF32[$169>>2] = 1.0;
 ;HEAP32[$166>>2]=HEAP32[$14>>2]|0;HEAP32[$166+4>>2]=HEAP32[$14+4>>2]|0;HEAP32[$166+8>>2]=HEAP32[$14+8>>2]|0;HEAP32[$166+12>>2]=HEAP32[$14+12>>2]|0;
 $170 = ((($u)) + 36|0);
 HEAP32[$15>>2] = 2;
 $171 = ((($15)) + 4|0);
 HEAP32[$171>>2] = 5126;
 $172 = ((($15)) + 8|0);
 HEAP8[$172>>0] = 0;
 $173 = ((($15)) + 12|0);
 HEAP32[$173>>2] = 16;
 $174 = ((($15)) + 16|0);
 HEAP32[$174>>2] = 0;
 ;HEAP32[$170>>2]=HEAP32[$15>>2]|0;HEAP32[$170+4>>2]=HEAP32[$15+4>>2]|0;HEAP32[$170+8>>2]=HEAP32[$15+8>>2]|0;HEAP32[$170+12>>2]=HEAP32[$15+12>>2]|0;HEAP32[$170+16>>2]=HEAP32[$15+16>>2]|0;
 $175 = ((($u)) + 56|0);
 HEAP32[$16>>2] = 2;
 $176 = ((($16)) + 4|0);
 HEAP32[$176>>2] = 5126;
 $177 = ((($16)) + 8|0);
 HEAP8[$177>>0] = 0;
 $178 = ((($16)) + 12|0);
 HEAP32[$178>>2] = 16;
 $179 = ((($16)) + 16|0);
 HEAP32[$179>>2] = ((((((0) + 4|0)))<<1));
 ;HEAP32[$175>>2]=HEAP32[$16>>2]|0;HEAP32[$175+4>>2]=HEAP32[$16+4>>2]|0;HEAP32[$175+8>>2]=HEAP32[$16+8>>2]|0;HEAP32[$175+12>>2]=HEAP32[$16+12>>2]|0;HEAP32[$175+16>>2]=HEAP32[$16+16>>2]|0;
 $180 = $program;
 __ZL18program_image_drawP13Program_imageP13Uniform_imageji($180,$u,4,6);
 _SDL_GL_SwapBuffers();
 STACKTOP = sp;return;
}
function __ZZL18chimp8_draw_spriteP10chimp8corehhhPvENK3__0clEPhhhh($this,$dest,$byte,$x,$y) {
 $this = $this|0;
 $dest = $dest|0;
 $byte = $byte|0;
 $x = $x|0;
 $y = $y|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0;
 var $i = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $this;
 $1 = $dest;
 $2 = $byte;
 $3 = $x;
 $4 = $y;
 $i = 0;
 while(1) {
  $5 = $i;
  $6 = ($5|0)<(8);
  if (!($6)) {
   break;
  }
  $7 = $2;
  $8 = $7&255;
  $9 = $i;
  $10 = $8 >> $9;
  $11 = $10 & 1;
  $12 = ($11*255)|0;
  $13 = $12&255;
  $14 = $i;
  $15 = (7 - ($14))|0;
  $16 = $1;
  $17 = (($16) + ($15)|0);
  HEAP8[$17>>0] = $13;
  $18 = $i;
  $19 = (($18) + 1)|0;
  $i = $19;
 }
 STACKTOP = sp;return;
}
function __ZL18program_image_initP13Program_image($program) {
 $program = $program|0;
 var $$expand_i1_val = 0, $$expand_i1_val69 = 0, $$pre_trunc = 0, $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0;
 var $113 = 0, $114 = 0, $115 = 0, $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0;
 var $131 = 0, $132 = 0, $133 = 0, $134 = 0, $135 = 0, $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0;
 var $15 = 0, $150 = 0, $151 = 0, $152 = 0, $153 = 0, $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0, $159 = 0, $16 = 0, $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0;
 var $168 = 0, $169 = 0, $17 = 0, $170 = 0, $171 = 0, $172 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0;
 var $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0;
 var $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0;
 var $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0;
 var $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, $err = 0, $err1 = 0, $err10 = 0, $err11 = 0;
 var $err12 = 0, $err13 = 0, $err14 = 0, $err15 = 0, $err2 = 0, $err3 = 0, $err4 = 0, $err5 = 0, $err6 = 0, $err7 = 0, $err8 = 0, $err9 = 0, $fragment_src = 0, $vararg_buffer = 0, $vararg_buffer10 = 0, $vararg_buffer14 = 0, $vararg_buffer17 = 0, $vararg_buffer2 = 0, $vararg_buffer21 = 0, $vararg_buffer25 = 0;
 var $vararg_buffer29 = 0, $vararg_buffer32 = 0, $vararg_buffer36 = 0, $vararg_buffer40 = 0, $vararg_buffer44 = 0, $vararg_buffer48 = 0, $vararg_buffer52 = 0, $vararg_buffer56 = 0, $vararg_buffer6 = 0, $vararg_buffer60 = 0, $vararg_buffer64 = 0, $vararg_ptr1 = 0, $vararg_ptr13 = 0, $vararg_ptr20 = 0, $vararg_ptr24 = 0, $vararg_ptr28 = 0, $vararg_ptr35 = 0, $vararg_ptr39 = 0, $vararg_ptr43 = 0, $vararg_ptr47 = 0;
 var $vararg_ptr5 = 0, $vararg_ptr51 = 0, $vararg_ptr55 = 0, $vararg_ptr59 = 0, $vararg_ptr63 = 0, $vararg_ptr67 = 0, $vararg_ptr9 = 0, $vertex_src = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 224|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $vararg_buffer64 = sp + 136|0;
 $vararg_buffer60 = sp + 128|0;
 $vararg_buffer56 = sp + 120|0;
 $vararg_buffer52 = sp + 112|0;
 $vararg_buffer48 = sp + 104|0;
 $vararg_buffer44 = sp + 96|0;
 $vararg_buffer40 = sp + 88|0;
 $vararg_buffer36 = sp + 80|0;
 $vararg_buffer32 = sp + 72|0;
 $vararg_buffer29 = sp + 64|0;
 $vararg_buffer25 = sp + 56|0;
 $vararg_buffer21 = sp + 48|0;
 $vararg_buffer17 = sp + 40|0;
 $vararg_buffer14 = sp + 32|0;
 $vararg_buffer10 = sp + 24|0;
 $vararg_buffer6 = sp + 16|0;
 $vararg_buffer2 = sp + 8|0;
 $vararg_buffer = sp;
 $0 = sp + 220|0;
 $fragment_src = sp + 212|0;
 $vertex_src = sp + 208|0;
 $1 = $program;
 HEAP32[$fragment_src>>2] = 1728;
 HEAP32[$vertex_src>>2] = 1948;
 $2 = (_glCreateProgram()|0);
 $3 = $1;
 $4 = ((($3)) + 4|0);
 HEAP32[$4>>2] = $2;
 $5 = (_glGetError()|0);
 $err = $5;
 $6 = $err;
 $7 = ($6|0)!=(0);
 if ($7) {
  $8 = $err;
  $9 = (__Z18gl_error_to_stringj($8)|0);
  HEAP32[$vararg_buffer>>2] = 410;
  $vararg_ptr1 = ((($vararg_buffer)) + 4|0);
  HEAP32[$vararg_ptr1>>2] = $9;
  (_printf(1667,$vararg_buffer)|0);
  _emscripten_force_exit(1);
 }
 $10 = (_glCreateShader(35632)|0);
 $11 = $1;
 $12 = ((($11)) + 8|0);
 HEAP32[$12>>2] = $10;
 $13 = (_glGetError()|0);
 $err1 = $13;
 $14 = $err1;
 $15 = ($14|0)!=(0);
 if ($15) {
  $16 = $err1;
  $17 = (__Z18gl_error_to_stringj($16)|0);
  HEAP32[$vararg_buffer2>>2] = 411;
  $vararg_ptr5 = ((($vararg_buffer2)) + 4|0);
  HEAP32[$vararg_ptr5>>2] = $17;
  (_printf(1667,$vararg_buffer2)|0);
  _emscripten_force_exit(1);
 }
 $18 = $1;
 $19 = ((($18)) + 8|0);
 $20 = HEAP32[$19>>2]|0;
 _glShaderSource(($20|0),1,($fragment_src|0),(0|0));
 $21 = (_glGetError()|0);
 $err2 = $21;
 $22 = $err2;
 $23 = ($22|0)!=(0);
 if ($23) {
  $24 = $err2;
  $25 = (__Z18gl_error_to_stringj($24)|0);
  HEAP32[$vararg_buffer6>>2] = 412;
  $vararg_ptr9 = ((($vararg_buffer6)) + 4|0);
  HEAP32[$vararg_ptr9>>2] = $25;
  (_printf(1667,$vararg_buffer6)|0);
  _emscripten_force_exit(1);
 }
 $26 = $1;
 $27 = ((($26)) + 8|0);
 $28 = HEAP32[$27>>2]|0;
 _glCompileShader(($28|0));
 $29 = (_glGetError()|0);
 $err3 = $29;
 $30 = $err3;
 $31 = ($30|0)!=(0);
 if ($31) {
  $32 = $err3;
  $33 = (__Z18gl_error_to_stringj($32)|0);
  HEAP32[$vararg_buffer10>>2] = 413;
  $vararg_ptr13 = ((($vararg_buffer10)) + 4|0);
  HEAP32[$vararg_ptr13>>2] = $33;
  (_printf(1667,$vararg_buffer10)|0);
  _emscripten_force_exit(1);
 }
 $34 = $1;
 $35 = ((($34)) + 8|0);
 $36 = HEAP32[$35>>2]|0;
 $37 = (__ZL17check_compilationj($36)|0);
 do {
  if ($37) {
   $40 = (_glCreateShader(35633)|0);
   $41 = $1;
   $42 = ((($41)) + 12|0);
   HEAP32[$42>>2] = $40;
   $43 = (_glGetError()|0);
   $err4 = $43;
   $44 = $err4;
   $45 = ($44|0)!=(0);
   if ($45) {
    $46 = $err4;
    $47 = (__Z18gl_error_to_stringj($46)|0);
    HEAP32[$vararg_buffer17>>2] = 415;
    $vararg_ptr20 = ((($vararg_buffer17)) + 4|0);
    HEAP32[$vararg_ptr20>>2] = $47;
    (_printf(1667,$vararg_buffer17)|0);
    _emscripten_force_exit(1);
   }
   $48 = $1;
   $49 = ((($48)) + 12|0);
   $50 = HEAP32[$49>>2]|0;
   _glShaderSource(($50|0),1,($vertex_src|0),(0|0));
   $51 = (_glGetError()|0);
   $err5 = $51;
   $52 = $err5;
   $53 = ($52|0)!=(0);
   if ($53) {
    $54 = $err5;
    $55 = (__Z18gl_error_to_stringj($54)|0);
    HEAP32[$vararg_buffer21>>2] = 416;
    $vararg_ptr24 = ((($vararg_buffer21)) + 4|0);
    HEAP32[$vararg_ptr24>>2] = $55;
    (_printf(1667,$vararg_buffer21)|0);
    _emscripten_force_exit(1);
   }
   $56 = $1;
   $57 = ((($56)) + 12|0);
   $58 = HEAP32[$57>>2]|0;
   _glCompileShader(($58|0));
   $59 = (_glGetError()|0);
   $err6 = $59;
   $60 = $err6;
   $61 = ($60|0)!=(0);
   if ($61) {
    $62 = $err6;
    $63 = (__Z18gl_error_to_stringj($62)|0);
    HEAP32[$vararg_buffer25>>2] = 417;
    $vararg_ptr28 = ((($vararg_buffer25)) + 4|0);
    HEAP32[$vararg_ptr28>>2] = $63;
    (_printf(1667,$vararg_buffer25)|0);
    _emscripten_force_exit(1);
   }
   $64 = $1;
   $65 = ((($64)) + 12|0);
   $66 = HEAP32[$65>>2]|0;
   $67 = (__ZL17check_compilationj($66)|0);
   if (!($67)) {
    $68 = HEAP32[172]|0;
    $69 = HEAP32[$vertex_src>>2]|0;
    HEAP32[$vararg_buffer29>>2] = $69;
    (_fprintf($68,2230,$vararg_buffer29)|0);
    break;
   }
   $70 = $1;
   $71 = ((($70)) + 4|0);
   $72 = HEAP32[$71>>2]|0;
   $73 = $1;
   $74 = ((($73)) + 12|0);
   $75 = HEAP32[$74>>2]|0;
   _glAttachShader(($72|0),($75|0));
   $76 = (_glGetError()|0);
   $err7 = $76;
   $77 = $err7;
   $78 = ($77|0)!=(0);
   if ($78) {
    $79 = $err7;
    $80 = (__Z18gl_error_to_stringj($79)|0);
    HEAP32[$vararg_buffer32>>2] = 419;
    $vararg_ptr35 = ((($vararg_buffer32)) + 4|0);
    HEAP32[$vararg_ptr35>>2] = $80;
    (_printf(1667,$vararg_buffer32)|0);
    _emscripten_force_exit(1);
   }
   $81 = $1;
   $82 = ((($81)) + 4|0);
   $83 = HEAP32[$82>>2]|0;
   $84 = $1;
   $85 = ((($84)) + 8|0);
   $86 = HEAP32[$85>>2]|0;
   _glAttachShader(($83|0),($86|0));
   $87 = (_glGetError()|0);
   $err8 = $87;
   $88 = $err8;
   $89 = ($88|0)!=(0);
   if ($89) {
    $90 = $err8;
    $91 = (__Z18gl_error_to_stringj($90)|0);
    HEAP32[$vararg_buffer36>>2] = 420;
    $vararg_ptr39 = ((($vararg_buffer36)) + 4|0);
    HEAP32[$vararg_ptr39>>2] = $91;
    (_printf(1667,$vararg_buffer36)|0);
    _emscripten_force_exit(1);
   }
   $92 = $1;
   $93 = ((($92)) + 4|0);
   $94 = HEAP32[$93>>2]|0;
   _glLinkProgram(($94|0));
   $95 = (_glGetError()|0);
   $err9 = $95;
   $96 = $err9;
   $97 = ($96|0)!=(0);
   if ($97) {
    $98 = $err9;
    $99 = (__Z18gl_error_to_stringj($98)|0);
    HEAP32[$vararg_buffer40>>2] = 421;
    $vararg_ptr43 = ((($vararg_buffer40)) + 4|0);
    HEAP32[$vararg_ptr43>>2] = $99;
    (_printf(1667,$vararg_buffer40)|0);
    _emscripten_force_exit(1);
   }
   $100 = $1;
   $101 = ((($100)) + 4|0);
   $102 = HEAP32[$101>>2]|0;
   $103 = (__ZL13check_linkingj($102)|0);
   if ($103) {
    $104 = $1;
    $105 = ((($104)) + 4|0);
    $106 = HEAP32[$105>>2]|0;
    $107 = (_glGetUniformLocation(($106|0),(2234|0))|0);
    $108 = $1;
    $109 = ((($108)) + 16|0);
    HEAP32[$109>>2] = $107;
    $110 = (_glGetError()|0);
    $err10 = $110;
    $111 = $err10;
    $112 = ($111|0)!=(0);
    if ($112) {
     $113 = $err10;
     $114 = (__Z18gl_error_to_stringj($113)|0);
     HEAP32[$vararg_buffer44>>2] = 423;
     $vararg_ptr47 = ((($vararg_buffer44)) + 4|0);
     HEAP32[$vararg_ptr47>>2] = $114;
     (_printf(1667,$vararg_buffer44)|0);
     _emscripten_force_exit(1);
    }
    $115 = $1;
    $116 = ((($115)) + 4|0);
    $117 = HEAP32[$116>>2]|0;
    $118 = (_glGetUniformLocation(($117|0),(2243|0))|0);
    $119 = $1;
    $120 = ((($119)) + 20|0);
    HEAP32[$120>>2] = $118;
    $121 = (_glGetError()|0);
    $err11 = $121;
    $122 = $err11;
    $123 = ($122|0)!=(0);
    if ($123) {
     $124 = $err11;
     $125 = (__Z18gl_error_to_stringj($124)|0);
     HEAP32[$vararg_buffer48>>2] = 424;
     $vararg_ptr51 = ((($vararg_buffer48)) + 4|0);
     HEAP32[$vararg_ptr51>>2] = $125;
     (_printf(1667,$vararg_buffer48)|0);
     _emscripten_force_exit(1);
    }
    $126 = $1;
    $127 = ((($126)) + 4|0);
    $128 = HEAP32[$127>>2]|0;
    $129 = (_glGetAttribLocation(($128|0),(2251|0))|0);
    $130 = $1;
    $131 = ((($130)) + 24|0);
    HEAP32[$131>>2] = $129;
    $132 = (_glGetError()|0);
    $err12 = $132;
    $133 = $err12;
    $134 = ($133|0)!=(0);
    if ($134) {
     $135 = $err12;
     $136 = (__Z18gl_error_to_stringj($135)|0);
     HEAP32[$vararg_buffer52>>2] = 425;
     $vararg_ptr55 = ((($vararg_buffer52)) + 4|0);
     HEAP32[$vararg_ptr55>>2] = $136;
     (_printf(1667,$vararg_buffer52)|0);
     _emscripten_force_exit(1);
    }
    $137 = $1;
    $138 = ((($137)) + 4|0);
    $139 = HEAP32[$138>>2]|0;
    $140 = (_glGetAttribLocation(($139|0),(2262|0))|0);
    $141 = $1;
    $142 = ((($141)) + 28|0);
    HEAP32[$142>>2] = $140;
    $143 = (_glGetError()|0);
    $err13 = $143;
    $144 = $err13;
    $145 = ($144|0)!=(0);
    if ($145) {
     $146 = $err13;
     $147 = (__Z18gl_error_to_stringj($146)|0);
     HEAP32[$vararg_buffer56>>2] = 426;
     $vararg_ptr59 = ((($vararg_buffer56)) + 4|0);
     HEAP32[$vararg_ptr59>>2] = $147;
     (_printf(1667,$vararg_buffer56)|0);
     _emscripten_force_exit(1);
    }
    $148 = $1;
    $149 = ((($148)) + 4|0);
    $150 = HEAP32[$149>>2]|0;
    $151 = (_glGetUniformLocation(($150|0),(2273|0))|0);
    $152 = $1;
    $153 = ((($152)) + 32|0);
    HEAP32[$153>>2] = $151;
    $154 = (_glGetError()|0);
    $err14 = $154;
    $155 = $err14;
    $156 = ($155|0)!=(0);
    if ($156) {
     $157 = $err14;
     $158 = (__Z18gl_error_to_stringj($157)|0);
     HEAP32[$vararg_buffer60>>2] = 427;
     $vararg_ptr63 = ((($vararg_buffer60)) + 4|0);
     HEAP32[$vararg_ptr63>>2] = $158;
     (_printf(1667,$vararg_buffer60)|0);
     _emscripten_force_exit(1);
    }
    $159 = $1;
    $160 = ((($159)) + 4|0);
    $161 = HEAP32[$160>>2]|0;
    $162 = (_glGetUniformLocation(($161|0),(2283|0))|0);
    $163 = $1;
    $164 = ((($163)) + 36|0);
    HEAP32[$164>>2] = $162;
    $165 = (_glGetError()|0);
    $err15 = $165;
    $166 = $err15;
    $167 = ($166|0)!=(0);
    if ($167) {
     $168 = $err15;
     $169 = (__Z18gl_error_to_stringj($168)|0);
     HEAP32[$vararg_buffer64>>2] = 428;
     $vararg_ptr67 = ((($vararg_buffer64)) + 4|0);
     HEAP32[$vararg_ptr67>>2] = $169;
     (_printf(1667,$vararg_buffer64)|0);
     _emscripten_force_exit(1);
    }
    $170 = $1;
    HEAP8[$170>>0] = 1;
    $$expand_i1_val = 1;
    HEAP8[$0>>0] = $$expand_i1_val;
    $$pre_trunc = HEAP8[$0>>0]|0;
    $172 = $$pre_trunc&1;
    STACKTOP = sp;return ($172|0);
   }
  } else {
   $38 = HEAP32[172]|0;
   $39 = HEAP32[$fragment_src>>2]|0;
   HEAP32[$vararg_buffer14>>2] = $39;
   (_fprintf($38,2230,$vararg_buffer14)|0);
  }
 } while(0);
 $171 = $1;
 __ZL20program_image_uninitP13Program_image($171);
 $$expand_i1_val69 = 0;
 HEAP8[$0>>0] = $$expand_i1_val69;
 $$pre_trunc = HEAP8[$0>>0]|0;
 $172 = $$pre_trunc&1;
 STACKTOP = sp;return ($172|0);
}
function __ZL17check_compilationj($shader_id) {
 $shader_id = $shader_id|0;
 var $$expand_i1_val = 0, $$expand_i1_val4 = 0, $$pre_trunc = 0, $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $buf = 0, $compile_status = 0, $vararg_buffer = 0, $vararg_buffer1 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16416|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $vararg_buffer1 = sp + 8|0;
 $vararg_buffer = sp;
 $0 = sp + 16408|0;
 $compile_status = sp + 12|0;
 $buf = sp + 24|0;
 $1 = $shader_id;
 $2 = $1;
 _glGetShaderiv(($2|0),35713,($compile_status|0));
 $3 = HEAP32[$compile_status>>2]|0;
 $4 = ($3|0)!=(1);
 if ($4) {
  $5 = $1;
  _glGetShaderInfoLog(($5|0),16384,(0|0),($buf|0));
  $6 = HEAP32[172]|0;
  (_fprintf($6,2291,$vararg_buffer)|0);
  $7 = HEAP32[172]|0;
  HEAP32[$vararg_buffer1>>2] = $buf;
  (_fprintf($7,2230,$vararg_buffer1)|0);
  $$expand_i1_val = 0;
  HEAP8[$0>>0] = $$expand_i1_val;
  $$pre_trunc = HEAP8[$0>>0]|0;
  $8 = $$pre_trunc&1;
  STACKTOP = sp;return ($8|0);
 } else {
  $$expand_i1_val4 = 1;
  HEAP8[$0>>0] = $$expand_i1_val4;
  $$pre_trunc = HEAP8[$0>>0]|0;
  $8 = $$pre_trunc&1;
  STACKTOP = sp;return ($8|0);
 }
 return (0)|0;
}
function __ZL13check_linkingj($program_id) {
 $program_id = $program_id|0;
 var $$expand_i1_val = 0, $$expand_i1_val4 = 0, $$pre_trunc = 0, $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $buf = 0, $link_status = 0, $vararg_buffer = 0, $vararg_buffer1 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16416|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $vararg_buffer1 = sp + 8|0;
 $vararg_buffer = sp;
 $0 = sp + 16408|0;
 $link_status = sp + 12|0;
 $buf = sp + 24|0;
 $1 = $program_id;
 $2 = $1;
 _glGetProgramiv(($2|0),35714,($link_status|0));
 $3 = HEAP32[$link_status>>2]|0;
 $4 = ($3|0)!=(1);
 if ($4) {
  $5 = $1;
  _glGetProgramInfoLog(($5|0),16384,(0|0),($buf|0));
  $6 = HEAP32[172]|0;
  (_fprintf($6,2317,$vararg_buffer)|0);
  $7 = HEAP32[172]|0;
  HEAP32[$vararg_buffer1>>2] = $buf;
  (_fprintf($7,2230,$vararg_buffer1)|0);
  $$expand_i1_val = 0;
  HEAP8[$0>>0] = $$expand_i1_val;
  $$pre_trunc = HEAP8[$0>>0]|0;
  $8 = $$pre_trunc&1;
  STACKTOP = sp;return ($8|0);
 } else {
  $$expand_i1_val4 = 1;
  HEAP8[$0>>0] = $$expand_i1_val4;
  $$pre_trunc = HEAP8[$0>>0]|0;
  $8 = $$pre_trunc&1;
  STACKTOP = sp;return ($8|0);
 }
 return (0)|0;
}
function __ZL20program_image_uninitP13Program_image($program) {
 $program = $program|0;
 var $0 = 0, $1 = 0, $10 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $program;
 $1 = $0;
 $2 = ((($1)) + 12|0);
 $3 = HEAP32[$2>>2]|0;
 _glDeleteShader(($3|0));
 $4 = $0;
 $5 = ((($4)) + 8|0);
 $6 = HEAP32[$5>>2]|0;
 _glDeleteShader(($6|0));
 $7 = $0;
 $8 = ((($7)) + 4|0);
 $9 = HEAP32[$8>>2]|0;
 _glDeleteProgram(($9|0));
 $10 = $0;
 HEAP8[$10>>0] = 0;
 STACKTOP = sp;return;
}
function __ZL12handle_keyupP10chimp8corei($core,$key) {
 $core = $core|0;
 $key = $key|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $hexkey = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $core;
 $1 = $key;
 $2 = $1;
 $3 = (__ZL11get_hex_keyi($2)|0);
 $hexkey = $3;
 $4 = $hexkey;
 $5 = $4&255;
 $6 = ($5|0)!=(255);
 if ($6) {
  $7 = $hexkey;
  $8 = $7&255;
  $9 = $0;
  $10 = ((($9)) + 8|0);
  $11 = (($10) + ($8)|0);
  HEAP8[$11>>0] = 0;
 }
 $12 = $0;
 $13 = ((($12)) + 20836|0);
 HEAP8[$13>>0] = 1;
 STACKTOP = sp;return;
}
function __ZL14handle_keydownP10chimp8corei($core,$key) {
 $core = $core|0;
 $key = $key|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0;
 var $hexkey = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $core;
 $1 = $key;
 $2 = $1;
 $3 = (__ZL11get_hex_keyi($2)|0);
 $hexkey = $3;
 $4 = $hexkey;
 $5 = $4&255;
 $6 = ($5|0)!=(255);
 if (!($6)) {
  STACKTOP = sp;return;
 }
 $7 = $hexkey;
 $8 = $7&255;
 $9 = $0;
 $10 = ((($9)) + 8|0);
 $11 = (($10) + ($8)|0);
 HEAP8[$11>>0] = 1;
 $12 = $0;
 $13 = ((($12)) + 7|0);
 $14 = HEAP8[$13>>0]|0;
 $15 = $14&255;
 $16 = ($15|0)==(254);
 if (!($16)) {
  STACKTOP = sp;return;
 }
 $17 = $hexkey;
 $18 = $0;
 $19 = ((($18)) + 7|0);
 HEAP8[$19>>0] = $17;
 STACKTOP = sp;return;
}
function __ZL18program_image_drawP13Program_imageP13Uniform_imageji($program,$uniform,$mode,$count) {
 $program = $program|0;
 $uniform = $uniform|0;
 $mode = $mode|0;
 $count = $count|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0;
 var $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0;
 var $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $8 = 0, $9 = 0, $err = 0, $err1 = 0, $err2 = 0, $vararg_buffer = 0, $vararg_buffer2 = 0, $vararg_buffer6 = 0, $vararg_ptr1 = 0, $vararg_ptr5 = 0, $vararg_ptr9 = 0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 64|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $vararg_buffer6 = sp + 16|0;
 $vararg_buffer2 = sp + 8|0;
 $vararg_buffer = sp;
 $0 = $program;
 $1 = $uniform;
 $2 = $mode;
 $3 = $count;
 $4 = $0;
 $5 = ((($4)) + 4|0);
 $6 = HEAP32[$5>>2]|0;
 __ZL18render_use_programj($6);
 $7 = $0;
 $8 = ((($7)) + 24|0);
 $9 = HEAP32[$8>>2]|0;
 $10 = $1;
 $11 = ((($10)) + 36|0);
 $12 = HEAP32[$11>>2]|0;
 $13 = $1;
 $14 = ((($13)) + 36|0);
 $15 = ((($14)) + 4|0);
 $16 = HEAP32[$15>>2]|0;
 $17 = $1;
 $18 = ((($17)) + 36|0);
 $19 = ((($18)) + 8|0);
 $20 = HEAP8[$19>>0]|0;
 $21 = $1;
 $22 = ((($21)) + 36|0);
 $23 = ((($22)) + 12|0);
 $24 = HEAP32[$23>>2]|0;
 $25 = $1;
 $26 = ((($25)) + 36|0);
 $27 = ((($26)) + 16|0);
 $28 = HEAP32[$27>>2]|0;
 _glVertexAttribPointer(($9|0),($12|0),($16|0),($20|0),($24|0),($28|0));
 $29 = (_glGetError()|0);
 $err = $29;
 $30 = $err;
 $31 = ($30|0)!=(0);
 if ($31) {
  $32 = $err;
  $33 = (__Z18gl_error_to_stringj($32)|0);
  HEAP32[$vararg_buffer>>2] = 483;
  $vararg_ptr1 = ((($vararg_buffer)) + 4|0);
  HEAP32[$vararg_ptr1>>2] = $33;
  (_printf(1667,$vararg_buffer)|0);
  _emscripten_force_exit(1);
 }
 $34 = $0;
 $35 = ((($34)) + 28|0);
 $36 = HEAP32[$35>>2]|0;
 $37 = $1;
 $38 = ((($37)) + 56|0);
 $39 = HEAP32[$38>>2]|0;
 $40 = $1;
 $41 = ((($40)) + 56|0);
 $42 = ((($41)) + 4|0);
 $43 = HEAP32[$42>>2]|0;
 $44 = $1;
 $45 = ((($44)) + 56|0);
 $46 = ((($45)) + 8|0);
 $47 = HEAP8[$46>>0]|0;
 $48 = $1;
 $49 = ((($48)) + 56|0);
 $50 = ((($49)) + 12|0);
 $51 = HEAP32[$50>>2]|0;
 $52 = $1;
 $53 = ((($52)) + 56|0);
 $54 = ((($53)) + 16|0);
 $55 = HEAP32[$54>>2]|0;
 _glVertexAttribPointer(($36|0),($39|0),($43|0),($47|0),($51|0),($55|0));
 $56 = (_glGetError()|0);
 $err1 = $56;
 $57 = $err1;
 $58 = ($57|0)!=(0);
 if ($58) {
  $59 = $err1;
  $60 = (__Z18gl_error_to_stringj($59)|0);
  HEAP32[$vararg_buffer2>>2] = 484;
  $vararg_ptr5 = ((($vararg_buffer2)) + 4|0);
  HEAP32[$vararg_ptr5>>2] = $60;
  (_printf(1667,$vararg_buffer2)|0);
  _emscripten_force_exit(1);
 }
 $61 = $0;
 $62 = $1;
 __ZL26program_image_set_uniformsP13Program_imageP13Uniform_image($61,$62);
 $63 = $0;
 __ZL25program_image_before_drawP13Program_image($63);
 $64 = $2;
 $65 = $3;
 _glDrawArrays(($64|0),0,($65|0));
 $66 = (_glGetError()|0);
 $err2 = $66;
 $67 = $err2;
 $68 = ($67|0)!=(0);
 if (!($68)) {
  STACKTOP = sp;return;
 }
 $69 = $err2;
 $70 = (__Z18gl_error_to_stringj($69)|0);
 HEAP32[$vararg_buffer6>>2] = 487;
 $vararg_ptr9 = ((($vararg_buffer6)) + 4|0);
 HEAP32[$vararg_ptr9>>2] = $70;
 (_printf(1667,$vararg_buffer6)|0);
 _emscripten_force_exit(1);
 STACKTOP = sp;return;
}
function __ZL11get_hex_keyi($key) {
 $key = $key|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $state = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $key;
 $state = 5008;
 $1 = $0;
 $2 = $state;
 $3 = ((($2)) + 22896|0);
 $4 = (($3) + ($1)|0);
 $5 = HEAP8[$4>>0]|0;
 STACKTOP = sp;return ($5|0);
}
function __ZL18render_use_programj($program) {
 $program = $program|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $err = 0, $state = 0, $vararg_buffer = 0, $vararg_ptr1 = 0, label = 0;
 var sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $vararg_buffer = sp;
 $0 = $program;
 $state = 5008;
 $1 = $state;
 $2 = ((($1)) + 24504|0);
 $3 = HEAP32[$2>>2]|0;
 $4 = $0;
 $5 = ($3|0)!=($4|0);
 if (!($5)) {
  STACKTOP = sp;return;
 }
 $6 = $0;
 _glUseProgram(($6|0));
 $7 = (_glGetError()|0);
 $err = $7;
 $8 = $err;
 $9 = ($8|0)!=(0);
 if ($9) {
  $10 = $err;
  $11 = (__Z18gl_error_to_stringj($10)|0);
  HEAP32[$vararg_buffer>>2] = 305;
  $vararg_ptr1 = ((($vararg_buffer)) + 4|0);
  HEAP32[$vararg_ptr1>>2] = $11;
  (_printf(1667,$vararg_buffer)|0);
  _emscripten_force_exit(1);
 }
 $12 = $0;
 $13 = $state;
 $14 = ((($13)) + 24504|0);
 HEAP32[$14>>2] = $12;
 STACKTOP = sp;return;
}
function __ZL26program_image_set_uniformsP13Program_imageP13Uniform_image($program,$uniforms) {
 $program = $program|0;
 $uniforms = $uniforms|0;
 var $0 = 0, $1 = 0, $10 = 0.0, $11 = 0, $12 = 0, $13 = 0.0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0.0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0.0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0;
 var $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0;
 var $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0.0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0.0, $74 = 0, $75 = 0, $76 = 0, $77 = 0.0, $78 = 0, $79 = 0, $8 = 0, $80 = 0;
 var $81 = 0.0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $program;
 $1 = $uniforms;
 $2 = $0;
 $3 = ((($2)) + 40|0);
 $4 = $1;
 $5 = (__ZNK4Vec2neERKS_($3,$4)|0);
 if ($5) {
  $6 = $0;
  $7 = ((($6)) + 16|0);
  $8 = HEAP32[$7>>2]|0;
  $9 = $1;
  $10 = +HEAPF32[$9>>2];
  $11 = $1;
  $12 = ((($11)) + 4|0);
  $13 = +HEAPF32[$12>>2];
  _glUniform2f(($8|0),(+$10),(+$13));
  $14 = $0;
  $15 = ((($14)) + 40|0);
  $16 = $1;
  ;HEAP32[$15>>2]=HEAP32[$16>>2]|0;HEAP32[$15+4>>2]=HEAP32[$16+4>>2]|0;
 }
 $17 = $0;
 $18 = ((($17)) + 40|0);
 $19 = ((($18)) + 8|0);
 $20 = $1;
 $21 = ((($20)) + 8|0);
 $22 = (__ZNK4Vec2neERKS_($19,$21)|0);
 if ($22) {
  $23 = $0;
  $24 = ((($23)) + 20|0);
  $25 = HEAP32[$24>>2]|0;
  $26 = $1;
  $27 = ((($26)) + 8|0);
  $28 = +HEAPF32[$27>>2];
  $29 = $1;
  $30 = ((($29)) + 8|0);
  $31 = ((($30)) + 4|0);
  $32 = +HEAPF32[$31>>2];
  _glUniform2f(($25|0),(+$28),(+$32));
  $33 = $0;
  $34 = ((($33)) + 40|0);
  $35 = ((($34)) + 8|0);
  $36 = $1;
  $37 = ((($36)) + 8|0);
  ;HEAP32[$35>>2]=HEAP32[$37>>2]|0;HEAP32[$35+4>>2]=HEAP32[$37+4>>2]|0;
 }
 $38 = $0;
 $39 = ((($38)) + 40|0);
 $40 = ((($39)) + 16|0);
 $41 = HEAP32[$40>>2]|0;
 $42 = $1;
 $43 = ((($42)) + 16|0);
 $44 = HEAP32[$43>>2]|0;
 $45 = ($41|0)!=($44|0);
 if ($45) {
  $46 = $0;
  $47 = ((($46)) + 32|0);
  $48 = HEAP32[$47>>2]|0;
  $49 = $1;
  $50 = ((($49)) + 16|0);
  $51 = HEAP32[$50>>2]|0;
  _glUniform1i(($48|0),($51|0));
  $52 = $1;
  $53 = ((($52)) + 16|0);
  $54 = HEAP32[$53>>2]|0;
  $55 = $0;
  $56 = ((($55)) + 40|0);
  $57 = ((($56)) + 16|0);
  HEAP32[$57>>2] = $54;
 }
 $58 = $0;
 $59 = ((($58)) + 40|0);
 $60 = ((($59)) + 20|0);
 $61 = $1;
 $62 = ((($61)) + 20|0);
 $63 = (__ZNK4Vec4neERKS_($60,$62)|0);
 if (!($63)) {
  STACKTOP = sp;return;
 }
 $64 = $0;
 $65 = ((($64)) + 36|0);
 $66 = HEAP32[$65>>2]|0;
 $67 = $1;
 $68 = ((($67)) + 20|0);
 $69 = +HEAPF32[$68>>2];
 $70 = $1;
 $71 = ((($70)) + 20|0);
 $72 = ((($71)) + 4|0);
 $73 = +HEAPF32[$72>>2];
 $74 = $1;
 $75 = ((($74)) + 20|0);
 $76 = ((($75)) + 8|0);
 $77 = +HEAPF32[$76>>2];
 $78 = $1;
 $79 = ((($78)) + 20|0);
 $80 = ((($79)) + 12|0);
 $81 = +HEAPF32[$80>>2];
 _glUniform4f(($66|0),(+$69),(+$73),(+$77),(+$81));
 $82 = $0;
 $83 = ((($82)) + 40|0);
 $84 = ((($83)) + 20|0);
 $85 = $1;
 $86 = ((($85)) + 20|0);
 ;HEAP32[$84>>2]=HEAP32[$86>>2]|0;HEAP32[$84+4>>2]=HEAP32[$86+4>>2]|0;HEAP32[$84+8>>2]=HEAP32[$86+8>>2]|0;HEAP32[$84+12>>2]=HEAP32[$86+12>>2]|0;
 STACKTOP = sp;return;
}
function __ZL25program_image_before_drawP13Program_image($program) {
 $program = $program|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $ids = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $ids = sp;
 $0 = $program;
 $1 = $0;
 $2 = ((($1)) + 24|0);
 $3 = HEAP32[$2>>2]|0;
 HEAP32[$ids>>2] = $3;
 $4 = ((($ids)) + 4|0);
 $5 = $0;
 $6 = ((($5)) + 28|0);
 $7 = HEAP32[$6>>2]|0;
 HEAP32[$4>>2] = $7;
 $8 = ((($4)) + 4|0);
 HEAP32[$8>>2] = 0;
 __ZL27render_enable_attrib_arraysPji($ids,2);
 STACKTOP = sp;return;
}
function __ZNK4Vec2neERKS_($this,$rhs) {
 $this = $this|0;
 $rhs = $rhs|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0.0, $12 = 0, $13 = 0, $2 = 0, $3 = 0.0, $4 = 0, $5 = 0.0, $6 = 0, $7 = 0, $8 = 0.0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $this;
 $1 = $rhs;
 $2 = $0;
 $3 = +HEAPF32[$2>>2];
 $4 = $1;
 $5 = +HEAPF32[$4>>2];
 $6 = $3 != $5;
 if ($6) {
  $13 = 1;
  STACKTOP = sp;return ($13|0);
 }
 $7 = ((($2)) + 4|0);
 $8 = +HEAPF32[$7>>2];
 $9 = $1;
 $10 = ((($9)) + 4|0);
 $11 = +HEAPF32[$10>>2];
 $12 = $8 != $11;
 $13 = $12;
 STACKTOP = sp;return ($13|0);
}
function __ZNK4Vec4neERKS_($this,$rhs) {
 $this = $this|0;
 $rhs = $rhs|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0.0, $12 = 0, $13 = 0, $14 = 0.0, $15 = 0, $16 = 0, $17 = 0.0, $18 = 0, $19 = 0, $2 = 0, $20 = 0.0, $21 = 0, $22 = 0, $23 = 0.0, $24 = 0, $25 = 0, $3 = 0.0;
 var $4 = 0, $5 = 0.0, $6 = 0, $7 = 0, $8 = 0.0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $this;
 $1 = $rhs;
 $2 = $0;
 $3 = +HEAPF32[$2>>2];
 $4 = $1;
 $5 = +HEAPF32[$4>>2];
 $6 = $3 != $5;
 if ($6) {
  $25 = 1;
  STACKTOP = sp;return ($25|0);
 }
 $7 = ((($2)) + 4|0);
 $8 = +HEAPF32[$7>>2];
 $9 = $1;
 $10 = ((($9)) + 4|0);
 $11 = +HEAPF32[$10>>2];
 $12 = $8 != $11;
 if ($12) {
  $25 = 1;
  STACKTOP = sp;return ($25|0);
 }
 $13 = ((($2)) + 8|0);
 $14 = +HEAPF32[$13>>2];
 $15 = $1;
 $16 = ((($15)) + 8|0);
 $17 = +HEAPF32[$16>>2];
 $18 = $14 != $17;
 if ($18) {
  $25 = 1;
  STACKTOP = sp;return ($25|0);
 }
 $19 = ((($2)) + 12|0);
 $20 = +HEAPF32[$19>>2];
 $21 = $1;
 $22 = ((($21)) + 12|0);
 $23 = +HEAPF32[$22>>2];
 $24 = $20 != $23;
 $25 = $24;
 STACKTOP = sp;return ($25|0);
}
function __ZL27render_enable_attrib_arraysPji($ids,$num_ids) {
 $ids = $ids|0;
 $num_ids = $num_ids|0;
 var $0 = 0, $1 = 0, $10 = 0, $100 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0;
 var $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0;
 var $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0;
 var $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0;
 var $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0;
 var $99 = 0, $disable = 0, $enable = 0, $err = 0, $err3 = 0, $i = 0, $i2 = 0, $k = 0, $k1 = 0, $state = 0, $vararg_buffer = 0, $vararg_buffer2 = 0, $vararg_ptr1 = 0, $vararg_ptr5 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 64|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $vararg_buffer2 = sp + 8|0;
 $vararg_buffer = sp;
 $0 = $ids;
 $1 = $num_ids;
 $state = 5008;
 $i = 0;
 while(1) {
  $2 = $i;
  $3 = $state;
  $4 = ((($3)) + 24432|0);
  $5 = HEAP32[$4>>2]|0;
  $6 = ($2|0)<($5|0);
  if (!($6)) {
   break;
  }
  $disable = 1;
  $k = 0;
  while(1) {
   $7 = $k;
   $8 = $1;
   $9 = ($7|0)<($8|0);
   if (!($9)) {
    break;
   }
   $10 = $i;
   $11 = $state;
   $12 = ((($11)) + 24436|0);
   $13 = (($12) + ($10<<2)|0);
   $14 = HEAP32[$13>>2]|0;
   $15 = $k;
   $16 = $0;
   $17 = (($16) + ($15<<2)|0);
   $18 = HEAP32[$17>>2]|0;
   $19 = ($14|0)==($18|0);
   if ($19) {
    label = 6;
    break;
   }
   $20 = $k;
   $21 = (($20) + 1)|0;
   $k = $21;
  }
  if ((label|0) == 6) {
   label = 0;
   $disable = 0;
  }
  $22 = $disable;
  $23 = $22&1;
  if ($23) {
   $24 = $i;
   $25 = $state;
   $26 = ((($25)) + 24436|0);
   $27 = (($26) + ($24<<2)|0);
   $28 = HEAP32[$27>>2]|0;
   _glDisableVertexAttribArray(($28|0));
   $29 = (_glGetError()|0);
   $err = $29;
   $30 = $err;
   $31 = ($30|0)!=(0);
   if ($31) {
    $32 = $err;
    $33 = (__Z18gl_error_to_stringj($32)|0);
    HEAP32[$vararg_buffer>>2] = 448;
    $vararg_ptr1 = ((($vararg_buffer)) + 4|0);
    HEAP32[$vararg_ptr1>>2] = $33;
    (_printf(1667,$vararg_buffer)|0);
    _emscripten_force_exit(1);
   }
   $34 = $state;
   $35 = ((($34)) + 24432|0);
   $36 = HEAP32[$35>>2]|0;
   $37 = (($36) - 1)|0;
   $38 = $state;
   $39 = ((($38)) + 24436|0);
   $40 = (($39) + ($37<<2)|0);
   $41 = HEAP32[$40>>2]|0;
   $42 = $i;
   $43 = $state;
   $44 = ((($43)) + 24436|0);
   $45 = (($44) + ($42<<2)|0);
   HEAP32[$45>>2] = $41;
   $46 = $state;
   $47 = ((($46)) + 24432|0);
   $48 = HEAP32[$47>>2]|0;
   $49 = (($48) + -1)|0;
   HEAP32[$47>>2] = $49;
   $50 = $i;
   $51 = (($50) + -1)|0;
   $i = $51;
  }
  $52 = $i;
  $53 = (($52) + 1)|0;
  $i = $53;
 }
 $k1 = 0;
 while(1) {
  $54 = $k1;
  $55 = $1;
  $56 = ($54|0)<($55|0);
  if (!($56)) {
   break;
  }
  $enable = 1;
  $i2 = 0;
  while(1) {
   $57 = $i2;
   $58 = $state;
   $59 = ((($58)) + 24432|0);
   $60 = HEAP32[$59>>2]|0;
   $61 = ($57|0)<($60|0);
   if (!($61)) {
    break;
   }
   $62 = $i2;
   $63 = $state;
   $64 = ((($63)) + 24436|0);
   $65 = (($64) + ($62<<2)|0);
   $66 = HEAP32[$65>>2]|0;
   $67 = $k1;
   $68 = $0;
   $69 = (($68) + ($67<<2)|0);
   $70 = HEAP32[$69>>2]|0;
   $71 = ($66|0)==($70|0);
   if ($71) {
    $enable = 0;
   }
   $72 = $i2;
   $73 = (($72) + 1)|0;
   $i2 = $73;
  }
  $74 = $enable;
  $75 = $74&1;
  if ($75) {
   $76 = $k1;
   $77 = $0;
   $78 = (($77) + ($76<<2)|0);
   $79 = HEAP32[$78>>2]|0;
   _glEnableVertexAttribArray(($79|0));
   $80 = (_glGetError()|0);
   $err3 = $80;
   $81 = $err3;
   $82 = ($81|0)!=(0);
   if ($82) {
    $83 = $err3;
    $84 = (__Z18gl_error_to_stringj($83)|0);
    HEAP32[$vararg_buffer2>>2] = 465;
    $vararg_ptr5 = ((($vararg_buffer2)) + 4|0);
    HEAP32[$vararg_ptr5>>2] = $84;
    (_printf(1667,$vararg_buffer2)|0);
    _emscripten_force_exit(1);
   }
   $85 = $k1;
   $86 = $0;
   $87 = (($86) + ($85<<2)|0);
   $88 = HEAP32[$87>>2]|0;
   $89 = $state;
   $90 = ((($89)) + 24432|0);
   $91 = HEAP32[$90>>2]|0;
   $92 = $state;
   $93 = ((($92)) + 24436|0);
   $94 = (($93) + ($91<<2)|0);
   HEAP32[$94>>2] = $88;
   $95 = $state;
   $96 = ((($95)) + 24432|0);
   $97 = HEAP32[$96>>2]|0;
   $98 = (($97) + 1)|0;
   HEAP32[$96>>2] = $98;
  }
  $99 = $k1;
  $100 = (($99) + 1)|0;
  $k1 = $100;
 }
 STACKTOP = sp;return;
}
function _chimp8_strerror($error) {
 $error = $error|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $1 = $error;
 $2 = $1;
 switch ($2|0) {
 case 0:  {
  $0 = 2379;
  break;
 }
 case -1:  {
  $0 = 2382;
  break;
 }
 case -2:  {
  $0 = 2406;
  break;
 }
 case -3:  {
  $0 = 2426;
  break;
 }
 case -5:  {
  $0 = 2440;
  break;
 }
 case -4:  {
  $0 = 2454;
  break;
 }
 default: {
  $0 = 2480;
 }
 }
 $3 = $0;
 STACKTOP = sp;return ($3|0);
}
function _chimp8_initialize($core,$romfile) {
 $core = $core|0;
 $romfile = $romfile|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $bytes_read = 0, $romsize = 0, dest = 0, label = 0;
 var sp = 0, src = 0, stop = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $1 = $core;
 $2 = $romfile;
 $3 = $1;
 _memset(($3|0),0,20840)|0;
 $4 = $1;
 $5 = ((($4)) + 42|0);
 dest=$5; src=2488; stop=dest+80|0; do { HEAP8[dest>>0]=HEAP8[src>>0]|0; dest=dest+1|0; src=src+1|0; } while ((dest|0) < (stop|0));
 $6 = $1;
 HEAP16[$6>>1] = 512;
 $7 = $1;
 $8 = ((($7)) + 7|0);
 HEAP8[$8>>0] = -1;
 $9 = $1;
 $10 = ((($9)) + 20816|0);
 HEAP32[$10>>2] = 0;
 $11 = $2;
 (_fseek($11,0,2)|0);
 $12 = $2;
 $13 = (_ftell($12)|0);
 $romsize = $13;
 $14 = $2;
 _rewind($14);
 $15 = $romsize;
 $16 = ($15|0)>(3584);
 $17 = $1;
 if ($16) {
  $18 = ((($17)) + 20816|0);
  HEAP32[$18>>2] = -3;
  $19 = $1;
  $20 = ((($19)) + 20816|0);
  $21 = HEAP32[$20>>2]|0;
  $0 = $21;
  $35 = $0;
  STACKTOP = sp;return ($35|0);
 }
 $22 = ((($17)) + 42|0);
 $23 = ((($22)) + 512|0);
 $24 = $romsize;
 $25 = $2;
 $26 = (_fread($23,1,$24,$25)|0);
 $bytes_read = $26;
 $27 = $bytes_read;
 $28 = $romsize;
 $29 = ($27|0)!=($28|0);
 if ($29) {
  $30 = $1;
  $31 = ((($30)) + 20816|0);
  HEAP32[$31>>2] = -4;
 }
 $32 = $1;
 $33 = ((($32)) + 20816|0);
 $34 = HEAP32[$33>>2]|0;
 $0 = $34;
 $35 = $0;
 STACKTOP = sp;return ($35|0);
}
function _chimp8_update($core,$ms,$step_fn) {
 $core = $core|0;
 $ms = $ms|0;
 $step_fn = $step_fn|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0;
 var $7 = 0, $8 = 0, $9 = 0, $ret = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $core;
 $1 = $ms;
 $2 = $step_fn;
 $3 = $1;
 $4 = $0;
 $5 = ((($4)) + 20812|0);
 $6 = HEAP32[$5>>2]|0;
 $7 = (($6) + ($3))|0;
 HEAP32[$5>>2] = $7;
 while(1) {
  $8 = $0;
  $9 = ((($8)) + 20812|0);
  $10 = HEAP32[$9>>2]|0;
  $11 = ($10|0)>=(2);
  if (!($11)) {
   label = 5;
   break;
  }
  $12 = $2;
  $13 = $0;
  $14 = (FUNCTION_TABLE_ii[$12 & 31]($13)|0);
  $ret = $14;
  $15 = $ret;
  $16 = ($15|0)!=(0);
  if ($16) {
   break;
  }
 }
 if ((label|0) == 5) {
  $20 = $0;
  $21 = ((($20)) + 20816|0);
  $22 = HEAP32[$21>>2]|0;
  STACKTOP = sp;return ($22|0);
 }
 $17 = $ret;
 $18 = $0;
 $19 = ((($18)) + 20816|0);
 HEAP32[$19>>2] = $17;
 $20 = $0;
 $21 = ((($20)) + 20816|0);
 $22 = HEAP32[$21>>2]|0;
 STACKTOP = sp;return ($22|0);
}
function _chimp8_set_user_data($core,$user_data) {
 $core = $core|0;
 $user_data = $user_data|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $core;
 $1 = $user_data;
 $2 = $1;
 $3 = $0;
 $4 = ((($3)) + 20820|0);
 HEAP32[$4>>2] = $2;
 STACKTOP = sp;return;
}
function _chimp8_set_clear_screen_cb($core,$cb) {
 $core = $core|0;
 $cb = $cb|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $core;
 $1 = $cb;
 $2 = $1;
 $3 = $0;
 $4 = ((($3)) + 20824|0);
 HEAP32[$4>>2] = $2;
 STACKTOP = sp;return;
}
function _chimp8_set_draw_sprite_cb($core,$cb) {
 $core = $core|0;
 $cb = $cb|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $core;
 $1 = $cb;
 $2 = $1;
 $3 = $0;
 $4 = ((($3)) + 20828|0);
 HEAP32[$4>>2] = $2;
 STACKTOP = sp;return;
}
function _find_item($list,$pc) {
 $list = $list|0;
 $pc = $pc|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $1 = $list;
 $2 = $pc;
 $3 = $1;
 $4 = ($3|0)==(0|0);
 if (!($4)) {
  $5 = $1;
  $6 = HEAP16[$5>>1]|0;
  $7 = $6&65535;
  $8 = $2;
  $9 = $8&65535;
  $10 = ($7|0)==($9|0);
  if (!($10)) {
   $12 = $1;
   $13 = ((($12)) + 8|0);
   $14 = HEAP32[$13>>2]|0;
   $15 = $2;
   $16 = (_find_item($14,$15)|0);
   $0 = $16;
   $17 = $0;
   STACKTOP = sp;return ($17|0);
  }
 }
 $11 = $1;
 $0 = $11;
 $17 = $0;
 STACKTOP = sp;return ($17|0);
}
function _is_draw_disabled($pc) {
 $pc = $pc|0;
 var $$expand_i1_val = 0, $$expand_i1_val2 = 0, $$pre_trunc = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $current = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = sp + 6|0;
 $1 = $pc;
 $current = 30192;
 while(1) {
  $2 = $current;
  $3 = HEAP16[$2>>1]|0;
  $4 = ($3<<16>>16)!=(0);
  if (!($4)) {
   label = 6;
   break;
  }
  $5 = $current;
  $6 = HEAP16[$5>>1]|0;
  $7 = $6&65535;
  $8 = $1;
  $9 = $8&65535;
  $10 = ($7|0)==($9|0);
  if ($10) {
   label = 4;
   break;
  }
  $11 = $current;
  $12 = ((($11)) + 2|0);
  $current = $12;
 }
 if ((label|0) == 4) {
  $$expand_i1_val = 1;
  HEAP8[$0>>0] = $$expand_i1_val;
  $$pre_trunc = HEAP8[$0>>0]|0;
  $13 = $$pre_trunc&1;
  STACKTOP = sp;return ($13|0);
 }
 else if ((label|0) == 6) {
  $$expand_i1_val2 = 0;
  HEAP8[$0>>0] = $$expand_i1_val2;
  $$pre_trunc = HEAP8[$0>>0]|0;
  $13 = $$pre_trunc&1;
  STACKTOP = sp;return ($13|0);
 }
 return (0)|0;
}
function _chimp8_int_step($core) {
 $core = $core|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0;
 var $instruction = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $core;
 $1 = $0;
 $2 = HEAP16[$1>>1]|0;
 $3 = $2&65535;
 $4 = $0;
 $5 = ((($4)) + 42|0);
 $6 = (($5) + ($3)|0);
 $7 = HEAP8[$6>>0]|0;
 $8 = $7&255;
 $9 = $8 << 8;
 $10 = $0;
 $11 = HEAP16[$10>>1]|0;
 $12 = $11&65535;
 $13 = (($12) + 1)|0;
 $14 = $0;
 $15 = ((($14)) + 42|0);
 $16 = (($15) + ($13)|0);
 $17 = HEAP8[$16>>0]|0;
 $18 = $17&255;
 $19 = $9 | $18;
 $20 = $19&65535;
 $instruction = $20;
 $21 = $instruction;
 $22 = $21&65535;
 $23 = $22 >> 12;
 $24 = (624 + ($23<<2)|0);
 $25 = HEAP32[$24>>2]|0;
 $26 = $0;
 $27 = $instruction;
 FUNCTION_TABLE_vii[$25 & 31]($26,$27);
 $28 = $0;
 $29 = HEAP16[$28>>1]|0;
 $30 = $29&65535;
 $31 = (($30) + 2)|0;
 $32 = $31&65535;
 HEAP16[$28>>1] = $32;
 $33 = $0;
 $34 = ((($33)) + 20812|0);
 $35 = HEAP32[$34>>2]|0;
 $36 = (($35) - 2)|0;
 HEAP32[$34>>2] = $36;
 $37 = $0;
 $38 = ((($37)) + 20816|0);
 $39 = HEAP32[$38>>2]|0;
 STACKTOP = sp;return ($39|0);
}
function _inst_0($core,$inst) {
 $core = $core|0;
 $inst = $inst|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $core;
 $1 = $inst;
 $2 = $1;
 $3 = $2&65535;
 $4 = ($3|0)==(224);
 if ($4) {
  $5 = $0;
  $6 = ((($5)) + 4170|0);
  _memset(($6|0),0,256)|0;
  $7 = $0;
  $8 = ((($7)) + 20824|0);
  $9 = HEAP32[$8>>2]|0;
  $10 = ($9|0)!=(0|0);
  if (!($10)) {
   STACKTOP = sp;return;
  }
  $11 = $0;
  $12 = ((($11)) + 20824|0);
  $13 = HEAP32[$12>>2]|0;
  $14 = $0;
  $15 = $0;
  $16 = ((($15)) + 20820|0);
  $17 = HEAP32[$16>>2]|0;
  FUNCTION_TABLE_vii[$13 & 31]($14,$17);
  STACKTOP = sp;return;
 }
 $18 = $1;
 $19 = $18&65535;
 $20 = ($19|0)==(238);
 $21 = $0;
 if ($20) {
  $22 = ((($21)) + 6|0);
  $23 = HEAP8[$22>>0]|0;
  $24 = (($23) + -1)<<24>>24;
  HEAP8[$22>>0] = $24;
  $25 = $0;
  $26 = ((($25)) + 6|0);
  $27 = HEAP8[$26>>0]|0;
  $28 = $27&255;
  $29 = $0;
  $30 = ((($29)) + 4138|0);
  $31 = (($30) + ($28<<1)|0);
  $32 = HEAP16[$31>>1]|0;
  $33 = $32&65535;
  $34 = (($33) - 2)|0;
  $35 = $34&65535;
  $36 = $0;
  HEAP16[$36>>1] = $35;
  STACKTOP = sp;return;
 } else {
  $37 = ((($21)) + 20816|0);
  HEAP32[$37>>2] = -1;
  STACKTOP = sp;return;
 }
}
function _inst_1($core,$inst) {
 $core = $core|0;
 $inst = $inst|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $core;
 $1 = $inst;
 $2 = $1;
 $3 = $2&65535;
 $4 = $3 & 4095;
 $5 = (($4) - 2)|0;
 $6 = $5&65535;
 $7 = $0;
 HEAP16[$7>>1] = $6;
 STACKTOP = sp;return;
}
function _inst_2($core,$inst) {
 $core = $core|0;
 $inst = $inst|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $3 = 0, $4 = 0, $5 = 0;
 var $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $core;
 $1 = $inst;
 $2 = $0;
 $3 = HEAP16[$2>>1]|0;
 $4 = $3&65535;
 $5 = (($4) + 2)|0;
 $6 = $5&65535;
 $7 = $0;
 $8 = ((($7)) + 6|0);
 $9 = HEAP8[$8>>0]|0;
 $10 = $9&255;
 $11 = $0;
 $12 = ((($11)) + 4138|0);
 $13 = (($12) + ($10<<1)|0);
 HEAP16[$13>>1] = $6;
 $14 = $0;
 $15 = ((($14)) + 6|0);
 $16 = HEAP8[$15>>0]|0;
 $17 = (($16) + 1)<<24>>24;
 HEAP8[$15>>0] = $17;
 $18 = $1;
 $19 = $18&65535;
 $20 = $19 & 4095;
 $21 = (($20) - 2)|0;
 $22 = $21&65535;
 $23 = $0;
 HEAP16[$23>>1] = $22;
 STACKTOP = sp;return;
}
function _inst_3($core,$inst) {
 $core = $core|0;
 $inst = $inst|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0;
 var $8 = 0, $9 = 0, $reg = 0, $val = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $core;
 $1 = $inst;
 $2 = $1;
 $3 = $2&65535;
 $4 = $3 & 3840;
 $5 = $4 >> 8;
 $reg = $5;
 $6 = $1;
 $7 = $6&65535;
 $8 = $7 & 255;
 $val = $8;
 $9 = $reg;
 $10 = $0;
 $11 = ((($10)) + 26|0);
 $12 = (($11) + ($9)|0);
 $13 = HEAP8[$12>>0]|0;
 $14 = $13&255;
 $15 = $val;
 $16 = ($14|0)==($15|0);
 if (!($16)) {
  STACKTOP = sp;return;
 }
 $17 = $0;
 $18 = HEAP16[$17>>1]|0;
 $19 = $18&65535;
 $20 = (($19) + 2)|0;
 $21 = $20&65535;
 HEAP16[$17>>1] = $21;
 STACKTOP = sp;return;
}
function _inst_4($core,$inst) {
 $core = $core|0;
 $inst = $inst|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0;
 var $8 = 0, $9 = 0, $reg = 0, $val = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $core;
 $1 = $inst;
 $2 = $1;
 $3 = $2&65535;
 $4 = $3 & 3840;
 $5 = $4 >> 8;
 $reg = $5;
 $6 = $1;
 $7 = $6&65535;
 $8 = $7 & 255;
 $val = $8;
 $9 = $reg;
 $10 = $0;
 $11 = ((($10)) + 26|0);
 $12 = (($11) + ($9)|0);
 $13 = HEAP8[$12>>0]|0;
 $14 = $13&255;
 $15 = $val;
 $16 = ($14|0)!=($15|0);
 if (!($16)) {
  STACKTOP = sp;return;
 }
 $17 = $0;
 $18 = HEAP16[$17>>1]|0;
 $19 = $18&65535;
 $20 = (($19) + 2)|0;
 $21 = $20&65535;
 HEAP16[$17>>1] = $21;
 STACKTOP = sp;return;
}
function _inst_5($core,$inst) {
 $core = $core|0;
 $inst = $inst|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $regx = 0, $regy = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $core;
 $1 = $inst;
 $2 = $1;
 $3 = $2&65535;
 $4 = $3 & 3840;
 $5 = $4 >> 8;
 $regx = $5;
 $6 = $1;
 $7 = $6&65535;
 $8 = $7 & 240;
 $9 = $8 >> 4;
 $regy = $9;
 $10 = $regx;
 $11 = $0;
 $12 = ((($11)) + 26|0);
 $13 = (($12) + ($10)|0);
 $14 = HEAP8[$13>>0]|0;
 $15 = $14&255;
 $16 = $regy;
 $17 = $0;
 $18 = ((($17)) + 26|0);
 $19 = (($18) + ($16)|0);
 $20 = HEAP8[$19>>0]|0;
 $21 = $20&255;
 $22 = ($15|0)==($21|0);
 if (!($22)) {
  STACKTOP = sp;return;
 }
 $23 = $0;
 $24 = HEAP16[$23>>1]|0;
 $25 = $24&65535;
 $26 = (($25) + 2)|0;
 $27 = $26&65535;
 HEAP16[$23>>1] = $27;
 STACKTOP = sp;return;
}
function _inst_6($core,$inst) {
 $core = $core|0;
 $inst = $inst|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $reg = 0, $val = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $core;
 $1 = $inst;
 $2 = $1;
 $3 = $2&65535;
 $4 = $3 & 3840;
 $5 = $4 >> 8;
 $reg = $5;
 $6 = $1;
 $7 = $6&65535;
 $8 = $7 & 255;
 $val = $8;
 $9 = $val;
 $10 = $9&255;
 $11 = $reg;
 $12 = $0;
 $13 = ((($12)) + 26|0);
 $14 = (($13) + ($11)|0);
 HEAP8[$14>>0] = $10;
 STACKTOP = sp;return;
}
function _inst_7($core,$inst) {
 $core = $core|0;
 $inst = $inst|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0;
 var $7 = 0, $8 = 0, $9 = 0, $reg = 0, $val = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $core;
 $1 = $inst;
 $2 = $1;
 $3 = $2&65535;
 $4 = $3 & 3840;
 $5 = $4 >> 8;
 $reg = $5;
 $6 = $1;
 $7 = $6&65535;
 $8 = $7 & 255;
 $val = $8;
 $9 = $reg;
 $10 = $0;
 $11 = ((($10)) + 26|0);
 $12 = (($11) + ($9)|0);
 $13 = HEAP8[$12>>0]|0;
 $14 = $13&255;
 $15 = $val;
 $16 = (($14) + ($15))|0;
 $17 = $16 & 255;
 $18 = $17&255;
 $19 = $reg;
 $20 = $0;
 $21 = ((($20)) + 26|0);
 $22 = (($21) + ($19)|0);
 HEAP8[$22>>0] = $18;
 STACKTOP = sp;return;
}
function _inst_8($core,$inst) {
 $core = $core|0;
 $inst = $inst|0;
 var $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0;
 var $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0;
 var $134 = 0, $135 = 0, $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0;
 var $152 = 0, $153 = 0, $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0, $159 = 0, $16 = 0, $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0, $168 = 0, $169 = 0, $17 = 0;
 var $170 = 0, $171 = 0, $172 = 0, $173 = 0, $174 = 0, $175 = 0, $176 = 0, $177 = 0, $178 = 0, $179 = 0, $18 = 0, $180 = 0, $181 = 0, $182 = 0, $183 = 0, $184 = 0, $185 = 0, $186 = 0, $187 = 0, $188 = 0;
 var $189 = 0, $19 = 0, $190 = 0, $191 = 0, $192 = 0, $193 = 0, $194 = 0, $195 = 0, $196 = 0, $197 = 0, $198 = 0, $199 = 0, $2 = 0, $20 = 0, $200 = 0, $201 = 0, $202 = 0, $203 = 0, $204 = 0, $205 = 0;
 var $206 = 0, $207 = 0, $208 = 0, $209 = 0, $21 = 0, $210 = 0, $211 = 0, $212 = 0, $213 = 0, $214 = 0, $215 = 0, $216 = 0, $217 = 0, $218 = 0, $219 = 0, $22 = 0, $220 = 0, $221 = 0, $222 = 0, $223 = 0;
 var $224 = 0, $225 = 0, $226 = 0, $227 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0;
 var $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0;
 var $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0;
 var $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0;
 var $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, $regx = 0, $regy = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $core;
 $1 = $inst;
 $2 = $1;
 $3 = $2&65535;
 $4 = $3 & 3840;
 $5 = $4 >> 8;
 $regx = $5;
 $6 = $1;
 $7 = $6&65535;
 $8 = $7 & 240;
 $9 = $8 >> 4;
 $regy = $9;
 $10 = $1;
 $11 = $10&65535;
 $12 = $11 & 15;
 do {
  switch ($12|0) {
  case 0:  {
   $13 = $regy;
   $14 = $0;
   $15 = ((($14)) + 26|0);
   $16 = (($15) + ($13)|0);
   $17 = HEAP8[$16>>0]|0;
   $18 = $regx;
   $19 = $0;
   $20 = ((($19)) + 26|0);
   $21 = (($20) + ($18)|0);
   HEAP8[$21>>0] = $17;
   STACKTOP = sp;return;
   break;
  }
  case 1:  {
   $22 = $regy;
   $23 = $0;
   $24 = ((($23)) + 26|0);
   $25 = (($24) + ($22)|0);
   $26 = HEAP8[$25>>0]|0;
   $27 = $26&255;
   $28 = $regx;
   $29 = $0;
   $30 = ((($29)) + 26|0);
   $31 = (($30) + ($28)|0);
   $32 = HEAP8[$31>>0]|0;
   $33 = $32&255;
   $34 = $33 | $27;
   $35 = $34&255;
   HEAP8[$31>>0] = $35;
   STACKTOP = sp;return;
   break;
  }
  case 2:  {
   $36 = $regy;
   $37 = $0;
   $38 = ((($37)) + 26|0);
   $39 = (($38) + ($36)|0);
   $40 = HEAP8[$39>>0]|0;
   $41 = $40&255;
   $42 = $regx;
   $43 = $0;
   $44 = ((($43)) + 26|0);
   $45 = (($44) + ($42)|0);
   $46 = HEAP8[$45>>0]|0;
   $47 = $46&255;
   $48 = $47 & $41;
   $49 = $48&255;
   HEAP8[$45>>0] = $49;
   STACKTOP = sp;return;
   break;
  }
  case 3:  {
   $50 = $regy;
   $51 = $0;
   $52 = ((($51)) + 26|0);
   $53 = (($52) + ($50)|0);
   $54 = HEAP8[$53>>0]|0;
   $55 = $54&255;
   $56 = $regx;
   $57 = $0;
   $58 = ((($57)) + 26|0);
   $59 = (($58) + ($56)|0);
   $60 = HEAP8[$59>>0]|0;
   $61 = $60&255;
   $62 = $61 ^ $55;
   $63 = $62&255;
   HEAP8[$59>>0] = $63;
   STACKTOP = sp;return;
   break;
  }
  case 4:  {
   $64 = $0;
   $65 = ((($64)) + 26|0);
   $66 = ((($65)) + 15|0);
   HEAP8[$66>>0] = 0;
   $67 = $regx;
   $68 = $0;
   $69 = ((($68)) + 26|0);
   $70 = (($69) + ($67)|0);
   $71 = HEAP8[$70>>0]|0;
   $72 = $71&255;
   $73 = $regy;
   $74 = $0;
   $75 = ((($74)) + 26|0);
   $76 = (($75) + ($73)|0);
   $77 = HEAP8[$76>>0]|0;
   $78 = $77&255;
   $79 = (($72) + ($78))|0;
   $80 = ($79|0)>(255);
   if ($80) {
    $81 = $0;
    $82 = ((($81)) + 26|0);
    $83 = ((($82)) + 15|0);
    HEAP8[$83>>0] = 1;
   }
   $84 = $regx;
   $85 = $0;
   $86 = ((($85)) + 26|0);
   $87 = (($86) + ($84)|0);
   $88 = HEAP8[$87>>0]|0;
   $89 = $88&255;
   $90 = $regy;
   $91 = $0;
   $92 = ((($91)) + 26|0);
   $93 = (($92) + ($90)|0);
   $94 = HEAP8[$93>>0]|0;
   $95 = $94&255;
   $96 = (($89) + ($95))|0;
   $97 = $96 & 255;
   $98 = $97&255;
   $99 = $regx;
   $100 = $0;
   $101 = ((($100)) + 26|0);
   $102 = (($101) + ($99)|0);
   HEAP8[$102>>0] = $98;
   STACKTOP = sp;return;
   break;
  }
  case 5:  {
   $103 = $0;
   $104 = ((($103)) + 26|0);
   $105 = ((($104)) + 15|0);
   HEAP8[$105>>0] = 0;
   $106 = $regx;
   $107 = $0;
   $108 = ((($107)) + 26|0);
   $109 = (($108) + ($106)|0);
   $110 = HEAP8[$109>>0]|0;
   $111 = $110&255;
   $112 = $regy;
   $113 = $0;
   $114 = ((($113)) + 26|0);
   $115 = (($114) + ($112)|0);
   $116 = HEAP8[$115>>0]|0;
   $117 = $116&255;
   $118 = ($111|0)>=($117|0);
   if ($118) {
    $119 = $0;
    $120 = ((($119)) + 26|0);
    $121 = ((($120)) + 15|0);
    HEAP8[$121>>0] = 1;
   }
   $122 = $regx;
   $123 = $0;
   $124 = ((($123)) + 26|0);
   $125 = (($124) + ($122)|0);
   $126 = HEAP8[$125>>0]|0;
   $127 = $126&255;
   $128 = $regy;
   $129 = $0;
   $130 = ((($129)) + 26|0);
   $131 = (($130) + ($128)|0);
   $132 = HEAP8[$131>>0]|0;
   $133 = $132&255;
   $134 = (($127) - ($133))|0;
   $135 = $134 & 255;
   $136 = $135&255;
   $137 = $regx;
   $138 = $0;
   $139 = ((($138)) + 26|0);
   $140 = (($139) + ($137)|0);
   HEAP8[$140>>0] = $136;
   STACKTOP = sp;return;
   break;
  }
  case 6:  {
   $141 = $regx;
   $142 = $0;
   $143 = ((($142)) + 26|0);
   $144 = (($143) + ($141)|0);
   $145 = HEAP8[$144>>0]|0;
   $146 = $145&255;
   $147 = $146 & 1;
   $148 = $147&255;
   $149 = $0;
   $150 = ((($149)) + 26|0);
   $151 = ((($150)) + 15|0);
   HEAP8[$151>>0] = $148;
   $152 = $regx;
   $153 = $0;
   $154 = ((($153)) + 26|0);
   $155 = (($154) + ($152)|0);
   $156 = HEAP8[$155>>0]|0;
   $157 = $156&255;
   $158 = $157 >> 1;
   $159 = $158&255;
   $160 = $regx;
   $161 = $0;
   $162 = ((($161)) + 26|0);
   $163 = (($162) + ($160)|0);
   HEAP8[$163>>0] = $159;
   STACKTOP = sp;return;
   break;
  }
  case 7:  {
   $164 = $0;
   $165 = ((($164)) + 26|0);
   $166 = ((($165)) + 15|0);
   HEAP8[$166>>0] = 0;
   $167 = $regy;
   $168 = $0;
   $169 = ((($168)) + 26|0);
   $170 = (($169) + ($167)|0);
   $171 = HEAP8[$170>>0]|0;
   $172 = $171&255;
   $173 = $regx;
   $174 = $0;
   $175 = ((($174)) + 26|0);
   $176 = (($175) + ($173)|0);
   $177 = HEAP8[$176>>0]|0;
   $178 = $177&255;
   $179 = ($172|0)>=($178|0);
   if ($179) {
    $180 = $0;
    $181 = ((($180)) + 26|0);
    $182 = ((($181)) + 15|0);
    HEAP8[$182>>0] = 1;
   }
   $183 = $regy;
   $184 = $0;
   $185 = ((($184)) + 26|0);
   $186 = (($185) + ($183)|0);
   $187 = HEAP8[$186>>0]|0;
   $188 = $187&255;
   $189 = $regx;
   $190 = $0;
   $191 = ((($190)) + 26|0);
   $192 = (($191) + ($189)|0);
   $193 = HEAP8[$192>>0]|0;
   $194 = $193&255;
   $195 = (($188) - ($194))|0;
   $196 = $195 & 255;
   $197 = $196&255;
   $198 = $regx;
   $199 = $0;
   $200 = ((($199)) + 26|0);
   $201 = (($200) + ($198)|0);
   HEAP8[$201>>0] = $197;
   STACKTOP = sp;return;
   break;
  }
  case 14:  {
   $202 = $regx;
   $203 = $0;
   $204 = ((($203)) + 26|0);
   $205 = (($204) + ($202)|0);
   $206 = HEAP8[$205>>0]|0;
   $207 = $206&255;
   $208 = $207 & 128;
   $209 = $208&255;
   $210 = $0;
   $211 = ((($210)) + 26|0);
   $212 = ((($211)) + 15|0);
   HEAP8[$212>>0] = $209;
   $213 = $regx;
   $214 = $0;
   $215 = ((($214)) + 26|0);
   $216 = (($215) + ($213)|0);
   $217 = HEAP8[$216>>0]|0;
   $218 = $217&255;
   $219 = $218 << 1;
   $220 = $219 & 255;
   $221 = $220&255;
   $222 = $regx;
   $223 = $0;
   $224 = ((($223)) + 26|0);
   $225 = (($224) + ($222)|0);
   HEAP8[$225>>0] = $221;
   STACKTOP = sp;return;
   break;
  }
  default: {
   $226 = $0;
   $227 = ((($226)) + 20816|0);
   HEAP32[$227>>2] = -2;
   STACKTOP = sp;return;
  }
  }
 } while(0);
}
function _inst_9($core,$inst) {
 $core = $core|0;
 $inst = $inst|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $regx = 0, $regy = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $core;
 $1 = $inst;
 $2 = $1;
 $3 = $2&65535;
 $4 = $3 & 3840;
 $5 = $4 >> 8;
 $regx = $5;
 $6 = $1;
 $7 = $6&65535;
 $8 = $7 & 240;
 $9 = $8 >> 4;
 $regy = $9;
 $10 = $regx;
 $11 = $0;
 $12 = ((($11)) + 26|0);
 $13 = (($12) + ($10)|0);
 $14 = HEAP8[$13>>0]|0;
 $15 = $14&255;
 $16 = $regy;
 $17 = $0;
 $18 = ((($17)) + 26|0);
 $19 = (($18) + ($16)|0);
 $20 = HEAP8[$19>>0]|0;
 $21 = $20&255;
 $22 = ($15|0)!=($21|0);
 if (!($22)) {
  STACKTOP = sp;return;
 }
 $23 = $0;
 $24 = HEAP16[$23>>1]|0;
 $25 = $24&65535;
 $26 = (($25) + 2)|0;
 $27 = $26&65535;
 HEAP16[$23>>1] = $27;
 STACKTOP = sp;return;
}
function _inst_a($core,$inst) {
 $core = $core|0;
 $inst = $inst|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $core;
 $1 = $inst;
 $2 = $1;
 $3 = $2&65535;
 $4 = $3 & 4095;
 $5 = $4&65535;
 $6 = $0;
 $7 = ((($6)) + 2|0);
 HEAP16[$7>>1] = $5;
 STACKTOP = sp;return;
}
function _inst_b($core,$inst) {
 $core = $core|0;
 $inst = $inst|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $core;
 $1 = $inst;
 $2 = $1;
 $3 = $2&65535;
 $4 = $3 & 4095;
 $5 = $0;
 $6 = ((($5)) + 26|0);
 $7 = HEAP8[$6>>0]|0;
 $8 = $7&255;
 $9 = (($4) + ($8))|0;
 $10 = (($9) - 2)|0;
 $11 = $10&65535;
 $12 = $0;
 HEAP16[$12>>1] = $11;
 STACKTOP = sp;return;
}
function _inst_c($core,$inst) {
 $core = $core|0;
 $inst = $inst|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $regx = 0, $val = 0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $core;
 $1 = $inst;
 $2 = $1;
 $3 = $2&65535;
 $4 = $3 & 3840;
 $5 = $4 >> 8;
 $regx = $5;
 $6 = $1;
 $7 = $6&65535;
 $8 = $7 & 255;
 $val = $8;
 $9 = (_rand()|0);
 $10 = (($9|0) % 255)&-1;
 $11 = $val;
 $12 = $10 & $11;
 $13 = $12&255;
 $14 = $regx;
 $15 = $0;
 $16 = ((($15)) + 26|0);
 $17 = (($16) + ($14)|0);
 HEAP8[$17>>0] = $13;
 STACKTOP = sp;return;
}
function _inst_d($core,$inst) {
 $core = $core|0;
 $inst = $inst|0;
 var $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0;
 var $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0;
 var $134 = 0, $135 = 0, $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0;
 var $152 = 0, $153 = 0, $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0, $159 = 0, $16 = 0, $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0, $168 = 0, $169 = 0, $17 = 0;
 var $170 = 0, $171 = 0, $172 = 0, $173 = 0, $174 = 0, $175 = 0, $176 = 0, $177 = 0, $178 = 0, $179 = 0, $18 = 0, $180 = 0, $181 = 0, $182 = 0, $183 = 0, $184 = 0, $185 = 0, $186 = 0, $187 = 0, $188 = 0;
 var $189 = 0, $19 = 0, $190 = 0, $191 = 0, $192 = 0, $193 = 0, $194 = 0, $195 = 0, $196 = 0, $197 = 0, $198 = 0, $199 = 0, $2 = 0, $20 = 0, $200 = 0, $201 = 0, $202 = 0, $203 = 0, $204 = 0, $205 = 0;
 var $206 = 0, $207 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0;
 var $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0;
 var $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0;
 var $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0;
 var $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, $cur_byte_l = 0, $cur_byte_r = 0, $height = 0, $i = 0, $item = 0, $regx = 0, $regy = 0, $set_byte_l = 0, $set_byte_r = 0, $x = 0, $xl = 0, $xr = 0;
 var $y = 0, $yi = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 48|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $core;
 $1 = $inst;
 $2 = $1;
 $3 = $2&65535;
 $4 = $3 & 3840;
 $5 = $4 >> 8;
 $regx = $5;
 $6 = $1;
 $7 = $6&65535;
 $8 = $7 & 240;
 $9 = $8 >> 4;
 $regy = $9;
 $10 = $1;
 $11 = $10&65535;
 $12 = $11 & 15;
 $height = $12;
 $13 = $regx;
 $14 = $0;
 $15 = ((($14)) + 26|0);
 $16 = (($15) + ($13)|0);
 $17 = HEAP8[$16>>0]|0;
 $18 = $17&255;
 $x = $18;
 $19 = $regy;
 $20 = $0;
 $21 = ((($20)) + 26|0);
 $22 = (($21) + ($19)|0);
 $23 = HEAP8[$22>>0]|0;
 $24 = $23&255;
 $y = $24;
 $25 = $0;
 $26 = ((($25)) + 26|0);
 $27 = ((($26)) + 15|0);
 HEAP8[$27>>0] = 0;
 $28 = $y;
 $29 = $28 & 31;
 $30 = $29 << 3;
 $31 = $30&255;
 $yi = $31;
 $i = 0;
 while(1) {
  $32 = $i;
  $33 = $height;
  $34 = ($32|0)<($33|0);
  if (!($34)) {
   break;
  }
  $35 = $yi;
  $36 = $35&255;
  $37 = $36 & 255;
  $38 = $37&255;
  $yi = $38;
  $39 = $0;
  $40 = ((($39)) + 2|0);
  $41 = HEAP16[$40>>1]|0;
  $42 = $41&65535;
  $43 = $i;
  $44 = (($42) + ($43))|0;
  $45 = $0;
  $46 = ((($45)) + 42|0);
  $47 = (($46) + ($44)|0);
  $48 = HEAP8[$47>>0]|0;
  $49 = $48&255;
  $50 = $x;
  $51 = $50 & 7;
  $52 = $49 >> $51;
  $53 = $52&255;
  $set_byte_l = $53;
  $54 = $x;
  $55 = $54 >> 3;
  $56 = $55 & 7;
  $57 = $56&255;
  $xl = $57;
  $58 = $xl;
  $59 = $58&255;
  $60 = $yi;
  $61 = $60&255;
  $62 = (($59) + ($61))|0;
  $63 = $0;
  $64 = ((($63)) + 4170|0);
  $65 = (($64) + ($62)|0);
  $66 = HEAP8[$65>>0]|0;
  $cur_byte_l = $66;
  $67 = $cur_byte_l;
  $68 = $67&255;
  $69 = $set_byte_l;
  $70 = $69&255;
  $71 = $68 & $70;
  $72 = ($71|0)>(0);
  $73 = $72&1;
  $74 = $0;
  $75 = ((($74)) + 26|0);
  $76 = ((($75)) + 15|0);
  $77 = HEAP8[$76>>0]|0;
  $78 = $77&255;
  $79 = $78 | $73;
  $80 = $79&255;
  HEAP8[$76>>0] = $80;
  $81 = $cur_byte_l;
  $82 = $81&255;
  $83 = $set_byte_l;
  $84 = $83&255;
  $85 = $82 ^ $84;
  $86 = $85&255;
  $87 = $xl;
  $88 = $87&255;
  $89 = $yi;
  $90 = $89&255;
  $91 = (($88) + ($90))|0;
  $92 = $0;
  $93 = ((($92)) + 4170|0);
  $94 = (($93) + ($91)|0);
  HEAP8[$94>>0] = $86;
  $95 = $0;
  $96 = ((($95)) + 2|0);
  $97 = HEAP16[$96>>1]|0;
  $98 = $97&65535;
  $99 = $i;
  $100 = (($98) + ($99))|0;
  $101 = $0;
  $102 = ((($101)) + 42|0);
  $103 = (($102) + ($100)|0);
  $104 = HEAP8[$103>>0]|0;
  $105 = $104&255;
  $106 = $x;
  $107 = $106 & 7;
  $108 = (8 - ($107))|0;
  $109 = $105 << $108;
  $110 = $109&255;
  $set_byte_r = $110;
  $111 = $x;
  $112 = (($111) + 8)|0;
  $113 = $112 >> 3;
  $114 = $113 & 7;
  $115 = $114&255;
  $xr = $115;
  $116 = $xr;
  $117 = $116&255;
  $118 = $yi;
  $119 = $118&255;
  $120 = (($117) + ($119))|0;
  $121 = $0;
  $122 = ((($121)) + 4170|0);
  $123 = (($122) + ($120)|0);
  $124 = HEAP8[$123>>0]|0;
  $cur_byte_r = $124;
  $125 = $cur_byte_r;
  $126 = $125&255;
  $127 = $set_byte_r;
  $128 = $127&255;
  $129 = $126 & $128;
  $130 = ($129|0)>(0);
  $131 = $130&1;
  $132 = $0;
  $133 = ((($132)) + 26|0);
  $134 = ((($133)) + 15|0);
  $135 = HEAP8[$134>>0]|0;
  $136 = $135&255;
  $137 = $136 | $131;
  $138 = $137&255;
  HEAP8[$134>>0] = $138;
  $139 = $cur_byte_r;
  $140 = $139&255;
  $141 = $set_byte_r;
  $142 = $141&255;
  $143 = $140 ^ $142;
  $144 = $143&255;
  $145 = $xr;
  $146 = $145&255;
  $147 = $yi;
  $148 = $147&255;
  $149 = (($146) + ($148))|0;
  $150 = $0;
  $151 = ((($150)) + 4170|0);
  $152 = (($151) + ($149)|0);
  HEAP8[$152>>0] = $144;
  $153 = $yi;
  $154 = $153&255;
  $155 = (($154) + 8)|0;
  $156 = $155&255;
  $yi = $156;
  $157 = $i;
  $158 = (($157) + 1)|0;
  $i = $158;
 }
 $159 = $0;
 $160 = ((($159)) + 20832|0);
 $161 = HEAP32[$160>>2]|0;
 $162 = $0;
 $163 = HEAP16[$162>>1]|0;
 $164 = (_find_item($161,$163)|0);
 $item = $164;
 $165 = $item;
 $166 = ($165|0)!=(0|0);
 if ($166) {
  $181 = $item;
  $182 = ((($181)) + 4|0);
  $183 = HEAP32[$182>>2]|0;
  $184 = (($183) + 1)|0;
  HEAP32[$182>>2] = $184;
 } else {
  $167 = (_malloc(12)|0);
  $item = $167;
  $168 = $0;
  $169 = HEAP16[$168>>1]|0;
  $170 = $item;
  HEAP16[$170>>1] = $169;
  $171 = $0;
  $172 = ((($171)) + 20832|0);
  $173 = HEAP32[$172>>2]|0;
  $174 = $item;
  $175 = ((($174)) + 8|0);
  HEAP32[$175>>2] = $173;
  $176 = $item;
  $177 = ((($176)) + 4|0);
  HEAP32[$177>>2] = 1;
  $178 = $item;
  $179 = $0;
  $180 = ((($179)) + 20832|0);
  HEAP32[$180>>2] = $178;
 }
 $185 = $0;
 $186 = HEAP16[$185>>1]|0;
 $187 = (_is_draw_disabled($186)|0);
 if ($187) {
  STACKTOP = sp;return;
 }
 $188 = $0;
 $189 = ((($188)) + 20828|0);
 $190 = HEAP32[$189>>2]|0;
 $191 = ($190|0)!=(0|0);
 if ($191) {
  $192 = $0;
  $193 = ((($192)) + 20828|0);
  $194 = HEAP32[$193>>2]|0;
  $195 = $0;
  $196 = $x;
  $197 = $196&255;
  $198 = $y;
  $199 = $198&255;
  $200 = $height;
  $201 = $200&255;
  $202 = $0;
  $203 = ((($202)) + 20820|0);
  $204 = HEAP32[$203>>2]|0;
  FUNCTION_TABLE_viiiii[$194 & 31]($195,$197,$199,$201,$204);
 }
 $205 = $x;
 HEAP32[7409] = $205;
 $206 = $y;
 HEAP32[7410] = $206;
 $207 = $height;
 HEAP32[7411] = $207;
 STACKTOP = sp;return;
}
function _inst_e($core,$inst) {
 $core = $core|0;
 $inst = $inst|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0;
 var $45 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $regx = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $core;
 $1 = $inst;
 $2 = $1;
 $3 = $2&65535;
 $4 = $3 & 3840;
 $5 = $4 >> 8;
 $regx = $5;
 $6 = $1;
 $7 = $6&65535;
 $8 = $7 & 255;
 $9 = ($8|0)==(158);
 if ($9) {
  $10 = $regx;
  $11 = $0;
  $12 = ((($11)) + 26|0);
  $13 = (($12) + ($10)|0);
  $14 = HEAP8[$13>>0]|0;
  $15 = $14&255;
  $16 = $0;
  $17 = ((($16)) + 8|0);
  $18 = (($17) + ($15)|0);
  $19 = HEAP8[$18>>0]|0;
  $20 = ($19<<24>>24)!=(0);
  if (!($20)) {
   STACKTOP = sp;return;
  }
  $21 = $0;
  $22 = HEAP16[$21>>1]|0;
  $23 = $22&65535;
  $24 = (($23) + 2)|0;
  $25 = $24&65535;
  HEAP16[$21>>1] = $25;
  STACKTOP = sp;return;
 }
 $26 = $1;
 $27 = $26&65535;
 $28 = $27 & 255;
 $29 = ($28|0)==(161);
 if (!($29)) {
  STACKTOP = sp;return;
 }
 $30 = $regx;
 $31 = $0;
 $32 = ((($31)) + 26|0);
 $33 = (($32) + ($30)|0);
 $34 = HEAP8[$33>>0]|0;
 $35 = $34&255;
 $36 = $0;
 $37 = ((($36)) + 8|0);
 $38 = (($37) + ($35)|0);
 $39 = HEAP8[$38>>0]|0;
 $40 = ($39<<24>>24)!=(0);
 if ($40) {
  STACKTOP = sp;return;
 }
 $41 = $0;
 $42 = HEAP16[$41>>1]|0;
 $43 = $42&65535;
 $44 = (($43) + 2)|0;
 $45 = $44&65535;
 HEAP16[$41>>1] = $45;
 STACKTOP = sp;return;
}
function _inst_f($core,$inst) {
 $core = $core|0;
 $inst = $inst|0;
 var $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0;
 var $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0;
 var $134 = 0, $135 = 0, $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0;
 var $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0;
 var $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0;
 var $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0;
 var $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0;
 var $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, $regx = 0, $value = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $core;
 $1 = $inst;
 $2 = $1;
 $3 = $2&65535;
 $4 = $3 & 3840;
 $5 = $4 >> 8;
 $regx = $5;
 $6 = $1;
 $7 = $6&65535;
 $8 = $7 & 255;
 do {
  switch ($8|0) {
  case 7:  {
   $9 = $0;
   $10 = ((($9)) + 4|0);
   $11 = HEAP8[$10>>0]|0;
   $12 = $regx;
   $13 = $0;
   $14 = ((($13)) + 26|0);
   $15 = (($14) + ($12)|0);
   HEAP8[$15>>0] = $11;
   STACKTOP = sp;return;
   break;
  }
  case 10:  {
   $16 = $0;
   $17 = ((($16)) + 7|0);
   $18 = HEAP8[$17>>0]|0;
   $19 = $18&255;
   $20 = ($19|0)==(255);
   $21 = $0;
   if ($20) {
    $22 = HEAP16[$21>>1]|0;
    $23 = $22&65535;
    $24 = (($23) - 2)|0;
    $25 = $24&65535;
    HEAP16[$21>>1] = $25;
    $26 = $0;
    $27 = ((($26)) + 7|0);
    HEAP8[$27>>0] = -2;
    STACKTOP = sp;return;
   }
   $28 = ((($21)) + 7|0);
   $29 = HEAP8[$28>>0]|0;
   $30 = $29&255;
   $31 = ($30|0)==(254);
   $32 = $0;
   if ($31) {
    $33 = HEAP16[$32>>1]|0;
    $34 = $33&65535;
    $35 = (($34) - 2)|0;
    $36 = $35&65535;
    HEAP16[$32>>1] = $36;
    STACKTOP = sp;return;
   } else {
    $37 = ((($32)) + 7|0);
    $38 = HEAP8[$37>>0]|0;
    $39 = $regx;
    $40 = $0;
    $41 = ((($40)) + 26|0);
    $42 = (($41) + ($39)|0);
    HEAP8[$42>>0] = $38;
    $43 = $0;
    $44 = ((($43)) + 7|0);
    HEAP8[$44>>0] = -1;
    STACKTOP = sp;return;
   }
   break;
  }
  case 21:  {
   $45 = $regx;
   $46 = $0;
   $47 = ((($46)) + 26|0);
   $48 = (($47) + ($45)|0);
   $49 = HEAP8[$48>>0]|0;
   $50 = $0;
   $51 = ((($50)) + 4|0);
   HEAP8[$51>>0] = $49;
   STACKTOP = sp;return;
   break;
  }
  case 24:  {
   $52 = $regx;
   $53 = $0;
   $54 = ((($53)) + 26|0);
   $55 = (($54) + ($52)|0);
   $56 = HEAP8[$55>>0]|0;
   $57 = $0;
   $58 = ((($57)) + 5|0);
   HEAP8[$58>>0] = $56;
   STACKTOP = sp;return;
   break;
  }
  case 30:  {
   $59 = $regx;
   $60 = $0;
   $61 = ((($60)) + 26|0);
   $62 = (($61) + ($59)|0);
   $63 = HEAP8[$62>>0]|0;
   $64 = $63&255;
   $65 = $0;
   $66 = ((($65)) + 2|0);
   $67 = HEAP16[$66>>1]|0;
   $68 = $67&65535;
   $69 = (($68) + ($64))|0;
   $70 = $69&65535;
   HEAP16[$66>>1] = $70;
   STACKTOP = sp;return;
   break;
  }
  case 41:  {
   $71 = $regx;
   $72 = $0;
   $73 = ((($72)) + 26|0);
   $74 = (($73) + ($71)|0);
   $75 = HEAP8[$74>>0]|0;
   $76 = $75&255;
   $77 = ($76*5)|0;
   $78 = $77&65535;
   $79 = $0;
   $80 = ((($79)) + 2|0);
   HEAP16[$80>>1] = $78;
   STACKTOP = sp;return;
   break;
  }
  case 51:  {
   $81 = $regx;
   $82 = $0;
   $83 = ((($82)) + 26|0);
   $84 = (($83) + ($81)|0);
   $85 = HEAP8[$84>>0]|0;
   $86 = $85&255;
   $value = $86;
   $87 = $value;
   $88 = (($87|0) % 10)&-1;
   $89 = $88&255;
   $90 = $0;
   $91 = ((($90)) + 2|0);
   $92 = HEAP16[$91>>1]|0;
   $93 = $92&65535;
   $94 = (($93) + 2)|0;
   $95 = $0;
   $96 = ((($95)) + 42|0);
   $97 = (($96) + ($94)|0);
   HEAP8[$97>>0] = $89;
   $98 = $value;
   $99 = (($98|0) / 10)&-1;
   $value = $99;
   $100 = $value;
   $101 = (($100|0) % 10)&-1;
   $102 = $101&255;
   $103 = $0;
   $104 = ((($103)) + 2|0);
   $105 = HEAP16[$104>>1]|0;
   $106 = $105&65535;
   $107 = (($106) + 1)|0;
   $108 = $0;
   $109 = ((($108)) + 42|0);
   $110 = (($109) + ($107)|0);
   HEAP8[$110>>0] = $102;
   $111 = $value;
   $112 = (($111|0) / 10)&-1;
   $value = $112;
   $113 = $value;
   $114 = (($113|0) % 10)&-1;
   $115 = $114&255;
   $116 = $0;
   $117 = ((($116)) + 2|0);
   $118 = HEAP16[$117>>1]|0;
   $119 = $118&65535;
   $120 = (($119) + 0)|0;
   $121 = $0;
   $122 = ((($121)) + 42|0);
   $123 = (($122) + ($120)|0);
   HEAP8[$123>>0] = $115;
   STACKTOP = sp;return;
   break;
  }
  case 85:  {
   $124 = $0;
   $125 = ((($124)) + 2|0);
   $126 = HEAP16[$125>>1]|0;
   $127 = $126&65535;
   $128 = $0;
   $129 = ((($128)) + 42|0);
   $130 = (($129) + ($127)|0);
   $131 = $0;
   $132 = ((($131)) + 26|0);
   $133 = $regx;
   $134 = (($133) + 1)|0;
   _memcpy(($130|0),($132|0),($134|0))|0;
   STACKTOP = sp;return;
   break;
  }
  case 101:  {
   $135 = $0;
   $136 = ((($135)) + 26|0);
   $137 = $0;
   $138 = ((($137)) + 2|0);
   $139 = HEAP16[$138>>1]|0;
   $140 = $139&65535;
   $141 = $0;
   $142 = ((($141)) + 42|0);
   $143 = (($142) + ($140)|0);
   $144 = $regx;
   $145 = (($144) + 1)|0;
   _memcpy(($136|0),($143|0),($145|0))|0;
   STACKTOP = sp;return;
   break;
  }
  default: {
   $146 = $0;
   $147 = ((($146)) + 20816|0);
   HEAP32[$147>>2] = -2;
   STACKTOP = sp;return;
  }
  }
 } while(0);
}
function ___stdio_close($f) {
 $f = $f|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $vararg_buffer = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $vararg_buffer = sp;
 $0 = ((($f)) + 60|0);
 $1 = HEAP32[$0>>2]|0;
 HEAP32[$vararg_buffer>>2] = $1;
 $2 = (___syscall6(6,($vararg_buffer|0))|0);
 $3 = (___syscall_ret($2)|0);
 STACKTOP = sp;return ($3|0);
}
function ___syscall_ret($r) {
 $r = $r|0;
 var $$0 = 0, $0 = 0, $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ($r>>>0)>(4294963200);
 if ($0) {
  $1 = (0 - ($r))|0;
  $2 = (___errno_location()|0);
  HEAP32[$2>>2] = $1;
  $$0 = -1;
 } else {
  $$0 = $r;
 }
 return ($$0|0);
}
function ___errno_location() {
 var $$0 = 0, $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = HEAP32[7412]|0;
 $1 = ($0|0)==(0|0);
 if ($1) {
  $$0 = 29692;
 } else {
  $2 = (_pthread_self()|0);
  $3 = ((($2)) + 64|0);
  $4 = HEAP32[$3>>2]|0;
  $$0 = $4;
 }
 return ($$0|0);
}
function ___stdio_write($f,$buf,$len) {
 $f = $f|0;
 $buf = $buf|0;
 $len = $len|0;
 var $$0 = 0, $$phi$trans$insert = 0, $$pre = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0;
 var $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0;
 var $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $cnt$0 = 0, $cnt$1 = 0, $iov$0 = 0, $iov$0$lcssa11 = 0, $iov$1 = 0, $iovcnt$0 = 0, $iovcnt$0$lcssa12 = 0;
 var $iovcnt$1 = 0, $iovs = 0, $rem$0 = 0, $vararg_buffer = 0, $vararg_buffer3 = 0, $vararg_ptr1 = 0, $vararg_ptr2 = 0, $vararg_ptr6 = 0, $vararg_ptr7 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 48|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $vararg_buffer3 = sp + 16|0;
 $vararg_buffer = sp;
 $iovs = sp + 32|0;
 $0 = ((($f)) + 28|0);
 $1 = HEAP32[$0>>2]|0;
 HEAP32[$iovs>>2] = $1;
 $2 = ((($iovs)) + 4|0);
 $3 = ((($f)) + 20|0);
 $4 = HEAP32[$3>>2]|0;
 $5 = (($4) - ($1))|0;
 HEAP32[$2>>2] = $5;
 $6 = ((($iovs)) + 8|0);
 HEAP32[$6>>2] = $buf;
 $7 = ((($iovs)) + 12|0);
 HEAP32[$7>>2] = $len;
 $8 = (($5) + ($len))|0;
 $9 = ((($f)) + 60|0);
 $10 = ((($f)) + 44|0);
 $iov$0 = $iovs;$iovcnt$0 = 2;$rem$0 = $8;
 while(1) {
  $11 = HEAP32[7412]|0;
  $12 = ($11|0)==(0|0);
  if ($12) {
   $16 = HEAP32[$9>>2]|0;
   HEAP32[$vararg_buffer3>>2] = $16;
   $vararg_ptr6 = ((($vararg_buffer3)) + 4|0);
   HEAP32[$vararg_ptr6>>2] = $iov$0;
   $vararg_ptr7 = ((($vararg_buffer3)) + 8|0);
   HEAP32[$vararg_ptr7>>2] = $iovcnt$0;
   $17 = (___syscall146(146,($vararg_buffer3|0))|0);
   $18 = (___syscall_ret($17)|0);
   $cnt$0 = $18;
  } else {
   _pthread_cleanup_push((25|0),($f|0));
   $13 = HEAP32[$9>>2]|0;
   HEAP32[$vararg_buffer>>2] = $13;
   $vararg_ptr1 = ((($vararg_buffer)) + 4|0);
   HEAP32[$vararg_ptr1>>2] = $iov$0;
   $vararg_ptr2 = ((($vararg_buffer)) + 8|0);
   HEAP32[$vararg_ptr2>>2] = $iovcnt$0;
   $14 = (___syscall146(146,($vararg_buffer|0))|0);
   $15 = (___syscall_ret($14)|0);
   _pthread_cleanup_pop(0);
   $cnt$0 = $15;
  }
  $19 = ($rem$0|0)==($cnt$0|0);
  if ($19) {
   label = 6;
   break;
  }
  $26 = ($cnt$0|0)<(0);
  if ($26) {
   $iov$0$lcssa11 = $iov$0;$iovcnt$0$lcssa12 = $iovcnt$0;
   label = 8;
   break;
  }
  $34 = (($rem$0) - ($cnt$0))|0;
  $35 = ((($iov$0)) + 4|0);
  $36 = HEAP32[$35>>2]|0;
  $37 = ($cnt$0>>>0)>($36>>>0);
  if ($37) {
   $38 = HEAP32[$10>>2]|0;
   HEAP32[$0>>2] = $38;
   HEAP32[$3>>2] = $38;
   $39 = (($cnt$0) - ($36))|0;
   $40 = ((($iov$0)) + 8|0);
   $41 = (($iovcnt$0) + -1)|0;
   $$phi$trans$insert = ((($iov$0)) + 12|0);
   $$pre = HEAP32[$$phi$trans$insert>>2]|0;
   $49 = $$pre;$cnt$1 = $39;$iov$1 = $40;$iovcnt$1 = $41;
  } else {
   $42 = ($iovcnt$0|0)==(2);
   if ($42) {
    $43 = HEAP32[$0>>2]|0;
    $44 = (($43) + ($cnt$0)|0);
    HEAP32[$0>>2] = $44;
    $49 = $36;$cnt$1 = $cnt$0;$iov$1 = $iov$0;$iovcnt$1 = 2;
   } else {
    $49 = $36;$cnt$1 = $cnt$0;$iov$1 = $iov$0;$iovcnt$1 = $iovcnt$0;
   }
  }
  $45 = HEAP32[$iov$1>>2]|0;
  $46 = (($45) + ($cnt$1)|0);
  HEAP32[$iov$1>>2] = $46;
  $47 = ((($iov$1)) + 4|0);
  $48 = (($49) - ($cnt$1))|0;
  HEAP32[$47>>2] = $48;
  $iov$0 = $iov$1;$iovcnt$0 = $iovcnt$1;$rem$0 = $34;
 }
 if ((label|0) == 6) {
  $20 = HEAP32[$10>>2]|0;
  $21 = ((($f)) + 48|0);
  $22 = HEAP32[$21>>2]|0;
  $23 = (($20) + ($22)|0);
  $24 = ((($f)) + 16|0);
  HEAP32[$24>>2] = $23;
  $25 = $20;
  HEAP32[$0>>2] = $25;
  HEAP32[$3>>2] = $25;
  $$0 = $len;
 }
 else if ((label|0) == 8) {
  $27 = ((($f)) + 16|0);
  HEAP32[$27>>2] = 0;
  HEAP32[$0>>2] = 0;
  HEAP32[$3>>2] = 0;
  $28 = HEAP32[$f>>2]|0;
  $29 = $28 | 32;
  HEAP32[$f>>2] = $29;
  $30 = ($iovcnt$0$lcssa12|0)==(2);
  if ($30) {
   $$0 = 0;
  } else {
   $31 = ((($iov$0$lcssa11)) + 4|0);
   $32 = HEAP32[$31>>2]|0;
   $33 = (($len) - ($32))|0;
   $$0 = $33;
  }
 }
 STACKTOP = sp;return ($$0|0);
}
function _cleanup($p) {
 $p = $p|0;
 var $0 = 0, $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ((($p)) + 68|0);
 $1 = HEAP32[$0>>2]|0;
 $2 = ($1|0)==(0);
 if ($2) {
  ___unlockfile($p);
 }
 return;
}
function ___unlockfile($f) {
 $f = $f|0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 return;
}
function ___stdio_seek($f,$off,$whence) {
 $f = $f|0;
 $off = $off|0;
 $whence = $whence|0;
 var $$pre = 0, $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $ret = 0, $vararg_buffer = 0, $vararg_ptr1 = 0, $vararg_ptr2 = 0, $vararg_ptr3 = 0, $vararg_ptr4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $vararg_buffer = sp;
 $ret = sp + 20|0;
 $0 = ((($f)) + 60|0);
 $1 = HEAP32[$0>>2]|0;
 HEAP32[$vararg_buffer>>2] = $1;
 $vararg_ptr1 = ((($vararg_buffer)) + 4|0);
 HEAP32[$vararg_ptr1>>2] = 0;
 $vararg_ptr2 = ((($vararg_buffer)) + 8|0);
 HEAP32[$vararg_ptr2>>2] = $off;
 $vararg_ptr3 = ((($vararg_buffer)) + 12|0);
 HEAP32[$vararg_ptr3>>2] = $ret;
 $vararg_ptr4 = ((($vararg_buffer)) + 16|0);
 HEAP32[$vararg_ptr4>>2] = $whence;
 $2 = (___syscall140(140,($vararg_buffer|0))|0);
 $3 = (___syscall_ret($2)|0);
 $4 = ($3|0)<(0);
 if ($4) {
  HEAP32[$ret>>2] = -1;
  $5 = -1;
 } else {
  $$pre = HEAP32[$ret>>2]|0;
  $5 = $$pre;
 }
 STACKTOP = sp;return ($5|0);
}
function ___stdout_write($f,$buf,$len) {
 $f = $f|0;
 $buf = $buf|0;
 $len = $len|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $tio = 0, $vararg_buffer = 0, $vararg_ptr1 = 0, $vararg_ptr2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 80|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $vararg_buffer = sp;
 $tio = sp + 12|0;
 $0 = ((($f)) + 36|0);
 HEAP32[$0>>2] = 18;
 $1 = HEAP32[$f>>2]|0;
 $2 = $1 & 64;
 $3 = ($2|0)==(0);
 if ($3) {
  $4 = ((($f)) + 60|0);
  $5 = HEAP32[$4>>2]|0;
  HEAP32[$vararg_buffer>>2] = $5;
  $vararg_ptr1 = ((($vararg_buffer)) + 4|0);
  HEAP32[$vararg_ptr1>>2] = 21505;
  $vararg_ptr2 = ((($vararg_buffer)) + 8|0);
  HEAP32[$vararg_ptr2>>2] = $tio;
  $6 = (___syscall54(54,($vararg_buffer|0))|0);
  $7 = ($6|0)==(0);
  if (!($7)) {
   $8 = ((($f)) + 75|0);
   HEAP8[$8>>0] = -1;
  }
 }
 $9 = (___stdio_write($f,$buf,$len)|0);
 STACKTOP = sp;return ($9|0);
}
function ___stdio_read($f,$buf,$len) {
 $f = $f|0;
 $buf = $buf|0;
 $len = $len|0;
 var $$0 = 0, $$cast = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0;
 var $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0;
 var $8 = 0, $9 = 0, $cnt$0 = 0, $iov = 0, $vararg_buffer = 0, $vararg_buffer3 = 0, $vararg_ptr1 = 0, $vararg_ptr2 = 0, $vararg_ptr6 = 0, $vararg_ptr7 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 48|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $vararg_buffer3 = sp + 16|0;
 $vararg_buffer = sp;
 $iov = sp + 32|0;
 HEAP32[$iov>>2] = $buf;
 $0 = ((($iov)) + 4|0);
 $1 = ((($f)) + 48|0);
 $2 = HEAP32[$1>>2]|0;
 $3 = ($2|0)!=(0);
 $4 = $3&1;
 $5 = (($len) - ($4))|0;
 HEAP32[$0>>2] = $5;
 $6 = ((($iov)) + 8|0);
 $7 = ((($f)) + 44|0);
 $8 = HEAP32[$7>>2]|0;
 HEAP32[$6>>2] = $8;
 $9 = ((($iov)) + 12|0);
 HEAP32[$9>>2] = $2;
 $10 = HEAP32[7412]|0;
 $11 = ($10|0)==(0|0);
 if ($11) {
  $16 = ((($f)) + 60|0);
  $17 = HEAP32[$16>>2]|0;
  HEAP32[$vararg_buffer3>>2] = $17;
  $vararg_ptr6 = ((($vararg_buffer3)) + 4|0);
  HEAP32[$vararg_ptr6>>2] = $iov;
  $vararg_ptr7 = ((($vararg_buffer3)) + 8|0);
  HEAP32[$vararg_ptr7>>2] = 2;
  $18 = (___syscall145(145,($vararg_buffer3|0))|0);
  $19 = (___syscall_ret($18)|0);
  $cnt$0 = $19;
 } else {
  _pthread_cleanup_push((26|0),($f|0));
  $12 = ((($f)) + 60|0);
  $13 = HEAP32[$12>>2]|0;
  HEAP32[$vararg_buffer>>2] = $13;
  $vararg_ptr1 = ((($vararg_buffer)) + 4|0);
  HEAP32[$vararg_ptr1>>2] = $iov;
  $vararg_ptr2 = ((($vararg_buffer)) + 8|0);
  HEAP32[$vararg_ptr2>>2] = 2;
  $14 = (___syscall145(145,($vararg_buffer|0))|0);
  $15 = (___syscall_ret($14)|0);
  _pthread_cleanup_pop(0);
  $cnt$0 = $15;
 }
 $20 = ($cnt$0|0)<(1);
 if ($20) {
  $21 = $cnt$0 & 48;
  $22 = $21 ^ 16;
  $23 = HEAP32[$f>>2]|0;
  $24 = $23 | $22;
  HEAP32[$f>>2] = $24;
  $25 = ((($f)) + 8|0);
  HEAP32[$25>>2] = 0;
  $26 = ((($f)) + 4|0);
  HEAP32[$26>>2] = 0;
  $$0 = $cnt$0;
 } else {
  $27 = HEAP32[$0>>2]|0;
  $28 = ($cnt$0>>>0)>($27>>>0);
  if ($28) {
   $29 = (($cnt$0) - ($27))|0;
   $30 = HEAP32[$7>>2]|0;
   $31 = ((($f)) + 4|0);
   HEAP32[$31>>2] = $30;
   $$cast = $30;
   $32 = (($$cast) + ($29)|0);
   $33 = ((($f)) + 8|0);
   HEAP32[$33>>2] = $32;
   $34 = HEAP32[$1>>2]|0;
   $35 = ($34|0)==(0);
   if ($35) {
    $$0 = $len;
   } else {
    $36 = ((($$cast)) + 1|0);
    HEAP32[$31>>2] = $36;
    $37 = HEAP8[$$cast>>0]|0;
    $38 = (($len) + -1)|0;
    $39 = (($buf) + ($38)|0);
    HEAP8[$39>>0] = $37;
    $$0 = $len;
   }
  } else {
   $$0 = $cnt$0;
  }
 }
 STACKTOP = sp;return ($$0|0);
}
function _cleanup_15($p) {
 $p = $p|0;
 var $0 = 0, $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ((($p)) + 68|0);
 $1 = HEAP32[$0>>2]|0;
 $2 = ($1|0)==(0);
 if ($2) {
  ___unlockfile($p);
 }
 return;
}
function _vfprintf($f,$fmt,$ap) {
 $f = $f|0;
 $fmt = $fmt|0;
 $ap = $ap|0;
 var $$ = 0, $$0 = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0;
 var $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $ap2 = 0, $internal_buf = 0, $nl_arg = 0, $nl_type = 0;
 var $ret$1 = 0, $ret$1$ = 0, $vacopy_currentptr = 0, dest = 0, label = 0, sp = 0, stop = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 224|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $ap2 = sp + 120|0;
 $nl_type = sp + 80|0;
 $nl_arg = sp;
 $internal_buf = sp + 136|0;
 dest=$nl_type; stop=dest+40|0; do { HEAP32[dest>>2]=0|0; dest=dest+4|0; } while ((dest|0) < (stop|0));
 $vacopy_currentptr = HEAP32[$ap>>2]|0;
 HEAP32[$ap2>>2] = $vacopy_currentptr;
 $0 = (_printf_core(0,$fmt,$ap2,$nl_arg,$nl_type)|0);
 $1 = ($0|0)<(0);
 if ($1) {
  $$0 = -1;
 } else {
  $2 = ((($f)) + 76|0);
  $3 = HEAP32[$2>>2]|0;
  $4 = ($3|0)>(-1);
  if ($4) {
   $5 = (___lockfile($f)|0);
   $32 = $5;
  } else {
   $32 = 0;
  }
  $6 = HEAP32[$f>>2]|0;
  $7 = $6 & 32;
  $8 = ((($f)) + 74|0);
  $9 = HEAP8[$8>>0]|0;
  $10 = ($9<<24>>24)<(1);
  if ($10) {
   $11 = $6 & -33;
   HEAP32[$f>>2] = $11;
  }
  $12 = ((($f)) + 48|0);
  $13 = HEAP32[$12>>2]|0;
  $14 = ($13|0)==(0);
  if ($14) {
   $16 = ((($f)) + 44|0);
   $17 = HEAP32[$16>>2]|0;
   HEAP32[$16>>2] = $internal_buf;
   $18 = ((($f)) + 28|0);
   HEAP32[$18>>2] = $internal_buf;
   $19 = ((($f)) + 20|0);
   HEAP32[$19>>2] = $internal_buf;
   HEAP32[$12>>2] = 80;
   $20 = ((($internal_buf)) + 80|0);
   $21 = ((($f)) + 16|0);
   HEAP32[$21>>2] = $20;
   $22 = (_printf_core($f,$fmt,$ap2,$nl_arg,$nl_type)|0);
   $23 = ($17|0)==(0|0);
   if ($23) {
    $ret$1 = $22;
   } else {
    $24 = ((($f)) + 36|0);
    $25 = HEAP32[$24>>2]|0;
    (FUNCTION_TABLE_iiii[$25 & 31]($f,0,0)|0);
    $26 = HEAP32[$19>>2]|0;
    $27 = ($26|0)==(0|0);
    $$ = $27 ? -1 : $22;
    HEAP32[$16>>2] = $17;
    HEAP32[$12>>2] = 0;
    HEAP32[$21>>2] = 0;
    HEAP32[$18>>2] = 0;
    HEAP32[$19>>2] = 0;
    $ret$1 = $$;
   }
  } else {
   $15 = (_printf_core($f,$fmt,$ap2,$nl_arg,$nl_type)|0);
   $ret$1 = $15;
  }
  $28 = HEAP32[$f>>2]|0;
  $29 = $28 & 32;
  $30 = ($29|0)==(0);
  $ret$1$ = $30 ? $ret$1 : -1;
  $31 = $28 | $7;
  HEAP32[$f>>2] = $31;
  $33 = ($32|0)==(0);
  if (!($33)) {
   ___unlockfile($f);
  }
  $$0 = $ret$1$;
 }
 STACKTOP = sp;return ($$0|0);
}
function _printf_core($f,$fmt,$ap,$nl_arg,$nl_type) {
 $f = $f|0;
 $fmt = $fmt|0;
 $ap = $ap|0;
 $nl_arg = $nl_arg|0;
 $nl_type = $nl_type|0;
 var $$ = 0, $$$i = 0, $$0 = 0, $$0$i = 0, $$0$lcssa$i = 0, $$012$i = 0, $$013$i = 0, $$03$i33 = 0, $$07$i = 0.0, $$1$i = 0.0, $$114$i = 0, $$2$i = 0.0, $$20$i = 0.0, $$210$$24$i = 0, $$210$$26$i = 0, $$210$i = 0, $$23$i = 0, $$25$i = 0, $$3$i = 0.0, $$311$i = 0;
 var $$33$i = 0, $$36$i = 0.0, $$4$i = 0.0, $$412$lcssa$i = 0, $$41278$i = 0, $$43 = 0, $$5$lcssa$i = 0, $$589$i = 0, $$a$3$i = 0, $$a$3191$i = 0, $$a$3192$i = 0, $$fl$4 = 0, $$l10n$0 = 0, $$lcssa = 0, $$lcssa162$i = 0, $$lcssa295 = 0, $$lcssa300 = 0, $$lcssa301 = 0, $$lcssa302 = 0, $$lcssa303 = 0;
 var $$lcssa304 = 0, $$lcssa306 = 0, $$lcssa316 = 0, $$lcssa319 = 0.0, $$lcssa321 = 0, $$neg55$i = 0, $$neg56$i = 0, $$p$$i = 0, $$p$5 = 0, $$p$i = 0, $$pn$i = 0, $$pr$i = 0, $$pr50$i = 0, $$pre = 0, $$pre$i = 0, $$pre$phi190$iZ2D = 0, $$pre170 = 0, $$pre171 = 0, $$pre185$i = 0, $$pre188$i = 0;
 var $$pre189$i = 0, $$z$3$i = 0, $$z$4$i = 0, $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0;
 var $113 = 0, $114 = 0, $115 = 0, $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0;
 var $131 = 0, $132 = 0, $133 = 0, $134 = 0, $135 = 0, $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0;
 var $15 = 0, $150 = 0, $151 = 0, $152 = 0, $153 = 0, $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0, $159 = 0, $16 = 0, $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0;
 var $168 = 0, $169 = 0, $17 = 0, $170 = 0, $171 = 0, $172 = 0, $173 = 0, $174 = 0, $175 = 0, $176 = 0, $177 = 0, $178 = 0, $179 = 0, $18 = 0, $180 = 0, $181 = 0, $182 = 0, $183 = 0, $184 = 0, $185 = 0;
 var $186 = 0, $187 = 0, $188 = 0, $189 = 0, $19 = 0, $190 = 0, $191 = 0, $192 = 0, $193 = 0, $194 = 0, $195 = 0, $196 = 0, $197 = 0, $198 = 0, $199 = 0, $2 = 0, $20 = 0, $200 = 0, $201 = 0, $202 = 0;
 var $203 = 0, $204 = 0, $205 = 0, $206 = 0, $207 = 0, $208 = 0, $209 = 0, $21 = 0, $210 = 0, $211 = 0, $212 = 0, $213 = 0, $214 = 0, $215 = 0, $216 = 0, $217 = 0, $218 = 0, $219 = 0, $22 = 0, $220 = 0;
 var $221 = 0, $222 = 0, $223 = 0, $224 = 0, $225 = 0, $226 = 0, $227 = 0, $228 = 0, $229 = 0, $23 = 0, $230 = 0, $231 = 0, $232 = 0, $233 = 0, $234 = 0, $235 = 0, $236 = 0, $237 = 0, $238 = 0, $239 = 0;
 var $24 = 0, $240 = 0, $241 = 0, $242 = 0, $243 = 0, $244 = 0, $245 = 0, $246 = 0, $247 = 0, $248 = 0, $249 = 0, $25 = 0, $250 = 0, $251 = 0, $252 = 0, $253 = 0, $254 = 0, $255 = 0, $256 = 0, $257 = 0;
 var $258 = 0, $259 = 0, $26 = 0, $260 = 0, $261 = 0, $262 = 0, $263 = 0, $264 = 0, $265 = 0, $266 = 0, $267 = 0, $268 = 0, $269 = 0, $27 = 0, $270 = 0, $271 = 0, $272 = 0, $273 = 0, $274 = 0, $275 = 0;
 var $276 = 0, $277 = 0, $278 = 0, $279 = 0, $28 = 0, $280 = 0, $281 = 0, $282 = 0, $283 = 0, $284 = 0, $285 = 0, $286 = 0, $287 = 0, $288 = 0, $289 = 0, $29 = 0, $290 = 0, $291 = 0, $292 = 0, $293 = 0;
 var $294 = 0, $295 = 0, $296 = 0, $297 = 0, $298 = 0, $299 = 0, $3 = 0, $30 = 0, $300 = 0, $301 = 0, $302 = 0, $303 = 0, $304 = 0, $305 = 0, $306 = 0, $307 = 0, $308 = 0, $309 = 0, $31 = 0, $310 = 0;
 var $311 = 0, $312 = 0, $313 = 0, $314 = 0, $315 = 0, $316 = 0, $317 = 0, $318 = 0, $319 = 0, $32 = 0, $320 = 0, $321 = 0, $322 = 0, $323 = 0, $324 = 0, $325 = 0, $326 = 0, $327 = 0, $328 = 0, $329 = 0;
 var $33 = 0, $330 = 0, $331 = 0, $332 = 0, $333 = 0, $334 = 0, $335 = 0, $336 = 0, $337 = 0, $338 = 0, $339 = 0, $34 = 0, $340 = 0, $341 = 0, $342 = 0, $343 = 0, $344 = 0, $345 = 0, $346 = 0, $347 = 0;
 var $348 = 0, $349 = 0, $35 = 0, $350 = 0, $351 = 0, $352 = 0, $353 = 0, $354 = 0, $355 = 0, $356 = 0, $357 = 0, $358 = 0.0, $359 = 0, $36 = 0, $360 = 0, $361 = 0, $362 = 0.0, $363 = 0, $364 = 0, $365 = 0;
 var $366 = 0, $367 = 0, $368 = 0, $369 = 0, $37 = 0, $370 = 0, $371 = 0, $372 = 0, $373 = 0, $374 = 0, $375 = 0, $376 = 0, $377 = 0, $378 = 0, $379 = 0, $38 = 0, $380 = 0, $381 = 0, $382 = 0, $383 = 0;
 var $384 = 0, $385 = 0, $386 = 0, $387 = 0, $388 = 0, $389 = 0, $39 = 0, $390 = 0.0, $391 = 0.0, $392 = 0, $393 = 0, $394 = 0, $395 = 0, $396 = 0, $397 = 0, $398 = 0, $399 = 0, $4 = 0, $40 = 0, $400 = 0;
 var $401 = 0, $402 = 0, $403 = 0, $404 = 0, $405 = 0, $406 = 0.0, $407 = 0, $408 = 0, $409 = 0, $41 = 0, $410 = 0.0, $411 = 0.0, $412 = 0.0, $413 = 0.0, $414 = 0.0, $415 = 0.0, $416 = 0, $417 = 0, $418 = 0, $419 = 0;
 var $42 = 0, $420 = 0, $421 = 0, $422 = 0, $423 = 0, $424 = 0, $425 = 0, $426 = 0, $427 = 0, $428 = 0, $429 = 0, $43 = 0, $430 = 0, $431 = 0, $432 = 0, $433 = 0, $434 = 0, $435 = 0, $436 = 0, $437 = 0;
 var $438 = 0, $439 = 0, $44 = 0, $440 = 0, $441 = 0.0, $442 = 0.0, $443 = 0.0, $444 = 0, $445 = 0, $446 = 0, $447 = 0, $448 = 0, $449 = 0, $45 = 0, $450 = 0, $451 = 0, $452 = 0, $453 = 0, $454 = 0, $455 = 0;
 var $456 = 0, $457 = 0, $458 = 0, $459 = 0, $46 = 0, $460 = 0, $461 = 0, $462 = 0, $463 = 0, $464 = 0, $465 = 0, $466 = 0, $467 = 0, $468 = 0, $469 = 0, $47 = 0, $470 = 0, $471 = 0, $472 = 0, $473 = 0;
 var $474 = 0.0, $475 = 0, $476 = 0, $477 = 0, $478 = 0, $479 = 0, $48 = 0, $480 = 0, $481 = 0, $482 = 0.0, $483 = 0.0, $484 = 0.0, $485 = 0, $486 = 0, $487 = 0, $488 = 0, $489 = 0, $49 = 0, $490 = 0, $491 = 0;
 var $492 = 0, $493 = 0, $494 = 0, $495 = 0, $496 = 0, $497 = 0, $498 = 0, $499 = 0, $5 = 0, $50 = 0, $500 = 0, $501 = 0, $502 = 0, $503 = 0, $504 = 0, $505 = 0, $506 = 0, $507 = 0, $508 = 0, $509 = 0;
 var $51 = 0, $510 = 0, $511 = 0, $512 = 0, $513 = 0, $514 = 0, $515 = 0, $516 = 0, $517 = 0, $518 = 0, $519 = 0, $52 = 0, $520 = 0, $521 = 0, $522 = 0, $523 = 0, $524 = 0, $525 = 0, $526 = 0, $527 = 0;
 var $528 = 0, $529 = 0, $53 = 0, $530 = 0, $531 = 0, $532 = 0, $533 = 0, $534 = 0, $535 = 0, $536 = 0, $537 = 0, $538 = 0, $539 = 0, $54 = 0, $540 = 0, $541 = 0, $542 = 0, $543 = 0, $544 = 0, $545 = 0;
 var $546 = 0, $547 = 0, $548 = 0, $549 = 0, $55 = 0, $550 = 0, $551 = 0, $552 = 0, $553 = 0, $554 = 0, $555 = 0, $556 = 0, $557 = 0, $558 = 0, $559 = 0, $56 = 0, $560 = 0, $561 = 0, $562 = 0, $563 = 0;
 var $564 = 0, $565 = 0, $566 = 0, $567 = 0, $568 = 0, $569 = 0, $57 = 0, $570 = 0, $571 = 0, $572 = 0, $573 = 0, $574 = 0, $575 = 0, $576 = 0, $577 = 0, $578 = 0, $579 = 0, $58 = 0, $580 = 0, $581 = 0;
 var $582 = 0, $583 = 0, $584 = 0, $585 = 0, $586 = 0, $587 = 0, $588 = 0, $589 = 0, $59 = 0, $590 = 0, $591 = 0, $592 = 0, $593 = 0.0, $594 = 0.0, $595 = 0, $596 = 0.0, $597 = 0, $598 = 0, $599 = 0, $6 = 0;
 var $60 = 0, $600 = 0, $601 = 0, $602 = 0, $603 = 0, $604 = 0, $605 = 0, $606 = 0, $607 = 0, $608 = 0, $609 = 0, $61 = 0, $610 = 0, $611 = 0, $612 = 0, $613 = 0, $614 = 0, $615 = 0, $616 = 0, $617 = 0;
 var $618 = 0, $619 = 0, $62 = 0, $620 = 0, $621 = 0, $622 = 0, $623 = 0, $624 = 0, $625 = 0, $626 = 0, $627 = 0, $628 = 0, $629 = 0, $63 = 0, $630 = 0, $631 = 0, $632 = 0, $633 = 0, $634 = 0, $635 = 0;
 var $636 = 0, $637 = 0, $638 = 0, $639 = 0, $64 = 0, $640 = 0, $641 = 0, $642 = 0, $643 = 0, $644 = 0, $645 = 0, $646 = 0, $647 = 0, $648 = 0, $649 = 0, $65 = 0, $650 = 0, $651 = 0, $652 = 0, $653 = 0;
 var $654 = 0, $655 = 0, $656 = 0, $657 = 0, $658 = 0, $659 = 0, $66 = 0, $660 = 0, $661 = 0, $662 = 0, $663 = 0, $664 = 0, $665 = 0, $666 = 0, $667 = 0, $668 = 0, $669 = 0, $67 = 0, $670 = 0, $671 = 0;
 var $672 = 0, $673 = 0, $674 = 0, $675 = 0, $676 = 0, $677 = 0, $678 = 0, $679 = 0, $68 = 0, $680 = 0, $681 = 0, $682 = 0, $683 = 0, $684 = 0, $685 = 0, $686 = 0, $687 = 0, $688 = 0, $689 = 0, $69 = 0;
 var $690 = 0, $691 = 0, $692 = 0, $693 = 0, $694 = 0, $695 = 0, $696 = 0, $697 = 0, $698 = 0, $699 = 0, $7 = 0, $70 = 0, $700 = 0, $701 = 0, $702 = 0, $703 = 0, $704 = 0, $705 = 0, $706 = 0, $707 = 0;
 var $708 = 0, $709 = 0, $71 = 0, $710 = 0, $711 = 0, $712 = 0, $713 = 0, $714 = 0, $715 = 0, $716 = 0, $717 = 0, $718 = 0, $719 = 0, $72 = 0, $720 = 0, $721 = 0, $722 = 0, $723 = 0, $724 = 0, $725 = 0;
 var $726 = 0, $727 = 0, $728 = 0, $729 = 0, $73 = 0, $730 = 0, $731 = 0, $732 = 0, $733 = 0, $734 = 0, $735 = 0, $736 = 0, $737 = 0, $738 = 0, $739 = 0, $74 = 0, $740 = 0, $741 = 0, $742 = 0, $743 = 0;
 var $744 = 0, $745 = 0, $746 = 0, $747 = 0, $748 = 0, $749 = 0, $75 = 0, $750 = 0, $751 = 0, $752 = 0, $753 = 0, $754 = 0, $755 = 0, $756 = 0, $757 = 0, $758 = 0, $759 = 0, $76 = 0, $760 = 0, $761 = 0;
 var $762 = 0, $763 = 0, $764 = 0, $765 = 0, $766 = 0, $767 = 0, $768 = 0, $769 = 0, $77 = 0, $770 = 0, $771 = 0, $772 = 0, $773 = 0, $774 = 0, $775 = 0, $776 = 0, $777 = 0, $778 = 0, $779 = 0, $78 = 0;
 var $780 = 0, $781 = 0, $782 = 0, $783 = 0, $784 = 0, $785 = 0, $786 = 0, $787 = 0, $788 = 0, $789 = 0, $79 = 0, $790 = 0, $791 = 0, $792 = 0, $793 = 0, $794 = 0, $795 = 0, $796 = 0, $797 = 0, $798 = 0;
 var $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0;
 var $98 = 0, $99 = 0, $a$0 = 0, $a$1 = 0, $a$1$lcssa$i = 0, $a$1149$i = 0, $a$2 = 0, $a$2$ph$i = 0, $a$3$lcssa$i = 0, $a$3136$i = 0, $a$5$lcssa$i = 0, $a$5111$i = 0, $a$6$i = 0, $a$8$i = 0, $a$9$ph$i = 0, $arg = 0, $arglist_current = 0, $arglist_current2 = 0, $arglist_next = 0, $arglist_next3 = 0;
 var $argpos$0 = 0, $big$i = 0, $buf = 0, $buf$i = 0, $carry$0142$i = 0, $carry3$0130$i = 0, $cnt$0 = 0, $cnt$1 = 0, $cnt$1$lcssa = 0, $d$0$i = 0, $d$0141$i = 0, $d$0143$i = 0, $d$1129$i = 0, $d$2$lcssa$i = 0, $d$2110$i = 0, $d$4$i = 0, $d$584$i = 0, $d$677$i = 0, $d$788$i = 0, $e$0125$i = 0;
 var $e$1$i = 0, $e$2106$i = 0, $e$4$i = 0, $e$5$ph$i = 0, $e2$i = 0, $ebuf0$i = 0, $estr$0$i = 0, $estr$1$lcssa$i = 0, $estr$195$i = 0, $estr$2$i = 0, $exitcond$i = 0, $expanded = 0, $expanded10 = 0, $expanded11 = 0, $expanded13 = 0, $expanded14 = 0, $expanded15 = 0, $expanded4 = 0, $expanded6 = 0, $expanded7 = 0;
 var $expanded8 = 0, $fl$0100 = 0, $fl$053 = 0, $fl$1 = 0, $fl$1$ = 0, $fl$3 = 0, $fl$4 = 0, $fl$6 = 0, $i$0$lcssa = 0, $i$0$lcssa178 = 0, $i$0105 = 0, $i$0124$i = 0, $i$03$i = 0, $i$03$i25 = 0, $i$1$lcssa$i = 0, $i$1116 = 0, $i$1118$i = 0, $i$2105$i = 0, $i$291 = 0, $i$291$lcssa = 0;
 var $i$3101$i = 0, $i$389 = 0, $isdigit = 0, $isdigit$i = 0, $isdigit$i27 = 0, $isdigit10 = 0, $isdigit12 = 0, $isdigit2$i = 0, $isdigit2$i23 = 0, $isdigittmp = 0, $isdigittmp$ = 0, $isdigittmp$i = 0, $isdigittmp$i26 = 0, $isdigittmp1$i = 0, $isdigittmp1$i22 = 0, $isdigittmp11 = 0, $isdigittmp4$i = 0, $isdigittmp4$i24 = 0, $isdigittmp9 = 0, $j$0$i = 0;
 var $j$0117$i = 0, $j$0119$i = 0, $j$1102$i = 0, $j$2$i = 0, $l$0 = 0, $l$0$i = 0, $l$1$i = 0, $l$1104 = 0, $l$2 = 0, $l10n$0 = 0, $l10n$0$lcssa = 0, $l10n$0$phi = 0, $l10n$1 = 0, $l10n$2 = 0, $l10n$3 = 0, $mb = 0, $notlhs$i = 0, $notrhs$i = 0, $or$cond = 0, $or$cond$i = 0;
 var $or$cond122 = 0, $or$cond15 = 0, $or$cond17 = 0, $or$cond18$i = 0, $or$cond20 = 0, $or$cond22$i = 0, $or$cond3$not$i = 0, $or$cond31$i = 0, $or$cond6$i = 0, $p$0 = 0, $p$0$ = 0, $p$1 = 0, $p$2 = 0, $p$2$ = 0, $p$3 = 0, $p$4176 = 0, $p$5 = 0, $pl$0 = 0, $pl$0$i = 0, $pl$1 = 0;
 var $pl$1$i = 0, $pl$2 = 0, $prefix$0 = 0, $prefix$0$$i = 0, $prefix$0$i = 0, $prefix$1 = 0, $prefix$2 = 0, $r$0$a$9$i = 0, $re$171$i = 0, $round$070$i = 0.0, $round6$1$i = 0.0, $s$0 = 0, $s$0$i = 0, $s$1 = 0, $s$1$i = 0, $s$1$i$lcssa = 0, $s$2$lcssa = 0, $s$292 = 0, $s$4 = 0, $s$6 = 0;
 var $s$7 = 0, $s$7$lcssa298 = 0, $s1$0$i = 0, $s7$081$i = 0, $s7$1$i = 0, $s8$0$lcssa$i = 0, $s8$072$i = 0, $s9$0$i = 0, $s9$185$i = 0, $s9$2$i = 0, $scevgep182$i = 0, $scevgep182183$i = 0, $small$0$i = 0.0, $small$1$i = 0.0, $st$0 = 0, $st$0$lcssa299 = 0, $storemerge = 0, $storemerge13 = 0, $storemerge851 = 0, $storemerge899 = 0;
 var $sum = 0, $t$0 = 0, $t$1 = 0, $w$$i = 0, $w$0 = 0, $w$1 = 0, $w$2 = 0, $w$32$i = 0, $wc = 0, $ws$0106 = 0, $ws$1117 = 0, $z$0$i = 0, $z$0$lcssa = 0, $z$093 = 0, $z$1 = 0, $z$1$lcssa$i = 0, $z$1148$i = 0, $z$2 = 0, $z$2$i = 0, $z$2$i$lcssa = 0;
 var $z$3$lcssa$i = 0, $z$3135$i = 0, $z$4$i = 0, $z$7$$i = 0, $z$7$i = 0, $z$7$i$lcssa = 0, $z$7$ph$i = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 624|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $big$i = sp + 24|0;
 $e2$i = sp + 16|0;
 $buf$i = sp + 588|0;
 $ebuf0$i = sp + 576|0;
 $arg = sp;
 $buf = sp + 536|0;
 $wc = sp + 8|0;
 $mb = sp + 528|0;
 $0 = ($f|0)!=(0|0);
 $1 = ((($buf)) + 40|0);
 $2 = $1;
 $3 = ((($buf)) + 39|0);
 $4 = ((($wc)) + 4|0);
 $5 = $buf$i;
 $6 = (0 - ($5))|0;
 $7 = ((($ebuf0$i)) + 12|0);
 $8 = ((($ebuf0$i)) + 11|0);
 $9 = $7;
 $10 = (($9) - ($5))|0;
 $11 = (-2 - ($5))|0;
 $12 = (($9) + 2)|0;
 $13 = ((($big$i)) + 288|0);
 $14 = ((($buf$i)) + 9|0);
 $15 = $14;
 $16 = ((($buf$i)) + 8|0);
 $cnt$0 = 0;$l$0 = 0;$l10n$0 = 0;$s$0 = $fmt;
 L1: while(1) {
  $17 = ($cnt$0|0)>(-1);
  do {
   if ($17) {
    $18 = (2147483647 - ($cnt$0))|0;
    $19 = ($l$0|0)>($18|0);
    if ($19) {
     $20 = (___errno_location()|0);
     HEAP32[$20>>2] = 75;
     $cnt$1 = -1;
     break;
    } else {
     $21 = (($l$0) + ($cnt$0))|0;
     $cnt$1 = $21;
     break;
    }
   } else {
    $cnt$1 = $cnt$0;
   }
  } while(0);
  $22 = HEAP8[$s$0>>0]|0;
  $23 = ($22<<24>>24)==(0);
  if ($23) {
   $cnt$1$lcssa = $cnt$1;$l10n$0$lcssa = $l10n$0;
   label = 244;
   break;
  } else {
   $24 = $22;$s$1 = $s$0;
  }
  L9: while(1) {
   switch ($24<<24>>24) {
   case 37:  {
    $s$292 = $s$1;$z$093 = $s$1;
    label = 9;
    break L9;
    break;
   }
   case 0:  {
    $s$2$lcssa = $s$1;$z$0$lcssa = $s$1;
    break L9;
    break;
   }
   default: {
   }
   }
   $25 = ((($s$1)) + 1|0);
   $$pre = HEAP8[$25>>0]|0;
   $24 = $$pre;$s$1 = $25;
  }
  L12: do {
   if ((label|0) == 9) {
    while(1) {
     label = 0;
     $26 = ((($s$292)) + 1|0);
     $27 = HEAP8[$26>>0]|0;
     $28 = ($27<<24>>24)==(37);
     if (!($28)) {
      $s$2$lcssa = $s$292;$z$0$lcssa = $z$093;
      break L12;
     }
     $29 = ((($z$093)) + 1|0);
     $30 = ((($s$292)) + 2|0);
     $31 = HEAP8[$30>>0]|0;
     $32 = ($31<<24>>24)==(37);
     if ($32) {
      $s$292 = $30;$z$093 = $29;
      label = 9;
     } else {
      $s$2$lcssa = $30;$z$0$lcssa = $29;
      break;
     }
    }
   }
  } while(0);
  $33 = $z$0$lcssa;
  $34 = $s$0;
  $35 = (($33) - ($34))|0;
  if ($0) {
   $36 = HEAP32[$f>>2]|0;
   $37 = $36 & 32;
   $38 = ($37|0)==(0);
   if ($38) {
    (___fwritex($s$0,$35,$f)|0);
   }
  }
  $39 = ($z$0$lcssa|0)==($s$0|0);
  if (!($39)) {
   $l10n$0$phi = $l10n$0;$cnt$0 = $cnt$1;$l$0 = $35;$s$0 = $s$2$lcssa;$l10n$0 = $l10n$0$phi;
   continue;
  }
  $40 = ((($s$2$lcssa)) + 1|0);
  $41 = HEAP8[$40>>0]|0;
  $42 = $41 << 24 >> 24;
  $isdigittmp = (($42) + -48)|0;
  $isdigit = ($isdigittmp>>>0)<(10);
  if ($isdigit) {
   $43 = ((($s$2$lcssa)) + 2|0);
   $44 = HEAP8[$43>>0]|0;
   $45 = ($44<<24>>24)==(36);
   $46 = ((($s$2$lcssa)) + 3|0);
   $$43 = $45 ? $46 : $40;
   $$l10n$0 = $45 ? 1 : $l10n$0;
   $isdigittmp$ = $45 ? $isdigittmp : -1;
   $$pre170 = HEAP8[$$43>>0]|0;
   $48 = $$pre170;$argpos$0 = $isdigittmp$;$l10n$1 = $$l10n$0;$storemerge = $$43;
  } else {
   $48 = $41;$argpos$0 = -1;$l10n$1 = $l10n$0;$storemerge = $40;
  }
  $47 = $48 << 24 >> 24;
  $49 = $47 & -32;
  $50 = ($49|0)==(32);
  L25: do {
   if ($50) {
    $52 = $47;$57 = $48;$fl$0100 = 0;$storemerge899 = $storemerge;
    while(1) {
     $51 = (($52) + -32)|0;
     $53 = 1 << $51;
     $54 = $53 & 75913;
     $55 = ($54|0)==(0);
     if ($55) {
      $66 = $57;$fl$053 = $fl$0100;$storemerge851 = $storemerge899;
      break L25;
     }
     $56 = $57 << 24 >> 24;
     $58 = (($56) + -32)|0;
     $59 = 1 << $58;
     $60 = $59 | $fl$0100;
     $61 = ((($storemerge899)) + 1|0);
     $62 = HEAP8[$61>>0]|0;
     $63 = $62 << 24 >> 24;
     $64 = $63 & -32;
     $65 = ($64|0)==(32);
     if ($65) {
      $52 = $63;$57 = $62;$fl$0100 = $60;$storemerge899 = $61;
     } else {
      $66 = $62;$fl$053 = $60;$storemerge851 = $61;
      break;
     }
    }
   } else {
    $66 = $48;$fl$053 = 0;$storemerge851 = $storemerge;
   }
  } while(0);
  $67 = ($66<<24>>24)==(42);
  do {
   if ($67) {
    $68 = ((($storemerge851)) + 1|0);
    $69 = HEAP8[$68>>0]|0;
    $70 = $69 << 24 >> 24;
    $isdigittmp11 = (($70) + -48)|0;
    $isdigit12 = ($isdigittmp11>>>0)<(10);
    if ($isdigit12) {
     $71 = ((($storemerge851)) + 2|0);
     $72 = HEAP8[$71>>0]|0;
     $73 = ($72<<24>>24)==(36);
     if ($73) {
      $74 = (($nl_type) + ($isdigittmp11<<2)|0);
      HEAP32[$74>>2] = 10;
      $75 = HEAP8[$68>>0]|0;
      $76 = $75 << 24 >> 24;
      $77 = (($76) + -48)|0;
      $78 = (($nl_arg) + ($77<<3)|0);
      $79 = $78;
      $80 = $79;
      $81 = HEAP32[$80>>2]|0;
      $82 = (($79) + 4)|0;
      $83 = $82;
      $84 = HEAP32[$83>>2]|0;
      $85 = ((($storemerge851)) + 3|0);
      $l10n$2 = 1;$storemerge13 = $85;$w$0 = $81;
     } else {
      label = 24;
     }
    } else {
     label = 24;
    }
    if ((label|0) == 24) {
     label = 0;
     $86 = ($l10n$1|0)==(0);
     if (!($86)) {
      $$0 = -1;
      break L1;
     }
     if (!($0)) {
      $fl$1 = $fl$053;$l10n$3 = 0;$s$4 = $68;$w$1 = 0;
      break;
     }
     $arglist_current = HEAP32[$ap>>2]|0;
     $87 = $arglist_current;
     $88 = ((0) + 4|0);
     $expanded4 = $88;
     $expanded = (($expanded4) - 1)|0;
     $89 = (($87) + ($expanded))|0;
     $90 = ((0) + 4|0);
     $expanded8 = $90;
     $expanded7 = (($expanded8) - 1)|0;
     $expanded6 = $expanded7 ^ -1;
     $91 = $89 & $expanded6;
     $92 = $91;
     $93 = HEAP32[$92>>2]|0;
     $arglist_next = ((($92)) + 4|0);
     HEAP32[$ap>>2] = $arglist_next;
     $l10n$2 = 0;$storemerge13 = $68;$w$0 = $93;
    }
    $94 = ($w$0|0)<(0);
    if ($94) {
     $95 = $fl$053 | 8192;
     $96 = (0 - ($w$0))|0;
     $fl$1 = $95;$l10n$3 = $l10n$2;$s$4 = $storemerge13;$w$1 = $96;
    } else {
     $fl$1 = $fl$053;$l10n$3 = $l10n$2;$s$4 = $storemerge13;$w$1 = $w$0;
    }
   } else {
    $97 = $66 << 24 >> 24;
    $isdigittmp1$i = (($97) + -48)|0;
    $isdigit2$i = ($isdigittmp1$i>>>0)<(10);
    if ($isdigit2$i) {
     $101 = $storemerge851;$i$03$i = 0;$isdigittmp4$i = $isdigittmp1$i;
     while(1) {
      $98 = ($i$03$i*10)|0;
      $99 = (($98) + ($isdigittmp4$i))|0;
      $100 = ((($101)) + 1|0);
      $102 = HEAP8[$100>>0]|0;
      $103 = $102 << 24 >> 24;
      $isdigittmp$i = (($103) + -48)|0;
      $isdigit$i = ($isdigittmp$i>>>0)<(10);
      if ($isdigit$i) {
       $101 = $100;$i$03$i = $99;$isdigittmp4$i = $isdigittmp$i;
      } else {
       $$lcssa = $99;$$lcssa295 = $100;
       break;
      }
     }
     $104 = ($$lcssa|0)<(0);
     if ($104) {
      $$0 = -1;
      break L1;
     } else {
      $fl$1 = $fl$053;$l10n$3 = $l10n$1;$s$4 = $$lcssa295;$w$1 = $$lcssa;
     }
    } else {
     $fl$1 = $fl$053;$l10n$3 = $l10n$1;$s$4 = $storemerge851;$w$1 = 0;
    }
   }
  } while(0);
  $105 = HEAP8[$s$4>>0]|0;
  $106 = ($105<<24>>24)==(46);
  L46: do {
   if ($106) {
    $107 = ((($s$4)) + 1|0);
    $108 = HEAP8[$107>>0]|0;
    $109 = ($108<<24>>24)==(42);
    if (!($109)) {
     $136 = $108 << 24 >> 24;
     $isdigittmp1$i22 = (($136) + -48)|0;
     $isdigit2$i23 = ($isdigittmp1$i22>>>0)<(10);
     if ($isdigit2$i23) {
      $140 = $107;$i$03$i25 = 0;$isdigittmp4$i24 = $isdigittmp1$i22;
     } else {
      $p$0 = 0;$s$6 = $107;
      break;
     }
     while(1) {
      $137 = ($i$03$i25*10)|0;
      $138 = (($137) + ($isdigittmp4$i24))|0;
      $139 = ((($140)) + 1|0);
      $141 = HEAP8[$139>>0]|0;
      $142 = $141 << 24 >> 24;
      $isdigittmp$i26 = (($142) + -48)|0;
      $isdigit$i27 = ($isdigittmp$i26>>>0)<(10);
      if ($isdigit$i27) {
       $140 = $139;$i$03$i25 = $138;$isdigittmp4$i24 = $isdigittmp$i26;
      } else {
       $p$0 = $138;$s$6 = $139;
       break L46;
      }
     }
    }
    $110 = ((($s$4)) + 2|0);
    $111 = HEAP8[$110>>0]|0;
    $112 = $111 << 24 >> 24;
    $isdigittmp9 = (($112) + -48)|0;
    $isdigit10 = ($isdigittmp9>>>0)<(10);
    if ($isdigit10) {
     $113 = ((($s$4)) + 3|0);
     $114 = HEAP8[$113>>0]|0;
     $115 = ($114<<24>>24)==(36);
     if ($115) {
      $116 = (($nl_type) + ($isdigittmp9<<2)|0);
      HEAP32[$116>>2] = 10;
      $117 = HEAP8[$110>>0]|0;
      $118 = $117 << 24 >> 24;
      $119 = (($118) + -48)|0;
      $120 = (($nl_arg) + ($119<<3)|0);
      $121 = $120;
      $122 = $121;
      $123 = HEAP32[$122>>2]|0;
      $124 = (($121) + 4)|0;
      $125 = $124;
      $126 = HEAP32[$125>>2]|0;
      $127 = ((($s$4)) + 4|0);
      $p$0 = $123;$s$6 = $127;
      break;
     }
    }
    $128 = ($l10n$3|0)==(0);
    if (!($128)) {
     $$0 = -1;
     break L1;
    }
    if ($0) {
     $arglist_current2 = HEAP32[$ap>>2]|0;
     $129 = $arglist_current2;
     $130 = ((0) + 4|0);
     $expanded11 = $130;
     $expanded10 = (($expanded11) - 1)|0;
     $131 = (($129) + ($expanded10))|0;
     $132 = ((0) + 4|0);
     $expanded15 = $132;
     $expanded14 = (($expanded15) - 1)|0;
     $expanded13 = $expanded14 ^ -1;
     $133 = $131 & $expanded13;
     $134 = $133;
     $135 = HEAP32[$134>>2]|0;
     $arglist_next3 = ((($134)) + 4|0);
     HEAP32[$ap>>2] = $arglist_next3;
     $p$0 = $135;$s$6 = $110;
    } else {
     $p$0 = 0;$s$6 = $110;
    }
   } else {
    $p$0 = -1;$s$6 = $s$4;
   }
  } while(0);
  $s$7 = $s$6;$st$0 = 0;
  while(1) {
   $143 = HEAP8[$s$7>>0]|0;
   $144 = $143 << 24 >> 24;
   $145 = (($144) + -65)|0;
   $146 = ($145>>>0)>(57);
   if ($146) {
    $$0 = -1;
    break L1;
   }
   $147 = ((($s$7)) + 1|0);
   $148 = ((2568 + (($st$0*58)|0)|0) + ($145)|0);
   $149 = HEAP8[$148>>0]|0;
   $150 = $149&255;
   $151 = (($150) + -1)|0;
   $152 = ($151>>>0)<(8);
   if ($152) {
    $s$7 = $147;$st$0 = $150;
   } else {
    $$lcssa300 = $147;$$lcssa301 = $149;$$lcssa302 = $150;$s$7$lcssa298 = $s$7;$st$0$lcssa299 = $st$0;
    break;
   }
  }
  $153 = ($$lcssa301<<24>>24)==(0);
  if ($153) {
   $$0 = -1;
   break;
  }
  $154 = ($$lcssa301<<24>>24)==(19);
  $155 = ($argpos$0|0)>(-1);
  do {
   if ($154) {
    if ($155) {
     $$0 = -1;
     break L1;
    } else {
     label = 52;
    }
   } else {
    if ($155) {
     $156 = (($nl_type) + ($argpos$0<<2)|0);
     HEAP32[$156>>2] = $$lcssa302;
     $157 = (($nl_arg) + ($argpos$0<<3)|0);
     $158 = $157;
     $159 = $158;
     $160 = HEAP32[$159>>2]|0;
     $161 = (($158) + 4)|0;
     $162 = $161;
     $163 = HEAP32[$162>>2]|0;
     $164 = $arg;
     $165 = $164;
     HEAP32[$165>>2] = $160;
     $166 = (($164) + 4)|0;
     $167 = $166;
     HEAP32[$167>>2] = $163;
     label = 52;
     break;
    }
    if (!($0)) {
     $$0 = 0;
     break L1;
    }
    _pop_arg_46($arg,$$lcssa302,$ap);
   }
  } while(0);
  if ((label|0) == 52) {
   label = 0;
   if (!($0)) {
    $cnt$0 = $cnt$1;$l$0 = $35;$l10n$0 = $l10n$3;$s$0 = $$lcssa300;
    continue;
   }
  }
  $168 = HEAP8[$s$7$lcssa298>>0]|0;
  $169 = $168 << 24 >> 24;
  $170 = ($st$0$lcssa299|0)!=(0);
  $171 = $169 & 15;
  $172 = ($171|0)==(3);
  $or$cond15 = $170 & $172;
  $173 = $169 & -33;
  $t$0 = $or$cond15 ? $173 : $169;
  $174 = $fl$1 & 8192;
  $175 = ($174|0)==(0);
  $176 = $fl$1 & -65537;
  $fl$1$ = $175 ? $fl$1 : $176;
  L75: do {
   switch ($t$0|0) {
   case 110:  {
    switch ($st$0$lcssa299|0) {
    case 0:  {
     $183 = HEAP32[$arg>>2]|0;
     HEAP32[$183>>2] = $cnt$1;
     $cnt$0 = $cnt$1;$l$0 = $35;$l10n$0 = $l10n$3;$s$0 = $$lcssa300;
     continue L1;
     break;
    }
    case 1:  {
     $184 = HEAP32[$arg>>2]|0;
     HEAP32[$184>>2] = $cnt$1;
     $cnt$0 = $cnt$1;$l$0 = $35;$l10n$0 = $l10n$3;$s$0 = $$lcssa300;
     continue L1;
     break;
    }
    case 2:  {
     $185 = ($cnt$1|0)<(0);
     $186 = $185 << 31 >> 31;
     $187 = HEAP32[$arg>>2]|0;
     $188 = $187;
     $189 = $188;
     HEAP32[$189>>2] = $cnt$1;
     $190 = (($188) + 4)|0;
     $191 = $190;
     HEAP32[$191>>2] = $186;
     $cnt$0 = $cnt$1;$l$0 = $35;$l10n$0 = $l10n$3;$s$0 = $$lcssa300;
     continue L1;
     break;
    }
    case 3:  {
     $192 = $cnt$1&65535;
     $193 = HEAP32[$arg>>2]|0;
     HEAP16[$193>>1] = $192;
     $cnt$0 = $cnt$1;$l$0 = $35;$l10n$0 = $l10n$3;$s$0 = $$lcssa300;
     continue L1;
     break;
    }
    case 4:  {
     $194 = $cnt$1&255;
     $195 = HEAP32[$arg>>2]|0;
     HEAP8[$195>>0] = $194;
     $cnt$0 = $cnt$1;$l$0 = $35;$l10n$0 = $l10n$3;$s$0 = $$lcssa300;
     continue L1;
     break;
    }
    case 6:  {
     $196 = HEAP32[$arg>>2]|0;
     HEAP32[$196>>2] = $cnt$1;
     $cnt$0 = $cnt$1;$l$0 = $35;$l10n$0 = $l10n$3;$s$0 = $$lcssa300;
     continue L1;
     break;
    }
    case 7:  {
     $197 = ($cnt$1|0)<(0);
     $198 = $197 << 31 >> 31;
     $199 = HEAP32[$arg>>2]|0;
     $200 = $199;
     $201 = $200;
     HEAP32[$201>>2] = $cnt$1;
     $202 = (($200) + 4)|0;
     $203 = $202;
     HEAP32[$203>>2] = $198;
     $cnt$0 = $cnt$1;$l$0 = $35;$l10n$0 = $l10n$3;$s$0 = $$lcssa300;
     continue L1;
     break;
    }
    default: {
     $cnt$0 = $cnt$1;$l$0 = $35;$l10n$0 = $l10n$3;$s$0 = $$lcssa300;
     continue L1;
    }
    }
    break;
   }
   case 112:  {
    $204 = ($p$0>>>0)>(8);
    $205 = $204 ? $p$0 : 8;
    $206 = $fl$1$ | 8;
    $fl$3 = $206;$p$1 = $205;$t$1 = 120;
    label = 64;
    break;
   }
   case 88: case 120:  {
    $fl$3 = $fl$1$;$p$1 = $p$0;$t$1 = $t$0;
    label = 64;
    break;
   }
   case 111:  {
    $244 = $arg;
    $245 = $244;
    $246 = HEAP32[$245>>2]|0;
    $247 = (($244) + 4)|0;
    $248 = $247;
    $249 = HEAP32[$248>>2]|0;
    $250 = ($246|0)==(0);
    $251 = ($249|0)==(0);
    $252 = $250 & $251;
    if ($252) {
     $$0$lcssa$i = $1;
    } else {
     $$03$i33 = $1;$254 = $246;$258 = $249;
     while(1) {
      $253 = $254 & 7;
      $255 = $253 | 48;
      $256 = $255&255;
      $257 = ((($$03$i33)) + -1|0);
      HEAP8[$257>>0] = $256;
      $259 = (_bitshift64Lshr(($254|0),($258|0),3)|0);
      $260 = tempRet0;
      $261 = ($259|0)==(0);
      $262 = ($260|0)==(0);
      $263 = $261 & $262;
      if ($263) {
       $$0$lcssa$i = $257;
       break;
      } else {
       $$03$i33 = $257;$254 = $259;$258 = $260;
      }
     }
    }
    $264 = $fl$1$ & 8;
    $265 = ($264|0)==(0);
    if ($265) {
     $a$0 = $$0$lcssa$i;$fl$4 = $fl$1$;$p$2 = $p$0;$pl$1 = 0;$prefix$1 = 3048;
     label = 77;
    } else {
     $266 = $$0$lcssa$i;
     $267 = (($2) - ($266))|0;
     $268 = ($p$0|0)>($267|0);
     $269 = (($267) + 1)|0;
     $p$0$ = $268 ? $p$0 : $269;
     $a$0 = $$0$lcssa$i;$fl$4 = $fl$1$;$p$2 = $p$0$;$pl$1 = 0;$prefix$1 = 3048;
     label = 77;
    }
    break;
   }
   case 105: case 100:  {
    $270 = $arg;
    $271 = $270;
    $272 = HEAP32[$271>>2]|0;
    $273 = (($270) + 4)|0;
    $274 = $273;
    $275 = HEAP32[$274>>2]|0;
    $276 = ($275|0)<(0);
    if ($276) {
     $277 = (_i64Subtract(0,0,($272|0),($275|0))|0);
     $278 = tempRet0;
     $279 = $arg;
     $280 = $279;
     HEAP32[$280>>2] = $277;
     $281 = (($279) + 4)|0;
     $282 = $281;
     HEAP32[$282>>2] = $278;
     $287 = $277;$288 = $278;$pl$0 = 1;$prefix$0 = 3048;
     label = 76;
     break L75;
    }
    $283 = $fl$1$ & 2048;
    $284 = ($283|0)==(0);
    if ($284) {
     $285 = $fl$1$ & 1;
     $286 = ($285|0)==(0);
     $$ = $286 ? 3048 : (3050);
     $287 = $272;$288 = $275;$pl$0 = $285;$prefix$0 = $$;
     label = 76;
    } else {
     $287 = $272;$288 = $275;$pl$0 = 1;$prefix$0 = (3049);
     label = 76;
    }
    break;
   }
   case 117:  {
    $177 = $arg;
    $178 = $177;
    $179 = HEAP32[$178>>2]|0;
    $180 = (($177) + 4)|0;
    $181 = $180;
    $182 = HEAP32[$181>>2]|0;
    $287 = $179;$288 = $182;$pl$0 = 0;$prefix$0 = 3048;
    label = 76;
    break;
   }
   case 99:  {
    $308 = $arg;
    $309 = $308;
    $310 = HEAP32[$309>>2]|0;
    $311 = (($308) + 4)|0;
    $312 = $311;
    $313 = HEAP32[$312>>2]|0;
    $314 = $310&255;
    HEAP8[$3>>0] = $314;
    $a$2 = $3;$fl$6 = $176;$p$5 = 1;$pl$2 = 0;$prefix$2 = 3048;$z$2 = $1;
    break;
   }
   case 109:  {
    $315 = (___errno_location()|0);
    $316 = HEAP32[$315>>2]|0;
    $317 = (_strerror($316)|0);
    $a$1 = $317;
    label = 82;
    break;
   }
   case 115:  {
    $318 = HEAP32[$arg>>2]|0;
    $319 = ($318|0)!=(0|0);
    $320 = $319 ? $318 : 4950;
    $a$1 = $320;
    label = 82;
    break;
   }
   case 67:  {
    $327 = $arg;
    $328 = $327;
    $329 = HEAP32[$328>>2]|0;
    $330 = (($327) + 4)|0;
    $331 = $330;
    $332 = HEAP32[$331>>2]|0;
    HEAP32[$wc>>2] = $329;
    HEAP32[$4>>2] = 0;
    HEAP32[$arg>>2] = $wc;
    $798 = $wc;$p$4176 = -1;
    label = 86;
    break;
   }
   case 83:  {
    $$pre171 = HEAP32[$arg>>2]|0;
    $333 = ($p$0|0)==(0);
    if ($333) {
     _pad($f,32,$w$1,0,$fl$1$);
     $i$0$lcssa178 = 0;
     label = 97;
    } else {
     $798 = $$pre171;$p$4176 = $p$0;
     label = 86;
    }
    break;
   }
   case 65: case 71: case 70: case 69: case 97: case 103: case 102: case 101:  {
    $358 = +HEAPF64[$arg>>3];
    HEAP32[$e2$i>>2] = 0;
    HEAPF64[tempDoublePtr>>3] = $358;$359 = HEAP32[tempDoublePtr>>2]|0;
    $360 = HEAP32[tempDoublePtr+4>>2]|0;
    $361 = ($360|0)<(0);
    if ($361) {
     $362 = -$358;
     $$07$i = $362;$pl$0$i = 1;$prefix$0$i = 4957;
    } else {
     $363 = $fl$1$ & 2048;
     $364 = ($363|0)==(0);
     if ($364) {
      $365 = $fl$1$ & 1;
      $366 = ($365|0)==(0);
      $$$i = $366 ? (4958) : (4963);
      $$07$i = $358;$pl$0$i = $365;$prefix$0$i = $$$i;
     } else {
      $$07$i = $358;$pl$0$i = 1;$prefix$0$i = (4960);
     }
    }
    HEAPF64[tempDoublePtr>>3] = $$07$i;$367 = HEAP32[tempDoublePtr>>2]|0;
    $368 = HEAP32[tempDoublePtr+4>>2]|0;
    $369 = $368 & 2146435072;
    $370 = ($369>>>0)<(2146435072);
    $371 = (0)<(0);
    $372 = ($369|0)==(2146435072);
    $373 = $372 & $371;
    $374 = $370 | $373;
    do {
     if ($374) {
      $390 = (+_frexpl($$07$i,$e2$i));
      $391 = $390 * 2.0;
      $392 = $391 != 0.0;
      if ($392) {
       $393 = HEAP32[$e2$i>>2]|0;
       $394 = (($393) + -1)|0;
       HEAP32[$e2$i>>2] = $394;
      }
      $395 = $t$0 | 32;
      $396 = ($395|0)==(97);
      if ($396) {
       $397 = $t$0 & 32;
       $398 = ($397|0)==(0);
       $399 = ((($prefix$0$i)) + 9|0);
       $prefix$0$$i = $398 ? $prefix$0$i : $399;
       $400 = $pl$0$i | 2;
       $401 = ($p$0>>>0)>(11);
       $402 = (12 - ($p$0))|0;
       $403 = ($402|0)==(0);
       $404 = $401 | $403;
       do {
        if ($404) {
         $$1$i = $391;
        } else {
         $re$171$i = $402;$round$070$i = 8.0;
         while(1) {
          $405 = (($re$171$i) + -1)|0;
          $406 = $round$070$i * 16.0;
          $407 = ($405|0)==(0);
          if ($407) {
           $$lcssa319 = $406;
           break;
          } else {
           $re$171$i = $405;$round$070$i = $406;
          }
         }
         $408 = HEAP8[$prefix$0$$i>>0]|0;
         $409 = ($408<<24>>24)==(45);
         if ($409) {
          $410 = -$391;
          $411 = $410 - $$lcssa319;
          $412 = $$lcssa319 + $411;
          $413 = -$412;
          $$1$i = $413;
          break;
         } else {
          $414 = $391 + $$lcssa319;
          $415 = $414 - $$lcssa319;
          $$1$i = $415;
          break;
         }
        }
       } while(0);
       $416 = HEAP32[$e2$i>>2]|0;
       $417 = ($416|0)<(0);
       $418 = (0 - ($416))|0;
       $419 = $417 ? $418 : $416;
       $420 = ($419|0)<(0);
       $421 = $420 << 31 >> 31;
       $422 = (_fmt_u($419,$421,$7)|0);
       $423 = ($422|0)==($7|0);
       if ($423) {
        HEAP8[$8>>0] = 48;
        $estr$0$i = $8;
       } else {
        $estr$0$i = $422;
       }
       $424 = $416 >> 31;
       $425 = $424 & 2;
       $426 = (($425) + 43)|0;
       $427 = $426&255;
       $428 = ((($estr$0$i)) + -1|0);
       HEAP8[$428>>0] = $427;
       $429 = (($t$0) + 15)|0;
       $430 = $429&255;
       $431 = ((($estr$0$i)) + -2|0);
       HEAP8[$431>>0] = $430;
       $notrhs$i = ($p$0|0)<(1);
       $432 = $fl$1$ & 8;
       $433 = ($432|0)==(0);
       $$2$i = $$1$i;$s$0$i = $buf$i;
       while(1) {
        $434 = (~~(($$2$i)));
        $435 = (3032 + ($434)|0);
        $436 = HEAP8[$435>>0]|0;
        $437 = $436&255;
        $438 = $437 | $397;
        $439 = $438&255;
        $440 = ((($s$0$i)) + 1|0);
        HEAP8[$s$0$i>>0] = $439;
        $441 = (+($434|0));
        $442 = $$2$i - $441;
        $443 = $442 * 16.0;
        $444 = $440;
        $445 = (($444) - ($5))|0;
        $446 = ($445|0)==(1);
        do {
         if ($446) {
          $notlhs$i = $443 == 0.0;
          $or$cond3$not$i = $notrhs$i & $notlhs$i;
          $or$cond$i = $433 & $or$cond3$not$i;
          if ($or$cond$i) {
           $s$1$i = $440;
           break;
          }
          $447 = ((($s$0$i)) + 2|0);
          HEAP8[$440>>0] = 46;
          $s$1$i = $447;
         } else {
          $s$1$i = $440;
         }
        } while(0);
        $448 = $443 != 0.0;
        if ($448) {
         $$2$i = $443;$s$0$i = $s$1$i;
        } else {
         $s$1$i$lcssa = $s$1$i;
         break;
        }
       }
       $449 = ($p$0|0)!=(0);
       $$pre188$i = $s$1$i$lcssa;
       $450 = (($11) + ($$pre188$i))|0;
       $451 = ($450|0)<($p$0|0);
       $or$cond122 = $449 & $451;
       $452 = $431;
       $453 = (($12) + ($p$0))|0;
       $454 = (($453) - ($452))|0;
       $455 = (($10) - ($452))|0;
       $456 = (($455) + ($$pre188$i))|0;
       $l$0$i = $or$cond122 ? $454 : $456;
       $457 = (($l$0$i) + ($400))|0;
       _pad($f,32,$w$1,$457,$fl$1$);
       $458 = HEAP32[$f>>2]|0;
       $459 = $458 & 32;
       $460 = ($459|0)==(0);
       if ($460) {
        (___fwritex($prefix$0$$i,$400,$f)|0);
       }
       $461 = $fl$1$ ^ 65536;
       _pad($f,48,$w$1,$457,$461);
       $462 = (($$pre188$i) - ($5))|0;
       $463 = HEAP32[$f>>2]|0;
       $464 = $463 & 32;
       $465 = ($464|0)==(0);
       if ($465) {
        (___fwritex($buf$i,$462,$f)|0);
       }
       $466 = (($9) - ($452))|0;
       $sum = (($462) + ($466))|0;
       $467 = (($l$0$i) - ($sum))|0;
       _pad($f,48,$467,0,0);
       $468 = HEAP32[$f>>2]|0;
       $469 = $468 & 32;
       $470 = ($469|0)==(0);
       if ($470) {
        (___fwritex($431,$466,$f)|0);
       }
       $471 = $fl$1$ ^ 8192;
       _pad($f,32,$w$1,$457,$471);
       $472 = ($457|0)<($w$1|0);
       $w$$i = $472 ? $w$1 : $457;
       $$0$i = $w$$i;
       break;
      }
      $473 = ($p$0|0)<(0);
      $$p$i = $473 ? 6 : $p$0;
      if ($392) {
       $474 = $391 * 268435456.0;
       $475 = HEAP32[$e2$i>>2]|0;
       $476 = (($475) + -28)|0;
       HEAP32[$e2$i>>2] = $476;
       $$3$i = $474;$477 = $476;
      } else {
       $$pre185$i = HEAP32[$e2$i>>2]|0;
       $$3$i = $391;$477 = $$pre185$i;
      }
      $478 = ($477|0)<(0);
      $$33$i = $478 ? $big$i : $13;
      $479 = $$33$i;
      $$4$i = $$3$i;$z$0$i = $$33$i;
      while(1) {
       $480 = (~~(($$4$i))>>>0);
       HEAP32[$z$0$i>>2] = $480;
       $481 = ((($z$0$i)) + 4|0);
       $482 = (+($480>>>0));
       $483 = $$4$i - $482;
       $484 = $483 * 1.0E+9;
       $485 = $484 != 0.0;
       if ($485) {
        $$4$i = $484;$z$0$i = $481;
       } else {
        $$lcssa303 = $481;
        break;
       }
      }
      $$pr$i = HEAP32[$e2$i>>2]|0;
      $486 = ($$pr$i|0)>(0);
      if ($486) {
       $487 = $$pr$i;$a$1149$i = $$33$i;$z$1148$i = $$lcssa303;
       while(1) {
        $488 = ($487|0)>(29);
        $489 = $488 ? 29 : $487;
        $d$0141$i = ((($z$1148$i)) + -4|0);
        $490 = ($d$0141$i>>>0)<($a$1149$i>>>0);
        do {
         if ($490) {
          $a$2$ph$i = $a$1149$i;
         } else {
          $carry$0142$i = 0;$d$0143$i = $d$0141$i;
          while(1) {
           $491 = HEAP32[$d$0143$i>>2]|0;
           $492 = (_bitshift64Shl(($491|0),0,($489|0))|0);
           $493 = tempRet0;
           $494 = (_i64Add(($492|0),($493|0),($carry$0142$i|0),0)|0);
           $495 = tempRet0;
           $496 = (___uremdi3(($494|0),($495|0),1000000000,0)|0);
           $497 = tempRet0;
           HEAP32[$d$0143$i>>2] = $496;
           $498 = (___udivdi3(($494|0),($495|0),1000000000,0)|0);
           $499 = tempRet0;
           $d$0$i = ((($d$0143$i)) + -4|0);
           $500 = ($d$0$i>>>0)<($a$1149$i>>>0);
           if ($500) {
            $$lcssa304 = $498;
            break;
           } else {
            $carry$0142$i = $498;$d$0143$i = $d$0$i;
           }
          }
          $501 = ($$lcssa304|0)==(0);
          if ($501) {
           $a$2$ph$i = $a$1149$i;
           break;
          }
          $502 = ((($a$1149$i)) + -4|0);
          HEAP32[$502>>2] = $$lcssa304;
          $a$2$ph$i = $502;
         }
        } while(0);
        $z$2$i = $z$1148$i;
        while(1) {
         $503 = ($z$2$i>>>0)>($a$2$ph$i>>>0);
         if (!($503)) {
          $z$2$i$lcssa = $z$2$i;
          break;
         }
         $504 = ((($z$2$i)) + -4|0);
         $505 = HEAP32[$504>>2]|0;
         $506 = ($505|0)==(0);
         if ($506) {
          $z$2$i = $504;
         } else {
          $z$2$i$lcssa = $z$2$i;
          break;
         }
        }
        $507 = HEAP32[$e2$i>>2]|0;
        $508 = (($507) - ($489))|0;
        HEAP32[$e2$i>>2] = $508;
        $509 = ($508|0)>(0);
        if ($509) {
         $487 = $508;$a$1149$i = $a$2$ph$i;$z$1148$i = $z$2$i$lcssa;
        } else {
         $$pr50$i = $508;$a$1$lcssa$i = $a$2$ph$i;$z$1$lcssa$i = $z$2$i$lcssa;
         break;
        }
       }
      } else {
       $$pr50$i = $$pr$i;$a$1$lcssa$i = $$33$i;$z$1$lcssa$i = $$lcssa303;
      }
      $510 = ($$pr50$i|0)<(0);
      if ($510) {
       $511 = (($$p$i) + 25)|0;
       $512 = (($511|0) / 9)&-1;
       $513 = (($512) + 1)|0;
       $514 = ($395|0)==(102);
       $516 = $$pr50$i;$a$3136$i = $a$1$lcssa$i;$z$3135$i = $z$1$lcssa$i;
       while(1) {
        $515 = (0 - ($516))|0;
        $517 = ($515|0)>(9);
        $518 = $517 ? 9 : $515;
        $519 = ($a$3136$i>>>0)<($z$3135$i>>>0);
        do {
         if ($519) {
          $523 = 1 << $518;
          $524 = (($523) + -1)|0;
          $525 = 1000000000 >>> $518;
          $carry3$0130$i = 0;$d$1129$i = $a$3136$i;
          while(1) {
           $526 = HEAP32[$d$1129$i>>2]|0;
           $527 = $526 & $524;
           $528 = $526 >>> $518;
           $529 = (($528) + ($carry3$0130$i))|0;
           HEAP32[$d$1129$i>>2] = $529;
           $530 = Math_imul($527, $525)|0;
           $531 = ((($d$1129$i)) + 4|0);
           $532 = ($531>>>0)<($z$3135$i>>>0);
           if ($532) {
            $carry3$0130$i = $530;$d$1129$i = $531;
           } else {
            $$lcssa306 = $530;
            break;
           }
          }
          $533 = HEAP32[$a$3136$i>>2]|0;
          $534 = ($533|0)==(0);
          $535 = ((($a$3136$i)) + 4|0);
          $$a$3$i = $534 ? $535 : $a$3136$i;
          $536 = ($$lcssa306|0)==(0);
          if ($536) {
           $$a$3192$i = $$a$3$i;$z$4$i = $z$3135$i;
           break;
          }
          $537 = ((($z$3135$i)) + 4|0);
          HEAP32[$z$3135$i>>2] = $$lcssa306;
          $$a$3192$i = $$a$3$i;$z$4$i = $537;
         } else {
          $520 = HEAP32[$a$3136$i>>2]|0;
          $521 = ($520|0)==(0);
          $522 = ((($a$3136$i)) + 4|0);
          $$a$3191$i = $521 ? $522 : $a$3136$i;
          $$a$3192$i = $$a$3191$i;$z$4$i = $z$3135$i;
         }
        } while(0);
        $538 = $514 ? $$33$i : $$a$3192$i;
        $539 = $z$4$i;
        $540 = $538;
        $541 = (($539) - ($540))|0;
        $542 = $541 >> 2;
        $543 = ($542|0)>($513|0);
        $544 = (($538) + ($513<<2)|0);
        $$z$4$i = $543 ? $544 : $z$4$i;
        $545 = HEAP32[$e2$i>>2]|0;
        $546 = (($545) + ($518))|0;
        HEAP32[$e2$i>>2] = $546;
        $547 = ($546|0)<(0);
        if ($547) {
         $516 = $546;$a$3136$i = $$a$3192$i;$z$3135$i = $$z$4$i;
        } else {
         $a$3$lcssa$i = $$a$3192$i;$z$3$lcssa$i = $$z$4$i;
         break;
        }
       }
      } else {
       $a$3$lcssa$i = $a$1$lcssa$i;$z$3$lcssa$i = $z$1$lcssa$i;
      }
      $548 = ($a$3$lcssa$i>>>0)<($z$3$lcssa$i>>>0);
      do {
       if ($548) {
        $549 = $a$3$lcssa$i;
        $550 = (($479) - ($549))|0;
        $551 = $550 >> 2;
        $552 = ($551*9)|0;
        $553 = HEAP32[$a$3$lcssa$i>>2]|0;
        $554 = ($553>>>0)<(10);
        if ($554) {
         $e$1$i = $552;
         break;
        } else {
         $e$0125$i = $552;$i$0124$i = 10;
        }
        while(1) {
         $555 = ($i$0124$i*10)|0;
         $556 = (($e$0125$i) + 1)|0;
         $557 = ($553>>>0)<($555>>>0);
         if ($557) {
          $e$1$i = $556;
          break;
         } else {
          $e$0125$i = $556;$i$0124$i = $555;
         }
        }
       } else {
        $e$1$i = 0;
       }
      } while(0);
      $558 = ($395|0)!=(102);
      $559 = $558 ? $e$1$i : 0;
      $560 = (($$p$i) - ($559))|0;
      $561 = ($395|0)==(103);
      $562 = ($$p$i|0)!=(0);
      $563 = $562 & $561;
      $$neg55$i = $563 << 31 >> 31;
      $564 = (($560) + ($$neg55$i))|0;
      $565 = $z$3$lcssa$i;
      $566 = (($565) - ($479))|0;
      $567 = $566 >> 2;
      $568 = ($567*9)|0;
      $569 = (($568) + -9)|0;
      $570 = ($564|0)<($569|0);
      if ($570) {
       $571 = ((($$33$i)) + 4|0);
       $572 = (($564) + 9216)|0;
       $573 = (($572|0) / 9)&-1;
       $574 = (($573) + -1024)|0;
       $575 = (($571) + ($574<<2)|0);
       $576 = (($572|0) % 9)&-1;
       $j$0117$i = (($576) + 1)|0;
       $577 = ($j$0117$i|0)<(9);
       if ($577) {
        $i$1118$i = 10;$j$0119$i = $j$0117$i;
        while(1) {
         $578 = ($i$1118$i*10)|0;
         $j$0$i = (($j$0119$i) + 1)|0;
         $exitcond$i = ($j$0$i|0)==(9);
         if ($exitcond$i) {
          $i$1$lcssa$i = $578;
          break;
         } else {
          $i$1118$i = $578;$j$0119$i = $j$0$i;
         }
        }
       } else {
        $i$1$lcssa$i = 10;
       }
       $579 = HEAP32[$575>>2]|0;
       $580 = (($579>>>0) % ($i$1$lcssa$i>>>0))&-1;
       $581 = ($580|0)==(0);
       $582 = ((($575)) + 4|0);
       $583 = ($582|0)==($z$3$lcssa$i|0);
       $or$cond18$i = $583 & $581;
       do {
        if ($or$cond18$i) {
         $a$8$i = $a$3$lcssa$i;$d$4$i = $575;$e$4$i = $e$1$i;
        } else {
         $584 = (($579>>>0) / ($i$1$lcssa$i>>>0))&-1;
         $585 = $584 & 1;
         $586 = ($585|0)==(0);
         $$20$i = $586 ? 9007199254740992.0 : 9007199254740994.0;
         $587 = (($i$1$lcssa$i|0) / 2)&-1;
         $588 = ($580>>>0)<($587>>>0);
         if ($588) {
          $small$0$i = 0.5;
         } else {
          $589 = ($580|0)==($587|0);
          $or$cond22$i = $583 & $589;
          $$36$i = $or$cond22$i ? 1.0 : 1.5;
          $small$0$i = $$36$i;
         }
         $590 = ($pl$0$i|0)==(0);
         do {
          if ($590) {
           $round6$1$i = $$20$i;$small$1$i = $small$0$i;
          } else {
           $591 = HEAP8[$prefix$0$i>>0]|0;
           $592 = ($591<<24>>24)==(45);
           if (!($592)) {
            $round6$1$i = $$20$i;$small$1$i = $small$0$i;
            break;
           }
           $593 = -$$20$i;
           $594 = -$small$0$i;
           $round6$1$i = $593;$small$1$i = $594;
          }
         } while(0);
         $595 = (($579) - ($580))|0;
         HEAP32[$575>>2] = $595;
         $596 = $round6$1$i + $small$1$i;
         $597 = $596 != $round6$1$i;
         if (!($597)) {
          $a$8$i = $a$3$lcssa$i;$d$4$i = $575;$e$4$i = $e$1$i;
          break;
         }
         $598 = (($595) + ($i$1$lcssa$i))|0;
         HEAP32[$575>>2] = $598;
         $599 = ($598>>>0)>(999999999);
         if ($599) {
          $a$5111$i = $a$3$lcssa$i;$d$2110$i = $575;
          while(1) {
           $600 = ((($d$2110$i)) + -4|0);
           HEAP32[$d$2110$i>>2] = 0;
           $601 = ($600>>>0)<($a$5111$i>>>0);
           if ($601) {
            $602 = ((($a$5111$i)) + -4|0);
            HEAP32[$602>>2] = 0;
            $a$6$i = $602;
           } else {
            $a$6$i = $a$5111$i;
           }
           $603 = HEAP32[$600>>2]|0;
           $604 = (($603) + 1)|0;
           HEAP32[$600>>2] = $604;
           $605 = ($604>>>0)>(999999999);
           if ($605) {
            $a$5111$i = $a$6$i;$d$2110$i = $600;
           } else {
            $a$5$lcssa$i = $a$6$i;$d$2$lcssa$i = $600;
            break;
           }
          }
         } else {
          $a$5$lcssa$i = $a$3$lcssa$i;$d$2$lcssa$i = $575;
         }
         $606 = $a$5$lcssa$i;
         $607 = (($479) - ($606))|0;
         $608 = $607 >> 2;
         $609 = ($608*9)|0;
         $610 = HEAP32[$a$5$lcssa$i>>2]|0;
         $611 = ($610>>>0)<(10);
         if ($611) {
          $a$8$i = $a$5$lcssa$i;$d$4$i = $d$2$lcssa$i;$e$4$i = $609;
          break;
         } else {
          $e$2106$i = $609;$i$2105$i = 10;
         }
         while(1) {
          $612 = ($i$2105$i*10)|0;
          $613 = (($e$2106$i) + 1)|0;
          $614 = ($610>>>0)<($612>>>0);
          if ($614) {
           $a$8$i = $a$5$lcssa$i;$d$4$i = $d$2$lcssa$i;$e$4$i = $613;
           break;
          } else {
           $e$2106$i = $613;$i$2105$i = $612;
          }
         }
        }
       } while(0);
       $615 = ((($d$4$i)) + 4|0);
       $616 = ($z$3$lcssa$i>>>0)>($615>>>0);
       $$z$3$i = $616 ? $615 : $z$3$lcssa$i;
       $a$9$ph$i = $a$8$i;$e$5$ph$i = $e$4$i;$z$7$ph$i = $$z$3$i;
      } else {
       $a$9$ph$i = $a$3$lcssa$i;$e$5$ph$i = $e$1$i;$z$7$ph$i = $z$3$lcssa$i;
      }
      $617 = (0 - ($e$5$ph$i))|0;
      $z$7$i = $z$7$ph$i;
      while(1) {
       $618 = ($z$7$i>>>0)>($a$9$ph$i>>>0);
       if (!($618)) {
        $$lcssa162$i = 0;$z$7$i$lcssa = $z$7$i;
        break;
       }
       $619 = ((($z$7$i)) + -4|0);
       $620 = HEAP32[$619>>2]|0;
       $621 = ($620|0)==(0);
       if ($621) {
        $z$7$i = $619;
       } else {
        $$lcssa162$i = 1;$z$7$i$lcssa = $z$7$i;
        break;
       }
      }
      do {
       if ($561) {
        $622 = $562&1;
        $623 = $622 ^ 1;
        $$p$$i = (($623) + ($$p$i))|0;
        $624 = ($$p$$i|0)>($e$5$ph$i|0);
        $625 = ($e$5$ph$i|0)>(-5);
        $or$cond6$i = $624 & $625;
        if ($or$cond6$i) {
         $626 = (($t$0) + -1)|0;
         $$neg56$i = (($$p$$i) + -1)|0;
         $627 = (($$neg56$i) - ($e$5$ph$i))|0;
         $$013$i = $626;$$210$i = $627;
        } else {
         $628 = (($t$0) + -2)|0;
         $629 = (($$p$$i) + -1)|0;
         $$013$i = $628;$$210$i = $629;
        }
        $630 = $fl$1$ & 8;
        $631 = ($630|0)==(0);
        if (!($631)) {
         $$114$i = $$013$i;$$311$i = $$210$i;$$pre$phi190$iZ2D = $630;
         break;
        }
        do {
         if ($$lcssa162$i) {
          $632 = ((($z$7$i$lcssa)) + -4|0);
          $633 = HEAP32[$632>>2]|0;
          $634 = ($633|0)==(0);
          if ($634) {
           $j$2$i = 9;
           break;
          }
          $635 = (($633>>>0) % 10)&-1;
          $636 = ($635|0)==(0);
          if ($636) {
           $i$3101$i = 10;$j$1102$i = 0;
          } else {
           $j$2$i = 0;
           break;
          }
          while(1) {
           $637 = ($i$3101$i*10)|0;
           $638 = (($j$1102$i) + 1)|0;
           $639 = (($633>>>0) % ($637>>>0))&-1;
           $640 = ($639|0)==(0);
           if ($640) {
            $i$3101$i = $637;$j$1102$i = $638;
           } else {
            $j$2$i = $638;
            break;
           }
          }
         } else {
          $j$2$i = 9;
         }
        } while(0);
        $641 = $$013$i | 32;
        $642 = ($641|0)==(102);
        $643 = $z$7$i$lcssa;
        $644 = (($643) - ($479))|0;
        $645 = $644 >> 2;
        $646 = ($645*9)|0;
        $647 = (($646) + -9)|0;
        if ($642) {
         $648 = (($647) - ($j$2$i))|0;
         $649 = ($648|0)<(0);
         $$23$i = $649 ? 0 : $648;
         $650 = ($$210$i|0)<($$23$i|0);
         $$210$$24$i = $650 ? $$210$i : $$23$i;
         $$114$i = $$013$i;$$311$i = $$210$$24$i;$$pre$phi190$iZ2D = 0;
         break;
        } else {
         $651 = (($647) + ($e$5$ph$i))|0;
         $652 = (($651) - ($j$2$i))|0;
         $653 = ($652|0)<(0);
         $$25$i = $653 ? 0 : $652;
         $654 = ($$210$i|0)<($$25$i|0);
         $$210$$26$i = $654 ? $$210$i : $$25$i;
         $$114$i = $$013$i;$$311$i = $$210$$26$i;$$pre$phi190$iZ2D = 0;
         break;
        }
       } else {
        $$pre189$i = $fl$1$ & 8;
        $$114$i = $t$0;$$311$i = $$p$i;$$pre$phi190$iZ2D = $$pre189$i;
       }
      } while(0);
      $655 = $$311$i | $$pre$phi190$iZ2D;
      $656 = ($655|0)!=(0);
      $657 = $656&1;
      $658 = $$114$i | 32;
      $659 = ($658|0)==(102);
      if ($659) {
       $660 = ($e$5$ph$i|0)>(0);
       $661 = $660 ? $e$5$ph$i : 0;
       $$pn$i = $661;$estr$2$i = 0;
      } else {
       $662 = ($e$5$ph$i|0)<(0);
       $663 = $662 ? $617 : $e$5$ph$i;
       $664 = ($663|0)<(0);
       $665 = $664 << 31 >> 31;
       $666 = (_fmt_u($663,$665,$7)|0);
       $667 = $666;
       $668 = (($9) - ($667))|0;
       $669 = ($668|0)<(2);
       if ($669) {
        $estr$195$i = $666;
        while(1) {
         $670 = ((($estr$195$i)) + -1|0);
         HEAP8[$670>>0] = 48;
         $671 = $670;
         $672 = (($9) - ($671))|0;
         $673 = ($672|0)<(2);
         if ($673) {
          $estr$195$i = $670;
         } else {
          $estr$1$lcssa$i = $670;
          break;
         }
        }
       } else {
        $estr$1$lcssa$i = $666;
       }
       $674 = $e$5$ph$i >> 31;
       $675 = $674 & 2;
       $676 = (($675) + 43)|0;
       $677 = $676&255;
       $678 = ((($estr$1$lcssa$i)) + -1|0);
       HEAP8[$678>>0] = $677;
       $679 = $$114$i&255;
       $680 = ((($estr$1$lcssa$i)) + -2|0);
       HEAP8[$680>>0] = $679;
       $681 = $680;
       $682 = (($9) - ($681))|0;
       $$pn$i = $682;$estr$2$i = $680;
      }
      $683 = (($pl$0$i) + 1)|0;
      $684 = (($683) + ($$311$i))|0;
      $l$1$i = (($684) + ($657))|0;
      $685 = (($l$1$i) + ($$pn$i))|0;
      _pad($f,32,$w$1,$685,$fl$1$);
      $686 = HEAP32[$f>>2]|0;
      $687 = $686 & 32;
      $688 = ($687|0)==(0);
      if ($688) {
       (___fwritex($prefix$0$i,$pl$0$i,$f)|0);
      }
      $689 = $fl$1$ ^ 65536;
      _pad($f,48,$w$1,$685,$689);
      do {
       if ($659) {
        $690 = ($a$9$ph$i>>>0)>($$33$i>>>0);
        $r$0$a$9$i = $690 ? $$33$i : $a$9$ph$i;
        $d$584$i = $r$0$a$9$i;
        while(1) {
         $691 = HEAP32[$d$584$i>>2]|0;
         $692 = (_fmt_u($691,0,$14)|0);
         $693 = ($d$584$i|0)==($r$0$a$9$i|0);
         do {
          if ($693) {
           $699 = ($692|0)==($14|0);
           if (!($699)) {
            $s7$1$i = $692;
            break;
           }
           HEAP8[$16>>0] = 48;
           $s7$1$i = $16;
          } else {
           $694 = ($692>>>0)>($buf$i>>>0);
           if (!($694)) {
            $s7$1$i = $692;
            break;
           }
           $695 = $692;
           $696 = (($695) - ($5))|0;
           _memset(($buf$i|0),48,($696|0))|0;
           $s7$081$i = $692;
           while(1) {
            $697 = ((($s7$081$i)) + -1|0);
            $698 = ($697>>>0)>($buf$i>>>0);
            if ($698) {
             $s7$081$i = $697;
            } else {
             $s7$1$i = $697;
             break;
            }
           }
          }
         } while(0);
         $700 = HEAP32[$f>>2]|0;
         $701 = $700 & 32;
         $702 = ($701|0)==(0);
         if ($702) {
          $703 = $s7$1$i;
          $704 = (($15) - ($703))|0;
          (___fwritex($s7$1$i,$704,$f)|0);
         }
         $705 = ((($d$584$i)) + 4|0);
         $706 = ($705>>>0)>($$33$i>>>0);
         if ($706) {
          $$lcssa316 = $705;
          break;
         } else {
          $d$584$i = $705;
         }
        }
        $707 = ($655|0)==(0);
        do {
         if (!($707)) {
          $708 = HEAP32[$f>>2]|0;
          $709 = $708 & 32;
          $710 = ($709|0)==(0);
          if (!($710)) {
           break;
          }
          (___fwritex(4992,1,$f)|0);
         }
        } while(0);
        $711 = ($$lcssa316>>>0)<($z$7$i$lcssa>>>0);
        $712 = ($$311$i|0)>(0);
        $713 = $712 & $711;
        if ($713) {
         $$41278$i = $$311$i;$d$677$i = $$lcssa316;
         while(1) {
          $714 = HEAP32[$d$677$i>>2]|0;
          $715 = (_fmt_u($714,0,$14)|0);
          $716 = ($715>>>0)>($buf$i>>>0);
          if ($716) {
           $717 = $715;
           $718 = (($717) - ($5))|0;
           _memset(($buf$i|0),48,($718|0))|0;
           $s8$072$i = $715;
           while(1) {
            $719 = ((($s8$072$i)) + -1|0);
            $720 = ($719>>>0)>($buf$i>>>0);
            if ($720) {
             $s8$072$i = $719;
            } else {
             $s8$0$lcssa$i = $719;
             break;
            }
           }
          } else {
           $s8$0$lcssa$i = $715;
          }
          $721 = HEAP32[$f>>2]|0;
          $722 = $721 & 32;
          $723 = ($722|0)==(0);
          if ($723) {
           $724 = ($$41278$i|0)>(9);
           $725 = $724 ? 9 : $$41278$i;
           (___fwritex($s8$0$lcssa$i,$725,$f)|0);
          }
          $726 = ((($d$677$i)) + 4|0);
          $727 = (($$41278$i) + -9)|0;
          $728 = ($726>>>0)<($z$7$i$lcssa>>>0);
          $729 = ($$41278$i|0)>(9);
          $730 = $729 & $728;
          if ($730) {
           $$41278$i = $727;$d$677$i = $726;
          } else {
           $$412$lcssa$i = $727;
           break;
          }
         }
        } else {
         $$412$lcssa$i = $$311$i;
        }
        $731 = (($$412$lcssa$i) + 9)|0;
        _pad($f,48,$731,9,0);
       } else {
        $732 = ((($a$9$ph$i)) + 4|0);
        $z$7$$i = $$lcssa162$i ? $z$7$i$lcssa : $732;
        $733 = ($$311$i|0)>(-1);
        if ($733) {
         $734 = ($$pre$phi190$iZ2D|0)==(0);
         $$589$i = $$311$i;$d$788$i = $a$9$ph$i;
         while(1) {
          $735 = HEAP32[$d$788$i>>2]|0;
          $736 = (_fmt_u($735,0,$14)|0);
          $737 = ($736|0)==($14|0);
          if ($737) {
           HEAP8[$16>>0] = 48;
           $s9$0$i = $16;
          } else {
           $s9$0$i = $736;
          }
          $738 = ($d$788$i|0)==($a$9$ph$i|0);
          do {
           if ($738) {
            $742 = ((($s9$0$i)) + 1|0);
            $743 = HEAP32[$f>>2]|0;
            $744 = $743 & 32;
            $745 = ($744|0)==(0);
            if ($745) {
             (___fwritex($s9$0$i,1,$f)|0);
            }
            $746 = ($$589$i|0)<(1);
            $or$cond31$i = $734 & $746;
            if ($or$cond31$i) {
             $s9$2$i = $742;
             break;
            }
            $747 = HEAP32[$f>>2]|0;
            $748 = $747 & 32;
            $749 = ($748|0)==(0);
            if (!($749)) {
             $s9$2$i = $742;
             break;
            }
            (___fwritex(4992,1,$f)|0);
            $s9$2$i = $742;
           } else {
            $739 = ($s9$0$i>>>0)>($buf$i>>>0);
            if (!($739)) {
             $s9$2$i = $s9$0$i;
             break;
            }
            $scevgep182$i = (($s9$0$i) + ($6)|0);
            $scevgep182183$i = $scevgep182$i;
            _memset(($buf$i|0),48,($scevgep182183$i|0))|0;
            $s9$185$i = $s9$0$i;
            while(1) {
             $740 = ((($s9$185$i)) + -1|0);
             $741 = ($740>>>0)>($buf$i>>>0);
             if ($741) {
              $s9$185$i = $740;
             } else {
              $s9$2$i = $740;
              break;
             }
            }
           }
          } while(0);
          $750 = $s9$2$i;
          $751 = (($15) - ($750))|0;
          $752 = HEAP32[$f>>2]|0;
          $753 = $752 & 32;
          $754 = ($753|0)==(0);
          if ($754) {
           $755 = ($$589$i|0)>($751|0);
           $756 = $755 ? $751 : $$589$i;
           (___fwritex($s9$2$i,$756,$f)|0);
          }
          $757 = (($$589$i) - ($751))|0;
          $758 = ((($d$788$i)) + 4|0);
          $759 = ($758>>>0)<($z$7$$i>>>0);
          $760 = ($757|0)>(-1);
          $761 = $759 & $760;
          if ($761) {
           $$589$i = $757;$d$788$i = $758;
          } else {
           $$5$lcssa$i = $757;
           break;
          }
         }
        } else {
         $$5$lcssa$i = $$311$i;
        }
        $762 = (($$5$lcssa$i) + 18)|0;
        _pad($f,48,$762,18,0);
        $763 = HEAP32[$f>>2]|0;
        $764 = $763 & 32;
        $765 = ($764|0)==(0);
        if (!($765)) {
         break;
        }
        $766 = $estr$2$i;
        $767 = (($9) - ($766))|0;
        (___fwritex($estr$2$i,$767,$f)|0);
       }
      } while(0);
      $768 = $fl$1$ ^ 8192;
      _pad($f,32,$w$1,$685,$768);
      $769 = ($685|0)<($w$1|0);
      $w$32$i = $769 ? $w$1 : $685;
      $$0$i = $w$32$i;
     } else {
      $375 = $t$0 & 32;
      $376 = ($375|0)!=(0);
      $377 = $376 ? 4976 : 4980;
      $378 = ($$07$i != $$07$i) | (0.0 != 0.0);
      $379 = $376 ? 4984 : 4988;
      $pl$1$i = $378 ? 0 : $pl$0$i;
      $s1$0$i = $378 ? $379 : $377;
      $380 = (($pl$1$i) + 3)|0;
      _pad($f,32,$w$1,$380,$176);
      $381 = HEAP32[$f>>2]|0;
      $382 = $381 & 32;
      $383 = ($382|0)==(0);
      if ($383) {
       (___fwritex($prefix$0$i,$pl$1$i,$f)|0);
       $$pre$i = HEAP32[$f>>2]|0;
       $385 = $$pre$i;
      } else {
       $385 = $381;
      }
      $384 = $385 & 32;
      $386 = ($384|0)==(0);
      if ($386) {
       (___fwritex($s1$0$i,3,$f)|0);
      }
      $387 = $fl$1$ ^ 8192;
      _pad($f,32,$w$1,$380,$387);
      $388 = ($380|0)<($w$1|0);
      $389 = $388 ? $w$1 : $380;
      $$0$i = $389;
     }
    } while(0);
    $cnt$0 = $cnt$1;$l$0 = $$0$i;$l10n$0 = $l10n$3;$s$0 = $$lcssa300;
    continue L1;
    break;
   }
   default: {
    $a$2 = $s$0;$fl$6 = $fl$1$;$p$5 = $p$0;$pl$2 = 0;$prefix$2 = 3048;$z$2 = $1;
   }
   }
  } while(0);
  L311: do {
   if ((label|0) == 64) {
    label = 0;
    $207 = $arg;
    $208 = $207;
    $209 = HEAP32[$208>>2]|0;
    $210 = (($207) + 4)|0;
    $211 = $210;
    $212 = HEAP32[$211>>2]|0;
    $213 = $t$1 & 32;
    $214 = ($209|0)==(0);
    $215 = ($212|0)==(0);
    $216 = $214 & $215;
    if ($216) {
     $a$0 = $1;$fl$4 = $fl$3;$p$2 = $p$1;$pl$1 = 0;$prefix$1 = 3048;
     label = 77;
    } else {
     $$012$i = $1;$218 = $209;$225 = $212;
     while(1) {
      $217 = $218 & 15;
      $219 = (3032 + ($217)|0);
      $220 = HEAP8[$219>>0]|0;
      $221 = $220&255;
      $222 = $221 | $213;
      $223 = $222&255;
      $224 = ((($$012$i)) + -1|0);
      HEAP8[$224>>0] = $223;
      $226 = (_bitshift64Lshr(($218|0),($225|0),4)|0);
      $227 = tempRet0;
      $228 = ($226|0)==(0);
      $229 = ($227|0)==(0);
      $230 = $228 & $229;
      if ($230) {
       $$lcssa321 = $224;
       break;
      } else {
       $$012$i = $224;$218 = $226;$225 = $227;
      }
     }
     $231 = $arg;
     $232 = $231;
     $233 = HEAP32[$232>>2]|0;
     $234 = (($231) + 4)|0;
     $235 = $234;
     $236 = HEAP32[$235>>2]|0;
     $237 = ($233|0)==(0);
     $238 = ($236|0)==(0);
     $239 = $237 & $238;
     $240 = $fl$3 & 8;
     $241 = ($240|0)==(0);
     $or$cond17 = $241 | $239;
     if ($or$cond17) {
      $a$0 = $$lcssa321;$fl$4 = $fl$3;$p$2 = $p$1;$pl$1 = 0;$prefix$1 = 3048;
      label = 77;
     } else {
      $242 = $t$1 >> 4;
      $243 = (3048 + ($242)|0);
      $a$0 = $$lcssa321;$fl$4 = $fl$3;$p$2 = $p$1;$pl$1 = 2;$prefix$1 = $243;
      label = 77;
     }
    }
   }
   else if ((label|0) == 76) {
    label = 0;
    $289 = (_fmt_u($287,$288,$1)|0);
    $a$0 = $289;$fl$4 = $fl$1$;$p$2 = $p$0;$pl$1 = $pl$0;$prefix$1 = $prefix$0;
    label = 77;
   }
   else if ((label|0) == 82) {
    label = 0;
    $321 = (_memchr($a$1,0,$p$0)|0);
    $322 = ($321|0)==(0|0);
    $323 = $321;
    $324 = $a$1;
    $325 = (($323) - ($324))|0;
    $326 = (($a$1) + ($p$0)|0);
    $z$1 = $322 ? $326 : $321;
    $p$3 = $322 ? $p$0 : $325;
    $a$2 = $a$1;$fl$6 = $176;$p$5 = $p$3;$pl$2 = 0;$prefix$2 = 3048;$z$2 = $z$1;
   }
   else if ((label|0) == 86) {
    label = 0;
    $i$0105 = 0;$l$1104 = 0;$ws$0106 = $798;
    while(1) {
     $334 = HEAP32[$ws$0106>>2]|0;
     $335 = ($334|0)==(0);
     if ($335) {
      $i$0$lcssa = $i$0105;$l$2 = $l$1104;
      break;
     }
     $336 = (_wctomb($mb,$334)|0);
     $337 = ($336|0)<(0);
     $338 = (($p$4176) - ($i$0105))|0;
     $339 = ($336>>>0)>($338>>>0);
     $or$cond20 = $337 | $339;
     if ($or$cond20) {
      $i$0$lcssa = $i$0105;$l$2 = $336;
      break;
     }
     $340 = ((($ws$0106)) + 4|0);
     $341 = (($336) + ($i$0105))|0;
     $342 = ($p$4176>>>0)>($341>>>0);
     if ($342) {
      $i$0105 = $341;$l$1104 = $336;$ws$0106 = $340;
     } else {
      $i$0$lcssa = $341;$l$2 = $336;
      break;
     }
    }
    $343 = ($l$2|0)<(0);
    if ($343) {
     $$0 = -1;
     break L1;
    }
    _pad($f,32,$w$1,$i$0$lcssa,$fl$1$);
    $344 = ($i$0$lcssa|0)==(0);
    if ($344) {
     $i$0$lcssa178 = 0;
     label = 97;
    } else {
     $i$1116 = 0;$ws$1117 = $798;
     while(1) {
      $345 = HEAP32[$ws$1117>>2]|0;
      $346 = ($345|0)==(0);
      if ($346) {
       $i$0$lcssa178 = $i$0$lcssa;
       label = 97;
       break L311;
      }
      $347 = ((($ws$1117)) + 4|0);
      $348 = (_wctomb($mb,$345)|0);
      $349 = (($348) + ($i$1116))|0;
      $350 = ($349|0)>($i$0$lcssa|0);
      if ($350) {
       $i$0$lcssa178 = $i$0$lcssa;
       label = 97;
       break L311;
      }
      $351 = HEAP32[$f>>2]|0;
      $352 = $351 & 32;
      $353 = ($352|0)==(0);
      if ($353) {
       (___fwritex($mb,$348,$f)|0);
      }
      $354 = ($349>>>0)<($i$0$lcssa>>>0);
      if ($354) {
       $i$1116 = $349;$ws$1117 = $347;
      } else {
       $i$0$lcssa178 = $i$0$lcssa;
       label = 97;
       break;
      }
     }
    }
   }
  } while(0);
  if ((label|0) == 97) {
   label = 0;
   $355 = $fl$1$ ^ 8192;
   _pad($f,32,$w$1,$i$0$lcssa178,$355);
   $356 = ($w$1|0)>($i$0$lcssa178|0);
   $357 = $356 ? $w$1 : $i$0$lcssa178;
   $cnt$0 = $cnt$1;$l$0 = $357;$l10n$0 = $l10n$3;$s$0 = $$lcssa300;
   continue;
  }
  if ((label|0) == 77) {
   label = 0;
   $290 = ($p$2|0)>(-1);
   $291 = $fl$4 & -65537;
   $$fl$4 = $290 ? $291 : $fl$4;
   $292 = $arg;
   $293 = $292;
   $294 = HEAP32[$293>>2]|0;
   $295 = (($292) + 4)|0;
   $296 = $295;
   $297 = HEAP32[$296>>2]|0;
   $298 = ($294|0)!=(0);
   $299 = ($297|0)!=(0);
   $300 = $298 | $299;
   $301 = ($p$2|0)!=(0);
   $or$cond = $301 | $300;
   if ($or$cond) {
    $302 = $a$0;
    $303 = (($2) - ($302))|0;
    $304 = $300&1;
    $305 = $304 ^ 1;
    $306 = (($305) + ($303))|0;
    $307 = ($p$2|0)>($306|0);
    $p$2$ = $307 ? $p$2 : $306;
    $a$2 = $a$0;$fl$6 = $$fl$4;$p$5 = $p$2$;$pl$2 = $pl$1;$prefix$2 = $prefix$1;$z$2 = $1;
   } else {
    $a$2 = $1;$fl$6 = $$fl$4;$p$5 = 0;$pl$2 = $pl$1;$prefix$2 = $prefix$1;$z$2 = $1;
   }
  }
  $770 = $z$2;
  $771 = $a$2;
  $772 = (($770) - ($771))|0;
  $773 = ($p$5|0)<($772|0);
  $$p$5 = $773 ? $772 : $p$5;
  $774 = (($pl$2) + ($$p$5))|0;
  $775 = ($w$1|0)<($774|0);
  $w$2 = $775 ? $774 : $w$1;
  _pad($f,32,$w$2,$774,$fl$6);
  $776 = HEAP32[$f>>2]|0;
  $777 = $776 & 32;
  $778 = ($777|0)==(0);
  if ($778) {
   (___fwritex($prefix$2,$pl$2,$f)|0);
  }
  $779 = $fl$6 ^ 65536;
  _pad($f,48,$w$2,$774,$779);
  _pad($f,48,$$p$5,$772,0);
  $780 = HEAP32[$f>>2]|0;
  $781 = $780 & 32;
  $782 = ($781|0)==(0);
  if ($782) {
   (___fwritex($a$2,$772,$f)|0);
  }
  $783 = $fl$6 ^ 8192;
  _pad($f,32,$w$2,$774,$783);
  $cnt$0 = $cnt$1;$l$0 = $w$2;$l10n$0 = $l10n$3;$s$0 = $$lcssa300;
 }
 L345: do {
  if ((label|0) == 244) {
   $784 = ($f|0)==(0|0);
   if ($784) {
    $785 = ($l10n$0$lcssa|0)==(0);
    if ($785) {
     $$0 = 0;
    } else {
     $i$291 = 1;
     while(1) {
      $786 = (($nl_type) + ($i$291<<2)|0);
      $787 = HEAP32[$786>>2]|0;
      $788 = ($787|0)==(0);
      if ($788) {
       $i$291$lcssa = $i$291;
       break;
      }
      $790 = (($nl_arg) + ($i$291<<3)|0);
      _pop_arg_46($790,$787,$ap);
      $791 = (($i$291) + 1)|0;
      $792 = ($791|0)<(10);
      if ($792) {
       $i$291 = $791;
      } else {
       $$0 = 1;
       break L345;
      }
     }
     $789 = ($i$291$lcssa|0)<(10);
     if ($789) {
      $i$389 = $i$291$lcssa;
      while(1) {
       $795 = (($nl_type) + ($i$389<<2)|0);
       $796 = HEAP32[$795>>2]|0;
       $797 = ($796|0)==(0);
       $793 = (($i$389) + 1)|0;
       if (!($797)) {
        $$0 = -1;
        break L345;
       }
       $794 = ($793|0)<(10);
       if ($794) {
        $i$389 = $793;
       } else {
        $$0 = 1;
        break;
       }
      }
     } else {
      $$0 = 1;
     }
    }
   } else {
    $$0 = $cnt$1$lcssa;
   }
  }
 } while(0);
 STACKTOP = sp;return ($$0|0);
}
function ___fwritex($s,$l,$f) {
 $s = $s|0;
 $l = $l|0;
 $f = $f|0;
 var $$0 = 0, $$01 = 0, $$02 = 0, $$pre = 0, $$pre6 = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0;
 var $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $i$0 = 0, $i$0$lcssa12 = 0;
 var $i$1 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ((($f)) + 16|0);
 $1 = HEAP32[$0>>2]|0;
 $2 = ($1|0)==(0|0);
 if ($2) {
  $4 = (___towrite($f)|0);
  $5 = ($4|0)==(0);
  if ($5) {
   $$pre = HEAP32[$0>>2]|0;
   $9 = $$pre;
   label = 5;
  } else {
   $$0 = 0;
  }
 } else {
  $3 = $1;
  $9 = $3;
  label = 5;
 }
 L5: do {
  if ((label|0) == 5) {
   $6 = ((($f)) + 20|0);
   $7 = HEAP32[$6>>2]|0;
   $8 = (($9) - ($7))|0;
   $10 = ($8>>>0)<($l>>>0);
   $11 = $7;
   if ($10) {
    $12 = ((($f)) + 36|0);
    $13 = HEAP32[$12>>2]|0;
    $14 = (FUNCTION_TABLE_iiii[$13 & 31]($f,$s,$l)|0);
    $$0 = $14;
    break;
   }
   $15 = ((($f)) + 75|0);
   $16 = HEAP8[$15>>0]|0;
   $17 = ($16<<24>>24)>(-1);
   L10: do {
    if ($17) {
     $i$0 = $l;
     while(1) {
      $18 = ($i$0|0)==(0);
      if ($18) {
       $$01 = $l;$$02 = $s;$29 = $11;$i$1 = 0;
       break L10;
      }
      $19 = (($i$0) + -1)|0;
      $20 = (($s) + ($19)|0);
      $21 = HEAP8[$20>>0]|0;
      $22 = ($21<<24>>24)==(10);
      if ($22) {
       $i$0$lcssa12 = $i$0;
       break;
      } else {
       $i$0 = $19;
      }
     }
     $23 = ((($f)) + 36|0);
     $24 = HEAP32[$23>>2]|0;
     $25 = (FUNCTION_TABLE_iiii[$24 & 31]($f,$s,$i$0$lcssa12)|0);
     $26 = ($25>>>0)<($i$0$lcssa12>>>0);
     if ($26) {
      $$0 = $i$0$lcssa12;
      break L5;
     }
     $27 = (($s) + ($i$0$lcssa12)|0);
     $28 = (($l) - ($i$0$lcssa12))|0;
     $$pre6 = HEAP32[$6>>2]|0;
     $$01 = $28;$$02 = $27;$29 = $$pre6;$i$1 = $i$0$lcssa12;
    } else {
     $$01 = $l;$$02 = $s;$29 = $11;$i$1 = 0;
    }
   } while(0);
   _memcpy(($29|0),($$02|0),($$01|0))|0;
   $30 = HEAP32[$6>>2]|0;
   $31 = (($30) + ($$01)|0);
   HEAP32[$6>>2] = $31;
   $32 = (($i$1) + ($$01))|0;
   $$0 = $32;
  }
 } while(0);
 return ($$0|0);
}
function ___towrite($f) {
 $f = $f|0;
 var $$0 = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0;
 var $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ((($f)) + 74|0);
 $1 = HEAP8[$0>>0]|0;
 $2 = $1 << 24 >> 24;
 $3 = (($2) + 255)|0;
 $4 = $3 | $2;
 $5 = $4&255;
 HEAP8[$0>>0] = $5;
 $6 = HEAP32[$f>>2]|0;
 $7 = $6 & 8;
 $8 = ($7|0)==(0);
 if ($8) {
  $10 = ((($f)) + 8|0);
  HEAP32[$10>>2] = 0;
  $11 = ((($f)) + 4|0);
  HEAP32[$11>>2] = 0;
  $12 = ((($f)) + 44|0);
  $13 = HEAP32[$12>>2]|0;
  $14 = ((($f)) + 28|0);
  HEAP32[$14>>2] = $13;
  $15 = ((($f)) + 20|0);
  HEAP32[$15>>2] = $13;
  $16 = $13;
  $17 = ((($f)) + 48|0);
  $18 = HEAP32[$17>>2]|0;
  $19 = (($16) + ($18)|0);
  $20 = ((($f)) + 16|0);
  HEAP32[$20>>2] = $19;
  $$0 = 0;
 } else {
  $9 = $6 | 32;
  HEAP32[$f>>2] = $9;
  $$0 = -1;
 }
 return ($$0|0);
}
function _pop_arg_46($arg,$type,$ap) {
 $arg = $arg|0;
 $type = $type|0;
 $ap = $ap|0;
 var $$mask = 0, $$mask1 = 0, $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0.0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0.0;
 var $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0;
 var $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0;
 var $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0;
 var $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0;
 var $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, $arglist_current = 0, $arglist_current11 = 0, $arglist_current14 = 0, $arglist_current17 = 0;
 var $arglist_current2 = 0, $arglist_current20 = 0, $arglist_current23 = 0, $arglist_current26 = 0, $arglist_current5 = 0, $arglist_current8 = 0, $arglist_next = 0, $arglist_next12 = 0, $arglist_next15 = 0, $arglist_next18 = 0, $arglist_next21 = 0, $arglist_next24 = 0, $arglist_next27 = 0, $arglist_next3 = 0, $arglist_next6 = 0, $arglist_next9 = 0, $expanded = 0, $expanded28 = 0, $expanded30 = 0, $expanded31 = 0;
 var $expanded32 = 0, $expanded34 = 0, $expanded35 = 0, $expanded37 = 0, $expanded38 = 0, $expanded39 = 0, $expanded41 = 0, $expanded42 = 0, $expanded44 = 0, $expanded45 = 0, $expanded46 = 0, $expanded48 = 0, $expanded49 = 0, $expanded51 = 0, $expanded52 = 0, $expanded53 = 0, $expanded55 = 0, $expanded56 = 0, $expanded58 = 0, $expanded59 = 0;
 var $expanded60 = 0, $expanded62 = 0, $expanded63 = 0, $expanded65 = 0, $expanded66 = 0, $expanded67 = 0, $expanded69 = 0, $expanded70 = 0, $expanded72 = 0, $expanded73 = 0, $expanded74 = 0, $expanded76 = 0, $expanded77 = 0, $expanded79 = 0, $expanded80 = 0, $expanded81 = 0, $expanded83 = 0, $expanded84 = 0, $expanded86 = 0, $expanded87 = 0;
 var $expanded88 = 0, $expanded90 = 0, $expanded91 = 0, $expanded93 = 0, $expanded94 = 0, $expanded95 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ($type>>>0)>(20);
 L1: do {
  if (!($0)) {
   do {
    switch ($type|0) {
    case 9:  {
     $arglist_current = HEAP32[$ap>>2]|0;
     $1 = $arglist_current;
     $2 = ((0) + 4|0);
     $expanded28 = $2;
     $expanded = (($expanded28) - 1)|0;
     $3 = (($1) + ($expanded))|0;
     $4 = ((0) + 4|0);
     $expanded32 = $4;
     $expanded31 = (($expanded32) - 1)|0;
     $expanded30 = $expanded31 ^ -1;
     $5 = $3 & $expanded30;
     $6 = $5;
     $7 = HEAP32[$6>>2]|0;
     $arglist_next = ((($6)) + 4|0);
     HEAP32[$ap>>2] = $arglist_next;
     HEAP32[$arg>>2] = $7;
     break L1;
     break;
    }
    case 10:  {
     $arglist_current2 = HEAP32[$ap>>2]|0;
     $8 = $arglist_current2;
     $9 = ((0) + 4|0);
     $expanded35 = $9;
     $expanded34 = (($expanded35) - 1)|0;
     $10 = (($8) + ($expanded34))|0;
     $11 = ((0) + 4|0);
     $expanded39 = $11;
     $expanded38 = (($expanded39) - 1)|0;
     $expanded37 = $expanded38 ^ -1;
     $12 = $10 & $expanded37;
     $13 = $12;
     $14 = HEAP32[$13>>2]|0;
     $arglist_next3 = ((($13)) + 4|0);
     HEAP32[$ap>>2] = $arglist_next3;
     $15 = ($14|0)<(0);
     $16 = $15 << 31 >> 31;
     $17 = $arg;
     $18 = $17;
     HEAP32[$18>>2] = $14;
     $19 = (($17) + 4)|0;
     $20 = $19;
     HEAP32[$20>>2] = $16;
     break L1;
     break;
    }
    case 11:  {
     $arglist_current5 = HEAP32[$ap>>2]|0;
     $21 = $arglist_current5;
     $22 = ((0) + 4|0);
     $expanded42 = $22;
     $expanded41 = (($expanded42) - 1)|0;
     $23 = (($21) + ($expanded41))|0;
     $24 = ((0) + 4|0);
     $expanded46 = $24;
     $expanded45 = (($expanded46) - 1)|0;
     $expanded44 = $expanded45 ^ -1;
     $25 = $23 & $expanded44;
     $26 = $25;
     $27 = HEAP32[$26>>2]|0;
     $arglist_next6 = ((($26)) + 4|0);
     HEAP32[$ap>>2] = $arglist_next6;
     $28 = $arg;
     $29 = $28;
     HEAP32[$29>>2] = $27;
     $30 = (($28) + 4)|0;
     $31 = $30;
     HEAP32[$31>>2] = 0;
     break L1;
     break;
    }
    case 12:  {
     $arglist_current8 = HEAP32[$ap>>2]|0;
     $32 = $arglist_current8;
     $33 = ((0) + 8|0);
     $expanded49 = $33;
     $expanded48 = (($expanded49) - 1)|0;
     $34 = (($32) + ($expanded48))|0;
     $35 = ((0) + 8|0);
     $expanded53 = $35;
     $expanded52 = (($expanded53) - 1)|0;
     $expanded51 = $expanded52 ^ -1;
     $36 = $34 & $expanded51;
     $37 = $36;
     $38 = $37;
     $39 = $38;
     $40 = HEAP32[$39>>2]|0;
     $41 = (($38) + 4)|0;
     $42 = $41;
     $43 = HEAP32[$42>>2]|0;
     $arglist_next9 = ((($37)) + 8|0);
     HEAP32[$ap>>2] = $arglist_next9;
     $44 = $arg;
     $45 = $44;
     HEAP32[$45>>2] = $40;
     $46 = (($44) + 4)|0;
     $47 = $46;
     HEAP32[$47>>2] = $43;
     break L1;
     break;
    }
    case 13:  {
     $arglist_current11 = HEAP32[$ap>>2]|0;
     $48 = $arglist_current11;
     $49 = ((0) + 4|0);
     $expanded56 = $49;
     $expanded55 = (($expanded56) - 1)|0;
     $50 = (($48) + ($expanded55))|0;
     $51 = ((0) + 4|0);
     $expanded60 = $51;
     $expanded59 = (($expanded60) - 1)|0;
     $expanded58 = $expanded59 ^ -1;
     $52 = $50 & $expanded58;
     $53 = $52;
     $54 = HEAP32[$53>>2]|0;
     $arglist_next12 = ((($53)) + 4|0);
     HEAP32[$ap>>2] = $arglist_next12;
     $55 = $54&65535;
     $56 = $55 << 16 >> 16;
     $57 = ($56|0)<(0);
     $58 = $57 << 31 >> 31;
     $59 = $arg;
     $60 = $59;
     HEAP32[$60>>2] = $56;
     $61 = (($59) + 4)|0;
     $62 = $61;
     HEAP32[$62>>2] = $58;
     break L1;
     break;
    }
    case 14:  {
     $arglist_current14 = HEAP32[$ap>>2]|0;
     $63 = $arglist_current14;
     $64 = ((0) + 4|0);
     $expanded63 = $64;
     $expanded62 = (($expanded63) - 1)|0;
     $65 = (($63) + ($expanded62))|0;
     $66 = ((0) + 4|0);
     $expanded67 = $66;
     $expanded66 = (($expanded67) - 1)|0;
     $expanded65 = $expanded66 ^ -1;
     $67 = $65 & $expanded65;
     $68 = $67;
     $69 = HEAP32[$68>>2]|0;
     $arglist_next15 = ((($68)) + 4|0);
     HEAP32[$ap>>2] = $arglist_next15;
     $$mask1 = $69 & 65535;
     $70 = $arg;
     $71 = $70;
     HEAP32[$71>>2] = $$mask1;
     $72 = (($70) + 4)|0;
     $73 = $72;
     HEAP32[$73>>2] = 0;
     break L1;
     break;
    }
    case 15:  {
     $arglist_current17 = HEAP32[$ap>>2]|0;
     $74 = $arglist_current17;
     $75 = ((0) + 4|0);
     $expanded70 = $75;
     $expanded69 = (($expanded70) - 1)|0;
     $76 = (($74) + ($expanded69))|0;
     $77 = ((0) + 4|0);
     $expanded74 = $77;
     $expanded73 = (($expanded74) - 1)|0;
     $expanded72 = $expanded73 ^ -1;
     $78 = $76 & $expanded72;
     $79 = $78;
     $80 = HEAP32[$79>>2]|0;
     $arglist_next18 = ((($79)) + 4|0);
     HEAP32[$ap>>2] = $arglist_next18;
     $81 = $80&255;
     $82 = $81 << 24 >> 24;
     $83 = ($82|0)<(0);
     $84 = $83 << 31 >> 31;
     $85 = $arg;
     $86 = $85;
     HEAP32[$86>>2] = $82;
     $87 = (($85) + 4)|0;
     $88 = $87;
     HEAP32[$88>>2] = $84;
     break L1;
     break;
    }
    case 16:  {
     $arglist_current20 = HEAP32[$ap>>2]|0;
     $89 = $arglist_current20;
     $90 = ((0) + 4|0);
     $expanded77 = $90;
     $expanded76 = (($expanded77) - 1)|0;
     $91 = (($89) + ($expanded76))|0;
     $92 = ((0) + 4|0);
     $expanded81 = $92;
     $expanded80 = (($expanded81) - 1)|0;
     $expanded79 = $expanded80 ^ -1;
     $93 = $91 & $expanded79;
     $94 = $93;
     $95 = HEAP32[$94>>2]|0;
     $arglist_next21 = ((($94)) + 4|0);
     HEAP32[$ap>>2] = $arglist_next21;
     $$mask = $95 & 255;
     $96 = $arg;
     $97 = $96;
     HEAP32[$97>>2] = $$mask;
     $98 = (($96) + 4)|0;
     $99 = $98;
     HEAP32[$99>>2] = 0;
     break L1;
     break;
    }
    case 17:  {
     $arglist_current23 = HEAP32[$ap>>2]|0;
     $100 = $arglist_current23;
     $101 = ((0) + 8|0);
     $expanded84 = $101;
     $expanded83 = (($expanded84) - 1)|0;
     $102 = (($100) + ($expanded83))|0;
     $103 = ((0) + 8|0);
     $expanded88 = $103;
     $expanded87 = (($expanded88) - 1)|0;
     $expanded86 = $expanded87 ^ -1;
     $104 = $102 & $expanded86;
     $105 = $104;
     $106 = +HEAPF64[$105>>3];
     $arglist_next24 = ((($105)) + 8|0);
     HEAP32[$ap>>2] = $arglist_next24;
     HEAPF64[$arg>>3] = $106;
     break L1;
     break;
    }
    case 18:  {
     $arglist_current26 = HEAP32[$ap>>2]|0;
     $107 = $arglist_current26;
     $108 = ((0) + 8|0);
     $expanded91 = $108;
     $expanded90 = (($expanded91) - 1)|0;
     $109 = (($107) + ($expanded90))|0;
     $110 = ((0) + 8|0);
     $expanded95 = $110;
     $expanded94 = (($expanded95) - 1)|0;
     $expanded93 = $expanded94 ^ -1;
     $111 = $109 & $expanded93;
     $112 = $111;
     $113 = +HEAPF64[$112>>3];
     $arglist_next27 = ((($112)) + 8|0);
     HEAP32[$ap>>2] = $arglist_next27;
     HEAPF64[$arg>>3] = $113;
     break L1;
     break;
    }
    default: {
     break L1;
    }
    }
   } while(0);
  }
 } while(0);
 return;
}
function _fmt_u($0,$1,$s) {
 $0 = $0|0;
 $1 = $1|0;
 $s = $s|0;
 var $$0$lcssa = 0, $$01$lcssa$off0 = 0, $$05 = 0, $$1$lcssa = 0, $$12 = 0, $$lcssa19 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0;
 var $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $y$03 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $2 = ($1>>>0)>(0);
 $3 = ($0>>>0)>(4294967295);
 $4 = ($1|0)==(0);
 $5 = $4 & $3;
 $6 = $2 | $5;
 if ($6) {
  $$05 = $s;$7 = $0;$8 = $1;
  while(1) {
   $9 = (___uremdi3(($7|0),($8|0),10,0)|0);
   $10 = tempRet0;
   $11 = $9 | 48;
   $12 = $11&255;
   $13 = ((($$05)) + -1|0);
   HEAP8[$13>>0] = $12;
   $14 = (___udivdi3(($7|0),($8|0),10,0)|0);
   $15 = tempRet0;
   $16 = ($8>>>0)>(9);
   $17 = ($7>>>0)>(4294967295);
   $18 = ($8|0)==(9);
   $19 = $18 & $17;
   $20 = $16 | $19;
   if ($20) {
    $$05 = $13;$7 = $14;$8 = $15;
   } else {
    $$lcssa19 = $13;$28 = $14;$29 = $15;
    break;
   }
  }
  $$0$lcssa = $$lcssa19;$$01$lcssa$off0 = $28;
 } else {
  $$0$lcssa = $s;$$01$lcssa$off0 = $0;
 }
 $21 = ($$01$lcssa$off0|0)==(0);
 if ($21) {
  $$1$lcssa = $$0$lcssa;
 } else {
  $$12 = $$0$lcssa;$y$03 = $$01$lcssa$off0;
  while(1) {
   $22 = (($y$03>>>0) % 10)&-1;
   $23 = $22 | 48;
   $24 = $23&255;
   $25 = ((($$12)) + -1|0);
   HEAP8[$25>>0] = $24;
   $26 = (($y$03>>>0) / 10)&-1;
   $27 = ($y$03>>>0)<(10);
   if ($27) {
    $$1$lcssa = $25;
    break;
   } else {
    $$12 = $25;$y$03 = $26;
   }
  }
 }
 return ($$1$lcssa|0);
}
function _strerror($e) {
 $e = $e|0;
 var $$lcssa = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $i$03 = 0, $i$03$lcssa = 0, $i$12 = 0, $s$0$lcssa = 0, $s$01 = 0, $s$1 = 0, label = 0;
 var sp = 0;
 sp = STACKTOP;
 $i$03 = 0;
 while(1) {
  $1 = (3058 + ($i$03)|0);
  $2 = HEAP8[$1>>0]|0;
  $3 = $2&255;
  $4 = ($3|0)==($e|0);
  if ($4) {
   $i$03$lcssa = $i$03;
   label = 2;
   break;
  }
  $5 = (($i$03) + 1)|0;
  $6 = ($5|0)==(87);
  if ($6) {
   $i$12 = 87;$s$01 = 3146;
   label = 5;
   break;
  } else {
   $i$03 = $5;
  }
 }
 if ((label|0) == 2) {
  $0 = ($i$03$lcssa|0)==(0);
  if ($0) {
   $s$0$lcssa = 3146;
  } else {
   $i$12 = $i$03$lcssa;$s$01 = 3146;
   label = 5;
  }
 }
 if ((label|0) == 5) {
  while(1) {
   label = 0;
   $s$1 = $s$01;
   while(1) {
    $7 = HEAP8[$s$1>>0]|0;
    $8 = ($7<<24>>24)==(0);
    $9 = ((($s$1)) + 1|0);
    if ($8) {
     $$lcssa = $9;
     break;
    } else {
     $s$1 = $9;
    }
   }
   $10 = (($i$12) + -1)|0;
   $11 = ($10|0)==(0);
   if ($11) {
    $s$0$lcssa = $$lcssa;
    break;
   } else {
    $i$12 = $10;$s$01 = $$lcssa;
    label = 5;
   }
  }
 }
 return ($s$0$lcssa|0);
}
function _memchr($src,$c,$n) {
 $src = $src|0;
 $c = $c|0;
 $n = $n|0;
 var $$0$lcssa = 0, $$0$lcssa30 = 0, $$019 = 0, $$1$lcssa = 0, $$110 = 0, $$110$lcssa = 0, $$24 = 0, $$3 = 0, $$lcssa = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0;
 var $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0;
 var $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $or$cond = 0, $or$cond18 = 0, $s$0$lcssa = 0, $s$0$lcssa29 = 0, $s$020 = 0, $s$15 = 0, $s$2 = 0, $w$0$lcssa = 0, $w$011 = 0, $w$011$lcssa = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = $c & 255;
 $1 = $src;
 $2 = $1 & 3;
 $3 = ($2|0)!=(0);
 $4 = ($n|0)!=(0);
 $or$cond18 = $4 & $3;
 L1: do {
  if ($or$cond18) {
   $5 = $c&255;
   $$019 = $n;$s$020 = $src;
   while(1) {
    $6 = HEAP8[$s$020>>0]|0;
    $7 = ($6<<24>>24)==($5<<24>>24);
    if ($7) {
     $$0$lcssa30 = $$019;$s$0$lcssa29 = $s$020;
     label = 6;
     break L1;
    }
    $8 = ((($s$020)) + 1|0);
    $9 = (($$019) + -1)|0;
    $10 = $8;
    $11 = $10 & 3;
    $12 = ($11|0)!=(0);
    $13 = ($9|0)!=(0);
    $or$cond = $13 & $12;
    if ($or$cond) {
     $$019 = $9;$s$020 = $8;
    } else {
     $$0$lcssa = $9;$$lcssa = $13;$s$0$lcssa = $8;
     label = 5;
     break;
    }
   }
  } else {
   $$0$lcssa = $n;$$lcssa = $4;$s$0$lcssa = $src;
   label = 5;
  }
 } while(0);
 if ((label|0) == 5) {
  if ($$lcssa) {
   $$0$lcssa30 = $$0$lcssa;$s$0$lcssa29 = $s$0$lcssa;
   label = 6;
  } else {
   $$3 = 0;$s$2 = $s$0$lcssa;
  }
 }
 L8: do {
  if ((label|0) == 6) {
   $14 = HEAP8[$s$0$lcssa29>>0]|0;
   $15 = $c&255;
   $16 = ($14<<24>>24)==($15<<24>>24);
   if ($16) {
    $$3 = $$0$lcssa30;$s$2 = $s$0$lcssa29;
   } else {
    $17 = Math_imul($0, 16843009)|0;
    $18 = ($$0$lcssa30>>>0)>(3);
    L11: do {
     if ($18) {
      $$110 = $$0$lcssa30;$w$011 = $s$0$lcssa29;
      while(1) {
       $19 = HEAP32[$w$011>>2]|0;
       $20 = $19 ^ $17;
       $21 = (($20) + -16843009)|0;
       $22 = $20 & -2139062144;
       $23 = $22 ^ -2139062144;
       $24 = $23 & $21;
       $25 = ($24|0)==(0);
       if (!($25)) {
        $$110$lcssa = $$110;$w$011$lcssa = $w$011;
        break;
       }
       $26 = ((($w$011)) + 4|0);
       $27 = (($$110) + -4)|0;
       $28 = ($27>>>0)>(3);
       if ($28) {
        $$110 = $27;$w$011 = $26;
       } else {
        $$1$lcssa = $27;$w$0$lcssa = $26;
        label = 11;
        break L11;
       }
      }
      $$24 = $$110$lcssa;$s$15 = $w$011$lcssa;
     } else {
      $$1$lcssa = $$0$lcssa30;$w$0$lcssa = $s$0$lcssa29;
      label = 11;
     }
    } while(0);
    if ((label|0) == 11) {
     $29 = ($$1$lcssa|0)==(0);
     if ($29) {
      $$3 = 0;$s$2 = $w$0$lcssa;
      break;
     } else {
      $$24 = $$1$lcssa;$s$15 = $w$0$lcssa;
     }
    }
    while(1) {
     $30 = HEAP8[$s$15>>0]|0;
     $31 = ($30<<24>>24)==($15<<24>>24);
     if ($31) {
      $$3 = $$24;$s$2 = $s$15;
      break L8;
     }
     $32 = ((($s$15)) + 1|0);
     $33 = (($$24) + -1)|0;
     $34 = ($33|0)==(0);
     if ($34) {
      $$3 = 0;$s$2 = $32;
      break;
     } else {
      $$24 = $33;$s$15 = $32;
     }
    }
   }
  }
 } while(0);
 $35 = ($$3|0)!=(0);
 $36 = $35 ? $s$2 : 0;
 return ($36|0);
}
function _pad($f,$c,$w,$l,$fl) {
 $f = $f|0;
 $c = $c|0;
 $w = $w|0;
 $l = $l|0;
 $fl = $fl|0;
 var $$0$lcssa6 = 0, $$02 = 0, $$pre = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0;
 var $8 = 0, $9 = 0, $or$cond = 0, $pad = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 256|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $pad = sp;
 $0 = $fl & 73728;
 $1 = ($0|0)==(0);
 $2 = ($w|0)>($l|0);
 $or$cond = $2 & $1;
 do {
  if ($or$cond) {
   $3 = (($w) - ($l))|0;
   $4 = ($3>>>0)>(256);
   $5 = $4 ? 256 : $3;
   _memset(($pad|0),($c|0),($5|0))|0;
   $6 = ($3>>>0)>(255);
   $7 = HEAP32[$f>>2]|0;
   $8 = $7 & 32;
   $9 = ($8|0)==(0);
   if ($6) {
    $10 = (($w) - ($l))|0;
    $$02 = $3;$17 = $7;$18 = $9;
    while(1) {
     if ($18) {
      (___fwritex($pad,256,$f)|0);
      $$pre = HEAP32[$f>>2]|0;
      $14 = $$pre;
     } else {
      $14 = $17;
     }
     $11 = (($$02) + -256)|0;
     $12 = ($11>>>0)>(255);
     $13 = $14 & 32;
     $15 = ($13|0)==(0);
     if ($12) {
      $$02 = $11;$17 = $14;$18 = $15;
     } else {
      break;
     }
    }
    $16 = $10 & 255;
    if ($15) {
     $$0$lcssa6 = $16;
    } else {
     break;
    }
   } else {
    if ($9) {
     $$0$lcssa6 = $3;
    } else {
     break;
    }
   }
   (___fwritex($pad,$$0$lcssa6,$f)|0);
  }
 } while(0);
 STACKTOP = sp;return;
}
function _wctomb($s,$wc) {
 $s = $s|0;
 $wc = $wc|0;
 var $$0 = 0, $0 = 0, $1 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ($s|0)==(0|0);
 if ($0) {
  $$0 = 0;
 } else {
  $1 = (_wcrtomb($s,$wc,0)|0);
  $$0 = $1;
 }
 return ($$0|0);
}
function _wcrtomb($s,$wc,$st) {
 $s = $s|0;
 $wc = $wc|0;
 $st = $st|0;
 var $$0 = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0;
 var $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0;
 var $44 = 0, $45 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $or$cond = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ($s|0)==(0|0);
 do {
  if ($0) {
   $$0 = 1;
  } else {
   $1 = ($wc>>>0)<(128);
   if ($1) {
    $2 = $wc&255;
    HEAP8[$s>>0] = $2;
    $$0 = 1;
    break;
   }
   $3 = ($wc>>>0)<(2048);
   if ($3) {
    $4 = $wc >>> 6;
    $5 = $4 | 192;
    $6 = $5&255;
    $7 = ((($s)) + 1|0);
    HEAP8[$s>>0] = $6;
    $8 = $wc & 63;
    $9 = $8 | 128;
    $10 = $9&255;
    HEAP8[$7>>0] = $10;
    $$0 = 2;
    break;
   }
   $11 = ($wc>>>0)<(55296);
   $12 = $wc & -8192;
   $13 = ($12|0)==(57344);
   $or$cond = $11 | $13;
   if ($or$cond) {
    $14 = $wc >>> 12;
    $15 = $14 | 224;
    $16 = $15&255;
    $17 = ((($s)) + 1|0);
    HEAP8[$s>>0] = $16;
    $18 = $wc >>> 6;
    $19 = $18 & 63;
    $20 = $19 | 128;
    $21 = $20&255;
    $22 = ((($s)) + 2|0);
    HEAP8[$17>>0] = $21;
    $23 = $wc & 63;
    $24 = $23 | 128;
    $25 = $24&255;
    HEAP8[$22>>0] = $25;
    $$0 = 3;
    break;
   }
   $26 = (($wc) + -65536)|0;
   $27 = ($26>>>0)<(1048576);
   if ($27) {
    $28 = $wc >>> 18;
    $29 = $28 | 240;
    $30 = $29&255;
    $31 = ((($s)) + 1|0);
    HEAP8[$s>>0] = $30;
    $32 = $wc >>> 12;
    $33 = $32 & 63;
    $34 = $33 | 128;
    $35 = $34&255;
    $36 = ((($s)) + 2|0);
    HEAP8[$31>>0] = $35;
    $37 = $wc >>> 6;
    $38 = $37 & 63;
    $39 = $38 | 128;
    $40 = $39&255;
    $41 = ((($s)) + 3|0);
    HEAP8[$36>>0] = $40;
    $42 = $wc & 63;
    $43 = $42 | 128;
    $44 = $43&255;
    HEAP8[$41>>0] = $44;
    $$0 = 4;
    break;
   } else {
    $45 = (___errno_location()|0);
    HEAP32[$45>>2] = 84;
    $$0 = -1;
    break;
   }
  }
 } while(0);
 return ($$0|0);
}
function _frexpl($x,$e) {
 $x = +$x;
 $e = $e|0;
 var $0 = 0.0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (+_frexp($x,$e));
 return (+$0);
}
function _frexp($x,$e) {
 $x = +$x;
 $e = $e|0;
 var $$0 = 0.0, $$01 = 0.0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0.0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0.0, $7 = 0.0, $8 = 0, $9 = 0, $storemerge = 0, label = 0, sp = 0;
 sp = STACKTOP;
 HEAPF64[tempDoublePtr>>3] = $x;$0 = HEAP32[tempDoublePtr>>2]|0;
 $1 = HEAP32[tempDoublePtr+4>>2]|0;
 $2 = (_bitshift64Lshr(($0|0),($1|0),52)|0);
 $3 = tempRet0;
 $4 = $2 & 2047;
 switch ($4|0) {
 case 0:  {
  $5 = $x != 0.0;
  if ($5) {
   $6 = $x * 1.8446744073709552E+19;
   $7 = (+_frexp($6,$e));
   $8 = HEAP32[$e>>2]|0;
   $9 = (($8) + -64)|0;
   $$01 = $7;$storemerge = $9;
  } else {
   $$01 = $x;$storemerge = 0;
  }
  HEAP32[$e>>2] = $storemerge;
  $$0 = $$01;
  break;
 }
 case 2047:  {
  $$0 = $x;
  break;
 }
 default: {
  $10 = (($4) + -1022)|0;
  HEAP32[$e>>2] = $10;
  $11 = $1 & -2146435073;
  $12 = $11 | 1071644672;
  HEAP32[tempDoublePtr>>2] = $0;HEAP32[tempDoublePtr+4>>2] = $12;$13 = +HEAPF64[tempDoublePtr>>3];
  $$0 = $13;
 }
 }
 return (+$$0);
}
function ___lockfile($f) {
 $f = $f|0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 return 0;
}
function _isspace($c) {
 $c = $c|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ($c|0)==(32);
 $1 = (($c) + -9)|0;
 $2 = ($1>>>0)<(5);
 $3 = $0 | $2;
 $4 = $3&1;
 return ($4|0);
}
function ___toread($f) {
 $f = $f|0;
 var $$0 = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $3 = 0, $4 = 0;
 var $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ((($f)) + 74|0);
 $1 = HEAP8[$0>>0]|0;
 $2 = $1 << 24 >> 24;
 $3 = (($2) + 255)|0;
 $4 = $3 | $2;
 $5 = $4&255;
 HEAP8[$0>>0] = $5;
 $6 = ((($f)) + 20|0);
 $7 = HEAP32[$6>>2]|0;
 $8 = ((($f)) + 44|0);
 $9 = HEAP32[$8>>2]|0;
 $10 = ($7>>>0)>($9>>>0);
 if ($10) {
  $11 = ((($f)) + 36|0);
  $12 = HEAP32[$11>>2]|0;
  (FUNCTION_TABLE_iiii[$12 & 31]($f,0,0)|0);
 }
 $13 = ((($f)) + 16|0);
 HEAP32[$13>>2] = 0;
 $14 = ((($f)) + 28|0);
 HEAP32[$14>>2] = 0;
 HEAP32[$6>>2] = 0;
 $15 = HEAP32[$f>>2]|0;
 $16 = $15 & 20;
 $17 = ($16|0)==(0);
 if ($17) {
  $21 = HEAP32[$8>>2]|0;
  $22 = ((($f)) + 8|0);
  HEAP32[$22>>2] = $21;
  $23 = ((($f)) + 4|0);
  HEAP32[$23>>2] = $21;
  $$0 = 0;
 } else {
  $18 = $15 & 4;
  $19 = ($18|0)==(0);
  if ($19) {
   $$0 = -1;
  } else {
   $20 = $15 | 32;
   HEAP32[$f>>2] = $20;
   $$0 = -1;
  }
 }
 return ($$0|0);
}
function _fflush($f) {
 $f = $f|0;
 var $$0 = 0, $$01 = 0, $$012 = 0, $$014 = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0;
 var $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $phitmp = 0, $r$0$lcssa = 0, $r$03 = 0, $r$1 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ($f|0)==(0|0);
 do {
  if ($0) {
   $7 = HEAP32[230]|0;
   $8 = ($7|0)==(0|0);
   if ($8) {
    $27 = 0;
   } else {
    $9 = HEAP32[230]|0;
    $10 = (_fflush($9)|0);
    $27 = $10;
   }
   ___lock(((29676)|0));
   $$012 = HEAP32[(29672)>>2]|0;
   $11 = ($$012|0)==(0|0);
   if ($11) {
    $r$0$lcssa = $27;
   } else {
    $$014 = $$012;$r$03 = $27;
    while(1) {
     $12 = ((($$014)) + 76|0);
     $13 = HEAP32[$12>>2]|0;
     $14 = ($13|0)>(-1);
     if ($14) {
      $15 = (___lockfile($$014)|0);
      $23 = $15;
     } else {
      $23 = 0;
     }
     $16 = ((($$014)) + 20|0);
     $17 = HEAP32[$16>>2]|0;
     $18 = ((($$014)) + 28|0);
     $19 = HEAP32[$18>>2]|0;
     $20 = ($17>>>0)>($19>>>0);
     if ($20) {
      $21 = (___fflush_unlocked($$014)|0);
      $22 = $21 | $r$03;
      $r$1 = $22;
     } else {
      $r$1 = $r$03;
     }
     $24 = ($23|0)==(0);
     if (!($24)) {
      ___unlockfile($$014);
     }
     $25 = ((($$014)) + 56|0);
     $$01 = HEAP32[$25>>2]|0;
     $26 = ($$01|0)==(0|0);
     if ($26) {
      $r$0$lcssa = $r$1;
      break;
     } else {
      $$014 = $$01;$r$03 = $r$1;
     }
    }
   }
   ___unlock(((29676)|0));
   $$0 = $r$0$lcssa;
  } else {
   $1 = ((($f)) + 76|0);
   $2 = HEAP32[$1>>2]|0;
   $3 = ($2|0)>(-1);
   if (!($3)) {
    $4 = (___fflush_unlocked($f)|0);
    $$0 = $4;
    break;
   }
   $5 = (___lockfile($f)|0);
   $phitmp = ($5|0)==(0);
   $6 = (___fflush_unlocked($f)|0);
   if ($phitmp) {
    $$0 = $6;
   } else {
    ___unlockfile($f);
    $$0 = $6;
   }
  }
 } while(0);
 return ($$0|0);
}
function ___fflush_unlocked($f) {
 $f = $f|0;
 var $$0 = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0;
 var $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ((($f)) + 20|0);
 $1 = HEAP32[$0>>2]|0;
 $2 = ((($f)) + 28|0);
 $3 = HEAP32[$2>>2]|0;
 $4 = ($1>>>0)>($3>>>0);
 if ($4) {
  $5 = ((($f)) + 36|0);
  $6 = HEAP32[$5>>2]|0;
  (FUNCTION_TABLE_iiii[$6 & 31]($f,0,0)|0);
  $7 = HEAP32[$0>>2]|0;
  $8 = ($7|0)==(0|0);
  if ($8) {
   $$0 = -1;
  } else {
   label = 3;
  }
 } else {
  label = 3;
 }
 if ((label|0) == 3) {
  $9 = ((($f)) + 4|0);
  $10 = HEAP32[$9>>2]|0;
  $11 = ((($f)) + 8|0);
  $12 = HEAP32[$11>>2]|0;
  $13 = ($10>>>0)<($12>>>0);
  if ($13) {
   $14 = ((($f)) + 40|0);
   $15 = HEAP32[$14>>2]|0;
   $16 = $10;
   $17 = $12;
   $18 = (($16) - ($17))|0;
   (FUNCTION_TABLE_iiii[$15 & 31]($f,$18,1)|0);
  }
  $19 = ((($f)) + 16|0);
  HEAP32[$19>>2] = 0;
  HEAP32[$2>>2] = 0;
  HEAP32[$0>>2] = 0;
  HEAP32[$11>>2] = 0;
  HEAP32[$9>>2] = 0;
  $$0 = 0;
 }
 return ($$0|0);
}
function ___fmodeflags($mode) {
 $mode = $mode|0;
 var $$ = 0, $$flags$4 = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $flags$0 = 0, $flags$0$ = 0, $flags$2 = 0;
 var $flags$2$ = 0, $flags$4 = 0, $not$ = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (_strchr($mode,43)|0);
 $1 = ($0|0)==(0|0);
 $2 = HEAP8[$mode>>0]|0;
 $not$ = ($2<<24>>24)!=(114);
 $$ = $not$&1;
 $flags$0 = $1 ? $$ : 2;
 $3 = (_strchr($mode,120)|0);
 $4 = ($3|0)==(0|0);
 $5 = $flags$0 | 128;
 $flags$0$ = $4 ? $flags$0 : $5;
 $6 = (_strchr($mode,101)|0);
 $7 = ($6|0)==(0|0);
 $8 = $flags$0$ | 524288;
 $flags$2 = $7 ? $flags$0$ : $8;
 $9 = ($2<<24>>24)==(114);
 $10 = $flags$2 | 64;
 $flags$2$ = $9 ? $flags$2 : $10;
 $11 = ($2<<24>>24)==(119);
 $12 = $flags$2$ | 512;
 $flags$4 = $11 ? $12 : $flags$2$;
 $13 = ($2<<24>>24)==(97);
 $14 = $flags$4 | 1024;
 $$flags$4 = $13 ? $14 : $flags$4;
 return ($$flags$4|0);
}
function _strchr($s,$c) {
 $s = $s|0;
 $c = $c|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (___strchrnul($s,$c)|0);
 $1 = HEAP8[$0>>0]|0;
 $2 = $c&255;
 $3 = ($1<<24>>24)==($2<<24>>24);
 $4 = $3 ? $0 : 0;
 return ($4|0);
}
function ___strchrnul($s,$c) {
 $s = $s|0;
 $c = $c|0;
 var $$0 = 0, $$02$lcssa = 0, $$0211 = 0, $$1 = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0;
 var $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0;
 var $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $or$cond = 0, $or$cond5 = 0, $w$0$lcssa = 0, $w$08 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = $c & 255;
 $1 = ($0|0)==(0);
 L1: do {
  if ($1) {
   $6 = (_strlen($s)|0);
   $7 = (($s) + ($6)|0);
   $$0 = $7;
  } else {
   $2 = $s;
   $3 = $2 & 3;
   $4 = ($3|0)==(0);
   if ($4) {
    $$02$lcssa = $s;
   } else {
    $5 = $c&255;
    $$0211 = $s;
    while(1) {
     $8 = HEAP8[$$0211>>0]|0;
     $9 = ($8<<24>>24)==(0);
     $10 = ($8<<24>>24)==($5<<24>>24);
     $or$cond = $9 | $10;
     if ($or$cond) {
      $$0 = $$0211;
      break L1;
     }
     $11 = ((($$0211)) + 1|0);
     $12 = $11;
     $13 = $12 & 3;
     $14 = ($13|0)==(0);
     if ($14) {
      $$02$lcssa = $11;
      break;
     } else {
      $$0211 = $11;
     }
    }
   }
   $15 = Math_imul($0, 16843009)|0;
   $16 = HEAP32[$$02$lcssa>>2]|0;
   $17 = (($16) + -16843009)|0;
   $18 = $16 & -2139062144;
   $19 = $18 ^ -2139062144;
   $20 = $19 & $17;
   $21 = ($20|0)==(0);
   L10: do {
    if ($21) {
     $23 = $16;$w$08 = $$02$lcssa;
     while(1) {
      $22 = $23 ^ $15;
      $24 = (($22) + -16843009)|0;
      $25 = $22 & -2139062144;
      $26 = $25 ^ -2139062144;
      $27 = $26 & $24;
      $28 = ($27|0)==(0);
      if (!($28)) {
       $w$0$lcssa = $w$08;
       break L10;
      }
      $29 = ((($w$08)) + 4|0);
      $30 = HEAP32[$29>>2]|0;
      $31 = (($30) + -16843009)|0;
      $32 = $30 & -2139062144;
      $33 = $32 ^ -2139062144;
      $34 = $33 & $31;
      $35 = ($34|0)==(0);
      if ($35) {
       $23 = $30;$w$08 = $29;
      } else {
       $w$0$lcssa = $29;
       break;
      }
     }
    } else {
     $w$0$lcssa = $$02$lcssa;
    }
   } while(0);
   $36 = $c&255;
   $$1 = $w$0$lcssa;
   while(1) {
    $37 = HEAP8[$$1>>0]|0;
    $38 = ($37<<24>>24)==(0);
    $39 = ($37<<24>>24)==($36<<24>>24);
    $or$cond5 = $38 | $39;
    $40 = ((($$1)) + 1|0);
    if ($or$cond5) {
     $$0 = $$1;
     break;
    } else {
     $$1 = $40;
    }
   }
  }
 } while(0);
 return ($$0|0);
}
function _strlen($s) {
 $s = $s|0;
 var $$0 = 0, $$01$lcssa = 0, $$014 = 0, $$1$lcssa = 0, $$lcssa20 = 0, $$pn = 0, $$pn15 = 0, $$pre = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0;
 var $2 = 0, $20 = 0, $21 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $w$0 = 0, $w$0$lcssa = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = $s;
 $1 = $0 & 3;
 $2 = ($1|0)==(0);
 L1: do {
  if ($2) {
   $$01$lcssa = $s;
   label = 4;
  } else {
   $$014 = $s;$21 = $0;
   while(1) {
    $3 = HEAP8[$$014>>0]|0;
    $4 = ($3<<24>>24)==(0);
    if ($4) {
     $$pn = $21;
     break L1;
    }
    $5 = ((($$014)) + 1|0);
    $6 = $5;
    $7 = $6 & 3;
    $8 = ($7|0)==(0);
    if ($8) {
     $$01$lcssa = $5;
     label = 4;
     break;
    } else {
     $$014 = $5;$21 = $6;
    }
   }
  }
 } while(0);
 if ((label|0) == 4) {
  $w$0 = $$01$lcssa;
  while(1) {
   $9 = HEAP32[$w$0>>2]|0;
   $10 = (($9) + -16843009)|0;
   $11 = $9 & -2139062144;
   $12 = $11 ^ -2139062144;
   $13 = $12 & $10;
   $14 = ($13|0)==(0);
   $15 = ((($w$0)) + 4|0);
   if ($14) {
    $w$0 = $15;
   } else {
    $$lcssa20 = $9;$w$0$lcssa = $w$0;
    break;
   }
  }
  $16 = $$lcssa20&255;
  $17 = ($16<<24>>24)==(0);
  if ($17) {
   $$1$lcssa = $w$0$lcssa;
  } else {
   $$pn15 = $w$0$lcssa;
   while(1) {
    $18 = ((($$pn15)) + 1|0);
    $$pre = HEAP8[$18>>0]|0;
    $19 = ($$pre<<24>>24)==(0);
    if ($19) {
     $$1$lcssa = $18;
     break;
    } else {
     $$pn15 = $18;
    }
   }
  }
  $20 = $$1$lcssa;
  $$pn = $20;
 }
 $$0 = (($$pn) - ($0))|0;
 return ($$0|0);
}
function _fprintf($f,$fmt,$varargs) {
 $f = $f|0;
 $fmt = $fmt|0;
 $varargs = $varargs|0;
 var $0 = 0, $ap = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $ap = sp;
 HEAP32[$ap>>2] = $varargs;
 $0 = (_vfprintf($f,$fmt,$ap)|0);
 STACKTOP = sp;return ($0|0);
}
function ___fseeko_unlocked($f,$off,$whence) {
 $f = $f|0;
 $off = $off|0;
 $whence = $whence|0;
 var $$0 = 0, $$01 = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0;
 var $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ($whence|0)==(1);
 if ($0) {
  $1 = ((($f)) + 8|0);
  $2 = HEAP32[$1>>2]|0;
  $3 = ((($f)) + 4|0);
  $4 = HEAP32[$3>>2]|0;
  $5 = (($off) - ($2))|0;
  $6 = (($5) + ($4))|0;
  $$01 = $6;
 } else {
  $$01 = $off;
 }
 $7 = ((($f)) + 20|0);
 $8 = HEAP32[$7>>2]|0;
 $9 = ((($f)) + 28|0);
 $10 = HEAP32[$9>>2]|0;
 $11 = ($8>>>0)>($10>>>0);
 if ($11) {
  $12 = ((($f)) + 36|0);
  $13 = HEAP32[$12>>2]|0;
  (FUNCTION_TABLE_iiii[$13 & 31]($f,0,0)|0);
  $14 = HEAP32[$7>>2]|0;
  $15 = ($14|0)==(0|0);
  if ($15) {
   $$0 = -1;
  } else {
   label = 5;
  }
 } else {
  label = 5;
 }
 if ((label|0) == 5) {
  $16 = ((($f)) + 16|0);
  HEAP32[$16>>2] = 0;
  HEAP32[$9>>2] = 0;
  HEAP32[$7>>2] = 0;
  $17 = ((($f)) + 40|0);
  $18 = HEAP32[$17>>2]|0;
  $19 = (FUNCTION_TABLE_iiii[$18 & 31]($f,$$01,$whence)|0);
  $20 = ($19|0)<(0);
  if ($20) {
   $$0 = -1;
  } else {
   $21 = ((($f)) + 8|0);
   HEAP32[$21>>2] = 0;
   $22 = ((($f)) + 4|0);
   HEAP32[$22>>2] = 0;
   $23 = HEAP32[$f>>2]|0;
   $24 = $23 & -17;
   HEAP32[$f>>2] = $24;
   $$0 = 0;
  }
 }
 return ($$0|0);
}
function ___fseeko($f,$off,$whence) {
 $f = $f|0;
 $off = $off|0;
 $whence = $whence|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $phitmp = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ((($f)) + 76|0);
 $1 = HEAP32[$0>>2]|0;
 $2 = ($1|0)>(-1);
 if ($2) {
  $4 = (___lockfile($f)|0);
  $phitmp = ($4|0)==(0);
  $5 = (___fseeko_unlocked($f,$off,$whence)|0);
  if ($phitmp) {
   $6 = $5;
  } else {
   ___unlockfile($f);
   $6 = $5;
  }
 } else {
  $3 = (___fseeko_unlocked($f,$off,$whence)|0);
  $6 = $3;
 }
 return ($6|0);
}
function _fseek($f,$off,$whence) {
 $f = $f|0;
 $off = $off|0;
 $whence = $whence|0;
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (___fseeko($f,$off,$whence)|0);
 return ($0|0);
}
function _fopen($filename,$mode) {
 $filename = $filename|0;
 $mode = $mode|0;
 var $$0 = 0, $0 = 0, $1 = 0, $10 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $memchr = 0, $vararg_buffer = 0, $vararg_buffer3 = 0, $vararg_ptr1 = 0, $vararg_ptr2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $vararg_buffer3 = sp + 16|0;
 $vararg_buffer = sp;
 $0 = HEAP8[$mode>>0]|0;
 $1 = $0 << 24 >> 24;
 $memchr = (_memchr(4994,$1,4)|0);
 $2 = ($memchr|0)==(0|0);
 if ($2) {
  $3 = (___errno_location()|0);
  HEAP32[$3>>2] = 22;
  $$0 = 0;
 } else {
  $4 = (___fmodeflags($mode)|0);
  $5 = $4 | 32768;
  HEAP32[$vararg_buffer>>2] = $filename;
  $vararg_ptr1 = ((($vararg_buffer)) + 4|0);
  HEAP32[$vararg_ptr1>>2] = $5;
  $vararg_ptr2 = ((($vararg_buffer)) + 8|0);
  HEAP32[$vararg_ptr2>>2] = 438;
  $6 = (___syscall5(5,($vararg_buffer|0))|0);
  $7 = (___syscall_ret($6)|0);
  $8 = ($7|0)<(0);
  if ($8) {
   $$0 = 0;
  } else {
   $9 = (___fdopen($7,$mode)|0);
   $10 = ($9|0)==(0|0);
   if ($10) {
    HEAP32[$vararg_buffer3>>2] = $7;
    (___syscall6(6,($vararg_buffer3|0))|0);
    $$0 = 0;
   } else {
    $$0 = $9;
   }
  }
 }
 STACKTOP = sp;return ($$0|0);
}
function ___fdopen($fd,$mode) {
 $fd = $fd|0;
 $mode = $mode|0;
 var $$0 = 0, $$cast = 0, $$pre = 0, $$pre1 = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0;
 var $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0;
 var $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $memchr = 0, $tio = 0, $vararg_buffer = 0, $vararg_buffer12 = 0, $vararg_buffer3 = 0, $vararg_buffer7 = 0, $vararg_ptr1 = 0, $vararg_ptr10 = 0, $vararg_ptr11 = 0, $vararg_ptr15 = 0, $vararg_ptr16 = 0, $vararg_ptr2 = 0, $vararg_ptr6 = 0, dest = 0, label = 0;
 var sp = 0, stop = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 112|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $vararg_buffer12 = sp + 40|0;
 $vararg_buffer7 = sp + 24|0;
 $vararg_buffer3 = sp + 16|0;
 $vararg_buffer = sp;
 $tio = sp + 52|0;
 $0 = HEAP8[$mode>>0]|0;
 $1 = $0 << 24 >> 24;
 $memchr = (_memchr(4994,$1,4)|0);
 $2 = ($memchr|0)==(0|0);
 if ($2) {
  $3 = (___errno_location()|0);
  HEAP32[$3>>2] = 22;
  $$0 = 0;
 } else {
  $4 = (_malloc(1144)|0);
  $5 = ($4|0)==(0|0);
  if ($5) {
   $$0 = 0;
  } else {
   dest=$4; stop=dest+112|0; do { HEAP32[dest>>2]=0|0; dest=dest+4|0; } while ((dest|0) < (stop|0));
   $6 = (_strchr($mode,43)|0);
   $7 = ($6|0)==(0|0);
   if ($7) {
    $8 = ($0<<24>>24)==(114);
    $9 = $8 ? 8 : 4;
    HEAP32[$4>>2] = $9;
   }
   $10 = (_strchr($mode,101)|0);
   $11 = ($10|0)==(0|0);
   if ($11) {
    $12 = $0;
   } else {
    HEAP32[$vararg_buffer>>2] = $fd;
    $vararg_ptr1 = ((($vararg_buffer)) + 4|0);
    HEAP32[$vararg_ptr1>>2] = 2;
    $vararg_ptr2 = ((($vararg_buffer)) + 8|0);
    HEAP32[$vararg_ptr2>>2] = 1;
    (___syscall221(221,($vararg_buffer|0))|0);
    $$pre = HEAP8[$mode>>0]|0;
    $12 = $$pre;
   }
   $13 = ($12<<24>>24)==(97);
   if ($13) {
    HEAP32[$vararg_buffer3>>2] = $fd;
    $vararg_ptr6 = ((($vararg_buffer3)) + 4|0);
    HEAP32[$vararg_ptr6>>2] = 3;
    $14 = (___syscall221(221,($vararg_buffer3|0))|0);
    $15 = $14 & 1024;
    $16 = ($15|0)==(0);
    if ($16) {
     $17 = $14 | 1024;
     HEAP32[$vararg_buffer7>>2] = $fd;
     $vararg_ptr10 = ((($vararg_buffer7)) + 4|0);
     HEAP32[$vararg_ptr10>>2] = 4;
     $vararg_ptr11 = ((($vararg_buffer7)) + 8|0);
     HEAP32[$vararg_ptr11>>2] = $17;
     (___syscall221(221,($vararg_buffer7|0))|0);
    }
    $18 = HEAP32[$4>>2]|0;
    $19 = $18 | 128;
    HEAP32[$4>>2] = $19;
    $26 = $19;
   } else {
    $$pre1 = HEAP32[$4>>2]|0;
    $26 = $$pre1;
   }
   $20 = ((($4)) + 60|0);
   HEAP32[$20>>2] = $fd;
   $21 = ((($4)) + 120|0);
   $22 = ((($4)) + 44|0);
   HEAP32[$22>>2] = $21;
   $23 = ((($4)) + 48|0);
   HEAP32[$23>>2] = 1024;
   $24 = ((($4)) + 75|0);
   HEAP8[$24>>0] = -1;
   $25 = $26 & 8;
   $27 = ($25|0)==(0);
   if ($27) {
    HEAP32[$vararg_buffer12>>2] = $fd;
    $vararg_ptr15 = ((($vararg_buffer12)) + 4|0);
    HEAP32[$vararg_ptr15>>2] = 21505;
    $vararg_ptr16 = ((($vararg_buffer12)) + 8|0);
    HEAP32[$vararg_ptr16>>2] = $tio;
    $28 = (___syscall54(54,($vararg_buffer12|0))|0);
    $29 = ($28|0)==(0);
    if ($29) {
     HEAP8[$24>>0] = 10;
    }
   }
   $30 = ((($4)) + 32|0);
   HEAP32[$30>>2] = 27;
   $31 = ((($4)) + 36|0);
   HEAP32[$31>>2] = 18;
   $32 = ((($4)) + 40|0);
   HEAP32[$32>>2] = 19;
   $33 = ((($4)) + 12|0);
   HEAP32[$33>>2] = 17;
   $34 = HEAP32[(29652)>>2]|0;
   $35 = ($34|0)==(0);
   if ($35) {
    $36 = ((($4)) + 76|0);
    HEAP32[$36>>2] = -1;
   }
   ___lock(((29676)|0));
   $37 = HEAP32[(29672)>>2]|0;
   $38 = ((($4)) + 56|0);
   HEAP32[$38>>2] = $37;
   $39 = ($37|0)==(0);
   if (!($39)) {
    $$cast = $37;
    $40 = ((($$cast)) + 52|0);
    HEAP32[$40>>2] = $4;
   }
   HEAP32[(29672)>>2] = $4;
   ___unlock(((29676)|0));
   $$0 = $4;
  }
 }
 STACKTOP = sp;return ($$0|0);
}
function _fclose($f) {
 $f = $f|0;
 var $$pre = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0;
 var $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ((($f)) + 76|0);
 $1 = HEAP32[$0>>2]|0;
 $2 = ($1|0)>(-1);
 if ($2) {
 }
 $3 = HEAP32[$f>>2]|0;
 $4 = $3 & 1;
 $5 = ($4|0)!=(0);
 if (!($5)) {
  ___lock(((29676)|0));
  $6 = ((($f)) + 52|0);
  $7 = HEAP32[$6>>2]|0;
  $8 = ($7|0)==(0|0);
  $9 = $7;
  $$pre = ((($f)) + 56|0);
  if (!($8)) {
   $10 = HEAP32[$$pre>>2]|0;
   $11 = ((($7)) + 56|0);
   HEAP32[$11>>2] = $10;
  }
  $12 = HEAP32[$$pre>>2]|0;
  $13 = ($12|0)==(0|0);
  $14 = $12;
  if (!($13)) {
   $15 = ((($12)) + 52|0);
   HEAP32[$15>>2] = $9;
  }
  $16 = HEAP32[(29672)>>2]|0;
  $17 = ($16|0)==($f|0);
  if ($17) {
   HEAP32[(29672)>>2] = $14;
  }
  ___unlock(((29676)|0));
 }
 $18 = (_fflush($f)|0);
 $19 = ((($f)) + 12|0);
 $20 = HEAP32[$19>>2]|0;
 $21 = (FUNCTION_TABLE_ii[$20 & 31]($f)|0);
 $22 = $21 | $18;
 $23 = ((($f)) + 92|0);
 $24 = HEAP32[$23>>2]|0;
 $25 = ($24|0)==(0|0);
 if (!($25)) {
  _free($24);
 }
 if (!($5)) {
  _free($f);
 }
 return ($22|0);
}
function _fread($destv,$size,$nmemb,$f) {
 $destv = $destv|0;
 $size = $size|0;
 $nmemb = $nmemb|0;
 $f = $f|0;
 var $$ = 0, $$0 = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0;
 var $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0;
 var $dest$0$ph = 0, $dest$02 = 0, $l$0$ph = 0, $l$03 = 0, $l$03$lcssa = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = Math_imul($nmemb, $size)|0;
 $1 = ((($f)) + 76|0);
 $2 = HEAP32[$1>>2]|0;
 $3 = ($2|0)>(-1);
 if ($3) {
  $4 = (___lockfile($f)|0);
  $30 = $4;
 } else {
  $30 = 0;
 }
 $5 = ((($f)) + 74|0);
 $6 = HEAP8[$5>>0]|0;
 $7 = $6 << 24 >> 24;
 $8 = (($7) + 255)|0;
 $9 = $8 | $7;
 $10 = $9&255;
 HEAP8[$5>>0] = $10;
 $11 = ((($f)) + 8|0);
 $12 = HEAP32[$11>>2]|0;
 $13 = ((($f)) + 4|0);
 $14 = HEAP32[$13>>2]|0;
 $15 = (($12) - ($14))|0;
 $16 = ($15|0)>(0);
 $17 = $14;
 if ($16) {
  $18 = ($15>>>0)<($0>>>0);
  $$ = $18 ? $15 : $0;
  _memcpy(($destv|0),($17|0),($$|0))|0;
  $19 = (($17) + ($$)|0);
  HEAP32[$13>>2] = $19;
  $20 = (($destv) + ($$)|0);
  $21 = (($0) - ($$))|0;
  $dest$0$ph = $20;$l$0$ph = $21;
 } else {
  $dest$0$ph = $destv;$l$0$ph = $0;
 }
 $22 = ($l$0$ph|0)==(0);
 L7: do {
  if ($22) {
   label = 13;
  } else {
   $23 = ((($f)) + 32|0);
   $dest$02 = $dest$0$ph;$l$03 = $l$0$ph;
   while(1) {
    $24 = (___toread($f)|0);
    $25 = ($24|0)==(0);
    if (!($25)) {
     $l$03$lcssa = $l$03;
     break;
    }
    $26 = HEAP32[$23>>2]|0;
    $27 = (FUNCTION_TABLE_iiii[$26 & 31]($f,$dest$02,$l$03)|0);
    $28 = (($27) + 1)|0;
    $29 = ($28>>>0)<(2);
    if ($29) {
     $l$03$lcssa = $l$03;
     break;
    }
    $34 = (($l$03) - ($27))|0;
    $35 = (($dest$02) + ($27)|0);
    $36 = ($l$03|0)==($27|0);
    if ($36) {
     label = 13;
     break L7;
    } else {
     $dest$02 = $35;$l$03 = $34;
    }
   }
   $31 = ($30|0)==(0);
   if (!($31)) {
    ___unlockfile($f);
   }
   $32 = (($0) - ($l$03$lcssa))|0;
   $33 = (($32>>>0) / ($size>>>0))&-1;
   $$0 = $33;
  }
 } while(0);
 if ((label|0) == 13) {
  $37 = ($30|0)==(0);
  if ($37) {
   $$0 = $nmemb;
  } else {
   ___unlockfile($f);
   $$0 = $nmemb;
  }
 }
 return ($$0|0);
}
function _rewind($f) {
 $f = $f|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $phitmp = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ((($f)) + 76|0);
 $1 = HEAP32[$0>>2]|0;
 $2 = ($1|0)>(-1);
 if ($2) {
  $3 = (___lockfile($f)|0);
  $phitmp = ($3|0)==(0);
  (___fseeko_unlocked($f,0,0)|0);
  $4 = HEAP32[$f>>2]|0;
  $5 = $4 & -33;
  HEAP32[$f>>2] = $5;
  if (!($phitmp)) {
   ___unlockfile($f);
  }
 } else {
  (___fseeko_unlocked($f,0,0)|0);
  $6 = HEAP32[$f>>2]|0;
  $7 = $6 & -33;
  HEAP32[$f>>2] = $7;
 }
 return;
}
function _printf($fmt,$varargs) {
 $fmt = $fmt|0;
 $varargs = $varargs|0;
 var $0 = 0, $1 = 0, $ap = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $ap = sp;
 HEAP32[$ap>>2] = $varargs;
 $0 = HEAP32[201]|0;
 $1 = (_vfprintf($0,$fmt,$ap)|0);
 STACKTOP = sp;return ($1|0);
}
function ___ftello($f) {
 $f = $f|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $phitmp = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ((($f)) + 76|0);
 $1 = HEAP32[$0>>2]|0;
 $2 = ($1|0)>(-1);
 if ($2) {
  $4 = (___lockfile($f)|0);
  $phitmp = ($4|0)==(0);
  $5 = (___ftello_unlocked($f)|0);
  if ($phitmp) {
   $6 = $5;
  } else {
   $6 = $5;
  }
 } else {
  $3 = (___ftello_unlocked($f)|0);
  $6 = $3;
 }
 return ($6|0);
}
function ___ftello_unlocked($f) {
 $f = $f|0;
 var $$0 = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $3 = 0;
 var $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $phitmp = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ((($f)) + 40|0);
 $1 = HEAP32[$0>>2]|0;
 $2 = HEAP32[$f>>2]|0;
 $3 = $2 & 128;
 $4 = ($3|0)==(0);
 if ($4) {
  $10 = 1;
 } else {
  $5 = ((($f)) + 20|0);
  $6 = HEAP32[$5>>2]|0;
  $7 = ((($f)) + 28|0);
  $8 = HEAP32[$7>>2]|0;
  $9 = ($6>>>0)>($8>>>0);
  $phitmp = $9 ? 2 : 1;
  $10 = $phitmp;
 }
 $11 = (FUNCTION_TABLE_iiii[$1 & 31]($f,0,$10)|0);
 $12 = ($11|0)<(0);
 if ($12) {
  $$0 = $11;
 } else {
  $13 = ((($f)) + 8|0);
  $14 = HEAP32[$13>>2]|0;
  $15 = ((($f)) + 4|0);
  $16 = HEAP32[$15>>2]|0;
  $17 = ((($f)) + 20|0);
  $18 = HEAP32[$17>>2]|0;
  $19 = ((($f)) + 28|0);
  $20 = HEAP32[$19>>2]|0;
  $21 = (($11) - ($14))|0;
  $22 = (($21) + ($16))|0;
  $23 = (($22) + ($18))|0;
  $24 = (($23) - ($20))|0;
  $$0 = $24;
 }
 return ($$0|0);
}
function _ftell($f) {
 $f = $f|0;
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (___ftello($f)|0);
 return ($0|0);
}
function ___strdup($s) {
 $s = $s|0;
 var $$0 = 0, $0 = 0, $1 = 0, $2 = 0, $3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (_strlen($s)|0);
 $1 = (($0) + 1)|0;
 $2 = (_malloc($1)|0);
 $3 = ($2|0)==(0|0);
 if ($3) {
  $$0 = 0;
 } else {
  _memcpy(($2|0),($s|0),($1|0))|0;
  $$0 = $2;
 }
 return ($$0|0);
}
function _tolower($c) {
 $c = $c|0;
 var $$0 = 0, $0 = 0, $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (_isupper($c)|0);
 $1 = ($0|0)==(0);
 $2 = $c | 32;
 $$0 = $1 ? $c : $2;
 return ($$0|0);
}
function _isupper($c) {
 $c = $c|0;
 var $0 = 0, $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (($c) + -65)|0;
 $1 = ($0>>>0)<(26);
 $2 = $1&1;
 return ($2|0);
}
function _strcasecmp($_l,$_r) {
 $_l = $_l|0;
 $_r = $_r|0;
 var $$pre$pre = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $3 = 0;
 var $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $l$03 = 0, $l$03$lcssa20 = 0, $r$0$lcssa = 0, $r$04 = 0, $r$04$lcssa19 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = HEAP8[$_l>>0]|0;
 $1 = ($0<<24>>24)==(0);
 L1: do {
  if ($1) {
   $19 = 0;$r$0$lcssa = $_r;
  } else {
   $2 = $0&255;
   $5 = $0;$7 = $2;$l$03 = $_l;$r$04 = $_r;
   while(1) {
    $3 = HEAP8[$r$04>>0]|0;
    $4 = ($3<<24>>24)==(0);
    if ($4) {
     $19 = $5;$r$0$lcssa = $r$04;
     break L1;
    }
    $6 = ($5<<24>>24)==($3<<24>>24);
    if (!($6)) {
     $8 = (_tolower($7)|0);
     $9 = HEAP8[$r$04>>0]|0;
     $10 = $9&255;
     $11 = (_tolower($10)|0);
     $12 = ($8|0)==($11|0);
     if (!($12)) {
      $l$03$lcssa20 = $l$03;$r$04$lcssa19 = $r$04;
      break;
     }
    }
    $13 = ((($l$03)) + 1|0);
    $14 = ((($r$04)) + 1|0);
    $15 = HEAP8[$13>>0]|0;
    $16 = $15&255;
    $17 = ($15<<24>>24)==(0);
    if ($17) {
     $19 = 0;$r$0$lcssa = $14;
     break L1;
    } else {
     $5 = $15;$7 = $16;$l$03 = $13;$r$04 = $14;
    }
   }
   $$pre$pre = HEAP8[$l$03$lcssa20>>0]|0;
   $19 = $$pre$pre;$r$0$lcssa = $r$04$lcssa19;
  }
 } while(0);
 $18 = $19&255;
 $20 = (_tolower($18)|0);
 $21 = HEAP8[$r$0$lcssa>>0]|0;
 $22 = $21&255;
 $23 = (_tolower($22)|0);
 $24 = (($20) - ($23))|0;
 return ($24|0);
}
function _atoi($s) {
 $s = $s|0;
 var $$0 = 0, $$0$lcssa = 0, $$1$ph = 0, $$13 = 0, $$lcssa9 = 0, $$pre = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0;
 var $7 = 0, $8 = 0, $9 = 0, $isdigit = 0, $isdigit2 = 0, $isdigittmp = 0, $isdigittmp1 = 0, $isdigittmp5 = 0, $n$0$lcssa = 0, $n$04 = 0, $neg$0 = 0, $neg$1$ph = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $$0 = $s;
 while(1) {
  $0 = HEAP8[$$0>>0]|0;
  $1 = $0 << 24 >> 24;
  $2 = (_isspace($1)|0);
  $3 = ($2|0)==(0);
  $4 = ((($$0)) + 1|0);
  if ($3) {
   $$0$lcssa = $$0;$$lcssa9 = $4;
   break;
  } else {
   $$0 = $4;
  }
 }
 $5 = HEAP8[$$0$lcssa>>0]|0;
 $6 = $5 << 24 >> 24;
 switch ($6|0) {
 case 45:  {
  $neg$0 = 1;
  label = 5;
  break;
 }
 case 43:  {
  $neg$0 = 0;
  label = 5;
  break;
 }
 default: {
  $$1$ph = $$0$lcssa;$8 = $5;$neg$1$ph = 0;
 }
 }
 if ((label|0) == 5) {
  $$pre = HEAP8[$$lcssa9>>0]|0;
  $$1$ph = $$lcssa9;$8 = $$pre;$neg$1$ph = $neg$0;
 }
 $7 = $8 << 24 >> 24;
 $isdigittmp1 = (($7) + -48)|0;
 $isdigit2 = ($isdigittmp1>>>0)<(10);
 if ($isdigit2) {
  $$13 = $$1$ph;$isdigittmp5 = $isdigittmp1;$n$04 = 0;
  while(1) {
   $9 = ($n$04*10)|0;
   $10 = ((($$13)) + 1|0);
   $11 = (($9) - ($isdigittmp5))|0;
   $12 = HEAP8[$10>>0]|0;
   $13 = $12 << 24 >> 24;
   $isdigittmp = (($13) + -48)|0;
   $isdigit = ($isdigittmp>>>0)<(10);
   if ($isdigit) {
    $$13 = $10;$isdigittmp5 = $isdigittmp;$n$04 = $11;
   } else {
    $n$0$lcssa = $11;
    break;
   }
  }
 } else {
  $n$0$lcssa = 0;
 }
 $14 = ($neg$1$ph|0)!=(0);
 $15 = (0 - ($n$0$lcssa))|0;
 $16 = $14 ? $n$0$lcssa : $15;
 return ($16|0);
}
function _rand() {
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = 5000;
 $1 = $0;
 $2 = HEAP32[$1>>2]|0;
 $3 = (($0) + 4)|0;
 $4 = $3;
 $5 = HEAP32[$4>>2]|0;
 $6 = (___muldi3(($2|0),($5|0),1284865837,1481765933)|0);
 $7 = tempRet0;
 $8 = (_i64Add(($6|0),($7|0),1,0)|0);
 $9 = tempRet0;
 $10 = 5000;
 $11 = $10;
 HEAP32[$11>>2] = $8;
 $12 = (($10) + 4)|0;
 $13 = $12;
 HEAP32[$13>>2] = $9;
 $14 = (_bitshift64Lshr(($8|0),($9|0),33)|0);
 $15 = tempRet0;
 return ($14|0);
}
function _malloc($bytes) {
 $bytes = $bytes|0;
 var $$0 = 0, $$lcssa = 0, $$lcssa141 = 0, $$lcssa142 = 0, $$lcssa144 = 0, $$lcssa147 = 0, $$lcssa149 = 0, $$lcssa151 = 0, $$lcssa153 = 0, $$lcssa155 = 0, $$lcssa157 = 0, $$not$i = 0, $$pre = 0, $$pre$i = 0, $$pre$i$i = 0, $$pre$i13 = 0, $$pre$i16$i = 0, $$pre$phi$i$iZ2D = 0, $$pre$phi$i14Z2D = 0, $$pre$phi$i17$iZ2D = 0;
 var $$pre$phi$iZ2D = 0, $$pre$phi10$i$iZ2D = 0, $$pre$phiZ2D = 0, $$pre71 = 0, $$pre9$i$i = 0, $$rsize$0$i = 0, $$rsize$4$i = 0, $$v$0$i = 0, $0 = 0, $1 = 0, $10 = 0, $100 = 0, $1000 = 0, $1001 = 0, $1002 = 0, $1003 = 0, $1004 = 0, $1005 = 0, $1006 = 0, $1007 = 0;
 var $1008 = 0, $1009 = 0, $101 = 0, $1010 = 0, $1011 = 0, $1012 = 0, $1013 = 0, $1014 = 0, $1015 = 0, $1016 = 0, $1017 = 0, $1018 = 0, $1019 = 0, $102 = 0, $1020 = 0, $1021 = 0, $1022 = 0, $1023 = 0, $1024 = 0, $1025 = 0;
 var $1026 = 0, $1027 = 0, $1028 = 0, $1029 = 0, $103 = 0, $1030 = 0, $1031 = 0, $1032 = 0, $1033 = 0, $1034 = 0, $1035 = 0, $1036 = 0, $1037 = 0, $1038 = 0, $1039 = 0, $104 = 0, $1040 = 0, $1041 = 0, $1042 = 0, $1043 = 0;
 var $1044 = 0, $1045 = 0, $1046 = 0, $1047 = 0, $1048 = 0, $1049 = 0, $105 = 0, $1050 = 0, $1051 = 0, $1052 = 0, $1053 = 0, $1054 = 0, $1055 = 0, $1056 = 0, $1057 = 0, $1058 = 0, $1059 = 0, $106 = 0, $107 = 0, $108 = 0;
 var $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0, $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0;
 var $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0, $134 = 0, $135 = 0, $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0;
 var $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0, $152 = 0, $153 = 0, $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0, $159 = 0, $16 = 0, $160 = 0, $161 = 0, $162 = 0;
 var $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0, $168 = 0, $169 = 0, $17 = 0, $170 = 0, $171 = 0, $172 = 0, $173 = 0, $174 = 0, $175 = 0, $176 = 0, $177 = 0, $178 = 0, $179 = 0, $18 = 0, $180 = 0;
 var $181 = 0, $182 = 0, $183 = 0, $184 = 0, $185 = 0, $186 = 0, $187 = 0, $188 = 0, $189 = 0, $19 = 0, $190 = 0, $191 = 0, $192 = 0, $193 = 0, $194 = 0, $195 = 0, $196 = 0, $197 = 0, $198 = 0, $199 = 0;
 var $2 = 0, $20 = 0, $200 = 0, $201 = 0, $202 = 0, $203 = 0, $204 = 0, $205 = 0, $206 = 0, $207 = 0, $208 = 0, $209 = 0, $21 = 0, $210 = 0, $211 = 0, $212 = 0, $213 = 0, $214 = 0, $215 = 0, $216 = 0;
 var $217 = 0, $218 = 0, $219 = 0, $22 = 0, $220 = 0, $221 = 0, $222 = 0, $223 = 0, $224 = 0, $225 = 0, $226 = 0, $227 = 0, $228 = 0, $229 = 0, $23 = 0, $230 = 0, $231 = 0, $232 = 0, $233 = 0, $234 = 0;
 var $235 = 0, $236 = 0, $237 = 0, $238 = 0, $239 = 0, $24 = 0, $240 = 0, $241 = 0, $242 = 0, $243 = 0, $244 = 0, $245 = 0, $246 = 0, $247 = 0, $248 = 0, $249 = 0, $25 = 0, $250 = 0, $251 = 0, $252 = 0;
 var $253 = 0, $254 = 0, $255 = 0, $256 = 0, $257 = 0, $258 = 0, $259 = 0, $26 = 0, $260 = 0, $261 = 0, $262 = 0, $263 = 0, $264 = 0, $265 = 0, $266 = 0, $267 = 0, $268 = 0, $269 = 0, $27 = 0, $270 = 0;
 var $271 = 0, $272 = 0, $273 = 0, $274 = 0, $275 = 0, $276 = 0, $277 = 0, $278 = 0, $279 = 0, $28 = 0, $280 = 0, $281 = 0, $282 = 0, $283 = 0, $284 = 0, $285 = 0, $286 = 0, $287 = 0, $288 = 0, $289 = 0;
 var $29 = 0, $290 = 0, $291 = 0, $292 = 0, $293 = 0, $294 = 0, $295 = 0, $296 = 0, $297 = 0, $298 = 0, $299 = 0, $3 = 0, $30 = 0, $300 = 0, $301 = 0, $302 = 0, $303 = 0, $304 = 0, $305 = 0, $306 = 0;
 var $307 = 0, $308 = 0, $309 = 0, $31 = 0, $310 = 0, $311 = 0, $312 = 0, $313 = 0, $314 = 0, $315 = 0, $316 = 0, $317 = 0, $318 = 0, $319 = 0, $32 = 0, $320 = 0, $321 = 0, $322 = 0, $323 = 0, $324 = 0;
 var $325 = 0, $326 = 0, $327 = 0, $328 = 0, $329 = 0, $33 = 0, $330 = 0, $331 = 0, $332 = 0, $333 = 0, $334 = 0, $335 = 0, $336 = 0, $337 = 0, $338 = 0, $339 = 0, $34 = 0, $340 = 0, $341 = 0, $342 = 0;
 var $343 = 0, $344 = 0, $345 = 0, $346 = 0, $347 = 0, $348 = 0, $349 = 0, $35 = 0, $350 = 0, $351 = 0, $352 = 0, $353 = 0, $354 = 0, $355 = 0, $356 = 0, $357 = 0, $358 = 0, $359 = 0, $36 = 0, $360 = 0;
 var $361 = 0, $362 = 0, $363 = 0, $364 = 0, $365 = 0, $366 = 0, $367 = 0, $368 = 0, $369 = 0, $37 = 0, $370 = 0, $371 = 0, $372 = 0, $373 = 0, $374 = 0, $375 = 0, $376 = 0, $377 = 0, $378 = 0, $379 = 0;
 var $38 = 0, $380 = 0, $381 = 0, $382 = 0, $383 = 0, $384 = 0, $385 = 0, $386 = 0, $387 = 0, $388 = 0, $389 = 0, $39 = 0, $390 = 0, $391 = 0, $392 = 0, $393 = 0, $394 = 0, $395 = 0, $396 = 0, $397 = 0;
 var $398 = 0, $399 = 0, $4 = 0, $40 = 0, $400 = 0, $401 = 0, $402 = 0, $403 = 0, $404 = 0, $405 = 0, $406 = 0, $407 = 0, $408 = 0, $409 = 0, $41 = 0, $410 = 0, $411 = 0, $412 = 0, $413 = 0, $414 = 0;
 var $415 = 0, $416 = 0, $417 = 0, $418 = 0, $419 = 0, $42 = 0, $420 = 0, $421 = 0, $422 = 0, $423 = 0, $424 = 0, $425 = 0, $426 = 0, $427 = 0, $428 = 0, $429 = 0, $43 = 0, $430 = 0, $431 = 0, $432 = 0;
 var $433 = 0, $434 = 0, $435 = 0, $436 = 0, $437 = 0, $438 = 0, $439 = 0, $44 = 0, $440 = 0, $441 = 0, $442 = 0, $443 = 0, $444 = 0, $445 = 0, $446 = 0, $447 = 0, $448 = 0, $449 = 0, $45 = 0, $450 = 0;
 var $451 = 0, $452 = 0, $453 = 0, $454 = 0, $455 = 0, $456 = 0, $457 = 0, $458 = 0, $459 = 0, $46 = 0, $460 = 0, $461 = 0, $462 = 0, $463 = 0, $464 = 0, $465 = 0, $466 = 0, $467 = 0, $468 = 0, $469 = 0;
 var $47 = 0, $470 = 0, $471 = 0, $472 = 0, $473 = 0, $474 = 0, $475 = 0, $476 = 0, $477 = 0, $478 = 0, $479 = 0, $48 = 0, $480 = 0, $481 = 0, $482 = 0, $483 = 0, $484 = 0, $485 = 0, $486 = 0, $487 = 0;
 var $488 = 0, $489 = 0, $49 = 0, $490 = 0, $491 = 0, $492 = 0, $493 = 0, $494 = 0, $495 = 0, $496 = 0, $497 = 0, $498 = 0, $499 = 0, $5 = 0, $50 = 0, $500 = 0, $501 = 0, $502 = 0, $503 = 0, $504 = 0;
 var $505 = 0, $506 = 0, $507 = 0, $508 = 0, $509 = 0, $51 = 0, $510 = 0, $511 = 0, $512 = 0, $513 = 0, $514 = 0, $515 = 0, $516 = 0, $517 = 0, $518 = 0, $519 = 0, $52 = 0, $520 = 0, $521 = 0, $522 = 0;
 var $523 = 0, $524 = 0, $525 = 0, $526 = 0, $527 = 0, $528 = 0, $529 = 0, $53 = 0, $530 = 0, $531 = 0, $532 = 0, $533 = 0, $534 = 0, $535 = 0, $536 = 0, $537 = 0, $538 = 0, $539 = 0, $54 = 0, $540 = 0;
 var $541 = 0, $542 = 0, $543 = 0, $544 = 0, $545 = 0, $546 = 0, $547 = 0, $548 = 0, $549 = 0, $55 = 0, $550 = 0, $551 = 0, $552 = 0, $553 = 0, $554 = 0, $555 = 0, $556 = 0, $557 = 0, $558 = 0, $559 = 0;
 var $56 = 0, $560 = 0, $561 = 0, $562 = 0, $563 = 0, $564 = 0, $565 = 0, $566 = 0, $567 = 0, $568 = 0, $569 = 0, $57 = 0, $570 = 0, $571 = 0, $572 = 0, $573 = 0, $574 = 0, $575 = 0, $576 = 0, $577 = 0;
 var $578 = 0, $579 = 0, $58 = 0, $580 = 0, $581 = 0, $582 = 0, $583 = 0, $584 = 0, $585 = 0, $586 = 0, $587 = 0, $588 = 0, $589 = 0, $59 = 0, $590 = 0, $591 = 0, $592 = 0, $593 = 0, $594 = 0, $595 = 0;
 var $596 = 0, $597 = 0, $598 = 0, $599 = 0, $6 = 0, $60 = 0, $600 = 0, $601 = 0, $602 = 0, $603 = 0, $604 = 0, $605 = 0, $606 = 0, $607 = 0, $608 = 0, $609 = 0, $61 = 0, $610 = 0, $611 = 0, $612 = 0;
 var $613 = 0, $614 = 0, $615 = 0, $616 = 0, $617 = 0, $618 = 0, $619 = 0, $62 = 0, $620 = 0, $621 = 0, $622 = 0, $623 = 0, $624 = 0, $625 = 0, $626 = 0, $627 = 0, $628 = 0, $629 = 0, $63 = 0, $630 = 0;
 var $631 = 0, $632 = 0, $633 = 0, $634 = 0, $635 = 0, $636 = 0, $637 = 0, $638 = 0, $639 = 0, $64 = 0, $640 = 0, $641 = 0, $642 = 0, $643 = 0, $644 = 0, $645 = 0, $646 = 0, $647 = 0, $648 = 0, $649 = 0;
 var $65 = 0, $650 = 0, $651 = 0, $652 = 0, $653 = 0, $654 = 0, $655 = 0, $656 = 0, $657 = 0, $658 = 0, $659 = 0, $66 = 0, $660 = 0, $661 = 0, $662 = 0, $663 = 0, $664 = 0, $665 = 0, $666 = 0, $667 = 0;
 var $668 = 0, $669 = 0, $67 = 0, $670 = 0, $671 = 0, $672 = 0, $673 = 0, $674 = 0, $675 = 0, $676 = 0, $677 = 0, $678 = 0, $679 = 0, $68 = 0, $680 = 0, $681 = 0, $682 = 0, $683 = 0, $684 = 0, $685 = 0;
 var $686 = 0, $687 = 0, $688 = 0, $689 = 0, $69 = 0, $690 = 0, $691 = 0, $692 = 0, $693 = 0, $694 = 0, $695 = 0, $696 = 0, $697 = 0, $698 = 0, $699 = 0, $7 = 0, $70 = 0, $700 = 0, $701 = 0, $702 = 0;
 var $703 = 0, $704 = 0, $705 = 0, $706 = 0, $707 = 0, $708 = 0, $709 = 0, $71 = 0, $710 = 0, $711 = 0, $712 = 0, $713 = 0, $714 = 0, $715 = 0, $716 = 0, $717 = 0, $718 = 0, $719 = 0, $72 = 0, $720 = 0;
 var $721 = 0, $722 = 0, $723 = 0, $724 = 0, $725 = 0, $726 = 0, $727 = 0, $728 = 0, $729 = 0, $73 = 0, $730 = 0, $731 = 0, $732 = 0, $733 = 0, $734 = 0, $735 = 0, $736 = 0, $737 = 0, $738 = 0, $739 = 0;
 var $74 = 0, $740 = 0, $741 = 0, $742 = 0, $743 = 0, $744 = 0, $745 = 0, $746 = 0, $747 = 0, $748 = 0, $749 = 0, $75 = 0, $750 = 0, $751 = 0, $752 = 0, $753 = 0, $754 = 0, $755 = 0, $756 = 0, $757 = 0;
 var $758 = 0, $759 = 0, $76 = 0, $760 = 0, $761 = 0, $762 = 0, $763 = 0, $764 = 0, $765 = 0, $766 = 0, $767 = 0, $768 = 0, $769 = 0, $77 = 0, $770 = 0, $771 = 0, $772 = 0, $773 = 0, $774 = 0, $775 = 0;
 var $776 = 0, $777 = 0, $778 = 0, $779 = 0, $78 = 0, $780 = 0, $781 = 0, $782 = 0, $783 = 0, $784 = 0, $785 = 0, $786 = 0, $787 = 0, $788 = 0, $789 = 0, $79 = 0, $790 = 0, $791 = 0, $792 = 0, $793 = 0;
 var $794 = 0, $795 = 0, $796 = 0, $797 = 0, $798 = 0, $799 = 0, $8 = 0, $80 = 0, $800 = 0, $801 = 0, $802 = 0, $803 = 0, $804 = 0, $805 = 0, $806 = 0, $807 = 0, $808 = 0, $809 = 0, $81 = 0, $810 = 0;
 var $811 = 0, $812 = 0, $813 = 0, $814 = 0, $815 = 0, $816 = 0, $817 = 0, $818 = 0, $819 = 0, $82 = 0, $820 = 0, $821 = 0, $822 = 0, $823 = 0, $824 = 0, $825 = 0, $826 = 0, $827 = 0, $828 = 0, $829 = 0;
 var $83 = 0, $830 = 0, $831 = 0, $832 = 0, $833 = 0, $834 = 0, $835 = 0, $836 = 0, $837 = 0, $838 = 0, $839 = 0, $84 = 0, $840 = 0, $841 = 0, $842 = 0, $843 = 0, $844 = 0, $845 = 0, $846 = 0, $847 = 0;
 var $848 = 0, $849 = 0, $85 = 0, $850 = 0, $851 = 0, $852 = 0, $853 = 0, $854 = 0, $855 = 0, $856 = 0, $857 = 0, $858 = 0, $859 = 0, $86 = 0, $860 = 0, $861 = 0, $862 = 0, $863 = 0, $864 = 0, $865 = 0;
 var $866 = 0, $867 = 0, $868 = 0, $869 = 0, $87 = 0, $870 = 0, $871 = 0, $872 = 0, $873 = 0, $874 = 0, $875 = 0, $876 = 0, $877 = 0, $878 = 0, $879 = 0, $88 = 0, $880 = 0, $881 = 0, $882 = 0, $883 = 0;
 var $884 = 0, $885 = 0, $886 = 0, $887 = 0, $888 = 0, $889 = 0, $89 = 0, $890 = 0, $891 = 0, $892 = 0, $893 = 0, $894 = 0, $895 = 0, $896 = 0, $897 = 0, $898 = 0, $899 = 0, $9 = 0, $90 = 0, $900 = 0;
 var $901 = 0, $902 = 0, $903 = 0, $904 = 0, $905 = 0, $906 = 0, $907 = 0, $908 = 0, $909 = 0, $91 = 0, $910 = 0, $911 = 0, $912 = 0, $913 = 0, $914 = 0, $915 = 0, $916 = 0, $917 = 0, $918 = 0, $919 = 0;
 var $92 = 0, $920 = 0, $921 = 0, $922 = 0, $923 = 0, $924 = 0, $925 = 0, $926 = 0, $927 = 0, $928 = 0, $929 = 0, $93 = 0, $930 = 0, $931 = 0, $932 = 0, $933 = 0, $934 = 0, $935 = 0, $936 = 0, $937 = 0;
 var $938 = 0, $939 = 0, $94 = 0, $940 = 0, $941 = 0, $942 = 0, $943 = 0, $944 = 0, $945 = 0, $946 = 0, $947 = 0, $948 = 0, $949 = 0, $95 = 0, $950 = 0, $951 = 0, $952 = 0, $953 = 0, $954 = 0, $955 = 0;
 var $956 = 0, $957 = 0, $958 = 0, $959 = 0, $96 = 0, $960 = 0, $961 = 0, $962 = 0, $963 = 0, $964 = 0, $965 = 0, $966 = 0, $967 = 0, $968 = 0, $969 = 0, $97 = 0, $970 = 0, $971 = 0, $972 = 0, $973 = 0;
 var $974 = 0, $975 = 0, $976 = 0, $977 = 0, $978 = 0, $979 = 0, $98 = 0, $980 = 0, $981 = 0, $982 = 0, $983 = 0, $984 = 0, $985 = 0, $986 = 0, $987 = 0, $988 = 0, $989 = 0, $99 = 0, $990 = 0, $991 = 0;
 var $992 = 0, $993 = 0, $994 = 0, $995 = 0, $996 = 0, $997 = 0, $998 = 0, $999 = 0, $F$0$i$i = 0, $F1$0$i = 0, $F4$0 = 0, $F4$0$i$i = 0, $F5$0$i = 0, $I1$0$i$i = 0, $I7$0$i = 0, $I7$0$i$i = 0, $K12$0$i = 0, $K2$0$i$i = 0, $K8$0$i$i = 0, $R$1$i = 0;
 var $R$1$i$i = 0, $R$1$i$i$lcssa = 0, $R$1$i$lcssa = 0, $R$1$i9 = 0, $R$1$i9$lcssa = 0, $R$3$i = 0, $R$3$i$i = 0, $R$3$i11 = 0, $RP$1$i = 0, $RP$1$i$i = 0, $RP$1$i$i$lcssa = 0, $RP$1$i$lcssa = 0, $RP$1$i8 = 0, $RP$1$i8$lcssa = 0, $T$0$i = 0, $T$0$i$i = 0, $T$0$i$i$lcssa = 0, $T$0$i$i$lcssa140 = 0, $T$0$i$lcssa = 0, $T$0$i$lcssa156 = 0;
 var $T$0$i18$i = 0, $T$0$i18$i$lcssa = 0, $T$0$i18$i$lcssa139 = 0, $br$2$ph$i = 0, $cond$i = 0, $cond$i$i = 0, $cond$i12 = 0, $exitcond$i$i = 0, $i$01$i$i = 0, $idx$0$i = 0, $magic$i$i = 0, $nb$0 = 0, $not$$i$i = 0, $not$$i20$i = 0, $not$7$i = 0, $oldfirst$0$i$i = 0, $or$cond$i = 0, $or$cond$i17 = 0, $or$cond1$i = 0, $or$cond1$i16 = 0;
 var $or$cond10$i = 0, $or$cond11$i = 0, $or$cond2$i = 0, $or$cond48$i = 0, $or$cond5$i = 0, $or$cond7$i = 0, $or$cond8$i = 0, $p$0$i$i = 0, $qsize$0$i$i = 0, $rsize$0$i = 0, $rsize$0$i$lcssa = 0, $rsize$0$i5 = 0, $rsize$1$i = 0, $rsize$3$i = 0, $rsize$4$lcssa$i = 0, $rsize$412$i = 0, $rst$0$i = 0, $rst$1$i = 0, $sizebits$0$$i = 0, $sizebits$0$i = 0;
 var $sp$0$i$i = 0, $sp$0$i$i$i = 0, $sp$068$i = 0, $sp$068$i$lcssa = 0, $sp$167$i = 0, $sp$167$i$lcssa = 0, $ssize$0$i = 0, $ssize$2$ph$i = 0, $ssize$5$i = 0, $t$0$i = 0, $t$0$i4 = 0, $t$2$i = 0, $t$4$ph$i = 0, $t$4$v$4$i = 0, $t$411$i = 0, $tbase$746$i = 0, $tsize$745$i = 0, $v$0$i = 0, $v$0$i$lcssa = 0, $v$0$i6 = 0;
 var $v$1$i = 0, $v$3$i = 0, $v$4$lcssa$i = 0, $v$413$i = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $magic$i$i = sp;
 $0 = ($bytes>>>0)<(245);
 do {
  if ($0) {
   $1 = ($bytes>>>0)<(11);
   $2 = (($bytes) + 11)|0;
   $3 = $2 & -8;
   $4 = $1 ? 16 : $3;
   $5 = $4 >>> 3;
   $6 = HEAP32[7424]|0;
   $7 = $6 >>> $5;
   $8 = $7 & 3;
   $9 = ($8|0)==(0);
   if (!($9)) {
    $10 = $7 & 1;
    $11 = $10 ^ 1;
    $12 = (($11) + ($5))|0;
    $13 = $12 << 1;
    $14 = (29736 + ($13<<2)|0);
    $15 = ((($14)) + 8|0);
    $16 = HEAP32[$15>>2]|0;
    $17 = ((($16)) + 8|0);
    $18 = HEAP32[$17>>2]|0;
    $19 = ($14|0)==($18|0);
    do {
     if ($19) {
      $20 = 1 << $12;
      $21 = $20 ^ -1;
      $22 = $6 & $21;
      HEAP32[7424] = $22;
     } else {
      $23 = HEAP32[(29712)>>2]|0;
      $24 = ($18>>>0)<($23>>>0);
      if ($24) {
       _abort();
       // unreachable;
      }
      $25 = ((($18)) + 12|0);
      $26 = HEAP32[$25>>2]|0;
      $27 = ($26|0)==($16|0);
      if ($27) {
       HEAP32[$25>>2] = $14;
       HEAP32[$15>>2] = $18;
       break;
      } else {
       _abort();
       // unreachable;
      }
     }
    } while(0);
    $28 = $12 << 3;
    $29 = $28 | 3;
    $30 = ((($16)) + 4|0);
    HEAP32[$30>>2] = $29;
    $31 = (($16) + ($28)|0);
    $32 = ((($31)) + 4|0);
    $33 = HEAP32[$32>>2]|0;
    $34 = $33 | 1;
    HEAP32[$32>>2] = $34;
    $$0 = $17;
    STACKTOP = sp;return ($$0|0);
   }
   $35 = HEAP32[(29704)>>2]|0;
   $36 = ($4>>>0)>($35>>>0);
   if ($36) {
    $37 = ($7|0)==(0);
    if (!($37)) {
     $38 = $7 << $5;
     $39 = 2 << $5;
     $40 = (0 - ($39))|0;
     $41 = $39 | $40;
     $42 = $38 & $41;
     $43 = (0 - ($42))|0;
     $44 = $42 & $43;
     $45 = (($44) + -1)|0;
     $46 = $45 >>> 12;
     $47 = $46 & 16;
     $48 = $45 >>> $47;
     $49 = $48 >>> 5;
     $50 = $49 & 8;
     $51 = $50 | $47;
     $52 = $48 >>> $50;
     $53 = $52 >>> 2;
     $54 = $53 & 4;
     $55 = $51 | $54;
     $56 = $52 >>> $54;
     $57 = $56 >>> 1;
     $58 = $57 & 2;
     $59 = $55 | $58;
     $60 = $56 >>> $58;
     $61 = $60 >>> 1;
     $62 = $61 & 1;
     $63 = $59 | $62;
     $64 = $60 >>> $62;
     $65 = (($63) + ($64))|0;
     $66 = $65 << 1;
     $67 = (29736 + ($66<<2)|0);
     $68 = ((($67)) + 8|0);
     $69 = HEAP32[$68>>2]|0;
     $70 = ((($69)) + 8|0);
     $71 = HEAP32[$70>>2]|0;
     $72 = ($67|0)==($71|0);
     do {
      if ($72) {
       $73 = 1 << $65;
       $74 = $73 ^ -1;
       $75 = $6 & $74;
       HEAP32[7424] = $75;
       $89 = $35;
      } else {
       $76 = HEAP32[(29712)>>2]|0;
       $77 = ($71>>>0)<($76>>>0);
       if ($77) {
        _abort();
        // unreachable;
       }
       $78 = ((($71)) + 12|0);
       $79 = HEAP32[$78>>2]|0;
       $80 = ($79|0)==($69|0);
       if ($80) {
        HEAP32[$78>>2] = $67;
        HEAP32[$68>>2] = $71;
        $$pre = HEAP32[(29704)>>2]|0;
        $89 = $$pre;
        break;
       } else {
        _abort();
        // unreachable;
       }
      }
     } while(0);
     $81 = $65 << 3;
     $82 = (($81) - ($4))|0;
     $83 = $4 | 3;
     $84 = ((($69)) + 4|0);
     HEAP32[$84>>2] = $83;
     $85 = (($69) + ($4)|0);
     $86 = $82 | 1;
     $87 = ((($85)) + 4|0);
     HEAP32[$87>>2] = $86;
     $88 = (($85) + ($82)|0);
     HEAP32[$88>>2] = $82;
     $90 = ($89|0)==(0);
     if (!($90)) {
      $91 = HEAP32[(29716)>>2]|0;
      $92 = $89 >>> 3;
      $93 = $92 << 1;
      $94 = (29736 + ($93<<2)|0);
      $95 = HEAP32[7424]|0;
      $96 = 1 << $92;
      $97 = $95 & $96;
      $98 = ($97|0)==(0);
      if ($98) {
       $99 = $95 | $96;
       HEAP32[7424] = $99;
       $$pre71 = ((($94)) + 8|0);
       $$pre$phiZ2D = $$pre71;$F4$0 = $94;
      } else {
       $100 = ((($94)) + 8|0);
       $101 = HEAP32[$100>>2]|0;
       $102 = HEAP32[(29712)>>2]|0;
       $103 = ($101>>>0)<($102>>>0);
       if ($103) {
        _abort();
        // unreachable;
       } else {
        $$pre$phiZ2D = $100;$F4$0 = $101;
       }
      }
      HEAP32[$$pre$phiZ2D>>2] = $91;
      $104 = ((($F4$0)) + 12|0);
      HEAP32[$104>>2] = $91;
      $105 = ((($91)) + 8|0);
      HEAP32[$105>>2] = $F4$0;
      $106 = ((($91)) + 12|0);
      HEAP32[$106>>2] = $94;
     }
     HEAP32[(29704)>>2] = $82;
     HEAP32[(29716)>>2] = $85;
     $$0 = $70;
     STACKTOP = sp;return ($$0|0);
    }
    $107 = HEAP32[(29700)>>2]|0;
    $108 = ($107|0)==(0);
    if ($108) {
     $nb$0 = $4;
    } else {
     $109 = (0 - ($107))|0;
     $110 = $107 & $109;
     $111 = (($110) + -1)|0;
     $112 = $111 >>> 12;
     $113 = $112 & 16;
     $114 = $111 >>> $113;
     $115 = $114 >>> 5;
     $116 = $115 & 8;
     $117 = $116 | $113;
     $118 = $114 >>> $116;
     $119 = $118 >>> 2;
     $120 = $119 & 4;
     $121 = $117 | $120;
     $122 = $118 >>> $120;
     $123 = $122 >>> 1;
     $124 = $123 & 2;
     $125 = $121 | $124;
     $126 = $122 >>> $124;
     $127 = $126 >>> 1;
     $128 = $127 & 1;
     $129 = $125 | $128;
     $130 = $126 >>> $128;
     $131 = (($129) + ($130))|0;
     $132 = (30000 + ($131<<2)|0);
     $133 = HEAP32[$132>>2]|0;
     $134 = ((($133)) + 4|0);
     $135 = HEAP32[$134>>2]|0;
     $136 = $135 & -8;
     $137 = (($136) - ($4))|0;
     $rsize$0$i = $137;$t$0$i = $133;$v$0$i = $133;
     while(1) {
      $138 = ((($t$0$i)) + 16|0);
      $139 = HEAP32[$138>>2]|0;
      $140 = ($139|0)==(0|0);
      if ($140) {
       $141 = ((($t$0$i)) + 20|0);
       $142 = HEAP32[$141>>2]|0;
       $143 = ($142|0)==(0|0);
       if ($143) {
        $rsize$0$i$lcssa = $rsize$0$i;$v$0$i$lcssa = $v$0$i;
        break;
       } else {
        $145 = $142;
       }
      } else {
       $145 = $139;
      }
      $144 = ((($145)) + 4|0);
      $146 = HEAP32[$144>>2]|0;
      $147 = $146 & -8;
      $148 = (($147) - ($4))|0;
      $149 = ($148>>>0)<($rsize$0$i>>>0);
      $$rsize$0$i = $149 ? $148 : $rsize$0$i;
      $$v$0$i = $149 ? $145 : $v$0$i;
      $rsize$0$i = $$rsize$0$i;$t$0$i = $145;$v$0$i = $$v$0$i;
     }
     $150 = HEAP32[(29712)>>2]|0;
     $151 = ($v$0$i$lcssa>>>0)<($150>>>0);
     if ($151) {
      _abort();
      // unreachable;
     }
     $152 = (($v$0$i$lcssa) + ($4)|0);
     $153 = ($v$0$i$lcssa>>>0)<($152>>>0);
     if (!($153)) {
      _abort();
      // unreachable;
     }
     $154 = ((($v$0$i$lcssa)) + 24|0);
     $155 = HEAP32[$154>>2]|0;
     $156 = ((($v$0$i$lcssa)) + 12|0);
     $157 = HEAP32[$156>>2]|0;
     $158 = ($157|0)==($v$0$i$lcssa|0);
     do {
      if ($158) {
       $168 = ((($v$0$i$lcssa)) + 20|0);
       $169 = HEAP32[$168>>2]|0;
       $170 = ($169|0)==(0|0);
       if ($170) {
        $171 = ((($v$0$i$lcssa)) + 16|0);
        $172 = HEAP32[$171>>2]|0;
        $173 = ($172|0)==(0|0);
        if ($173) {
         $R$3$i = 0;
         break;
        } else {
         $R$1$i = $172;$RP$1$i = $171;
        }
       } else {
        $R$1$i = $169;$RP$1$i = $168;
       }
       while(1) {
        $174 = ((($R$1$i)) + 20|0);
        $175 = HEAP32[$174>>2]|0;
        $176 = ($175|0)==(0|0);
        if (!($176)) {
         $R$1$i = $175;$RP$1$i = $174;
         continue;
        }
        $177 = ((($R$1$i)) + 16|0);
        $178 = HEAP32[$177>>2]|0;
        $179 = ($178|0)==(0|0);
        if ($179) {
         $R$1$i$lcssa = $R$1$i;$RP$1$i$lcssa = $RP$1$i;
         break;
        } else {
         $R$1$i = $178;$RP$1$i = $177;
        }
       }
       $180 = ($RP$1$i$lcssa>>>0)<($150>>>0);
       if ($180) {
        _abort();
        // unreachable;
       } else {
        HEAP32[$RP$1$i$lcssa>>2] = 0;
        $R$3$i = $R$1$i$lcssa;
        break;
       }
      } else {
       $159 = ((($v$0$i$lcssa)) + 8|0);
       $160 = HEAP32[$159>>2]|0;
       $161 = ($160>>>0)<($150>>>0);
       if ($161) {
        _abort();
        // unreachable;
       }
       $162 = ((($160)) + 12|0);
       $163 = HEAP32[$162>>2]|0;
       $164 = ($163|0)==($v$0$i$lcssa|0);
       if (!($164)) {
        _abort();
        // unreachable;
       }
       $165 = ((($157)) + 8|0);
       $166 = HEAP32[$165>>2]|0;
       $167 = ($166|0)==($v$0$i$lcssa|0);
       if ($167) {
        HEAP32[$162>>2] = $157;
        HEAP32[$165>>2] = $160;
        $R$3$i = $157;
        break;
       } else {
        _abort();
        // unreachable;
       }
      }
     } while(0);
     $181 = ($155|0)==(0|0);
     do {
      if (!($181)) {
       $182 = ((($v$0$i$lcssa)) + 28|0);
       $183 = HEAP32[$182>>2]|0;
       $184 = (30000 + ($183<<2)|0);
       $185 = HEAP32[$184>>2]|0;
       $186 = ($v$0$i$lcssa|0)==($185|0);
       if ($186) {
        HEAP32[$184>>2] = $R$3$i;
        $cond$i = ($R$3$i|0)==(0|0);
        if ($cond$i) {
         $187 = 1 << $183;
         $188 = $187 ^ -1;
         $189 = HEAP32[(29700)>>2]|0;
         $190 = $189 & $188;
         HEAP32[(29700)>>2] = $190;
         break;
        }
       } else {
        $191 = HEAP32[(29712)>>2]|0;
        $192 = ($155>>>0)<($191>>>0);
        if ($192) {
         _abort();
         // unreachable;
        }
        $193 = ((($155)) + 16|0);
        $194 = HEAP32[$193>>2]|0;
        $195 = ($194|0)==($v$0$i$lcssa|0);
        if ($195) {
         HEAP32[$193>>2] = $R$3$i;
        } else {
         $196 = ((($155)) + 20|0);
         HEAP32[$196>>2] = $R$3$i;
        }
        $197 = ($R$3$i|0)==(0|0);
        if ($197) {
         break;
        }
       }
       $198 = HEAP32[(29712)>>2]|0;
       $199 = ($R$3$i>>>0)<($198>>>0);
       if ($199) {
        _abort();
        // unreachable;
       }
       $200 = ((($R$3$i)) + 24|0);
       HEAP32[$200>>2] = $155;
       $201 = ((($v$0$i$lcssa)) + 16|0);
       $202 = HEAP32[$201>>2]|0;
       $203 = ($202|0)==(0|0);
       do {
        if (!($203)) {
         $204 = ($202>>>0)<($198>>>0);
         if ($204) {
          _abort();
          // unreachable;
         } else {
          $205 = ((($R$3$i)) + 16|0);
          HEAP32[$205>>2] = $202;
          $206 = ((($202)) + 24|0);
          HEAP32[$206>>2] = $R$3$i;
          break;
         }
        }
       } while(0);
       $207 = ((($v$0$i$lcssa)) + 20|0);
       $208 = HEAP32[$207>>2]|0;
       $209 = ($208|0)==(0|0);
       if (!($209)) {
        $210 = HEAP32[(29712)>>2]|0;
        $211 = ($208>>>0)<($210>>>0);
        if ($211) {
         _abort();
         // unreachable;
        } else {
         $212 = ((($R$3$i)) + 20|0);
         HEAP32[$212>>2] = $208;
         $213 = ((($208)) + 24|0);
         HEAP32[$213>>2] = $R$3$i;
         break;
        }
       }
      }
     } while(0);
     $214 = ($rsize$0$i$lcssa>>>0)<(16);
     if ($214) {
      $215 = (($rsize$0$i$lcssa) + ($4))|0;
      $216 = $215 | 3;
      $217 = ((($v$0$i$lcssa)) + 4|0);
      HEAP32[$217>>2] = $216;
      $218 = (($v$0$i$lcssa) + ($215)|0);
      $219 = ((($218)) + 4|0);
      $220 = HEAP32[$219>>2]|0;
      $221 = $220 | 1;
      HEAP32[$219>>2] = $221;
     } else {
      $222 = $4 | 3;
      $223 = ((($v$0$i$lcssa)) + 4|0);
      HEAP32[$223>>2] = $222;
      $224 = $rsize$0$i$lcssa | 1;
      $225 = ((($152)) + 4|0);
      HEAP32[$225>>2] = $224;
      $226 = (($152) + ($rsize$0$i$lcssa)|0);
      HEAP32[$226>>2] = $rsize$0$i$lcssa;
      $227 = HEAP32[(29704)>>2]|0;
      $228 = ($227|0)==(0);
      if (!($228)) {
       $229 = HEAP32[(29716)>>2]|0;
       $230 = $227 >>> 3;
       $231 = $230 << 1;
       $232 = (29736 + ($231<<2)|0);
       $233 = HEAP32[7424]|0;
       $234 = 1 << $230;
       $235 = $233 & $234;
       $236 = ($235|0)==(0);
       if ($236) {
        $237 = $233 | $234;
        HEAP32[7424] = $237;
        $$pre$i = ((($232)) + 8|0);
        $$pre$phi$iZ2D = $$pre$i;$F1$0$i = $232;
       } else {
        $238 = ((($232)) + 8|0);
        $239 = HEAP32[$238>>2]|0;
        $240 = HEAP32[(29712)>>2]|0;
        $241 = ($239>>>0)<($240>>>0);
        if ($241) {
         _abort();
         // unreachable;
        } else {
         $$pre$phi$iZ2D = $238;$F1$0$i = $239;
        }
       }
       HEAP32[$$pre$phi$iZ2D>>2] = $229;
       $242 = ((($F1$0$i)) + 12|0);
       HEAP32[$242>>2] = $229;
       $243 = ((($229)) + 8|0);
       HEAP32[$243>>2] = $F1$0$i;
       $244 = ((($229)) + 12|0);
       HEAP32[$244>>2] = $232;
      }
      HEAP32[(29704)>>2] = $rsize$0$i$lcssa;
      HEAP32[(29716)>>2] = $152;
     }
     $245 = ((($v$0$i$lcssa)) + 8|0);
     $$0 = $245;
     STACKTOP = sp;return ($$0|0);
    }
   } else {
    $nb$0 = $4;
   }
  } else {
   $246 = ($bytes>>>0)>(4294967231);
   if ($246) {
    $nb$0 = -1;
   } else {
    $247 = (($bytes) + 11)|0;
    $248 = $247 & -8;
    $249 = HEAP32[(29700)>>2]|0;
    $250 = ($249|0)==(0);
    if ($250) {
     $nb$0 = $248;
    } else {
     $251 = (0 - ($248))|0;
     $252 = $247 >>> 8;
     $253 = ($252|0)==(0);
     if ($253) {
      $idx$0$i = 0;
     } else {
      $254 = ($248>>>0)>(16777215);
      if ($254) {
       $idx$0$i = 31;
      } else {
       $255 = (($252) + 1048320)|0;
       $256 = $255 >>> 16;
       $257 = $256 & 8;
       $258 = $252 << $257;
       $259 = (($258) + 520192)|0;
       $260 = $259 >>> 16;
       $261 = $260 & 4;
       $262 = $261 | $257;
       $263 = $258 << $261;
       $264 = (($263) + 245760)|0;
       $265 = $264 >>> 16;
       $266 = $265 & 2;
       $267 = $262 | $266;
       $268 = (14 - ($267))|0;
       $269 = $263 << $266;
       $270 = $269 >>> 15;
       $271 = (($268) + ($270))|0;
       $272 = $271 << 1;
       $273 = (($271) + 7)|0;
       $274 = $248 >>> $273;
       $275 = $274 & 1;
       $276 = $275 | $272;
       $idx$0$i = $276;
      }
     }
     $277 = (30000 + ($idx$0$i<<2)|0);
     $278 = HEAP32[$277>>2]|0;
     $279 = ($278|0)==(0|0);
     L123: do {
      if ($279) {
       $rsize$3$i = $251;$t$2$i = 0;$v$3$i = 0;
       label = 86;
      } else {
       $280 = ($idx$0$i|0)==(31);
       $281 = $idx$0$i >>> 1;
       $282 = (25 - ($281))|0;
       $283 = $280 ? 0 : $282;
       $284 = $248 << $283;
       $rsize$0$i5 = $251;$rst$0$i = 0;$sizebits$0$i = $284;$t$0$i4 = $278;$v$0$i6 = 0;
       while(1) {
        $285 = ((($t$0$i4)) + 4|0);
        $286 = HEAP32[$285>>2]|0;
        $287 = $286 & -8;
        $288 = (($287) - ($248))|0;
        $289 = ($288>>>0)<($rsize$0$i5>>>0);
        if ($289) {
         $290 = ($287|0)==($248|0);
         if ($290) {
          $rsize$412$i = $288;$t$411$i = $t$0$i4;$v$413$i = $t$0$i4;
          label = 90;
          break L123;
         } else {
          $rsize$1$i = $288;$v$1$i = $t$0$i4;
         }
        } else {
         $rsize$1$i = $rsize$0$i5;$v$1$i = $v$0$i6;
        }
        $291 = ((($t$0$i4)) + 20|0);
        $292 = HEAP32[$291>>2]|0;
        $293 = $sizebits$0$i >>> 31;
        $294 = (((($t$0$i4)) + 16|0) + ($293<<2)|0);
        $295 = HEAP32[$294>>2]|0;
        $296 = ($292|0)==(0|0);
        $297 = ($292|0)==($295|0);
        $or$cond1$i = $296 | $297;
        $rst$1$i = $or$cond1$i ? $rst$0$i : $292;
        $298 = ($295|0)==(0|0);
        $299 = $298&1;
        $300 = $299 ^ 1;
        $sizebits$0$$i = $sizebits$0$i << $300;
        if ($298) {
         $rsize$3$i = $rsize$1$i;$t$2$i = $rst$1$i;$v$3$i = $v$1$i;
         label = 86;
         break;
        } else {
         $rsize$0$i5 = $rsize$1$i;$rst$0$i = $rst$1$i;$sizebits$0$i = $sizebits$0$$i;$t$0$i4 = $295;$v$0$i6 = $v$1$i;
        }
       }
      }
     } while(0);
     if ((label|0) == 86) {
      $301 = ($t$2$i|0)==(0|0);
      $302 = ($v$3$i|0)==(0|0);
      $or$cond$i = $301 & $302;
      if ($or$cond$i) {
       $303 = 2 << $idx$0$i;
       $304 = (0 - ($303))|0;
       $305 = $303 | $304;
       $306 = $249 & $305;
       $307 = ($306|0)==(0);
       if ($307) {
        $nb$0 = $248;
        break;
       }
       $308 = (0 - ($306))|0;
       $309 = $306 & $308;
       $310 = (($309) + -1)|0;
       $311 = $310 >>> 12;
       $312 = $311 & 16;
       $313 = $310 >>> $312;
       $314 = $313 >>> 5;
       $315 = $314 & 8;
       $316 = $315 | $312;
       $317 = $313 >>> $315;
       $318 = $317 >>> 2;
       $319 = $318 & 4;
       $320 = $316 | $319;
       $321 = $317 >>> $319;
       $322 = $321 >>> 1;
       $323 = $322 & 2;
       $324 = $320 | $323;
       $325 = $321 >>> $323;
       $326 = $325 >>> 1;
       $327 = $326 & 1;
       $328 = $324 | $327;
       $329 = $325 >>> $327;
       $330 = (($328) + ($329))|0;
       $331 = (30000 + ($330<<2)|0);
       $332 = HEAP32[$331>>2]|0;
       $t$4$ph$i = $332;
      } else {
       $t$4$ph$i = $t$2$i;
      }
      $333 = ($t$4$ph$i|0)==(0|0);
      if ($333) {
       $rsize$4$lcssa$i = $rsize$3$i;$v$4$lcssa$i = $v$3$i;
      } else {
       $rsize$412$i = $rsize$3$i;$t$411$i = $t$4$ph$i;$v$413$i = $v$3$i;
       label = 90;
      }
     }
     if ((label|0) == 90) {
      while(1) {
       label = 0;
       $334 = ((($t$411$i)) + 4|0);
       $335 = HEAP32[$334>>2]|0;
       $336 = $335 & -8;
       $337 = (($336) - ($248))|0;
       $338 = ($337>>>0)<($rsize$412$i>>>0);
       $$rsize$4$i = $338 ? $337 : $rsize$412$i;
       $t$4$v$4$i = $338 ? $t$411$i : $v$413$i;
       $339 = ((($t$411$i)) + 16|0);
       $340 = HEAP32[$339>>2]|0;
       $341 = ($340|0)==(0|0);
       if (!($341)) {
        $rsize$412$i = $$rsize$4$i;$t$411$i = $340;$v$413$i = $t$4$v$4$i;
        label = 90;
        continue;
       }
       $342 = ((($t$411$i)) + 20|0);
       $343 = HEAP32[$342>>2]|0;
       $344 = ($343|0)==(0|0);
       if ($344) {
        $rsize$4$lcssa$i = $$rsize$4$i;$v$4$lcssa$i = $t$4$v$4$i;
        break;
       } else {
        $rsize$412$i = $$rsize$4$i;$t$411$i = $343;$v$413$i = $t$4$v$4$i;
        label = 90;
       }
      }
     }
     $345 = ($v$4$lcssa$i|0)==(0|0);
     if ($345) {
      $nb$0 = $248;
     } else {
      $346 = HEAP32[(29704)>>2]|0;
      $347 = (($346) - ($248))|0;
      $348 = ($rsize$4$lcssa$i>>>0)<($347>>>0);
      if ($348) {
       $349 = HEAP32[(29712)>>2]|0;
       $350 = ($v$4$lcssa$i>>>0)<($349>>>0);
       if ($350) {
        _abort();
        // unreachable;
       }
       $351 = (($v$4$lcssa$i) + ($248)|0);
       $352 = ($v$4$lcssa$i>>>0)<($351>>>0);
       if (!($352)) {
        _abort();
        // unreachable;
       }
       $353 = ((($v$4$lcssa$i)) + 24|0);
       $354 = HEAP32[$353>>2]|0;
       $355 = ((($v$4$lcssa$i)) + 12|0);
       $356 = HEAP32[$355>>2]|0;
       $357 = ($356|0)==($v$4$lcssa$i|0);
       do {
        if ($357) {
         $367 = ((($v$4$lcssa$i)) + 20|0);
         $368 = HEAP32[$367>>2]|0;
         $369 = ($368|0)==(0|0);
         if ($369) {
          $370 = ((($v$4$lcssa$i)) + 16|0);
          $371 = HEAP32[$370>>2]|0;
          $372 = ($371|0)==(0|0);
          if ($372) {
           $R$3$i11 = 0;
           break;
          } else {
           $R$1$i9 = $371;$RP$1$i8 = $370;
          }
         } else {
          $R$1$i9 = $368;$RP$1$i8 = $367;
         }
         while(1) {
          $373 = ((($R$1$i9)) + 20|0);
          $374 = HEAP32[$373>>2]|0;
          $375 = ($374|0)==(0|0);
          if (!($375)) {
           $R$1$i9 = $374;$RP$1$i8 = $373;
           continue;
          }
          $376 = ((($R$1$i9)) + 16|0);
          $377 = HEAP32[$376>>2]|0;
          $378 = ($377|0)==(0|0);
          if ($378) {
           $R$1$i9$lcssa = $R$1$i9;$RP$1$i8$lcssa = $RP$1$i8;
           break;
          } else {
           $R$1$i9 = $377;$RP$1$i8 = $376;
          }
         }
         $379 = ($RP$1$i8$lcssa>>>0)<($349>>>0);
         if ($379) {
          _abort();
          // unreachable;
         } else {
          HEAP32[$RP$1$i8$lcssa>>2] = 0;
          $R$3$i11 = $R$1$i9$lcssa;
          break;
         }
        } else {
         $358 = ((($v$4$lcssa$i)) + 8|0);
         $359 = HEAP32[$358>>2]|0;
         $360 = ($359>>>0)<($349>>>0);
         if ($360) {
          _abort();
          // unreachable;
         }
         $361 = ((($359)) + 12|0);
         $362 = HEAP32[$361>>2]|0;
         $363 = ($362|0)==($v$4$lcssa$i|0);
         if (!($363)) {
          _abort();
          // unreachable;
         }
         $364 = ((($356)) + 8|0);
         $365 = HEAP32[$364>>2]|0;
         $366 = ($365|0)==($v$4$lcssa$i|0);
         if ($366) {
          HEAP32[$361>>2] = $356;
          HEAP32[$364>>2] = $359;
          $R$3$i11 = $356;
          break;
         } else {
          _abort();
          // unreachable;
         }
        }
       } while(0);
       $380 = ($354|0)==(0|0);
       do {
        if (!($380)) {
         $381 = ((($v$4$lcssa$i)) + 28|0);
         $382 = HEAP32[$381>>2]|0;
         $383 = (30000 + ($382<<2)|0);
         $384 = HEAP32[$383>>2]|0;
         $385 = ($v$4$lcssa$i|0)==($384|0);
         if ($385) {
          HEAP32[$383>>2] = $R$3$i11;
          $cond$i12 = ($R$3$i11|0)==(0|0);
          if ($cond$i12) {
           $386 = 1 << $382;
           $387 = $386 ^ -1;
           $388 = HEAP32[(29700)>>2]|0;
           $389 = $388 & $387;
           HEAP32[(29700)>>2] = $389;
           break;
          }
         } else {
          $390 = HEAP32[(29712)>>2]|0;
          $391 = ($354>>>0)<($390>>>0);
          if ($391) {
           _abort();
           // unreachable;
          }
          $392 = ((($354)) + 16|0);
          $393 = HEAP32[$392>>2]|0;
          $394 = ($393|0)==($v$4$lcssa$i|0);
          if ($394) {
           HEAP32[$392>>2] = $R$3$i11;
          } else {
           $395 = ((($354)) + 20|0);
           HEAP32[$395>>2] = $R$3$i11;
          }
          $396 = ($R$3$i11|0)==(0|0);
          if ($396) {
           break;
          }
         }
         $397 = HEAP32[(29712)>>2]|0;
         $398 = ($R$3$i11>>>0)<($397>>>0);
         if ($398) {
          _abort();
          // unreachable;
         }
         $399 = ((($R$3$i11)) + 24|0);
         HEAP32[$399>>2] = $354;
         $400 = ((($v$4$lcssa$i)) + 16|0);
         $401 = HEAP32[$400>>2]|0;
         $402 = ($401|0)==(0|0);
         do {
          if (!($402)) {
           $403 = ($401>>>0)<($397>>>0);
           if ($403) {
            _abort();
            // unreachable;
           } else {
            $404 = ((($R$3$i11)) + 16|0);
            HEAP32[$404>>2] = $401;
            $405 = ((($401)) + 24|0);
            HEAP32[$405>>2] = $R$3$i11;
            break;
           }
          }
         } while(0);
         $406 = ((($v$4$lcssa$i)) + 20|0);
         $407 = HEAP32[$406>>2]|0;
         $408 = ($407|0)==(0|0);
         if (!($408)) {
          $409 = HEAP32[(29712)>>2]|0;
          $410 = ($407>>>0)<($409>>>0);
          if ($410) {
           _abort();
           // unreachable;
          } else {
           $411 = ((($R$3$i11)) + 20|0);
           HEAP32[$411>>2] = $407;
           $412 = ((($407)) + 24|0);
           HEAP32[$412>>2] = $R$3$i11;
           break;
          }
         }
        }
       } while(0);
       $413 = ($rsize$4$lcssa$i>>>0)<(16);
       do {
        if ($413) {
         $414 = (($rsize$4$lcssa$i) + ($248))|0;
         $415 = $414 | 3;
         $416 = ((($v$4$lcssa$i)) + 4|0);
         HEAP32[$416>>2] = $415;
         $417 = (($v$4$lcssa$i) + ($414)|0);
         $418 = ((($417)) + 4|0);
         $419 = HEAP32[$418>>2]|0;
         $420 = $419 | 1;
         HEAP32[$418>>2] = $420;
        } else {
         $421 = $248 | 3;
         $422 = ((($v$4$lcssa$i)) + 4|0);
         HEAP32[$422>>2] = $421;
         $423 = $rsize$4$lcssa$i | 1;
         $424 = ((($351)) + 4|0);
         HEAP32[$424>>2] = $423;
         $425 = (($351) + ($rsize$4$lcssa$i)|0);
         HEAP32[$425>>2] = $rsize$4$lcssa$i;
         $426 = $rsize$4$lcssa$i >>> 3;
         $427 = ($rsize$4$lcssa$i>>>0)<(256);
         if ($427) {
          $428 = $426 << 1;
          $429 = (29736 + ($428<<2)|0);
          $430 = HEAP32[7424]|0;
          $431 = 1 << $426;
          $432 = $430 & $431;
          $433 = ($432|0)==(0);
          if ($433) {
           $434 = $430 | $431;
           HEAP32[7424] = $434;
           $$pre$i13 = ((($429)) + 8|0);
           $$pre$phi$i14Z2D = $$pre$i13;$F5$0$i = $429;
          } else {
           $435 = ((($429)) + 8|0);
           $436 = HEAP32[$435>>2]|0;
           $437 = HEAP32[(29712)>>2]|0;
           $438 = ($436>>>0)<($437>>>0);
           if ($438) {
            _abort();
            // unreachable;
           } else {
            $$pre$phi$i14Z2D = $435;$F5$0$i = $436;
           }
          }
          HEAP32[$$pre$phi$i14Z2D>>2] = $351;
          $439 = ((($F5$0$i)) + 12|0);
          HEAP32[$439>>2] = $351;
          $440 = ((($351)) + 8|0);
          HEAP32[$440>>2] = $F5$0$i;
          $441 = ((($351)) + 12|0);
          HEAP32[$441>>2] = $429;
          break;
         }
         $442 = $rsize$4$lcssa$i >>> 8;
         $443 = ($442|0)==(0);
         if ($443) {
          $I7$0$i = 0;
         } else {
          $444 = ($rsize$4$lcssa$i>>>0)>(16777215);
          if ($444) {
           $I7$0$i = 31;
          } else {
           $445 = (($442) + 1048320)|0;
           $446 = $445 >>> 16;
           $447 = $446 & 8;
           $448 = $442 << $447;
           $449 = (($448) + 520192)|0;
           $450 = $449 >>> 16;
           $451 = $450 & 4;
           $452 = $451 | $447;
           $453 = $448 << $451;
           $454 = (($453) + 245760)|0;
           $455 = $454 >>> 16;
           $456 = $455 & 2;
           $457 = $452 | $456;
           $458 = (14 - ($457))|0;
           $459 = $453 << $456;
           $460 = $459 >>> 15;
           $461 = (($458) + ($460))|0;
           $462 = $461 << 1;
           $463 = (($461) + 7)|0;
           $464 = $rsize$4$lcssa$i >>> $463;
           $465 = $464 & 1;
           $466 = $465 | $462;
           $I7$0$i = $466;
          }
         }
         $467 = (30000 + ($I7$0$i<<2)|0);
         $468 = ((($351)) + 28|0);
         HEAP32[$468>>2] = $I7$0$i;
         $469 = ((($351)) + 16|0);
         $470 = ((($469)) + 4|0);
         HEAP32[$470>>2] = 0;
         HEAP32[$469>>2] = 0;
         $471 = HEAP32[(29700)>>2]|0;
         $472 = 1 << $I7$0$i;
         $473 = $471 & $472;
         $474 = ($473|0)==(0);
         if ($474) {
          $475 = $471 | $472;
          HEAP32[(29700)>>2] = $475;
          HEAP32[$467>>2] = $351;
          $476 = ((($351)) + 24|0);
          HEAP32[$476>>2] = $467;
          $477 = ((($351)) + 12|0);
          HEAP32[$477>>2] = $351;
          $478 = ((($351)) + 8|0);
          HEAP32[$478>>2] = $351;
          break;
         }
         $479 = HEAP32[$467>>2]|0;
         $480 = ($I7$0$i|0)==(31);
         $481 = $I7$0$i >>> 1;
         $482 = (25 - ($481))|0;
         $483 = $480 ? 0 : $482;
         $484 = $rsize$4$lcssa$i << $483;
         $K12$0$i = $484;$T$0$i = $479;
         while(1) {
          $485 = ((($T$0$i)) + 4|0);
          $486 = HEAP32[$485>>2]|0;
          $487 = $486 & -8;
          $488 = ($487|0)==($rsize$4$lcssa$i|0);
          if ($488) {
           $T$0$i$lcssa = $T$0$i;
           label = 148;
           break;
          }
          $489 = $K12$0$i >>> 31;
          $490 = (((($T$0$i)) + 16|0) + ($489<<2)|0);
          $491 = $K12$0$i << 1;
          $492 = HEAP32[$490>>2]|0;
          $493 = ($492|0)==(0|0);
          if ($493) {
           $$lcssa157 = $490;$T$0$i$lcssa156 = $T$0$i;
           label = 145;
           break;
          } else {
           $K12$0$i = $491;$T$0$i = $492;
          }
         }
         if ((label|0) == 145) {
          $494 = HEAP32[(29712)>>2]|0;
          $495 = ($$lcssa157>>>0)<($494>>>0);
          if ($495) {
           _abort();
           // unreachable;
          } else {
           HEAP32[$$lcssa157>>2] = $351;
           $496 = ((($351)) + 24|0);
           HEAP32[$496>>2] = $T$0$i$lcssa156;
           $497 = ((($351)) + 12|0);
           HEAP32[$497>>2] = $351;
           $498 = ((($351)) + 8|0);
           HEAP32[$498>>2] = $351;
           break;
          }
         }
         else if ((label|0) == 148) {
          $499 = ((($T$0$i$lcssa)) + 8|0);
          $500 = HEAP32[$499>>2]|0;
          $501 = HEAP32[(29712)>>2]|0;
          $502 = ($500>>>0)>=($501>>>0);
          $not$7$i = ($T$0$i$lcssa>>>0)>=($501>>>0);
          $503 = $502 & $not$7$i;
          if ($503) {
           $504 = ((($500)) + 12|0);
           HEAP32[$504>>2] = $351;
           HEAP32[$499>>2] = $351;
           $505 = ((($351)) + 8|0);
           HEAP32[$505>>2] = $500;
           $506 = ((($351)) + 12|0);
           HEAP32[$506>>2] = $T$0$i$lcssa;
           $507 = ((($351)) + 24|0);
           HEAP32[$507>>2] = 0;
           break;
          } else {
           _abort();
           // unreachable;
          }
         }
        }
       } while(0);
       $508 = ((($v$4$lcssa$i)) + 8|0);
       $$0 = $508;
       STACKTOP = sp;return ($$0|0);
      } else {
       $nb$0 = $248;
      }
     }
    }
   }
  }
 } while(0);
 $509 = HEAP32[(29704)>>2]|0;
 $510 = ($509>>>0)<($nb$0>>>0);
 if (!($510)) {
  $511 = (($509) - ($nb$0))|0;
  $512 = HEAP32[(29716)>>2]|0;
  $513 = ($511>>>0)>(15);
  if ($513) {
   $514 = (($512) + ($nb$0)|0);
   HEAP32[(29716)>>2] = $514;
   HEAP32[(29704)>>2] = $511;
   $515 = $511 | 1;
   $516 = ((($514)) + 4|0);
   HEAP32[$516>>2] = $515;
   $517 = (($514) + ($511)|0);
   HEAP32[$517>>2] = $511;
   $518 = $nb$0 | 3;
   $519 = ((($512)) + 4|0);
   HEAP32[$519>>2] = $518;
  } else {
   HEAP32[(29704)>>2] = 0;
   HEAP32[(29716)>>2] = 0;
   $520 = $509 | 3;
   $521 = ((($512)) + 4|0);
   HEAP32[$521>>2] = $520;
   $522 = (($512) + ($509)|0);
   $523 = ((($522)) + 4|0);
   $524 = HEAP32[$523>>2]|0;
   $525 = $524 | 1;
   HEAP32[$523>>2] = $525;
  }
  $526 = ((($512)) + 8|0);
  $$0 = $526;
  STACKTOP = sp;return ($$0|0);
 }
 $527 = HEAP32[(29708)>>2]|0;
 $528 = ($527>>>0)>($nb$0>>>0);
 if ($528) {
  $529 = (($527) - ($nb$0))|0;
  HEAP32[(29708)>>2] = $529;
  $530 = HEAP32[(29720)>>2]|0;
  $531 = (($530) + ($nb$0)|0);
  HEAP32[(29720)>>2] = $531;
  $532 = $529 | 1;
  $533 = ((($531)) + 4|0);
  HEAP32[$533>>2] = $532;
  $534 = $nb$0 | 3;
  $535 = ((($530)) + 4|0);
  HEAP32[$535>>2] = $534;
  $536 = ((($530)) + 8|0);
  $$0 = $536;
  STACKTOP = sp;return ($$0|0);
 }
 $537 = HEAP32[7542]|0;
 $538 = ($537|0)==(0);
 if ($538) {
  HEAP32[(30176)>>2] = 4096;
  HEAP32[(30172)>>2] = 4096;
  HEAP32[(30180)>>2] = -1;
  HEAP32[(30184)>>2] = -1;
  HEAP32[(30188)>>2] = 0;
  HEAP32[(30140)>>2] = 0;
  $539 = $magic$i$i;
  $540 = $539 & -16;
  $541 = $540 ^ 1431655768;
  HEAP32[$magic$i$i>>2] = $541;
  HEAP32[7542] = $541;
 }
 $542 = (($nb$0) + 48)|0;
 $543 = HEAP32[(30176)>>2]|0;
 $544 = (($nb$0) + 47)|0;
 $545 = (($543) + ($544))|0;
 $546 = (0 - ($543))|0;
 $547 = $545 & $546;
 $548 = ($547>>>0)>($nb$0>>>0);
 if (!($548)) {
  $$0 = 0;
  STACKTOP = sp;return ($$0|0);
 }
 $549 = HEAP32[(30136)>>2]|0;
 $550 = ($549|0)==(0);
 if (!($550)) {
  $551 = HEAP32[(30128)>>2]|0;
  $552 = (($551) + ($547))|0;
  $553 = ($552>>>0)<=($551>>>0);
  $554 = ($552>>>0)>($549>>>0);
  $or$cond1$i16 = $553 | $554;
  if ($or$cond1$i16) {
   $$0 = 0;
   STACKTOP = sp;return ($$0|0);
  }
 }
 $555 = HEAP32[(30140)>>2]|0;
 $556 = $555 & 4;
 $557 = ($556|0)==(0);
 L254: do {
  if ($557) {
   $558 = HEAP32[(29720)>>2]|0;
   $559 = ($558|0)==(0|0);
   L256: do {
    if ($559) {
     label = 171;
    } else {
     $sp$0$i$i = (30144);
     while(1) {
      $560 = HEAP32[$sp$0$i$i>>2]|0;
      $561 = ($560>>>0)>($558>>>0);
      if (!($561)) {
       $562 = ((($sp$0$i$i)) + 4|0);
       $563 = HEAP32[$562>>2]|0;
       $564 = (($560) + ($563)|0);
       $565 = ($564>>>0)>($558>>>0);
       if ($565) {
        $$lcssa153 = $sp$0$i$i;$$lcssa155 = $562;
        break;
       }
      }
      $566 = ((($sp$0$i$i)) + 8|0);
      $567 = HEAP32[$566>>2]|0;
      $568 = ($567|0)==(0|0);
      if ($568) {
       label = 171;
       break L256;
      } else {
       $sp$0$i$i = $567;
      }
     }
     $591 = HEAP32[(29708)>>2]|0;
     $592 = (($545) - ($591))|0;
     $593 = $592 & $546;
     $594 = ($593>>>0)<(2147483647);
     if ($594) {
      $595 = (_sbrk(($593|0))|0);
      $596 = HEAP32[$$lcssa153>>2]|0;
      $597 = HEAP32[$$lcssa155>>2]|0;
      $598 = (($596) + ($597)|0);
      $599 = ($595|0)==($598|0);
      if ($599) {
       $600 = ($595|0)==((-1)|0);
       if (!($600)) {
        $tbase$746$i = $595;$tsize$745$i = $593;
        label = 191;
        break L254;
       }
      } else {
       $br$2$ph$i = $595;$ssize$2$ph$i = $593;
       label = 181;
      }
     }
    }
   } while(0);
   do {
    if ((label|0) == 171) {
     $569 = (_sbrk(0)|0);
     $570 = ($569|0)==((-1)|0);
     if (!($570)) {
      $571 = $569;
      $572 = HEAP32[(30172)>>2]|0;
      $573 = (($572) + -1)|0;
      $574 = $573 & $571;
      $575 = ($574|0)==(0);
      if ($575) {
       $ssize$0$i = $547;
      } else {
       $576 = (($573) + ($571))|0;
       $577 = (0 - ($572))|0;
       $578 = $576 & $577;
       $579 = (($547) - ($571))|0;
       $580 = (($579) + ($578))|0;
       $ssize$0$i = $580;
      }
      $581 = HEAP32[(30128)>>2]|0;
      $582 = (($581) + ($ssize$0$i))|0;
      $583 = ($ssize$0$i>>>0)>($nb$0>>>0);
      $584 = ($ssize$0$i>>>0)<(2147483647);
      $or$cond$i17 = $583 & $584;
      if ($or$cond$i17) {
       $585 = HEAP32[(30136)>>2]|0;
       $586 = ($585|0)==(0);
       if (!($586)) {
        $587 = ($582>>>0)<=($581>>>0);
        $588 = ($582>>>0)>($585>>>0);
        $or$cond2$i = $587 | $588;
        if ($or$cond2$i) {
         break;
        }
       }
       $589 = (_sbrk(($ssize$0$i|0))|0);
       $590 = ($589|0)==($569|0);
       if ($590) {
        $tbase$746$i = $569;$tsize$745$i = $ssize$0$i;
        label = 191;
        break L254;
       } else {
        $br$2$ph$i = $589;$ssize$2$ph$i = $ssize$0$i;
        label = 181;
       }
      }
     }
    }
   } while(0);
   L276: do {
    if ((label|0) == 181) {
     $601 = (0 - ($ssize$2$ph$i))|0;
     $602 = ($br$2$ph$i|0)!=((-1)|0);
     $603 = ($ssize$2$ph$i>>>0)<(2147483647);
     $or$cond7$i = $603 & $602;
     $604 = ($542>>>0)>($ssize$2$ph$i>>>0);
     $or$cond8$i = $604 & $or$cond7$i;
     do {
      if ($or$cond8$i) {
       $605 = HEAP32[(30176)>>2]|0;
       $606 = (($544) - ($ssize$2$ph$i))|0;
       $607 = (($606) + ($605))|0;
       $608 = (0 - ($605))|0;
       $609 = $607 & $608;
       $610 = ($609>>>0)<(2147483647);
       if ($610) {
        $611 = (_sbrk(($609|0))|0);
        $612 = ($611|0)==((-1)|0);
        if ($612) {
         (_sbrk(($601|0))|0);
         break L276;
        } else {
         $613 = (($609) + ($ssize$2$ph$i))|0;
         $ssize$5$i = $613;
         break;
        }
       } else {
        $ssize$5$i = $ssize$2$ph$i;
       }
      } else {
       $ssize$5$i = $ssize$2$ph$i;
      }
     } while(0);
     $614 = ($br$2$ph$i|0)==((-1)|0);
     if (!($614)) {
      $tbase$746$i = $br$2$ph$i;$tsize$745$i = $ssize$5$i;
      label = 191;
      break L254;
     }
    }
   } while(0);
   $615 = HEAP32[(30140)>>2]|0;
   $616 = $615 | 4;
   HEAP32[(30140)>>2] = $616;
   label = 188;
  } else {
   label = 188;
  }
 } while(0);
 if ((label|0) == 188) {
  $617 = ($547>>>0)<(2147483647);
  if ($617) {
   $618 = (_sbrk(($547|0))|0);
   $619 = (_sbrk(0)|0);
   $620 = ($618|0)!=((-1)|0);
   $621 = ($619|0)!=((-1)|0);
   $or$cond5$i = $620 & $621;
   $622 = ($618>>>0)<($619>>>0);
   $or$cond10$i = $622 & $or$cond5$i;
   if ($or$cond10$i) {
    $623 = $619;
    $624 = $618;
    $625 = (($623) - ($624))|0;
    $626 = (($nb$0) + 40)|0;
    $$not$i = ($625>>>0)>($626>>>0);
    if ($$not$i) {
     $tbase$746$i = $618;$tsize$745$i = $625;
     label = 191;
    }
   }
  }
 }
 if ((label|0) == 191) {
  $627 = HEAP32[(30128)>>2]|0;
  $628 = (($627) + ($tsize$745$i))|0;
  HEAP32[(30128)>>2] = $628;
  $629 = HEAP32[(30132)>>2]|0;
  $630 = ($628>>>0)>($629>>>0);
  if ($630) {
   HEAP32[(30132)>>2] = $628;
  }
  $631 = HEAP32[(29720)>>2]|0;
  $632 = ($631|0)==(0|0);
  do {
   if ($632) {
    $633 = HEAP32[(29712)>>2]|0;
    $634 = ($633|0)==(0|0);
    $635 = ($tbase$746$i>>>0)<($633>>>0);
    $or$cond11$i = $634 | $635;
    if ($or$cond11$i) {
     HEAP32[(29712)>>2] = $tbase$746$i;
    }
    HEAP32[(30144)>>2] = $tbase$746$i;
    HEAP32[(30148)>>2] = $tsize$745$i;
    HEAP32[(30156)>>2] = 0;
    $636 = HEAP32[7542]|0;
    HEAP32[(29732)>>2] = $636;
    HEAP32[(29728)>>2] = -1;
    $i$01$i$i = 0;
    while(1) {
     $637 = $i$01$i$i << 1;
     $638 = (29736 + ($637<<2)|0);
     $639 = ((($638)) + 12|0);
     HEAP32[$639>>2] = $638;
     $640 = ((($638)) + 8|0);
     HEAP32[$640>>2] = $638;
     $641 = (($i$01$i$i) + 1)|0;
     $exitcond$i$i = ($641|0)==(32);
     if ($exitcond$i$i) {
      break;
     } else {
      $i$01$i$i = $641;
     }
    }
    $642 = (($tsize$745$i) + -40)|0;
    $643 = ((($tbase$746$i)) + 8|0);
    $644 = $643;
    $645 = $644 & 7;
    $646 = ($645|0)==(0);
    $647 = (0 - ($644))|0;
    $648 = $647 & 7;
    $649 = $646 ? 0 : $648;
    $650 = (($tbase$746$i) + ($649)|0);
    $651 = (($642) - ($649))|0;
    HEAP32[(29720)>>2] = $650;
    HEAP32[(29708)>>2] = $651;
    $652 = $651 | 1;
    $653 = ((($650)) + 4|0);
    HEAP32[$653>>2] = $652;
    $654 = (($650) + ($651)|0);
    $655 = ((($654)) + 4|0);
    HEAP32[$655>>2] = 40;
    $656 = HEAP32[(30184)>>2]|0;
    HEAP32[(29724)>>2] = $656;
   } else {
    $sp$068$i = (30144);
    while(1) {
     $657 = HEAP32[$sp$068$i>>2]|0;
     $658 = ((($sp$068$i)) + 4|0);
     $659 = HEAP32[$658>>2]|0;
     $660 = (($657) + ($659)|0);
     $661 = ($tbase$746$i|0)==($660|0);
     if ($661) {
      $$lcssa147 = $657;$$lcssa149 = $658;$$lcssa151 = $659;$sp$068$i$lcssa = $sp$068$i;
      label = 201;
      break;
     }
     $662 = ((($sp$068$i)) + 8|0);
     $663 = HEAP32[$662>>2]|0;
     $664 = ($663|0)==(0|0);
     if ($664) {
      break;
     } else {
      $sp$068$i = $663;
     }
    }
    if ((label|0) == 201) {
     $665 = ((($sp$068$i$lcssa)) + 12|0);
     $666 = HEAP32[$665>>2]|0;
     $667 = $666 & 8;
     $668 = ($667|0)==(0);
     if ($668) {
      $669 = ($631>>>0)>=($$lcssa147>>>0);
      $670 = ($631>>>0)<($tbase$746$i>>>0);
      $or$cond48$i = $670 & $669;
      if ($or$cond48$i) {
       $671 = (($$lcssa151) + ($tsize$745$i))|0;
       HEAP32[$$lcssa149>>2] = $671;
       $672 = HEAP32[(29708)>>2]|0;
       $673 = ((($631)) + 8|0);
       $674 = $673;
       $675 = $674 & 7;
       $676 = ($675|0)==(0);
       $677 = (0 - ($674))|0;
       $678 = $677 & 7;
       $679 = $676 ? 0 : $678;
       $680 = (($631) + ($679)|0);
       $681 = (($tsize$745$i) - ($679))|0;
       $682 = (($681) + ($672))|0;
       HEAP32[(29720)>>2] = $680;
       HEAP32[(29708)>>2] = $682;
       $683 = $682 | 1;
       $684 = ((($680)) + 4|0);
       HEAP32[$684>>2] = $683;
       $685 = (($680) + ($682)|0);
       $686 = ((($685)) + 4|0);
       HEAP32[$686>>2] = 40;
       $687 = HEAP32[(30184)>>2]|0;
       HEAP32[(29724)>>2] = $687;
       break;
      }
     }
    }
    $688 = HEAP32[(29712)>>2]|0;
    $689 = ($tbase$746$i>>>0)<($688>>>0);
    if ($689) {
     HEAP32[(29712)>>2] = $tbase$746$i;
     $753 = $tbase$746$i;
    } else {
     $753 = $688;
    }
    $690 = (($tbase$746$i) + ($tsize$745$i)|0);
    $sp$167$i = (30144);
    while(1) {
     $691 = HEAP32[$sp$167$i>>2]|0;
     $692 = ($691|0)==($690|0);
     if ($692) {
      $$lcssa144 = $sp$167$i;$sp$167$i$lcssa = $sp$167$i;
      label = 209;
      break;
     }
     $693 = ((($sp$167$i)) + 8|0);
     $694 = HEAP32[$693>>2]|0;
     $695 = ($694|0)==(0|0);
     if ($695) {
      $sp$0$i$i$i = (30144);
      break;
     } else {
      $sp$167$i = $694;
     }
    }
    if ((label|0) == 209) {
     $696 = ((($sp$167$i$lcssa)) + 12|0);
     $697 = HEAP32[$696>>2]|0;
     $698 = $697 & 8;
     $699 = ($698|0)==(0);
     if ($699) {
      HEAP32[$$lcssa144>>2] = $tbase$746$i;
      $700 = ((($sp$167$i$lcssa)) + 4|0);
      $701 = HEAP32[$700>>2]|0;
      $702 = (($701) + ($tsize$745$i))|0;
      HEAP32[$700>>2] = $702;
      $703 = ((($tbase$746$i)) + 8|0);
      $704 = $703;
      $705 = $704 & 7;
      $706 = ($705|0)==(0);
      $707 = (0 - ($704))|0;
      $708 = $707 & 7;
      $709 = $706 ? 0 : $708;
      $710 = (($tbase$746$i) + ($709)|0);
      $711 = ((($690)) + 8|0);
      $712 = $711;
      $713 = $712 & 7;
      $714 = ($713|0)==(0);
      $715 = (0 - ($712))|0;
      $716 = $715 & 7;
      $717 = $714 ? 0 : $716;
      $718 = (($690) + ($717)|0);
      $719 = $718;
      $720 = $710;
      $721 = (($719) - ($720))|0;
      $722 = (($710) + ($nb$0)|0);
      $723 = (($721) - ($nb$0))|0;
      $724 = $nb$0 | 3;
      $725 = ((($710)) + 4|0);
      HEAP32[$725>>2] = $724;
      $726 = ($718|0)==($631|0);
      do {
       if ($726) {
        $727 = HEAP32[(29708)>>2]|0;
        $728 = (($727) + ($723))|0;
        HEAP32[(29708)>>2] = $728;
        HEAP32[(29720)>>2] = $722;
        $729 = $728 | 1;
        $730 = ((($722)) + 4|0);
        HEAP32[$730>>2] = $729;
       } else {
        $731 = HEAP32[(29716)>>2]|0;
        $732 = ($718|0)==($731|0);
        if ($732) {
         $733 = HEAP32[(29704)>>2]|0;
         $734 = (($733) + ($723))|0;
         HEAP32[(29704)>>2] = $734;
         HEAP32[(29716)>>2] = $722;
         $735 = $734 | 1;
         $736 = ((($722)) + 4|0);
         HEAP32[$736>>2] = $735;
         $737 = (($722) + ($734)|0);
         HEAP32[$737>>2] = $734;
         break;
        }
        $738 = ((($718)) + 4|0);
        $739 = HEAP32[$738>>2]|0;
        $740 = $739 & 3;
        $741 = ($740|0)==(1);
        if ($741) {
         $742 = $739 & -8;
         $743 = $739 >>> 3;
         $744 = ($739>>>0)<(256);
         L328: do {
          if ($744) {
           $745 = ((($718)) + 8|0);
           $746 = HEAP32[$745>>2]|0;
           $747 = ((($718)) + 12|0);
           $748 = HEAP32[$747>>2]|0;
           $749 = $743 << 1;
           $750 = (29736 + ($749<<2)|0);
           $751 = ($746|0)==($750|0);
           do {
            if (!($751)) {
             $752 = ($746>>>0)<($753>>>0);
             if ($752) {
              _abort();
              // unreachable;
             }
             $754 = ((($746)) + 12|0);
             $755 = HEAP32[$754>>2]|0;
             $756 = ($755|0)==($718|0);
             if ($756) {
              break;
             }
             _abort();
             // unreachable;
            }
           } while(0);
           $757 = ($748|0)==($746|0);
           if ($757) {
            $758 = 1 << $743;
            $759 = $758 ^ -1;
            $760 = HEAP32[7424]|0;
            $761 = $760 & $759;
            HEAP32[7424] = $761;
            break;
           }
           $762 = ($748|0)==($750|0);
           do {
            if ($762) {
             $$pre9$i$i = ((($748)) + 8|0);
             $$pre$phi10$i$iZ2D = $$pre9$i$i;
            } else {
             $763 = ($748>>>0)<($753>>>0);
             if ($763) {
              _abort();
              // unreachable;
             }
             $764 = ((($748)) + 8|0);
             $765 = HEAP32[$764>>2]|0;
             $766 = ($765|0)==($718|0);
             if ($766) {
              $$pre$phi10$i$iZ2D = $764;
              break;
             }
             _abort();
             // unreachable;
            }
           } while(0);
           $767 = ((($746)) + 12|0);
           HEAP32[$767>>2] = $748;
           HEAP32[$$pre$phi10$i$iZ2D>>2] = $746;
          } else {
           $768 = ((($718)) + 24|0);
           $769 = HEAP32[$768>>2]|0;
           $770 = ((($718)) + 12|0);
           $771 = HEAP32[$770>>2]|0;
           $772 = ($771|0)==($718|0);
           do {
            if ($772) {
             $782 = ((($718)) + 16|0);
             $783 = ((($782)) + 4|0);
             $784 = HEAP32[$783>>2]|0;
             $785 = ($784|0)==(0|0);
             if ($785) {
              $786 = HEAP32[$782>>2]|0;
              $787 = ($786|0)==(0|0);
              if ($787) {
               $R$3$i$i = 0;
               break;
              } else {
               $R$1$i$i = $786;$RP$1$i$i = $782;
              }
             } else {
              $R$1$i$i = $784;$RP$1$i$i = $783;
             }
             while(1) {
              $788 = ((($R$1$i$i)) + 20|0);
              $789 = HEAP32[$788>>2]|0;
              $790 = ($789|0)==(0|0);
              if (!($790)) {
               $R$1$i$i = $789;$RP$1$i$i = $788;
               continue;
              }
              $791 = ((($R$1$i$i)) + 16|0);
              $792 = HEAP32[$791>>2]|0;
              $793 = ($792|0)==(0|0);
              if ($793) {
               $R$1$i$i$lcssa = $R$1$i$i;$RP$1$i$i$lcssa = $RP$1$i$i;
               break;
              } else {
               $R$1$i$i = $792;$RP$1$i$i = $791;
              }
             }
             $794 = ($RP$1$i$i$lcssa>>>0)<($753>>>0);
             if ($794) {
              _abort();
              // unreachable;
             } else {
              HEAP32[$RP$1$i$i$lcssa>>2] = 0;
              $R$3$i$i = $R$1$i$i$lcssa;
              break;
             }
            } else {
             $773 = ((($718)) + 8|0);
             $774 = HEAP32[$773>>2]|0;
             $775 = ($774>>>0)<($753>>>0);
             if ($775) {
              _abort();
              // unreachable;
             }
             $776 = ((($774)) + 12|0);
             $777 = HEAP32[$776>>2]|0;
             $778 = ($777|0)==($718|0);
             if (!($778)) {
              _abort();
              // unreachable;
             }
             $779 = ((($771)) + 8|0);
             $780 = HEAP32[$779>>2]|0;
             $781 = ($780|0)==($718|0);
             if ($781) {
              HEAP32[$776>>2] = $771;
              HEAP32[$779>>2] = $774;
              $R$3$i$i = $771;
              break;
             } else {
              _abort();
              // unreachable;
             }
            }
           } while(0);
           $795 = ($769|0)==(0|0);
           if ($795) {
            break;
           }
           $796 = ((($718)) + 28|0);
           $797 = HEAP32[$796>>2]|0;
           $798 = (30000 + ($797<<2)|0);
           $799 = HEAP32[$798>>2]|0;
           $800 = ($718|0)==($799|0);
           do {
            if ($800) {
             HEAP32[$798>>2] = $R$3$i$i;
             $cond$i$i = ($R$3$i$i|0)==(0|0);
             if (!($cond$i$i)) {
              break;
             }
             $801 = 1 << $797;
             $802 = $801 ^ -1;
             $803 = HEAP32[(29700)>>2]|0;
             $804 = $803 & $802;
             HEAP32[(29700)>>2] = $804;
             break L328;
            } else {
             $805 = HEAP32[(29712)>>2]|0;
             $806 = ($769>>>0)<($805>>>0);
             if ($806) {
              _abort();
              // unreachable;
             }
             $807 = ((($769)) + 16|0);
             $808 = HEAP32[$807>>2]|0;
             $809 = ($808|0)==($718|0);
             if ($809) {
              HEAP32[$807>>2] = $R$3$i$i;
             } else {
              $810 = ((($769)) + 20|0);
              HEAP32[$810>>2] = $R$3$i$i;
             }
             $811 = ($R$3$i$i|0)==(0|0);
             if ($811) {
              break L328;
             }
            }
           } while(0);
           $812 = HEAP32[(29712)>>2]|0;
           $813 = ($R$3$i$i>>>0)<($812>>>0);
           if ($813) {
            _abort();
            // unreachable;
           }
           $814 = ((($R$3$i$i)) + 24|0);
           HEAP32[$814>>2] = $769;
           $815 = ((($718)) + 16|0);
           $816 = HEAP32[$815>>2]|0;
           $817 = ($816|0)==(0|0);
           do {
            if (!($817)) {
             $818 = ($816>>>0)<($812>>>0);
             if ($818) {
              _abort();
              // unreachable;
             } else {
              $819 = ((($R$3$i$i)) + 16|0);
              HEAP32[$819>>2] = $816;
              $820 = ((($816)) + 24|0);
              HEAP32[$820>>2] = $R$3$i$i;
              break;
             }
            }
           } while(0);
           $821 = ((($815)) + 4|0);
           $822 = HEAP32[$821>>2]|0;
           $823 = ($822|0)==(0|0);
           if ($823) {
            break;
           }
           $824 = HEAP32[(29712)>>2]|0;
           $825 = ($822>>>0)<($824>>>0);
           if ($825) {
            _abort();
            // unreachable;
           } else {
            $826 = ((($R$3$i$i)) + 20|0);
            HEAP32[$826>>2] = $822;
            $827 = ((($822)) + 24|0);
            HEAP32[$827>>2] = $R$3$i$i;
            break;
           }
          }
         } while(0);
         $828 = (($718) + ($742)|0);
         $829 = (($742) + ($723))|0;
         $oldfirst$0$i$i = $828;$qsize$0$i$i = $829;
        } else {
         $oldfirst$0$i$i = $718;$qsize$0$i$i = $723;
        }
        $830 = ((($oldfirst$0$i$i)) + 4|0);
        $831 = HEAP32[$830>>2]|0;
        $832 = $831 & -2;
        HEAP32[$830>>2] = $832;
        $833 = $qsize$0$i$i | 1;
        $834 = ((($722)) + 4|0);
        HEAP32[$834>>2] = $833;
        $835 = (($722) + ($qsize$0$i$i)|0);
        HEAP32[$835>>2] = $qsize$0$i$i;
        $836 = $qsize$0$i$i >>> 3;
        $837 = ($qsize$0$i$i>>>0)<(256);
        if ($837) {
         $838 = $836 << 1;
         $839 = (29736 + ($838<<2)|0);
         $840 = HEAP32[7424]|0;
         $841 = 1 << $836;
         $842 = $840 & $841;
         $843 = ($842|0)==(0);
         do {
          if ($843) {
           $844 = $840 | $841;
           HEAP32[7424] = $844;
           $$pre$i16$i = ((($839)) + 8|0);
           $$pre$phi$i17$iZ2D = $$pre$i16$i;$F4$0$i$i = $839;
          } else {
           $845 = ((($839)) + 8|0);
           $846 = HEAP32[$845>>2]|0;
           $847 = HEAP32[(29712)>>2]|0;
           $848 = ($846>>>0)<($847>>>0);
           if (!($848)) {
            $$pre$phi$i17$iZ2D = $845;$F4$0$i$i = $846;
            break;
           }
           _abort();
           // unreachable;
          }
         } while(0);
         HEAP32[$$pre$phi$i17$iZ2D>>2] = $722;
         $849 = ((($F4$0$i$i)) + 12|0);
         HEAP32[$849>>2] = $722;
         $850 = ((($722)) + 8|0);
         HEAP32[$850>>2] = $F4$0$i$i;
         $851 = ((($722)) + 12|0);
         HEAP32[$851>>2] = $839;
         break;
        }
        $852 = $qsize$0$i$i >>> 8;
        $853 = ($852|0)==(0);
        do {
         if ($853) {
          $I7$0$i$i = 0;
         } else {
          $854 = ($qsize$0$i$i>>>0)>(16777215);
          if ($854) {
           $I7$0$i$i = 31;
           break;
          }
          $855 = (($852) + 1048320)|0;
          $856 = $855 >>> 16;
          $857 = $856 & 8;
          $858 = $852 << $857;
          $859 = (($858) + 520192)|0;
          $860 = $859 >>> 16;
          $861 = $860 & 4;
          $862 = $861 | $857;
          $863 = $858 << $861;
          $864 = (($863) + 245760)|0;
          $865 = $864 >>> 16;
          $866 = $865 & 2;
          $867 = $862 | $866;
          $868 = (14 - ($867))|0;
          $869 = $863 << $866;
          $870 = $869 >>> 15;
          $871 = (($868) + ($870))|0;
          $872 = $871 << 1;
          $873 = (($871) + 7)|0;
          $874 = $qsize$0$i$i >>> $873;
          $875 = $874 & 1;
          $876 = $875 | $872;
          $I7$0$i$i = $876;
         }
        } while(0);
        $877 = (30000 + ($I7$0$i$i<<2)|0);
        $878 = ((($722)) + 28|0);
        HEAP32[$878>>2] = $I7$0$i$i;
        $879 = ((($722)) + 16|0);
        $880 = ((($879)) + 4|0);
        HEAP32[$880>>2] = 0;
        HEAP32[$879>>2] = 0;
        $881 = HEAP32[(29700)>>2]|0;
        $882 = 1 << $I7$0$i$i;
        $883 = $881 & $882;
        $884 = ($883|0)==(0);
        if ($884) {
         $885 = $881 | $882;
         HEAP32[(29700)>>2] = $885;
         HEAP32[$877>>2] = $722;
         $886 = ((($722)) + 24|0);
         HEAP32[$886>>2] = $877;
         $887 = ((($722)) + 12|0);
         HEAP32[$887>>2] = $722;
         $888 = ((($722)) + 8|0);
         HEAP32[$888>>2] = $722;
         break;
        }
        $889 = HEAP32[$877>>2]|0;
        $890 = ($I7$0$i$i|0)==(31);
        $891 = $I7$0$i$i >>> 1;
        $892 = (25 - ($891))|0;
        $893 = $890 ? 0 : $892;
        $894 = $qsize$0$i$i << $893;
        $K8$0$i$i = $894;$T$0$i18$i = $889;
        while(1) {
         $895 = ((($T$0$i18$i)) + 4|0);
         $896 = HEAP32[$895>>2]|0;
         $897 = $896 & -8;
         $898 = ($897|0)==($qsize$0$i$i|0);
         if ($898) {
          $T$0$i18$i$lcssa = $T$0$i18$i;
          label = 279;
          break;
         }
         $899 = $K8$0$i$i >>> 31;
         $900 = (((($T$0$i18$i)) + 16|0) + ($899<<2)|0);
         $901 = $K8$0$i$i << 1;
         $902 = HEAP32[$900>>2]|0;
         $903 = ($902|0)==(0|0);
         if ($903) {
          $$lcssa = $900;$T$0$i18$i$lcssa139 = $T$0$i18$i;
          label = 276;
          break;
         } else {
          $K8$0$i$i = $901;$T$0$i18$i = $902;
         }
        }
        if ((label|0) == 276) {
         $904 = HEAP32[(29712)>>2]|0;
         $905 = ($$lcssa>>>0)<($904>>>0);
         if ($905) {
          _abort();
          // unreachable;
         } else {
          HEAP32[$$lcssa>>2] = $722;
          $906 = ((($722)) + 24|0);
          HEAP32[$906>>2] = $T$0$i18$i$lcssa139;
          $907 = ((($722)) + 12|0);
          HEAP32[$907>>2] = $722;
          $908 = ((($722)) + 8|0);
          HEAP32[$908>>2] = $722;
          break;
         }
        }
        else if ((label|0) == 279) {
         $909 = ((($T$0$i18$i$lcssa)) + 8|0);
         $910 = HEAP32[$909>>2]|0;
         $911 = HEAP32[(29712)>>2]|0;
         $912 = ($910>>>0)>=($911>>>0);
         $not$$i20$i = ($T$0$i18$i$lcssa>>>0)>=($911>>>0);
         $913 = $912 & $not$$i20$i;
         if ($913) {
          $914 = ((($910)) + 12|0);
          HEAP32[$914>>2] = $722;
          HEAP32[$909>>2] = $722;
          $915 = ((($722)) + 8|0);
          HEAP32[$915>>2] = $910;
          $916 = ((($722)) + 12|0);
          HEAP32[$916>>2] = $T$0$i18$i$lcssa;
          $917 = ((($722)) + 24|0);
          HEAP32[$917>>2] = 0;
          break;
         } else {
          _abort();
          // unreachable;
         }
        }
       }
      } while(0);
      $1048 = ((($710)) + 8|0);
      $$0 = $1048;
      STACKTOP = sp;return ($$0|0);
     } else {
      $sp$0$i$i$i = (30144);
     }
    }
    while(1) {
     $918 = HEAP32[$sp$0$i$i$i>>2]|0;
     $919 = ($918>>>0)>($631>>>0);
     if (!($919)) {
      $920 = ((($sp$0$i$i$i)) + 4|0);
      $921 = HEAP32[$920>>2]|0;
      $922 = (($918) + ($921)|0);
      $923 = ($922>>>0)>($631>>>0);
      if ($923) {
       $$lcssa142 = $922;
       break;
      }
     }
     $924 = ((($sp$0$i$i$i)) + 8|0);
     $925 = HEAP32[$924>>2]|0;
     $sp$0$i$i$i = $925;
    }
    $926 = ((($$lcssa142)) + -47|0);
    $927 = ((($926)) + 8|0);
    $928 = $927;
    $929 = $928 & 7;
    $930 = ($929|0)==(0);
    $931 = (0 - ($928))|0;
    $932 = $931 & 7;
    $933 = $930 ? 0 : $932;
    $934 = (($926) + ($933)|0);
    $935 = ((($631)) + 16|0);
    $936 = ($934>>>0)<($935>>>0);
    $937 = $936 ? $631 : $934;
    $938 = ((($937)) + 8|0);
    $939 = ((($937)) + 24|0);
    $940 = (($tsize$745$i) + -40)|0;
    $941 = ((($tbase$746$i)) + 8|0);
    $942 = $941;
    $943 = $942 & 7;
    $944 = ($943|0)==(0);
    $945 = (0 - ($942))|0;
    $946 = $945 & 7;
    $947 = $944 ? 0 : $946;
    $948 = (($tbase$746$i) + ($947)|0);
    $949 = (($940) - ($947))|0;
    HEAP32[(29720)>>2] = $948;
    HEAP32[(29708)>>2] = $949;
    $950 = $949 | 1;
    $951 = ((($948)) + 4|0);
    HEAP32[$951>>2] = $950;
    $952 = (($948) + ($949)|0);
    $953 = ((($952)) + 4|0);
    HEAP32[$953>>2] = 40;
    $954 = HEAP32[(30184)>>2]|0;
    HEAP32[(29724)>>2] = $954;
    $955 = ((($937)) + 4|0);
    HEAP32[$955>>2] = 27;
    ;HEAP32[$938>>2]=HEAP32[(30144)>>2]|0;HEAP32[$938+4>>2]=HEAP32[(30144)+4>>2]|0;HEAP32[$938+8>>2]=HEAP32[(30144)+8>>2]|0;HEAP32[$938+12>>2]=HEAP32[(30144)+12>>2]|0;
    HEAP32[(30144)>>2] = $tbase$746$i;
    HEAP32[(30148)>>2] = $tsize$745$i;
    HEAP32[(30156)>>2] = 0;
    HEAP32[(30152)>>2] = $938;
    $p$0$i$i = $939;
    while(1) {
     $956 = ((($p$0$i$i)) + 4|0);
     HEAP32[$956>>2] = 7;
     $957 = ((($956)) + 4|0);
     $958 = ($957>>>0)<($$lcssa142>>>0);
     if ($958) {
      $p$0$i$i = $956;
     } else {
      break;
     }
    }
    $959 = ($937|0)==($631|0);
    if (!($959)) {
     $960 = $937;
     $961 = $631;
     $962 = (($960) - ($961))|0;
     $963 = HEAP32[$955>>2]|0;
     $964 = $963 & -2;
     HEAP32[$955>>2] = $964;
     $965 = $962 | 1;
     $966 = ((($631)) + 4|0);
     HEAP32[$966>>2] = $965;
     HEAP32[$937>>2] = $962;
     $967 = $962 >>> 3;
     $968 = ($962>>>0)<(256);
     if ($968) {
      $969 = $967 << 1;
      $970 = (29736 + ($969<<2)|0);
      $971 = HEAP32[7424]|0;
      $972 = 1 << $967;
      $973 = $971 & $972;
      $974 = ($973|0)==(0);
      if ($974) {
       $975 = $971 | $972;
       HEAP32[7424] = $975;
       $$pre$i$i = ((($970)) + 8|0);
       $$pre$phi$i$iZ2D = $$pre$i$i;$F$0$i$i = $970;
      } else {
       $976 = ((($970)) + 8|0);
       $977 = HEAP32[$976>>2]|0;
       $978 = HEAP32[(29712)>>2]|0;
       $979 = ($977>>>0)<($978>>>0);
       if ($979) {
        _abort();
        // unreachable;
       } else {
        $$pre$phi$i$iZ2D = $976;$F$0$i$i = $977;
       }
      }
      HEAP32[$$pre$phi$i$iZ2D>>2] = $631;
      $980 = ((($F$0$i$i)) + 12|0);
      HEAP32[$980>>2] = $631;
      $981 = ((($631)) + 8|0);
      HEAP32[$981>>2] = $F$0$i$i;
      $982 = ((($631)) + 12|0);
      HEAP32[$982>>2] = $970;
      break;
     }
     $983 = $962 >>> 8;
     $984 = ($983|0)==(0);
     if ($984) {
      $I1$0$i$i = 0;
     } else {
      $985 = ($962>>>0)>(16777215);
      if ($985) {
       $I1$0$i$i = 31;
      } else {
       $986 = (($983) + 1048320)|0;
       $987 = $986 >>> 16;
       $988 = $987 & 8;
       $989 = $983 << $988;
       $990 = (($989) + 520192)|0;
       $991 = $990 >>> 16;
       $992 = $991 & 4;
       $993 = $992 | $988;
       $994 = $989 << $992;
       $995 = (($994) + 245760)|0;
       $996 = $995 >>> 16;
       $997 = $996 & 2;
       $998 = $993 | $997;
       $999 = (14 - ($998))|0;
       $1000 = $994 << $997;
       $1001 = $1000 >>> 15;
       $1002 = (($999) + ($1001))|0;
       $1003 = $1002 << 1;
       $1004 = (($1002) + 7)|0;
       $1005 = $962 >>> $1004;
       $1006 = $1005 & 1;
       $1007 = $1006 | $1003;
       $I1$0$i$i = $1007;
      }
     }
     $1008 = (30000 + ($I1$0$i$i<<2)|0);
     $1009 = ((($631)) + 28|0);
     HEAP32[$1009>>2] = $I1$0$i$i;
     $1010 = ((($631)) + 20|0);
     HEAP32[$1010>>2] = 0;
     HEAP32[$935>>2] = 0;
     $1011 = HEAP32[(29700)>>2]|0;
     $1012 = 1 << $I1$0$i$i;
     $1013 = $1011 & $1012;
     $1014 = ($1013|0)==(0);
     if ($1014) {
      $1015 = $1011 | $1012;
      HEAP32[(29700)>>2] = $1015;
      HEAP32[$1008>>2] = $631;
      $1016 = ((($631)) + 24|0);
      HEAP32[$1016>>2] = $1008;
      $1017 = ((($631)) + 12|0);
      HEAP32[$1017>>2] = $631;
      $1018 = ((($631)) + 8|0);
      HEAP32[$1018>>2] = $631;
      break;
     }
     $1019 = HEAP32[$1008>>2]|0;
     $1020 = ($I1$0$i$i|0)==(31);
     $1021 = $I1$0$i$i >>> 1;
     $1022 = (25 - ($1021))|0;
     $1023 = $1020 ? 0 : $1022;
     $1024 = $962 << $1023;
     $K2$0$i$i = $1024;$T$0$i$i = $1019;
     while(1) {
      $1025 = ((($T$0$i$i)) + 4|0);
      $1026 = HEAP32[$1025>>2]|0;
      $1027 = $1026 & -8;
      $1028 = ($1027|0)==($962|0);
      if ($1028) {
       $T$0$i$i$lcssa = $T$0$i$i;
       label = 305;
       break;
      }
      $1029 = $K2$0$i$i >>> 31;
      $1030 = (((($T$0$i$i)) + 16|0) + ($1029<<2)|0);
      $1031 = $K2$0$i$i << 1;
      $1032 = HEAP32[$1030>>2]|0;
      $1033 = ($1032|0)==(0|0);
      if ($1033) {
       $$lcssa141 = $1030;$T$0$i$i$lcssa140 = $T$0$i$i;
       label = 302;
       break;
      } else {
       $K2$0$i$i = $1031;$T$0$i$i = $1032;
      }
     }
     if ((label|0) == 302) {
      $1034 = HEAP32[(29712)>>2]|0;
      $1035 = ($$lcssa141>>>0)<($1034>>>0);
      if ($1035) {
       _abort();
       // unreachable;
      } else {
       HEAP32[$$lcssa141>>2] = $631;
       $1036 = ((($631)) + 24|0);
       HEAP32[$1036>>2] = $T$0$i$i$lcssa140;
       $1037 = ((($631)) + 12|0);
       HEAP32[$1037>>2] = $631;
       $1038 = ((($631)) + 8|0);
       HEAP32[$1038>>2] = $631;
       break;
      }
     }
     else if ((label|0) == 305) {
      $1039 = ((($T$0$i$i$lcssa)) + 8|0);
      $1040 = HEAP32[$1039>>2]|0;
      $1041 = HEAP32[(29712)>>2]|0;
      $1042 = ($1040>>>0)>=($1041>>>0);
      $not$$i$i = ($T$0$i$i$lcssa>>>0)>=($1041>>>0);
      $1043 = $1042 & $not$$i$i;
      if ($1043) {
       $1044 = ((($1040)) + 12|0);
       HEAP32[$1044>>2] = $631;
       HEAP32[$1039>>2] = $631;
       $1045 = ((($631)) + 8|0);
       HEAP32[$1045>>2] = $1040;
       $1046 = ((($631)) + 12|0);
       HEAP32[$1046>>2] = $T$0$i$i$lcssa;
       $1047 = ((($631)) + 24|0);
       HEAP32[$1047>>2] = 0;
       break;
      } else {
       _abort();
       // unreachable;
      }
     }
    }
   }
  } while(0);
  $1049 = HEAP32[(29708)>>2]|0;
  $1050 = ($1049>>>0)>($nb$0>>>0);
  if ($1050) {
   $1051 = (($1049) - ($nb$0))|0;
   HEAP32[(29708)>>2] = $1051;
   $1052 = HEAP32[(29720)>>2]|0;
   $1053 = (($1052) + ($nb$0)|0);
   HEAP32[(29720)>>2] = $1053;
   $1054 = $1051 | 1;
   $1055 = ((($1053)) + 4|0);
   HEAP32[$1055>>2] = $1054;
   $1056 = $nb$0 | 3;
   $1057 = ((($1052)) + 4|0);
   HEAP32[$1057>>2] = $1056;
   $1058 = ((($1052)) + 8|0);
   $$0 = $1058;
   STACKTOP = sp;return ($$0|0);
  }
 }
 $1059 = (___errno_location()|0);
 HEAP32[$1059>>2] = 12;
 $$0 = 0;
 STACKTOP = sp;return ($$0|0);
}
function _free($mem) {
 $mem = $mem|0;
 var $$lcssa = 0, $$pre = 0, $$pre$phi41Z2D = 0, $$pre$phi43Z2D = 0, $$pre$phiZ2D = 0, $$pre40 = 0, $$pre42 = 0, $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0;
 var $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0, $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0;
 var $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0, $134 = 0, $135 = 0, $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0;
 var $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0, $152 = 0, $153 = 0, $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0, $159 = 0, $16 = 0, $160 = 0, $161 = 0, $162 = 0, $163 = 0;
 var $164 = 0, $165 = 0, $166 = 0, $167 = 0, $168 = 0, $169 = 0, $17 = 0, $170 = 0, $171 = 0, $172 = 0, $173 = 0, $174 = 0, $175 = 0, $176 = 0, $177 = 0, $178 = 0, $179 = 0, $18 = 0, $180 = 0, $181 = 0;
 var $182 = 0, $183 = 0, $184 = 0, $185 = 0, $186 = 0, $187 = 0, $188 = 0, $189 = 0, $19 = 0, $190 = 0, $191 = 0, $192 = 0, $193 = 0, $194 = 0, $195 = 0, $196 = 0, $197 = 0, $198 = 0, $199 = 0, $2 = 0;
 var $20 = 0, $200 = 0, $201 = 0, $202 = 0, $203 = 0, $204 = 0, $205 = 0, $206 = 0, $207 = 0, $208 = 0, $209 = 0, $21 = 0, $210 = 0, $211 = 0, $212 = 0, $213 = 0, $214 = 0, $215 = 0, $216 = 0, $217 = 0;
 var $218 = 0, $219 = 0, $22 = 0, $220 = 0, $221 = 0, $222 = 0, $223 = 0, $224 = 0, $225 = 0, $226 = 0, $227 = 0, $228 = 0, $229 = 0, $23 = 0, $230 = 0, $231 = 0, $232 = 0, $233 = 0, $234 = 0, $235 = 0;
 var $236 = 0, $237 = 0, $238 = 0, $239 = 0, $24 = 0, $240 = 0, $241 = 0, $242 = 0, $243 = 0, $244 = 0, $245 = 0, $246 = 0, $247 = 0, $248 = 0, $249 = 0, $25 = 0, $250 = 0, $251 = 0, $252 = 0, $253 = 0;
 var $254 = 0, $255 = 0, $256 = 0, $257 = 0, $258 = 0, $259 = 0, $26 = 0, $260 = 0, $261 = 0, $262 = 0, $263 = 0, $264 = 0, $265 = 0, $266 = 0, $267 = 0, $268 = 0, $269 = 0, $27 = 0, $270 = 0, $271 = 0;
 var $272 = 0, $273 = 0, $274 = 0, $275 = 0, $276 = 0, $277 = 0, $278 = 0, $279 = 0, $28 = 0, $280 = 0, $281 = 0, $282 = 0, $283 = 0, $284 = 0, $285 = 0, $286 = 0, $287 = 0, $288 = 0, $289 = 0, $29 = 0;
 var $290 = 0, $291 = 0, $292 = 0, $293 = 0, $294 = 0, $295 = 0, $296 = 0, $297 = 0, $298 = 0, $299 = 0, $3 = 0, $30 = 0, $300 = 0, $301 = 0, $302 = 0, $303 = 0, $304 = 0, $305 = 0, $306 = 0, $307 = 0;
 var $308 = 0, $309 = 0, $31 = 0, $310 = 0, $311 = 0, $312 = 0, $313 = 0, $314 = 0, $315 = 0, $316 = 0, $317 = 0, $318 = 0, $319 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0;
 var $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0;
 var $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0;
 var $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0;
 var $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, $F18$0 = 0, $I20$0 = 0, $K21$0 = 0, $R$1 = 0, $R$1$lcssa = 0, $R$3 = 0, $R8$1 = 0, $R8$1$lcssa = 0, $R8$3 = 0, $RP$1 = 0, $RP$1$lcssa = 0, $RP10$1 = 0, $RP10$1$lcssa = 0;
 var $T$0 = 0, $T$0$lcssa = 0, $T$0$lcssa48 = 0, $cond20 = 0, $cond21 = 0, $not$ = 0, $p$1 = 0, $psize$1 = 0, $psize$2 = 0, $sp$0$i = 0, $sp$0$in$i = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ($mem|0)==(0|0);
 if ($0) {
  return;
 }
 $1 = ((($mem)) + -8|0);
 $2 = HEAP32[(29712)>>2]|0;
 $3 = ($1>>>0)<($2>>>0);
 if ($3) {
  _abort();
  // unreachable;
 }
 $4 = ((($mem)) + -4|0);
 $5 = HEAP32[$4>>2]|0;
 $6 = $5 & 3;
 $7 = ($6|0)==(1);
 if ($7) {
  _abort();
  // unreachable;
 }
 $8 = $5 & -8;
 $9 = (($1) + ($8)|0);
 $10 = $5 & 1;
 $11 = ($10|0)==(0);
 do {
  if ($11) {
   $12 = HEAP32[$1>>2]|0;
   $13 = ($6|0)==(0);
   if ($13) {
    return;
   }
   $14 = (0 - ($12))|0;
   $15 = (($1) + ($14)|0);
   $16 = (($12) + ($8))|0;
   $17 = ($15>>>0)<($2>>>0);
   if ($17) {
    _abort();
    // unreachable;
   }
   $18 = HEAP32[(29716)>>2]|0;
   $19 = ($15|0)==($18|0);
   if ($19) {
    $104 = ((($9)) + 4|0);
    $105 = HEAP32[$104>>2]|0;
    $106 = $105 & 3;
    $107 = ($106|0)==(3);
    if (!($107)) {
     $p$1 = $15;$psize$1 = $16;
     break;
    }
    HEAP32[(29704)>>2] = $16;
    $108 = $105 & -2;
    HEAP32[$104>>2] = $108;
    $109 = $16 | 1;
    $110 = ((($15)) + 4|0);
    HEAP32[$110>>2] = $109;
    $111 = (($15) + ($16)|0);
    HEAP32[$111>>2] = $16;
    return;
   }
   $20 = $12 >>> 3;
   $21 = ($12>>>0)<(256);
   if ($21) {
    $22 = ((($15)) + 8|0);
    $23 = HEAP32[$22>>2]|0;
    $24 = ((($15)) + 12|0);
    $25 = HEAP32[$24>>2]|0;
    $26 = $20 << 1;
    $27 = (29736 + ($26<<2)|0);
    $28 = ($23|0)==($27|0);
    if (!($28)) {
     $29 = ($23>>>0)<($2>>>0);
     if ($29) {
      _abort();
      // unreachable;
     }
     $30 = ((($23)) + 12|0);
     $31 = HEAP32[$30>>2]|0;
     $32 = ($31|0)==($15|0);
     if (!($32)) {
      _abort();
      // unreachable;
     }
    }
    $33 = ($25|0)==($23|0);
    if ($33) {
     $34 = 1 << $20;
     $35 = $34 ^ -1;
     $36 = HEAP32[7424]|0;
     $37 = $36 & $35;
     HEAP32[7424] = $37;
     $p$1 = $15;$psize$1 = $16;
     break;
    }
    $38 = ($25|0)==($27|0);
    if ($38) {
     $$pre42 = ((($25)) + 8|0);
     $$pre$phi43Z2D = $$pre42;
    } else {
     $39 = ($25>>>0)<($2>>>0);
     if ($39) {
      _abort();
      // unreachable;
     }
     $40 = ((($25)) + 8|0);
     $41 = HEAP32[$40>>2]|0;
     $42 = ($41|0)==($15|0);
     if ($42) {
      $$pre$phi43Z2D = $40;
     } else {
      _abort();
      // unreachable;
     }
    }
    $43 = ((($23)) + 12|0);
    HEAP32[$43>>2] = $25;
    HEAP32[$$pre$phi43Z2D>>2] = $23;
    $p$1 = $15;$psize$1 = $16;
    break;
   }
   $44 = ((($15)) + 24|0);
   $45 = HEAP32[$44>>2]|0;
   $46 = ((($15)) + 12|0);
   $47 = HEAP32[$46>>2]|0;
   $48 = ($47|0)==($15|0);
   do {
    if ($48) {
     $58 = ((($15)) + 16|0);
     $59 = ((($58)) + 4|0);
     $60 = HEAP32[$59>>2]|0;
     $61 = ($60|0)==(0|0);
     if ($61) {
      $62 = HEAP32[$58>>2]|0;
      $63 = ($62|0)==(0|0);
      if ($63) {
       $R$3 = 0;
       break;
      } else {
       $R$1 = $62;$RP$1 = $58;
      }
     } else {
      $R$1 = $60;$RP$1 = $59;
     }
     while(1) {
      $64 = ((($R$1)) + 20|0);
      $65 = HEAP32[$64>>2]|0;
      $66 = ($65|0)==(0|0);
      if (!($66)) {
       $R$1 = $65;$RP$1 = $64;
       continue;
      }
      $67 = ((($R$1)) + 16|0);
      $68 = HEAP32[$67>>2]|0;
      $69 = ($68|0)==(0|0);
      if ($69) {
       $R$1$lcssa = $R$1;$RP$1$lcssa = $RP$1;
       break;
      } else {
       $R$1 = $68;$RP$1 = $67;
      }
     }
     $70 = ($RP$1$lcssa>>>0)<($2>>>0);
     if ($70) {
      _abort();
      // unreachable;
     } else {
      HEAP32[$RP$1$lcssa>>2] = 0;
      $R$3 = $R$1$lcssa;
      break;
     }
    } else {
     $49 = ((($15)) + 8|0);
     $50 = HEAP32[$49>>2]|0;
     $51 = ($50>>>0)<($2>>>0);
     if ($51) {
      _abort();
      // unreachable;
     }
     $52 = ((($50)) + 12|0);
     $53 = HEAP32[$52>>2]|0;
     $54 = ($53|0)==($15|0);
     if (!($54)) {
      _abort();
      // unreachable;
     }
     $55 = ((($47)) + 8|0);
     $56 = HEAP32[$55>>2]|0;
     $57 = ($56|0)==($15|0);
     if ($57) {
      HEAP32[$52>>2] = $47;
      HEAP32[$55>>2] = $50;
      $R$3 = $47;
      break;
     } else {
      _abort();
      // unreachable;
     }
    }
   } while(0);
   $71 = ($45|0)==(0|0);
   if ($71) {
    $p$1 = $15;$psize$1 = $16;
   } else {
    $72 = ((($15)) + 28|0);
    $73 = HEAP32[$72>>2]|0;
    $74 = (30000 + ($73<<2)|0);
    $75 = HEAP32[$74>>2]|0;
    $76 = ($15|0)==($75|0);
    if ($76) {
     HEAP32[$74>>2] = $R$3;
     $cond20 = ($R$3|0)==(0|0);
     if ($cond20) {
      $77 = 1 << $73;
      $78 = $77 ^ -1;
      $79 = HEAP32[(29700)>>2]|0;
      $80 = $79 & $78;
      HEAP32[(29700)>>2] = $80;
      $p$1 = $15;$psize$1 = $16;
      break;
     }
    } else {
     $81 = HEAP32[(29712)>>2]|0;
     $82 = ($45>>>0)<($81>>>0);
     if ($82) {
      _abort();
      // unreachable;
     }
     $83 = ((($45)) + 16|0);
     $84 = HEAP32[$83>>2]|0;
     $85 = ($84|0)==($15|0);
     if ($85) {
      HEAP32[$83>>2] = $R$3;
     } else {
      $86 = ((($45)) + 20|0);
      HEAP32[$86>>2] = $R$3;
     }
     $87 = ($R$3|0)==(0|0);
     if ($87) {
      $p$1 = $15;$psize$1 = $16;
      break;
     }
    }
    $88 = HEAP32[(29712)>>2]|0;
    $89 = ($R$3>>>0)<($88>>>0);
    if ($89) {
     _abort();
     // unreachable;
    }
    $90 = ((($R$3)) + 24|0);
    HEAP32[$90>>2] = $45;
    $91 = ((($15)) + 16|0);
    $92 = HEAP32[$91>>2]|0;
    $93 = ($92|0)==(0|0);
    do {
     if (!($93)) {
      $94 = ($92>>>0)<($88>>>0);
      if ($94) {
       _abort();
       // unreachable;
      } else {
       $95 = ((($R$3)) + 16|0);
       HEAP32[$95>>2] = $92;
       $96 = ((($92)) + 24|0);
       HEAP32[$96>>2] = $R$3;
       break;
      }
     }
    } while(0);
    $97 = ((($91)) + 4|0);
    $98 = HEAP32[$97>>2]|0;
    $99 = ($98|0)==(0|0);
    if ($99) {
     $p$1 = $15;$psize$1 = $16;
    } else {
     $100 = HEAP32[(29712)>>2]|0;
     $101 = ($98>>>0)<($100>>>0);
     if ($101) {
      _abort();
      // unreachable;
     } else {
      $102 = ((($R$3)) + 20|0);
      HEAP32[$102>>2] = $98;
      $103 = ((($98)) + 24|0);
      HEAP32[$103>>2] = $R$3;
      $p$1 = $15;$psize$1 = $16;
      break;
     }
    }
   }
  } else {
   $p$1 = $1;$psize$1 = $8;
  }
 } while(0);
 $112 = ($p$1>>>0)<($9>>>0);
 if (!($112)) {
  _abort();
  // unreachable;
 }
 $113 = ((($9)) + 4|0);
 $114 = HEAP32[$113>>2]|0;
 $115 = $114 & 1;
 $116 = ($115|0)==(0);
 if ($116) {
  _abort();
  // unreachable;
 }
 $117 = $114 & 2;
 $118 = ($117|0)==(0);
 if ($118) {
  $119 = HEAP32[(29720)>>2]|0;
  $120 = ($9|0)==($119|0);
  if ($120) {
   $121 = HEAP32[(29708)>>2]|0;
   $122 = (($121) + ($psize$1))|0;
   HEAP32[(29708)>>2] = $122;
   HEAP32[(29720)>>2] = $p$1;
   $123 = $122 | 1;
   $124 = ((($p$1)) + 4|0);
   HEAP32[$124>>2] = $123;
   $125 = HEAP32[(29716)>>2]|0;
   $126 = ($p$1|0)==($125|0);
   if (!($126)) {
    return;
   }
   HEAP32[(29716)>>2] = 0;
   HEAP32[(29704)>>2] = 0;
   return;
  }
  $127 = HEAP32[(29716)>>2]|0;
  $128 = ($9|0)==($127|0);
  if ($128) {
   $129 = HEAP32[(29704)>>2]|0;
   $130 = (($129) + ($psize$1))|0;
   HEAP32[(29704)>>2] = $130;
   HEAP32[(29716)>>2] = $p$1;
   $131 = $130 | 1;
   $132 = ((($p$1)) + 4|0);
   HEAP32[$132>>2] = $131;
   $133 = (($p$1) + ($130)|0);
   HEAP32[$133>>2] = $130;
   return;
  }
  $134 = $114 & -8;
  $135 = (($134) + ($psize$1))|0;
  $136 = $114 >>> 3;
  $137 = ($114>>>0)<(256);
  do {
   if ($137) {
    $138 = ((($9)) + 8|0);
    $139 = HEAP32[$138>>2]|0;
    $140 = ((($9)) + 12|0);
    $141 = HEAP32[$140>>2]|0;
    $142 = $136 << 1;
    $143 = (29736 + ($142<<2)|0);
    $144 = ($139|0)==($143|0);
    if (!($144)) {
     $145 = HEAP32[(29712)>>2]|0;
     $146 = ($139>>>0)<($145>>>0);
     if ($146) {
      _abort();
      // unreachable;
     }
     $147 = ((($139)) + 12|0);
     $148 = HEAP32[$147>>2]|0;
     $149 = ($148|0)==($9|0);
     if (!($149)) {
      _abort();
      // unreachable;
     }
    }
    $150 = ($141|0)==($139|0);
    if ($150) {
     $151 = 1 << $136;
     $152 = $151 ^ -1;
     $153 = HEAP32[7424]|0;
     $154 = $153 & $152;
     HEAP32[7424] = $154;
     break;
    }
    $155 = ($141|0)==($143|0);
    if ($155) {
     $$pre40 = ((($141)) + 8|0);
     $$pre$phi41Z2D = $$pre40;
    } else {
     $156 = HEAP32[(29712)>>2]|0;
     $157 = ($141>>>0)<($156>>>0);
     if ($157) {
      _abort();
      // unreachable;
     }
     $158 = ((($141)) + 8|0);
     $159 = HEAP32[$158>>2]|0;
     $160 = ($159|0)==($9|0);
     if ($160) {
      $$pre$phi41Z2D = $158;
     } else {
      _abort();
      // unreachable;
     }
    }
    $161 = ((($139)) + 12|0);
    HEAP32[$161>>2] = $141;
    HEAP32[$$pre$phi41Z2D>>2] = $139;
   } else {
    $162 = ((($9)) + 24|0);
    $163 = HEAP32[$162>>2]|0;
    $164 = ((($9)) + 12|0);
    $165 = HEAP32[$164>>2]|0;
    $166 = ($165|0)==($9|0);
    do {
     if ($166) {
      $177 = ((($9)) + 16|0);
      $178 = ((($177)) + 4|0);
      $179 = HEAP32[$178>>2]|0;
      $180 = ($179|0)==(0|0);
      if ($180) {
       $181 = HEAP32[$177>>2]|0;
       $182 = ($181|0)==(0|0);
       if ($182) {
        $R8$3 = 0;
        break;
       } else {
        $R8$1 = $181;$RP10$1 = $177;
       }
      } else {
       $R8$1 = $179;$RP10$1 = $178;
      }
      while(1) {
       $183 = ((($R8$1)) + 20|0);
       $184 = HEAP32[$183>>2]|0;
       $185 = ($184|0)==(0|0);
       if (!($185)) {
        $R8$1 = $184;$RP10$1 = $183;
        continue;
       }
       $186 = ((($R8$1)) + 16|0);
       $187 = HEAP32[$186>>2]|0;
       $188 = ($187|0)==(0|0);
       if ($188) {
        $R8$1$lcssa = $R8$1;$RP10$1$lcssa = $RP10$1;
        break;
       } else {
        $R8$1 = $187;$RP10$1 = $186;
       }
      }
      $189 = HEAP32[(29712)>>2]|0;
      $190 = ($RP10$1$lcssa>>>0)<($189>>>0);
      if ($190) {
       _abort();
       // unreachable;
      } else {
       HEAP32[$RP10$1$lcssa>>2] = 0;
       $R8$3 = $R8$1$lcssa;
       break;
      }
     } else {
      $167 = ((($9)) + 8|0);
      $168 = HEAP32[$167>>2]|0;
      $169 = HEAP32[(29712)>>2]|0;
      $170 = ($168>>>0)<($169>>>0);
      if ($170) {
       _abort();
       // unreachable;
      }
      $171 = ((($168)) + 12|0);
      $172 = HEAP32[$171>>2]|0;
      $173 = ($172|0)==($9|0);
      if (!($173)) {
       _abort();
       // unreachable;
      }
      $174 = ((($165)) + 8|0);
      $175 = HEAP32[$174>>2]|0;
      $176 = ($175|0)==($9|0);
      if ($176) {
       HEAP32[$171>>2] = $165;
       HEAP32[$174>>2] = $168;
       $R8$3 = $165;
       break;
      } else {
       _abort();
       // unreachable;
      }
     }
    } while(0);
    $191 = ($163|0)==(0|0);
    if (!($191)) {
     $192 = ((($9)) + 28|0);
     $193 = HEAP32[$192>>2]|0;
     $194 = (30000 + ($193<<2)|0);
     $195 = HEAP32[$194>>2]|0;
     $196 = ($9|0)==($195|0);
     if ($196) {
      HEAP32[$194>>2] = $R8$3;
      $cond21 = ($R8$3|0)==(0|0);
      if ($cond21) {
       $197 = 1 << $193;
       $198 = $197 ^ -1;
       $199 = HEAP32[(29700)>>2]|0;
       $200 = $199 & $198;
       HEAP32[(29700)>>2] = $200;
       break;
      }
     } else {
      $201 = HEAP32[(29712)>>2]|0;
      $202 = ($163>>>0)<($201>>>0);
      if ($202) {
       _abort();
       // unreachable;
      }
      $203 = ((($163)) + 16|0);
      $204 = HEAP32[$203>>2]|0;
      $205 = ($204|0)==($9|0);
      if ($205) {
       HEAP32[$203>>2] = $R8$3;
      } else {
       $206 = ((($163)) + 20|0);
       HEAP32[$206>>2] = $R8$3;
      }
      $207 = ($R8$3|0)==(0|0);
      if ($207) {
       break;
      }
     }
     $208 = HEAP32[(29712)>>2]|0;
     $209 = ($R8$3>>>0)<($208>>>0);
     if ($209) {
      _abort();
      // unreachable;
     }
     $210 = ((($R8$3)) + 24|0);
     HEAP32[$210>>2] = $163;
     $211 = ((($9)) + 16|0);
     $212 = HEAP32[$211>>2]|0;
     $213 = ($212|0)==(0|0);
     do {
      if (!($213)) {
       $214 = ($212>>>0)<($208>>>0);
       if ($214) {
        _abort();
        // unreachable;
       } else {
        $215 = ((($R8$3)) + 16|0);
        HEAP32[$215>>2] = $212;
        $216 = ((($212)) + 24|0);
        HEAP32[$216>>2] = $R8$3;
        break;
       }
      }
     } while(0);
     $217 = ((($211)) + 4|0);
     $218 = HEAP32[$217>>2]|0;
     $219 = ($218|0)==(0|0);
     if (!($219)) {
      $220 = HEAP32[(29712)>>2]|0;
      $221 = ($218>>>0)<($220>>>0);
      if ($221) {
       _abort();
       // unreachable;
      } else {
       $222 = ((($R8$3)) + 20|0);
       HEAP32[$222>>2] = $218;
       $223 = ((($218)) + 24|0);
       HEAP32[$223>>2] = $R8$3;
       break;
      }
     }
    }
   }
  } while(0);
  $224 = $135 | 1;
  $225 = ((($p$1)) + 4|0);
  HEAP32[$225>>2] = $224;
  $226 = (($p$1) + ($135)|0);
  HEAP32[$226>>2] = $135;
  $227 = HEAP32[(29716)>>2]|0;
  $228 = ($p$1|0)==($227|0);
  if ($228) {
   HEAP32[(29704)>>2] = $135;
   return;
  } else {
   $psize$2 = $135;
  }
 } else {
  $229 = $114 & -2;
  HEAP32[$113>>2] = $229;
  $230 = $psize$1 | 1;
  $231 = ((($p$1)) + 4|0);
  HEAP32[$231>>2] = $230;
  $232 = (($p$1) + ($psize$1)|0);
  HEAP32[$232>>2] = $psize$1;
  $psize$2 = $psize$1;
 }
 $233 = $psize$2 >>> 3;
 $234 = ($psize$2>>>0)<(256);
 if ($234) {
  $235 = $233 << 1;
  $236 = (29736 + ($235<<2)|0);
  $237 = HEAP32[7424]|0;
  $238 = 1 << $233;
  $239 = $237 & $238;
  $240 = ($239|0)==(0);
  if ($240) {
   $241 = $237 | $238;
   HEAP32[7424] = $241;
   $$pre = ((($236)) + 8|0);
   $$pre$phiZ2D = $$pre;$F18$0 = $236;
  } else {
   $242 = ((($236)) + 8|0);
   $243 = HEAP32[$242>>2]|0;
   $244 = HEAP32[(29712)>>2]|0;
   $245 = ($243>>>0)<($244>>>0);
   if ($245) {
    _abort();
    // unreachable;
   } else {
    $$pre$phiZ2D = $242;$F18$0 = $243;
   }
  }
  HEAP32[$$pre$phiZ2D>>2] = $p$1;
  $246 = ((($F18$0)) + 12|0);
  HEAP32[$246>>2] = $p$1;
  $247 = ((($p$1)) + 8|0);
  HEAP32[$247>>2] = $F18$0;
  $248 = ((($p$1)) + 12|0);
  HEAP32[$248>>2] = $236;
  return;
 }
 $249 = $psize$2 >>> 8;
 $250 = ($249|0)==(0);
 if ($250) {
  $I20$0 = 0;
 } else {
  $251 = ($psize$2>>>0)>(16777215);
  if ($251) {
   $I20$0 = 31;
  } else {
   $252 = (($249) + 1048320)|0;
   $253 = $252 >>> 16;
   $254 = $253 & 8;
   $255 = $249 << $254;
   $256 = (($255) + 520192)|0;
   $257 = $256 >>> 16;
   $258 = $257 & 4;
   $259 = $258 | $254;
   $260 = $255 << $258;
   $261 = (($260) + 245760)|0;
   $262 = $261 >>> 16;
   $263 = $262 & 2;
   $264 = $259 | $263;
   $265 = (14 - ($264))|0;
   $266 = $260 << $263;
   $267 = $266 >>> 15;
   $268 = (($265) + ($267))|0;
   $269 = $268 << 1;
   $270 = (($268) + 7)|0;
   $271 = $psize$2 >>> $270;
   $272 = $271 & 1;
   $273 = $272 | $269;
   $I20$0 = $273;
  }
 }
 $274 = (30000 + ($I20$0<<2)|0);
 $275 = ((($p$1)) + 28|0);
 HEAP32[$275>>2] = $I20$0;
 $276 = ((($p$1)) + 16|0);
 $277 = ((($p$1)) + 20|0);
 HEAP32[$277>>2] = 0;
 HEAP32[$276>>2] = 0;
 $278 = HEAP32[(29700)>>2]|0;
 $279 = 1 << $I20$0;
 $280 = $278 & $279;
 $281 = ($280|0)==(0);
 do {
  if ($281) {
   $282 = $278 | $279;
   HEAP32[(29700)>>2] = $282;
   HEAP32[$274>>2] = $p$1;
   $283 = ((($p$1)) + 24|0);
   HEAP32[$283>>2] = $274;
   $284 = ((($p$1)) + 12|0);
   HEAP32[$284>>2] = $p$1;
   $285 = ((($p$1)) + 8|0);
   HEAP32[$285>>2] = $p$1;
  } else {
   $286 = HEAP32[$274>>2]|0;
   $287 = ($I20$0|0)==(31);
   $288 = $I20$0 >>> 1;
   $289 = (25 - ($288))|0;
   $290 = $287 ? 0 : $289;
   $291 = $psize$2 << $290;
   $K21$0 = $291;$T$0 = $286;
   while(1) {
    $292 = ((($T$0)) + 4|0);
    $293 = HEAP32[$292>>2]|0;
    $294 = $293 & -8;
    $295 = ($294|0)==($psize$2|0);
    if ($295) {
     $T$0$lcssa = $T$0;
     label = 130;
     break;
    }
    $296 = $K21$0 >>> 31;
    $297 = (((($T$0)) + 16|0) + ($296<<2)|0);
    $298 = $K21$0 << 1;
    $299 = HEAP32[$297>>2]|0;
    $300 = ($299|0)==(0|0);
    if ($300) {
     $$lcssa = $297;$T$0$lcssa48 = $T$0;
     label = 127;
     break;
    } else {
     $K21$0 = $298;$T$0 = $299;
    }
   }
   if ((label|0) == 127) {
    $301 = HEAP32[(29712)>>2]|0;
    $302 = ($$lcssa>>>0)<($301>>>0);
    if ($302) {
     _abort();
     // unreachable;
    } else {
     HEAP32[$$lcssa>>2] = $p$1;
     $303 = ((($p$1)) + 24|0);
     HEAP32[$303>>2] = $T$0$lcssa48;
     $304 = ((($p$1)) + 12|0);
     HEAP32[$304>>2] = $p$1;
     $305 = ((($p$1)) + 8|0);
     HEAP32[$305>>2] = $p$1;
     break;
    }
   }
   else if ((label|0) == 130) {
    $306 = ((($T$0$lcssa)) + 8|0);
    $307 = HEAP32[$306>>2]|0;
    $308 = HEAP32[(29712)>>2]|0;
    $309 = ($307>>>0)>=($308>>>0);
    $not$ = ($T$0$lcssa>>>0)>=($308>>>0);
    $310 = $309 & $not$;
    if ($310) {
     $311 = ((($307)) + 12|0);
     HEAP32[$311>>2] = $p$1;
     HEAP32[$306>>2] = $p$1;
     $312 = ((($p$1)) + 8|0);
     HEAP32[$312>>2] = $307;
     $313 = ((($p$1)) + 12|0);
     HEAP32[$313>>2] = $T$0$lcssa;
     $314 = ((($p$1)) + 24|0);
     HEAP32[$314>>2] = 0;
     break;
    } else {
     _abort();
     // unreachable;
    }
   }
  }
 } while(0);
 $315 = HEAP32[(29728)>>2]|0;
 $316 = (($315) + -1)|0;
 HEAP32[(29728)>>2] = $316;
 $317 = ($316|0)==(0);
 if ($317) {
  $sp$0$in$i = (30152);
 } else {
  return;
 }
 while(1) {
  $sp$0$i = HEAP32[$sp$0$in$i>>2]|0;
  $318 = ($sp$0$i|0)==(0|0);
  $319 = ((($sp$0$i)) + 8|0);
  if ($318) {
   break;
  } else {
   $sp$0$in$i = $319;
  }
 }
 HEAP32[(29728)>>2] = -1;
 return;
}
function runPostSets() {
}
function _i64Subtract(a, b, c, d) {
    a = a|0; b = b|0; c = c|0; d = d|0;
    var l = 0, h = 0;
    l = (a - c)>>>0;
    h = (b - d)>>>0;
    h = (b - d - (((c>>>0) > (a>>>0))|0))>>>0; // Borrow one from high word to low word on underflow.
    return ((tempRet0 = h,l|0)|0);
}
function _i64Add(a, b, c, d) {
    /*
      x = a + b*2^32
      y = c + d*2^32
      result = l + h*2^32
    */
    a = a|0; b = b|0; c = c|0; d = d|0;
    var l = 0, h = 0;
    l = (a + c)>>>0;
    h = (b + d + (((l>>>0) < (a>>>0))|0))>>>0; // Add carry from low word to high word on overflow.
    return ((tempRet0 = h,l|0)|0);
}
function _bitshift64Lshr(low, high, bits) {
    low = low|0; high = high|0; bits = bits|0;
    var ander = 0;
    if ((bits|0) < 32) {
      ander = ((1 << bits) - 1)|0;
      tempRet0 = high >>> bits;
      return (low >>> bits) | ((high&ander) << (32 - bits));
    }
    tempRet0 = 0;
    return (high >>> (bits - 32))|0;
}
function _memcpy(dest, src, num) {
    dest = dest|0; src = src|0; num = num|0;
    var ret = 0;
    if ((num|0) >= 4096) return _emscripten_memcpy_big(dest|0, src|0, num|0)|0;
    ret = dest|0;
    if ((dest&3) == (src&3)) {
      while (dest & 3) {
        if ((num|0) == 0) return ret|0;
        HEAP8[((dest)>>0)]=((HEAP8[((src)>>0)])|0);
        dest = (dest+1)|0;
        src = (src+1)|0;
        num = (num-1)|0;
      }
      while ((num|0) >= 4) {
        HEAP32[((dest)>>2)]=((HEAP32[((src)>>2)])|0);
        dest = (dest+4)|0;
        src = (src+4)|0;
        num = (num-4)|0;
      }
    }
    while ((num|0) > 0) {
      HEAP8[((dest)>>0)]=((HEAP8[((src)>>0)])|0);
      dest = (dest+1)|0;
      src = (src+1)|0;
      num = (num-1)|0;
    }
    return ret|0;
}
function _memset(ptr, value, num) {
    ptr = ptr|0; value = value|0; num = num|0;
    var stop = 0, value4 = 0, stop4 = 0, unaligned = 0;
    stop = (ptr + num)|0;
    if ((num|0) >= 20) {
      // This is unaligned, but quite large, so work hard to get to aligned settings
      value = value & 0xff;
      unaligned = ptr & 3;
      value4 = value | (value << 8) | (value << 16) | (value << 24);
      stop4 = stop & ~3;
      if (unaligned) {
        unaligned = (ptr + 4 - unaligned)|0;
        while ((ptr|0) < (unaligned|0)) { // no need to check for stop, since we have large num
          HEAP8[((ptr)>>0)]=value;
          ptr = (ptr+1)|0;
        }
      }
      while ((ptr|0) < (stop4|0)) {
        HEAP32[((ptr)>>2)]=value4;
        ptr = (ptr+4)|0;
      }
    }
    while ((ptr|0) < (stop|0)) {
      HEAP8[((ptr)>>0)]=value;
      ptr = (ptr+1)|0;
    }
    return (ptr-num)|0;
}
function _bitshift64Shl(low, high, bits) {
    low = low|0; high = high|0; bits = bits|0;
    var ander = 0;
    if ((bits|0) < 32) {
      ander = ((1 << bits) - 1)|0;
      tempRet0 = (high << bits) | ((low&(ander << (32 - bits))) >>> (32 - bits));
      return low << bits;
    }
    tempRet0 = low << (bits - 32);
    return 0;
}
function _pthread_self() {
    return 0;
}
function _bitshift64Ashr(low, high, bits) {
    low = low|0; high = high|0; bits = bits|0;
    var ander = 0;
    if ((bits|0) < 32) {
      ander = ((1 << bits) - 1)|0;
      tempRet0 = high >> bits;
      return (low >>> bits) | ((high&ander) << (32 - bits));
    }
    tempRet0 = (high|0) < 0 ? -1 : 0;
    return (high >> (bits - 32))|0;
  }
function _llvm_cttz_i32(x) {
    x = x|0;
    var ret = 0;
    ret = ((HEAP8[(((cttz_i8)+(x & 0xff))>>0)])|0);
    if ((ret|0) < 8) return ret|0;
    ret = ((HEAP8[(((cttz_i8)+((x >> 8)&0xff))>>0)])|0);
    if ((ret|0) < 8) return (ret + 8)|0;
    ret = ((HEAP8[(((cttz_i8)+((x >> 16)&0xff))>>0)])|0);
    if ((ret|0) < 8) return (ret + 16)|0;
    return (((HEAP8[(((cttz_i8)+(x >>> 24))>>0)])|0) + 24)|0;
  }

// ======== compiled code from system/lib/compiler-rt , see readme therein
function ___muldsi3($a, $b) {
  $a = $a | 0;
  $b = $b | 0;
  var $1 = 0, $2 = 0, $3 = 0, $6 = 0, $8 = 0, $11 = 0, $12 = 0;
  $1 = $a & 65535;
  $2 = $b & 65535;
  $3 = Math_imul($2, $1) | 0;
  $6 = $a >>> 16;
  $8 = ($3 >>> 16) + (Math_imul($2, $6) | 0) | 0;
  $11 = $b >>> 16;
  $12 = Math_imul($11, $1) | 0;
  return (tempRet0 = (($8 >>> 16) + (Math_imul($11, $6) | 0) | 0) + ((($8 & 65535) + $12 | 0) >>> 16) | 0, 0 | ($8 + $12 << 16 | $3 & 65535)) | 0;
}
function ___divdi3($a$0, $a$1, $b$0, $b$1) {
  $a$0 = $a$0 | 0;
  $a$1 = $a$1 | 0;
  $b$0 = $b$0 | 0;
  $b$1 = $b$1 | 0;
  var $1$0 = 0, $1$1 = 0, $2$0 = 0, $2$1 = 0, $4$0 = 0, $4$1 = 0, $6$0 = 0, $7$0 = 0, $7$1 = 0, $8$0 = 0, $10$0 = 0;
  $1$0 = $a$1 >> 31 | (($a$1 | 0) < 0 ? -1 : 0) << 1;
  $1$1 = (($a$1 | 0) < 0 ? -1 : 0) >> 31 | (($a$1 | 0) < 0 ? -1 : 0) << 1;
  $2$0 = $b$1 >> 31 | (($b$1 | 0) < 0 ? -1 : 0) << 1;
  $2$1 = (($b$1 | 0) < 0 ? -1 : 0) >> 31 | (($b$1 | 0) < 0 ? -1 : 0) << 1;
  $4$0 = _i64Subtract($1$0 ^ $a$0 | 0, $1$1 ^ $a$1 | 0, $1$0 | 0, $1$1 | 0) | 0;
  $4$1 = tempRet0;
  $6$0 = _i64Subtract($2$0 ^ $b$0 | 0, $2$1 ^ $b$1 | 0, $2$0 | 0, $2$1 | 0) | 0;
  $7$0 = $2$0 ^ $1$0;
  $7$1 = $2$1 ^ $1$1;
  $8$0 = ___udivmoddi4($4$0, $4$1, $6$0, tempRet0, 0) | 0;
  $10$0 = _i64Subtract($8$0 ^ $7$0 | 0, tempRet0 ^ $7$1 | 0, $7$0 | 0, $7$1 | 0) | 0;
  return $10$0 | 0;
}
function ___remdi3($a$0, $a$1, $b$0, $b$1) {
  $a$0 = $a$0 | 0;
  $a$1 = $a$1 | 0;
  $b$0 = $b$0 | 0;
  $b$1 = $b$1 | 0;
  var $rem = 0, $1$0 = 0, $1$1 = 0, $2$0 = 0, $2$1 = 0, $4$0 = 0, $4$1 = 0, $6$0 = 0, $10$0 = 0, $10$1 = 0, __stackBase__ = 0;
  __stackBase__ = STACKTOP;
  STACKTOP = STACKTOP + 16 | 0;
  $rem = __stackBase__ | 0;
  $1$0 = $a$1 >> 31 | (($a$1 | 0) < 0 ? -1 : 0) << 1;
  $1$1 = (($a$1 | 0) < 0 ? -1 : 0) >> 31 | (($a$1 | 0) < 0 ? -1 : 0) << 1;
  $2$0 = $b$1 >> 31 | (($b$1 | 0) < 0 ? -1 : 0) << 1;
  $2$1 = (($b$1 | 0) < 0 ? -1 : 0) >> 31 | (($b$1 | 0) < 0 ? -1 : 0) << 1;
  $4$0 = _i64Subtract($1$0 ^ $a$0 | 0, $1$1 ^ $a$1 | 0, $1$0 | 0, $1$1 | 0) | 0;
  $4$1 = tempRet0;
  $6$0 = _i64Subtract($2$0 ^ $b$0 | 0, $2$1 ^ $b$1 | 0, $2$0 | 0, $2$1 | 0) | 0;
  ___udivmoddi4($4$0, $4$1, $6$0, tempRet0, $rem) | 0;
  $10$0 = _i64Subtract(HEAP32[$rem >> 2] ^ $1$0 | 0, HEAP32[$rem + 4 >> 2] ^ $1$1 | 0, $1$0 | 0, $1$1 | 0) | 0;
  $10$1 = tempRet0;
  STACKTOP = __stackBase__;
  return (tempRet0 = $10$1, $10$0) | 0;
}
function ___muldi3($a$0, $a$1, $b$0, $b$1) {
  $a$0 = $a$0 | 0;
  $a$1 = $a$1 | 0;
  $b$0 = $b$0 | 0;
  $b$1 = $b$1 | 0;
  var $x_sroa_0_0_extract_trunc = 0, $y_sroa_0_0_extract_trunc = 0, $1$0 = 0, $1$1 = 0, $2 = 0;
  $x_sroa_0_0_extract_trunc = $a$0;
  $y_sroa_0_0_extract_trunc = $b$0;
  $1$0 = ___muldsi3($x_sroa_0_0_extract_trunc, $y_sroa_0_0_extract_trunc) | 0;
  $1$1 = tempRet0;
  $2 = Math_imul($a$1, $y_sroa_0_0_extract_trunc) | 0;
  return (tempRet0 = ((Math_imul($b$1, $x_sroa_0_0_extract_trunc) | 0) + $2 | 0) + $1$1 | $1$1 & 0, 0 | $1$0 & -1) | 0;
}
function ___udivdi3($a$0, $a$1, $b$0, $b$1) {
  $a$0 = $a$0 | 0;
  $a$1 = $a$1 | 0;
  $b$0 = $b$0 | 0;
  $b$1 = $b$1 | 0;
  var $1$0 = 0;
  $1$0 = ___udivmoddi4($a$0, $a$1, $b$0, $b$1, 0) | 0;
  return $1$0 | 0;
}
function ___uremdi3($a$0, $a$1, $b$0, $b$1) {
  $a$0 = $a$0 | 0;
  $a$1 = $a$1 | 0;
  $b$0 = $b$0 | 0;
  $b$1 = $b$1 | 0;
  var $rem = 0, __stackBase__ = 0;
  __stackBase__ = STACKTOP;
  STACKTOP = STACKTOP + 16 | 0;
  $rem = __stackBase__ | 0;
  ___udivmoddi4($a$0, $a$1, $b$0, $b$1, $rem) | 0;
  STACKTOP = __stackBase__;
  return (tempRet0 = HEAP32[$rem + 4 >> 2] | 0, HEAP32[$rem >> 2] | 0) | 0;
}
function ___udivmoddi4($a$0, $a$1, $b$0, $b$1, $rem) {
  $a$0 = $a$0 | 0;
  $a$1 = $a$1 | 0;
  $b$0 = $b$0 | 0;
  $b$1 = $b$1 | 0;
  $rem = $rem | 0;
  var $n_sroa_0_0_extract_trunc = 0, $n_sroa_1_4_extract_shift$0 = 0, $n_sroa_1_4_extract_trunc = 0, $d_sroa_0_0_extract_trunc = 0, $d_sroa_1_4_extract_shift$0 = 0, $d_sroa_1_4_extract_trunc = 0, $4 = 0, $17 = 0, $37 = 0, $49 = 0, $51 = 0, $57 = 0, $58 = 0, $66 = 0, $78 = 0, $86 = 0, $88 = 0, $89 = 0, $91 = 0, $92 = 0, $95 = 0, $105 = 0, $117 = 0, $119 = 0, $125 = 0, $126 = 0, $130 = 0, $q_sroa_1_1_ph = 0, $q_sroa_0_1_ph = 0, $r_sroa_1_1_ph = 0, $r_sroa_0_1_ph = 0, $sr_1_ph = 0, $d_sroa_0_0_insert_insert99$0 = 0, $d_sroa_0_0_insert_insert99$1 = 0, $137$0 = 0, $137$1 = 0, $carry_0203 = 0, $sr_1202 = 0, $r_sroa_0_1201 = 0, $r_sroa_1_1200 = 0, $q_sroa_0_1199 = 0, $q_sroa_1_1198 = 0, $147 = 0, $149 = 0, $r_sroa_0_0_insert_insert42$0 = 0, $r_sroa_0_0_insert_insert42$1 = 0, $150$1 = 0, $151$0 = 0, $152 = 0, $154$0 = 0, $r_sroa_0_0_extract_trunc = 0, $r_sroa_1_4_extract_trunc = 0, $155 = 0, $carry_0_lcssa$0 = 0, $carry_0_lcssa$1 = 0, $r_sroa_0_1_lcssa = 0, $r_sroa_1_1_lcssa = 0, $q_sroa_0_1_lcssa = 0, $q_sroa_1_1_lcssa = 0, $q_sroa_0_0_insert_ext75$0 = 0, $q_sroa_0_0_insert_ext75$1 = 0, $q_sroa_0_0_insert_insert77$1 = 0, $_0$0 = 0, $_0$1 = 0;
  $n_sroa_0_0_extract_trunc = $a$0;
  $n_sroa_1_4_extract_shift$0 = $a$1;
  $n_sroa_1_4_extract_trunc = $n_sroa_1_4_extract_shift$0;
  $d_sroa_0_0_extract_trunc = $b$0;
  $d_sroa_1_4_extract_shift$0 = $b$1;
  $d_sroa_1_4_extract_trunc = $d_sroa_1_4_extract_shift$0;
  if (($n_sroa_1_4_extract_trunc | 0) == 0) {
    $4 = ($rem | 0) != 0;
    if (($d_sroa_1_4_extract_trunc | 0) == 0) {
      if ($4) {
        HEAP32[$rem >> 2] = ($n_sroa_0_0_extract_trunc >>> 0) % ($d_sroa_0_0_extract_trunc >>> 0);
        HEAP32[$rem + 4 >> 2] = 0;
      }
      $_0$1 = 0;
      $_0$0 = ($n_sroa_0_0_extract_trunc >>> 0) / ($d_sroa_0_0_extract_trunc >>> 0) >>> 0;
      return (tempRet0 = $_0$1, $_0$0) | 0;
    } else {
      if (!$4) {
        $_0$1 = 0;
        $_0$0 = 0;
        return (tempRet0 = $_0$1, $_0$0) | 0;
      }
      HEAP32[$rem >> 2] = $a$0 & -1;
      HEAP32[$rem + 4 >> 2] = $a$1 & 0;
      $_0$1 = 0;
      $_0$0 = 0;
      return (tempRet0 = $_0$1, $_0$0) | 0;
    }
  }
  $17 = ($d_sroa_1_4_extract_trunc | 0) == 0;
  do {
    if (($d_sroa_0_0_extract_trunc | 0) == 0) {
      if ($17) {
        if (($rem | 0) != 0) {
          HEAP32[$rem >> 2] = ($n_sroa_1_4_extract_trunc >>> 0) % ($d_sroa_0_0_extract_trunc >>> 0);
          HEAP32[$rem + 4 >> 2] = 0;
        }
        $_0$1 = 0;
        $_0$0 = ($n_sroa_1_4_extract_trunc >>> 0) / ($d_sroa_0_0_extract_trunc >>> 0) >>> 0;
        return (tempRet0 = $_0$1, $_0$0) | 0;
      }
      if (($n_sroa_0_0_extract_trunc | 0) == 0) {
        if (($rem | 0) != 0) {
          HEAP32[$rem >> 2] = 0;
          HEAP32[$rem + 4 >> 2] = ($n_sroa_1_4_extract_trunc >>> 0) % ($d_sroa_1_4_extract_trunc >>> 0);
        }
        $_0$1 = 0;
        $_0$0 = ($n_sroa_1_4_extract_trunc >>> 0) / ($d_sroa_1_4_extract_trunc >>> 0) >>> 0;
        return (tempRet0 = $_0$1, $_0$0) | 0;
      }
      $37 = $d_sroa_1_4_extract_trunc - 1 | 0;
      if (($37 & $d_sroa_1_4_extract_trunc | 0) == 0) {
        if (($rem | 0) != 0) {
          HEAP32[$rem >> 2] = 0 | $a$0 & -1;
          HEAP32[$rem + 4 >> 2] = $37 & $n_sroa_1_4_extract_trunc | $a$1 & 0;
        }
        $_0$1 = 0;
        $_0$0 = $n_sroa_1_4_extract_trunc >>> ((_llvm_cttz_i32($d_sroa_1_4_extract_trunc | 0) | 0) >>> 0);
        return (tempRet0 = $_0$1, $_0$0) | 0;
      }
      $49 = Math_clz32($d_sroa_1_4_extract_trunc | 0) | 0;
      $51 = $49 - (Math_clz32($n_sroa_1_4_extract_trunc | 0) | 0) | 0;
      if ($51 >>> 0 <= 30) {
        $57 = $51 + 1 | 0;
        $58 = 31 - $51 | 0;
        $sr_1_ph = $57;
        $r_sroa_0_1_ph = $n_sroa_1_4_extract_trunc << $58 | $n_sroa_0_0_extract_trunc >>> ($57 >>> 0);
        $r_sroa_1_1_ph = $n_sroa_1_4_extract_trunc >>> ($57 >>> 0);
        $q_sroa_0_1_ph = 0;
        $q_sroa_1_1_ph = $n_sroa_0_0_extract_trunc << $58;
        break;
      }
      if (($rem | 0) == 0) {
        $_0$1 = 0;
        $_0$0 = 0;
        return (tempRet0 = $_0$1, $_0$0) | 0;
      }
      HEAP32[$rem >> 2] = 0 | $a$0 & -1;
      HEAP32[$rem + 4 >> 2] = $n_sroa_1_4_extract_shift$0 | $a$1 & 0;
      $_0$1 = 0;
      $_0$0 = 0;
      return (tempRet0 = $_0$1, $_0$0) | 0;
    } else {
      if (!$17) {
        $117 = Math_clz32($d_sroa_1_4_extract_trunc | 0) | 0;
        $119 = $117 - (Math_clz32($n_sroa_1_4_extract_trunc | 0) | 0) | 0;
        if ($119 >>> 0 <= 31) {
          $125 = $119 + 1 | 0;
          $126 = 31 - $119 | 0;
          $130 = $119 - 31 >> 31;
          $sr_1_ph = $125;
          $r_sroa_0_1_ph = $n_sroa_0_0_extract_trunc >>> ($125 >>> 0) & $130 | $n_sroa_1_4_extract_trunc << $126;
          $r_sroa_1_1_ph = $n_sroa_1_4_extract_trunc >>> ($125 >>> 0) & $130;
          $q_sroa_0_1_ph = 0;
          $q_sroa_1_1_ph = $n_sroa_0_0_extract_trunc << $126;
          break;
        }
        if (($rem | 0) == 0) {
          $_0$1 = 0;
          $_0$0 = 0;
          return (tempRet0 = $_0$1, $_0$0) | 0;
        }
        HEAP32[$rem >> 2] = 0 | $a$0 & -1;
        HEAP32[$rem + 4 >> 2] = $n_sroa_1_4_extract_shift$0 | $a$1 & 0;
        $_0$1 = 0;
        $_0$0 = 0;
        return (tempRet0 = $_0$1, $_0$0) | 0;
      }
      $66 = $d_sroa_0_0_extract_trunc - 1 | 0;
      if (($66 & $d_sroa_0_0_extract_trunc | 0) != 0) {
        $86 = (Math_clz32($d_sroa_0_0_extract_trunc | 0) | 0) + 33 | 0;
        $88 = $86 - (Math_clz32($n_sroa_1_4_extract_trunc | 0) | 0) | 0;
        $89 = 64 - $88 | 0;
        $91 = 32 - $88 | 0;
        $92 = $91 >> 31;
        $95 = $88 - 32 | 0;
        $105 = $95 >> 31;
        $sr_1_ph = $88;
        $r_sroa_0_1_ph = $91 - 1 >> 31 & $n_sroa_1_4_extract_trunc >>> ($95 >>> 0) | ($n_sroa_1_4_extract_trunc << $91 | $n_sroa_0_0_extract_trunc >>> ($88 >>> 0)) & $105;
        $r_sroa_1_1_ph = $105 & $n_sroa_1_4_extract_trunc >>> ($88 >>> 0);
        $q_sroa_0_1_ph = $n_sroa_0_0_extract_trunc << $89 & $92;
        $q_sroa_1_1_ph = ($n_sroa_1_4_extract_trunc << $89 | $n_sroa_0_0_extract_trunc >>> ($95 >>> 0)) & $92 | $n_sroa_0_0_extract_trunc << $91 & $88 - 33 >> 31;
        break;
      }
      if (($rem | 0) != 0) {
        HEAP32[$rem >> 2] = $66 & $n_sroa_0_0_extract_trunc;
        HEAP32[$rem + 4 >> 2] = 0;
      }
      if (($d_sroa_0_0_extract_trunc | 0) == 1) {
        $_0$1 = $n_sroa_1_4_extract_shift$0 | $a$1 & 0;
        $_0$0 = 0 | $a$0 & -1;
        return (tempRet0 = $_0$1, $_0$0) | 0;
      } else {
        $78 = _llvm_cttz_i32($d_sroa_0_0_extract_trunc | 0) | 0;
        $_0$1 = 0 | $n_sroa_1_4_extract_trunc >>> ($78 >>> 0);
        $_0$0 = $n_sroa_1_4_extract_trunc << 32 - $78 | $n_sroa_0_0_extract_trunc >>> ($78 >>> 0) | 0;
        return (tempRet0 = $_0$1, $_0$0) | 0;
      }
    }
  } while (0);
  if (($sr_1_ph | 0) == 0) {
    $q_sroa_1_1_lcssa = $q_sroa_1_1_ph;
    $q_sroa_0_1_lcssa = $q_sroa_0_1_ph;
    $r_sroa_1_1_lcssa = $r_sroa_1_1_ph;
    $r_sroa_0_1_lcssa = $r_sroa_0_1_ph;
    $carry_0_lcssa$1 = 0;
    $carry_0_lcssa$0 = 0;
  } else {
    $d_sroa_0_0_insert_insert99$0 = 0 | $b$0 & -1;
    $d_sroa_0_0_insert_insert99$1 = $d_sroa_1_4_extract_shift$0 | $b$1 & 0;
    $137$0 = _i64Add($d_sroa_0_0_insert_insert99$0 | 0, $d_sroa_0_0_insert_insert99$1 | 0, -1, -1) | 0;
    $137$1 = tempRet0;
    $q_sroa_1_1198 = $q_sroa_1_1_ph;
    $q_sroa_0_1199 = $q_sroa_0_1_ph;
    $r_sroa_1_1200 = $r_sroa_1_1_ph;
    $r_sroa_0_1201 = $r_sroa_0_1_ph;
    $sr_1202 = $sr_1_ph;
    $carry_0203 = 0;
    while (1) {
      $147 = $q_sroa_0_1199 >>> 31 | $q_sroa_1_1198 << 1;
      $149 = $carry_0203 | $q_sroa_0_1199 << 1;
      $r_sroa_0_0_insert_insert42$0 = 0 | ($r_sroa_0_1201 << 1 | $q_sroa_1_1198 >>> 31);
      $r_sroa_0_0_insert_insert42$1 = $r_sroa_0_1201 >>> 31 | $r_sroa_1_1200 << 1 | 0;
      _i64Subtract($137$0 | 0, $137$1 | 0, $r_sroa_0_0_insert_insert42$0 | 0, $r_sroa_0_0_insert_insert42$1 | 0) | 0;
      $150$1 = tempRet0;
      $151$0 = $150$1 >> 31 | (($150$1 | 0) < 0 ? -1 : 0) << 1;
      $152 = $151$0 & 1;
      $154$0 = _i64Subtract($r_sroa_0_0_insert_insert42$0 | 0, $r_sroa_0_0_insert_insert42$1 | 0, $151$0 & $d_sroa_0_0_insert_insert99$0 | 0, ((($150$1 | 0) < 0 ? -1 : 0) >> 31 | (($150$1 | 0) < 0 ? -1 : 0) << 1) & $d_sroa_0_0_insert_insert99$1 | 0) | 0;
      $r_sroa_0_0_extract_trunc = $154$0;
      $r_sroa_1_4_extract_trunc = tempRet0;
      $155 = $sr_1202 - 1 | 0;
      if (($155 | 0) == 0) {
        break;
      } else {
        $q_sroa_1_1198 = $147;
        $q_sroa_0_1199 = $149;
        $r_sroa_1_1200 = $r_sroa_1_4_extract_trunc;
        $r_sroa_0_1201 = $r_sroa_0_0_extract_trunc;
        $sr_1202 = $155;
        $carry_0203 = $152;
      }
    }
    $q_sroa_1_1_lcssa = $147;
    $q_sroa_0_1_lcssa = $149;
    $r_sroa_1_1_lcssa = $r_sroa_1_4_extract_trunc;
    $r_sroa_0_1_lcssa = $r_sroa_0_0_extract_trunc;
    $carry_0_lcssa$1 = 0;
    $carry_0_lcssa$0 = $152;
  }
  $q_sroa_0_0_insert_ext75$0 = $q_sroa_0_1_lcssa;
  $q_sroa_0_0_insert_ext75$1 = 0;
  $q_sroa_0_0_insert_insert77$1 = $q_sroa_1_1_lcssa | $q_sroa_0_0_insert_ext75$1;
  if (($rem | 0) != 0) {
    HEAP32[$rem >> 2] = 0 | $r_sroa_0_1_lcssa;
    HEAP32[$rem + 4 >> 2] = $r_sroa_1_1_lcssa | 0;
  }
  $_0$1 = (0 | $q_sroa_0_0_insert_ext75$0) >>> 31 | $q_sroa_0_0_insert_insert77$1 << 1 | ($q_sroa_0_0_insert_ext75$1 << 1 | $q_sroa_0_0_insert_ext75$0 >>> 31) & 0 | $carry_0_lcssa$1;
  $_0$0 = ($q_sroa_0_0_insert_ext75$0 << 1 | 0 >>> 31) & -2 | $carry_0_lcssa$0;
  return (tempRet0 = $_0$1, $_0$0) | 0;
}
// =======================================================================



  
function dynCall_iiii(index,a1,a2,a3) {
  index = index|0;
  a1=a1|0; a2=a2|0; a3=a3|0;
  return FUNCTION_TABLE_iiii[index&31](a1|0,a2|0,a3|0)|0;
}


function dynCall_viiiii(index,a1,a2,a3,a4,a5) {
  index = index|0;
  a1=a1|0; a2=a2|0; a3=a3|0; a4=a4|0; a5=a5|0;
  FUNCTION_TABLE_viiiii[index&31](a1|0,a2|0,a3|0,a4|0,a5|0);
}


function dynCall_vi(index,a1) {
  index = index|0;
  a1=a1|0;
  FUNCTION_TABLE_vi[index&31](a1|0);
}


function dynCall_vii(index,a1,a2) {
  index = index|0;
  a1=a1|0; a2=a2|0;
  FUNCTION_TABLE_vii[index&31](a1|0,a2|0);
}


function dynCall_ii(index,a1) {
  index = index|0;
  a1=a1|0;
  return FUNCTION_TABLE_ii[index&31](a1|0)|0;
}


function dynCall_v(index) {
  index = index|0;
  
  FUNCTION_TABLE_v[index&31]();
}

function b0(p0,p1,p2) {
 p0 = p0|0;p1 = p1|0;p2 = p2|0; nullFunc_iiii(0);return 0;
}
function b1(p0,p1,p2,p3,p4) {
 p0 = p0|0;p1 = p1|0;p2 = p2|0;p3 = p3|0;p4 = p4|0; nullFunc_viiiii(1);
}
function b2(p0) {
 p0 = p0|0; nullFunc_vi(2);
}
function b3(p0,p1) {
 p0 = p0|0;p1 = p1|0; nullFunc_vii(3);
}
function b4(p0) {
 p0 = p0|0; nullFunc_ii(4);return 0;
}
function b5() {
 ; nullFunc_v(5);
}

// EMSCRIPTEN_END_FUNCS
var FUNCTION_TABLE_iiii = [b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,___stdio_write,___stdio_seek,___stdout_write,b0,b0,b0,b0,b0,b0,___stdio_read,b0
,b0,b0,b0];
var FUNCTION_TABLE_viiiii = [b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,__ZL18chimp8_draw_spriteP10chimp8corehhhPv,b1,b1,b1,b1,b1,b1
,b1,b1,b1];
var FUNCTION_TABLE_vi = [b2,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2,_cleanup,_cleanup_15,b2,b2
,b2,b2,b2];
var FUNCTION_TABLE_vii = [b3,_inst_0,_inst_1,_inst_2,_inst_3,_inst_4,_inst_5,_inst_6,_inst_7,_inst_8,_inst_9,_inst_a,_inst_b,_inst_c,_inst_d,_inst_e,_inst_f,b3,b3,b3,b3,__ZL19chimp8_clear_screenP10chimp8corePv,b3,b3,b3,b3,b3,b3,b3
,b3,b3,b3];
var FUNCTION_TABLE_ii = [b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,___stdio_close,b4,b4,b4,b4,b4,b4,_chimp8_int_step,b4,b4,b4,b4
,b4,b4,b4];
var FUNCTION_TABLE_v = [b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,__ZL9main_loopv,b5,b5,b5,b5,b5
,b5,b5,b5];

  return { _i64Subtract: _i64Subtract, _free: _free, _main: _main, _i64Add: _i64Add, _pthread_self: _pthread_self, _memset: _memset, _malloc: _malloc, _load_game: _load_game, _memcpy: _memcpy, _bitshift64Lshr: _bitshift64Lshr, _fflush: _fflush, ___errno_location: ___errno_location, _bitshift64Shl: _bitshift64Shl, runPostSets: runPostSets, stackAlloc: stackAlloc, stackSave: stackSave, stackRestore: stackRestore, establishStackSpace: establishStackSpace, setThrew: setThrew, setTempRet0: setTempRet0, getTempRet0: getTempRet0, dynCall_iiii: dynCall_iiii, dynCall_viiiii: dynCall_viiiii, dynCall_vi: dynCall_vi, dynCall_vii: dynCall_vii, dynCall_ii: dynCall_ii, dynCall_v: dynCall_v };
})
// EMSCRIPTEN_END_ASM
(Module.asmGlobalArg, Module.asmLibraryArg, buffer);
var real__i64Subtract = asm["_i64Subtract"]; asm["_i64Subtract"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real__i64Subtract.apply(null, arguments);
};

var real__free = asm["_free"]; asm["_free"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real__free.apply(null, arguments);
};

var real__main = asm["_main"]; asm["_main"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real__main.apply(null, arguments);
};

var real__i64Add = asm["_i64Add"]; asm["_i64Add"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real__i64Add.apply(null, arguments);
};

var real__pthread_self = asm["_pthread_self"]; asm["_pthread_self"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real__pthread_self.apply(null, arguments);
};

var real__malloc = asm["_malloc"]; asm["_malloc"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real__malloc.apply(null, arguments);
};

var real__load_game = asm["_load_game"]; asm["_load_game"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real__load_game.apply(null, arguments);
};

var real__bitshift64Lshr = asm["_bitshift64Lshr"]; asm["_bitshift64Lshr"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real__bitshift64Lshr.apply(null, arguments);
};

var real__fflush = asm["_fflush"]; asm["_fflush"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real__fflush.apply(null, arguments);
};

var real____errno_location = asm["___errno_location"]; asm["___errno_location"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real____errno_location.apply(null, arguments);
};

var real__bitshift64Shl = asm["_bitshift64Shl"]; asm["_bitshift64Shl"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real__bitshift64Shl.apply(null, arguments);
};
var _i64Subtract = Module["_i64Subtract"] = asm["_i64Subtract"];
var _free = Module["_free"] = asm["_free"];
var _main = Module["_main"] = asm["_main"];
var _i64Add = Module["_i64Add"] = asm["_i64Add"];
var _pthread_self = Module["_pthread_self"] = asm["_pthread_self"];
var _memset = Module["_memset"] = asm["_memset"];
var runPostSets = Module["runPostSets"] = asm["runPostSets"];
var _malloc = Module["_malloc"] = asm["_malloc"];
var _load_game = Module["_load_game"] = asm["_load_game"];
var _memcpy = Module["_memcpy"] = asm["_memcpy"];
var _bitshift64Lshr = Module["_bitshift64Lshr"] = asm["_bitshift64Lshr"];
var _fflush = Module["_fflush"] = asm["_fflush"];
var ___errno_location = Module["___errno_location"] = asm["___errno_location"];
var _bitshift64Shl = Module["_bitshift64Shl"] = asm["_bitshift64Shl"];
var dynCall_iiii = Module["dynCall_iiii"] = asm["dynCall_iiii"];
var dynCall_viiiii = Module["dynCall_viiiii"] = asm["dynCall_viiiii"];
var dynCall_vi = Module["dynCall_vi"] = asm["dynCall_vi"];
var dynCall_vii = Module["dynCall_vii"] = asm["dynCall_vii"];
var dynCall_ii = Module["dynCall_ii"] = asm["dynCall_ii"];
var dynCall_v = Module["dynCall_v"] = asm["dynCall_v"];
;

Runtime.stackAlloc = asm['stackAlloc'];
Runtime.stackSave = asm['stackSave'];
Runtime.stackRestore = asm['stackRestore'];
Runtime.establishStackSpace = asm['establishStackSpace'];

Runtime.setTempRet0 = asm['setTempRet0'];
Runtime.getTempRet0 = asm['getTempRet0'];



// === Auto-generated postamble setup entry stuff ===




function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
};
ExitStatus.prototype = new Error();
ExitStatus.prototype.constructor = ExitStatus;

var initialStackTop;
var preloadStartTime = null;
var calledMain = false;

dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!Module['calledRun']) run();
  if (!Module['calledRun']) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
}

Module['callMain'] = Module.callMain = function callMain(args) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on __ATMAIN__)');
  assert(__ATPRERUN__.length == 0, 'cannot call main when preRun functions remain to be called');

  args = args || [];

  ensureInitRuntime();

  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString(Module['thisProgram']), 'i8', ALLOC_NORMAL) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_NORMAL));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_NORMAL);


  try {

    var ret = Module['_main'](argc, argv, 0);


    // if we're not running an evented main loop, it's time to exit
    exit(ret, /* implicit = */ true);
  }
  catch(e) {
    if (e instanceof ExitStatus) {
      // exit() throws this once it's done to make sure execution
      // has been stopped completely
      return;
    } else if (e == 'SimulateInfiniteLoop') {
      // running an evented main loop, don't immediately exit
      Module['noExitRuntime'] = true;
      return;
    } else {
      if (e && typeof e === 'object' && e.stack) Module.printErr('exception thrown: ' + [e, e.stack]);
      throw e;
    }
  } finally {
    calledMain = true;
  }
}




function run(args) {
  args = args || Module['arguments'];

  if (preloadStartTime === null) preloadStartTime = Date.now();

  if (runDependencies > 0) {
    Module.printErr('run() called, but dependencies remain, so not running');
    return;
  }

  writeStackCookie();

  preRun();

  if (runDependencies > 0) return; // a preRun added a dependency, run will be called later
  if (Module['calledRun']) return; // run may have just been called through dependencies being fulfilled just in this very frame

  function doRun() {
    if (Module['calledRun']) return; // run may have just been called while the async setStatus time below was happening
    Module['calledRun'] = true;

    if (ABORT) return; 

    ensureInitRuntime();

    preMain();

    if (ENVIRONMENT_IS_WEB && preloadStartTime !== null) {
      Module.printErr('pre-main prep time: ' + (Date.now() - preloadStartTime) + ' ms');
    }

    if (Module['onRuntimeInitialized']) Module['onRuntimeInitialized']();

    if (Module['_main'] && shouldRunNow) Module['callMain'](args);

    postRun();
  }

  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      doRun();
    }, 1);
  } else {
    doRun();
  }
  checkStackCookie();
}
Module['run'] = Module.run = run;

function exit(status, implicit) {
  if (implicit && Module['noExitRuntime']) {
    Module.printErr('exit(' + status + ') implicitly called by end of main(), but noExitRuntime, so not exiting the runtime (you can use emscripten_force_exit, if you want to force a true shutdown)');
    return;
  }

  if (Module['noExitRuntime']) {
    Module.printErr('exit(' + status + ') called, but noExitRuntime, so halting execution but not exiting the runtime or preventing further async execution (you can use emscripten_force_exit, if you want to force a true shutdown)');
  } else {

    ABORT = true;
    EXITSTATUS = status;
    STACKTOP = initialStackTop;

    exitRuntime();

    if (Module['onExit']) Module['onExit'](status);
  }

  if (ENVIRONMENT_IS_NODE) {
    process['exit'](status);
  } else if (ENVIRONMENT_IS_SHELL && typeof quit === 'function') {
    quit(status);
  }
  // if we reach here, we must throw an exception to halt the current execution
  throw new ExitStatus(status);
}
Module['exit'] = Module.exit = exit;

var abortDecorators = [];

function abort(what) {
  if (what !== undefined) {
    Module.print(what);
    Module.printErr(what);
    what = JSON.stringify(what)
  } else {
    what = '';
  }

  ABORT = true;
  EXITSTATUS = 1;

  var extra = '';

  var output = 'abort(' + what + ') at ' + stackTrace() + extra;
  if (abortDecorators) {
    abortDecorators.forEach(function(decorator) {
      output = decorator(output, what);
    });
  }
  throw output;
}
Module['abort'] = Module.abort = abort;

// {{PRE_RUN_ADDITIONS}}

if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}

// shouldRunNow refers to calling main(), not run().
var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}


run();

// {{POST_RUN_ADDITIONS}}






// {{MODULE_ADDITIONS}}



