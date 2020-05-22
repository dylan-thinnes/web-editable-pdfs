/* Copyright 2017 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

"use strict";

// getuid functions
var IDX=36, HEX='';
while (IDX--) HEX += IDX.toString(36);
HEX = HEX.split("").reverse().join("");

const makeuid = (len, digits) => {
	var str=''
    len = len || 11;
    digits = digits || 36;
	while (len--) str += HEX[Math.random() * digits | 0];
	return str;
}

var { PDFHexString, PDFName, PDFRef, PDFRawStream } = PDFLib;

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "/pdfjs-dist/build/pdf.worker.js";

//var DEFAULT_URL = "../../test/pdfs/f1040.pdf";
//var DEFAULT_URL = "../../test/pdfs/dnd.pdf";
//var DEFAULT_URL = "../../test/pdfs/dnd-filled.pdf";
var DEFAULT_URL = "/dnd-filled-dump.pdf";
var DEFAULT_SCALE = 1.0;

var container = document.getElementById("pageContainer");

var eventBus = new pdfjsViewer.EventBus();

// Fetch the PDF document from the URL using promises.
var loadingTask = pdfjsLib.getDocument(DEFAULT_URL);
loadingTask.promise.then(async function (doc) {
  console.log(doc);

  // Use a promise to fetch and render the next page.
  var promise = Promise.resolve();

  //for (var i = 1; i <= doc.numPages; i++) {
  var i = 1;
    promise = await promise.then(
      function (pageNum) {
        return doc.getPage(pageNum).then(async function (pdfPage) {
          // Create the page view.
          var pdfPageView = new pdfjsViewer.PDFPageView({
            container: container,
            id: pageNum,
            scale: DEFAULT_SCALE,
            defaultViewport: pdfPage.getViewport({ scale: DEFAULT_SCALE }),
            eventBus: eventBus,
            //annotationLayerFactory: new pdfjsViewer.DefaultAnnotationLayerFactory(),
            textLayerFactory: new pdfjsViewer.DefaultTextLayerFactory(),
            renderInteractiveForms: true,
          });
          console.log(pdfPageView);

          // Associate the actual page with the view and draw it.
          pdfPageView.setPdfPage(pdfPage);
          await pdfPageView.draw();

          var annLayer = document.createElement("div");
          annLayer.className = "annotationLayer";
          pdfPageView.div.appendChild(annLayer);

          var anns = await pdfPage.getAnnotations();
          var params = {
            viewport: pdfPageView.viewport.clone({ dontFlip: true }),
            div: annLayer,
            annotations: anns,
            page: pdfPage,
            renderInteractiveForms: true,
          };
          var updater = () => {
              annLayer.innerHTML = "";
              pdfjsLib.AnnotationLayer.render(params);
          }
          window.params = params;
          window.updater = updater;
          updater();
          pdfPageView.l10n.translate(annLayer);
        });
      }.bind(null, i)
    );

    initInputs();
    bindEvents();
  //}
    
    var { PDFHexString, PDFName, PDFRef, PDFRawStream } = PDFLib;
    var bytes = await doc.getData();
    var pdfDoc = await PDFLib.PDFDocument.load(bytes);
    window.pdfDoc = pdfDoc;
    console.log(pdfDoc);
    var value = pdfDoc.context.lookup(PDFRef.of(61));
    console.log(value);
    console.log(value.get(PDFName.of("V")));

    //var newText = prompt();

    //value.set(PDFName.of("V"), PDFHexString.fromText(newText));
    ////value.delete(PDFName.of("AP"));

    //var appRef = value.get(PDFName.of("AP"))
    //if (appRef == null) return;
    //appRef = appRef.get(PDFName.of("N"));
    //if (appRef == null) return;
    //var appearance = pdfDoc.context.lookup(appRef);
    //var str = appearance.getContentsString();
    //var escapedNewText = `(${newText.replace("(","\\(").replace(")","\\)")})`
    //console.log(appearance.getContentsString());
    //str = str.replace(/\(([^)]|\\\))*\)/, escapedNewText);
    //appearance.contents = toBuffer(str);
    //console.log(appearance);
    //console.log(appearance.getContentsString());

    //save(pdfDoc);

    //var { drawText, rgb, degrees, PDFOperator, PDFOperatorNames, asPDFName, PDFContentStream, beginMarkedContent, endMarkedContent, pushGraphicsState, popGraphicsState } = PDFLib;

    //var beginMarkedContent = (tag) =>
    //    PDFOperator.of(PDFOperatorNames.BeginMarkedContent, [asPDFName(tag)]);
    //var endMarkedContent = () => PDFOperator.of(PDFOperatorNames.EndMarkedContent);

    //var operators = [
    //    beginMarkedContent("Tx"),
    //    pushGraphicsState(),
    //    ...drawText("HELLO", {
    //        color: rgb(0, 0, 0),
    //        font: "F0",
    //        size: 14.0,
    //        rotate: degrees(0),
    //        xSkew: degrees(0),
    //        ySkew: degrees(0),
    //        x,
    //        y,
    //    }),
    //    popGraphicsState(),
    //    endMarkedContent(),
    //];

    //var stream = PDFContentStream.of(subfield.dict, operators);
    //pdfDoc.context.register(subfieldRef, stream);

    //save(pdfDoc);
});

function toBuffer (str) {
    var arr = new Uint8Array(str.length);
    PDFLib.copyStringIntoBuffer(str, arr, 0);
    return arr;
}

async function save (pdfDoc) {
    var pdfUrl = URL.createObjectURL(
        new Blob([await pdfDoc.save()], { type: 'application/pdf' })
    );
    window.open(pdfUrl, '_blank');
}

function getTextPDFNode (str) {
    if (str == null || str === "") return;
    var node = PDFHexString.fromText(str);
    return node;
}

function getCheckboxPDFNode (obj, changed) {
    var originalValue = obj.lookup(PDFName.of("V"))
                     || obj.lookup(PDFName.of("AS"))
                     || PDFName.of("Off");

    // If there wasn't a change, abort by returning null
    if (!changed) return null;

    // Otherwise, retrieve the first AP value that isn't the dict
    var dict = obj.lookup(PDFName.of("AP")).lookup(PDFName.of("D"));
    var keys = [...dict.keys()];
    var neq = keys.filter(x => x != originalValue);
    console.log(obj, originalValue, keys, neq);
    return (neq.length == 0 ? PDFName.of("Off") : neq[0]);
}

const [TEXT, CHECKBOX] = [0, 1];

function initInputs (el) {
    annEls().forEach(initInput);
}

function initInput (el) {
    if (el.children.length == 0) return;
    var ch = el.children[0];
    if (ch.nodeName == "INPUT" && (ch.type == "radio" || ch.type == "checkbox")) {
        ch.setAttribute("data-orig-value", ch.checked);
    }
}

function getInputFromAnn (pdf, el) {
    var id = parseInt(el.getAttribute("data-annotation-id"));
    if (isNaN(id)) return;

    var obj = pdf.context.lookup(PDFRef.of(id));
    if (obj == null) return;

    if (el.children.length == 0) return;
    var ch = el.children[0];
    if (ch.nodeName != "INPUT" && ch.nodeName != "TEXTAREA") return;

    var node;
    if ((ch.nodeName == "INPUT" && ch.type == "text") || (ch.nodeName == "TEXTAREA")) {
        node = getTextPDFNode(ch.value);
        if (node == null) return;
        obj.delete(PDFName.of("AP"));
    } else if (ch.nodeName == "INPUT" && (ch.type == "radio" || ch.type == "checkbox")) {
        var changed = ch.checked != (ch.getAttribute("data-orig-value") == "true");
        console.log(`changed ${id}`, ch, changed);
        node = getCheckboxPDFNode(obj, changed);
        if (node == null) return;
        obj.set(PDFName.of("AS"), node);
    }

    console.log("Setting ", id, node);
    obj.set(PDFName.of("V"), node);
}

function annEls () {
    return [
        ...document.getElementsByClassName("textWidgetAnnotation"),
        ...document.getElementsByClassName("buttonWidgetAnnotation")
    ];
}

function annSection (id) {
    return document.querySelector(`[data-annotation-id="${id}R"]`);
}
function annInput (id) {
    var section = annSection(id);
    return section && section.children.length > 0 ? section.children[0] : null;
}

function writeForms (pdf) {
    return annEls().map(el => {
        getInputFromAnn(pdf, el);
    }).filter(x => x == null);
}

function bindEvents () {
    annEls().map(el => el.children[0]).forEach(el => {
        el.addEventListener("focus", sendLocalFocus);
        el.addEventListener("blur",  sendLocalBlur);
        el.addEventListener("input", sendLocalChange);
    });
}

var self = makeuid();
var users = {};
function createUser ({ id, name }) {
    users[id] = {
        id,
        name,
        currTargetRef: null,
    };

    return users[id];
}

function getUser (id) {
    var user = users[id];
    if (user == null) {
        return createUser({ id, name: id });
    } else {
        return user;
    }
}

var conn = io("/");
conn.on("event", e => {
    console.log("event", e);
    handleRemoteEvent(e);
});
document.getElementById("download").addEventListener("click", e => {
    writeForms(pdfDoc);
    save(pdfDoc);
})

function initialize (args) {
    Object.assign(users, args.users);
}

function handleRemoteEvent (data) {
    console.log(data);
    var { origin, type, data } = data;
    var originUser = getUser(origin);
    if (originUser == null) return;

    if (type == "focus") {
        handleRemoteFocus(originUser, data);
    } else if (type == "change") {
        handleRemoteChange(originUser, data);
    } else {
        throw new Error(`Unrecognized remote event of type ${type}.`);
    }
}

function handleRemoteFocus (originUser, { newTargetRef }) {
    console.log(originUser.currTargetRef)
    if (originUser.currTargetRef != null) {
        var prevTarget = annInput(originUser.currTargetRef);
        prevTarget.style.border = null;
        prevTarget.removeAttribute("disabled");
    }

    originUser.currTargetRef = newTargetRef;
    console.log(originUser.currTargetRef)

    if (originUser.currTargetRef != null) {
        var newTarget = annInput(originUser.currTargetRef);
        var color = uniqolor(originUser.id, {
            lightness: 75,
            saturation: 100,
        }).color;
        newTarget.style.border = `1px solid ${color}`;
        newTarget.setAttribute("disabled", true);
    }
}

function handleRemoteChange (originUser, { newValue }) {
    if (originUser.currTargetRef != null) {
        var currTarget = annInput(originUser.currTargetRef);
        if (currTarget.type == "checkbox" || currTarget.type == "radio") {
            currTarget.checked = newValue;
        } else {
            currTarget.value = newValue;
        }
    }
}

function sendLocalFocus (e) {
    console.log("sending local focus", e);
    var newTargetRef = parseInt(e.target.parentNode.getAttribute("data-annotation-id"));
    if (isNaN(newTargetRef)) return;

    conn.emit("event", {
        origin: self,
        type: "focus",
        data: { newTargetRef }
    });
}

function sendLocalBlur (e) {
    conn.emit("event", {
        origin: self,
        type: "focus",
        data: { newTargetRef: null }
    });
}

function sendLocalChange (e) {
    console.log("sending local change", e);
    var currTarget = e.target;
    var newValue = (currTarget.type == "checkbox" || currTarget.type == "radio")
                 ? currTarget.checked : currTarget.value;

    conn.emit("event", {
        origin: self,
        type: "change",
        data: { newValue }
    });
}
