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
  const [imageShown, setImageShown] = useState(false); // Flag to track if image is shown
  const [rectanglePlacementMode, setRectanglePlacementMode] = useState(false); // Flag to track rectangle placement mode
  const [newRectanglePosition, setNewRectanglePosition] = useState(null); // Track position for new rectangle
  const stageRef = useRef(null);
  const polygonLayerRef = useRef(null);
  const panelLayerRef = useRef(null);
  const shapeRef = React.useRef(null);

  const panelLength = 10;
  const panelWidth = 10;
  const transformerRef = useRef(null);
  const [history, setHistory] = useState([]); // New history state to track all actions
  const [historyIndex, setHistoryIndex] = useState(-1); // Index to track current state in history

  useEffect(() => {
    const uint8Array = new Uint8Array(serverResponse);
    const blob = new Blob([uint8Array], { type: "image/jpeg" });
    const url = URL.createObjectURL(blob);

    const img = new window.Image();
    img.onload = () => {
      setImageElement(img);
      setImageShown(true); // Set imageShown to true once image is loaded
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
        // If in rectangle placement mode, set the position for the new rectangle
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

          // Update history when adding a new point to the polygon line
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
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      const previousState = history[historyIndex - 1];
      setPolygons(previousState.polygons);
      setRectangles(previousState.rectangles);
      setPoints(previousState.points);
      setSideLengths(previousState.sideLengths);
      setRotationAngles(previousState.rotationAngles);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      const nextState = history[historyIndex + 1];
      setPolygons(nextState.polygons);
      setRectangles(nextState.rectangles);
      setPoints(nextState.points);
      setSideLengths(nextState.sideLengths);
      setRotationAngles(nextState.rotationAngles);
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

          // Check if the rectangle is completely inside the polygon
          if (isRectangleInsidePolygon(rect, polygonPoints)) {
            newRectangles.push(rect);
            setRotationAngles((prevAngles) => [...prevAngles, 0]); // Initialize rotation angle
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
          rotationAngles: [...rotationAngles, 0],
        },
      ];
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);

      setRectangles(newRectangles);
      setPoints([]); // Reset points for the next polygon
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
      const newRotationAngles = [...rotationAngles, 0]; // Initialize rotation angle
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
      // Reset rectangle placement mode and position
      setRectanglePlacementMode(false);
      setNewRectanglePosition(null);
      setRectangles(newRectangles);
      setRotationAngles(newRotationAngles);
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

  React.useEffect(() => {
    if (selectedRectIndex !== null) {
      transformerRef?.current?.nodes([shapeRef?.current]);
      transformerRef?.current?.getLayer().batchDraw();
    }
  }, [selectedRectIndex, rectangles]);

  return (
    <>
      {loader && (
        <div className="flex items-center justify-center">
          <CircularProgress />
        </div>
      )}
      <Stage
        className="flex items-center justify-center"
        width={stageDimensions.width}
        height={stageDimensions.height}
        onClick={handleStageClick}
        ref={stageRef}
      >
        <Layer ref={panelLayerRef}>
          {image && (
            <Group
              x={(stageDimensions.width - image.width) / 2}
              y={(stageDimensions.height - image.height) / 2}
            >
              <Image image={image} alt="image" />
            </Group>
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
                if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) {
                  return oldBox;
                }
                return newBox;
              }}
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
    </>
  );
};

export default CustomImage;
