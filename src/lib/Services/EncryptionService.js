const CryptoJS = require("crypto-js");
const Enigma = require("node-enigma");

/**
 * Provides Encryption/Decryption features
 */
class EncryptionService {

    constructor() {
        this.salt = CryptoJS.lib.WordArray.random(128);
        this.defaultkey = this.hash("ElquienhasacadodevosotrosestegritodeguerraDiosloquiere" + this.salt);
    }

    /**
     * Sets Encryption system password (dynamic input by user)
     * @param {string} pass: password.
     */
    setPassword(pass) {
        this.pass = pass;
        this.key = this.hash(pass + this.salt.toString());
    }

    /**
     * Encrypts a string with AES algorithm, using system key (if target is inbox) or personal key (if target is private folder)
     * @param {string} txt: text to encrypt.
     * @returns {string}: encrypted text.
     */
    encryptAES(txt) {
        return CryptoJS.AES.encrypt(txt, this.inbox ? this.defaultkey : this.key);
    }

    /**
     * Calculates hash of a given text.
     * @param {string} txt: text to hash.
     * @returns {string}: Hash
     */
    hash(txt) {
        if (txt !== "") {
            return CryptoJS.SHA256(txt).toString();
        } else {
            return "";
        }
    }

    /**
     * Decrypts a string with AES algorithm.
     * @param {string} txt: text to decrypt.
     * @param {string} key: key to decrypt.
     * @returns {string}: decrypted text.
     */
    decryptAES(txt, key) {
        var bytes;
        try {
            bytes = CryptoJS.AES.decrypt(txt, key);
            return bytes.toString(CryptoJS.enc.Utf8);
        } catch (e) {
            return "";
        }
    }

    /**
     * Encrypts a string with M4 Enigma, using a random configuration.
     * @param {string} txt: text to encrypt.
     * @returns {string}: encrypted text.
     */
    rotorSchlusselmaschineCodierung(txt) {
        var config = EncryptionService.randomizeConfiguration();
        this.code = config.code;
        this.plugboard = config.plugboard;
        this.greek = config.greek;
        this.rotor1 = config.rotor1;
        this.rotor2 = config.rotor2;
        this.rotor3 = config.rotor3;
        this.reflector = config.reflector;
        var tx = txt.replace(/([A-Z])/g, "_|$1");
        var result = tx.split(/[\/\#,:;\?\+\(\)\.\-\_!\|\^'¿0-9áéíóúàèìòùñ ]+/);
        const m4 = new Enigma(this.greek, this.rotor1, this.rotor2, this.rotor3, this.reflector);
        m4.setCode(this.code);
        m4.setPlugboard(this.plugboard);
        var i;
        var parsedtx = "";

        for (i = 0; i < result.length; i++) {
            tx = tx.replace(result[i], m4.encode(result[i]));
            parsedtx += tx.substring(0, i + 1 < result.length ? tx.indexOf(result[i + 1], result[i].length) : tx.length);
            tx = tx.substring(i + 1 < result.length ? tx.indexOf(result[i + 1], result[i].length) : tx.length);
        }
        return parsedtx;
    }

    /**
     * Decrypts a string with M4 Enigma with current configuration.
     * @param {string} txt: text to decrypt.
     * @returns {string}: decrypted text.
     */
    rotorSchlusselmaschineDekodierung(txt) {
        var result = txt.split(/[\/\#,:;\?\+\(\)\.\-\_!\|\^'¿0-9áéíóúàèìòùñ ]+/);
        var result = txt.split(/[\/\#,:;\?\+\(\)\.\-\_!\|\^'¿0-9áéíóúàèìòùñ ]+/);
        const m4 = new Enigma(this.greek, this.rotor1, this.rotor2, this.rotor3, this.reflector);
        m4.setCode(this.code);
        m4.setPlugboard(this.plugboard);
        var i;
        var tx = txt;
        var parsedtx = "";

        for (i = 0; i < result.length; i++) {
            tx = tx.replace(result[i], m4.decode(result[i]));
            parsedtx += tx.substring(0, i + 1 < result.length ? tx.indexOf(result[i + 1], result[i].length) : tx.length).toLowerCase();
            tx = tx.substring(i + 1 < result.length ? tx.indexOf(result[i + 1], result[i].length) : tx.length);
        }
        return parsedtx.replace(/\_\|([a-z])/g,
            function(m, m1, p) {
                return m1.replace("_|", "").toUpperCase();
            });
    }

    /**
     * Returns a random integer within the specified range.
     * @param {int} range: range of the randomness
     * @returns {int}: a random number within the range.
     */
    static randomNumber(range) {
        return Math.floor(Math.random() * range);
    }

    /**
     * Creates a random M4 Enigma Configuration.
     * Billions of possible configurations.
     * @returns {Object}: configuration generated.
     */
    static randomizeConfiguration() {
        var rotors = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii"];
        var reflectors = ["ukw-b", "ukw-c", "b-thin", "c-thin"];
        var greeks = ["beta", "gamma"];
        var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
        var count, last;
        count = 0;
        var pluggins = [];
        last = EncryptionService.randomNumber(26);
        while (pluggins.length < 6) {
            if (pluggins.indexOf(alphabet[last]) === -1) {
                pluggins[count] = alphabet[last];
                count += 1;
            }
            last = EncryptionService.randomNumber(26);
        }
        var selrotors = [];
        last = EncryptionService.randomNumber(8);
        count = 0;
        while (selrotors.length < 3) {
            if (selrotors.indexOf(last) === -1) {
                selrotors[count] = last;
                count += 1;
            }
            last = EncryptionService.randomNumber(8);
        }
        return {
            "code": [alphabet[EncryptionService.randomNumber(26)], alphabet[EncryptionService.randomNumber(26)], alphabet[EncryptionService.randomNumber(26)]],
            "plugboard": {
                [pluggins[0]]: pluggins[1],
                [pluggins[2]]: pluggins[3],
                [pluggins[4]]: pluggins[5]
            },
            "greek": greeks[EncryptionService.randomNumber(1)],
            "rotor1": rotors[selrotors[0]],
            "rotor2": rotors[selrotors[1]],
            "rotor3": rotors[selrotors[2]],
            "reflector": reflectors[EncryptionService.randomNumber(4)]
        };
    }

    /**
     * Encrypts a string with TRUBIA.
     * Firstly the target is encrypted with M4 Enigma using a random configuration.
     * Then its configuration is appended to the result. All of it is encrypted using AES.
     * Salt is appended to the encrypted text. Process completed.
     * @param {string} txt: text to encrypt.
     * @param {bool} inbox: true if encryption is for inbox.
     * @returns {string}: encrypted text along salt.
     */
    encrypt(txt, inbox) {
        this.inbox = inbox;
        var enigmaEnc;
        if (!txt.includes(";base64,")) {
            var enc = this.rotorSchlusselmaschineCodierung(txt);
            var enigmaConf = this.code[0] + "//" + this.code[1] + "//" + this.code[2] + "//" +
                JSON.stringify(this.plugboard) + "//" + this.greek + "//" +
                this.rotor1 + "//" + this.rotor2 + "//" + this.rotor3 + "//" + this.reflector + "//";
            enigmaEnc = enigmaConf + enc;
        } else {
            enigmaEnc = txt;
        }
        return (inbox ? this.defaultkey : this.salt.toString()) + "=" + this.encryptAES(enigmaEnc);
    }

    /**
     * Decrypts a string with TRUBIA.
     * Salt is appended to current password to create the key for this encrypted text.
     * Such key is used to decrypt with AES.
     * Decrypted Enigma Configuration is established. The processed text is decrypted with Enigma.
     * @param {string} txt: text to encrypt.
     * @param {bool} inbox: true if encryption is for inbox.
     * @returns {string}: decrypted text.
     */
    decrypt(txt, inbox) {
        var key = "";
        var salt = "";
        if (inbox) {
            key = txt.split("=")[0];
        } else {
            salt = txt.value ? txt.value.split("=")[0] : txt.split("=")[0];
            key = this.hash(this.pass + salt);
        }
        var msg = txt.value ? txt.value.replace((inbox ? key : salt) + "=", "") : txt.replace((inbox ? key : salt) + "=", "");

        var desAes = this.decryptAES(msg, key);
        if (desAes.includes(";base64,")) {
            return desAes;
        }

        var enigmaConf = desAes.split("//");
        if (enigmaConf.length > 8) {

            this.code = [enigmaConf[0], enigmaConf[1], enigmaConf[2]];

            this.plugboard = JSON.parse(enigmaConf[3]);
            this.greek = enigmaConf[4];
            this.rotor1 = enigmaConf[5];
            this.rotor2 = enigmaConf[6];
            this.rotor3 = enigmaConf[7];
            this.reflector = enigmaConf[8];
            var res = this.rotorSchlusselmaschineDekodierung(enigmaConf.slice(9, enigmaConf.length).join("//"));
            return res;
        } else {
            return txt.value ? txt.value : txt;
        }
    }



}


module.exports = EncryptionService;