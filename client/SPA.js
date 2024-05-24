function waitForElm(node, selector) {
  return new Promise((resolve) => {
    /*if (node.querySelector(selector)) {
      return resolve(node.querySelector(selector));
    }*/

    const observer = new MutationObserver((mutations) => {
      if (node.querySelector(selector)) {
        observer.disconnect();
        resolve(node.querySelector(selector));
      }
    });

    observer.observe(node, {
      childList: true,
      subtree: true,
    });
  });
}

function blobToBase64(blob) {
  return new Promise((resolve, _) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

function parseAndDeleteExternalLinks(node) {
  if (!node.href.includes("plan-dynamique.irigo.fr")) {
    node.href = "/";
    node.target = "";
  }
}

function my_print(src) {
  let statusDetail = Kiosk.DocumentPrinting.statusDetail;
  console.log(statusDetail);

  let rawPDFBase64 = fetch(src).then((response) => {
    response.blob().then((blob) => {
      blobToBase64(blob).then((base64) => {
        return base64;
      });
    });
  });
  if (typeof Kiosk !== "undefined") {
    Kiosk.Session.close({
      information:
        "Nouvelle session utilisateur / Démarrage du scénario de paiement",
    });
    let printingSources = Kiosk.DocumentPrinting.sourcesList;
    Kiosk.DocumentPrinting.addEventListener("rawPdfPrint", onRawPdfPrint);

    fetch(src).then((response) => {
      response.blob().then((blob) => {
        blobToBase64(blob).then((base64) => {
          console.log(base64.split(",")[1]);
          Kiosk.DocumentPrinting.printRawPdf({
            raw: base64.split(",")[1],
            
          });
        });
      });
    });

    //});

    function onRawPdfPrint(e) {
      console.log(e.data.dataType);
      switch (e.data.dataType) {
        case "RawPdfPrinted":
          console.log("Document imprimé");
          break;
        case "RawPdfPrintError":
          console.error(e.data.code + ": " + e.data.description);
          break;
      }
    }
  } else if (window.print) {
    window.frames["pdf-embed"].print();
  }
}

function observePrintButton() {
  waitForElm(document, "[data-pdf]").then(function (node) {
    node.onclick = function (e) {
      my_print(
        node
          .getAttribute("data-pdf")
          .replaceAll("https://borne.irigo.fr", ""),
      );
    };
    observePrintButton();
  });
}

function observeEmailInput() {
  waitForElm(document, "[type=email]").then(function (node) {
    node.onclick = function (e) {
      Kiosk.OnscreenKbd.show("email");
    };
    observeEmailInput();
  });
}

observePrintButton();
observeEmailInput();