import * as JsBarcode from 'jsbarcode';
import { DOMImplementation, XMLSerializer } from 'xmldom';

export const generateBarcode = (data: string) => {
  if (data.length < 2)
    throw new Error('Data for barcode must be longer 2 character');

  const xmlSerializer = new XMLSerializer();
  const document = new DOMImplementation().createDocument(
    'http://www.w3.org/1999/xhtml',
    'html',
    null,
  );

  const svgNode = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  JsBarcode(svgNode, data, {
    xmlDocument: document,
    displayValue: false,
  });

  return xmlSerializer.serializeToString(svgNode);
};
