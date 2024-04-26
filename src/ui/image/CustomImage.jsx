"use client";
import React, { useState, useEffect, useRef } from "react";
import { Stage, Layer, Image, Rect, Transformer, Line } from "react-konva";
import { Button, CircularProgress } from "@mui/material";
import { useImageContext } from "@/app/context/sidebarContext/ImageProvider";

const CustomImage = ({ serverResponse, loader }) => {
  const {
    handleStageClick,
    stageRef,
    points,
    rectangles,
    rectanglePlacementMode,
    newRectanglePosition,
    selectedRectIndex,
    handleRectDragEnd,
    handleRectClick,
    handleTransform,
    sideLengths,
    polygons,
    panelLayerRef,
    polygonLayerRef,
    shapeRef,
    transformerRef,
    panelLength,
    panelWidth,
  } = useImageContext();

  const [imageElement, setImageElement] = useState(null);
  const [image, setImage] = useState(null);

  const [stageDimensions, setStageDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [imageShown, setImageShown] = useState(false);

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

  React.useEffect(() => {
    if (selectedRectIndex !== null) {
      transformerRef?.current?.nodes([shapeRef?.current]);
      transformerRef?.current?.getLayer().batchDraw();
    }
  }, [selectedRectIndex, rectangles, shapeRef, transformerRef]);

  return (
    <>
      {loader && (
        <div className="flex items-center justify-center absolute top-52 left-0 right-0">
          <CircularProgress />
        </div>
      )}
      {imageShown &&(
      <Stage
        className="flex items-center justify-center"
        width={stageDimensions.width}
        height={stageDimensions.height}
        onClick={handleStageClick}
        ref={stageRef}
      >
        <Layer ref={panelLayerRef}>
          {image && (
            <Image image={image} alt="image" width={1440} height={700} />
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
      )}
      {/* {sideLengths.map((sideLength, index) => (
        <div key={index} className="text-center">
          Side Lengths of Polygon {index + 1}: {sideLength.join(", ")}
        </div>
      ))} */}
    </>
  );
};

export default CustomImage;
