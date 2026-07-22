import "../../shimWrapper.js";

import React from "react";
import { Text, useWindowDimensions, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import QRCode from "react-native-qrcode-svg";
import Clipboard from '@react-native-clipboard/clipboard';

import { MC, MRX_DECIMALS } from "../mc";
import { WALLET_SCREENS } from "./WalletView";
import { useCommonStyles, DoubleDoublet, formatSatoshi, SimpleDoublet, TitleBar, SimpleButton, AddressQuasiDoublet, Card } from "./common";
import { useThemeColors } from "./theme";



export type ReceiveViewProps =
    {
    onBurgerPressed : () => any;
    };

export function ReceiveView(props : ReceiveViewProps) : JSX.Element
    {
    const colors = useThemeColors();
    const commonStyles = useCommonStyles();
    const walletNavigation = useNavigation<StackNavigationProp<any>>();
    const am = MC.getMC().storage.accountManager;
    const layout = useWindowDimensions();

    function qrSize() : number
        {
        let qrSize = layout.width/2;
        if (qrSize > layout.width - 192) qrSize = layout.width - 192;
        if (qrSize > 336) qrSize = 336;
        return qrSize;
        }

    function renderBalanceUSD() : JSX.Element | null
        {
        if (am.current.wm.balanceUSD)
            return (<Text style={{ color: colors.black }}>{ "$ " + am.current.wm.balanceUSD }</Text>);
        else
            return null;
        }

    return (
        <View style = { commonStyles.containingView }>
            <TitleBar title="Receive" onBurgerPressed={ props.onBurgerPressed }/>
            <View style={ commonStyles.horizontalBar }/>
            <View style={ commonStyles.squeezed }>
                <View style = {{ height: 24 }} />
                <Card>
                    <DoubleDoublet titleL="Account:" textL={ am.current.accountName } titleR="Network:" textR={ am.current.wm.ninfo.name } />
                    <View style={{ height: 7 }} />
                    <SimpleDoublet title="Account Balance:" text={ formatSatoshi(am.current.wm.balanceSat, MRX_DECIMALS) + " MRX" }/>
                    { renderBalanceUSD() }
                    <View style={{ height: 7 }} />
                    <AddressQuasiDoublet title="Account Address:" acnt={ am.current }/>
                </Card>
                <View style = {{ height: 20 }} />
                <SimpleButton onPress={ () : void => Clipboard.setString(am.current.wm.address) } text="Copy to Clipboard" icon="content-copy" variant="primary"/>
                <View style={{ height: 24 }} />
                <View style={ commonStyles.rowContainer }>
                    <View style={{ flex: 1 }}/>
                    { /* White backdrop is deliberate even in dark mode: the QR's black modules
                         would otherwise merge into a dark screen background and become
                         unscannable. */ }
                    <View style={{ backgroundColor: "#FFFFFF", padding: 16, borderRadius: 12 }}>
                        <QRCode value={ am.current.wm.address } size={ qrSize() }/>
                    </View>
                    <View style={{ flex: 1 }}/>
                </View>
                <View style={{ height: 32 }} />
                <SimpleButton onPress={ () : void => walletNavigation.navigate(WALLET_SCREENS.ACCOUNT_HOME) } text="Account Home"/>
            </View>
        </View>
        );
    }
