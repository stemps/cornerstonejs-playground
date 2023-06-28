"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var cornerstone = require("@cornerstonejs/core");
var canvas = document.createElement('canvas');
var lastImageIdDrawn;
// Todo: this loader should exist in a separate package in the same monorepo
/**
 * creates a cornerstone Image object for the specified Image and imageId
 *
 * @param image - An Image
 * @param imageId - the imageId for this image
 * @returns Cornerstone Image Object
 */
function createImage(image, imageId) {
    // extract the attributes we need
    var rows = image.naturalHeight;
    var columns = image.naturalWidth;
    function getPixelData() {
        var imageData = getImageData();
        return imageData.data;
    }
    function getImageData() {
        var context;
        if (lastImageIdDrawn === imageId) {
            context = canvas.getContext('2d');
        }
        else {
            canvas.height = image.naturalHeight;
            canvas.width = image.naturalWidth;
            context = canvas.getContext('2d');
            context.drawImage(image, 0, 0);
            lastImageIdDrawn = imageId;
        }
        return context.getImageData(0, 0, image.naturalWidth, image.naturalHeight);
    }
    function getCanvas() {
        if (lastImageIdDrawn === imageId) {
            return canvas;
        }
        canvas.height = image.naturalHeight;
        canvas.width = image.naturalWidth;
        var context = canvas.getContext('2d');
        context.drawImage(image, 0, 0);
        lastImageIdDrawn = imageId;
        return canvas;
    }
    // Extract the various attributes we need
    return {
        imageId: imageId,
        minPixelValue: 0,
        maxPixelValue: 255,
        slope: 1,
        intercept: 0,
        windowCenter: 128,
        windowWidth: 255,
        getPixelData: getPixelData,
        getCanvas: getCanvas,
        getImage: function () { return image; },
        rows: rows,
        columns: columns,
        height: rows,
        width: columns,
        color: true,
        rgba: true,
        columnPixelSpacing: 1,
        rowPixelSpacing: 1,
        invert: false,
        sizeInBytes: rows * columns * 4,
    };
}
function arrayBufferToImage(arrayBuffer) {
    return new Promise(function (resolve, reject) {
        var image = new Image();
        var arrayBufferView = new Uint8Array(arrayBuffer);
        var blob = new Blob([arrayBufferView]);
        var urlCreator = window.URL || window.webkitURL;
        var imageUrl = urlCreator.createObjectURL(blob);
        image.src = imageUrl;
        image.onload = function () {
            resolve(image);
            urlCreator.revokeObjectURL(imageUrl);
        };
        image.onerror = function (error) {
            urlCreator.revokeObjectURL(imageUrl);
            reject(error);
        };
    });
}
//
// This is a cornerstone image loader for web images such as PNG and JPEG
//
var options = {
    // callback allowing customization of the xhr (e.g. adding custom auth headers, cors, etc)
    beforeSend: function (xhr) {
        // xhr
    },
};
// Loads an image given a url to an image
function loadImage(uri, imageId) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', uri, true);
    xhr.responseType = 'arraybuffer';
    options.beforeSend(xhr);
    xhr.onprogress = function (oProgress) {
        if (oProgress.lengthComputable) {
            // evt.loaded the bytes browser receive
            // evt.total the total bytes set by the header
            var loaded = oProgress.loaded;
            var total = oProgress.total;
            var percentComplete = Math.round((loaded / total) * 100);
            var eventDetail = {
                imageId: imageId,
                loaded: loaded,
                total: total,
                percentComplete: percentComplete,
            };
            cornerstone.triggerEvent(cornerstone.eventTarget, 'cornerstoneimageloadprogress', eventDetail);
        }
    };
    var promise = new Promise(function (resolve, reject) {
        xhr.onload = function () {
            var imagePromise = arrayBufferToImage(this.response);
            imagePromise
                .then(function (image) {
                var imageObject = createImage(image, imageId);
                resolve(imageObject);
            }, reject)
                .catch(function (error) {
                console.error(error);
            });
        };
        xhr.onerror = function (error) {
            reject(error);
        };
        xhr.send();
    });
    var cancelFn = function () {
        xhr.abort();
    };
    return {
        promise: promise,
        cancelFn: cancelFn,
    };
}
function registerWebImageLoader(imageLoader) {
    imageLoader.registerImageLoader('http', _loadImageIntoBuffer);
    imageLoader.registerImageLoader('https', _loadImageIntoBuffer);
}
/**
 * Small stripped down loader from cornerstoneDICOMImageLoader
 * Which doesn't create cornerstone images that we don't need
 */
function _loadImageIntoBuffer(imageId, options) {
    var uri = imageId.replace('web:', '');
    var promise = new Promise(function (resolve, reject) {
        // get the pixel data from the server
        loadImage(uri, imageId)
            .promise.then(function (image) {
            if (!options ||
                !options.targetBuffer ||
                !options.targetBuffer.length ||
                !options.targetBuffer.offset) {
                resolve(image);
                return;
            }
            // If we have a target buffer, write to that instead. This helps reduce memory duplication.
            var _a = options.targetBuffer, arrayBuffer = _a.arrayBuffer, offset = _a.offset, length = _a.length;
            // @ts-ignore
            var pixelDataRGBA = image.getPixelData();
            var targetArray = new Uint8Array(arrayBuffer, offset, length);
            targetArray.set(pixelDataRGBA, 0);
            resolve(true);
        }, function (error) {
            reject(error);
        })
            .catch(function (error) {
            reject(error);
        });
    });
    return {
        promise: promise,
        cancelFn: undefined,
    };
}
exports.default = registerWebImageLoader;
