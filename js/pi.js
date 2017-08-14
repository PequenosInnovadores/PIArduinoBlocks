// arduino.js


function delay(milliseconds) {
    console.log('Waiting for ' + milliseconds + ' miliseconds');
    window.setTimeout(function() {
        callback();
    }, milliseconds);

    /*
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start) > milliseconds){
            break;
        }
    }
    */
}



(function(ext) {
    var device = null;
    var _rxBuf = [];

    // Tiempo que le lleva a un servo hacer un grado, ya se que hay servos mas rapido y mas lentos, mas o menos!!    
    var SERVO_TIME_PER_DEGRADE = 80;

    // Sensor states:
    var ports = {
        Port1: 1,
        Port2: 2,
        Port3: 3,
        Port4: 4,
        Port5: 5,
        Port6: 6,
        Port7: 7,
        Port8: 8,
        M1:9,
        M2:10
    };
    var slots = {
        Slot1:1,
        Slot2:2
    };
    var switchStatus = {
        On:1,
        Off:0
    };
    var levels = {
        HIGH:1,
        LOW:0
    };
    var axis = {
        'X-Axis':1,
        'Y-Axis':2,
        'Z-Axis':3
    }
    var tones ={"B0":31,"C1":33,"D1":37,"E1":41,"F1":44,"G1":49,"A1":55,"B1":62,
            "C2":65,"D2":73,"E2":82,"F2":87,"G2":98,"A2":110,"B2":123,
            "C3":131,"D3":147,"E3":165,"F3":175,"G3":196,"A3":220,"B3":247,
            "C4":262,"D4":294,"E4":330,"F4":349,"G4":392,"A4":440,"B4":494,
            "C5":523,"D5":587,"E5":659,"F5":698,"G5":784,"A5":880,"B5":988,
            "C6":1047,"D6":1175,"E6":1319,"F6":1397,"G6":1568,"A6":1760,"B6":1976,
            "C7":2093,"D7":2349,"E7":2637,"F7":2794,"G7":3136,"A7":3520,"B7":3951,
    "C8":4186,"D8":4699};
    var beats = {"Half":500,"Quarter":250,"Eighth":125,"Whole":1000,"Double":2000,"Zero":0};
    var values = {};  
    var indexs = [];
    
    var startTimer = 0;
    var versionIndex = 0xFA;

    var angleServos = [];

    /**************************************************/
    ext.resetAll = function(){
        device.send([0xff, 0x55, 2, 0, 4]);

    };
    
    ext.runArduino = function(){
        responseValue();
    };

    ext.runDigital = function(level, pin) {
        if (level == "ON"){
            level = 1;
        }else if(level == "OFF"){
            level = 0;
        }else{
            alert("Solo se puede ponerse 'Encender' o 'Apagar', fijate bien!");
        }
        pin = new Number(pin) 

        if (pin > 13 || pin < 2){
            alert("En el Arduino Nano solo pueden encenderse/apagarse los pines digitales del 2 al 13, fijate bien!");

        }
        //alert("runDigitales " + pin + " - " + level);

        runPackage(30, pin, level);
    };


    /*
        TEST:
            1) Si se pone un pin que no este entre 2 y 13, mensaje error.

            2) Si no se fijo un angulo fijo al pin con otro bloque, mensaje error.
    */
    function servoMove(pin, angle){
        trace("runServo " + pin + " - " + angle );
        pin = new Number(pin) 
        if (pin > 13 || pin < 2){
            alert("En el Arduino Nano solo pueden manejar el Servo en los pines digitales del 2 al 13, fijate bien!");

        }

        angle = new Number(angle); 
        if (angle < 0 ){
            angle = 0;
        } else if (angle > 180){
            angle = 180;
        }

        /*
        for (var i = angleServos.length - 1; i >= 0; i--) {
             trace("Angulo " + i + " " + angleServos[i]);
        }
        */
       
        // Si no había un tiempo previo marcado se da un margen.
        if(angleServos[pin] == undefined){ 
            delay(180 * SERVO_TIME_PER_DEGRADE);
        }else{
            // Da un margen de tiempo entre la diferencia de grados que se mueve por un tiempo necesario por grado.
            difAngle = Math.abs(angleServos[pin] - angle);
            delay(difAngle * SERVO_TIME_PER_DEGRADE);            
        }  
        runPackage(33, pin, angle);
        angleServos[pin] = angle; 
    }

    /*
    */
    ext.runServo = function(pin, angle) {
        servoMove(pin, angle);
    };

    /*
        TEST:
            1) Si se pone un sentido distinto de "LEFT" o "RIGHT", mesaje error.
    */
    ext.runServoRightLeft = function(pin, angle, side) {

        if(angleServos[pin] == undefined){ 
            servoMove(pin, 0);            
        }           
         
        if (side == "LEFT"){
            angle = angleServos[pin] + angle;
        }else if(side == "RIGHT"){
            angle = angleServos[pin] - angle;
        }else{
            alert("El Servo solo puede ir a la 'Derecha' o a la 'Izquierda', fijate bien!");
        }

        servoMove(pin, angle);

    };

/*
    ext.runPwm = function(pin,pwm) {
        runPackage(32,pin,pwm);
    };
    ext.runTone = function(pin,tone,beat){
        runPackage(34,pin,short2array(typeof tone=="number"?tone:tones[tone]),short2array(typeof beat=="number"?beat:beats[beat]));
    };
    ext.runServoArduino = function(pin, angle){
        runPackage(33,pin,angle);
    };
    ext.resetTimer = function(){
        startTimer = new Date().getTime();
        responseValue();
    };
    ext.getDigital = function(nextID,pin){
        var deviceId = 30;
        getPackage(nextID,deviceId,pin);
    };
    ext.getAnalog = function(nextID,pin) {
        var deviceId = 31;
        getPackage(nextID,deviceId,pin);
    };
    ext.getPulse = function(nextID,pin,timeout) {
        var deviceId = 37;
        getPackage(nextID,deviceId,pin,short2array(timeout));
    };
    ext.getUltrasonicArduino = function(nextID,trig,echo){
        var deviceId = 36;
        getPackage(nextID,deviceId,trig,echo);
    }
    ext.getTimer = function(nextID){
        if(startTimer==0){
            startTimer = new Date().getTime();
        }
        responseValue(nextID,new Date().getTime()-startTimer);
    }
*/


    function sendPackage(argList, type){
        var bytes = [0xff, 0x55, 0, 0, type];
        for(var i=0;i<argList.length;++i){
            var val = argList[i];
            if(val.constructor == "[class Array]"){
                bytes = bytes.concat(val);
            }else{
                bytes.push(val);
            }
        }
        bytes[2] = bytes.length - 3;
        device.send(bytes);
    }
    
    function runPackage(){
        sendPackage(arguments, 2);
    }
    function getPackage(){
        var nextID = arguments[0];
        Array.prototype.shift.call(arguments);
        sendPackage(arguments, 1);
    }

    var inputArray = [];
    var _isParseStart = false;
    var _isParseStartIndex = 0;
    function processData(bytes) {
        var len = bytes.length;
        if(_rxBuf.length>30){
            _rxBuf = [];
        }
        for(var index=0;index<bytes.length;index++){
            var c = bytes[index];
            _rxBuf.push(c);
            if(_rxBuf.length>=2){
                if(_rxBuf[_rxBuf.length-1]==0x55 && _rxBuf[_rxBuf.length-2]==0xff){
                    _isParseStart = true;
                    _isParseStartIndex = _rxBuf.length-2;
                }
                if(_rxBuf[_rxBuf.length-1]==0xa && _rxBuf[_rxBuf.length-2]==0xd&&_isParseStart){
                    _isParseStart = false;
                    
                    var position = _isParseStartIndex+2;
                    var extId = _rxBuf[position];
                    position++;
                    var type = _rxBuf[position];
                    position++;
                    //1 byte 2 float 3 short 4 len+string 5 double
                    var value;
                    switch(type){
                        case 1:{
                            value = _rxBuf[position];
                            position++;
                        }
                            break;
                        case 2:{
                            value = readFloat(_rxBuf,position);
                            position+=4;
                            if(value<-255||value>1023){
                                value = 0;
                            }
                        }
                            break;
                        case 3:{
                            value = readInt(_rxBuf,position,2);
                            position+=2;
                        }
                            break;
                        case 4:{
                            var l = _rxBuf[position];
                            position++;
                            value = readString(_rxBuf,position,l);
                        }
                            break;
                        case 5:{
                            value = readDouble(_rxBuf,position);
                            position+=4;
                        }
                            break;
                        case 6:
                            value = readInt(_rxBuf,position,4);
                            position+=4;
                            break;
                    }
                    if(type<=6){
                        responseValue(extId,value);
                    }else{
                        responseValue();
                    }
                    _rxBuf = [];
                }
            } 
        }
    }
    function readFloat(arr,position){
        var f= [arr[position],arr[position+1],arr[position+2],arr[position+3]];
        return parseFloat(f);
    }
    function readInt(arr,position,count){
        var result = 0;
        for(var i=0; i<count; ++i){
            result |= arr[position+i] << (i << 3);
        }
        return result;
    }
    function readDouble(arr,position){
        return readFloat(arr,position);
    }
    function readString(arr,position,len){
        var value = "";
        for(var ii=0;ii<len;ii++){
            value += String.fromCharCode(_rxBuf[ii+position]);
        }
        return value;
    }
    function appendBuffer( buffer1, buffer2 ) {
        return buffer1.concat( buffer2 );
    }

    // Extension API interactions
    var potentialDevices = [];
    ext._deviceConnected = function(dev) {
        potentialDevices.push(dev);

        if (!device) {
            tryNextDevice();
        }
    }

    function tryNextDevice() {
        // If potentialDevices is empty, device will be undefined.
        // That will get us back here next time a device is connected.
        device = potentialDevices.shift();
        if (device) {
            device.open({ stopBits: 0, bitRate: 115200, ctsFlowControl: 0 }, deviceOpened);
        }
    }

    var watchdog = null;
    function deviceOpened(dev) {
        if (!dev) {
            // Opening the port failed.
            tryNextDevice();
            return;
        }
        device.set_receive_handler('arduino',processData);
    };

    ext._deviceRemoved = function(dev) {
        if(device != dev) return;
        device = null;
    };

    ext._shutdown = function() {
        if(device) device.close();
        device = null;
    };

    ext._getStatus = function() {
        if(!device) return {status: 1, msg: 'Arduino disconnected'};
        if(watchdog) return {status: 1, msg: 'Probing for Arduino'};
        return {status: 2, msg: 'Arduino connected'};
    }

    var descriptor = {};
    ScratchExtensions.register('Arduino', descriptor, ext, {type: 'serial'});
})({});
