import React, { useState } from "react";
import { Text, View } from "react-native";
import { Switch } from "react-native-paper";
import DropDownPicker, { ItemType } from 'react-native-dropdown-picker';

import { MC } from "../mc";
import { useCommonStyles, dropDownPickerThemeProps, TitleBar } from "./common";
import { useTheme } from "./theme";



const INACTIVITY_TIMEOUTS_DD : ItemType<number>[] =
    [
    { label: "5 minutes",  value:  5 },
    { label: "10 minutes", value: 10 },
    { label: "15 minutes", value: 15 },
    { label: "20 minutes", value: 20 },
    { label: "30 minutes", value: 30 },
    { label: "45 minutes", value: 45 },
    { label: "60 minutes", value: 60 },
    ];

export type SettingsViewProps =
    {
    onBurgerPressed : () => any;
    };

export function SettingsView(props : SettingsViewProps) : JSX.Element
    {
    const mc : MC = MC.getMC();
    const commonStyles = useCommonStyles();
    const theme = useTheme();
    const [ timeoutDDOpen, setTimeoutDDOpen ] = useState<boolean>(false);
    const [ timeoutDDValue, setTimeoutDDValue ] = useState<number>(actualInactivityTimeoutDDValue());
    const [ timeoutDDItems, setTimeoutDDItems ] = useState<ItemType<number>[]>(INACTIVITY_TIMEOUTS_DD);

    function actualInactivityTimeoutDDValue() : number
        {
        return INACTIVITY_TIMEOUTS_DD[actualInactivityTimeoutDDIndex()].value as number;
        }

    function actualInactivityTimeoutDDIndex() : number
        {
        const currentTimeout : number = mc.getUserInactivityTimeoutMillis()/(1000*60);
        for (let i = 0; i < INACTIVITY_TIMEOUTS_DD.length; i++)
            if (currentTimeout <= INACTIVITY_TIMEOUTS_DD[i].value!) return i;
        return INACTIVITY_TIMEOUTS_DD.length - 1;
        }

    function onSelectTimeout(item : ItemType<number>) : void
        {
        mc.setUserInactivityTimeoutMillis(60*1000*(item.value as number));
        }

    return (
        <View style={ commonStyles.containingView }>
            <TitleBar title="Settings" onBurgerPressed={ props.onBurgerPressed }/>
            <View style={ commonStyles.horizontalBar }/>
            <View style={ { height: 24 } }/>
            <View style={ commonStyles.squeezed }>
                <Text style={{ color: theme.colors.middleGrey}}>Lock wallet after inactive for:</Text>
                <DropDownPicker
                    { ...(dropDownPickerThemeProps(theme.colors) as any) }
                    maxHeight={ 300 }
                    flatListProps={{ initialNumToRender: 10 }}
                    items={ timeoutDDItems }
                    open={ timeoutDDOpen }
                    value={ timeoutDDValue as number }
                    setOpen={ setTimeoutDDOpen }
                    setValue={ setTimeoutDDValue }
                    setItems={ setTimeoutDDItems }
                    onSelectItem={ onSelectTimeout }/>
                <View style={ { height: 24 } }/>
                <View style={ commonStyles.rowContainer }>
                    <Text style={{ color: theme.colors.black, alignSelf: "center" }}>Dark Mode</Text>
                    <View style={{ flex: 1 }}/>
                    <Switch value={ theme.isDarkMode } color={ theme.colors.darkPurple } onValueChange={ theme.setDarkMode }/>
                </View>
            </View>
        </View>
        );
    }
