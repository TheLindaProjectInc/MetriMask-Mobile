import React, { useState } from "react";
import { Text, View } from "react-native";
import { Switch } from "react-native-paper";
import DropDownPicker, { ItemType } from 'react-native-dropdown-picker';

import { MC } from "../mc";
import { nim } from "../NetInfo";
import { useCommonStyles, dropDownPickerThemeProps, TitleBar, Card, SimpleTextInput, SimpleButtonPair, InvalidMessage, ValidMessage } from "./common";
import { useTheme } from "./theme";



const EXPLORER_CHECK_TIMEOUT_MILLIS = 8000;

function checkExplorerReachable(baseUrl : string) : Promise<boolean>
    {
    return new Promise<boolean>((resolve : (reachable : boolean) => any) : void =>
        {
        let settled = false;
        const timeout = setTimeout(() : void =>
            {
            if (!settled) { settled = true; resolve(false); }
            }, EXPLORER_CHECK_TIMEOUT_MILLIS);
        fetch(`${ baseUrl }/api/info`).then((response : Response) : void =>
            {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);
            resolve(response.ok);
            })
        .catch(() : void =>
            {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);
            resolve(false);
            });
        });
    }



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
    const [ mainnetUrl, setMainnetUrl ] = useState<string>(nim().explorerBase("MainNet"));
    const [ testnetUrl, setTestnetUrl ] = useState<string>(nim().explorerBase("TestNet"));
    const [ explorerErrMsg, setExplorerErrMsg ] = useState<string>("");
    const [ explorerSavedMsg, setExplorerSavedMsg ] = useState<string>("");
    const [ checkingNetwork, setCheckingNetwork ] = useState<string>("");

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

    function isValidExplorerBaseUrl(url : string) : boolean
        {
        return /^https?:\/\/.+/i.test(url.trim());
        }

    function saveNetworkUrl(name : string, url : string) : void
        {
        const trimmed = url.trim().replace(/\/+$/, "");
        setExplorerSavedMsg("");
        if (!isValidExplorerBaseUrl(trimmed))
            {
            setExplorerErrMsg(`Enter a valid http(s) URL for ${ name }.`);
            return;
            }
        setExplorerErrMsg("");
        setCheckingNetwork(name);
        checkExplorerReachable(trimmed).then((reachable : boolean) : void =>
            {
            setCheckingNetwork("");
            if (!reachable)
                {
                setExplorerErrMsg(`Could not reach an Insight-compatible API at that ${ name } URL. Check the address and try again.`);
                return;
                }
            nim().applyOverride(name, trimmed);
            mc.storage.setExplorerOverrides({ ...mc.storage.explorerOverrides, [name]: trimmed });
            setExplorerSavedMsg(`${ name } explorer URL saved.`);
            setTimeout(() : void => setExplorerSavedMsg(""), 3000);
            });
        }

    function resetNetworkUrl(name : string) : void
        {
        setExplorerErrMsg("");
        setExplorerSavedMsg("");
        nim().resetOverride(name);
        const updated = { ...mc.storage.explorerOverrides };
        delete updated[name];
        mc.storage.setExplorerOverrides(updated);
        if (name === "MainNet") setMainnetUrl(nim().explorerBase("MainNet"));
        else                    setTestnetUrl(nim().explorerBase("TestNet"));
        }

    return (
        <View style={ commonStyles.containingView }>
            <TitleBar title="Settings" onBurgerPressed={ props.onBurgerPressed }/>
            <View style={ commonStyles.horizontalBar }/>
            <View style={ { height: 24 } }/>
            <View style={ commonStyles.squeezed }>
                <Card>
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
                </Card>
                <View style={ { height: 24 } }/>
                <Card>
                    <Text style={{ color: theme.colors.black, fontWeight: "600" }}>Advanced: Custom Explorer Backend</Text>
                    <Text style={{ color: theme.colors.middleGrey, fontSize: 12 }}>
                        Point MainNet/TestNet at your own Insight-compatible explorer API instead of the official one.
                        Saving checks that the address is reachable first. Explorer links and name resolution apply
                        immediately; balance, transaction history, and sending take effect the next time you unlock
                        this account.
                    </Text>
                    <View style={ { height: 16 } }/>
                    <SimpleTextInput label="MainNet explorer base URL" value={ mainnetUrl } onChangeText={ setMainnetUrl }/>
                    <View style={ { height: 24 } }/>
                    <SimpleButtonPair
                        left={ { text: checkingNetwork === "MainNet" ? "Checking..." : "Save", variant: "primary", disabled: checkingNetwork === "MainNet", onPress: () => saveNetworkUrl("MainNet", mainnetUrl) } }
                        right={ { text: "Reset to default", variant: "secondary", disabled: checkingNetwork === "MainNet", onPress: () => resetNetworkUrl("MainNet") } }/>
                    <View style={ { height: 24 } }/>
                    <SimpleTextInput label="TestNet explorer base URL" value={ testnetUrl } onChangeText={ setTestnetUrl }/>
                    <View style={ { height: 24 } }/>
                    <SimpleButtonPair
                        left={ { text: checkingNetwork === "TestNet" ? "Checking..." : "Save", variant: "primary", disabled: checkingNetwork === "TestNet", onPress: () => saveNetworkUrl("TestNet", testnetUrl) } }
                        right={ { text: "Reset to default", variant: "secondary", disabled: checkingNetwork === "TestNet", onPress: () => resetNetworkUrl("TestNet") } }/>
                    { explorerErrMsg.length ? <InvalidMessage text={ explorerErrMsg }/> : null }
                    { explorerSavedMsg.length ? <ValidMessage text={ explorerSavedMsg }/> : null }
                </Card>
            </View>
        </View>
        );
    }
