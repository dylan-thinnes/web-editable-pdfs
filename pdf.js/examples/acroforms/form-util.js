var {
  asPDFName,
  degrees,
  drawText,
  PDFArray,
  PDFContentStream,
  PDFDict,
  PDFDocument,
  PDFFont,
  PDFHexString,
  PDFName,
  PDFNumber,
  PDFString,
  PDFOperator,
  PDFOperatorNames as Ops,
  popGraphicsState,
  pushGraphicsState,
  rgb,
} = PDFLib;

const fillInField = (
  pdfDoc: PDFDocument,
  fieldName: string,
  text: string,
  font: PDFFont
) => {
    const field = findAcroFieldByName(pdfDoc, fieldName);
    if (field) fillAcroTextField(field, text, font);
};

const lockField = (acroField: PDFDict) => {

    const fieldType = acroField.lookup(PDFName.of("FT"));
    if (fieldType === PDFName.of("Tx")) {
      acroField.set(PDFName.of("Ff"), PDFNumber.of(1 << 0 /* Read Only */));
    }
};

const getAcroForm = (pdfDoc: PDFDocument) =>
  pdfDoc.catalog.lookupMaybe(PDFName.of("AcroForm"), PDFDict);

const findAcroFieldByName = (pdfDoc: PDFDocument, name: string) => {
    const acroFields = getAcroFields(pdfDoc);

    return acroFields.find((acroField) => {
      const fieldName = acroField.get(PDFName.of("T"));

      return (
        (fieldName instanceof PDFString || fieldName instanceof PDFHexString) &&
        fieldName.decodeText() === name
      );
    });
};

const fillAcroTextField = (
  acroField: PDFDict,
  text: string,
  font: PDFFont
) => {
    const rect = acroField.lookup(PDFName.of("Rect"), PDFArray);
    const width =
      rect.lookup(2, PDFNumber).value() - rect.lookup(0, PDFNumber).value();
    const height =
      rect.lookup(3, PDFNumber).value() - rect.lookup(1, PDFNumber).value();

    const MK = acroField.lookupMaybe(PDFName.of("MK"), PDFDict);
    const R = MK && MK.lookupMaybe(PDFName.of("R"), PDFNumber);

    const N = singleLineAppearanceStream(font, text, width, height);

    acroField.set(PDFName.of("AP"), acroField.context.obj({ N }));
    acroField.set(PDFName.of("Ff"), PDFNumber.of(1 /* Read Only */));
    acroField.set(PDFName.of("V"), PDFHexString.fromText(text));
};

const getAcroFields = (pdfDoc: PDFDocument): PDFDict[] => {
    const acroForm = getAcroForm(pdfDoc);

    if (!acroForm) return [];

    const fieldRefs = acroForm.lookupMaybe(PDFName.of("Fields"), PDFArray);

    if (!fieldRefs) return [];

    const fields = new Array(fieldRefs.size());
    for (let idx = 0, len = fieldRefs.size(); idx < len; idx++) {
      fields[idx] = fieldRefs.lookup(idx);
    }
    return fields;
};

const beginMarkedContent = (tag: string) =>
  PDFOperator.of(Ops.BeginMarkedContent, [asPDFName(tag)]);

const endMarkedContent = () => PDFOperator.of(Ops.EndMarkedContent);

const singleLineAppearanceStream = (
  font: PDFFont,
  text: string,
  width: number,
  height: number
) => {

    // const size = font.sizeAtHeight(height - 5);
    const size = font.sizeAtHeight(15); // set it to 15 temp for example
    const encodedText = font.encodeText(text);
    const x = 0;
    const y = height - size;

    return textFieldAppearanceStream(
      font,
      size,
      encodedText,
      x,
      y,
      width,
      height
    );
};

const textFieldAppearanceStream = (
  font: PDFFont,
  size: number,
  encodedText: PDFHexString,
  x: number,
  y: number,
  width: number,
  height: number
) => {
    const dict = font.doc.context.obj({
      Type: "XObject",
      Subtype: "Form",
      FormType: 1,
      BBox: [0, 0, width, height],
      Resources: { Font: { F0: font.ref } },
    });

    const operators = [
      beginMarkedContent("Tx"),
      pushGraphicsState(),
      ...drawText(encodedText, {
        color: rgb(0, 0, 0),
        font: "F0",
        size,
        rotate: degrees(0),
        xSkew: degrees(0),
        ySkew: degrees(0),
        x,
        y,
      }),
      popGraphicsState(),
      endMarkedContent(),
    ];

    const stream = PDFContentStream.of(dict, operators);

    return font.doc.context.register(stream);
};
