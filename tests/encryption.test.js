const assert = require("assert");
const Encrypter = require("../src/lib/Services/EncryptionService");

describe("Encryption", function() {
	
  it("Encrypting and desencrypting with AES", async function() {
    const encrypter = new Encrypter();
	var txt = "God only knows";
	var enc = encrypter.encrypt(txt, "TRYHDHNVHFINEJBEB");
	console.log("Encrypted is " + enc);
	var desenc = encrypter.decrypt(enc);
    assert.equal(desenc, "God only knows", "The desencryption is not correct:" + desenc);
  });
  
  it("Encrypting and desencrypting with Enigma", async function() {
    const encrypter = new Encrypter();
	var code = ['A', 'F', 'K'];
	var plugboard = {
		  'F': 'I',
		  "D": "A",
	      "L": "G"
		 };
	var enc = encrypter.rotorSchlusselmaschineCodierung("Doktorturnoffmypaininhibitors", code, plugboard, 'beta','v','iv','iii','ukw-b');
	console.log("Encrypted is " + enc);
	var desenc = encrypter.rotorSchlusselmaschineDekodierung(enc, code, plugboard, 'beta','v','iv','iii','ukw-b');
    assert.equal(desenc, "Doktorturnoffmypaininhibitors", "The desencryption is not correct:" + desenc);
	
	enc = encrypter.rotorSchlusselmaschineCodierung("Doktor turn off my pain inhibitors", code, plugboard, 'beta','v','iv','iii','ukw-b');
	console.log("Encrypted is " + enc);
	desenc = encrypter.rotorSchlusselmaschineDekodierung(enc, code, plugboard, 'beta','v','iv','iii','ukw-b');
    assert.equal(desenc, "Doktor turn off my pain inhibitors", "The desencryption is not correct:" + desenc);
	
	enc = encrypter.rotorSchlusselmaschineCodierung("Doktor, turn off; my pain? inhibitors.", code, plugboard, 'gamma','v','ii','iii','ukw-b');
	console.log("Encrypted is " + enc);
	desenc = encrypter.rotorSchlusselmaschineDekodierung(enc, code, plugboard, 'gamma','v','ii','iii','ukw-b');
    assert.equal(desenc, "Doktor, turn off; my pain? inhibitors.", "The desencryption is not correct:" + desenc);
  });
  
  
});

