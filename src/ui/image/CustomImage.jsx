'use client'
import React, { useState, useEffect, useRef } from "react";
import {
  Stage,
  Layer,
  Image,
  Rect,
  Transformer,
  Line,
  Group,
} from "react-konva";
import { Button, CircularProgress } from "@mui/material";
import SideBar from "../sidebar/SideBar";

const CustomImage = ({ serverResponse, loader }) => {
  const [imageElement, setImageElement] = useState(null);
  const [image, setImage] = useState(null);
  const [points, setPoints] = useState([]);
  const [polygons, setPolygons] = useState([]);
  const [sideLengths, setSideLengths] = useState([]);
  const [rectangles, setRectangles] = useState([]);
  const [selectedRectIndex, setSelectedRectIndex] = useState(null);
  const [rotationAngles, setRotationAngles] = useState([]);
  const [stageDimensions, setStageDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [imageShown, setImageShown] = useState(false);
  const [rectanglePlacementMode, setRectanglePlacementMode] = useState(false);
  const [newRectanglePosition, setNewRectanglePosition] = useState(null);
  const stageRef = useRef(null);
  const polygonLayerRef = useRef(null);
  const panelLayerRef = useRef(null);
  const shapeRef = useRef(null);
  const transformerRef = useRef(null);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Constants for panel size
  const panelWidthInches = 42;
  const panelLengthInches = 74;
  const meterPerInch = 0.0254;
  const pixelPerMeter = 10;
  const panelLength = (panelLengthInches * meterPerInch ) * pixelPerMeter;
  const panelWidth = (panelWidthInches * meterPerInch ) * pixelPerMeter;


  console.log(rotationAngles, "rotationAngles")

  useEffect(() => {
    const uint8Array = new Uint8Array(serverResponse);
    const blob = new Blob([uint8Array], { type: "image/jpeg" });
    const url = URL.createObjectURL(blob);

    const img = new window.Image();
    img.onload = () => {
      setImageElement(img);
      setImageShown(true);
    };
    img.src = url;

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [serverResponse]);

  useEffect(() => {
    if (imageElement) {
      setImage(imageElement);
    }
  }, [imageElement]);

  useEffect(() => {
    const handleResize = () => {
      setStageDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleStageClick = (e) => {
    if (!imageShown) return;
  
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
      setHistoryIndex(historyIndex - 1);
    } else {
      // If the last action was adding a point, remove the last point
      const newPoints = points.slice(0, -2);
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
      setHistoryIndex(historyIndex + 1);
    }
  };

  const addPanelAndFinishPolygon = () => {
    if (points.length >= 6) {
      const newPolygons = polygons.concat([points]);
      setPolygons(newPolygons);
      const newSideLengths = getSideLengths(points);
      setSideLengths([...sideLengths, newSideLengths]);
      const newRectangles = rectangles.slice();
      const polygonPoints = points;
      const polygonArea = shoelaceFormula(polygonPoints);
      const numRectangles = Math.ceil(polygonArea / (panelLength * panelWidth));
      const boundingRect = getBoundingRect(polygonPoints);
      const deltaX = panelLength * 1.5; // Distance between panels
      const deltaY = panelWidth * 1.5; // Distance between panels

      let startX = boundingRect.x + panelLength / 2;
      let startY = boundingRect.y + panelWidth / 2;

      for (let i = 0; i < numRectangles; i++) {
        if (startX + panelLength > boundingRect.x + boundingRect.width) {
          startX = boundingRect.x + panelLength / 2;
          startY += deltaY;
        }
        if (startY + panelWidth > boundingRect.y + boundingRect.height) break;

        const rectCenter = { x: startX, y: startY };
        if (isPointInsidePolygon(rectCenter, polygonPoints)) {
          const rect = {
            x: startX - panelLength / 2,
            y: startY - panelWidth / 2,
            width: panelLength,
            height: panelWidth,
          };

          if (isRectangleInsidePolygon(rect, polygonPoints)) {
            newRectangles.push(rect);
            setRotationAngles((prevAngles) => [...prevAngles, 0]);
          }
        }

        startX += deltaX;
      }

      const newHistory = [
        ...history.slice(0, historyIndex + 1),
        {
          polygons: newPolygons,
          rectangles: newRectangles,
          points: [],
          sideLengths: [...sideLengths, newSideLengths],
          rotationAngles: rotationAngles,
        },
      ];
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);

      setRectangles(newRectangles);
      setPoints([]);
    }
  };

  const getSideLengths = (points) => {
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

  const getBoundingRect = (points) => {
    const minX = Math.min(...points.filter((_, i) => i % 2 === 0));
    const minY = Math.min(...points.filter((_, i) => i % 2 !== 0));
    const maxX = Math.max(...points.filter((_, i) => i % 2 === 0));
    const maxY = Math.max(...points.filter((_, i) => i % 2 !== 0));
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  };

  const isPointInsidePolygon = (point, polygon) => {
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

  const isRectangleInsidePolygon = (rect, polygon) => {
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

  const shoelaceFormula = (points) => {
    let area = 0;
    const n = points.length;
    if (n < 6) return 0;
    for (let i = 0; i < n; i += 2) {
      const j = (i + 2) % n;
      area += points[i] * points[j + 1] - points[j] * points[i + 1];
    }
    return Math.abs(area) / 2;
  };

  const isPointInsideRectangle = (point, rect) => {
    return (
      point.x >= rect.x &&
      point.x <= rect.x + rect.width &&
      point.y >= rect.y &&
      point.y <= rect.y + rect.height
    );
  };

  const handleRectDragEnd = (index, e) => {
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

  const handleRectClick = (index) => {
    setSelectedRectIndex(index);
    if (transformerRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
    }
  };

  const handleAddRectangle = () => {
    if (!image) return;
    setRectanglePlacementMode(true);
  };

  const handleConfirmRectanglePlacement = () => {
    if (newRectanglePosition) {
      const newRect = {
        x: newRectanglePosition.x - panelLength / 2,
        y: newRectanglePosition.y - panelWidth / 2,
        width: panelLength,
        height: panelWidth,
      };
      const newRectangles = [...rectangles, newRect];
      const newRotationAngles = [...rotationAngles, 0];
      const newHistory = [
        ...history.slice(0, historyIndex + 1),
        {
          polygons: polygons,
          rectangles: newRectangles,
          points: points,
          sideLengths: sideLengths,
        },
      ];
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      setRectanglePlacementMode(false);
      setNewRectanglePosition(null);
      setRectangles(newRectangles);
    }
  };

  const handleRemoveRectangle = () => {
    if (selectedRectIndex !== null) {
      const newRectangles = rectangles.filter(
        (_, index) => index !== selectedRectIndex
      );
      const newRotationAngles = rotationAngles.filter(
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
        },
      ];
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      setRectangles(newRectangles);
      setRotationAngles(newRotationAngles);
      setSelectedRectIndex(null);
    }
  };

  const handleTransform = (index, newAttrs) => {
    console.log('newAttrs',newAttrs)
    const newRectangles = rectangles.slice();
    const updatedAttrs = { ...newRectangles[index], ...newAttrs };
  
    // Extract rotation value
    const rotation = newAttrs.target.attrs.rotation;
  
    // Check if rotation or size changed
    const rotationChanged = rotation !== undefined;
    const sizeChanged = newAttrs.target.attrs.width !== undefined || newAttrs.height !== undefined;
  
    if (rotationChanged || sizeChanged) {
      if (rotationChanged) {
        // Update rotation angle in rotationAngles state
        const newRotationAngles = [...rotationAngles];
        newRotationAngles[index] = rotation;
        setRotationAngles(newRotationAngles);
      }
      if (sizeChanged) {
        // Ensure minimum size
        updatedAttrs.width = Math.max(updatedAttrs.width, 5);
        updatedAttrs.height = Math.max(updatedAttrs.height, 5);
      }
  
      // Update history with the new state
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
    }
  
    // Update the rectangles state
    newRectangles[index] = updatedAttrs;
    setRectangles(newRectangles);
  };
  
  
  

  React.useEffect(() => {
    if (selectedRectIndex !== null) {
      transformerRef?.current?.nodes([shapeRef?.current]);
      transformerRef?.current?.getLayer().batchDraw();
    }
  }, [selectedRectIndex, rectangles]);

  const centerImage = () => {
    if (image && stageRef.current) {
      const stage = stageRef.current;
      const stageWidth = stage.width();
      const stageHeight = stage.height();
      const imageWidth = image.width;
      const imageHeight = image.height;
      const scale = Math.min(stageWidth / imageWidth, stageHeight / imageHeight);
      const offsetX = (stageWidth - imageWidth * scale) / 2;
      const offsetY = (stageHeight - imageHeight * scale) / 2;
      return { offsetX, offsetY, scale };
    }
    return { offsetX: 0, offsetY: 0, scale: 1 };
  };

  const { offsetX, offsetY, scale } = centerImage();

  return (
    <>
      {loader && (
        <div className="flex items-center justify-center">
          <CircularProgress />
        </div>
      )}
      <div className="relative">
      <Stage
        className="flex items-center justify-center"
        width={stageDimensions.width}
        height={stageDimensions.height}
        onClick={handleStageClick}
        ref={stageRef}
        scaleX={1} // Ensure that the stage scale is set to 1
        scaleY={1}
        centerX // Center the stage horizontally
        centerY // Center the stage vertically

      >
        <Layer ref={panelLayerRef}>
          {image && (
        
              <Image image={image} alt="image" width={stageDimensions.width} height={stageDimensions.height} />
          )}
          {rectangles.map((rect, index) => (
            <Rect
              key={index}
              x={rect.x}
              y={rect.y}
              width={rect.width}
              height={rect.height}
              fill="blue"
              draggable
              onDragEnd={(e) => handleRectDragEnd(index, e)}
              rotation={rect.rotation}
              offsetX={rect.offsetX}
              offsetY={rect.offsetY}
              onClick={() => handleRectClick(index)}
              ref={index === selectedRectIndex ? shapeRef : null}
            />
          ))}
          {selectedRectIndex !== null && (
            <Transformer
              ref={transformerRef}
              boundBoxFunc={(oldBox, newBox) => {
                if (
                  Math.abs(newBox.width) < 5 ||
                  Math.abs(newBox.height) < 5
                ) {
                  return oldBox;
                }
                return newBox;
              }}
              rotateEnabled
              onTransform={(newAttrs) =>
                handleTransform(selectedRectIndex, newAttrs)
              }
            />
          )}
          {rectanglePlacementMode && newRectanglePosition && (
            <Rect
              x={newRectanglePosition.x - panelLength / 2}
              y={newRectanglePosition.y - panelWidth / 2}
              width={panelLength}
              height={panelWidth}
              fill="blue"
              opacity={0.5}
            />
          )}
        </Layer>
        {imageShown && (
          <Layer ref={polygonLayerRef}>
            <Line points={points} stroke="red" />
            {polygons.map((polygonPoints, index) => (
              <Line key={index} points={polygonPoints} stroke="red" />
            ))}
          </Layer>
        )}
      </Stage>
      <SideBar/>
      {imageShown && (
        <div className="flex items-center justify-center">
          <Button onClick={handleUndo}>
            <span>Undo</span>
          </Button>
          <Button onClick={handleRedo}>
            <span>Redo</span>
          </Button>
          <Button
            onClick={addPanelAndFinishPolygon}
            disabled={points.length === 0}
          >
            <span>Add Panel</span>
          </Button>
          {rectanglePlacementMode ? (
            <Button onClick={handleConfirmRectanglePlacement}>
              <span>Confirm Position</span>
            </Button>
          ) : (
            <Button onClick={handleAddRectangle}>Add Rectangle</Button>
          )}
          <Button onClick={handleRemoveRectangle}>Remove Rectangle</Button>
        </div>
      )}
      {sideLengths.map((sideLength, index) => (
        <div key={index} className="text-center">
          Side Lengths of Polygon {index + 1}: {sideLength.join(", ")}
        </div>
      ))}
      </div>
    </>
  );
};

export default CustomImage;
