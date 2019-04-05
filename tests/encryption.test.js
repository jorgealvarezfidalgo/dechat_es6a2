const assert = require("assert");
const Encrypter = require("../src/lib/Services/EncryptionService");

describe("Encryption", function() {
	
  it("Encrypting and desencrypting with AES", async function() {
    const encrypter = new Encrypter();
	encrypter.setPassword("wololo");
	var txt = "God only knows, men of honor.";
	var enc = encrypter.encryptAES(txt);
	console.log("Encrypted is " + enc);
	var desenc = encrypter.decryptAES(enc, encrypter.key);
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
	
	
	var enc = encrypter.rotorSchlusselmaschineCodierung("https://rokivulovic/profile/card#me");
	console.log("Encrypted is " + enc);
	var desenc = encrypter.rotorSchlusselmaschineDekodierung(enc);
	console.log("Desencrypted is " + desenc);
    assert.equal(desenc, "https://rokivulovic/profile/card#me", "The desencryption is not correct:" + desenc);
	
  });
  
  it("TRUBIA Encryption Algorithm: private", async function() {
    var encrypter = new Encrypter();
	encrypter.setPassword("dsfudsu6743t77gr94");
	var txt = "Memories broken, the truth goes unspoken, i've// even forgotten my name";
	var enc = encrypter.encrypt(txt, false);
	console.log(enc);
	encrypter = new Encrypter();
	encrypter.setPassword("dsfudsu6743t77gr94");
	var dec = encrypter.decrypt(enc, false);
	assert.equal(dec, "Memories broken, the truth goes unspoken, i've// even forgotten my name", "The desencryption is not correct:" + dec);
	
	var dec = encrypter.decrypt("Texto plano", false);
	assert.equal(dec, "Texto plano", "Should return the same text:" + dec);
	
  });
  
  it("TRUBIA Encryption Algorithm: inbox", async function() {
    const encrypter = new Encrypter();
	encrypter.setPassword("kdfuo23488hfh82uhf");
	var txt = "Memories broken, the truth goes unspoken, i've// even forgotten my name";
	var enc = encrypter.encrypt(txt, true);
	console.log(enc);
	var dec = encrypter.decrypt(enc, true);
	assert.equal(dec, "Memories broken, the truth goes unspoken, i've// even forgotten my name", "The desencryption is not correct:" + dec);
	
	//Invitation fields
	var dec = encrypter.decrypt("7ffa596361bcebc0bed81c10421659241a30f77a43e59c7ef837cfcba17373a7=U2FsdGVkX185WOtHy3ks/RU9T2bV0nPuKltjsiXK6TtDlSt4C6l5NJVebuztz7qcXeiEczHs0TMeUT2GUkV/Dp4G55bdg0f4ddQMLEoogkI64BYYxJYVs4cMyRinyIo8YvO9ZrTzb+7qRhZusAkvLNL4g2FXEZxEof3cT71c9Qm8i7wUbvS6R2w8LXcDSwlIHSSKGuFL61revIleVFgBxA==", true);
	assert.equal(dec, "https://takumi.solid.community/private/dechat_201904050438.ttl#ju46bxwz", "The desencryption is not correct:" + dec);
	
	var dec = encrypter.decrypt("7ffa596361bcebc0bed81c10421659241a30f77a43e59c7ef837cfcba17373a7=U2FsdGVkX19qwyJSKyIgDG+8ZYqaI+wOnEu2hMfRKrYsYHQH5QId3tkTjXdtMMqH4diAn4Vxy/MmI4tXRD0MRU0f2grfPAJ4ndihLnG/vQH2fQe5vYHjgtvhxuVG/O3hvSZD1M5X0FQTGpxiFf1QpgkMU48R/Cgs6izl0xZcp1k=", true);
	assert.equal(dec, "https://takumi.solid.community/profile/card#me", "The desencryption is not correct:" + dec);
	
	var dec = encrypter.decrypt("7ffa596361bcebc0bed81c10421659241a30f77a43e59c7ef837cfcba17373a7=U2FsdGVkX19fkUibZztTlh6x7G8pAmnoehRPe1rpIO+ZJ+6XyCXJTXGWCOsRK6CF4bsnsjxsuP2expBpmoHMnMBcBJF/EG6Hk1gs2rXFTuHnYs9n9ZwjmDxC5xbylg7j01YcwpIWPA+0yEDdz6MU0KTiEAwwNkLlCONK13Wykp8+z8/nYr1DbnmXOsNmnYoj", true);
	assert.equal(dec, "https://rokivulovic.solid.community/profile/card#me", "The desencryption is not correct:" + dec);
	
	//Message fields
	var dec = encrypter.decrypt("7ffa596361bcebc0bed81c10421659241a30f77a43e59c7ef837cfcba17373a7=U2FsdGVkX1/NR7yQRU8oX7xxwmhmQFkn5DmFV59IJOGUtjGJvSWer8hFqS8wPUhz46+rFKymXHRPFAS/RrJ9LVRuCtC5SfohKYwXPq95xiRYrIuG6L/k0WODgT2TJxoPuBbbKhTfBxDE3+tIWeh8vg==", true);
	assert.equal(dec, "2119-04-05T16-38-15", "The desencryption is not correct:" + dec);
	var dec = encrypter.decrypt("7ffa596361bcebc0bed81c10421659241a30f77a43e59c7ef837cfcba17373a7=U2FsdGVkX1+cKFpfW1PChmTN4b11mqKO+sCmizetsTwN431UlsXGTqMhY8ybdpnyWii9MFjCc1bCgnecUQyy3KZ+qXbu3Pw/IqmaOTJMrO+7mji7iAQrkZElMjfq43EW", true);
	assert.equal(dec, "Takumi", "The desencryption is not correct:" + dec);
	var dec = encrypter.decrypt("7ffa596361bcebc0bed81c10421659241a30f77a43e59c7ef837cfcba17373a7=U2FsdGVkX1+g1oKLXvCW/kmMu2wmbkHX9T24KQuyZ1zTPNi9JsJBHHl77zWuZDwTrjEhrznWSDE/o/QSso+/AB/0G/yYzzA/+WpAWP14+85fUnvXDiOlBxGVqsCKDMZKWpUqsyRgIZxko+aIRhtBzQ==", true);
	assert.equal(dec, "Eyyy roki que hay", "The desencryption is not correct:" + dec);
  });
  
  it("Hash", async function() {
    const encrypter = new Encrypter();
	var txt1 = "Memories broken, the truth goes unspoken, i've even forgotten my name";
	var txt2 = "Only love is with us now, Something warm and pure; $Find the beast within 92ourselves, No need for a cure";
	var enc1 = encrypter.hash(txt1);
	var enc2 = encrypter.hash(txt2);	
	assert.equal(encrypter.hash(txt1), encrypter.hash(txt1), "Same result");
	assert.notEqual(enc1, enc2, "Hashes cannot be equal");
	assert.notEqual(enc1, txt1, "Hash1 cannot be equal to his origin");
	assert.notEqual(enc2, txt2, "Hash2 cannot be equal to his origin");
	
	assert.equal("", encrypter.hash(""), "Should be empty");
	
  });
  
  
});

