/**
 * SCORM Parent Window Handler
 * This module handles communication between the SCORM API
 * and a single child iframe, allowing the iframe to call whitelisted SCORM API functions.
 * It automatically initializes the LMS API on load and finishes the session on unload.
 *
 * NOTE: In standalone mode (when index.html doesn't contain an iframe),
 * the React app will handle SCORM initialization directly via ScormDirectClient.
 * This file only handles iframe-based SCORM communication.
 */

var isInitialized = false;
var childWindow = null;
var childOrigin = null;
var isStandaloneMode = false;

// Whitelist of allowed SCORM functions
var allowedFunctions = [
  "doLMSGetValue",
  "doLMSSetValue",
  "doLMSCommit",
  "doLMSGetLastError",
  "doLMSGetErrorString",
  "doLMSGetDiagnostic",
  "doLMSFinish",
];

/**
 * Initialize the LMS API
 * @function
 * @name initializeLMS
 */
function initializeLMS() {
  // Skip initialization in standalone mode (React app handles it)
  if (isStandaloneMode) {
    console.log("Standalone mode detected - skipping init.js LMS initialization");
    return;
  }

  if (!isInitialized) {
    isInitialized = doLMSInitialize() === "true";
    if (isInitialized) {
      console.log("LMS API initialized successfully (iframe mode)");
    } else {
      console.error("Failed to initialize LMS API");
    }
  }
}

/**
 * Finish the LMS session
 * @function
 * @name finishLMS
 */
function finishLMS() {
  // Skip finish in standalone mode (React app handles it)
  if (isStandaloneMode) {
    return;
  }

  if (isInitialized) {
    var result = doLMSFinish();
    if (result === "true") {
      console.log("LMS session finished successfully (iframe mode)");
    } else {
      console.error("Failed to finish LMS session");
    }
    isInitialized = false;
  }
}

/**
 * Handle messages received from the child iframe
 * @function
 * @name handleIframeMessage
 * @param {MessageEvent} event - The message event from the iframe
 */
function handleIframeMessage(event) {
  var data = event.data;

  if (!childWindow || !childOrigin) {
    return;
  }

  if (event.source !== childWindow) {
    return;
  }

  if (event.origin !== childOrigin) {
    return;
  }

  var type = data.type;
  var id = data.id;
  var functionName = data.function;
  var args = data.args || [];

  if (type === "SCORM_CALL") {
    var result;
    if (allowedFunctions.indexOf(functionName) !== -1 && typeof window[functionName] === "function") {
      try {
        result = window[functionName].apply(null, args);
      } catch (error) {
        console.error("Error calling SCORM function:", { functionName }, error);
        result = null;
      }
    } else {
      console.error("Unauthorized or unknown SCORM function call: " + functionName);
      result = null;
    }

    childWindow.postMessage(
      {
        type: "SCORM_RESPONSE",
        id: id,
        result: result,
      },
      childOrigin,
    );
  }
}

/**
 * Initialize communication with the child iframe
 * @function
 * @name initializeCommunication
 * @param {Window} iframeWindow - The Window object of the child iframe
 * @param {string} iframeOrigin - The origin of the child iframe
 */
function initializeCommunication(iframeWindow, iframeOrigin) {
  childWindow = iframeWindow;
  childOrigin = iframeOrigin;
}

window.addEventListener("message", handleIframeMessage);

window.addEventListener("load", function () {
  var iframe = document.querySelector("iframe");
  if (!iframe) {
    isStandaloneMode = true;
  } else {
    initializeLMS();

    var iframeOrigin = new URL(iframe.src).origin;

    iframe.onload = function () {
      initializeCommunication(iframe.contentWindow, iframeOrigin);
    };

    if (iframe.contentWindow) {
      initializeCommunication(iframe.contentWindow, iframeOrigin);
    }
  }
});

window.addEventListener("beforeunload", finishLMS);

window.initializeCommunication = initializeCommunication;
