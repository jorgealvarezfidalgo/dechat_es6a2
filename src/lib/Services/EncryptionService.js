const CryptoJS = require("crypto-js");
const Enigma = require("node-enigma");

class EncryptionService {
    constructor() {
		this.key = "";
	}
	
	encrypt(txt) {
		// var salt = CryptoJS.lib.WordArray.random(128/8);
  
  // var key = CryptoJS.PBKDF2(pass, salt, {
      // keySize: keySize/32,
      // iterations: iterations
    // });
		return CryptoJS.AES.encrypt(txt,this.key);
	}
	
	decrypt(txt) {
		var bytes  = CryptoJS.AES.decrypt(txt, this.key);																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																											
        return bytes.toString(CryptoJS.enc.Utf8);
	}
	
	/**
* M4 CONFIGURATION
* WHEEL POSITIONS [4TH, 3RD, 2ND, 1ST, REFLECTOR]
*
* M3 CONFIGURATION
* WHEEL POSITIONS [ 3RD, 2ND, 1ST, REFLECTOR]
*
* WHEELS 
*   ROTORS['i','ii','iii','iv','v','vi','vii,'viii']
*   REFLECTORS['ukw-b','ukw-c','b-thin','c-thin']
*   GREEK['beta', 'gamma']
*/
	rotorSchlusselmaschineCodierung(txt, code, plugboard, greek, rotor1, rotor2, rotor3, reflector) {
		var result = txt.split(/[,:;\?\(\)\.\-\_!¿ ]+/);
		const m4 = new Enigma(greek, rotor1, rotor2,rotor3, reflector);
		m4.setCode(code);
		m4.setPlugboard(plugboard);
		var i;
		for(i = 0; i < result.length; i++) {
			txt.replace(result[i], m4.encode(result[i]));
		}
		return txt;
	}
	
	rotorSchlusselmaschineDekodierung(txt, code, plugboard, greek, rotor1, rotor2, rotor3, reflector) {
		var result = txt.split(/[,:;\?\(\)\.\-\_!¿ ]+/);
		const m4 = new Enigma(greek, rotor1, rotor2, rotor3, reflector);
		m4.setCode(code);
		m4.setPlugboard(plugboard);
		var i;
		for(i = 0; i < result.length; i++) {
			txt.replace(result[i], m4.decode(result[i]));
		}	
		return txt;
	}
	
}


module.exports = EncryptionService;
