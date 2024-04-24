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
import Select, { SelectChangeEvent } from "@mui/material/Select";
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

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


const SideBar = () => {
  const [age, setAge] = React.useState("");

  const handleChange = (event: SelectChangeEvent) => {
    setAge(event.target.value as string);
  };
  return (
    <div className={styles.sidebar}>

        <div className='flex justify-between bg-black p-2'>
        <UndoIcon fontSize="medium"/>
        <RedoIcon fontSize="medium"/>
        <AddIcon fontSize="medium"/>
        <DeleteIcon fontSize="medium"/>

        </div>
      <div className="w-[300px] bg-black py-4 mt-3">
        <div className="flex justify-around items-center gap-5">
          <div>System size</div>
          <div>10kw</div>
        </div>
        <div className="mt-3 mb-3 border border-gray-900" />
        <div className="flex justify-around items-center gap-5">
          <div>No. of Modules</div>
          <div>8</div>
        </div>
        <div className="mt-3 mb-3 border border-gray-900" />
        <div className="flex justify-around items-center gap-10">
          <div>Enery offset</div>
          <div>-</div>
        </div>
        <div className="mt-3 mb-3 border border-gray-900" />
        <div className="flex justify-around items-center gap-10">
          <div>Annual Generatio</div>
          <div>-</div>
        </div>
        <div className="mt-3 mb-3 border border-gray-900" />
        <div className="flex items-center justify-center">
          <Button className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white">
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
            "MuiSelect-outlined": {color: "white"}}}
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
                  '.MuiSvgIcon-root ': {
                    fill: "white !important",
                  },
              
              }}
              className="text-white bg-black"
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              value={age}
              label="Age"
              onChange={handleChange}

            >
              <MenuItem value={10}>Ten</MenuItem>
              <MenuItem value={20}>Twenty</MenuItem>
              <MenuItem value={30}>Thirty</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </div>
    </div>
  );
};

export default SideBar;
