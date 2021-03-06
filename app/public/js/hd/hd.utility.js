/**
 * HD-keret Utility
 *
 * @description Alapvető segédfüggvények
 * @requires -
 */

'use strict';

var HD = (typeof global !== 'undefined' ? global.HD : window.HD) || {};

/**
 * Általános műveletek és adatok
 * @type {Object}
 */
HD.Misc = {

    /**
     * Speciális billentyűk
     * @type {Object}
     */
    keys : {
        ALT : 18, BACKSPACE : 8, CAPS_LOCK : 20, COMMA : 188, CTRL : 17, DELETE : 46, DOWN : 40, END : 35, ENTER : 13,
        ESC : 27, HOME : 36, INSERT : 45, LEFT : 37, NUM_LOCK : 144, NUMPAD_ADD : 107, NUMPAD_DECIMAL : 110,
        NUMPAD_DIVIDE : 111, NUMPAD_ENTER : 108, NUMPAD_MULTIPLY : 106, NUMPAD_SUBTRACT : 109, PAGE_DOWN : 34,
        PAGE_UP : 33, PAUSE : 19, PERIOD : 190, RIGHT : 39, RIGHT_CLICK : 93, SCROLL_LOCK : 145, SHIFT : 16, SPACE : 32,
        TAB : 9, UP : 38, WINDOWS : 91
    },

    /**
     * Alfanumerikus karakterek
     * @type {Object}
     */
    letters : {
        'a' : 65, 'b' : 66, 'c' : 67, 'd' : 68, 'e' : 69, 'f' : 70, 'g' : 71, 'h' : 72, 'i' : 73,
        'j' : 74, 'k' : 75, 'l' : 76, 'm' : 77, 'n' : 78, 'o' : 79, 'p' : 80, 'q' : 81, 'r' : 82,
        's' : 83, 't' : 84, 'u' : 85, 'v' : 86, 'w' : 87, 'x' : 88, 'y' : 89, 'z' : 90,
        '0' : 48, '1' : 49, '2' : 50, '3' : 51, '4' : 52, '5' : 53, '6' : 54, '7' : 55, '8' : 56, '9' : 57
    },

    /**
     * Értékadásra használt switch szerkezetet helyettesítő függvény
     * @param {*} variable - változó
     * @param {Object} relations - változó különböző értékeihez rendelt visszatérési értékek
     * @param {*} [defaultValue=null] - alapértelmezett érték (default)
     * @returns {*}
     * @example
     *  control = HD.Misc.switching(key, {
     *      'W' : 'accelerate',
     *      'A' : 'turnLeft',
     *      'S' : 'brake',
     *      'D' : 'turnRight'
     *  }, null);
     */
    switching : function(variable, relations, defaultValue = null){
        let index;
        for (index in relations){
            if (variable === index){
                return relations[index];
            }
        }
        return defaultValue;
    },

    /**
     * Változó deklaráltságának ellenőrzése
     * @param {*} param - változó
     * @returns {boolean} true ha deklarált
     */
    defined : function(param){
        return typeof param !== 'undefined';
    },

    /**
     * Változó deklarálása ha nem deklarált
     * @param {*} param - változó
     * @param {*} value - alapértelmezett érték
     * @returns {*} új érték
     */
    define : function(param, value){
        return typeof param !== 'undefined' ? param : value;
    }

};

/**
 * Szám-műveletek (Number objektum kiegészítései)
 * @type {Object}
 */
HD.Number = {

    /**
     * Egyedi (pszeudo) id generálása
     * @returns {Number}
     */
    getUniqueId : function(){
        return Number(Date.now().toString().substr(6) + Math.floor(Math.random() * 1000).toString());
    },

    /**
     * Szám elejének feltöltése nullákkal
     * @param {Number} num - szám
     * @param {Number} len - kívánt hossz
     * @returns {String} nullákkal feltöltött szám
     */
    fillZero : function(num, len){
        let numStr = '';
        const originalNumStr = num.toString();
        const originalLen = originalNumStr.length;
        for (let n = originalLen; n < len; n++){
            numStr += '0';
        }
        return numStr + originalNumStr;
    },

    /**
     * Fájlméret kiírása
     * @param {Number} size - méret bájtokban
     * @param {Number} [precision=2] - pontosság (tizedesjegyek száma)
     * @param {Number} [prefixLimit=0.5] - ha ennél kisebb, az alacsonyabb prefixum használata
     * @returns {String} olvasható érték
     */
    displaySize : function(size, precision = 2, prefixLimit = 0.5){
        let n = 1.0;
        let k, i;
        const pref = ['', '', 'k', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'];
        for (k = 0; k < precision; k++){
            n *= 10.0;
        }
        for (i = 1; i < 9; i++){
            if (size < Math.pow(1024, i) * prefixLimit){
                return `${Math.round((size / Math.pow(1024.0, i - 1)) * n) / n} ${pref[i]}B`;
            }
        }
        return `${Math.round((size / Math.pow(1024.0, i - 1)) * n) / n} ${pref[i]}B`;
    },

    /**
     * Fájlméret visszafejtése (a displaysize inverze)
     * Pl.: '10.5 MB', '1000kB', '3 400 000 B', '2,7 GB'
     * @param {String} size - méret olvasható formában
     * @returns {Number} értéke bájtban
     */
    recoverSize : function(size){
        let numberpart, multiply, offset, prefixum, index, n;
        let q = '';
        const pref = {
            none : 1,
            k : 1024,
            M : 1048576,
            G : 1073741824,
            T : 1099511627776
        };
        for (n = size.length - 1; n >= 0; n--){
            if (/[0-9]/.test(size[n])){
                n++;
                break;
            }
            q += size[n];
        }
        if (n === 0){
            // nincs numerikus karakter
            numberpart = 0.0;
        }
        else {
            if (q.length === 0){
                offset = size.length;
            }
            else {
                offset = size.length - q.length;
            }
            numberpart = size.substr(0, offset);
            if (size.indexOf('.') === -1 && size.indexOf(',') > -1){
                numberpart = numberpart.replace(',', '.');
            }
            numberpart = numberpart.replace(' ', '');
        }
        q = this.reverse(q).toLowerCase().trim();
        if (q.length === 2){
            prefixum = q[0];
            if (pref.hasOwnProperty(prefixum)){
                for (index in pref){
                    if (index === prefixum){
                        multiply = pref[index];
                        break;
                    }
                }
            }
            else if (pref.hasOwnProperty(prefixum.toUpperCase())){
                for (index in pref){
                    if (index === prefixum.toUpperCase()){
                        multiply = pref[index];
                        break;
                    }
                }
            }
            else {
                // nincs ilyen prefixum definiálva
                multiply = 0.0;
            }
        }
        else if (q.length === 1){
            // nincs prefixum
            multiply = pref.none;
        }
        else {
            // nincs mértékegység megadva vagy túl hosszú
            multiply = 0.0;
        }
        return parseFloat(multiply) * parseFloat(numberpart);
    }

};

/**
 * Karakterlánc műveletek (String objektum kiegészítései)
 * @type {Object}
 */
HD.String = {

    /**
     * Első karakter nagybetűssé alakítása
     * @param {String} str
     * @returns {String}
     */
    ucFirst : function(str){
        return str[0].toUpperCase() + str.slice(1);
    },

    /**
     * A php urlencode() függvényével egyenértékű
     * @param {String} str
     * @returns {String}
     */
    urlEncode : function(str){
        str = str.toString();
        return encodeURIComponent(str)
            .replace(/!/g, '%21')
            .replace(/'/g, '%27')
            .replace(/\(/g, '%28')
            .replace(/\)/g, '%29')
            .replace(/\*/g, '%2A')
            .replace(/%20/g, '+');
    },

    /**
     * Karakterlánc megfordítása
     * @param {String} str - karakterlánc
     * @returns {String} karakterlánc visszafelé
     */
    reverse : function(str){
        const splitext = str.split('');
        const revertext = splitext.reverse();
        return revertext.join('');
    },

    /**
     * Előtag eltávolítása a karakterláncról
     * @param {String} str - karakterlánc
     * @param {String} separator - előtag kapcsoló karakter
     * @returns {String} maradék karakterlánc
     */
    removePrefix : function(str, separator){
        const arr = str.split(separator);
        arr.shift();
        return arr.join(separator);
    },

    /**
     * E-mail cím ellenőrzés
     * @param {String} email - e-mail cím
     * @returns {Boolean} true, ha jó a formátum
     */
    validateEmail : function(email){
        return /^[a-z0-9._-]+@[a-z0-9._-]+\.[a-z]+$/.test(email);
    },

    /**
     * Karakterlánc átalakítása RegExp objektummá
     * @param {String} str - regexp literál pl.: '/x/gi'
     * @returns {RegExp}
     */
    createRegExp : function(str){
        const pattern = str.replace(/^\/(.*)\/[gimuy]*$/, '$1');
        const flags = str.replace(/^\/.*\/([gimuy]*)$/, '$1');
        return new RegExp(pattern, flags);
    },

    /**
     * Ékezetes betűk (magyar) és írásjelek kiszedése (pl. "Űkuöí Owá-43" -> "Ukuoi_Owa_43")
     * az írásjeleket az exceptions-ben lévő karakterek kivételével a replace-re cseréli
     * @param {String} str - átalakítandó karakterlánc
     * @param {String} [replace='_'] - karakterlánc, amire az írásjelek cserélődnek
     * @param {Object} [options] - egyéb beállítások
     * @returns {String} átalakított karakterlánc
     * TODO: tesztelés
     */
    canonic : function(str, replace = '_', options = {}){
        options = Object.assign({
            exceptions : '',
            tolower : false,
            trim : true,
            chars : 'a-zA-Z0-9'
        }, options);

        let n;
        let canonic = '';
        let second;

        [...str].forEach(function(c){
            canonic += HD.Misc.switching(c, {
                'á' : 'a', 'é' : 'e', 'í' : 'i', 'ó' : 'o', 'ö' : 'o', 'ő' : 'o', 'ú' : 'u', 'ü' : 'u', 'ű' : 'u',
                'Á' : 'A', 'É' : 'E', 'Í' : 'I', 'Ó' : 'O', 'Ö' : 'O', 'Ő' : 'O', 'Ú' : 'U', 'Ü' : 'U', 'Ű' : 'U'
            }, c);
        });

        if (options.trim) canonic = canonic.trim();
        canonic = canonic.replace(new RegExp(`/[^${options.chars}${options.exceptions}]+/`), replace);
        if (options.tolower) canonic = canonic.toLowerCase();
        return canonic;
    },

    /**
     * Megadott hosszúságú karakterlánc generálása (pl jelszóhoz)
     * @param {Number} len - hossz
     * @param {String} [type=1aA] - használható karaktertípusok
     * @returns {String} generált karakterlánc
     * TODO: tesztelés
     */
    generate : function(len, type = '1aA'){
        let n;
        let chars = '';
        let ret = '';
        const nums = '0123456789';
        const lowchars = 'abcdefghijklmnopqrstuvwxyz';
        const upchars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const signs = '\'"+!%/=()~^`$<>#&@{}[]\\|,.-?:_;*';

        if (type.indexOf('1') > -1){
            chars += nums;
        }
        if (type.indexOf('a') > -1){
            chars += lowchars;
        }
        if (type.indexOf('A') > -1){
            chars += upchars;
        }
        if (type.indexOf('s') > -1){
            chars += signs;
        }

        for (n = 0; n < len; n++){
            ret += chars[Math.floor(Math.random() * chars.length)];
        }
        return ret;
    },

    /**
     * Jelszó kódolása
     * @param {String} pwd - kódolandó jelszó
     * @param {String} [salt] - só
     * @returns {String} kódolt jelszó
     * TODO: sha1 függvény
     * TODO: tesztelés
     */
    hash : function(pwd, salt){
        const sha1 = (s) => s;
        const PROJECT_NAME = '';

        if (typeof salt === 'undefined'){
            pwd = sha1(pwd);
        }
        else {
            let i;
            let salt2 = '';
            const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const salt1 = salt;
            const salt2_original = PROJECT_NAME;
            for (i = 0; i < salt2_original.length; i++){
                salt2 += chars[chars.indexOf(salt2_original[i]) + 1 % chars.length];
            }
            pwd = sha1(salt1 + pwd + salt2);
        }
        return pwd;
    }

};

/**
 * Függvény műveletek
 * @type {Object}
 */
HD.Function = {

    /**
     * Alapértelmezett paraméterérték megadása függvényben
     * @param {*} param - paraméter
     * @param {*} value - alapértelmezett érték
     * @returns {*} ezt kell értékül adni a paraméternek
     * @example
     *  par = HD.Function.param(par, 0);
     */
    param : function(param, value){
        if (typeof param === 'undefined'){
            return value;
        }
        else {
            return param;
        }
    },

    /**
     * Alapértelmezett paraméterértékek megadása függvényben
     * @param {Object} params - argumentumok adatai
     * @returns {Array} paraméterek értékei
     * @example
     *  HD.Function.multiParam({
     *      sql      : [sql, 'string'],
     *      binds    : [binds, 'object', {}],
     *      run      : [run, 'boolean', true],
     *      preserve : [preserve, 'boolean', false],
     *      callback : [callback, 'function']
     *  });
     *  név : [érték, típus, alapértelmezett érték]
     */
    multiParam : function(params){
        const newParams = [];
        let n;
        let currentParamNum = 0;
        for (n in params){
            if (typeof params[n][0] !== params[n][1] && typeof params[n][2] !== 'undefined'){
                newParams[n] = params[2];
            }
            else {
                currentParamNum++;
            }
        }
        return newParams;
    }

};

/**
 * Tömb műveletek (Array objektum kiegészítései)
 * @type {Object}
 */
HD.Array = {

    /**
     * A PHP in_array() függvénye (indexOf boolean változata)
     * @param {*} needle - keresendő elem
     * @param {Array} haystack - tömb
     * @returns {Boolean}
     */
    inArray : function(needle, haystack){
        let len, i;
        if (haystack){
            if (Array.prototype.indexOf){
                return (Array.prototype.indexOf.call(haystack, needle) > -1);
            }
            len = haystack.length;
            for (i = 0; i < len; i++){
                if (i in haystack && haystack[i] === needle){
                    return true;
                }
            }
        }
        return false;
    },

    /**
     * Általános indexOf
     * @param {Object} val - keresendő elem
     * @param {Array} arr - tömb
     * @param {Function} comparer - összehasonlító függvény
     * @returns {Number}
     */
    indexOf : function(val, arr, comparer){
        let len, i;
        for (i = 0, len = arr.length; i < len; ++i){
            if (i in arr && comparer(arr[i], val)){
                return i;
            }
        }
        return -1;
    },

    /**
     * Hozzáadás tömbhöz, ha még nem tartalmazza az adott értéket
     * @param {Array} arr - tömb
     * @param {*} val - érték
     * @returns {Array} módosított tömb
     */
    addByVal : function(arr, val){
        if (arr.indexOf(val) === -1){
            arr.push(val);
        }
        return arr;
    },

    /**
     * Érték eltávolítása a tömbből
     * @param {Array} arr - tömb
     * @param {*} val - érték
     * @returns {Array} módosított tömb
     */
    removeByVal : function(arr, val){
        const index = arr.indexOf(val);
        if (index > -1){
            arr.slice(index, 1);
        }
        return arr;
    },

    /**
     * 2D-s tömb "elforgatása"
     * @param {Array} arr - tömb
     * @returns {Array}
     * @example
     *  [[1,2],[3,4],[5,6]] -> [[1,3,5],[2,4,6]]
     */
    rotate : function(arr){
        let i, j;
        const rotated = [];
        for (i = 0; i < arr[0].length; i++){
            rotated[i] = [];
            for (j = 0; j < arr.length; j++){
                rotated[i][j] = arr[j][i];
            }
        }
        return rotated;
    }

};

/**
 * Objektum műveletek (Object objektum kiegészítései)
 * @type {Object}
 */
HD.Object = {

    /**
     * Objektum iterálhatóvá tétele
     * @param {Object} obj
     * @returns {Object}
     */
    iterable : function(obj){
        obj[Symbol.iterator] = function*(){
            for (const i in obj){
                yield obj[i];
            }
        };
        return obj;
    },

    /**
     * Egyszintű keresés objektumban callback függvény alapján
     * @param {Object} obj - haystack
     * @param {Function} callback - keresendő elemre truthy értéket kell adnia
     * @returns {*} keresett elem
     * @desc callback argumentumai:
     *   param {*} - objektum egy eleme
     *   param {String} - objektum elemének kulcsa
     *   param {Object} - az objektum
     */
    search : function(obj, callback){
        for (const prop in obj){
            if (callback(obj[prop], prop, obj)){
                return obj[prop];
            }
        }
    },

    /**
     * Objektumok közti részleges egyezés vizsgálata
     * @param {Object} partialObject - keresendő rész
     * @param {Object} fullObject - keresett objektum
     * @returns {Boolean} a keresett objektum tartalmazza a keresendő részt
     */
    partialMatch : function(partialObject, fullObject){
        const properties = Object.keys(fullObject);
        for (let n = 0; n < properties.length; n++){
            if (typeof partialObject[properties[n]] !== 'undefined' &&
                partialObject[properties[n]] !== fullObject[properties[n]]){
                return false;
            }
        }
        return true;
    }

};

if (typeof exports !== 'undefined'){
    exports.Misc = HD.Misc;
    exports.Number = HD.Number;
    exports.String = HD.String;
    exports.Function = HD.Function;
    exports.Array = HD.Array;
    exports.Object = HD.Object;
}
