const CryptoJS = require("crypto-js");
const Enigma = require("node-enigma");

class EncryptionService {
    constructor(code, plugboard, greek, rotor1, rotor2, rotor3, reflector) {
		this.key = "";
		this.code = code;
		this.plugboard = plugboard;
		this.greek = greek;
		this.rotor1 = rotor1;
		this.rotor2 = rotor2;
		this.rotor3 = rotor3;
		this.reflector = reflector;
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
*   ROTORS["i","ii","iii","iv","v","vi","vii,"viii"]
*   REFLECTORS["ukw-b","ukw-c","b-thin","c-thin"]
*   GREEK["beta", "gamma"]
*/
	rotorSchlusselmaschineCodierung(txt) {
		var result = txt.split(/[,:;\?\(\)\.\-\_!\|¿0-9 ]+/);
		const m4 = new Enigma(this.greek, this.rotor1, this.rotor2, this.rotor3, this.reflector);
		m4.setCode(this.code);
		m4.setPlugboard(this.plugboard);
		var i;
		var tx = txt.replace(/([A-Z])/g, "_|$1");
		console.log(tx);
		for(i = 0; i < result.length; i++) {
			tx = tx.replace(result[i], m4.encode(result[i]));
		}
		return tx;
	}
	
	rotorSchlusselmaschineDekodierung(txt) {
		var result = txt.split(/[,:;\?\(\)\.\-\_!\|¿0-9 ]+/);
		const m4 = new Enigma(this.greek, this.rotor1, this.rotor2, this.rotor3, this.reflector);
		m4.setCode(this.code);
		m4.setPlugboard(this.plugboard);
		var i;
		var tx = txt;
		console.log(tx);
		for(i = 0; i < result.length; i++) {
			tx = tx.replace(result[i], m4.decode(result[i]).toLowerCase());
		}	
		console.log(tx);
		return tx.replace(/\_\|([a-z])/g,
			function(m, m1, p) {
			  return m1.replace("_|", "").toUpperCase();
			});
	}
	
	static randomNumber(range) {
		return Math.floor(Math.random() * range);
	}
	
	static randomizeConfiguration() {
		var rotors = ["i","ii","iii","iv","v","vi","vii","viii"];
		var reflectors = ["ukw-b","ukw-c","b-thin","c-thin"];
		var greeks = ["beta", "gamma"];
		var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
		var count, last;
		count = 0;
		var pluggins = [];
		last = EncryptionService.randomNumber(26);
		while(pluggins.length < 6) {
			if(pluggins.indexOf(alphabet[last])===-1) {
				pluggins[count] = alphabet[last];
				count += 1;
			}
			last = EncryptionService.randomNumber(26);
		}
		var selrotors = [];
		last = EncryptionService.randomNumber(8);
		count = 0;
		while(selrotors.length < 3) {
			if(selrotors.indexOf(last)===-1) {
			selrotors[count] = last;
			count += 1;
			}
			last = EncryptionService.randomNumber(8);
		}
		return {
			"code": [alphabet[EncryptionService.randomNumber(26)], alphabet[EncryptionService.randomNumber(26)], alphabet[EncryptionService.randomNumber(26)]],
			"plugboard": {
				[pluggins[0]] : pluggins[1],
				[pluggins[2]] : pluggins[3],
				[pluggins[4]] : pluggins[5]
			},
			"greek": greeks[EncryptionService.randomNumber(1)],
			"rotor1": rotors[selrotors[0]],
			"rotor2": rotors[selrotors[1]],
			"rotor3": rotors[selrotors[2]],
			"reflector": reflectors[EncryptionService.randomNumber(4)]
		};
	}
	
	
	
}


module.exports = EncryptionService;
