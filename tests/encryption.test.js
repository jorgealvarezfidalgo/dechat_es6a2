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
  
  it("Encrypting and desencrypting with Enigma", async function() {
	 var code = ["A", "F", "K"];
	var plugboard = {
		  "F": "I",
		  "D": "A",
	      "L": "G"
		 };
    const encrypter = new Encrypter(code, plugboard, "beta","v","iv","iii","ukw-b");

	var enc = encrypter.rotorSchlusselmaschineCodierung("Doktorturnoffmypaininhibitors1");
	console.log("Encrypted is " + enc);
	var desenc = encrypter.rotorSchlusselmaschineDekodierung(enc);
    assert.equal(desenc, "Doktorturnoffmypaininhibitors1", "The desencryption is not correct:" + desenc);
	
	enc = encrypter.rotorSchlusselmaschineCodierung("Doktor turn off my pain inhibitors");
	console.log("Encrypted is " + enc);
	desenc = encrypter.rotorSchlusselmaschineDekodierung(enc);
    assert.equal(desenc, "Doktor turn off my pain inhibitors", "The desencryption is not correct:" + desenc);
	
	enc = encrypter.rotorSchlusselmaschineCodierung("Doktor, turn off; my pain? inhibitors.");
	console.log("Encrypted is " + enc);
	desenc = encrypter.rotorSchlusselmaschineDekodierung(enc);
    assert.equal(desenc, "Doktor, turn off; my pain? inhibitors.", "The desencryption is not correct:" + desenc);
  });
  
  
});

