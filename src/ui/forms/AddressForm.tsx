"use client";
import * as React from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import parse from "autosuggest-highlight/parse";
import { debounce } from "@mui/material/utils";
import { getGeoCode } from "@/app/actions/getGeoCode";
import { Button } from "@mui/material";
import { getSolarLayerData } from "@/app/actions/solarLayerData";
import CustomImage from "../image/CustomImage";
import { getGeoTiff } from "@/app/actions/getGeoTiff";
import { useImageContext } from "@/app/context/sidebarContext/ImageProvider";

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

function loadScript(src: string, position: HTMLElement | null, id: string) {
  if (!position) {
    return;
  }

  const script = document.createElement("script");
  script.setAttribute("async", "");
  script.setAttribute("id", id);
  script.src = src;
  position.appendChild(script);
}

const autocompleteService = { current: null };

interface MainTextMatchedSubstrings {
  offset: number;
  length: number;
}
interface StructuredFormatting {
  main_text: string;
  secondary_text: string;
  main_text_matched_substrings?: readonly MainTextMatchedSubstrings[];
}
interface PlaceType {
  description: string;
  structured_formatting: StructuredFormatting;
}

type Inputs = {
  address: string;
};

export default function AddressForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>();
  const { handleRefresh } = useImageContext();
  const [value, setValue] = React.useState<PlaceType | null>(null);
  const [inputValue, setInputValue] = React.useState("");
  const [options, setOptions] = React.useState<readonly PlaceType[]>([]);
  const loaded = React.useRef(false);
  const [serverResponse, setServerResponse] = React.useState<
    Buffer | undefined
  >(undefined);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  if (typeof window !== "undefined" && !loaded.current) {
    if (!document.querySelector("#google-maps")) {
      loadScript(
        `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`,
        document.querySelector("head"),
        "google-maps"
      );
    }

    loaded.current = true;
  }

  const fetch = React.useMemo(
    () =>
      debounce(
        (
          request: { input: string },
          callback: (results?: readonly PlaceType[]) => void
        ) => {
          (autocompleteService.current as any).getPlacePredictions(
            request,
            callback
          );
        },
        400
      ),
    []
  );

  React.useEffect(() => {
    let active = true;

    if (!autocompleteService.current && (window as any).google) {
      autocompleteService.current = new (
        window as any
      ).google.maps.places.AutocompleteService();
    }
    if (!autocompleteService.current) {
      return undefined;
    }

    if (inputValue === "") {
      setOptions(value ? [value] : []);
      return undefined;
    }

    fetch({ input: inputValue }, (results?: readonly PlaceType[]) => {
      if (active) {
        let newOptions: readonly PlaceType[] = [];

        if (value) {
          newOptions = [value];
        }

        if (results) {
          newOptions = [...newOptions, ...results];
        }

        setOptions(newOptions);
      }
    });

    return () => {
      active = false;
    };
  }, [value, inputValue, fetch]);

  const onSubmit: SubmitHandler<Inputs> = async () => {
    setIsSubmitting(true);
    try {
      if (value) {
        const formData = new FormData();
        formData.append("address", value.description);
        const response = await getGeoCode(formData);
        const latitude = response?.results[0]?.geometry?.location.lat;
        const longitude = response?.results[0]?.geometry.location.lng;

        if (latitude !== undefined && longitude !== undefined) {
          const solarResponse = await getSolarLayerData(latitude, longitude);

          if (typeof solarResponse === "string") {
            const geotiff = await getGeoTiff(
              solarResponse,
              process.env.GOOGLE_MAPS_API_KEY || ""
            );
            setServerResponse(geotiff);
          } else {
            console.error("Solar response is not a string:", solarResponse);
          }
        } else {
          console.error("Latitude or longitude is undefined");
        }
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  const debouncedSubmit = React.useMemo(
    () => debounce(handleSubmit(onSubmit), 100),
    [handleSubmit, onSubmit]
  );

  return (
    <>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="absolute top-9 right-8  z-20 max-[640px]:w-44 sm:w-1/4 md:w-1/5 lg:w-1/5 xl:w-1/5"
      >
        <Autocomplete
        className="w-full"
          key={value?.description}
          id="google-map-demo"
          getOptionLabel={(option) =>
            typeof option === "string" ? option : option.description
          }
          filterOptions={(x) => x}
          options={options}
          autoComplete
          includeInputInList
          filterSelectedOptions
          value={value}
          noOptionsText="No locations"
          onChange={(event: any, newValue: PlaceType | null) => {
            setOptions(newValue ? [newValue, ...options] : options);
            setValue(newValue);
            if (newValue) {
              handleRefresh();
            }
          }}
          onInputChange={(event, newInputValue) => {
            setInputValue(newInputValue);
            debouncedSubmit();
          }}
          renderInput={(params) => (
            <TextField
              className="text-white bg-black"
              {...params}
              {...register("address", {
                required: "address is required",
              })}
              sx={{
                input: {
                  color: "white",
                },
                "& fieldset": { border: "none" },
                ".MuiInputLabel-root": {
                  color: "white",
                },
                ".MuiSvgIcon-root ": {
                  fill: "white !important",
                },
                // width : '100%'
              }}
              InputLabelProps={{
                sx: {
                  color: "white",
                  "&.Mui-focused": {
                    color: "white",
                  },
                },
              }}
              name="address"
              label="Add a location"
              fullWidth
              error={!!errors.address}
              helperText={errors.address ? errors.address.message : ""}
            />
          )}
          renderOption={(props, option) => {
            const matches =
              option.structured_formatting.main_text_matched_substrings || [];

            const parts = parse(
              option.structured_formatting.main_text,
              matches.map((match: any) => [
                match.offset,
                match.offset + match.length,
              ])
            );
            return (
              <li   {...props}>
                <Grid container alignItems="center">
                  <Grid item sx={{ display: "flex", width: 44 }}>
                    <LocationOnIcon sx={{ color: "text.secondary" }} />
                  </Grid>
                  <Grid
                    item
                    sx={{ width: "calc(100% - 44px)", wordWrap: "break-word" }}
                  >
                    {parts.map((part, index: React.Key | null | undefined) => (
                      <Box
                        key={index}
                        component="span"
                        sx={{ fontWeight: part.highlight ? "bold" : "regular" }}
                      >
                        {part.text}
                      </Box>
                    ))}
                    <Typography variant="body2" color="text.secondary">
                      {option.structured_formatting.secondary_text}
                    </Typography>
                  </Grid>
                </Grid>
              </li>
            );
          }}
        />
      </form>
      <CustomImage serverResponse={serverResponse} loader={isSubmitting} />
    </>
  );
}
