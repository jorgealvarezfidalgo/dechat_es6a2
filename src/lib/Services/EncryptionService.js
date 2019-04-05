const CryptoJS = require("crypto-js");
const Enigma = require("node-enigma");

class EncryptionService {
	
	constructor() {
		var config = EncryptionService.randomizeConfiguration();
		this.code = config.code;
		this.plugboard = config.plugboard;
		this.greek = config.greek;
		this.rotor1 = config.rotor1;
		this.rotor2 = config.rotor2;
		this.rotor3 = config.rotor3;
		this.reflector = config.reflector;
		this.salt = CryptoJS.lib.WordArray.random(256);
		this.defaultkey = this.hash("ElquienhasacadodevosotrosestegritodeguerraDiosloquiere" + this.salt);
	}
	
	setPassword(pass) {
		this.pass = pass;
		//console.log("SALOR: " +this.salt.toString());
		//console.log("PASSOR: " +pass);
		//console.log("Contraseñaor_: " + pass + this.salt.toString());
		this.key = this.hash(pass + this.salt.toString());
	}
	
	encryptAES(txt) {
		//console.log("Clave or: " + this.key);
		return CryptoJS.AES.encrypt(txt,this.inbox ? this.defaultkey : this.key);
	}
	
	hash(txt) {
		if(txt!=="") {
			return CryptoJS.SHA256(txt).toString();
		} else {
			return "";
		}
	}
	
	decryptAES(txt, key) {
		//console.log("AESD: " + txt);
		var bytes;
		try {
			bytes = CryptoJS.AES.decrypt(txt, key);																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																											
			return bytes.toString(CryptoJS.enc.Utf8);
		} catch(e) {
			return "";
		}
	}
	
	rotorSchlusselmaschineCodierung(txt) {
		var result = txt.split(/[\/\#,:;\?\+\(\)\.\-\_!\|'¿0-9 ]+/);
		//console.log(result);
		const m4 = new Enigma(this.greek, this.rotor1, this.rotor2, this.rotor3, this.reflector);
		m4.setCode(this.code);
		m4.setPlugboard(this.plugboard);
		var i;
		var tx = txt.replace(/([A-Z])/g, "_|$1");
		//console.log(tx);
		for(i = 0; i < result.length; i++) {
			tx = tx.replace(result[i], m4.encode(result[i]));
		}
		return tx;
	}
	
	rotorSchlusselmaschineDekodierung(txt) {
		var result = txt.split(/[\/\#,:;\?\+\(\)\.\-\_!\|'¿0-9 ]+/);
		const m4 = new Enigma(this.greek, this.rotor1, this.rotor2, this.rotor3, this.reflector);
		m4.setCode(this.code);
		m4.setPlugboard(this.plugboard);
		var i;
		var tx = txt;
		//console.log(tx);
		for(i = 0; i < result.length; i++) {
			tx = tx.replace(result[i], m4.decode(result[i]).toLowerCase());
		}	
		//console.log(tx);
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
	
	/*
		TRUBIA Encrypting Algorithm
	*/
	encrypt(txt, inbox) {
		this.inbox = inbox;
		var enc = this.rotorSchlusselmaschineCodierung(txt);
		var enigmaConf = this.code[0] + "//" + this.code[1] + "//" + this.code[2] + "//" 
						+ JSON.stringify(this.plugboard) + "//" + this.greek + "//" 
						+ this.rotor1 + "//" + this.rotor2 + "//" + this.rotor3 + "//" + this.reflector + "//";
		var enigmaEnc = enigmaConf + enc;
		return (inbox ? this.defaultkey : this.salt.toString()) + "=" + this.encryptAES(enigmaEnc);
	}
	
	/* 
		TRUBIA Decrypting
	*/
	decrypt(txt, inbox) {
		//console.log(txt);
		var key = "";
		var salt = "";
		if(inbox) {
			key = txt.split("=")[0];
		} else {
			salt = txt.value ? txt.value.split("=")[0] : txt.split("=")[0];
			//console.log("SALDEC: " + salt);
			//console.log("PASSDEC:" + this.pass);
			//console.log("Contraseñadec_: " + this.pass+salt);
			key = this.hash(this.pass + salt);
		}
		//console.log("Clavedec: " + key);
		var msg = txt.value ? txt.value.replace((inbox ? key : salt)+ "=", "") : txt.replace((inbox ? key : salt)+ "=", "");
		//console.log(msg)
		var desAes = this.decryptAES(msg, key);
		
		//console.log(desAes);
		var enigmaConf = desAes.split("//");
		//console.log(enigmaConf);
		if(enigmaConf.length > 8) {
		
			this.code = [enigmaConf[0],enigmaConf[1],enigmaConf[2]];
			
			this.plugboard = JSON.parse(enigmaConf[3]);
			this.greek = enigmaConf[4];
			this.rotor1 = enigmaConf[5];
			this.rotor2 = enigmaConf[6];
			this.rotor3 = enigmaConf[7];
			this.reflector = enigmaConf[8];
			return this.rotorSchlusselmaschineDekodierung(enigmaConf.slice(9, enigmaConf.length).join("//"));
		} else {
			return txt.value ? txt.value : txt;
		}
	}
	
	
	
}


module.exports = EncryptionService;
