"use client";
import React from "react";
import styles from "./Sidebar.module.css";
import { Button } from "@mui/material";
import { styled } from "@mui/material/styles";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch, { SwitchProps } from "@mui/material/Switch";
import Box from "@mui/material/Box";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import UndoIcon from "@mui/icons-material/Undo";
import RedoIcon from "@mui/icons-material/Redo";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckIcon from "@mui/icons-material/Check";
import { useImageContext } from "@/app/context/sidebarContext/ImageProvider";
import { Panel } from "@/app/actions/getAllPanels";
import PolylineIcon from "@mui/icons-material/Polyline";
import { Cancel } from "@mui/icons-material";
import Tooltip from "@mui/material/Tooltip";
import SaveAltIcon from "@mui/icons-material/SaveAlt";

interface Props {
  getAllPanel: {
    panels: Panel[];
  };
}

const IOSSwitch = styled((props: SwitchProps) => (
  <Switch focusVisibleClassName=".Mui-focusVisible" disableRipple {...props} />
))(({ theme }) => ({
  width: 42,
  height: 26,
  padding: 0,
  "& .MuiSwitch-switchBase": {
    padding: 0,
    margin: 2,
    transitionDuration: "300ms",
    "&.Mui-checked": {
      transform: "translateX(16px)",
      color: "#fff",
      "& + .MuiSwitch-track": {
        backgroundColor: theme.palette.mode === "dark" ? "#2ECA45" : "#65C466",
        opacity: 1,
        border: 0,
      },
      "&.Mui-disabled + .MuiSwitch-track": {
        opacity: 0.5,
      },
    },
    "&.Mui-focusVisible .MuiSwitch-thumb": {
      color: "#33cf4d",
      border: "6px solid #fff",
    },
    "&.Mui-disabled .MuiSwitch-thumb": {
      color:
        theme.palette.mode === "light"
          ? theme.palette.grey[100]
          : theme.palette.grey[600],
    },
    "&.Mui-disabled + .MuiSwitch-track": {
      opacity: theme.palette.mode === "light" ? 0.7 : 0.3,
    },
  },
  "& .MuiSwitch-thumb": {
    boxSizing: "border-box",
    width: 22,
    height: 22,
  },
  "& .MuiSwitch-track": {
    borderRadius: 26 / 2,
    backgroundColor: theme.palette.mode === "light" ? "#E9E9EA" : "#39393D",
    opacity: 1,
    transition: theme.transitions.create(["background-color"], {
      duration: 500,
    }),
  },
}));

const SideBar: React.FC<Props> = ({ getAllPanel }) => {
  const {
    handleUndo,
    addPanelAndFinishPolygon,
    handleAddRectangle,
    handleConfirmRectanglePlacement,
    handleRedo,
    handleRemoveRectangle,
    rectanglePlacementMode,
    totalPanelsAdded,
    handleRefresh,
    handleSelectPanel,
    selectedPanel,
    setSelectedPanel,
    drawingMode,
    handleDrawPolygon,
    history,
    handleExportImage
  } = useImageContext();

  let panelWattage = selectedPanel ? selectedPanel?.powerWattage / 1000 : 0;
  let panelEfficiency = selectedPanel?.panelEfficiency || 0;
  let solarIrradiance = 5.5;
  const annualproduction =
    panelWattage * solarIrradiance * panelEfficiency * 365;

  const totalannualproduction = annualproduction * totalPanelsAdded;
  const systemSize = panelWattage * totalPanelsAdded;

  const handlePanelSelect = (elementName: string) => {
    const hasPrevSelectedPanel = history?.[history.length - 1]?.didAddedPanels;

    if (hasPrevSelectedPanel) {
      return;
    }

    const selectedItem = getAllPanel?.panels?.find(
      (ele: Panel) => ele.modelName === elementName
    );
    if (selectedItem) {
      setSelectedPanel(selectedItem);
      addPanelAndFinishPolygon(selectedItem);
    }
  };

  const handleConfirmPlacement = () => {
    if (selectedPanel) {
      handleConfirmRectanglePlacement(selectedPanel);
    }
  };

  const handleReset = () => {
    setSelectedPanel(null);
    handleRefresh();
  };

  const isMenuDisabled = (name: string) => {
    const firstPanelWithType = history.find((ele) => !!ele?.selectedPanel);
    if (firstPanelWithType) {
      return !firstPanelWithType.selectedPanel.modelName.includes(name);
    }
    return false;
  };

  return (
    <div className={`${styles.sidebar} sm:w-1/4 md:w-1/5 lg:w-1/5 xl:w-1/5`}>
      <div className="flex justify-between bg-black p-2">
        <div onClick={handleDrawPolygon}>
          {drawingMode ? (
            <Tooltip title="cancel">
              <Cancel />
            </Tooltip>
          ) : (
            <Tooltip title="Draw Polygon">
              <PolylineIcon />
            </Tooltip>
          )}
        </div>
        <div onClick={handleUndo}>
          <Tooltip title="Undo">
            <UndoIcon fontSize="medium" />
          </Tooltip>
        </div>
        <div onClick={handleRedo}>
          <Tooltip title="Redo">
            <RedoIcon fontSize="medium" />
          </Tooltip>
        </div>
        {rectanglePlacementMode ? (
          <div onClick={handleConfirmPlacement}>
            <Tooltip title="Confirm Position">
              <CheckIcon fontSize="medium" />
            </Tooltip>
          </div>
        ) : (
          <div onClick={handleAddRectangle}>
            <Tooltip title="Add Panel">
              <AddIcon fontSize="medium" />
            </Tooltip>
          </div>
        )}

        <div onClick={handleRemoveRectangle}>
          <Tooltip title="Delete">
            <DeleteIcon fontSize="medium" />
          </Tooltip>
        </div>
        <div>
          <Tooltip title="Export Image" onClick={handleExportImage}>
            <SaveAltIcon fontSize="medium"/>
          </Tooltip>
        </div>
      </div>
      <div className=" bg-black py-4 mt-3">
        <div className="flex justify-between items-center px-2">
          <div>System size</div>
          <div>{`${systemSize.toFixed(0)} KW`} </div>
        </div>
        <div className="mt-3 mb-3 border border-gray-900" />
        <div className="flex justify-between items-center px-2">
          <div>No. of Modules</div>
          <div>{totalPanelsAdded || "-"}</div>
        </div>
        <div className="mt-3 mb-3 border border-gray-900" />
        <div className="flex justify-between items-center px-2">
          <div>Enery offset</div>
          <div>-</div>
        </div>
        <div className="mt-3 mb-3 border border-gray-900" />
        <div className="flex justify-between items-center  px-2">
          <div>Annual Generation</div>
          <div>{totalannualproduction.toFixed(1) || "-"}</div>
        </div>
        <div className="mt-3 mb-3 border border-gray-900" />
        <div className="flex items-center justify-center">
          <Button
            className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white"
            onClick={handleReset}
          >
            Refresh
          </Button>
        </div>
      </div>
      <div className="flex justify-between items-center bg-black mt-3 px-2">
        <div>Irradiance</div>
        <FormGroup>
          <FormControlLabel
            control={<IOSSwitch sx={{ m: 1 }} defaultChecked />}
            label={undefined}
          />
        </FormGroup>
      </div>
      <div className=" text-white mt-3">
        <Box sx={{ minWidth: 120 }}>
          <FormControl fullWidth>
            <InputLabel
              id="demo-simple-select-label"
              className="text-white border-none"
              sx={{
                "&&": {
                  color: "white",
                  "&.Mui-focused": {
                    color: "white",
                  },
                },
              }}
            >
              Select Panel
            </InputLabel>
            <Select
              sx={{
                boxShadow: "none",
                ".MuiOutlinedInput-notchedOutline": { border: 0 },
                "&.MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline":
                  {
                    border: 0,
                  },
                "&.MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
                  {
                    border: 0,
                  },
                ".MuiSvgIcon-root ": {
                  fill: "white !important",
                },
              }}
              className="text-white bg-black"
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              value={selectedPanel ? selectedPanel.modelName : ""}
              label="Add Panels"
            >
              {getAllPanel?.panels?.map(
                (panel, index: React.Key | null | undefined) => {
                  return (
                    <MenuItem
                      onClick={() => handlePanelSelect(panel?.modelName)}
                      disabled={isMenuDisabled(panel?.modelName)}
                      key={index}
                      value={panel?.modelName}
                    >
                      {panel?.modelName}
                    </MenuItem>
                  );
                }
              )}
            </Select>
          </FormControl>
        </Box>
      </div>
    </div>
  );
};

export default SideBar;
