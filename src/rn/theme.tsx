import React, { createContext, useContext, useState } from "react";

import { MC } from "../mc";



// Role names deliberately mirror the original COLOR_* constants (white == screen
// background/surface, black == primary text) so most call sites only need their
// import source changed, not every individual reference renamed.
export type ThemeColors =
    {
    white            : string;
    lightGrey        : string;
    middleGrey       : string;
    black            : string;
    darkPurple       : string;
    darkishPurple    : string;
    greenWash        : string;
    purpleRipple     : string;
    darkPurpleRipple : string;
    red              : string;
    redWash          : string;
    green            : string;
    dullGreen        : string;
    lightPurple      : string;
    lightishPurple   : string;
    };

export const LIGHT_COLORS : ThemeColors =
    {
    white:            "#FFFFFF",
    lightGrey:        "#E0E0E0",
    middleGrey:       "#808080",
    black:            "#000000",
    darkPurple:       "#600060",
    darkishPurple:    "#900090",
    greenWash:        "#E0FFE0",
    purpleRipple:     "#FFC0FF",
    darkPurpleRipple: "#D080D0",
    red:              "#FF0000",
    redWash:          "#FFE0E0",
    green:            "#00FF00",
    dullGreen:        "#30C030",
    lightPurple:      "#FFF0FF",
    lightishPurple:   "#FFE0FF",
    };

export const DARK_COLORS : ThemeColors =
    {
    white:            "#121212",
    lightGrey:        "#2C2C2C",
    middleGrey:       "#9E9E9E",
    black:            "#F0F0F0",
    darkPurple:       "#C060E0",
    darkishPurple:    "#C060E0",
    greenWash:        "#123312",
    purpleRipple:     "#4A2A55",
    darkPurpleRipple: "#5A3266",
    red:              "#FF6B6B",
    redWash:          "#3A1414",
    green:            "#00FF00",
    dullGreen:        "#30C030",
    lightPurple:      "#241226",
    lightishPurple:   "#2E1733",
    };



export type ThemeContextValue =
    {
    isDarkMode      : boolean;
    colors          : ThemeColors;
    setDarkMode     : (darkMode : boolean) => void;
    };

const ThemeContext = createContext<ThemeContextValue>(
    {
    isDarkMode:  false,
    colors:      LIGHT_COLORS,
    setDarkMode: () : void => { },
    });

export type ThemeProviderProps =
    {
    initialDarkMode : boolean;
    children        : React.ReactNode;
    };

export function ThemeProvider(props : ThemeProviderProps) : JSX.Element
    {
    const [ isDarkMode, setIsDarkMode ] = useState<boolean>(props.initialDarkMode);

    function setDarkMode(darkMode : boolean) : void
        {
        setIsDarkMode(darkMode);
        MC.getMC().storage.setDarkMode(darkMode).catch(MC.errorFunc(`ThemeProvider setDarkMode()`));
        }

    const value : ThemeContextValue = { isDarkMode, colors: isDarkMode ? DARK_COLORS : LIGHT_COLORS, setDarkMode };
    return (<ThemeContext.Provider value={ value }>{ props.children }</ThemeContext.Provider>);
    }

export function useThemeColors() : ThemeColors
    {
    return useContext(ThemeContext).colors;
    }

export function useTheme() : ThemeContextValue
    {
    return useContext(ThemeContext);
    }
