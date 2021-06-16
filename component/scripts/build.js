var AdmZip = require('adm-zip');

// creating archives
var zip = new AdmZip();

zip.addLocalFolder("./META-INF/", "/META-INF/");
zip.addLocalFolder("./dist/servoy/smartdocumenteditor/", "/dist/servoy/smartdocumenteditor/");
zip.addLocalFolder("./smartdocumenteditor/", "/smartdocumenteditor/");

zip.writeZip("smartdocumenteditor.zip");