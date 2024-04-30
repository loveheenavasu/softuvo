"use client";
import { Panel } from "@/app/actions/getAllPanels";
import Konva from "konva";

import React, {
  createContext,
  useState,
  useContext,
  useRef,
  ReactNode,
  MouseEvent,
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



  const TotalPanelsAdded = (count: number) => {
    setTotalPanelsAdded(count);
  };

  const handleStageClick = () => {
    const stage = stageRef.current;
    const pointerPosition = stage.getPointerPosition();

    const imageBoundingBox = stageRef.current.findOne("Image").getClientRect();

    if (
      pointerPosition.x >= imageBoundingBox.x &&
      pointerPosition.x <= imageBoundingBox.x + imageBoundingBox.width &&
      pointerPosition.y >= imageBoundingBox.y &&
      pointerPosition.y <= imageBoundingBox.y + imageBoundingBox.height
    ) {
      if (rectanglePlacementMode) {
        setNewRectanglePosition({ x: pointerPosition.x, y: pointerPosition.y });
      } else {
        const clickedPoint = { x: pointerPosition.x, y: pointerPosition.y };
        const insidePolygonOrRectangle =
          polygons.some((polygon) =>
            isPointInsidePolygon(clickedPoint, polygon)
          ) ||
          rectangles.some((rect) => isPointInsideRectangle(clickedPoint, rect));

        if (!insidePolygonOrRectangle) {
          const newPoints = points.concat([
            pointerPosition.x,
            pointerPosition.y,
          ]);
          setPoints(newPoints);

          const newHistory = [
            ...history.slice(0, historyIndex + 1),
            {
              polygons: polygons,
              rectangles: rectangles,
              points: newPoints,
              sideLengths: sideLengths,
              rotationAngles: rotationAngles,
              transformerAttrs: transformerAttrs, // Include transformer attributes in history

            },
          ];
          setHistory(newHistory);
          setHistoryIndex(newHistory.length - 1);
        }
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
      setTotalPanelsAdded(previousState.totalPanelsAdded || 0)
      setTransformerAttrs(previousState.transformerAttrs); // Set transformer attributes
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
      setTotalPanelsAdded(nextState.totalPanelsAdded || 0)
      setTransformerAttrs(nextState.transformerAttrs); // Set transformer attributes

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
    if (selectedPanel) {
      const panelWidthInches = selectedPanel?.dimension?.width;
      const panelLengthInches = selectedPanel?.dimension?.length;
      const meterPerInch = 0.0254;
      const pixelPerMeter = 10;

      const panelLength = panelLengthInches * meterPerInch * pixelPerMeter;
      const panelWidth = panelWidthInches * meterPerInch * pixelPerMeter;
      setPanelLength(panelLength);
      setPanelWidth(panelWidth);

      if (points.length >= 3 || polygons.length > 0) {
        const newPolygons =
          points.length >= 3 ? polygons.concat([points]) : polygons;
        const newSideLengths = points.length >= 3 ? getSideLengths(points) : [];
        let newRectangles = [...rectangles]; // Copy existing rectangles
        const newPoints = points.length >= 3 ? [] : points;
        const polygonPoints =
          points.length >= 3 ? points : polygons[polygons.length - 1];
        const polygonArea = shoelaceFormula(polygonPoints);

        // Adjusting panel width and height to include the 1-inch gap
        const panelWidthWithGap = panelWidth + 10;
        const panelLengthWithGap = panelLength + 10;

        // Calculate the required number of panels
        const numPanelsLength = Math.floor(
          (polygonArea - 5 * panelWidthWithGap) / panelLengthWithGap
        );
        const numPanelsWidth = Math.floor(
          (polygonArea - 5 * panelLengthWithGap) / panelWidthWithGap
        );
        const numPanels = numPanelsLength * numPanelsWidth;
        // Calculate the centroid of the polygon
        const centroid = calculateCentroid(polygonPoints);
        // Initialize variables for panel placement
        let panelX = centroid.x - (numPanelsLength * panelLengthWithGap) / 2;
        let panelY = centroid.y - (numPanelsWidth * panelWidthWithGap) / 2;
        // Remove existing panels from the same polygon
        newRectangles = newRectangles.filter(
          (rect) => !isRectangleInsidePolygon(rect, polygonPoints)
        );
        // Count the number of panels added
        let numPanelsAdded = 0;
        for (let i = 0; i < numPanels; i++) {
          if (
            panelX + panelLengthWithGap >
            centroid.x + (numPanelsLength * panelLengthWithGap) / 2
          ) {
            panelX = centroid.x - (numPanelsLength * panelLengthWithGap) / 2;
            panelY += panelWidthWithGap;
          }
          // Check if the panel center is inside the polygon
          const rectCenter = {
            x: panelX + panelLengthWithGap / 2,
            y: panelY + panelWidthWithGap / 2,
          };
          if (isPointInsidePolygon(rectCenter, polygonPoints)) {
            // Calculate the angle between the current rectangle and the centroid
            const angle = Math.atan2(centroid.y - panelY, centroid.x - panelX);

            const rect = {
              x: panelX,
              y: panelY,
              width: panelLength,
              height: panelWidth,
              rotation: angle, // Set rotation angle for the rectangle
            };

            if (isRectangleInsidePolygon(rect, polygonPoints)) {
              newRectangles.push(rect); // Push the new rectangle to the array
              numPanelsAdded++; // Increment the count of panels added
            }
          }
          panelX += panelLengthWithGap;
        }
        TotalPanelsAdded(numPanelsAdded);

        // Update history with the new state
        const newHistory = [
          ...history.slice(0, historyIndex + 1),
          {
            polygons: newPolygons,
            rectangles: newRectangles, // Set rectangles to the new rectangles array
            points: newPoints,
            sideLengths: [...sideLengths, newSideLengths],
            rotationAngles: rotationAngles,
            totalPanelsAdded : numPanelsAdded,
            transformerAttrs: transformerAttrs, // Include transformer attributes in history

          },
        ];
        setPoints(newPoints);
        setPolygons(newPolygons);
        setSideLengths([...sideLengths, newSideLengths]);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        setRectangles(newRectangles);
        setTotalPanelsAdded(numPanelsAdded)
      }
    }
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
    if (n < 6) return 0;
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
    const newHistory = [
      ...history.slice(0, historyIndex + 1),
      {
        polygons: polygons,
        rectangles: newRectangles,
        points: points,
        sideLengths: sideLengths,
        rotationAngles: rotationAngles,
      },
    ];
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
          totalPanelsAdded : totalPanelsAdded+1,
          rotationAngles : rotationAngles,
          transformerAttrs : transformerAttrs
        },
      ];
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      setRectanglePlacementMode(false);
      setNewRectanglePosition(null);
      setRectangles(newRectangles);
      setTotalPanelsAdded(totalPanelsAdded+1)
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
          totalPanelsAdded: totalPanelsAdded -1
        },
      ];
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      setRectangles(newRectangles);
      setRotationAngles(newRotationAngles);
      setSelectedRectIndex(null);
      setTotalPanelsAdded(totalPanelsAdded-1)
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
      },
    ];
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
  };

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
  };

  return (
    <ImageContext.Provider value={value}>{children}</ImageContext.Provider>
  );
};
