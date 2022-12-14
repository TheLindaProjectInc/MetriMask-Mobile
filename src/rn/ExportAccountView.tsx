import React, { useRef, useState } from "react";
import { View, TextInput, NativeSyntheticEvent, TextInputEndEditingEventData, Text } from "react-native";

import { MC, MRX_DECIMALS } from "../mc";
import { WALLET_SCREENS } from "./WalletView";
import { WorkFunctionResult } from "./MainView";
import { AddressQuasiDoublet, COLOR_BLACK, commonStyles, DoubleDoublet, formatSatoshi, InvalidMessage, SimpleButton, SimpleDoublet, SimpleTextInput, TitleBar } from "./common";



type ExportAccountViewProps =
    {
    invalidPassword? : number;
    onBurgerPressed  : () => any;
    showWorking      : (workFunction : () => WorkFunctionResult) => void;
    };

let loadCount : number = 1;
let exportInProgress : boolean = false;

export function ExportAccountView(props : ExportAccountViewProps) : JSX.Element
    {
    const am = MC.getMC().storage.accountManager;

    const [ useSecureInput, setUseSecureInput ] = useState<boolean>(true);
    const [ password, setPassword ] = useState<string>("");
    const [ invalidPassword, setInvalidPassword ] = useState<boolean>(false);

    const securePasswordRef = useRef<TextInput>(null);
    const plainPasswordRef = useRef<TextInput>(null);

    if (props.invalidPassword == loadCount++ && !invalidPassword) setInvalidPassword(true);
    
    function exportAccount() : void
        {
        if (!exportInProgress)
            {
            exportInProgress = true;
            if (!password.length)
                setInvalidPassword(true);
            else
                {
                setInvalidPassword(false);
                props.showWorking(() : WorkFunctionResult =>
                    {
                    const passwordIsValid : boolean = am.validatePassword(password);
                    exportInProgress = false;
                    if (passwordIsValid)
                        return { nextScreen: WALLET_SCREENS.ACCOUNT_EXPORTED };
                    else
                        return { nextScreen: WALLET_SCREENS.EXPORT_ACCOUNT, nextScreenParams: { invalidPassword: loadCount } };
                    });
                }
            }
        }

    function onEndEditintgPassword(wvEvent : NativeSyntheticEvent<TextInputEndEditingEventData>) : void
        {
        exportAccount();
        }

    function onBurgerPressed() : void
        {
        clearInvalidPassword();
        props.onBurgerPressed();
        }

    function clearInvalidPassword() : void
        {
        if (invalidPassword) setInvalidPassword(false);
        }

    function renderPasswordInput() : JSX.Element
        {
        function setSecure(secureInput : boolean) : void
            {
            securePasswordRef.current?.clear();
            plainPasswordRef.current?.clear();
            setPassword("");
            setUseSecureInput(secureInput);
            clearInvalidPassword();
            }

        function setPasswordAndClearInvalid(txt : string) : void
            {
            setPassword(txt);
            clearInvalidPassword();
            }

        if (useSecureInput)
            {
            return (
                <SimpleTextInput
                    label="Password"
                    value={ password }
                    onFocus={ clearInvalidPassword }
                    onChangeText={ setPasswordAndClearInvalid }
                    onEndEditing={ onEndEditintgPassword }
                    rnRef={ securePasswordRef }
                    icon="eye"
                    onPressIcon={ () : void => setSecure(false) }
                    secureTextEntry/>
                );
            }
        else
            {
            return (
                <SimpleTextInput
                    label="Password"
                    value={ password }
                    onFocus={ clearInvalidPassword }
                    onChangeText={ setPasswordAndClearInvalid }
                    onEndEditing={ onEndEditintgPassword }
                    rnRef={ plainPasswordRef }
                    icon="eye-off"
                    onPressIcon={ () : void => setSecure(true) }/>
                );
            }
        }

    function renderInvalidPassword() : JSX.Element | null
        {
        if (invalidPassword)
            {
            return (
                <>
                    <View style={ { height: 72 } } />
                    <InvalidMessage text="Invalid Password." />
                </>
                );
            }
        else
            return null;
        }

    return (
        <View style={ commonStyles.containingView }>
            <TitleBar title="Export Account WIF" onBurgerPressed={ onBurgerPressed }/>
            <View style={ commonStyles.horizontalBar }/>
            <View style={ commonStyles.squeezed }>
                <View style={{ height: 24 }} />
                <DoubleDoublet titleL="Account:" textL={ am.current.accountName } titleR="Network:" textR={ am.current.wm.ninfo.name } />
                <View style={{ height: 7 }} />
                <AddressQuasiDoublet title="Address:" acnt={ am.current }/>
                <View style={{ height: 7 }} />
                <SimpleDoublet title="Balance:" text={ formatSatoshi(am.current.wm.balanceSat, MRX_DECIMALS) + " MRX" }/>
                <View style={{ height: 24 }} />
                <Text style={{ color: COLOR_BLACK }}>To export the account in Wallet Interchange Format (WIF) enter the password below.</Text>
                <View style={{ height: 24 }}/>
                { renderPasswordInput() }
                <View style={{ height: 24 }}/>
                <SimpleButton text="Export Account" onPress={ exportAccount }/>
                { renderInvalidPassword() }
            </View>
        </View>
        );
    }
