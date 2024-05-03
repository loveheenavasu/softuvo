"use client";
import { exportImage } from "@/app/actions/exportImage";
import { Panel } from "@/app/actions/getAllPanels";
import Konva from "konva";

import React, {
  createContext,
  useState,
  useContext,
  useRef,
  ReactNode,
} from "react";

interface ImageContextProps {
  imageElement: HTMLImageElement | null;
  image: HTMLImageElement | null;
  points: number[];
  setPoints: React.Dispatch<React.SetStateAction<number[]>>;
  polygons: number[][];
  setPolygons: React.Dispatch<React.SetStateAction<number[][]>>;
  sideLengths: number[][];
  setSideLengths: React.Dispatch<React.SetStateAction<number[][]>>;
  rectangles: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
  }[];
  setRectangles: React.Dispatch<
    React.SetStateAction<
      {
        x: number;
        y: number;
        width: number;
        height: number;
        rotation: number;
      }[]
    >
  >;
  
  selectedRectIndex: number | null;
  setSelectedRectIndex: React.Dispatch<React.SetStateAction<number | null>>;
  setTotalPanelsAdded: React.Dispatch<React.SetStateAction<number>>;
  rotationAngles: number[];
  setRotationAngles: React.Dispatch<React.SetStateAction<number[]>>;
  stageDimensions: { width: number; height: number };
  setStageDimensions: React.Dispatch<
    React.SetStateAction<{ width: number; height: number }>
  >;
  imageShown: boolean;
  setImageShown: React.Dispatch<React.SetStateAction<boolean>>;
  rectanglePlacementMode: boolean;
  setRectanglePlacementMode: React.Dispatch<React.SetStateAction<boolean>>;
  newRectanglePosition: { x: number; y: number } | null;
  setNewRectanglePosition: React.Dispatch<
    React.SetStateAction<{ x: number; y: number } | null>
  >;
  stageRef: React.RefObject<any>;
  polygonLayerRef: React.RefObject<any>;
  panelLayerRef: React.RefObject<any>;
  shapeRef: React.RefObject<any>;
  transformerRef: React.RefObject<any>;
  history: any[];
  setHistory: React.Dispatch<React.SetStateAction<any[]>>;
  historyIndex: number;
  setHistoryIndex: React.Dispatch<React.SetStateAction<number>>;
  handleStageClick: () => void;
  handleTransform: (index: number, newAttrs: any) => void;
  handleRemoveRectangle: () => void;
  handleConfirmRectanglePlacement: (selectedPanel: Panel) => void;
  handleAddRectangle: () => void;
  handleRectClick: (index: number) => void;
  handleRectDragEnd: (index: number, e: Konva.KonvaEventObject<any>) => void;
  addPanelAndFinishPolygon: (selectedPanel: Panel) => void;
  handleRedo: () => void;
  handleUndo: () => void;
  totalPanelsAdded: number;
  panelLength: number;
  panelWidth: number;
  handleRefresh: () => void;
  handleSelectPanel: () => void;
  setSelectedPanel: React.Dispatch<React.SetStateAction<Panel | null>>;
  selectedPanel: Panel | null;
  drawingMode: boolean;
  setDrawingMode: React.Dispatch<React.SetStateAction<boolean>>;
  handleDrawPolygon: () => void;
  handleExportImage: ()=> void;
}

interface TransformAttributes {
  target: {
    attrs: {
      y: number;
      x: number;
      rotation?: number;
      width?: number;
      height?: number;
    };
  };
}

const ImageContext = createContext<ImageContextProps | undefined>(undefined);

export const useImageContext = (): ImageContextProps => {
  const context = useContext(ImageContext);
  if (!context) {
    throw new Error("useImageContext must be used within an ImageProvider");
  }
  return context;
};

export const ImageProvider: React.FC<{ children: ReactNode | ReactNode[] }> = ({
  children,
}) => {
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(
    null
  );
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [points, setPoints] = useState<number[]>([]);
  const [polygons, setPolygons] = useState<number[][]>([]);
  const [sideLengths, setSideLengths] = useState<number[][]>([]);
  const [rectangles, setRectangles] = useState<
    { x: number; y: number; width: number; height: number; rotation: number }[]
  >([]);
  const [selectedRectIndex, setSelectedRectIndex] = useState<number | null>(
    null
  );
  const [rotationAngles, setRotationAngles] = useState<number[]>([]);
  const [stageDimensions, setStageDimensions] = useState<{
    width: number;
    height: number;
  }>({ width: 0, height: 0 });
  const [imageShown, setImageShown] = useState<boolean>(false);
  const [rectanglePlacementMode, setRectanglePlacementMode] =
    useState<boolean>(false);
  const [newRectanglePosition, setNewRectanglePosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const stageRef = useRef<any>(null);
  const polygonLayerRef = useRef<any>(null);
  const panelLayerRef = useRef<any>(null);
  const shapeRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [totalPanelsAdded, setTotalPanelsAdded] = useState<number>(0);
  const [panelLength, setPanelLength] = useState<number>(0);
  const [panelWidth, setPanelWidth] = useState<number>(0);
  const [transformerAttrs, setTransformerAttrs] = useState(null);
  const [selectedPanel, setSelectedPanel] = useState<Panel | null>(null);
  const [drawingMode, setDrawingMode] = useState<boolean>(false); // State variable to track drawing mode

  const TotalPanelsAdded = (count: number) => {
    const newTotalPanels = totalPanelsAdded + count;

    const newHistory = [
      ...history.slice(0, historyIndex + 1),
      {
        polygons: polygons,
        rectangles: rectangles,
        points: points,
        sideLengths: sideLengths,
        rotationAngles: rotationAngles,
        transformerAttrs: transformerAttrs,
        totalPanelsAdded: newTotalPanels,
      },
    ];
    setTotalPanelsAdded((prevValue) => prevValue + count);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleDrawPolygon = () => {
    setDrawingMode(!drawingMode);
    if (!drawingMode) {
      setPoints([]);
      setHistory([
        ...history.slice(0, historyIndex + 1),
        {
          polygons: polygons,
          rectangles: rectangles,
          points: [],
          sideLengths: sideLengths,
          rotationAngles: rotationAngles,
          transformerAttrs: transformerAttrs,
        },
      ]);
      setHistoryIndex(historyIndex + 1);
    }
  };

  const handleStageClick = () => {
    const stage = stageRef.current;
    const pointerPosition = stage.getPointerPosition();

    // Get the bounding box of the image
    const imageBoundingBox = stageRef.current.findOne("Image").getClientRect();

    if (
      pointerPosition.x >= imageBoundingBox.x &&
      pointerPosition.x <= imageBoundingBox.x + imageBoundingBox.width &&
      pointerPosition.y >= imageBoundingBox.y &&
      pointerPosition.y <= imageBoundingBox.y + imageBoundingBox.height
    ) {
      // If the click is inside the image area
      const clickedPoint = { x: pointerPosition.x, y: pointerPosition.y };
      const insidePolygonOrRectangle =
        polygons.some((polygon) =>
          isPointInsidePolygon(clickedPoint, polygon)
        ) ||
        rectangles.some((rect) => isPointInsideRectangle(clickedPoint, rect));

      if (rectanglePlacementMode) {
        // If in rectangle placement mode, set new rectangle position
        setNewRectanglePosition({
          x: pointerPosition.x,
          y: pointerPosition.y,
        });
      } else if (insidePolygonOrRectangle) {
        // If clicked inside any polygon or rectangle, select the corresponding rectangle
        const rectIndex = rectangles.findIndex((rect) =>
          isPointInsideRectangle(clickedPoint, rect)
        );
        setSelectedRectIndex(rectIndex);
      } else if (drawingMode) {
        // If in drawing mode and not inside any polygon or rectangle, add new point
        const newPoints = points.concat([pointerPosition.x, pointerPosition.y]);
        setPoints(newPoints);

        const newHistory = [
          ...history.slice(0, historyIndex + 1),
          {
            polygons: polygons,
            rectangles: rectangles,
            points: newPoints,
            sideLengths: sideLengths,
            rotationAngles: rotationAngles,
            totalPanelsAdded: totalPanelsAdded,
            selectedPanel: selectedPanel,
            transformerAttrs: transformerAttrs, // Include transformer attributes in history
          },
        ];
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
      } else {
        // Clicked on the image but not in drawing mode, deselect any selected rectangle
        setSelectedRectIndex(null);
      }
    } else {
      // Clicked outside of the image area, deselect any selected rectangle
      setSelectedRectIndex(null);
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const previousState = history[historyIndex - 1];
      setPolygons(previousState.polygons);
      setRectangles(previousState.rectangles);
      setPoints(previousState.points);
      setSideLengths(previousState.sideLengths);
      setRotationAngles(previousState.rotationAngles);
      setTotalPanelsAdded(previousState.totalPanelsAdded || 0);
      setSelectedPanel(previousState.selectedPanel);
      setTransformerAttrs(previousState.transformerAttrs);
      setHistoryIndex(historyIndex - 1);
    } else {
      // If the last action was adding a point, remove the last point
      const newPoints = points.slice(0, -1);
      setPoints(newPoints);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setPolygons(nextState.polygons);
      setRectangles(nextState.rectangles);
      setPoints(nextState.points);
      setSideLengths(nextState.sideLengths);
      setRotationAngles(nextState.rotationAngles);
      setTotalPanelsAdded(nextState.totalPanelsAdded || 0);
      setSelectedPanel(nextState.selectedPanel);
      setTransformerAttrs(nextState.transformerAttrs);
      setHistoryIndex(historyIndex + 1);
    }
  };

  const calculateCentroid = (polygonPoints: string | any[]) => {
    let xSum = 0;
    let ySum = 0;
    const n = polygonPoints.length;

    for (let i = 0; i < n; i += 2) {
      const x = polygonPoints[i];
      const y = polygonPoints[i + 1];
      xSum += x;
      ySum += y;
    }
    // Calculate the centroid coordinates
    const centroidX = xSum / (n / 2);
    const centroidY = ySum / (n / 2);

    return { x: centroidX, y: centroidY };
  };

  const addPanelAndFinishPolygon = (selectedPanel: Panel | null) => {
    if (!selectedPanel) return;

    const panelWidthInches = selectedPanel?.dimension?.width;
    const panelLengthInches = selectedPanel?.dimension?.length;
    const meterPerInch = 0.0254;
    const pixelPerMeter = 10;

    const panelLength = panelLengthInches * meterPerInch * pixelPerMeter;
    const panelWidth = panelWidthInches * meterPerInch * pixelPerMeter;
    setPanelLength(panelLength);
    setPanelWidth(panelWidth);

    const isPolygonCompleted = points.length >= 3 || polygons.length > 0;
    if (!isPolygonCompleted) return;

    const isPolygonPoints = points.length >= 3;
    const newPolygons = isPolygonPoints ? polygons.concat([points]) : polygons;
    const newSideLengths = isPolygonPoints ? getSideLengths(points) : [];
    const newRectangles = rectangles.filter(
      (rect) =>
        !isRectangleInsidePolygon(
          rect,
          isPolygonPoints ? points : polygons[polygons.length - 1]
        )
    );

    const panelGap = 10;
    const panelWidthWithGap = panelWidth + panelGap;
    const panelLengthWithGap = panelLength + panelGap;

    const polygonArea = shoelaceFormula(
      isPolygonPoints ? points : polygons[polygons.length - 1]
    );
    const numPanelsLength = Math.floor(
      (polygonArea - 5 * panelWidthWithGap) / panelLengthWithGap
    );
    const numPanelsWidth = Math.floor(
      (polygonArea - 5 * panelLengthWithGap) / panelWidthWithGap
    );
    const numPanels = numPanelsLength * numPanelsWidth;

    const centroid = calculateCentroid(
      isPolygonPoints ? points : polygons[polygons.length - 1]
    );
    let panelX = centroid.x - (numPanelsLength * panelLengthWithGap) / 2;
    let panelY = centroid.y - (numPanelsWidth * panelWidthWithGap) / 2;
    let numPanelsAdded = 0;

    for (let i = 0; i < numPanels; i++) {
      if (
        panelX + panelLengthWithGap >
        centroid.x + (numPanelsLength * panelLengthWithGap) / 2
      ) {
        panelX = centroid.x - (numPanelsLength * panelLengthWithGap) / 2;
        panelY += panelWidthWithGap;
      }

      const rectCenter = {
        x: panelX + panelLengthWithGap / 2,
        y: panelY + panelWidthWithGap / 2,
      };
      if (
        isPointInsidePolygon(
          rectCenter,
          isPolygonPoints ? points : polygons[polygons.length - 1]
        )
      ) {
        const angle = Math.atan2(centroid.y - panelY, centroid.x - panelX);
        const rect = {
          x: panelX,
          y: panelY,
          width: panelLength,
          height: panelWidth,
          rotation: angle,
        };
        if (
          isRectangleInsidePolygon(
            rect,
            isPolygonPoints ? points : polygons[polygons.length - 1]
          )
        ) {
          newRectangles.push(rect);
          numPanelsAdded++;
        }
      }
      panelX += panelLengthWithGap;
    }

    const newHistory = [
      ...history.slice(0, historyIndex + 1),
      {
        polygons: newPolygons,
        rectangles: newRectangles,
        points: isPolygonPoints ? [] : points,
        sideLengths: [...sideLengths, newSideLengths],
        rotationAngles: rotationAngles,
        totalPanelsAdded: totalPanelsAdded + numPanelsAdded,
        selectedPanel: selectedPanel,
        transformerAttrs: transformerAttrs,
        didAddedPanels: true,
      },
    ];

    TotalPanelsAdded(numPanelsAdded);

    setSelectedPanel(selectedPanel);
    setPoints(isPolygonPoints ? [] : points);
    setPolygons(newPolygons);
    setSideLengths([...sideLengths, newSideLengths]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setRectangles(newRectangles);
  };

  const getSideLengths = (points: string | any[]) => {
    const sideLengths = [];
    for (let i = 0; i < points.length; i += 2) {
      const x1 = points[i];
      const y1 = points[i + 1];
      const x2 = points[(i + 2) % points.length];
      const y2 = points[(i + 3) % points.length];
      const sideLength = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
      sideLengths.push(sideLength);
    }
    return sideLengths;
  };

  const isPointInsidePolygon = (
    point: { x: any; y: any },
    polygon: string | any[]
  ) => {
    let inside = false;
    for (let i = 0, j = polygon.length - 2; i < polygon.length; j = i, i += 2) {
      const xi = polygon[i];
      const yi = polygon[i + 1];
      const xj = polygon[j];
      const yj = polygon[j + 1];

      const intersect =
        yi > point.y !== yj > point.y &&
        point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  };

  const isRectangleInsidePolygon = (
    rect: { x: any; y: any; width: any; height: any; rotation?: number },
    polygon: string | any[]
  ) => {
    const rectPoints = [
      rect.x,
      rect.y,
      rect.x + rect.width,
      rect.y,
      rect.x + rect.width,
      rect.y + rect.height,
      rect.x,
      rect.y + rect.height,
    ];

    for (let i = 0; i < rectPoints.length; i += 2) {
      if (
        !isPointInsidePolygon(
          { x: rectPoints[i], y: rectPoints[i + 1] },
          polygon
        )
      ) {
        return false;
      }
    }
    return true;
  };

  const shoelaceFormula = (points: string | any[]) => {
    let area = 0;
    const n = points.length;
    if (n < 3) return 0;
    for (let i = 0; i < n; i += 2) {
      const j = (i + 2) % n;
      area += points[i] * points[j + 1] - points[j] * points[i + 1];
    }
    return Math.abs(area) / 2;
  };

  const isPointInsideRectangle = (
    point: { x: number; y: number },
    rect: { x: number; width: any; y: number; height: any }
  ) => {
    return (
      point.x >= rect.x &&
      point.x <= rect.x + rect.width &&
      point.y >= rect.y &&
      point.y <= rect.y + rect.height
    );
  };

  const handleRectDragEnd = (index: number, e: Konva.KonvaEventObject<any>) => {
    const newRectangles = rectangles.slice();
    newRectangles[index] = {
      ...newRectangles[index],
      x: e.target.x(),
      y: e.target.y(),
    };
    TotalPanelsAdded(totalPanelsAdded);
    const newHistory = [
      ...history.slice(0, historyIndex + 1),
      {
        polygons: polygons,
        rectangles: newRectangles,
        points: points,
        sideLengths: sideLengths,
        rotationAngles: rotationAngles,
        selectedPanel: selectedPanel,
        totalPanelsAdded: totalPanelsAdded,
      },
    ];
    setSelectedPanel(selectedPanel);
    setTotalPanelsAdded(totalPanelsAdded);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setRectangles(newRectangles);
  };

  const handleRectClick = (index: number) => {
    setSelectedRectIndex(index);
    if (transformerRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
    }
  };

  const handleAddRectangle = () => {
    setRectanglePlacementMode(true);
  };

  const handleConfirmRectanglePlacement = (selectedPanel: Panel) => {
    const panelWidthInches = selectedPanel?.dimension?.width;
    const panelLengthInches = selectedPanel?.dimension?.length;
    const meterPerInch = 0.0254;
    const pixelPerMeter = 10;

    const panelLength = panelLengthInches * meterPerInch * pixelPerMeter;
    const panelWidth = panelWidthInches * meterPerInch * pixelPerMeter;

    if (newRectanglePosition) {
      const newRect = {
        x: newRectanglePosition.x - panelLength / 2,
        y: newRectanglePosition.y - panelWidth / 2,
        width: panelLength,
        height: panelWidth,
        rotation: 0,
      };
      const newRectangles = [...rectangles, newRect];
      const newHistory = [
        ...history.slice(0, historyIndex + 1),
        {
          polygons: polygons,
          rectangles: newRectangles,
          points: points,
          sideLengths: sideLengths,
          totalPanelsAdded: totalPanelsAdded + 1,
          rotationAngles: rotationAngles,
          selectedPanel: selectedPanel,
          transformerAttrs: transformerAttrs,
        },
      ];
      setSelectedPanel(selectedPanel);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      setRectanglePlacementMode(false);
      setNewRectanglePosition(null);
      setRectangles(newRectangles);
      setTotalPanelsAdded(totalPanelsAdded + 1);
    }
  };

  const handleRemoveRectangle = () => {
    if (selectedRectIndex !== null) {
      const newRectangles = rectangles.filter(
        (_, index) => index !== selectedRectIndex
      );
      const newRotationAngles = rotationAngles?.filter(
        (_, index) => index !== selectedRectIndex
      );
      const newHistory = [
        ...history.slice(0, historyIndex + 1),
        {
          polygons: polygons,
          rectangles: newRectangles,
          points: points,
          sideLengths: sideLengths,
          rotationAngles: newRotationAngles,
          selectedPanel: selectedPanel,
          totalPanelsAdded: totalPanelsAdded - 1,
        },
      ];
      setSelectedPanel(selectedPanel);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      setRectangles(newRectangles);
      setRotationAngles(newRotationAngles);
      setSelectedRectIndex(null);
      setTotalPanelsAdded(totalPanelsAdded - 1);
    }
  };

  const handleTransform = (index: number, newAttrs: TransformAttributes) => {
    const { attrs } = newAttrs.target;
    const updatedRectangles = rectangles.slice();
    updatedRectangles[index] = {
      ...updatedRectangles[index],
      x: attrs.x,
      y: attrs.y,
      rotation: attrs.rotation || 0,
    };
    const newHistory = [
      ...history.slice(0, historyIndex + 1),
      {
        polygons: polygons,
        rectangles: updatedRectangles,
        points: points,
        sideLengths: sideLengths,
        rotationAngles: [...rotationAngles],
        totalPanelsAdded: totalPanelsAdded,
        selectedPanel: selectedPanel,
      },
    ];
    setSelectedPanel(selectedPanel);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setRectangles(updatedRectangles);
    setRotationAngles([...rotationAngles]);
  };
  React.useEffect(() => {
    const keyPressHandler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "z") {
        handleUndo();
      } else if (e.ctrlKey && e.key === "y") {
        handleRedo();
      }
    };

    window.addEventListener("keydown", keyPressHandler);

    return () => {
      window.removeEventListener("keydown", keyPressHandler);
    };
  });

  const handleRefresh = () => {
    setPoints([]);
    setPolygons([]);
    setSideLengths([]);
    setRectangles([]);
    setSelectedRectIndex(null);
    setRotationAngles([]);
    setHistory([]);
    setHistoryIndex(-1);
    setNewRectanglePosition(null);
    setTotalPanelsAdded(0);
    setPanelLength(0);
    setPanelWidth(0);
    setSelectedPanel(null)
  };

  const handleExportImage = async()=>{
    const stage = stageRef.current;
    if(stage){
      const dataURL = stage.toDataURL();
const data = await exportImage(dataURL)
console.log(data)
    }
  }

  const value: ImageContextProps = {
    imageElement,
    image,
    points,
    setPoints,
    polygons,
    setPolygons,
    sideLengths,
    setSideLengths,
    rectangles,
    setRectangles,
    selectedRectIndex,
    setSelectedRectIndex,
    rotationAngles,
    setRotationAngles,
    stageDimensions,
    setStageDimensions,
    imageShown,
    setImageShown,
    rectanglePlacementMode,
    setRectanglePlacementMode,
    newRectanglePosition,
    setNewRectanglePosition,
    stageRef,
    polygonLayerRef,
    panelLayerRef,
    shapeRef,
    transformerRef,
    history,
    setHistory,
    historyIndex,
    setHistoryIndex,
    handleStageClick,
    handleTransform,
    handleRemoveRectangle,
    handleConfirmRectanglePlacement,
    handleAddRectangle,
    handleRectClick,
    handleRectDragEnd,
    addPanelAndFinishPolygon,
    handleRedo,
    handleUndo,
    panelLength,
    panelWidth,
    totalPanelsAdded,
    handleRefresh,
    setTotalPanelsAdded,
    selectedPanel,
    setSelectedPanel,
    handleSelectPanel: function (): void {
      throw new Error("Function not implemented.");
    },
    handleDrawPolygon,
    drawingMode,
    setDrawingMode,
    handleExportImage,
  };

  return (
    <ImageContext.Provider value={value}>{children}</ImageContext.Provider>
  );
};
