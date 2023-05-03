'use strict';

// Content script file will run in the context of web page.
// With content script you can manipulate the web pages using
// Document Object Model (DOM).
// You can also pass information to the parent extension.

// We execute this script by making an entry in manifest.json file
// under `content_scripts` property

// For more information on Content Scripts,
// See https://developer.chrome.com/extensions/content_scripts

// Log `title` of current active web page
const pageTitle = document.head.getElementsByTagName('title')[0].innerHTML;
console.log(
  `Page title is: '${pageTitle}' - evaluated by Chrome extension's 'contentScript.js' file`
);

async function post(url = '', data = {}) {
  var formBody = [];
  for (var property in data) {
    var encodedKey = encodeURIComponent(property);
    var encodedValue = encodeURIComponent(data[property]);
    formBody.push(encodedKey + "=" + encodedValue);
  }
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: formBody
  });
  return response.json();
}
let pngUrl = Array.from(document.querySelectorAll("a")).map(n => n.href).filter(href => href.includes("viewGamePGN"))[0];

const response = fetch(pngUrl)
.then(response=>response.text())
.then(
  response => {
    let importUrl = "https://lichess.org/api/import";
    let req = { pgn: response };
    post(importUrl, req)
      .then((response) => {
        // Open the page on a new tab
        let url = response["url"] ? response["url"] : "";
        if (url) {
          let lichessPage = window.open(url,"_self");
        } else alert("Could not import game");
    
      }).catch((e) => {
        alert("Error getting response from lichess.org");
        throw new Error("Response error");
      });
  }
);
