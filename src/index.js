import * as cornerstone from "@cornerstonejs/core";
import {
  Enums,
  init as csRenderInit,
  imageLoader,
  metaData,
  RenderingEngine,
} from "@cornerstonejs/core";
import {
  addTool,
  Enums as csToolsEnums,
  init as csToolsInit,
  utilities,
  PanTool,
  StackScrollMouseWheelTool,
  ToolGroupManager,
  WindowLevelTool,
  ZoomTool,
} from "@cornerstonejs/tools";
import registerWebImageLoader from "./web-image-loader";

const init = async () => {
  await csRenderInit();
  await csToolsInit();
};

function metaDataProvider(type, imageId) {
  return {
    imagePixelModule: {
      photometricInterpretation: "RGB",
    },
    generalSeriesModule: {},
  }[type];
}

function component() {
  registerWebImageLoader(imageLoader);
  metaData.addProvider(metaDataProvider, 1000);

  // cornerstone.setUseCPURendering(true);

  const imageIds = [
    "http://localhost:8080/img/0000.png",
    "http://localhost:8080/img/0001.png",
    "http://localhost:8080/img/0002.png",
  ]

  const element = document.createElement('div');

  element.style.width = '1000px';
  element.style.height = '1000px';

  init()
    .then(() => {
      const renderingEngineId = 'myRenderingEngine';
      const renderingEngine = new RenderingEngine(renderingEngineId);

      const viewportId = 'MRT_STACK';
      const { ViewportType } = Enums;
      const viewportInput = {
        viewportId,
        element,
        type: ViewportType.STACK,
      };

      renderingEngine.enableElement(viewportInput);

      const viewport = renderingEngine.getViewport(viewportId);
      viewport.setStack(imageIds, 1);
      viewport.render();
      utilities.stackPrefetch.enable(element);
    });

  return element;
}

document.body.appendChild(component());
