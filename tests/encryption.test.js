const assert = require("assert");
const Encrypter = require("../src/lib/Services/EncryptionService");

describe("Encryption", function() {
	
  it("Encrypting and desencrypting with AES", async function() {
    const encrypter = new Encrypter();
	var txt = "God only knows, men of honor.";
	var enc = encrypter.encryptAES(txt);
	console.log("Encrypted is " + enc);
	var desenc = encrypter.decryptAES(enc);
    assert.equal(desenc, "God only knows, men of honor.", "The desencryption is not correct:" + desenc);
  });
  
  
  it("Encrypting and desencrypting with Enigma; random configuration", async function() {
	var rotors = ["i","ii","iii","iv","v","vi","vii","viii"];
	var reflectors = ["ukw-b","ukw-c","b-thin","c-thin"];
	var greeks = ["beta", "gamma"];
	const encrypter = new Encrypter();
	assert.equal(encrypter.code.length, 3, "Wrong code length: " + encrypter.code.length);
	assert.notEqual(encrypter.plugboard, null, "It must be an object");
	assert.notEqual(greeks.indexOf(encrypter.greek), -1, "It must be contained within the defined options: " + encrypter.greek);
	assert.notEqual(rotors.indexOf(encrypter.rotor1), -1, "It must be contained within the defined options: " + encrypter.rotor1);
	assert.notEqual(rotors.indexOf(encrypter.rotor2), -1, "It must be contained within the defined options: " + encrypter.rotor2);
	assert.notEqual(rotors.indexOf(encrypter.rotor3), -1, "It must be contained within the defined options: " + encrypter.rotor3);
	assert.notEqual(reflectors.indexOf(encrypter.reflector), -1, "It must be contained within the defined options: " + encrypter.reflector);
	
	
    

	var enc = encrypter.rotorSchlusselmaschineCodierung("Only love is with us now, Something warm and pure; Find the beast within ourselves, No need for a cure");
	console.log("Encrypted is " + enc);
	var desenc = encrypter.rotorSchlusselmaschineDekodierung(enc);
	console.log("Desencrypted is " + desenc);
    assert.equal(desenc, "Only love is with us now, Something warm and pure; Find the beast within ourselves, No need for a cure", "The desencryption is not correct:" + desenc);
	
  });
  
  it("TRUBIA Encryption Algorithm", async function() {
    const encrypter = new Encrypter();
	var txt = "Memories broken, the truth goes unspoken, i've even forgotten my name";
	var enc = encrypter.encrypt(txt);
	console.log(enc);
	var dec = encrypter.decrypt(enc);
	assert.equal(dec, "Memories broken, the truth goes unspoken, i've even forgotten my name", "The desencryption is not correct:" + dec);
	
  });
  
  it("Hash", async function() {
    const encrypter = new Encrypter();
	var txt1 = "Memories broken, the truth goes unspoken, i've even forgotten my name";
	var txt2 = "Only love is with us now, Something warm and pure; $Find the beast within 92ourselves, No need for a cure";
	var enc1 = encrypter.hash(txt1);
	var enc2 = encrypter.hash(txt2);	
	assert.notEqual(enc1, enc2, "Hashes cannot be equal");
	assert.notEqual(enc1, txt1, "Hash1 cannot be equal to his origin");
	assert.notEqual(enc2, txt2, "Hash2 cannot be equal to his origin");
	
  });
  
  
});

