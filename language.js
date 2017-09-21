/*
 * Created by John Dalsgaard, Dalsgaard Data A/S, www.dalsgaard-data.eu
 * 
 * Put this code in lib/language.js and add the following code to alloy.js
 * 
  		// Use our customized implementation of L()
  		function L(key){
  			return require('language').getString(key);
  		}
 * 
 * NB! You will not be able to replace the messages from app.xml (for e.g. system messages to allow access to camera, position, etc.)
 * 
 * You cannot read the i18n files from their original location - so using a small alloy.jmk file (placed in the root of /app - next to alloy.js) you can automate
 * bringing your changes to the i18n files across to /app/assets/i18n and make them available :-)
 * 
	// Automate putting your i18n files into the /app/assets/i18n directory to make them available to your code.
	// Will copy directories and files every time you build the app.
  	task("pre:load", function(event,logger) {
		var path = require('path'),
			wrench = require('wrench');
		wrench.copyDirSyncRecursive(path.join(event.dir.project, 'app/i18n'), path.join(event.dir.project, 'app/assets/i18n'));
	});
 *
 */
const USER_LANGUAGE = 'user-selected-language';
const DEAULT_LANGUAGE = 'en';
const KNOWN_LANGUAGES = [DEAULT_LANGUAGE,'da','de'];
//const XREF_LANGUAGES = {};			// No cross mappings mappings... (comment in/out for your needs)
const XREF_LANGUAGES = {'no' : 'da',	// for Norwegian users set to Danish - and so forth...
						'se' : 'da',
						'pl' : 'de'};
var lang = null;
var translations = null;

function getLanguage(){
	return lang;
}
function setLanguage(v){
	if(v){
		var xlang = lang;
		var v = v.toLowerCase();
		var reason = '';
		if(KNOWN_LANGUAGES.indexOf(v) > -1){
			lang = v;
			if(ENV_DEV) console.info('language.setLanguage: ' + lang);
		}else if(XREF_LANGUAGES[v]){
			// Allow some predefined mappings...
			lang = XREF_LANGUAGES[v];
			if(ENV_DEV) console.info('language.setLanguage: ' + lang + ' (from related language: ' + v + ')');
		}else{
			lang = DEAULT_LANGUAGE;
			if(ENV_DEV) console.info('language.setLanguage: ' + lang + ' (default - as: \'' + v + '\' is not supported)');
		}
		Ti.App.Properties.setString(USER_LANGUAGE, lang);
		if(xlang && xlang !== lang){
			loadLanguage();
		}
	} 
}
function getString(key,hint){
	if(translations){
		return translations[key] || (hint || key);
	}else{
		return hint ? Ti.Locale.getString(key,hint) : Ti.Locale.getString(key);
	}
}
function disable(){
	if(ENV_DEV) console.info('language.setLanguage: disable module --> use phone\'s locale: ' + Ti.Locale.currentLanguage);
	Ti.App.Properties.removeProperty(USER_LANGUAGE);
	lang = null;
	translations = null;
}

function loadLanguage(){
	translations = null;
	var langFile = 'i18n/' + lang + '/strings.xml';
	var file = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory,langFile);
	if(file.exists()){
		try {
			var doc = Ti.XML.parseString(file.read().toString());
			if(doc){
			    var nodes = doc.getElementsByTagName('string');
			    translations = {};
				for (var i = 0; i < nodes.length; i++) {
					translations[nodes.item(i).getAttribute('name')] = nodes.item(i).textContent;
					if(i<5){
						console.log(i + '. ' + nodes.item(i).getAttribute('name') + '=' + nodes.item(i).textContent);
					}
				}
				if(ENV_DEV) console.info('language.loadLanguage: Read ' + nodes.length + ' translations for: ' + lang);
			}
		} catch(e){
			 /* ignore any XML errors */
			if(ENV_DEV) console.error('language.loadLanguage: Errors in XML file: ' + JSON.stringify(e));
		}
	}
}

// Init using self executing function
(function (){
	if(ENV_DEV) console.info('language: init...');
	lang = Ti.App.Properties.getString(USER_LANGUAGE);
	if(!lang){
		if(ENV_DEV) console.info('language: set language from phone\'s locale: ' + Ti.Locale.currentLanguage);
		setLanguage((Ti.Locale.currentLanguage || '').substr(0,2));
	}
	loadLanguage();
})();

exports.getString = getString;
exports.getLanguage = getLanguage;
exports.setLanguage = setLanguage;
exports.disable = disable;
