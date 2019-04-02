const assert = require("assert");
const Encrypter = require("../src/lib/Services/EncryptionService");

describe("Encryption", function() {
	
  it("Encrypting and desencrypting with AES", async function() {
    const encrypter = new Encrypter(null, null, "beta","v","iv","iii","ukw-b");
	var txt = "God only knows, men of honor.";
	var enc = encrypter.encrypt(txt, "TRYHDHNVHFINEJBEB");
	console.log("Encrypted is " + enc);
	var desenc = encrypter.decrypt(enc);
    assert.equal(desenc, "God only knows, men of honor.", "The desencryption is not correct:" + desenc);
  });
  
  it("Encrypting and desencrypting with Enigma; preset configuration", async function() {
	 var code = ["A", "F", "K"];
	var plugboard = {
		  "F": "I",
		  "D": "A",
	      "L": "G"
		 };
    const encrypter = new Encrypter(code, plugboard, "beta","v","iv","iii","ukw-b");

	var enc = encrypter.rotorSchlusselmaschineCodierung("Doktorturnoffmypaininhibitors");
	assert.notEqual(enc, "Doktorturnoffmypaininhibitors", "The encryption is not correct:" + enc);
	var desenc = encrypter.rotorSchlusselmaschineDekodierung(enc);
    assert.equal(desenc.toLowerCase(), "doktorturnoffmypaininhibitors", "The desencryption is not correct:" + desenc);
	
	enc = encrypter.rotorSchlusselmaschineCodierung("Doktor turn off my pain inhibitors");
	assert.notEqual(enc, "Doktor turn off my pain inhibitors", "The encryption is not correct:" + enc);
	desenc = encrypter.rotorSchlusselmaschineDekodierung(enc);
    assert.equal(desenc.toLowerCase(), "doktor turn off my pain inhibitors", "The desencryption is not correct:" + desenc);
	
	enc = encrypter.rotorSchlusselmaschineCodierung("Doktor, turn off; my pain? inhibitors.");
	assert.notEqual(enc, "Doktor, turn off; my pain? inhibitors.", "The desencryption is not correct:" + enc);
	desenc = encrypter.rotorSchlusselmaschineDekodierung(enc);
    assert.equal(desenc.toLowerCase(), "doktor, turn off; my pain? inhibitors.", "The desencryption is not correct:" + desenc);
  });
  
  it("Encrypting and desencrypting with Enigma; random configuration", async function() {
	const config = Encrypter.randomizeConfiguration();
	console.log(config);
	var rotors = ["i","ii","iii","iv","v","vi","vii","viii"];
	var reflectors = ["ukw-b","ukw-c","b-thin","c-thin"];
	var greeks = ["beta", "gamma"];
	assert.equal(config.code.length, 3, "Wrong code length: " + config.code.length);
	assert.notEqual(config.plugboard, null, "It must be an object");
	assert.notEqual(greeks.indexOf(config.greek), -1, "It must be contained within the defined options: " + config.greek);
	assert.notEqual(rotors.indexOf(config.rotor1), -1, "It must be contained within the defined options: " + config.rotor1);
	assert.notEqual(rotors.indexOf(config.rotor2), -1, "It must be contained within the defined options: " + config.rotor2);
	assert.notEqual(rotors.indexOf(config.rotor3), -1, "It must be contained within the defined options: " + config.rotor3);
	assert.notEqual(reflectors.indexOf(config.reflector), -1, "It must be contained within the defined options: " + config.reflector);
	
	
    const encrypter = new Encrypter(config.code, config.plugboard, config.greek,config.rotor1,config.rotor2,config.rotor3,config.reflector);

	var enc = encrypter.rotorSchlusselmaschineCodierung("Only love is with us now, something warm and pure; find the beast within ourselves, no need for a cure");
	console.log("Encrypted is " + enc);
	var desenc = encrypter.rotorSchlusselmaschineDekodierung(enc);
    //assert.equal(desenc.toLowerCase(), "only love is with us now, something warm and pure; find the beast within ourselves, no need for a cure", "The desencryption is not correct:" + desenc);
	
  });
  
  
});

